/**
 * Claude AI Configuration Store using Zustand
 *
 * API keys are now managed server-side via Supabase Edge Function secrets.
 * This store manages model selection and feature toggles only.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invokeEdgeFunction } from '../lib/supabase';

// Available Claude models
export const CLAUDE_MODELS = [
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude 4.5 Haiku',
    description: 'Rapide et économique',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    description: 'Équilibré (Recommandé)',
  },
  { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus', description: 'Plus puissant' },
] as const;

export type ClaudeModelId = (typeof CLAUDE_MODELS)[number]['id'];

export interface ClaudeConfig {
  model: ClaudeModelId;
  maxTokens: number;
  temperature: number;
  isConfigured: boolean;
  features: {
    chatEnabled: boolean;
    documentAnalysisEnabled: boolean;
  };
}

interface ClaudeState {
  config: ClaudeConfig;
  isValidating: boolean;
  validationError: string | null;

  // Actions
  setModel: (model: ClaudeModelId) => void;
  setMaxTokens: (tokens: number) => void;
  setTemperature: (temp: number) => void;
  setFeature: (feature: keyof ClaudeConfig['features'], enabled: boolean) => void;
  validateConfig: () => Promise<boolean>;
  clearConfig: () => void;
  setValidationError: (error: string | null) => void;

  // Getters
  isReady: () => boolean;
}

const defaultConfig: ClaudeConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  isConfigured: false,
  features: {
    chatEnabled: true,
    documentAnalysisEnabled: true,
  },
};

export const useClaudeStore = create<ClaudeState>()(
  persist(
    (set, get) => ({
      config: { ...defaultConfig },
      isValidating: false,
      validationError: null,

      setModel: (model: ClaudeModelId) => {
        set((state) => ({
          config: { ...state.config, model },
        }));
      },

      setMaxTokens: (tokens: number) => {
        set((state) => ({
          config: { ...state.config, maxTokens: Math.min(Math.max(tokens, 100), 8192) },
        }));
      },

      setTemperature: (temp: number) => {
        set((state) => ({
          config: { ...state.config, temperature: Math.min(Math.max(temp, 0), 1) },
        }));
      },

      setFeature: (feature: keyof ClaudeConfig['features'], enabled: boolean) => {
        set((state) => ({
          config: {
            ...state.config,
            features: { ...state.config.features, [feature]: enabled },
          },
        }));
      },

      /**
       * Validate that the AI proxy Edge Function is configured and working.
       * The API key is stored server-side in Supabase Edge Function secrets.
       */
      validateConfig: async () => {
        set({ isValidating: true, validationError: null });

        try {
          await invokeEdgeFunction('ai-proxy', {
            provider: 'anthropic',
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }],
          });

          set((state) => ({
            config: {
              ...state.config,
              isConfigured: true,
            },
            isValidating: false,
            validationError: null,
          }));
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Service IA non configuré';
          set({
            isValidating: false,
            validationError: message,
          });
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

      isReady: () => {
        return get().config.isConfigured;
      },
    }),
    {
      name: 'advist-claude',
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);
