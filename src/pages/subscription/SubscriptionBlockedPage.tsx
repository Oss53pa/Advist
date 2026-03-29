/**
 * SubscriptionBlockedPage - Page affichée quand l'accès est bloqué
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubscriptionBlocker } from '../../components/subscription';

type BlockReason = 'trial_expired' | 'subscription_expired' | 'suspended' | 'cancelled' | 'no_tenant';

export const SubscriptionBlockedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reason = (searchParams.get('reason') as BlockReason) || 'trial_expired';

  return <SubscriptionBlocker reason={reason} />;
};

export default SubscriptionBlockedPage;
