/**
 * UpgradeGate - Composant pour bloquer l'accès visuel aux fonctionnalités Enterprise-only
 *
 * Affiche un overlay verrouillé avec lien d'upgrade quand la fonctionnalité
 * n'est pas disponible dans le plan actuel.
 *
 * Performs a server-side check via the check-signature-quota Edge Function
 * to prevent client-side plan spoofing (P1-S007).
 */
import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { type PlanFeature } from '../../config/planFeatures';
import { supabase } from '../../lib/supabase';
import { useTenantStore } from '../../stores/tenantStore';
import { ATLAS_STUDIO_URLS } from '../../pages/AtlasStudioRedirect';

interface UpgradeGateProps {
  feature: PlanFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'overlay' | 'hide' | 'disable';
}

export const UpgradeGate: React.FC<UpgradeGateProps> = ({
  feature,
  children,
  fallback,
  mode = 'overlay',
}) => {
  const { allowed: clientAllowed, featureLabel } = useFeatureGate(feature);
  const { currentTenant } = useTenantStore();
  const [serverAllowed, setServerAllowed] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Server-side verification of feature access via Edge Function
  useEffect(() => {
    // If client-side says blocked, no need to check server
    if (!clientAllowed) {
      setServerAllowed(false);
      return;
    }

    const organizationId = currentTenant?.id;
    if (!organizationId) {
      setServerAllowed(clientAllowed);
      return;
    }

    let cancelled = false;
    setChecking(true);

    supabase.functions
      .invoke('check-signature-quota', {
        body: { organization_id: organizationId, feature },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // On network error, fall back to client-side check
          console.warn('Server-side feature check failed, using client gate:', error.message);
          setServerAllowed(clientAllowed);
        } else {
          setServerAllowed(data?.allowed ?? false);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientAllowed, currentTenant?.id, feature]);

  // While server check is in flight, show a loading state
  if (checking || serverAllowed === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const allowed = serverAllowed;

  if (allowed) return <>{children}</>;

  if (mode === 'hide') return null;

  if (fallback) return <>{fallback}</>;

  if (mode === 'disable') {
    return (
      <div className="relative opacity-40 pointer-events-none select-none">
        {children}
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            <Lock size={10} />
            <span>Entreprise</span>
          </div>
        </div>
      </div>
    );
  }

  // Mode overlay (défaut)
  return (
    <div className="relative">
      <div className="opacity-20 pointer-events-none select-none blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">{featureLabel}</p>
          <p className="text-sm text-gray-500 mb-4">Disponible dans le plan Entreprise</p>
          <a
            href={ATLAS_STUDIO_URLS.billing}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Passer a Entreprise
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default UpgradeGate;
