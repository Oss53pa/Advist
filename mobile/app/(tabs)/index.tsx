import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useNotificationStore } from '@/store';
import { documentsService, workflowsService } from '@/services';
import { Card, Badge, Avatar, Loading, EmptyState } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { Document, Task } from '@/types';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { fetchUnreadCount, unreadCount } = useNotificationStore();

  const {
    data: recentDocuments,
    isLoading: docsLoading,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['recentDocuments'],
    queryFn: () => documentsService.getRecentDocuments(5),
  });

  const {
    data: pendingTasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['pendingTasks'],
    queryFn: () => workflowsService.getMyTasks({ status: 'pending', pageSize: 5 }),
  });

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const isLoading = docsLoading || tasksLoading;

  const onRefresh = async () => {
    await Promise.all([refetchDocs(), refetchTasks(), fetchUnreadCount()]);
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, 'pending' | 'approved' | 'rejected' | 'info'> = {
      draft: 'info',
      pending_review: 'pending',
      in_workflow: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      signed: 'approved',
    };
    return variants[status] || 'info';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Bonjour, {user?.firstName || 'Utilisateur'}
            </Text>
            <Text style={styles.subGreeting}>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="document-text" size={24} color={colors.info} />
            <Text style={styles.statNumber}>{recentDocuments?.length || 0}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="checkbox" size={24} color={colors.warning} />
            <Text style={styles.statNumber}>{pendingTasks?.count || 0}</Text>
            <Text style={styles.statLabel}>Tâches</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="notifications" size={24} color={colors.error} />
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Notifs</Text>
          </Card>
        </View>

        {/* Pending Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tâches en attente</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {tasksLoading ? (
            <Loading />
          ) : pendingTasks?.results?.length === 0 ? (
            <Card>
              <EmptyState
                icon="checkbox-outline"
                title="Aucune tâche"
                description="Vous n'avez pas de tâches en attente"
              />
            </Card>
          ) : (
            pendingTasks?.results?.slice(0, 3).map((task: Task) => (
              <Card
                key={task.id}
                style={styles.taskCard}
                onPress={() => router.push(`/task/${task.id}`)}
              >
                <View style={styles.taskHeader}>
                  <View style={styles.taskIcon}>
                    <Ionicons
                      name={task.type === 'signature' ? 'create' : 'checkmark-circle'}
                      size={20}
                      color={colors.surface}
                    />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.document.title}
                    </Text>
                    <Text style={styles.taskType}>
                      {task.type === 'signature' ? 'Signature requise' : 'Approbation requise'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Recent Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documents récents</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/documents')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {docsLoading ? (
            <Loading />
          ) : recentDocuments?.length === 0 ? (
            <Card>
              <EmptyState
                icon="document-text-outline"
                title="Aucun document"
                description="Commencez par ajouter un document"
              />
            </Card>
          ) : (
            recentDocuments?.slice(0, 5).map((doc: Document) => (
              <Card
                key={doc.id}
                style={styles.documentCard}
                onPress={() => router.push(`/document/${doc.id}`)}
              >
                <View style={styles.documentHeader}>
                  <View style={styles.documentIcon}>
                    <Ionicons name="document-text" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentTitle} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <Text style={styles.documentMeta}>
                      {new Date(doc.updatedAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Badge
                    label={doc.status.replace('_', ' ')}
                    variant={getStatusBadgeVariant(doc.status)}
                    size="sm"
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subGreeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.accent,
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
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
  documentCard: {
    marginBottom: spacing.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  documentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
