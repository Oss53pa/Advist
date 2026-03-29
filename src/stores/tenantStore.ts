/**
 * Tenant Store - Multi-tenant management with data isolation
 * Includes subscription, trial management, and feature gating
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlanType = 'business' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended' | 'cancelled';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  plan: PlanType;
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
  advancedCloudSync: boolean; // Bidirectional cloud sync (M365/Google)
  erpIntegration: boolean; // Sage/SAP integration
  crmIntegration: boolean; // Salesforce integration
  workflowTriggers: boolean; // External workflow triggers
  contractGeneration: boolean; // Contract generation from CRM

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

/**
 * PLAN FEATURES - Fonctionnalités par plan
 *
 * BUSINESS : 25 000 FCFA/mois par émetteur (1-5 émetteurs), 50 docs/mois
 * ENTERPRISE : 150 000 FCFA/mois forfait, tout illimité
 *
 * Aligné sur la spécification commerciale — la spec prime toujours.
 */
const PLAN_FEATURES: Record<PlanType, TenantFeatures> = {
  // BUSINESS - 25 000 FCFA/mois par utilisateur émetteur
  business: {
    // Documents - Base
    documentVersioning: true,
    documentAnnotations: true,
    documentComparison: true,
    trackChanges: true,
    bulkImport: true,
    cloudIntegration: true,
    documentTemplates: false, // Enterprise only (templates de workflow)
    ocrRecognition: true,

    // Workflows - Base (pas de conditionnels, pas de templates)
    basicWorkflows: true,
    advancedWorkflows: true,
    conditionalRules: false, // Enterprise only
    parallelSignatures: true,
    workflowTemplates: false, // Enterprise only
    workflowAnalytics: false, // Enterprise only (tableau de bord analytique)

    // Signatures - Simple uniquement
    simpleSignature: true,
    advancedSignature: false, // Enterprise only (eIDAS)
    qualifiedSignature: false, // Enterprise only (horodatage qualifié)
    ohadaCompliance: false, // Enterprise only
    signatureCertificates: false, // Enterprise only
    biometricSignature: false,

    // Sécurité - Base
    ssoEnabled: false, // Enterprise only (SSO/SAML)
    twoFactorAuth: true,
    ipRestriction: false,
    auditLogs: true,
    advancedAuditLogs: false,
    dataExport: true,
    dataEncryption: true,

    // Intégrations - Base (pas d'API)
    apiAccess: false, // Enterprise only
    webhooks: false,
    zapierIntegration: false,
    customIntegrations: false,

    // External system integrations - Non
    advancedCloudSync: false,
    erpIntegration: false,
    crmIntegration: false,
    workflowTriggers: false,
    contractGeneration: false,

    // Projets - Base
    basicProjects: true,
    advancedProjects: false,
    projectAnalytics: false,

    // Rapports - Base
    basicReports: true,
    advancedReports: false,
    reportsExport: true,

    // Autres
    offlineMode: false,
    customBranding: false,
    whiteLabel: false,
    prioritySupport: false, // Enterprise only
    dedicatedManager: false,
    customReports: false,
    aiAssistant: false,
  },

  // ENTERPRISE - 150 000 FCFA/mois forfait, tout illimité
  enterprise: {
    // Documents - Tout
    documentVersioning: true,
    documentAnnotations: true,
    documentComparison: true,
    trackChanges: true,
    bulkImport: true,
    cloudIntegration: true,
    documentTemplates: true,
    ocrRecognition: true,

    // Workflows - Tout
    basicWorkflows: true,
    advancedWorkflows: true,
    conditionalRules: true,
    parallelSignatures: true,
    workflowTemplates: true,
    workflowAnalytics: true,

    // Signatures - Tout
    simpleSignature: true,
    advancedSignature: true,
    qualifiedSignature: true,
    ohadaCompliance: true,
    signatureCertificates: true,
    biometricSignature: true,

    // Sécurité - Tout
    ssoEnabled: true,
    twoFactorAuth: true,
    ipRestriction: true,
    auditLogs: true,
    advancedAuditLogs: true,
    dataExport: true,
    dataEncryption: true,

    // Intégrations - Tout
    apiAccess: true,
    webhooks: true,
    zapierIntegration: true,
    customIntegrations: true,

    // External system integrations - Tout
    advancedCloudSync: true,
    erpIntegration: true,
    crmIntegration: true,
    workflowTriggers: true,
    contractGeneration: true,

    // Projets - Tout
    basicProjects: true,
    advancedProjects: true,
    projectAnalytics: true,

    // Rapports - Tout
    basicReports: true,
    advancedReports: true,
    reportsExport: true,

    // Autres - Tout
    offlineMode: true,
    customBranding: true,
    whiteLabel: true,
    prioritySupport: true,
    dedicatedManager: true,
    customReports: true,
    aiAssistant: true,
  },
};

