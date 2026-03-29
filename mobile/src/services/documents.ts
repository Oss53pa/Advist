import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from './api';
import { cacheStorage, storage } from '@/utils/storage';
import { Document, DocumentType, PaginatedResponse, User } from '@/types';
import { STORAGE_KEYS, CACHE_CONFIG, FILE_UPLOAD } from '@/constants/config';

// Types
export interface DocumentFilters {
  status?: string;
  type?: string;
  search?: string;
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  pageSize?: number;
  ordering?: string;
  isFavorite?: boolean;
  createdBy?: string;
}

export interface CreateDocumentData {
  title: string;
  description?: string;
  typeId: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ShareDocumentData {
  userIds: string[];
  permission: 'view' | 'edit' | 'sign';
  message?: string;
  expiresAt?: string;
}

export interface DocumentShare {
  id: string;
  user: User;
  permission: 'view' | 'edit' | 'sign';
  createdAt: string;
  expiresAt?: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  createdBy: User;
  createdAt: string;
  comment?: string;
}

export interface DocumentActivity {
  id: string;
  action: 'created' | 'updated' | 'viewed' | 'downloaded' | 'signed' | 'shared' | 'workflow_started';
  user: User;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentComment {
  id: string;
  content: string;
  user: User;
  page?: number;
  position?: { x: number; y: number };
  parentId?: string;
  replies?: DocumentComment[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Validation helpers
function validateFileSize(size: number): boolean {
  return size <= FILE_UPLOAD.MAX_SIZE_BYTES;
}

function validateFileType(mimeType: string): boolean {
  return FILE_UPLOAD.ALLOWED_TYPES.includes(mimeType);
}

export const documentsService = {
  // Document CRUD
  async getDocuments(filters?: DocumentFilters): Promise<PaginatedResponse<Document>> {
    const cacheKey = `documents_${JSON.stringify(filters)}`;

    // Try cache first for quick load
    const cached = await cacheStorage.get<PaginatedResponse<Document>>(cacheKey);
    if (cached) {
      // Fetch fresh data in background
      this.fetchAndCacheDocuments(filters, cacheKey);
      return cached;
    }

    return await this.fetchAndCacheDocuments(filters, cacheKey);
  },

  async fetchAndCacheDocuments(
    filters?: DocumentFilters,
    cacheKey?: string
  ): Promise<PaginatedResponse<Document>> {
    const params: Record<string, unknown> = {};

    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.tags?.length) params.tags = filters.tags.join(',');
      if (filters.createdAfter) params.created_after = filters.createdAfter;
      if (filters.createdBefore) params.created_before = filters.createdBefore;
      if (filters.page) params.page = filters.page;
      if (filters.pageSize) params.page_size = filters.pageSize;
      if (filters.ordering) params.ordering = filters.ordering;
      if (filters.isFavorite) params.is_favorite = filters.isFavorite;
      if (filters.createdBy) params.created_by = filters.createdBy;
    }

    const response = await api.get<PaginatedResponse<Document>>('/documents/', params);

    if (cacheKey) {
      await cacheStorage.set(cacheKey, response, CACHE_CONFIG.DOCUMENTS_TTL);
    }

    return response;
  },

  async getDocument(id: string): Promise<Document> {
    const cacheKey = `document_${id}`;
    const cached = await cacheStorage.get<Document>(cacheKey);

    if (cached) {
      this.fetchAndCacheDocument(id, cacheKey);
      return cached;
    }

    return await this.fetchAndCacheDocument(id, cacheKey);
  },

  async fetchAndCacheDocument(id: string, cacheKey?: string): Promise<Document> {
    const response = await api.get<Document>(`/documents/${id}/`);

    if (cacheKey) {
      await cacheStorage.set(cacheKey, response, CACHE_CONFIG.DOCUMENTS_TTL);
    }

    return response;
  },

  async createDocument(
    data: CreateDocumentData,
    file: FormData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Document> {
    // Append metadata to form data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        file.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });

    const document = await api.uploadFile<Document>(
      '/documents/',
      file,
      onProgress ? (progress) => {
        onProgress({
          loaded: progress,
          total: 100,
          percentage: progress,
        });
      } : undefined
    );

    // Invalidate cache
    await cacheStorage.invalidate('documents_');

    return document;
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    const document = await api.patch<Document>(`/documents/${id}/`, data);

    // Update cache
    await cacheStorage.set(`document_${id}`, document, CACHE_CONFIG.DOCUMENTS_TTL);
    await cacheStorage.invalidate('documents_');

    return document;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}/`);

    // Invalidate cache
    await cacheStorage.invalidate(`document_${id}`);
    await cacheStorage.invalidate('documents_');
  },

  // Version management
  async uploadVersion(
    id: string,
    file: FormData,
    comment?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Document> {
    if (comment) {
      file.append('comment', comment);
    }

    const document = await api.uploadFile<Document>(
      `/documents/${id}/upload_version/`,
      file,
      onProgress ? (progress) => {
        onProgress({
          loaded: progress,
          total: 100,
          percentage: progress,
        });
      } : undefined
    );

    // Update cache
    await cacheStorage.set(`document_${id}`, document, CACHE_CONFIG.DOCUMENTS_TTL);
    await cacheStorage.invalidate('documents_');

    return document;
  },

  async getVersions(id: string): Promise<DocumentVersion[]> {
    return await api.get<DocumentVersion[]>(`/documents/${id}/versions/`);
  },

  async revertToVersion(documentId: string, versionId: string): Promise<Document> {
    const document = await api.post<Document>(
      `/documents/${documentId}/revert/`,
      { version_id: versionId }
    );

    await cacheStorage.set(`document_${documentId}`, document, CACHE_CONFIG.DOCUMENTS_TTL);
    return document;
  },

  // Document locking
  async lockDocument(id: string): Promise<Document> {
    const document = await api.post<Document>(`/documents/${id}/lock/`);
    await cacheStorage.set(`document_${id}`, document, CACHE_CONFIG.DOCUMENTS_TTL);
    return document;
  },

  async unlockDocument(id: string): Promise<Document> {
    const document = await api.post<Document>(`/documents/${id}/unlock/`);
    await cacheStorage.set(`document_${id}`, document, CACHE_CONFIG.DOCUMENTS_TTL);
    return document;
  },

  // Download and sharing
  async downloadDocument(
    id: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // Get document info first
    const document = await this.getDocument(id);

    // Create local file path
    const fileName = document.title.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = document.mimeType.split('/')[1] || 'pdf';
    const localUri = `${FileSystem.documentDirectory}${fileName}.${extension}`;

    // Download the file
    const downloadResult = await FileSystem.createDownloadResumable(
      document.fileUrl,
      localUri,
      {},
      (downloadProgress) => {
        if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress = Math.round(
            (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
          );
          onProgress(progress);
        }
      }
    ).downloadAsync();

    if (!downloadResult?.uri) {
      throw new Error('Echec du telechargement');
    }

    // Log the download activity
    await api.post(`/documents/${id}/log_activity/`, { action: 'downloaded' });

    return downloadResult.uri;
  },

  async shareDocumentFile(id: string): Promise<void> {
    const localUri = await this.downloadDocument(id);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localUri);
    } else {
      throw new Error('Le partage n\'est pas disponible sur cet appareil');
    }
  },

  // Document sharing with users
  async shareDocument(id: string, data: ShareDocumentData): Promise<DocumentShare[]> {
    const shares = await api.post<DocumentShare[]>(`/documents/${id}/share/`, {
      user_ids: data.userIds,
      permission: data.permission,
      message: data.message,
      expires_at: data.expiresAt,
    });

    await cacheStorage.invalidate(`document_${id}`);
    return shares;
  },

  async getDocumentShares(id: string): Promise<DocumentShare[]> {
    return await api.get<DocumentShare[]>(`/documents/${id}/shares/`);
  },

  async revokeShare(documentId: string, shareId: string): Promise<void> {
    await api.delete(`/documents/${documentId}/shares/${shareId}/`);
    await cacheStorage.invalidate(`document_${documentId}`);
  },

  async updateSharePermission(
    documentId: string,
    shareId: string,
    permission: 'view' | 'edit' | 'sign'
  ): Promise<DocumentShare> {
    return await api.patch<DocumentShare>(
      `/documents/${documentId}/shares/${shareId}/`,
      { permission }
    );
  },

  // Favorites
  async toggleFavorite(id: string): Promise<Document> {
    const document = await api.post<Document>(`/documents/${id}/toggle_favorite/`);
    await cacheStorage.set(`document_${id}`, document, CACHE_CONFIG.DOCUMENTS_TTL);
    await cacheStorage.invalidate('documents_');
    return document;
  },

  async getFavorites(): Promise<Document[]> {
    const response = await api.get<PaginatedResponse<Document>>('/documents/', {
      is_favorite: true,
      page_size: 100,
    });
    return response.results;
  },

  // Activity and comments
  async getActivity(id: string, page = 1): Promise<PaginatedResponse<DocumentActivity>> {
    return await api.get<PaginatedResponse<DocumentActivity>>(
      `/documents/${id}/activity/`,
      { page }
    );
  },

  async getComments(id: string): Promise<DocumentComment[]> {
    return await api.get<DocumentComment[]>(`/documents/${id}/comments/`);
  },

  async addComment(
    id: string,
    content: string,
    options?: { page?: number; position?: { x: number; y: number }; parentId?: string }
  ): Promise<DocumentComment> {
    return await api.post<DocumentComment>(`/documents/${id}/comments/`, {
      content,
      page: options?.page,
      position: options?.position,
      parent_id: options?.parentId,
    });
  },

  async updateComment(documentId: string, commentId: string, content: string): Promise<DocumentComment> {
    return await api.patch<DocumentComment>(
      `/documents/${documentId}/comments/${commentId}/`,
      { content }
    );
  },

  async deleteComment(documentId: string, commentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}/comments/${commentId}/`);
  },

