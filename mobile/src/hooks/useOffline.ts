import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import {
  offlineService,
  PendingAction,
  SyncResult,
  OfflineStatus,
  ActionType,
  ConflictInfo,
  ConflictResolution,
} from '@/services/offline';
import { Document, Task, Notification } from '@/types';

// Query keys
export const offlineKeys = {
  all: ['offline'] as const,
  status: () => [...offlineKeys.all, 'status'] as const,
  pendingActions: () => [...offlineKeys.all, 'pendingActions'] as const,
  cachedDocuments: () => [...offlineKeys.all, 'cachedDocuments'] as const,
  cachedTasks: () => [...offlineKeys.all, 'cachedTasks'] as const,
  cachedNotifications: () => [...offlineKeys.all, 'cachedNotifications'] as const,
  syncStatus: () => [...offlineKeys.all, 'syncStatus'] as const,
};

// Basic offline status hook
export function useOffline() {
  const [isOnline, setIsOnline] = useState(offlineService.getIsOnline());
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = offlineService.addNetworkListener(setIsOnline);

    const updateStatus = async () => {
      const actions = await offlineService.getPendingActions();
      setPendingActionsCount(actions.length);
      const sync = await offlineService.getLastSync();
      setLastSync(sync);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingActionsCount,
    hasPendingActions: pendingActionsCount > 0,
    lastSync,
  };
}

// Network status query
export function useNetworkStatus() {
  return useQuery({
    queryKey: offlineKeys.status(),
    queryFn: () => offlineService.getNetworkStatus(),
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  });
}

// Pending actions query
export function usePendingActions() {
  return useQuery({
    queryKey: offlineKeys.pendingActions(),
    queryFn: () => offlineService.getPendingActions(),
    refetchInterval: 5000,
  });
}

// Cached data queries
export function useCachedDocuments() {
  return useQuery({
    queryKey: offlineKeys.cachedDocuments(),
    queryFn: () => offlineService.getCachedDocuments(),
  });
}

export function useCachedTasks() {
  return useQuery({
    queryKey: offlineKeys.cachedTasks(),
    queryFn: () => offlineService.getCachedTasks(),
  });
}

export function useCachedNotifications() {
  return useQuery({
    queryKey: offlineKeys.cachedNotifications(),
    queryFn: () => offlineService.getCachedNotifications(),
  });
}

// Sync status query
export function useSyncStatus() {
  return useQuery({
    queryKey: offlineKeys.syncStatus(),
    queryFn: () => offlineService.getSyncStatus(),
    refetchInterval: 5000,
  });
}

// Queue action mutation
export function useQueueAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      endpoint,
      method,
      data,
    }: {
      type: ActionType;
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: Record<string, unknown>;
    }) => offlineService.queueAction(type, endpoint, method, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.pendingActions() });
      queryClient.invalidateQueries({ queryKey: offlineKeys.syncStatus() });
    },
  });
}

// Remove pending action mutation
export function useRemovePendingAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (actionId: string) => offlineService.removePendingAction(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.pendingActions() });
      queryClient.invalidateQueries({ queryKey: offlineKeys.syncStatus() });
    },
  });
}

// Clear all pending actions mutation
export function useClearPendingActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => offlineService.clearPendingActions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.pendingActions() });
      queryClient.invalidateQueries({ queryKey: offlineKeys.syncStatus() });
    },
  });
}

// Sync mutations
export function useSyncPendingActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (onProgress?: (current: number, total: number) => void) =>
      offlineService.syncPendingActions(onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.pendingActions() });
      queryClient.invalidateQueries({ queryKey: offlineKeys.syncStatus() });
      // Also invalidate data queries as they might have been updated
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useSyncAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (onProgress?: (step: string) => void) => offlineService.syncAll(onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.all });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Cache document file mutation
export function useCacheDocumentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      fileUrl,
      metadata,
    }: {
      documentId: string;
      fileUrl: string;
      metadata: Record<string, unknown>;
    }) => offlineService.cacheDocumentFile(documentId, fileUrl, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.cachedDocuments() });
    },
  });
}

// Remove cached document file mutation
export function useRemoveCachedDocumentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => offlineService.removeCachedDocumentFile(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.cachedDocuments() });
    },
  });
}

