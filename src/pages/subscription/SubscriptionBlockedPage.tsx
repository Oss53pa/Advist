/**
 * SubscriptionBlockedPage - Page affichée quand l'accès est bloqué.
 *
 * Lorsqu'elle est ouverte, elle revalide l'accès auprès d'Atlas Studio :
 * si la licence est en fait active (par ex. après que l'admin a attribué un
 * siège, ou après correction d'un état périmé en localStorage), elle
 * redirige automatiquement vers la racine. Sinon, elle affiche le blocker
 * avec la raison effective.
 */
import React, { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { SubscriptionBlocker } from '../../components/subscription';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';

type BlockReason =
  | 'trial_expired'
  | 'subscription_expired'
  | 'suspended'
  | 'cancelled'
  | 'no_tenant'
  | 'no_licence';

export const SubscriptionBlockedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlReason = searchParams.get('reason') as BlockReason | null;
  const guard = useSubscriptionGuard();

  // Refetch on mount so a stale URL/localStorage doesn't keep the user blocked.
  useEffect(() => {
    void guard.refreshSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (guard.isLoading) {
    return null;
  }

  // Atlas Studio says the user can access the app — get them out of here.
  if (guard.canAccess) {
    return <Navigate to="/" replace />;
  }

  // Prefer the live reason from the guard over the (potentially stale) URL.
  const reason: BlockReason = guard.blockReason ?? urlReason ?? 'no_licence';
  return <SubscriptionBlocker reason={reason} />;
};

export default SubscriptionBlockedPage;
