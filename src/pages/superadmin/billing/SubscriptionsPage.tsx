import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  _Filter,
  _MoreVertical,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  _ArrowDownRight,
  _Calendar,
  _Building2,
  Loader2,
} from 'lucide-react';
import { Button, Modal } from '../../../components/ui';
import { subscriptionsService, Subscription } from '../../../services/subscriptions';

// Mock subscriptions data
const mockSubscriptions = [
  {
    id: '1',
    organization: {
      id: '1',
      name: 'Société Générale CI',
      slug: 'sgci',
    },
    plan: { name: 'Enterprise', price: 2500000 },
    status: 'active',
    currentPeriodStart: '2024-11-01',
    currentPeriodEnd: '2024-11-30',
    trialEndsAt: null,
    gracePeriodEndsAt: null,
    failedPaymentCount: 0,
    startedAt: '2023-06-01',
  },
  {
    id: '2',
    organization: {
      id: '2',
      name: "Orange Côte d'Ivoire",
      slug: 'orange-ci',
    },
    plan: { name: 'Enterprise', price: 2500000 },
    status: 'active',
    currentPeriodStart: '2024-11-15',
    currentPeriodEnd: '2024-12-14',
    trialEndsAt: null,
    gracePeriodEndsAt: null,
    failedPaymentCount: 0,
    startedAt: '2023-09-15',
  },
  {
    id: '3',
    organization: {
      id: '3',
      name: 'Cabinet Juridique Kouassi',
      slug: 'cjk',
    },
    plan: { name: 'Starter', price: 350000 },
    status: 'past_due',
    currentPeriodStart: '2024-10-20',
    currentPeriodEnd: '2024-11-19',
    trialEndsAt: null,
    gracePeriodEndsAt: '2024-11-26',
    failedPaymentCount: 2,
    startedAt: '2024-03-20',
  },
  {
    id: '4',
    organization: {
      id: '4',
      name: 'ADVIST Demo',
      slug: 'advist-demo',
    },
    plan: { name: 'Business', price: 750000 },
    status: 'active',
    currentPeriodStart: '2024-11-01',
    currentPeriodEnd: '2024-11-30',
    trialEndsAt: null,
    gracePeriodEndsAt: null,
    failedPaymentCount: 0,
    startedAt: '2024-01-15',
  },
  {
    id: '5',
    organization: {
      id: '5',
      name: 'Test Organisation',
      slug: 'test-org',
    },
    plan: { name: 'Starter', price: 350000 },
    status: 'trial',
    currentPeriodStart: '2024-11-01',
    currentPeriodEnd: '2024-11-14',
    trialEndsAt: '2024-11-14',
    gracePeriodEndsAt: null,
    failedPaymentCount: 0,
    startedAt: '2024-11-01',
  },
  {
    id: '6',
    organization: {
      id: '6',
      name: 'Startup XYZ',
      slug: 'startup-xyz',
    },
    plan: { name: 'Business', price: 750000 },
    status: 'suspended',
    currentPeriodStart: '2024-10-01',
    currentPeriodEnd: '2024-10-31',
    trialEndsAt: null,
    gracePeriodEndsAt: '2024-11-07',
    failedPaymentCount: 3,
    startedAt: '2024-05-01',
  },
];

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'trial', label: "Période d'essai" },
  { value: 'active', label: 'Actif' },
  { value: 'past_due', label: 'Paiement en retard' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'cancelled', label: 'Annulé' },
];