// Clear all offline data mutation
export function useClearAllOfflineData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => offlineService.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.all });
    },
  });
}

// Cleanup expired cache mutation
export function useCleanupExpiredCache() {
  return useMutation({
    mutationFn: () => offlineService.cleanupExpiredCache(),
  });
}

// Auto-sync hook - syncs when app comes to foreground
export function useAutoSync(options?: { enabled?: boolean; onSyncComplete?: (result: SyncResult) => void }) {
  const { enabled = true, onSyncComplete } = options || {};
  const syncPendingActions = useSyncPendingActions();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App came to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const isOnline = offlineService.getIsOnline();
        if (isOnline) {
          const result = await syncPendingActions.mutateAsync();
          if (onSyncComplete) {
            onSyncComplete(result);
          }
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [enabled, onSyncComplete, syncPendingActions]);
}

// Network change listener hook
export function useNetworkChangeListener(
  onOnline?: () => void,
  onOffline?: () => void
) {
  const wasOnlineRef = useRef(offlineService.getIsOnline());

  useEffect(() => {
    const unsubscribe = offlineService.addNetworkListener((isOnline) => {
      if (!wasOnlineRef.current && isOnline && onOnline) {
        onOnline();
      } else if (wasOnlineRef.current && !isOnline && onOffline) {
        onOffline();
      }
      wasOnlineRef.current = isOnline;
    });

    return unsubscribe;
  }, [onOnline, onOffline]);
}

// Conflict resolution hook
export function useConflictResolution() {
  const checkForConflict = useCallback(
    async (
      entityType: Parameters<typeof offlineService.checkForConflict>[0],
      entityId: string,
      localVersion: Record<string, unknown>
    ) => {
      return offlineService.checkForConflict(entityType, entityId, localVersion);
    },
    []
  );

  const resolveConflict = useCallback(
    (conflict: ConflictInfo, resolution: ConflictResolution) => {
      return offlineService.resolveConflict(conflict, resolution);
    },
    []
  );

  return { checkForConflict, resolveConflict };
}

// Offline-first data hook - returns cached data if offline
export function useOfflineFirst<T>(
  queryKey: string[],
  fetchFn: () => Promise<T>,
  getCached: () => Promise<T | null>,
  cacheData: (data: T) => Promise<void>
) {
  const { isOnline } = useOffline();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (isOnline) {
        try {
          const data = await fetchFn();
          await cacheData(data);
          return data;
        } catch {
          // Network error, try cached
          const cached = await getCached();
          if (cached) return cached;
          throw new Error('No data available');
        }
      } else {
        // Offline, use cached
        const cached = await getCached();
        if (cached) return cached;
        throw new Error('No cached data available');
      }
    },
  });
}

// Sync indicator hook - for showing sync status in UI
export function useSyncIndicator() {
  const { data: syncStatus, isLoading } = useSyncStatus();
  const syncPendingActions = useSyncPendingActions();

  return {
    isOnline: syncStatus?.isOnline ?? true,
    pendingCount: syncStatus?.pendingCount ?? 0,
    lastSync: syncStatus?.lastSync,
    isSyncing: syncPendingActions.isPending,
    sync: syncPendingActions.mutate,
    isLoading,
    showIndicator: (syncStatus?.pendingCount ?? 0) > 0 || syncPendingActions.isPending,
  };
}

// Combined offline utilities hook
export function useOfflineUtils() {
  const offline = useOffline();
  const queueAction = useQueueAction();
  const syncPendingActions = useSyncPendingActions();
  const syncAll = useSyncAll();
  const clearAll = useClearAllOfflineData();
  const cleanup = useCleanupExpiredCache();

  return {
    ...offline,
    queueAction: queueAction.mutate,
    queueActionAsync: queueAction.mutateAsync,
    sync: syncPendingActions.mutate,
    syncAsync: syncPendingActions.mutateAsync,
    syncAll: syncAll.mutate,
    syncAllAsync: syncAll.mutateAsync,
    clearAll: clearAll.mutate,
    cleanup: cleanup.mutate,
    isSyncing: syncPendingActions.isPending || syncAll.isPending,
  };
}

export default useOffline;
