/**
 * Documents Service — Supabase Implementation
 *
 * Replaces Axios API calls with direct Supabase client queries.
 * File operations use Supabase Storage bucket "documents".
 */
import { supabase } from '../lib/supabase';
import {
  getPaginationRange,
  parseSupabaseError,
  uploadFile,
  downloadFile,
} from './supabase-helpers';
import type { Document, DocumentType, DocumentVersion, PaginatedResponse } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DOCUMENTS_BUCKET = 'documents';
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------
export interface DocumentFilters {
  search?: string;
  status?: string;
  document_type?: string;
  owner?: string;
  tags?: string[];
  ordering?: string;
  page?: number;
}

// ---------------------------------------------------------------------------
// Select fragments for Supabase joins
// ---------------------------------------------------------------------------
const DOCUMENT_SELECT = `
  *,
  document_type:document_types(id, name, description, allowed_extensions, max_file_size_mb, requires_approval),
  owner:profiles!documents_created_by_fkey(id, first_name, last_name, email),
  organization:organizations!documents_organization_id_fkey(id, name, slug),
  locked_by_user:profiles!documents_locked_by_fkey(id, first_name, last_name, email),
  folder:folders(id, name, description, parent_id)
`;

const VERSION_SELECT = `
  *,
  uploaded_by:profiles!document_versions_created_by_fkey(id, first_name, last_name, email)
`;

// ---------------------------------------------------------------------------
// Helpers — status display
// ---------------------------------------------------------------------------
function getStatusDisplay(status: string): string {
  const map: Record<string, string> = {
    draft: 'Brouillon',
    submitted: 'Soumis',
    under_review: 'En révision',
    changes_requested: 'Modifications demandées',
    validated: 'Validé',
    rejected: 'Rejeté',
    pending: 'En attente',
    approved: 'Approuvé',
    archived: 'Archivé',
  };
  return map[status] || status;
}

// ---------------------------------------------------------------------------
// Row → Document mapper
// ---------------------------------------------------------------------------
function mapDocument(row: Record<string, unknown>): Document {
  const r = row as Record<string, any>;
  return {
    id: r.id,
    title: r.title,
    description: r.description || '',
    document_type: r.document_type
      ? {
          id: r.document_type.id,
          name: r.document_type.name,
          description: r.document_type.description || '',
          allowed_extensions: r.document_type.allowed_extensions || [],
          max_size: r.document_type.max_file_size_mb || 50,
          requires_signature: r.document_type.requires_approval || false,
          requires_paraph: false,
          paraph_all_pages: false,
        }
      : null,
    owner: r.owner
      ? {
          id: r.owner.id,
          email: r.owner.email,
          first_name: r.owner.first_name,
          last_name: r.owner.last_name,
        }
      : ({} as any),
    organization: r.organization || ({} as any),
    current_version: r.version || 1,
    file_size: r.file_size || 0,
    is_locked: r.is_locked || false,
    locked_by: r.locked_by_user || undefined,
    tags: (r.tags || []).map((t: string, i: number) => ({
      id: `tag-${i}`,
      name: t,
      color: '#6B7280',
    })),
    metadata: r.metadata || {},
    status: r.status || 'draft',
    created_at: r.created_at,
    updated_at: r.updated_at,
    folder: r.folder || undefined,
    file_hash: r.file_hash || '',
    is_duplicate: false,
    linked_documents: [],
    track_changes_enabled: false,
    modifications: [],
    confidentiality_level: r.metadata?.confidentiality_level || 'internal',
    amount: r.metadata?.amount,
  } as unknown as Document;
}

// ---------------------------------------------------------------------------
// Row → DocumentVersion mapper
// ---------------------------------------------------------------------------
function mapVersion(row: Record<string, any>): DocumentVersion {
  return {
    id: row.id,
    document: row.document_id,
    version_number: row.version_number,
    file: row.file_path,
    original_filename: row.file_name || '',
    file_size: row.file_size || 0,
    file_hash: row.file_hash || '',
    uploaded_by: row.uploaded_by || null,
    comment: row.changes_summary || '',
    created_at: row.created_at,
  } as unknown as DocumentVersion;
}

