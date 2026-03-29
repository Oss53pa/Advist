/**
 * Offline Service - IndexedDB storage and sync management
 * Version 2.0 - Full offline support for mobile
 */

import { OfflineAction, Document, DocumentComment } from '../types';
import { generateSecureId } from '../utils/encryption';

const DB_NAME = 'advist_offline_db';
const DB_VERSION = 1;

// Store names
const STORES = {
  OFFLINE_ACTIONS: 'offline_actions',
  CACHED_DOCUMENTS: 'cached_documents',
  CACHED_COMMENTS: 'cached_comments',
  SYNC_QUEUE: 'sync_queue',
} as const;

interface CachedDocument {
  id: number;
  document: Document;
  cachedAt: string;
  expiresAt: string;
}

interface CachedComment {
  id: number;
  documentId: number;
  comment: DocumentComment;
  cachedAt: string;
}

interface SyncQueueItem {
  id: string;
  action: OfflineAction;
  retries: number;
  lastAttempt?: string;
  error?: string;
}

class OfflineService {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.initListeners();
  }

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create offline actions store
        if (!db.objectStoreNames.contains(STORES.OFFLINE_ACTIONS)) {
          const actionsStore = db.createObjectStore(STORES.OFFLINE_ACTIONS, { keyPath: 'id' });
          actionsStore.createIndex('synced', 'synced', { unique: false });
          actionsStore.createIndex('type', 'type', { unique: false });
          actionsStore.createIndex('document_id', 'document_id', { unique: false });
        }

        // Create cached documents store
        if (!db.objectStoreNames.contains(STORES.CACHED_DOCUMENTS)) {
          const docsStore = db.createObjectStore(STORES.CACHED_DOCUMENTS, { keyPath: 'id' });
          docsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // Create cached comments store
        if (!db.objectStoreNames.contains(STORES.CACHED_COMMENTS)) {
          const commentsStore = db.createObjectStore(STORES.CACHED_COMMENTS, { keyPath: 'id' });
          commentsStore.createIndex('documentId', 'documentId', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('retries', 'retries', { unique: false });
        }
      };
    });
  }

  /**
   * Initialize online/offline event listeners
   */
  private initListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  /**
   * Subscribe to online status changes
   */
  subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.isOnline));
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // ==================== OFFLINE ACTIONS ====================

  /**
   * Save an offline action
   */
  async saveOfflineAction(action: Omit<OfflineAction, 'id' | 'synced' | 'synced_at'>): Promise<OfflineAction> {
    if (!this.db) await this.init();

    const offlineAction: OfflineAction = {
      ...action,
      id: generateSecureId('offline'),
      synced: false,
      created_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.OFFLINE_ACTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const request = store.add(offlineAction);

      request.onsuccess = () => {
        // Also add to sync queue
        this.addToSyncQueue(offlineAction);
        resolve(offlineAction);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending offline actions
   */
  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.OFFLINE_ACTIONS], 'readonly');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark an action as synced
   */
  async markActionSynced(actionId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.OFFLINE_ACTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const getRequest = store.get(actionId);

      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.synced = true;
          action.synced_at = new Date().toISOString();
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Update action with error
   */
  async markActionError(actionId: string, error: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.OFFLINE_ACTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_ACTIONS);
      const getRequest = store.get(actionId);

      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.error = error;
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ==================== DOCUMENT CACHING ====================

  /**
   * Cache a document for offline access
   */
  async cacheDocument(document: Document, expirationHours: number = 24): Promise<void> {
    if (!this.db) await this.init();

    const cachedDoc: CachedDocument = {
      id: document.id,
      document,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHED_DOCUMENTS], 'readwrite');
      const store = transaction.objectStore(STORES.CACHED_DOCUMENTS);
      const request = store.put(cachedDoc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a cached document
   */
  async getCachedDocument(documentId: number): Promise<Document | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHED_DOCUMENTS], 'readonly');
      const store = transaction.objectStore(STORES.CACHED_DOCUMENTS);
      const request = store.get(documentId);

      request.onsuccess = () => {
        const cached = request.result as CachedDocument | undefined;
        if (cached && new Date(cached.expiresAt) > new Date()) {
          resolve(cached.document);
        } else {
          // Remove expired document
          if (cached) {
            this.removeCachedDocument(documentId);
          }
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all cached documents
   */
  async getAllCachedDocuments(): Promise<Document[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHED_DOCUMENTS], 'readonly');
      const store = transaction.objectStore(STORES.CACHED_DOCUMENTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const now = new Date();
        const validDocs = (request.result as CachedDocument[])
          .filter(cached => new Date(cached.expiresAt) > now)
          .map(cached => cached.document);
        resolve(validDocs);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove a cached document
   */
  async removeCachedDocument(documentId: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHED_DOCUMENTS], 'readwrite');
      const store = transaction.objectStore(STORES.CACHED_DOCUMENTS);
      const request = store.delete(documentId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== COMMENT CACHING ====================

  /**
   * Cache comments for a document
   */
  async cacheComments(documentId: number, comments: DocumentComment[]): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([STORES.CACHED_COMMENTS], 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_COMMENTS);

    for (const comment of comments) {
      const cached: CachedComment = {
        id: comment.id,
        documentId,
        comment,
        cachedAt: new Date().toISOString(),
      };
      store.put(cached);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get cached comments for a document
   */
  async getCachedComments(documentId: number): Promise<DocumentComment[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHED_COMMENTS], 'readonly');
      const store = transaction.objectStore(STORES.CACHED_COMMENTS);
      const index = store.index('documentId');
      const request = index.getAll(IDBKeyRange.only(documentId));

      request.onsuccess = () => {
        const comments = (request.result as CachedComment[]).map(c => c.comment);
        resolve(comments);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==================== SYNC QUEUE ====================

  /**
   * Add action to sync queue
   */
  private async addToSyncQueue(action: OfflineAction): Promise<void> {
    if (!this.db) return;

    const queueItem: SyncQueueItem = {
      id: action.id,
      action,
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.add(queueItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove from sync queue
   */
  private async removeFromSyncQueue(actionId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.delete(actionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items in sync queue
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update sync queue item with retry info
   */
  private async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== SYNC ====================

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getSyncQueue();

      for (const item of queue) {
        if (item.retries >= 3) {
          // Max retries reached, mark as failed permanently
          await this.markActionError(item.action.id, 'Max retries exceeded');
          await this.removeFromSyncQueue(item.id);
          failed++;
          continue;
        }

        try {
          await this.syncAction(item.action);
          await this.markActionSynced(item.action.id);
          await this.removeFromSyncQueue(item.id);
          synced++;
        } catch (error) {
          item.retries++;
          item.lastAttempt = new Date().toISOString();
          item.error = error instanceof Error ? error.message : 'Unknown error';
          await this.updateSyncQueueItem(item);
          failed++;
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    return { synced, failed };
  }

  /**
   * Sync a single action to the server
   */
  private async syncAction(action: OfflineAction): Promise<void> {
    // This would make actual API calls based on action type
    // For now, we simulate the sync
    const { type, document_id, payload } = action;

    switch (type) {
      case 'comment':
        // await api.post(`/documents/${document_id}/comments/`, payload);
        console.log(`Syncing comment for document ${document_id}:`, payload);
        break;

      case 'validation':
        // await api.post(`/workflows/steps/${step_id}/validate/`, payload);
        console.log(`Syncing validation for workflow step:`, payload);
        break;

      case 'annotation':
        // await api.post(`/documents/${document_id}/annotations/`, payload);
        console.log(`Syncing annotation for document ${document_id}:`, payload);
        break;

      default:
        console.warn(`Unknown action type: ${type}`);
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // ==================== STORAGE MANAGEMENT ====================

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    pendingActions: number;
    cachedDocuments: number;
    syncQueueSize: number;
    estimatedSize: string;
  }> {
    if (!this.db) await this.init();

    const pendingActions = (await this.getPendingActions()).length;
    const cachedDocuments = (await this.getAllCachedDocuments()).length;
    const syncQueueSize = (await this.getSyncQueue()).length;

    // Estimate storage size
    let estimatedBytes = 0;
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      estimatedBytes = estimate.usage || 0;
    }

    const estimatedSize = this.formatBytes(estimatedBytes);

    return {
      pendingActions,
      cachedDocuments,
      syncQueueSize,
      estimatedSize,
    };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    const stores = Object.values(STORES);
    const transaction = this.db!.transaction(stores, 'readwrite');

    for (const storeName of stores) {
      transaction.objectStore(storeName).clear();
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Clear expired cached documents
   */
  async clearExpiredCache(): Promise<number> {
    if (!this.db) await this.init();

    let cleared = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHED_DOCUMENTS], 'readwrite');
      const store = transaction.objectStore(STORES.CACHED_DOCUMENTS);
      const request = store.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const cached = cursor.value as CachedDocument;
          if (new Date(cached.expiresAt) < new Date()) {
            cursor.delete();
            cleared++;
          }
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve(cleared);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
export default offlineService;