  // Document types
  async getDocumentTypes(): Promise<DocumentType[]> {
    const cacheKey = 'document_types';
    const cached = await cacheStorage.get<DocumentType[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await api.get<PaginatedResponse<DocumentType>>('/document-types/');
    await cacheStorage.set(cacheKey, response.results, CACHE_CONFIG.USER_TTL);
    return response.results;
  },

  // Workflow integration
  async startWorkflow(documentId: string, templateId: string): Promise<void> {
    await api.post(`/documents/${documentId}/start_workflow/`, {
      template_id: templateId,
    });
    await cacheStorage.invalidate(`document_${documentId}`);
    await cacheStorage.invalidate('documents_');
  },

  // Quick access
  async getRecentDocuments(limit = 10): Promise<Document[]> {
    const response = await api.get<PaginatedResponse<Document>>('/documents/', {
      page_size: limit,
      ordering: '-updated_at',
    });
    return response.results;
  },

  async searchDocuments(query: string, limit = 20): Promise<Document[]> {
    const response = await api.get<PaginatedResponse<Document>>('/documents/', {
      search: query,
      page_size: limit,
    });
    return response.results;
  },

  // Preview URL generation
  async getPreviewUrl(id: string): Promise<string> {
    const response = await api.get<{ url: string }>(`/documents/${id}/preview_url/`);
    return response.url;
  },

  // Bulk operations
  async bulkDelete(ids: string[]): Promise<void> {
    await api.post('/documents/bulk_delete/', { ids });
    await Promise.all(ids.map((id) => cacheStorage.invalidate(`document_${id}`)));
    await cacheStorage.invalidate('documents_');
  },

  async bulkMove(ids: string[], folderId: string): Promise<void> {
    await api.post('/documents/bulk_move/', { ids, folder_id: folderId });
    await cacheStorage.invalidate('documents_');
  },

  async bulkUpdateTags(ids: string[], tags: string[], action: 'add' | 'remove' | 'set'): Promise<void> {
    await api.post('/documents/bulk_tags/', { ids, tags, action });
    await cacheStorage.invalidate('documents_');
  },

  // Validation
  validateFile(file: { size: number; mimeType: string }): { valid: boolean; error?: string } {
    if (!validateFileSize(file.size)) {
      return {
        valid: false,
        error: `La taille du fichier depasse la limite de ${FILE_UPLOAD.MAX_SIZE_MB} Mo`,
      };
    }

    if (!validateFileType(file.mimeType)) {
      return {
        valid: false,
        error: 'Type de fichier non supporte',
      };
    }

    return { valid: true };
  },

  // Offline support
  async cacheForOffline(id: string): Promise<void> {
    const document = await this.getDocument(id);
    const localUri = await this.downloadDocument(id);

    // Store offline document reference
    const offlineDocuments = await storage.getItem<string[]>(STORAGE_KEYS.CACHED_DOCUMENTS) || [];
    if (!offlineDocuments.includes(id)) {
      offlineDocuments.push(id);
      await storage.setItem(STORAGE_KEYS.CACHED_DOCUMENTS, offlineDocuments);
    }

    // Store document data with local file path
    await storage.setItem(`offline_doc_${id}`, {
      ...document,
      localFileUri: localUri,
    });
  },

  async getOfflineDocuments(): Promise<Document[]> {
    const offlineIds = await storage.getItem<string[]>(STORAGE_KEYS.CACHED_DOCUMENTS) || [];
    const documents: Document[] = [];

    for (const id of offlineIds) {
      const doc = await storage.getItem<Document & { localFileUri?: string }>(`offline_doc_${id}`);
      if (doc) {
        documents.push(doc);
      }
    }

    return documents;
  },

  async removeFromOffline(id: string): Promise<void> {
    const offlineDocuments = await storage.getItem<string[]>(STORAGE_KEYS.CACHED_DOCUMENTS) || [];
    const updatedList = offlineDocuments.filter((docId) => docId !== id);
    await storage.setItem(STORAGE_KEYS.CACHED_DOCUMENTS, updatedList);

    const doc = await storage.getItem<Document & { localFileUri?: string }>(`offline_doc_${id}`);
    if (doc?.localFileUri) {
      try {
        await FileSystem.deleteAsync(doc.localFileUri, { idempotent: true });
      } catch {
        // Ignore deletion errors
      }
    }

    await storage.removeItem(`offline_doc_${id}`);
  },
};

export default documentsService;
