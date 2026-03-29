/**
 * Subscriptions Service — Supabase Implementation
 *
 * Tables: subscriptions, billing_plans, subscription_addons, addons
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError, getPaginationRange } from './supabase-helpers';

export interface Subscription {
  id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    name: string;
    price: number;
  };
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  gracePeriodEndsAt: string | null;
  failedPaymentCount: number;
  startedAt: string;
}

export interface SubscriptionFilters {
  status?: string;
  search?: string;
  page?: number;
}

export interface PaginatedSubscriptions {
  results: Subscription[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface SubscriptionAction {
  reason?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
}

export interface PlanChangePreview {
  currentPlan: Plan;
  newPlan: Plan;
  changeType: 'upgrade' | 'downgrade' | 'same';
  effectiveDate: string;
  prorata: {
    daysRemaining: number;
    totalDays: number;
    currentPlanCredit: number;
    newPlanCost: number;
    amountDue: number;
  };
  immediateChange: boolean;
}

export interface PlanChangeRequest {
  planId: string;
  applyImmediately?: boolean;
  reason?: string;
}

// =========================================================================
// Addon Types
// =========================================================================

export interface Addon {
  id: string;
  code: string;
  name: string;
  description: string;
  features: string[];
  pricing: Record<string, number>;
  currency: string;
  icon: string;
  is_active: boolean;
  available_plans?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionAddon {
  id: string;
  subscription: string;
  addon: string;
  addon_name: string;
  addon_code: string;
  addon_icon: string;
  addon_features: string[];
  addon_description: string;
  price: number;
  currency: string;
  status: 'active' | 'cancelled' | 'pending';
  status_display: string;
  activated_at: string;
  cancelled_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AvailableAddon {
  addon: Addon;
  price: number;
  is_active: boolean;
}

export interface AddonCreateRequest {
  code: string;
  name: string;
  description?: string;
  features?: string[];
  pricing: Record<string, number>;
  currency?: string;
  icon?: string;
  is_active?: boolean;
  available_plan_ids?: string[];
}

// =========================================================================
// Subscriptions Service (Super Admin)
// =========================================================================

const PAGE_SIZE = 20;

export const subscriptionsService = {
  async list(filters?: SubscriptionFilters): Promise<PaginatedSubscriptions> {
    const page = filters?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('subscriptions')
      .select('*, organizations(id, name, slug), billing_plans(name, price)', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`organizations.name.ilike.%${filters.search}%,organizations.slug.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return {
      results: (data ?? []) as unknown as Subscription[],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  async get(id: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, organizations(id, name, slug), billing_plans(name, price)')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Subscription;
  },

  async suspend(id: string, action?: SubscriptionAction): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        suspension_reason: action?.reason ?? null,
        suspended_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, organizations(id, name, slug), billing_plans(name, price)')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Subscription;
  },

  async reactivate(id: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        suspension_reason: null,
        suspended_at: null,
      })
      .eq('id', id)
      .select('*, organizations(id, name, slug), billing_plans(name, price)')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Subscription;
  },

  async cancel(id: string, action?: SubscriptionAction): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancellation_reason: action?.reason ?? null,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, organizations(id, name, slug), billing_plans(name, price)')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Subscription;
  },

  async renew(id: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        cancelled_at: null,
        cancellation_reason: null,
      })
      .eq('id', id)
      .select('*, organizations(id, name, slug), billing_plans(name, price)')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Subscription;
  },

  async changePlan(id: string, request: PlanChangeRequest): Promise<Subscription> {
    const { data, error } = await supabase.rpc('change_subscription_plan', {
      p_subscription_id: id,
      p_plan_id: request.planId,
      p_apply_immediately: request.applyImmediately ?? false,
      p_reason: request.reason ?? null,
    });

    if (error) throw parseSupabaseError(error);
    return data as unknown as Subscription;
  },

  async previewPlanChange(id: string, newPlanId: string): Promise<PlanChangePreview> {
    const { data, error } = await supabase.rpc('preview_plan_change', {
      p_subscription_id: id,
      p_new_plan_id: newPlanId,
    });

    if (error) throw parseSupabaseError(error);
    return data as unknown as PlanChangePreview;
  },

  async getAvailablePlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as unknown as Plan[];
  },

  async getStats(): Promise<{
    total: number;
    active: number;
    trial: number;
    pastDue: number;
    suspended: number;
    cancelled: number;
  }> {
    const { data, error } = await supabase.rpc('get_subscription_stats');
    if (error) throw parseSupabaseError(error);
    return data as {
      total: number;
      active: number;
      trial: number;
      pastDue: number;
      suspended: number;
      cancelled: number;
    };
  },

  // =========================================================================
  // Subscription Addon Methods
  // =========================================================================

  async getAvailableAddons(subscriptionId: string): Promise<AvailableAddon[]> {
    const { data, error } = await supabase.rpc('get_available_addons', {
      p_subscription_id: subscriptionId,
    });

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as unknown as AvailableAddon[];
  },

  async getActiveAddons(subscriptionId: string): Promise<SubscriptionAddon[]> {
    const { data, error } = await supabase
      .from('subscription_addons')
      .select('*, addons(*)')
      .eq('subscription_id', subscriptionId)
      .eq('status', 'active');

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as unknown as SubscriptionAddon[];
  },

  async addAddon(subscriptionId: string, addonId: string): Promise<SubscriptionAddon> {
    const { data, error } = await supabase
      .from('subscription_addons')
      .insert({
        subscription_id: subscriptionId,
        addon_id: addonId,
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .select('*, addons(*)')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as SubscriptionAddon;
  },

  async removeAddon(subscriptionId: string, addonId: string): Promise<SubscriptionAddon> {
    const { data, error } = await supabase
      .from('subscription_addons')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId)
      .eq('addon_id', addonId)
      .eq('status', 'active')
      .select('*, addons(*)')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as SubscriptionAddon;
  },
};

// =========================================================================
// Addon Service (Super Admin)
// =========================================================================

export const addonsService = {
  async list(): Promise<Addon[]> {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as unknown as Addon[];
  },

  async get(id: string): Promise<Addon> {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Addon;
  },

  async create(payload: AddonCreateRequest): Promise<Addon> {
    const { data, error } = await supabase
      .from('addons')
      .insert(payload as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Addon;
  },

  async update(id: string, payload: Partial<AddonCreateRequest>): Promise<Addon> {
    const { data, error } = await supabase
      .from('addons')
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Addon;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('addons')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  async getPublicAddons(): Promise<Addon[]> {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as unknown as Addon[];
  },

  async getAddonSubscriptions(addonId: string): Promise<SubscriptionAddon[]> {
    const { data, error } = await supabase
      .from('subscription_addons')
      .select('*, addons(*)')
      .eq('addon_id', addonId)
      .eq('status', 'active');

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as unknown as SubscriptionAddon[];
  },

  async getStatistics(): Promise<{
    total_addons: number;
    active_addons: number;
    by_addon: Array<{
      addon__name: string;
      addon__code: string;
      count: number;
      revenue: number;
    }>;
    total_active_subscriptions: number;
  }> {
    const { data, error } = await supabase.rpc('get_addon_statistics');
    if (error) throw parseSupabaseError(error);
    return data as {
      total_addons: number;
      active_addons: number;
      by_addon: Array<{
        addon__name: string;
        addon__code: string;
        count: number;
        revenue: number;
      }>;
      total_active_subscriptions: number;
    };
  },
};
