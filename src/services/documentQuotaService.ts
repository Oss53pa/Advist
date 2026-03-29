/**
 * Document Quota Service - Enforcement des limites documents/mois
 *
 * Business : 50 documents/mois
 * Entreprise : illimité
 */
import { supabase } from '../lib/supabase';
import { PLANS } from '../config/plans';

export const documentQuotaService = {
  /**
   * Vérifie si la création d'un document est autorisée selon le quota mensuel
   */
  async checkCanCreateDocument(
    organizationId: string,
    plan: string
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
  }> {
    if (plan === 'enterprise') {
      return { allowed: true, current: 0, limit: -1, remaining: -1 };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error checking document quota:', error);
      // En cas d'erreur, on autorise par défaut pour ne pas bloquer l'utilisateur
      return {
        allowed: true,
        current: 0,
        limit: PLANS.BUSINESS.limits.documentsPerMonth,
        remaining: PLANS.BUSINESS.limits.documentsPerMonth,
      };
    }

    const current = count || 0;
    const limit = PLANS.BUSINESS.limits.documentsPerMonth;
    const remaining = Math.max(0, limit - current);

    return {
      allowed: current < limit,
      current,
      limit,
      remaining,
    };
  },

  /**
   * Retourne les stats d'utilisation du mois en cours
   */
  async getMonthlyUsage(
    organizationId: string,
    plan: string
  ): Promise<{
    documentsThisMonth: number;
    limit: number;
    percentage: number;
    isUnlimited: boolean;
  }> {
    if (plan === 'enterprise') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', startOfMonth.toISOString());

      return {
        documentsThisMonth: count || 0,
        limit: -1,
        percentage: 0,
        isUnlimited: true,
      };
    }

    const quota = await documentQuotaService.checkCanCreateDocument(organizationId, plan);
    const limit = PLANS.BUSINESS.limits.documentsPerMonth;

    return {
      documentsThisMonth: quota.current,
      limit,
      percentage: Math.round((quota.current / limit) * 100),
      isUnlimited: false,
    };
  },
};

export default documentQuotaService;
