import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storage, secureStorage } from '@/utils/storage';
import { STORAGE_KEYS, API_CONFIG } from '@/constants/config';

// Types
export interface TokenPayload {
  sub: string; // User ID
  email: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  jti?: string; // Token ID
  type: 'access' | 'refresh';
  permissions?: string[];
}

export interface SecurityConfig {
  pinningEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  requirePinForSensitive: boolean;
}

export interface LoginAttempt {
  timestamp: string;
  success: boolean;
  ipAddress?: string;
  device?: string;
}

export interface SecurityAuditLog {
  id: string;
  action: SecurityAction;
  timestamp: string;
  details: Record<string, unknown>;
  success: boolean;
}

export type SecurityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_CHANGE'
  | 'BIOMETRIC_AUTH'
  | 'PIN_VERIFICATION'
  | 'SENSITIVE_ACTION'
  | 'SESSION_EXPIRED'
  | 'LOCKOUT';

// Certificate pins for API server (SHA-256)
// These should be updated when certificates are rotated
const CERTIFICATE_PINS = [
  // Production API certificates
  'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  // Backup certificate
  'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
];

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  pinningEnabled: true,
  biometricEnabled: true,
  sessionTimeout: 30, // 30 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15, // 15 minutes
  requirePinForSensitive: true,
};

class SecurityService {
  private config: SecurityConfig = DEFAULT_SECURITY_CONFIG;
  private loginAttempts: LoginAttempt[] = [];
  private isLocked: boolean = false;
  private lockoutEndTime: Date | null = null;

  constructor() {
    this.loadConfig();
    this.loadLoginAttempts();
  }

  // Configuration
  private async loadConfig() {
    const stored = await storage.getItem<SecurityConfig>('security_config');
    if (stored) {
      this.config = { ...DEFAULT_SECURITY_CONFIG, ...stored };
    }
  }

  async getConfig(): Promise<SecurityConfig> {
    return this.config;
  }

  async updateConfig(updates: Partial<SecurityConfig>): Promise<SecurityConfig> {
    this.config = { ...this.config, ...updates };
    await storage.setItem('security_config', this.config);
    return this.config;
  }

  // JWT Token Management
  parseToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const payload = this.parseToken(token);
    if (!payload) return true;

