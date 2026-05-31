/**
 * Document links service — typed relationships between documents.
 *
 * Backed by the `document_links` table (migration 00035). Rows are
 * stored as directed edges (`source → target`), but the UI typically
 * wants an undirected view ("what is connected to me"), so the service
 * fetches both directions and merges them with a `direction` field.
 *
 * RLS scopes both ends to the caller's org, so no cross-org links can
 * be created or read.
 */
import { supabase } from '../lib/supabase';

export type DocumentLinkRelationship = 'annex' | 'parent' | 'amendment' | 'supersedes' | 'related';

/**
 * UI-facing list of relationships callers may pick from. The column
 * accepts any VARCHAR(50) so additional values won't break — these are
 * the curated set we surface in dropdowns.
 */
export const DOCUMENT_LINK_RELATIONSHIPS: Array<{
  value: DocumentLinkRelationship;
  label: string;
}> = [
  { value: 'related', label: 'Lié' },
  { value: 'annex', label: 'Annexe' },
  { value: 'parent', label: 'Contrat parent' },
  { value: 'amendment', label: 'Avenant' },
  { value: 'supersedes', label: 'Remplace' },
];

export interface LinkedDocumentItem {
  /** UUID of the document_links row, used for deletion. */
  linkId: string;
  /** UUID of the OTHER document (not the source we queried for). */
  documentId: string;
  /** Title of the linked document. */
  title: string;
  /** Current status of the linked document. */
  status: string;
  /** Relationship label (annex / parent / amendment / supersedes / related). */
  relationship: string;
  /** Optional free-form note attached to the link. */
  note: string | null;
  /**
   * `outgoing` if WE point to them (we are the source);
   * `incoming` if THEY point to us (we are the target).
   * UI may want to phrase the relationship differently in each case
   * (e.g. "Annex of" vs "Has annex").
   */
  direction: 'outgoing' | 'incoming';
  createdAt: string;
}

/**
 * Load all links touching this document — both `source = me` and
 * `target = me` — and return a unified list with the relationship
 * + the OTHER document's title/status.
 */
export async function getLinkedDocuments(documentId: string): Promise<LinkedDocumentItem[]> {
  if (!documentId) return [];
  try {
    const [outRes, inRes] = await Promise.all([
      // Outgoing: I am the source, point to others.
      supabase
        .from('document_links')
        .select(
          `id, relationship, note, created_at, target_document_id,
           target:target_document_id ( id, title, status )`
        )
        .eq('source_document_id', documentId),
      // Incoming: I am the target, others point to me.
      supabase
        .from('document_links')
        .select(
          `id, relationship, note, created_at, source_document_id,
           source:source_document_id ( id, title, status )`
        )
        .eq('target_document_id', documentId),
    ]);

    const out: LinkedDocumentItem[] = ((outRes.data as Array<Record<string, unknown>>) ?? []).map(
      (r) => {
        const row = r as {
          id: string;
          relationship: string;
          note: string | null;
          created_at: string;
          target_document_id: string;
          target?:
            | { id?: string; title?: string; status?: string }
            | { id?: string; title?: string; status?: string }[]
            | null;
        };
        const target = Array.isArray(row.target) ? row.target[0] : row.target;
        return {
          linkId: row.id,
          documentId: target?.id || row.target_document_id,
          title: target?.title || 'Document supprimé',
          status: target?.status || 'unknown',
          relationship: row.relationship,
          note: row.note,
          direction: 'outgoing',
          createdAt: row.created_at,
        };
      }
    );

    const inc: LinkedDocumentItem[] = ((inRes.data as Array<Record<string, unknown>>) ?? []).map(
      (r) => {
        const row = r as {
          id: string;
          relationship: string;
          note: string | null;
          created_at: string;
          source_document_id: string;
          source?:
            | { id?: string; title?: string; status?: string }
            | { id?: string; title?: string; status?: string }[]
            | null;
        };
        const source = Array.isArray(row.source) ? row.source[0] : row.source;
        return {
          linkId: row.id,
          documentId: source?.id || row.source_document_id,
          title: source?.title || 'Document supprimé',
          status: source?.status || 'unknown',
          relationship: row.relationship,
          note: row.note,
          direction: 'incoming',
          createdAt: row.created_at,
        };
      }
    );

    // Newest first.
    return [...out, ...inc].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch {
    return [];
  }
}

export interface CreateLinkInput {
  sourceDocumentId: string;
  targetDocumentId: string;
  relationship?: DocumentLinkRelationship | string;
  note?: string;
}

export async function createDocumentLink(
  input: CreateLinkInput,
  createdByUserId: string
): Promise<{ ok: true; linkId: string } | { ok: false; error: string }> {
  if (input.sourceDocumentId === input.targetDocumentId) {
    return { ok: false, error: 'Un document ne peut pas être lié à lui-même.' };
  }
  try {
    const { data, error } = await supabase
      .from('document_links')
      .insert({
        source_document_id: input.sourceDocumentId,
        target_document_id: input.targetDocumentId,
        relationship: input.relationship || 'related',
        note: input.note ?? null,
        created_by: createdByUserId,
      } as never)
      .select('id')
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message || 'Création échouée.' };
    }
    return { ok: true, linkId: (data as { id: string }).id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Création échouée.' };
  }
}

export async function deleteDocumentLink(linkId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('document_links').delete().eq('id', linkId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Lightweight search inside the caller's org — used by the
 * "add a link" picker. Excludes the document we're linking FROM so the
 * user can't accidentally self-link.
 */
export interface DocumentSearchHit {
  id: string;
  title: string;
  status: string;
}

export async function searchOrgDocuments(
  query: string,
  excludeDocumentId: string,
  limit = 10
): Promise<DocumentSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    // RLS already scopes by org, no need for an explicit organization_id filter.
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, status')
      .is('deleted_at', null)
      .neq('id', excludeDocumentId)
      .ilike('title', `%${q}%`)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as Array<{ id: string; title: string; status: string }>).map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
    }));
  } catch {
    return [];
  }
}
