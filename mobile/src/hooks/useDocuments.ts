import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { documentsService, DocumentFilters, CreateDocumentData, ShareDocumentData } from '@/services/documents';
import { Document, PaginatedResponse } from '@/types';

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  versions: (id: string) => [...documentKeys.detail(id), 'versions'] as const,
  shares: (id: string) => [...documentKeys.detail(id), 'shares'] as const,
  comments: (id: string) => [...documentKeys.detail(id), 'comments'] as const,
  activity: (id: string) => [...documentKeys.detail(id), 'activity'] as const,
  types: ['documentTypes'] as const,
  favorites: [...documentKeys.all, 'favorites'] as const,
  recent: [...documentKeys.all, 'recent'] as const,
  offline: [...documentKeys.all, 'offline'] as const,
};

// List documents with infinite scroll
export function useDocuments(filters?: DocumentFilters) {
  return useInfiniteQuery({
    queryKey: documentKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      documentsService.getDocuments({
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

// Get single document
export function useDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsService.getDocument(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get document types
export function useDocumentTypes() {
  return useQuery({
    queryKey: documentKeys.types,
    queryFn: () => documentsService.getDocumentTypes(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Get recent documents
export function useRecentDocuments(limit = 10) {
  return useQuery({
    queryKey: documentKeys.recent,
    queryFn: () => documentsService.getRecentDocuments(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get favorite documents
export function useFavoriteDocuments() {
  return useQuery({
    queryKey: documentKeys.favorites,
    queryFn: () => documentsService.getFavorites(),
  });
}

// Get document versions
export function useDocumentVersions(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.versions(id),
    queryFn: () => documentsService.getVersions(id),
    enabled: enabled && !!id,
  });
}

// Get document shares
export function useDocumentShares(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.shares(id),
    queryFn: () => documentsService.getDocumentShares(id),
    enabled: enabled && !!id,
  });
}

// Get document comments
export function useDocumentComments(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.comments(id),
    queryFn: () => documentsService.getComments(id),
    enabled: enabled && !!id,
  });
}

// Get document activity
export function useDocumentActivity(id: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: documentKeys.activity(id),
    queryFn: ({ pageParam = 1 }) => documentsService.getActivity(id, pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
    enabled: enabled && !!id,
  });
}

// Get offline documents
export function useOfflineDocuments() {
  return useQuery({
    queryKey: documentKeys.offline,
    queryFn: () => documentsService.getOfflineDocuments(),
  });
}

// Search documents
export function useSearchDocuments(query: string, enabled = true) {
  return useQuery({
    queryKey: [...documentKeys.lists(), 'search', query],
    queryFn: () => documentsService.searchDocuments(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Create document mutation
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      file,
      onProgress,
    }: {
      data: CreateDocumentData;
      file: FormData;
      onProgress?: (progress: { percentage: number }) => void;
    }) => documentsService.createDocument(data, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.recent });
    },
  });
}

// Update document mutation
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Document> }) =>
      documentsService.updateDocument(id, data),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Delete document mutation
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.deleteDocument(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.favorites });
      queryClient.invalidateQueries({ queryKey: documentKeys.recent });
    },
  });
}

// Upload version mutation
export function useUploadVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      file,
      comment,
      onProgress,
    }: {
      id: string;
      file: FormData;
      comment?: string;
      onProgress?: (progress: { percentage: number }) => void;
    }) => documentsService.uploadVersion(id, file, comment, onProgress),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(document.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Lock document mutation
export function useLockDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.lockDocument(id),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
    },
  });
}

// Unlock document mutation
export function useUnlockDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.unlockDocument(id),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
    },
  });
}

// Toggle favorite mutation
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.toggleFavorite(id),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
      queryClient.invalidateQueries({ queryKey: documentKeys.favorites });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Share document mutation
export function useShareDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShareDocumentData }) =>
      documentsService.shareDocument(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.shares(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.activity(id) });
    },
  });
}

// Revoke share mutation
export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, shareId }: { documentId: string; shareId: string }) =>
      documentsService.revokeShare(documentId, shareId),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.shares(documentId) });
    },
  });
}

// Add comment mutation
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      content,
      options,
    }: {
      id: string;
      content: string;
      options?: { page?: number; position?: { x: number; y: number }; parentId?: string };
    }) => documentsService.addComment(id, content, options),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.comments(id) });
    },
  });
}

// Delete comment mutation
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, commentId }: { documentId: string; commentId: string }) =>
      documentsService.deleteComment(documentId, commentId),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.comments(documentId) });
    },
  });
}

// Start workflow mutation
export function useStartWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, templateId }: { documentId: string; templateId: string }) =>
      documentsService.startWorkflow(documentId, templateId),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.activity(documentId) });
    },
  });
}

// Download document
export function useDownloadDocument() {
  return useMutation({
    mutationFn: ({
      id,
      onProgress,
    }: {
      id: string;
      onProgress?: (progress: number) => void;
    }) => documentsService.downloadDocument(id, onProgress),
  });
}

// Share document file (native share)
export function useShareDocumentFile() {
  return useMutation({
    mutationFn: (id: string) => documentsService.shareDocumentFile(id),
  });
}

// Cache for offline mutation
export function useCacheForOffline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.cacheForOffline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.offline });
    },
  });
}

// Remove from offline mutation
export function useRemoveFromOffline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.removeFromOffline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.offline });
    },
  });
}

// Bulk delete mutation
export function useBulkDeleteDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => documentsService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

// Revert to version mutation
export function useRevertToVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, versionId }: { documentId: string; versionId: string }) =>
      documentsService.revertToVersion(documentId, versionId),
    onSuccess: (document) => {
      queryClient.setQueryData(documentKeys.detail(document.id), document);
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(document.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}
