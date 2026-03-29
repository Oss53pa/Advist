/**
 * Generic Supabase query hook using TanStack React Query.
 * Replaces all axios-based API calls with direct Supabase queries.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '../lib/supabase'

type SupabaseQueryFn<T> = () => PostgrestFilterBuilder<any, any, T[]>

/**
 * Hook for SELECT queries via Supabase PostgREST.
 */
export function useSupabaseQuery<T>(
  key: string[],
  queryFn: SupabaseQueryFn<T>,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await queryFn()
      if (error) throw error
      return data as T[]
    },
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Hook for single-row SELECT queries.
 */
export function useSupabaseQuerySingle<T>(
  key: string[],
  tableName: string,
  select: string,
  filters: Record<string, unknown>,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = supabase.from(tableName).select(select)
      for (const [field, value] of Object.entries(filters)) {
        query = query.eq(field, value)
      }
      const { data, error } = await query.single()
      if (error) throw error
      return data as T
    },
    enabled: options?.enabled,
  })
}

/**
 * Hook for INSERT mutations.
 */
export function useSupabaseInsert<T extends Record<string, unknown>>(
  tableName: string,
  invalidateKeys?: string[][]
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: T) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })
}

/**
 * Hook for UPDATE mutations.
 */
export function useSupabaseUpdate<T extends Record<string, unknown>>(
  tableName: string,
  invalidateKeys?: string[][]
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<T> }) => {
      const { data, error } = await supabase
        .from(tableName)
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })
}

/**
 * Hook for DELETE mutations.
 */
export function useSupabaseDelete(
  tableName: string,
  invalidateKeys?: string[][]
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })
}
