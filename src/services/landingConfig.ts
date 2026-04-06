/**
 * Landing Page Configuration Service — Supabase Implementation
 *
 * Replaces legacy api.get/post/patch calls with direct Supabase queries.
 * Image uploads use Supabase Storage bucket "landing".
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError, uploadFile, getPublicUrl } from './supabase-helpers';

// Types
export interface LandingPageStat {
  value: string;
  label: string;
}

export interface LandingPageFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface LandingPageTestimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  rating?: number;
  enabled: boolean;
}

export interface TrustedCompany {
  name: string;
  logo_url: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface LandingPageConfig {
  id: string;
  // Hero
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_secondary_text: string;
  hero_background_image?: string;
  hero_background_image_url?: string;
  hero_show_stats: boolean;
  // Content sections
  stats: LandingPageStat[];
  features: LandingPageFeature[];
  testimonials: LandingPageTestimonial[];
  trusted_companies: TrustedCompany[];
  how_it_works_steps: HowItWorksStep[];
  // Footer
  footer_company_name: string;
  footer_description: string;
  footer_show_socials: boolean;
  footer_show_newsletter: boolean;
  // Social links
  social_facebook: string;
  social_twitter: string;
  social_linkedin: string;
  social_instagram: string;
  social_youtube: string;
  // Contact
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  // Colors
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
  // SEO
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_og_image?: string;
  seo_og_image_url?: string;
  // CTA
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
  // Section visibility
  show_trusted_companies: boolean;
  show_features: boolean;
  show_how_it_works: boolean;
  show_testimonials: boolean;
  show_pricing: boolean;
  show_blog: boolean;
  show_newsletter: boolean;
  show_cta: boolean;
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by_name?: string;
}

export interface LandingPageConfigHistory {
  id: string;
  changed_by_name: string;
  changed_by_email: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  timestamp: string;
}

export type SectionType =
  | 'hero'
  | 'stats'
  | 'features'
  | 'testimonials'
  | 'trusted_companies'
  | 'how_it_works'
  | 'footer'
  | 'social'
  | 'contact'
  | 'colors'
  | 'seo'
  | 'cta'
  | 'visibility';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LANDING_BUCKET = 'landing';
const TABLE = 'landing_config';
const HISTORY_TABLE = 'landing_config_history';

// ---------------------------------------------------------------------------
// Helper: get the single config row (landing_config is a single-row table)
// ---------------------------------------------------------------------------
async function fetchSingleConfig(): Promise<LandingPageConfig> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error) throw parseSupabaseError(error);
  return data as LandingPageConfig;
}

// ---------------------------------------------------------------------------
// Helper: upload an image to the landing bucket
// ---------------------------------------------------------------------------
async function uploadLandingImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const result = await uploadFile(LANDING_BUCKET, path, file, { upsert: false });
  if (!result) throw new Error('Landing image upload failed');
  return await getPublicUrl(LANDING_BUCKET, result.path);
}

// =========================================================================
// API Service (Super Admin)
// =========================================================================
export const landingConfigApi = {
  /**
   * Get the current landing page configuration (Super Admin only)
   */
  async getConfig(): Promise<LandingPageConfig> {
    return fetchSingleConfig();
  },

  /**
   * Update the entire landing page configuration
   */
  async updateConfig(config: Partial<LandingPageConfig>): Promise<LandingPageConfig> {
    // First get the current config to know its id
    const current = await fetchSingleConfig();

    const { data, error } = await supabase
      .from(TABLE)
      .update(config as Record<string, unknown>)
      .eq('id', current.id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as LandingPageConfig;
  },

  /**
   * Update a specific section of the landing page
   */
  async updateSection(
    section: SectionType,
    data: Record<string, unknown>,
  ): Promise<LandingPageConfig> {
    // Section fields map to top-level columns, so we just update the relevant keys
    const current = await fetchSingleConfig();

    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(data)
      .eq('id', current.id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as LandingPageConfig;
  },

  /**
   * Reset configuration to defaults
   */
  async resetConfig(): Promise<{ message: string; config: LandingPageConfig }> {
    const current = await fetchSingleConfig();

    const defaults: Record<string, unknown> = {
      hero_title: 'Bienvenue sur Advist',
      hero_subtitle: 'La plateforme de gestion tout-en-un',
      hero_cta_text: 'Commencer gratuitement',
      hero_cta_secondary_text: 'En savoir plus',
      hero_show_stats: true,
      stats: [],
      features: [],
      testimonials: [],
      trusted_companies: [],
      how_it_works_steps: [],
      footer_company_name: 'Advist',
      footer_description: '',
      footer_show_socials: true,
      footer_show_newsletter: true,
      social_facebook: '',
      social_twitter: '',
      social_linkedin: '',
      social_instagram: '',
      social_youtube: '',
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      color_primary: '#4F46E5',
      color_secondary: '#7C3AED',
      color_accent: '#F59E0B',
      color_background: '#FFFFFF',
      seo_title: 'Advist',
      seo_description: '',
      seo_keywords: '',
      cta_title: '',
      cta_subtitle: '',
      cta_button_text: 'Commencer',
      show_trusted_companies: true,
      show_features: true,
      show_how_it_works: true,
      show_testimonials: true,
      show_pricing: true,
      show_blog: true,
      show_newsletter: true,
      show_cta: true,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .update(defaults)
      .eq('id', current.id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return { message: 'Configuration réinitialisée', config: data as LandingPageConfig };
  },

  /**
   * Get configuration change history
   */
  async getHistory(): Promise<LandingPageConfigHistory[]> {
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as LandingPageConfigHistory[];
  },

  /**
   * Upload an image for the landing page
   */
  async uploadImage(
    type: 'hero_background' | 'seo_og',
    file: File,
  ): Promise<{ message: string; config: LandingPageConfig }> {
    const folder = type === 'hero_background' ? 'hero' : 'seo';
    const imageUrl = await uploadLandingImage(file, folder);

    // Determine the column to update based on type
    const updateField =
      type === 'hero_background' ? 'hero_background_image_url' : 'seo_og_image_url';

    const current = await fetchSingleConfig();

    const { data, error } = await supabase
      .from(TABLE)
      .update({ [updateField]: imageUrl })
      .eq('id', current.id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return { message: 'Image uploadée avec succès', config: data as LandingPageConfig };
  },
};

// =========================================================================
// Public API (no auth required)
// =========================================================================
export const publicLandingApi = {
  /**
   * Get the public landing page configuration
   */
  async getConfig(): Promise<LandingPageConfig> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as LandingPageConfig;
  },
};

export default landingConfigApi;
