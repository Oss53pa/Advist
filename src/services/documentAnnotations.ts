/**
 * Document Annotations service.
 *
 * CRUD wrapper around the `document_annotations` table, mapping between
 * the DB shape (page_number / x_position / y_position / annotation_type)
 * and the UI shape used by DocumentDetailPage (`Annotation` interface,
 * fields `page` / `x` / `y` / `type`).
 *
 * `points` (free-draw paths) and `stamp` labels live in the `content`
 * column as plain text or a JSON-stringified array — the UI is
 * responsible for parsing them back.
 *
 * All calls are resilient: errors return empty / null rather than throw,
 * so a missing RLS grant or transient failure degrades gracefully.
 */
import { supabase } from '../lib/supabase';

export type AnnotationToolValue =
  | 'select'
  | 'highlight'
  | 'note'
  | 'draw'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'signature'
  | 'stamp';

export interface AnnotationItem {
  id: string;
  type: AnnotationToolValue;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  content?: string;
  points?: { x: number; y: number }[];
}

function parsePoints(content: string | null): { x: number; y: number }[] | undefined {
  if (!content) return undefined;
  if (!content.trim().startsWith('[')) return undefined;
  try {
    const parsed = JSON.parse(content);
    if (
      Array.isArray(parsed) &&
      parsed.every((p) => typeof p?.x === 'number' && typeof p?.y === 'number')
    ) {
      return parsed as { x: number; y: number }[];
    }
  } catch {
    /* not JSON → not a draw path */
  }
  return undefined;
}

function rowToAnnotation(r: Record<string, unknown>): AnnotationItem {
  const row = r as {
    id: string;
    page_number: number | null;
    x_position: number | null;
    y_position: number | null;
    width: number | null;
    height: number | null;
    content: string | null;
    annotation_type: string;
    color: string;
  };
  const type = (row.annotation_type || 'note') as AnnotationToolValue;
  const points = type === 'draw' ? parsePoints(row.content) : undefined;
  return {
    id: row.id,
    type,
    page: row.page_number ?? 1,
    x: row.x_position ?? 0,
    y: row.y_position ?? 0,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    color: row.color || '#FEF08A',
    // For 'draw' the content is the points JSON — don't surface it as text.
    content: type === 'draw' ? undefined : (row.content ?? undefined),
    points,
  };
}

export async function getDocumentAnnotations(documentId: string): Promise<AnnotationItem[]> {
  try {
    const { data, error } = await supabase
      .from('document_annotations')
      .select(
        'id, page_number, x_position, y_position, width, height, content, annotation_type, color'
      )
      .eq('document_id', documentId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(rowToAnnotation);
  } catch {
    return [];
  }
}

export interface AnnotationCreateInput extends Omit<AnnotationItem, 'id'> {
  /** Optional client-supplied UUID — otherwise the DB generates one. */
  clientId?: string;
}

export async function createDocumentAnnotation(
  documentId: string,
  userId: string,
  input: AnnotationCreateInput
): Promise<AnnotationItem | null> {
  try {
    const contentForDb =
      input.type === 'draw' && input.points
        ? JSON.stringify(input.points)
        : (input.content ?? null);
    const payload: Record<string, unknown> = {
      document_id: documentId,
      user_id: userId,
      annotation_type: input.type,
      page_number: input.page,
      x_position: input.x,
      y_position: input.y,
      width: input.width ?? null,
      height: input.height ?? null,
      content: contentForDb,
      color: input.color,
    };
    if (input.clientId) payload.id = input.clientId;

    const { data, error } = await supabase
      .from('document_annotations')
      .insert(payload as never)
      .select(
        'id, page_number, x_position, y_position, width, height, content, annotation_type, color'
      )
      .single();
    if (error || !data) return null;
    return rowToAnnotation(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function deleteDocumentAnnotation(annotationId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('document_annotations').delete().eq('id', annotationId);
    return !error;
  } catch {
    return false;
  }
}