    // Add 30 second buffer for clock skew
    const now = Math.floor(Date.now() / 1000) + 30;
    return payload.exp < now;
  }

  getTokenExpirationTime(token: string): Date | null {
    const payload = this.parseToken(token);
    if (!payload) return null;

    return new Date(payload.exp * 1000);
  }

  getTimeUntilExpiration(token: string): number {
    const payload = this.parseToken(token);
    if (!payload) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  async validateAccessToken(): Promise<boolean> {
    const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  async validateRefreshToken(): Promise<boolean> {
    const token = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  // Secure Token Storage
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // Encryption utilities
  async hashData(data: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  }

  async generateSecureRandom(byteCount: number = 32): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(byteCount);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async encryptSensitiveData(data: string, key?: string): Promise<string> {
    // Use device-specific key if not provided
    const encryptionKey = key || (await this.getDeviceKey());

    // Simple XOR encryption (for demo - use proper encryption in production)
    const encrypted = await this.xorEncrypt(data, encryptionKey);
    return btoa(encrypted);
  }

  async decryptSensitiveData(encryptedData: string, key?: string): Promise<string> {
    const encryptionKey = key || (await this.getDeviceKey());
    const decoded = atob(encryptedData);
    return await this.xorEncrypt(decoded, encryptionKey);
  }

  private async xorEncrypt(data: string, key: string): Promise<string> {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  private async getDeviceKey(): Promise<string> {
    let key = await secureStorage.getItem('device_encryption_key');
    if (!key) {
      key = await this.generateSecureRandom(32);
      await secureStorage.setItem('device_encryption_key', key);
    }
    return key;
  }

  // Login attempt tracking
  private async loadLoginAttempts() {
    const stored = await storage.getItem<LoginAttempt[]>('login_attempts');
    if (stored) {
      this.loginAttempts = stored;
    }
    await this.checkLockout();
  }

  async recordLoginAttempt(success: boolean): Promise<void> {
    const attempt: LoginAttempt = {
      timestamp: new Date().toISOString(),
      success,
      device: Device.modelName || undefined,
    };

    this.loginAttempts.push(attempt);

    // Keep only last 100 attempts
    if (this.loginAttempts.length > 100) {
      this.loginAttempts = this.loginAttempts.slice(-100);
    }

    await storage.setItem('login_attempts', this.loginAttempts);

    if (!success) {
      await this.checkLockout();
    } else {
      // Reset failed attempts on success
      this.loginAttempts = this.loginAttempts.filter((a) => a.success);
      await storage.setItem('login_attempts', this.loginAttempts);
    }

    await this.logSecurityEvent(success ? 'LOGIN' : 'LOGIN', { success });
  }

  private async checkLockout(): Promise<void> {
    const recentFailures = this.getRecentFailedAttempts();

    if (recentFailures >= this.config.maxLoginAttempts) {
      this.isLocked = true;
      this.lockoutEndTime = new Date(Date.now() + this.config.lockoutDuration * 60 * 1000);
      await this.logSecurityEvent('LOCKOUT', { duration: this.config.lockoutDuration });
    }
  }

  private getRecentFailedAttempts(): number {
    const windowMs = this.config.lockoutDuration * 60 * 1000;
    const windowStart = new Date(Date.now() - windowMs);

    return this.loginAttempts.filter(
      (a) => !a.success && new Date(a.timestamp) > windowStart
    ).length;
  }

  async isAccountLocked(): Promise<{ locked: boolean; remainingTime?: number }> {
    if (!this.isLocked) {
      return { locked: false };
    }

    if (this.lockoutEndTime && new Date() > this.lockoutEndTime) {
      this.isLocked = false;
      this.lockoutEndTime = null;
      return { locked: false };
    }

    const remainingTime = this.lockoutEndTime
      ? Math.ceil((this.lockoutEndTime.getTime() - Date.now()) / 1000)
      : 0;

    return { locked: true, remainingTime };
  }

  // Biometric security
  async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  async getBiometricType(): Promise<string> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }

    return 'Biometric';
  }

  async authenticateWithBiometric(reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authentifiez-vous pour continuer',
        cancelLabel: 'Annuler',
        fallbackLabel: 'Utiliser le code PIN',
        disableDeviceFallback: false,
      });

      await this.logSecurityEvent('BIOMETRIC_AUTH', { success: result.success });

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // PIN management
  async setPIN(pin: string): Promise<void> {
    const hashedPin = await this.hashData(pin);
    await secureStorage.setItem('app_pin_hash', hashedPin);
  }

  async verifyPIN(pin: string): Promise<boolean> {
    const storedHash = await secureStorage.getItem('app_pin_hash');
    if (!storedHash) return false;

    const inputHash = await this.hashData(pin);
    const isValid = storedHash === inputHash;

    await this.logSecurityEvent('PIN_VERIFICATION', { success: isValid });

    return isValid;
  }

  async hasPIN(): Promise<boolean> {
    const pin = await secureStorage.getItem('app_pin_hash');
    return !!pin;
  }

  async removePIN(): Promise<void> {
    await secureStorage.removeItem('app_pin_hash');
  }

  // Session management
  async startSession(): Promise<void> {
    await storage.setItem('session_start', new Date().toISOString());
    await storage.setItem('last_activity', new Date().toISOString());
  }

  async updateLastActivity(): Promise<void> {
    await storage.setItem('last_activity', new Date().toISOString());
  }

  async isSessionValid(): Promise<boolean> {
    const lastActivity = await storage.getItem<string>('last_activity');
    if (!lastActivity) return false;

    const lastActivityTime = new Date(lastActivity);
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;
    const isValid = Date.now() - lastActivityTime.getTime() < timeoutMs;

    if (!isValid) {
      await this.logSecurityEvent('SESSION_EXPIRED', {});
    }

    return isValid;
  }

  async endSession(): Promise<void> {
    await Promise.all([
      storage.removeItem('session_start'),
      storage.removeItem('last_activity'),
    ]);
    await this.logSecurityEvent('LOGOUT', {});
  }

  // Certificate pinning configuration
  getCertificatePins(): string[] {
    return CERTIFICATE_PINS;
  }

  isPinningEnabled(): boolean {
    return this.config.pinningEnabled;
  }

  validateCertificate(certificate: string): boolean {
    if (!this.config.pinningEnabled) return true;
    return CERTIFICATE_PINS.includes(certificate);
  }

  // Security audit logging
  private async logSecurityEvent(
    action: SecurityAction,
    details: Record<string, unknown>
  ): Promise<void> {
    const log: SecurityAuditLog = {
      id: await this.generateSecureRandom(16),
      action,
      timestamp: new Date().toISOString(),
      details,
      success: details.success !== false,
    };

    const logs = (await storage.getItem<SecurityAuditLog[]>('security_audit_logs')) || [];
    logs.push(log);

    // Keep only last 500 logs
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }

    await storage.setItem('security_audit_logs', logs);
  }

  async getSecurityAuditLogs(limit = 50): Promise<SecurityAuditLog[]> {
    const logs = (await storage.getItem<SecurityAuditLog[]>('security_audit_logs')) || [];
    return logs.slice(-limit).reverse();
  }

  async clearSecurityAuditLogs(): Promise<void> {
    await storage.removeItem('security_audit_logs');
  }

  // Device security
  async getDeviceSecurityInfo(): Promise<{
    deviceId: string;
    isRooted: boolean;
    isEmulator: boolean;
    securityLevel: 'high' | 'medium' | 'low';
  }> {
    const deviceId = await this.getOrCreateDeviceId();
    const isEmulator = !Device.isDevice;

    // Basic root detection (not foolproof)
    const isRooted = false; // Would need native module for proper detection

    let securityLevel: 'high' | 'medium' | 'low' = 'high';

    if (isEmulator) {
      securityLevel = 'low';
    } else if (isRooted) {
      securityLevel = 'low';
    } else if (!(await this.isBiometricAvailable())) {
      securityLevel = 'medium';
    }

    return {
      deviceId,
      isRooted,
      isEmulator,
      securityLevel,
    };
  }

  async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await secureStorage.getItem(STORAGE_KEYS.DEVICE_ID);

    if (!deviceId) {
      // Generate unique device ID
      const uniqueData = [
        Device.modelName,
        Device.deviceName,
        Platform.OS,
        Platform.Version,
        Application.applicationId,
        Date.now().toString(),
      ].join('-');

      deviceId = await this.hashData(uniqueData);
      deviceId = deviceId.substring(0, 32); // Truncate for readability

      await secureStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    return deviceId;
  }

  // Sensitive action protection
  async requireAuthForSensitiveAction(
    action: string
  ): Promise<{ authorized: boolean; method?: string }> {
    if (!this.config.requirePinForSensitive) {
      return { authorized: true };
    }

    // Try biometric first
    if (this.config.biometricEnabled && (await this.isBiometricAvailable())) {
      const biometricResult = await this.authenticateWithBiometric(
        `Authentification requise pour: ${action}`
      );
      if (biometricResult.success) {
        await this.logSecurityEvent('SENSITIVE_ACTION', { action, method: 'biometric' });
        return { authorized: true, method: 'biometric' };
      }
    }

    // Fall back to PIN
    if (await this.hasPIN()) {
      return { authorized: false, method: 'pin_required' };
    }

    // No security method available
    return { authorized: true };
  }

  // Clear all security data (for logout/account deletion)
  async clearAllSecurityData(): Promise<void> {
    await Promise.all([
      this.clearTokens(),
      secureStorage.removeItem('app_pin_hash'),
      secureStorage.removeItem('device_encryption_key'),
      secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_TOKEN),
      secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_EMAIL),
      storage.removeItem('login_attempts'),
      storage.removeItem('security_audit_logs'),
      storage.removeItem('session_start'),
      storage.removeItem('last_activity'),
      storage.removeItem('security_config'),
    ]);

    this.loginAttempts = [];
    this.isLocked = false;
    this.lockoutEndTime = null;
  }
}

export const securityService = new SecurityService();
export default securityService;
