import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Search,
  Plus,
  Download,
  _Send,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  _Filter,
  _Calendar,
  _MoreVertical,
  CreditCard,
  Printer,
} from 'lucide-react';
import { Button, Modal } from '../../../components/ui';

// Mock invoices data
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-0095',
    organization: 'Société Générale CI',
    subscription: { plan: 'Enterprise' },
    total: 2500000,
    amountPaid: 2500000,
    currency: 'XOF',
    status: 'paid',
    issuedAt: '2024-11-01T10:00:00',
    dueDate: '2024-11-15',
    paidAt: '2024-11-10T14:30:00',
    periodStart: '2024-11-01',
    periodEnd: '2024-11-30',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-0094',
    organization: "Orange Côte d'Ivoire",
    subscription: { plan: 'Enterprise' },
    total: 2500000,
    amountPaid: 2500000,
    currency: 'XOF',
    status: 'paid',
    issuedAt: '2024-11-01T10:00:00',
    dueDate: '2024-11-15',
    paidAt: '2024-11-12T09:15:00',
    periodStart: '2024-11-01',
    periodEnd: '2024-11-30',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-0093',
    organization: 'Cabinet Juridique Kouassi',
    subscription: { plan: 'Starter' },
    total: 350000,
    amountPaid: 0,
    currency: 'XOF',
    status: 'overdue',
    issuedAt: '2024-10-20T10:00:00',
    dueDate: '2024-11-03',
    paidAt: null,
    periodStart: '2024-10-20',
    periodEnd: '2024-11-19',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-0092',
    organization: 'ADVIST Demo',
    subscription: { plan: 'Business' },
    total: 750000,
    amountPaid: 0,
    currency: 'XOF',
    status: 'pending',
    issuedAt: '2024-11-01T10:00:00',
    dueDate: '2024-11-15',
    paidAt: null,
    periodStart: '2024-11-01',
    periodEnd: '2024-11-30',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-0091',
    organization: 'Test Organisation',
    subscription: { plan: 'Starter' },
    total: 350000,
    amountPaid: 175000,
    currency: 'XOF',
    status: 'partial',
    issuedAt: '2024-10-15T10:00:00',
    dueDate: '2024-10-29',
    paidAt: null,
    periodStart: '2024-10-15',
    periodEnd: '2024-11-14',
  },
  {
    id: '6',
    invoiceNumber: 'INV-2024-0090',
    organization: 'Startup XYZ',
    subscription: { plan: 'Business' },
    total: 750000,
    amountPaid: 0,
    currency: 'XOF',
    status: 'overdue',
    issuedAt: '2024-10-01T10:00:00',
    dueDate: '2024-10-15',
    paidAt: null,
    periodStart: '2024-10-01',
    periodEnd: '2024-10-31',
  },
];

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payée' },
  { value: 'partial', label: 'Partielle' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulée' },
];

