/**
 * AI Provider Store using Zustand
 *
 * Claude API keys are managed server-side via Supabase Edge Function secrets.
 * OpenRouter free models work without API keys.
 * OpenRouter paid models can use user-provided keys or the server-side proxy.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invokeEdgeFunction } from '../lib/supabase';
import {
  OpenRouterModelId,
  OPENROUTER_MODELS,
  OPENROUTER_FREE_MODELS,
} from '../services/openrouter';
import { ClaudeModelId, CLAUDE_MODELS } from './claudeStore';

// Provider types
export type AIProvider = 'openrouter' | 'claude';

// Union type for all model IDs
export type AIModelId = OpenRouterModelId | ClaudeModelId;

export interface AIProviderConfig {
  provider: AIProvider;
  openrouter: {
    model: OpenRouterModelId;
    useFreeModels: boolean;
  };
  claude: {
    model: ClaudeModelId;
  };
  // Common settings
  maxTokens: number;
  temperature: number;
  isConfigured: boolean;
  features: {
    chatEnabled: boolean;
    documentAnalysisEnabled: boolean;
  };
}

interface AIState {
  config: AIProviderConfig;
  isValidating: boolean;
  validationError: string | null;

  // Actions
  setProvider: (provider: AIProvider) => void;
  setOpenRouterModel: (model: OpenRouterModelId) => void;
  setOpenRouterUseFreeModels: (useFree: boolean) => void;
  setClaudeModel: (model: ClaudeModelId) => void;
  setMaxTokens: (tokens: number) => void;
  setTemperature: (temp: number) => void;
  setFeature: (feature: keyof AIProviderConfig['features'], enabled: boolean) => void;
  validateConfig: () => Promise<boolean>;
  clearConfig: () => void;
  setValidationError: (error: string | null) => void;

  // Getters
  getCurrentModel: () => string;
  getCurrentModelInfo: () =>
    | { id: string; name: string; description: string; free?: boolean }
    | undefined;
  isReady: () => boolean;
}

const defaultConfig: AIProviderConfig = {
  provider: 'openrouter', // Default to OpenRouter (has free models)
  openrouter: {
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    useFreeModels: true,
  },
  claude: {
    model: 'claude-sonnet-4-20250514',
  },
  maxTokens: 4096,
  temperature: 0.7,
  isConfigured: false,
  features: {
    chatEnabled: true,
    documentAnalysisEnabled: true,
  },
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      config: { ...defaultConfig },
      isValidating: false,
      validationError: null,

      setProvider: (provider: AIProvider) => {
        set((state) => ({
          config: {
            ...state.config,
            provider,
            isConfigured: false,
          },
          validationError: null,
        }));
      },

      setOpenRouterModel: (model: OpenRouterModelId) => {
        const isFreeModel = OPENROUTER_FREE_MODELS.some((m) => m.id === model);
        set((state) => ({
          config: {
            ...state.config,
            openrouter: {
              ...state.config.openrouter,
              model,
              useFreeModels: isFreeModel,
            },
          },
        }));
      },

      setOpenRouterUseFreeModels: (useFree: boolean) => {
        set((state) => {
          let model = state.config.openrouter.model;
          if (useFree) {
            const isFree = OPENROUTER_FREE_MODELS.some((m) => m.id === model);
            if (!isFree) {
              model = 'meta-llama/llama-3.2-3b-instruct:free';
            }
          }
          return {
            config: {
              ...state.config,
              openrouter: {
                ...state.config.openrouter,
                useFreeModels: useFree,
                model,
              },
            },
          };
        });
      },

      setClaudeModel: (model: ClaudeModelId) => {
        set((state) => ({
          config: {
            ...state.config,
            claude: {
              ...state.config.claude,
              model,
            },
          },
        }));
      },

      setMaxTokens: (tokens: number) => {
        set((state) => ({
          config: {
            ...state.config,
            maxTokens: Math.min(Math.max(tokens, 100), 8192),
          },
        }));
      },

      setTemperature: (temp: number) => {
        set((state) => ({
          config: {
            ...state.config,
            temperature: Math.min(Math.max(temp, 0), 1),
          },
        }));
      },

      setFeature: (feature: keyof AIProviderConfig['features'], enabled: boolean) => {
        set((state) => ({
          config: {
            ...state.config,
            features: { ...state.config.features, [feature]: enabled },
          },
        }));
      },

      validateConfig: async () => {
        const { config } = get();
        set({ isValidating: true, validationError: null });

        try {
          if (config.provider === 'openrouter') {
            const isFreeModel = OPENROUTER_FREE_MODELS.some(
              (m) => m.id === config.openrouter.model
            );

            if (isFreeModel) {
              // Test free model directly
              const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'HTTP-Referer': window.location.origin,
                  'X-Title': 'ADVIST Platform',
                },
                body: JSON.stringify({
                  model: config.openrouter.model,
                  max_tokens: 5,
                  messages: [{ role: 'user', content: 'test' }],
                }),
              });

              if (response.ok) {
                set((state) => ({
                  config: { ...state.config, isConfigured: true },
                  isValidating: false,
                  validationError: null,
                }));
                return true;
              }
              const errorData = await response.json().catch(() => ({}));
              set({
                isValidating: false,
                validationError: errorData.error?.message || `Erreur ${response.status}`,
              });
              return false;
            } else {
              // Paid model → test via Edge Function proxy
              await invokeEdgeFunction('ai-proxy', {
                provider: 'openrouter',
                model: config.openrouter.model,
                max_tokens: 5,
                messages: [{ role: 'user', content: 'test' }],
              });
              set((state) => ({
                config: { ...state.config, isConfigured: true },
                isValidating: false,
                validationError: null,
              }));
              return true;
            }
          } else {
            // Claude → always via Edge Function proxy
            await invokeEdgeFunction('ai-proxy', {
              provider: 'anthropic',
              model: config.claude.model,
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }],
            });
            set((state) => ({
              config: { ...state.config, isConfigured: true },
              isValidating: false,
              validationError: null,
            }));
            return true;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur de connexion';
          set({ isValidating: false, validationError: message });
          return false;
        }
      },

      clearConfig: () => {
        set({
          config: { ...defaultConfig },
          isValidating: false,
          validationError: null,
        });
      },

      setValidationError: (error: string | null) => {
        set({ validationError: error });
      },

      getCurrentModel: () => {
        const { config } = get();
        if (config.provider === 'openrouter') {
          return config.openrouter.model;
        }
        return config.claude.model;
      },

      getCurrentModelInfo: () => {
        const { config } = get();
        if (config.provider === 'openrouter') {
          return OPENROUTER_MODELS.find((m) => m.id === config.openrouter.model);
        }
        return CLAUDE_MODELS.find((m) => m.id === config.claude.model);
      },

      isReady: () => {
        const { config } = get();
        return config.isConfigured;
      },
    }),
    {
      name: 'advist-ai',
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);

// Export model lists for use in components
export { OPENROUTER_MODELS, OPENROUTER_FREE_MODELS } from '../services/openrouter';
export { CLAUDE_MODELS } from './claudeStore';
