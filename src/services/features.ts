/**
 * Features & Subscription Service.
 *
 * Source of truth (Atlas Studio Suite — confirmed schema):
 *   - Access:    licence_seats (must have an active row for this user)
 *   - Licence:   licences (joined via licence_seats.licence_id)
 *                Key columns: plan_id (FK → plans.id), status, expires_at,
 *                max_seats, used_seats
 *   - Plan:      plans (joined via licences.plan_id)
 *                Key columns: name, display_name, features (jsonb),
 *                price_monthly_fcfa, max_seats, storage_gb, api_calls_monthly
 *
 * Atlas Studio owns subscription/plan management. Advist only reads.
 * Usage counts (users, documents, workflows) are still computed against local
 * Advist tables since these are app-specific, not Atlas Studio concerns.
 */
import { supabase } from '../lib/supabase';

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

interface AtlasPlan {
  id?: string;
  name?: string;
  display_name?: string;
  features?: Record<string, boolean>;
  max_seats?: number;
  storage_gb?: number;
  api_calls_monthly?: number;
}

interface AtlasLicence {
  id?: string;
  status?: string;
  expires_at?: string;
  activated_at?: string;
  max_seats?: number;
  used_seats?: number;
  plan_id?: string;
  plans?: AtlasPlan | null;
}

interface SeatWithLicence {
  licence_id: string;
  tenant_id: string;
  licences: AtlasLicence | null;
}

/**
 * Resolve the user's active Atlas Studio seat and the linked licence + plan
 * for the Advist product specifically.
 *
 * The `licences!inner(products!inner(slug))` join forces a row only when the
 * licence is bound to Advist's product — this prevents leaking access from
 * another Atlas Studio Suite app the user might have a seat in.
 */
async function getActiveSeat(): Promise<SeatWithLicence | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('licence_seats')
    .select('licence_id, tenant_id, licences!inner(*, plans(*), products!inner(slug))')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .eq('licences.products.slug', 'advist')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as SeatWithLicence;
}

async function getOrgIdFromProfile(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  return (data?.organization_id as string | undefined) ?? null;
}

export const getSubscriptionInfo = async (force = false): Promise<SubscriptionInfo> => {
  const seat = await getActiveSeat();
  if (!seat) throw new Error('No active licence — provision a seat in Atlas Studio');

  const cacheKey = `sub_${seat.licence_id}`;
  if (!force) {
    const c = cache.get(cacheKey);
    if (c && Date.now() - c.timestamp < CACHE_TTL) return c.data;
  }

  const licence = seat.licences ?? {};
  const plan = licence.plans ?? {};

  const planSlug = plan.name || plan.display_name || 'business';
  const status = licence.status || 'active';
  const currentPeriodStart = licence.activated_at || '';
  const currentPeriodEnd = licence.expires_at || '';
  // Atlas Studio plans.features may be either a jsonb array of enabled
  // feature codes (['qualified_signature', 'ohada']) or a jsonb object
  // ({qualifiedSignature: true}). Normalize to an object map.
  const rawFeatures = plan.features;
  const features: Record<string, boolean> = Array.isArray(rawFeatures)
    ? Object.fromEntries((rawFeatures as string[]).map((k) => [k, true]))
    : ((rawFeatures ?? {}) as Record<string, boolean>);
  // Limits derived from Atlas Studio plan columns + licence seat caps.
  const limits: Record<string, number> = {
    maxUsers: licence.max_seats ?? plan.max_seats ?? 10,
    maxStorage: plan.storage_gb ? plan.storage_gb * 1024 : 5120,
    maxApiCalls: plan.api_calls_monthly ?? 0,
  };

  // Local usage counts (Advist-side aggregations)
  const orgId = await getOrgIdFromProfile();
  const [usersRes, docsRes, wfRes] = orgId
    ? await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('is_active', true),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('workflow_instances')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'active'),
      ])
    : [
        { count: 0 } as { count: number | null },
        { count: 0 } as { count: number | null },
        { count: 0 } as { count: number | null },
      ];

  const info: SubscriptionInfo = {
    id: seat.licence_id,
    tenantId: seat.tenant_id,
    plan: planSlug,
    status,
    // Trial info lives on Atlas Studio's subscriptions table, not licences.
    // Querying it would require a separate JOIN; left undefined for now.
    trialEndsAt: undefined,
    currentPeriodStart,
    currentPeriodEnd,
    autoRenew: true,
    features,
    limits,
    quotas: {
      maxUsers: limits.maxUsers || 10,
      currentUsers: usersRes.count || 0,
      maxDocuments: limits.maxDocuments || 10000,
      currentDocuments: docsRes.count || 0,
      maxWorkflows: limits.maxWorkflows || 5,
      currentWorkflows: wfRes.count || 0,
      maxStorage: limits.maxStorage || 5120,
      currentStorage: 0,
    },
  };

  cache.set(cacheKey, { data: info, timestamp: Date.now() });
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
  return {
    quotaKey,
    current,
    max,
    percentage,
    allowed: isUnlimited || current < max,
    isUnlimited,
  };
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
  // Realtime subscription on Atlas Studio's licences table — flushes the cache
  // so the next read picks up plan/status changes.
  const channel = supabase.channel('licence-updates');
  getActiveSeat().then((seat) => {
    if (!seat) return;
    channel
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'licences',
          filter: `id=eq.${seat.licence_id}`,
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
