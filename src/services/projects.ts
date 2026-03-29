/**
 * Projects Service — Supabase Implementation
 *
 * Replaces Axios API calls with direct Supabase client queries.
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MemberRole = 'viewer' | 'contributor' | 'editor' | 'manager' | 'admin';
export type DocumentRole = 'main' | 'supporting' | 'reference' | 'output' | 'template';
export type TimelineEventType =
  | 'created'
  | 'status_changed'
  | 'document_added'
  | 'document_removed'
  | 'document_approved'
  | 'document_signed'
  | 'member_added'
  | 'member_removed'
  | 'workflow_started'
  | 'workflow_completed'
  | 'comment'
  | 'deadline_approaching'
  | 'milestone_reached';

export interface Project {
  id: string;
  name: string;
  description?: string;
  reference?: string;
  color: string;
  icon: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  membersCount: number;
  documentsCount: number;
  completedDocumentsCount: number;
  progress: number;
  tags: string[];
  organizationId: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: MemberRole;
  canAddDocuments: boolean;
  canRemoveDocuments: boolean;
  canManageMembers: boolean;
  canEditSettings: boolean;
  addedAt: string;
  addedBy: string;
}

export interface ProjectDocument {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  documentStatus: string;
  role: DocumentRole;
  order: number;
  notes?: string;
  addedAt: string;
  addedBy: string;
}

export interface TimelineEntry {
  id: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  details: Record<string, unknown>;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  documentId?: string;
  documentTitle?: string;
  workflowId?: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  documents: ProjectDocument[];
  timeline: TimelineEntry[];
  workflows: ProjectWorkflow[];
  settings: ProjectSettings;
}

export interface ProjectWorkflow {
  id: string;
  workflowTemplateId: string;
  workflowTemplateName: string;
  isDefault: boolean;
  appliesToDocumentTypes: string[];
  autoStart: boolean;
}

export interface ProjectSettings {
  documentTypesAllowed: string[];
  requireApprovalForDocuments: boolean;
  autoArchiveOnComplete: boolean;
  notificationPreferences: Record<string, boolean>;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  reference?: string;
  color?: string;
  icon?: string;
  priority?: ProjectPriority;
  startDate?: string;
  dueDate?: string;
  departmentId?: string;
  tags?: string[];
  memberIds?: string[];
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: ProjectStatus;
}

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

function mapProject(row: Record<string, any>): Project {
  const settings = row.settings || {};
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    reference: settings.reference || undefined,
    color: settings.color || '#6366f1',
    icon: settings.icon || 'folder',
    status: row.status || 'draft',
    priority: settings.priority || 'medium',
    startDate: row.start_date || undefined,
    dueDate: row.end_date || undefined,
    completedAt: settings.completed_at || undefined,
    owner: row.creator
      ? {
          id: row.creator.id,
          name: `${row.creator.first_name} ${row.creator.last_name}`,
        }
      : { id: row.created_by, name: '' },
    membersCount: row.members_count ?? 0,
    documentsCount: row.documents_count ?? 0,
    completedDocumentsCount: 0,
    progress: settings.progress || 0,
    tags: settings.tags || [],
    organizationId: row.organization_id,
    departmentId: settings.department_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTimelineEntry(row: Record<string, any>): TimelineEntry {
  const meta = row.metadata || {};
  const config = getTimelineEventConfig(row.event_type);
  return {
    id: row.id,
    eventType: row.event_type,
    title: row.title,
    description: row.description || undefined,
    details: meta,
    user: row.user_profile
      ? { id: row.user_profile.id, name: `${row.user_profile.first_name} ${row.user_profile.last_name}` }
      : undefined,
    documentId: meta.document_id,
    documentTitle: meta.document_title,
    workflowId: meta.workflow_id,
    icon: config.icon,
    color: config.color,
    createdAt: row.created_at,
  };
}

const ROLE_PERMISSIONS: Record<MemberRole, { add: boolean; remove: boolean; manage: boolean; settings: boolean }> = {
  viewer: { add: false, remove: false, manage: false, settings: false },
  contributor: { add: true, remove: false, manage: false, settings: false },
  editor: { add: true, remove: true, manage: false, settings: false },
  manager: { add: true, remove: true, manage: true, settings: false },
  admin: { add: true, remove: true, manage: true, settings: true },
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const projectService = {
  async getProjects(filters?: {
    status?: ProjectStatus;
    priority?: ProjectPriority;
    search?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
  }): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select(
        '*, creator:profiles!projects_created_by_fkey(id, first_name, last_name)',
      )
      .eq('is_archived', false);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }
    if (filters?.startDate) query = query.gte('start_date', filters.startDate);
    if (filters?.endDate) query = query.lte('end_date', filters.endDate);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(parseSupabaseError(error).message);

    // Fetch member/document counts in bulk
    const projectIds = (data || []).map((p: any) => p.id);

    const [{ data: memberCounts }, { data: docCounts }] = await Promise.all([
      supabase
        .from('project_members')
        .select('project_id')
        .in('project_id', projectIds.length > 0 ? projectIds : ['']),
      supabase
        .from('project_documents')
        .select('project_id')
        .in('project_id', projectIds.length > 0 ? projectIds : ['']),
    ]);

    const mCounts: Record<string, number> = {};
    const dCounts: Record<string, number> = {};
    for (const m of memberCounts || []) {
      mCounts[m.project_id] = (mCounts[m.project_id] || 0) + 1;
    }
    for (const d of docCounts || []) {
      dCounts[d.project_id] = (dCounts[d.project_id] || 0) + 1;
    }

    return (data || []).map((row: any) => {
      const p = mapProject(row);
      p.membersCount = mCounts[row.id] || 0;
      p.documentsCount = dCounts[row.id] || 0;
      return p;
    });
  },

  async getProject(id: string): Promise<ProjectDetail> {
    const { data: row, error } = await supabase
      .from('projects')
      .select(
        '*, creator:profiles!projects_created_by_fkey(id, first_name, last_name)',
      )
      .eq('id', id)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Fetch sub-resources in parallel
    const [
      { data: membersData },
      { data: docsData },
      { data: timelineData },
      { data: workflowsData },
    ] = await Promise.all([
      supabase
        .from('project_members')
        .select('*, user:profiles!project_members_user_id_fkey(id, first_name, last_name, email)')
        .eq('project_id', id),
      supabase
        .from('project_documents')
        .select('*, document:documents!project_documents_document_id_fkey(id, title, status, document_type_id)')
        .eq('project_id', id),
      supabase
        .from('project_timeline')
        .select('*, user_profile:profiles!project_timeline_user_id_fkey(id, first_name, last_name)')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('project_workflows')
        .select('*')
        .eq('project_id', id),
    ]);

    const project = mapProject(row);
    project.membersCount = (membersData || []).length;
    project.documentsCount = (docsData || []).length;

    const members: ProjectMember[] = (membersData || []).map((m: any) => {
      const role = (m.role || 'member') as MemberRole;
      const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
      return {
        id: m.id,
        userId: m.user_id,
        userName: m.user ? `${m.user.first_name} ${m.user.last_name}` : '',
        userEmail: m.user?.email || '',
        role,
        canAddDocuments: perms.add,
        canRemoveDocuments: perms.remove,
        canManageMembers: perms.manage,
        canEditSettings: perms.settings,
        addedAt: m.joined_at,
        addedBy: '',
      };
    });

    const documents: ProjectDocument[] = (docsData || []).map((d: any) => ({
      id: d.id,
      documentId: d.document_id,
      documentTitle: d.document?.title || '',
      documentType: d.document?.document_type_id || '',
      documentStatus: d.document?.status || 'draft',
      role: 'main' as DocumentRole,
      order: 0,
      addedAt: d.created_at,
      addedBy: d.added_by || '',
    }));

    const timeline: TimelineEntry[] = (timelineData || []).map(mapTimelineEntry);

    const workflows: ProjectWorkflow[] = (workflowsData || []).map((w: any) => ({
      id: w.id,
      workflowTemplateId: w.workflow_template_id || '',
      workflowTemplateName: w.name || '',
      isDefault: w.status === 'active',
      appliesToDocumentTypes: [],
      autoStart: false,
    }));

    const settings: ProjectSettings = {
      documentTypesAllowed: (row as any).settings?.document_types_allowed || [],
      requireApprovalForDocuments: (row as any).settings?.require_approval || false,
      autoArchiveOnComplete: (row as any).settings?.auto_archive || false,
      notificationPreferences: (row as any).settings?.notifications || {},
    };

    return { ...project, members, documents, timeline, workflows, settings };
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const userId = await requireAuth();
    const orgId = await getUserOrgId(userId);

    const { data: row, error } = await supabase
      .from('projects')
      .insert({
        organization_id: orgId,
        name: data.name,
        description: data.description,
        status: 'draft',
        start_date: data.startDate,
        end_date: data.dueDate,
        created_by: userId,
        settings: {
          reference: data.reference,
          color: data.color || '#6366f1',
          icon: data.icon || 'folder',
          priority: data.priority || 'medium',
          tags: data.tags || [],
          department_id: data.departmentId,
        },
      })
      .select('*, creator:profiles!projects_created_by_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Add creator as admin member
    await supabase.from('project_members').insert({
      project_id: row.id,
      user_id: userId,
      role: 'admin',
    });

    // Add additional members
    if (data.memberIds && data.memberIds.length > 0) {
      const memberRows = data.memberIds
        .filter((mid) => mid !== userId)
        .map((mid) => ({
          project_id: row.id,
          user_id: mid,
          role: 'member',
        }));
      if (memberRows.length > 0) {
        await supabase.from('project_members').insert(memberRows);
      }
    }

    // Add timeline entry
    await supabase.from('project_timeline').insert({
      project_id: row.id,
      event_type: 'created',
      title: 'Projet créé',
      user_id: userId,
    });

    return mapProject(row);
  },

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.status !== undefined) update.status = data.status;
    if (data.startDate !== undefined) update.start_date = data.startDate;
    if (data.dueDate !== undefined) update.end_date = data.dueDate;

    // Merge settings fields
    const { data: current } = await supabase
      .from('projects')
      .select('settings')
      .eq('id', id)
      .single();

    const settings = { ...((current?.settings as any) || {}) };
    if (data.reference !== undefined) settings.reference = data.reference;
    if (data.color !== undefined) settings.color = data.color;
    if (data.icon !== undefined) settings.icon = data.icon;
    if (data.priority !== undefined) settings.priority = data.priority;
    if (data.tags !== undefined) settings.tags = data.tags;
    if (data.departmentId !== undefined) settings.department_id = data.departmentId;
    update.settings = settings;

    const { data: row, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', id)
      .select('*, creator:profiles!projects_created_by_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapProject(row);
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async changeStatus(id: string, status: ProjectStatus): Promise<Project> {
    const userId = await requireAuth();

    const update: Record<string, unknown> = { status };
    if (status === 'completed') {
      const { data: current } = await supabase
        .from('projects')
        .select('settings')
        .eq('id', id)
        .single();
      update.settings = {
        ...((current?.settings as any) || {}),
        completed_at: new Date().toISOString(),
      };
    }

    const { data: row, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', id)
      .select('*, creator:profiles!projects_created_by_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Timeline
    await supabase.from('project_timeline').insert({
      project_id: id,
      event_type: 'status_changed',
      title: `Statut modifié : ${status}`,
      user_id: userId,
      metadata: { new_status: status },
    });

    return mapProject(row);
  },

  async addMember(projectId: string, userId: string, role: MemberRole): Promise<ProjectMember> {
    const { data: row, error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role })
      .select('*, user:profiles!project_members_user_id_fkey(id, first_name, last_name, email)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    const authUserId = await requireAuth();
    await supabase.from('project_timeline').insert({
      project_id: projectId,
      event_type: 'member_added',
      title: 'Membre ajouté',
      user_id: authUserId,
      metadata: { member_id: userId, role },
    });

    const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user ? `${row.user.first_name} ${row.user.last_name}` : '',
      userEmail: row.user?.email || '',
      role,
      canAddDocuments: perms.add,
      canRemoveDocuments: perms.remove,
      canManageMembers: perms.manage,
      canEditSettings: perms.settings,
      addedAt: row.joined_at,
      addedBy: authUserId,
    };
  },

  async updateMember(projectId: string, memberId: string, data: Partial<ProjectMember>): Promise<ProjectMember> {
    const update: Record<string, unknown> = {};
    if (data.role) update.role = data.role;

    const { data: row, error } = await supabase
      .from('project_members')
      .update(update)
      .eq('id', memberId)
      .eq('project_id', projectId)
      .select('*, user:profiles!project_members_user_id_fkey(id, first_name, last_name, email)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    const role = (row.role || 'viewer') as MemberRole;
    const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user ? `${row.user.first_name} ${row.user.last_name}` : '',
      userEmail: row.user?.email || '',
      role,
      canAddDocuments: perms.add,
      canRemoveDocuments: perms.remove,
      canManageMembers: perms.manage,
      canEditSettings: perms.settings,
      addedAt: row.joined_at,
      addedBy: '',
    };
  },

  async removeMember(projectId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async addDocument(
    projectId: string,
    documentId: string,
    _role: DocumentRole = 'main',
    _notes?: string,
  ): Promise<ProjectDocument> {
    const userId = await requireAuth();

    const { data: row, error } = await supabase
      .from('project_documents')
      .insert({
        project_id: projectId,
        document_id: documentId,
        added_by: userId,
      })
      .select('*, document:documents!project_documents_document_id_fkey(id, title, status, document_type_id)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    await supabase.from('project_timeline').insert({
      project_id: projectId,
      event_type: 'document_added',
      title: 'Document ajouté',
      user_id: userId,
      metadata: { document_id: documentId, document_title: row.document?.title },
    });

    return {
      id: row.id,
      documentId: row.document_id,
      documentTitle: row.document?.title || '',
      documentType: row.document?.document_type_id || '',
      documentStatus: row.document?.status || 'draft',
      role: 'main',
      order: 0,
      addedAt: row.created_at,
      addedBy: userId,
    };
  },

  async updateDocument(
    projectId: string,
    projectDocumentId: string,
    _data: { role?: DocumentRole; order?: number; notes?: string },
  ): Promise<ProjectDocument> {
    // project_documents table is a simple junction; role/order/notes are stored
    // in metadata or a future column. For now, just re-fetch.
    const { data: row, error } = await supabase
      .from('project_documents')
      .select('*, document:documents!project_documents_document_id_fkey(id, title, status, document_type_id)')
      .eq('id', projectDocumentId)
      .eq('project_id', projectId)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    return {
      id: row.id,
      documentId: row.document_id,
      documentTitle: row.document?.title || '',
      documentType: row.document?.document_type_id || '',
      documentStatus: row.document?.status || 'draft',
      role: 'main',
      order: 0,
      addedAt: row.created_at,
      addedBy: row.added_by || '',
    };
  },

  async removeDocument(projectId: string, projectDocumentId: string): Promise<void> {
    const { error } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', projectDocumentId)
      .eq('project_id', projectId);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async reorderDocuments(
    _projectId: string,
    _documentOrders: { id: string; order: number }[],
  ): Promise<void> {
    // Order is not stored in project_documents currently.
    // This would require an order column to be added.
    // No-op for now; can be implemented with a migration adding an `order` column.
  },

  async getTimeline(
    projectId: string,
    filters?: {
      eventTypes?: TimelineEventType[];
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
  ): Promise<TimelineEntry[]> {
    let query = supabase
      .from('project_timeline')
      .select('*, user_profile:profiles!project_timeline_user_id_fkey(id, first_name, last_name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      query = query.in('event_type', filters.eventTypes);
    }
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw new Error(parseSupabaseError(error).message);
    return (data || []).map(mapTimelineEntry);
  },

  async addComment(projectId: string, content: string): Promise<TimelineEntry> {
    const userId = await requireAuth();

    const { data: row, error } = await supabase
      .from('project_timeline')
      .insert({
        project_id: projectId,
        event_type: 'comment',
        title: 'Commentaire',
        description: content,
        user_id: userId,
      })
      .select('*, user_profile:profiles!project_timeline_user_id_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapTimelineEntry(row);
  },

  async addWorkflow(
    projectId: string,
    workflowTemplateId: string,
    config: { isDefault?: boolean; appliesToDocumentTypes?: string[]; autoStart?: boolean },
  ): Promise<ProjectWorkflow> {
    const { data: row, error } = await supabase
      .from('project_workflows')
      .insert({
        project_id: projectId,
        workflow_template_id: workflowTemplateId,
        name: '',
        status: config.isDefault ? 'active' : 'inactive',
      })
      .select()
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    return {
      id: row.id,
      workflowTemplateId: row.workflow_template_id || '',
      workflowTemplateName: row.name || '',
      isDefault: config.isDefault || false,
      appliesToDocumentTypes: config.appliesToDocumentTypes || [],
      autoStart: config.autoStart || false,
    };
  },

  async removeWorkflow(projectId: string, workflowId: string): Promise<void> {
    const { error } = await supabase
      .from('project_workflows')
      .delete()
      .eq('id', workflowId)
      .eq('project_id', projectId);

    if (error) throw new Error(parseSupabaseError(error).message);
  },

  async startDocumentWorkflow(
    projectId: string,
    documentId: string,
    workflowTemplateId?: string,
  ): Promise<{ workflowInstanceId: string }> {
    const userId = await requireAuth();

    // Find the workflow template to use
    let templateId = workflowTemplateId;
    if (!templateId) {
      const { data: pw } = await supabase
        .from('project_workflows')
        .select('workflow_template_id')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      templateId = pw?.workflow_template_id;
    }

    if (!templateId) throw new Error('Aucun template de workflow trouvé');

    const { data: instance, error } = await supabase
      .from('workflow_instances')
      .insert({
        template_id: templateId,
        document_id: documentId,
        initiated_by: userId,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    await supabase.from('project_timeline').insert({
      project_id: projectId,
      event_type: 'workflow_started',
      title: 'Workflow démarré',
      user_id: userId,
      metadata: { document_id: documentId, workflow_instance_id: instance.id },
    });

    return { workflowInstanceId: instance.id };
  },

  async getStats(projectId: string): Promise<{
    documentsTotal: number;
    documentsByStatus: Record<string, number>;
    documentsByType: Record<string, number>;
    workflowsActive: number;
    workflowsCompleted: number;
    membersCount: number;
    daysRemaining?: number;
    progressHistory: { date: string; progress: number }[];
  }> {
    const [
      { data: docs },
      { data: members },
      { data: workflows },
      { data: project },
    ] = await Promise.all([
      supabase
        .from('project_documents')
        .select('document:documents!project_documents_document_id_fkey(status, document_type_id)')
        .eq('project_id', projectId),
      supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId),
      supabase
        .from('project_workflows')
        .select('status')
        .eq('project_id', projectId),
      supabase
        .from('projects')
        .select('end_date')
        .eq('id', projectId)
        .single(),
    ]);

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const d of docs || []) {
      const doc = d.document as any;
      if (doc?.status) byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      if (doc?.document_type_id) byType[doc.document_type_id] = (byType[doc.document_type_id] || 0) + 1;
    }

    let daysRemaining: number | undefined;
    if (project?.end_date) {
      const diff = new Date(project.end_date).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      documentsTotal: (docs || []).length,
      documentsByStatus: byStatus,
      documentsByType: byType,
      workflowsActive: (workflows || []).filter((w: any) => w.status === 'active').length,
      workflowsCompleted: (workflows || []).filter((w: any) => w.status === 'completed').length,
      membersCount: (members || []).length,
      daysRemaining,
      progressHistory: [],
    };
  },

  async duplicateProject(id: string, newName: string, includeDocuments = false): Promise<Project> {
    const userId = await requireAuth();

    // Get original project
    const { data: original, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);

    // Create duplicate
    const { data: dup, error: dupError } = await supabase
      .from('projects')
      .insert({
        organization_id: original.organization_id,
        name: newName,
        description: original.description,
        status: 'draft',
        start_date: original.start_date,
        end_date: original.end_date,
        created_by: userId,
        settings: original.settings,
      })
      .select('*, creator:profiles!projects_created_by_fkey(id, first_name, last_name)')
      .single();

    if (dupError) throw new Error(parseSupabaseError(dupError).message);

    // Copy members
    const { data: members } = await supabase
      .from('project_members')
      .select('user_id, role')
      .eq('project_id', id);

    if (members && members.length > 0) {
      await supabase.from('project_members').insert(
        members.map((m: any) => ({
          project_id: dup.id,
          user_id: m.user_id,
          role: m.role,
        })),
      );
    }

    // Copy documents if requested
    if (includeDocuments) {
      const { data: docs } = await supabase
        .from('project_documents')
        .select('document_id, added_by')
        .eq('project_id', id);

      if (docs && docs.length > 0) {
        await supabase.from('project_documents').insert(
          docs.map((d: any) => ({
            project_id: dup.id,
            document_id: d.document_id,
            added_by: d.added_by,
          })),
        );
      }
    }

    return mapProject(dup);
  },

  async archiveProject(id: string): Promise<Project> {
    const { data: row, error } = await supabase
      .from('projects')
      .update({ is_archived: true, status: 'archived' })
      .eq('id', id)
      .select('*, creator:profiles!projects_created_by_fkey(id, first_name, last_name)')
      .single();

    if (error) throw new Error(parseSupabaseError(error).message);
    return mapProject(row);
  },
};

// ---------------------------------------------------------------------------
// UI Helper functions (unchanged — pure display logic)
// ---------------------------------------------------------------------------

export function getStatusConfig(status: ProjectStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const configs: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
    draft: { label: 'Brouillon', color: 'text-advist-text-secondary', bgColor: 'bg-advist-bg' },
    active: { label: 'Actif', color: 'text-advist-success', bgColor: 'bg-green-50' },
    on_hold: { label: 'En pause', color: 'text-advist-gold-dark', bgColor: 'bg-advist-gold-light' },
    completed: { label: 'Terminé', color: 'text-advist-gray900', bgColor: 'bg-advist-surface-dark' },
    archived: { label: 'Archivé', color: 'text-advist-gray900', bgColor: 'bg-advist-surface-dark' },
    cancelled: { label: 'Annulé', color: 'text-red-600', bgColor: 'bg-red-100' },
  };
  return configs[status];
}

export function getPriorityConfig(priority: ProjectPriority): {
  label: string;
  color: string;
  bgColor: string;
} {
  const configs: Record<ProjectPriority, { label: string; color: string; bgColor: string }> = {
    low: { label: 'Faible', color: 'text-advist-text-secondary', bgColor: 'bg-advist-bg' },
    medium: { label: 'Moyenne', color: 'text-advist-gray900', bgColor: 'bg-advist-surface-dark' },
    high: { label: 'Haute', color: 'text-advist-gold-dark', bgColor: 'bg-advist-gold-light' },
    urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
  };
  return configs[priority];
}

export function getTimelineEventConfig(eventType: TimelineEventType): {
  label: string;
  icon: string;
  color: string;
} {
  const configs: Record<TimelineEventType, { label: string; icon: string; color: string }> = {
    created: { label: 'Projet créé', icon: 'folder-plus', color: 'text-advist-success' },
    status_changed: { label: 'Statut modifié', icon: 'refresh-cw', color: 'text-advist-gray900' },
    document_added: { label: 'Document ajouté', icon: 'file-plus', color: 'text-advist-gray900' },
    document_removed: { label: 'Document retiré', icon: 'file-minus', color: 'text-red-500' },
    document_approved: { label: 'Document approuvé', icon: 'check-circle', color: 'text-advist-success' },
    document_signed: { label: 'Document signé', icon: 'pen-tool', color: 'text-advist-gray900' },
    member_added: { label: 'Membre ajouté', icon: 'user-plus', color: 'text-advist-gray900' },
    member_removed: { label: 'Membre retiré', icon: 'user-minus', color: 'text-red-500' },
    workflow_started: { label: 'Workflow démarré', icon: 'git-branch', color: 'text-advist-gold-dark' },
    workflow_completed: { label: 'Workflow terminé', icon: 'check-square', color: 'text-advist-success' },
    comment: { label: 'Commentaire', icon: 'message-circle', color: 'text-advist-text-secondary' },
    deadline_approaching: { label: 'Échéance proche', icon: 'clock', color: 'text-advist-gold-dark' },
    milestone_reached: { label: 'Jalon atteint', icon: 'flag', color: 'text-advist-success' },
  };
  return configs[eventType];
}

export default projectService;
