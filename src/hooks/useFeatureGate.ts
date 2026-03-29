/**
 * useFeatureGate - Hook pour vérifier l'accès à une fonctionnalité selon le plan
 *
 * Utilise la source de vérité PLAN_FEATURES pour le gating strict.
 */
import { useTenantStore } from '../stores/tenantStore';
import {
  PLAN_FEATURES,
  FEATURE_LABELS,
  type PlanFeature,
  type PlanId,
} from '../config/planFeatures';

export function useFeatureGate(feature: PlanFeature) {
  const { currentTenant } = useTenantStore();
  const planId = (currentTenant?.plan || 'business') as PlanId;
  const allowed = PLAN_FEATURES[planId]?.[feature] ?? false;

  return {
    allowed: !!allowed,
    upgrade: !allowed,
    planRequired: !allowed ? ('enterprise' as const) : null,
    featureLabel: FEATURE_LABELS[feature],
    currentPlan: planId,
  };
}

/**
 * Vérifie plusieurs features à la fois
 */
export function useMultiFeatureGate(features: PlanFeature[]) {
  const { currentTenant } = useTenantStore();
  const planId = (currentTenant?.plan || 'business') as PlanId;

  return features.map((feature) => ({
    feature,
    allowed: !!PLAN_FEATURES[planId]?.[feature],
    label: FEATURE_LABELS[feature],
  }));
}

export default useFeatureGate;
