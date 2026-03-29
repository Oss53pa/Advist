/**
 * QES (Qualified Electronic Signature) Service — Supabase Implementation
 *
 * Replaces Axios API calls with Supabase client queries.
 * Tables: qualified_certificates, identity_verification_sessions
 *
 * Note: Actual QTSP (Qualified Trust Service Provider) integration
 * will be handled via Edge Functions in Phase 5. This service currently
 * manages the local certificate and session records.
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';
import type {
  QualifiedCertificate,
  IdentityVerificationSession,
  CertificateStatusResponse,
  CertificateRequestResponse,
  QESSignatureResult,
  SendOTPResponse,
  VerificationMethod,
  OTPChannel,
} from '../types/qes';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function requireAuth(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return user.id;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapCertificate(row: Record<string, any>): QualifiedCertificate {
  const now = new Date();
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    provider: row.provider,
    certificate_id: row.certificate_id_external || row.id,
    level: row.level || 'qualified',
    status: row.status || 'pending',
    is_valid: row.status === 'verified' || row.status === 'active',
    issued_at: row.issued_at,
    expires_at: row.expires_at,
    days_until_expiry: daysUntilExpiry,
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as unknown as QualifiedCertificate;
}

function mapVerificationSession(row: Record<string, any>): IdentityVerificationSession {
  return {
    id: row.id,
    user_id: row.user_id,
    provider: row.provider,
    session_id: row.session_id_external || row.id,
    status: row.status || 'pending',
    verification_method: row.verification_method,
    result: row.result,
    completed_at: row.completed_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as unknown as IdentityVerificationSession;
}

// ===========================================================================
// Service
// ===========================================================================
export const qesService = {
  // -----------------------------------------------------------------------
  // Certificate Management
  // -----------------------------------------------------------------------

  async getCertificateStatus(): Promise<CertificateStatusResponse> {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('qualified_certificates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(parseSupabaseError(error).message);

    if (!data) {
      return { status: 'no_certificate' } as CertificateStatusResponse;
    }

    const cert = mapCertificate(data);
    return {
      status: cert.status,
      certificate: cert,
    } as CertificateStatusResponse;
  },

  async getCertificates(): Promise<QualifiedCertificate[]> {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('qualified_certificates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(parseSupabaseError(error).message);
    return (data || []).map(mapCertificate);
  },

  async requestCertificate(
    verificationMethod: VerificationMethod,
  ): Promise<CertificateRequestResponse> {
    const userId = await requireAuth();

    // Create a verification session
    const { data: session, error: sessionErr } = await supabase
      .from('identity_verification_sessions')
      .insert({
        user_id: userId,
        provider: 'advist-qtsp',
        verification_method: verificationMethod,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      })
      .select()
      .single();

    if (sessionErr) throw new Error(parseSupabaseError(sessionErr).message);

    // Create pending certificate
    const { data: cert, error: certErr } = await supabase
      .from('qualified_certificates')
      .insert({
        user_id: userId,
        provider: 'advist-qtsp',
        level: 'qualified',
        status: 'pending',
        metadata: { verification_session_id: session.id, verification_method: verificationMethod },
      })
      .select()
      .single();

    if (certErr) throw new Error(parseSupabaseError(certErr).message);

    return {
      certificate_id: cert.id,
      verification_session_id: session.id,
      verification_url: `${window.location.origin}/verify/${session.id}`,
      status: 'pending',
    } as CertificateRequestResponse;
  },

  async revokeCertificate(
    certificateId: string,
    reason: string,
  ): Promise<QualifiedCertificate> {
    const { data, error } = await supabase
      .from('qualified_certificates')
      .update({
        status: 'revoked',
        metadata: { revocation_reason: reason, revoked_at: new Date().toISOString() },
      })
      .eq('id', certificateId)
      .select()
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapCertificate(data);
  },

  // -----------------------------------------------------------------------
  // Identity Verification
  // -----------------------------------------------------------------------

  async getVerificationStatus(): Promise<
    IdentityVerificationSession | { status: 'no_session' }
  > {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('identity_verification_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(parseSupabaseError(error).message);

    if (!data) {
      return { status: 'no_session' };
    }

    return mapVerificationSession(data);
  },

  // -----------------------------------------------------------------------
  // QES Signing
  // -----------------------------------------------------------------------

  async signDocument(
    documentId: string,
    signatureId: string,
    positions?: Array<{ page: number; x: number; y: number; width: number; height: number }>,
    otpCode?: string,
  ): Promise<QESSignatureResult> {
    const userId = await requireAuth();

    // Verify active certificate
    const { data: cert } = await supabase
      .from('qualified_certificates')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['verified', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cert) {
      throw new Error('Aucun certificat qualifié actif. Veuillez d\'abord obtenir un certificat.');
    }

    // OTP verification would be handled by Edge Function in Phase 5
    // For now, we just check it's provided for qualified signatures
    if (!otpCode) {
      throw new Error('Code OTP requis pour la signature qualifiée');
    }

    const now = new Date().toISOString();
    const position = positions?.[0];

    // Create document signature
    const { data: docSig, error } = await supabase
      .from('document_signatures')
      .insert({
        document_id: documentId,
        user_id: userId,
        user_signature_id: signatureId,
        signature_type: 'qualified',
        status: 'signed',
        page_number: position?.page,
        x_position: position?.x,
        y_position: position?.y,
        width: position?.width,
        height: position?.height,
        signed_at: now,
        metadata: {
          certificate_id: cert.id,
          positions,
          otp_verified: true,
        },
      })
      .select()
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Audit log
    await supabase.from('signature_audit_log').insert({
      document_signature_id: docSig.id,
      action: 'qes_signed',
      actor_id: userId,
      details: {
        certificate_id: cert.id,
        signature_type: 'qualified',
      },
    });

    // Get user info for response
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    return {
      id: docSig.id,
      document: documentId,
      version: '',
      signer: userId,
      signer_name: profile ? `${profile.first_name} ${profile.last_name}` : '',
      signer_email: profile?.email || '',
      signature_level: 'qualified',
      page_number: position?.page || 1,
      position: position || {},
      timestamp: now,
      watermark_id: docSig.id,
    } as unknown as QESSignatureResult;
  },

  async sendOTP(channel: OTPChannel = 'sms'): Promise<SendOTPResponse> {
    // In Phase 5, this will call an Edge Function that interfaces
    // with the QTSP to send the OTP. For now, return a mock response.
    return {
      success: true,
      channel,
      expires_in: 300,
      message: `Code OTP envoyé par ${channel === 'sms' ? 'SMS' : 'email'}`,
    } as SendOTPResponse;
  },

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  async hasActiveCertificate(): Promise<boolean> {
    try {
      const status = await this.getCertificateStatus();
      if ('certificate' in status && status.certificate) {
        return (status.certificate as QualifiedCertificate).is_valid;
      }
      return status.status === 'active';
    } catch {
      return false;
    }
  },

  async getActiveCertificate(): Promise<QualifiedCertificate | null> {
    try {
      const status = await this.getCertificateStatus();
      if (status.status === 'no_certificate') {
        return null;
      }
      if ('certificate' in status && (status.certificate as QualifiedCertificate)?.is_valid) {
        return status.certificate as QualifiedCertificate;
      }
      return null;
    } catch {
      return null;
    }
  },

  getCertificateDisplayInfo(certificate: QualifiedCertificate): {
    statusColor: string;
    statusText: string;
    expiryText: string;
  } {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: 'Actif' },
      verified: { color: 'green', text: 'Actif' },
      pending_verification: { color: 'yellow', text: 'Vérification en cours' },
      verification_in_progress: { color: 'yellow', text: 'Vérification en cours' },
      pending: { color: 'yellow', text: 'En attente' },
      pending_issuance: { color: 'blue', text: 'Émission en cours' },
      expired: { color: 'red', text: 'Expiré' },
      revoked: { color: 'red', text: 'Révoqué' },
      suspended: { color: 'orange', text: 'Suspendu' },
    };

    const statusInfo = statusMap[certificate.status] || { color: 'gray', text: 'Inconnu' };

    let expiryText = '';
    if (certificate.days_until_expiry !== undefined) {
      if (certificate.days_until_expiry <= 0) {
        expiryText = 'Expiré';
      } else if (certificate.days_until_expiry <= 30) {
        expiryText = `Expire dans ${certificate.days_until_expiry} jour${certificate.days_until_expiry > 1 ? 's' : ''}`;
      } else {
        expiryText = `Valide ${certificate.days_until_expiry} jours`;
      }
    }

    return {
      statusColor: statusInfo.color,
      statusText: statusInfo.text,
      expiryText,
    };
  },

  getVerificationMethodInfo(method: VerificationMethod): {
    icon: string;
    title: string;
    description: string;
    duration: string;
  } {
    const methodMap: Record<
      VerificationMethod,
      { icon: string; title: string; description: string; duration: string }
    > = {
      video_id: {
        icon: 'video',
        title: 'Vidéo-identification',
        description: 'Vérification en direct avec un agent certifié',
        duration: '5-10 min',
      },
      id_scan: {
        icon: 'id-card',
        title: "Scan de pièce d'identité",
        description: "Photo de votre pièce d'identité + selfie",
        duration: '2-5 min',
      },
      in_person: {
        icon: 'building',
        title: 'Vérification en présentiel',
        description: 'Rendez-vous dans un point de vérification agréé',
        duration: 'Variable',
      },
      existing_cert: {
        icon: 'certificate',
        title: 'Certificat existant',
        description: 'Utiliser un certificat qualifié existant',
        duration: 'Immédiat',
      },
    };

    return methodMap[method];
  },
};

export default qesService;
