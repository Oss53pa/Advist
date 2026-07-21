/**
 * Edge Function: verify-signer-otp
 * Module 1 — Verification OTP du signataire avant signature
 *
 * Actions:
 *   - send: Genere un OTP 6 chiffres, l'envoie par email via Resend, stocke le hash
 *   - verify: Verifie le code OTP soumis par le signataire
 *
 * PAS D'AUTH REQUISE — les signataires externes n'ont pas de compte
 */
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateOTP(): string {
  // Rejection sampling : evite le biais modulo de (uint32 % 1e6),
  // 2^32 n'etant pas un multiple de 1e6.
  const array = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / 1000000) * 1000000;
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return String(array[0] % 1000000).padStart(6, '0');
}

/**
 * Cle de derivation du HMAC. Un OTP a 6 chiffres n'a que 10^6 valeurs
 * possibles : un SHA-256 nu se casse hors-ligne instantanement par
 * pre-calcul. Le HMAC rend ce pre-calcul impossible sans le secret serveur.
 * OTP_HASH_SECRET est prioritaire ; a defaut on derive de la service-role key,
 * toujours presente en Edge Function (donc aucune configuration requise).
 */
const OTP_HMAC_KEY =
  Deno.env.get('OTP_HASH_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function hashOTP(code: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(OTP_HMAC_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(code));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparaison a temps constant : evite la fuite par canal temporel. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return optionsResponse(origin);
  }

  const cors = getCorsHeaders(origin);

  function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { action } = body;

    // -----------------------------------------------------------------------
    // ACTION: SEND OTP
    // -----------------------------------------------------------------------
    if (action === 'send') {
      const { email, name, document_id, document_share_id, verification_level = 'standard' } = body;

      if (!email || !document_id) {
        return jsonResponse({ error: 'email and document_id are required' }, 400);
      }

      // Generate OTP
      const otpCode = generateOTP();
      const otpHash = await hashOTP(otpCode);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

      // Get client metadata
      const ipAddress =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      // Insert verification record
      const { data: verification, error: insertError } = await supabase
        .from('signer_verifications')
        .insert({
          document_id,
          document_share_id: document_share_id || null,
          signer_email: email,
          signer_name: name || null,
          verification_level,
          otp_channel: 'email',
          otp_hash: otpHash,
          otp_sent_at: now.toISOString(),
          otp_expires_at: expiresAt.toISOString(),
          attempts: 0,
          max_attempts: MAX_ATTEMPTS,
          status: 'pending',
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select('id')
        .single();

      if (insertError) {
        return jsonResponse({ error: 'Failed to create verification' }, 500);
      }

      // Send OTP via Resend
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        // Fetch document name for context
        const { data: doc } = await supabase
          .from('documents')
          .select('title')
          .eq('id', document_id)
          .single();

        const documentName = doc?.title || 'Document';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Advist <security@advist.app>',
            to: email,
            // Le code ne doit jamais figurer dans l'objet : celui-ci s'affiche en
            // notification / ecran verrouille et transite en clair dans les logs
            // des relais SMTP.
            subject: 'Votre code de vérification ADVIST',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #1e293b; margin: 0;">Vérification de votre identité</h2>
                </div>
                <p style="color: #475569;">Bonjour${name ? ` ${name}` : ''},</p>
                <p style="color: #475569;">
                  Vous avez été invité(e) à signer le document <strong>${documentName}</strong> via ADVIST.
                </p>
                <p style="color: #475569;">Votre code de vérification est :</p>
                <div style="text-align: center; margin: 24px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; background: #f1f5f9; padding: 16px 24px; border-radius: 8px; display: inline-block;">
                    ${otpCode}
                  </span>
                </div>
                <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                  Ce code expire dans ${OTP_TTL_MINUTES} minutes.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">
                  Si vous n'avez pas demandé ce code, ignorez ce message.<br/>
                  Conformément à la Loi ivoirienne n°2013-546, cette vérification garantit l'authenticité de votre signature électronique.
                </p>
                <p style="color: #94a3b8; font-size: 12px;">— ADVIST, Atlas Studio</p>
              </div>
            `,
          }),
        });
      }

      return jsonResponse({
        success: true,
        verification_id: verification.id,
        expires_in: OTP_TTL_MINUTES * 60,
      });
    }

    // -----------------------------------------------------------------------
    // ACTION: VERIFY OTP
    // -----------------------------------------------------------------------
    if (action === 'verify') {
      const { verification_id, code } = body;

      if (!verification_id || !code) {
        return jsonResponse({ error: 'verification_id and code are required' }, 400);
      }

      // Fetch verification record
      const { data: verification, error: fetchError } = await supabase
        .from('signer_verifications')
        .select('*')
        .eq('id', verification_id)
        .single();

      if (fetchError || !verification) {
        return jsonResponse({ error: 'Verification not found' }, 404);
      }

      // Check if already verified
      if (verification.status === 'verified') {
        return jsonResponse({ verified: true, already_verified: true });
      }

      // Check if expired
      if (new Date(verification.otp_expires_at) < new Date()) {
        await supabase
          .from('signer_verifications')
          .update({ status: 'expired' })
          .eq('id', verification_id);
        return jsonResponse({ verified: false, error: 'OTP_EXPIRED' }, 400);
      }

      // Check if locked (max attempts)
      if (verification.attempts >= verification.max_attempts) {
        await supabase
          .from('signer_verifications')
          .update({ status: 'failed' })
          .eq('id', verification_id);
        return jsonResponse({ verified: false, error: 'MAX_ATTEMPTS_REACHED', locked: true }, 400);
      }

      // Hash submitted code and compare
      const submittedHash = await hashOTP(code);

      if (timingSafeEqual(submittedHash, verification.otp_hash)) {
        // OTP valid
        await supabase
          .from('signer_verifications')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            attempts: verification.attempts + 1,
          })
          .eq('id', verification_id);

        return jsonResponse({ verified: true });
      } else {
        // OTP invalid
        const newAttempts = verification.attempts + 1;
        const locked = newAttempts >= verification.max_attempts;

        await supabase
          .from('signer_verifications')
          .update({
            attempts: newAttempts,
            status: locked ? 'failed' : 'pending',
          })
          .eq('id', verification_id);

        return jsonResponse(
          {
            verified: false,
            error: 'OTP_INVALID',
            remaining_attempts: verification.max_attempts - newAttempts,
            locked,
          },
          400
        );
      }
    }

    return jsonResponse({ error: "Invalid action. Use 'send' or 'verify'." }, 400);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
