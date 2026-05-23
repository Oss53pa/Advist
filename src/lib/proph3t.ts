/**
 * proph3t.ts — Intégration Atlas Studio « Proph3t core » pour Advist.
 * ----------------------------------------------------------------------------
 * Adapté du snippet de référence oss53pa/atlas-studio-website
 *   docs/snippets/proph3t-integration.ts
 *
 * DEUX MODES, complémentaires (l'API vient EN COMPLÉMENT des chemins
 * existants : ChatWidget local, analyse Claude/OpenRouter, saisies manuelles) :
 *
 *   A) Fédération (SDK @atlas-studio/proph3t-client) → le LLM local d'Advist
 *      reste en place ; le core fournit mémoire inter-apps (recall), RAG
 *      SYSCOHADA/OHADA/CGI (searchKnowledge), 197 outils centraux (runTool) et
 *      l'audit chaîné SHA-256 (logAudit).
 *   B) Hébergé (POST proph3t-ask) → on délègue tout le tour au core, avec
 *      gouvernance par SENSIBILITÉ des données (askProph3t).
 *
 * ⚠️ Le SDK Mode A n'est pas encore publié sur npm. Il est donc chargé via un
 * import dynamique « tolérant » : tant qu'il est absent, getProph3t() lève
 * FederationUnavailableError et les helpers d'enrichissement
 * (recall/searchKnowledge/logAudit) dégradent proprement (no-op), laissant le
 * LLM local d'Advist fonctionner seul. Dès `npm i @atlas-studio/proph3t-client`,
 * Mode A s'active sans autre changement de code.
 *
 * Aucune donnée `confidential` ne part vers un provider à rétention : c'est le
 * core qui « gate » les providers selon `sensitivity` (confidential →
 * Ollama/Claude uniquement). Le JWT de l'utilisateur (session Supabase de
 * l'app) est passé en `userToken` / Authorization pour que la RLS s'applique.
 */

// supabase = le client Supabase d'Advist (pour récupérer le JWT user).
import { supabase } from './supabase';

/** Id d'Advist au catalogue Atlas Studio (le core normalise les alias). */
export const PRODUCT = 'advist';

export type Sensitivity = 'confidential' | 'internal' | 'public';

/**
 * Sensibilité par défaut d'Advist = confidentielle (contrats, pièces jointes,
 * signatures, due diligence). Le core route alors UNIQUEMENT vers Ollama/Claude
 * (aucune rétention) — jamais vers un tier gratuit (gemini/groq).
 *
 * Mapping recommandé par type de donnée :
 *   confidential → contrats, relevés, paie, due diligence, pièces signées
 *   internal     → reporting / données de gestion non publiques
 *   public       → support, doc publique, brouillons
 */
export const DEFAULT_SENSITIVITY: Sensitivity = 'confidential';

