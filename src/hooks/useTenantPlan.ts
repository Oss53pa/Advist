/**
 * useTenantPlan — Hook centralise pour acceder au plan du tenant
 *
 * Expose une interface stable conforme a la spec commerciale :
 *   - plan.slug : "advist_business" | "advist_entreprise"
 *   - plan.features_included : string[]
 *   - plan.max_users : number | null
 *   - plan.max_documents_per_month : number | null
 *
 * S'appuie sur le tenantStore (Zustand) en interne.
 */
import { useMemo } from 'react';
import { useTenantStore } from '../stores/tenantStore';
import { PLAN_FEATURES, type PlanFeature } from '../config/planFeatures';

export type PlanSlug = 'advist_business' | 'advist_entreprise';

export interface TenantPlan {
  slug: PlanSlug;
  isBusiness: boolean;
  isEnterprise: boolean;
  features_included: string[];
  max_users: number | null;
  max_documents_per_month: number | null;
  current_users: number;
  current_documents_this_month: number;
  displayName: string;
}

const PLAN_DISPLAY: Record<PlanSlug, string> = {
  advist_business: 'Business',
  advist_entreprise: 'Entreprise',
};

/**
 * Hook principal — retourne le plan du tenant courant au format spec
 */
export function useTenantPlan(): TenantPlan {
  const { currentTenant } = useTenantStore();

  return useMemo(() => {
    const rawPlan = currentTenant?.plan || 'business';
    const slug: PlanSlug = rawPlan === 'enterprise' ? 'advist_entreprise' : 'advist_business';
    const isBusiness = slug === 'advist_business';
    const isEnterprise = slug === 'advist_entreprise';

    // Build features_included from PLAN_FEATURES config (source of truth)
    const planKey = isEnterprise ? 'enterprise' : 'business';
    const planFeatures = PLAN_FEATURES[planKey];
    const features_included = Object.entries(planFeatures)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key);

    // Quotas from tenant store (with Business defaults if missing)
    const quotas = currentTenant?.quotas;
    const max_users = isEnterprise ? null : (quotas?.maxUsers ?? 5);
    const max_documents_per_month = isEnterprise ? null : (quotas?.maxDocuments ?? 50);

    return {
      slug,
      isBusiness,
      isEnterprise,
      features_included,
      max_users: max_users === -1 ? null : max_users,
      max_documents_per_month: max_documents_per_month === -1 ? null : max_documents_per_month,
      current_users: quotas?.currentUsers ?? 0,
      current_documents_this_month: quotas?.currentDocuments ?? 0,
      displayName: PLAN_DISPLAY[slug],
    };
  }, [currentTenant]);
}

/**
 * Verifie si une feature est incluse dans le plan courant
 */
export function useHasFeature(feature: PlanFeature): boolean {
  const plan = useTenantPlan();
  return plan.features_included.includes(feature);
}

/**
 * Verifie la limite de documents du mois
 */
export function useDocumentQuota() {
  const plan = useTenantPlan();
  const max = plan.max_documents_per_month;
  const current = plan.current_documents_this_month;

  if (max === null) {
    // Unlimited (Enterprise)
    return {
      max: null,
      current,
      remaining: null,
      percentage: 0,
      limitReached: false,
      isUnlimited: true,
    };
  }

  const remaining = Math.max(0, max - current);
  const percentage = Math.min(100, Math.round((current / max) * 100));

  return {
    max,
    current,
    remaining,
    percentage,
    limitReached: current >= max,
    isUnlimited: false,
  };
}

/**
 * Verifie la limite d'utilisateurs
 */
export function useUserQuota() {
  const plan = useTenantPlan();
  const max = plan.max_users;
  const current = plan.current_users;

  if (max === null) {
    return {
      max: null,
      current,
      remaining: null,
      percentage: 0,
      limitReached: false,
      isUnlimited: true,
    };
  }

  const remaining = Math.max(0, max - current);
  const percentage = Math.min(100, Math.round((current / max) * 100));

  return {
    max,
    current,
    remaining,
    percentage,
    limitReached: current >= max,
    isUnlimited: false,
  };
}

export default useTenantPlan;
