import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { workflowsService } from '@/services';
import { Card, Badge, Loading, EmptyState, Button, ConfirmModal, InputModal } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Task } from '@/types';

type TabType = 'pending' | 'completed';

export default function TasksScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['tasks', activeTab],
    queryFn: () => workflowsService.getMyTasks({ status: activeTab }),
  });

  const approveMutation = useMutation({
    mutationFn: (taskId: string) => workflowsService.approveTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTasks'] });
      setShowApproveModal(false);
      setSelectedTask(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, comment }: { taskId: string; comment: string }) =>
      workflowsService.rejectTask(taskId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTasks'] });
      setShowRejectModal(false);
      setSelectedTask(null);
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleApprovePress = (task: Task) => {
    setSelectedTask(task);
    setShowApproveModal(true);
  };

  const handleRejectPress = (task: Task) => {
    setSelectedTask(task);
    setShowRejectModal(true);
  };

  const handleApproveConfirm = () => {
    if (selectedTask) {
      approveMutation.mutate(selectedTask.id);
    }
  };

  const handleRejectConfirm = (comment: string) => {
    if (selectedTask) {
      rejectMutation.mutate({ taskId: selectedTask.id, comment });
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'signature':
        return 'create';
      case 'approval':
        return 'checkmark-circle';
      case 'review':
        return 'eye';
      default:
        return 'document-text';
    }
  };

  const getTaskLabel = (type: string) => {
    switch (type) {
      case 'signature':
        return 'Signature requise';
      case 'approval':
        return 'Approbation requise';
      case 'review':
        return 'Revision requise';
      case 'information':
        return 'Information';
      default:
        return type;
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Card style={styles.taskCard}>
      <TouchableOpacity
        onPress={() => router.push(`/document/${item.document.id}`)}
      >
        <View style={styles.taskHeader}>
          <View
            style={[
              styles.taskIcon,
              item.type === 'signature' && styles.signatureIcon,
            ]}
          >
            <Ionicons
              name={getTaskIcon(item.type)}
              size={20}
              color={colors.surface}
            />
          </View>
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {item.document.title}
            </Text>
            <Text style={styles.taskType}>{getTaskLabel(item.type)}</Text>
          </View>
          {item.dueDate && (
            <Badge
              label={new Date(item.dueDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
              variant={new Date(item.dueDate) < new Date() ? 'error' : 'warning'}
              size="sm"
            />
          )}
        </View>
      </TouchableOpacity>

      {activeTab === 'pending' && (
        <View style={styles.taskActions}>
          {item.type === 'signature' ? (
            <Button
              title="Signer"
              onPress={() => router.push(`/sign/${item.document.id}`)}
              size="sm"
              icon={<Ionicons name="create" size={16} color={colors.surface} />}
              style={styles.actionButton}
            />
          ) : (
            <>
              <Button
                title="Rejeter"
                onPress={() => handleRejectPress(item)}
                variant="outline"
                size="sm"
                style={styles.actionButton}
              />
              <Button
                title="Approuver"
                onPress={() => handleApprovePress(item)}
                size="sm"
                icon={<Ionicons name="checkmark" size={16} color={colors.surface} />}
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.tabTextActive,
            ]}
          >
            En attente
          </Text>
          {data?.count && activeTab !== 'pending' && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{data.count}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.tabTextActive,
            ]}
          >
            Terminees
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      {isLoading ? (
        <Loading fullScreen message="Chargement des taches..." />
      ) : (
        <FlatList
          data={data?.results || []}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="checkbox-outline"
              title={
                activeTab === 'pending'
                  ? 'Aucune tache en attente'
                  : 'Aucune tache terminee'
              }
              description={
                activeTab === 'pending'
                  ? "Vous etes a jour ! Aucune action n'est requise."
                  : "Vous n'avez pas encore de taches terminees."
              }
            />
          }
        />
      )}

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        visible={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedTask(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approuver"
        message={`Voulez-vous approuver "${selectedTask?.document.title}" ?`}
        confirmLabel="Approuver"
        cancelLabel="Annuler"
        variant="success"
        loading={approveMutation.isPending}
        icon="checkmark-circle"
      />

      {/* Reject Input Modal */}
      <InputModal
        visible={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedTask(null);
        }}
        onSubmit={handleRejectConfirm}
        title="Rejeter"
        message="Veuillez indiquer la raison du rejet :"
        placeholder="Raison du rejet..."
        submitLabel="Rejeter"
        cancelLabel="Annuler"
        required
        multiline
        maxLength={500}
        loading={rejectMutation.isPending}
        variant="danger"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  taskCard: {
    marginBottom: spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  signatureIcon: {
    backgroundColor: colors.signed,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  taskType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
});
