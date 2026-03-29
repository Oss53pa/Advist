import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { documentsService, workflowsService } from '@/services';
import { Card, Badge, Button, Loading, Avatar } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showViewer, setShowViewer] = useState(false);

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsService.getDocument(id!),
    enabled: !!id,
  });

  const { data: workflows } = useQuery({
    queryKey: ['documentWorkflows', id],
    queryFn: () => workflowsService.getInstances(id!),
    enabled: !!id,
  });

  const lockMutation = useMutation({
    mutationFn: () => documentsService.lockDocument(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => documentsService.unlockDocument(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
    },
  });

  const handleDownload = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + document?.title;
      const downloadResult = await FileSystem.downloadAsync(
        document!.fileUrl,
        fileUri
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le document');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Document: ${document?.title}`,
        url: document?.fileUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleStartWorkflow = () => {
    router.push(`/workflow/start/${id}`);
  };

  const getStatusVariant = (status: string) => {
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
      pending_review: 'En révision',
      in_workflow: 'En workflow',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      signed: 'Signé',
      archived: 'Archivé',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <Loading fullScreen message="Chargement du document..." />;
  }

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Document non trouvé</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownload} style={styles.headerButton}>
            <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Document Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.docHeader}>
            <View style={styles.docIcon}>
              <Ionicons name="document-text" size={32} color={colors.accent} />
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>{document.title}</Text>
              <View style={styles.docMeta}>
                <Badge
                  label={getStatusLabel(document.status)}
                  variant={getStatusVariant(document.status)}
                />
                <Text style={styles.version}>v{document.version}</Text>
              </View>
            </View>
          </View>

          {document.description && (
            <Text style={styles.description}>{document.description}</Text>
          )}

          {/* Tags */}
          {document.tags?.length > 0 && (
            <View style={styles.tags}>
              {document.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Détails</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{document.type?.name || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Taille</Text>
            <Text style={styles.detailValue}>
              {(document.fileSize / 1024 / 1024).toFixed(2)} MB
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Créé le</Text>
            <Text style={styles.detailValue}>
              {new Date(document.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Modifié le</Text>
            <Text style={styles.detailValue}>
              {new Date(document.updatedAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Créé par</Text>
            <View style={styles.creatorInfo}>
              <Avatar
                source={document.createdBy?.avatar}
                name={`${document.createdBy?.firstName} ${document.createdBy?.lastName}`}
                size="sm"
              />
              <Text style={styles.detailValue}>
                {document.createdBy?.firstName} {document.createdBy?.lastName}
              </Text>
            </View>
          </View>

          {document.lockedBy && (
            <View style={styles.lockedBanner}>
              <Ionicons name="lock-closed" size={16} color={colors.warning} />
              <Text style={styles.lockedText}>
                Verrouillé par {document.lockedBy.firstName} {document.lockedBy.lastName}
              </Text>
            </View>
          )}
        </Card>

        {/* Workflow Status */}
        {workflows && workflows.length > 0 && (
          <Card style={styles.workflowCard}>
            <Text style={styles.sectionTitle}>Workflow actif</Text>
            {workflows[0] && (
              <TouchableOpacity
                style={styles.workflowItem}
                onPress={() => router.push(`/workflow/${workflows[0].id}`)}
              >
                <View style={styles.workflowInfo}>
                  <Text style={styles.workflowName}>
                    {workflows[0].template.name}
                  </Text>
                  <Text style={styles.workflowStatus}>
                    Étape {workflows[0].currentStep + 1} sur{' '}
                    {workflows[0].steps.length}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Voir le document"
            onPress={() => setShowViewer(true)}
            icon={<Ionicons name="eye-outline" size={18} color={colors.surface} />}
            fullWidth
          />

          {document.status === 'draft' && (
            <Button
              title="Démarrer un workflow"
              variant="outline"
              onPress={handleStartWorkflow}
              icon={<Ionicons name="git-branch-outline" size={18} color={colors.textPrimary} />}
              fullWidth
            />
          )}

          {!document.lockedBy ? (
            <Button
              title="Verrouiller"
              variant="outline"
              onPress={() => lockMutation.mutate()}
              loading={lockMutation.isPending}
              icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textPrimary} />}
              fullWidth
            />
          ) : (
            <Button
              title="Déverrouiller"
              variant="outline"
              onPress={() => unlockMutation.mutate()}
              loading={unlockMutation.isPending}
              icon={<Ionicons name="lock-open-outline" size={18} color={colors.textPrimary} />}
              fullWidth
            />
          )}
        </View>
      </ScrollView>

      {/* Document Viewer Modal */}
      {showViewer && (
        <View style={styles.viewerModal}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setShowViewer(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.viewerTitle}>{document.title}</Text>
            <TouchableOpacity onPress={handleDownload}>
              <Ionicons name="download-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: document.fileUrl }}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => <Loading />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  docIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  version: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailsCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.warning}20`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  lockedText: {
    ...typography.bodySmall,
    color: colors.warning,
  },
  workflowCard: {
    marginBottom: spacing.md,
  },
  workflowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workflowInfo: {
    flex: 1,
  },
  workflowName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  workflowStatus: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
  },
  viewerModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    zIndex: 100,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
});
