/**
 * Document chat service — persistent per-document collaboration chat
 * backed by `collaboration_chat_messages` (defined in migration 00010,
 * unused until now).
 *
 * Persistence is the priority here: previously the only "chat" surface
 * was an ephemeral Supabase Realtime broadcast (useRealtimeCollaboration)
 * that stored messages only in local React state, so a page reload
 * wiped the conversation. Now:
 *  - Initial history loaded via SELECT joined to profiles + org.
 *  - Outgoing messages INSERT into `collaboration_chat_messages`.
 *  - Live updates streamed via Realtime `postgres_changes` (INSERT) on
 *    the same table, filtered by `session_id`, so other participants'
 *    messages appear without polling.
 *
 * Each document gets exactly one active `collaboration_sessions` row;
 * the service finds-or-creates it on demand (`ensureSession`).
 */
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ExternalContext } from './documentDetail';

export interface ChatMessageItem {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  authorExternal?: ExternalContext;
  pageReference?: number;
  replyTo?: string;
  createdAt: string; // ISO
}

function fullName(p: { first_name?: string | null; last_name?: string | null } | null | undefined) {
  if (!p) return 'Utilisateur';
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Utilisateur';
}

function extractExternalFromProfile(
  profile:
    | {
        organization_id?: string | null;
        job_title?: string | null;
        organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
      }
    | null
    | undefined,
  docOrgId: string | null | undefined
): ExternalContext {
  const orgId = profile?.organization_id ?? null;
  const orgEmbed = Array.isArray(profile?.organization)
    ? profile?.organization?.[0]
    : profile?.organization;
  const orgName = orgEmbed?.name;
  if (!docOrgId) {
    return {
      isExternal: false,
      organizationId: orgId,
      organizationName: orgName,
      jobTitle: profile?.job_title ?? undefined,
    };
  }
  const isExternal = orgId !== docOrgId;
  return {
    isExternal,
    organizationId: orgId,
    organizationName: isExternal ? orgName : undefined,
    jobTitle: profile?.job_title ?? undefined,
  };
}

/**
 * Find or create an active collaboration session for the document.
 * Returns the session UUID. Multiple concurrent calls for the same
 * document may briefly race, but the worst case is two active sessions
 * — not a correctness issue (messages from both render together).
 */
export async function ensureChatSession(documentId: string): Promise<string | null> {
  try {
    const { data: existing, error: selErr } = await supabase
      .from('collaboration_sessions')
      .select('id')
      .eq('document_id', documentId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selErr) return null;
    if (existing) {
      return (existing as { id: string }).id;
    }
    const { data: created, error: insErr } = await supabase
      .from('collaboration_sessions')
      .insert({ document_id: documentId, is_active: true } as never)
      .select('id')
      .single();
    if (insErr || !created) return null;
    return (created as { id: string }).id;
  } catch {
    return null;
  }
}

/**
 * Load the full chat history for a session, joined to author profile
 * and org so we can render the "Externe" pill.
 *
 * `docOrgId` is the document's owning org (used to compute external
 * context). Pass null if unknown — the service will mark nobody as
 * external rather than guess.
 */
export async function getChatMessages(
  sessionId: string,
  docOrgId: string | null
): Promise<ChatMessageItem[]> {
  try {
    const { data, error } = await supabase
      .from('collaboration_chat_messages')
      .select(
        `id, message, metadata, created_at, user_id,
         profiles:user_id (
           first_name, last_name, avatar_url, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         )`
      )
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map(rowToMessage(docOrgId));
  } catch {
    return [];
  }
}

function rowToMessage(docOrgId: string | null) {
  return (r: Record<string, unknown>): ChatMessageItem => {
    const row = r as {
      id: string;
      message: string;
      metadata?: Record<string, unknown> | null;
      created_at: string;
      user_id: string;
      profiles?: {
        first_name?: string;
        last_name?: string;
        avatar_url?: string | null;
        organization_id?: string | null;
        job_title?: string | null;
        organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
      } | null;
    };
    const meta = row.metadata || {};
    const pageRef = typeof meta.page_reference === 'number' ? meta.page_reference : undefined;
    const replyTo = typeof meta.reply_to === 'string' ? meta.reply_to : undefined;
    return {
      id: row.id,
      content: row.message,
      author: {
        id: row.user_id,
        name: fullName(row.profiles),
        avatar: row.profiles?.avatar_url ?? undefined,
      },
      authorExternal: extractExternalFromProfile(row.profiles, docOrgId),
      pageReference: pageRef,
      replyTo,
      createdAt: row.created_at,
    };
  };
}

/**
 * INSERT a new message. The optimistic update is the caller's
 * responsibility — the Realtime subscription will also fire on this
 * INSERT, so callers should dedupe by `id` if they push the local copy
 * before the round-trip completes.
 */
export async function sendChatMessage(
  sessionId: string,
  userId: string,
  content: string,
  opts: { pageReference?: number; replyTo?: string } = {}
): Promise<ChatMessageItem | null> {
  try {
    const metadata: Record<string, unknown> = {};
    if (opts.pageReference !== undefined) metadata.page_reference = opts.pageReference;
    if (opts.replyTo !== undefined) metadata.reply_to = opts.replyTo;

    const { data, error } = await supabase
      .from('collaboration_chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        message: content,
        message_type: 'text',
        metadata,
      } as never)
      .select(
        `id, message, metadata, created_at, user_id,
         profiles:user_id (
           first_name, last_name, avatar_url, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         )`
      )
      .single();
    if (error || !data) return null;
    return rowToMessage(null)(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/**
 * Subscribe to new messages on the session. Returns an unsubscribe
 * function. The callback fires for every new INSERT (including the
 * caller's own — dedupe by message id on the consumer side).
 *
 * Note: the postgres_changes payload doesn't include the joined profile
 * fields, so we do a follow-up SELECT for each insert to hydrate the
 * author. This is cheap (1 row) and keeps the renderer consistent with
 * the initial load.
 */
export function subscribeChatMessages(
  sessionId: string,
  docOrgId: string | null,
  onMessage: (m: ChatMessageItem) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`chat:${sessionId}`)
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'collaboration_chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload: { new: { id: string } }) => {
        const id = payload.new?.id;
        if (!id) return;
        try {
          const { data } = await supabase
            .from('collaboration_chat_messages')
            .select(
              `id, message, metadata, created_at, user_id,
               profiles:user_id (
                 first_name, last_name, avatar_url, organization_id, job_title,
                 organization:organizations!profiles_organization_id_fkey ( id, name )
               )`
            )
            .eq('id', id)
            .maybeSingle();
          if (data) onMessage(rowToMessage(docOrgId)(data as Record<string, unknown>));
        } catch {
          /* tolerate */
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* noop */
    }
  };
}
