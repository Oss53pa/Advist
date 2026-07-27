/**
 * OpenRouter AI Service
 * Provides access to multiple free and paid AI models via OpenRouter
 */

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  content: string;
  model: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Free models available on OpenRouter
export const OPENROUTER_FREE_MODELS = [
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    description: 'Rapide et gratuit',
    free: true,
  },
  {
    id: 'google/gemma-2-9b-it:free',
    name: 'Gemma 2 9B',
    description: 'Google, gratuit',
    free: true,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    description: 'Mistral AI, gratuit',
    free: true,
  },
  {
    id: 'qwen/qwen-2.5-7b-instruct:free',
    name: 'Qwen 2.5 7B',
    description: 'Alibaba, gratuit',
    free: true,
  },
  {
    id: 'huggingfaceh4/zephyr-7b-beta:free',
    name: 'Zephyr 7B',
    description: 'HuggingFace, gratuit',
    free: true,
  },
] as const;

// Paid models (require API key with credits)
export const OPENROUTER_PAID_MODELS = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'OpenAI, économique',
    free: false,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI, puissant',
    free: false,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic via OpenRouter',
    free: false,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Google, avancé',
    free: false,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    description: 'Meta, très puissant',
    free: false,
  },
] as const;

export const OPENROUTER_MODELS = [...OPENROUTER_FREE_MODELS, ...OPENROUTER_PAID_MODELS];

export type OpenRouterModelId = (typeof OPENROUTER_MODELS)[number]['id'];

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

/**
 * Get headers for OpenRouter API requests
 */
const getHeaders = (apiKey?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-Title': 'ADVIST Platform',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
};

export const openRouterService = {
  /**
   * Send a chat message and get a response
   */
  async chat(
    messages: OpenRouterMessage[],
    options: {
      apiKey?: string;
      model?: OpenRouterModelId;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<OpenRouterResponse> {
    const {
      apiKey,
      model = 'meta-llama/llama-3.2-3b-instruct:free',
      maxTokens = 4096,
      temperature = 0.7,
      systemPrompt = SYSTEM_PROMPTS.assistant,
    } = options;

    const modelInfo = OPENROUTER_MODELS.find((m) => m.id === model);

    // Route paid models through Edge Function proxy to keep API keys server-side
    if (modelInfo && !modelInfo.free && !apiKey) {
      const { invokeEdgeFunction } = await import('../lib/supabase');
      const data = await invokeEdgeFunction<Record<string, any>>('ai-proxy', {
        provider: 'openrouter',
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      });

      const choice = data.choices?.[0];
      return {
        id: data.id || '',
        content: choice?.message?.content || '',
        model: data.model || model,
        finishReason: choice?.finish_reason || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    }

    const requestMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: requestMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      id: data.id || '',
      content: choice?.message?.content || '',
      model: data.model || model,
      finishReason: choice?.finish_reason || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  },

  /**
   * Analyze a document and return structured analysis
   */
  async analyzeDocument(
    documentContent: string,
    options: {
      apiKey?: string;
      model?: OpenRouterModelId;
      documentType?: string;
    } = {}
  ): Promise<{
    summary: {
      type: string;
      description: string;
      keyPoints: Array<{ label: string; value: string }>;
    };
    attentionPoints: Array<{
      severity: 'critical' | 'warning' | 'info';
      title: string;
      description: string;
      clause?: string;
      page?: number;
    }>;
    validationChecklist: Array<{
      label: string;
      status: 'valid' | 'invalid' | 'pending' | 'warning';
      details?: string;
    }>;
    confidence: number;
  }> {
    const { apiKey, model, documentType } = options;

    const userMessage = documentType
      ? `Analyse ce document de type "${documentType}":\n\n${documentContent}`
      : `Analyse ce document:\n\n${documentContent}`;

    const response = await this.chat([{ role: 'user', content: userMessage }], {
      apiKey,
      model,
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: SYSTEM_PROMPTS.documentAnalysis,
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Format de réponse invalide');
    } catch {
      return {
        summary: {
          type: documentType || 'Document',
          description: 'Analyse non disponible',
          keyPoints: [],
        },
        attentionPoints: [
          {
            severity: 'warning',
            title: 'Analyse incomplète',
            description: "L'analyse n'a pas pu être effectuée correctement",
          },
        ],
        validationChecklist: [],
        confidence: 0,
      };
    }
  },

  /**
   * Summarize text content
   */
  async summarize(
    text: string,
    options: {
      apiKey?: string;
      model?: OpenRouterModelId;
      maxLength?: number;
    } = {}
  ): Promise<string> {
    const { apiKey, model, maxLength = 200 } = options;

    const response = await this.chat(
      [
        {
          role: 'user',
          content: `Résume ce texte en ${maxLength} mots maximum:\n\n${text}`,
        },
      ],
      {
        apiKey,
        model,
        systemPrompt:
          'Tu es un assistant qui résume des textes de manière concise et précise. Réponds uniquement avec le résumé, sans introduction.',
      }
    );

    return response.content;
  },

  /**
   * Validate an API key (optional for free models)
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Test with a minimal request
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      if (response.ok) {
        return { valid: true };
      }

      const error = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: error.error?.message || `Erreur ${response.status}`,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  },

  /**
   * Test connection without API key (using free model)
   */
  async testFreeConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      if (response.ok) {
        return { success: true };
      }

      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error?.message || `Erreur ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  },

  /**
   * Get available models
   */
  getAvailableModels() {
    return OPENROUTER_MODELS;
  },

  /**
   * Get free models only
   */
  getFreeModels() {
    return OPENROUTER_FREE_MODELS;
  },
};
