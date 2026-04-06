import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Wallet,
  ArrowRight,
  XCircle,
  Sparkles,
  Plus,
  X,
  Info,
} from 'lucide-react';
import { Button, Modal, Badge } from '../../components/ui';
import { PrintButton } from '../../shared/PrintEngine';
import { PaymentForm, PaymentFormData } from '../../components/payment';
import { AddonCard } from '../../components/billing/AddonCard';
import { PlanDetailsModal } from '../../components/billing/PlanDetailsModal';
import {
  subscriptionsService,
  addonsService,
  SubscriptionAddon,
  AvailableAddon,
} from '../../services/subscriptions';
import { useTenantStore, getPlanInfo } from '../../stores/tenantStore';

// Mock client billing data
const mockSubscription = {
  id: '1',
  plan: {
    name: 'Business',
    price: 750000,
    features: [
      '50 utilisateurs max',
      '100 GB stockage',
      'Workflows illimités',
      'Support prioritaire',
    ],
  },
  status: 'active',
  currentPeriodStart: '2024-11-01',
  currentPeriodEnd: '2024-11-30',
  nextBillingDate: '2024-12-01',
};

const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-0092',
    total: 750000,
    amountPaid: 0,
    status: 'pending',
    issuedAt: '2024-11-01',
    dueDate: '2024-11-15',
    periodStart: '2024-11-01',
    periodEnd: '2024-11-30',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-0078',
    total: 750000,
    amountPaid: 750000,
    status: 'paid',
    issuedAt: '2024-10-01',
    dueDate: '2024-10-15',
    paidAt: '2024-10-12',
    periodStart: '2024-10-01',
    periodEnd: '2024-10-31',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-0065',
    total: 750000,
    amountPaid: 750000,
    status: 'paid',
    issuedAt: '2024-09-01',
    dueDate: '2024-09-15',
    paidAt: '2024-09-10',
    periodStart: '2024-09-01',
    periodEnd: '2024-09-30',
  },
];

