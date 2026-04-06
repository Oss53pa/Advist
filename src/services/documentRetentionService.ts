/**
 * Document Retention Service
 * Module 7 — Conservation legale 10 ans avec protection anti-suppression
 * Acte Uniforme OHADA — Conservation des preuves de signature
 */
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetentionRecord {
  id: string;
  documentId: string;
  organizationId: string;
  documentType: string | null;
  legalBasis: string | null;
  retentionYears: number;
  retainUntil: string;
  isLocked: boolean;
  createdAt: string;
}

export interface ApplyRetentionParams {
  documentId: string;
  organizationId: string;
  documentType?: string;
  retentionYears?: number;
  legalBasis?: string;
  storagePath?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class DocumentRetentionService {
  /**
   * Applique la politique de retention par defaut (10 ans OHADA)
   * Appelee automatiquement apres chaque signature
   */
  async applyDefaultRetention(
    documentId: string,
    organizationId: string,
    documentType?: string,
  ): Promise<RetentionRecord> {
    return this.applyRetention({
      documentId,
      organizationId,
      documentType,
      retentionYears: 10,
      legalBasis: 'Acte Uniforme OHADA - Art. 17 / Loi CI n°2013-546',
    });
  }

  /**
   * Applique une politique de retention personnalisee
   */
  async applyRetention(params: ApplyRetentionParams): Promise<RetentionRecord> {
    const retentionYears = params.retentionYears || 10;
    const retainUntil = new Date();
    retainUntil.setFullYear(retainUntil.getFullYear() + retentionYears);

    const { data, error } = await supabase
      .from('document_retention')
      .upsert(
        {
          document_id: params.documentId,
          organization_id: params.organizationId,
          document_type: params.documentType || null,
          legal_basis: params.legalBasis || 'Acte Uniforme OHADA - Art. 17',
          retention_years: retentionYears,
          retain_until: retainUntil.toISOString(),
          is_locked: true,
          locked_at: new Date().toISOString(),
          storage_path: params.storagePath || null,
        },
        { onConflict: 'document_id' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    return this.mapRecord(data);
  }

  /**
   * Verifie si un document est sous retention
   */
  async isUnderRetention(documentId: string): Promise<boolean> {
    const { data } = await supabase
      .from('document_retention')
      .select('id, is_locked, retain_until')
      .eq('document_id', documentId)
      .eq('is_locked', true)
      .gt('retain_until', new Date().toISOString())
      .maybeSingle();

    return !!data;
  }

  /**
   * Recupere l'enregistrement de retention pour un document
   */
  async getRetention(documentId: string): Promise<RetentionRecord | null> {
    const { data, error } = await supabase
      .from('document_retention')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? this.mapRecord(data) : null;
  }

  /**
   * Liste toutes les retentions d'une organisation
   */
  async getOrganizationRetentions(organizationId: string): Promise<RetentionRecord[]> {
    const { data, error } = await supabase
      .from('document_retention')
      .select('*')
      .eq('organization_id', organizationId)
      .order('retain_until', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapRecord);
  }

  /**
   * Demande de deverrouillage (workflow admin)
   */
  async requestUnlock(documentId: string, userId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('document_retention')
      .update({
        unlock_requested_by: userId,
        unlock_requested_at: new Date().toISOString(),
        unlock_reason: reason,
      })
      .eq('document_id', documentId);

    if (error) throw new Error(error.message);
  }

  private mapRecord(data: Record<string, unknown>): RetentionRecord {
    return {
      id: data.id as string,
      documentId: data.document_id as string,
      organizationId: data.organization_id as string,
      documentType: data.document_type as string | null,
      legalBasis: data.legal_basis as string | null,
      retentionYears: data.retention_years as number,
      retainUntil: data.retain_until as string,
      isLocked: data.is_locked as boolean,
      createdAt: data.created_at as string,
    };
  }
}

export const documentRetentionService = new DocumentRetentionService();
