/**
 * License Service — Supabase Implementation
 *
 * Gestion des cles d'activation Enterprise.
 * Format de cle: ADVIST-ENT-XXXX-XXXX-XXXX-XXXX
 * Ou X = caracteres alphanumeriques
 *
 * Tables: licenses, license_activations
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';
import { generateVerificationCode as generateVerificationCodeUtil } from '../utils/encryption';

export interface License {
  id: string;
  key: string;
  organizationId?: string;
  organizationName?: string;
  plan: 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'pending';
  features: string[];
  maxUsers: number;
  maxStorage: number; // in GB
  validFrom: string;
  validUntil: string;
  activatedAt?: string;
  activatedBy?: string;
  createdAt: string;
  metadata?: {
    contractNumber?: string;
    salesRep?: string;
    notes?: string;
  };
}

export interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'NOT_FOUND' | 'ALREADY_USED' | 'EXPIRED' | 'REVOKED';
}

export interface CreateLicenseRequest {
  plan: 'enterprise';
  maxUsers: number;
  maxStorage: number;
  validityDays: number;
  features: string[];
  metadata?: {
    contractNumber?: string;
    salesRep?: string;
    notes?: string;
  };
}

// ---------------------------------------------------------------------------
// Row mapper: snake_case DB row -> camelCase License interface
// ---------------------------------------------------------------------------
function mapRowToLicense(row: Record<string, unknown>): License {
  return {
    id: row.id as string,
    key: row.key as string,
    organizationId: (row.organization_id as string) ?? undefined,
    organizationName: (row.organization_name as string) ?? undefined,
    plan: (row.plan as License['plan']) ?? 'enterprise',
    status: row.status as License['status'],
    features: (row.features as string[]) ?? [],
    maxUsers: (row.max_users as number) ?? 0,
    maxStorage: (row.max_storage as number) ?? 0,
    validFrom: row.valid_from as string,
    validUntil: row.valid_until as string,
    activatedAt: (row.activated_at as string) ?? undefined,
    activatedBy: (row.activated_by as string) ?? undefined,
    createdAt: row.created_at as string,
    metadata: (row.metadata as License['metadata']) ?? undefined,
  };
}

class LicenseService {
  private readonly LICENSE_KEY_REGEX = /^ADVIST-ENT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  /**
   * Valide le format d'une cle de licence
   */
  validateKeyFormat(key: string): boolean {
    return this.LICENSE_KEY_REGEX.test(key.toUpperCase().trim());
  }

  /**
   * Verifie une cle de licence
   */
  async validateLicense(key: string): Promise<LicenseValidationResult> {
    const normalizedKey = key.toUpperCase().trim();

    // Verifier le format
    if (!this.validateKeyFormat(normalizedKey)) {
      return {
        valid: false,
        error: 'Format de cle invalide. Le format attendu est ADVIST-ENT-XXXX-XXXX-XXXX-XXXX',
        errorCode: 'INVALID_FORMAT',
      };
    }

    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', normalizedKey)
        .maybeSingle();

      if (error) throw parseSupabaseError(error);

      if (!data) {
        return {
          valid: false,
          error: 'Cle de licence non trouvee',
          errorCode: 'NOT_FOUND',
        };
      }

      const row = data as Record<string, unknown>;

      if (row.status === 'active' && row.organization_id) {
        return {
          valid: false,
          error: 'Cette licence est deja utilisee par une autre organisation',
          errorCode: 'ALREADY_USED',
        };
      }

      if (row.status === 'expired' || new Date(row.valid_until as string) < new Date()) {
        return {
          valid: false,
          error: 'Cette licence a expire',
          errorCode: 'EXPIRED',
        };
      }

      if (row.status === 'revoked') {
        return {
          valid: false,
          error: 'Cette licence a ete revoquee',
          errorCode: 'REVOKED',
        };
      }

      return {
        valid: true,
        license: mapRowToLicense(row),
      };
    } catch (err) {
      console.error('License validation error:', err);
      return {
        valid: false,
        error: 'Erreur lors de la validation de la licence',
      };
    }
  }

  /**
   * Active une licence pour une organisation
   */
  async activateLicense(
    key: string,
    organizationId: string,
    activatedBy: string,
  ): Promise<{ success: boolean; license?: License; error?: string }> {
    const normalizedKey = key.toUpperCase().trim();

    try {
      // Valider d'abord
      const validation = await this.validateLicense(normalizedKey);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Activate the license
      const { data, error } = await supabase
        .from('licenses')
        .update({
          status: 'active',
          organization_id: organizationId,
          activated_at: new Date().toISOString(),
          activated_by: activatedBy,
        })
        .eq('key', normalizedKey)
        .select('*')
        .single();

      if (error) throw parseSupabaseError(error);

      // Record the activation in license_activations
      await supabase
        .from('license_activations')
        .insert({
          license_id: (data as Record<string, unknown>).id,
          organization_id: organizationId,
          activated_by: activatedBy,
        });

      return {
        success: true,
        license: mapRowToLicense(data as Record<string, unknown>),
      };
    } catch (err) {
      console.error('License activation error:', err);
      return { success: false, error: "Erreur lors de l'activation de la licence" };
    }
  }

  /**
   * Recupere la licence active de l'organisation courante
   */
  async getCurrentLicense(organizationId: string): Promise<License | null> {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw parseSupabaseError(error);
      if (!data) return null;

      return mapRowToLicense(data as Record<string, unknown>);
    } catch (err) {
      console.error('Get license error:', err);
      return null;
    }
  }

  /**
   * Genere une nouvelle cle de licence (Super Admin uniquement)
   */
  async createLicense(request: CreateLicenseRequest): Promise<License> {
    const generatedKey = `ADVIST-ENT-${generateVerificationCodeUtil()}`;
    const now = new Date();
    const validUntil = new Date(now.getTime() + request.validityDays * 24 * 60 * 60 * 1000);

    const insertPayload = {
      key: generatedKey,
      plan: request.plan,
      status: 'pending' as const,
      features: request.features,
      max_users: request.maxUsers,
      max_storage: request.maxStorage,
      valid_from: now.toISOString(),
      valid_until: validUntil.toISOString(),
      metadata: request.metadata ?? null,
    };

    const { data, error } = await supabase
      .from('licenses')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return mapRowToLicense(data as Record<string, unknown>);
  }

  /**
   * Liste toutes les licences (Super Admin uniquement)
   */
  async listLicenses(): Promise<License[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return ((data ?? []) as Record<string, unknown>[]).map(mapRowToLicense);
  }

  /**
   * Revoque une licence (Super Admin uniquement)
   */
  async revokeLicense(licenseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('licenses')
      .update({ status: 'revoked' })
      .eq('id', licenseId);

    if (error) {
      console.error('Revoke license error:', error);
      return false;
    }
    return true;
  }
}

export const licenseService = new LicenseService();
export default licenseService;
