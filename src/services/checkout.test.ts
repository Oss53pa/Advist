import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkoutService } from './checkout';
import type {
  PublicPlan,
  CheckoutInitiateData,
  CheckoutResponse,
  PaymentStatus,
  TotalBreakdown,
  MobileMoneyProvidersByCountry,
} from './checkout';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), functions: { invoke: vi.fn() } },
  invokeEdgeFunction: vi.fn(),
}));

vi.mock('./supabase-helpers', () => ({
  parseSupabaseError: vi.fn((err: { message: string; code: string }) => ({
    message: err.message,
    code: err.code,
  })),
}));

import { supabase, invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';

// ---------------------------------------------------------------------------
// Helpers to build the Supabase query-builder chain
// ---------------------------------------------------------------------------

function mockQueryChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
  };
  // Make every method return the chain so calls can be chained freely
  for (const fn of Object.values(chain)) {
    fn.mockReturnValue(chain);
  }
  // Terminal methods resolve with the result
  chain.order.mockResolvedValue(result);
  chain.single.mockResolvedValue(result);

  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getPublicPlans
  // -----------------------------------------------------------------------

  describe('getPublicPlans', () => {
    const fakePlans: Partial<PublicPlan>[] = [
      { id: '1', code: 'starter', name: 'Starter', price: 5000 },
      { id: '2', code: 'pro', name: 'Pro', price: 15000 },
    ];

    it('returns active plans ordered by price', async () => {
      const chain = mockQueryChain({ data: fakePlans, error: null });

      const result = await checkoutService.getPublicPlans();

      expect(supabase.from).toHaveBeenCalledWith('billing_plans');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(chain.order).toHaveBeenCalledWith('price', { ascending: true });
      expect(result).toEqual(fakePlans);
    });

    it('returns an empty array when data is null', async () => {
      mockQueryChain({ data: null, error: null });

      const result = await checkoutService.getPublicPlans();
      expect(result).toEqual([]);
    });

    it('throws a parsed error when Supabase returns an error', async () => {
      const pgError = { message: 'relation not found', code: '42P01' };
      mockQueryChain({ data: null, error: pgError });

      await expect(checkoutService.getPublicPlans()).rejects.toEqual({
        message: 'relation not found',
        code: '42P01',
      });
      expect(parseSupabaseError).toHaveBeenCalledWith(pgError);
    });
  });

  // -----------------------------------------------------------------------
  // getMobileMoneyProviders
  // -----------------------------------------------------------------------

  describe('getMobileMoneyProviders', () => {
    const fakeProviders: MobileMoneyProvidersByCountry = {
      CI: [{ code: 'orange_ci', name: 'Orange Money', logo: 'orange.png' }],
    };

    it('calls invokeEdgeFunction with the country', async () => {
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProviders);

      const result = await checkoutService.getMobileMoneyProviders('CI');

      expect(invokeEdgeFunction).toHaveBeenCalledWith('get-mobile-money-providers', {
        country: 'CI',
      });
      expect(result).toEqual(fakeProviders);
    });

    it('passes null when no country is provided', async () => {
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProviders);

      await checkoutService.getMobileMoneyProviders();

      expect(invokeEdgeFunction).toHaveBeenCalledWith('get-mobile-money-providers', {
        country: null,
      });
    });

    it('propagates errors from the edge function', async () => {
      const err = new Error('Edge function failed');
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockRejectedValue(err);

      await expect(checkoutService.getMobileMoneyProviders('SN')).rejects.toThrow(
        'Edge function failed',
      );
    });
  });

  // -----------------------------------------------------------------------
  // calculateTotal
  // -----------------------------------------------------------------------

  describe('calculateTotal', () => {
    const fakeBreakdown: TotalBreakdown = {
      plan_code: 'pro',
      plan_name: 'Pro',
      subtotal: 15000,
      tax_rate: 18,
      tax_amount: 2700,
      total: 17700,
      currency: 'XOF',
    };

    it('calls the edge function with plan_code and billing_cycle', async () => {
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockResolvedValue(fakeBreakdown);

      const result = await checkoutService.calculateTotal('pro', 'yearly');

      expect(invokeEdgeFunction).toHaveBeenCalledWith('calculate-checkout-total', {
        plan_code: 'pro',
        billing_cycle: 'yearly',
      });
      expect(result).toEqual(fakeBreakdown);
    });

    it('defaults billing_cycle to monthly when omitted', async () => {
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockResolvedValue(fakeBreakdown);

      await checkoutService.calculateTotal('pro');

      expect(invokeEdgeFunction).toHaveBeenCalledWith('calculate-checkout-total', {
        plan_code: 'pro',
        billing_cycle: 'monthly',
      });
    });

    it('propagates errors from the edge function', async () => {
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));

      await expect(checkoutService.calculateTotal('pro')).rejects.toThrow('timeout');
    });
  });

  // -----------------------------------------------------------------------
  // initiateCheckout
  // -----------------------------------------------------------------------

  describe('initiateCheckout', () => {
    const checkoutData: CheckoutInitiateData = {
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean@example.com',
      password: 'secret123',
      organization_name: 'ACME',
      plan_code: 'pro',
      payment_method: 'mobile_money',
      phone_number: '+22507000000',
      mobile_provider: 'orange_ci',
    };

    const fakeResponse: CheckoutResponse = {
      checkout_token: 'tok_123',
      status: 'pending',
      amount: 17700,
      currency: 'XOF',
      gateway: 'cinetpay',
    };

    it('delegates to the create-checkout edge function', async () => {
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockResolvedValue(fakeResponse);

      const result = await checkoutService.initiateCheckout(checkoutData);

      expect(invokeEdgeFunction).toHaveBeenCalledWith('create-checkout', checkoutData);
      expect(result).toEqual(fakeResponse);
    });

    it('propagates errors from the edge function', async () => {
      (invokeEdgeFunction as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('email already exists'),
      );

      await expect(checkoutService.initiateCheckout(checkoutData)).rejects.toThrow(
        'email already exists',
      );
    });
  });

  // -----------------------------------------------------------------------
  // getPaymentStatus
  // -----------------------------------------------------------------------

  describe('getPaymentStatus', () => {
    const fakeStatus: PaymentStatus = {
      status: 'completed',
      subscription_activated: true,
      plan_name: 'Pro',
      organization_name: 'ACME',
    };

    it('queries checkout_sessions by token and returns status', async () => {
      const chain = mockQueryChain({ data: fakeStatus, error: null });

      const result = await checkoutService.getPaymentStatus('tok_123');

      expect(supabase.from).toHaveBeenCalledWith('checkout_sessions');
      expect(chain.select).toHaveBeenCalledWith(
        'status, subscription_activated, redirect_url, plan_name, organization_name, error_message',
      );
      expect(chain.eq).toHaveBeenCalledWith('checkout_token', 'tok_123');
      expect(chain.single).toHaveBeenCalled();
      expect(result).toEqual(fakeStatus);
    });

    it('throws a parsed error when the session is not found', async () => {
      const pgError = { message: 'Row not found', code: 'PGRST116' };
      mockQueryChain({ data: null, error: pgError });

      await expect(checkoutService.getPaymentStatus('bad_token')).rejects.toEqual({
        message: 'Row not found',
        code: 'PGRST116',
      });
      expect(parseSupabaseError).toHaveBeenCalledWith(pgError);
    });
  });

  // -----------------------------------------------------------------------
  // calculateLocalTotal (synchronous helper)
  // -----------------------------------------------------------------------

  describe('calculateLocalTotal', () => {
    it('calculates subtotal, tax, and total with default 18% rate', () => {
      const result = checkoutService.calculateLocalTotal(10000);

      expect(result).toEqual({
        subtotal: 10000,
        taxAmount: 1800,
        total: 11800,
      });
    });

    it('uses a custom tax rate when provided', () => {
      const result = checkoutService.calculateLocalTotal(10000, 20);

      expect(result).toEqual({
        subtotal: 10000,
        taxAmount: 2000,
        total: 12000,
      });
    });

    it('rounds the tax amount to the nearest integer', () => {
      // 333 * 18 / 100 = 59.94 -> rounds to 60
      const result = checkoutService.calculateLocalTotal(333);

      expect(result.taxAmount).toBe(60);
      expect(result.total).toBe(393);
    });

    it('handles zero price', () => {
      const result = checkoutService.calculateLocalTotal(0);

      expect(result).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
    });
  });

  // -----------------------------------------------------------------------
  // formatAmount (synchronous helper)
  // -----------------------------------------------------------------------

  describe('formatAmount', () => {
    it('formats an amount in XOF by default', () => {
      const formatted = checkoutService.formatAmount(17700);
      // Intl output varies by runtime but should contain the number
      expect(formatted).toContain('17');
      expect(formatted).toContain('700');
    });

    it('respects a custom currency', () => {
      const formatted = checkoutService.formatAmount(1500, 'EUR');
      expect(formatted).toContain('1');
      expect(formatted).toContain('500');
    });
  });
});
