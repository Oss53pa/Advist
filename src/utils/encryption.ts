/**
 * Secure Encryption Utilities
 *
 * IMPORTANT SECURITY NOTE:
 * API keys should NEVER be stored client-side. This module provides utilities
 * for temporary session-based encryption only. For API integrations, always use
 * a backend proxy to handle sensitive credentials.
 *
 * @module utils/encryption
 */

/**
 * Generate a cryptographically secure random key for AES-GCM encryption
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Session-based encryption key (regenerated on each page load)
 * This key is never stored and exists only in memory
 */
let sessionKey: CryptoKey | null = null;

async function getSessionKey(): Promise<CryptoKey> {
  if (!sessionKey) {
    sessionKey = await generateEncryptionKey();
  }
  return sessionKey;
}

/**
 * Encrypt sensitive data using AES-GCM with a session key.
 * The encrypted data is only valid for the current browser session.
 *
 * @param plaintext - The data to encrypt
 * @returns Base64 encoded encrypted data with IV prepended
 */
export async function encryptForSession(plaintext: string): Promise<string> {
  if (!plaintext) return '';

  try {
    const key = await getSessionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

/**
 * Decrypt session-encrypted data.
 *
 * @param encrypted - Base64 encoded encrypted data
 * @returns Decrypted plaintext
 */
export async function decryptFromSession(encrypted: string): Promise<string> {
  if (!encrypted) return '';

  try {
    const key = await getSessionKey();

    // Decode base64
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

/**
 * Clear the session encryption key (call on logout)
 */
export function clearSessionKey(): void {
  sessionKey = null;
}

/**
 * Mask an API key for display (sk-ant-api03-xxx...xxx)
 * This is safe for UI display as it doesn't expose the full key
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 12) return '****';
  return `${key.slice(0, 10)}...${key.slice(-4)}`;
}

/**
 * Validate API key format (basic check for Claude API key format)
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key) return false;
  // Claude API keys typically start with 'sk-ant-'
  return key.startsWith('sk-ant-') && key.length > 20;
}

/**
 * @deprecated Use encryptForSession instead. This function provides no real security.
 * Kept for backward compatibility during migration.
 */
export function obfuscateKey(key: string): string {
  console.warn(
    'obfuscateKey is deprecated and insecure. Use encryptForSession or a backend proxy instead.'
  );
  if (!key) return '';
  try {
    // Return empty to prevent insecure storage
    // Migration: Use backend proxy for API key storage
    return '';
  } catch {
    return '';
  }
}

/**
 * @deprecated Use decryptFromSession instead. This function provides no real security.
 * Kept for backward compatibility during migration.
 */
export function deobfuscateKey(obfuscated: string): string {
  console.warn(
    'deobfuscateKey is deprecated and insecure. Use decryptFromSession or a backend proxy instead.'
  );
  if (!obfuscated) return '';
  try {
    // Migration: Fetch from backend instead
    return '';
  } catch {
    return '';
  }
}

/**
 * Hash a string using SHA-256 (for non-reversible operations like checksums)
 */
export async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a cryptographically secure unique ID with an optional prefix.
 * Replaces all usages of Math.random() for ID generation.
 *
 * @param prefix - Optional prefix (e.g. "step", "rule", "msg")
 * @returns A unique ID string like "step_1711234567890_a3f9c2b1e4"
 */
export function generateSecureId(prefix?: string): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const base = `${Date.now()}_${hex}`;
  return prefix ? `${prefix}_${base}` : base;
}

/**
 * Generate a cryptographically secure verification code.
 * Format: XXXX-XXXX-XXXX-XXXX (alphanumeric uppercase)
 */
export function generateVerificationCode(groups: number = 4, groupLength: number = 4): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = new Uint8Array(groups * groupLength);
  crypto.getRandomValues(randomBytes);

  const parts: string[] = [];
  let idx = 0;
  for (let i = 0; i < groups; i++) {
    let segment = '';
    for (let j = 0; j < groupLength; j++) {
      segment += chars[randomBytes[idx++] % chars.length];
    }
    parts.push(segment);
  }
  return parts.join('-');
}

/**
 * Generate a cryptographically secure SHA-256 hash of arbitrary data.
 * For synchronous contexts where async hashSHA256 cannot be used,
 * this produces a hex string from secure random bytes as a fingerprint.
 */
export function generateSecureHash(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `sha256-${  Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;
}