// ---------------------------------------------------------------------------
// Row → DocumentAnnotation mapper
// ---------------------------------------------------------------------------
function mapAnnotation(a: Record<string, any>): DocumentAnnotation {
  return {
    id: a.id,
    type: (a.annotation_type as DocumentAnnotation['type']) || 'comment',
    page: a.page_number || 1,
    x: a.x_position || 0,
    y: a.y_position || 0,
    width: a.width,
    height: a.height,
    content: a.content,
    color: a.color,
    author: a.user ? `${a.user.first_name} ${a.user.last_name}` : '',
    authorId: a.user_id,
    createdAt: a.created_at,
  };
}

// ---------------------------------------------------------------------------
// Row → ContextualAnnotation mapper
// ---------------------------------------------------------------------------
function mapContextualAnnotation(
  a: Record<string, any>,
  documentId: string,
  versionNumber = 1
): ContextualAnnotation {
  return {
    id: a.id,
    document: documentId as any,
    version: versionNumber,
    annotation_type: a.annotation_type || 'comment',
    page_number: a.page_number || 1,
    position: { x: a.x_position || 0, y: a.y_position || 0 },
    content: { text: a.content || '' },
    color: a.color || '#FFEB3B',
    context_type: 'page',
    context_type_display: 'Page',
    section_id: '',
    section_title: '',
    element_selector: '',
    quoted_text: '',
    author: a.user_id,
    author_name: a.user ? `${a.user.first_name} ${a.user.last_name}` : '',
    is_private: false,
    is_resolved: a.is_resolved || false,
    resolved_by: a.resolver?.id || null,
    resolved_by_name: a.resolver ? `${a.resolver.first_name} ${a.resolver.last_name}` : null,
    resolved_at: a.resolved_at || null,
    workflow_step: null,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Helper — get authenticated user id (throws if not logged in)
// ---------------------------------------------------------------------------
async function requireAuth(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return user.id;
}

// ---------------------------------------------------------------------------
// Helper — get user's organization_id
// ---------------------------------------------------------------------------
async function getUserOrgId(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();
  return data?.organization_id;
}

// ===========================================================================
// Service
// ===========================================================================
export const documentsService = {
  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  async list(filters?: DocumentFilters): Promise<PaginatedResponse<Document>> {
    const page = filters?.page || 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('documents')
      .select(DOCUMENT_SELECT, { count: 'exact' })
      .is('deleted_at', null);

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.document_type) {
      query = query.eq('document_type_id', filters.document_type);
    }
    if (filters?.owner) {
      query = query.eq('created_by', filters.owner);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Ordering
    const ordering = filters?.ordering || '-created_at';
    const ascending = !ordering.startsWith('-');
    const column = ordering.replace(/^-/, '');
    query = query.order(column, { ascending });

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(parseSupabaseError(error).message);

    return {
      count: count || 0,
      next: to < (count || 0) - 1 ? String(page + 1) : null,
      previous: page > 1 ? String(page - 1) : null,
      results: (data || []).map(mapDocument),
    };
  },

  async get(id: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .select(DOCUMENT_SELECT)
      .eq('id', id)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapDocument(data);
  },

  async create(formData: FormData): Promise<Document> {
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const documentTypeId = (formData.get('document_type') as string) || null;
    const folderId = (formData.get('folder') as string) || null;
    const tags = formData.getAll('tags') as string[];
    const rawMeta = formData.get('metadata') as string | null;
    const metadata = rawMeta ? JSON.parse(rawMeta) : {};

    const userId = await requireAuth();
    const orgId = await getUserOrgId(userId);

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileSize = 0;
    let mimeType: string | null = null;

    // Upload to Supabase Storage
    if (file) {
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
      const storagePath = `${orgId}/${userId}/${Date.now()}_${file.name}`;
      const result = await uploadFile(DOCUMENTS_BUCKET, storagePath, file);
      if (!result) throw new Error('Erreur lors du téléversement du fichier');
      filePath = result.path;
    }

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        organization_id: orgId,
        document_type_id: documentTypeId,
        folder_id: folderId,
        title,
        description,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        tags,
        metadata,
        created_by: userId,
        updated_by: userId,
        status: 'draft',
      })
      .select(DOCUMENT_SELECT)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Create initial version record
    if (filePath) {
      await supabase.from('document_versions').insert({
        document_id: doc.id,
        version_number: 1,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        changes_summary: 'Version initiale',
        created_by: userId,
      });
    }

    return mapDocument(doc);
  },

  async update(id: string, data: Partial<Document>): Promise<Document> {
    const userId = await requireAuth();

    const updateData: Record<string, unknown> = { updated_by: userId };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.tags !== undefined) {
      updateData.tags = (data.tags as any[]).map((t: any) => (typeof t === 'string' ? t : t.name));
    }

    const { data: doc, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select(DOCUMENT_SELECT)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapDocument(doc);
  },

  async delete(id: string): Promise<void> {
    // Soft-delete
    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  // -----------------------------------------------------------------------
  // Versions
  // -----------------------------------------------------------------------

  async uploadVersion(id: string, formData: FormData): Promise<DocumentVersion> {
    const file = formData.get('file') as File;
    const comment = (formData.get('comment') as string) || '';
    if (!file) throw new Error('Fichier requis');

    const userId = await requireAuth();

    const { data: doc } = await supabase
      .from('documents')
      .select('version, organization_id')
      .eq('id', id)
      .single();

    const nextVersion = (doc?.version || 0) + 1;
    const storagePath = `${doc?.organization_id}/${userId}/${Date.now()}_${file.name}`;
    const result = await uploadFile(DOCUMENTS_BUCKET, storagePath, file);
    if (!result) throw new Error('Erreur lors du téléversement');

    const { data: version, error } = await supabase
      .from('document_versions')
      .insert({
        document_id: id,
        version_number: nextVersion,
        file_path: result.path,
        file_name: file.name,
        file_size: file.size,
        changes_summary: comment,
        created_by: userId,
      })
      .select(VERSION_SELECT)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Update head pointer on document
    await supabase
      .from('documents')
      .update({
        version: nextVersion,
        file_path: result.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        updated_by: userId,
      })
      .eq('id', id);

    return mapVersion(version);
  },

  async getVersions(id: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('document_versions')
      .select(VERSION_SELECT)
      .eq('document_id', id)
      .order('version_number', { ascending: false });

    if (error) throw new Error(parseSupabaseError(error).message);
    return (data || []).map(mapVersion);
  },

  // -----------------------------------------------------------------------
  // Locking
  // -----------------------------------------------------------------------

  async lock(id: string): Promise<void> {
    const userId = await requireAuth();
    const { error } = await supabase
      .from('documents')
      .update({
        is_locked: true,
        locked_by: userId,
        locked_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async unlock(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ is_locked: false, locked_by: null, locked_at: null })
      .eq('id', id);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  // -----------------------------------------------------------------------
  // Download
  // -----------------------------------------------------------------------

  async download(id: string): Promise<Blob> {
    const { data: doc } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (!doc?.file_path) throw new Error('Aucun fichier associé');
    const blob = await downloadFile(DOCUMENTS_BUCKET, doc.file_path);
    if (!blob) throw new Error('Erreur lors du téléchargement');

    // Best-effort increment download counter
    await supabase
      .from('documents')
      .update({ download_count: (doc as any).download_count ? (doc as any).download_count + 1 : 1 })
      .eq('id', id)
      .then(() => {});

    return blob;
  },

  // -----------------------------------------------------------------------
  // Workflow
  // -----------------------------------------------------------------------

  async startWorkflow(id: string, templateId: string): Promise<void> {
    const userId = await requireAuth();

    // P0-W001: Validation pre-lancement obligatoire
    const { data: template, error: tplError } = await supabase
      .from('workflow_templates')
      .select('steps_config, name, is_active')
      .eq('id', templateId)
      .single();

    if (tplError || !template) {
      throw new Error('Template de circuit introuvable');
    }
    if (!template.is_active) {
      throw new Error('Ce template de circuit est desactive');
    }

    const steps = (template.steps_config || []) as Array<{
      name?: string;
      type?: string;
      assignees?: unknown[];
    }>;
    if (steps.length === 0) {
      throw new Error('Le circuit doit contenir au moins une etape');
    }
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.name || !step.type) {
        throw new Error(`Etape ${i + 1} : le nom et le type sont obligatoires`);
      }
    }

    // P0-S002: Server-side quota check
    const { data: doc } = await supabase
      .from('documents')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (doc?.organization_id) {
      const { data: quotaResult } = await supabase.functions.invoke('check-signature-quota', {
        body: { organization_id: doc.organization_id, feature: 'basic_workflow' },
      });
      if (quotaResult && !quotaResult.allowed) {
        throw new Error(
          quotaResult.reason === 'FEATURE_NOT_AVAILABLE'
            ? "Cette fonctionnalite n'est pas disponible avec votre plan."
            : 'Quota depasse. Veuillez upgrader votre plan.'
        );
      }
    }

    const { error } = await supabase.from('workflow_instances').insert({
      template_id: templateId,
      document_id: id,
      initiated_by: userId,
      status: 'in_progress',
      name: template.name,
    });

    if (error) throw new Error(parseSupabaseError(error).message);

    await supabase.from('documents').update({ status: 'pending' }).eq('id', id);
  },

  // -----------------------------------------------------------------------
  // Document Types
  // -----------------------------------------------------------------------

  async getTypes(): Promise<DocumentType[]> {
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || []).map(
      (dt: any) =>
        ({
          id: dt.id,
          name: dt.name,
          description: dt.description || '',
          allowed_extensions: dt.allowed_extensions || [],
          max_size: dt.max_file_size_mb || 50,
          requires_signature: dt.requires_approval || false,
          requires_paraph: false,
          paraph_all_pages: false,
        }) as unknown as DocumentType
    );
  },

  async createType(data: Partial<DocumentType>): Promise<DocumentType> {
    const userId = await requireAuth();
    const orgId = await getUserOrgId(userId);

    const { data: dt, error } = await supabase
      .from('document_types')
      .insert({
        organization_id: orgId,
        name: data.name,
        description: data.description,
        allowed_extensions: data.allowed_extensions,
        max_file_size_mb: data.max_size,
        requires_approval: data.requires_signature,
      })
      .select()
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return dt as unknown as DocumentType;
  },

  // -----------------------------------------------------------------------
  // Basic Annotations (legacy)
  // -----------------------------------------------------------------------

  async getAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
    const { data, error } = await supabase
      .from('document_annotations')
      .select('*, user:profiles!document_annotations_user_id_fkey(id, first_name, last_name)')
      .eq('document_id', documentId)
      .order('created_at');

    if (error) throw new Error(parseSupabaseError(error).message);
    return (data || []).map(mapAnnotation);
  },

  async saveAnnotations(
    documentId: string,
    annotations: DocumentAnnotation[]
  ): Promise<DocumentAnnotation[]> {
    const userId = await requireAuth();

    // Replace all annotations for this document
    await supabase.from('document_annotations').delete().eq('document_id', documentId);

    if (annotations.length > 0) {
      const rows = annotations.map((a) => ({
        document_id: documentId,
        user_id: userId,
        page_number: a.page,
        x_position: a.x,
        y_position: a.y,
        width: a.width,
        height: a.height,
        content: a.content,
        annotation_type: a.type,
        color: a.color,
      }));

      const { error } = await supabase.from('document_annotations').insert(rows);
      if (error) throw new Error(parseSupabaseError(error).message);
    }

    return this.getAnnotations(documentId);
  },

  async addAnnotation(
    documentId: string,
    annotation: Omit<DocumentAnnotation, 'id' | 'createdAt'>
  ): Promise<DocumentAnnotation> {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('document_annotations')
      .insert({
        document_id: documentId,
        user_id: userId,
        page_number: annotation.page,
        x_position: annotation.x,
        y_position: annotation.y,
        width: annotation.width,
        height: annotation.height,
        content: annotation.content,
        annotation_type: annotation.type,
        color: annotation.color,
      })
      .select('*, user:profiles!document_annotations_user_id_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapAnnotation(data);
  },

  async updateAnnotation(
    documentId: string,
    annotationId: string,
    data: Partial<DocumentAnnotation>
  ): Promise<DocumentAnnotation> {
    const updateData: Record<string, unknown> = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.x !== undefined) updateData.x_position = data.x;
    if (data.y !== undefined) updateData.y_position = data.y;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;

    const { data: updated, error } = await supabase
      .from('document_annotations')
      .update(updateData)
      .eq('id', annotationId)
      .eq('document_id', documentId)
      .select('*, user:profiles!document_annotations_user_id_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapAnnotation(updated);
  },

  async deleteAnnotation(documentId: string, annotationId: string): Promise<void> {
    const { error } = await supabase
      .from('document_annotations')
      .delete()
      .eq('id', annotationId)
      .eq('document_id', documentId);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  // -----------------------------------------------------------------------
  // Validation Workflow
  // -----------------------------------------------------------------------

  async getValidationStatus(documentId: string): Promise<ValidationSummary> {
    const [{ data: doc }, { count: totalAnnotations }, { count: resolvedAnnotations }] =
      await Promise.all([
        supabase.from('documents').select('status, created_by').eq('id', documentId).single(),
        supabase
          .from('document_annotations')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', documentId),
        supabase
          .from('document_annotations')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', documentId)
          .eq('is_resolved', true),
      ]);

    const { data: instance } = await supabase
      .from('workflow_instances')
      .select(
        '*, initiated_by_user:profiles!workflow_instances_initiated_by_fkey(id, first_name, last_name)'
      )
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const userId = await requireAuth();
    const total = totalAnnotations || 0;
    const resolved = resolvedAnnotations || 0;
    const status = (instance?.status || doc?.status || 'draft') as ValidationStatus;
    const isOwner = doc?.created_by === userId;

    return {
      status,
      status_display: getStatusDisplay(status),
      submitted_at: instance?.created_at || null,
      submitted_by: instance?.initiated_by_user
        ? {
            id: instance.initiated_by_user.id,
            name: `${instance.initiated_by_user.first_name} ${instance.initiated_by_user.last_name}`,
          }
        : null,
      completed_at: instance?.completed_at || null,
      completed_by: null,
      notes: '',
      comments: { total, resolved, pending: total - resolved },
      can_submit: isOwner && status === 'draft',
      can_validate: !isOwner && (status === 'submitted' || status === 'under_review'),
    };
  },

  async submitForReview(documentId: string, _notes?: string): Promise<ValidationActionResponse> {
    const { error } = await supabase
      .from('documents')
      .update({ status: 'pending' })
      .eq('id', documentId);

    if (error) throw new Error(parseSupabaseError(error).message);
    return { status: 'success', validation_status: 'submitted' };
  },

  async startReview(documentId: string): Promise<ValidationActionResponse> {
    const { error } = await supabase
      .from('documents')
      .update({ status: 'pending' })
      .eq('id', documentId);

    if (error) throw new Error(parseSupabaseError(error).message);
    return { status: 'success', validation_status: 'under_review' };
  },

  async requestChanges(
    documentId: string,
    comments: string,
    annotations?: ContextualAnnotationInput[]
  ): Promise<ValidationActionResponse> {
    const userId = await requireAuth();

    await supabase.from('documents').update({ status: 'draft' }).eq('id', documentId);

    if (comments) {
      await supabase.from('document_annotations').insert({
        document_id: documentId,
        user_id: userId,
        content: comments,
        annotation_type: 'comment',
      });
    }

    if (annotations && annotations.length > 0) {
      const rows = annotations.map((a) => ({
        document_id: documentId,
        user_id: userId,
        page_number: a.page_number,
        x_position: a.position?.x,
        y_position: a.position?.y,
        content: a.content.text,
        annotation_type: a.annotation_type || 'comment',
        color: a.color,
      }));
      await supabase.from('document_annotations').insert(rows);
    }

    return { status: 'success', validation_status: 'changes_requested' };
  },

  async validateDocument(
    documentId: string,
    _comments?: string
  ): Promise<ValidationActionResponse> {
    const userId = await requireAuth();

    const { error } = await supabase
      .from('documents')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (error) throw new Error(parseSupabaseError(error).message);
    return { status: 'success', validation_status: 'validated' };
  },

  async rejectDocument(documentId: string, reason: string): Promise<ValidationActionResponse> {
    const userId = await requireAuth();

    await supabase.from('documents').update({ status: 'rejected' }).eq('id', documentId);

    await supabase.from('document_annotations').insert({
      document_id: documentId,
      user_id: userId,
      content: reason,
      annotation_type: 'comment',
    });

    return { status: 'success', validation_status: 'rejected' };
  },

  async getValidationHistory(documentId: string): Promise<ValidationHistoryEntry[]> {
    const { data: annotations } = await supabase
      .from('document_annotations')
      .select('*, user:profiles!document_annotations_user_id_fkey(id, first_name, last_name)')
      .eq('document_id', documentId)
      .order('created_at');

    const { data: auditLogs } = await supabase
      .from('advist_audit_logs')
      .select('*, user:profiles!advist_audit_logs_user_id_fkey(id, first_name, last_name)')
      .eq('resource_type', 'documents')
      .eq('resource_id', documentId)
      .order('created_at');

    const history: ValidationHistoryEntry[] = [];

    for (const a of annotations || []) {
      history.push({
        type: 'comment',
        timestamp: a.created_at,
        user: a.user ? { id: a.user.id, name: `${a.user.first_name} ${a.user.last_name}` } : null,
        content: a.content,
        resolved: a.is_resolved,
        context: a.page_number ? { type: 'page', section_id: '', page: a.page_number } : undefined,
      });
    }

    for (const log of auditLogs || []) {
      history.push({
        type: 'workflow_action',
        timestamp: log.created_at,
        user: log.user
          ? { id: log.user.id, name: `${log.user.first_name} ${log.user.last_name}` }
          : null,
        action: log.action,
        comment: (log.details as any)?.comment,
        step: (log.details as any)?.step,
      });
    }

    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return history;
  },

  // -----------------------------------------------------------------------
  // Contextual Annotations
  // -----------------------------------------------------------------------

  async getContextualAnnotations(
    documentId: string,
    versionNumber?: number
  ): Promise<ContextualAnnotation[]> {
    const { data, error } = await supabase
      .from('document_annotations')
      .select(
        '*, user:profiles!document_annotations_user_id_fkey(id, first_name, last_name), resolver:profiles!document_annotations_resolved_by_fkey(id, first_name, last_name)'
      )
      .eq('document_id', documentId)
      .order('created_at');

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || []).map((a: any) => mapContextualAnnotation(a, documentId, versionNumber));
  },

  async createContextualAnnotation(
    documentId: string,
    annotation: ContextualAnnotationInput
  ): Promise<ContextualAnnotation> {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('document_annotations')
      .insert({
        document_id: documentId,
        user_id: userId,
        page_number: annotation.page_number,
        x_position: annotation.position?.x,
        y_position: annotation.position?.y,
        content: annotation.content.text,
        annotation_type: annotation.annotation_type || 'comment',
        color: annotation.color,
      })
      .select('*, user:profiles!document_annotations_user_id_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapContextualAnnotation(data, documentId);
  },

  async resolveAnnotation(documentId: string, annotationId: string): Promise<ContextualAnnotation> {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('document_annotations')
      .update({
        is_resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', annotationId)
      .eq('document_id', documentId)
      .select(
        '*, user:profiles!document_annotations_user_id_fkey(id, first_name, last_name), resolver:profiles!document_annotations_resolved_by_fkey(id, first_name, last_name)'
      )
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapContextualAnnotation(data, documentId);
  },

  // -----------------------------------------------------------------------
  // Version Comparison
  // -----------------------------------------------------------------------

  async compareVersions(
    documentId: string,
    versionA: number,
    versionB: number
  ): Promise<VersionComparison> {
    const { data: versions, error } = await supabase
      .from('document_versions')
      .select(
        '*, created_by_user:profiles!document_versions_created_by_fkey(id, first_name, last_name)'
      )
      .eq('document_id', documentId)
      .in('version_number', [versionA, versionB]);

    if (error) throw new Error(parseSupabaseError(error).message);

    const va = versions?.find((v: any) => v.version_number === versionA);
    const vb = versions?.find((v: any) => v.version_number === versionB);
    if (!va || !vb) throw new Error('Version(s) non trouvée(s)');

    return {
      version_a: {
        number: (va as any).version_number,
        created_at: (va as any).created_at,
        created_by: (va as any).created_by_user
          ? `${(va as any).created_by_user.first_name} ${(va as any).created_by_user.last_name}`
          : '',
        file_size: (va as any).file_size || 0,
      },
      version_b: {
        number: (vb as any).version_number,
        created_at: (vb as any).created_at,
        created_by: (vb as any).created_by_user
          ? `${(vb as any).created_by_user.first_name} ${(vb as any).created_by_user.last_name}`
          : '',
        file_size: (vb as any).file_size || 0,
      },
      changes: [],
      summary: { additions: 0, deletions: 0, modifications: 0 },
    };
  },
};

// ===========================================================================
// Type Definitions (preserved — used by consumers)
// ===========================================================================

export interface DocumentAnnotation {
  id: string;
  type: 'highlight' | 'comment' | 'stamp' | 'drawing' | 'text' | 'shape';
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  author: string;
  authorId: string;
  createdAt: string;
  data?: any;
}

export type ValidationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'validated'
  | 'rejected';

export interface ValidationSummary {
  status: ValidationStatus;
  status_display: string;
  submitted_at: string | null;
  submitted_by: { id: string; name: string } | null;
  completed_at: string | null;
  completed_by: { id: string; name: string } | null;
  notes: string;
  comments: {
    total: number;
    resolved: number;
    pending: number;
  };
  can_submit: boolean;
  can_validate: boolean;
}

export interface ValidationActionResponse {
  status: string;
  validation_status: ValidationStatus;
}

export interface ValidationHistoryEntry {
  type: 'comment' | 'workflow_action';
  timestamp: string;
  user: { id: string; name: string } | null;
  content?: string;
  action?: string;
  comment?: string;
  step?: string;
  context?: {
    type: string;
    section_id: string;
    page: number;
  };
  resolved?: boolean;
}

export type ContextType =
  | 'page'
  | 'section'
  | 'paragraph'
  | 'table'
  | 'graph'
  | 'image'
  | 'header'
  | 'footer';

export interface ContextualAnnotation {
  id: string;
  document: number;
  version: number;
  annotation_type: 'highlight' | 'comment' | 'correction' | 'question';
  page_number: number;
  position: { x: number; y: number };
  content: { text: string };
  color: string;
  context_type: ContextType;
  context_type_display: string;
  section_id: string;
  section_title: string;
  element_selector: string;
  quoted_text: string;
  author: string;
  author_name: string;
  is_private: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  workflow_step: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContextualAnnotationInput {
  annotation_type?: 'highlight' | 'comment' | 'correction' | 'question';
  page_number?: number;
  position?: { x: number; y: number };
  content: { text: string };
  color?: string;
  context_type: ContextType;
  section_id?: string;
  section_title?: string;
  element_selector?: string;
  quoted_text?: string;
  is_private?: boolean;
}

export interface VersionComparison {
  version_a: {
    number: number;
    created_at: string;
    created_by: string;
    file_size: number;
  };
  version_b: {
    number: number;
    created_at: string;
    created_by: string;
    file_size: number;
  };
  changes: VersionChange[];
  summary: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export interface VersionChange {
  type: 'addition' | 'deletion' | 'modification';
  page?: number;
  section?: string;
  old_content?: string;
  new_content?: string;
  description: string;
}
