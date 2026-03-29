/**
 * Real-time Document Collaboration Hook
 * Handles WebSocket connection, presence, cursors, and chat
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store';

// Types
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  page: number;
  isEditing: boolean;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  userColor: string;
  page: number;
  x: number;
  y: number;
  selection?: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
}

export interface ChatMessage {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  replyTo?: string;
  pageReference?: number;
  createdAt: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface CollaborationState {
  isConnected: boolean;
  participants: Participant[];
  cursors: Map<string, CursorPosition>;
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  sessionId: string | null;
  userColor: string | null;
}

export interface CollaborationActions {
  sendCursorPosition: (page: number, x: number, y: number, selection?: any) => void;
  sendPageChange: (page: number) => void;
  sendChatMessage: (content: string, replyTo?: string, pageReference?: number) => void;
  startTyping: () => void;
  stopTyping: () => void;
  startEditing: (section?: string) => void;
  stopEditing: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useDocumentCollaboration(documentId: string): CollaborationState & CollaborationActions {
  const { accessToken } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userColor, setUserColor] = useState<string | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!documentId || !accessToken) return;

    const wsUrl = `${WS_URL}/ws/document/${documentId}/?token=${accessToken}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Collaboration WebSocket connected');
      setIsConnected(true);

      // Start ping interval to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = (event) => {
      console.log('Collaboration WebSocket closed:', event.code);
      setIsConnected(false);

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // Attempt to reconnect after 3 seconds
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('Collaboration WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [documentId, accessToken]);

  // Handle incoming messages
  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connection_established':
        setSessionId(data.session_id);
        setUserColor(data.user_color);
        setParticipants(data.participants || []);
        break;

      case 'user_joined':
        setParticipants((prev) => [
          ...prev,
          {
            id: data.user.id,
            name: data.user.name,
            avatar: data.user.avatar,
            color: data.user.color,
            page: 1,
            isEditing: false,
          },
        ]);
        break;

      case 'user_left':
        setParticipants((prev) => prev.filter((p) => p.id !== data.user_id));
        setCursors((prev) => {
          const next = new Map(prev);
          next.delete(data.user_id);
          return next;
        });
        break;

      case 'cursor_update':
        setCursors((prev) => {
          const next = new Map(prev);
          next.set(data.user_id, {
            userId: data.user_id,
            userName: data.user_name,
            userColor: data.user_color,
            page: data.page,
            x: data.x,
            y: data.y,
            selection: data.selection,
          });
          return next;
        });
        break;

      case 'page_changed':
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === data.user_id ? { ...p, page: data.page } : p
          )
        );
        break;

      case 'chat_message':
        setMessages((prev) => [...prev, data.message]);
        break;

      case 'typing':
        if (data.is_typing) {
          setTypingUsers((prev) => {
            if (prev.find((u) => u.userId === data.user_id)) return prev;
            return [...prev, { userId: data.user_id, userName: data.user_name }];
          });
        } else {
          setTypingUsers((prev) =>
            prev.filter((u) => u.userId !== data.user_id)
          );
        }
        break;

      case 'edit_state':
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === data.user_id ? { ...p, isEditing: data.is_editing } : p
          )
        );
        break;

      case 'pong':
        // Connection is alive
        break;
    }
  }, []);

  // Send message to WebSocket
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Actions
  const sendCursorPosition = useCallback(
    (page: number, x: number, y: number, selection?: any) => {
      send({ type: 'cursor_move', page, x, y, selection });
    },
    [send]
  );

  const sendPageChange = useCallback(
    (page: number) => {
      send({ type: 'page_change', page });
    },
    [send]
  );

  const sendChatMessage = useCallback(
    (content: string, replyTo?: string, pageReference?: number) => {
      send({ type: 'chat_message', content, reply_to: replyTo, page_reference: pageReference });
    },
    [send]
  );

  const startTyping = useCallback(() => {
    send({ type: 'typing_start' });
  }, [send]);

  const stopTyping = useCallback(() => {
    send({ type: 'typing_stop' });
  }, [send]);

  const startEditing = useCallback(
    (section?: string) => {
      send({ type: 'edit_start', section });
    },
    [send]
  );

  const stopEditing = useCallback(() => {
    send({ type: 'edit_stop' });
  }, [send]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    // State
    isConnected,
    participants,
    cursors,
    messages,
    typingUsers,
    sessionId,
    userColor,
    // Actions
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

export default useDocumentCollaboration;

/**
 * @deprecated Use useRealtimeCollaboration from './useSupabaseRealtime' instead.
 * This WebSocket-based hook will be removed. The Supabase Realtime version
 * provides the same functionality without requiring a separate WebSocket server.
 */
export { useRealtimeCollaboration } from './useSupabaseRealtime';
export type {
  RealtimeParticipant,
  RealtimeChatMessage,
} from './useSupabaseRealtime';
