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

/**
 * Marker for "this person is not a member of the current organisation".
 * An external is any profile whose `organization_id` differs from the
 * document's org (a B2B partner) OR is NULL (a guest signatory invited
 * by email and never attached to an org). UI shows a discreet "Externe"
 * pill + the partner org name / job title when present.
 */
export interface ExternalContext {
  isExternal: boolean;
  organizationId: string | null;
  organizationName?: string;
  jobTitle?: string;
}

export interface DocCommentItem {
  id: string;
  author: string;
  content: string;
  date: string; // pre-formatted dd MMM HH:mm
  authorId: string;
  parentId: string | null;
  authorExternal: ExternalContext;
}

export interface DocVersionItem {
  id: string;
  version: number;
  by: string;
  comment: string;
  date: string;
  fileHash: string | null;
  fileSize: number;
  byExternal: ExternalContext;
}

export interface DocSignatureItem {
  id: string;
  signer: { first_name: string; last_name: string; email?: string };
  status: 'pending' | 'completed' | 'rejected' | 'expired' | 'revoked';
  signed_at?: string;
  deadline?: string;
  certificate_id?: string;
  signerExternal: ExternalContext;
}

export interface DocWorkflowStep {
  name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled' | 'failed';
  assignee: string;
  assigneeEmail?: string;
  date?: string;
  deadline?: string;
  assigneeExternal: ExternalContext;
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

/**
 * Compute the "is this person external?" context from a joined profile
 * row that may carry `organization_id` + nested `organization { name }`.
 * NOT_EXTERNAL is returned for in-org members and when the doc org is
 * unknown (defensive — avoids false "externe" badges on legacy callers).
 */
function extractExternal(
  profile:
    | {
        organization_id?: string | null;
        job_title?: string | null;
        organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
      }
    | null
    | undefined,
  currentOrgId: string | null | undefined
): ExternalContext {
  const orgId = profile?.organization_id ?? null;
  const jobTitle = profile?.job_title ?? undefined;
  const orgEmbed = Array.isArray(profile?.organization)
    ? profile?.organization?.[0]
    : profile?.organization;
  const orgName = orgEmbed?.name;
  if (!currentOrgId) {
    return { isExternal: false, organizationId: orgId, organizationName: orgName, jobTitle };
  }
  const isExternal = orgId !== currentOrgId; // covers both NULL and other-org
  return {
    isExternal,
    organizationId: orgId,
    organizationName: isExternal ? orgName : undefined,
    jobTitle,
  };
}

export async function getDocumentComments(
  documentId: string,
  currentOrgId?: string | null
): Promise<DocCommentItem[]> {
  try {
    const { data, error } = await supabase
      .from('document_comments')
      .select(
        `id, content, parent_id, created_at, user_id, is_deleted,
         profiles:user_id (
           first_name, last_name, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         )`
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
        profiles?: {
          first_name?: string;
          last_name?: string;
          organization_id?: string | null;
          job_title?: string | null;
          organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
        } | null;
      };
      return {
        id: row.id,
        author: fullName(row.profiles),
        authorId: row.user_id,
        parentId: row.parent_id,
        content: row.content,
        date: fmtDateTime(row.created_at),
        authorExternal: extractExternal(row.profiles, currentOrgId),
      };
    });
  } catch {
    return [];
  }
}

export async function getDocumentVersions(
  documentId: string,
  currentOrgId?: string | null
): Promise<DocVersionItem[]> {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select(
        `id, version_number, changes_summary, created_at, file_size, file_hash,
         profiles:created_by (
           first_name, last_name, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         )`
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
        profiles?: {
          first_name?: string;
          last_name?: string;
          organization_id?: string | null;
          job_title?: string | null;
          organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
        } | null;
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
        byExternal: extractExternal(row.profiles, currentOrgId),
      };
    });
  } catch {
    return [];
  }
}

