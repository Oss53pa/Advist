/**
 * ActivateLicensePage - Page d'activation de licence Enterprise
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Key,
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  HardDrive,
  Calendar,
  Star,
  Zap,
  Lock,
} from 'lucide-react';
import { licenseService, License } from '../../services/licenseService';
import { useTenantStore } from '../../stores/tenantStore';
import { useAuthStore } from '../../store';
import { Button } from '../../components/ui';

type ActivationStep = 'input' | 'validating' | 'preview' | 'activating' | 'success' | 'error';

export const ActivateLicensePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentTenant, activateLicense } = useTenantStore();

  const [step, setStep] = useState<ActivationStep>('input');
  const [licenseKey, setLicenseKey] = useState('');
  const [validatedLicense, setValidatedLicense] = useState<License | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formater la clé pendant la saisie
  const handleKeyChange = (value: string) => {
    // Nettoyer et formater
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Auto-ajouter les tirets
    if (cleaned.startsWith('ADVIST') && !cleaned.includes('-')) {
      cleaned = 'ADVIST-';
    }

    setLicenseKey(cleaned);
    setError(null);
  };

  // Valider la licence
  const handleValidate = async () => {
    if (!licenseKey) {
      setError(t('auth.activateLicense.enterKey'));
      return;
    }

    setStep('validating');
    setError(null);

    const result = await licenseService.validateLicense(licenseKey);

    if (result.valid && result.license) {
      setValidatedLicense(result.license);
      setStep('preview');
    } else {
      setError(result.error || t('auth.activateLicense.invalidKey'));
      setStep('error');
    }
  };

  // Activer la licence
  const handleActivate = async () => {
    if (!validatedLicense || !currentTenant || !user) {
      setError(t('auth.activateLicense.configError'));
      return;
    }

    setStep('activating');

    const result = await licenseService.activateLicense(
      licenseKey,
      currentTenant.id.toString(),
      user.email
    );

    if (result.success && result.license) {
      // Mettre à jour le store
      activateLicense({
        key: result.license.key,
        activatedAt: result.license.activatedAt || new Date().toISOString(),
        expiresAt: result.license.validUntil,
        maxUsers: result.license.maxUsers,
        maxStorage: result.license.maxStorage,
      });

      setStep('success');
    } else {
      setError(result.error || t('auth.activateLicense.activationError'));
      setStep('error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#C8A961] to-[#C8A961]/70 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#C8A961]/30">
            <Key className="w-10 h-10 text-[#0A0A0B]" />
          </div>
          <h1 className="text-3xl font-light text-white mb-2">{t('auth.activateLicense.title')}</h1>
          <p className="text-white/40">{t('auth.activateLicense.subtitle')}</p>
        </div>

        {/* Main Card */}
        <div className="bg-[#1A1A1D] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
          {/* Step: Input */}
          {(step === 'input' || step === 'error') && (
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {t('auth.activateLicense.licenseKey')}
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                    size={20}
                  />
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder={t('auth.activateLicense.placeholder')}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl font-mono text-lg tracking-wider focus:outline-none transition-colors bg-white/5 text-white placeholder:text-white/30 ${
                      error
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-white/10 focus:border-[#C8A961]'
                    }`}
                  />
                </div>
                {error && (
                  <div className="mt-3 flex items-center gap-2 text-red-600">
                    <XCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                <p className="mt-2 text-xs text-white/40">{t('auth.activateLicense.format')}</p>
              </div>

              <Button
                onClick={handleValidate}
                className="w-full"
                size="lg"
                disabled={!licenseKey || licenseKey.length < 30}
              >
                {t('auth.activateLicense.verifyLicense')}
              </Button>

              <div className="mt-6 p-4 bg-white/5 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="text-[#C8A961] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {t('auth.activateLicense.noLicense')}
                    </p>
                    <p className="text-sm text-white/40 mt-1">
                      {t('auth.activateLicense.contactSales')}
                    </p>
                    <a
                      href="mailto:sales@advist.com"
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#C8A961] hover:text-[#C8A961]/80 mt-2"
                    >
                      sales@advist.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Validating */}
          {step === 'validating' && (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-[#C8A961] animate-spin mx-auto mb-4" />
              <p className="text-white/40">{t('auth.activateLicense.validating')}</p>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && validatedLicense && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#C8A961]/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-[#C8A961]" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {t('auth.activateLicense.validLicense')}
                  </h3>
                  <p className="text-sm text-white/40">
                    {t('auth.activateLicense.readyToActivate')}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-2">
                    <Star size={16} />
                    {t('auth.activateLicense.plan')}
                  </span>
                  <span className="font-medium text-white">Enterprise</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-2">
                    <Users size={16} />
                    {t('auth.activateLicense.maxUsers')}
                  </span>
                  <span className="font-medium text-white">
                    {validatedLicense.maxUsers === -1
                      ? t('auth.activateLicense.unlimited')
                      : validatedLicense.maxUsers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-2">
                    <HardDrive size={16} />
                    {t('auth.activateLicense.storage')}
                  </span>
                  <span className="font-medium text-white">
                    {validatedLicense.maxStorage === -1
                      ? t('auth.activateLicense.unlimited')
                      : `${validatedLicense.maxStorage} GB`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 flex items-center gap-2">
                    <Calendar size={16} />
                    {t('auth.activateLicense.validUntil')}
                  </span>
                  <span className="font-medium text-white">
                    {formatDate(validatedLicense.validUntil)}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-white mb-2">
                  {t('auth.activateLicense.includedFeatures')}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'SSO & SAML',
                    'Signatures qualifiées',
                    'API complète',
                    'Support prioritaire',
                    'Manager dédié',
                    'White label',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm text-white/80">
                      <Zap size={12} className="text-[#C8A961]" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {currentTenant && (
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg mb-6">
                  <Building2 size={16} className="text-white/40" />
                  <span className="text-sm text-white/40">
                    {t('auth.activateLicense.willBeActivatedFor')}{' '}
                    <strong>{currentTenant.name}</strong>
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
                  <ArrowLeft size={16} className="mr-2" />
                  {t('auth.activateLicense.back')}
                </Button>
                <Button onClick={handleActivate} className="flex-1">
                  <Lock size={16} className="mr-2" />
                  {t('auth.activateLicense.activateLicense')}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Activating */}
          {step === 'activating' && (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-[#C8A961] animate-spin mx-auto mb-4" />
              <p className="text-white/40">{t('auth.activateLicense.activating')}</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-[#C8A961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-[#C8A961]" />
              </div>
              <h3 className="text-2xl font-light text-white mb-2">
                {t('auth.activateLicense.activationSuccess')}
              </h3>
              <p className="text-white/40 mb-6">
                {t('auth.activateLicense.activationSuccessDesc')}
              </p>

              <Button onClick={() => navigate('/user')} className="w-full" size="lg">
                {t('auth.activateLicense.accessApp')}
              </Button>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-white/40 hover:text-[#C8A961] text-sm">
            ← {t('auth.activateLicense.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivateLicensePage;