const mockPaymentMethods = [
  {
    id: '1',
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
];

export const ClientBillingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTenant } = useTenantStore();
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false);

  // Get real plan info
  const plan = currentTenant?.plan || 'business';
  const planInfo = getPlanInfo(plan);

  // Addon states
  const [activeAddons, setActiveAddons] = useState<SubscriptionAddon[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AvailableAddon[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonActionLoading, setAddonActionLoading] = useState<string | null>(null);
  const [showAddAddonModal, setShowAddAddonModal] = useState(false);

  // Load addons on mount
  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    try {
      setAddonsLoading(true);
      // Using mock subscription ID - in real app, get from auth context
      const subscriptionId = mockSubscription.id;
      const [active, available] = await Promise.all([
        subscriptionsService.getActiveAddons(subscriptionId),
        subscriptionsService.getAvailableAddons(subscriptionId),
      ]);
      setActiveAddons(active);
      setAvailableAddons(available.filter(a => !a.is_active));
    } catch (err) {
      console.error('Error loading addons:', err);
      // For demo, use mock data
      setActiveAddons([]);
      setAvailableAddons([]);
    } finally {
      setAddonsLoading(false);
    }
  };

  const handleAddAddon = async (addonId: string) => {
    try {
      setAddonActionLoading(addonId);
      await subscriptionsService.addAddon(mockSubscription.id, addonId);
      await loadAddons();
      setShowAddAddonModal(false);
    } catch (err) {
      console.error('Error adding addon:', err);
    } finally {
      setAddonActionLoading(null);
    }
  };

  const handleRemoveAddon = async (addonId: string) => {
    try {
      setAddonActionLoading(addonId);
      await subscriptionsService.removeAddon(mockSubscription.id, addonId);
      await loadAddons();
    } catch (err) {
      console.error('Error removing addon:', err);
    } finally {
      setAddonActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'bg-advist-gold-light text-advist-gray900', label: 'En attente' };
      case 'paid':
        return { icon: CheckCircle, color: 'bg-green-50 text-advist-success', label: 'Payée' };
      case 'overdue':
        return { icon: AlertTriangle, color: 'bg-advist-gold-light text-advist-error', label: 'En retard' };
      default:
        return { icon: Clock, color: 'bg-advist-surface-dark text-advist-gray900', label: status };
    }
  };

  const pendingInvoices = mockInvoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0);

  const handlePayment = async (data: PaymentFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Payment data:', data);
    setPaymentSuccess(true);
    setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">Facturation</h1>
          <p className="text-advist-blue-light mt-1">
            Gérez votre abonnement et vos paiements
          </p>
        </div>
        <PrintButton config={{ title: 'Facturation', appName: 'Advist' }}>
          <div>
            <h2 className="text-lg font-bold mb-4">Historique des factures</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">N° Facture</th>
                  <th className="text-left py-2">Période</th>
                  <th className="text-left py-2">Montant</th>
                  <th className="text-left py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2">{inv.invoiceNumber}</td>
                    <td className="py-2">{new Date(inv.periodStart).toLocaleDateString('fr-FR')} - {new Date(inv.periodEnd).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2">{formatCurrency(inv.total)} FCFA</td>
                    <td className="py-2">{inv.status === 'paid' ? 'Payée' : inv.status === 'pending' ? 'En attente' : inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintButton>
      </div>

      {/* Alert for pending invoices */}
      {pendingInvoices.length > 0 && (
        <div className="p-4 bg-advist-gold-light border border-advist-gold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-gold-light rounded-xl">
              <AlertTriangle size={20} className="text-advist-gold-dark" />
            </div>
            <div>
              <p className="font-medium text-advist-gold-dark">
                {pendingInvoices.length} facture{pendingInvoices.length > 1 ? 's' : ''} en attente de paiement
              </p>
              <p className="text-sm text-advist-gold-dark">
                Montant total: {formatCurrency(totalPending)} FCFA
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedInvoice(pendingInvoices[0]);
              setShowPaymentModal(true);
            }}
          >
            <CreditCard size={18} className="mr-2" />
            Payer maintenant
          </Button>
        </div>
      )}

      {/* Subscription Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-advist-bg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-advist-gray900">Votre abonnement</h2>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              currentTenant?.status === 'active' ? 'bg-green-50 text-advist-success' :
              currentTenant?.status === 'trial' ? 'bg-blue-50 text-blue-600' :
              'bg-advist-gold-light text-advist-gold-dark'
            }`}>
              <CheckCircle size={14} />
              {currentTenant?.status === 'active' ? 'Actif' :
               currentTenant?.status === 'trial' ? 'Essai' : 'En attente'}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-advist-gray900">{planInfo.name}</span>
                <span className="text-advist-blue-light">Plan</span>
                {plan === 'business' && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    Populaire
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-advist-gray900 mt-2">
                {planInfo.price === '0' ? (
                  <span>Gratuit</span>
                ) : (
                  <>
                    {planInfo.price} <span className="text-sm font-normal text-advist-blue-light">{planInfo.period}</span>
                  </>
                )}
              </p>
              {currentTenant?.subscription?.trialEndsAt && currentTenant.status === 'trial' && (
                <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
                  <Calendar size={16} />
                  <span>Fin de l'essai: {new Date(currentTenant.subscription.trialEndsAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {currentTenant?.subscription?.expiresAt && currentTenant.status === 'active' && (
                <div className="flex items-center gap-2 mt-3 text-sm text-advist-blue-light">
                  <Calendar size={16} />
                  <span>Prochain renouvellement: {new Date(currentTenant.subscription.expiresAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => setShowPlanDetailsModal(true)}>
                <Info size={18} className="mr-2" />
                Voir les details
              </Button>
              <Button variant="outline" onClick={() => navigate('/checkout')}>
                <TrendingUp size={18} className="mr-2" />
                Changer de plan
              </Button>
            </div>
          </div>

          {/* Plan Features */}
          <div className="mt-6 pt-6 border-t border-advist-bg">
            <p className="text-sm font-medium text-advist-gray900 mb-3">Inclus dans votre plan:</p>
            <div className="grid grid-cols-2 gap-3">
              {planInfo.features.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-advist-blue-light">
                  <CheckCircle size={14} className="text-advist-success" />
                  {feature}
                </div>
              ))}
            </div>
            {planInfo.features.length > 8 && (
              <button
                onClick={() => setShowPlanDetailsModal(true)}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + {planInfo.features.length - 8} autres fonctionnalites...
              </button>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl border border-advist-bg p-6">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-4">Moyen de paiement</h2>

          {mockPaymentMethods.length > 0 ? (
            <div className="space-y-3">
              {mockPaymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-advist-bg rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-br from-primary-900 to-primary-800 rounded-lg flex items-center justify-center">
                      <CreditCard size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-advist-gray900">
                        {method.brand} •••• {method.last4}
                      </p>
                      <p className="text-xs text-advist-blue-light">
                        Expire {method.expiryMonth}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="text-xs bg-advist-dark text-white px-2 py-1 rounded-full">
                      Par défaut
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Wallet size={32} className="mx-auto text-advist-blue-light mb-2" />
              <p className="text-sm text-advist-blue-light">Aucun moyen de paiement enregistré</p>
            </div>
          )}

          <Button variant="outline" className="w-full mt-4">
            <CreditCard size={18} className="mr-2" />
            Ajouter une carte
          </Button>
        </div>
      </div>

      {/* Addons Section */}
      <div className="bg-white rounded-xl border border-advist-bg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-advist-gray900">Options et Add-ons</h2>
              <p className="text-sm text-advist-blue-light">
                Boostez votre abonnement avec des options supplementaires
              </p>
            </div>
          </div>
          {availableAddons.length > 0 && (
            <Button onClick={() => setShowAddAddonModal(true)}>
              <Plus size={18} className="mr-2" />
              Ajouter une option
            </Button>
          )}
        </div>

        {addonsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : activeAddons.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-advist-blue-light">Options actives</h3>
            <div className="space-y-3">
              {activeAddons.map((addon) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  isActive={true}
                  isLoading={addonActionLoading === addon.addon}
                  onRemove={handleRemoveAddon}
                  compact
                />
              ))}
            </div>
            {/* Total addons cost */}
            <div className="pt-4 border-t border-advist-bg flex items-center justify-between">
              <span className="text-sm text-advist-blue-light">Total options/mois</span>
              <span className="font-semibold text-advist-gray900">
                {formatCurrency(activeAddons.reduce((sum, a) => sum + a.price, 0))} FCFA
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-advist-bg/50 rounded-xl">
            <Sparkles size={32} className="mx-auto text-advist-blue-light mb-3" />
            <p className="text-advist-gray900 font-medium mb-1">Aucune option active</p>
            <p className="text-sm text-advist-blue-light mb-4">
              Decouvrez nos options pour ameliorer votre experience
            </p>
            {availableAddons.length > 0 && (
              <Button variant="outline" onClick={() => setShowAddAddonModal(true)}>
                <Plus size={16} className="mr-2" />
                Voir les options disponibles
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Addon Modal */}
      <Modal
        isOpen={showAddAddonModal}
        onClose={() => setShowAddAddonModal(false)}
        title="Options disponibles"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-advist-blue-light">
            Ajoutez des options pour ameliorer votre abonnement {mockSubscription.plan.name}.
          </p>
          {availableAddons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableAddons.map((item) => (
                <AddonCard
                  key={item.addon.id}
                  addon={item.addon}
                  price={item.price}
                  isActive={false}
                  isLoading={addonActionLoading === item.addon.id}
                  onAdd={handleAddAddon}
                  showFeatures
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-advist-blue-light">Aucune option disponible pour votre plan.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-advist-bg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-advist-bg">
          <h2 className="text-lg font-semibold text-advist-gray900">Historique des factures</h2>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Tout télécharger
          </Button>
        </div>

        <div className="divide-y divide-advist-bg">
          {mockInvoices.map((invoice) => {
            const status = getStatusConfig(invoice.status);
            const isPending = invoice.status === 'pending' || invoice.status === 'overdue';

            return (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 hover:bg-advist-bg/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    invoice.status === 'paid' ? 'bg-green-50' : 'bg-advist-gold-light'
                  }`}>
                    <FileText size={18} className={invoice.status === 'paid' ? 'text-advist-success' : 'text-advist-gold-dark'} />
                  </div>
                  <div>
                    <p className="font-medium text-advist-gray900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-advist-blue-light">
                      {new Date(invoice.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-advist-gray900">{formatCurrency(invoice.total)} FCFA</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <status.icon size={10} />
                      {status.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowInvoiceModal(true);
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download size={16} />
                    </Button>
                    {isPending && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowPaymentModal(true);
                        }}
                      >
                        Payer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title={`Facture ${selectedInvoice?.invoiceNumber}`}
        size="md"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-4 bg-advist-bg rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-advist-blue-light">Période</p>
                  <p className="font-medium text-advist-gray900">
                    {new Date(selectedInvoice.periodStart).toLocaleDateString('fr-FR')} - {new Date(selectedInvoice.periodEnd).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(selectedInvoice.status).color}`}>
                  {React.createElement(getStatusConfig(selectedInvoice.status).icon, { size: 14 })}
                  {getStatusConfig(selectedInvoice.status).label}
                </div>
              </div>
            </div>

            <div className="border border-advist-bg rounded-xl overflow-hidden">
              <div className="p-4 border-b border-advist-bg flex justify-between">
                <span>Abonnement {mockSubscription.plan.name}</span>
                <span className="font-medium">{formatCurrency(selectedInvoice.total)} FCFA</span>
              </div>
              <div className="p-4 bg-advist-bg flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-advist-gray900">{formatCurrency(selectedInvoice.total)} FCFA</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Download size={16} className="mr-2" />
                Télécharger PDF
              </Button>
              {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setShowPaymentModal(true);
                  }}
                >
                  <CreditCard size={16} className="mr-2" />
                  Payer maintenant
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          if (!paymentSuccess) {
            setShowPaymentModal(false);
          }
        }}
        title={paymentSuccess ? '' : 'Payer la facture'}
        size="md"
      >
        {paymentSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-advist-success" />
            </div>
            <h3 className="text-xl font-bold text-advist-gray900 mb-2">Paiement réussi!</h3>
            <p className="text-advist-blue-light">
              Votre paiement a été traité avec succès.
            </p>
          </div>
        ) : selectedInvoice ? (
          <PaymentForm
            amount={selectedInvoice.total - selectedInvoice.amountPaid}
            currency="XOF"
            invoiceNumber={selectedInvoice.invoiceNumber}
            onSubmit={handlePayment}
            onCancel={() => setShowPaymentModal(false)}
          />
        ) : null}
      </Modal>

      {/* Plan Details Modal */}
      <PlanDetailsModal
        isOpen={showPlanDetailsModal}
        onClose={() => setShowPlanDetailsModal(false)}
        onUpgrade={() => {
          setShowPlanDetailsModal(false);
          navigate('/checkout');
        }}
      />
    </div>
  );
};

export default ClientBillingPage;
