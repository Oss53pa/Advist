/**
 * WhatsApp Business API Service — Supabase Implementation
 *
 * All WhatsApp API calls require server-side proxying (API keys, webhooks).
 * This service delegates to Supabase Edge Functions for actual message sending.
 * Configuration is stored in the organization's settings.
 */
import { supabase } from '../lib/supabase';
import type { WhatsAppTemplate, NotificationPreferences } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WhatsAppMessage {
  id?: string;
  to: string; // Phone number in E.164 format (+225XXXXXXXXX)
  type: 'text' | 'template' | 'document' | 'image';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  template?: {
    name: string;
    language: {
      code: string; // 'fr' | 'en'
    };
    components?: WhatsAppTemplateParameter[];
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
}

export interface WhatsAppTemplateParameter {
  type: 'header' | 'body' | 'button';
  parameters: Array<{
    type: 'text' | 'currency' | 'date_time' | 'document' | 'image';
    text?: string;
    currency?: { code: string; amount: number };
    date_time?: { fallback_value: string };
    document?: { link: string; filename: string };
    image?: { link: string };
  }>;
}

export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string; message_status: string }>;
}

export interface WhatsAppConfig {
  provider: 'meta' | 'twilio' | 'messagebird' | 'infobip';
  api_key?: string;
  phone_number_id?: string;
  business_account_id?: string;
  webhook_verify_token?: string;
  is_configured: boolean;
}

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

