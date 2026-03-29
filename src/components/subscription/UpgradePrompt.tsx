/**
 * UpgradePrompt - Composant de suggestion d'upgrade
 * Affiché quand le trial arrive à expiration ou quand les quotas sont presque atteints
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  X,
  Zap,
  TrendingUp,
  Star,
  Check,
  CreditCard,
  Key,
} from 'lucide-react';
import { useTenantStore, getPlanInfo } from '../../stores/tenantStore';
import { Button } from '../ui';

interface UpgradePromptProps {
  variant?: 'banner' | 'modal' | 'inline';
  onDismiss?: () => void;
  dismissable?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  variant = 'banner',
  onDismiss,
  dismissable = true,
}) => {
  const { currentTenant, getDaysRemaining, shouldShowUpgradePrompt } = useTenantStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!currentTenant || isDismissed || !shouldShowUpgradePrompt()) {
    return null;
  }

  const daysRemaining = getDaysRemaining();
  const isTrialEnding = currentTenant.status === 'trial' && daysRemaining <= 5;
  const isQuotaNearLimit = currentTenant.plan === 'business';

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Get next plan recommendation
  const recommendedPlan = currentTenant.plan === 'business' ? 'enterprise' : 'enterprise';
  const planInfo = getPlanInfo(recommendedPlan);

  if (variant === 'banner') {
    return (
      <div className={`relative px-4 py-3 ${isTrialEnding ? 'bg-primary-900' : 'bg-gradient-to-r from-primary-900 to-primary-800'} text-white`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isTrialEnding ? (
              <>
                <Clock size={20} className="flex-shrink-0" />
                <div>
                  <span className="font-medium">
                    {daysRemaining === 0
                      ? 'Dernier jour de votre essai !'
                      : `Plus que ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} d'essai`}
                  </span>
                  <span className="hidden sm:inline ml-2 opacity-90">
                    Passez au plan {planInfo.name} pour continuer
                  </span>
                </div>
              </>
            ) : (
              <>
                <TrendingUp size={20} className="flex-shrink-0" />
                <div>
                  <span className="font-medium">Vous atteignez les limites de votre plan</span>
                  <span className="hidden sm:inline ml-2 opacity-90">
                    Passez à {planInfo.name} pour plus de capacité
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/checkout?plan=${recommendedPlan}`}>
              <Button
                size="sm"
                className={isTrialEnding ? 'bg-white text-primary-900 hover:bg-primary-100' : 'bg-primary-900 hover:bg-primary-400'}
              >
                <Zap size={14} className="mr-1" />
                Passer à {planInfo.name}
              </Button>
            </Link>
            {dismissable && (
              <button onClick={handleDismiss} className="p-1 hover:bg-white/10 rounded">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-primary-50 to-orange-50 border border-primary-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            {isTrialEnding ? (
              <Clock size={20} className="text-primary-900" />
            ) : (
              <AlertTriangle size={20} className="text-primary-900" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-primary-900">
              {isTrialEnding
                ? `Essai gratuit : ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`
                : 'Limites bientôt atteintes'}
            </h4>
            <p className="text-sm text-primary-600 mt-1">
              {isTrialEnding
                ? 'Souscrivez maintenant pour garder l\'accès à vos documents.'
                : 'Passez au plan supérieur pour débloquer plus de capacité.'}
            </p>
            <div className="flex gap-2 mt-3">
              <Link to={`/checkout?plan=${recommendedPlan}`}>
                <Button size="sm">
                  Passer à {planInfo.name}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" size="sm">
                  Voir les plans
                </Button>
              </Link>
            </div>
          </div>
          {dismissable && (
            <button onClick={handleDismiss} className="text-primary-400 hover:text-primary-600">
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${isTrialEnding ? 'bg-primary-900' : 'bg-gradient-to-r from-primary-900 to-primary-800'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isTrialEnding ? (
                <Clock size={24} />
              ) : (
                <TrendingUp size={24} />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {isTrialEnding
                    ? `Plus que ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} !`
                    : 'Passez au niveau supérieur'}
                </h2>
                <p className="text-sm opacity-90">
                  {isTrialEnding
                    ? 'Votre essai gratuit arrive à terme'
                    : 'Débloquez plus de fonctionnalités'}
                </p>
              </div>
            </div>
            {dismissable && (
              <button onClick={handleDismiss} className="p-1 hover:bg-white/10 rounded">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-primary-900">{planInfo.name}</span>
              <div>
                <span className="text-2xl font-bold text-primary-900">{planInfo.price}</span>
                {planInfo.period && (
                  <span className="text-sm text-primary-500 ml-1">{planInfo.period}</span>
                )}
              </div>
            </div>
            {planInfo.popular && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                <Star size={12} />
                Recommandé
              </span>
            )}
          </div>

          <ul className="space-y-3 mb-6">
            {planInfo.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-primary-700">
                <Check size={16} className="text-primary-900 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="space-y-3">
            {recommendedPlan === 'enterprise' ? (
              <>
                <Link to="/activate-license" className="block">
                  <Button className="w-full" size="lg">
                    <Key size={18} className="mr-2" />
                    Activer une licence Enterprise
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" size="lg">
                  Contacter les ventes
                </Button>
              </>
            ) : (
              <>
                <Link to={`/checkout?plan=${recommendedPlan}`} className="block">
                  <Button className="w-full" size="lg">
                    <CreditCard size={18} className="mr-2" />
                    Souscrire à {planInfo.name}
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <Link to="/pricing" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Comparer tous les plans
                  </Button>
                </Link>
              </>
            )}
          </div>

          {isTrialEnding && (
            <p className="text-xs text-center text-primary-500 mt-4">
              Vos données seront préservées. Vous pourrez reprendre exactement où vous en étiez.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * TrialBadge - Badge affichant les jours restants du trial
 */
export const TrialBadge: React.FC = () => {
  const { currentTenant, getDaysRemaining } = useTenantStore();

  if (!currentTenant || currentTenant.status !== 'trial') {
    return null;
  }

  const daysRemaining = getDaysRemaining();
  const isUrgent = daysRemaining <= 3;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isUrgent
          ? 'bg-red-100 text-red-700'
          : 'bg-primary-100 text-primary-700'
      }`}
    >
      <Clock size={12} />
      {daysRemaining === 0 ? 'Dernier jour' : `${daysRemaining}j restant${daysRemaining > 1 ? 's' : ''}`}
    </div>
  );
};

/**
 * QuotaWarning - Avertissement quand un quota est presque atteint
 */
interface QuotaWarningProps {
  quotaName: string;
  current: number;
  max: number;
  unit?: string;
}

export const QuotaWarning: React.FC<QuotaWarningProps> = ({ quotaName, current, max, unit = '' }) => {
  if (max === -1) return null; // Unlimited

  const percentage = Math.round((current / max) * 100);
  if (percentage < 80) return null;

  const isExceeded = percentage >= 100;
  const isCritical = percentage >= 90;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        isExceeded
          ? 'bg-red-50 text-red-700 border border-red-200'
          : isCritical
          ? 'bg-primary-50 text-primary-700 border border-primary-200'
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      }`}
    >
      <AlertTriangle size={14} />
      <span>
        {isExceeded
          ? `${quotaName} : limite atteinte (${current}/${max}${unit})`
          : `${quotaName} : ${percentage}% utilisé (${current}/${max}${unit})`}
      </span>
      <Link to="/pricing" className="ml-auto font-medium hover:underline">
        Augmenter →
      </Link>
    </div>
  );
};

export default UpgradePrompt;
