import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  notificationsService,
  NotificationFilters,
  NotificationPreferences,
  PushNotificationData,
} from '@/services/notifications';
import { Notification } from '@/types';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  grouped: (filters?: NotificationFilters) => [...notificationKeys.all, 'grouped', filters] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  cached: () => [...notificationKeys.all, 'cached'] as const,
};

// Get notifications with infinite scroll
export function useNotifications(filters?: NotificationFilters) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      notificationsService.getNotifications({
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

// Get single notification
export function useNotification(id: string, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationsService.getNotification(id),
    enabled: enabled && !!id,
  });
}

// Get unread notifications
export function useUnreadNotifications(limit = 10) {
  return useQuery({
    queryKey: [...notificationKeys.lists(), 'unread', limit],
    queryFn: () => notificationsService.getUnreadNotifications(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

// Get unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 1 * 60 * 1000, // Refetch every minute
  });
}

// Get grouped notifications by date
export function useGroupedNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.grouped(filters),
    queryFn: () => notificationsService.getGroupedNotifications(filters),
  });
}

// Get notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationsService.getPreferences(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Get cached notifications (for offline)
export function useCachedNotifications() {
  return useQuery({
    queryKey: notificationKeys.cached(),
    queryFn: () => notificationsService.getCachedNotifications(),
  });
}

// Mark notification as read mutation
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Mark multiple as read mutation
export function useMarkMultipleAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => notificationsService.markMultipleAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Mark all as read mutation
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Delete notification mutation
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Delete multiple notifications mutation
export function useDeleteMultipleNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => notificationsService.deleteMultiple(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Update preferences mutation
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      notificationsService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

// Initialize push notifications
export function useInitializePushNotifications() {
  return useMutation({
    mutationFn: () => notificationsService.initializePushNotifications(),
  });
}

// Unregister push token
export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: () => notificationsService.unregisterPushToken(),
  });
}

// Schedule local notification
export function useScheduleLocalNotification() {
  return useMutation({
    mutationFn: ({
      title,
      body,
      data,
      trigger,
    }: {
      title: string;
      body: string;
      data?: PushNotificationData;
      trigger?: Notifications.NotificationTriggerInput;
    }) => notificationsService.scheduleLocalNotification(title, body, data, trigger),
  });
}

// Cancel scheduled notification
export function useCancelScheduledNotification() {
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.cancelScheduledNotification(notificationId),
  });
}

// Cancel all scheduled notifications
export function useCancelAllScheduledNotifications() {
  return useMutation({
    mutationFn: () => notificationsService.cancelAllScheduledNotifications(),
  });
}

// Get scheduled notifications
export function useScheduledNotifications() {
  return useQuery({
    queryKey: [...notificationKeys.all, 'scheduled'],
    queryFn: () => notificationsService.getScheduledNotifications(),
  });
}

// Hook to handle push notification listeners
export function usePushNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const notificationReceivedListener = useRef<Notifications.Subscription>();
  const notificationResponseListener = useRef<Notifications.Subscription>();

  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });

      // Call custom handler if provided
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    },
    [queryClient, onNotificationReceived]
  );

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      const parsedData = notificationsService.parseNotificationData(
        data as Record<string, unknown>
      );

      if (parsedData) {
        const navigationRoute = notificationsService.getNavigationRoute(parsedData);

        // Navigate to the appropriate screen
        if (navigationRoute.params) {
          router.push({
            pathname: navigationRoute.route as any,
            params: navigationRoute.params,
          });
        } else {
          router.push(navigationRoute.route as any);
        }

        // Mark notification as read if it has an ID
        if (parsedData.id) {
          notificationsService.markAsRead(parsedData.id).catch(console.error);
        }
      }

      // Call custom handler if provided
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    },
    [router, onNotificationResponse]
  );

  useEffect(() => {
    // Set up notification received listener
    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Set up notification response listener (when user taps notification)
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Clean up listeners on unmount
    return () => {
      if (notificationReceivedListener.current) {
        Notifications.removeNotificationSubscription(notificationReceivedListener.current);
      }
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, [handleNotificationReceived, handleNotificationResponse]);
}

// Hook to check if notification was received when app was killed
export function useLastNotificationResponse() {
  const router = useRouter();

  useEffect(() => {
    const checkLastNotification = async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();

      if (lastResponse) {
        const data = lastResponse.notification.request.content.data;
        const parsedData = notificationsService.parseNotificationData(
          data as Record<string, unknown>
        );

        if (parsedData) {
          const navigationRoute = notificationsService.getNavigationRoute(parsedData);

          // Small delay to ensure app is fully loaded
          setTimeout(() => {
            if (navigationRoute.params) {
              router.push({
                pathname: navigationRoute.route as any,
                params: navigationRoute.params,
              });
            } else {
              router.push(navigationRoute.route as any);
            }
          }, 500);
        }
      }
    };

    checkLastNotification();
  }, [router]);
}

// Combined hook for notification badge
export function useNotificationBadge() {
  const { data: unreadCount = 0, isLoading } = useUnreadCount();

  return {
    count: unreadCount,
    isLoading,
    hasUnread: unreadCount > 0,
  };
}

// Hook for notification actions (swipe actions)
export function useNotificationActions(notificationId: string) {
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  return {
    markAsRead: () => markAsRead.mutate(notificationId),
    delete: () => deleteNotification.mutate(notificationId),
    isMarkingAsRead: markAsRead.isPending,
    isDeleting: deleteNotification.isPending,
  };
}
