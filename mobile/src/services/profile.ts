import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from './api';
import { cacheStorage, storage, secureStorage } from '@/utils/storage';
import { checkBiometricAvailability } from '@/utils/biometric';
import { User } from '@/types';
import { CACHE_CONFIG, STORAGE_KEYS } from '@/constants/config';

// Types
export interface UserProfile extends User {
  phone?: string;
  department?: string;
  position?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  timezone?: string;
  language?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: '2fa_app' | 'sms' | 'email';
  biometricEnabled: boolean;
  sessionTimeout: number; // in minutes
  loginNotifications: boolean;
  trustedDevices: TrustedDevice[];
}

export interface TrustedDevice {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'web';
  lastUsed: string;
  location?: string;
  isCurrent: boolean;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
  location?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en' | 'ar';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  defaultDocumentView: 'list' | 'grid';
  compactMode: boolean;
  hapticFeedback: boolean;
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  downloadQuality: 'low' | 'medium' | 'high' | 'original';
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface StorageInfo {
  used: number; // in bytes
  total: number; // in bytes
  breakdown: {
    documents: number;
    signatures: number;
    cache: number;
  };
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'fr',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  defaultDocumentView: 'list',
  compactMode: false,
  hapticFeedback: true,
  autoSync: true,
  syncOnWifiOnly: false,
  downloadQuality: 'high',
};

export const profileService = {
  // Profile management
  async getProfile(): Promise<UserProfile> {
    const cacheKey = 'user_profile';
    const cached = await cacheStorage.get<UserProfile>(cacheKey);

    if (cached) {
      // Refresh in background
      this.fetchAndCacheProfile(cacheKey);
      return cached;
    }

    return await this.fetchAndCacheProfile(cacheKey);
  },

  async fetchAndCacheProfile(cacheKey?: string): Promise<UserProfile> {
    const profile = await api.get<UserProfile>('/users/me/');

    if (cacheKey) {
      await cacheStorage.set(cacheKey, profile, CACHE_CONFIG.USER_TTL);
    }

    // Also save locally for quick access
    await storage.setItem(STORAGE_KEYS.USER, profile);

    return profile;
  },

  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const profile = await api.patch<UserProfile>('/users/me/', {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      department: data.department,
      position: data.position,
      timezone: data.timezone,
      language: data.language,
    });

    await cacheStorage.set('user_profile', profile, CACHE_CONFIG.USER_TTL);
    await storage.setItem(STORAGE_KEYS.USER, profile);

    return profile;
  },

