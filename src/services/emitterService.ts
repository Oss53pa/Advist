/**
 * Emitter Service - Gestion des utilisateurs émetteurs
 *
 * Un émetteur est un utilisateur interne qui peut créer et initier des workflows.
 * Les externes (signataires, validateurs) ne comptent pas dans ce quota.
 *
 * Business : 1 à 5 émetteurs max
 * Entreprise : illimité
 */
import { supabase } from '../lib/supabase';
import { PLANS } from '../config/plans';

export const emitterService = {
  /**
   * Compte les émetteurs actifs du tenant
   */
  async countEmitters(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_emitter', true)
      .eq('is_active', true);

    if (error) {
      console.error('Error counting emitters:', error);
      return 0;
    }
    return count || 0;
  },

  /**
   * Vérifie si on peut ajouter un émetteur selon le plan
   */
  async canAddEmitter(
    organizationId: string,
    plan: string
  ): Promise<{
    allowed: boolean;
    current: number;
    max: number;
  }> {
    if (plan === 'enterprise') {
      return { allowed: true, current: 0, max: -1 };
    }

    const current = await emitterService.countEmitters(organizationId);
    const max = PLANS.BUSINESS.limits.emitters;

    return {
      allowed: current < max,
      current,
      max,
    };
  },

  /**
   * Définit le statut émetteur d'un utilisateur
   */
  async setEmitter(userId: string, isEmitter: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_emitter: isEmitter })
      .eq('id', userId);

    if (error) {
      throw new Error(`Impossible de modifier le statut émetteur: ${error.message}`);
    }
  },

  /**
   * Vérifie si un utilisateur est émetteur
   */
  async isEmitter(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_emitter')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return data.is_emitter === true;
  },

  /**
   * Liste les émetteurs d'une organisation
   */
  async listEmitters(organizationId: string): Promise<
    Array<{
      id: string;
      full_name: string;
      email: string;
      is_emitter: boolean;
    }>
  > {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_emitter')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error listing emitters:', error);
      return [];
    }
    return data || [];
  },
};

export default emitterService;
