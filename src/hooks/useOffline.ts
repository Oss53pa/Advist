/**
 * Offline Mode Hook
 * Manages offline state, service worker, and data synchronization
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage } from '../services/offlineStorage';

interface OfflineState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  pendingActionsCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

interface UseOfflineResult extends OfflineState {
  registerServiceWorker: () => Promise<void>;
  sync: () => Promise<void>;
  cacheDocument: (url: string) => void;
  clearCache: () => void;
  getPendingActions: () => Promise<any[]>;
}

export function useOffline(): UseOfflineResult {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isServiceWorkerReady: false,
    pendingActionsCount: 0,
    isSyncing: false,
    lastSyncTime: null,
  });

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: new Date(),
          pendingActionsCount: 0,
        }));
        // Refresh pending count
        updatePendingCount();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update pending actions count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineStorage.getPendingActionCount();
      setState((prev) => ({ ...prev, pendingActionsCount: count }));
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      swRegistrationRef.current = registration;

      console.log('Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New Service Worker available');
              // Optionally show update notification
            }
          });
        }
      });

      // Service worker is ready
      await navigator.serviceWorker.ready;
      setState((prev) => ({ ...prev, isServiceWorkerReady: true }));

      // Initialize IndexedDB
      await offlineStorage.init();

      // Get initial pending count
      updatePendingCount();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, [updatePendingCount]);

  // Trigger background sync
  const triggerSync = useCallback(async () => {
    if (!swRegistrationRef.current) return;

    try {
      if ('sync' in swRegistrationRef.current) {
        await (swRegistrationRef.current as any).sync.register('advist-sync');
        setState((prev) => ({ ...prev, isSyncing: true }));
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  }, []);

  // Manual sync
  const sync = useCallback(async () => {
    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const pendingActions = await offlineStorage.getPendingActions();

      for (const action of pendingActions) {
        try {
          // Attempt to sync each action
          const response = await fetch(`/api/${action.resource}/`, {
            method: action.type === 'create' ? 'POST' : action.type === 'update' ? 'PUT' : 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(action.data),
          });

          if (response.ok) {
            await offlineStorage.removePendingAction(action.id);
          }
        } catch (error) {
          console.error('Failed to sync action:', action.id, error);
        }
      }

      await updatePendingCount();
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [updatePendingCount]);

  // Cache a document for offline use
  const cacheDocument = useCallback((url: string) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_DOCUMENT',
        url,
      });
    }
  }, []);

  // Clear all caches
  const clearCache = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
      });
    }
    // Also clear IndexedDB
    offlineStorage.clear('documents');
    offlineStorage.clear('workflows');
    offlineStorage.clear('cached-files');
  }, []);

  // Get pending actions
  const getPendingActions = useCallback(async () => {
    return offlineStorage.getPendingActions();
  }, []);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  return {
    ...state,
    registerServiceWorker,
    sync,
    cacheDocument,
    clearCache,
    getPendingActions,
  };
}

/**
 * Hook for offline data operations
 */
export function useOfflineData<T>(
  key: string,
  fetchOnline: () => Promise<T[]>,
  storeName: 'documents' | 'workflows' | 'notifications' = 'documents'
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const { isOnline } = useOffline();

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      if (isOnline) {
        // Fetch from network
        const onlineData = await fetchOnline();
        setData(onlineData);
        setIsStale(false);

        // Cache for offline use
        await offlineStorage.saveMany(storeName, onlineData);
      } else {
        // Load from offline storage
        const offlineData = await offlineStorage.getAll<T>(storeName);
        setData(offlineData);
        setIsStale(true);
      }
    } catch (error) {
      // Network failed, try offline
      console.warn('Network fetch failed, loading offline data');
      const offlineData = await offlineStorage.getAll<T>(storeName);
      setData(offlineData);
      setIsStale(true);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, fetchOnline, storeName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    isStale,
    refresh: loadData,
  };
}

export default useOffline;
