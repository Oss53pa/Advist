import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptForSession,
  decryptFromSession,
  clearSessionKey,
  maskApiKey,
  isValidApiKeyFormat,
  hashSHA256,
  generateSecureToken,
  generateSecureId,
  generateVerificationCode,
  generateSecureHash,
  obfuscateKey,
  deobfuscateKey,
} from './encryption';

describe('generateSecureId', () => {
  it('should generate a unique ID without prefix', () => {
    const id = generateSecureId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
    // Format: <timestamp>_<16 hex chars>
    expect(id).toMatch(/^\d+_[0-9a-f]{16}$/);
  });

  it('should include the prefix when provided', () => {
    const id = generateSecureId('step');
    expect(id).toMatch(/^step_\d+_[0-9a-f]{16}$/);
  });

  it('should include various prefixes correctly', () => {
    const prefixes = ['rule', 'msg', 'node', 'x'];
    for (const prefix of prefixes) {
      const id = generateSecureId(prefix);
      expect(id.startsWith(`${prefix}_`)).toBe(true);
    }
  });

  it('should generate 100 unique IDs with no duplicates', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSecureId());
    }
    expect(ids.size).toBe(100);
  });

  it('should generate 100 unique prefixed IDs with no duplicates', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSecureId('item'));
    }
    expect(ids.size).toBe(100);
  });

  it('should handle empty string prefix', () => {
    const id = generateSecureId('');
    // Empty string is falsy, so no prefix is applied
    expect(id).toMatch(/^\d+_[0-9a-f]{16}$/);
  });
});

describe('generateVerificationCode', () => {
  it('should generate a code in XXXX-XXXX-XXXX-XXXX format by default', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('should respect custom group count', () => {
    const code = generateVerificationCode(2);
    const parts = code.split('-');
    expect(parts).toHaveLength(2);
    parts.forEach((p) => expect(p).toMatch(/^[A-Z0-9]{4}$/));
  });

  it('should respect custom group length', () => {
    const code = generateVerificationCode(3, 6);
    const parts = code.split('-');
    expect(parts).toHaveLength(3);
    parts.forEach((p) => expect(p).toMatch(/^[A-Z0-9]{6}$/));
  });

  it('should only contain uppercase alphanumeric characters', () => {
    const code = generateVerificationCode();
    const chars = code.replace(/-/g, '');
    expect(chars).toMatch(/^[A-Z0-9]+$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateVerificationCode());
    }
    expect(codes.size).toBe(50);
  });

  it('should handle single group', () => {
    const code = generateVerificationCode(1, 8);
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    expect(code).not.toContain('-');
  });
});

describe('generateSecureHash', () => {
  it('should start with "sha256-"', () => {
    const hash = generateSecureHash();
    expect(hash.startsWith('sha256-')).toBe(true);
  });

  it('should have 32 hex chars after the prefix', () => {
    const hash = generateSecureHash();
    const hex = hash.slice('sha256-'.length);
    expect(hex).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should generate unique hashes', () => {
    const hashes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      hashes.add(generateSecureHash());
    }
    expect(hashes.size).toBe(100);
  });
});

describe('generateSecureToken', () => {
  it('should generate a 64-char hex token by default (32 bytes)', () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should respect custom length', () => {
    const token = generateSecureToken(16);
    // 16 bytes = 32 hex chars
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSecureToken());
    }
    expect(tokens.size).toBe(100);
  });

  it('should handle length of 1', () => {
    const token = generateSecureToken(1);
    expect(token).toHaveLength(2);
    expect(token).toMatch(/^[0-9a-f]{2}$/);
  });
});

