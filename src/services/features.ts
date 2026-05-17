/**
 * Features & Subscription Service — reads subscription/licence state from
 * Atlas Studio's canonical tables (`licence_seats`, `licences`, `subscriptions`,
 * `plans`, `products`). Advist is consumed as one of several Atlas Studio apps;
 * there is no Advist-local trial or subscription mechanism — Atlas Studio is
 * the source of truth.
 *
 * Access is granted iff the current user has a `licence_seats` row with
 * `status='active'` whose licence points at the Advist `products` row
 * (`products.slug='advist'`). A user with seats only for other Atlas Studio
 * apps (Atlas F&A, Cockpit, TableSmart, etc.) will NOT have access to Advist.
 */
import { supabase } from '../lib/supabase';

/**
 * Atlas Studio product slug for this app instance. Used to scope licence
 * lookups so a user with seats only for sibling apps is correctly blocked.
 */
const ATLAS_PRODUCT_SLUG = 'advist';

export class NoActiveLicenceError extends Error {
  constructor(message = 'No active licence for the current user') {
    super(message);
    this.name = 'NoActiveLicenceError';
  }
}

export interface SubscriptionInfo {
  id: string;
  tenantId: string;
  plan: string;
  status: string;
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  features: Record<string, boolean>;
  quotas: Record<string, number>;
  limits: Record<string, number>;
}

export interface FeatureCheckResponse {
  feature: string;
  enabled: boolean;
  reason?: string;
  requiredPlan?: string;
}

export interface QuotaCheckResponse {
  quotaKey: string;
  current: number;
  max: number;
  percentage: number;
  allowed: boolean;
  isUnlimited: boolean;
}

export interface UsageStats {
  documents: { current: number; max: number; percentage: number };
  users: { current: number; max: number; percentage: number };
  storage: { current: number; max: number; percentage: number };
  signatures: { current: number; max: number; percentage: number };
  workflows: { current: number; max: number; percentage: number };
}

