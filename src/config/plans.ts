/**
 * Plans Configuration - Source de vérité pour la tarification
 *
 * Business : 25 000 FCFA/mois PAR utilisateur émetteur (1 à 5 émetteurs)
 * Entreprise : 150 000 FCFA/mois forfait tout illimité
 */

export type PricingModel = 'per_emitter' | 'flat';

export interface PlanConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly annualPrice: number;
  readonly pricingModel: PricingModel;
  readonly currency: 'XOF';
  readonly popular: boolean;
  readonly limits: {
    readonly emitters: number; // -1 = illimité
    readonly documentsPerMonth: number; // -1 = illimité
    readonly externalSigners: number; // -1 = illimité
  };
}

export const PLANS = {
  BUSINESS: {
    id: 'business',
    name: 'Business',
    description: 'PME',
    price: 25000, // FCFA/mois PAR utilisateur émetteur
    annualPrice: 20000, // -20% annuel
    pricingModel: 'per_emitter' as const,
    currency: 'XOF' as const,
    popular: true,
    limits: {
      emitters: 5, // 1 à 5 utilisateurs émetteurs
      documentsPerMonth: 50, // 50 documents/mois
      externalSigners: -1, // illimité
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Entreprise',
    description: 'Grandes entreprises',
    price: 150000, // FCFA/mois forfait
    annualPrice: 120000, // -20% annuel
    pricingModel: 'flat' as const,
    currency: 'XOF' as const,
    popular: false,
    limits: {
      emitters: -1, // illimité
      documentsPerMonth: -1, // illimité
      externalSigners: -1, // illimité
    },
  },
} as const;

export type PlanId = 'business' | 'enterprise';

/**
 * Retourne le plan par son ID
 */
export function getPlan(planId: PlanId): PlanConfig {
  return planId === 'enterprise' ? PLANS.ENTERPRISE : PLANS.BUSINESS;
}

/**
 * Retourne le prix formaté pour affichage
 */
export function formatPlanPrice(planId: PlanId, annual = false): string {
  const plan = getPlan(planId);
  const price = annual ? plan.annualPrice : plan.price;
  return price.toLocaleString('fr-FR');
}

/**
 * Calcule le prix total pour Business (par émetteur)
 */
export function calculateBusinessTotal(emitterCount: number, annual = false): number {
  const plan = PLANS.BUSINESS;
  const unitPrice = annual ? plan.annualPrice : plan.price;
  return unitPrice * Math.min(Math.max(emitterCount, 1), plan.limits.emitters);
}

/**
 * Taux de TVA applicable
 */
export const TAX_RATE = 18; // 18% TVA
