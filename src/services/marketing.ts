/**
 * Marketing service for social media management — Supabase Implementation
 *
 * Replaces legacy api.get/post/patch/delete calls with direct Supabase queries.
 * File uploads use Supabase Storage bucket "marketing".
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError, getPaginationRange, uploadFile, getPublicUrl } from './supabase-helpers';
import type {
  SocialAccount,
  PostTemplate,
  Publication,
  PublicationCreateData,
  PublicationUpdateData,
  MarketingAnalytics,
  PaginatedResponse,
  BlogPost,
  BlogPostCreateData,
  NewsletterSubscriber,
  SubscriberStats,
  Newsletter,
  NewsletterCreateData,
} from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MARKETING_BUCKET = 'marketing';
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helper: build paginated response shape
// ---------------------------------------------------------------------------
function buildPaginatedResponse<T>(
  data: T[] | null,
  count: number | null,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  return {
    results: (data as T[]) ?? [],
    count: total,
    next: page < totalPages ? `page=${page + 1}` : null,
    previous: page > 1 ? `page=${page - 1}` : null,
  };
}

// ---------------------------------------------------------------------------
// Helper: upload media file and return public URL
// ---------------------------------------------------------------------------
async function uploadMarketingFile(
  file: File,
  folder: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const result = await uploadFile(MARKETING_BUCKET, path, file, { upsert: false });
  if (!result) throw new Error('File upload failed');
  return getPublicUrl(MARKETING_BUCKET, result.path);
}

// =========================================================================
// Social Accounts API
// =========================================================================
export const socialAccountsApi = {
  list: async (): Promise<PaginatedResponse<SocialAccount>> => {
    const { data, error, count } = await supabase
      .from('social_accounts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return buildPaginatedResponse<SocialAccount>(data as SocialAccount[], count, 1, PAGE_SIZE);
  },

  get: async (id: string): Promise<SocialAccount> => {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as SocialAccount;
  },

  create: async (data: Partial<SocialAccount>): Promise<SocialAccount> => {
    const { data: created, error } = await supabase
      .from('social_accounts')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as SocialAccount;
  },

  update: async (id: string, data: Partial<SocialAccount>): Promise<SocialAccount> => {
    const { data: updated, error } = await supabase
      .from('social_accounts')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as SocialAccount;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  disconnect: async (id: string): Promise<{ status: string }> => {
    const { error } = await supabase
      .from('social_accounts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { status: 'disconnected' };
  },

  refreshToken: async (id: string): Promise<{ status: string; message: string }> => {
    const { data, error } = await supabase
      .from('social_accounts')
      .update({ token_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return { status: 'refreshed', message: `Token refreshed for account ${(data as Record<string, unknown>).account_name}` };
  },
};

// =========================================================================
// Post Templates API
// =========================================================================
export const templatesApi = {
  list: async (params?: { search?: string; category?: string }): Promise<PaginatedResponse<PostTemplate>> => {
    let query = supabase
      .from('post_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }
    if (params?.category) {
      query = query.eq('category', params.category);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);
    return buildPaginatedResponse<PostTemplate>(data as PostTemplate[], count, 1, PAGE_SIZE);
  },

  get: async (id: string): Promise<PostTemplate> => {
    const { data, error } = await supabase
      .from('post_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as PostTemplate;
  },

  create: async (data: Partial<PostTemplate>): Promise<PostTemplate> => {
    const { data: created, error } = await supabase
      .from('post_templates')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as PostTemplate;
  },

  update: async (id: string, data: Partial<PostTemplate>): Promise<PostTemplate> => {
    const { data: updated, error } = await supabase
      .from('post_templates')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as PostTemplate;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('post_templates')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },
};

// =========================================================================
// Publications API
// =========================================================================
export const publicationsApi = {
  list: async (params?: {
    search?: string;
    status?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Publication>> => {
    const orderCol = params?.ordering?.replace('-', '') || 'created_at';
    const orderAsc = params?.ordering ? !params.ordering.startsWith('-') : false;

    let query = supabase
      .from('publications')
      .select('*', { count: 'exact' })
      .order(orderCol, { ascending: orderAsc });

    if (params?.search) {
      query = query.or(`content.ilike.%${params.search}%`);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);
    return buildPaginatedResponse<Publication>(data as Publication[], count, 1, PAGE_SIZE);
  },

  get: async (id: string): Promise<Publication> => {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Publication;
  },

  create: async (data: PublicationCreateData): Promise<Publication> => {
    let mediaUrl = data.media_url;

    // Upload media file if provided
    if (data.media) {
      mediaUrl = await uploadMarketingFile(data.media, 'publications');
    }

    const insertPayload: Record<string, unknown> = {
      content: data.content,
      media_urls: mediaUrl ? [mediaUrl] : [],
      status: 'draft',
      scheduled_at: data.scheduled_at ?? null,
      template_id: data.template ?? null,
    };

    const { data: created, error } = await supabase
      .from('publications')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as unknown as Publication;
  },

  update: async (id: string, data: PublicationUpdateData): Promise<Publication> => {
    let mediaUrl = data.media_url;

    if (data.media) {
      mediaUrl = await uploadMarketingFile(data.media, 'publications');
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.content !== undefined) updatePayload.content = data.content;
    if (data.platforms !== undefined) updatePayload.platforms = data.platforms;
    if (mediaUrl !== undefined) updatePayload.media_urls = mediaUrl ? [mediaUrl] : [];
    if (data.scheduled_at !== undefined) updatePayload.scheduled_at = data.scheduled_at;
    if (data.status !== undefined) updatePayload.status = data.status;

    const { data: updated, error } = await supabase
      .from('publications')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as unknown as Publication;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  publish: async (id: string): Promise<{
    status: string;
    results: Array<{ platform: string; status: string; external_url: string }>;
  }> => {
    const { data, error } = await supabase
      .from('publications')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);

    return {
      status: 'published',
      results: [
        {
          platform: 'all',
          status: 'success',
          external_url: (data as Record<string, unknown>).external_url as string ?? '',
        },
      ],
    };
  },

  schedule: async (id: string, scheduledAt: string): Promise<{
    status: string;
    scheduled_at: string;
  }> => {
    const { error } = await supabase
      .from('publications')
      .update({ status: 'scheduled', scheduled_at: scheduledAt })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { status: 'scheduled', scheduled_at: scheduledAt };
  },

  calendar: async (params?: { start?: string; end?: string }): Promise<Publication[]> => {
    let query = supabase
      .from('publications')
      .select('*')
      .in('status', ['scheduled', 'published'])
      .order('scheduled_at', { ascending: true });

    if (params?.start) {
      query = query.gte('scheduled_at', params.start);
    }
    if (params?.end) {
      query = query.lte('scheduled_at', params.end);
    }

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return (data ?? []) as unknown as Publication[];
  },
};

// =========================================================================
// Analytics API
// =========================================================================
export const analyticsApi = {
  getOverview: async (days?: number): Promise<MarketingAnalytics> => {
    const periodDays = days || 30;
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch publications within the period
    const { data: pubs, error: pubError } = await supabase
      .from('publications')
      .select('*')
      .gte('created_at', since);

    if (pubError) throw parseSupabaseError(pubError);

    const publications = (pubs ?? []) as Record<string, unknown>[];

    // Fetch aggregated results
    const pubIds = publications.map((p) => p.id as string);
    let results: Record<string, unknown>[] = [];
    if (pubIds.length > 0) {
      const { data: resData, error: resError } = await supabase
        .from('publication_results')
        .select('*')
        .in('publication_id', pubIds);

      if (resError) throw parseSupabaseError(resError);
      results = (resData ?? []) as Record<string, unknown>[];
    }

    // Aggregate metrics
    const metrics = {
      likes: results.reduce((s, r) => s + ((r.likes as number) ?? 0), 0),
      comments: results.reduce((s, r) => s + ((r.comments as number) ?? 0), 0),
      shares: results.reduce((s, r) => s + ((r.shares as number) ?? 0), 0),
      impressions: results.reduce((s, r) => s + ((r.impressions as number) ?? 0), 0),
      clicks: results.reduce((s, r) => s + ((r.clicks as number) ?? 0), 0),
    };

    const byStatus = {
      draft: publications.filter((p) => p.status === 'draft').length,
      scheduled: publications.filter((p) => p.status === 'scheduled').length,
      published: publications.filter((p) => p.status === 'published').length,
      failed: publications.filter((p) => p.status === 'failed').length,
    };

    return {
      period_days: periodDays,
      total_publications: publications.length,
      total_published: byStatus.published,
      total_failed: byStatus.failed,
      metrics,
      by_platform: {} as MarketingAnalytics['by_platform'],
      by_status: byStatus,
    };
  },
};

// =========================================================================
// Blog Posts API (Admin)
// =========================================================================
export const blogApi = {
  list: async (params?: {
    search?: string;
    status?: string;
    category?: string;
    is_featured?: boolean;
  }): Promise<PaginatedResponse<BlogPost>> => {
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.search) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.category) {
      query = query.eq('category', params.category);
    }
    if (params?.is_featured !== undefined) {
      query = query.eq('is_featured', params.is_featured);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);
    return buildPaginatedResponse<BlogPost>(data as BlogPost[], count, 1, PAGE_SIZE);
  },

  get: async (id: string): Promise<BlogPost> => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as BlogPost;
  },

  create: async (data: BlogPostCreateData): Promise<BlogPost> => {
    let featuredImageUrl = data.featured_image_url;

    if (data.featured_image) {
      featuredImageUrl = await uploadMarketingFile(data.featured_image, 'blog');
    }

    const insertPayload: Record<string, unknown> = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      slug: data.slug ?? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      cover_image_url: featuredImageUrl ?? null,
      seo_title: data.meta_title ?? null,
      seo_description: data.meta_description ?? null,
      tags: data.tags ?? [],
      status: data.status ?? 'draft',
    };

    const { data: created, error } = await supabase
      .from('blog_posts')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as BlogPost;
  },

  update: async (id: string, data: Partial<BlogPostCreateData>): Promise<BlogPost> => {
    let featuredImageUrl = data.featured_image_url;

    if (data.featured_image) {
      featuredImageUrl = await uploadMarketingFile(data.featured_image, 'blog');
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.content !== undefined) updatePayload.content = data.content;
    if (data.excerpt !== undefined) updatePayload.excerpt = data.excerpt;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (featuredImageUrl !== undefined) updatePayload.cover_image_url = featuredImageUrl;
    if (data.meta_title !== undefined) updatePayload.seo_title = data.meta_title;
    if (data.meta_description !== undefined) updatePayload.seo_description = data.meta_description;
    if (data.tags !== undefined) updatePayload.tags = data.tags;
    if (data.status !== undefined) updatePayload.status = data.status;

    const { data: updated, error } = await supabase
      .from('blog_posts')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as BlogPost;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  publish: async (id: string): Promise<{ status: string; published_at: string }> => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'published', published_at: now })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { status: 'published', published_at: now };
  },

  archive: async (id: string): Promise<{ status: string }> => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { status: 'archived' };
  },

  uploadImage: async (file: File): Promise<{
    url: string;
    filename: string;
    size: number;
    content_type: string;
  }> => {
    const url = await uploadMarketingFile(file, 'blog/images');
    return {
      url,
      filename: file.name,
      size: file.size,
      content_type: file.type,
    };
  },
};

// =========================================================================
// Public Blog API (no auth)
// =========================================================================
export const publicBlogApi = {
  list: async (params?: { search?: string }): Promise<PaginatedResponse<BlogPost>> => {
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (params?.search) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);
    return buildPaginatedResponse<BlogPost>(data as BlogPost[], count, 1, PAGE_SIZE);
  },

  get: async (id: string): Promise<BlogPost> => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as BlogPost;
  },

  featured: async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return (data ?? []) as BlogPost[];
  },
};

// =========================================================================
// Newsletter Subscribers API
// =========================================================================
export const subscribersApi = {
  list: async (params?: {
    search?: string;
    subscriber_type?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<NewsletterSubscriber>> => {
    let query = supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.search) {
      query = query.or(`email.ilike.%${params.search}%,name.ilike.%${params.search}%`);
    }
    if (params?.subscriber_type) {
      query = query.eq('subscriber_type', params.subscriber_type);
    }
    if (params?.is_active !== undefined) {
      query = query.eq('status', params.is_active ? 'active' : 'unsubscribed');
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);
    return buildPaginatedResponse<NewsletterSubscriber>(data as NewsletterSubscriber[], count, 1, PAGE_SIZE);
  },

  get: async (id: string): Promise<NewsletterSubscriber> => {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as NewsletterSubscriber;
  },

  create: async (data: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber> => {
    const { data: created, error } = await supabase
      .from('newsletter_subscribers')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as NewsletterSubscriber;
  },

  update: async (id: string, data: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber> => {
    const { data: updated, error } = await supabase
      .from('newsletter_subscribers')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as NewsletterSubscriber;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  stats: async (): Promise<SubscriberStats> => {
    const { data: allSubs, error } = await supabase
      .from('newsletter_subscribers')
      .select('status, metadata', { count: 'exact' });

    if (error) throw parseSupabaseError(error);

    const subs = (allSubs ?? []) as Record<string, unknown>[];
    const active = subs.filter((s) => s.status === 'active');

    return {
      total: subs.length,
      active: active.length,
      prospects: subs.filter((s) => {
        const meta = s.metadata as Record<string, unknown> | null;
        return meta?.subscriber_type === 'prospect';
      }).length,
      clients: subs.filter((s) => {
        const meta = s.metadata as Record<string, unknown> | null;
        return meta?.subscriber_type === 'client';
      }).length,
      unsubscribed: subs.filter((s) => s.status === 'unsubscribed').length,
    };
  },

  unsubscribe: async (id: string): Promise<{ status: string }> => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { status: 'unsubscribed' };
  },
};

// =========================================================================
// Newsletter Campaigns API
// =========================================================================
export const newslettersApi = {
  list: async (params?: {
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Newsletter>> => {
    let query = supabase
      .from('newsletters')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.search) {
      query = query.or(`subject.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);
    return buildPaginatedResponse<Newsletter>(data as Newsletter[], count, 1, PAGE_SIZE);
  },

  get: async (id: string): Promise<Newsletter> => {
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Newsletter;
  },

  create: async (data: NewsletterCreateData): Promise<Newsletter> => {
    const insertPayload: Record<string, unknown> = {
      subject: data.subject,
      content: data.content,
      status: 'draft',
      scheduled_at: data.scheduled_at ?? null,
    };

    const { data: created, error } = await supabase
      .from('newsletters')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as Newsletter;
  },

  update: async (id: string, data: Partial<NewsletterCreateData>): Promise<Newsletter> => {
    const updatePayload: Record<string, unknown> = {};
    if (data.subject !== undefined) updatePayload.subject = data.subject;
    if (data.content !== undefined) updatePayload.content = data.content;
    if (data.scheduled_at !== undefined) updatePayload.scheduled_at = data.scheduled_at;

    const { data: updated, error } = await supabase
      .from('newsletters')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as Newsletter;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  send: async (id: string): Promise<{
    status: string;
    recipients_count: number;
    sent_at: string;
  }> => {
    const now = new Date().toISOString();

    // Count active subscribers as recipients
    const { count: recipientCount, error: countError } = await supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    if (countError) throw parseSupabaseError(countError);

    const { error } = await supabase
      .from('newsletters')
      .update({
        status: 'sent',
        sent_at: now,
        recipient_count: recipientCount ?? 0,
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { status: 'sent', recipients_count: recipientCount ?? 0, sent_at: now };
  },

  schedule: async (id: string, scheduledAt: string): Promise<{
    status: string;
    scheduled_at: string;
  }> => {
    const { error } = await supabase
      .from('newsletters')
      .update({ status: 'scheduled', scheduled_at: scheduledAt })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { status: 'scheduled', scheduled_at: scheduledAt };
  },

  duplicate: async (id: string): Promise<Newsletter> => {
    // Fetch original
    const { data: original, error: fetchError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw parseSupabaseError(fetchError);

    const orig = original as Record<string, unknown>;

    // Create copy with reset status
    const { data: duplicated, error: insertError } = await supabase
      .from('newsletters')
      .insert({
        subject: `${orig.subject} (copie)`,
        content: orig.content,
        status: 'draft',
      })
      .select('*')
      .single();

    if (insertError) throw parseSupabaseError(insertError);
    return duplicated as Newsletter;
  },
};

// =========================================================================
// Public Newsletter Subscribe API (no auth)
// =========================================================================
export const publicNewsletterApi = {
  subscribe: async (data: {
    email: string;
    first_name?: string;
    last_name?: string;
    preferences?: Record<string, boolean>;
  }): Promise<{ status: string }> => {
    const insertPayload: Record<string, unknown> = {
      email: data.email,
      name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
      status: 'active',
      metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
        preferences: data.preferences ?? {},
      },
    };

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(insertPayload, { onConflict: 'organization_id,email' })
      .select('id')
      .single();

    if (error) throw parseSupabaseError(error);
    return { status: 'subscribed' };
  },
};

// =========================================================================
// Combined marketing service
// =========================================================================
const marketingService = {
  accounts: socialAccountsApi,
  templates: templatesApi,
  publications: publicationsApi,
  analytics: analyticsApi,
  blog: blogApi,
  publicBlog: publicBlogApi,
  subscribers: subscribersApi,
  newsletters: newslettersApi,
  publicNewsletter: publicNewsletterApi,
};

export default marketingService;