export const SubscriptionsPage: React.FC = () => {
  const { _t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'reactivate' | 'cancel' | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Data fetching states
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Fetch subscriptions on mount and when filters change
  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subscriptionsService.list({
        status: statusFilter || undefined,
      });
      setSubscriptions(response.results);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setError('Impossible de charger les abonnements');
      // Fallback to mock data in case of error (for development)
      setSubscriptions(mockSubscriptions as unknown as Subscription[]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'trial':
        return { icon: Clock, color: 'bg-advist-gold-light text-advist-gray900', label: 'Essai' };
      case 'active':
        return { icon: CheckCircle, color: 'bg-green-50 text-advist-success', label: 'Actif' };
      case 'past_due':
        return {
          icon: AlertTriangle,
          color: 'bg-advist-gold-light text-advist-gold-dark',
          label: 'Impayé',
        };
      case 'suspended':
        return { icon: Lock, color: 'bg-advist-gold-light text-advist-error', label: 'Suspendu' };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'bg-advist-surface-dark text-advist-gray900',
          label: 'Annulé',
        };
      default:
        return { icon: Clock, color: 'bg-advist-surface-dark text-advist-gray900', label: status };
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.organization.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (
    subscription: Subscription,
    action: 'suspend' | 'reactivate' | 'cancel'
  ) => {
    setSelectedSubscription(subscription);
    setActionType(action);
    setSuspendReason('');
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if (!selectedSubscription || !actionType) return;

    setIsExecutingAction(true);
    try {
      switch (actionType) {
        case 'suspend':
          await subscriptionsService.suspend(selectedSubscription.id, {
            reason: suspendReason || undefined,
          });
          break;
        case 'reactivate':
          await subscriptionsService.reactivate(selectedSubscription.id);
          break;
        case 'cancel':
          await subscriptionsService.cancel(selectedSubscription.id, {
            reason: suspendReason || undefined,
          });
          break;
      }

      // Refresh the list after action
      await fetchSubscriptions();
      setShowActionModal(false);
      setActionType(null);
      setSuspendReason('');
    } catch (err) {
      console.error(`Failed to ${actionType} subscription:`, err);
      setError(
        `Impossible de ${actionType === 'suspend' ? 'suspendre' : actionType === 'reactivate' ? 'réactiver' : 'annuler'} l'abonnement`
      );
    } finally {
      setIsExecutingAction(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">Abonnements</h1>
          <p className="text-advist-blue-light mt-1">Gérer les abonnements des organisations</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} className="text-advist-error" />
          <p className="text-advist-error">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-advist-error hover:text-advist-error"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: subscriptions.length, color: 'bg-advist-surface-dark' },
          {
            label: 'Actifs',
            value: subscriptions.filter((s) => s.status === 'active').length,
            color: 'bg-green-50',
          },
          {
            label: 'Essai',
            value: subscriptions.filter((s) => s.status === 'trial').length,
            color: 'bg-advist-gold-light',
          },
          {
            label: 'Impayés',
            value: subscriptions.filter((s) => s.status === 'past_due').length,
            color: 'bg-advist-gold-light',
          },
          {
            label: 'Suspendus',
            value: subscriptions.filter((s) => s.status === 'suspended').length,
            color: 'bg-advist-gold-light',
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-bold text-advist-gray900">{isLoading ? '-' : stat.value}</p>
            <p className="text-sm text-advist-blue-light">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light"
          />
          <input
            type="text"
            placeholder="Rechercher une organisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-advist-bg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-advist-blue-light" />
            <span className="ml-3 text-advist-blue-light">Chargement des abonnements...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-advist-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Période
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Prix
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-advist-blue-light uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-advist-bg">
                {filteredSubscriptions.map((sub) => {
                  const status = getStatusConfig(sub.status);
                  const daysLeft = Math.ceil(
                    (new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr key={sub.id} className="hover:bg-advist-bg/50 transition-all">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-advist-dark rounded-xl flex items-center justify-center text-white font-semibold">
                            {sub.organization.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-advist-gray900">
                              {sub.organization.name}
                            </p>
                            <p className="text-xs text-advist-blue-light">
                              {sub.organization.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-advist-gray900">{sub.plan.name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                        >
                          <status.icon size={12} />
                          {status.label}
                        </div>
                        {sub.status === 'past_due' && sub.gracePeriodEndsAt && (
                          <p className="text-xs text-advist-gold-dark mt-1">
                            Grâce jusqu'au{' '}
                            {new Date(sub.gracePeriodEndsAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        {sub.status === 'trial' && sub.trialEndsAt && (
                          <p className="text-xs text-advist-gray900 mt-1">
                            Fin essai: {new Date(sub.trialEndsAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-advist-gray900">
                            {new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR')}
                          </p>
                          <p
                            className={`text-xs ${daysLeft <= 7 ? 'text-advist-gold-dark' : 'text-advist-blue-light'}`}
                          >
                            {daysLeft > 0 ? `${daysLeft}j restants` : 'Expiré'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-advist-gray900">
                          {formatCurrency(sub.plan.price)} FCFA
                        </p>
                        <p className="text-xs text-advist-blue-light">/mois</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>

                          {sub.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-advist-gold-dark hover:bg-advist-gold-light"
                              onClick={() => handleAction(sub, 'suspend')}
                            >
                              <Pause size={16} />
                            </Button>
                          )}

                          {sub.status === 'suspended' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-advist-success hover:bg-green-50"
                              onClick={() => handleAction(sub, 'reactivate')}
                            >
                              <Unlock size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Abonnement - ${selectedSubscription?.organization.name}`}
        size="lg"
      >
        {selectedSubscription && (
          <div className="space-y-6">
            {/* Status Banner */}
            {selectedSubscription.status === 'suspended' && (
              <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-xl flex items-center gap-3">
                <Lock size={20} className="text-advist-error" />
                <div>
                  <p className="font-medium text-advist-error">Compte suspendu</p>
                  <p className="text-sm text-advist-error">
                    L'organisation ne peut plus accéder à l'application
                  </p>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Plan</p>
                <p className="font-semibold text-advist-gray900">
                  {selectedSubscription.plan.name}
                </p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Prix mensuel</p>
                <p className="font-semibold text-advist-gray900">
                  {formatCurrency(selectedSubscription.plan.price)} FCFA
                </p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Début abonnement</p>
                <p className="font-semibold text-advist-gray900">
                  {new Date(selectedSubscription.startedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Fin période</p>
                <p className="font-semibold text-advist-gray900">
                  {new Date(selectedSubscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Payment History */}
            {selectedSubscription.failedPaymentCount > 0 && (
              <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-advist-gold-dark" />
                  <span className="font-medium text-advist-gold-dark">Paiements échoués</span>
                </div>
                <p className="text-sm text-advist-gold-dark">
                  {selectedSubscription.failedPaymentCount} tentative(s) de paiement échouée(s)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-advist-bg">
              <Button variant="outline" className="flex-1">
                <RefreshCw size={16} className="mr-2" />
                Renouveler
              </Button>
              {selectedSubscription.status === 'active' ? (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleAction(selectedSubscription, 'suspend');
                  }}
                >
                  <Lock size={16} className="mr-2" />
                  Suspendre
                </Button>
              ) : selectedSubscription.status === 'suspended' ? (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleAction(selectedSubscription, 'reactivate');
                  }}
                >
                  <Unlock size={16} className="mr-2" />
                  Réactiver
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={
          actionType === 'suspend'
            ? "Suspendre l'abonnement"
            : actionType === 'reactivate'
              ? "Réactiver l'abonnement"
              : "Annuler l'abonnement"
        }
        size="sm"
      >
        <div className="space-y-4">
          {actionType === 'suspend' && (
            <>
              <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-advist-gold-dark mt-0.5" />
                <div>
                  <p className="font-medium text-advist-gold-dark">Attention</p>
                  <p className="text-sm text-advist-gold-dark">
                    La suspension bloquera l'accès de l'organisation à l'application. Les
                    utilisateurs ne pourront plus se connecter.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Raison de la suspension
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                  rows={3}
                  placeholder="Ex: Facture impayée depuis 30 jours..."
                />
              </div>
            </>
          )}

          {actionType === 'reactivate' && (
            <div className="p-4 bg-green-50 border border-advist-success rounded-xl flex items-start gap-3">
              <CheckCircle size={20} className="text-advist-success mt-0.5" />
              <div>
                <p className="font-medium text-advist-success">Réactivation</p>
                <p className="text-sm text-advist-success">
                  L'organisation retrouvera immédiatement l'accès à l'application.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowActionModal(false)}
              disabled={isExecutingAction}
            >
              Annuler
            </Button>
            <Button
              variant={actionType === 'suspend' ? 'danger' : 'primary'}
              className="flex-1"
              onClick={executeAction}
              disabled={isExecutingAction}
            >
              {isExecutingAction ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {actionType === 'suspend' ? 'Suspension...' : 'Réactivation...'}
                </>
              ) : actionType === 'suspend' ? (
                'Suspendre'
              ) : (
                'Réactiver'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;
