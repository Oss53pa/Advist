import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/store';
import { Card, Loading, EmptyState, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Notification, NotificationType } from '@/types';

const getNotificationIcon = (type: NotificationType) => {
  const icons: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
    task_assigned: 'checkbox-outline',
    document_approved: 'checkmark-circle',
    document_rejected: 'close-circle',
    document_signed: 'create',
    workflow_completed: 'flag',
    deadline_reminder: 'alarm',
    mention: 'at',
  };
  return icons[type] || 'notifications';
};

const getNotificationColor = (type: NotificationType) => {
  const colorMap: Record<NotificationType, string> = {
    task_assigned: colors.info,
    document_approved: colors.success,
    document_rejected: colors.error,
    document_signed: colors.signed,
    workflow_completed: colors.success,
    deadline_reminder: colors.warning,
    mention: colors.info,
  };
  return colorMap[type] || colors.accent;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
};

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.documentId) {
      router.push(`/document/${notification.data.documentId}`);
    } else if (notification.data?.taskId) {
      router.push(`/task/${notification.data.taskId}`);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${getNotificationColor(item.type)}20` },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={20}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Actions */}
      {unreadNotifications.length > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={18} color={colors.accent} />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <Loading fullScreen message="Chargement des notifications..." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Aucune notification"
              description="Vous n'avez pas encore de notifications"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  markAllText: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    flexGrow: 1,
  },
  notificationCard: {
    marginBottom: spacing.sm,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.placeholder,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.info,
    marginLeft: spacing.sm,
    marginTop: 6,
  },
});
