import { createAtlasSupabaseClient } from './createAtlasSupabaseClient';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createAtlasSupabaseClient<Database>({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  storageKey: 'advist-auth',
});

/**
 * Invoke a Supabase Edge Function with auth headers.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });
  if (error) throw error;
  return data as T;
}
