import api from './api';
import { cacheStorage, storage } from '@/utils/storage';
import {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowStep,
  Task,
  User,
  PaginatedResponse,
} from '@/types';
import { CACHE_CONFIG, STORAGE_KEYS } from '@/constants/config';

// Types
export interface TaskFilters {
  status?: 'pending' | 'completed';
  type?: 'approval' | 'signature' | 'review' | 'information';
  priority?: 'high' | 'normal' | 'low';
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  ordering?: string;
}

export interface WorkflowFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  documentId?: string;
  templateId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateWorkflowData {
  documentId: string;
  templateId: string;
  priority?: 'high' | 'normal' | 'low';
  deadline?: string;
  notes?: string;
  notifyAssignees?: boolean;
}

export interface TaskAction {
  action: 'approve' | 'reject' | 'delegate' | 'request_info';
  comment?: string;
  delegateTo?: string;
}

export interface TaskStats {
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

export interface WorkflowEvent {
  id: string;
  type: 'created' | 'step_completed' | 'step_rejected' | 'delegated' | 'cancelled' | 'completed';
  user: User;
  step?: WorkflowStep;
  comment?: string;
  createdAt: string;
}

export interface DelegationSuggestion {
  user: User;
  reason: string;
  availability: 'available' | 'busy' | 'out_of_office';
}

export const workflowsService = {
  // Templates
  async getTemplates(): Promise<WorkflowTemplate[]> {
    const cacheKey = 'workflow_templates';
    const cached = await cacheStorage.get<WorkflowTemplate[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await api.get<PaginatedResponse<WorkflowTemplate>>('/workflow-templates/');
    await cacheStorage.set(cacheKey, response.results, CACHE_CONFIG.USER_TTL);
    return response.results;
  },

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    const cacheKey = `workflow_template_${id}`;
    const cached = await cacheStorage.get<WorkflowTemplate>(cacheKey);

    if (cached) {
      return cached;
    }

    const template = await api.get<WorkflowTemplate>(`/workflow-templates/${id}/`);
    await cacheStorage.set(cacheKey, template, CACHE_CONFIG.USER_TTL);
    return template;
  },

  async getTemplatesForDocument(documentTypeId: string): Promise<WorkflowTemplate[]> {
    const response = await api.get<PaginatedResponse<WorkflowTemplate>>(
      '/workflow-templates/',
      { document_type: documentTypeId }
    );
    return response.results;
  },

  // Workflow Instances
  async getInstances(filters?: WorkflowFilters): Promise<PaginatedResponse<WorkflowInstance>> {
    const params: Record<string, unknown> = {};

    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.documentId) params.document = filters.documentId;
      if (filters.templateId) params.template = filters.templateId;
      if (filters.page) params.page = filters.page;
      if (filters.pageSize) params.page_size = filters.pageSize;
    }

