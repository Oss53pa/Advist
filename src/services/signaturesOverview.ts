/**
 * Signatures overview service — real per-user signature requests and
 * signed documents from `document_signatures` joined to `documents`.
 * Replaces the hardcoded mocks on SignaturesPage. Resilient.
 */
import { supabase } from '../lib/supabase';

export interface PendingSignatureRow {
  id: string;
  documentId: string | null;
  documentTitle: string;
  expiresAt: string | null;
  createdAt: string | null;
  pageNumber: number | null;
}

export interface SignedDocumentRow {
  id: string;
  documentId: string | null;
  documentTitle: string;
  signedAt: string | null;
  pageNumber: number | null;
  signatureHash: string | null;
}

function extractDocTitle(documents: unknown): string {
  if (!documents) return 'Document';
  if (Array.isArray(documents)) {
    const first = documents[0] as { title?: string } | undefined;
    return first?.title || 'Document';
  }
  return (documents as { title?: string }).title || 'Document';
}

/** Signature requests pending the user's signature. */
export async function getMyPendingSignatures(userId: string): Promise<PendingSignatureRow[]> {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .select('id, document_id, expires_at, created_at, page_number, documents ( title )')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      documentId: (row.document_id as string) ?? null,
      documentTitle: extractDocTitle(row.documents),
      expiresAt: (row.expires_at as string) ?? null,
      createdAt: (row.created_at as string) ?? null,
      pageNumber: (row.page_number as number) ?? null,
    }));
  } catch {
    return [];
  }
}

/** Documents the user has already signed. */
export async function getMySignedDocuments(userId: string): Promise<SignedDocumentRow[]> {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .select('id, document_id, signed_at, page_number, signature_hash, documents ( title )')
      .eq('user_id', userId)
      .eq('status', 'signed')
      .order('signed_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      documentId: (row.document_id as string) ?? null,
      documentTitle: extractDocTitle(row.documents),
      signedAt: (row.signed_at as string) ?? null,
      pageNumber: (row.page_number as number) ?? null,
      signatureHash: (row.signature_hash as string) ?? null,
    }));
  } catch {
    return [];
  }
}
