import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  DollarSign,
  Receipt,
  Wallet,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui';

// Mock statistics
const billingStats = [
  {
    label: 'Revenus ce mois',
    value: '12,450,000',
    currency: 'FCFA',
    change: '+15%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-green-50 text-advist-success',
  },
  {
    label: 'Abonnements actifs',
    value: '47',
    change: '+5',
    trend: 'up',
    icon: Users,
    color: 'bg-advist-gold-light text-advist-gray900',
  },
  {
    label: 'Factures en attente',
    value: '8',
    change: '-2',
    trend: 'down',
    icon: FileText,
    color: 'bg-advist-gold-light text-advist-gold-dark',
  },
  {
    label: 'Impayés',
    value: '3',
    change: '+1',
    trend: 'up',
    icon: AlertTriangle,
    color: 'bg-advist-gold-light text-advist-error',
  },
];

// Mock recent transactions
const recentTransactions = [
  {
    id: 1,
    organization: 'Société Générale CI',
    amount: 1500000,
    currency: 'FCFA',
    method: 'card',
    status: 'completed',
    date: '2024-11-28T14:30:00',
  },
  {
    id: 2,
    organization: "Orange Côte d'Ivoire",
    amount: 2500000,
    currency: 'FCFA',
    method: 'bank_transfer',
    status: 'completed',
    date: '2024-11-27T10:15:00',
  },
  {
    id: 3,
    organization: 'Cabinet Juridique Kouassi',
    amount: 350000,
    currency: 'FCFA',
    method: 'mobile_money',
    status: 'pending',
    date: '2024-11-26T16:45:00',
  },
  {
    id: 4,
    organization: 'ADVIST Demo',
    amount: 750000,
    currency: 'FCFA',
    method: 'card',
    status: 'failed',
    date: '2024-11-25T09:00:00',
  },
];

// Mock overdue invoices
const overdueInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-0089',
    organization: 'Cabinet Juridique Kouassi',
    amount: 350000,
    dueDate: '2024-11-15',
    daysOverdue: 13,
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-0078',
    organization: 'Test Organisation',
    amount: 150000,
    dueDate: '2024-11-10',
    daysOverdue: 18,
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-0065',
    organization: 'Startup XYZ',
    amount: 500000,
    dueDate: '2024-11-01',
    daysOverdue: 27,
  },
];

// Subscription distribution
const subscriptionsByPlan = [
  { plan: 'Enterprise', count: 12, revenue: 30000000, color: 'bg-advist-dark' },
  { plan: 'Business', count: 20, revenue: 15000000, color: 'bg-advist-dark' },
  { plan: 'Starter', count: 15, revenue: 5250000, color: 'bg-advist-success' },
];

