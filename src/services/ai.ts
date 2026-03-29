/**
 * Unified AI Service
 * Provides a single interface for multiple AI providers (OpenRouter, Claude)
 */
import { useAIStore } from '../store/aiStore';
import { openRouterService, OpenRouterMessage } from './openrouter';
import { claudeService, ClaudeMessage, DocumentAnalysisResult } from './claude';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  provider: 'openrouter' | 'claude';
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * System prompts for different use cases
 */
const SYSTEM_PROMPTS = {
  assistant: `Tu es un assistant IA intégré dans ADVIST, une plateforme de gestion documentaire et de workflows pour les entreprises africaines.
Tu aides les utilisateurs à:
- Comprendre et gérer leurs documents
- Naviguer dans les workflows de validation
- Répondre aux questions sur l'utilisation de la plateforme
- Fournir des conseils sur la conformité OHADA

Réponds toujours en français, de manière claire et concise. Sois professionnel mais amical.`,

  documentAnalysis: `Tu es un expert en analyse documentaire spécialisé dans les documents d'entreprise africains et la conformité OHADA.
Analyse le document fourni et retourne un JSON structuré avec:
1. Un résumé (type de document, description, points clés)
2. Les points d'attention (critiques, avertissements, informations)
3. Une checklist de validation

Format de réponse OBLIGATOIRE (JSON uniquement, sans markdown):
{
  "summary": {
    "type": "Type du document",
    "description": "Description brève",
    "keyPoints": [{"label": "Label", "value": "Valeur"}]
  },
  "attentionPoints": [
    {"severity": "critical|warning|info", "title": "Titre", "description": "Description", "clause": "Clause concernée", "page": 1}
  ],
  "validationChecklist": [
    {"label": "Point à vérifier", "status": "valid|invalid|pending|warning", "details": "Détails optionnels"}
  ],
  "confidence": 0.85
}`,
};

export const aiService = {
  /**
   * Send a chat message and get a response
   * Automatically uses the configured provider
   */
  async chat(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    const store = useAIStore.getState();
    const { config } = store;

    if (config.provider === 'openrouter') {
      const apiKey = config.openrouter.apiKey
        ? store.getApiKey()
        : undefined;

      const openRouterMessages: OpenRouterMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await openRouterService.chat(openRouterMessages, {
        apiKey,
        model: config.openrouter.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        systemPrompt: systemPrompt || SYSTEM_PROMPTS.assistant,
      });

      return {
        id: response.id,
        content: response.content,
        model: response.model,
        provider: 'openrouter',
        usage: {
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
        },
      };
    } else {
      // Claude provider
      const claudeMessages: ClaudeMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await claudeService.chat(claudeMessages, systemPrompt);

      return {
        id: response.id,
        content: response.content,
        model: response.model,
        provider: 'claude',
        usage: {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
        },
      };
    }
  },

  /**
   * Analyze a document and return structured analysis
   */
  async analyzeDocument(
    documentContent: string,
    documentType?: string
  ): Promise<DocumentAnalysisResult> {
    const store = useAIStore.getState();
    const { config } = store;

    if (config.provider === 'openrouter') {
      const apiKey = config.openrouter.apiKey
        ? store.getApiKey()
        : undefined;

      return openRouterService.analyzeDocument(documentContent, {
        apiKey,
        model: config.openrouter.model,
        documentType,
      });
    } else {
      return claudeService.analyzeDocument(documentContent, documentType);
    }
  },

  /**
   * Summarize text content
   */
  async summarize(text: string, maxLength: number = 200): Promise<string> {
    const store = useAIStore.getState();
    const { config } = store;

    if (config.provider === 'openrouter') {
      const apiKey = config.openrouter.apiKey
        ? store.getApiKey()
        : undefined;

      return openRouterService.summarize(text, {
        apiKey,
        model: config.openrouter.model,
        maxLength,
      });
    } else {
      return claudeService.summarize(text, maxLength);
    }
  },

  /**
   * Get the current provider info
   */
  getProviderInfo(): {
    provider: 'openrouter' | 'claude';
    model: string;
    modelName: string;
    isFree: boolean;
  } {
    const store = useAIStore.getState();
    const { config } = store;
    const modelInfo = store.getCurrentModelInfo();

    return {
      provider: config.provider,
      model: store.getCurrentModel(),
      modelName: modelInfo?.name || 'Unknown',
      isFree: config.provider === 'openrouter' && (modelInfo as { free?: boolean })?.free === true,
    };
  },

  /**
   * Check if the AI service is ready
   */
  isReady(): boolean {
    return useAIStore.getState().isReady();
  },

  /**
   * Check if the current configuration requires an API key
   */
  requiresApiKey(): boolean {
    return useAIStore.getState().requiresApiKey();
  },
};

// Re-export types
export type { DocumentAnalysisResult } from './claude';
