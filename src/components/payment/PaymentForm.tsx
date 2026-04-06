import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Smartphone,
  Check,
  Lock,
  AlertCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui';

// Types for payment
export interface PaymentMethod {
  type: 'card' | 'mobile_money';
  provider?: string;
  country?: string;
}

export interface PaymentFormData {
  method: PaymentMethod;
  amount: number;
  currency: string;
  // Card fields
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  cardName?: string;
  // Mobile Money fields
  phoneNumber?: string;
  mobileProvider?: string;
  mobileCountry?: string;
}

interface PaymentFormProps {
  amount: number;
  currency?: string;
  invoiceNumber?: string;
  organizationName?: string;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
}

// Mobile Money providers by country
const mobileMoneyProviders = {
  CI: {
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    code: '+225',
    providers: [
      { id: 'orange_money_ci', name: 'Orange Money', logo: '🟠', color: 'bg-advist-gold' },
      { id: 'mtn_ci', name: 'MTN Money', logo: '🟡', color: 'bg-advist-gold' },
      { id: 'moov_ci', name: 'Moov Money', logo: '🔵', color: 'bg-advist-dark' },
      { id: 'wave_ci', name: 'Wave', logo: '🌊', color: 'bg-advist-gold-light' },
    ],
  },
  SN: {
    name: 'Sénégal',
    flag: '🇸🇳',
    code: '+221',
    providers: [
      { id: 'orange_money_sn', name: 'Orange Money', logo: '🟠', color: 'bg-advist-gold' },
      { id: 'wave_sn', name: 'Wave', logo: '🌊', color: 'bg-advist-gold-light' },
      { id: 'free_money_sn', name: 'Free Money', logo: '🔴', color: 'bg-advist-error' },
    ],
  },
  ML: {
    name: 'Mali',
    flag: '🇲🇱',
    code: '+223',
    providers: [
      { id: 'orange_money_ml', name: 'Orange Money', logo: '🟠', color: 'bg-advist-gold' },
      { id: 'moov_ml', name: 'Moov Money', logo: '🔵', color: 'bg-advist-dark' },
    ],
  },
  BF: {
    name: 'Burkina Faso',
    flag: '🇧🇫',
    code: '+226',
    providers: [
      { id: 'orange_money_bf', name: 'Orange Money', logo: '🟠', color: 'bg-advist-gold' },
      { id: 'moov_bf', name: 'Moov Money', logo: '🔵', color: 'bg-advist-dark' },
    ],
  },
  CM: {
    name: 'Cameroun',
    flag: '🇨🇲',
    code: '+237',
    providers: [
      { id: 'mtn_cm', name: 'MTN MoMo', logo: '🟡', color: 'bg-advist-gold' },
      { id: 'orange_money_cm', name: 'Orange Money', logo: '🟠', color: 'bg-advist-gold' },
    ],
  },
  BJ: {
    name: 'Bénin',
    flag: '🇧🇯',
    code: '+229',
    providers: [
      { id: 'mtn_bj', name: 'MTN MoMo', logo: '🟡', color: 'bg-advist-gold' },
      { id: 'moov_bj', name: 'Moov Money', logo: '🔵', color: 'bg-advist-dark' },
    ],
  },
  TG: {
    name: 'Togo',
    flag: '🇹🇬',
    code: '+228',
    providers: [
      { id: 'flooz_tg', name: 'Flooz', logo: '🟢', color: 'bg-advist-success' },
      { id: 'tmoney_tg', name: 'T-Money', logo: '🔵', color: 'bg-advist-dark' },
    ],
  },
  GN: {
    name: 'Guinée',
    flag: '🇬🇳',
    code: '+224',
    providers: [
      { id: 'orange_money_gn', name: 'Orange Money', logo: '🟠', color: 'bg-advist-gold' },
      { id: 'mtn_gn', name: 'MTN MoMo', logo: '🟡', color: 'bg-advist-gold' },
    ],
  },
};