export const InvoicesPage: React.FC = () => {
  const { _t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<(typeof mockInvoices)[0] | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          icon: FileText,
          color: 'bg-advist-surface-dark text-advist-gray900',
          label: 'Brouillon',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-advist-gold-light text-advist-gray900',
          label: 'En attente',
        };
      case 'paid':
        return { icon: CheckCircle, color: 'bg-green-50 text-advist-success', label: 'Payée' };
      case 'partial':
        return {
          icon: Clock,
          color: 'bg-advist-gold-light text-advist-gold-dark',
          label: 'Partielle',
        };
      case 'overdue':
        return {
          icon: AlertTriangle,
          color: 'bg-advist-gold-light text-advist-error',
          label: 'En retard',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'bg-advist-surface-dark text-advist-gray900',
          label: 'Annulée',
        };
      default:
        return { icon: Clock, color: 'bg-advist-surface-dark text-advist-gray900', label: status };
    }
  };

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">Factures</h1>
          <p className="text-advist-blue-light mt-1">Gérer les factures et les paiements</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download size={18} className="mr-2" />
            Exporter
          </Button>
          <Button>
            <Plus size={18} className="mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <p className="text-sm text-advist-blue-light">Total facturé</p>
          <p className="text-2xl font-bold text-advist-gray900 mt-1">
            {formatCurrency(totalAmount)} <span className="text-sm font-normal">FCFA</span>
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-advist-success">
          <p className="text-sm text-advist-success">Montant payé</p>
          <p className="text-2xl font-bold text-advist-success mt-1">
            {formatCurrency(paidAmount)} <span className="text-sm font-normal">FCFA</span>
          </p>
        </div>
        <div className="bg-advist-gold-light rounded-xl p-4 border border-advist-gold">
          <p className="text-sm text-advist-gold-dark">En attente</p>
          <p className="text-2xl font-bold text-advist-gold-dark mt-1">
            {formatCurrency(pendingAmount)} <span className="text-sm font-normal">FCFA</span>
          </p>
        </div>
        <div className="bg-advist-gold-light rounded-xl p-4 border border-advist-gold">
          <p className="text-sm text-advist-error">En retard</p>
          <p className="text-2xl font-bold text-advist-error mt-1">
            {mockInvoices.filter((i) => i.status === 'overdue').length} factures
          </p>
        </div>
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
            placeholder="Rechercher par numéro ou organisation..."
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-advist-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Facture
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Organisation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Montant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Échéance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-advist-blue-light uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-advist-bg">
              {filteredInvoices.map((invoice) => {
                const status = getStatusConfig(invoice.status);
                const isOverdue = invoice.status === 'overdue';
                const daysOverdue = isOverdue
                  ? Math.ceil(
                      (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <tr key={invoice.id} className="hover:bg-advist-bg/50 transition-all">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-advist-gray900">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-advist-blue-light">
                          {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-advist-dark rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                          {invoice.organization.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-advist-gray900">{invoice.organization}</p>
                          <p className="text-xs text-advist-blue-light">
                            {invoice.subscription.plan}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-advist-gray900">
                          {formatCurrency(invoice.total)} FCFA
                        </p>
                        {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
                          <p className="text-xs text-advist-success">
                            Payé: {formatCurrency(invoice.amountPaid)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p
                          className={`text-sm ${isOverdue ? 'text-advist-error font-medium' : 'text-advist-gray900'}`}
                        >
                          {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                        {isOverdue && (
                          <p className="text-xs text-advist-error">{daysOverdue}j de retard</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <status.icon size={12} />
                        {status.label}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download size={16} />
                        </Button>
                        {(invoice.status === 'pending' ||
                          invoice.status === 'partial' ||
                          invoice.status === 'overdue') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-advist-success hover:bg-green-50"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentModal(true);
                            }}
                          >
                            <CreditCard size={16} />
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
      </div>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Facture ${selectedInvoice?.invoiceNumber}`}
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="flex justify-between items-start p-4 bg-advist-bg rounded-xl">
              <div>
                <h3 className="text-lg font-bold text-advist-gray900">
                  {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-sm text-advist-blue-light">
                  Émise le {new Date(selectedInvoice.issuedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusConfig(selectedInvoice.status).color}`}
              >
                {React.createElement(getStatusConfig(selectedInvoice.status).icon, { size: 14 })}
                {getStatusConfig(selectedInvoice.status).label}
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light mb-1">Client</p>
                <p className="font-semibold text-advist-gray900">{selectedInvoice.organization}</p>
                <p className="text-sm text-advist-blue-light mt-1">
                  Plan {selectedInvoice.subscription.plan}
                </p>
              </div>
              <div className="p-4 border border-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light mb-1">Période</p>
                <p className="font-semibold text-advist-gray900">
                  {new Date(selectedInvoice.periodStart).toLocaleDateString('fr-FR')} -{' '}
                  {new Date(selectedInvoice.periodEnd).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Amount Details */}
            <div className="border border-advist-bg rounded-xl overflow-hidden">
              <div className="p-4 border-b border-advist-bg">
                <div className="flex justify-between">
                  <span className="text-advist-gray900">
                    Abonnement {selectedInvoice.subscription.plan}
                  </span>
                  <span className="font-medium text-advist-gray900">
                    {formatCurrency(selectedInvoice.total)} FCFA
                  </span>
                </div>
              </div>
              <div className="p-4 bg-advist-bg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-advist-gray900">Total</span>
                  <span className="text-xl font-bold text-advist-gray900">
                    {formatCurrency(selectedInvoice.total)} FCFA
                  </span>
                </div>
                {selectedInvoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between mt-2">
                      <span className="text-advist-success">Payé</span>
                      <span className="text-advist-success">
                        -{formatCurrency(selectedInvoice.amountPaid)} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-advist-bg">
                      <span className="font-semibold text-advist-gold-dark">Reste à payer</span>
                      <span className="font-bold text-advist-gold-dark">
                        {formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid)} FCFA
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-advist-bg">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer size={16} className="mr-2" />
                Imprimer
              </Button>
              <Button variant="outline" className="flex-1">
                <Download size={16} className="mr-2" />
                Télécharger PDF
              </Button>
              {selectedInvoice.status !== 'paid' && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowPaymentModal(true);
                  }}
                >
                  <CreditCard size={16} className="mr-2" />
                  Enregistrer paiement
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Enregistrer un paiement"
        size="md"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="p-4 bg-advist-bg rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-advist-gray900">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-sm text-advist-blue-light">{selectedInvoice.organization}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-advist-blue-light">Reste à payer</p>
                  <p className="text-lg font-bold text-advist-gray900">
                    {formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid)} FCFA
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Montant du paiement *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue={selectedInvoice.total - selectedInvoice.amountPaid}
                    className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-advist-blue-light">
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Méthode de paiement *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'card', label: 'Carte bancaire', icon: CreditCard },
                    {
                      id: 'mobile_money',
                      label: 'Mobile Money',
                      icon: () => <span className="text-lg">📱</span>,
                    },
                    {
                      id: 'bank_transfer',
                      label: 'Virement',
                      icon: () => <span className="text-lg">🏦</span>,
                    },
                    {
                      id: 'cash',
                      label: 'Espèces',
                      icon: () => <span className="text-lg">💵</span>,
                    },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className="flex items-center gap-3 p-3 border border-advist-bg rounded-xl cursor-pointer hover:border-advist-blue-light transition-colors"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        className="accent-advist-navy"
                      />
                      <method.icon size={18} />
                      <span className="text-sm text-advist-gray900">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Référence transaction
                </label>
                <input
                  type="text"
                  placeholder="Ex: TXN-12345678"
                  className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">Notes</label>
                <textarea
                  placeholder="Notes additionnelles..."
                  rows={2}
                  className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-advist-bg">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                Annuler
              </Button>
              <Button className="flex-1">
                <CheckCircle size={16} className="mr-2" />
                Confirmer le paiement
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesPage;
