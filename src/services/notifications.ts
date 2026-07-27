/**
 * Notifications Service — Supabase Implementation
 *
 * Replaces Axios API calls with Supabase client queries.
 * Table: notifications, notification_preferences
 *
 * Multi-channel sending (email, WhatsApp, push) will be handled
 * via Edge Functions in Phase 5. This service manages local
 * notification records and preferences.
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError, getPaginationRange } from './supabase-helpers';
import type {
  Notification,
  NotificationPreferences,
  NotificationChannel,
  PaginatedResponse,
} from '../types';
import { whatsappService } from './whatsapp';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAuth(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return user.id;
}

async function getUserOrgId(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();
  if (!data?.organization_id) throw new Error('Organisation non trouvée');
  return data.organization_id;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapNotification(row: Record<string, any>): Notification {
  return {
    id: row.id,
    subject: row.title,
    body: row.message || '',
    channel: row.channel || 'in_app',
    status: row.is_read ? 'read' : 'delivered',
    action_url: row.link,
    related_document: row.data?.document_id,
    created_at: row.created_at,
    read_at: row.read_at,
    whatsapp_message_id: row.data?.whatsapp_message_id,
    phone_number: row.data?.phone_number,
  } as Notification;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendNotificationParams {
  userId: string;
  subject: string;
  body: string;
  channels: NotificationChannel[];
  actionUrl?: string;
  relatedDocumentId?: string;
  templateData?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const notificationsService = {
  async list(filters?: {
    status?: string;
    channel?: NotificationChannel;
    page?: number;
  }): Promise<PaginatedResponse<Notification>> {
    const userId = await requireAuth();
    const page = filters?.page || 1;
    const pageSize = 20;
    const { from, to } = getPaginationRange(page, pageSize);

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.status === 'read') {
      query = query.eq('is_read', true);
    } else if (filters?.status === 'unread') {
      query = query.eq('is_read', false);
    }

    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(parseSupabaseError(error).message);

    const total = count || 0;
    const results = (data || []).map(mapNotification);

    return {
      count: total,
      next: page * pageSize < total ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
      results,
    };
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async markAllAsRead(): Promise<void> {
    const userId = await requireAuth();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async getUnreadCount(): Promise<number> {
    const userId = await requireAuth();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (error) return 0;
    return count || 0;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  /**
   * Send notification through multiple channels.
   * In-app notifications are created directly in the DB.
   * External channels (email, WhatsApp, SMS, push) will be handled
   * by Edge Functions in Phase 5.
   */
  async send(params: SendNotificationParams): Promise<{
    success: boolean;
    results: Record<NotificationChannel, { sent: boolean; error?: string }>;
  }> {
    const senderId = await requireAuth();
    const orgId = await getUserOrgId(senderId);

    const results = {} as Record<NotificationChannel, { sent: boolean; error?: string }>;

    for (const channel of params.channels) {
      try {
        if (channel === 'in_app') {
          // Insert directly into notifications table
          const { error } = await supabase.from('notifications').insert({
            organization_id: orgId,
            recipient_id: params.userId,
            sender_id: senderId,
            type: 'info',
            channel: 'in_app',
            title: params.subject,
            message: params.body,
            link: params.actionUrl,
            data: {
              document_id: params.relatedDocumentId,
              template_data: params.templateData,
            },
          });

          if (error) throw error;
          results[channel] = { sent: true };
        } else {
          // External channels → Edge Function (Phase 5)
          const { error } = await supabase.functions.invoke('send-notification', {
            body: {
              channel,
              recipient_id: params.userId,
              subject: params.subject,
              body: params.body,
              action_url: params.actionUrl,
              template_data: params.templateData,
            },
          });

          if (error) throw error;
          results[channel] = { sent: true };
        }
      } catch (err: any) {
        results[channel] = { sent: false, error: err.message || 'Erreur inconnue' };
      }
    }

    const success = Object.values(results).some((r) => r.sent);
    return { success, results };
  },

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(parseSupabaseError(error).message);

    // Build preferences object from rows (each row = event_type + channel + is_enabled)
    return buildPreferencesFromRows(data || []);
  },

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const userId = await requireAuth();

    // Convert preferences object to upsert rows
    const rows = preferencesToRows(userId, preferences);

    if (rows.length > 0) {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(rows, { onConflict: 'user_id,event_type,channel' });

      if (error) throw new Error(parseSupabaseError(error).message);
    }

    // Return full preferences
    return this.getPreferences();
  },

  /**
   * Send workflow notification to user via preferred channels
   */
  async sendWorkflowNotification(
    userId: string,
    type: 'pending' | 'approved' | 'rejected' | 'reminder',
    data: {
      documentName: string;
      workflowName: string;
      requesterName?: string;
      comment?: string;
      actionUrl?: string;
    }
  ): Promise<void> {
    // Get user's channel preferences for workflow_updates
    const prefs = await this.getPreferences();
    const channels =
      prefs.workflow_updates?.length > 0
        ? prefs.workflow_updates
        : ['in_app' as NotificationChannel];

    const messages: Record<string, { subject: string; body: string }> = {
      pending: {
        subject: `Validation requise: ${data.documentName}`,
        body: `Le document "${data.documentName}" du workflow "${data.workflowName}" requiert votre validation.${data.requesterName ? ` Demandé par ${data.requesterName}.` : ''}`,
      },
      approved: {
        subject: `Document approuvé: ${data.documentName}`,
        body: `Le document "${data.documentName}" a été approuvé dans le workflow "${data.workflowName}".`,
      },
      rejected: {
        subject: `Document rejeté: ${data.documentName}`,
        body: `Le document "${data.documentName}" a été rejeté.${data.comment ? ` Motif: ${data.comment}` : ''}`,
      },
      reminder: {
        subject: `Rappel: Validation en attente`,
        body: `Le document "${data.documentName}" attend toujours votre validation.`,
      },
    };

    const message = messages[type];

    await this.send({
      userId,
      subject: message.subject,
      body: message.body,
      channels,
      actionUrl: data.actionUrl,
      templateData: data as unknown as Record<string, string>,
    });
  },

  /**
   * Send deadline reminder notification
   */
  async sendDeadlineReminder(
    userId: string,
    data: {
      documentName: string;
      deadlineDate: string;
      daysRemaining: number;
      documentType?: string;
      actionUrl?: string;
    }
  ): Promise<void> {
    const prefs = await this.getPreferences();
    const channels =
      prefs.deadline_reminders?.length > 0
        ? prefs.deadline_reminders
        : ['in_app' as NotificationChannel, 'email' as NotificationChannel];

    let urgency = '';
    if (data.daysRemaining <= 1) {
      urgency = 'URGENT: ';
    } else if (data.daysRemaining <= 7) {
      urgency = 'Attention: ';
    }

    await this.send({
      userId,
      subject: `${urgency}Échéance: ${data.documentName}`,
      body: `Le document "${data.documentName}" arrive à échéance le ${data.deadlineDate} (${data.daysRemaining} jour${data.daysRemaining > 1 ? 's' : ''} restant${data.daysRemaining > 1 ? 's' : ''}).`,
      channels,
      actionUrl: data.actionUrl,
      templateData: data as unknown as Record<string, string>,
    });
  },

  /**
   * Test notification channel — requires Edge Function (Phase 5)
   */
  async testChannel(channel: NotificationChannel): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.functions.invoke('test-notification-channel', {
      body: { channel },
    });
    if (error) return { success: false, error: error.message };
    return data as { success: boolean; error?: string };
  },

  // Re-export WhatsApp service for convenience
  whatsapp: whatsappService,
};

