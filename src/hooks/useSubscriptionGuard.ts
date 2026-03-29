/**
 * useSubscriptionGuard - Hook pour protéger les routes selon le statut de l'abonnement
 * Vérifie si l'utilisateur peut accéder à l'application via le backend API
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore, TenantFeatures } from '../stores/tenantStore';
import { useAuthStore } from '../store/authStore';
import {
  getSubscriptionInfo,
  checkFeature as apiCheckFeature,
  checkQuota as apiCheckQuota,
  subscribeToUpdates,
  clearCache,
  SubscriptionInfo,
} from '../services/features';

export interface SubscriptionGuardResult {
  isLoading: boolean;
  canAccess: boolean;
  blockReason?: 'trial_expired' | 'subscription_expired' | 'suspended' | 'cancelled' | 'no_tenant';
  daysRemaining: number;
  shouldShowUpgradePrompt: boolean;
  isTrialEnding: boolean;
  isQuotaNearLimit: boolean;
  refreshSubscription: () => Promise<void>;
}

/**
 * Hook principal pour vérifier l'accès à l'application
 * Se synchronise avec le backend pour les features et quotas
 */
export const useSubscriptionGuard = (): SubscriptionGuardResult => {
  const { currentTenant, canAccessApp, getDaysRemaining, shouldShowUpgradePrompt, setTenant } =
    useTenantStore();

  const { user, isAuthenticated } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Function to fetch subscription from API and update tenant store
  const fetchSubscriptionFromAPI = useCallback(
    async (forceRefresh = false) => {
      if (!isAuthenticated) return;

      try {
        const subscriptionInfo = await getSubscriptionInfo(forceRefresh);

        // Update tenant store with data from API
        const tenantFromAPI = mapSubscriptionToTenant(subscriptionInfo, user);
        setTenant(tenantFromAPI);
      } catch (error) {
        console.warn('Failed to fetch subscription from API, using local data:', error);
        // Fallback to local tenant creation if API fails
        createLocalTenant();
      }
    },
    [isAuthenticated, user, setTenant]
  );

  // Create local tenant as fallback
  const createLocalTenant = useCallback(() => {
    if (!user) return;

    if (user.organization) {
      const org = user.organization;
      setTenant({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.subscription_plan || 'business',
        status: org.is_active ? 'active' : 'suspended',
        quotas: {
          maxUsers: org.quotas?.max_users || (org.subscription_plan === 'enterprise' ? -1 : 5),
          currentUsers: org.quotas?.current_users || 1,
          maxStorage:
            org.quotas?.max_storage_gb || (org.subscription_plan === 'enterprise' ? -1 : 10),
          currentStorage: org.quotas?.current_storage_gb || 0,
          maxDocuments:
            org.quotas?.max_documents || (org.subscription_plan === 'enterprise' ? -1 : 50),
          currentDocuments: org.quotas?.current_documents || 0,
          maxWorkflows:
            org.quotas?.max_active_workflows || (org.subscription_plan === 'enterprise' ? -1 : 10),
          currentWorkflows: org.quotas?.current_active_workflows || 0,
          maxSignaturesMonth: org.subscription_plan === 'enterprise' ? -1 : 50,
          currentSignaturesMonth: 0,
        },
        features: mapPlanToFeatures(org.subscription_plan || 'business', org.ohada_compliant),
        settings: {
          language: 'fr',
          timezone: 'Africa/Abidjan',
          dateFormat: 'DD/MM/YYYY',
          workingDays: org.working_days || [1, 2, 3, 4, 5],
          workingHours: { start: '08:00', end: '18:00' },
          retentionPeriodDays: 3650,
          autoArchiveDays: 365,
          notifications: {
            emailEnabled: true,
            pushEnabled: true,
            digestFrequency: 'daily',
          },
        },
        subscription: {
          status: 'active',
          autoRenew: true,
        },
        createdAt: new Date().toISOString(),
      });
    } else {
      // No organization found — user must complete onboarding
      console.warn('User has no organization assigned. Subscription guard cannot create tenant.');
    }
  }, [user, setTenant]);

  // Refresh subscription manually
  const refreshSubscription = useCallback(async () => {
    clearCache();
    await fetchSubscriptionFromAPI(true);
  }, [fetchSubscriptionFromAPI]);

  // Initial load and subscription sync
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Fetch subscription from API
    const initSubscription = async () => {
      setIsLoading(true);
      await fetchSubscriptionFromAPI();
      setIsLoading(false);
    };

    initSubscription();

    // Subscribe to real-time updates
    unsubscribeRef.current = subscribeToUpdates((subscription) => {
      const tenantFromAPI = mapSubscriptionToTenant(subscription, user);
      setTenant(tenantFromAPI);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isAuthenticated, user, fetchSubscriptionFromAPI, setTenant]);

  // Si pas authentifié, autoriser l'accès (les routes privées gèrent ça séparément)
  if (!isAuthenticated) {
    return {
      isLoading: false,
      canAccess: true,
      daysRemaining: 0,
      shouldShowUpgradePrompt: false,
      isTrialEnding: false,
      isQuotaNearLimit: false,
      refreshSubscription,
    };
  }

  if (isLoading) {
    return {
      isLoading: true,
      canAccess: false,
      daysRemaining: 0,
      shouldShowUpgradePrompt: false,
      isTrialEnding: false,
      isQuotaNearLimit: false,
      refreshSubscription,
    };
  }

  const access = canAccessApp();
  const daysRemaining = getDaysRemaining();
  const showUpgrade = shouldShowUpgradePrompt();

  // Vérifier si le trial arrive à expiration (moins de 5 jours)
  const isTrialEnding =
    currentTenant?.status === 'trial' && daysRemaining > 0 && daysRemaining <= 5;

  // Vérifier si un quota est proche de la limite (> 80%)
  const isQuotaNearLimit = (() => {
    if (!currentTenant || currentTenant.plan !== 'business') return false;
    const { quotas } = currentTenant;
    return (
      quotas.currentDocuments / quotas.maxDocuments >= 0.8 ||
      quotas.currentUsers / quotas.maxUsers >= 0.8 ||
      quotas.currentSignaturesMonth / quotas.maxSignaturesMonth >= 0.8
    );
  })();

  return {
    isLoading: false,
    canAccess: access.allowed,
    blockReason: access.reason as SubscriptionGuardResult['blockReason'],
    daysRemaining,
    shouldShowUpgradePrompt: showUpgrade,
    isTrialEnding,
    isQuotaNearLimit,
    refreshSubscription,
  };
};

