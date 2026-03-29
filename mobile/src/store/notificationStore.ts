import { create } from 'zustand';
import { Notification } from '@/types';
import { notificationsService } from '@/services/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationsService.getNotifications();
      set({
        notifications: response.results,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      set({ error: message, isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      set({
        notifications,
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      const notifications = get().notifications.map((n) => ({ ...n, isRead: true }));
      set({
        notifications,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      const notification = get().notifications.find((n) => n.id === id);
      const notifications = get().notifications.filter((n) => n.id !== id);
      set({
        notifications,
        unreadCount: notification && !notification.isRead
          ? Math.max(0, get().unreadCount - 1)
          : get().unreadCount,
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set({
      notifications: [notification, ...get().notifications],
      unreadCount: notification.isRead ? get().unreadCount : get().unreadCount + 1,
    });
  },
}));

export default useNotificationStore;
