/**
 * Supabase Auth hook — convenience wrapper over authStore.
 *
 * Provides reactive auth state + actions for components.
 * Replaces any remaining Django JWT auth patterns.
 */
import { useCallback } from 'react';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { generateSecureToken } from '../utils/encryption';

export function useAuth() {
  const store = useAuthStore();

  // Auth state changes are already handled by authStore.initialize() in App.tsx
  // No duplicate listener needed here

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'azure') => {
    // Generate and store state parameter to prevent CSRF
    const oauthState = generateSecureToken(16);
    sessionStorage.setItem('oauth_state', oauthState);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          state: oauthState,
        },
      },
    });
    if (error) throw error;
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  /**
   * Verify the OAuth callback state parameter to prevent CSRF attacks.
   * Call this in the /auth/callback route handler.
   */
  const verifyOAuthCallback = useCallback((urlState: string | null): boolean => {
    const storedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');

    if (!storedState || !urlState) return false;
    return storedState === urlState;
  }, []);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    logout: store.logout,
    signInWithOAuth,
    signInWithMagicLink,
    verifyOAuthCallback,
  };
}
