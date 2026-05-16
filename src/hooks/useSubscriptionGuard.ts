/**
 * useSubscriptionGuard - Hook pour protéger les routes selon le statut de l'abonnement
 * Source de vérité : Atlas Studio (licence_seats + licences + subscriptions).
 * Aucun fallback local : si Atlas Studio ne reconnaît pas de licence active,
 * l'utilisateur est bloqué avec blockReason='no_licence'.
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
  NoActiveLicenceError,
} from '../services/features';

export type BlockReason =
  | 'trial_expired'
  | 'subscription_expired'
  | 'suspended'
  | 'cancelled'
  | 'no_tenant'
  | 'no_licence';

export interface SubscriptionGuardResult {
  isLoading: boolean;
  canAccess: boolean;
  blockReason?: BlockReason;
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
  const {
    currentTenant,
    canAccessApp,
    getDaysRemaining,
    shouldShowUpgradePrompt,
    setTenant,
    clearTenant,
  } = useTenantStore();

  const { user, isAuthenticated } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [licenceMissing, setLicenceMissing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch the user's licence + subscription state from Atlas Studio.
  // No local fallback: if Atlas Studio has no active licence for this user,
  // the app is blocked with a clear "no_licence" reason instead of inventing
  // a trial tenant locally.
  const fetchSubscriptionFromAPI = useCallback(
    async (forceRefresh = false) => {
      if (!isAuthenticated) return;

      try {
        const subscriptionInfo = await getSubscriptionInfo(forceRefresh);
        setLicenceMissing(false);
        setTenant(mapSubscriptionToTenant(subscriptionInfo, user));
      } catch (error) {
        if (error instanceof NoActiveLicenceError) {
          setLicenceMissing(true);
          clearTenant();
          return;
        }
        console.warn('Failed to fetch subscription from Atlas Studio:', error);
        setLicenceMissing(true);
        clearTenant();
      }
    },
    [isAuthenticated, user, setTenant, clearTenant]
  );

  const refreshSubscription = useCallback(async () => {
    clearCache();
    await fetchSubscriptionFromAPI(true);
  }, [fetchSubscriptionFromAPI]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const initSubscription = async () => {
      setIsLoading(true);
      await fetchSubscriptionFromAPI();
      setIsLoading(false);
    };

    initSubscription();

    unsubscribeRef.current = subscribeToUpdates((subscription) => {
      setLicenceMissing(false);
      setTenant(mapSubscriptionToTenant(subscription, user));
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

  // Licence manquante côté Atlas Studio → bloquer avant tout autre check.
  if (licenceMissing) {
    return {
      isLoading: false,
      canAccess: false,
      blockReason: 'no_licence',
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
  // (skip si une dimension est marquée illimitée = -1)
  const isQuotaNearLimit = (() => {
    if (!currentTenant || currentTenant.plan !== 'business') return false;
    const { quotas } = currentTenant;
    const ratio = (current: number, max: number) => (max > 0 ? current / max : 0);
    return (
      ratio(quotas.currentDocuments, quotas.maxDocuments) >= 0.8 ||
      ratio(quotas.currentUsers, quotas.maxUsers) >= 0.8 ||
      ratio(quotas.currentSignaturesMonth, quotas.maxSignaturesMonth) >= 0.8
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

export default useSubscriptionGuard;