export async function getDocumentSignatures(
  documentId: string,
  currentOrgId?: string | null
): Promise<DocSignatureItem[]> {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .select(
        `id, status, signed_at, expires_at, signature_hash,
         profiles:user_id (
           first_name, last_name, email, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         )`
      )
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map((r) => {
      const row = r as {
        id: string;
        status: string;
        signed_at: string | null;
        expires_at: string | null;
        signature_hash: string | null;
        profiles?: {
          first_name?: string;
          last_name?: string;
          email?: string;
          organization_id?: string | null;
          job_title?: string | null;
          organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
        } | null;
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
          email: row.profiles?.email,
        },
        status,
        signed_at: row.signed_at || undefined,
        deadline: row.expires_at || undefined,
        certificate_id: row.signature_hash || undefined,
        signerExternal: extractExternal(row.profiles, currentOrgId),
      };
    });
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------- */
/* Validation panel data (inline ValidationWorkflowPanel)                 */
/* -------------------------------------------------------------------- */

export type ValidationStatusValue =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'validated'
  | 'rejected';

export interface ValidationSummaryShape {
  status: ValidationStatusValue;
  status_display: string;
  submitted_at: string | null;
  submitted_by: { id: string; name: string } | null;
  submitted_by_external?: ExternalContext;
  completed_at: string | null;
  completed_by: { id: string; name: string } | null;
  completed_by_external?: ExternalContext;
  notes: string;
  comments: {
    total: number;
    resolved: number;
    pending: number;
  };
  can_submit: boolean;
  can_validate: boolean;
}

export interface ValidationHistoryItem {
  type: 'comment' | 'workflow_action';
  timestamp: string;
  user: { id: string; name: string } | null;
  userExternal?: ExternalContext;
  content?: string;
  action?: string;
  comment?: string;
  step?: string;
  resolved?: boolean;
}

const VALIDATION_STATUS_LABELS: Record<ValidationStatusValue, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  under_review: 'En révision',
  changes_requested: 'Modifications demandées',
  validated: 'Validé',
  rejected: 'Rejeté',
};

function documentStatusToValidation(status: string | null | undefined): ValidationStatusValue {
  switch ((status || '').toLowerCase()) {
    case 'approved':
    case 'validated':
      return 'validated';
    case 'rejected':
      return 'rejected';
    case 'pending_review':
    case 'submitted':
    case 'under_review':
      return 'under_review';
    case 'changes_requested':
      return 'changes_requested';
    case 'draft':
    default:
      return 'draft';
  }
}

/**
 * Build the inline-panel summary for a document. Pulls:
 *  - document status / submitted-by from `documents`
 *  - completion data from latest workflow_instances when status is final
 *  - comment counts (total / resolved / pending) from document_annotations
 */
export async function getValidationSummary(
  documentId: string,
  opts: { currentUserId?: string; isOwner?: boolean; currentOrgId?: string | null } = {}
): Promise<ValidationSummaryShape> {
  const empty: ValidationSummaryShape = {
    status: 'draft',
    status_display: VALIDATION_STATUS_LABELS.draft,
    submitted_at: null,
    submitted_by: null,
    completed_at: null,
    completed_by: null,
    notes: '',
    comments: { total: 0, resolved: 0, pending: 0 },
    can_submit: !!opts.isOwner,
    can_validate: false,
  };
  try {
    const [docRes, wfRes, annTotalRes, annResolvedRes] = await Promise.all([
      supabase
        .from('documents')
        .select(
          `status, description, created_at,
           profiles:created_by (
             id, first_name, last_name, organization_id, job_title,
             organization:organizations!profiles_organization_id_fkey ( id, name )
           )`
        )
        .eq('id', documentId)
        .maybeSingle(),
      supabase
        .from('workflow_instances')
        .select(
          `status, completed_at, cancelled_at,
           profiles:cancelled_by (
             id, first_name, last_name, organization_id, job_title,
             organization:organizations!profiles_organization_id_fkey ( id, name )
           )`
        )
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('document_annotations')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId),
      supabase
        .from('document_annotations')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId)
        .eq('is_resolved', true),
    ]);

    type ProfileWithOrg = {
      id?: string;
      first_name?: string;
      last_name?: string;
      organization_id?: string | null;
      job_title?: string | null;
      organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
    };
    const doc = docRes.data as {
      status?: string | null;
      description?: string | null;
      created_at?: string | null;
      profiles?: ProfileWithOrg | null;
    } | null;
    const wf = wfRes.data as {
      status?: string | null;
      completed_at?: string | null;
      cancelled_at?: string | null;
      profiles?: ProfileWithOrg | null;
    } | null;
    const status = documentStatusToValidation(doc?.status);
    const total = annTotalRes.count ?? 0;
    const resolved = annResolvedRes.count ?? 0;
    return {
      status,
      status_display: VALIDATION_STATUS_LABELS[status],
      submitted_at: doc?.created_at ?? null,
      submitted_by: doc?.profiles?.id
        ? { id: doc.profiles.id, name: fullName(doc.profiles) }
        : null,
      submitted_by_external: doc?.profiles
        ? extractExternal(doc.profiles, opts.currentOrgId)
        : undefined,
      completed_at: wf?.completed_at ?? wf?.cancelled_at ?? null,
      completed_by: wf?.profiles?.id ? { id: wf.profiles.id, name: fullName(wf.profiles) } : null,
      completed_by_external: wf?.profiles
        ? extractExternal(wf.profiles, opts.currentOrgId)
        : undefined,
      notes: doc?.description ?? '',
      comments: { total, resolved, pending: Math.max(0, total - resolved) },
      can_submit: !!opts.isOwner && status === 'draft',
      can_validate:
        status === 'submitted' || status === 'under_review' || status === 'changes_requested',
    };
  } catch {
    return empty;
  }
}

