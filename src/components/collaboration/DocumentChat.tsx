/**
 * Document Chat Component
 * Real-time chat panel for document collaboration
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  X,
  FileText,
  Reply,
  _ChevronDown,
  _Paperclip,
  GripVertical,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ChatMessage, TypingUser } from '../../hooks/useDocumentCollaboration';

interface DocumentChatProps {
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  onSendMessage: (content: string, replyTo?: string, pageReference?: number) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  currentPage?: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
  messages,
  typingUsers,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  currentPage,
  isOpen,
  onToggle,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [includePageRef, setIncludePageRef] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Draggable state - positioned to the left of AI chat by default
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('doc-chat-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          x: Math.min(Math.max(0, parsed.x), window.innerWidth - 60),
          y: Math.min(Math.max(0, parsed.y), window.innerHeight - 60),
        };
      } catch {
        return { x: window.innerWidth - 150, y: window.innerHeight - 80 };
      }
    }
    return { x: window.innerWidth - 150, y: window.innerHeight - 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false);

  // Save position to localStorage
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('doc-chat-position', JSON.stringify(position));
    }
  }, [position, isDragging]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - (isOpen ? 330 : 60)),
        y: Math.min(prev.y, window.innerHeight - (isOpen ? 510 : 60)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setIsDragging(true);
      hasMoved.current = false;
    }
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        hasMoved.current = true;

        const maxX = window.innerWidth - (isOpen ? 330 : 60);
        const maxY = window.innerHeight - (isOpen ? 510 : 60);

        setPosition({
          x: Math.min(Math.max(0, clientX - dragOffset.x), maxX),
          y: Math.min(Math.max(0, clientY - dragOffset.y), maxY),
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Typing indicator with debounce
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (e.target.value) {
      onStartTyping();
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 2000);
    } else {
      onStopTyping();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    onSendMessage(inputValue.trim(), replyingTo?.id, includePageRef ? currentPage : undefined);

    setInputValue('');
    setReplyingTo(null);
    setIncludePageRef(false);
    onStopTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) {
    return (
      <div
        ref={containerRef}
        className="fixed z-50"
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <button
          onClick={() => {
            if (!hasMoved.current) {
              onToggle();
            }
          }}
          className="p-4 bg-advist-dark text-white rounded-full shadow-lg hover:bg-advist-dark/90 transition-colors"
        >
          <MessageSquare size={24} />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-advist-red text-white text-xs font-bold rounded-full flex items-center justify-center">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed w-80 h-[500px] bg-white rounded-xl shadow-2xl border border-advist-border flex flex-col z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header with drag handle */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-advist-border bg-advist-dark text-white rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-white/50" />
          <MessageSquare size={18} />
          <span className="font-semibold">Discussion</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-advist-text-muted">
            <MessageSquare size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Aucun message</p>
            <p className="text-xs">Démarrez la conversation !</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReply={() => {
                setReplyingTo(message);
                inputRef.current?.focus();
              }}
              formatTime={formatTime}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-advist-text-secondary">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-advist-surface-dark rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-advist-surface-dark rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <span
                className="w-2 h-2 bg-advist-surface-dark rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <span>{typingUsers.map((u) => u.userName).join(', ')} écrit...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-advist-surface-dark border-t border-advist-border">
          <Reply size={14} className="text-advist-text-muted" />
          <span className="text-sm text-advist-text-secondary truncate flex-1">
            Répondre à {replyingTo.author.name}
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-advist-border rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-advist-border">
        {/* Page reference toggle */}
        {currentPage && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIncludePageRef(!includePageRef)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-colors ${
                includePageRef
                  ? 'bg-advist-dark text-white'
                  : 'bg-advist-surface-dark text-advist-text-secondary hover:bg-advist-border'
              }`}
            >
              <FileText size={12} />
              Page {currentPage}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Votre message..."
            className="flex-1 px-3 py-2 border border-advist-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-advist-gold/20 focus:border-advist-dark"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            aria-label="Envoyer le message"
            className="p-2 bg-advist-dark text-white rounded-lg hover:bg-advist-dark/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  onReply: () => void;
  formatTime: (date: string) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReply, formatTime }) => {
  return (
    <div className="group">
      <div className="flex items-start gap-2">
        <Avatar name={message.author.name} src={message.author.avatar} size="xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-advist-gray900">{message.author.name}</span>
            <span className="text-xs text-advist-text-muted">{formatTime(message.createdAt)}</span>
          </div>

          {/* Page reference */}
          {message.pageReference && (
            <div className="flex items-center gap-1 text-xs text-advist-blue-light mt-0.5">
              <FileText size={10} />
              Page {message.pageReference}
            </div>
          )}

          {/* Message content */}
          <p className="text-sm text-advist-gray900 mt-0.5 break-words">{message.content}</p>
        </div>

        {/* Actions */}
        <button
          onClick={onReply}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-advist-surface-dark rounded transition-opacity"
          title="Répondre"
        >
          <Reply size={14} className="text-advist-text-muted" />
        </button>
      </div>
    </div>
  );
};

/**
 * Floating chat button for minimized state
 * Note: This component is kept for backward compatibility
 * The main DocumentChat now handles its own draggable button
 */
export const ChatToggleButton: React.FC<{
  unreadCount: number;
  onClick: () => void;
}> = ({ unreadCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 p-4 bg-advist-dark text-white rounded-full shadow-lg hover:bg-advist-dark/90 transition-all hover:scale-105 z-50"
    >
      <MessageSquare size={24} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-advist-red text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default DocumentChat;
