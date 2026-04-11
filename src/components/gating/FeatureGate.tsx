/**
 * FeatureGate — Composant de gating déclaratif
 *
 * Cache ou remplace un contenu si la feature n'est pas incluse dans le plan courant.
 *
 * Usage:
 *   <FeatureGate feature="api_rest" fallback={<UpgradeBanner feature="api_rest" />}>
 *     <ApiKeysPage />
 *   </FeatureGate>
 *
 * Sans fallback, l'enfant est simplement masqué quand la feature n'est pas disponible.
 */
import React from 'react';
import { useHasFeature } from '../../hooks/useTenantPlan';
import { type PlanFeature } from '../../config/planFeatures';

interface FeatureGateProps {
  feature: PlanFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Si true, affiche toujours le contenu mais en mode disabled (pour toggles/boutons) */
  renderWhenLocked?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback = null,
  renderWhenLocked = false,
}) => {
  const allowed = useHasFeature(feature);

  if (allowed) return <>{children}</>;
  if (renderWhenLocked) return <>{children}</>;
  return <>{fallback}</>;
};

export default FeatureGate;
