import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Smartphone,
  Building2,
  Settings,
  Check,
  _X,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Shield,
  _RefreshCw,
  Globe,
  Wallet,
} from 'lucide-react';
import { Button, Modal } from '../../../components/ui';

// Mock payment gateway configurations
const mockGatewayConfigs = [
  {
    id: '1',
    gateway: 'stripe',
    name: 'Stripe',
    description: 'Cartes bancaires (Visa, Mastercard)',
    icon: CreditCard,
    color: 'bg-advist-dark',
    isActive: true,
    isSandbox: false,
    isDefaultCard: true,
    isDefaultMobile: false,
    publicKey: 'adv_pub_xxx...xxx',
    hasSecretKey: true,
    hasWebhookSecret: true,
    webhookUrl: 'https://api.advist.com/webhooks/stripe',
  },
  {
    id: '2',
    gateway: 'paydunya',
    name: 'PayDunya',
    description: 'Mobile Money (Orange, MTN, Wave, Moov)',
    icon: Smartphone,
    color: 'bg-advist-gold',
    isActive: true,
    isSandbox: true,
    isDefaultCard: false,
    isDefaultMobile: true,
    publicKey: 'live_public_xxx...xxx',
    hasSecretKey: true,
    hasWebhookSecret: false,
    webhookUrl: 'https://api.advist.com/webhooks/paydunya',
  },
  {
    id: '3',
    gateway: 'flutterwave',
    name: 'Flutterwave',
    description: 'Alternative Mobile Money multi-pays',
    icon: Globe,
    color: 'bg-advist-gold',
    isActive: false,
    isSandbox: true,
    isDefaultCard: false,
    isDefaultMobile: false,
    publicKey: '',
    hasSecretKey: false,
    hasWebhookSecret: false,
    webhookUrl: 'https://api.advist.com/webhooks/flutterwave',
  },
];

// Mock bank account
const mockBankAccount = {
  id: '1',
  bankName: "Société Générale Côte d'Ivoire",
  bankCode: 'SGCI',
  accountName: 'ADVIST SARL',
  accountNumber: 'CI93 XXXX XXXX XXXX XXXX 1234',
  accountType: 'business',
  currency: 'XOF',
  country: 'CI',
  city: 'Abidjan',
  isVerified: true,
  isPrimary: true,
  mobileMoneyNumber: '+225 07 XX XX XX XX',
  mobileMoneyProvider: 'Orange Money',
};

// Available gateways to add
const availableGateways = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Cartes bancaires internationales',
    icon: CreditCard,
  },
  {
    id: 'paydunya',
    name: 'PayDunya',
    description: "Mobile Money Afrique de l'Ouest",
    icon: Smartphone,
  },
  { id: 'flutterwave', name: 'Flutterwave', description: 'Paiements Afrique', icon: Globe },
  { id: 'cinetpay', name: 'CinetPay', description: 'Mobile Money Afrique', icon: Wallet },
];

