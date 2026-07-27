/**
 * Supabase Realtime hook — replaces WebSocket connections to ws://localhost:8000.
 *
 * Uses Supabase Realtime channels for:
 * - Document collaboration (presence + broadcast)
 * - Table change subscriptions (postgres_changes)
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';

// ─── Presence-based document collaboration ───

export interface RealtimeParticipant {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  page: number;
  isEditing: boolean;
  cursor?: { x: number; y: number };
}

export interface RealtimeChatMessage {
  id: string;
  author: { id: string; name: string; avatar?: string };
  content: string;
  replyTo?: string;
  pageReference?: number;
  createdAt: string;
}

const COLORS = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

/**
 * Replaces useDocumentCollaboration (WebSocket-based) with Supabase Realtime.
 */
export function useRealtimeCollaboration(documentId: string) {
  const { user } = useAuthStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const userColor = COLORS[Math.abs(hashCode(user?.id || '')) % COLORS.length];

  useEffect(() => {
    if (!documentId || !user) return;

    const channel = supabase.channel(`doc:${documentId}`, {
      config: { presence: { key: user.id.toString() } },
    });

    // Presence: track who is online
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{
        name: string;
        avatar?: string;
        color: string;
        page: number;
        isEditing: boolean;
        cursor?: { x: number; y: number };
      }>();

      const peers: RealtimeParticipant[] = Object.entries(state).map(([key, presences]) => {
        const p = presences[0];
        return {
          id: key,
          name: p.name,
          avatar: p.avatar,
          color: p.color,
          page: p.page,
          isEditing: p.isEditing,
          cursor: p.cursor,
        };
      });
      setParticipants(peers);
    });

    // Broadcast: chat messages
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as RealtimeChatMessage]);
    });

    // Broadcast: typing indicators
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const { userId, isTyping } = payload as {
        userId: string;
        isTyping: boolean;
      };
      setTypingUsers((prev) =>
        isTyping
          ? prev.includes(userId)
            ? prev
            : [...prev, userId]
          : prev.filter((id) => id !== userId)
      );
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await channel.track({
          name:
            typeof user.firstName === 'string'
              ? `${user.firstName} ${user.lastName || ''}`
              : user.email || 'Anonyme',
          avatar: user.avatar,
          color: userColor,
          page: 1,
          isEditing: false,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [documentId, user, userColor]);

  const sendCursorPosition = useCallback(
    (page: number, x: number, y: number) => {
      channelRef.current?.track({
        name:
          typeof user?.firstName === 'string'
            ? `${user.firstName} ${user.lastName || ''}`
            : user?.email || 'Anonyme',
        avatar: user?.avatar,
        color: userColor,
        page,
        isEditing: false,
        cursor: { x, y },
      });
    },
    [user, userColor]
  );

  const sendPageChange = useCallback(
    (page: number) => {
      channelRef.current?.track({
        name:
          typeof user?.firstName === 'string'
            ? `${user.firstName} ${user.lastName || ''}`
            : user?.email || 'Anonyme',
        avatar: user?.avatar,
        color: userColor,
        page,
        isEditing: false,
      });
    },
    [user, userColor]
  );

  const sendChatMessage = useCallback(
    (content: string, replyTo?: string, pageReference?: number) => {
      const message: RealtimeChatMessage = {
        id: crypto.randomUUID(),
        author: {
          id: user?.id?.toString() || '',
          name:
            typeof user?.firstName === 'string'
              ? `${user.firstName} ${user.lastName || ''}`
              : user?.email || 'Anonyme',
          avatar: user?.avatar,
        },
        content,
        replyTo,
        pageReference,
        createdAt: new Date().toISOString(),
      };

      channelRef.current?.send({
        type: 'broadcast',
        event: 'chat',
        payload: message,
      });

      // Also add locally
      setMessages((prev) => [...prev, message]);
    },
    [user]
  );

  const startTyping = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user?.id?.toString(), isTyping: true },
    });
  }, [user]);

  const stopTyping = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user?.id?.toString(), isTyping: false },
    });
  }, [user]);

  const startEditing = useCallback(() => {
    channelRef.current?.track({
      name:
        typeof user?.firstName === 'string'
          ? `${user.firstName} ${user.lastName || ''}`
          : user?.email || 'Anonyme',
      avatar: user?.avatar,
      color: userColor,
      page: 1,
      isEditing: true,
    });
  }, [user, userColor]);

  const stopEditing = useCallback(() => {
    channelRef.current?.track({
      name:
        typeof user?.firstName === 'string'
          ? `${user.firstName} ${user.lastName || ''}`
          : user?.email || 'Anonyme',
      avatar: user?.avatar,
      color: userColor,
      page: 1,
      isEditing: false,
    });
  }, [user, userColor]);

  const disconnect = useCallback(() => {
    channelRef.current?.unsubscribe();
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    // Re-subscribe triggers useEffect cleanup + re-run
  }, [disconnect]);

  return {
    isConnected,
    participants,
    messages,
    typingUsers,
    userColor,
    sendCursorPosition,
    sendPageChange,
    sendChatMessage,
    startTyping,
    stopTyping,
    startEditing,
    stopEditing,
    disconnect,
    reconnect,
  };
}

// ─── Table change subscription ───

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Subscribe to real-time changes on a Supabase table.
 * Replaces Redis pub/sub and Django Channels.
 */
export function useTableSubscription<T extends Record<string, unknown>>(
  table: string,
  options?: {
    event?: ChangeEvent | '*';
    filter?: string; // e.g. "organization_id=eq.abc-123"
    onInsert?: (record: T) => void;
    onUpdate?: (record: T) => void;
    onDelete?: (old: T) => void;
  }
) {
  const [latestChange, setLatestChange] = useState<{
    type: ChangeEvent;
    record: T | null;
    old: T | null;
  } | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`table:${table}`)
      .on(
        'postgres_changes' as any,
        {
          event: options?.event || '*',
          schema: 'public',
          table,
          filter: options?.filter,
        },
        (payload: any) => {
          const change = {
            type: payload.eventType as ChangeEvent,
            record: (payload.new as T) || null,
            old: (payload.old as T) || null,
          };
          setLatestChange(change);

          if (payload.eventType === 'INSERT' && options?.onInsert) {
            options.onInsert(payload.new as T);
          }
          if (payload.eventType === 'UPDATE' && options?.onUpdate) {
            options.onUpdate(payload.new as T);
          }
          if (payload.eventType === 'DELETE' && options?.onDelete) {
            options.onDelete(payload.old as T);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, options?.event, options?.filter]);

  return latestChange;
}

// ─── Notification subscription ───

/**
 * Subscribe to real-time notifications for the current user.
 */
export function useNotificationSubscription(
  userId: string | undefined,
  onNewNotification: (notification: any) => void
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload: any) => {
          onNewNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, onNewNotification]);
}

// ─── Helpers ───

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
