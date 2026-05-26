/**
 * FeatureGuard - Composant pour gérer l'accès aux fonctionnalités selon le plan
 * Utilise les couleurs centralisées de usePlanTheme
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useTenantStore, PlanType, TenantFeatures, getPlanInfo } from '../../stores/tenantStore';
import { getPlanTheme, getPlanIcon } from '../../hooks/usePlanTheme';
import { supabase } from '../../lib/supabase';
import { ATLAS_STUDIO_URLS } from '../../pages/AtlasStudioRedirect';

// Ré-exporter pour compatibilité
export { PLAN_THEME as PLAN_COLORS, PLAN_ICONS } from '../../hooks/usePlanTheme';

// Mapping des fonctionnalités vers le plan minimum requis
// Aligné sur la spécification commerciale
const FEATURE_MIN_PLAN: Record<keyof TenantFeatures, PlanType> = {
  // Documents
  documentVersioning: 'business',
  documentAnnotations: 'business',
  documentComparison: 'business',
  trackChanges: 'business',
  bulkImport: 'business',
  cloudIntegration: 'business',
  documentTemplates: 'enterprise', // Templates de workflow = Enterprise
  ocrRecognition: 'business',

  // Workflows
  basicWorkflows: 'business',
  advancedWorkflows: 'business',
  conditionalRules: 'enterprise', // Circuits conditionnels = Enterprise
  parallelSignatures: 'business',
  workflowTemplates: 'enterprise', // Templates de workflow = Enterprise
  workflowAnalytics: 'enterprise', // Tableau de bord analytique = Enterprise

  // Signatures
  simpleSignature: 'business',
  advancedSignature: 'enterprise', // eIDAS = Enterprise
  qualifiedSignature: 'enterprise', // Horodatage qualifié = Enterprise
  ohadaCompliance: 'enterprise', // Conformité OHADA = Enterprise
  signatureCertificates: 'enterprise', // Certificats = Enterprise
  biometricSignature: 'enterprise',

  // Sécurité
  ssoEnabled: 'enterprise', // SSO/SAML = Enterprise
  twoFactorAuth: 'business',
  ipRestriction: 'enterprise',
  auditLogs: 'business',
  advancedAuditLogs: 'enterprise',
  dataExport: 'business',
  dataEncryption: 'business',

  // Intégrations
  apiAccess: 'enterprise', // API REST = Enterprise
  webhooks: 'enterprise',
  zapierIntegration: 'enterprise',
  customIntegrations: 'enterprise',

  // External system integrations
  advancedCloudSync: 'enterprise',
  erpIntegration: 'enterprise',
  crmIntegration: 'enterprise',
  workflowTriggers: 'enterprise',
  contractGeneration: 'enterprise',

  // Projets
  basicProjects: 'business',
  advancedProjects: 'enterprise',
  projectAnalytics: 'enterprise',

  // Rapports
  basicReports: 'business',
  advancedReports: 'enterprise',
  reportsExport: 'business',

  // Autres
  offlineMode: 'enterprise',
  customBranding: 'enterprise',
  whiteLabel: 'enterprise',
  prioritySupport: 'enterprise', // Support prioritaire = Enterprise
  dedicatedManager: 'enterprise',
  customReports: 'enterprise',
  aiAssistant: 'enterprise',
};

// Labels des fonctionnalités en français
export const FEATURE_LABELS: Record<keyof TenantFeatures, string> = {
  documentVersioning: 'Versioning documents',
  documentAnnotations: 'Annotations',
  documentComparison: 'Comparaison de documents',
  trackChanges: 'Suivi des modifications',
  bulkImport: 'Import en masse',
  cloudIntegration: 'Intégration Cloud',
  documentTemplates: 'Templates documents',
  ocrRecognition: 'Reconnaissance OCR',
  basicWorkflows: 'Workflows basiques',
  advancedWorkflows: 'Workflows avancés',
  conditionalRules: 'Règles conditionnelles',
  parallelSignatures: 'Signatures parallèles',
  workflowTemplates: 'Templates workflows',
  workflowAnalytics: 'Analytics workflows',
  simpleSignature: 'Signature simple',
  advancedSignature: 'Signature avancée',
  qualifiedSignature: 'Signature qualifiée',
  ohadaCompliance: 'Conformité OHADA',
  signatureCertificates: 'Certificats de signature',
  biometricSignature: 'Signature biométrique',
  ssoEnabled: 'SSO / SAML',
  twoFactorAuth: 'Authentification 2FA',
  ipRestriction: 'Restriction IP',
  auditLogs: "Logs d'audit",
  advancedAuditLogs: 'Audit avancé',
  dataExport: 'Export de données',
  dataEncryption: 'Chiffrement des données',
  apiAccess: 'Accès API',
  webhooks: 'Webhooks',
  zapierIntegration: 'Intégration Zapier',
  customIntegrations: 'Intégrations personnalisées',
  advancedCloudSync: 'Synchronisation cloud avancée',
  erpIntegration: 'Intégration ERP (Sage/SAP)',
  crmIntegration: 'Intégration CRM (Salesforce)',
  workflowTriggers: 'Déclencheurs de workflow externes',
  contractGeneration: 'Génération de contrats',
  basicProjects: 'Projets basiques',
  advancedProjects: 'Projets avancés',
  projectAnalytics: 'Analytics projets',
  basicReports: 'Rapports basiques',
  advancedReports: 'Rapports avancés',
  reportsExport: 'Export rapports',
  offlineMode: 'Mode hors ligne',
  customBranding: 'Branding personnalisé',
  whiteLabel: 'White Label',
  prioritySupport: 'Support prioritaire',
  dedicatedManager: 'Manager dédié',
  customReports: 'Rapports personnalisés',
  aiAssistant: 'Assistant IA',
};

interface FeatureGuardProps {
  feature: keyof TenantFeatures;
  children: ReactNode;
  mode?: 'overlay' | 'replace' | 'hide' | 'disable';
  className?: string;
  showUpgrade?: boolean;
}

/**
 * FeatureGuard - Protège une fonctionnalité selon le plan
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  mode = 'overlay',
  className = '',
  showUpgrade = true,
}) => {
  const { currentTenant, checkFeature } = useTenantStore();
  const clientHasAccess = checkFeature(feature);
  const [serverAllowed, setServerAllowed] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Server-side verification via check-signature-quota Edge Function (P1-S007)
  useEffect(() => {
    if (!clientHasAccess) {
      setServerAllowed(false);
      return;
    }

    const organizationId = currentTenant?.id;
    if (!organizationId) {
      setServerAllowed(clientHasAccess);
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
          console.warn('Server-side feature check failed, using client gate:', error.message);
          setServerAllowed(clientHasAccess);
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
  }, [clientHasAccess, currentTenant?.id, feature]);

  // Show spinner while server check is in flight
  if (checking || serverAllowed === null) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasAccess = serverAllowed;

  if (hasAccess) {
    return <>{children}</>;
  }

  const currentPlan = currentTenant?.plan || 'business';
  const requiredPlan = FEATURE_MIN_PLAN[feature];
  const requiredPlanInfo = getPlanInfo(requiredPlan);
  const currentPlanInfo = getPlanInfo(currentPlan);
  const requiredTheme = getPlanTheme(requiredPlan);
  const currentTheme = getPlanTheme(currentPlan);
  const RequiredIcon = getPlanIcon(requiredPlan);
  const featureLabel = FEATURE_LABELS[feature];

  if (mode === 'hide') {
    return null;
  }

  if (mode === 'disable') {
    return (
      <div className={`relative opacity-50 pointer-events-none ${className}`}>
        {children}
        <div className="absolute top-2 right-2">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${requiredTheme.badge}`}
          >
            <Lock size={10} />
            <span>{requiredPlanInfo.name}</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'replace') {
    return (
      <div
        className={`rounded-xl border-2 border-dashed ${requiredTheme.border} ${requiredTheme.bgLight} p-6 ${className}`}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`p-3 rounded-full ${requiredTheme.bgMedium}`}>
            <Lock className={`w-6 h-6 ${requiredTheme.text}`} />
          </div>
          <div>
            <h4 className="font-semibold text-primary-900 mb-1">{featureLabel}</h4>
            <p className="text-sm text-primary-500">
              Cette fonctionnalité nécessite le plan{' '}
              <span className={`font-medium ${requiredTheme.text}`}>{requiredPlanInfo.name}</span>
            </p>
          </div>
          {showUpgrade && (
            <a
              href={ATLAS_STUDIO_URLS.billing}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${requiredTheme.button} transition-all`}
            >
              <RequiredIcon size={16} />
              <span>Passer au plan {requiredPlanInfo.name}</span>
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Mode overlay (défaut)
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-20 pointer-events-none blur-[2px] grayscale">{children}</div>
      <div
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/80 via-white/90 to-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed ${requiredTheme.borderLight}`}
      >
        <div className="flex flex-col items-center text-center gap-4 p-6 max-w-sm">
          {/* Badge plan actuel */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${currentTheme.badge}`}
          >
            <span>Votre plan :</span>
            <span className="font-bold">{currentPlanInfo.name}</span>
          </div>

          {/* Icône cadenas avec plan requis */}
          <div className="relative">
            <div
              className={`p-4 rounded-2xl ${requiredTheme.bgLight} shadow-lg border-2 ${requiredTheme.border}`}
            >
              <Lock className={`w-6 h-6 ${requiredTheme.text}`} />
            </div>
            <div
              className={`absolute -bottom-2 -right-2 p-1.5 rounded-full ${requiredTheme.bg} shadow-md`}
            >
              <RequiredIcon size={12} className={requiredTheme.textOnBg} />
            </div>
          </div>

          {/* Nom fonctionnalité et plan requis */}
          <div className="space-y-1">
            <p className="text-base font-semibold text-primary-900">{featureLabel}</p>
            <p className="text-sm text-primary-500">
              Non disponible avec le plan{' '}
              <span className={`font-medium ${currentTheme.text}`}>{currentPlanInfo.name}</span>
            </p>
          </div>

          {/* Plan requis */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${requiredTheme.bgLight} border ${requiredTheme.border}`}
          >
            <RequiredIcon size={16} className={requiredTheme.text} />
            <span className={`text-sm font-medium ${requiredTheme.text}`}>
              Disponible à partir du plan {requiredPlanInfo.name}
            </span>
          </div>

          {/* Bouton upgrade — vers le portail client Atlas Studio */}
          {showUpgrade && (
            <a
              href={ATLAS_STUDIO_URLS.billing}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium ${requiredTheme.button} hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md`}
            >
              <Zap size={16} />
              <span>Passer au plan {requiredPlanInfo.name}</span>
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook pour vérifier si une fonctionnalité est disponible
 */
export const useFeature = (feature: keyof TenantFeatures) => {
  const { currentTenant, checkFeature } = useTenantStore();
  const hasAccess = checkFeature(feature);
  const currentPlan = currentTenant?.plan || 'business';
  const requiredPlan = FEATURE_MIN_PLAN[feature];

  return {
    hasAccess,
    currentPlan,
    requiredPlan,
    isLocked: !hasAccess,
    planTheme: getPlanTheme(requiredPlan),
    featureLabel: FEATURE_LABELS[feature],
  };
};

/**
 * Badge indiquant le plan requis pour une fonctionnalité
 */
export const PlanRequiredBadge: React.FC<{
  feature: keyof TenantFeatures;
  className?: string;
}> = ({ feature, className = '' }) => {
  const { hasAccess, requiredPlan, planTheme } = useFeature(feature);

  if (hasAccess) return null;

  const planInfo = getPlanInfo(requiredPlan);
  const Icon = getPlanIcon(requiredPlan);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${planTheme.badge} ${className}`}
    >
      <Icon size={10} />
      <span>{planInfo.name}</span>
    </div>
  );
};

/**
 * Indicateur de plan actuel avec couleur
 */
export const CurrentPlanIndicator: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}> = ({ size = 'md', showName = true, className = '' }) => {
  const { currentTenant } = useTenantStore();
  const plan = currentTenant?.plan || 'business';
  const planInfo = getPlanInfo(plan);
  const theme = getPlanTheme(plan);
  const Icon = getPlanIcon(plan);

  const sizes = {
    sm: { icon: 12, text: 'text-xs', padding: 'px-2 py-0.5' },
    md: { icon: 14, text: 'text-sm', padding: 'px-2.5 py-1' },
    lg: { icon: 16, text: 'text-base', padding: 'px-3 py-1.5' },
  };

  const s = sizes[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${s.padding} rounded-full font-medium ${theme.badge} ${className}`}
    >
      <Icon size={s.icon} />
      {showName && <span className={s.text}>{planInfo.name}</span>}
    </div>
  );
};

export default FeatureGuard;