// ---------------------------------------------------------------------------
// Preference helpers
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  'workflow_updates',
  'document_comments',
  'signature_requests',
  'deadline_reminders',
  'system_alerts',
] as const;

const CHANNELS: NotificationChannel[] = ['in_app', 'email', 'push', 'whatsapp', 'sms'];

function buildPreferencesFromRows(rows: Record<string, any>[]): NotificationPreferences {
  const prefs: NotificationPreferences = {
    email_enabled: true,
    push_enabled: false,
    whatsapp_enabled: false,
    sms_enabled: false,
    workflow_updates: ['in_app'],
    document_comments: ['in_app'],
    signature_requests: ['in_app'],
    deadline_reminders: ['in_app', 'email'],
    system_alerts: ['in_app'],
    quiet_hours_enabled: false,
    timezone: 'Africa/Abidjan',
  };

  // Channel-level enables
  for (const row of rows) {
    if (row.event_type === '_channel_email') prefs.email_enabled = row.is_enabled;
    if (row.event_type === '_channel_push') prefs.push_enabled = row.is_enabled;
    if (row.event_type === '_channel_whatsapp') prefs.whatsapp_enabled = row.is_enabled;
    if (row.event_type === '_channel_sms') prefs.sms_enabled = row.is_enabled;
    if (row.event_type === '_quiet_hours') prefs.quiet_hours_enabled = row.is_enabled;
  }

  // Per-event-type channel lists
  for (const eventType of EVENT_TYPES) {
    const enabledChannels: NotificationChannel[] = [];
    for (const row of rows) {
      if (row.event_type === eventType && row.is_enabled) {
        enabledChannels.push(row.channel as NotificationChannel);
      }
    }
    if (enabledChannels.length > 0) {
      prefs[eventType] = enabledChannels;
    }
  }

  return prefs;
}

function preferencesToRows(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Array<{ user_id: string; event_type: string; channel: string; is_enabled: boolean }> {
  const rows: Array<{ user_id: string; event_type: string; channel: string; is_enabled: boolean }> =
    [];

  // Channel-level enables
  if (prefs.email_enabled !== undefined) {
    rows.push({
      user_id: userId,
      event_type: '_channel_email',
      channel: 'email',
      is_enabled: prefs.email_enabled,
    });
  }
  if (prefs.push_enabled !== undefined) {
    rows.push({
      user_id: userId,
      event_type: '_channel_push',
      channel: 'push',
      is_enabled: prefs.push_enabled,
    });
  }
  if (prefs.whatsapp_enabled !== undefined) {
    rows.push({
      user_id: userId,
      event_type: '_channel_whatsapp',
      channel: 'whatsapp',
      is_enabled: prefs.whatsapp_enabled,
    });
  }
  if (prefs.sms_enabled !== undefined) {
    rows.push({
      user_id: userId,
      event_type: '_channel_sms',
      channel: 'sms',
      is_enabled: prefs.sms_enabled,
    });
  }
  if (prefs.quiet_hours_enabled !== undefined) {
    rows.push({
      user_id: userId,
      event_type: '_quiet_hours',
      channel: 'in_app',
      is_enabled: prefs.quiet_hours_enabled,
    });
  }

  // Per-event-type channel lists
  for (const eventType of EVENT_TYPES) {
    const channels = prefs[eventType];
    if (channels) {
      for (const ch of CHANNELS) {
        rows.push({
          user_id: userId,
          event_type: eventType,
          channel: ch,
          is_enabled: channels.includes(ch),
        });
      }
    }
  }

  return rows;
}

export default notificationsService;