/**
 * Hook pour rediriger automatiquement si l'accès est bloqué
 */
export const useSubscriptionRedirect = (redirectTo: string = '/subscription-blocked') => {
  const navigate = useNavigate();
  const guard = useSubscriptionGuard();

  useEffect(() => {
    if (!guard.isLoading && !guard.canAccess && guard.blockReason) {
      navigate(`${redirectTo}?reason=${guard.blockReason}`, { replace: true });
    }
  }, [guard.isLoading, guard.canAccess, guard.blockReason, navigate, redirectTo]);

  return guard;
};

/**
 * Hook pour vérifier si une fonctionnalité est disponible
 * Avec validation optionnelle côté serveur
 */
export const useFeatureCheck = (
  feature: string,
  validateWithServer = false
): { hasFeature: boolean; plan: string; isLoading: boolean } => {
  const { currentTenant, checkFeature } = useTenantStore();
  const [serverResult, setServerResult] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(validateWithServer);

  useEffect(() => {
    if (validateWithServer && feature) {
      setIsLoading(true);
      apiCheckFeature(feature)
        .then((response) => {
          setServerResult(response.enabled);
        })
        .catch(() => {
          // Fallback to local check
          setServerResult(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [feature, validateWithServer]);

  if (!currentTenant) {
    return { hasFeature: false, plan: '', isLoading };
  }

  // Use server result if available, otherwise local check
  const hasFeature =
    serverResult !== null ? serverResult : checkFeature(feature as keyof TenantFeatures);

  return {
    hasFeature,
    plan: currentTenant.plan,
    isLoading,
  };
};

/**
 * Hook pour vérifier un quota spécifique
 * Avec validation optionnelle côté serveur
 */
export const useQuotaCheck = (
  quotaKey:
    | 'currentUsers'
    | 'currentDocuments'
    | 'currentSignaturesMonth'
    | 'currentStorage'
    | 'currentWorkflows',
  validateWithServer = false
) => {
  const { currentTenant, checkQuota } = useTenantStore();
  const [serverResult, setServerResult] = useState<{
    current: number;
    max: number;
    percentage: number;
    allowed: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(validateWithServer);

  useEffect(() => {
    if (validateWithServer && quotaKey) {
      setIsLoading(true);
      apiCheckQuota(quotaKey)
        .then((response) => {
          setServerResult({
            current: response.current,
            max: response.max,
            percentage: response.percentage,
            allowed: response.allowed,
          });
        })
        .catch(() => {
          setServerResult(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [quotaKey, validateWithServer]);

  if (!currentTenant) {
    return {
      current: 0,
      max: 0,
      percentage: 0,
      allowed: false,
      isWarning: false,
      isCritical: false,
      isExceeded: false,
      isLoading,
    };
  }

  // Use server result if available
  const result = serverResult || checkQuota(quotaKey);

  return {
    current: result.current,
    max: result.max,
    percentage: result.percentage,
    allowed: result.allowed,
    isWarning: result.percentage >= 75 && result.percentage < 90,
    isCritical: result.percentage >= 90 && result.percentage < 100,
    isExceeded: result.percentage >= 100,
    isUnlimited: result.max === -1,
    isLoading,
  };
};

// Helper: Map subscription info from API to tenant format
function mapSubscriptionToTenant(subscription: SubscriptionInfo, user: any) {
  return {
    id: subscription.tenantId,
    name: user?.organization?.name || 'Organization',
    slug: user?.organization?.slug || 'org',
    plan: subscription.plan,
    status: subscription.status,
    quotas: subscription.quotas,
    features: subscription.features,
    settings: {
      language: 'fr',
      timezone: 'Africa/Abidjan',
      dateFormat: 'DD/MM/YYYY',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '08:00', end: '18:00' },
      retentionPeriodDays: 3650,
      autoArchiveDays: 365,
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        digestFrequency: 'daily' as const,
      },
    },
    subscription: {
      status: subscription.status,
      autoRenew: subscription.autoRenew,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
    },
    createdAt: new Date().toISOString(),
  };
}

// Helper: Map plan to features (fallback when API unavailable)
// Aligné sur la spécification commerciale — Business = fonctions de base uniquement
function mapPlanToFeatures(plan: string, _ohadaCompliant?: boolean): TenantFeatures {
  const isEnterprise = plan === 'enterprise';

  return {
    // Documents
    documentVersioning: true,
    documentAnnotations: true,
    documentComparison: true,
    trackChanges: true,
    bulkImport: true,
    cloudIntegration: true,
    documentTemplates: isEnterprise, // Enterprise only
    ocrRecognition: true,
    // Workflows
    basicWorkflows: true,
    advancedWorkflows: true,
    conditionalRules: isEnterprise, // Enterprise only
    parallelSignatures: true,
    workflowTemplates: isEnterprise, // Enterprise only
    workflowAnalytics: isEnterprise, // Enterprise only
    // Signatures
    simpleSignature: true,
    advancedSignature: isEnterprise, // Enterprise only (eIDAS)
    qualifiedSignature: isEnterprise, // Enterprise only
    ohadaCompliance: isEnterprise, // Enterprise only
    signatureCertificates: isEnterprise, // Enterprise only
    biometricSignature: isEnterprise,
    // Sécurité
    ssoEnabled: isEnterprise, // Enterprise only (SSO/SAML)
    twoFactorAuth: true,
    ipRestriction: isEnterprise,
    auditLogs: true,
    advancedAuditLogs: isEnterprise,
    dataExport: true,
    dataEncryption: true,
    // Intégrations
    apiAccess: isEnterprise, // Enterprise only
    webhooks: isEnterprise,
    zapierIntegration: isEnterprise,
    customIntegrations: isEnterprise,
    // External system integrations
    advancedCloudSync: isEnterprise,
    erpIntegration: isEnterprise,
    crmIntegration: isEnterprise,
    workflowTriggers: isEnterprise,
    contractGeneration: isEnterprise,
    // Projets
    basicProjects: true,
    advancedProjects: isEnterprise,
    projectAnalytics: isEnterprise,
    // Rapports
    basicReports: true,
    advancedReports: isEnterprise,
    reportsExport: true,
    // Autres
    offlineMode: isEnterprise,
    customBranding: isEnterprise,
    whiteLabel: isEnterprise,
    prioritySupport: isEnterprise, // Enterprise only
    dedicatedManager: isEnterprise,
    customReports: isEnterprise,
    aiAssistant: isEnterprise,
  };
}

export default useSubscriptionGuard;