// Pre-defined message templates for ADVIST
export const ADVIST_TEMPLATES = {
  // Workflow notifications
  WORKFLOW_PENDING: 'advist_workflow_pending',
  WORKFLOW_APPROVED: 'advist_workflow_approved',
  WORKFLOW_REJECTED: 'advist_workflow_rejected',
  WORKFLOW_REMINDER: 'advist_workflow_reminder',

  // Document notifications
  DOCUMENT_SHARED: 'advist_document_shared',
  DOCUMENT_COMMENT: 'advist_document_comment',
  DOCUMENT_SIGNED: 'advist_document_signed',

  // Deadline notifications
  DEADLINE_REMINDER_90: 'advist_deadline_90days',
  DEADLINE_REMINDER_30: 'advist_deadline_30days',
  DEADLINE_REMINDER_7: 'advist_deadline_7days',
  DEADLINE_REMINDER_1: 'advist_deadline_1day',
  DEADLINE_EXPIRED: 'advist_deadline_expired',

  // Authentication
  OTP_VERIFICATION: 'advist_otp_code',
} as const;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const whatsappService = {
  /**
   * Get WhatsApp configuration status — Edge Function (Phase 5)
   */
  async getConfig(): Promise<WhatsAppConfig> {
    const { data, error } = await supabase.functions.invoke('whatsapp-config', {
      method: 'GET',
    });
    if (error) throw new Error(error.message);
    return data as WhatsAppConfig;
  },

  /**
   * Update WhatsApp configuration — Edge Function (Phase 5)
   */
  async updateConfig(config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const { data, error } = await supabase.functions.invoke('whatsapp-config', {
      body: config,
    });
    if (error) throw new Error(error.message);
    return data as WhatsAppConfig;
  },

  /**
   * Test WhatsApp connection — Edge Function (Phase 5)
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.functions.invoke('whatsapp-test');
    if (error) return { success: false, error: error.message };
    return data as { success: boolean; error?: string };
  },

  /**
   * Send a text message via WhatsApp — Edge Function (Phase 5)
   */
  async sendTextMessage(
    phoneNumber: string,
    message: string,
    previewUrl = false
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppMessage = {
      to: formatPhoneNumber(phoneNumber),
      type: 'text',
      text: {
        body: message,
        preview_url: previewUrl,
      },
    };
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: payload,
    });
    if (error) throw new Error(error.message);
    return data as WhatsAppMessageResponse;
  },

  /**
   * Send a template message via WhatsApp — Edge Function (Phase 5)
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    language: string = 'fr',
    parameters?: WhatsAppTemplateParameter[]
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppMessage = {
      to: formatPhoneNumber(phoneNumber),
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: parameters,
      },
    };
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: payload,
    });
    if (error) throw new Error(error.message);
    return data as WhatsAppMessageResponse;
  },

  /**
   * Send document via WhatsApp — Edge Function (Phase 5)
   */
  async sendDocument(
    phoneNumber: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<WhatsAppMessageResponse> {
    const payload: WhatsAppMessage = {
      to: formatPhoneNumber(phoneNumber),
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    };
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: payload,
    });
    if (error) throw new Error(error.message);
    return data as WhatsAppMessageResponse;
  },

  /**
   * Get available message templates — Edge Function (Phase 5)
   */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    const { data, error } = await supabase.functions.invoke('whatsapp-templates');
    if (error) throw new Error(error.message);
    return (data || []) as WhatsAppTemplate[];
  },

  /**
   * Send workflow notification via WhatsApp
   */
  async sendWorkflowNotification(
    phoneNumber: string,
    type: 'pending' | 'approved' | 'rejected' | 'reminder',
    params: {
      documentName: string;
      workflowName: string;
      requesterName?: string;
      validatorName?: string;
      comment?: string;
      actionUrl?: string;
    }
  ): Promise<WhatsAppMessageResponse> {
    const templateMap = {
      pending: ADVIST_TEMPLATES.WORKFLOW_PENDING,
      approved: ADVIST_TEMPLATES.WORKFLOW_APPROVED,
      rejected: ADVIST_TEMPLATES.WORKFLOW_REJECTED,
      reminder: ADVIST_TEMPLATES.WORKFLOW_REMINDER,
    };

    const parameters: WhatsAppTemplateParameter[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: params.documentName },
          { type: 'text', text: params.workflowName },
          { type: 'text', text: params.requesterName || 'Utilisateur' },
        ],
      },
    ];

    if (params.comment) {
      parameters[0].parameters.push({ type: 'text', text: params.comment });
    }

    return this.sendTemplateMessage(phoneNumber, templateMap[type], 'fr', parameters);
  },

  /**
   * Send deadline reminder via WhatsApp
   */
  async sendDeadlineReminder(
    phoneNumber: string,
    daysRemaining: number,
    params: {
      documentName: string;
      deadlineDate: string;
      documentType?: string;
      actionUrl?: string;
    }
  ): Promise<WhatsAppMessageResponse> {
    let templateName: string;

    if (daysRemaining <= 0) {
      templateName = ADVIST_TEMPLATES.DEADLINE_EXPIRED;
    } else if (daysRemaining <= 1) {
      templateName = ADVIST_TEMPLATES.DEADLINE_REMINDER_1;
    } else if (daysRemaining <= 7) {
      templateName = ADVIST_TEMPLATES.DEADLINE_REMINDER_7;
    } else if (daysRemaining <= 30) {
      templateName = ADVIST_TEMPLATES.DEADLINE_REMINDER_30;
    } else {
      templateName = ADVIST_TEMPLATES.DEADLINE_REMINDER_90;
    }

    const parameters: WhatsAppTemplateParameter[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: params.documentName },
          { type: 'text', text: params.deadlineDate },
          { type: 'text', text: String(daysRemaining) },
        ],
      },
    ];

    return this.sendTemplateMessage(phoneNumber, templateName, 'fr', parameters);
  },

  /**
   * Send OTP code via WhatsApp
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<WhatsAppMessageResponse> {
    const parameters: WhatsAppTemplateParameter[] = [
      {
        type: 'body',
        parameters: [{ type: 'text', text: otpCode }],
      },
    ];

    return this.sendTemplateMessage(
      phoneNumber,
      ADVIST_TEMPLATES.OTP_VERIFICATION,
      'fr',
      parameters
    );
  },

  /**
   * Verify phone number for WhatsApp — Edge Function (Phase 5)
   */
  async verifyPhoneNumber(phoneNumber: string): Promise<{ valid: boolean; formatted: string }> {
    const formatted = formatPhoneNumber(phoneNumber);
    const { data, error } = await supabase.functions.invoke('whatsapp-verify-number', {
      body: { phone_number: formatted },
    });
    if (error) return { valid: false, formatted };
    return data as { valid: boolean; formatted: string };
  },

  /**
   * Get user's WhatsApp notification preferences
   */
  async getPreferences(userId?: string): Promise<NotificationPreferences> {
    const uid = userId || (await requireAuth());

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', uid);

    if (error) throw new Error(error.message);

    // Build preferences from rows
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

    for (const row of data || []) {
      if (row.event_type === '_channel_whatsapp') prefs.whatsapp_enabled = row.is_enabled;
      if (row.event_type === '_channel_email') prefs.email_enabled = row.is_enabled;
      if (row.event_type === '_channel_push') prefs.push_enabled = row.is_enabled;
      if (row.event_type === '_channel_sms') prefs.sms_enabled = row.is_enabled;
    }

    return prefs;
  },

  /**
   * Update user's WhatsApp notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>,
    userId?: string
  ): Promise<NotificationPreferences> {
    const uid = userId || (await requireAuth());

    const rows: Array<{
      user_id: string;
      event_type: string;
      channel: string;
      is_enabled: boolean;
    }> = [];

    if (preferences.whatsapp_enabled !== undefined) {
      rows.push({
        user_id: uid,
        event_type: '_channel_whatsapp',
        channel: 'whatsapp',
        is_enabled: preferences.whatsapp_enabled,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(rows, { onConflict: 'user_id,event_type,channel' });

      if (error) throw new Error(error.message);
    }

    return this.getPreferences(uid);
  },

  /**
   * Get message delivery status — Edge Function (Phase 5)
   */
  async getMessageStatus(messageId: string): Promise<{
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('whatsapp-message-status', {
      body: { message_id: messageId },
    });
    if (error) throw new Error(error.message);
    return data as {
      id: string;
      status: 'sent' | 'delivered' | 'read' | 'failed';
      timestamp: string;
      error?: string;
    };
  },

  /**
   * Bulk send WhatsApp messages — Edge Function (Phase 5)
   */
  async sendBulk(
    recipients: Array<{ phoneNumber: string; params?: Record<string, string> }>,
    templateName: string,
    language: string = 'fr'
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{ phoneNumber: string; success: boolean; messageId?: string; error?: string }>;
  }> {
    const { data, error } = await supabase.functions.invoke('whatsapp-bulk-send', {
      body: {
        recipients: recipients.map((r) => ({
          ...r,
          phoneNumber: formatPhoneNumber(r.phoneNumber),
        })),
        template_name: templateName,
        language,
      },
    });
    if (error) throw new Error(error.message);
    return data as {
      successful: number;
      failed: number;
      results: Array<{ phoneNumber: string; success: boolean; messageId?: string; error?: string }>;
    };
  },
};

/**
 * Format phone number to E.164 format
 * Supports Côte d'Ivoire (+225) and other African countries
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If already has +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return `+${cleaned.slice(2)}`;
  }

  // Côte d'Ivoire numbers
  if (cleaned.startsWith('225')) {
    return `+${cleaned}`;
  }

  // If starts with 0, assume Côte d'Ivoire local format
  if (cleaned.startsWith('0')) {
    return `+225${cleaned.slice(1)}`;
  }

  // 10-digit number without country code, assume Côte d'Ivoire
  if (cleaned.length === 10) {
    return `+225${cleaned}`;
  }

  // Default: add + prefix
  return `+${cleaned}`;
}

export default whatsappService;
