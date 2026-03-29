import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import api from './api';
import { tokenStorage, secureStorage, storage } from '@/utils/storage';
import { authenticateWithBiometrics, checkBiometricAvailability } from '@/utils/biometric';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';
import { STORAGE_KEYS } from '@/constants/config';

// Types
export interface LoginResponse {
  tokens: AuthTokens;
  user: User;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android';
  osVersion: string;
  appVersion: string;
  pushToken?: string;
}

export interface SessionInfo {
  id: string;
  deviceInfo: DeviceInfo;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface LoginOptions {
  rememberDevice?: boolean;
  biometricEnabled?: boolean;
}

export interface BiometricLoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Device ID generation and storage
async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await secureStorage.getItem(STORAGE_KEYS.DEVICE_ID);

  if (!deviceId) {
    deviceId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Device.modelName}-${Device.osVersion}-${Date.now()}-${Math.random()}`
    );
    await secureStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }

  return deviceId;
}

// Get device info for registration
async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getOrCreateDeviceId();
  const pushToken = await secureStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);

  return {
    deviceId,
    deviceName: Device.deviceName || Device.modelName || 'Unknown Device',
    platform: Device.osName?.toLowerCase() === 'ios' ? 'ios' : 'android',
    osVersion: Device.osVersion || 'unknown',
    appVersion: Constants.expoConfig?.version || '1.0.0',
    pushToken: pushToken || undefined,
  };
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(
    credentials: LoginCredentials,
    options: LoginOptions = {}
  ): Promise<LoginResponse> {
    const deviceInfo = await getDeviceInfo();

    const response = await api.post<LoginResponse>('/auth/login/', {
      ...credentials,
      device: deviceInfo,
      remember_device: options.rememberDevice ?? false,
    });

    await api.setTokens(response.tokens);
    await this.saveUserLocally(response.user);

    // Enable biometric login if requested
    if (options.biometricEnabled) {
      await this.enableBiometricLogin(credentials.email);
    }

    return response;
  },

  /**
   * Login with biometrics (requires prior setup)
   */
  async loginWithBiometrics(): Promise<BiometricLoginResult> {
    const biometricStatus = await checkBiometricAvailability();

    if (!biometricStatus.isAvailable || !biometricStatus.isEnrolled) {
      return {
        success: false,
        error: 'Authentification biometrique non disponible',
      };
    }

    // Check if biometric login is enabled
    const biometricEnabled = await storage.getItem<boolean>(STORAGE_KEYS.BIOMETRIC_ENABLED);
    if (!biometricEnabled) {
      return {
        success: false,
        error: 'Connexion biometrique non configuree',
      };
    }

    // Authenticate with biometrics
    const authResult = await authenticateWithBiometrics({
      promptMessage: 'Connectez-vous a Advist',
    });

    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    // Get stored credentials hash
    const storedEmail = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_EMAIL);
    const storedToken = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_TOKEN);

    if (!storedEmail || !storedToken) {
      return {
        success: false,
        error: 'Identifiants biometriques non trouves',
      };
    }

    try {
      // Use biometric token for authentication
      const deviceInfo = await getDeviceInfo();
      const response = await api.post<LoginResponse>('/auth/biometric-login/', {
        email: storedEmail,
        biometric_token: storedToken,
        device: deviceInfo,
      });

      await api.setTokens(response.tokens);
      await this.saveUserLocally(response.user);

      return {
        success: true,
        user: response.user,
      };
    } catch (error) {
      // Clear biometric credentials on failure
      await this.disableBiometricLogin();
      return {
        success: false,
        error: 'Session expiree. Veuillez vous reconnecter.',
      };
    }
  },

  /**
   * Enable biometric login for the current user
   */
  async enableBiometricLogin(email: string): Promise<boolean> {
    try {
      // Generate a unique biometric token
      const biometricToken = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${email}-${Date.now()}-${await getOrCreateDeviceId()}`
      );

      // Register the biometric token with the server
      await api.post('/auth/biometric/register/', {
        biometric_token: biometricToken,
      });

      // Store credentials securely
      await secureStorage.setItem(STORAGE_KEYS.BIOMETRIC_EMAIL, email);
      await secureStorage.setItem(STORAGE_KEYS.BIOMETRIC_TOKEN, biometricToken);
      await storage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, true);

      return true;
    } catch (error) {
      console.error('Enable biometric login error:', error);
      return false;
    }
  },

  /**
   * Disable biometric login
   */
  async disableBiometricLogin(): Promise<void> {
    try {
      // Revoke token on server
      const token = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_TOKEN);
      if (token) {
        await api.post('/auth/biometric/revoke/', { biometric_token: token });
      }
    } catch {
      // Ignore server errors
    }

    await secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_EMAIL);
    await secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_TOKEN);
    await storage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, false);
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    const deviceInfo = await getDeviceInfo();

    const response = await api.post<LoginResponse>('/auth/register/', {
      ...data,
      device: deviceInfo,
    });

    await api.setTokens(response.tokens);
    await this.saveUserLocally(response.user);

    return response;
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      const deviceId = await getOrCreateDeviceId();
      await api.post('/auth/logout/', { device_id: deviceId });
    } catch {
      // Ignore server errors during logout
    } finally {
      await this.clearLocalData();
    }
  },

  /**
   * Logout from all devices
   */
  async logoutAllDevices(): Promise<void> {
    try {
      await api.post('/auth/logout/all/');
    } finally {
      await this.clearLocalData();
    }
  },

  /**
   * Clear all local authentication data
   */
  async clearLocalData(): Promise<void> {
    await Promise.all([
      api.clearTokens(),
      secureStorage.removeItem(STORAGE_KEYS.USER),
      this.disableBiometricLogin(),
    ]);
  },

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const user = await api.get<User>('/auth/me/');
    await this.saveUserLocally(user);
    return user;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const user = await api.patch<User>('/auth/me/', data);
    await this.saveUserLocally(user);
    return user;
  },

  /**
   * Update profile avatar
   */
  async updateAvatar(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<User> {
    const user = await api.uploadFile<User>('/auth/me/avatar/', formData, onProgress);
    await this.saveUserLocally(user);
    return user;
  },

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
    });

    // Invalidate biometric login after password change
    await this.disableBiometricLogin();
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/password/reset/', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/password/reset/confirm/', {
      token,
      new_password: newPassword,
    });
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/email/verify/', { token });
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    await api.post('/auth/email/resend/');
  },

  /**
   * Verify if the stored token is still valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      const hasToken = await tokenStorage.hasValidToken();
      if (!hasToken) return false;

      await api.get('/auth/me/');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check authentication status and get user
   */
  async checkAuth(): Promise<{ authenticated: boolean; user: User | null }> {
    try {
      const hasToken = await tokenStorage.hasValidToken();

      if (!hasToken) {
        // Try to get cached user for offline mode
        const cachedUser = await this.getLocalUser();
        return { authenticated: false, user: cachedUser };
      }

      const user = await this.getProfile();
      return { authenticated: true, user };
    } catch {
      const cachedUser = await this.getLocalUser();
      return { authenticated: false, user: cachedUser };
    }
  },

  /**
   * Enable 2FA
   */
  async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    return await api.post('/auth/2fa/enable/');
  },

  /**
   * Verify 2FA code
   */
  async verify2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/verify/', { code });
  },

  /**
   * Disable 2FA
   */
  async disable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/disable/', { code });
  },

  /**
   * Register push notification token
   */
  async registerPushToken(token: string): Promise<void> {
    await secureStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);

    const deviceId = await getOrCreateDeviceId();
    await api.post('/notifications/register/', {
      push_token: token,
      device_id: deviceId,
      platform: Device.osName?.toLowerCase() === 'ios' ? 'ios' : 'android',
    });
  },

  /**
   * Unregister push notification token
   */
  async unregisterPushToken(): Promise<void> {
    const token = await secureStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    if (token) {
      try {
        await api.post('/notifications/unregister/', { push_token: token });
      } catch {
        // Ignore errors
      }
      await secureStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
    }
  },

  /**
   * Get active sessions
   */
  async getSessions(): Promise<SessionInfo[]> {
    return await api.get<SessionInfo[]>('/auth/sessions/');
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}/`);
  },

  /**
   * Save user to local storage
   */
  async saveUserLocally(user: User): Promise<void> {
    await secureStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  /**
   * Get locally stored user
   */
  async getLocalUser(): Promise<User | null> {
    const userData = await secureStorage.getItem(STORAGE_KEYS.USER);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if biometric login is available and enabled
   */
  async isBiometricLoginAvailable(): Promise<{
    available: boolean;
    enabled: boolean;
    type: string;
  }> {
    const status = await checkBiometricAvailability();
    const enabled = await storage.getItem<boolean>(STORAGE_KEYS.BIOMETRIC_ENABLED);

    return {
      available: status.isAvailable && status.isEnrolled,
      enabled: enabled ?? false,
      type: status.biometricType,
    };
  },
};

export default authService;
