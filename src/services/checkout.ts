/**
 * Checkout Service — REDIRECT ONLY
 *
 * Les paiements et abonnements sont gérés exclusivement sur Atlas Studio.
 * Ce service redirige simplement vers le portail Atlas Studio.
 */

const ATLAS_STUDIO_PRICING = 'https://atlas-studio.org/applications/advist';
const ATLAS_STUDIO_PORTAL = 'https://atlas-studio.org/portal';

export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  is_popular?: boolean;
}

export const checkoutService = {
  /**
   * Redirige vers la page de tarifs Atlas Studio
   */
  redirectToAtlasStudio(): void {
    window.location.href = ATLAS_STUDIO_PRICING;
  },

  /**
   * Redirige vers le portail Atlas Studio (gestion des abonnements)
   */
  redirectToPortal(): void {
    window.location.href = ATLAS_STUDIO_PORTAL;
  },

  /**
   * URL de la page pricing Atlas Studio (pour les liens)
   */
  getPricingUrl(): string {
    return ATLAS_STUDIO_PRICING;
  },

  /**
   * URL du portail Atlas Studio
   */
  getPortalUrl(): string {
    return ATLAS_STUDIO_PORTAL;
  },
};

export default checkoutService;
