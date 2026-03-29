import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';
import { cacheStorage, storage, secureStorage } from '@/utils/storage';
import { Notification, PaginatedResponse, NotificationType } from '@/types';
import { CACHE_CONFIG, NOTIFICATION_CHANNELS, STORAGE_KEYS } from '@/constants/config';

// Types
export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface NotificationPreferences {
  email: NotificationChannelPreferences;
  push: NotificationChannelPreferences;
  inApp: NotificationChannelPreferences;
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
}

export interface NotificationChannelPreferences {
  taskAssigned: boolean;
  documentApproved: boolean;
  documentRejected: boolean;
  documentSigned: boolean;
  workflowCompleted: boolean;
  deadlineReminder: boolean;
  mentions: boolean;
}

export interface NotificationGroup {
  date: string;
  notifications: Notification[];
}

export interface PushNotificationData {
  type: NotificationType;
  id: string;
  documentId?: string;
  taskId?: string;
  workflowId?: string;
}

// Configure notification handler (only in browser environment, not during SSR)
if (typeof window !== 'undefined' && Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const notificationsService = {
  // Initialize push notifications
  async initializePushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Set up Android notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Register token with server
      await this.registerPushToken(
        token.data,
        Platform.OS as 'ios' | 'android'
      );

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  // Setup Android notification channels
  async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.TASKS.id, {
      name: NOTIFICATION_CHANNELS.TASKS.name,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: NOTIFICATION_CHANNELS.TASKS.vibrationPattern,
      lightColor: NOTIFICATION_CHANNELS.TASKS.lightColor,
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DOCUMENTS.id, {
      name: NOTIFICATION_CHANNELS.DOCUMENTS.name,
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.GENERAL.id, {
      name: NOTIFICATION_CHANNELS.GENERAL.name,
      importance: Notifications.AndroidImportance.LOW,
    });
  },

  // Get notifications with caching
  async getNotifications(filters?: NotificationFilters): Promise<PaginatedResponse<Notification>> {
    const cacheKey = `notifications_${JSON.stringify(filters)}`;
    const cached = await cacheStorage.get<PaginatedResponse<Notification>>(cacheKey);

    if (cached) {
      this.fetchAndCacheNotifications(filters, cacheKey);
      return cached;
    }

    return await this.fetchAndCacheNotifications(filters, cacheKey);
  },

  async fetchAndCacheNotifications(
    filters?: NotificationFilters,
    cacheKey?: string
  ): Promise<PaginatedResponse<Notification>> {
    const params: Record<string, unknown> = {};

    if (filters) {
      if (filters.isRead !== undefined) params.is_read = filters.isRead;
      if (filters.type) params.type = filters.type;
      if (filters.page) params.page = filters.page;
      if (filters.pageSize) params.page_size = filters.pageSize;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
    }

    const response = await api.get<PaginatedResponse<Notification>>('/notifications/', params);

    if (cacheKey) {
      await cacheStorage.set(cacheKey, response, CACHE_CONFIG.NOTIFICATIONS_TTL);
    }

    // Cache for offline
    await storage.setItem(STORAGE_KEYS.CACHED_NOTIFICATIONS, response.results);

    return response;
  },

  // Get unread notifications
  async getUnreadNotifications(limit = 10): Promise<Notification[]> {
    const response = await this.getNotifications({
      isRead: false,
      pageSize: limit,
    });
    return response.results;
  },

  // Get notification by ID
  async getNotification(id: string): Promise<Notification> {
    return await api.get<Notification>(`/notifications/${id}/`);
  },

  // Get unread count with caching
  async getUnreadCount(): Promise<number> {
    const cacheKey = 'notifications_unread_count';
    const cached = await cacheStorage.get<number>(cacheKey);

    if (cached !== null) {
      // Refresh in background
      this.fetchUnreadCount(cacheKey);
      return cached;
    }

    return await this.fetchUnreadCount(cacheKey);
  },

  async fetchUnreadCount(cacheKey?: string): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread-count/');

    if (cacheKey) {
      await cacheStorage.set(cacheKey, response.count, CACHE_CONFIG.NOTIFICATIONS_TTL);
    }

    // Update badge
    await Notifications.setBadgeCountAsync(response.count);

    return response.count;
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    const notification = await api.patch<Notification>(`/notifications/${id}/`, {
      is_read: true,
    });

    await this.invalidateNotificationCaches();
    return notification;
  },

  // Mark multiple as read
  async markMultipleAsRead(ids: string[]): Promise<void> {
    await api.post('/notifications/mark-read/', { ids });
    await this.invalidateNotificationCaches();
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read/');
    await this.invalidateNotificationCaches();
    await Notifications.setBadgeCountAsync(0);
  },

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}/`);
    await this.invalidateNotificationCaches();
  },

  // Delete multiple notifications
  async deleteMultiple(ids: string[]): Promise<void> {
    await api.post('/notifications/delete-multiple/', { ids });
    await this.invalidateNotificationCaches();
  },

  // Get grouped notifications by date
  async getGroupedNotifications(filters?: NotificationFilters): Promise<NotificationGroup[]> {
    const response = await this.getNotifications(filters);
    const groups = new Map<string, Notification[]>();

    response.results.forEach((notification) => {
      const date = new Date(notification.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(notification);
    });

    return Array.from(groups.entries()).map(([date, notifications]) => ({
      date,
      notifications,
    }));
  },

  // Preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const cacheKey = 'notification_preferences';
    const cached = await cacheStorage.get<NotificationPreferences>(cacheKey);

    if (cached) {
      return cached;
    }

    const preferences = await api.get<NotificationPreferences>('/notifications/preferences/');
    await cacheStorage.set(cacheKey, preferences, CACHE_CONFIG.USER_TTL);

    // Also save locally for quick access
    await storage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, preferences);

    return preferences;
  },

  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const updated = await api.patch<NotificationPreferences>(
      '/notifications/preferences/',
      preferences
    );

    await cacheStorage.set('notification_preferences', updated, CACHE_CONFIG.USER_TTL);
    await storage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, updated);

    return updated;
  },

  // Get local preferences (for offline)
  async getLocalPreferences(): Promise<NotificationPreferences | null> {
    return await storage.getItem<NotificationPreferences>(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
  },

  // Push token management
  async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
    await secureStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
    await api.post('/notifications/push-token/', {
      token,
      platform,
      device_id: await this.getDeviceId(),
    });
  },

  async unregisterPushToken(): Promise<void> {
    const token = await secureStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    if (token) {
      try {
        await api.delete(`/notifications/push-token/${token}/`);
      } catch {
        // Ignore errors during unregistration
      }
      await secureStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
    }
  },

  async getDeviceId(): Promise<string> {
    let deviceId = await secureStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `${Device.modelName}-${Date.now()}`;
      await secureStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  },

  // Schedule local notification
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: PushNotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as Record<string, unknown>,
        sound: true,
      },
      trigger: trigger || null,
    });
  },

  // Cancel scheduled notification
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  // Handle notification response (when user taps notification)
  parseNotificationData(data: Record<string, unknown>): PushNotificationData | null {
    if (!data?.type) return null;

    return {
      type: data.type as NotificationType,
      id: data.id as string,
      documentId: data.documentId as string | undefined,
      taskId: data.taskId as string | undefined,
      workflowId: data.workflowId as string | undefined,
    };
  },

  // Get navigation route from notification data
  getNavigationRoute(data: PushNotificationData): { route: string; params?: Record<string, string> } {
    switch (data.type) {
      case 'task_assigned':
        return { route: '/(tabs)/tasks' };
      case 'document_approved':
      case 'document_rejected':
      case 'document_signed':
        if (data.documentId) {
          return { route: '/document/[id]', params: { id: data.documentId } };
        }
        return { route: '/(tabs)/documents' };
      case 'workflow_completed':
        if (data.workflowId) {
          return { route: '/workflow/[id]', params: { id: data.workflowId } };
        }
        return { route: '/(tabs)' };
      case 'deadline_reminder':
        return { route: '/(tabs)/tasks' };
      case 'mention':
        if (data.documentId) {
          return { route: '/document/[id]', params: { id: data.documentId } };
        }
        return { route: '/(tabs)/notifications' };
      default:
        return { route: '/(tabs)/notifications' };
    }
  },

  // Invalidate caches
  async invalidateNotificationCaches(): Promise<void> {
    await cacheStorage.invalidate('notifications_');
    await cacheStorage.invalidate('notifications_unread_count');
  },

  // Offline support
  async getCachedNotifications(): Promise<Notification[]> {
    return await storage.getItem<Notification[]>(STORAGE_KEYS.CACHED_NOTIFICATIONS) || [];
  },
};

export default notificationsService;
