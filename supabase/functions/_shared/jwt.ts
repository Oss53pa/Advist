/**
 * Atlas Studio Suite SSO JWT verification.
 *
 * Atlas Studio portal signs a JWT (HMAC-SHA256) and redirects the user to
 * `/auth?token=<jwt>`. The atlas-sso Edge Function then calls
 * `verifyAtlasJWT(token, JWT_SECRET)` to authenticate the inbound user.
 *
 * Required claims (Atlas Studio team must include these):
 *   - userId   : string  Atlas Studio user UUID
 *   - email    : string  user's email (will become the Supabase auth email)
 *   - fullName : string  user's full name
 *   - appId    : string  must equal "advist"
 *   - plan     : string  current plan slug — used to populate
 *                        auth.users.app_metadata.advist_plan as a UI hint.
 *                        Authoritative plan/tier still reads from
 *                        public.licences.plan_id → plans.name.
 *   - iat / exp: number  standard JWT timestamps
 *
 * If `plan` is missing the SSO flow still succeeds; the frontend simply
 * doesn't get the cached plan hint and falls back to the licences query.
 */
export interface AtlasStudioClaims {
  userId: string;
  email: string;
  fullName: string;
  appId: string;
  plan?: string;
  iat: number;
  exp: number;
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifyAtlasJWT(token: string, secret: string): Promise<AtlasStudioClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Format JWT invalide');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature (HMAC-SHA256)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify('HMAC', key, signature, data);
  if (!valid) {
    throw new Error('Signature JWT invalide');
  }

  // Decode payload
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const claims: AtlasStudioClaims = JSON.parse(payloadJson);

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) {
    throw new Error('Token expiré');
  }

  // Validate required claims (plan is optional — see header comment)
  if (!claims.email || !claims.userId) {
    throw new Error('Claims obligatoires manquants (email, userId)');
  }

  // Validate this token is for Advist
  if (claims.appId !== 'advist') {
    throw new Error(`Token destiné à "${claims.appId}", attendu "advist"`);
  }

  return claims;
}
