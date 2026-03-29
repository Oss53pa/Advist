import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Check,
  Phone,
  MapPin,
  Users,
  CreditCard,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';

// Types for forms
type Step1Form = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
};

type Step2Form = {
  organization_name: string;
  organization_size: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  industry: string;
  country: string;
  city?: string;
};

type Step3Form = {
  password: string;
  confirmPassword: string;
  plan: 'business' | 'enterprise';
  acceptTerms: boolean;
};

// Static arrays with translation keys
const industryKeys = ['finance', 'legal', 'healthcare', 'technology', 'manufacturing', 'retail', 'construction', 'education', 'government', 'agriculture', 'other'];
const countryKeys = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GN', 'CM', 'GA', 'CG', 'CD', 'FR', 'BE', 'CH', 'CA', 'OTHER'];
const planIds = ['business', 'enterprise'] as const;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeIAOption, setIncludeIAOption] = useState(false);

  // Zod schemas with translations - Harmonisés avec Mobile
  const step1Schema = z.object({
    first_name: z.string()
      .min(2, t('validation.minLength', { count: 2 }))
      .max(50, t('validation.maxLength', { count: 50 }))
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, t('validation.nameInvalidChars')),
    last_name: z.string()
      .min(2, t('validation.minLength', { count: 2 }))
      .max(50, t('validation.maxLength', { count: 50 }))
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, t('validation.nameInvalidChars')),
    email: z.string().email(t('validation.emailInvalid')),
    // Format international: +225 (CI), +221 (SN), +33 (FR), etc.
    phone: z.string()
      .refine((val) => !val || val === '' || /^\+[0-9]{1,4}[0-9]{8,12}$/.test(val), {
        message: t('validation.phoneInvalid'),
      })
      .optional()
      .or(z.literal('')),
  });

  const step2Schema = z.object({
    organization_name: z.string().min(2, t('validation.fieldRequired')),
    organization_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+'], {
      required_error: t('validation.fieldRequired'),
    }),
    industry: z.string().min(1, t('validation.fieldRequired')),
    country: z.string().min(1, t('validation.fieldRequired')),
    city: z.string().optional(),
  });

  // Validation mot de passe - Harmonisée avec Mobile (5 critères)
  const step3Schema = z
    .object({
      password: z
        .string()
        .min(8, t('validation.passwordMinLength', { count: 8 }))
        .regex(/[A-Z]/, t('validation.passwordUppercase'))
        .regex(/[a-z]/, t('validation.passwordLowercase'))
        .regex(/[0-9]/, t('validation.passwordNumber'))
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, t('validation.passwordSpecial')),
      confirmPassword: z.string(),
      plan: z.enum(['business', 'enterprise']),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: t('validation.fieldRequired'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });

  // Translated arrays
  const industries = industryKeys.map(key => ({
    value: key,
    label: t(`auth.register.industries.${key}`, key)
  }));

  const countries = countryKeys.map(key => ({
    value: key,
    label: t(`auth.register.countries.${key}`, key)
  }));

  const plans = planIds.map(id => ({
    id,
    name: t(`auth.register.plans.${id}.name`, id),
    price: id === 'business' ? '59 000 FCFA' : t('auth.register.custom', 'Sur mesure'),
    period: id === 'enterprise' ? '' : '/mois',
    description: t(`auth.register.plans.${id}.description`),
    features: t(`auth.register.plans.${id}.features`, { returnObjects: true }) as string[],
    popular: id === 'business',
  }));

  const iaAddonInfo = {
    code: 'ia_option',
    name: t('auth.register.iaAddon.name', 'Offre IA'),
    description: t('auth.register.iaAddon.description'),
    features: t('auth.register.iaAddon.features', { returnObjects: true }) as string[],
    pricing: {
      business: 25000,
      enterprise: 45000,
    },
    currency: 'FCFA',
  };

  // Stocker les données de chaque étape
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Form | null>(null);

  // Formulaires pour chaque étape
  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data || {},
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data || {},
  });

  const step3Form = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      plan: 'business',
      acceptTerms: false,
    },
  });

  const selectedPlan = step3Form.watch('plan');

  // Reset IA option when switching away from business/enterprise
  useEffect(() => {
    if (selectedPlan !== 'business' && selectedPlan !== 'enterprise') {
      setIncludeIAOption(false);
    }
  }, [selectedPlan]);

  const handleStep1Submit = (data: Step1Form) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Form) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleFinalSubmit = async (data: Step3Form) => {
    if (!step1Data || !step2Data) return;

    // Get plan name for display
    const selectedPlanInfo = plans.find(p => p.id === data.plan);

    // Redirect to checkout page with all collected data
    navigate('/checkout', {
      state: {
        // Personal info
        first_name: step1Data.first_name,
        last_name: step1Data.last_name,
        email: step1Data.email,
        phone: step1Data.phone,
        password: data.password,
        // Organization info
        organization_name: step2Data.organization_name,
        organization_size: step2Data.organization_size,
        industry: step2Data.industry,
        country: step2Data.country,
        city: step2Data.city,
        // Plan
        plan_code: data.plan,
        plan_name: selectedPlanInfo?.name || data.plan,
        billing_cycle: 'monthly',
        // Addons
        includeIAOption: includeIAOption && (data.plan === 'business' || data.plan === 'enterprise'),
      },
    });
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: t('auth.register.step1Title'), icon: User },
    { number: 2, title: t('auth.register.step2Title'), icon: Building2 },
    { number: 3, title: t('auth.register.step3Title'), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-advist-gold/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-advist-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-advist-navy to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-advist-dark/20 group-hover:shadow-advist-dark/40 transition-all">
                <Sparkles className="w-5 h-5 text-advist-gold" />
              </div>
              <span className="font-decorative text-2xl bg-gradient-to-r from-advist-navy to-primary-600 bg-clip-text text-transparent">Advist</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-advist-text-secondary hover:text-advist-gray900 hover:bg-advist-dark/5 rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">{t('auth.register.backToHome')}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Essai gratuit badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-advist-gold/10 text-advist-gold rounded-full mb-4 border border-advist-gold/20">
              <Shield size={18} />
              <span className="font-semibold">{t('auth.register.guarantee')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-advist-gray900 mb-2">{t('auth.register.createAccount')}</h1>
            <p className="text-advist-text-secondary">
              {t('auth.register.adminDescription')}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-10">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                      currentStep > step.number
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/30'
                        : currentStep === step.number
                        ? 'bg-gradient-to-br from-advist-gold to-primary-500 text-white shadow-advist-gold/30'
                        : 'bg-advist-surface-dark text-advist-text-muted shadow-none'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check size={24} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-advist-gray900' : 'text-advist-text-muted'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-20 sm:w-32 h-1 mx-2 rounded-full transition-all ${
                      currentStep > step.number ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-advist-border'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-advist-gold-light border border-advist-gold rounded-xl text-advist-error">
              {error}
              <button onClick={() => setError(null)} className="float-right font-bold">
                &times;
              </button>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-advist-dark/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-advist-gray900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-advist-gray900">{t('auth.register.step1Title')}</h2>
                  <p className="text-sm text-advist-gray900/60">{t('auth.register.adminRole')}</p>
                </div>
              </div>

              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('auth.firstName')}
                    placeholder="Jean"
                    leftIcon={<User size={18} />}
                    error={step1Form.formState.errors.first_name?.message}
                    {...step1Form.register('first_name')}
                  />
                  <Input
                    label={t('auth.lastName')}
                    placeholder="Dupont"
                    error={step1Form.formState.errors.last_name?.message}
                    {...step1Form.register('last_name')}
                  />
                </div>

                <Input
                  label={t('auth.register.professionalEmail')}
                  type="email"
                  placeholder="jean.dupont@entreprise.com"
                  leftIcon={<Mail size={18} />}
                  error={step1Form.formState.errors.email?.message}
                  helperText={t('auth.register.emailHelperText')}
                  {...step1Form.register('email')}
                />

                <Input
                  label={t('auth.register.phoneOptional')}
                  type="tel"
                  placeholder="+225 01 02 03 04 05"
                  leftIcon={<Phone size={18} />}
                  error={step1Form.formState.errors.phone?.message}
                  {...step1Form.register('phone')}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="px-8">
                    {t('auth.register.continue')}
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-advist-border text-center">
                <span className="text-advist-gray900/70">{t('auth.hasAccount')}</span>{' '}
                <Link to="/login" className="text-advist-gray900 font-medium hover:underline">
                  {t('auth.login')}
                </Link>
              </div>
            </Card>
          )}

          {/* Step 2: Company Information */}
          {currentStep === 2 && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-advist-dark/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-advist-gray900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-advist-gray900">{t('auth.register.step2Title')}</h2>
                  <p className="text-sm text-advist-gray900/60">{t('auth.register.companyInfo')}</p>
                </div>
              </div>

              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-5">
                <Input
                  label={t('auth.register.companyName')}
                  placeholder="ADVIST Corp"
                  leftIcon={<Building2 size={18} />}
                  error={step2Form.formState.errors.organization_name?.message}
                  {...step2Form.register('organization_name')}
                />

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    {t('auth.register.companySize')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                      <label
                        key={size}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          step2Form.watch('organization_size') === size
                            ? 'border-advist-dark bg-advist-dark/5'
                            : 'border-advist-border hover:border-advist-dark/30'
                        }`}
                      >
                        <input
                          type="radio"
                          value={size}
                          className="sr-only"
                          {...step2Form.register('organization_size')}
                        />
                        <Users size={16} className="text-advist-gray900/60" />
                        <span className="text-sm font-medium text-advist-gray900">{size}</span>
                      </label>
                    ))}
                  </div>
                  {step2Form.formState.errors.organization_size && (
                    <p className="mt-1 text-sm text-advist-error">
                      {step2Form.formState.errors.organization_size.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-2">
                    {t('auth.register.industry')}
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold border border-transparent"
                    {...step2Form.register('industry')}
                  >
                    <option value="">{t('auth.register.selectIndustry')}</option>
                    {industries.map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  {step2Form.formState.errors.industry && (
                    <p className="mt-1 text-sm text-advist-error">
                      {step2Form.formState.errors.industry.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-advist-gray900 mb-2">{t('auth.register.country')}</label>
                    <select
                      className="w-full px-4 py-3 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold border border-transparent"
                      {...step2Form.register('country')}
                    >
                      <option value="">{t('auth.register.selectCountry')}</option>
                      {countries.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {step2Form.formState.errors.country && (
                      <p className="mt-1 text-sm text-advist-error">
                        {step2Form.formState.errors.country.message}
                      </p>
                    )}
                  </div>
                  <Input
                    label={t('auth.register.cityOptional')}
                    placeholder="Abidjan"
                    leftIcon={<MapPin size={18} />}
                    {...step2Form.register('city')}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={goBack}>
                    <ArrowLeft size={18} className="mr-2" />
                    {t('auth.register.back')}
                  </Button>
                  <Button type="submit" className="px-8">
                    {t('auth.register.continue')}
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Step 3: Plan Selection & Password */}
          {currentStep === 3 && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-advist-dark/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-advist-gray900" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-advist-gray900">{t('auth.register.choosePlan')}</h2>
                  <p className="text-sm text-advist-gray900/60">{t('auth.register.securePayment')}</p>
                </div>
              </div>

              <form onSubmit={step3Form.handleSubmit(handleFinalSubmit)} className="space-y-6">
                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-advist-gold bg-advist-gold/5 shadow-xl shadow-advist-gold/20'
                          : 'border-advist-border hover:border-advist-gold/50 hover:shadow-lg'
                      }`}
                    >
                      <input
                        type="radio"
                        value={plan.id}
                        className="sr-only"
                        {...step3Form.register('plan')}
                      />
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-advist-gold to-primary-500 text-white text-xs font-bold rounded-full shadow-lg shadow-advist-gold/30">
                          {t('auth.register.popular')}
                        </span>
                      )}
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-bold text-advist-gray900">{plan.price}</span>
                        <span className="text-advist-gray900/60">{plan.period}</span>
                      </div>
                      <h3 className="font-semibold text-advist-gray900">{plan.name}</h3>
                      <p className="text-sm text-advist-gray900/60 mb-4">{plan.description}</p>
                      <ul className="space-y-2 mt-auto">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-advist-gray900">
                            <Check size={14} className="text-advist-success flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {selectedPlan === plan.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-advist-gold to-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-advist-gold/30">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>

                {/* IA Option Add-on - Only for Business and Enterprise */}
                {(selectedPlan === 'business' || selectedPlan === 'enterprise') && (
                  <div
                    className={`relative rounded-2xl border-2 transition-all overflow-hidden ${
                      includeIAOption
                        ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg shadow-amber-100'
                        : 'border-gray-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    <label className="flex cursor-pointer">
                      <div className="p-5 flex-1">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            includeIAOption
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                              : 'bg-gray-100'
                          }`}>
                            <Sparkles className={`w-6 h-6 ${includeIAOption ? 'text-white' : 'text-amber-500'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-advist-gray900">{t('auth.register.iaOption')}</h4>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                {t('auth.register.option')}
                              </span>
                            </div>
                            <p className="text-sm text-advist-gray900/60 mb-3">{iaAddonInfo.description}</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {iaAddonInfo.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-advist-gray900">
                                  <Check size={14} className="text-amber-500 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="w-48 p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 flex flex-col items-center justify-center">
                        <div className="text-center mb-3">
                          <span className="text-2xl font-bold text-advist-gray900">
                            {new Intl.NumberFormat('fr-FR').format(
                              iaAddonInfo.pricing[selectedPlan as 'business' | 'enterprise']
                            )}
                          </span>
                          <span className="text-sm text-advist-gray900/60 ml-1">{iaAddonInfo.currency}</span>
                          <p className="text-xs text-advist-gray900/50">/mois</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeIAOption}
                            onChange={(e) => setIncludeIAOption(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="text-sm font-medium text-advist-gray900">
                            {includeIAOption ? t('auth.register.included') : t('auth.register.addOption')}
                          </span>
                        </div>
                      </div>
                    </label>
                    {includeIAOption && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-green-50 border border-advist-success rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-advist-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-advist-success">{t('auth.register.guaranteeText')}</p>
                    <p className="text-sm text-advist-success">
                      {t('auth.register.guaranteeDesc')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-advist-border pt-6 space-y-4">
                  <h3 className="font-semibold text-advist-gray900">{t('auth.register.createPassword')}</h3>

                  <Input
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.register.passwordMinChars')}
                    leftIcon={<Lock size={18} />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                    error={step3Form.formState.errors.password?.message}
                    helperText={t('auth.register.passwordHelperText')}
                    {...step3Form.register('password')}
                  />

                  <Input
                    label={t('auth.register.confirmPasswordLabel')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.register.confirmPasswordPlaceholder')}
                    leftIcon={<Lock size={18} />}
                    error={step3Form.formState.errors.confirmPassword?.message}
                    {...step3Form.register('confirmPassword')}
                  />
                </div>

                {/* Account Summary */}
                {step1Data && step2Data && (
                  <div className="border-t border-advist-border pt-6">
                    <h3 className="font-semibold text-advist-gray900 mb-4 flex items-center gap-2">
                      <CreditCard size={18} />
                      {t('auth.register.accountSummary')}
                    </h3>
                    <div className="bg-gradient-to-br from-advist-bg to-gray-50 rounded-2xl p-5 space-y-4">
                      {/* Personal Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-advist-dark/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-advist-gray900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-advist-text-secondary mb-0.5">{t('auth.register.administrator')}</p>
                          <p className="font-medium text-advist-gray900 truncate">
                            {step1Data.first_name} {step1Data.last_name}
                          </p>
                          <p className="text-sm text-advist-text-secondary truncate">{step1Data.email}</p>
                        </div>
                      </div>

                      {/* Organization */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-advist-dark/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 size={18} className="text-advist-gray900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-advist-text-secondary mb-0.5">{t('auth.register.organizationLabel')}</p>
                          <p className="font-medium text-advist-gray900 truncate">{step2Data.organization_name}</p>
                          <p className="text-sm text-advist-text-secondary">
                            {step2Data.organization_size} {t('auth.register.employees')} • {industries.find(i => i.value === step2Data.industry)?.label || step2Data.industry}
                          </p>
                        </div>
                      </div>

                      {/* Plan Selection */}
                      <div className="border-t border-advist-border/50 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              selectedPlan === 'enterprise' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                              selectedPlan === 'business' ? 'bg-gradient-to-br from-advist-gold to-primary-500' :
                              'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                              <Sparkles size={14} className="text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-advist-gray900">
                                {t('auth.register.planLabel')} {plans.find(p => p.id === selectedPlan)?.name}
                              </p>
                              <p className="text-xs text-advist-text-secondary">
                                {plans.find(p => p.id === selectedPlan)?.description}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-advist-gray900">
                            {plans.find(p => p.id === selectedPlan)?.price}
                            <span className="text-xs font-normal text-advist-text-secondary">{plans.find(p => p.id === selectedPlan)?.period}</span>
                          </p>
                        </div>

                        {/* IA Option if selected */}
                        {includeIAOption && (selectedPlan === 'business' || selectedPlan === 'enterprise') && (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-advist-border/50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <Sparkles size={14} className="text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-advist-gray900">{t('auth.register.iaOption')}</p>
                                <p className="text-xs text-advist-text-secondary">{t('auth.register.aiOptionLabel')}</p>
                              </div>
                            </div>
                            <p className="font-semibold text-amber-600">
                              +{new Intl.NumberFormat('fr-FR').format(iaAddonInfo.pricing[selectedPlan as 'business' | 'enterprise'])} {iaAddonInfo.currency}
                              <span className="text-xs font-normal text-advist-text-secondary">/mois</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="bg-advist-dark text-white rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/70">{t('auth.register.monthlyTotal')}</p>
                          <p className="text-xs text-white/50">{t('auth.register.afterTrial')}</p>
                        </div>
                        <div className="text-right">
                          {selectedPlan === 'enterprise' ? (
                            <p className="text-xl font-bold">{t('auth.register.custom')}</p>
                          ) : (
                            <>
                              <p className="text-2xl font-bold">
                                {(() => {
                                  const planPrice = selectedPlan === 'business' ? 59000 : 0;
                                  const iaPrice = includeIAOption && (selectedPlan === 'business' || selectedPlan === 'enterprise')
                                    ? iaAddonInfo.pricing[selectedPlan as 'business' | 'enterprise']
                                    : 0;
                                  // Convert plan price to FCFA (approximation)
                                  const planPriceFCFA = planPrice * 655;
                                  return new Intl.NumberFormat('fr-FR').format(planPriceFCFA + iaPrice);
                                })()}
                                <span className="text-sm font-normal ml-1">FCFA</span>
                              </p>
                              <p className="text-xs text-white/50">/mois</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Guarantee reminder */}
                      <div className="flex items-center gap-2 text-sm text-advist-success bg-green-50 rounded-lg px-3 py-2">
                        <Shield size={16} />
                        <span>{t('auth.register.fullRefund')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-advist-border text-advist-gray900 focus:ring-advist-gold"
                    {...step3Form.register('acceptTerms')}
                  />
                  <span className="text-sm text-advist-gray900">
                    {t('auth.register.termsAccept')}{' '}
                    <a href="#" className="text-advist-gray900 font-medium underline">
                      {t('auth.register.termsOfUse')}
                    </a>{' '}
                    {t('auth.register.and')}{' '}
                    <a href="#" className="text-advist-gray900 font-medium underline">
                      {t('auth.register.privacyPolicy')}
                    </a>
                  </span>
                </label>
                {step3Form.formState.errors.acceptTerms && (
                  <p className="text-sm text-advist-error">
                    {step3Form.formState.errors.acceptTerms.message}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={goBack} className="sm:flex-1">
                    <ArrowLeft size={18} className="mr-2" />
                    {t('auth.register.back')}
                  </Button>
                  <Button type="submit" className="sm:flex-[2]">
                    <CreditCard size={18} className="mr-2" />
                    {t('auth.register.continueToPayment')}
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-advist-gray900/50">
            <Shield size={16} />
            <span>{t('auth.register.dataProtected')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
