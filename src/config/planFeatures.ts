/**
 * Plan Features - Feature gating strict Business vs Entreprise
 *
 * Source de vérité pour savoir quelle fonctionnalité est disponible par plan.
 * La spec commerciale prime toujours.
 */

export const PLAN_FEATURES = {
  business: {
    // === IMPORT & GESTION DOCUMENTAIRE ===
    importDocuments: true,
    documentPreview: true,
    hashSha256: true,
    exportDossierPDF: true,
    workflowTemplates: false, // Enterprise only

    // === WORKFLOW DE VALIDATION ===
    configurableCircuits: true,
    sequentialValidation: true,
    parallelValidation: true,
    upTo10Participants: true,
    conditionalRules: false, // Enterprise only
    emailNotifications: true,
    automaticReminders: false, // Enterprise only
    realtimeTracking: true,

    // === ANNOTATIONS & COLLABORATION ===
    annotations: true,
    highlighting: true,
    completeHistory: true,

    // === SIGNATURE ÉLECTRONIQUE ===
    simpleSignature: true,
    advancedSignature: false, // Enterprise only (eIDAS)
    electronicSeal: false, // Enterprise only
    qualifiedTimestamp: false, // Enterprise only
    identityVerification: false, // Enterprise only

    // === INTERVENANTS & ACCÈS ===
    unlimitedExternalSigners: true,
    secureExternalLink: true,

    // === ORGANISATION & GOUVERNANCE ===
    multiDepartments: false, // Enterprise only
    rbac: false, // Enterprise only
    ohadaCompliance: false, // Enterprise only
    analyticsDashboard: false, // Enterprise only

    // === INTÉGRATIONS & SÉCURITÉ ===
    cloudSecure: true,
    apiAccess: false, // Enterprise only
    ssoSaml: false, // Enterprise only

    // === SUPPORT ===
    emailSupport: true,
    prioritySupport: false, // Enterprise only
    includedTraining: false, // Enterprise only
    sla: false, // Enterprise only
  },

  enterprise: {
    // === IMPORT & GESTION DOCUMENTAIRE ===
    importDocuments: true,
    documentPreview: true,
    hashSha256: true,
    exportDossierPDF: true,
    workflowTemplates: true,

    // === WORKFLOW DE VALIDATION ===
    configurableCircuits: true,
    sequentialValidation: true,
    parallelValidation: true,
    upTo10Participants: true,
    conditionalRules: true,
    emailNotifications: true,
    automaticReminders: true,
    realtimeTracking: true,

    // === ANNOTATIONS & COLLABORATION ===
    annotations: true,
    highlighting: true,
    completeHistory: true,

    // === SIGNATURE ÉLECTRONIQUE ===
    simpleSignature: true,
    advancedSignature: true,
    electronicSeal: true,
    qualifiedTimestamp: true,
    identityVerification: true,

    // === INTERVENANTS & ACCÈS ===
    unlimitedExternalSigners: true,
    secureExternalLink: true,

    // === ORGANISATION & GOUVERNANCE ===
    multiDepartments: true,
    rbac: true,
    ohadaCompliance: true,
    analyticsDashboard: true,

    // === INTÉGRATIONS & SÉCURITÉ ===
    cloudSecure: true,
    apiAccess: true,
    ssoSaml: true,

    // === SUPPORT ===
    emailSupport: true,
    prioritySupport: true,
    includedTraining: true,
    sla: true,
  },
} as const;

export type PlanFeature = keyof typeof PLAN_FEATURES.business;
export type PlanId = keyof typeof PLAN_FEATURES;

/**
 * Vérifie si un plan a une fonctionnalité
 */
export function hasPlanFeature(planId: PlanId, feature: PlanFeature): boolean {
  return PLAN_FEATURES[planId]?.[feature] ?? false;
}

/**
 * Liste des features Enterprise-only (pour affichage comparatif)
 */
export const ENTERPRISE_ONLY_FEATURES: PlanFeature[] = (
  Object.keys(PLAN_FEATURES.business) as PlanFeature[]
).filter((key) => !PLAN_FEATURES.business[key] && PLAN_FEATURES.enterprise[key]);

/**
 * Labels français des fonctionnalités
 */
export const FEATURE_LABELS: Record<PlanFeature, string> = {
  importDocuments: 'Import documents (PDF, images)',
  documentPreview: "Prévisualisation dans l'interface",
  hashSha256: 'Hash SHA-256 par document',
  exportDossierPDF: 'Export dossier complet (PDF + audit trail)',
  workflowTemplates: 'Templates de workflow réutilisables',
  configurableCircuits: 'Circuits de validation configurables',
  sequentialValidation: 'Validation séquentielle',
  parallelValidation: 'Validation parallèle',
  upTo10Participants: "Jusqu'à 10 intervenants par circuit",
  conditionalRules: 'Circuits conditionnels (si/alors)',
  emailNotifications: 'Notification email à chaque étape',
  automaticReminders: 'Rappels automatiques aux signataires',
  realtimeTracking: "Suivi en temps réel de l'avancement",
  annotations: 'Annotations & commentaires (sidebar)',
  highlighting: 'Surlignage avec identification auteur',
  completeHistory: 'Historique & traçabilité complète',
  simpleSignature: 'Signature électronique simple',
  advancedSignature: 'Signature électronique avancée (eIDAS)',
  electronicSeal: 'Cachet électronique (personne morale)',
  qualifiedTimestamp: 'Horodatage qualifié',
  identityVerification: "Vérification d'identité du signataire",
  unlimitedExternalSigners: 'Signataires/validateurs externes illimités',
  secureExternalLink: 'Lien sécurisé pour intervenants externes',
  multiDepartments: 'Multi-départements / multi-sites',
  rbac: 'Gestion des rôles & permissions (RBAC)',
  ohadaCompliance: 'Conformité OHADA (archivage 10 ans)',
  analyticsDashboard: 'Tableau de bord analytique',
  cloudSecure: 'Cloud sécurisé & backup',
  apiAccess: 'API REST pour intégrations',
  ssoSaml: 'SSO / SAML',
  emailSupport: 'Support email',
  prioritySupport: 'Support prioritaire & account manager',
  includedTraining: 'Formation incluse',
  sla: 'SLA 99,9%',
};
