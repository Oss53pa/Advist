/**
 * Deadlines & Calendar Service
 * Smart deadline management with automatic reminders
 * Migrated from legacy api stub to direct Supabase queries.
 */
import { supabase } from '../lib/supabase';
import { invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';

export interface Deadline {
  id: string;
  documentId: number;
  documentName: string;
  documentType?: string;
  type: 'expiration' | 'renewal' | 'payment' | 'review' | 'signature' | 'custom';
  date: string; // ISO date
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed' | 'cancelled';
  daysRemaining: number;
  reminders: ReminderConfig[];
  workflowId?: number;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  }[];
  createdBy: {
    id: number;
    name: string;
  };
  completedAt?: string;
  completedBy?: {
    id: number;
    name: string;
  };
  metadata?: Record<string, unknown>;
}

export interface ReminderConfig {
  id: string;
  daysBefore: number; // J-90, J-30, J-7, J-1
  channels: ('in_app' | 'email' | 'whatsapp' | 'sms')[];
  sent: boolean;
  sentAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  type: 'deadline' | 'workflow' | 'signature' | 'meeting' | 'reminder';
  color: string;
  documentId?: number;
  workflowId?: number;
  metadata?: Record<string, unknown>;
}

export interface DeadlineFilters {
  startDate?: string;
  endDate?: string;
  type?: Deadline['type'];
  status?: Deadline['status'];
  priority?: Deadline['priority'];
  assignedToMe?: boolean;
  documentId?: number;
}

export interface DeadlineStats {
  total: number;
  upcoming: number;
  dueSoon: number; // Within 7 days
  overdue: number;
  completedThisMonth: number;
  byType: Record<Deadline['type'], number>;
  byPriority: Record<Deadline['priority'], number>;
}

// Default reminder schedule
export const DEFAULT_REMINDERS: Omit<ReminderConfig, 'id' | 'sent'>[] = [
  { daysBefore: 90, channels: ['in_app', 'email'] },
  { daysBefore: 30, channels: ['in_app', 'email'] },
  { daysBefore: 7, channels: ['in_app', 'email', 'whatsapp'] },
  { daysBefore: 1, channels: ['in_app', 'email', 'whatsapp', 'sms'] },
];

// Priority colors for calendar
export const PRIORITY_COLORS: Record<Deadline['priority'], string> = {
  low: '#10B981', // Green
  medium: '#F59E0B', // Orange
  high: '#F59E0B', // Red
  critical: '#7C3AED', // Purple
};

// Type colors
export const TYPE_COLORS: Record<Deadline['type'], string> = {
  expiration: '#F59E0B',
  renewal: '#3B82F6',
  payment: '#10B981',
  review: '#F59E0B',
  signature: '#8B5CF6',
  custom: '#6B7280',
};

