/**
 * Types for Qualified Electronic Signature (QES) feature.
 * eIDAS compliant signature types.
 */

// Certificate status enumeration
export type CertificateStatus =
  | 'pending_verification'
  | 'verification_in_progress'
  | 'pending_issuance'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'suspended';

// Verification method enumeration
export type VerificationMethod = 'video_id' | 'id_scan' | 'in_person' | 'existing_cert';

// Verification session status enumeration
export type VerificationSessionStatus =
  | 'initiated'
  | 'document_uploaded'
  | 'video_scheduled'
  | 'video_in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'expired';

/**
 * Qualified Certificate for QES
 */
export interface QualifiedCertificate {
  id: string;
  user_email: string;
  user_name: string;
  qtsp_provider: string;
  certificate_serial?: string;
  certificate_subject?: string;
  certificate_issuer?: string;
  valid_from?: string;
  valid_until?: string;
  verification_method: VerificationMethod;
  verification_date?: string;
  status: CertificateStatus;
  is_valid: boolean;
  days_until_expiry?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Identity Verification Session
 */
export interface IdentityVerificationSession {
  id: string;
  status: VerificationSessionStatus;
  verification_url?: string;
  expires_at: string;
  is_expired: boolean;
  created_at: string;
  completed_at?: string;
}

/**
 * Certificate status response
 */
export interface CertificateStatusResponse {
  status: 'no_certificate' | 'pending' | CertificateStatus;
  certificate?: QualifiedCertificate;
  message?: string;
}

/**
 * Certificate request payload
 */
export interface CertificateRequestPayload {
  verification_method: VerificationMethod;
}

/**
 * Certificate request response
 */
export interface CertificateRequestResponse {
  certificate_id: string;
  status: CertificateStatus;
  verification_session_id?: string;
  verification_url?: string;
  expires_at?: string;
  message?: string;
}

/**
 * Signature position on document
 */
export interface SignaturePosition {
  page: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * QES Signature request payload
 */
export interface QESSignaturePayload {
  signature_id: string;
  positions?: SignaturePosition[];
  otp_code?: string;
}

/**
 * QES Signature result
 */
export interface QESSignatureResult {
  id: string;
  document: string;
  version: string;
  signer: string;
  signer_name: string;
  signer_email: string;
  signature_level: 'simple' | 'advanced' | 'qualified';
  page_number: number;
  position: Record<string, number>;
  timestamp: string;
  watermark_id: string;
}

/**
 * OTP Channel type
 */
export type OTPChannel = 'sms' | 'email';

/**
 * Send OTP request payload
 */
export interface SendOTPPayload {
  channel: OTPChannel;
}

/**
 * Send OTP response
 */
export interface SendOTPResponse {
  otp_sent: boolean;
  channel: OTPChannel;
  expires_in: number;
}

/**
 * QES Error response
 */
export interface QESErrorResponse {
  error: string;
  requires_otp?: boolean;
}

/**
 * Revocation payload
 */
export interface RevokeCertificatePayload {
  reason: string;
}
