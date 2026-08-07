import { createAtlasSupabaseClient } from './createAtlasSupabaseClient';
import { checkSupabaseEnv } from './env';
import type { Database } from './database.types';

// Ce module ne lève JAMAIS au chargement. Il l'a fait longtemps, et comme il
// est importé par tout l'arbre applicatif, l'exception interrompait
// l'évaluation du bundle : React ne montait jamais et l'application se rendait
// entièrement blanche, sans erreur exploitable — un déploiement mal configuré
// passait donc inaperçu.
//
// À la place, on expose le diagnostic : main.tsx le consulte AVANT de monter
// l'application et affiche un écran lisible. Ce contrat permet de conserver
// des imports statiques (donc le préchargement parallèle des chunks vendor)
// tout en éliminant la page blanche.
const check = checkSupabaseEnv(import.meta.env);

/** Liste vide si la configuration est exploitable. Voir main.tsx. */
export const supabaseConfigProblems: string[] = check.ok ? [] : check.problems;

// Valeurs de repli syntaxiquement valides : `createClient()` refuse une URL
// malformée en levant. Elles ne servent jamais — quand la config est cassée,
// l'application n'est pas montée du tout.
const supabaseUrl = check.ok ? check.env.url : 'https://unconfigured.invalid';
const supabaseAnonKey = check.ok ? check.env.anonKey : 'unconfigured';

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