/** Build the inline-panel history (workflow_history + document_comments). */
export async function getValidationHistory(
  documentId: string,
  limit = 50,
  currentOrgId?: string | null
): Promise<ValidationHistoryItem[]> {
  const items: ValidationHistoryItem[] = [];
  try {
    const { data: wfRows } = await supabase
      .from('workflow_history')
      .select(
        `action, comment, created_at,
         workflow_steps:step_id ( name ),
         profiles:user_id (
           id, first_name, last_name, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         ),
         workflow_instances!inner ( document_id )`
      )
      .eq('workflow_instances.document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    type ProfileWithOrg = {
      id?: string;
      first_name?: string;
      last_name?: string;
      organization_id?: string | null;
      job_title?: string | null;
      organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
    };
    for (const r of wfRows ?? []) {
      const row = r as {
        action: string;
        comment: string | null;
        created_at: string;
        workflow_steps?: { name?: string } | { name?: string }[] | null;
        profiles?: ProfileWithOrg | null;
      };
      const step = Array.isArray(row.workflow_steps)
        ? row.workflow_steps[0]?.name
        : row.workflow_steps?.name;
      items.push({
        type: 'workflow_action',
        timestamp: row.created_at,
        user: row.profiles?.id ? { id: row.profiles.id, name: fullName(row.profiles) } : null,
        userExternal: row.profiles ? extractExternal(row.profiles, currentOrgId) : undefined,
        action: row.action,
        comment: row.comment ?? undefined,
        step,
      });
    }
  } catch {
    /* tolerate */
  }
  try {
    const { data: commentRows } = await supabase
      .from('document_comments')
      .select(
        `content, created_at,
         profiles:user_id (
           id, first_name, last_name, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         )`
      )
      .eq('document_id', documentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    for (const r of commentRows ?? []) {
      const row = r as {
        content: string;
        created_at: string;
        profiles?: {
          id?: string;
          first_name?: string;
          last_name?: string;
          organization_id?: string | null;
          job_title?: string | null;
          organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
        } | null;
      };
      items.push({
        type: 'comment',
        timestamp: row.created_at,
        user: row.profiles?.id ? { id: row.profiles.id, name: fullName(row.profiles) } : null,
        userExternal: row.profiles ? extractExternal(row.profiles, currentOrgId) : undefined,
        content: row.content,
      });
    }
  } catch {
    /* tolerate */
  }
  items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  return items.slice(0, limit);
}

/* -------------------------------------------------------------------- */
/* Full workflow instance (for validationReportService.generateReport)    */
/* -------------------------------------------------------------------- */

export async function getFullWorkflowInstanceForDocument(
  documentId: string
): Promise<unknown | null> {
  try {
    const { data } = await supabase
      .from('workflow_instances')
      .select(
        `id, name, status, current_step, created_at, completed_at,
         template:template_id ( id, name, steps_config ),
         initiated_by:started_by (
           id, first_name, last_name, email, role, organization_id, job_title,
           organization:organizations!profiles_organization_id_fkey ( id, name )
         ),
         workflow_steps (
           id, step_number, name, step_type, status, due_date, completed_at,
           workflow_assignees (
             id, status, comment, acted_at,
             user:user_id (
               id, first_name, last_name, email, role, organization_id, job_title,
               organization:organizations!profiles_organization_id_fkey ( id, name )
             )
           )
         )`
      )
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const row = data as Record<string, unknown>;
    type UserWithOrg = {
      id?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      role?: string;
      organization_id?: string | null;
      job_title?: string | null;
      organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
    };
    const template =
      (row.template as
        | { id?: string; name?: string; steps_config?: unknown[] }
        | { id?: string; name?: string; steps_config?: unknown[] }[]
        | null) || null;
    const tpl = Array.isArray(template) ? template[0] : template;
    const initBy = (row.initiated_by as UserWithOrg | UserWithOrg[] | null) || null;
    const initiator = Array.isArray(initBy) ? initBy[0] : initBy;
    const initiatorOrg = Array.isArray(initiator?.organization)
      ? initiator?.organization?.[0]
      : initiator?.organization;
    const steps = (row.workflow_steps as Array<Record<string, unknown>>) ?? [];
    return {
      id: row.id,
      template: {
        id: tpl?.id || '',
        name: tpl?.name || 'Workflow',
        steps_config: tpl?.steps_config || [],
      },
      template_snapshot: {
        id: tpl?.id || '',
        name: tpl?.name || 'Workflow',
        steps_config: tpl?.steps_config || [],
      },
      status: row.status || 'in_progress',
      current_step: row.current_step ?? 0,
      initiated_by: {
        id: initiator?.id || '',
        first_name: initiator?.first_name || '',
        last_name: initiator?.last_name || '',
        email: initiator?.email || '',
        role: initiator?.role,
        // Extra org info — `validationReportService.generateReport()` will
        // tolerate the extra field and external-aware callers can read it.
        organization_id: initiator?.organization_id ?? null,
        organization_name: initiatorOrg?.name,
        job_title: initiator?.job_title,
      },
      started_at: row.created_at || new Date().toISOString(),
      completed_at: row.completed_at,
      steps: steps
        .slice()
        .sort((a, b) => ((a.step_number as number) ?? 0) - ((b.step_number as number) ?? 0))
        .map((s) => {
          const assignees = ((s.workflow_assignees as Array<Record<string, unknown>>) ?? []).map(
            (a) => {
              const user = (a.user as UserWithOrg | UserWithOrg[] | null) || null;
              const u = Array.isArray(user) ? user[0] : user;
              const uOrg = Array.isArray(u?.organization) ? u?.organization?.[0] : u?.organization;
              return {
                id: a.id,
                status: a.status,
                comment: a.comment,
                acted_at: a.acted_at,
                user: {
                  id: u?.id || '',
                  first_name: u?.first_name || '',
                  last_name: u?.last_name || '',
                  email: u?.email || '',
                  role: u?.role,
                  organization_id: u?.organization_id ?? null,
                  organization_name: uOrg?.name,
                  job_title: u?.job_title,
                },
              };
            }
          );
          return {
            id: s.id,
            step_number: s.step_number,
            name: s.name,
            type: s.step_type || 'validation',
            status: s.status,
            deadline: s.due_date,
            assignees,
          };
        }),
    };
  } catch {
    return null;
  }
}

/**
 * Returns the most recent workflow instance attached to this document
 * (with its steps and per-step assignee), or null if none exists.
 */
export async function getDocumentWorkflow(
  documentId: string,
  currentOrgId?: string | null
): Promise<DocWorkflowSummary | null> {
  try {
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select(
        `id, name, status, current_step,
         workflow_templates:template_id ( name ),
         workflow_steps (
           id, step_number, name, status, due_date, completed_at,
           workflow_assignees (
             profiles:user_id (
               first_name, last_name, email, organization_id, job_title,
               organization:organizations!profiles_organization_id_fkey ( id, name )
             )
           )
         )`
      )
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!instance) return null;
    type AssigneeProfile = {
      first_name?: string;
      last_name?: string;
      email?: string;
      organization_id?: string | null;
      job_title?: string | null;
      organization?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
    };
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
          profiles?: AssigneeProfile | null;
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
          assigneeEmail: firstAssignee?.email,
          date: s.completed_at ? fmtDate(s.completed_at) : undefined,
          deadline: !s.completed_at && s.due_date ? fmtDate(s.due_date) : undefined,
          assigneeExternal: extractExternal(firstAssignee, currentOrgId),
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
