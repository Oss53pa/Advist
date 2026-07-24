/**
 * Document Quota Service - Enforcement des limites documents/mois
 * Quotas sourced from Atlas Studio via tenant store.
 */
import { supabase } from '../lib/supabase';
import { useTenantStore } from '../stores/tenantStore';

export const documentQuotaService = {
  /**
   * Vérifie si la création d'un document est autorisée selon le quota mensuel
   */
  async checkCanCreateDocument(
    organizationId: string,
    _plan?: string
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
  }> {
    const tenant = useTenantStore.getState().currentTenant;
    const maxDocs = tenant?.quotas?.maxDocuments ?? -1;

    // Unlimited
    if (maxDocs === -1) {
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
      return { allowed: true, current: 0, limit: maxDocs, remaining: maxDocs };
    }

    const current = count || 0;
    const remaining = Math.max(0, maxDocs - current);

    return {
      allowed: current < maxDocs,
      current,
      limit: maxDocs,
      remaining,
    };
  },

  /**
   * Retourne les stats d'utilisation du mois en cours
   */
  async getMonthlyUsage(
    organizationId: string,
    _plan?: string
  ): Promise<{
    documentsThisMonth: number;
    limit: number;
    percentage: number;
    isUnlimited: boolean;
  }> {
    const tenant = useTenantStore.getState().currentTenant;
    const maxDocs = tenant?.quotas?.maxDocuments ?? -1;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString());

    const documentsThisMonth = count || 0;

    if (maxDocs === -1) {
      return { documentsThisMonth, limit: -1, percentage: 0, isUnlimited: true };
    }

    return {
      documentsThisMonth,
      limit: maxDocs,
      percentage: Math.round((documentsThisMonth / maxDocs) * 100),
      isUnlimited: false,
    };
  },
};

export default documentQuotaService;
