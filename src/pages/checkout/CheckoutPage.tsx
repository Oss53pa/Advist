import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Loader2,
  Shield,
  Sparkles,
  CreditCard,
  Smartphone,
  AlertCircle,
  Lock,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { checkoutService, CheckoutInitiateData, TotalBreakdown } from '../../services/checkout';
import { usePaymentStatus } from '../../hooks';

// Types for checkout state from RegisterPage
interface CheckoutState {
  // Personal info
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  // Organization info
  organization_name: string;
  organization_size?: string;
  industry?: string;
  country?: string;
  city?: string;
  // Plan
  plan_code: string;
  plan_name?: string;
  billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
}

// Mobile Money providers
const mobileMoneyProviders = {
  CI: {
    name: "Cote d'Ivoire",
    flag: '🇨🇮',
    code: '+225',
    providers: [
      { id: 'orange_money_ci', name: 'Orange Money', logo: '🟠', color: 'bg-orange-500' },
      { id: 'mtn_ci', name: 'MTN Money', logo: '🟡', color: 'bg-yellow-500' },
      { id: 'moov_ci', name: 'Moov Money', logo: '🔵', color: 'bg-blue-600' },
      { id: 'wave_ci', name: 'Wave', logo: '🌊', color: 'bg-cyan-500' },
    ],
  },
  SN: {
    name: 'Senegal',
    flag: '🇸🇳',
    code: '+221',
    providers: [
      { id: 'orange_money_sn', name: 'Orange Money', logo: '🟠', color: 'bg-orange-500' },
      { id: 'wave_sn', name: 'Wave', logo: '🌊', color: 'bg-cyan-500' },
      { id: 'free_money_sn', name: 'Free Money', logo: '🔴', color: 'bg-red-500' },
    ],
  },
  ML: {
    name: 'Mali',
    flag: '🇲🇱',
    code: '+223',
    providers: [
      { id: 'orange_money_ml', name: 'Orange Money', logo: '🟠', color: 'bg-orange-500' },
      { id: 'moov_ml', name: 'Moov Money', logo: '🔵', color: 'bg-blue-600' },
    ],
  },
  BF: {
    name: 'Burkina Faso',
    flag: '🇧🇫',
    code: '+226',
    providers: [
      { id: 'orange_money_bf', name: 'Orange Money', logo: '🟠', color: 'bg-orange-500' },
      { id: 'moov_bf', name: 'Moov Money', logo: '🔵', color: 'bg-blue-600' },
    ],
  },
  CM: {
    name: 'Cameroun',
    flag: '🇨🇲',
    code: '+237',
    providers: [
      { id: 'mtn_cm', name: 'MTN MoMo', logo: '🟡', color: 'bg-yellow-500' },
      { id: 'orange_money_cm', name: 'Orange Money', logo: '🟠', color: 'bg-orange-500' },
    ],
  },
  BJ: {
    name: 'Benin',
    flag: '🇧🇯',
    code: '+229',
    providers: [
      { id: 'mtn_bj', name: 'MTN MoMo', logo: '🟡', color: 'bg-yellow-500' },
      { id: 'moov_bj', name: 'Moov Money', logo: '🔵', color: 'bg-blue-600' },
    ],
  },
  TG: {
    name: 'Togo',
    flag: '🇹🇬',
    code: '+228',
    providers: [
      { id: 'flooz_tg', name: 'Flooz', logo: '🟢', color: 'bg-green-500' },
      { id: 'tmoney_tg', name: 'T-Money', logo: '🔵', color: 'bg-blue-600' },
    ],
  },
  GN: {
    name: 'Guinee',
    flag: '🇬🇳',
    code: '+224',
    providers: [
      { id: 'orange_money_gn', name: 'Orange Money', logo: '🟠', color: 'bg-orange-500' },
      { id: 'mtn_gn', name: 'MTN MoMo', logo: '🟡', color: 'bg-yellow-500' },
    ],
  },
};

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state as CheckoutState | null;

  // Payment state
  const [paymentType, setPaymentType] = useState<'card' | 'mobile_money'>('mobile_money');
  const [selectedCountry, setSelectedCountry] = useState<string>(checkoutState?.country || 'CI');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Total calculation
  const [totalBreakdown, setTotalBreakdown] = useState<TotalBreakdown | null>(null);
  const [isLoadingTotal, setIsLoadingTotal] = useState(true);

  // Payment status polling
  const {
    status: paymentStatus,
    isPolling,
    error: pollingError,
    elapsedTime,
  } = usePaymentStatus(checkoutToken, {
    onSuccess: (status) => {
      navigate('/register/success', {
        state: {
          email: checkoutState?.email,
          organization: checkoutState?.organization_name,
          plan: checkoutState?.plan_code,
          paymentCompleted: true,
        },
      });
    },
    onFailed: (status) => {
      setError(status.error_message || 'Le paiement a echoue');
      setCheckoutToken(null);
    },
  });

  // Redirect if no checkout state
  useEffect(() => {
    if (!checkoutState) {
      navigate('/register');
    }
  }, [checkoutState, navigate]);

  // Calculate total on mount
  useEffect(() => {
    if (checkoutState?.plan_code) {
      calculateTotal();
    }
  }, [checkoutState?.plan_code]);

  const calculateTotal = async () => {
    if (!checkoutState?.plan_code) return;

    setIsLoadingTotal(true);
    try {
      const total = await checkoutService.calculateTotal(
        checkoutState.plan_code,
        checkoutState.billing_cycle || 'monthly'
      );
      setTotalBreakdown(total);
    } catch (err) {
      // Fallback calculation
      const basePrice = checkoutState.plan_code === 'business' ? 59000 : 149000;
      const { subtotal, taxAmount, total } = checkoutService.calculateLocalTotal(basePrice);
      setTotalBreakdown({
        plan_code: checkoutState.plan_code,
        plan_name: checkoutState.plan_name || checkoutState.plan_code,
        subtotal,
        tax_rate: 18,
        tax_amount: taxAmount,
        total,
        currency: 'XOF',
      });
    } finally {
      setIsLoadingTotal(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)  }/${  v.substring(2, 4)}`;
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutState || !totalBreakdown) return;

    setError(null);
    setIsProcessing(true);

    try {
      const data: CheckoutInitiateData = {
        first_name: checkoutState.first_name,
        last_name: checkoutState.last_name,
        email: checkoutState.email,
        phone: checkoutState.phone,
        password: checkoutState.password,
        organization_name: checkoutState.organization_name,
        organization_size: checkoutState.organization_size,
        industry: checkoutState.industry,
        country: checkoutState.country,
        city: checkoutState.city,
        plan_code: checkoutState.plan_code,
        billing_cycle: checkoutState.billing_cycle || 'monthly',
        payment_method: paymentType,
      };

      if (paymentType === 'mobile_money') {
        data.phone_number = `${mobileMoneyProviders[selectedCountry as keyof typeof mobileMoneyProviders]?.code || ''}${phoneNumber}`;
        data.mobile_provider = selectedProvider;
      } else {
        // For card, we'd normally use Stripe Elements
        // For now, just send to initiate
        data.card_token = 'tok_demo'; // This would be from Stripe
      }

      const response = await checkoutService.initiateCheckout(data);

      // If payment URL provided (Mobile Money), redirect
      if (response.payment_url) {
        window.location.href = response.payment_url;
        return;
      }

      // Otherwise, start polling
      setCheckoutToken(response.checkout_token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentCountry = mobileMoneyProviders[selectedCountry as keyof typeof mobileMoneyProviders];

  if (!checkoutState) {
    return null;
  }

  // Show polling UI
  if (checkoutToken && isPolling) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-advist-gold/5">
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <Card padding="lg">
              <div className="py-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-advist-gold/10 rounded-full flex items-center justify-center">
                  <Clock size={40} className="text-advist-gold animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-advist-gray900 mb-2">
                  Paiement en cours...
                </h2>
                <p className="text-advist-text-secondary mb-6">
                  {paymentType === 'mobile_money'
                    ? 'Veuillez valider le paiement sur votre telephone'
                    : 'Traitement de votre paiement en cours'}
                </p>

                <div className="w-full bg-advist-surface-dark rounded-full h-2 mb-4">
                  <div
                    className="bg-advist-gold h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((elapsedTime / 300) * 100, 100)}%` }}
                  />
                </div>

                <p className="text-sm text-advist-text-muted">
                  Temps ecoule: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </p>

                {pollingError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {pollingError}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-advist-gold/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-advist-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-advist-navy to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-advist-gold" />
              </div>
              <span className="font-decorative text-2xl bg-gradient-to-r from-advist-navy to-primary-600 bg-clip-text text-transparent">
                Advist
              </span>
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-dark/5 rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Retour</span>
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-advist-gray900 mb-2">
              Finalisez votre inscription
            </h1>
            <p className="text-advist-text-secondary">
              Paiement securise pour activer votre compte
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card padding="lg">
                <h2 className="text-xl font-semibold text-advist-gray900 mb-6">
                  Mode de paiement
                </h2>

                {/* Payment Type Selector */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentType('mobile_money')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      paymentType === 'mobile_money'
                        ? 'border-advist-gold bg-advist-gold/5'
                        : 'border-advist-border hover:border-advist-gold/50'
                    }`}
                  >
                    <Smartphone size={24} className={paymentType === 'mobile_money' ? 'text-advist-gold' : 'text-advist-text-muted'} />
                    <div className="text-left">
                      <p className={`font-medium ${paymentType === 'mobile_money' ? 'text-advist-gray900' : 'text-advist-text-secondary'}`}>
                        Mobile Money
                      </p>
                      <p className="text-xs text-advist-text-muted">Orange, MTN, Wave...</p>
                    </div>
                    {paymentType === 'mobile_money' && <Check size={18} className="text-advist-gold ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('card')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      paymentType === 'card'
                        ? 'border-advist-gold bg-advist-gold/5'
                        : 'border-advist-border hover:border-advist-gold/50'
                    }`}
                  >
                    <CreditCard size={24} className={paymentType === 'card' ? 'text-advist-gold' : 'text-advist-text-muted'} />
                    <div className="text-left">
                      <p className={`font-medium ${paymentType === 'card' ? 'text-advist-gray900' : 'text-advist-text-secondary'}`}>
                        Carte bancaire
                      </p>
                      <p className="text-xs text-advist-text-muted">Visa, Mastercard</p>
                    </div>
                    {paymentType === 'card' && <Check size={18} className="text-advist-gold ml-auto" />}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Mobile Money Form */}
                  {paymentType === 'mobile_money' && (
                    <div className="space-y-4 p-5 bg-advist-surface-dark rounded-xl">
                      {/* Country Selector */}
                      <div>
                        <label className="block text-sm font-medium text-advist-gray900 mb-2">
                          Pays
                        </label>
                        <div className="relative">
                          <select
                            value={selectedCountry}
                            onChange={(e) => {
                              setSelectedCountry(e.target.value);
                              setSelectedProvider('');
                            }}
                            className="w-full px-4 py-3 pl-12 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold/30 focus:border-advist-gold appearance-none bg-white"
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
                          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-advist-text-muted" />
                        </div>
                      </div>

                      {/* Provider Selector */}
                      <div>
                        <label className="block text-sm font-medium text-advist-gray900 mb-2">
                          Operateur
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {currentCountry?.providers.map((provider) => (
                            <button
                              key={provider.id}
                              type="button"
                              onClick={() => setSelectedProvider(provider.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                selectedProvider === provider.id
                                  ? 'border-advist-gold bg-advist-gold/5'
                                  : 'border-advist-border hover:border-advist-gold/50'
                              }`}
                            >
                              <div className={`w-10 h-10 ${provider.color} rounded-full flex items-center justify-center text-white text-lg`}>
                                {provider.logo}
                              </div>
                              <span className={`font-medium ${selectedProvider === provider.id ? 'text-advist-gray900' : 'text-advist-text-secondary'}`}>
                                {provider.name}
                              </span>
                              {selectedProvider === provider.id && <Check size={16} className="text-advist-gold ml-auto" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-medium text-advist-gray900 mb-2">
                          Numero de telephone
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
                            className="w-full px-4 py-3 pl-16 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold/30 focus:border-advist-gold"
                            required
                          />
                        </div>
                        <p className="text-xs text-advist-text-secondary mt-1">
                          Vous recevrez une notification pour confirmer le paiement
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Card Form */}
                  {paymentType === 'card' && (
                    <div className="space-y-4 p-5 bg-advist-surface-dark rounded-xl">
                      <div>
                        <label className="block text-sm font-medium text-advist-gray900 mb-2">
                          Numero de carte
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-4 py-3 pl-12 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold/30 focus:border-advist-gold"
                            required
                          />
                          <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-advist-text-muted" />
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
                            className="w-full px-4 py-3 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold/30 focus:border-advist-gold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-advist-gray900 mb-2">
                            CVC
                          </label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            placeholder="123"
                            className="w-full px-4 py-3 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold/30 focus:border-advist-gold"
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
                          className="w-full px-4 py-3 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold/30 focus:border-advist-gold uppercase"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                      <AlertCircle size={18} />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 text-sm text-advist-text-secondary">
                    <Lock size={14} />
                    <span>Paiement securise SSL 256-bit</span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full py-4"
                    disabled={isProcessing || (paymentType === 'mobile_money' && !selectedProvider) || isLoadingTotal}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Shield size={18} className="mr-2" />
                        Payer {totalBreakdown ? checkoutService.formatAmount(totalBreakdown.total) : '...'}
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card padding="lg" className="sticky top-24">
                <h3 className="text-lg font-semibold text-advist-gray900 mb-4">
                  Resume de la commande
                </h3>

                {/* Organization Info */}
                <div className="p-4 bg-advist-surface-dark rounded-xl mb-4">
                  <p className="font-medium text-advist-gray900">{checkoutState.organization_name}</p>
                  <p className="text-sm text-advist-text-secondary">{checkoutState.email}</p>
                </div>

                {/* Plan */}
                <div className="border-t border-advist-border pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-advist-text-secondary">Plan</span>
                    <span className="font-medium text-advist-gray900 capitalize">
                      {checkoutState.plan_name || checkoutState.plan_code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-advist-text-secondary">Periode</span>
                    <span className="font-medium text-advist-gray900">Mensuel</span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                {isLoadingTotal ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 size={24} className="animate-spin text-advist-gold" />
                  </div>
                ) : totalBreakdown && (
                  <div className="border-t border-advist-border pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-advist-text-secondary">Sous-total</span>
                      <span className="text-advist-gray900">
                        {checkoutService.formatAmount(totalBreakdown.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-advist-text-secondary">TVA ({totalBreakdown.tax_rate}%)</span>
                      <span className="text-advist-gray900">
                        {checkoutService.formatAmount(totalBreakdown.tax_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-advist-border">
                      <span className="font-semibold text-advist-gray900">Total</span>
                      <span className="text-xl font-bold text-advist-gold">
                        {checkoutService.formatAmount(totalBreakdown.total)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Guarantee */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Garantie satisfait ou rembourse</p>
                      <p className="text-sm text-green-600">30 jours pour essayer sans risque</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
