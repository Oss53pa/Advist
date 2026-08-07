import { createAtlasSupabaseClient } from './createAtlasSupabaseClient';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

// Nettoyage unique de l'ancienne clé `advist-auth` : elle était utilisée
// SIMULTANÉMENT par le client Supabase (session) et par zustand/persist
// (état UI). Les deux écrivaient des formes incompatibles sur la même
// entrée localStorage et s'écrasaient mutuellement, ce qui bloquait la
// page /login dans une boucle de redirection. Les deux utilisent désormais
// des clés distinctes ; on purge le résidu empoisonné au démarrage.
if (typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem('advist-auth');
  } catch {
    /* storage indisponible (mode privé, quota) — sans conséquence */
  }
}

export const supabase = createAtlasSupabaseClient<Database>({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  // Ne JAMAIS réutiliser cette clé pour un autre store (cf. bloc ci-dessus).
  storageKey: 'advist-supabase-auth',
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
