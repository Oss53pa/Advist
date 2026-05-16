/**
 * Tests for useSubscriptionGuard hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSubscriptionGuard } from './useSubscriptionGuard';
import type { SubscriptionInfo } from '../services/features';

// --- Mocks ---

const mockGetSubscriptionInfo = vi.fn<(force?: boolean) => Promise<SubscriptionInfo>>();
const mockCheckFeature = vi.fn();
const mockCheckQuota = vi.fn();
const mockSubscribeToUpdates = vi.fn(() => vi.fn());
const mockClearCache = vi.fn();

vi.mock('../services/features', () => {
  class NoActiveLicenceError extends Error {
    constructor(message = 'No active licence for the current user') {
      super(message);
      this.name = 'NoActiveLicenceError';
    }
  }
  return {
    getSubscriptionInfo: (...args: unknown[]) => mockGetSubscriptionInfo(...(args as [boolean?])),
    checkFeature: (...args: unknown[]) => mockCheckFeature(...args),
    checkQuota: (...args: unknown[]) => mockCheckQuota(...args),
    subscribeToUpdates: (...args: unknown[]) => mockSubscribeToUpdates(...args),
    clearCache: (...args: unknown[]) => mockClearCache(...args),
    NoActiveLicenceError,
  };
});

// Re-import the mocked NoActiveLicenceError so tests can construct it.
// vi.mock is hoisted, so this works at the top level after the mock is set up.
const { NoActiveLicenceError } = await import('../services/features');

// Mock tenantStore as a zustand-like store with getState/setState
let tenantState: Record<string, unknown> = {};

const mockSetTenant = vi.fn((tenant: unknown) => {
  tenantState.currentTenant = tenant;
});
const mockClearTenant = vi.fn(() => {
  tenantState.currentTenant = null;
});
const mockCanAccessApp = vi.fn(() => ({ allowed: true }) as { allowed: boolean; reason?: string });
const mockGetDaysRemaining = vi.fn(() => 0);
const mockShouldShowUpgradePrompt = vi.fn(() => false);
const mockTenantCheckFeature = vi.fn(() => false);
const mockTenantCheckQuota = vi.fn(() => ({
  allowed: true,
  current: 0,
  max: 100,
  percentage: 0,
}));

const defaultTenantActions = () => ({
  currentTenant: tenantState.currentTenant ?? null,
  setTenant: mockSetTenant,
  canAccessApp: mockCanAccessApp,
  getDaysRemaining: mockGetDaysRemaining,
  shouldShowUpgradePrompt: mockShouldShowUpgradePrompt,
  clearTenant: mockClearTenant,
  checkFeature: mockTenantCheckFeature,
  checkQuota: mockTenantCheckQuota,
});

let tenantStoreOverrides: Record<string, unknown> = {};

vi.mock('../stores/tenantStore', () => ({
  useTenantStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { ...defaultTenantActions(), ...tenantStoreOverrides };
    if (selector) return selector(state);
    return state;
  },
  createTenant: vi.fn(),
}));

let authStoreState: Record<string, unknown> = {};

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      user: null,
      isAuthenticated: false,
      ...authStoreState,
    };
    if (selector) return selector(state);
    return state;
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// --- Helpers ---

function makeSubscriptionInfo(overrides: Partial<SubscriptionInfo> = {}): SubscriptionInfo {
  return {
    id: 'sub-1',
    tenantId: 'org-1',
    plan: 'business',
    status: 'active',
    currentPeriodStart: '2026-01-01',
    currentPeriodEnd: '2026-12-31',
    autoRenew: true,
    features: {},
    quotas: {
      maxUsers: 50,
      currentUsers: 5,
      maxDocuments: 15000,
      currentDocuments: 100,
      maxWorkflows: 100,
      currentWorkflows: 2,
      maxStorage: 250,
      currentStorage: 1,
      maxSignaturesMonth: 1500,
      currentSignaturesMonth: 10,
    },
    limits: {},
    ...overrides,
  };
}

function makeTenant(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test Org',
    slug: 'test-org',
    plan: 'business' as const,
    status: 'active' as const,
    quotas: {
      maxUsers: 50,
      currentUsers: 5,
      maxDocuments: 15000,
      currentDocuments: 100,
      maxWorkflows: 100,
      currentWorkflows: 2,
      maxStorage: 250,
      currentStorage: 1,
      maxSignaturesMonth: 1500,
      currentSignaturesMonth: 10,
      maxProjects: 100,
      currentProjects: 0,
    },
    features: {},
    settings: {},
    subscription: { status: 'active', autoRenew: true },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// --- Tests ---

describe('useSubscriptionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantState = {};
    tenantStoreOverrides = {};
    authStoreState = {};
    mockGetSubscriptionInfo.mockResolvedValue(makeSubscriptionInfo());
    mockSubscribeToUpdates.mockReturnValue(vi.fn());
    // Restore default implementations on stable mocks after clearAllMocks.
    mockCanAccessApp.mockReturnValue({ allowed: true });
    mockGetDaysRemaining.mockReturnValue(0);
    mockShouldShowUpgradePrompt.mockReturnValue(false);
    mockTenantCheckFeature.mockReturnValue(false);
    mockTenantCheckQuota.mockReturnValue({
      allowed: true,
      current: 0,
      max: 100,
      percentage: 0,
    });
  });

  // 1. Not authenticated => canAccess true
  it('returns canAccess: true when user is not authenticated', async () => {
    authStoreState = { user: null, isAuthenticated: false };

    const { result } = renderHook(() => useSubscriptionGuard());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.canAccess).toBe(true);
    expect(result.current.blockReason).toBeUndefined();
  });

  // 2. isLoading true while fetching
  it('returns isLoading: true while fetching subscription data', async () => {
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    // Make getSubscriptionInfo hang so loading stays true
    let resolveSubscription!: (value: SubscriptionInfo) => void;
    mockGetSubscriptionInfo.mockReturnValue(
      new Promise<SubscriptionInfo>((resolve) => {
        resolveSubscription = resolve;
      })
    );

    const { result } = renderHook(() => useSubscriptionGuard());

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.canAccess).toBe(false);

    // Resolve the promise to let the hook finish
    await act(async () => {
      resolveSubscription(makeSubscriptionInfo());
    });
  });

  // 3. Active subscription => canAccess true
  it('returns canAccess: true for active subscription', async () => {
    const tenant = makeTenant({ status: 'active' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 300),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(true);
    expect(result.current.blockReason).toBeUndefined();
  });

  // 4. Expired subscription => correct blockReason
  it('returns blockReason "subscription_expired" for expired subscription', async () => {
    const tenant = makeTenant({ status: 'expired' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: false, reason: 'subscription_expired' })),
      getDaysRemaining: vi.fn(() => 0),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(false);
    expect(result.current.blockReason).toBe('subscription_expired');
  });

  // 5. No active licence in Atlas Studio => block with no_licence
  it('blocks with reason "no_licence" when Atlas Studio has no active seat', async () => {
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    mockGetSubscriptionInfo.mockRejectedValue(new NoActiveLicenceError());

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(false);
    expect(result.current.blockReason).toBe('no_licence');
  });

  // 5b. Network / transient errors also block (no local fallback)
  it('blocks with reason "no_licence" on network errors (no local fallback)', async () => {
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    mockGetSubscriptionInfo.mockRejectedValue(new Error('Network error'));

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(false);
    expect(result.current.blockReason).toBe('no_licence');
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  // 6. isTrialEnding when trial < 5 days
  it('sets isTrialEnding to true when trial has less than 5 days remaining', async () => {
    const tenant = makeTenant({ status: 'trial', plan: 'business' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 3),
      shouldShowUpgradePrompt: vi.fn(() => true),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isTrialEnding).toBe(true);
    expect(result.current.daysRemaining).toBe(3);
  });

  // 7. isTrialEnding is false when trial has more than 5 days
  it('sets isTrialEnding to false when trial has more than 5 days remaining', async () => {
    const tenant = makeTenant({ status: 'trial', plan: 'business' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 10),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isTrialEnding).toBe(false);
  });

  // 8. isQuotaNearLimit when documents > 80%
  it('sets isQuotaNearLimit to true when document quota exceeds 80%', async () => {
    const tenant = makeTenant({
      status: 'active',
      plan: 'business',
      quotas: {
        maxUsers: 50,
        currentUsers: 5,
        maxDocuments: 15000,
        currentDocuments: 13000, // 86.7%
        maxWorkflows: 100,
        currentWorkflows: 2,
        maxStorage: 250,
        currentStorage: 1,
        maxSignaturesMonth: 1500,
        currentSignaturesMonth: 10,
        maxProjects: 100,
        currentProjects: 0,
      },
    });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 300),
      shouldShowUpgradePrompt: vi.fn(() => true),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isQuotaNearLimit).toBe(true);
  });

  // 9. isQuotaNearLimit when signatures > 80%
  it('sets isQuotaNearLimit to true when signature quota exceeds 80%', async () => {
    const tenant = makeTenant({
      status: 'active',
      plan: 'business',
      quotas: {
        maxUsers: 50,
        currentUsers: 5,
        maxDocuments: 15000,
        currentDocuments: 100,
        maxWorkflows: 100,
        currentWorkflows: 2,
        maxStorage: 250,
        currentStorage: 1,
        maxSignaturesMonth: 1500,
        currentSignaturesMonth: 1300, // 86.7%
        maxProjects: 100,
        currentProjects: 0,
      },
    });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 300),
      shouldShowUpgradePrompt: vi.fn(() => true),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isQuotaNearLimit).toBe(true);
  });

  // 10. isQuotaNearLimit false when all quotas under 80%
  it('sets isQuotaNearLimit to false when all quotas are under 80%', async () => {
    const tenant = makeTenant({
      status: 'active',
      plan: 'business',
    });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 300),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isQuotaNearLimit).toBe(false);
  });

  // 11. refreshSubscription triggers refetch
  it('refreshSubscription clears cache and re-fetches subscription', async () => {
    const tenant = makeTenant();
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 300),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the call counts from initial load
    mockClearCache.mockClear();
    mockGetSubscriptionInfo.mockClear();

    await act(async () => {
      await result.current.refreshSubscription();
    });

    expect(mockClearCache).toHaveBeenCalledTimes(1);
    expect(mockGetSubscriptionInfo).toHaveBeenCalledWith(true);
  });

  // 12. Suspended subscription returns correct blockReason
  it('returns blockReason "suspended" for suspended subscription', async () => {
    const tenant = makeTenant({ status: 'suspended' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: false, reason: 'suspended' })),
      getDaysRemaining: vi.fn(() => 0),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(false);
    expect(result.current.blockReason).toBe('suspended');
  });

  // 13. subscribeToUpdates is called on mount for authenticated users
  it('subscribes to real-time updates when authenticated', async () => {
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(mockSubscribeToUpdates).toHaveBeenCalledTimes(1);
    });

    expect(mockSubscribeToUpdates).toHaveBeenCalledWith(expect.any(Function));
  });

  // 14. Unsubscribes on unmount
  it('unsubscribes from real-time updates on unmount', async () => {
    const mockUnsubscribe = vi.fn();
    mockSubscribeToUpdates.mockReturnValue(mockUnsubscribe);

    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { unmount } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(mockSubscribeToUpdates).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  // 15. isQuotaNearLimit is false for enterprise plan (no quota limits apply)
  it('returns isQuotaNearLimit false for enterprise plan regardless of usage', async () => {
    const tenant = makeTenant({
      status: 'active',
      plan: 'enterprise',
      quotas: {
        maxUsers: -1,
        currentUsers: 500,
        maxDocuments: -1,
        currentDocuments: 100000,
        maxWorkflows: -1,
        currentWorkflows: 200,
        maxStorage: -1,
        currentStorage: 500,
        maxSignaturesMonth: -1,
        currentSignaturesMonth: 10000,
        maxProjects: -1,
        currentProjects: 500,
      },
    });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 300),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // The hook checks plan !== 'business' => returns false
    expect(result.current.isQuotaNearLimit).toBe(false);
  });

  // 16. shouldShowUpgradePrompt is forwarded from tenantStore
  it('returns shouldShowUpgradePrompt from the tenant store', async () => {
    const tenant = makeTenant({ status: 'trial' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 2),
      shouldShowUpgradePrompt: vi.fn(() => true),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowUpgradePrompt).toBe(true);
  });

  // 17. Does not call API when not authenticated
  it('does not fetch subscription info when not authenticated', async () => {
    authStoreState = { user: null, isAuthenticated: false };

    renderHook(() => useSubscriptionGuard());

    // Give it a tick to potentially call
    await waitFor(() => {
      expect(mockGetSubscriptionInfo).not.toHaveBeenCalled();
    });
  });

  // 18. Cancelled subscription block reason
  it('returns blockReason "cancelled" for cancelled subscription', async () => {
    const tenant = makeTenant({ status: 'cancelled' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: false, reason: 'cancelled' })),
      getDaysRemaining: vi.fn(() => 0),
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(false);
    expect(result.current.blockReason).toBe('cancelled');
  });

  // 19. isTrialEnding false when status is not trial
  it('sets isTrialEnding to false when status is active (not trial)', async () => {
    const tenant = makeTenant({ status: 'active' });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 3), // Few days but NOT trial status
      shouldShowUpgradePrompt: vi.fn(() => false),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Status is active, not trial, so isTrialEnding should be false
    expect(result.current.isTrialEnding).toBe(false);
  });

  // 20. isQuotaNearLimit true when users > 80%
  it('sets isQuotaNearLimit to true when user quota exceeds 80%', async () => {
    const tenant = makeTenant({
      status: 'active',
      plan: 'business',
      quotas: {
        maxUsers: 50,
        currentUsers: 45, // 90%
        maxDocuments: 15000,
        currentDocuments: 100,
        maxWorkflows: 100,
        currentWorkflows: 2,
        maxStorage: 250,
        currentStorage: 1,
        maxSignaturesMonth: 1500,
        currentSignaturesMonth: 10,
        maxProjects: 100,
        currentProjects: 0,
      },
    });
    tenantState = { currentTenant: tenant };
    tenantStoreOverrides = {
      currentTenant: tenant,
      canAccessApp: vi.fn(() => ({ allowed: true })),
      getDaysRemaining: vi.fn(() => 300),
      shouldShowUpgradePrompt: vi.fn(() => true),
    };
    authStoreState = {
      user: { id: '1', organization: { id: 1, name: 'Org', slug: 'org' } },
      isAuthenticated: true,
    };

    const { result } = renderHook(() => useSubscriptionGuard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isQuotaNearLimit).toBe(true);
  });
});
