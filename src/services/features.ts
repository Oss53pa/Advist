/**
 * Features & Subscription Service — Supabase direct queries
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

async function getOrgId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  if (!data?.organization_id) throw new Error('No organization');
  return data.organization_id;
}

export const getSubscriptionInfo = async (force = false): Promise<SubscriptionInfo> => {
  const orgId = await getOrgId();
  const key = `sub_${orgId}`;
  if (!force) {
    const c = cache.get(key);
    if (c && Date.now() - c.timestamp < CACHE_TTL) return c.data;
  }

  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('*, subscription_plans(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !sub) throw new Error('No subscription found');

  const plan = (sub as any).subscription_plans || {};
  const features = plan.features || {};
  const limits = plan.limits || {};

  const [usersRes, docsRes, wfRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('workflow_instances').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
  ]);

  const info: SubscriptionInfo = {
    id: sub.id, tenantId: orgId, plan: plan.slug || 'business', status: sub.status,
    trialEndsAt: sub.trial_end || undefined,
    currentPeriodStart: sub.current_period_start || '',
    currentPeriodEnd: sub.current_period_end || '',
    autoRenew: (sub.metadata as any)?.autoRenew !== false,
    features, limits,
    quotas: {
      maxUsers: limits.maxUsers || 10, currentUsers: usersRes.count || 0,
      maxDocuments: limits.maxDocuments || 10000, currentDocuments: docsRes.count || 0,
      maxWorkflows: limits.maxWorkflows || 5, currentWorkflows: wfRes.count || 0,
      maxStorage: limits.maxStorage || 5120, currentStorage: 0,
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

export const checkFeatures = async (keys: string[]): Promise<Record<string, FeatureCheckResponse>> => {
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
  const pct = (c: number, m: number) => m > 0 ? Math.round((c / m) * 100) : 0;
  return {
    documents: { current: q.currentDocuments ?? 0, max: q.maxDocuments ?? 0, percentage: pct(q.currentDocuments ?? 0, q.maxDocuments ?? 1) },
    users: { current: q.currentUsers ?? 0, max: q.maxUsers ?? 0, percentage: pct(q.currentUsers ?? 0, q.maxUsers ?? 1) },
    storage: { current: q.currentStorage ?? 0, max: q.maxStorage ?? 0, percentage: pct(q.currentStorage ?? 0, q.maxStorage ?? 1) },
    signatures: { current: q.currentSignaturesMonth ?? 0, max: q.maxSignaturesMonth ?? 0, percentage: pct(q.currentSignaturesMonth ?? 0, q.maxSignaturesMonth ?? 1) },
    workflows: { current: q.currentWorkflows ?? 0, max: q.maxWorkflows ?? 0, percentage: pct(q.currentWorkflows ?? 0, q.maxWorkflows ?? 1) },
  };
};

export const incrementUsage = async (quotaKey: string): Promise<QuotaCheckResponse> => {
  cache.clear();
  return checkQuota(quotaKey);
};

export const validateAction = async (action: string): Promise<{ allowed: boolean; reason?: string; blockedBy?: string }> => {
  const featureMap: Record<string, string> = { create_document: 'documentVersioning', create_workflow: 'workflowBuilder', request_signature: 'electronicSignature' };
  const quotaMap: Record<string, string> = { create_document: 'documents', create_workflow: 'workflows', request_signature: 'signaturesMonth', add_user: 'users' };
  if (featureMap[action]) { const c = await checkFeature(featureMap[action]); if (!c.enabled) return { allowed: false, reason: 'Feature not available', blockedBy: 'feature' }; }
  if (quotaMap[action]) { const c = await checkQuota(quotaMap[action]); if (!c.allowed) return { allowed: false, reason: 'Quota reached', blockedBy: 'quota' }; }
  return { allowed: true };
};

export const clearCache = (): void => {
  cache.clear();
};

export const subscribeToUpdates = (onUpdate: (sub: SubscriptionInfo) => void): (() => void) => {
  const channel = supabase.channel('subscription-updates');
  getOrgId().then((orgId) => {
    channel.on('postgres_changes' as any, { event: '*', schema: 'public', table: 'subscriptions', filter: `organization_id=eq.${orgId}` },
      async () => { cache.clear(); try { onUpdate(await getSubscriptionInfo(true)); } catch { /* ignore */ } }
    ).subscribe();
  });
  return () => { supabase.removeChannel(channel); };
};

export default { getSubscriptionInfo, checkFeature, checkFeatures, checkQuota, getUsageStats, incrementUsage, validateAction, subscribeToUpdates };