/**
 * PLAN QUOTAS - Limites par plan
 *
 * Business: 1-5 émetteurs, 50 docs/mois, externes illimités
 * Enterprise: tout illimité
 */
const PLAN_QUOTAS: Record<PlanType, Partial<TenantQuotas>> = {
  business: {
    maxUsers: 5, // 1 à 5 utilisateurs émetteurs (spec)
    maxStorage: 10, // 10 GB
    maxDocuments: 50, // 50 documents/mois (spec)
    maxWorkflows: 10,
    maxSignaturesMonth: 50,
    maxProjects: 5,
  },
  enterprise: {
    maxUsers: -1, // Illimité
    maxStorage: -1, // Illimité
    maxDocuments: -1, // Illimité
    maxWorkflows: -1, // Illimité
    maxSignaturesMonth: -1, // Illimité
    maxProjects: -1, // Illimité
  },
};

/**
 * TRIAL DURATION - Durée de la période d'essai
 */
const TRIAL_DURATION_DAYS = 30;
const GRACE_PERIOD_DAYS = 7;

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

  // Plan switching (for dev/testing)
  switchPlan: (plan: PlanType) => void;

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
            plan: 'enterprise',
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
              maxDocuments: -1,
              maxWorkflows: -1,
              maxSignaturesMonth: -1,
            },
            features: PLAN_FEATURES.enterprise,
          },
        });
      },

      // Switch plan (for dev/testing purposes)
      switchPlan: (plan: PlanType) => {
        const { currentTenant } = get();
        if (!currentTenant) return;

        const planQuotas = PLAN_QUOTAS[plan];
        const planFeatures = PLAN_FEATURES[plan];

        set({
          currentTenant: {
            ...currentTenant,
            plan,
            quotas: {
              ...currentTenant.quotas,
              maxUsers: planQuotas.maxUsers || 2,
              maxStorage: planQuotas.maxStorage || 1,
              maxDocuments: planQuotas.maxDocuments || 50,
              maxWorkflows: planQuotas.maxWorkflows || 1,
              maxSignaturesMonth: planQuotas.maxSignaturesMonth || 10,
            },
            features: planFeatures,
          },
        });
      },

      checkFeature: (feature: keyof TenantFeatures): boolean => {
        const { currentTenant, canAccessApp } = get();
        if (!currentTenant) return false;

        // Si l'accès à l'app est bloqué, aucune fonctionnalité disponible
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
        const { currentTenant, getDaysRemaining } = get();
        if (!currentTenant) return false;

        const { status, plan } = currentTenant;
        const daysRemaining = getDaysRemaining();

        // Montrer le prompt si :
        // 1. En trial et moins de 5 jours restants
        // 2. Plan Business et utilisation > 80%
        if (status === 'trial' && daysRemaining <= 5) return true;
        if (plan === 'business') {
          const quota = currentTenant.quotas;
          const usagePercentage = Math.max(
            quota.currentDocuments / quota.maxDocuments,
            quota.currentUsers / quota.maxUsers,
            quota.currentSignaturesMonth / quota.maxSignaturesMonth
          );
          if (usagePercentage >= 0.8) return true;
        }

        return false;
      },

      canAccessApp: (): { allowed: boolean; reason?: string } => {
        const { currentTenant } = get();
        if (!currentTenant) {
          return { allowed: false, reason: 'no_tenant' };
        }

        const { status, subscription } = currentTenant;

        // Actif = OK
        if (status === 'active') {
          return { allowed: true };
        }

        // Trial = vérifier expiration
        if (status === 'trial') {
          const trialEndsAt = subscription.trialEndsAt;
          if (trialEndsAt && new Date(trialEndsAt) < new Date()) {
            return { allowed: false, reason: 'trial_expired' };
          }
          return { allowed: true };
        }

        // Expiré = vérifier période de grâce
        if (status === 'expired') {
          const gracePeriodEndsAt = subscription.gracePeriodEndsAt;
          if (gracePeriodEndsAt && new Date(gracePeriodEndsAt) > new Date()) {
            return { allowed: true }; // Encore en période de grâce
          }
          return { allowed: false, reason: 'subscription_expired' };
        }

        // Suspendu ou Annulé = Bloqué
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
      partialize: (state) => ({
        currentTenant: state.currentTenant,
      }),
    }
  )
);

