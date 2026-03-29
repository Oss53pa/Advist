/**
 * Checkout Service
 * Service pour le processus de checkout public (inscription + paiement)
 */
import { supabase, invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';

// =========================================================================
// Types
// =========================================================================

export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  is_popular?: boolean;
}

export interface MobileMoneyProvider {
  code: string;
  name: string;
  logo: string;
}

export interface MobileMoneyProvidersByCountry {
  [countryCode: string]: MobileMoneyProvider[];
}

export interface CheckoutInitiateData {
  // Infos personnelles
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;

  // Infos organisation
  organization_name: string;
  organization_size?: string;
  industry?: string;
  country?: string;
  city?: string;

  // Plan
  plan_code: string;
  billing_cycle?: 'monthly' | 'quarterly' | 'yearly';

  // Paiement
  payment_method: 'card' | 'mobile_money';
  card_token?: string;
  phone_number?: string;
  mobile_provider?: string;
}

export interface CheckoutResponse {
  checkout_token: string;
  payment_url?: string;
  client_secret?: string;
  status: 'pending' | 'requires_action' | 'processing';
  amount: number;
  currency: string;
  gateway: string;
}

export interface PaymentStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  subscription_activated: boolean;
  redirect_url?: string;
  plan_name?: string;
  organization_name?: string;
  error_message?: string;
}

export interface TotalBreakdown {
  plan_code: string;
  plan_name: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
}

// =========================================================================
// Service
// =========================================================================

export const checkoutService = {
  /**
   * Récupérer la liste des plans disponibles (public)
   */
  async getPublicPlans(): Promise<PublicPlan[]> {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return (data as PublicPlan[]) ?? [];
  },

  /**
   * Récupérer les opérateurs Mobile Money par pays
   */
  async getMobileMoneyProviders(country?: string): Promise<MobileMoneyProvidersByCountry> {
    return invokeEdgeFunction<MobileMoneyProvidersByCountry>('get-mobile-money-providers', {
      country: country ?? null,
    });
  },

  /**
   * Calculer le total avec TVA
   */
  async calculateTotal(planCode: string, billingCycle?: string): Promise<TotalBreakdown> {
    return invokeEdgeFunction<TotalBreakdown>('calculate-checkout-total', {
      plan_code: planCode,
      billing_cycle: billingCycle || 'monthly',
    });
  },

  /**
   * Initier le checkout (création compte + paiement)
   */
  async initiateCheckout(data: CheckoutInitiateData): Promise<CheckoutResponse> {
    return invokeEdgeFunction<CheckoutResponse>('create-checkout', data as unknown as Record<string, unknown>);
  },

  /**
   * Vérifier le statut d'un paiement
   */
  async getPaymentStatus(checkoutToken: string): Promise<PaymentStatus> {
    const { data, error } = await supabase
      .from('checkout_sessions')
      .select('status, subscription_activated, redirect_url, plan_name, organization_name, error_message')
      .eq('checkout_token', checkoutToken)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as PaymentStatus;
  },

  /**
   * Calcul local du total avec TVA (pour affichage immédiat)
   */
  calculateLocalTotal(price: number, taxRate: number = 18): {
    subtotal: number;
    taxAmount: number;
    total: number;
  } {
    const subtotal = price;
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  },

  /**
   * Formater un montant en XOF
   */
  formatAmount(amount: number, currency: string = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
};

export default checkoutService;
