/**
 * Authentication Store using Zustand + Supabase Auth
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService } from '../services/auth';
import { getAuthErrorMessage } from '../services/authCookie';
import { supabase } from '../lib/supabase';
import { useTenantStore } from '../stores/tenantStore';
import type { AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /**
   * Vrai tant que `initialize()` n'a pas confronté l'état local à la session
   * Supabase. Les gardes de routes doivent afficher un loader pendant ce
   * laps de temps : sans ça, elles arbitrent sur un `isAuthenticated` non
   * encore vérifié et redirigent à tort (/login <-> /user).
   */
  isBootstrapping: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  _initialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<() => void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isBootstrapping: true,
      isLoading: false,
      error: null,
      accessToken: null,
      _initialized: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.login({ email, password });
          const user = await authService.getCurrentUser();

          // Get access token for Realtime channels
          const {
            data: { session },
          } = await supabase.auth.getSession();

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            accessToken: session?.access_token || null,
          });
        } catch (error) {
          const message =
            error && typeof error === 'object' && 'message' in error
              ? getAuthErrorMessage(error as AuthError)
              : 'Erreur de connexion';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch {
          // Ignore logout errors
        } finally {
          useTenantStore.getState().clearTenant();
          set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null });
        }
      },

      fetchUser: async () => {
        // Prevent concurrent fetches
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null });
            return;
          }

          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            accessToken: session.access_token,
          });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null });
        }
      },

      /**
       * Initialize auth state and listen for Supabase auth changes.
       * Call once on app startup. Returns an unsubscribe function.
       */
      initialize: async () => {
        const { _initialized } = get();
        if (_initialized) return () => {};

        set({ _initialized: true });

        // Check for existing session. Supabase fait autorité : tant que ce
        // bloc n'a pas tranché, aucune garde de route ne doit décider.
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            try {
              const user = await authService.getCurrentUser();
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                accessToken: session.access_token,
              });
            } catch {
              set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null });
            }
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null });
          }
        } finally {
          // Même si getSession() échoue, on doit débloquer l'UI : sinon
          // l'application reste sur un loader indéfiniment.
          set({ isBootstrapping: false });
        }

        // Listen for auth state changes (debounced to prevent loops)
        let fetchingUser = false;
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            // Guard against re-entrant calls (prevents infinite loop)
            if (fetchingUser) return;
            fetchingUser = true;
            try {
              const user = await authService.getCurrentUser();
              set({ user, isAuthenticated: true, accessToken: session.access_token });
            } catch {
              // Don't crash on getCurrentUser failure
            } finally {
              fetchingUser = false;
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false, accessToken: null });
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            set({ accessToken: session.access_token });
          }
        });

        return () => subscription.unsubscribe();
      },

      clearError: () => set({ error: null }),
    }),
    {
      // Clé distincte de celle du client Supabase (`advist-supabase-auth`).
      // Les deux partageaient `advist-auth` et s'écrasaient mutuellement.
      name: 'advist-auth-cache',
      // On ne persiste QUE le profil, pour un premier rendu sans clignotement.
      // `isAuthenticated` n'est délibérément pas persisté : le seul juge de
      // la session est Supabase, via `initialize()`. Le persister revenait à
      // se déclarer connecté avant toute vérification, ce qui renvoyait
      // /login vers /user en boucle.
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
