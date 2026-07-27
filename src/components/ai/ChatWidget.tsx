/**
 * AI Chat Widget Component
 * Floating chat widget for Claude AI assistant
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { generateSecureId } from '../../utils/encryption';
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Loader2,
  User,
  Minimize2,
  Maximize2,
  GripVertical,
  Cloud,
  Shield,
} from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { aiService, AIMessage } from '../../services/ai';
import {
  askProph3t,
  buildGroundingBlock,
  logAudit,
  isProph3tConfigured,
  DEFAULT_SENSITIVITY,
  type Sensitivity,
} from '../../lib/proph3t';
import { useTenantStore } from '../../stores/tenantStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatWidgetProps {
  context?: {
    documentId?: number;
    documentName?: string;
    pageContext?: string;
  };
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ context }) => {
  const { t } = useTranslation();
  const { config, isReady } = useAIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Atlas Studio « Proph3t core » : choix du moteur + gouvernance par sensibilité.
  const tenantId = useTenantStore((s) => s.currentTenant?.id);
  const societyId = tenantId !== undefined ? String(tenantId) : undefined;
  const coreConfigured = isProph3tConfigured();
  const [mode, setMode] = useState<'local' | 'core'>('local');
  const [sensitivity, setSensitivity] = useState<Sensitivity>(DEFAULT_SENSITIVITY);
  const [coreConversationId, setCoreConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Draggable state
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('ai-chat-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          x: Math.min(Math.max(0, parsed.x), window.innerWidth - 60),
          y: Math.min(Math.max(0, parsed.y), window.innerHeight - 60),
        };
      } catch {
        return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
      }
    }
    return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false);

  // Save position to localStorage
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('ai-chat-position', JSON.stringify(position));
    }
  }, [position, isDragging]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - (isOpen ? 400 : 60)),
        y: Math.min(prev.y, window.innerHeight - (isOpen ? 520 : 60)),
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

        const maxX = window.innerWidth - (isOpen ? 400 : 60);
        const maxY = window.innerHeight - (isOpen ? 520 : 60);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Check if chat is disabled (but allow display even without API config for demo)
  const isConfigured = isReady();
  // En mode « core », l'app n'a pas besoin d'un provider local configuré :
  // c'est le core qui orchestre. En mode « local », on garde le gating existant.
  const canInteract = mode === 'core' ? coreConfigured : isConfigured;
  if (!config.features.chatEnabled) {
    return null;
  }

  const generateId = () => generateSecureId('msg');

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add placeholder for assistant response
    const assistantMessageId = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    try {
      // Build message history for context
      const messageHistory: AIMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      messageHistory.push({ role: 'user', content: userMessage.content });

      let answer: string;

      if (mode === 'core') {
        // ── Mode B : déléguer tout le tour au Proph3t core (orchestrateur
        // hébergé), gouverné par la sensibilité des données. En 'confidential',
        // le core ne sollicite que des providers sans rétention (Ollama/Claude).
        const res = await askProph3t({
          message: userMessage.content,
          sensitivity,
          societyId,
          conversationId: coreConversationId,
        });
        setCoreConversationId(res.conversation_id);
        answer = res.disclaimer ? `${res.answer}\n\n— ${res.disclaimer}` : res.answer;
      } else {
        // ── Voie locale (LLM Advist via ai-proxy), inchangée, enrichie Mode A.
        let systemPrompt: string | undefined = context?.documentName
          ? `Tu es Proph3t, l'assistant IA intégré dans ADVIST. L'utilisateur travaille actuellement sur le document "${context.documentName}". Aide-le avec ses questions concernant ce document ou toute autre question.`
          : undefined;

        // Mode A : ancrage RAG (SYSCOHADA/OHADA/CGI) + mémoire inter-apps.
        // No-op tant que le SDK fédéré n'est pas installé (dégradation propre).
        try {
          const grounding = await buildGroundingBlock(userMessage.content, { societyId });
          if (grounding) {
            const base =
              systemPrompt ??
              "Tu es Proph3t, l'assistant IA d'ADVIST. Réponds en français, de manière claire et concise.";
            systemPrompt = `${base}${grounding}`;
          }
        } catch {
          // enrichissement best-effort : on poursuit en local pur
        }

        const response = await aiService.chat(messageHistory, systemPrompt);
        answer = response.content;

        // Audit chaîné best-effort (no-op si Mode A indisponible).
        void logAudit('advist_chat_local_response', {
          subjectType: context?.documentId !== undefined ? 'document' : undefined,
          subjectId: context?.documentId !== undefined ? String(context.documentId) : undefined,
          content: { question: userMessage.content },
          societyId,
        });
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { ...m, content: answer, isStreaming: false } : m
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: `Désolé, une erreur s'est produite: ${errorMessage}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
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
          onClick={(_e) => {
            if (!hasMoved.current) {
              setIsOpen(true);
            }
          }}
          className="proph3t-orb relative w-16 h-16 rounded-full transition-transform duration-300 hover:scale-110 group"
          title={t('ai.chat.open', "Ouvrir l'assistant IA")}
        >
          <img src="/proph3t.png" alt="Proph3t" className="w-full h-full object-contain" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-primary-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-96 h-[32rem]'
      }`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header with drag handle */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-900 to-primary-900 rounded-t-2xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/50" />
          <img src="/proph3t.png" alt="Proph3t" className="w-7 h-7 object-contain" />
          <span className="text-xl text-white" style={{ fontFamily: "'Grand Hotel', cursive" }}>
            Proph3t
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Sélecteur de moteur : LLM local (Advist) vs Proph3t core (Mode B) */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary-100 bg-primary-50/60">
            <div className="inline-flex rounded-lg bg-primary-100 p-0.5 text-xs font-medium">
              <button
                onClick={() => setMode('local')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mode === 'local'
                    ? 'bg-white text-primary-900 shadow-sm'
                    : 'text-primary-500 hover:text-primary-900'
                }`}
              >
                Local
              </button>
              <button
                onClick={() => coreConfigured && setMode('core')}
                disabled={!coreConfigured}
                title={
                  coreConfigured
                    ? 'Déléguer la question au Proph3t core Atlas Studio'
                    : 'Proph3t core non configuré (VITE_ATLAS_SUPABASE_URL / _ANON_KEY)'
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors disabled:opacity-40 ${
                  mode === 'core'
                    ? 'bg-white text-primary-900 shadow-sm'
                    : 'text-primary-500 hover:text-primary-900'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" /> Atlas core
              </button>
            </div>
            {mode === 'core' && (
              <div
                className="inline-flex items-center gap-1"
                title="Sensibilité des données (gouverne les providers autorisés côté core)"
              >
                <Shield className="w-3.5 h-3.5 text-primary-500" />
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value as Sensitivity)}
                  className="text-xs bg-white border border-primary-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="confidential">Confidentiel</option>
                  <option value="internal">Interne</option>
                  <option value="public">Public</option>
                </select>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-8rem)]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="p-4 bg-primary-50 rounded-full mb-4">
                  <MessageSquare className="w-8 h-8 text-primary-900" />
                </div>
                <h3
                  className="font-medium text-primary-900 mb-2"
                  style={{ fontFamily: "'Grand Hotel', cursive", fontSize: '1.5rem' }}
                >
                  Proph3t
                </h3>
                {!canInteract ? (
                  <p className="text-sm text-primary-500">
                    {t(
                      'ai.chat.notConfigured',
                      "Configurez l'API dans Paramètres → Intelligence Artificielle pour activer Proph3t."
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-primary-500">
                    {t(
                      'ai.chat.welcomeDesc',
                      "Posez-moi vos questions sur vos documents ou l'utilisation d'ADVIST."
                    )}
                  </p>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                      message.role === 'user' ? 'bg-advist-primary' : ''
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <img
                        src="/proph3t.png"
                        alt="Proph3t"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-advist-primary text-white rounded-tr-sm'
                        : 'bg-primary-100 text-primary-900 rounded-tl-sm'
                    }`}
                  >
                    {message.isStreaming ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">
                          {t('ai.chat.thinking', 'Proph3t réfléchit...')}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary-100">
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-2 text-primary-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('ai.chat.clear', 'Effacer la conversation')}
                >
                  <Trash2 size={18} />
                </button>
              )}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    !canInteract
                      ? t('ai.chat.configureFirst', "Configurez d'abord l'API...")
                      : t('ai.chat.placeholder', 'Posez votre question...')
                  }
                  disabled={isLoading || !canInteract}
                  className="w-full px-4 py-2.5 pr-12 bg-primary-50 border border-primary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || !canInteract}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-primary-900 rounded-lg hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;