// Le core EST le projet Supabase d'Advist (vgtmljfayiysuvrcmunt). On accepte
// des variables dédiées VITE_ATLAS_* (au cas où le core serait un projet
// distinct) et on retombe sur celles de l'app par défaut.
const ATLAS_CORE_URL =
  (import.meta.env.VITE_ATLAS_SUPABASE_URL as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  '';
const ATLAS_CORE_ANON =
  (import.meta.env.VITE_ATLAS_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  '';

/** True si l'app dispose des coordonnées vers le core (URL + anon key). */
export function isProph3tConfigured(): boolean {
  return Boolean(ATLAS_CORE_URL && ATLAS_CORE_ANON);
}

// ============================================================
// MODE B — Hébergé : déléguer tout le tour à proph3t-ask
// ============================================================

export interface AskResult {
  conversation_id: string;
  answer: string;
  citations: unknown[];
  confidence: number;
  disclaimer?: string;
}

export interface AskParams {
  message: string;
  /** Défaut : DEFAULT_SENSITIVITY ('confidential'). */
  sensitivity?: Sensitivity;
  conversationId?: string;
  societyId?: string;
}

/**
 * Pose une question à l'orchestrateur Proph3t hébergé (ReAct).
 * `sensitivity` gouverne les providers autorisés côté core.
 */
export async function askProph3t(params: AskParams): Promise<AskResult> {
  if (!isProph3tConfigured()) {
    throw new Error(
      'Proph3t core non configuré : définissez VITE_ATLAS_SUPABASE_URL et VITE_ATLAS_SUPABASE_ANON_KEY.'
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${ATLAS_CORE_URL}/functions/v1/proph3t-ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ATLAS_CORE_ANON,
      // JWT user → RLS appliquée ; à défaut, anon (endpoints publics seulement).
      Authorization: `Bearer ${session?.access_token ?? ATLAS_CORE_ANON}`,
    },
    body: JSON.stringify({
      message: params.message,
      product: PRODUCT,
      sensitivity: params.sensitivity ?? DEFAULT_SENSITIVITY,
      conversation_id: params.conversationId,
      society_id: params.societyId,
    }),
  });

  if (!res.ok) {
    throw new Error(`proph3t-ask ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as AskResult;
}

// ============================================================
// MODE A — Fédération : enrichissement via le SDK @atlas-studio/proph3t-client
// ============================================================

export interface RecallItem {
  id?: string;
  content: string;
  product?: string;
  score?: number;
  createdAt?: string;
}

export interface KnowledgeRef {
  id?: string;
  title?: string;
  content: string;
  sourceType?: string;
  score?: number;
}

export interface ToolResult<T = unknown> {
  ok: boolean;
  result?: T;
  error?: string;
}

/** Surface minimale du client fédéré, telle que documentée par le snippet. */
export interface Proph3tClient {
  recall(p: { query: string; limit?: number }): Promise<RecallItem[]>;
  searchKnowledge(p: {
    query: string;
    sourceType?: string;
    topK?: number;
  }): Promise<KnowledgeRef[]>;
  runTool<T = unknown>(p: { name: string; args: Record<string, unknown> }): Promise<ToolResult<T>>;
  logAudit(p: {
    action: string;
    subjectType?: string;
    subjectId?: string;
    content?: Record<string, unknown>;
  }): Promise<void>;
}

interface Proph3tClientCtor {
  new (opts: {
    product: string;
    supabaseUrl: string;
    apiKey: string;
    userToken?: string;
    societyId?: string;
  }): Proph3tClient;
}

/** Levée quand le SDK fédéré (Mode A) n'est pas installé. */
export class FederationUnavailableError extends Error {
  readonly reason?: unknown;
  constructor(reason?: unknown) {
    super(
      'SDK @atlas-studio/proph3t-client indisponible (Mode A). Lancez : npm i @atlas-studio/proph3t-client'
    );
    this.name = 'FederationUnavailableError';
    this.reason = reason;
  }
}

// Spécifieur volontairement typé `string` (et non littéral) + commentaire
// @vite-ignore : ni tsc ni le bundler ne tentent de résoudre le module tant
// qu'il est absent → build vert. À l'installation du SDK, remplacer par un
// import statique pour un bundling optimal.
const SDK_SPECIFIER: string = '@atlas-studio/proph3t-client';

async function loadClientCtor(): Promise<Proph3tClientCtor> {
  try {
    const mod = (await import(/* @vite-ignore */ SDK_SPECIFIER)) as {
      Proph3tClient?: Proph3tClientCtor;
    };
    if (!mod?.Proph3tClient) {
      throw new Error("export 'Proph3tClient' introuvable dans le SDK");
    }
    return mod.Proph3tClient;
  } catch (err) {
    throw new FederationUnavailableError(err);
  }
}

/**
 * Construit un client Proph3t fédéré, scoppé sur l'utilisateur courant.
 * Lève FederationUnavailableError si le SDK n'est pas installé.
 */
export async function getProph3t(societyId?: string): Promise<Proph3tClient> {
  if (!isProph3tConfigured()) {
    throw new Error('Proph3t core non configuré (VITE_ATLAS_SUPABASE_URL / _ANON_KEY).');
  }
  const Ctor = await loadClientCtor();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return new Ctor({
    product: PRODUCT,
    supabaseUrl: ATLAS_CORE_URL,
    apiKey: ATLAS_CORE_ANON,
    userToken: session?.access_token,
    societyId,
  });
}

/** True si le SDK fédéré est réellement installé (Mode A actif). */
export async function isFederationAvailable(): Promise<boolean> {
  try {
    await loadClientCtor();
    return true;
  } catch {
    return false;
  }
}

// ── Helpers d'enrichissement (best-effort : no-op si Mode A indisponible) ──

/** RAG : ancre un prompt local dans le savoir partagé. [] si Mode A indispo. */
export async function searchKnowledge(
  query: string,
  opts?: { sourceType?: string; topK?: number; societyId?: string }
): Promise<KnowledgeRef[]> {
  try {
    const client = await getProph3t(opts?.societyId);
    return await client.searchKnowledge({
      query,
      sourceType: opts?.sourceType,
      topK: opts?.topK ?? 5,
    });
  } catch (err) {
    if (!(err instanceof FederationUnavailableError))
      console.warn('[proph3t] searchKnowledge:', err);
    return [];
  }
}

/** Mémoire inter-apps : ce que l'utilisateur a fait ailleurs dans Atlas. */
export async function recall(
  query: string,
  opts?: { limit?: number; societyId?: string }
): Promise<RecallItem[]> {
  try {
    const client = await getProph3t(opts?.societyId);
    return await client.recall({ query, limit: opts?.limit ?? 5 });
  } catch (err) {
    if (!(err instanceof FederationUnavailableError)) console.warn('[proph3t] recall:', err);
    return [];
  }
}

/** Délègue un calcul/outil au core. error:'federation_unavailable' si Mode A KO. */
export async function runTool<T = unknown>(
  name: string,
  args: Record<string, unknown>,
  societyId?: string
): Promise<ToolResult<T>> {
  try {
    const client = await getProph3t(societyId);
    return await client.runTool<T>({ name, args });
  } catch (err) {
    if (err instanceof FederationUnavailableError)
      return { ok: false, error: 'federation_unavailable' };
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Audit chaîné SHA-256. Best-effort : n'interrompt jamais le flux applicatif. */
export async function logAudit(
  action: string,
  p?: {
    subjectType?: string;
    subjectId?: string;
    content?: Record<string, unknown>;
    societyId?: string;
  }
): Promise<void> {
  try {
    const client = await getProph3t(p?.societyId);
    await client.logAudit({
      action,
      subjectType: p?.subjectType,
      subjectId: p?.subjectId,
      content: p?.content,
    });
  } catch (err) {
    if (!(err instanceof FederationUnavailableError)) console.warn('[proph3t] logAudit:', err);
  }
}

/**
 * Construit un bloc de contexte (RAG + mémoire inter-apps) à injecter dans le
 * system prompt d'un LLM local. Chaîne vide si Mode A indisponible.
 */
export async function buildGroundingBlock(
  query: string,
  opts?: { societyId?: string; sourceType?: string }
): Promise<string> {
  const [refs, past] = await Promise.all([
    searchKnowledge(query, {
      sourceType: opts?.sourceType ?? 'syscohada',
      topK: 5,
      societyId: opts?.societyId,
    }),
    recall(query, { limit: 5, societyId: opts?.societyId }),
  ]);

  let block = '';
  if (refs.length) {
    const lines = refs
      .map((r, i) => `[${i + 1}] ${r.title ? `${r.title} — ` : ''}${r.content}`)
      .join('\n');
    block += `\n\nRÉFÉRENCES (Atlas Studio — SYSCOHADA / OHADA / CGI) :\n${lines}`;
  }
  if (past.length) {
    const lines = past.map((m) => `- ${m.content}`).join('\n');
    block += `\n\nMÉMOIRE INTER-APPS (actions passées de l'utilisateur) :\n${lines}`;
  }
  return block;
}
