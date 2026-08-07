// ============================================================================
// Validation de la configuration Supabase — SANS effet de bord.
// ----------------------------------------------------------------------------
// Ce module ne lance jamais d'exception et n'importe rien : il peut donc être
// utilisé aussi bien depuis le navigateur (avant tout rendu) que depuis
// vite.config.ts (avant tout build), afin qu'une mauvaise configuration soit
// détectée AU BUILD plutôt que découverte en production sur un écran blanc.
// ============================================================================

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export type SupabaseEnvCheck = { ok: true; env: SupabaseEnv } | { ok: false; problems: string[] };

/** Source de variables d'environnement (import.meta.env, process.env, loadEnv…). */
export type EnvSource = Record<string, unknown>;

function readString(source: EnvSource, key: string): string {
  const raw = source?.[key];
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Détecte `VITE_SUPABASE_URL="https://..."` : les guillemets font partie de la valeur. */
function isQuoted(value: string): boolean {
  return /^["'].*["']$/.test(value);
}

/**
 * Vérifie que l'URL et la clé anon Supabase sont exploitables.
 *
 * Ne se contente pas de tester la présence : une valeur entourée de guillemets
 * (cas classique d'une injection shell vers `$GITHUB_ENV`) ou une URL non
 * http(s) est acceptée par le build mais rejetée par `createClient()` au
 * chargement du module — donc écran blanc en production.
 */
export function checkSupabaseEnv(source: EnvSource): SupabaseEnvCheck {
  const problems: string[] = [];

  const url = readString(source, 'VITE_SUPABASE_URL');
  const anonKey = readString(source, 'VITE_SUPABASE_ANON_KEY');

  if (!url) {
    problems.push('VITE_SUPABASE_URL est absente ou vide.');
  } else if (isQuoted(url)) {
    problems.push(
      `VITE_SUPABASE_URL est entourée de guillemets (${url}) : ils font partie de la valeur et rendent l'URL invalide.`
    );
  } else {
    try {
      const { protocol } = new URL(url);
      if (protocol !== 'http:' && protocol !== 'https:') {
        problems.push(`VITE_SUPABASE_URL doit être en http(s) (reçu : ${protocol}).`);
      }
    } catch {
      problems.push(`VITE_SUPABASE_URL n'est pas une URL valide (${url}).`);
    }
  }

  if (!anonKey) {
    problems.push('VITE_SUPABASE_ANON_KEY est absente ou vide.');
  } else if (isQuoted(anonKey)) {
    problems.push('VITE_SUPABASE_ANON_KEY est entourée de guillemets : retirez-les.');
  }

  return problems.length > 0 ? { ok: false, problems } : { ok: true, env: { url, anonKey } };
}
