import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { documentsService } from '@/services';
import {
  Card,
  Badge,
  Loading,
  EmptyState,
  Button,
  ActionSheet,
  ConfirmModal,
  ActionSheetOption,
} from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Document, DocumentStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: DocumentStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Brouillon', value: 'draft' },
  { label: 'En cours', value: 'in_workflow' },
  { label: 'Approuve', value: 'approved' },
  { label: 'Signe', value: 'signed' },
];

export default function DocumentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['documents', statusFilter, searchQuery, page],
    queryFn: () =>
      documentsService.getDocuments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
        page,
        pageSize: 20,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documentsService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowDeleteModal(false);
      setSelectedDocument(null);
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (documentId: string) => documentsService.toggleFavorite(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const handleLoadMore = () => {
    if (data?.next && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/document/upload',
          params: {
            uri: result.assets[0].uri,
            name: result.assets[0].name,
            mimeType: result.assets[0].mimeType,
          },
        });
      }
    } catch (error) {
      console.error('Document pick error:', error);
    }
  };

  const handleDocumentPress = (document: Document) => {
    router.push(`/document/${document.id}`);
  };

  const handleDocumentLongPress = (document: Document) => {
    setSelectedDocument(document);
    setShowActionSheet(true);
  };

  const getDocumentActions = (): ActionSheetOption[] => {
    if (!selectedDocument) return [];

    const actions: ActionSheetOption[] = [
      {
        label: 'Ouvrir',
        icon: 'open-outline',
        onPress: () => router.push(`/document/${selectedDocument.id}`),
      },
      {
        label: selectedDocument.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris',
        icon: selectedDocument.isFavorite ? 'heart-dislike-outline' : 'heart-outline',
        onPress: () => favoriteMutation.mutate(selectedDocument.id),
      },
      {
        label: 'Partager',
        icon: 'share-outline',
        onPress: () => router.push(`/document/${selectedDocument.id}/share`),
      },
      {
        label: 'Telecharger',
        icon: 'download-outline',
        onPress: () => documentsService.downloadDocument(selectedDocument.id),
      },
    ];

    // Only allow delete for draft documents
    if (selectedDocument.status === 'draft') {
      actions.push({
        label: 'Supprimer',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => {
          setShowActionSheet(false);
          setTimeout(() => setShowDeleteModal(true), 300);
        },
      });
    }

    return actions;
  };

  const handleDeleteConfirm = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, 'pending' | 'approved' | 'rejected' | 'info' | 'signed'> = {
      draft: 'info',
      pending_review: 'pending',
      in_workflow: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      signed: 'signed',
    };
    return variants[status] || 'info';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      pending_review: 'En revision',
      in_workflow: 'En workflow',
      approved: 'Approuve',
      rejected: 'Rejete',
      signed: 'Signe',
      archived: 'Archive',
    };
    return labels[status] || status;
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <Card
      style={styles.documentCard}
      onPress={() => handleDocumentPress(item)}
      onLongPress={() => handleDocumentLongPress(item)}
    >
      <View style={styles.documentContent}>
        <View style={styles.documentIcon}>
          <Ionicons name="document-text" size={24} color={colors.accent} />
          {item.isFavorite && (
            <View style={styles.favoriteIndicator}>
              <Ionicons name="heart" size={10} color={colors.error} />
            </View>
          )}
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.documentMeta}>
            <Text style={styles.documentMetaText}>
              {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.documentMetaText}>•</Text>
            <Text style={styles.documentMetaText}>v{item.version}</Text>
          </View>
        </View>
        <Badge
          label={getStatusLabel(item.status)}
          variant={getStatusBadgeVariant(item.status)}
          size="sm"
        />
      </View>
      {item.tags?.length > 0 && (
        <View style={styles.tags}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un document..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="add" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Documents List */}
      {isLoading ? (
        <Loading fullScreen message="Chargement des documents..." />
      ) : (
        <FlatList
          data={data?.results || []}
          keyExtractor={(item) => item.id}
          renderItem={renderDocument}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="Aucun document"
              description={
                searchQuery
                  ? `Aucun resultat pour "${searchQuery}"`
                  : 'Commencez par ajouter un document'
              }
              actionLabel="Ajouter un document"
              onAction={handleUpload}
            />
          }
          ListFooterComponent={
            isFetching && data?.results?.length ? <Loading /> : null
          }
        />
      )}

      {/* Document Actions Sheet */}
      <ActionSheet
        visible={showActionSheet}
        onClose={() => {
          setShowActionSheet(false);
          setSelectedDocument(null);
        }}
        title={selectedDocument?.title}
        options={getDocumentActions()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDocument(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le document"
        message={`Etes-vous sur de vouloir supprimer "${selectedDocument?.title}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        loading={deleteMutation.isPending}
        icon="trash"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  uploadButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    flexGrow: 1,
  },
  documentCard: {
    marginBottom: spacing.sm,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.surface,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  documentMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
