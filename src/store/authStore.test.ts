/**
 * Tests for Authentication Store
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

// Mock the auth service
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockGetCurrentUser = vi.fn();

vi.mock('../services/auth', () => ({
  authService: {
    login: (...args: unknown[]) => mockLogin(...args),
    logout: (...args: unknown[]) => mockLogout(...args),
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
    isAuthenticated: vi.fn(() => false),
    onAuthStateChange: vi.fn(() => () => {}),
  },
}));

// Mock the authCookie module
vi.mock('../services/authCookie', () => ({
  getAuthErrorMessage: vi.fn((error: { message: string }) => error.message),
}));

// Mock supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { access_token: 'test-token' } } })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock the tenant store
vi.mock('../stores/tenantStore', () => ({
  useTenantStore: {
    getState: () => ({
      clearTenant: vi.fn(),
    }),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessToken: null,
      _initialized: false,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'app_admin' as const,
        organization: null,
        is_active: true,
        is_atlas_super_admin: false,
        language: 'fr',
        timezone: 'Africa/Abidjan',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockLogin.mockResolvedValue(undefined);
      mockGetCurrentUser.mockResolvedValue(mockUser);

      await useAuthStore.getState().login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrong-password')
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should set isLoading during login', async () => {
      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      mockGetCurrentUser.mockResolvedValue({ id: '1', email: 'test@example.com' });

      const loginPromise = useAuthStore.getState().login('test@example.com', 'password123');

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user and authentication state', async () => {
      // Set authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com' } as any,
        isAuthenticated: true,
        accessToken: 'test-token',
      });

      mockLogout.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
    });

    it('should still clear state even if logout API fails', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com' } as any,
        isAuthenticated: true,
      });

      mockLogout.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Test error' });
      expect(useAuthStore.getState().error).toBe('Test error');

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('fetchUser', () => {
    it('should fetch and set user from session', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await useAuthStore.getState().fetchUser();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