/**
 * Helper to create a new tenant with trial
 */
export const createTenant = (name: string, slug: string, plan: PlanType = 'business'): Tenant => {
  const planQuotas = PLAN_QUOTAS[plan];
  const planFeatures = PLAN_FEATURES[plan];
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  return {
    id: Date.now(),
    name,
    slug,
    plan,
    status: 'trial',
    quotas: {
      maxUsers: planQuotas.maxUsers || 5,
      currentUsers: 1,
      maxStorage: planQuotas.maxStorage || 10,
      currentStorage: 0,
      maxDocuments: planQuotas.maxDocuments || 500,
      currentDocuments: 0,
      maxWorkflows: planQuotas.maxWorkflows || 3,
      currentWorkflows: 0,
      maxSignaturesMonth: planQuotas.maxSignaturesMonth || 25,
      currentSignaturesMonth: 0,
      maxProjects: planQuotas.maxProjects || 3,
      currentProjects: 0,
    },
    features: planFeatures,
    settings: {
      language: 'fr',
      timezone: 'Africa/Abidjan',
      dateFormat: 'DD/MM/YYYY',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '08:00', end: '18:00' },
      retentionPeriodDays: 365 * 10,
      autoArchiveDays: 365,
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        digestFrequency: 'daily',
      },
    },
    subscription: {
      status: 'trial',
      trialStartedAt: now.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      autoRenew: false,
    },
    createdAt: now.toISOString(),
  };
};

/**
 * Helper to get plan display info
 */
export const getPlanInfo = (plan: PlanType) => {
  const info: Record<
    PlanType,
    {
      name: string;
      description: string;
      price: string;
      priceYearly?: string;
      period: string;
      popular: boolean;
      color: string;
      features: string[];
      limits: {
        users: string;
        storage: string;
        documents: string;
        signatures: string;
        workflows: string;
        projects: string;
        auditLogs: string;
      };
      requiresLicense?: boolean;
    }
  > = {
    business: {
      name: 'Business',
      description: 'PME',
      price: '25 000',
      priceYearly: '20 000',
      period: 'FCFA/mois/émetteur',
      popular: true,
      color: 'purple',
      features: [
        '1 à 5 utilisateurs émetteurs',
        '50 documents/mois',
        'Externes illimités',
        'Signature simple',
        'Workflows configurables',
        'Validation séquentielle & parallèle',
        'Annotations & commentaires',
        'Export dossier PDF',
        'Support email',
      ],
      limits: {
        users: '1 à 5 émetteurs',
        storage: '10 Go',
        documents: '50/mois',
        signatures: '50/mois',
        workflows: '10',
        projects: '5',
        auditLogs: '1 an',
      },
    },
    enterprise: {
      name: 'Entreprise',
      description: 'Grandes entreprises',
      price: '150 000',
      priceYearly: '120 000',
      period: 'FCFA/mois',
      popular: false,
      color: 'gold',
      features: [
        'Tout illimité',
        'Signature avancée (eIDAS)',
        'Cachet électronique',
        'Horodatage qualifié',
        'Circuits conditionnels',
        'Templates de workflow',
        'Multi-départements & RBAC',
        'Conformité OHADA',
        'API REST & SSO/SAML',
        'Support prioritaire & formation',
        'SLA 99,9%',
      ],
      limits: {
        users: 'Illimité',
        storage: 'Illimité',
        documents: 'Illimité',
        signatures: 'Illimité',
        workflows: 'Illimité',
        projects: 'Illimité',
        auditLogs: '10 ans',
      },
      requiresLicense: true,
    },
  };

  return info[plan];
};

/**
 * Liste ordonnée des plans pour l'affichage
 */
export const PLAN_ORDER: PlanType[] = ['business', 'enterprise'];

/**
 * Helper to check if a plan includes a specific feature
 */
export const planHasFeature = (plan: PlanType, feature: keyof TenantFeatures): boolean => {
  return PLAN_FEATURES[plan]?.[feature] ?? false;
};

/**
 * Helper to get plan quota
 */
export const getPlanQuota = (plan: PlanType, quota: keyof TenantQuotas): number => {
  const planQuotas = PLAN_QUOTAS[plan];
  return (planQuotas?.[quota] as number) ?? 0;
};

// Export configurations
export { PLAN_FEATURES, PLAN_QUOTAS, TRIAL_DURATION_DAYS, GRACE_PERIOD_DAYS };