export const PaymentSettingsPage: React.FC = () => {
  const { _t } = useTranslation();
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [_selectedGateway, _setSelectedGateway] = useState<(typeof mockGatewayConfigs)[0] | null>(
    null
  );
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-advist-gray900">Configuration des paiements</h1>
        <p className="text-advist-blue-light mt-1">
          Gérez les passerelles de paiement et le compte bancaire de réception
        </p>
      </div>

      {/* Bank Account Section */}
      <div className="bg-white rounded-xl border border-advist-bg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-advist-bg bg-gradient-to-r from-advist-navy to-advist-navy/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Compte bancaire de réception</h2>
              <p className="text-sm text-advist-blue-light">
                Les fonds seront transférés sur ce compte
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => setShowBankModal(true)}
          >
            <Edit size={16} className="mr-2" />
            Modifier
          </Button>
        </div>

        <div className="p-6">
          {mockBankAccount ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  {mockBankAccount.isVerified ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-advist-success text-xs font-medium rounded-full">
                      <CheckCircle size={12} />
                      Compte vérifié
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-advist-gold-light text-advist-gold-dark text-xs font-medium rounded-full">
                      <AlertTriangle size={12} />
                      En attente de vérification
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-advist-blue-light">Banque</p>
                  <p className="font-semibold text-advist-gray900">{mockBankAccount.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-advist-blue-light">Titulaire</p>
                  <p className="font-semibold text-advist-gray900">{mockBankAccount.accountName}</p>
                </div>
                <div>
                  <p className="text-sm text-advist-blue-light">IBAN / Numéro de compte</p>
                  <p className="font-mono text-advist-gray900">{mockBankAccount.accountNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-advist-blue-light">Devise</p>
                    <p className="font-semibold text-advist-gray900">{mockBankAccount.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-advist-blue-light">Pays</p>
                    <p className="font-semibold text-advist-gray900">🇨🇮 Côte d'Ivoire</p>
                  </div>
                </div>
              </div>

              {/* Mobile Money Alternative */}
              <div className="bg-advist-bg rounded-xl p-5">
                <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                  <Smartphone size={18} />
                  Alternative Mobile Money
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-advist-blue-light">Opérateur</p>
                    <p className="font-semibold text-advist-gray900">
                      {mockBankAccount.mobileMoneyProvider}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-advist-blue-light">Numéro</p>
                    <p className="font-mono text-advist-gray900">
                      {mockBankAccount.mobileMoneyNumber}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-advist-blue-light mt-4">
                  Utilisé pour les petits montants ou en cas d'indisponibilité bancaire
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 size={48} className="mx-auto text-advist-blue-light mb-4" />
              <p className="text-advist-blue-light mb-4">Aucun compte bancaire configuré</p>
              <Button onClick={() => setShowBankModal(true)}>
                <Plus size={18} className="mr-2" />
                Ajouter un compte
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateways Section */}
      <div className="bg-white rounded-xl border border-advist-bg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-advist-bg">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-advist-blue-light" />
            <h2 className="font-semibold text-advist-gray900">Passerelles de paiement</h2>
          </div>
          <Button onClick={() => setShowGatewayModal(true)}>
            <Plus size={18} className="mr-2" />
            Ajouter
          </Button>
        </div>

        <div className="divide-y divide-advist-bg">
          {mockGatewayConfigs.map((config) => (
            <div key={config.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center`}
                  >
                    <config.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-advist-gray900">{config.name}</h3>
                      {config.isSandbox && (
                        <span className="px-2 py-0.5 bg-advist-gold-light text-advist-gold-dark text-xs font-medium rounded-full">
                          Sandbox
                        </span>
                      )}
                      {config.isDefaultCard && (
                        <span className="px-2 py-0.5 bg-advist-surface-dark text-advist-gray900 text-xs font-medium rounded-full">
                          Cartes
                        </span>
                      )}
                      {config.isDefaultMobile && (
                        <span className="px-2 py-0.5 bg-advist-gold-light text-advist-gold-dark text-xs font-medium rounded-full">
                          Mobile
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-advist-blue-light mt-1">{config.description}</p>

                    {/* API Keys */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-advist-blue-light w-24">Clé publique:</span>
                        <code className="text-xs bg-advist-bg px-2 py-1 rounded font-mono">
                          {config.publicKey || '—'}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-advist-blue-light w-24">Clé secrète:</span>
                        {config.hasSecretKey ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-advist-bg px-2 py-1 rounded font-mono">
                              {showSecrets[config.id] ? 'adv_sec_xxx...xxx' : '••••••••••••••••'}
                            </code>
                            <button
                              onClick={() => toggleSecret(config.id)}
                              className="text-advist-blue-light hover:text-advist-gray900"
                            >
                              {showSecrets[config.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-advist-error">Non configurée</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-advist-blue-light w-24">Webhook:</span>
                        <code className="text-xs bg-advist-bg px-2 py-1 rounded font-mono">
                          {config.webhookUrl}
                        </code>
                        <button className="text-advist-blue-light hover:text-advist-gray900">
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Toggle */}
                  <div className="flex items-center gap-2 mr-4">
                    <span
                      className={`text-sm font-medium ${config.isActive ? 'text-advist-success' : 'text-advist-text-muted'}`}
                    >
                      {config.isActive ? 'Actif' : 'Inactif'}
                    </span>
                    <button
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        config.isActive ? 'bg-advist-success' : 'bg-advist-surface-dark'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          config.isActive ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Settings size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-advist-error hover:bg-advist-gold-light"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-advist-gold-light border border-advist-gold rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 bg-advist-gold-light rounded-xl">
          <Shield size={20} className="text-advist-gray900" />
        </div>
        <div>
          <h3 className="font-medium text-advist-gray900">Sécurité des paiements</h3>
          <p className="text-sm text-advist-gray900 mt-1">
            Toutes les clés API sont chiffrées avec AES-256. Les données de cartes bancaires ne
            transitent jamais par nos serveurs (tokenisation PCI-DSS).
          </p>
        </div>
      </div>

      {/* Add Gateway Modal */}
      <Modal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        title="Ajouter une passerelle de paiement"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {availableGateways.map((gateway) => (
              <button
                key={gateway.id}
                className="flex items-center gap-4 p-4 border border-advist-bg rounded-xl hover:border-advist-dark transition-all text-left"
                onClick={() => {
                  // Open configuration form
                }}
              >
                <div className="w-12 h-12 bg-advist-bg rounded-xl flex items-center justify-center">
                  <gateway.icon size={24} className="text-advist-gray900" />
                </div>
                <div>
                  <h4 className="font-medium text-advist-gray900">{gateway.name}</h4>
                  <p className="text-sm text-advist-blue-light">{gateway.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Bank Account Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="Configurer le compte bancaire"
        size="lg"
      >
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Nom de la banque *
              </label>
              <input
                type="text"
                defaultValue={mockBankAccount?.bankName}
                className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                placeholder="Ex: Société Générale Côte d'Ivoire"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Code banque (SWIFT/BIC)
              </label>
              <input
                type="text"
                defaultValue={mockBankAccount?.bankCode}
                className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                placeholder="Ex: SGCICIAB"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">Pays</label>
              <select className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30">
                <option value="CI">🇨🇮 Côte d'Ivoire</option>
                <option value="SN">🇸🇳 Sénégal</option>
                <option value="ML">🇲🇱 Mali</option>
                <option value="BF">🇧🇫 Burkina Faso</option>
                <option value="CM">🇨🇲 Cameroun</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Titulaire du compte *
              </label>
              <input
                type="text"
                defaultValue={mockBankAccount?.accountName}
                className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                placeholder="Ex: ADVIST SARL"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                IBAN / Numéro de compte *
              </label>
              <input
                type="text"
                defaultValue={mockBankAccount?.accountNumber}
                className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 font-mono"
                placeholder="Ex: CI93 XXXX XXXX XXXX XXXX XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Type de compte
              </label>
              <select className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30">
                <option value="business">Compte professionnel</option>
                <option value="checking">Compte courant</option>
                <option value="savings">Compte épargne</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">Devise</label>
              <select className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30">
                <option value="XOF">XOF - Franc CFA (BCEAO)</option>
                <option value="XAF">XAF - Franc CFA (BEAC)</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dollar US</option>
              </select>
            </div>
          </div>

          {/* Mobile Money Alternative */}
          <div className="border-t border-advist-bg pt-6">
            <h4 className="font-medium text-advist-gray900 mb-4">
              Alternative Mobile Money (optionnel)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Opérateur
                </label>
                <select className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30">
                  <option value="">Sélectionner...</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn">MTN Money</option>
                  <option value="wave">Wave</option>
                  <option value="moov">Moov Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  defaultValue={mockBankAccount?.mobileMoneyNumber}
                  className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                  placeholder="+225 07 XX XX XX XX"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-advist-bg">
            <Button variant="outline" className="flex-1" onClick={() => setShowBankModal(false)}>
              Annuler
            </Button>
            <Button className="flex-1">
              <Check size={18} className="mr-2" />
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentSettingsPage;
