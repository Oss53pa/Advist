/**
 * Claude AI Service
 *
 * Routes all AI requests through the Supabase Edge Function `ai-proxy`
 * to keep API keys server-side. No secrets in frontend code.
 */
import { invokeEdgeFunction } from '../lib/supabase';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  id: string;
  content: string;
  model: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface DocumentAnalysisResult {
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

export const claudeService = {
  /**
   * Send a chat message and get a response via Edge Function proxy
   */
  async chat(
    messages: ClaudeMessage[],
    systemPrompt?: string,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<ClaudeResponse> {
    const data = await invokeEdgeFunction<Record<string, any>>('ai-proxy', {
      provider: 'anthropic',
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 4096,
      system: systemPrompt || SYSTEM_PROMPTS.assistant,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return {
      id: data.id || '',
      content: data.content?.[0]?.text || '',
      model: data.model || '',
      stopReason: data.stop_reason || '',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
    };
  },

  /**
   * Analyze a document and return structured analysis
   */
  async analyzeDocument(
    documentContent: string,
    documentType?: string
  ): Promise<DocumentAnalysisResult> {
    const userMessage = documentType
      ? `Analyse ce document de type "${documentType}":\n\n${documentContent}`
      : `Analyse ce document:\n\n${documentContent}`;

    const data = await invokeEdgeFunction<Record<string, any>>('ai-proxy', {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPTS.documentAnalysis,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = data.content?.[0]?.text || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
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
  async summarize(text: string, maxLength: number = 200): Promise<string> {
    const response = await this.chat(
      [
        {
          role: 'user',
          content: `Résume ce texte en ${maxLength} mots maximum:\n\n${text}`,
        },
      ],
      'Tu es un assistant qui résume des textes de manière concise et précise. Réponds uniquement avec le résumé, sans introduction.'
    );

    return response.content;
  },

  /**
   * Get available models
   */
  getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku', description: 'Rapide et économique' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', description: 'Équilibré (Recommandé)' },
      { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus', description: 'Plus puissant' },
    ];
  },
};
