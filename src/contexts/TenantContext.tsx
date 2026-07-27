/**
 * Tenant Context - Provides tenant isolation across the application
 */
import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useTenantStore, Tenant, TenantFeatures, TenantQuotas } from '../stores/tenantStore';
import { useAuthStore } from '../store';

interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;

  // Feature checks
  hasFeature: (feature: keyof TenantFeatures) => boolean;

  // Quota checks
  checkQuota: (quota: keyof TenantQuotas) => {
    allowed: boolean;
    current: number;
    max: number;
    percentage: number;
  };
  isQuotaExceeded: (quota: keyof TenantQuotas) => boolean;
  getQuotaWarning: (quota: keyof TenantQuotas) => 'ok' | 'warning' | 'critical' | 'exceeded';

  // Data isolation helpers
  getTenantPrefix: () => string;
  getTenantStorageKey: (key: string) => string;

  // Plan info
  isPlanAtLeast: (plan: 'business' | 'enterprise') => boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentTenant, isLoading, error, checkFeature, checkQuota } = useTenantStore();
  const { user } = useAuthStore();

  // Sync tenant from user's organization
  useEffect(() => {
    if (user?.organization && !currentTenant) {
      // In a real app, this would fetch the full tenant data from the API
      // For now, we create a basic tenant from the user's organization
      const org = user.organization;
      useTenantStore.getState().setTenant({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.subscription_plan || 'business',
        status: org.is_active ? 'active' : 'inactive',
        quotas: {
          maxUsers: org.quotas?.max_users || 50,
          currentUsers: org.quotas?.current_users || 0,
          maxStorage: org.quotas?.max_storage_gb || 100,
          currentStorage: org.quotas?.current_storage_gb || 0,
          maxDocuments: org.quotas?.max_documents || 10000,
          currentDocuments: org.quotas?.current_documents || 0,
          maxWorkflows: org.quotas?.max_active_workflows || 50,
          currentWorkflows: org.quotas?.current_active_workflows || 0,
          maxSignaturesMonth: 500,
          currentSignaturesMonth: 0,
        },
        features: {
          documentVersioning: true,
          documentAnnotations: true,
          documentComparison: true,
          trackChanges: true,
          bulkImport: true,
          cloudIntegration: true,
          advancedWorkflows: true,
          conditionalRules: true,
          parallelSignatures: true,
          workflowTemplates: true,
          simpleSignature: true,
          advancedSignature: true,
          qualifiedSignature: org.subscription_plan === 'enterprise',
          ohadaCompliance: org.ohada_compliant || true,
          signatureCertificates: true,
          ssoEnabled: true,
          twoFactorAuth: true,
          ipRestriction: org.subscription_plan === 'enterprise',
          auditLogs: true,
          dataExport: true,
          offlineMode: true,
          apiAccess: true,
          customBranding: true,
          prioritySupport: true,
        },
        settings: {
          language: 'fr',
          timezone: 'Africa/Abidjan',
          dateFormat: 'DD/MM/YYYY',
          workingDays: org.working_days || [1, 2, 3, 4, 5],
          workingHours: { start: '08:00', end: '18:00' },
          retentionPeriodDays: 3650,
          autoArchiveDays: 365,
          notifications: {
            emailEnabled: true,
            pushEnabled: true,
            digestFrequency: 'daily',
          },
        },
        createdAt: new Date().toISOString(),
      });
    }
  }, [user, currentTenant]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant: currentTenant,
      isLoading,
      error,

      hasFeature: (feature: keyof TenantFeatures) => {
        return checkFeature(feature);
      },

      checkQuota: (quota: keyof TenantQuotas) => {
        return checkQuota(quota);
      },

      isQuotaExceeded: (quota: keyof TenantQuotas) => {
        const result = checkQuota(quota);
        return !result.allowed;
      },

      getQuotaWarning: (quota: keyof TenantQuotas) => {
        const result = checkQuota(quota);
        if (result.max === -1) return 'ok'; // Unlimited
        if (result.percentage >= 100) return 'exceeded';
        if (result.percentage >= 90) return 'critical';
        if (result.percentage >= 75) return 'warning';
        return 'ok';
      },

      getTenantPrefix: () => {
        if (!currentTenant) return 'default';
        return `tenant_${currentTenant.id}`;
      },

      getTenantStorageKey: (key: string) => {
        if (!currentTenant) return key;
        return `tenant_${currentTenant.id}_${key}`;
      },

      isPlanAtLeast: (plan: 'business' | 'enterprise') => {
        if (!currentTenant) return false;
        const planOrder: Record<string, number> = { business: 0, enterprise: 1 };
        return (planOrder[currentTenant.plan] ?? 0) >= (planOrder[plan] ?? 0);
      },
    }),
    [currentTenant, isLoading, error, checkFeature, checkQuota]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

// Custom hook to use tenant context
export const useTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// HOC to require specific feature
export const withFeature = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: keyof TenantFeatures,
  FallbackComponent?: React.ComponentType
) => {
  return function WithFeatureComponent(props: P) {
    const { hasFeature } = useTenant();

    if (!hasFeature(feature)) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return (
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-[#383733] mb-2">
            Fonctionnalité non disponible
          </h3>
          <p className="text-[#A29790]">
            Cette fonctionnalité n'est pas incluse dans votre plan actuel. Mettez à niveau pour y
            accéder.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// Component to conditionally render based on feature
export const FeatureGate: React.FC<{
  feature: keyof TenantFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ feature, children, fallback }) => {
  const { hasFeature } = useTenant();

  if (!hasFeature(feature)) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
};

// Component to show quota usage
export const QuotaDisplay: React.FC<{
  quota: keyof TenantQuotas;
  showLabel?: boolean;
  className?: string;
}> = ({ quota, showLabel = true, className = '' }) => {
  const { checkQuota, getQuotaWarning } = useTenant();
  const result = checkQuota(quota);
  const warning = getQuotaWarning(quota);

  const labels: Record<string, string> = {
    maxUsers: 'Utilisateurs',
    maxStorage: 'Stockage',
    maxDocuments: 'Documents',
    maxWorkflows: 'Workflows',
    maxSignaturesMonth: 'Signatures/mois',
  };

  const label = labels[quota.replace('current', 'max')] || quota;

  const colorClasses = {
    ok: 'bg-advist-success',
    warning: 'bg-advist-gold',
    critical: 'bg-advist-gold',
    exceeded: 'bg-advist-error',
  };

  if (result.max === -1) {
    return (
      <div className={`${className}`}>
        {showLabel && <span className="text-sm text-[#A29790]">{label}</span>}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#383733]">
            {result.current.toLocaleString()}
          </span>
          <span className="text-xs text-advist-success">Illimité</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-[#A29790]">{label}</span>
          <span className="text-[#383733]">
            {result.current.toLocaleString()} / {result.max.toLocaleString()}
          </span>
        </div>
      )}
      <div className="h-2 bg-[#EAEAEA] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClasses[warning]}`}
          style={{ width: `${Math.min(result.percentage, 100)}%` }}
        />
      </div>
      {warning !== 'ok' && (
        <p
          className={`text-xs mt-1 ${
            warning === 'exceeded'
              ? 'text-advist-error'
              : warning === 'critical'
                ? 'text-advist-gold-dark'
                : 'text-advist-gold-dark'
          }`}
        >
          {warning === 'exceeded' && 'Quota dépassé'}
          {warning === 'critical' && 'Quota presque atteint'}
          {warning === 'warning' && 'Attention au quota'}
        </p>
      )}
    </div>
  );
};

export default TenantContext;
