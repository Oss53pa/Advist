/**
 * Workflows overview service — real per-org / per-user data for the
 * Workflows page (my tasks, active instances, templates) plus tab counts.
 * Replaces the hardcoded mocks. Resilient: returns [] / 0 on error.
 *
 * Data model (Atlas Studio / Advist):
 *   workflow_assignees (user_id, status) → workflow_steps (instance_id,
 *   name, step_type, due_date) → workflow_instances (name, document_id,
 *   organization_id, status) → documents (title)
 */
import { supabase } from '../lib/supabase';

export interface WorkflowTask {
  id: string;
  document: { title: string; id?: string; amount?: number };
  step: { name: string; type: string; requires_paraph?: boolean };
  workflow: { id: string; is_fast_track?: boolean; signature_mode?: string };
  deadline: string | null;
  assignedBy: { name: string };
  canDelegate: boolean;
  isParallelSignature: boolean;
}

export interface WorkflowInstanceRow {
  id: string;
  name: string;
  status: string;
  documentTitle: string | null;
  currentStep: number | null;
  dueDate: string | null;
  createdAt: string | null;
}

export interface WorkflowTemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  stepsCount: number;
  isActive: boolean;
  updatedAt: string | null;
}

/** Tasks pending the current user's action. */
export async function getMyTasks(userId: string): Promise<WorkflowTask[]> {
  try {
    const { data, error } = await supabase
      .from('workflow_assignees')
      .select(
        `id, status,
         workflow_steps (
           name, step_type, due_date,
           workflow_instances ( id, name, documents ( title ) )
         )`
      )
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(50);

    if (error || !data) return [];
    return data.map((row) => {
      const step = (
        Array.isArray(row.workflow_steps) ? row.workflow_steps[0] : row.workflow_steps
      ) as {
        name?: string;
        step_type?: string;
        due_date?: string;
        workflow_instances?:
          | { id?: string; name?: string; documents?: { title?: string } | { title?: string }[] }
          | { id?: string; name?: string; documents?: { title?: string } | { title?: string }[] }[];
      } | null;
      const inst = (
        Array.isArray(step?.workflow_instances)
          ? step?.workflow_instances[0]
          : step?.workflow_instances
      ) as
        | { id?: string; name?: string; documents?: { title?: string } | { title?: string }[] }
        | undefined;
      const doc = Array.isArray(inst?.documents) ? inst?.documents[0] : inst?.documents;
      return {
        id: row.id as string,
        document: { title: doc?.title || inst?.name || 'Document', id: inst?.id },
        step: { name: step?.name || 'Étape', type: step?.step_type || 'approval' },
        workflow: { id: inst?.id || (row.id as string) },
        deadline: step?.due_date ?? null,
        assignedBy: { name: '' },
        canDelegate: true,
        isParallelSignature: false,
      };
    });
  } catch {
    return [];
  }
}

/** Active workflow instances for the org. */
export async function getActiveInstances(orgId: string): Promise<WorkflowInstanceRow[]> {
  try {
    const { data, error } = await supabase
      .from('workflow_instances')
      .select('id, name, status, current_step, due_date, created_at, documents ( title )')
      .eq('organization_id', orgId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data.map((row) => {
      const doc = Array.isArray(row.documents) ? row.documents[0] : row.documents;
      return {
        id: row.id as string,
        name: (row.name as string) || 'Workflow',
        status: (row.status as string) || 'active',
        documentTitle: (doc as { title?: string } | null)?.title ?? null,
        currentStep: (row.current_step as number) ?? null,
        dueDate: (row.due_date as string) ?? null,
        createdAt: (row.created_at as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}

/** Workflow templates for the org. */
export async function getTemplates(orgId: string): Promise<WorkflowTemplateRow[]> {
  try {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('id, name, description, category, steps_config, is_active, updated_at')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data.map((row) => {
      const steps = row.steps_config;
      const stepsCount = Array.isArray(steps) ? steps.length : 0;
      return {
        id: row.id as string,
        name: (row.name as string) || 'Modèle',
        description: (row.description as string) ?? null,
        category: (row.category as string) ?? null,
        stepsCount,
        isActive: (row.is_active as boolean) ?? true,
        updatedAt: (row.updated_at as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}

export interface WorkflowTabCounts {
  myTasks: number;
  activeInstances: number;
}

/** Counts for the tab badges. */
export async function getWorkflowTabCounts(
  orgId: string,
  userId: string
): Promise<WorkflowTabCounts> {
  const [myTasks, activeInstances] = await Promise.all([
    (async () => {
      try {
        const { count, error } = await supabase
          .from('workflow_assignees')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'pending');
        return error ? 0 : (count ?? 0);
      } catch {
        return 0;
      }
    })(),
    (async () => {
      try {
        const { count, error } = await supabase
          .from('workflow_instances')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['active', 'paused']);
        return error ? 0 : (count ?? 0);
      } catch {
        return 0;
      }
    })(),
  ]);
  return { myTasks, activeInstances };
}