export const BillingDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API refresh - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real implementation: await billingService.refreshDashboard();
    } catch (error) {
      console.error('Failed to refresh billing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-advist-success bg-green-50', label: 'Payé' };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-advist-gold-dark bg-advist-gold-light',
          label: 'En attente',
        };
      case 'failed':
        return { icon: XCircle, color: 'text-advist-error bg-advist-gold-light', label: 'Échoué' };
      default:
        return {
          icon: Clock,
          color: 'text-advist-text-secondary bg-advist-surface-dark',
          label: status,
        };
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard size={14} className="text-advist-gray900" />;
      case 'mobile_money':
        return <Wallet size={14} className="text-advist-gold-dark" />;
      case 'bank_transfer':
        return <Building2 size={14} className="text-advist-gray900" />;
      default:
        return <Receipt size={14} className="text-advist-text-secondary" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            {t('billing.title', 'Facturation')}
          </h1>
          <p className="text-advist-blue-light mt-1">
            {t('billing.subtitle', 'Gestion des abonnements, factures et paiements')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          <Link to="/superadmin/billing/invoices/new">
            <Button>
              <FileText size={18} className="mr-2" />
              Nouvelle facture
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {billingStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-advist-bg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-advist-blue-light">{stat.label}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-3xl font-bold text-advist-gray900">{stat.value}</p>
                  {stat.currency && (
                    <span className="text-sm text-advist-blue-light">{stat.currency}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp
                      size={14}
                      className={
                        stat.label.includes('Impayés') ? 'text-advist-error' : 'text-advist-success'
                      }
                    />
                  ) : (
                    <TrendingDown
                      size={14}
                      className={
                        stat.label.includes('attente') ? 'text-advist-success' : 'text-advist-error'
                      }
                    />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      (stat.label.includes('Impayés') && stat.trend === 'up') ||
                      (stat.label.includes('attente') && stat.trend === 'up')
                        ? 'text-advist-error'
                        : 'text-advist-success'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-advist-blue-light">ce mois</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/superadmin/billing/plans"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-advist-bg hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-advist-surface-dark rounded-xl">
            <CreditCard size={24} className="text-advist-gray900" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-advist-gray900">Plans</h3>
            <p className="text-sm text-advist-blue-light">Gérer les offres</p>
          </div>
          <ArrowRight
            size={18}
            className="text-advist-blue-light group-hover:translate-x-1 transition-transform"
          />
        </Link>

        <Link
          to="/superadmin/billing/subscriptions"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-advist-bg hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-advist-gold-light rounded-xl">
            <Users size={24} className="text-advist-gray900" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-advist-gray900">Abonnements</h3>
            <p className="text-sm text-advist-blue-light">47 actifs</p>
          </div>
          <ArrowRight
            size={18}
            className="text-advist-blue-light group-hover:translate-x-1 transition-transform"
          />
        </Link>

        <Link
          to="/superadmin/billing/invoices"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-advist-bg hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-advist-gold-light rounded-xl">
            <FileText size={24} className="text-advist-gold-dark" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-advist-gray900">Factures</h3>
            <p className="text-sm text-advist-blue-light">8 en attente</p>
          </div>
          <ArrowRight
            size={18}
            className="text-advist-blue-light group-hover:translate-x-1 transition-transform"
          />
        </Link>

        <Link
          to="/superadmin/billing/payments"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-advist-bg hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-green-50 rounded-xl">
            <Wallet size={24} className="text-advist-success" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-advist-gray900">Paiements</h3>
            <p className="text-sm text-advist-blue-light">Enregistrer</p>
          </div>
          <ArrowRight
            size={18}
            className="text-advist-blue-light group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-advist-bg overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-advist-bg">
            <div className="flex items-center gap-3">
              <Receipt size={18} className="text-advist-blue-light" />
              <h2 className="font-semibold text-advist-gray900">Transactions récentes</h2>
            </div>
            <Link
              to="/superadmin/billing/payments"
              className="text-sm text-advist-gray900 hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-advist-bg">
            {recentTransactions.map((tx) => {
              const status = getStatusBadge(tx.status);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-advist-bg/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-advist-dark rounded-xl flex items-center justify-center text-white font-semibold">
                      {tx.organization.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-advist-gray900">{tx.organization}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getMethodIcon(tx.method)}
                        <span className="text-xs text-advist-blue-light">
                          {new Date(tx.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-advist-gray900">
                      {formatCurrency(tx.amount)} {tx.currency}
                    </p>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.color}`}
                    >
                      <status.icon size={12} />
                      {status.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Overdue Invoices Alert */}
          <div className="bg-advist-gold-light border border-advist-gold rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-advist-gold-light rounded-xl">
                <AlertTriangle size={18} className="text-advist-error" />
              </div>
              <div>
                <h3 className="font-semibold text-advist-error">Factures impayées</h3>
                <p className="text-sm text-advist-error">
                  {overdueInvoices.length} factures en retard
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-advist-gray900">
                      {invoice.organization}
                    </p>
                    <p className="text-xs text-advist-blue-light">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-advist-error">
                      {formatCurrency(invoice.amount)} FCFA
                    </p>
                    <p className="text-xs text-advist-error">{invoice.daysOverdue}j de retard</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/superadmin/billing/invoices?status=overdue">
              <Button
                variant="outline"
                className="w-full mt-4 border-advist-gold text-advist-error hover:bg-advist-gold-light"
              >
                Gérer les impayés
              </Button>
            </Link>
          </div>

          {/* Revenue by Plan */}
          <div className="bg-white rounded-xl border border-advist-bg p-5">
            <h3 className="font-semibold text-advist-gray900 mb-4">Revenus par plan</h3>
            <div className="space-y-4">
              {subscriptionsByPlan.map((plan) => (
                <div key={plan.plan}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                      <span className="text-sm font-medium text-advist-gray900">{plan.plan}</span>
                    </div>
                    <span className="text-sm text-advist-blue-light">{plan.count} clients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-advist-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full ${plan.color}`}
                        style={{ width: `${(plan.revenue / 30000000) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-advist-gray900 whitespace-nowrap">
                      {formatCurrency(plan.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-advist-bg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-advist-gray900">Total</span>
                <span className="text-lg font-bold text-advist-gray900">
                  {formatCurrency(50250000)} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Renewals */}
          <div className="bg-advist-dark rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={18} className="text-advist-blue-light" />
              <h3 className="font-semibold">Renouvellements à venir</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cette semaine</span>
                  <span className="font-semibold">5 abonnements</span>
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ce mois</span>
                  <span className="font-semibold">12 abonnements</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
