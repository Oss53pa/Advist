/**
 * Support Service
 * Migrated from legacy api stub to direct Supabase queries.
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError, getPaginationRange } from './supabase-helpers';
import type { PaginatedResponse } from './supabase-crud';
import type {
  SupportTicket,
  SupportMessage,
  SupportTicketStats,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../types';

export interface SupportTicketFilters {
  search?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
  organization?: string;
  assigned_to?: string;
  ordering?: string;
  page?: number;
}

export interface CreateTicketData {
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority?: SupportTicketPriority;
  organization?: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  status?: SupportTicketStatus;
  assigned_to?: string;
}

const PAGE_SIZE = 20;

export const supportService = {
  // Tickets
  async list(filters?: SupportTicketFilters): Promise<PaginatedResponse<SupportTicket>> {
    const page = filters?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    // Determine ordering
    const orderCol = filters?.ordering?.replace(/^-/, '') ?? 'created_at';
    const ascending = filters?.ordering ? !filters.ordering.startsWith('-') : false;

    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order(orderCol, { ascending });

    // Apply filters
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.organization) {
      query = query.eq('organization', filters.organization);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return {
      results: (data as SupportTicket[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  async get(id: string): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as SupportTicket;
  },

  async create(data: CreateTicketData): Promise<SupportTicket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert(data)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return ticket as SupportTicket;
  },

  async update(id: string, data: UpdateTicketData): Promise<SupportTicket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return ticket as SupportTicket;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  // Stats (SuperAdmin only)
  async getStats(): Promise<SupportTicketStats> {
    const { data, error } = await supabase.rpc('get_support_ticket_stats');
    if (error) throw parseSupabaseError(error);
    return data as SupportTicketStats;
  },

  // Assign ticket (SuperAdmin only)
  async assign(id: string, assignedTo: string | null): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ assigned_to: assignedTo })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as SupportTicket;
  },

  // Change status (SuperAdmin only)
  async changeStatus(id: string, status: SupportTicketStatus): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as SupportTicket;
  },

  // Messages
  async getMessages(ticketId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return (data as SupportMessage[]) ?? [];
  },

  async addMessage(ticketId: string, content: string, isInternal = false): Promise<SupportMessage> {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        content,
        is_internal: isInternal,
      })
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as SupportMessage;
  },
};

export default supportService;
