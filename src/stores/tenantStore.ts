/**
 * Tenant Store - Multi-tenant management with data isolation
 * Features and quotas are sourced from Atlas Studio — no hardcoded plan data.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended' | 'cancelled';

export interface Tenant {
  id: number | string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  plan: string;
  status: SubscriptionStatus;
  quotas: TenantQuotas;
  features: TenantFeatures;
  settings: TenantSettings;
  subscription: SubscriptionInfo;
  license?: LicenseInfo;
  createdAt: string;
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  trialStartedAt?: string;
  trialEndsAt?: string;
  subscribedAt?: string;
  expiresAt?: string;
  lastPaymentAt?: string;
  nextPaymentAt?: string;
  gracePeriodEndsAt?: string;
  autoRenew: boolean;
  currentPeriodEnd?: string;
}

export interface LicenseInfo {
  key: string;
  activatedAt: string;
  expiresAt: string;
  maxUsers: number;
  maxStorage: number;
}

export interface TenantQuotas {
  maxUsers: number;
  currentUsers: number;
  maxStorage: number; // in GB
  currentStorage: number;
  maxDocuments: number;
  currentDocuments: number;
  maxWorkflows: number;
  currentWorkflows: number;
  maxSignaturesMonth: number;
  currentSignaturesMonth: number;
  maxProjects: number;
  currentProjects: number;
}

export interface TenantFeatures {
  // Document features
  documentVersioning: boolean;
  documentAnnotations: boolean;
  documentComparison: boolean;
  trackChanges: boolean;
  bulkImport: boolean;
  cloudIntegration: boolean;
  documentTemplates: boolean;
  ocrRecognition: boolean;

  // Workflow features
  basicWorkflows: boolean;
  advancedWorkflows: boolean;
  conditionalRules: boolean;
  parallelSignatures: boolean;
  workflowTemplates: boolean;
  workflowAnalytics: boolean;

  // Signature features
  simpleSignature: boolean;
  advancedSignature: boolean;
  qualifiedSignature: boolean;
  ohadaCompliance: boolean;
  signatureCertificates: boolean;
  biometricSignature: boolean;

  // Security features
  ssoEnabled: boolean;
  twoFactorAuth: boolean;
  ipRestriction: boolean;
  auditLogs: boolean;
  advancedAuditLogs: boolean;
  dataExport: boolean;
  dataEncryption: boolean;

  // Integration features
  apiAccess: boolean;
  webhooks: boolean;
  zapierIntegration: boolean;
  customIntegrations: boolean;

  // External system integrations
  advancedCloudSync: boolean;
  erpIntegration: boolean;
  crmIntegration: boolean;
  workflowTriggers: boolean;
  contractGeneration: boolean;

  // Project features
  basicProjects: boolean;
  advancedProjects: boolean;
  projectAnalytics: boolean;

  // Report features
  basicReports: boolean;
  advancedReports: boolean;
  reportsExport: boolean;

  // Other features
  offlineMode: boolean;
  customBranding: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  dedicatedManager: boolean;
  customReports: boolean;
  aiAssistant: boolean;

  // Allow additional dynamic features from Atlas Studio
  [key: string]: boolean;
}

export interface TenantSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  workingDays: number[];
  workingHours: { start: string; end: string };
  retentionPeriodDays: number;
  autoArchiveDays: number;
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    digestFrequency: 'daily' | 'weekly' | 'never';
  };
}

interface TenantState {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTenant: (tenant: Tenant) => void;
  clearTenant: () => void;
  updateTenantSettings: (settings: Partial<TenantSettings>) => void;
  updateSubscription: (subscription: Partial<SubscriptionInfo>) => void;
  activateLicense: (license: LicenseInfo) => void;

  // Feature & Quota checks
  checkFeature: (feature: keyof TenantFeatures) => boolean;
  checkQuota: (quota: keyof TenantQuotas) => {
    allowed: boolean;
    current: number;
    max: number;
    percentage: number;
  };
  incrementQuota: (
    quota:
      | 'currentUsers'
      | 'currentStorage'
      | 'currentDocuments'
      | 'currentWorkflows'
      | 'currentSignaturesMonth',
    amount?: number
  ) => void;

  // Subscription checks
  isTrialExpired: () => boolean;
  isSubscriptionActive: () => boolean;
  getDaysRemaining: () => number;
  shouldShowUpgradePrompt: () => boolean;
  canAccessApp: () => { allowed: boolean; reason?: string };
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      isLoading: false,
      error: null,

      setTenant: (tenant: Tenant) => {
        set({ currentTenant: tenant, error: null });
      },

      clearTenant: () => {
        set({ currentTenant: null });
      },

      updateTenantSettings: (settings: Partial<TenantSettings>) => {
        const { currentTenant } = get();
        if (!currentTenant) return;

        set({
          currentTenant: {
            ...currentTenant,
            settings: {
              ...currentTenant.settings,
              ...settings,
            },
          },
        });
      },

      updateSubscription: (subscription: Partial<SubscriptionInfo>) => {
        const { currentTenant } = get();
        if (!currentTenant) return;

        set({
          currentTenant: {
            ...currentTenant,
            subscription: {
              ...currentTenant.subscription,
              ...subscription,
            },
            status: subscription.status || currentTenant.status,
          },
        });
      },

      activateLicense: (license: LicenseInfo) => {
        const { currentTenant } = get();
        if (!currentTenant) return;

        set({
          currentTenant: {
            ...currentTenant,
            license,
            status: 'active',
            subscription: {
              ...currentTenant.subscription,
              status: 'active',
              subscribedAt: new Date().toISOString(),
              expiresAt: license.expiresAt,
            },
            quotas: {
              ...currentTenant.quotas,
              maxUsers: license.maxUsers,
              maxStorage: license.maxStorage,
            },
          },
        });
      },

      checkFeature: (feature: keyof TenantFeatures): boolean => {
        const { currentTenant, canAccessApp } = get();
        if (!currentTenant) return false;

        const access = canAccessApp();
        if (!access.allowed) return false;

        return currentTenant.features[feature] ?? false;
      },

      checkQuota: (quota: keyof TenantQuotas) => {
        const { currentTenant } = get();
        if (!currentTenant) {
          return { allowed: false, current: 0, max: 0, percentage: 0 };
        }

        const quotas = currentTenant.quotas;
        const maxKey = quota.replace('current', 'max') as keyof TenantQuotas;
        const currentValue = quotas[quota] as number;
        const maxValue = quotas[maxKey] as number;

        // -1 means unlimited
        if (maxValue === -1) {
          return { allowed: true, current: currentValue, max: -1, percentage: 0 };
        }

        const percentage = Math.round((currentValue / maxValue) * 100);
        const allowed = currentValue < maxValue;

        return { allowed, current: currentValue, max: maxValue, percentage };
      },

      incrementQuota: (quota, amount = 1) => {
        const { currentTenant } = get();
        if (!currentTenant) return;

        set({
          currentTenant: {
            ...currentTenant,
            quotas: {
              ...currentTenant.quotas,
              [quota]: (currentTenant.quotas[quota] as number) + amount,
            },
          },
        });
      },

      isTrialExpired: (): boolean => {
        const { currentTenant } = get();
        if (!currentTenant) return true;

        if (currentTenant.status !== 'trial') return false;

        const trialEndsAt = currentTenant.subscription.trialEndsAt;
        if (!trialEndsAt) return true;

        return new Date(trialEndsAt) < new Date();
      },

      isSubscriptionActive: (): boolean => {
        const { currentTenant } = get();
        if (!currentTenant) return false;

        const { status } = currentTenant;
        return status === 'active' || status === 'trial';
      },

      getDaysRemaining: (): number => {
        const { currentTenant } = get();
        if (!currentTenant) return 0;

        const { status, subscription } = currentTenant;

        let endDate: string | undefined;

        if (status === 'trial') {
          endDate = subscription.trialEndsAt;
        } else if (status === 'active') {
          endDate = subscription.expiresAt || currentTenant.license?.expiresAt;
        } else if (status === 'expired') {
          endDate = subscription.gracePeriodEndsAt;
        }

        if (!endDate) return 0;

        const remaining = new Date(endDate).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
      },

      shouldShowUpgradePrompt: (): boolean => {
        return false; // Plans managed by Atlas Studio
      },

      canAccessApp: (): { allowed: boolean; reason?: string } => {
        const { currentTenant } = get();
        if (!currentTenant) {
          return { allowed: false, reason: 'no_tenant' };
        }

        const { status, subscription } = currentTenant;

        if (status === 'active') {
          return { allowed: true };
        }

        if (status === 'trial') {
          const trialEndsAt = subscription.trialEndsAt;
          if (trialEndsAt && new Date(trialEndsAt) < new Date()) {
            return { allowed: false, reason: 'trial_expired' };
          }
          return { allowed: true };
        }

        if (status === 'expired') {
          const gracePeriodEndsAt = subscription.gracePeriodEndsAt;
          if (gracePeriodEndsAt && new Date(gracePeriodEndsAt) > new Date()) {
            return { allowed: true };
          }
          return { allowed: false, reason: 'subscription_expired' };
        }

        if (status === 'suspended') {
          return { allowed: false, reason: 'suspended' };
        }

        if (status === 'cancelled') {
          return { allowed: false, reason: 'cancelled' };
        }

        return { allowed: false, reason: 'unknown' };
      },
    }),
    {
      name: 'advist-tenant',
      version: 3,
      migrate: (_persisted: unknown, fromVersion: number) => {
        if (fromVersion < 3) {
          return { currentTenant: null };
        }
        return _persisted as { currentTenant: Tenant | null };
      },
      partialize: (state) => ({
        currentTenant: state.currentTenant,
      }),
    }
  )
);