const cache = new Map<string, { data: SubscriptionInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function getCurrentUserId(): Promise<string> {
  // Use getSession() instead of getUser() to avoid network call + lock contention
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

// Normalize Atlas Studio plan names (e.g. "Entreprise", "Business", "Group",
// "Premium") to the strict tenantStore PlanType ('business' | 'enterprise').
// Anything mentioning enterprise/entreprise/premium is treated as enterprise;
// everything else falls back to business. This MUST stay in sync with the
// PlanType union in src/stores/tenantStore.ts — passing any other string
// breaks code that indexes into PLAN_FEATURES/PLAN_QUOTAS by plan.
function normalizePlan(planName: string | null | undefined): 'business' | 'enterprise' {
  if (!planName) return 'business';
  const lc = planName.toLowerCase();
  if (lc.includes('entreprise') || lc.includes('enterprise') || lc.includes('premium')) {
    return 'enterprise';
  }
  return 'business';
}

// Map Atlas Studio subscription status to the internal status vocabulary
// used by tenantStore (`trial` | `active` | `expired` | `suspended` | `cancelled`).
function mapAtlasStatus(licenceStatus: string | null, subStatus: string | null): string {
  if (licenceStatus === 'revoked') return 'cancelled';
  if (licenceStatus === 'suspended') return 'suspended';
  if (subStatus === 'trialing') return 'trial';
  if (subStatus === 'active') return 'active';
  if (subStatus === 'past_due') return 'expired';
  if (subStatus === 'cancelled' || subStatus === 'canceled') return 'cancelled';
  if (subStatus === 'expired') return 'expired';
  if (licenceStatus === 'active') return 'active';
  if (licenceStatus === 'pending') return 'trial';
  return 'active';
}

export const getSubscriptionInfo = async (force = false): Promise<SubscriptionInfo> => {
  const userId = await getCurrentUserId();
  const key = `sub_${userId}`;
  if (!force) {
    const c = cache.get(key);
    if (c && Date.now() - c.timestamp < CACHE_TTL) return c.data;
  }

  // 1. Resolve this app's product UUID from Atlas Studio's `products` table.
  //    Identifying by slug (not UUID) keeps the code stable across environments.
  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id')
    .eq('slug', ATLAS_PRODUCT_SLUG)
    .maybeSingle();

  if (productErr) throw productErr;
  if (!product?.id) {
    throw new NoActiveLicenceError(
      `Atlas Studio product '${ATLAS_PRODUCT_SLUG}' is not registered`
    );
  }
  const productId = product.id as string;

  // 2. Find the user's active seat *for this app specifically*. A user may
  //    have seats for several Atlas Studio apps — we only care about Advist.
  //    Pattern adapted from src/pages/settings/TeamSettingsPage.tsx, with an
  //    inner join on `licences` to filter by product.
  const { data: seat, error: seatErr } = await supabase
    .from('licence_seats')
    .select(
      `licence_id, tenant_id, role, status,
       licences!inner (
         id, status, max_seats, used_seats, expires_at, activated_at,
         plan_id, subscription_id, product_id
       )`
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('licences.product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (seatErr) throw seatErr;
  if (!seat) throw new NoActiveLicenceError();

  // PostgREST embeds the joined row as `licences` on the seat. Normalize.
  type LicenceRow = {
    id: string;
    status: string | null;
    max_seats: number | null;
    used_seats: number | null;
    expires_at: string | null;
    activated_at: string | null;
    plan_id: string | null;
    subscription_id: string | null;
    product_id: string | null;
  };
  // Depending on the relationship cardinality PostgREST may return the embed
  // as a single object or a one-element array. Accept both.
  const licencesEmbed = (seat as { licences: LicenceRow | LicenceRow[] | null }).licences;
  const licence: LicenceRow | null = Array.isArray(licencesEmbed)
    ? (licencesEmbed[0] ?? null)
    : licencesEmbed;
  if (!licence) throw new NoActiveLicenceError('Licence not found for the active seat');

  const [planRes, subRes] = await Promise.all([
    licence.plan_id
      ? supabase
          .from('plans')
          .select('id, name, display_name, features, max_seats, storage_gb, api_calls_monthly')
          .eq('id', licence.plan_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    licence.subscription_id
      ? supabase
          .from('subscriptions')
          .select(
            'id, status, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, seats_limit, seats_used'
          )
          .eq('id', licence.subscription_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (planRes.error) throw planRes.error;
  if (subRes.error) throw subRes.error;

  const plan = (planRes.data ?? {}) as Record<string, unknown>;
  const sub = (subRes.data ?? {}) as Record<string, unknown>;

  // `plans.features` is a JSONB array of feature slugs on Atlas Studio. We
  // expose it as a `{ slug: true }` map so consumers can keep their boolean
  // lookups.
  const planFeaturesArr = Array.isArray(plan.features) ? (plan.features as string[]) : [];
  const features = planFeaturesArr.reduce<Record<string, boolean>>((acc, slug) => {
    if (typeof slug === 'string') acc[slug] = true;
    return acc;
  }, {});

  const maxSeats =
    (sub.seats_limit as number | null) ??
    licence.max_seats ??
    (plan.max_seats as number | null) ??
    0;
  const usedSeats = (sub.seats_used as number | null) ?? licence.used_seats ?? 0;
  const storageGbLimit = (plan.storage_gb as number | null) ?? 0;

  const status = mapAtlasStatus(licence.status, sub.status as string | null);

  const info: SubscriptionInfo = {
    id: (sub.id as string) ?? licence.id,
    tenantId: (seat as { tenant_id: string }).tenant_id,
    plan: normalizePlan(plan.name as string | null | undefined),
    status,
    trialEndsAt: (sub.trial_ends_at as string) ?? undefined,
    currentPeriodStart: (sub.current_period_start as string) ?? '',
    currentPeriodEnd: (sub.current_period_end as string) ?? licence.expires_at ?? '',
    autoRenew: (sub.cancel_at_period_end as boolean) === false,
    features,
    limits: {
      maxUsers: maxSeats,
      maxStorage: storageGbLimit * 1024,
    },
    // Atlas Studio doesn't track Advist-specific document/workflow usage in
    // these tables, so we expose the dimensions it does know (seats, storage)
    // and leave the rest unlimited (-1).
    quotas: {
      maxUsers: maxSeats > 0 ? maxSeats : -1,
      currentUsers: usedSeats,
      maxStorage: storageGbLimit > 0 ? storageGbLimit : -1,
      currentStorage: 0,
      maxDocuments: -1,
      currentDocuments: 0,
      maxWorkflows: -1,
      currentWorkflows: 0,
      maxSignaturesMonth: -1,
      currentSignaturesMonth: 0,
    },
  };

  cache.set(key, { data: info, timestamp: Date.now() });
  return info;
};

export const checkFeature = async (featureKey: string): Promise<FeatureCheckResponse> => {
  const sub = await getSubscriptionInfo();
  const enabled = sub.features[featureKey] === true;
  return { feature: featureKey, enabled, reason: enabled ? undefined : 'plan_restriction' };
};

export const checkFeatures = async (
  keys: string[]
): Promise<Record<string, FeatureCheckResponse>> => {
  const sub = await getSubscriptionInfo();
  const result: Record<string, FeatureCheckResponse> = {};
  for (const k of keys) result[k] = { feature: k, enabled: sub.features[k] === true };
  return result;
};

export const checkQuota = async (quotaKey: string): Promise<QuotaCheckResponse> => {
  const sub = await getSubscriptionInfo();
  const currentKey = `current${quotaKey.charAt(0).toUpperCase()}${quotaKey.slice(1)}`;
  const maxKey = `max${quotaKey.charAt(0).toUpperCase()}${quotaKey.slice(1)}`;
  const current = sub.quotas[currentKey] ?? 0;
  const max = sub.quotas[maxKey] ?? 0;
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : max > 0 ? Math.round((current / max) * 100) : 100;
  return { quotaKey, current, max, percentage, allowed: isUnlimited || current < max, isUnlimited };
};

export const getUsageStats = async (): Promise<UsageStats> => {
  const sub = await getSubscriptionInfo();
  const q = sub.quotas;
  const pct = (c: number, m: number) => (m > 0 ? Math.round((c / m) * 100) : 0);
  return {
    documents: {
      current: q.currentDocuments ?? 0,
      max: q.maxDocuments ?? 0,
      percentage: pct(q.currentDocuments ?? 0, q.maxDocuments ?? 1),
    },
    users: {
      current: q.currentUsers ?? 0,
      max: q.maxUsers ?? 0,
      percentage: pct(q.currentUsers ?? 0, q.maxUsers ?? 1),
    },
    storage: {
      current: q.currentStorage ?? 0,
      max: q.maxStorage ?? 0,
      percentage: pct(q.currentStorage ?? 0, q.maxStorage ?? 1),
    },
    signatures: {
      current: q.currentSignaturesMonth ?? 0,
      max: q.maxSignaturesMonth ?? 0,
      percentage: pct(q.currentSignaturesMonth ?? 0, q.maxSignaturesMonth ?? 1),
    },
    workflows: {
      current: q.currentWorkflows ?? 0,
      max: q.maxWorkflows ?? 0,
      percentage: pct(q.currentWorkflows ?? 0, q.maxWorkflows ?? 1),
    },
  };
};

export const incrementUsage = async (quotaKey: string): Promise<QuotaCheckResponse> => {
  cache.clear();
  return checkQuota(quotaKey);
};

export const validateAction = async (
  action: string
): Promise<{ allowed: boolean; reason?: string; blockedBy?: string }> => {
  const featureMap: Record<string, string> = {
    create_document: 'documentVersioning',
    create_workflow: 'workflowBuilder',
    request_signature: 'electronicSignature',
  };
  const quotaMap: Record<string, string> = {
    create_document: 'documents',
    create_workflow: 'workflows',
    request_signature: 'signaturesMonth',
    add_user: 'users',
  };
  if (featureMap[action]) {
    const c = await checkFeature(featureMap[action]);
    if (!c.enabled)
      return { allowed: false, reason: 'Feature not available', blockedBy: 'feature' };
  }
  if (quotaMap[action]) {
    const c = await checkQuota(quotaMap[action]);
    if (!c.allowed) return { allowed: false, reason: 'Quota reached', blockedBy: 'quota' };
  }
  return { allowed: true };
};

export const clearCache = (): void => {
  cache.clear();
};

export const subscribeToUpdates = (onUpdate: (sub: SubscriptionInfo) => void): (() => void) => {
  const channel = supabase.channel('licence-updates');
  // Listen for changes on licences table. On any change, flush the cache
  // and re-fetch so the UI picks up plan/status updates from Atlas Studio.
  getCurrentUserId()
    .then(() => {
      channel
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'licences',
          },
          async () => {
            cache.clear();
            try {
              onUpdate(await getSubscriptionInfo(true));
            } catch {
              /* ignore */
            }
          }
        )
        .subscribe();
    })
    .catch(() => {
      /* not authenticated — skip realtime subscription */
    });
  return () => {
    supabase.removeChannel(channel);
  };
};

export default {
  getSubscriptionInfo,
  checkFeature,
  checkFeatures,
  checkQuota,
  getUsageStats,
  incrementUsage,
  validateAction,
  subscribeToUpdates,
};
