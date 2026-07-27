/**
 * Signature Service — Supabase Implementation
 *
 * Migrated from localStorage persistence to Supabase tables:
 * - user_signatures: saved signature templates
 * - document_signatures: actual signatures on documents
 * - signature_certificates: certificate chain with hash verification
 * - signature_audit_log: audit trail
 *
 * Valeur Probante (Loi CI 2013-546):
 * - Server-side timestamp via Edge Function (not client new Date())
 * - Integrity seal: SHA-256(documentHash + signatureImageHash + signerId + serverTimestamp)
 * - OTP verification link (verification_id)
 * - Explicit consent link (consent_id)
 * - 10-year retention auto-applied after signature
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';
import { SignatureData } from '../components/signature/SignaturePad';
import { documentRetentionService } from './documentRetentionService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignatureCertificate {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signatureType: 'simple' | 'advanced' | 'qualified';
  signatureData: SignatureData;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  hash: string;
  previousHash?: string;
  status: 'valid' | 'revoked' | 'expired';
  // Valeur probante fields
  serverTimestamp?: string;
  documentHash?: string;
  signatureImageHash?: string;
  integritySeal?: string;
  verificationId?: string;
  consentId?: string;
}

export interface SignatureVerificationResult {
  isValid: boolean;
  certificate?: SignatureCertificate;
  errors?: string[];
  verifiedAt: string;
}

export interface SavedSignature {
  id: string;
  userId: string;
  signatureData: SignatureData;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAuth(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return user.id;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class SignatureService {
  // -----------------------------------------------------------------------
  // Saved Signatures (user_signatures table)
  // -----------------------------------------------------------------------

  async getSavedSignatures(userId: string): Promise<SavedSignature[]> {
    const { data, error } = await supabase
      .from('user_signatures')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      signatureData:
        typeof s.signature_data === 'string' ? JSON.parse(s.signature_data) : s.signature_data,
      name: s.name,
      isDefault: s.is_default || false,
      createdAt: s.created_at,
    }));
  }

  async saveSignature(
    userId: string,
    signatureData: SignatureData,
    name: string,
    setAsDefault = false
  ): Promise<SavedSignature> {
    // If setting as default, unset other defaults
    if (setAsDefault) {
      await supabase
        .from('user_signatures')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    // Check if user has any signatures (first one becomes default)
    const { count } = await supabase
      .from('user_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const isDefault = setAsDefault || (count || 0) === 0;

    const { data, error } = await supabase
      .from('user_signatures')
      .insert({
        user_id: userId,
        name,
        signature_data: JSON.stringify(signatureData),
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    return {
      id: data.id,
      userId: data.user_id,
      signatureData,
      name: data.name,
      isDefault: data.is_default,
      createdAt: data.created_at,
    };
  }

  async deleteSignature(userId: string, signatureId: string): Promise<void> {
    const { error } = await supabase
      .from('user_signatures')
      .delete()
      .eq('id', signatureId)
      .eq('user_id', userId);

    if (error) throw new Error(parseSupabaseError(error).message);
  }

  async setDefaultSignature(userId: string, signatureId: string): Promise<void> {
    // Unset all defaults
    await supabase
      .from('user_signatures')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    // Set new default
    const { error } = await supabase
      .from('user_signatures')
      .update({ is_default: true })
      .eq('id', signatureId)
      .eq('user_id', userId);

    if (error) throw new Error(parseSupabaseError(error).message);
  }

  // -----------------------------------------------------------------------
  // Document Signing (document_signatures + signature_audit_log)
  // -----------------------------------------------------------------------

  async signDocument(
    documentId: string,
    signerId: string,
    signerName: string,
    signerEmail: string,
    signatureData: SignatureData,
    signatureType: 'simple' | 'advanced' | 'qualified',
    pin?: string,
    verificationId?: string,
    consentId?: string
  ): Promise<SignatureCertificate> {
    if ((signatureType === 'advanced' || signatureType === 'qualified') && !pin) {
      throw new Error('PIN required for advanced/qualified signatures');
    }

    // P0-S002: Server-side quota check before signing
    const { data: doc } = await supabase
      .from('documents')
      .select('organization_id')
      .eq('id', documentId)
      .single();

    if (doc?.organization_id) {
      const { data: quotaResult, error: quotaError } = await supabase.functions.invoke(
        'check-signature-quota',
        { body: { organization_id: doc.organization_id } }
      );
      if (quotaError || (quotaResult && !quotaResult.allowed)) {
        const reason = quotaResult?.reason || 'QUOTA_CHECK_FAILED';
        if (reason === 'QUOTA_EXCEEDED') {
          throw new Error('Quota de signatures mensuel atteint. Veuillez upgrader votre plan.');
        }
        if (reason === 'FEATURE_NOT_AVAILABLE') {
          throw new Error("Cette fonctionnalité n'est pas disponible avec votre plan actuel.");
        }
      }
    }

    // Get previous signature hash for chain
    const previousSig = await this.getLastDocumentSignature(documentId);

    // Get client metadata
    const ipAddress = await this.getClientIP();

    // Try geolocation
    let geoLocation: SignatureCertificate['geoLocation'] | undefined;
    try {
      const position = await this.getGeolocation();
      geoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      // Geolocation not available
    }

    // Find user's saved signature ID if it matches
    const { data: userSig } = await supabase
      .from('user_signatures')
      .select('id')
      .eq('user_id', signerId)
      .eq('is_default', true)
      .maybeSingle();

    // ---------------------------------------------------------------------------
    // SERVER TIMESTAMP + INTEGRITY SEAL via Edge Function
    // Loi CI 2013-546 — Horodatage serveur incontestable
    // ---------------------------------------------------------------------------
    let serverTimestamp: string;
    let documentHash: string;
    let signatureImageHash: string;
    let integritySeal: string;

    try {
      const { data: tsData, error: tsError } = await supabase.functions.invoke(
        'timestamp-signature',
        {
          body: {
            document_id: documentId,
            signer_id: signerId,
            signature_image_base64: signatureData.data,
          },
        }
      );

      if (tsError || !tsData) {
        throw new Error(tsError?.message || 'Timestamp service unavailable');
      }

      serverTimestamp = tsData.server_timestamp;
      documentHash = tsData.document_hash;
      signatureImageHash = tsData.signature_image_hash;
      integritySeal = tsData.integrity_seal;
    } catch (err) {
      // P0-SIG001: NE PAS permettre de signer sans timestamp serveur
      // C'est une exigence légale (Loi CI 2013-546, Art. 11)
      throw new Error(
        "Service d'horodatage indisponible. La signature ne peut pas être apposée " +
          'sans horodatage serveur certifié (Loi n°2013-546). Veuillez réessayer. ' +
          `Détail: ${(err as Error).message}`
      );
    }

    // Insert document_signature with integrity fields
    const { data: docSig, error } = await supabase
      .from('document_signatures')
      .insert({
        document_id: documentId,
        user_id: signerId,
        user_signature_id: userSig?.id || null,
        signature_type: signatureType,
        status: 'signed',
        signature_hash: integritySeal,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        signed_at: serverTimestamp,
        // Valeur probante fields
        server_timestamp: serverTimestamp,
        document_hash: documentHash,
        signature_image_hash: signatureImageHash,
        integrity_seal: integritySeal,
        verification_id: verificationId || null,
        consent_id: consentId || null,
        metadata: {
          signature_data: signatureData,
          previous_hash: previousSig?.signature_hash,
          geo_location: geoLocation,
        },
      })
      .select()
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Link consent to signature if provided
    if (consentId) {
      await supabase
        .from('signature_consents')
        .update({ document_signature_id: docSig.id })
        .eq('id', consentId);
    }

    // Link verification to signature if provided
    if (verificationId) {
      await supabase
        .from('signer_verifications')
        .update({ document_signature_id: docSig.id })
        .eq('id', verificationId);
    }

    // Audit log
    await supabase.from('signature_audit_log').insert({
      document_signature_id: docSig.id,
      action: 'signed',
      actor_id: signerId,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      details: {
        signature_type: signatureType,
        document_id: documentId,
        integrity_seal: integritySeal,
        document_hash: documentHash,
        verification_id: verificationId,
        consent_id: consentId,
      },
    });

    // Apply 10-year retention (OHADA)
    try {
      const { data: doc } = await supabase
        .from('documents')
        .select('organization_id')
        .eq('id', documentId)
        .single();

      if (doc?.organization_id) {
        await documentRetentionService.applyDefaultRetention(documentId, doc.organization_id);
      }
    } catch {
      // Retention is non-blocking — log but don't fail the signature
    }

    return {
      id: docSig.id,
      documentId,
      signerId,
      signerName,
      signerEmail,
      signatureType,
      signatureData,
      timestamp: serverTimestamp,
      ipAddress: ipAddress || undefined,
      userAgent: navigator.userAgent,
      geoLocation,
      hash: integritySeal,
      previousHash: previousSig?.signature_hash,
      status: 'valid',
      serverTimestamp,
      documentHash,
      signatureImageHash,
      integritySeal,
      verificationId,
      consentId,
    };
  }

  // -----------------------------------------------------------------------
  // Verification
  // -----------------------------------------------------------------------

  async verifySignature(certificateId: string): Promise<SignatureVerificationResult> {
    const { data: docSig, error } = await supabase
      .from('document_signatures')
      .select(
        '*, signer:profiles!document_signatures_user_id_fkey(id, first_name, last_name, email)'
      )
      .eq('id', certificateId)
      .single();

    if (error || !docSig) {
      return {
        isValid: false,
        errors: ['Certificate not found'],
        verifiedAt: new Date().toISOString(),
      };
    }

    const errors: string[] = [];
    const meta = (docSig.metadata || {}) as Record<string, any>;

    // Check status
    if (docSig.status === 'revoked') {
      errors.push('Certificate has been revoked');
    }
    if (docSig.expires_at && new Date(docSig.expires_at) < new Date()) {
      errors.push('Certificate has expired');
    }

    // Verify integrity seal (new) or legacy hash
    if (
      docSig.integrity_seal &&
      docSig.document_hash &&
      docSig.signature_image_hash &&
      docSig.server_timestamp
    ) {
      // New integrity seal verification
      const sealPayload = [
        docSig.document_hash,
        docSig.signature_image_hash,
        docSig.user_id,
        docSig.server_timestamp,
      ].join('|');
      const recomputedSeal = await this.generateHash(sealPayload);

      if (recomputedSeal !== docSig.integrity_seal) {
        errors.push(
          'Integrity seal verification failed - signature or document may have been tampered'
        );
      }
    } else {
      // Legacy hash verification (pre-valeur probante signatures)
      const signatureData = meta.signature_data;
      if (signatureData) {
        const recomputedHash = await this.generateHash(
          JSON.stringify({
            documentId: docSig.document_id,
            signerId: docSig.user_id,
            signatureData: signatureData.data?.slice(-100),
            timestamp: new Date(docSig.signed_at).getTime(),
            type: docSig.signature_type,
          })
        );

        if (recomputedHash !== docSig.signature_hash) {
          errors.push('Hash verification failed - signature may have been tampered');
        }
      }
    }

    // Verify chain integrity
    if (meta.previous_hash) {
      const { data: prevSig } = await supabase
        .from('document_signatures')
        .select('id')
        .eq('signature_hash', meta.previous_hash)
        .maybeSingle();

      if (!prevSig) {
        errors.push('Chain verification failed - previous certificate not found');
      }
    }

    const certificate: SignatureCertificate = {
      id: docSig.id,
      documentId: docSig.document_id,
      signerId: docSig.user_id,
      signerName: docSig.signer ? `${docSig.signer.first_name} ${docSig.signer.last_name}` : '',
      signerEmail: docSig.signer?.email || '',
      signatureType: docSig.signature_type,
      signatureData: meta.signature_data || { data: '', format: 'png' },
      timestamp: docSig.signed_at,
      ipAddress: docSig.ip_address,
      userAgent: docSig.user_agent,
      geoLocation: meta.geo_location,
      hash: docSig.signature_hash,
      previousHash: meta.previous_hash,
      status: docSig.status === 'revoked' ? 'revoked' : 'valid',
      serverTimestamp: docSig.server_timestamp,
      documentHash: docSig.document_hash,
      signatureImageHash: docSig.signature_image_hash,
      integritySeal: docSig.integrity_seal,
      verificationId: docSig.verification_id,
      consentId: docSig.consent_id,
    };

    return {
      isValid: errors.length === 0,
      certificate,
      errors: errors.length > 0 ? errors : undefined,
      verifiedAt: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  // Revocation
  // -----------------------------------------------------------------------

  async revokeSignature(certificateId: string, reason: string): Promise<void> {
    const userId = await requireAuth();

    const { error } = await supabase
      .from('document_signatures')
      .update({
        status: 'revoked',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', certificateId);

    if (error) throw new Error(parseSupabaseError(error).message);

    // Audit log
    await supabase.from('signature_audit_log').insert({
      document_signature_id: certificateId,
      action: 'revoked',
      actor_id: userId,
      details: { reason },
    });
  }

  // -----------------------------------------------------------------------
  // Document signatures listing
  // -----------------------------------------------------------------------

  async getDocumentSignatures(documentId: string): Promise<SignatureCertificate[]> {
    const { data, error } = await supabase
      .from('document_signatures')
      .select(
        '*, signer:profiles!document_signatures_user_id_fkey(id, first_name, last_name, email)'
      )
      .eq('document_id', documentId)
      .order('signed_at');

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || []).map((s: any) => {
      const meta = (s.metadata || {}) as Record<string, any>;
      return {
        id: s.id,
        documentId: s.document_id,
        signerId: s.user_id,
        signerName: s.signer ? `${s.signer.first_name} ${s.signer.last_name}` : '',
        signerEmail: s.signer?.email || '',
        signatureType: s.signature_type,
        signatureData: meta.signature_data || { data: '', format: 'png' },
        timestamp: s.signed_at,
        ipAddress: s.ip_address,
        userAgent: s.user_agent,
        geoLocation: meta.geo_location,
        hash: s.signature_hash,
        previousHash: meta.previous_hash,
        status: s.status === 'revoked' ? ('revoked' as const) : ('valid' as const),
      };
    });
  }

  async getUserSignatureCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('document_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) return 0;
    return count || 0;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  private getGeolocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  private async getLastDocumentSignature(
    documentId: string
  ): Promise<{ signature_hash: string } | null> {
    const { data } = await supabase
      .from('document_signatures')
      .select('signature_hash')
      .eq('document_id', documentId)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  }
}

export const signatureService = new SignatureService();
export default signatureService;
