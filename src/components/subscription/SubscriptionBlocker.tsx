/**
 * SubscriptionBlocker - Composant de blocage quand la période d'essai est expirée
 * ou quand l'abonnement n'est plus valide
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CreditCard,
  Check,
  ArrowRight,
  Shield,
  Zap,
  Phone,
  Mail,
  Building2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useTenantStore, getPlanInfo, PlanType } from '../../stores/tenantStore';
import { Button } from '../ui';

// Atlas Studio owns billing/subscription. All upgrade flows go to the portal.
const ATLAS_STUDIO_PRICING_URL = 'https://atlas-studio.org/applications/advist';

interface SubscriptionBlockerProps {
  reason: 'trial_expired' | 'subscription_expired' | 'suspended' | 'cancelled' | 'no_tenant';
}

export const SubscriptionBlocker: React.FC<SubscriptionBlockerProps> = ({ reason }) => {
  const { currentTenant } = useTenantStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('business');

  const getBlockerContent = () => {
    switch (reason) {
      case 'trial_expired':
        return {
          icon: Clock,
          iconColor: 'text-primary-900',
          bgColor: 'bg-primary-50',
          title: "Votre période d'essai est terminée",
          description:
            "Votre essai gratuit d'1 mois a expiré. Pour continuer à utiliser ADVIST et accéder à vos documents, veuillez souscrire à un abonnement.",
          showPlans: true,
        };
      case 'subscription_expired':
        return {
          icon: CreditCard,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          title: 'Votre abonnement a expiré',
          description:
            "Votre abonnement ADVIST n'est plus actif. Renouvelez-le maintenant pour retrouver l'accès à tous vos documents et workflows.",
          showPlans: true,
        };
      case 'suspended':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          title: 'Compte suspendu',
          description:
            'Votre compte a été suspendu. Veuillez contacter notre équipe support pour résoudre ce problème et réactiver votre accès.',
          showPlans: false,
        };
      case 'cancelled':
        return {
          icon: XCircle,
          iconColor: 'text-primary-500',
          bgColor: 'bg-primary-50',
          title: 'Abonnement annulé',
          description:
            "Votre abonnement a été annulé. Vous pouvez le réactiver à tout moment pour retrouver l'accès à vos données.",
          showPlans: true,
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-primary-500',
          bgColor: 'bg-primary-50',
          title: 'Accès restreint',
          description: 'Veuillez vous connecter ou contacter le support.',
          showPlans: false,
        };
    }
  };

  const content = getBlockerContent();
  const plans: PlanType[] = ['business', 'enterprise'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`w-20 h-20 ${content.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <content.icon className={`w-10 h-10 ${content.iconColor}`} />
          </div>
          <h1 className="text-3xl font-bold text-primary-900 mb-3">{content.title}</h1>
          <p className="text-primary-600 max-w-md mx-auto">{content.description}</p>

          {currentTenant && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border">
              <Building2 size={16} className="text-primary-400" />
              <span className="text-sm text-primary-600">{currentTenant.name}</span>
            </div>
          )}
        </div>

        {/* Plans */}
        {content.showPlans && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-primary-900 text-center mb-6">
              Choisissez votre plan
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {plans.map((plan) => {
                const info = getPlanInfo(plan);
                const isSelected = selectedPlan === plan;

                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary-900 bg-primary-50'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                  >
                    {info.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-400 text-primary-900 text-xs font-bold rounded-full">
                        Populaire
                      </span>
                    )}

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-primary-900">{info.name}</h3>
                      <p className="text-sm text-primary-500">{info.description}</p>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-bold text-primary-900">{info.price}</span>
                      {info.period && (
                        <span className="text-sm text-primary-500 ml-1">{info.period}</span>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {info.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-primary-600">
                          <Check size={14} className="text-primary-900 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-primary-900 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action buttons — all flows go through Atlas Studio */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={ATLAS_STUDIO_PRICING_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto">
                  <CreditCard size={18} className="mr-2" />
                  Souscrire maintenant
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </a>
              <a href={ATLAS_STUDIO_PRICING_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg">
                  Comparer les plans
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Contact support for suspended */}
        {reason === 'suspended' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">Besoin d'aide ?</h2>
            <p className="text-primary-600 mb-6">
              Notre équipe support est disponible pour vous aider à résoudre ce problème.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Mail size={18} className="mr-2" />
                support@advist.com
              </Button>
              <Button variant="outline" size="lg">
                <Phone size={18} className="mr-2" />
                +225 01 02 03 04 05
              </Button>
            </div>
          </div>
        )}

        {/* Features reminder */}
        {content.showPlans && (
          <div className="mt-8 text-center">
            <p className="text-sm text-primary-500 mb-4">Tous les plans incluent :</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: Shield, label: 'Sécurité ISO 27001' },
                { icon: Zap, label: 'Support réactif' },
                { icon: RefreshCw, label: 'Mises à jour gratuites' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-primary-600">
                  <item.icon size={14} className="text-primary-400" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to login */}
        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-primary-500 hover:text-primary-700">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBlocker;
