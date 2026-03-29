/**
 * ChangePlanModal - Modal pour changer le plan d'un abonnement
 * Gère les upgrades (paiement immédiat prorata) et downgrades (fin de période)
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Check,
  Info,
  Clock,
} from 'lucide-react';
import { Button, Modal } from '../ui';
import {
  subscriptionsService,
  Subscription,
  Plan,
  PlanChangePreview
} from '../../services/subscriptions';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onSuccess: () => void;
}

// Plans mock pour le développement (en production, vient de l'API)
const MOCK_PLANS: Plan[] = [
  {
    id: 'business',
    name: 'Business',
    price: 59000,
    period: 'monthly',
    features: ['50 utilisateurs', '250 GB stockage', '15 000 documents', '1 000 signatures/mois', 'API & Webhooks'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149000,
    period: 'monthly',
    features: ['Utilisateurs illimités', 'Stockage illimité', 'Documents illimités', 'Signatures illimitées', 'Support dédié'],
  },
];

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSuccess,
}) => {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les plans disponibles
  useEffect(() => {
    if (isOpen) {
      loadPlans();
      setSelectedPlanId(null);
      setPreview(null);
      setError(null);
    }
  }, [isOpen]);

  // Calculer le preview quand un plan est sélectionné
  useEffect(() => {
    if (selectedPlanId && subscription) {
      loadPreview(selectedPlanId);
    }
  }, [selectedPlanId, subscription]);

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const availablePlans = await subscriptionsService.getAvailablePlans();
      setPlans(availablePlans);
    } catch (err) {
      console.error('Failed to load plans, using mock data:', err);
      setPlans(MOCK_PLANS);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const loadPreview = async (planId: string) => {
    if (!subscription) return;

    setIsLoadingPreview(true);
    setError(null);

    try {
      const previewData = await subscriptionsService.previewPlanChange(subscription.id, planId);
      setPreview(previewData);
    } catch (err) {
      console.error('Failed to load preview, calculating locally:', err);
      // Calcul local du prorata
      calculateLocalPreview(planId);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const calculateLocalPreview = (planId: string) => {
    if (!subscription) return;

    const currentPlan = plans.find(p => p.name.toLowerCase() === subscription.plan.name.toLowerCase());
    const newPlan = plans.find(p => p.id === planId);

    if (!currentPlan || !newPlan) return;

    const periodEnd = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const periodStart = new Date(subscription.currentPeriodStart);

    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const isUpgrade = newPlan.price > currentPlan.price;
    const isDowngrade = newPlan.price < currentPlan.price;

    // Calcul prorata
    const dailyRateCurrent = currentPlan.price / totalDays;
    const dailyRateNew = newPlan.price / totalDays;

    const currentPlanCredit = Math.round(dailyRateCurrent * daysRemaining);
    const newPlanCost = Math.round(dailyRateNew * daysRemaining);
    const amountDue = isUpgrade ? Math.max(0, newPlanCost - currentPlanCredit) : 0;

    setPreview({
      currentPlan,
      newPlan,
      changeType: isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'same',
      effectiveDate: isUpgrade ? today.toISOString() : periodEnd.toISOString(),
      prorata: {
        daysRemaining,
        totalDays,
        currentPlanCredit,
        newPlanCost,
        amountDue,
      },
      immediateChange: isUpgrade,
    });
  };

  const handleSubmit = async () => {
    if (!subscription || !selectedPlanId || !preview) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await subscriptionsService.changePlan(subscription.id, {
        planId: selectedPlanId,
        applyImmediately: preview.immediateChange,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to change plan:', err);
      setError('Impossible de changer le plan. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const currentPlanName = subscription?.plan.name.toLowerCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Changer de plan - ${subscription?.organization.name}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Current Plan Info */}
        <div className="p-4 bg-primary-50 rounded-xl">
          <p className="text-sm text-primary-500 mb-1">Plan actuel</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-primary-900">
              {subscription?.plan.name}
            </span>
            <span className="font-semibold text-primary-900">
              {formatCurrency(subscription?.plan.price || 0)} FCFA/mois
            </span>
          </div>
        </div>

        {/* Plan Selection */}
        <div>
          <h3 className="text-sm font-medium text-primary-700 mb-3">Sélectionner le nouveau plan</h3>

          {isLoadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {plans.map((plan) => {
                const isCurrent = plan.name.toLowerCase() === currentPlanName;
                const isSelected = selectedPlanId === plan.id;
                const isUpgrade = plan.price > (subscription?.plan.price || 0);
                const isDowngrade = plan.price < (subscription?.plan.price || 0);

                return (
                  <button
                    key={plan.id}
                    onClick={() => !isCurrent && setSelectedPlanId(plan.id)}
                    disabled={isCurrent}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      isCurrent
                        ? 'border-primary-200 bg-primary-50 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-primary-900 bg-primary-50'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2 right-2 px-2 py-0.5 bg-primary-900 text-white text-xs font-medium rounded-full">
                        Actuel
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-primary-900">{plan.name}</h4>
                        <p className="text-sm text-primary-500">
                          {formatCurrency(plan.price)} FCFA/mois
                        </p>
                      </div>
                      {!isCurrent && (
                        <div className={`p-1.5 rounded-lg ${
                          isUpgrade ? 'bg-primary-100' : 'bg-primary-100'
                        }`}>
                          {isUpgrade ? (
                            <ArrowUpRight size={14} className="text-primary-900" />
                          ) : (
                            <ArrowDownRight size={14} className="text-primary-900" />
                          )}
                        </div>
                      )}
                    </div>

                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-xs text-primary-600">
                          <Check size={12} className="text-primary-900" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isSelected && (
                      <div className="absolute top-3 left-3 w-5 h-5 bg-primary-900 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview Section */}
        {selectedPlanId && (
          <div className="border-t pt-6">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary-400" />
                <span className="ml-2 text-primary-500">Calcul du prorata...</span>
              </div>
            ) : preview ? (
              <div className="space-y-4">
                {/* Change Type Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  preview.changeType === 'upgrade'
                    ? 'bg-primary-100 text-green-600'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  {preview.changeType === 'upgrade' ? (
                    <>
                      <ArrowUpRight size={16} />
                      Upgrade - Application immédiate
                    </>
                  ) : (
                    <>
                      <Clock size={16} />
                      Downgrade - Application à la fin de la période
                    </>
                  )}
                </div>

                {/* Prorata Details */}
                {preview.changeType === 'upgrade' && (
                  <div className="bg-primary-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-primary-900 flex items-center gap-2">
                      <CreditCard size={16} />
                      Calcul du prorata
                    </h4>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-primary-500">Jours restants</p>
                        <p className="font-medium text-primary-900">
                          {preview.prorata.daysRemaining} / {preview.prorata.totalDays} jours
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-500">Crédit plan actuel</p>
                        <p className="font-medium text-primary-900">
                          -{formatCurrency(preview.prorata.currentPlanCredit)} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-500">Coût nouveau plan</p>
                        <p className="font-medium text-primary-900">
                          +{formatCurrency(preview.prorata.newPlanCost)} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-500">Montant à payer</p>
                        <p className="font-bold text-primary-900 text-lg">
                          {formatCurrency(preview.prorata.amountDue)} FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Downgrade Info */}
                {preview.changeType === 'downgrade' && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info size={20} className="text-primary-900 mt-0.5" />
                      <div>
                        <p className="font-medium text-primary-800">
                          Changement programmé
                        </p>
                        <p className="text-sm text-primary-700 mt-1">
                          Le plan {preview.newPlan.name} sera activé le{' '}
                          <strong>
                            {new Date(preview.effectiveDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                          , à la fin de la période de facturation actuelle.
                        </p>
                        <p className="text-sm text-primary-700 mt-2">
                          L'organisation conserve l'accès aux fonctionnalités {subscription?.plan.name} jusqu'à cette date.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Effective Date */}
                <div className="flex items-center gap-2 text-sm text-primary-600">
                  <Calendar size={14} />
                  <span>
                    Date d'effet :{' '}
                    <strong>
                      {preview.immediateChange
                        ? 'Immédiat'
                        : new Date(preview.effectiveDate).toLocaleDateString('fr-FR')}
                    </strong>
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedPlanId || !preview || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Traitement...
              </>
            ) : preview?.changeType === 'upgrade' ? (
              <>
                <CreditCard size={16} className="mr-2" />
                Confirmer ({formatCurrency(preview.prorata.amountDue)} FCFA)
              </>
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                Programmer le changement
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePlanModal;