// Card types
const cardTypes = [
  { pattern: /^4/, name: 'Visa', logo: '💳' },
  { pattern: /^5[1-5]/, name: 'Mastercard', logo: '💳' },
  { pattern: /^3[47]/, name: 'Amex', logo: '💳' },
];

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'XOF',
  invoiceNumber,
  organizationName,
  onSubmit,
  onCancel,
  showCancel = true,
}) => {
  const { _t } = useTranslation();
  const [paymentType, setPaymentType] = useState<'card' | 'mobile_money'>('card');
  const [selectedCountry, setSelectedCountry] = useState<string>('CI');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Mobile money form state
  const [phoneNumber, setPhoneNumber] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const detectCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    for (const type of cardTypes) {
      if (type.pattern.test(cleaned)) {
        return type;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const paymentData: PaymentFormData = {
        method: {
          type: paymentType,
          provider: paymentType === 'mobile_money' ? selectedProvider : undefined,
          country: paymentType === 'mobile_money' ? selectedCountry : undefined,
        },
        amount,
        currency,
      };

      if (paymentType === 'card') {
        paymentData.cardNumber = cardNumber.replace(/\s/g, '');
        paymentData.cardExpiry = cardExpiry;
        paymentData.cardCvc = cardCvc;
        paymentData.cardName = cardName;
      } else {
        paymentData.phoneNumber = phoneNumber;
        paymentData.mobileProvider = selectedProvider;
        paymentData.mobileCountry = selectedCountry;
      }

      await onSubmit(paymentData);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentCountry = mobileMoneyProviders[selectedCountry as keyof typeof mobileMoneyProviders];

  return (
    <div className="max-w-lg mx-auto">
      {/* Amount Display */}
      <div className="text-center mb-6 p-6 bg-gradient-to-br from-advist-navy to-advist-navy/90 rounded-2xl text-white">
        <p className="text-sm text-advist-blue-light mb-1">Montant à payer</p>
        <p className="text-4xl font-bold">
          {formatCurrency(amount)}{' '}
          <span className="text-xl">{currency === 'XOF' ? 'FCFA' : currency}</span>
        </p>
        {invoiceNumber && (
          <p className="text-sm text-advist-blue-light mt-2">Facture: {invoiceNumber}</p>
        )}
        {organizationName && <p className="text-sm text-white/70 mt-1">{organizationName}</p>}
      </div>

      {/* Payment Type Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setPaymentType('card')}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
            paymentType === 'card'
              ? 'border-advist-dark bg-advist-dark/5'
              : 'border-advist-border hover:border-advist-border'
          }`}
        >
          <CreditCard
            size={24}
            className={paymentType === 'card' ? 'text-advist-gray900' : 'text-advist-text-muted'}
          />
          <div className="text-left">
            <p
              className={`font-medium ${paymentType === 'card' ? 'text-advist-gray900' : 'text-advist-text-secondary'}`}
            >
              Carte bancaire
            </p>
            <p className="text-xs text-advist-text-muted">Visa, Mastercard</p>
          </div>
          {paymentType === 'card' && <Check size={18} className="text-advist-gray900 ml-auto" />}
        </button>

        <button
          type="button"
          onClick={() => setPaymentType('mobile_money')}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
            paymentType === 'mobile_money'
              ? 'border-advist-dark bg-advist-dark/5'
              : 'border-advist-border hover:border-advist-border'
          }`}
        >
          <Smartphone
            size={24}
            className={
              paymentType === 'mobile_money' ? 'text-advist-gray900' : 'text-advist-text-muted'
            }
          />
          <div className="text-left">
            <p
              className={`font-medium ${paymentType === 'mobile_money' ? 'text-advist-gray900' : 'text-advist-text-secondary'}`}
            >
              Mobile Money
            </p>
            <p className="text-xs text-advist-text-muted">Orange, MTN, Wave...</p>
          </div>
          {paymentType === 'mobile_money' && (
            <Check size={18} className="text-advist-gray900 ml-auto" />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Payment Form */}
        {paymentType === 'card' && (
          <div className="space-y-4 p-5 bg-advist-surface-dark rounded-xl">
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Numéro de carte
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 pl-12 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                  required
                />
                <CreditCard
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-advist-text-muted"
                />
                {detectCardType(cardNumber) && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">
                    {detectCardType(cardNumber)?.logo}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Date d'expiration
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">CVC</label>
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="123"
                  className="w-full px-4 py-3 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Nom sur la carte
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="JEAN DUPONT"
                className="w-full px-4 py-3 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light uppercase"
                required
              />
            </div>
          </div>
        )}

        {/* Mobile Money Payment Form */}
        {paymentType === 'mobile_money' && (
          <div className="space-y-4 p-5 bg-advist-surface-dark rounded-xl">
            {/* Country Selector */}
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">Pays</label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedProvider('');
                  }}
                  className="w-full px-4 py-3 pl-12 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light appearance-none bg-white"
                >
                  {Object.entries(mobileMoneyProviders).map(([code, country]) => (
                    <option key={code} value={code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  {currentCountry?.flag}
                </span>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-advist-text-muted"
                />
              </div>
            </div>

            {/* Provider Selector */}
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Opérateur
              </label>
              <div className="grid grid-cols-2 gap-3">
                {currentCountry?.providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedProvider === provider.id
                        ? 'border-advist-dark bg-advist-dark/5'
                        : 'border-advist-border hover:border-advist-border'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 ${provider.color} rounded-full flex items-center justify-center text-white text-lg`}
                    >
                      {provider.logo}
                    </div>
                    <span
                      className={`font-medium ${selectedProvider === provider.id ? 'text-advist-gray900' : 'text-advist-text-secondary'}`}
                    >
                      {provider.name}
                    </span>
                    {selectedProvider === provider.id && (
                      <Check size={16} className="text-advist-gray900 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-advist-text-secondary font-medium">
                  {currentCountry?.code}
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="XX XX XX XX XX"
                  className="w-full px-4 py-3 pl-16 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30 focus:border-advist-blue-light"
                  required
                />
              </div>
              <p className="text-xs text-advist-text-secondary mt-1">
                Vous recevrez une notification pour confirmer le paiement
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-advist-gold-light border border-advist-gold rounded-xl text-advist-error">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-advist-text-secondary">
          <Lock size={14} />
          <span>Paiement sécurisé SSL 256-bit</span>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
          {showCancel && onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={isProcessing || (paymentType === 'mobile_money' && !selectedProvider)}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Lock size={18} className="mr-2" />
                Payer {formatCurrency(amount)} {currency === 'XOF' ? 'FCFA' : currency}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
