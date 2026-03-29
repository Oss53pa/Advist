import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  X,
  Users,
  HardDrive,
  FileText,
  PenTool,
  FolderKanban,
  Clock,
  Zap,
  User,
  Sparkles,
  Crown,
  Building2,
} from 'lucide-react';
import { Modal, Button } from '../ui';
import { useTenantStore, getPlanInfo, PlanType, PLAN_ORDER } from '../../stores/tenantStore';

interface PlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

const PLAN_ICONS: Record<PlanType, React.ElementType> = {
  free: Zap,
  solo: User,
  starter: Sparkles,
  business: Crown,
  enterprise: Building2,
};

const PLAN_COLORS: Record<PlanType, string> = {
  free: 'from-gray-500 to-gray-600',
  solo: 'from-teal-500 to-teal-600',
  starter: 'from-blue-500 to-blue-600',
  business: 'from-purple-600 to-indigo-700',
  enterprise: 'from-amber-500 to-amber-600',
};

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  const { t } = useTranslation();
  const { currentTenant } = useTenantStore();
  const plan = currentTenant?.plan || 'business';
  const planInfo = getPlanInfo(plan);
  const quotas = currentTenant?.quotas;
  const features = currentTenant?.features;

  const Icon = PLAN_ICONS[plan];
  const colorClass = PLAN_COLORS[plan];

  const formatQuota = (value: number) => {
    if (value === -1) return t('billing.planDetails.unlimited');
    return value.toLocaleString('fr-FR');
  };

  const formatStorage = (gb: number) => {
    if (gb === -1) return t('billing.planDetails.unlimited');
    return `${gb} Go`;
  };

  const currentPlanIndex = PLAN_ORDER.indexOf(plan);
  const canUpgrade = currentPlanIndex < PLAN_ORDER.length - 1;

  // Feature categories for display
  const featureCategories = [
    {
      title: t('billing.featureCategories.documents'),
      items: [
        { key: 'documentVersioning', label: t('billing.featureLabels.versioning') },
        { key: 'documentAnnotations', label: t('billing.featureLabels.annotations') },
        { key: 'documentComparison', label: t('billing.featureLabels.comparison') },
        { key: 'trackChanges', label: t('billing.featureLabels.trackChanges') },
        { key: 'bulkImport', label: t('billing.featureLabels.bulkImport') },
        { key: 'ocrRecognition', label: t('billing.featureLabels.ocr') },
      ],
    },
    {
      title: t('billing.featureCategories.signatures'),
      items: [
        { key: 'simpleSignature', label: t('billing.featureLabels.simpleSignature') },
        { key: 'advancedSignature', label: t('billing.featureLabels.advancedSignature') },
        { key: 'qualifiedSignature', label: t('billing.featureLabels.qualifiedSignature') },
        { key: 'signatureCertificates', label: t('billing.featureLabels.certificates') },
        { key: 'biometricSignature', label: t('billing.featureLabels.biometric') },
        { key: 'parallelSignatures', label: t('billing.featureLabels.parallel') },
      ],
    },
    {
      title: t('billing.featureCategories.workflows'),
      items: [
        { key: 'basicWorkflows', label: t('billing.featureLabels.basicWorkflows') },
        { key: 'advancedWorkflows', label: t('billing.featureLabels.advancedWorkflows') },
        { key: 'conditionalRules', label: t('billing.featureLabels.conditional') },
        { key: 'workflowTemplates', label: t('billing.featureLabels.templates') },
        { key: 'workflowAnalytics', label: t('billing.featureLabels.analytics') },
      ],
    },
    {
      title: t('billing.featureCategories.integrations'),
      items: [
        { key: 'cloudIntegration', label: t('billing.featureLabels.cloud') },
        { key: 'apiAccess', label: t('billing.featureLabels.api') },
        { key: 'webhooks', label: t('billing.featureLabels.webhooks') },
        { key: 'zapierIntegration', label: t('billing.featureLabels.zapier') },
        { key: 'erpIntegration', label: t('billing.featureLabels.erp') },
        { key: 'crmIntegration', label: t('billing.featureLabels.crm') },
      ],
    },
    {
      title: t('billing.featureCategories.security'),
      items: [
        { key: 'twoFactorAuth', label: t('billing.featureLabels.twoFactor') },
        { key: 'ssoEnabled', label: t('billing.featureLabels.sso') },
        { key: 'ipRestriction', label: t('billing.featureLabels.ipRestriction') },
        { key: 'auditLogs', label: t('billing.featureLabels.auditLogs') },
        { key: 'advancedAuditLogs', label: t('billing.featureLabels.advancedAudit') },
        { key: 'dataEncryption', label: t('billing.featureLabels.encryption') },
      ],
    },
    {
      title: t('billing.featureCategories.other'),
      items: [
        { key: 'offlineMode', label: t('billing.featureLabels.offlineMode') },
        { key: 'customBranding', label: t('billing.featureLabels.branding') },
        { key: 'whiteLabel', label: t('billing.featureLabels.whiteLabel') },
        { key: 'aiAssistant', label: t('billing.featureLabels.aiAssistant') },
        { key: 'prioritySupport', label: t('billing.featureLabels.prioritySupport') },
        { key: 'dedicatedManager', label: t('billing.featureLabels.dedicatedManager') },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('billing.planDetails.title')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Plan Header */}
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${colorClass} text-white`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold">{planInfo.name}</h3>
                {plan === 'business' && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    {t('billing.popular')}
                  </span>
                )}
              </div>
              <p className="text-white/80">{planInfo.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {planInfo.price === '0' ? t('billing.free') : `${planInfo.price}`}
              </div>
              {planInfo.price !== '0' && (
                <div className="text-white/80 text-sm">{planInfo.period}</div>
              )}
            </div>
          </div>
        </div>

        {/* Quotas */}
        {quotas && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-4">{t('billing.planDetails.quotas')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('billing.planDetails.users')}</div>
                  <div className="font-semibold text-gray-900">
                    {quotas.currentUsers} / {formatQuota(quotas.maxUsers)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('billing.planDetails.storage')}</div>
                  <div className="font-semibold text-gray-900">
                    {quotas.currentStorage} / {formatStorage(quotas.maxStorage)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('billing.planDetails.documents')}</div>
                  <div className="font-semibold text-gray-900">
                    {quotas.currentDocuments} / {formatQuota(quotas.maxDocuments)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('billing.planDetails.signatures')}</div>
                  <div className="font-semibold text-gray-900">
                    {quotas.currentSignaturesMonth} / {formatQuota(quotas.maxSignaturesMonth)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('billing.planDetails.projects')}</div>
                  <div className="font-semibold text-gray-900">
                    {quotas.currentProjects} / {formatQuota(quotas.maxProjects)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('billing.planDetails.auditLogs')}</div>
                  <div className="font-semibold text-gray-900">
                    {planInfo.limits.auditLogs}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {features && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">{t('billing.planDetails.features')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
              {featureCategories.map((category) => (
                <div key={category.title} className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-medium text-gray-700 text-sm mb-3">{category.title}</h5>
                  <div className="space-y-2">
                    {category.items.map((item) => {
                      const isEnabled = features[item.key as keyof typeof features];
                      return (
                        <div key={item.key} className="flex items-center gap-2 text-sm">
                          {isEnabled ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          )}
                          <span className={isEnabled ? 'text-gray-900' : 'text-gray-400'}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('billing.planDetails.close')}
          </Button>
          {canUpgrade && onUpgrade && (
            <Button className="flex-1" onClick={onUpgrade}>
              {t('billing.upgradeToHigher')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PlanDetailsModal;
