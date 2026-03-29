import { supabase } from '../lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Standard error shape returned by Supabase helpers
 */
export interface SupabaseError {
  message: string
  code: string
  details?: string
}

/**
 * Parse a Supabase Postgrest error into a user-friendly format
 */
export function parseSupabaseError(error: PostgrestError): SupabaseError {
  const codeMap: Record<string, string> = {
    '23505': 'Un enregistrement avec ces informations existe déjà.',
    '23503': 'Impossible de supprimer : cet élément est référencé ailleurs.',
    '42501': 'Vous n\'avez pas les permissions nécessaires.',
    'PGRST301': 'Aucun résultat trouvé.',
    'PGRST116': 'Plusieurs résultats trouvés alors qu\'un seul était attendu.',
  }

  return {
    message: codeMap[error.code] || error.message,
    code: error.code,
    details: error.details,
  }
}

/**
 * Pagination helper for Supabase queries
 */
export function getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}

/**
 * Build a paginated query result shape
 */
export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Create a paginated result from Supabase response
 */
export function toPaginatedResult<T>(
  data: T[] | null,
  count: number | null,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = count ?? 0
  return {
    data: data ?? [],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Apply common filters to a Supabase query builder
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains' | 'overlaps'

export interface QueryFilter {
  column: string
  operator: FilterOperator
  value: unknown
}

/**
 * Apply an array of filters to a query
 */
export function applyFilters<T>(
  query: T,
  filters: QueryFilter[]
): T {
  let q = query as Record<string, CallableFunction>
  for (const filter of filters) {
    if (filter.value === undefined || filter.value === null) continue
    q = q[filter.operator](filter.column, filter.value)
  }
  return q as T
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error) {
    console.error('Download error:', error)
    return null
  }
  return data
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string }
): Promise<{ path: string } | null> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: options?.upsert ?? false,
    contentType: options?.contentType,
  })
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  return data
}

/**
 * Get a public or signed URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) {
    console.error('Signed URL error:', error)
    return null
  }
  return data.signedUrl
}