    return await api.get<PaginatedResponse<WorkflowInstance>>('/workflow-instances/', params);
  },

  async getInstancesForDocument(documentId: string): Promise<WorkflowInstance[]> {
    const response = await this.getInstances({ documentId });
    return response.results;
  },

  async getInstance(id: string): Promise<WorkflowInstance> {
    const cacheKey = `workflow_instance_${id}`;
    const cached = await cacheStorage.get<WorkflowInstance>(cacheKey);

    if (cached) {
      // Refresh in background
      this.fetchAndCacheInstance(id, cacheKey);
      return cached;
    }

    return await this.fetchAndCacheInstance(id, cacheKey);
  },

  async fetchAndCacheInstance(id: string, cacheKey?: string): Promise<WorkflowInstance> {
    const instance = await api.get<WorkflowInstance>(`/workflow-instances/${id}/`);

    if (cacheKey) {
      await cacheStorage.set(cacheKey, instance, CACHE_CONFIG.TASKS_TTL);
    }

    return instance;
  },

  // Create workflow
  async createWorkflow(data: CreateWorkflowData): Promise<WorkflowInstance> {
    const instance = await api.post<WorkflowInstance>('/workflow-instances/', {
      document_id: data.documentId,
      template_id: data.templateId,
      priority: data.priority || 'normal',
      deadline: data.deadline,
      notes: data.notes,
      notify_assignees: data.notifyAssignees ?? true,
    });

    await cacheStorage.invalidate('workflow_');
    await cacheStorage.invalidate('tasks_');

    return instance;
  },

  // Cancel workflow
  async cancelWorkflow(instanceId: string, reason: string): Promise<void> {
    await api.post(`/workflow-instances/${instanceId}/cancel/`, { reason });
    await cacheStorage.invalidate(`workflow_instance_${instanceId}`);
    await cacheStorage.invalidate('tasks_');
  },

  // Get workflow timeline/history
  async getWorkflowTimeline(instanceId: string): Promise<WorkflowEvent[]> {
    return await api.get<WorkflowEvent[]>(`/workflow-instances/${instanceId}/timeline/`);
  },

  // Tasks (user's pending actions)
  async getMyTasks(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
    const cacheKey = `tasks_${JSON.stringify(filters)}`;
    const cached = await cacheStorage.get<PaginatedResponse<Task>>(cacheKey);

    if (cached) {
      // Refresh in background
      this.fetchAndCacheTasks(filters, cacheKey);
      return cached;
    }

    return await this.fetchAndCacheTasks(filters, cacheKey);
  },

  async fetchAndCacheTasks(filters?: TaskFilters, cacheKey?: string): Promise<PaginatedResponse<Task>> {
    const params: Record<string, unknown> = {};

    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.dueBefore) params.due_before = filters.dueBefore;
      if (filters.dueAfter) params.due_after = filters.dueAfter;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.pageSize) params.page_size = filters.pageSize;
      if (filters.ordering) params.ordering = filters.ordering;
    }

    const response = await api.get<PaginatedResponse<Task>>('/my-tasks/', params);

    if (cacheKey) {
      await cacheStorage.set(cacheKey, response, CACHE_CONFIG.TASKS_TTL);
    }

    // Cache for offline
    await storage.setItem(STORAGE_KEYS.CACHED_TASKS, response.results);

    return response;
  },

  async getTask(taskId: string): Promise<Task> {
    return await api.get<Task>(`/my-tasks/${taskId}/`);
  },

  async getTaskStats(): Promise<TaskStats> {
    const cacheKey = 'task_stats';
    const cached = await cacheStorage.get<TaskStats>(cacheKey);

    if (cached) {
      return cached;
    }

    const stats = await api.get<TaskStats>('/my-tasks/stats/');
    await cacheStorage.set(cacheKey, stats, CACHE_CONFIG.TASKS_TTL);
    return stats;
  },

  async getPendingTasksCount(): Promise<number> {
    const stats = await this.getTaskStats();
    return stats.pending;
  },

  // Task actions
  async approveTask(taskId: string, comment?: string): Promise<void> {
    await api.post(`/my-tasks/${taskId}/approve/`, { comment });
    await this.invalidateTaskCaches(taskId);
  },

  async rejectTask(taskId: string, comment: string): Promise<void> {
    await api.post(`/my-tasks/${taskId}/reject/`, { comment });
    await this.invalidateTaskCaches(taskId);
  },

  async delegateTask(taskId: string, userId: string, comment?: string): Promise<void> {
    await api.post(`/my-tasks/${taskId}/delegate/`, {
      delegate_to: userId,
      comment,
    });
    await this.invalidateTaskCaches(taskId);
  },

  async requestMoreInfo(taskId: string, message: string): Promise<void> {
    await api.post(`/my-tasks/${taskId}/request_info/`, { message });
  },

  // Batch task actions
  async batchApprove(taskIds: string[], comment?: string): Promise<void> {
    await api.post('/my-tasks/batch_approve/', {
      task_ids: taskIds,
      comment,
    });
    await cacheStorage.invalidate('tasks_');
  },

  async batchReject(taskIds: string[], comment: string): Promise<void> {
    await api.post('/my-tasks/batch_reject/', {
      task_ids: taskIds,
      comment,
    });
    await cacheStorage.invalidate('tasks_');
  },

  // Get delegation suggestions
  async getDelegationSuggestions(taskId: string): Promise<DelegationSuggestion[]> {
    return await api.get<DelegationSuggestion[]>(`/my-tasks/${taskId}/delegation_suggestions/`);
  },

  // Get tasks due today
  async getTasksDueToday(): Promise<Task[]> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await this.getMyTasks({
      status: 'pending',
      dueBefore: tomorrow.toISOString(),
      dueAfter: today.toISOString().split('T')[0],
    });

    return response.results;
  },

  // Get overdue tasks
  async getOverdueTasks(): Promise<Task[]> {
    const response = await this.getMyTasks({
      status: 'pending',
      dueBefore: new Date().toISOString(),
      ordering: 'due_date',
    });

    return response.results;
  },

  // Invalidate task caches
  async invalidateTaskCaches(taskId?: string): Promise<void> {
    await cacheStorage.invalidate('tasks_');
    await cacheStorage.invalidate('task_stats');
    if (taskId) {
      const task = await storage.getItem<Task[]>(STORAGE_KEYS.CACHED_TASKS);
      if (task) {
        const workflowId = task.find((t) => t.id === taskId)?.workflowInstance.id;
        if (workflowId) {
          await cacheStorage.invalidate(`workflow_instance_${workflowId}`);
        }
      }
    }
  },

  // Offline support
  async getCachedTasks(): Promise<Task[]> {
    return await storage.getItem<Task[]>(STORAGE_KEYS.CACHED_TASKS) || [];
  },

  // Store pending action for offline sync
  async storePendingAction(action: {
    taskId: string;
    action: TaskAction;
    createdAt: string;
  }): Promise<void> {
    const pending = await storage.getItem<typeof action[]>('pending_task_actions') || [];
    pending.push(action);
    await storage.setItem('pending_task_actions', pending);
  },

  // Sync pending actions when back online
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    const pending = await storage.getItem<{
      taskId: string;
      action: TaskAction;
      createdAt: string;
    }[]>('pending_task_actions') || [];

    let success = 0;
    let failed = 0;
    const stillPending: typeof pending = [];

    for (const item of pending) {
      try {
        switch (item.action.action) {
          case 'approve':
            await this.approveTask(item.taskId, item.action.comment);
            break;
          case 'reject':
            await this.rejectTask(item.taskId, item.action.comment || '');
            break;
          case 'delegate':
            if (item.action.delegateTo) {
              await this.delegateTask(item.taskId, item.action.delegateTo, item.action.comment);
            }
            break;
        }
        success++;
      } catch {
        stillPending.push(item);
        failed++;
      }
    }

    await storage.setItem('pending_task_actions', stillPending);
    return { success, failed };
  },
};

export default workflowsService;
