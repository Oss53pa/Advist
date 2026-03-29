/**
 * Offline Storage Service using IndexedDB
 * Provides local data persistence for offline functionality
 */

import { generateSecureId } from '../utils/encryption';

const DB_NAME = 'advist-offline-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  DOCUMENTS: 'documents',
  WORKFLOWS: 'workflows',
  NOTIFICATIONS: 'notifications',
  PENDING_ACTIONS: 'pending-actions',
  USER_DATA: 'user-data',
  CACHED_FILES: 'cached-files',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: string;
  retries: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });

    return this.dbPromise;
  }

  /**
   * Create object stores
   */
  private createStores(db: IDBDatabase) {
    // Documents store
    if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
      const docStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
      docStore.createIndex('organization', 'organization_id');
      docStore.createIndex('updatedAt', 'updated_at');
      docStore.createIndex('status', 'status');
    }

    // Workflows store
    if (!db.objectStoreNames.contains(STORES.WORKFLOWS)) {
      const wfStore = db.createObjectStore(STORES.WORKFLOWS, { keyPath: 'id' });
      wfStore.createIndex('documentId', 'document_id');
      wfStore.createIndex('status', 'status');
    }

    // Notifications store
    if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
      const notifStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
      notifStore.createIndex('status', 'status');
      notifStore.createIndex('createdAt', 'created_at');
    }

    // Pending actions store (for sync)
    if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
      const pendingStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
        keyPath: 'id',
        autoIncrement: true,
      });
      pendingStore.createIndex('resource', 'resource');
      pendingStore.createIndex('timestamp', 'timestamp');
    }

    // User data store
    if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
      db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
    }

    // Cached files store
    if (!db.objectStoreNames.contains(STORES.CACHED_FILES)) {
      const filesStore = db.createObjectStore(STORES.CACHED_FILES, { keyPath: 'url' });
      filesStore.createIndex('documentId', 'document_id');
      filesStore.createIndex('cachedAt', 'cached_at');
    }
  }

  /**
   * Get database connection
   */
  private async getDB(): Promise<IDBDatabase> {
    return this.db || this.init();
  }

  // ==========================================
  // GENERIC CRUD OPERATIONS
  // ==========================================

  /**
   * Get item by ID
   */
  async get<T>(storeName: StoreName, id: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from store
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save item
   */
  async save<T>(storeName: StoreName, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save multiple items
   */
  async saveMany<T>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      items.forEach((item) => store.put(item));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete item
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear store
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // DOCUMENT OPERATIONS
  // ==========================================

  async saveDocument(document: any): Promise<void> {
    await this.save(STORES.DOCUMENTS, {
      ...document,
      _offlineUpdated: new Date().toISOString(),
    });
  }

  async getDocument(id: string): Promise<any> {
    return this.get(STORES.DOCUMENTS, id);
  }

  async getAllDocuments(): Promise<any[]> {
    return this.getAll(STORES.DOCUMENTS);
  }

  async getDocumentsByOrganization(orgId: string): Promise<any[]> {
    return this.getByIndex(STORES.DOCUMENTS, 'organization', orgId);
  }

  // ==========================================
  // PENDING ACTIONS (FOR SYNC)
  // ==========================================

  async addPendingAction(action: Omit<PendingAction, 'id'>): Promise<void> {
    await this.save(STORES.PENDING_ACTIONS, {
      ...action,
      id: generateSecureId(),
    });
  }

  async getPendingActions(): Promise<PendingAction[]> {
    return this.getAll(STORES.PENDING_ACTIONS);
  }

  async removePendingAction(id: string): Promise<void> {
    await this.delete(STORES.PENDING_ACTIONS, id);
  }

  async getPendingActionCount(): Promise<number> {
    const actions = await this.getPendingActions();
    return actions.length;
  }

  // ==========================================
  // USER DATA
  // ==========================================

  async saveUserData(key: string, value: any): Promise<void> {
    await this.save(STORES.USER_DATA, { key, value });
  }

  async getUserData(key: string): Promise<any> {
    const result = await this.get<{ key: string; value: any }>(STORES.USER_DATA, key);
    return result?.value;
  }

  // ==========================================
  // FILE CACHING
  // ==========================================

  async cacheFile(url: string, documentId: string, blob: Blob): Promise<void> {
    await this.save(STORES.CACHED_FILES, {
      url,
      document_id: documentId,
      blob,
      cached_at: new Date().toISOString(),
    });
  }

  async getCachedFile(url: string): Promise<Blob | null> {
    const result = await this.get<{ blob: Blob }>(STORES.CACHED_FILES, url);
    return result?.blob || null;
  }

  async clearOldCache(maxAgeDays: number = 7): Promise<void> {
    const files = await this.getAll<{ url: string; cached_at: string }>(STORES.CACHED_FILES);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);

    for (const file of files) {
      if (new Date(file.cached_at) < cutoff) {
        await this.delete(STORES.CACHED_FILES, file.url);
      }
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
