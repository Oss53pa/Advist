import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  ArrowRight,
  Users,
  FileText,
  Shield,
  Sparkles,
  Mail,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { Button, Card } from '../../components/ui';

interface RegistrationState {
  email: string;
  organization: string;
  plan: string;
  paymentCompleted?: boolean;
  amount?: number;
  currency?: string;
}

export const RegisterSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const state = location.state as RegistrationState | null;

  // Rediriger si pas de state (accès direct à la page)
  if (!state) {
    return <Navigate to="/register" replace />;
  }

  const planNames: Record<string, string> = {
    starter: 'Starter',
    business: 'Business',
    enterprise: 'Enterprise',
  };

  const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const nextSteps = [
    {
      icon: Mail,
      title: t('auth.registerSuccess.confirmEmail'),
      description: t('auth.registerSuccess.confirmEmailDesc', { email: state.email }),
    },
    {
      icon: Users,
      title: t('auth.registerSuccess.inviteTeam'),
      description: t('auth.registerSuccess.inviteTeamDesc'),
    },
    {
      icon: FileText,
      title: t('auth.registerSuccess.importDocs'),
      description: t('auth.registerSuccess.importDocsDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-advist-dark rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-decorative text-2xl text-[#C8A961]">Advist</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <Card padding="lg" className="!bg-[#1A1A1D] !border !border-white/5 text-center mb-8">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-advist-success" />
            </div>

            <h1 className="text-3xl font-light text-white mb-2">
              {t('auth.registerSuccess.welcome')}
            </h1>
            <p className="text-lg text-white/40 mb-6">{t('auth.registerSuccess.accountCreated')}</p>

            {/* Organization Info */}
            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-sm text-white/40 mb-1">
                    {t('auth.registerSuccess.organization')}
                  </p>
                  <p className="font-medium text-white">{state.organization}</p>
                </div>
                <div>
                  <p className="text-sm text-white/40 mb-1">{t('auth.registerSuccess.plan')}</p>
                  <p className="font-medium text-white">{planNames[state.plan]}</p>
                </div>
                <div>
                  <p className="text-sm text-white/40 mb-1">{t('auth.registerSuccess.yourRole')}</p>
                  <p className="font-medium text-white">
                    {t('auth.registerSuccess.administrator')}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Confirmation */}
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-500/10 border border-advist-success rounded-xl mb-8">
              <CreditCard className="w-8 h-8 text-advist-success" />
              <div className="text-left">
                <p className="font-semibold text-advist-success">
                  {t('auth.registerSuccess.paymentConfirmed')}
                </p>
                <p className="text-sm text-advist-success">
                  {state.amount && state.currency
                    ? `${formatCurrency(state.amount, state.currency)} - `
                    : ''}
                  {t('auth.registerSuccess.subscriptionActive')}
                </p>
              </div>
            </div>

            {/* Receipt info */}
            <div className="flex items-center justify-center gap-2 text-white/40 mb-8">
              <Receipt size={16} />
              <span>{t('auth.registerSuccess.invoiceSent')}</span>
            </div>

            <Link to="/login">
              <Button size="lg" className="px-8">
                {t('auth.registerSuccess.accessDashboard')}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </Card>

          {/* Next Steps */}
          <h2 className="text-xl font-light text-white mb-4 text-center">
            {t('auth.registerSuccess.nextSteps')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextSteps.map((step, index) => (
              <Card
                key={index}
                padding="md"
                className="!bg-[#1A1A1D] !border !border-white/5 text-center"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-[#C8A961]" />
                </div>
                <h3 className="font-medium text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40">{step.description}</p>
              </Card>
            ))}
          </div>

          {/* Security note */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/40">
            <Shield size={16} />
            <span>{t('auth.registerSuccess.adminNote')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccessPage;
