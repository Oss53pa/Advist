import { describe, it, expect } from 'vitest';
import { checkSupabaseEnv } from './env';

const VALID_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';

describe('checkSupabaseEnv', () => {
  it('accepte une configuration valide et renvoie les valeurs nettoyées', () => {
    const result = checkSupabaseEnv({
      VITE_SUPABASE_URL: '  https://abc.supabase.co  ',
      VITE_SUPABASE_ANON_KEY: `  ${VALID_KEY}  `,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.env).toEqual({ url: 'https://abc.supabase.co', anonKey: VALID_KEY });
  });

  it('accepte une URL locale en http (supabase start)', () => {
    expect(
      checkSupabaseEnv({
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_ANON_KEY: VALID_KEY,
      }).ok
    ).toBe(true);
  });

  it('signale les deux variables quand rien n’est fourni', () => {
    const result = checkSupabaseEnv({});

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toHaveLength(2);
    expect(result.problems.join(' ')).toContain('VITE_SUPABASE_URL');
    expect(result.problems.join(' ')).toContain('VITE_SUPABASE_ANON_KEY');
  });

  it('traite une chaîne vide ou blanche comme absente', () => {
    const result = checkSupabaseEnv({ VITE_SUPABASE_URL: '   ', VITE_SUPABASE_ANON_KEY: '' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toHaveLength(2);
  });

  // Régression : `supabase status -o env` entoure les valeurs de guillemets ;
  // écrites telles quelles dans $GITHUB_ENV, elles arrivaient guillemets
  // compris et faisaient lever createClient() au chargement → page blanche.
  it('rejette une URL entourée de guillemets', () => {
    const result = checkSupabaseEnv({
      VITE_SUPABASE_URL: '"http://127.0.0.1:54321"',
      VITE_SUPABASE_ANON_KEY: VALID_KEY,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toContain('guillemets');
  });

  it('rejette une clé anon entourée de guillemets', () => {
    const result = checkSupabaseEnv({
      VITE_SUPABASE_URL: 'https://abc.supabase.co',
      VITE_SUPABASE_ANON_KEY: `"${VALID_KEY}"`,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems[0]).toContain('guillemets');
  });

  it('rejette une URL malformée', () => {
    const result = checkSupabaseEnv({
      VITE_SUPABASE_URL: 'pas-une-url',
      VITE_SUPABASE_ANON_KEY: VALID_KEY,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems[0]).toContain("n'est pas une URL valide");
  });

  it('rejette un protocole non http(s)', () => {
    const result = checkSupabaseEnv({
      VITE_SUPABASE_URL: 'ftp://abc.supabase.co',
      VITE_SUPABASE_ANON_KEY: VALID_KEY,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems[0]).toContain('http(s)');
  });

  it('ignore les valeurs non textuelles', () => {
    const result = checkSupabaseEnv({ VITE_SUPABASE_URL: 42, VITE_SUPABASE_ANON_KEY: null });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toHaveLength(2);
  });
});
