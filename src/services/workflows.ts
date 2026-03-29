/**
 * Workflows Service — Supabase Implementation
 *
 * Replaces Axios API calls with direct Supabase client queries.
 * Tables: workflow_templates, workflow_instances, workflow_steps,
 *         workflow_assignees, workflow_history
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';
import type {
  WorkflowTemplate,
  WorkflowInstance,
  Task,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function requireAuth(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  return user.id;
}

async function getUserOrgId(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();
  return data?.organization_id;
}

// ---------------------------------------------------------------------------
// Select fragments
// ---------------------------------------------------------------------------
const TEMPLATE_SELECT = `
  *,
  creator:profiles!workflow_templates_created_by_fkey(id, first_name, last_name, email)
`;

const INSTANCE_SELECT = `
  *,
  template:workflow_templates!workflow_instances_template_id_fkey(id, name, description, steps_config, category, is_active, version),
  document:documents!workflow_instances_document_id_fkey(id, title, status),
  started_by_user:profiles!workflow_instances_started_by_fkey(id, first_name, last_name, email)
`;

const STEP_SELECT = `
  *,
  assignees:workflow_assignees(
    id, user_id, status, comment, acted_at,
    user:profiles!workflow_assignees_user_id_fkey(id, first_name, last_name, email)
  )
`;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapTemplate(row: Record<string, any>): WorkflowTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    organization: row.organization_id,
    category: row.category || '',
    steps_config: row.steps_config || [],
    is_active: row.is_active ?? true,
    version: row.version || 1,
    is_system: row.is_system || false,
    created_by: row.creator || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    can_fast_track: false,
    allow_reassignment: true,
    conditional_rules: [],
  } as unknown as WorkflowTemplate;
}

function mapStep(row: Record<string, any>): Record<string, any> {
  return {
    id: row.id,
    step_number: row.step_number,
    name: row.name,
    type: row.step_type,
    status: row.status || 'pending',
    assignees: (row.assignees || []).map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      user: a.user
        ? {
            id: a.user.id,
            first_name: a.user.first_name,
            last_name: a.user.last_name,
            email: a.user.email,
          }
        : null,
      status: a.status || 'pending',
      comment: a.comment,
      acted_at: a.acted_at,
    })),
    deadline: row.due_date,
    can_delegate: row.config?.can_delegate ?? true,
    started_at: row.started_at,
    completed_at: row.completed_at,
    comment: row.result?.comment,
  };
}

async function mapInstance(row: Record<string, any>): Promise<WorkflowInstance> {
  // Fetch steps for this instance
  const { data: stepsData } = await supabase
    .from('workflow_steps')
    .select(STEP_SELECT)
    .eq('instance_id', row.id)
    .order('step_number');

  const steps = (stepsData || []).map(mapStep);

  return {
    id: row.id,
    template: row.template || { id: row.template_id, name: '', steps_config: [] },
    document: row.document || { id: row.document_id, title: '' },
    status: row.status || 'active',
    current_step: row.current_step || 0,
    steps,
    initiated_by: row.started_by_user || { id: row.started_by },
    started_at: row.created_at,
    completed_at: row.completed_at,
    cancelled_at: row.cancelled_at,
    notes: row.metadata?.notes,
  } as unknown as WorkflowInstance;
}

function mapTask(
  assignee: Record<string, any>,
  step: Record<string, any>,
  instance: Record<string, any>,
): Task {
  return {
    id: assignee.id,
    workflow: {
      id: instance.id,
      name: instance.name || instance.template?.name || '',
      document: {
        id: instance.document_id || instance.document?.id || '',
        title: instance.document?.title || '',
      },
    },
    step: {
      id: step.id,
      name: step.name,
      type: step.step_type,
      step_number: step.step_number,
    },
    status: assignee.status || 'pending',
    assigned_at: assignee.created_at,
    deadline: step.due_date,
  } as unknown as Task;
}

// ===========================================================================
// Service
// ===========================================================================
export const workflowsService = {
  // -----------------------------------------------------------------------
  // Templates
  // -----------------------------------------------------------------------

  async getTemplates(): Promise<WorkflowTemplate[]> {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select(TEMPLATE_SELECT)
      .order('name');

    if (error) throw new Error(parseSupabaseError(error).message);
    return (data || []).map(mapTemplate);
  },

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select(TEMPLATE_SELECT)
      .eq('id', id)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapTemplate(data);
  },

  async createTemplate(data: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const userId = await requireAuth();
    const orgId = await getUserOrgId(userId);

    const { data: row, error } = await supabase
      .from('workflow_templates')
      .insert({
        organization_id: orgId,
        name: data.name,
        description: data.description,
        category: data.category,
        steps_config: data.steps_config || [],
        is_active: data.is_active ?? true,
        created_by: userId,
      })
      .select(TEMPLATE_SELECT)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapTemplate(row);
  },

  async updateTemplate(
    id: string,
    data: Partial<WorkflowTemplate>,
  ): Promise<WorkflowTemplate> {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.category !== undefined) update.category = data.category;
    if (data.steps_config !== undefined) update.steps_config = data.steps_config;
    if (data.is_active !== undefined) update.is_active = data.is_active;

    const { data: row, error } = await supabase
      .from('workflow_templates')
      .update(update)
      .eq('id', id)
      .select(TEMPLATE_SELECT)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapTemplate(row);
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', id);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async duplicateTemplate(id: string): Promise<WorkflowTemplate> {
    const userId = await requireAuth();

    const { data: original, error: fetchErr } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) throw new Error(parseSupabaseError(fetchErr).message);

    const { data: row, error } = await supabase
      .from('workflow_templates')
      .insert({
        organization_id: original.organization_id,
        name: `${original.name} (copie)`,
        description: original.description,
        category: original.category,
        steps_config: original.steps_config,
        is_active: false,
        created_by: userId,
      })
      .select(TEMPLATE_SELECT)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapTemplate(row);
  },

  // -----------------------------------------------------------------------
  // Instances
  // -----------------------------------------------------------------------

  async getInstances(filters?: {
    status?: string;
    document?: string;
  }): Promise<WorkflowInstance[]> {
    let query = supabase
      .from('workflow_instances')
      .select(INSTANCE_SELECT)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.document) query = query.eq('document_id', filters.document);

    const { data, error } = await query;
    if (error) throw new Error(parseSupabaseError(error).message);

    const instances: WorkflowInstance[] = [];
    for (const row of data || []) {
      instances.push(await mapInstance(row));
    }
    return instances;
  },

  async getInstance(id: string): Promise<WorkflowInstance> {
    const { data, error } = await supabase
      .from('workflow_instances')
      .select(INSTANCE_SELECT)
      .eq('id', id)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapInstance(data);
  },

  async getInstanceHistory(id: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('workflow_history')
      .select(
        '*, user:profiles!workflow_history_user_id_fkey(id, first_name, last_name)',
      )
      .eq('instance_id', id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || []).map((h: any) => ({
      id: h.id,
      action: h.action,
      actor: h.user
        ? { id: h.user.id, name: `${h.user.first_name} ${h.user.last_name}` }
        : null,
      timestamp: h.created_at,
      details: h.details,
      comment: h.comment,
      stepId: h.step_id,
    }));
  },

  async cancelInstance(id: string, reason: string): Promise<void> {
    const userId = await requireAuth();

    const { error } = await supabase
      .from('workflow_instances')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
      })
      .eq('id', id);

    if (error) throw new Error(parseSupabaseError(error).message);

    // Record in history
    await supabase.from('workflow_history').insert({
      instance_id: id,
      user_id: userId,
      action: 'cancelled',
      comment: reason,
    });
  },

  // -----------------------------------------------------------------------
  // My Tasks
  // -----------------------------------------------------------------------

  async getMyTasks(): Promise<Task[]> {
    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('workflow_assignees')
      .select(`
        *,
        step:workflow_steps!workflow_assignees_step_id_fkey(
          id, step_number, name, step_type, status, due_date,
          instance:workflow_instances!workflow_steps_instance_id_fkey(
            id, name, document_id, status,
            template:workflow_templates!workflow_instances_template_id_fkey(id, name),
            document:documents!workflow_instances_document_id_fkey(id, title)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || [])
      .filter((a: any) => a.step?.instance)
      .map((a: any) => mapTask(a, a.step, a.step.instance));
  },

  async getTask(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('workflow_assignees')
      .select(`
        *,
        step:workflow_steps!workflow_assignees_step_id_fkey(
          id, step_number, name, step_type, status, due_date,
          instance:workflow_instances!workflow_steps_instance_id_fkey(
            id, name, document_id, status,
            template:workflow_templates!workflow_instances_template_id_fkey(id, name),
            document:documents!workflow_instances_document_id_fkey(id, title)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapTask(data, data.step, data.step.instance);
  },

  async approveTask(id: string, comment?: string): Promise<void> {
    const userId = await requireAuth();
    const now = new Date().toISOString();

    // Update assignee status
    const { data: assignee, error } = await supabase
      .from('workflow_assignees')
      .update({ status: 'approved', comment, acted_at: now })
      .eq('id', id)
      .select('step_id')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Check if all assignees for this step are done
    const { data: pending } = await supabase
      .from('workflow_assignees')
      .select('id')
      .eq('step_id', assignee.step_id)
      .eq('status', 'pending');

    if (!pending || pending.length === 0) {
      // All assignees approved → complete the step
      await supabase
        .from('workflow_steps')
        .update({ status: 'approved', completed_at: now })
        .eq('id', assignee.step_id);

      // Advance workflow to next step
      const { data: step } = await supabase
        .from('workflow_steps')
        .select('instance_id, step_number')
        .eq('id', assignee.step_id)
        .single();

      if (step) {
        await advanceWorkflow(step.instance_id, step.step_number);
      }
    }

    // Record history
    const { data: stepInfo } = await supabase
      .from('workflow_steps')
      .select('instance_id')
      .eq('id', assignee.step_id)
      .single();

    if (stepInfo) {
      await supabase.from('workflow_history').insert({
        instance_id: stepInfo.instance_id,
        step_id: assignee.step_id,
        user_id: userId,
        action: 'approved',
        comment,
      });
    }
  },

  async rejectTask(id: string, comment: string): Promise<void> {
    const userId = await requireAuth();
    const now = new Date().toISOString();

    const { data: assignee, error } = await supabase
      .from('workflow_assignees')
      .update({ status: 'rejected', comment, acted_at: now })
      .eq('id', id)
      .select('step_id')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Reject the step
    await supabase
      .from('workflow_steps')
      .update({ status: 'rejected', completed_at: now, result: { comment } })
      .eq('id', assignee.step_id);

    // Get instance and reject the workflow
    const { data: step } = await supabase
      .from('workflow_steps')
      .select('instance_id')
      .eq('id', assignee.step_id)
      .single();

    if (step) {
      await supabase
        .from('workflow_instances')
        .update({ status: 'cancelled', cancelled_at: now, cancelled_by: userId })
        .eq('id', step.instance_id);

      // Update document status
      const { data: instance } = await supabase
        .from('workflow_instances')
        .select('document_id')
        .eq('id', step.instance_id)
        .single();

      if (instance?.document_id) {
        await supabase
          .from('documents')
          .update({ status: 'rejected' })
          .eq('id', instance.document_id);
      }

      await supabase.from('workflow_history').insert({
        instance_id: step.instance_id,
        step_id: assignee.step_id,
        user_id: userId,
        action: 'rejected',
        comment,
      });
    }
  },

  async requestChanges(id: string, comment: string): Promise<void> {
    const userId = await requireAuth();
    const now = new Date().toISOString();

    const { data: assignee, error } = await supabase
      .from('workflow_assignees')
      .update({ status: 'pending', comment, acted_at: now })
      .eq('id', id)
      .select('step_id')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Mark step as changes_requested
    await supabase
      .from('workflow_steps')
      .update({ status: 'pending', result: { changes_requested: true, comment } })
      .eq('id', assignee.step_id);

    const { data: step } = await supabase
      .from('workflow_steps')
      .select('instance_id')
      .eq('id', assignee.step_id)
      .single();

    if (step) {
      await supabase.from('workflow_history').insert({
        instance_id: step.instance_id,
        step_id: assignee.step_id,
        user_id: userId,
        action: 'changes_requested',
        comment,
      });
    }
  },

  async delegateTask(
    id: string,
    delegateTo: string,
    comment?: string,
  ): Promise<void> {
    const userId = await requireAuth();

    // Get the original assignee's step
    const { data: original, error } = await supabase
      .from('workflow_assignees')
      .update({ status: 'approved', comment: `Délégué. ${comment || ''}`, acted_at: new Date().toISOString() })
      .eq('id', id)
      .select('step_id')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Create new assignee for the delegate
    await supabase.from('workflow_assignees').insert({
      step_id: original.step_id,
      user_id: delegateTo,
      status: 'pending',
    });

    const { data: step } = await supabase
      .from('workflow_steps')
      .select('instance_id')
      .eq('id', original.step_id)
      .single();

    if (step) {
      await supabase.from('workflow_history').insert({
        instance_id: step.instance_id,
        step_id: original.step_id,
        user_id: userId,
        action: 'delegated',
        comment,
        details: { delegated_to: delegateTo },
      });
    }
  },

  // -----------------------------------------------------------------------
  // Mid-Workflow Validator Management
  // -----------------------------------------------------------------------

  async addValidator(
    workflowId: string,
    data: {
      validator: {
        type: 'user' | 'role' | 'department' | 'external';
        id?: string;
        name?: string;
        external?: {
          email: string;
          firstName: string;
          lastName: string;
          company?: string;
          phone?: string;
        };
      };
      insertPosition: 'current' | 'next' | 'end';
      currentStepId?: string;
      stepConfig: {
        type: 'consultation' | 'validation' | 'approval' | 'signature';
        deadlineDays: number;
        canDelegate: boolean;
        message?: string;
      };
    },
  ): Promise<WorkflowInstance> {
    const userId = await requireAuth();

    // Get current instance state
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select('current_step')
      .eq('id', workflowId)
      .single();

    // Determine step number for insertion
    const { data: existingSteps } = await supabase
      .from('workflow_steps')
      .select('step_number')
      .eq('instance_id', workflowId)
      .order('step_number', { ascending: false })
      .limit(1);

    const maxStep = existingSteps?.[0]?.step_number || 0;
    let newStepNumber: number;

    if (data.insertPosition === 'end') {
      newStepNumber = maxStep + 1;
    } else if (data.insertPosition === 'next') {
      newStepNumber = (instance?.current_step || 0) + 1;
      // Shift existing steps
      await supabase.rpc('increment_step_numbers', {
        p_instance_id: workflowId,
        p_from_step: newStepNumber,
      }).then(() => {});
    } else {
      newStepNumber = instance?.current_step || 1;
    }

    // Create new step
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + data.stepConfig.deadlineDays);

    const { data: step, error: stepErr } = await supabase
      .from('workflow_steps')
      .insert({
        instance_id: workflowId,
        step_number: data.insertPosition === 'end' ? newStepNumber : maxStep + 1,
        step_type: data.stepConfig.type,
        name: data.stepConfig.message || `Étape ${data.stepConfig.type}`,
        status: 'pending',
        config: {
          can_delegate: data.stepConfig.canDelegate,
          message: data.stepConfig.message,
        },
        due_date: dueDate.toISOString(),
      })
      .select()
      .single();

    if (stepErr) throw new Error(parseSupabaseError(stepErr).message);

    // Assign validator
    if (data.validator.id) {
      await supabase.from('workflow_assignees').insert({
        step_id: step.id,
        user_id: data.validator.id,
        status: 'pending',
      });
    }

    // History
    await supabase.from('workflow_history').insert({
      instance_id: workflowId,
      step_id: step.id,
      user_id: userId,
      action: 'validator_added',
      details: { validator: data.validator, position: data.insertPosition },
    });

    return this.getInstance(workflowId);
  },

  async removeValidator(workflowId: string, stepId: string): Promise<WorkflowInstance> {
    const userId = await requireAuth();

    // Delete assignees for this step
    await supabase
      .from('workflow_assignees')
      .delete()
      .eq('step_id', stepId);

    // Delete the step
    const { error } = await supabase
      .from('workflow_steps')
      .delete()
      .eq('id', stepId)
      .eq('instance_id', workflowId);

    if (error) throw new Error(parseSupabaseError(error).message);

    await supabase.from('workflow_history').insert({
      instance_id: workflowId,
      user_id: userId,
      action: 'validator_removed',
      details: { step_id: stepId },
    });

    return this.getInstance(workflowId);
  },

  async reorderSteps(workflowId: string, stepIds: string[]): Promise<WorkflowInstance> {
    // Update step_number for each step
    for (let i = 0; i < stepIds.length; i++) {
      await supabase
        .from('workflow_steps')
        .update({ step_number: i + 1 })
        .eq('id', stepIds[i])
        .eq('instance_id', workflowId);
    }

    return this.getInstance(workflowId);
  },

  async skipStep(
    workflowId: string,
    stepId: string,
    reason: string,
  ): Promise<WorkflowInstance> {
    const userId = await requireAuth();
    const now = new Date().toISOString();

    await supabase
      .from('workflow_steps')
      .update({ status: 'skipped', completed_at: now, result: { skip_reason: reason } })
      .eq('id', stepId)
      .eq('instance_id', workflowId);

    // Advance workflow
    const { data: step } = await supabase
      .from('workflow_steps')
      .select('step_number')
      .eq('id', stepId)
      .single();

    if (step) {
      await advanceWorkflow(workflowId, step.step_number);
    }

    await supabase.from('workflow_history').insert({
      instance_id: workflowId,
      step_id: stepId,
      user_id: userId,
      action: 'step_skipped',
      comment: reason,
    });

    return this.getInstance(workflowId);
  },

  // -----------------------------------------------------------------------
  // Modifications
  // -----------------------------------------------------------------------

  async requestModifications(
    taskId: string,
    data: {
      comment: string;
      modifications: Array<{
        field?: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
      }>;
      deadline?: string;
    },
  ): Promise<void> {
    const userId = await requireAuth();

    const { data: assignee } = await supabase
      .from('workflow_assignees')
      .select('step_id')
      .eq('id', taskId)
      .single();

    if (!assignee) throw new Error('Tâche non trouvée');

    const { data: step } = await supabase
      .from('workflow_steps')
      .select('instance_id')
      .eq('id', assignee.step_id)
      .single();

    if (!step) throw new Error('Étape non trouvée');

    await supabase.from('workflow_history').insert({
      instance_id: step.instance_id,
      step_id: assignee.step_id,
      user_id: userId,
      action: 'modifications_requested',
      comment: data.comment,
      details: {
        modifications: data.modifications,
        deadline: data.deadline,
      },
    });
  },

  async getPendingModifications(
    workflowId: string,
  ): Promise<
    Array<{
      id: string;
      requestedBy: { id: string; name: string };
      requestedAt: string;
      modifications: Array<{
        field?: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        status: 'pending' | 'completed';
      }>;
      status: 'pending' | 'in_progress' | 'completed';
    }>
  > {
    const { data, error } = await supabase
      .from('workflow_history')
      .select(
        '*, user:profiles!workflow_history_user_id_fkey(id, first_name, last_name)',
      )
      .eq('instance_id', workflowId)
      .eq('action', 'modifications_requested')
      .order('created_at', { ascending: false });

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || []).map((h: any) => ({
      id: h.id,
      requestedBy: h.user
        ? { id: h.user.id, name: `${h.user.first_name} ${h.user.last_name}` }
        : { id: h.user_id, name: '' },
      requestedAt: h.created_at,
      modifications: ((h.details as any)?.modifications || []).map((m: any) => ({
        ...m,
        status: 'pending' as const,
      })),
      status: 'pending' as const,
    }));
  },

  async completeModifications(
    workflowId: string,
    modificationId: string,
  ): Promise<void> {
    const userId = await requireAuth();

    await supabase.from('workflow_history').insert({
      instance_id: workflowId,
      user_id: userId,
      action: 'modifications_completed',
      details: { modification_id: modificationId },
    });
  },

  // -----------------------------------------------------------------------
  // Timeline
  // -----------------------------------------------------------------------

  async getTimeline(
    workflowId: string,
  ): Promise<
    Array<{
      id: string;
      action: string;
      actor: { id: string; name: string };
      timestamp: string;
      details?: Record<string, unknown>;
      stepId?: string;
    }>
  > {
    const { data, error } = await supabase
      .from('workflow_history')
      .select(
        '*, user:profiles!workflow_history_user_id_fkey(id, first_name, last_name)',
      )
      .eq('instance_id', workflowId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(parseSupabaseError(error).message);

    return (data || []).map((h: any) => ({
      id: h.id,
      action: h.action,
      actor: h.user
        ? { id: h.user.id, name: `${h.user.first_name} ${h.user.last_name}` }
        : { id: h.user_id || '', name: '' },
      timestamp: h.created_at,
      details: h.details,
      stepId: h.step_id,
    }));
  },
};

// ---------------------------------------------------------------------------
// Internal helper — advance workflow after step completion
// ---------------------------------------------------------------------------
async function advanceWorkflow(instanceId: string, completedStepNumber: number): Promise<void> {
  // Find next pending step
  const { data: nextStep } = await supabase
    .from('workflow_steps')
    .select('id, step_number')
    .eq('instance_id', instanceId)
    .eq('status', 'pending')
    .gt('step_number', completedStepNumber)
    .order('step_number')
    .limit(1)
    .maybeSingle();

  if (nextStep) {
    // Advance to next step
    await supabase
      .from('workflow_instances')
      .update({ current_step: nextStep.step_number })
      .eq('id', instanceId);

    await supabase
      .from('workflow_steps')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', nextStep.id);
  } else {
    // No more steps → workflow complete
    await supabase
      .from('workflow_instances')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', instanceId);

    // Update document status to approved
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select('document_id')
      .eq('id', instanceId)
      .single();

    if (instance?.document_id) {
      await supabase
        .from('documents')
        .update({ status: 'approved' })
        .eq('id', instance.document_id);
    }
  }
}
