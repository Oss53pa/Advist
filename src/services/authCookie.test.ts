/**
 * Tests for Secure Authentication Service (Supabase Auth)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockSignUp = vi.fn();
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));
const mockMfaChallengeAndVerify = vi.fn();
const mockMfaEnroll = vi.fn();
const mockMfaUnenroll = vi.fn();
const createChainedQuery = () => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
  return chain;
};
const mockFrom = vi.fn(() => createChainedQuery());

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      signUp: mockSignUp,
      getUser: mockGetUser,
      getSession: mockGetSession,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      onAuthStateChange: mockOnAuthStateChange,
      mfa: {
        challengeAndVerify: mockMfaChallengeAndVerify,
        enroll: mockMfaEnroll,
        unenroll: mockMfaUnenroll,
      },
    },
    from: mockFrom,
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    exception: vi.fn(),
  },
}));

describe('secureAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call supabase signInWithPassword', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { first_name: 'Test', last_name: 'User' },
      };

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const { secureAuthService } = await import('./authCookie');

      const result = await secureAuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error on login failure', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      vi.resetModules();
      const { secureAuthService } = await import('./authCookie');

      await expect(
        secureAuthService.login({
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should call supabase signOut', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      const { secureAuthService } = await import('./authCookie');

      await secureAuthService.logout();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should throw if signOut returns error', async () => {
      mockSignOut.mockResolvedValueOnce({ error: { message: 'Network error' } });

      vi.resetModules();
      const { secureAuthService } = await import('./authCookie');

      await expect(secureAuthService.logout()).rejects.toBeTruthy();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const { secureAuthService } = await import('./authCookie');

      const result = await secureAuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when session exists', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'test' } },
      });

      const { secureAuthService } = await import('./authCookie');

      const result = await secureAuthService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no session', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
      });

      vi.resetModules();
      const { secureAuthService } = await import('./authCookie');

      const result = await secureAuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('requestPasswordReset', () => {
    it('should call supabase resetPasswordForEmail', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

      const { secureAuthService } = await import('./authCookie');

      await secureAuthService.requestPasswordReset('test@example.com');

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ redirectTo: expect.any(String) })
      );
    });
  });

  describe('resetPassword', () => {
    it('should call supabase updateUser with new password', async () => {
      mockUpdateUser.mockResolvedValueOnce({ error: null });

      const { secureAuthService } = await import('./authCookie');

      await secureAuthService.resetPassword('token', 'newPassword123');

      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPassword123' });
    });
  });

  describe('changePassword', () => {
    it('should call supabase updateUser', async () => {
      mockUpdateUser.mockResolvedValueOnce({ error: null });

      const { secureAuthService } = await import('./authCookie');

      await secureAuthService.changePassword('currentPass', 'newPass');

      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPass' });
    });
  });

  describe('2FA methods', () => {
    it('should enroll 2FA', async () => {
      mockMfaEnroll.mockResolvedValueOnce({
        data: { totp: { secret: 'ABCD1234', uri: 'otpauth://totp/...' } },
        error: null,
      });

      const { secureAuthService } = await import('./authCookie');

      const result = await secureAuthService.enable2FA();

      expect(result.secret).toBe('ABCD1234');
      expect(result.qrCode).toBe('otpauth://totp/...');
    });

    it('should unenroll 2FA', async () => {
      mockMfaUnenroll.mockResolvedValueOnce({ error: null });

      const { secureAuthService } = await import('./authCookie');

      await secureAuthService.disable2FA('factor-id');

      expect(mockMfaUnenroll).toHaveBeenCalledWith({ factorId: 'factor-id' });
    });
  });
});

describe('useSessionExpiration', () => {
  it('should add event listener for session expiration', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const callback = vi.fn();

    const { useSessionExpiration } = await import('./authCookie');

    useSessionExpiration(callback);

    expect(addEventListenerSpy).toHaveBeenCalledWith('auth:session-expired', callback);
  });
});

describe('getAuthErrorMessage', () => {
  it('should return French message for known errors', async () => {
    const { getAuthErrorMessage } = await import('./authCookie');

    const result = getAuthErrorMessage({
      message: 'Invalid login credentials',
      status: 400,
      name: 'AuthApiError',
    } as never);

    expect(result).toBe('Email ou mot de passe incorrect.');
  });

  it('should return original message for unknown errors', async () => {
    const { getAuthErrorMessage } = await import('./authCookie');

    const result = getAuthErrorMessage({
      message: 'Some unknown error',
      status: 500,
      name: 'AuthApiError',
    } as never);

    expect(result).toBe('Some unknown error');
  });
});
