/**
 * Signer OTP Service
 * Module 1 — Client wrapper pour l'Edge Function verify-signer-otp
 */
import { supabase } from '../lib/supabase';

export interface SendOtpParams {
  email: string;
  name?: string;
  documentId: string;
  documentShareId?: string;
  verificationLevel?: 'basic' | 'standard' | 'reinforced' | 'advanced';
}

export interface SendOtpResult {
  verificationId: string;
  expiresIn: number;
}

export interface VerifyOtpResult {
  verified: boolean;
  alreadyVerified?: boolean;
  error?: string;
  remainingAttempts?: number;
  locked?: boolean;
}

class SignerOtpService {
  /**
   * Envoie un OTP par email au signataire
   */
  async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    const { data, error } = await supabase.functions.invoke('verify-signer-otp', {
      body: {
        action: 'send',
        email: params.email,
        name: params.name,
        document_id: params.documentId,
        document_share_id: params.documentShareId,
        verification_level: params.verificationLevel || 'standard',
      },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Failed to send OTP');

    return {
      verificationId: data.verification_id,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Verifie le code OTP soumis par le signataire
   */
  async verifyOtp(verificationId: string, code: string): Promise<VerifyOtpResult> {
    const { data, error } = await supabase.functions.invoke('verify-signer-otp', {
      body: {
        action: 'verify',
        verification_id: verificationId,
        code,
      },
    });

    if (error) {
      // Edge function returns 400 for invalid OTP — parse the response
      if (data) {
        return {
          verified: false,
          error: data.error,
          remainingAttempts: data.remaining_attempts,
          locked: data.locked,
        };
      }
      throw new Error(error.message);
    }

    return {
      verified: data.verified,
      alreadyVerified: data.already_verified,
    };
  }
}

export const signerOtpService = new SignerOtpService();
