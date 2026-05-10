/**
 * Secure Authentication Service using Supabase Auth
 *
 * Replaces the previous Django cookie-based authentication.
 * Supabase handles session management via JWT tokens stored securely.
 *
 * @module services/authCookie
 */
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Authentication response shape (kept for backward compatibility)
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'app_super_admin' | 'app_admin' | 'editor' | 'viewer';
    is_atlas_super_admin?: boolean;
    organization?: {
      id: string;
      name: string;
    } | null;
  };
}

/**
 * Login credentials
 */
interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Map a Supabase user to our AuthResponse user shape.
 *
 * Source of truth for the role: licence_seats.role (Atlas Studio Suite).
 * Profile data is fetched from profiles for first/last name and organization.
 */
async function mapSupabaseUser(supabaseUser: SupabaseUser): Promise<AuthResponse['user']> {
  // Fetch profile with organization data
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
      first_name,
      last_name,
      organization_id,
      organizations (
        id,
        name
      )
    `
    )
    .eq('id', supabaseUser.id)
    .single();

  // Fetch the active Atlas Studio seat for the Advist product specifically.
  // Filtering by products.slug='advist' avoids cross-app role contamination
  // when a user holds seats for multiple Atlas Studio Suite apps.
  const { data: seat } = await supabase
    .from('licence_seats')
    .select('role, licences!inner(products!inner(slug))')
    .eq('user_id', supabaseUser.id)
    .eq('status', 'active')
    .eq('licences.products.slug', 'advist')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const org = profile?.organizations as { id: string; name: string } | null;
  const role = (seat?.role as AuthResponse['user']['role'] | undefined) ?? 'viewer';
  const isAtlasSuperAdmin =
    (supabaseUser.app_metadata as Record<string, unknown> | undefined)?.is_atlas_super_admin ===
    true;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    first_name: profile?.first_name || supabaseUser.user_metadata?.first_name || '',
    last_name: profile?.last_name || supabaseUser.user_metadata?.last_name || '',
    role,
    is_atlas_super_admin: isAtlasSuperAdmin,
    organization: org ? { id: org.id, name: org.name } : null,
  };
}

/**
 * Secure Authentication Service
 *
 * Uses Supabase Auth for session management.
 * Sessions are handled via JWT tokens managed by the Supabase client.
 */
export const secureAuthService = {
  /**
   * Login with email and password.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from login');

      const user = await mapSupabaseUser(data.user);
      logger.info('User logged in successfully', { email: credentials.email });

      return { user };
    } catch (error) {
      logger.error('Login failed', { email: credentials.email });
      throw error;
    }
  },

  /**
   * Logout and clear session.
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed');
      throw error;
    }
  },

  /**
   * Get current authenticated user.
   */
  async getCurrentUser(): Promise<AuthResponse['user'] | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      return mapSupabaseUser(user);
    } catch {
      return null;
    }
  },

  /**
   * Get current session.
   */
  async getSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Check if user is authenticated.
   */
  async isAuthenticated(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  },

  /**
   * Request password reset email.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Reset password with new password (after clicking email link).
   */
  async resetPassword(_token: string, password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  /**
   * Change password for authenticated user.
   */
  async changePassword(_currentPassword: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  /**
   * Sign up a new user.
   */
  async signUp(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    organization_name?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          display_name: `${data.first_name} ${data.last_name}`,
          organization_name: data.organization_name,
          phone: data.phone,
        },
      },
    });

    if (error) throw error;
    if (!authData.user) throw new Error('No user returned from signup');

    // The handle_new_user trigger will create the profile automatically
    // Wait briefly for the trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = await mapSupabaseUser(authData.user);
    logger.info('User registered successfully', { email: data.email });

    return { user };
  },

  /**
   * Verify two-factor authentication code.
   * Note: Supabase MFA is handled via supabase.auth.mfa
   */
  async verify2FA(code: string): Promise<AuthResponse> {
    const { _data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: code,
      code,
    });
    if (error) throw error;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No user after 2FA verification');

    return { user: await mapSupabaseUser(user) };
  },

  /**
   * Enable two-factor authentication.
   */
  async enable2FA(): Promise<{ secret: string; qrCode: string }> {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    if (error) throw error;
    return {
      secret: data.totp.secret,
      qrCode: data.totp.uri,
    };
  },

  /**
   * Disable two-factor authentication.
   */
  async disable2FA(factorId: string): Promise<void> {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    if (error) throw error;
  },

  /**
   * Listen for auth state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback);
    return subscription.unsubscribe;
  },
};

/**
 * Re-export supabase client for backward compatibility with secureClient usage.
 * Services that used secureClient for API calls should migrate to use supabase directly.
 */
export const secureClient = {
  get: async <T>(url: string): Promise<{ data: T }> => {
    logger.warn('secureClient.get called - migrate to supabase client', { url });
    throw new Error(`secureClient.get('${url}') is deprecated. Use supabase client directly.`);
  },
  post: async <T>(url: string, _data?: unknown): Promise<{ data: T }> => {
    logger.warn('secureClient.post called - migrate to supabase client', { url });
    throw new Error(`secureClient.post('${url}') is deprecated. Use supabase client directly.`);
  },
};

/**
 * Hook to listen for session expiration events.
 */
export function useSessionExpiration(callback: () => void): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:session-expired', callback);
  }
}

/**
 * Parse Supabase auth errors into user-friendly messages.
 */
export function getAuthErrorMessage(error: AuthError): string {
  const messages: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect.',
    'Email not confirmed': 'Veuillez confirmer votre adresse email.',
    'User already registered': 'Un compte avec cet email existe déjà.',
    'Password should be at least 6 characters':
      'Le mot de passe doit contenir au moins 6 caractères.',
    'Email rate limit exceeded': 'Trop de tentatives. Veuillez réessayer plus tard.',
  };

  return messages[error.message] || error.message;
}

export default secureAuthService;
