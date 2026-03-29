import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { User, RegisterData } from '@/types';
import {
  authService,
  LoginResponse,
  LoginOptions,
  SessionInfo,
  BiometricLoginResult,
} from '@/services/auth';
import { AppError } from '@/services/api';

// Types
export interface BiometricStatus {
  available: boolean;
  enabled: boolean;
  type: string;
}

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  errorCode: string | null;
  biometricStatus: BiometricStatus | null;
  sessions: SessionInfo[];
  sessionsLoading: boolean;

  // Auth Actions
  login: (email: string, password: string, options?: LoginOptions) => Promise<void>;
  loginWithBiometrics: () => Promise<BiometricLoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Profile Actions
  updateUser: (data: Partial<User>) => Promise<void>;
  updateAvatar: (formData: FormData, onProgress?: (progress: number) => void) => Promise<void>;
  refreshUser: () => Promise<void>;

  // Password Actions
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // Biometric Actions
  checkBiometricStatus: () => Promise<void>;
  enableBiometricLogin: () => Promise<boolean>;
  disableBiometricLogin: () => Promise<void>;

  // 2FA Actions
  enable2FA: () => Promise<{ qrCode: string; secret: string }>;
  verify2FA: (code: string) => Promise<void>;
  disable2FA: (code: string) => Promise<void>;

  // Session Management
  loadSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;

  // Error Handling
  clearError: () => void;
  setError: (message: string, code?: string) => void;
}

