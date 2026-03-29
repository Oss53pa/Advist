import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Building2,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { Button } from '../ui';

// Types
interface RecentPayment {
  id: string;
  organization: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  gateway: string;
  createdAt: string;
}

interface NewSubscription {
  id: string;
  organization: string;
  plan: string;
  amount: number;
  currency: string;
  createdAt: string;
}

interface PaymentStats {
  todayRevenue: number;
  monthlyRevenue: number;
  newSubscriptions: number;
  pendingPayments: number;
  failedPayments: number;
}

// Mock data - in real app, fetch from API
const mockPaymentStats: PaymentStats = {
  todayRevenue: 456000,
  monthlyRevenue: 8750000,
  newSubscriptions: 12,
  pendingPayments: 3,
  failedPayments: 2,
};

const mockRecentPayments: RecentPayment[] = [
  {
    id: '1',
    organization: 'Societe Generale CI',
    amount: 199000,
    currency: 'XOF',
    status: 'completed',
    gateway: 'stripe',
    createdAt: '2 min',
  },
  {
    id: '2',
    organization: 'Orange CI',
    amount: 79000,
    currency: 'XOF',
    status: 'completed',
    gateway: 'paydunya',
    createdAt: '15 min',
  },
  {
    id: '3',
    organization: 'Cabinet Kouassi',
    amount: 29000,
    currency: 'XOF',
    status: 'pending',
    gateway: 'paydunya',
    createdAt: '1h',
  },
  {
    id: '4',
    organization: 'Tech Solutions',
    amount: 79000,
    currency: 'XOF',
    status: 'failed',
    gateway: 'flutterwave',
    createdAt: '2h',
  },
];

const mockNewSubscriptions: NewSubscription[] = [
  {
    id: '1',
    organization: 'ABC Consulting',
    plan: 'Business',
    amount: 79000,
    currency: 'XOF',
    createdAt: '10 min',
  },
  {
    id: '2',
    organization: 'StartupXYZ',
    plan: 'Starter',
    amount: 29000,
    currency: 'XOF',
    createdAt: '45 min',
  },
  {
    id: '3',
    organization: 'Grand Hotel',
    plan: 'Enterprise',
    amount: 199000,
    currency: 'XOF',
    createdAt: '2h',
  },
];

const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Reussi' };
    case 'pending':
      return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'En attente' };
    case 'failed':
      return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Echoue' };
    default:
      return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: status };
  }
};

interface PaymentNotificationsWidgetProps {
  compact?: boolean;
}

export const PaymentNotificationsWidget: React.FC<PaymentNotificationsWidgetProps> = ({
  compact = false,
}) => {
  const stats = mockPaymentStats;
  const recentPayments = mockRecentPayments;
  const newSubscriptions = mockNewSubscriptions;

  if (compact) {
    // Compact version for sidebar or small spaces
    return (
      <div className="bg-white rounded-xl border border-advist-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-advist-gold" />
            <h3 className="font-semibold text-advist-gray900">Paiements</h3>
          </div>
          <Link to="/superadmin/billing" className="text-sm text-advist-gold hover:underline">
            Voir tout
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-advist-text-secondary">Aujourd'hui</span>
            <span className="font-semibold text-advist-gray900">
              {formatCurrency(stats.todayRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-advist-text-secondary">Nouvelles souscriptions</span>
            <span className="font-semibold text-green-600">+{stats.newSubscriptions}</span>
          </div>
          {stats.pendingPayments > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-advist-text-secondary">En attente</span>
              <span className="font-semibold text-amber-600">{stats.pendingPayments}</span>
            </div>
          )}
          {stats.failedPayments > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-advist-text-secondary">Echoues</span>
              <span className="font-semibold text-red-600">{stats.failedPayments}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-advist-gold to-amber-500 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Revenus aujourd'hui</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.todayRevenue)}</p>
            </div>
            <DollarSign size={32} className="opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-advist-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-advist-text-secondary">MRR</p>
              <p className="text-2xl font-bold text-advist-gray900 mt-1">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-advist-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-advist-text-secondary">Nouvelles souscriptions</p>
              <p className="text-2xl font-bold text-green-600 mt-1">+{stats.newSubscriptions}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Building2 size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-advist-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-advist-text-secondary">Paiements en attente</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingPayments}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-advist-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-advist-border">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-advist-text-secondary" />
              <h3 className="font-semibold text-advist-gray900">Derniers paiements</h3>
            </div>
            <Link
              to="/superadmin/billing/payments"
              className="text-sm text-advist-gold hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-advist-border">
            {recentPayments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={payment.id} className="p-4 hover:bg-advist-surface-dark transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                        <StatusIcon size={16} className={statusConfig.color} />
                      </div>
                      <div>
                        <p className="font-medium text-advist-gray900">{payment.organization}</p>
                        <p className="text-xs text-advist-text-secondary">
                          {payment.gateway} - {payment.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-advist-gray900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Subscriptions */}
        <div className="bg-white rounded-xl border border-advist-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-advist-border">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-advist-text-secondary" />
              <h3 className="font-semibold text-advist-gray900">Nouvelles souscriptions</h3>
            </div>
            <Link
              to="/superadmin/billing/subscriptions"
              className="text-sm text-advist-gold hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-advist-border">
            {newSubscriptions.map((sub) => (
              <div key={sub.id} className="p-4 hover:bg-advist-surface-dark transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-advist-gray900">{sub.organization}</p>
                      <p className="text-xs text-advist-text-secondary">
                        Plan {sub.plan} - {sub.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-advist-gray900">
                      {formatCurrency(sub.amount, sub.currency)}
                    </p>
                    <p className="text-xs text-green-600">/mois</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => window.location.href = '/superadmin/billing'}>
          <BarChart3 size={18} className="mr-2" />
          Tableau de bord facturation
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/superadmin/billing/settings'}>
          <CreditCard size={18} className="mr-2" />
          Configurer passerelles
        </Button>
      </div>
    </div>
  );
};

export default PaymentNotificationsWidget;
