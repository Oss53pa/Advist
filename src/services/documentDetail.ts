/**
 * Document detail side-panel data service.
 *
 * Provides the per-document data shown in DocumentDetailPage tabs:
 * comments, versions, signatures, and the in-flight workflow instance.
 *
 * All calls are resilient: errors return safe empty results so a missing
 * table or transient failure degrades to "no data" rather than crashing
 * the detail page.
 */
import { supabase } from '../lib/supabase';

export interface DocCommentItem {
  id: string;
  author: string;
  content: string;
  date: string; // pre-formatted dd MMM HH:mm
  authorId: string;
  parentId: string | null;
}

export interface DocVersionItem {
  id: string;
  version: number;
  by: string;
  comment: string;
  date: string;
  fileHash: string | null;
  fileSize: number;
}

export interface DocSignatureItem {
  id: string;
  signer: { first_name: string; last_name: string };
  status: 'pending' | 'completed' | 'rejected' | 'expired' | 'revoked';
  signed_at?: string;
  deadline?: string;
  certificate_id?: string;
}

export interface DocWorkflowStep {
  name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled' | 'failed';
  assignee: string;
  date?: string;
  deadline?: string;
}

export interface DocWorkflowSummary {
  template: string;
  status: string;
  current_step: number;
  steps: DocWorkflowStep[];
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function fullName(p: { first_name?: string | null; last_name?: string | null } | null | undefined) {
  if (!p) return 'Utilisateur';
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Utilisateur';
}

export async function getDocumentComments(documentId: string): Promise<DocCommentItem[]> {
  try {
    const { data, error } = await supabase
      .from('document_comments')
      .select(
        'id, content, parent_id, created_at, user_id, is_deleted, profiles:user_id(first_name, last_name)'
      )
      .eq('document_id', documentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map((r) => {
      const row = r as {
        id: string;
        content: string;
        parent_id: string | null;
        created_at: string;
        user_id: string;
        profiles?: { first_name?: string; last_name?: string } | null;
      };
      return {
        id: row.id,
        author: fullName(row.profiles),
        authorId: row.user_id,
        parentId: row.parent_id,
        content: row.content,
        date: fmtDateTime(row.created_at),
      };
    });
  } catch {
    return [];
  }
}

export async function getDocumentVersions(documentId: string): Promise<DocVersionItem[]> {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select(
        'id, version_number, changes_summary, created_at, file_size, file_hash, profiles:created_by(first_name, last_name)'
      )
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });
    if (error || !data) return [];
    return data.map((r) => {
      const row = r as {
        id: string;
        version_number: number;
        changes_summary: string | null;
        created_at: string;
        file_size: number | null;
        file_hash: string | null;
        profiles?: { first_name?: string; last_name?: string } | null;
      };
      return {
        id: row.id,
        version: row.version_number,
        by: fullName(row.profiles),
        comment: row.changes_summary || '—',
        date: new Date(row.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        fileHash: row.file_hash,
        fileSize: row.file_size || 0,
      };
    });
  } catch {
    return [];
  }
}

export async function getDocumentSignatures(documentId: string): Promise<DocSignatureItem[]> {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .select(
        'id, status, signed_at, deadline, signature_hash, profiles:user_id(first_name, last_name)'
      )
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map((r) => {
      const row = r as {
        id: string;
        status: string;
        signed_at: string | null;
        deadline: string | null;
        signature_hash: string | null;
        profiles?: { first_name?: string; last_name?: string } | null;
      };
      // Map signature_status enum (signed/pending/rejected/expired/revoked)
      // to the UI's narrower vocabulary.
      const status: DocSignatureItem['status'] =
        row.status === 'signed' ? 'completed' : (row.status as DocSignatureItem['status']);
      return {
        id: row.id,
        signer: {
          first_name: row.profiles?.first_name || '',
          last_name: row.profiles?.last_name || '',
        },
        status,
        signed_at: row.signed_at || undefined,
        deadline: row.deadline || undefined,
        certificate_id: row.signature_hash || undefined,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Returns the most recent workflow instance attached to this document
 * (with its steps and per-step assignee), or null if none exists.
 */
export async function getDocumentWorkflow(documentId: string): Promise<DocWorkflowSummary | null> {
  try {
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select(
        'id, name, status, current_step, workflow_templates:template_id(name), workflow_steps(id, step_number, name, status, due_date, completed_at, workflow_assignees(profiles:user_id(first_name, last_name)))'
      )
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!instance) return null;
    const inst = instance as {
      id: string;
      name: string;
      status: string;
      current_step: number;
      workflow_templates?: { name?: string } | { name?: string }[] | null;
      workflow_steps?: Array<{
        step_number: number;
        name: string;
        status: string;
        due_date: string | null;
        completed_at: string | null;
        workflow_assignees?: Array<{
          profiles?: { first_name?: string; last_name?: string } | null;
        }>;
      }>;
    };
    const templateName = Array.isArray(inst.workflow_templates)
      ? inst.workflow_templates[0]?.name
      : inst.workflow_templates?.name;
    const steps: DocWorkflowStep[] = (inst.workflow_steps || [])
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => {
        const firstAssignee = s.workflow_assignees?.[0]?.profiles;
        return {
          name: s.name,
          status: s.status as DocWorkflowStep['status'],
          assignee: firstAssignee
            ? `${firstAssignee.first_name?.[0] || ''}. ${firstAssignee.last_name || ''}`.trim()
            : '—',
          date: s.completed_at ? fmtDate(s.completed_at) : undefined,
          deadline: !s.completed_at && s.due_date ? fmtDate(s.due_date) : undefined,
        };
      });
    return {
      template: templateName || inst.name,
      status: inst.status,
      current_step: inst.current_step,
      steps,
    };
  } catch {
    return null;
  }
}
