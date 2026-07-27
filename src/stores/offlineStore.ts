/**
 * Offline Store - Zustand store for offline state management
 */

import { create } from 'zustand';
import { OfflineAction } from '../types';
import { offlineService } from '../services/offline';

interface OfflineState {
  // Connection status
  isOnline: boolean;
  lastOnlineAt: string | null;

  // Pending actions
  pendingActions: OfflineAction[];
  pendingCount: number;

  // Sync status
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncResult: { synced: number; failed: number } | null;

  // Storage stats
  cachedDocuments: number;
  estimatedSize: string;

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  loadPendingActions: () => Promise<void>;
  addOfflineAction: (
    action: Omit<OfflineAction, 'id' | 'synced' | 'synced_at'>
  ) => Promise<OfflineAction>;
  syncNow: () => Promise<void>;
  refreshStorageStats: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  init: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  // Initial state
  isOnline: navigator.onLine,
  lastOnlineAt: navigator.onLine ? new Date().toISOString() : null,
  pendingActions: [],
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,
  lastSyncResult: null,
  cachedDocuments: 0,
  estimatedSize: '0 B',

  // Set online status
  setOnlineStatus: (isOnline) => {
    set({
      isOnline,
      lastOnlineAt: isOnline ? new Date().toISOString() : get().lastOnlineAt,
    });

    // Auto-sync when coming back online
    if (isOnline && get().pendingCount > 0) {
      get().syncNow();
    }
  },

  // Load pending actions from IndexedDB
  loadPendingActions: async () => {
    try {
      const actions = await offlineService.getPendingActions();
      set({
        pendingActions: actions,
        pendingCount: actions.length,
      });
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  },

  // Add a new offline action
  addOfflineAction: async (actionData) => {
    try {
      const action = await offlineService.saveOfflineAction(actionData);

      set((state) => ({
        pendingActions: [...state.pendingActions, action],
        pendingCount: state.pendingCount + 1,
      }));

      return action;
    } catch (error) {
      console.error('Failed to save offline action:', error);
      throw error;
    }
  },

  // Sync all pending actions
  syncNow: async () => {
    if (get().isSyncing || !get().isOnline) return;

    set({ isSyncing: true });

    try {
      const result = await offlineService.syncPendingActions();

      // Reload pending actions
      await get().loadPendingActions();

      set({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        lastSyncResult: result,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      set({ isSyncing: false });
    }
  },

  // Refresh storage statistics
  refreshStorageStats: async () => {
    try {
      const stats = await offlineService.getStorageStats();
      set({
        cachedDocuments: stats.cachedDocuments,
        estimatedSize: stats.estimatedSize,
        pendingCount: stats.pendingActions,
      });
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }
  },

  // Clear all offline data
  clearOfflineData: async () => {
    try {
      await offlineService.clearAllData();
      set({
        pendingActions: [],
        pendingCount: 0,
        cachedDocuments: 0,
        estimatedSize: '0 B',
        lastSyncAt: null,
        lastSyncResult: null,
      });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  },

  // Initialize the offline store
  init: async () => {
    try {
      // Initialize IndexedDB
      await offlineService.init();

      // Load initial data
      await get().loadPendingActions();
      await get().refreshStorageStats();

      // Subscribe to online/offline events
      offlineService.subscribe((isOnline) => {
        get().setOnlineStatus(isOnline);
      });

      // Clear expired cache
      await offlineService.clearExpiredCache();
    } catch (error) {
      console.error('Failed to initialize offline store:', error);
    }
  },
}));

export default useOfflineStore;
