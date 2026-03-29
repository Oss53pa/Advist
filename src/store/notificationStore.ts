/**
 * Notification Store using Zustand — Supabase Realtime
 *
 * Subscribes to Supabase Realtime for live notification updates.
 * Notifications table changes are pushed in real-time via PostgreSQL
 * NOTIFY/LISTEN through Supabase's Realtime channels.
 */
import { create } from 'zustand';
import type { Notification } from '../types';
import { notificationsService } from '../services/notifications';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  realtimeChannel: RealtimeChannel | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  realtimeChannel: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationsService.list();
      set({ notifications: response.results, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Ignore errors
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      const { notifications, unreadCount } = get();
      set({
        notifications: notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const, read_at: new Date().toISOString() } : n,
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch {
      // Ignore errors
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      const { notifications } = get();
      set({
        notifications: notifications.map((n) => ({
          ...n,
          status: 'read' as const,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      });
    } catch {
      // Ignore errors
    }
  },

  /**
   * Subscribe to Supabase Realtime for new notifications.
   * Listens for INSERT events on the notifications table filtered by recipient_id.
   */
  subscribeRealtime: (userId: string) => {
    const { realtimeChannel } = get();

    // Don't subscribe twice
    if (realtimeChannel) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const notification: Notification = {
            id: row.id,
            subject: row.title,
            body: row.message || '',
            channel: row.channel || 'in_app',
            status: 'delivered',
            action_url: row.link,
            related_document: row.data?.document_id,
            created_at: row.created_at,
            read_at: undefined,
          };

          const { notifications, unreadCount } = get();
          set({
            notifications: [notification, ...notifications],
            unreadCount: unreadCount + 1,
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const { notifications } = get();

          // Update the notification in the list
          const updated = notifications.map((n) =>
            n.id === row.id
              ? {
                  ...n,
                  status: row.is_read ? ('read' as const) : n.status,
                  read_at: row.read_at || n.read_at,
                }
              : n,
          );

          // Recount unread
          const unreadCount = updated.filter((n) => n.status !== 'read').length;
          set({ notifications: updated, unreadCount });
        },
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  /**
   * Unsubscribe from Realtime when user logs out or component unmounts.
   */
  unsubscribeRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },
}));