describe('encryptForSession / decryptFromSession', () => {
  beforeEach(() => {
    clearSessionKey();
  });

  it('should roundtrip a simple string', async () => {
    const plaintext = 'hello world';
    const encrypted = await encryptForSession(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(0);
    const decrypted = await decryptFromSession(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should roundtrip a long string', async () => {
    const plaintext = 'a'.repeat(10000);
    const encrypted = await encryptForSession(plaintext);
    const decrypted = await decryptFromSession(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should roundtrip special characters', async () => {
    const plaintext = '日本語テスト 🎉 <script>alert("xss")</script>';
    const encrypted = await encryptForSession(plaintext);
    const decrypted = await decryptFromSession(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should return empty string for empty input on encrypt', async () => {
    const result = await encryptForSession('');
    expect(result).toBe('');
  });

  it('should return empty string for empty input on decrypt', async () => {
    const result = await decryptFromSession('');
    expect(result).toBe('');
  });

  it('should produce different ciphertexts for the same plaintext', async () => {
    const plaintext = 'same data';
    const e1 = await encryptForSession(plaintext);
    const e2 = await encryptForSession(plaintext);
    expect(e1).not.toBe(e2);
    // Both should still decrypt correctly
    expect(await decryptFromSession(e1)).toBe(plaintext);
    expect(await decryptFromSession(e2)).toBe(plaintext);
  });

  it('should return empty string when decrypting invalid data', async () => {
    const result = await decryptFromSession('not-valid-base64!!!');
    expect(result).toBe('');
  });
});

describe('hashSHA256', () => {
  it('should produce a 64-char hex string', async () => {
    const hash = await hashSHA256('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce consistent results for the same input', async () => {
    const h1 = await hashSHA256('deterministic');
    const h2 = await hashSHA256('deterministic');
    expect(h1).toBe(h2);
  });

  it('should produce different results for different inputs', async () => {
    const h1 = await hashSHA256('input-a');
    const h2 = await hashSHA256('input-b');
    expect(h1).not.toBe(h2);
  });

  it('should handle empty string', async () => {
    const hash = await hashSHA256('');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('maskApiKey', () => {
  it('should mask a normal-length key showing first 10 and last 4 chars', () => {
    const key = 'sk-ant-api03-abcdefghijklmnop';
    const masked = maskApiKey(key);
    expect(masked).toBe('sk-ant-api...mnop');
  });

  it('should return "****" for short keys (<=12 chars)', () => {
    expect(maskApiKey('short')).toBe('****');
    expect(maskApiKey('exactly12chr')).toBe('****');
  });

  it('should return empty string for empty input', () => {
    expect(maskApiKey('')).toBe('');
  });

  it('should return empty string for null-ish input', () => {
    expect(maskApiKey(null as unknown as string)).toBe('');
    expect(maskApiKey(undefined as unknown as string)).toBe('');
  });
});

describe('isValidApiKeyFormat', () => {
  it('should accept a valid Claude API key', () => {
    expect(isValidApiKeyFormat('sk-ant-api03-abcdefghijklmnopqrstuvwxyz')).toBe(true);
  });

  it('should reject a key that does not start with sk-ant-', () => {
    expect(isValidApiKeyFormat('pk-ant-api03-abcdefghijklmnopqrstuvwxyz')).toBe(false);
  });

  it('should reject a short key even with correct prefix', () => {
    expect(isValidApiKeyFormat('sk-ant-tiny')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidApiKeyFormat('')).toBe(false);
  });

  it('should reject null-ish values', () => {
    expect(isValidApiKeyFormat(null as unknown as string)).toBe(false);
    expect(isValidApiKeyFormat(undefined as unknown as string)).toBe(false);
  });
});

describe('deprecated functions', () => {
  it('obfuscateKey should return empty string', () => {
    expect(obfuscateKey('some-key')).toBe('');
  });

  it('deobfuscateKey should return empty string', () => {
    expect(deobfuscateKey('some-data')).toBe('');
  });

  it('obfuscateKey should return empty for empty input', () => {
    expect(obfuscateKey('')).toBe('');
  });

  it('deobfuscateKey should return empty for empty input', () => {
    expect(deobfuscateKey('')).toBe('');
  });
});

describe('clearSessionKey', () => {
  it('should cause a new key to be generated, breaking old ciphertexts', async () => {
    const plaintext = 'before-clear';
    const encrypted = await encryptForSession(plaintext);
    clearSessionKey();
    // After clearing, decryption with a new key should fail
    const result = await decryptFromSession(encrypted);
    expect(result).toBe('');
  });
});