// Helper to extract error message
function getErrorMessage(error: unknown): { message: string; code?: string } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'Une erreur inattendue est survenue' };
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
    errorCode: null,
    biometricStatus: null,
    sessions: [],
    sessionsLoading: false,

    // Login with email/password
    login: async (email: string, password: string, options?: LoginOptions) => {
      set({ isLoading: true, error: null, errorCode: null });
      try {
        const response: LoginResponse = await authService.login(
          { email, password },
          options
        );
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Check biometric status after login
        get().checkBiometricStatus();
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Login with biometrics
    loginWithBiometrics: async () => {
      set({ isLoading: true, error: null, errorCode: null });
      try {
        const result = await authService.loginWithBiometrics();

        if (result.success && result.user) {
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            error: result.error || 'Echec de l\'authentification biometrique',
            isLoading: false,
          });
        }

        return result;
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        return { success: false, error: message };
      }
    },

    // Register new user
    register: async (data: RegisterData) => {
      set({ isLoading: true, error: null, errorCode: null });
      try {
        const response = await authService.register(data);
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Logout
    logout: async () => {
      set({ isLoading: true });
      try {
        await authService.logout();
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          biometricStatus: null,
          sessions: [],
        });
      }
    },

    // Logout from all devices
    logoutAllDevices: async () => {
      set({ isLoading: true });
      try {
        await authService.logoutAllDevices();
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          biometricStatus: null,
          sessions: [],
        });
      }
    },

    // Initialize auth state on app start
    initialize: async () => {
      if (get().isInitialized) return;

      set({ isLoading: true });
      try {
        const { authenticated, user } = await authService.checkAuth();

        set({
          user,
          isAuthenticated: authenticated,
          isLoading: false,
          isInitialized: true,
        });

        // Check biometric status if authenticated
        if (authenticated) {
          get().checkBiometricStatus();
        }
      } catch {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    },

    // Check authentication status
    checkAuth: async () => {
      set({ isLoading: true });
      try {
        const { authenticated, user } = await authService.checkAuth();
        set({
          user,
          isAuthenticated: authenticated,
          isLoading: false,
        });
      } catch {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    // Update user profile
    updateUser: async (data: Partial<User>) => {
      const currentUser = get().user;
      if (!currentUser) return;

      set({ isLoading: true, error: null });
      try {
        const updatedUser = await authService.updateProfile(data);
        set({ user: updatedUser, isLoading: false });
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Update avatar
    updateAvatar: async (formData: FormData, onProgress?: (progress: number) => void) => {
      set({ isLoading: true, error: null });
      try {
        const updatedUser = await authService.updateAvatar(formData, onProgress);
        set({ user: updatedUser, isLoading: false });
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Refresh user data
    refreshUser: async () => {
      try {
        const user = await authService.getProfile();
        set({ user });
      } catch (error: unknown) {
        // Silent fail for refresh
        console.error('Failed to refresh user:', error);
      }
    },

    // Change password
    changePassword: async (oldPassword: string, newPassword: string) => {
      set({ isLoading: true, error: null });
      try {
        await authService.changePassword(oldPassword, newPassword);
        set({ isLoading: false });

        // Update biometric status (biometric login is disabled after password change)
        get().checkBiometricStatus();
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Request password reset
    requestPasswordReset: async (email: string) => {
      set({ isLoading: true, error: null });
      try {
        await authService.requestPasswordReset(email);
        set({ isLoading: false });
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Reset password with token
    resetPassword: async (token: string, newPassword: string) => {
      set({ isLoading: true, error: null });
      try {
        await authService.resetPassword(token, newPassword);
        set({ isLoading: false });
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Check biometric status
    checkBiometricStatus: async () => {
      try {
        const status = await authService.isBiometricLoginAvailable();
        set({ biometricStatus: status });
      } catch {
        set({
          biometricStatus: { available: false, enabled: false, type: 'none' },
        });
      }
    },

    // Enable biometric login
    enableBiometricLogin: async () => {
      const user = get().user;
      if (!user) return false;

      set({ isLoading: true, error: null });
      try {
        const success = await authService.enableBiometricLogin(user.email);
        if (success) {
          set({
            biometricStatus: {
              ...get().biometricStatus!,
              enabled: true,
            },
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
        return success;
      } catch (error: unknown) {
        const { message } = getErrorMessage(error);
        set({ error: message, isLoading: false });
        return false;
      }
    },

    // Disable biometric login
    disableBiometricLogin: async () => {
      set({ isLoading: true });
      try {
        await authService.disableBiometricLogin();
        set({
          biometricStatus: {
            ...get().biometricStatus!,
            enabled: false,
          },
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },

    // Enable 2FA
    enable2FA: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.enable2FA();
        set({ isLoading: false });
        return result;
      } catch (error: unknown) {
        const { message, code } = getErrorMessage(error);
        set({ error: message, errorCode: code || null, isLoading: false });
        throw error;
      }
    },

    // Verify 2FA
    verify2FA: async (code: string) => {
      set({ isLoading: true, error: null });
      try {
        await authService.verify2FA(code);
        set({ isLoading: false });
      } catch (error: unknown) {
        const { message, code: errorCode } = getErrorMessage(error);
        set({ error: message, errorCode: errorCode || null, isLoading: false });
        throw error;
      }
    },

    // Disable 2FA
    disable2FA: async (code: string) => {
      set({ isLoading: true, error: null });
      try {
        await authService.disable2FA(code);
        set({ isLoading: false });
      } catch (error: unknown) {
        const { message, code: errorCode } = getErrorMessage(error);
        set({ error: message, errorCode: errorCode || null, isLoading: false });
        throw error;
      }
    },

    // Load active sessions
    loadSessions: async () => {
      set({ sessionsLoading: true });
      try {
        const sessions = await authService.getSessions();
        set({ sessions, sessionsLoading: false });
      } catch {
        set({ sessionsLoading: false });
      }
    },

    // Revoke a session
    revokeSession: async (sessionId: string) => {
      try {
        await authService.revokeSession(sessionId);
        set({
          sessions: get().sessions.filter((s) => s.id !== sessionId),
        });
      } catch (error: unknown) {
        const { message } = getErrorMessage(error);
        set({ error: message });
        throw error;
      }
    },

    // Clear error
    clearError: () => set({ error: null, errorCode: null }),

    // Set error
    setError: (message: string, code?: string) =>
      set({ error: message, errorCode: code || null }),
  }))
);

// Selectors for optimized subscriptions
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectError = (state: AuthState) => state.error;
export const selectBiometricStatus = (state: AuthState) => state.biometricStatus;
export const selectSessions = (state: AuthState) => state.sessions;

export default useAuthStore;
