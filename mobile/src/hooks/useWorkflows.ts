import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  workflowsService,
  TaskFilters,
  WorkflowFilters,
  CreateWorkflowData,
} from '@/services/workflows';
import { Task, WorkflowInstance, WorkflowTemplate } from '@/types';

// Query keys
export const workflowKeys = {
  all: ['workflows'] as const,
  templates: () => [...workflowKeys.all, 'templates'] as const,
  template: (id: string) => [...workflowKeys.templates(), id] as const,
  instances: () => [...workflowKeys.all, 'instances'] as const,
  instance: (id: string) => [...workflowKeys.instances(), id] as const,
  timeline: (id: string) => [...workflowKeys.instance(id), 'timeline'] as const,
  documentWorkflows: (documentId: string) => [...workflowKeys.instances(), 'document', documentId] as const,
};

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
  dueToday: () => [...taskKeys.all, 'dueToday'] as const,
  overdue: () => [...taskKeys.all, 'overdue'] as const,
  delegationSuggestions: (taskId: string) => [...taskKeys.detail(taskId), 'delegation'] as const,
  cached: () => [...taskKeys.all, 'cached'] as const,
};

// Workflow Templates
export function useWorkflowTemplates() {
  return useQuery({
    queryKey: workflowKeys.templates(),
    queryFn: () => workflowsService.getTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useWorkflowTemplate(id: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.template(id),
    queryFn: () => workflowsService.getTemplate(id),
    enabled: enabled && !!id,
    staleTime: 30 * 60 * 1000,
  });
}

export function useTemplatesForDocument(documentTypeId: string, enabled = true) {
  return useQuery({
    queryKey: [...workflowKeys.templates(), 'forDocument', documentTypeId],
    queryFn: () => workflowsService.getTemplatesForDocument(documentTypeId),
    enabled: enabled && !!documentTypeId,
  });
}

// Workflow Instances
export function useWorkflowInstances(filters?: WorkflowFilters) {
  return useInfiniteQuery({
    queryKey: [...workflowKeys.instances(), filters],
    queryFn: ({ pageParam = 1 }) =>
      workflowsService.getInstances({
        ...filters,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
  });
}

export function useWorkflowInstance(id: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.instance(id),
    queryFn: () => workflowsService.getInstance(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDocumentWorkflows(documentId: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.documentWorkflows(documentId),
    queryFn: () => workflowsService.getInstancesForDocument(documentId),
    enabled: enabled && !!documentId,
  });
}

export function useWorkflowTimeline(instanceId: string, enabled = true) {
  return useQuery({
    queryKey: workflowKeys.timeline(instanceId),
    queryFn: () => workflowsService.getWorkflowTimeline(instanceId),
    enabled: enabled && !!instanceId,
  });
}

// Create workflow mutation
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkflowData) => workflowsService.createWorkflow(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.instances() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.documentWorkflows(variables.documentId),
      });
    },
  });
}

// Cancel workflow mutation
export function useCancelWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ instanceId, reason }: { instanceId: string; reason: string }) =>
      workflowsService.cancelWorkflow(instanceId, reason),
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.instance(instanceId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Tasks
export function useTasks(filters?: TaskFilters) {
  return useInfiniteQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      workflowsService.getMyTasks({
        ...filters,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
  });
}

export function useTask(taskId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => workflowsService.getTask(taskId),
    enabled: enabled && !!taskId,
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => workflowsService.getTaskStats(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function usePendingTasksCount() {
  const { data: stats } = useTaskStats();
  return stats?.pending ?? 0;
}

export function useTasksDueToday() {
  return useQuery({
    queryKey: taskKeys.dueToday(),
    queryFn: () => workflowsService.getTasksDueToday(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: taskKeys.overdue(),
    queryFn: () => workflowsService.getOverdueTasks(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDelegationSuggestions(taskId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.delegationSuggestions(taskId),
    queryFn: () => workflowsService.getDelegationSuggestions(taskId),
    enabled: enabled && !!taskId,
  });
}

export function useCachedTasks() {
  return useQuery({
    queryKey: taskKeys.cached(),
    queryFn: () => workflowsService.getCachedTasks(),
  });
}

// Task actions
export function useApproveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, comment }: { taskId: string; comment?: string }) =>
      workflowsService.approveTask(taskId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowKeys.instances() });
    },
  });
}

export function useRejectTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, comment }: { taskId: string; comment: string }) =>
      workflowsService.rejectTask(taskId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowKeys.instances() });
    },
  });
}

export function useDelegateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      userId,
      comment,
    }: {
      taskId: string;
      userId: string;
      comment?: string;
    }) => workflowsService.delegateTask(taskId, userId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useRequestMoreInfo() {
  return useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) =>
      workflowsService.requestMoreInfo(taskId, message),
  });
}

// Batch actions
export function useBatchApproveTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIds, comment }: { taskIds: string[]; comment?: string }) =>
      workflowsService.batchApprove(taskIds, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowKeys.instances() });
    },
  });
}

export function useBatchRejectTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIds, comment }: { taskIds: string[]; comment: string }) =>
      workflowsService.batchReject(taskIds, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowKeys.instances() });
    },
  });
}

// Sync pending actions (for offline support)
export function useSyncPendingActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => workflowsService.syncPendingActions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: workflowKeys.instances() });
    },
  });
}
