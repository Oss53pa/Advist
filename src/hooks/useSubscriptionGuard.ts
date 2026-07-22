/**
 * useSubscriptionGuard - Hook pour protéger les routes selon le statut de l'abonnement
 * Source de vérité : Atlas Studio (licence_seats + licences + subscriptions).
 *
 * Comportement en cas d'échec — deux cas volontairement distincts :
 *
 * 1. **Refus explicite** (`NoActiveLicenceError` : aucun siège / aucune licence).
 *    Atlas Studio a répondu « non ». → accès **bloqué** immédiatement
 *    (`blockReason='no_licence'`) et tenant purgé, sans tolérance.
 *
 * 2. **Panne d'infrastructure** (réseau, 5xx, timeout). Atlas Studio n'a pas
 *    répondu du tout. Bloquer ferait d'une panne Atlas une panne Advist totale.
 *    → on prolonge le **dernier état connu** pendant au plus
 *    {@link LICENCE_GRACE_MS} (72 h). Passé ce délai, ou sans état connu
 *    récent, l'accès est **bloqué**.
 *
 * Aucun droit n'est jamais fabriqué. Le comportement précédent (commit fc91a9b,
 * « fail-open ») inventait un tenant `enterprise` aux quotas illimités dès que
 * l'appel échouait : il suffisait donc de bloquer la requête réseau vers Atlas
 * Studio pour obtenir un accès illimité. C'est ce contournement qui est corrigé.
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

/**
 * Fenetre de tolerance appliquee UNIQUEMENT aux pannes d'infrastructure
 * (reseau / 5xx / timeout), jamais a un refus explicite d'Atlas Studio.
 *
 * 72 h est volontairement large : un utilisateur dont la licence est revoquee
 * recoit une reponse definitive (NoActiveLicenceError) et est bloque tout de
 * suite, sans passer par cette fenetre. Celle-ci ne protege donc que la
 * disponibilite en cas de panne, sans ouvrir de contournement.
 */
const LICENCE_GRACE_MS = 72 * 60 * 60 * 1000;
const LICENCE_CHECK_KEY = 'advist-licence-last-ok';

/** Horodate la derniere verification de licence reussie. */
function markLicenceCheckedNow(): void {
  try {
    localStorage.setItem(LICENCE_CHECK_KEY, String(Date.now()));
  } catch {
    // Stockage indisponible (mode prive, quota) : sans point de reference,
    // une panne mene au blocage plutot qu'a un acces non verifie.
  }
}

/** Date de la derniere verification reussie, ou null si inconnue/illisible. */
function getLastLicenceCheck(): number | null {
  try {
    const raw = localStorage.getItem(LICENCE_CHECK_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    // Une valeur corrompue ou dans le futur ne doit pas prolonger l'acces.
    if (!Number.isFinite(ts) || ts > Date.now()) return null;
    return ts;
  } catch {
    return null;
  }
}

function clearLicenceCheckpoint(): void {
  try {
    localStorage.removeItem(LICENCE_CHECK_KEY);
  } catch {
    /* rien a faire */
  }
}

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
  const userRef = useRef(user);
  const isAuthenticatedRef = useRef(isAuthenticated);
  userRef.current = user;
  isAuthenticatedRef.current = isAuthenticated;

  const fetchSubscriptionFromAPI = useCallback(
    async (forceRefresh = false) => {
      if (!isAuthenticatedRef.current) return;

      const currentUser = userRef.current;

      try {
        const subscriptionInfo = await getSubscriptionInfo(forceRefresh);
        setLicenceMissing(false);
        setTenant(mapSubscriptionToTenant(subscriptionInfo, currentUser));
        markLicenceCheckedNow();
      } catch (error) {
        if (error instanceof NoActiveLicenceError) {
          // Reponse DEFINITIVE d'Atlas Studio : aucun siege / aucune licence
          // active pour cet utilisateur. Ce n'est pas une panne, c'est un non.
          // On bloque immediatement et on purge le tenant : le store etant
          // persiste (zustand/persist, cle 'advist-tenant'), le conserver
          // laisserait des droits perimes lisibles par le reste de l'app.
          console.warn('[subscriptionGuard] Aucune licence active — acces bloque.', error);
          clearLicenceCheckpoint();
          clearTenant();
          setLicenceMissing(true);
          return;
        }

        // Erreur TRANSITOIRE (reseau, 5xx, timeout) : Atlas Studio n'a pas
        // repondu « non », il n'a pas repondu du tout. Bloquer tout le monde
        // ferait d'une panne Atlas une panne Advist totale.
        // Compromis : on prolonge le DERNIER ETAT CONNU, borne dans le temps.
        // On ne fabrique jamais de droits (c'etait le defaut precedent : un
        // tenant 'enterprise' aux quotas illimites etait invente de toutes
        // pieces, si bien qu'il suffisait de bloquer l'appel reseau pour
        // obtenir un acces illimite).
        const lastOk = getLastLicenceCheck();
        const withinGrace = lastOk !== null && Date.now() - lastOk < LICENCE_GRACE_MS;

        if (withinGrace && useTenantStore.getState().currentTenant) {
          const hoursLeft = Math.round((LICENCE_GRACE_MS - (Date.now() - lastOk)) / 3_600_000);
          console.warn(
            `[subscriptionGuard] Atlas Studio injoignable — maintien du dernier etat connu (~${hoursLeft} h restantes).`,
            error
          );
          setLicenceMissing(false);
          return;
        }

        console.warn(
          '[subscriptionGuard] Atlas Studio injoignable et aucun etat connu recent — acces bloque.',
          error
        );
        clearTenant();
        setLicenceMissing(true);
      }
    },
    [setTenant, clearTenant]
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
      setTenant(mapSubscriptionToTenant(subscription, userRef.current));
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
