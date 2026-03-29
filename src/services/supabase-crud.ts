/**
 * Generic Supabase CRUD service builder.
 *
 * Provides a type-safe, reusable CRUD layer over Supabase tables.
 * Replaces all legacy `api.get/post/patch/delete` calls.
 *
 * Usage:
 * ```ts
 * const ticketsApi = createCrudService<SupportTicket>('support_tickets');
 * const tickets = await ticketsApi.list({ search: 'bug', status: 'open' });
 * const ticket = await ticketsApi.getById('uuid');
 * const newTicket = await ticketsApi.create({ title: 'Bug report' });
 * await ticketsApi.update('uuid', { status: 'closed' });
 * await ticketsApi.remove('uuid');
 * ```
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError, getPaginationRange } from './supabase-helpers';

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  searchColumns?: string[];
  filters?: Record<string, unknown>;
  orderBy?: string;
  orderAsc?: boolean;
  select?: string;
}

export interface CrudService<T> {
  list(options?: ListOptions): Promise<PaginatedResponse<T>>;
  getById(id: string, select?: string): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

/**
 * Create a CRUD service for a Supabase table.
 */
export function createCrudService<T extends Record<string, unknown>>(
  tableName: string,
  defaultSelect: string = '*',
  defaultPageSize: number = 20
): CrudService<T> {
  return {
    async list(options: ListOptions = {}): Promise<PaginatedResponse<T>> {
      const {
        page = 1,
        pageSize = defaultPageSize,
        search,
        searchColumns = ['name', 'title'],
        filters = {},
        orderBy = 'created_at',
        orderAsc = false,
        select = defaultSelect,
      } = options;

      const { from, to } = getPaginationRange(page, pageSize);

      let query = supabase
        .from(tableName)
        .select(select, { count: 'exact' })
        .range(from, to)
        .order(orderBy, { ascending: orderAsc });

      // Apply search filter (ilike on multiple columns)
      if (search) {
        const searchFilter = searchColumns
          .map((col) => `${col}.ilike.%${search}%`)
          .join(',');
        query = query.or(searchFilter);
      }

      // Apply equality filters
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }

      const { data, error, count } = await query;

      if (error) throw parseSupabaseError(error);

      const total = count ?? 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        results: (data as T[]) ?? [],
        count: total,
        next: page < totalPages ? `page=${page + 1}` : null,
        previous: page > 1 ? `page=${page - 1}` : null,
      };
    },

    async getById(id: string, select: string = defaultSelect): Promise<T> {
      const { data, error } = await supabase
        .from(tableName)
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw parseSupabaseError(error);
      return data as T;
    },

    async create(payload: Partial<T>): Promise<T> {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload as Record<string, unknown>)
        .select(defaultSelect)
        .single();

      if (error) throw parseSupabaseError(error);
      return data as T;
    },

    async update(id: string, payload: Partial<T>): Promise<T> {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload as Record<string, unknown>)
        .eq('id', id)
        .select(defaultSelect)
        .single();

      if (error) throw parseSupabaseError(error);
      return data as T;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw parseSupabaseError(error);
    },
  };
}

/**
 * Helper to invoke Supabase RPC (stored procedures) for action endpoints.
 */
export async function invokeRpc<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await supabase.rpc(functionName, params);
  if (error) throw parseSupabaseError(error);
  return data as T;
}

/**
 * Helper to get aggregated stats from a table.
 */
export async function getStats<T = Record<string, unknown>>(
  rpcName: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  return invokeRpc<T>(rpcName, params);
}
