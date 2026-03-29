import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { storage, cacheStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/constants/config';
import api from './api';
import { Document, Task, Notification } from '@/types';

// Types
export interface PendingAction {
  id: string;
  type: ActionType;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Record<string, unknown>;
  metadata: {
    entityType: EntityType;
    entityId?: string;
    description: string;
    createdAt: string;
    retryCount: number;
    maxRetries: number;
    priority: number;
  };
}

export type ActionType =
  | 'CREATE_DOCUMENT'
  | 'UPDATE_DOCUMENT'
  | 'DELETE_DOCUMENT'
  | 'APPROVE_TASK'
  | 'REJECT_TASK'
  | 'DELEGATE_TASK'
  | 'SIGN_DOCUMENT'
  | 'ADD_COMMENT'
  | 'UPDATE_PROFILE'
  | 'MARK_NOTIFICATION_READ'
  | 'GENERIC';

export type EntityType =
  | 'document'
  | 'task'
  | 'workflow'
  | 'notification'
  | 'signature'
  | 'profile'
  | 'generic';

export interface SyncResult {
  success: number;
  failed: number;
  pending: number;
  errors: Array<{ actionId: string; error: string }>;
}

export interface ConflictInfo {
  actionId: string;
  localVersion: Record<string, unknown>;
  serverVersion: Record<string, unknown>;
  timestamp: {
    local: string;
    server: string;
  };
}

export type ConflictResolution = 'local' | 'server' | 'merge' | 'manual';

export interface OfflineStatus {
  isOnline: boolean;
  connectionType: string | null;
  pendingActionsCount: number;
  lastSyncTime: string | null;
  isWifi: boolean;
}

export interface CachedEntity<T = unknown> {
  data: T;
  cachedAt: string;
  expiresAt: string;
  version: number;
}

// Generate unique ID for pending actions
function generateActionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

class OfflineService {
  private isOnline: boolean = true;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private syncInProgress: boolean = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Back online - sync pending actions
        this.syncPendingActions();
      }

      this.listeners.forEach((listener) => listener(this.isOnline));
    });
  }

  // Network status
  getIsOnline(): boolean {
    return this.isOnline;
  }

  async getNetworkStatus(): Promise<OfflineStatus> {
    const state = await NetInfo.fetch();
    const pendingActions = await this.getPendingActions();
    const lastSync = await storage.getItem<string>(STORAGE_KEYS.LAST_SYNC);

    return {
      isOnline: state.isConnected ?? false,
      connectionType: state.type,
      pendingActionsCount: pendingActions.length,
      lastSyncTime: lastSync,
      isWifi: state.type === 'wifi',
    };
  }

  addNetworkListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  subscribeToNetworkChanges(callback: (state: NetInfoState) => void): () => void {
    return NetInfo.addEventListener(callback);
  }

  // Pending actions management
  async getPendingActions(): Promise<PendingAction[]> {
    const actions = await storage.getItem<PendingAction[]>(STORAGE_KEYS.PENDING_ACTIONS);
    return actions || [];
  }

  async addPendingAction(action: Omit<PendingAction, 'id'>): Promise<PendingAction> {
    const actions = await this.getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: generateActionId(),
    };

    // Sort by priority (lower number = higher priority)
    const updatedActions = [...actions, newAction].sort(
      (a, b) => a.metadata.priority - b.metadata.priority
    );

    await storage.setItem(STORAGE_KEYS.PENDING_ACTIONS, updatedActions);
    return newAction;
  }

  async removePendingAction(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const filtered = actions.filter((a) => a.id !== actionId);
    await storage.setItem(STORAGE_KEYS.PENDING_ACTIONS, filtered);
  }

  async updatePendingAction(actionId: string, updates: Partial<PendingAction>): Promise<void> {
    const actions = await this.getPendingActions();
    const index = actions.findIndex((a) => a.id === actionId);

    if (index !== -1) {
      actions[index] = { ...actions[index], ...updates };
      await storage.setItem(STORAGE_KEYS.PENDING_ACTIONS, actions);
    }
  }

  async clearPendingActions(): Promise<void> {
    await storage.setItem(STORAGE_KEYS.PENDING_ACTIONS, []);
  }

  // Queue actions for offline execution
  async queueAction(
    type: ActionType,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: Record<string, unknown>,
    metadata?: Partial<PendingAction['metadata']>
  ): Promise<PendingAction> {
    const entityType = this.getEntityTypeFromActionType(type);

    return await this.addPendingAction({
      type,
      endpoint,
      method,
      data,
      metadata: {
        entityType,
        entityId: data?.id as string | undefined,
        description: this.getActionDescription(type),
        createdAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        priority: this.getActionPriority(type),
        ...metadata,
      },
    });
  }

  getEntityTypeFromActionType(type: ActionType): EntityType {
    const mapping: Record<ActionType, EntityType> = {
      CREATE_DOCUMENT: 'document',
      UPDATE_DOCUMENT: 'document',
      DELETE_DOCUMENT: 'document',
      APPROVE_TASK: 'task',
      REJECT_TASK: 'task',
      DELEGATE_TASK: 'task',
      SIGN_DOCUMENT: 'signature',
      ADD_COMMENT: 'document',
      UPDATE_PROFILE: 'profile',
      MARK_NOTIFICATION_READ: 'notification',
      GENERIC: 'generic',
    };
    return mapping[type];
  }

  getActionDescription(type: ActionType): string {
    const descriptions: Record<ActionType, string> = {
      CREATE_DOCUMENT: 'Creation de document',
      UPDATE_DOCUMENT: 'Mise a jour de document',
      DELETE_DOCUMENT: 'Suppression de document',
      APPROVE_TASK: 'Approbation de tache',
      REJECT_TASK: 'Rejet de tache',
      DELEGATE_TASK: 'Delegation de tache',
      SIGN_DOCUMENT: 'Signature de document',
      ADD_COMMENT: 'Ajout de commentaire',
      UPDATE_PROFILE: 'Mise a jour du profil',
      MARK_NOTIFICATION_READ: 'Marquer notification comme lue',
      GENERIC: 'Action generique',
    };
    return descriptions[type];
  }

  getActionPriority(type: ActionType): number {
    const priorities: Record<ActionType, number> = {
      SIGN_DOCUMENT: 1,
      APPROVE_TASK: 2,
      REJECT_TASK: 2,
      CREATE_DOCUMENT: 3,
      UPDATE_DOCUMENT: 4,
      DELEGATE_TASK: 5,
      DELETE_DOCUMENT: 6,
      ADD_COMMENT: 7,
      UPDATE_PROFILE: 8,
      MARK_NOTIFICATION_READ: 9,
      GENERIC: 10,
    };
    return priorities[type];
  }

  // Sync management
  async syncPendingActions(
    onProgress?: (current: number, total: number) => void
  ): Promise<SyncResult> {
    if (this.syncInProgress) {
      const actions = await this.getPendingActions();
      return { success: 0, failed: 0, pending: actions.length, errors: [] };
    }

    const status = await this.getNetworkStatus();
    if (!status.isOnline) {
      const actions = await this.getPendingActions();
      return { success: 0, failed: 0, pending: actions.length, errors: [] };
    }

    this.syncInProgress = true;
    const actions = await this.getPendingActions();
    const result: SyncResult = { success: 0, failed: 0, pending: 0, errors: [] };

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        if (onProgress) {
          onProgress(i + 1, actions.length);
        }

        try {
          await this.executeAction(action);
          await this.removePendingAction(action.id);
          result.success++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (action.metadata.retryCount < action.metadata.maxRetries) {
            await this.updatePendingAction(action.id, {
              metadata: {
                ...action.metadata,
                retryCount: action.metadata.retryCount + 1,
              },
            });
            result.pending++;
          } else {
            await this.removePendingAction(action.id);
            result.failed++;
            result.errors.push({ actionId: action.id, error: errorMessage });
          }
        }
      }

      await storage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  async executeAction(action: PendingAction): Promise<unknown> {
    switch (action.method) {
      case 'GET':
        return await api.get(action.endpoint, action.data);
      case 'POST':
        return await api.post(action.endpoint, action.data);
      case 'PUT':
        return await api.put(action.endpoint, action.data);
      case 'PATCH':
        return await api.patch(action.endpoint, action.data);
      case 'DELETE':
        return await api.delete(action.endpoint);
      default:
        throw new Error(`Unknown method: ${action.method}`);
    }
  }

  // Conflict resolution
  async checkForConflict(
    entityType: EntityType,
    entityId: string,
    localVersion: Record<string, unknown>
  ): Promise<ConflictInfo | null> {
    try {
      const endpoints: Record<EntityType, string> = {
        document: `/documents/${entityId}/`,
        task: `/tasks/${entityId}/`,
        workflow: `/workflows/${entityId}/`,
        notification: `/notifications/${entityId}/`,
        signature: `/signatures/${entityId}/`,
        profile: '/users/me/',
        generic: '',
      };

      const endpoint = endpoints[entityType];
      if (!endpoint) return null;

      const serverData = await api.get<Record<string, unknown>>(endpoint);
      const localUpdatedAt = localVersion.updatedAt as string;
      const serverUpdatedAt = serverData.updatedAt as string;

      if (serverUpdatedAt && localUpdatedAt && serverUpdatedAt > localUpdatedAt) {
        return {
          actionId: entityId,
          localVersion,
          serverVersion: serverData,
          timestamp: { local: localUpdatedAt, server: serverUpdatedAt },
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  resolveConflict(
    conflict: ConflictInfo,
    resolution: ConflictResolution
  ): Record<string, unknown> {
    switch (resolution) {
      case 'local':
        return conflict.localVersion;
      case 'server':
        return conflict.serverVersion;
      case 'merge':
        return {
          ...conflict.serverVersion,
          ...conflict.localVersion,
          updatedAt: new Date().toISOString(),
        };
      case 'manual':
      default:
        return conflict.localVersion;
    }
  }

  // Document caching
  async cacheDocuments(documents: Document[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CACHED_DOCUMENTS, documents);
    await this.updateLastSync();
  }

  async getCachedDocuments(): Promise<Document[]> {
    return (await storage.getItem<Document[]>(STORAGE_KEYS.CACHED_DOCUMENTS)) || [];
  }

  async cacheDocument(document: Document): Promise<void> {
    const documents = await this.getCachedDocuments();
    const index = documents.findIndex((d) => d.id === document.id);

    if (index >= 0) {
      documents[index] = document;
    } else {
      documents.unshift(document);
    }

    await this.cacheDocuments(documents);
  }

  // Document file caching for offline access
  async cacheDocumentFile(
    documentId: string,
    fileUrl: string,
    metadata: Record<string, unknown>
  ): Promise<string> {
    const documentDir = `${FileSystem.documentDirectory}offline/documents/`;

    const dirInfo = await FileSystem.getInfoAsync(documentDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(documentDir, { intermediates: true });
    }

    const extension = (metadata.extension as string) || '.pdf';
    const localPath = `${documentDir}${documentId}${extension}`;

    await FileSystem.downloadAsync(fileUrl, localPath);

    const metadataPath = `${documentDir}${documentId}.json`;
    await FileSystem.writeAsStringAsync(
      metadataPath,
      JSON.stringify({ ...metadata, cachedAt: new Date().toISOString() })
    );

    return localPath;
  }

  async getCachedDocumentFile(documentId: string): Promise<{
    localPath: string;
    metadata: Record<string, unknown>;
  } | null> {
    const documentDir = `${FileSystem.documentDirectory}offline/documents/`;
    const metadataPath = `${documentDir}${documentId}.json`;

    try {
      const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
      if (!metadataInfo.exists) return null;

      const metadataString = await FileSystem.readAsStringAsync(metadataPath);
      const metadata = JSON.parse(metadataString);

      const extension = (metadata.extension as string) || '.pdf';
      const localPath = `${documentDir}${documentId}${extension}`;

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) return null;

      return { localPath, metadata };
    } catch {
      return null;
    }
  }

  async removeCachedDocumentFile(documentId: string): Promise<void> {
    const documentDir = `${FileSystem.documentDirectory}offline/documents/`;

    try {
      const metadataPath = `${documentDir}${documentId}.json`;
      const metadataInfo = await FileSystem.getInfoAsync(metadataPath);

      if (metadataInfo.exists) {
        const metadataString = await FileSystem.readAsStringAsync(metadataPath);
        const metadata = JSON.parse(metadataString);
        const extension = (metadata.extension as string) || '.pdf';
        const localPath = `${documentDir}${documentId}${extension}`;

        await FileSystem.deleteAsync(localPath, { idempotent: true });
        await FileSystem.deleteAsync(metadataPath, { idempotent: true });
      }
    } catch (error) {
      console.error('Error removing cached document file:', error);
    }
  }

  // Task caching
  async cacheTasks(tasks: Task[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CACHED_TASKS, tasks);
  }

  async getCachedTasks(): Promise<Task[]> {
    return (await storage.getItem<Task[]>(STORAGE_KEYS.CACHED_TASKS)) || [];
  }

  // Notification caching
  async cacheNotifications(notifications: Notification[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CACHED_NOTIFICATIONS, notifications);
  }

  async getCachedNotifications(): Promise<Notification[]> {
    return (await storage.getItem<Notification[]>(STORAGE_KEYS.CACHED_NOTIFICATIONS)) || [];
  }

  // Bulk sync operations
  async syncDocuments(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const response = await api.get<{ results: Document[] }>('/documents/', {
        page_size: 50,
        ordering: '-updated_at',
      });
      await this.cacheDocuments(response.results);
    } catch (error) {
      console.error('Error syncing documents:', error);
    }
  }

  async syncTasks(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const response = await api.get<{ results: Task[] }>('/tasks/my/', {
        page_size: 50,
        status: 'pending',
      });
      await this.cacheTasks(response.results);
    } catch (error) {
      console.error('Error syncing tasks:', error);
    }
  }

  async syncAll(onProgress?: (step: string) => void): Promise<void> {
    if (!this.isOnline) return;

    if (onProgress) onProgress('Synchronisation des actions en attente...');
    await this.syncPendingActions();

    if (onProgress) onProgress('Synchronisation des documents...');
    await this.syncDocuments();

    if (onProgress) onProgress('Synchronisation des taches...');
    await this.syncTasks();

    if (onProgress) onProgress('Synchronisation terminee');

    await storage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  // Sync timestamp
  async updateLastSync(): Promise<void> {
    await storage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  async getLastSync(): Promise<Date | null> {
    const data = await storage.getItem<string>(STORAGE_KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  }

  // Storage cleanup
  async cleanupExpiredCache(): Promise<void> {
    await cacheStorage.cleanup();

    const documentDir = `${FileSystem.documentDirectory}offline/documents/`;

    try {
      const dirInfo = await FileSystem.getInfoAsync(documentDir);
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(documentDir);
      const metadataFiles = files.filter((f) => f.endsWith('.json'));
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (const file of metadataFiles) {
        const path = `${documentDir}${file}`;
        const content = await FileSystem.readAsStringAsync(path);
        const metadata = JSON.parse(content);
        const cachedAt = new Date(metadata.cachedAt);

        if (cachedAt < thirtyDaysAgo) {
          const documentId = file.replace('.json', '');
          await this.removeCachedDocumentFile(documentId);
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  // Get sync status for UI
  async getSyncStatus(): Promise<{
    lastSync: string | null;
    pendingCount: number;
    pendingActions: PendingAction[];
    isOnline: boolean;
  }> {
    const status = await this.getNetworkStatus();
    const actions = await this.getPendingActions();

    return {
      lastSync: status.lastSyncTime,
      pendingCount: actions.length,
      pendingActions: actions,
      isOnline: status.isOnline,
    };
  }

  // Clear all offline data
  async clearAll(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.CACHED_DOCUMENTS);
    await storage.removeItem(STORAGE_KEYS.CACHED_TASKS);
    await storage.removeItem(STORAGE_KEYS.CACHED_NOTIFICATIONS);
    await storage.removeItem(STORAGE_KEYS.PENDING_ACTIONS);
    await storage.removeItem(STORAGE_KEYS.LAST_SYNC);

    const documentDir = `${FileSystem.documentDirectory}offline/`;
    try {
      await FileSystem.deleteAsync(documentDir, { idempotent: true });
    } catch (error) {
      console.error('Error clearing offline directory:', error);
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;