  // Avatar management
  async pickAvatar(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Permission d\'accès à la galerie refusée');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    // Resize and compress image
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipulated.uri;
  },

  async takeAvatarPhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Permission d\'accès à la caméra refusée');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipulated.uri;
  },

  async uploadAvatar(imageUri: string): Promise<UserProfile> {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const profile = await api.post<UserProfile>('/users/me/avatar/', {
      avatar: `data:image/jpeg;base64,${base64}`,
    });

    await cacheStorage.set('user_profile', profile, CACHE_CONFIG.USER_TTL);
    await storage.setItem(STORAGE_KEYS.USER, profile);

    return profile;
  },

  async removeAvatar(): Promise<UserProfile> {
    const profile = await api.delete<UserProfile>('/users/me/avatar/');

    await cacheStorage.set('user_profile', profile, CACHE_CONFIG.USER_TTL);
    await storage.setItem(STORAGE_KEYS.USER, profile);

    return profile;
  },

  // Password management
  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.post('/users/me/change-password/', {
      current_password: data.currentPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    });
  },

  async validatePassword(password: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return { valid: errors.length === 0, errors };
  },

  // Security settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    const cacheKey = 'security_settings';
    const cached = await cacheStorage.get<SecuritySettings>(cacheKey);

    if (cached) {
      return cached;
    }

    const settings = await api.get<SecuritySettings>('/users/me/security/');

    // Add local biometric status
    const biometricEnabled = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    settings.biometricEnabled = biometricEnabled === 'true';

    await cacheStorage.set(cacheKey, settings, CACHE_CONFIG.USER_TTL);
    return settings;
  },

  async updateSecuritySettings(
    settings: Partial<Omit<SecuritySettings, 'trustedDevices'>>
  ): Promise<SecuritySettings> {
    const updated = await api.patch<SecuritySettings>('/users/me/security/', {
      two_factor_enabled: settings.twoFactorEnabled,
      two_factor_method: settings.twoFactorMethod,
      session_timeout: settings.sessionTimeout,
      login_notifications: settings.loginNotifications,
    });

    // Handle biometric locally
    if (settings.biometricEnabled !== undefined) {
      await secureStorage.setItem(
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        settings.biometricEnabled.toString()
      );
      updated.biometricEnabled = settings.biometricEnabled;
    }

    await cacheStorage.set('security_settings', updated, CACHE_CONFIG.USER_TTL);
    return updated;
  },

  // Two-factor authentication
  async setupTwoFactor(method: '2fa_app' | 'sms' | 'email'): Promise<TwoFactorSetup> {
    return await api.post<TwoFactorSetup>('/users/me/2fa/setup/', { method });
  },

  async verifyTwoFactorSetup(code: string): Promise<{ success: boolean; backupCodes?: string[] }> {
    return await api.post('/users/me/2fa/verify/', { code });
  },

  async disableTwoFactor(password: string): Promise<void> {
    await api.post('/users/me/2fa/disable/', { password });
    await cacheStorage.invalidate('security_settings');
  },

  async regenerateBackupCodes(password: string): Promise<string[]> {
    const response = await api.post<{ backup_codes: string[] }>(
      '/users/me/2fa/regenerate-codes/',
      { password }
    );
    return response.backup_codes;
  },

  // Trusted devices
  async getTrustedDevices(): Promise<TrustedDevice[]> {
    const response = await api.get<{ results: TrustedDevice[] }>('/users/me/devices/');
    return response.results;
  },

  async removeTrustedDevice(deviceId: string): Promise<void> {
    await api.delete(`/users/me/devices/${deviceId}/`);
    await cacheStorage.invalidate('security_settings');
  },

  async removeAllOtherDevices(): Promise<void> {
    await api.post('/users/me/devices/remove-others/');
    await cacheStorage.invalidate('security_settings');
  },

  // Activity log
  async getActivityLog(page = 1, pageSize = 20): Promise<{
    results: ActivityLogEntry[];
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    return await api.get('/users/me/activity/', {
      page,
      page_size: pageSize,
    });
  },

  // App settings (stored locally)
  async getAppSettings(): Promise<AppSettings> {
    const stored = await storage.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
    return { ...DEFAULT_APP_SETTINGS, ...stored };
  },

  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getAppSettings();
    const updated = { ...current, ...settings };
    await storage.setItem(STORAGE_KEYS.APP_SETTINGS, updated);
    return updated;
  },

  async resetAppSettings(): Promise<AppSettings> {
    await storage.setItem(STORAGE_KEYS.APP_SETTINGS, DEFAULT_APP_SETTINGS);
    return DEFAULT_APP_SETTINGS;
  },

  // Storage info
  async getStorageInfo(): Promise<StorageInfo> {
    // Get local storage info
    const documentDir = FileSystem.documentDirectory;
    const cacheDir = FileSystem.cacheDirectory;

    let documentsSize = 0;
    let signaturesSize = 0;
    let cacheSize = 0;

    try {
      // Calculate documents size
      if (documentDir) {
        const documentsFolder = `${documentDir}documents/`;
        const docInfo = await FileSystem.getInfoAsync(documentsFolder);
        if (docInfo.exists && 'size' in docInfo) {
          documentsSize = docInfo.size || 0;
        }
      }

      // Calculate signatures size
      if (documentDir) {
        const signaturesFolder = `${documentDir}signatures/`;
        const sigInfo = await FileSystem.getInfoAsync(signaturesFolder);
        if (sigInfo.exists && 'size' in sigInfo) {
          signaturesSize = sigInfo.size || 0;
        }
      }

      // Calculate cache size
      if (cacheDir) {
        const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
        if (cacheInfo.exists && 'size' in cacheInfo) {
          cacheSize = cacheInfo.size || 0;
        }
      }
    } catch (error) {
      console.error('Error calculating storage:', error);
    }

    const used = documentsSize + signaturesSize + cacheSize;
    const total = 500 * 1024 * 1024; // 500MB limit

    return {
      used,
      total,
      breakdown: {
        documents: documentsSize,
        signatures: signaturesSize,
        cache: cacheSize,
      },
    };
  },

  async clearCache(): Promise<void> {
    await cacheStorage.clear();

    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir) {
      try {
        const cacheContents = await FileSystem.readDirectoryAsync(cacheDir);
        for (const file of cacheContents) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
        }
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  },

  async clearOfflineData(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.CACHED_DOCUMENTS);
    await storage.removeItem(STORAGE_KEYS.CACHED_NOTIFICATIONS);
    await storage.removeItem(STORAGE_KEYS.CACHED_TASKS);
    await storage.removeItem(STORAGE_KEYS.PENDING_ACTIONS);

    const documentDir = FileSystem.documentDirectory;
    if (documentDir) {
      try {
        const offlineFolder = `${documentDir}offline/`;
        await FileSystem.deleteAsync(offlineFolder, { idempotent: true });
      } catch (error) {
        console.error('Error clearing offline data:', error);
      }
    }
  },

  // Biometric status
  async getBiometricStatus(): Promise<{
    available: boolean;
    enrolled: boolean;
    enabled: boolean;
    type: string;
  }> {
    const status = await checkBiometricAvailability();
    const enabled = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);

    return {
      available: status.isAvailable,
      enrolled: status.isEnrolled,
      enabled: enabled === 'true',
      type: status.biometricType,
    };
  },

  async enableBiometric(): Promise<boolean> {
    const status = await checkBiometricAvailability();

    if (!status.isAvailable || !status.isEnrolled) {
      throw new Error('Biométrie non disponible sur cet appareil');
    }

    await secureStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
    return true;
  },

  async disableBiometric(): Promise<void> {
    await secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    await secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_TOKEN);
    await secureStorage.removeItem(STORAGE_KEYS.BIOMETRIC_EMAIL);
  },

  // Export user data (GDPR compliance)
  async requestDataExport(): Promise<{ requestId: string; estimatedTime: string }> {
    return await api.post('/users/me/export-data/');
  },

  async getDataExportStatus(
    requestId: string
  ): Promise<{ status: 'pending' | 'processing' | 'ready' | 'expired'; downloadUrl?: string }> {
    return await api.get(`/users/me/export-data/${requestId}/`);
  },

  // Account deletion
  async requestAccountDeletion(password: string, reason?: string): Promise<void> {
    await api.post('/users/me/delete-account/', {
      password,
      reason,
    });
  },

  // Email verification
  async resendVerificationEmail(): Promise<void> {
    await api.post('/users/me/resend-verification/');
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/users/verify-email/', { token });
    await cacheStorage.invalidate('user_profile');
  },

  // Support
  async submitFeedback(data: {
    type: 'bug' | 'feature' | 'general';
    message: string;
    attachments?: string[];
  }): Promise<void> {
    await api.post('/support/feedback/', data);
  },

  async getHelpArticles(query?: string): Promise<Array<{
    id: string;
    title: string;
    summary: string;
    category: string;
  }>> {
    return await api.get('/support/articles/', { q: query });
  },

  // Invalidate caches
  async invalidateProfileCaches(): Promise<void> {
    await cacheStorage.invalidate('user_profile');
    await cacheStorage.invalidate('security_settings');
  },
};

export default profileService;
