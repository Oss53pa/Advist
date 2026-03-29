import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Secure storage for sensitive data (tokens, credentials)
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStore getItem error for key ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`SecureStore setItem error for key ${key}:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`SecureStore removeItem error for key ${key}:`, error);
      return false;
    }
  },

  async clear(): Promise<void> {
    const keysToRemove = [
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ];

    await Promise.all(keysToRemove.map((key) => this.removeItem(key)));
  },
};

/**
 * Regular storage for non-sensitive data
 */
export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error(`AsyncStorage getItem error for key ${key}:`, error);
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`AsyncStorage setItem error for key ${key}:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`AsyncStorage removeItem error for key ${key}:`, error);
      return false;
    }
  },

  async multiGet<T>(keys: string[]): Promise<Map<string, T | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result = new Map<string, T | null>();

      pairs.forEach(([key, value]) => {
        result.set(key, value ? JSON.parse(value) : null);
      });

      return result;
    } catch (error) {
      console.error('AsyncStorage multiGet error:', error);
      return new Map();
    }
  },

  async multiSet<T>(entries: [string, T][]): Promise<boolean> {
    try {
      const pairs: [string, string][] = entries.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('AsyncStorage multiSet error:', error);
      return false;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter((key) => key.startsWith('advist_'));
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error);
      return [];
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
    }
  },
};

/**
 * Token management utilities
 */
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<boolean> {
    return secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<boolean> {
    return secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<boolean> {
    const accessResult = await this.setAccessToken(accessToken);
    const refreshResult = await this.setRefreshToken(refreshToken);
    return accessResult && refreshResult;
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },

  async hasValidToken(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    try {
      // Decode JWT and check expiration
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const exp = payload.exp * 1000;
      return exp > Date.now();
    } catch {
      return false;
    }
  },
};

/**
 * Cache utilities with TTL
 */
export const cacheStorage = {
  async get<T>(key: string): Promise<T | null> {
    const cached = await storage.getItem<{ data: T; expiresAt: number }>(key);

    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      await storage.removeItem(key);
      return null;
    }

    return cached.data;
  },

  async set<T>(key: string, data: T, ttl: number): Promise<boolean> {
    return storage.setItem(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  },

  async invalidate(keyPattern: string): Promise<void> {
    const keys = await storage.getAllKeys();
    const matchingKeys = keys.filter((key) => key.includes(keyPattern));
    await Promise.all(matchingKeys.map((key) => storage.removeItem(key)));
  },
};