export const deadlinesService = {
  /**
   * Get all deadlines with optional filters
   */
  async list(filters?: DeadlineFilters): Promise<Deadline[]> {
    let query = supabase.from('deadlines').select('*').order('date', { ascending: true });

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.documentId) {
      query = query.eq('document_id', filters.documentId);
    }

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return (data as Deadline[]) ?? [];
  },

  /**
   * Get a single deadline
   */
  async get(id: string): Promise<Deadline> {
    const { data, error } = await supabase.from('deadlines').select('*').eq('id', id).single();

    if (error) throw parseSupabaseError(error);
    return data as Deadline;
  },

  /**
   * Create a new deadline
   */
  async create(
    data: Omit<Deadline, 'id' | 'daysRemaining' | 'status' | 'createdBy'>
  ): Promise<Deadline> {
    const { data: deadline, error } = await supabase
      .from('deadlines')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return deadline as Deadline;
  },

  /**
   * Update a deadline
   */
  async update(id: string, data: Partial<Deadline>): Promise<Deadline> {
    const { data: deadline, error } = await supabase
      .from('deadlines')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return deadline as Deadline;
  },

  /**
   * Delete a deadline
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('deadlines').delete().eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Mark deadline as completed
   */
  async complete(id: string): Promise<Deadline> {
    const { data, error } = await supabase
      .from('deadlines')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Deadline;
  },

  /**
   * Get deadline statistics
   */
  async getStats(): Promise<DeadlineStats> {
    const { data, error } = await supabase.rpc('get_deadline_stats');
    if (error) throw parseSupabaseError(error);
    return data as DeadlineStats;
  },

  /**
   * Get calendar events for date range
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start', startDate)
      .lte('start', endDate)
      .order('start', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return (data as CalendarEvent[]) ?? [];
  },

  /**
   * Get upcoming deadlines (next N days)
   */
  async getUpcoming(days: number = 30): Promise<Deadline[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.list({
      startDate: new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'upcoming',
    });
  },

  /**
   * Get overdue deadlines
   */
  async getOverdue(): Promise<Deadline[]> {
    return this.list({ status: 'overdue' });
  },

  /**
   * Configure reminders for a deadline
   */
  async configureReminders(
    deadlineId: string,
    reminders: Omit<ReminderConfig, 'id' | 'sent'>[]
  ): Promise<Deadline> {
    // Delete existing reminders and insert new ones
    const { error: deleteError } = await supabase
      .from('deadline_reminders')
      .delete()
      .eq('deadline_id', deadlineId);

    if (deleteError) throw parseSupabaseError(deleteError);

    const reminderRows = reminders.map((r) => ({
      deadline_id: deadlineId,
      days_before: r.daysBefore,
      channels: r.channels,
      sent: false,
    }));

    if (reminderRows.length > 0) {
      const { error: insertError } = await supabase.from('deadline_reminders').insert(reminderRows);

      if (insertError) throw parseSupabaseError(insertError);
    }

    // Return updated deadline
    return this.get(deadlineId);
  },

  /**
   * Send manual reminder for a deadline
   */
  async sendReminder(
    deadlineId: string,
    channels?: ('in_app' | 'email' | 'whatsapp' | 'sms')[]
  ): Promise<void> {
    await invokeEdgeFunction('deadline-cron', {
      action: 'send_reminder',
      deadline_id: deadlineId,
      channels,
    });
  },

  /**
   * Create deadline from document (auto-detect expiration)
   */
  async createFromDocument(
    documentId: number,
    type: Deadline['type'],
    date: string
  ): Promise<Deadline> {
    const { data, error } = await supabase
      .from('deadlines')
      .insert({
        document_id: documentId,
        type,
        date,
        reminders: DEFAULT_REMINDERS,
      })
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Deadline;
  },

  /**
   * Bulk create deadlines
   */
  async bulkCreate(
    deadlines: Array<Omit<Deadline, 'id' | 'daysRemaining' | 'status' | 'createdBy'>>
  ): Promise<Deadline[]> {
    const { data, error } = await supabase
      .from('deadlines')
      .insert(deadlines as Record<string, unknown>[])
      .select('*');

    if (error) throw parseSupabaseError(error);
    return (data as Deadline[]) ?? [];
  },

  /**
   * Get auto-generated tasks based on deadlines
   */
  async getGeneratedTasks(deadlineId: string): Promise<
    Array<{
      id: string;
      title: string;
      dueDate: string;
      status: 'pending' | 'completed';
      assignedTo?: { id: number; name: string };
    }>
  > {
    const { data, error } = await supabase.rpc('get_deadline_tasks', {
      p_deadline_id: deadlineId,
    });

    if (error) throw parseSupabaseError(error);
    return data as Array<{
      id: string;
      title: string;
      dueDate: string;
      status: 'pending' | 'completed';
      assignedTo?: { id: number; name: string };
    }>;
  },

  /**
   * Create workflow from deadline (e.g., renewal workflow)
   */
  async createWorkflowFromDeadline(
    deadlineId: string,
    workflowTemplateId: number
  ): Promise<{
    workflowId: number;
    message: string;
  }> {
    const { data, error } = await supabase.rpc('create_workflow_from_deadline', {
      p_deadline_id: deadlineId,
      p_template_id: workflowTemplateId,
    });

    if (error) throw parseSupabaseError(error);
    return data as { workflowId: number; message: string };
  },
};

/**
 * Calculate days remaining until deadline
 */
export function calculateDaysRemaining(date: string): number {
  const deadlineDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get status based on days remaining
 */
export function getDeadlineStatus(daysRemaining: number): Deadline['status'] {
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'due_soon';
  return 'upcoming';
}

/**
 * Get priority label in French
 */
export function getPriorityLabel(priority: Deadline['priority']): string {
  const labels: Record<Deadline['priority'], string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    critical: 'Critique',
  };
  return labels[priority];
}

/**
 * Get type label in French
 */
export function getTypeLabel(type: Deadline['type']): string {
  const labels: Record<Deadline['type'], string> = {
    expiration: 'Expiration',
    renewal: 'Renouvellement',
    payment: 'Paiement',
    review: 'Révision',
    signature: 'Signature',
    custom: 'Personnalisé',
  };
  return labels[type];
}

export default deadlinesService;
