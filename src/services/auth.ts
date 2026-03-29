/**
 * Authentication Service
 *
 * Facade over Supabase Auth providing a stable API for the rest of the app.
 */
import { secureAuthService, getAuthErrorMessage } from './authCookie';
import type { User } from '../types';

/**
 * Authentication service using Supabase Auth.
 */
export const authService = {
  /**
   * Login with email and password.
   */
  async login(credentials: { email: string; password: string }) {
    const response = await secureAuthService.login(credentials);
    return {
      access: 'supabase-managed',
      refresh: 'supabase-managed',
      user: response.user,
    };
  },

  /**
   * Register a new user.
   */
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    organization_name?: string;
    phone?: string;
  }): Promise<User> {
    const response = await secureAuthService.signUp(data);
    return response.user as unknown as User;
  },

  /**
   * Logout and clear session.
   */
  async logout(): Promise<void> {
    await secureAuthService.logout();
  },

  /**
   * Get the current authenticated user.
   */
  async getCurrentUser(): Promise<User | null> {
    const user = await secureAuthService.getCurrentUser();
    return user as unknown as User | null;
  },

  /**
   * Refresh the session.
   * Handled automatically by Supabase client.
   */
  async refreshToken(): Promise<string> {
    return 'supabase-managed';
  },

  /**
   * Change the user's password.
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await secureAuthService.changePassword(oldPassword, newPassword);
  },

  /**
   * Request a password reset email.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await secureAuthService.requestPasswordReset(email);
  },

  /**
   * Check if user is authenticated (synchronous check via Supabase session cache).
   */
  isAuthenticated(): boolean {
    // Supabase stores session in localStorage, so we can check synchronously
    const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.replace(/https?:\/\//, '').split('.')[0]}-auth-token`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return false;
      const session = JSON.parse(stored);
      return !!session?.access_token;
    } catch {
      return false;
    }
  },

  /**
   * Async authentication check with server validation.
   */
  async isAuthenticatedAsync(): Promise<boolean> {
    return secureAuthService.isAuthenticated();
  },

  /**
   * Listen for auth state changes.
   */
  onAuthStateChange: secureAuthService.onAuthStateChange,

  /**
   * Get user-friendly error message.
   */
  getErrorMessage: getAuthErrorMessage,
};
