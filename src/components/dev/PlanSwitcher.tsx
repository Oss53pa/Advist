import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Check,
  X,
  FileText,
  PenTool,
  GitBranch,
  Plug,
  Shield,
  Settings,
} from 'lucide-react';
import { useTenantStore, PlanType, getPlanInfo, PLAN_ORDER, PLAN_FEATURES, createTenant } from '../../stores/tenantStore';
import { PLAN_ICONS, PLAN_THEME, getPlanTheme } from '../../hooks/usePlanTheme';
import type { TenantFeatures } from '../../stores/tenantStore';

/**
 * PlanSwitcher - Dropdown pour tester les différents plans
 * Utilise les couleurs centralisées de usePlanTheme
 */
export const PlanSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { currentTenant, switchPlan, setTenant } = useTenantStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-initialiser un tenant par défaut pour le mode dev
  useEffect(() => {
    if (!currentTenant && !isInitialized) {
      const defaultTenant = createTenant('ADVIST Demo', 'advist-demo', 'business');
      setTenant(defaultTenant);
      setIsInitialized(true);
    } else if (currentTenant) {
      setIsInitialized(true);
    }
  }, [currentTenant, setTenant, isInitialized]);

  // Afficher un bouton de chargement pendant l'initialisation
  if (!currentTenant) {
    return (
      <button
        onClick={() => {
          const defaultTenant = createTenant('ADVIST Demo', 'advist-demo', 'business');
          setTenant(defaultTenant);
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-primary-100 text-primary-700 border-primary-300 hover:bg-primary-200 transition-all"
      >
        <Check size={14} />
        <span>{t('dev.planSwitcher.initializePlan', 'Initialiser Plan')}</span>
      </button>
    );
  }

  const currentPlan = currentTenant.plan;
  const planInfo = getPlanInfo(currentPlan);
  const theme = getPlanTheme(currentPlan);
  const Icon = PLAN_ICONS[currentPlan];

  const handlePlanChange = (plan: PlanType) => {
    switchPlan(plan);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button - utilise les couleurs du plan actuel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${theme.badge} ${theme.border}`}
      >
        <Icon size={14} />
        <span>{planInfo.name}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-primary-200 overflow-hidden z-50">
            {/* Header avec couleur du plan actuel */}
            <div className={`px-4 py-3 ${theme.bgGradient} border-b`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${theme.textOnBg} opacity-80 uppercase tracking-wider`}>{t('dev.planSwitcher.testMode', 'Mode test')}</p>
                  <p className={`text-sm font-semibold ${theme.textOnBg}`}>{t('dev.planSwitcher.changePlan', 'Changer de plan')}</p>
                </div>
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className={`text-xs ${theme.textOnBg} opacity-80 hover:opacity-100 font-medium`}
                >
                  {showFeatures ? t('dev.planSwitcher.hideFeatures', 'Masquer fonctionnalités') : t('dev.planSwitcher.showFeatures', 'Voir fonctionnalités')}
                </button>
              </div>
            </div>

            {/* Plan List */}
            <div className="py-2">
              {PLAN_ORDER.map((plan) => {
                const info = getPlanInfo(plan);
                const planTheme = getPlanTheme(plan);
                const PlanIcon = PLAN_ICONS[plan];
                const isActive = plan === currentPlan;

                return (
                  <button
                    key={plan}
                    onClick={() => handlePlanChange(plan)}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      isActive ? planTheme.bgLight : 'hover:bg-primary-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${planTheme.badge}`}>
                      <PlanIcon size={16} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary-900">{info.name}</span>
                        {info.popular && (
                          <span className={`px-1.5 py-0.5 ${planTheme.badge} text-[10px] font-bold rounded`}>
                            {t('dev.planSwitcher.popular', 'POPULAIRE')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-primary-500">
                        {info.price === '0' ? t('dev.planSwitcher.free', 'Gratuit') : `${info.price} ${info.period}`}
                      </p>
                    </div>
                    {isActive && <Check size={18} className={planTheme.text} />}
                  </button>
                );
              })}
            </div>

            {/* Features Section */}
            {showFeatures && (
              <div className={`border-t bg-gray-50 px-3 py-3 max-h-[400px] overflow-y-auto`}>
                <p className={`text-xs font-semibold text-gray-700 mb-3`}>
                  {t('dev.planSwitcher.planFeatures', { plan: planInfo.name, defaultValue: `Fonctionnalités du plan ${planInfo.name}` })}
                </p>
                <FeaturesList plan={currentPlan} />
              </div>
            )}

            {/* Footer */}
            <div className={`px-4 py-2 ${theme.bgMedium} border-t ${theme.borderLight}`}>
              <p className={`text-[10px] ${theme.text} text-center`}>
                {t('dev.planSwitcher.devOnlyNote', 'Mode développement uniquement - Les changements sont temporaires')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * FeaturesList - Affiche la liste des fonctionnalités groupées par catégorie
 */
const FeaturesList: React.FC<{ plan: PlanType }> = ({ plan }) => {
  const features = PLAN_FEATURES[plan];
  const theme = getPlanTheme(plan);

  // Catégories de fonctionnalités avec icônes
  const categories = [
    {
      title: 'Documents',
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
      items: [
        { key: 'documentVersioning', label: 'Versioning' },
        { key: 'documentAnnotations', label: 'Annotations' },
        { key: 'documentComparison', label: 'Comparaison' },
        { key: 'trackChanges', label: 'Suivi modifs' },
        { key: 'bulkImport', label: 'Import masse' },
        { key: 'cloudIntegration', label: 'Cloud' },
        { key: 'documentTemplates', label: 'Templates' },
        { key: 'ocrRecognition', label: 'OCR' },
      ],
    },
    {
      title: 'Signatures',
      icon: PenTool,
      color: 'text-purple-600 bg-purple-100',
      items: [
        { key: 'simpleSignature', label: 'Simple' },
        { key: 'advancedSignature', label: 'Avancee' },
        { key: 'qualifiedSignature', label: 'Qualifiee' },
        { key: 'ohadaCompliance', label: 'OHADA' },
        { key: 'signatureCertificates', label: 'Certificats' },
        { key: 'biometricSignature', label: 'Biometrique' },
        { key: 'parallelSignatures', label: 'Paralleles' },
      ],
    },
    {
      title: 'Workflows',
      icon: GitBranch,
      color: 'text-green-600 bg-green-100',
      items: [
        { key: 'basicWorkflows', label: 'Basiques' },
        { key: 'advancedWorkflows', label: 'Avances' },
        { key: 'conditionalRules', label: 'Conditionnels' },
        { key: 'workflowTemplates', label: 'Templates' },
        { key: 'workflowAnalytics', label: 'Analytics' },
      ],
    },
    {
      title: 'Integrations',
      icon: Plug,
      color: 'text-orange-600 bg-orange-100',
      items: [
        { key: 'apiAccess', label: 'API' },
        { key: 'webhooks', label: 'Webhooks' },
        { key: 'zapierIntegration', label: 'Zapier' },
        { key: 'customIntegrations', label: 'Custom' },
        { key: 'advancedCloudSync', label: 'Cloud Sync' },
        { key: 'erpIntegration', label: 'ERP' },
        { key: 'crmIntegration', label: 'CRM' },
      ],
    },
    {
      title: 'Securite',
      icon: Shield,
      color: 'text-red-600 bg-red-100',
      items: [
        { key: 'twoFactorAuth', label: '2FA' },
        { key: 'ssoEnabled', label: 'SSO/SAML' },
        { key: 'ipRestriction', label: 'IP restrict.' },
        { key: 'auditLogs', label: 'Logs audit' },
        { key: 'advancedAuditLogs', label: 'Audit++' },
        { key: 'dataExport', label: 'Export' },
        { key: 'dataEncryption', label: 'Chiffrement' },
      ],
    },
    {
      title: 'Autres',
      icon: Settings,
      color: 'text-gray-600 bg-gray-200',
      items: [
        { key: 'offlineMode', label: 'Hors ligne' },
        { key: 'customBranding', label: 'Branding' },
        { key: 'whiteLabel', label: 'White label' },
        { key: 'prioritySupport', label: 'Support+' },
        { key: 'dedicatedManager', label: 'Manager' },
        { key: 'customReports', label: 'Rapports' },
        { key: 'aiAssistant', label: 'IA' },
      ],
    },
  ];

  // Compter les fonctionnalités activées
  const enabledCount = Object.values(features).filter(Boolean).length;
  const totalCount = Object.keys(features).length;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${(enabledCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-gray-500">
          {enabledCount}/{totalCount}
        </span>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          const enabledInCategory = category.items.filter(
            (item) => features[item.key as keyof TenantFeatures]
          ).length;

          return (
            <div key={category.title} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border-b border-gray-100">
                <div className={`p-1 rounded ${category.color}`}>
                  <CategoryIcon size={10} />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 flex-1">
                  {category.title}
                </span>
                <span className="text-[10px] text-gray-400">
                  {enabledInCategory}/{category.items.length}
                </span>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-4 gap-0.5 p-1.5">
                {category.items.map((item) => {
                  const isEnabled = features[item.key as keyof TenantFeatures];
                  return (
                    <div
                      key={item.key}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-center transition-all ${
                        isEnabled
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-transparent opacity-50'
                      }`}
                    >
                      {isEnabled ? (
                        <Check size={10} className="text-green-600" />
                      ) : (
                        <X size={10} className="text-gray-400" />
                      )}
                      <span
                        className={`text-[9px] leading-tight ${
                          isEnabled ? 'text-gray-700 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * PlanBadge - Badge affichant le plan actuel (coin bas droit)
 */
export const PlanBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { currentTenant } = useTenantStore();

  if (!currentTenant) return null;

  const plan = currentTenant.plan;
  const planInfo = getPlanInfo(plan);
  const theme = getPlanTheme(plan);
  const Icon = PLAN_ICONS[plan];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${theme.badgeSolid} ${className}`}
    >
      <Icon size={14} />
      <span>Plan {planInfo.name}</span>
    </div>
  );
};

export default PlanSwitcher;
