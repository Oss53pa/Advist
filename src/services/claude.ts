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
   * Stream a chat response token-by-token via Edge Function proxy
   * Uses SSE (Server-Sent Events) for real-time streaming
   */
  async chatStream(
    messages: ClaudeMessage[],
    onToken: (token: string) => void,
    onComplete?: (fullResponse: string) => void,
    systemPrompt?: string,
    options?: { model?: string; maxTokens?: number }
  ): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        provider: 'anthropic',
        model: options?.model || 'claude-sonnet-4-20250514',
        max_tokens: options?.maxTokens || 4096,
        stream: true,
        system: systemPrompt || SYSTEM_PROMPTS.assistant,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI streaming failed: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body for streaming');

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const token =
              parsed.delta?.text ||
              parsed.content?.[0]?.text ||
              parsed.choices?.[0]?.delta?.content ||
              '';
            if (token) {
              fullResponse += token;
              onToken(token);
            }
          } catch {
            // Non-JSON line or partial chunk — append as raw text
            if (data.trim() && data !== '[DONE]') {
              fullResponse += data;
              onToken(data);
            }
          }
        }
      }
    }

    onComplete?.(fullResponse);
  },

  /**
   * Chat with real application context (workflow, document, signatures)
   * PROPH3T-aware: injects live data from the current session
   */
  async chatWithContext(
    messages: ClaudeMessage[],
    context: {
      documentId?: string;
      workflowId?: string;
      organizationName?: string;
      currentPage?: string;
    },
    options?: { model?: string; stream?: boolean; onToken?: (token: string) => void }
  ): Promise<ClaudeResponse> {
    const { supabase } = await import('../lib/supabase');
    let contextBlock = '';

    // Inject live document data
    if (context.documentId) {
      const { data: doc } = await supabase
        .from('documents')
        .select('title, status, document_type, current_version, created_at')
        .eq('id', context.documentId)
        .single();
      if (doc) {
        contextBlock += `\n\nDocument actuel: "${doc.title}" (${doc.status}, v${doc.current_version}, cree le ${doc.created_at})`;
      }
    }

    // Inject live workflow data
    if (context.workflowId) {
      const { data: workflow } = await supabase
        .from('workflow_instances')
        .select('status, current_step, created_at, completed_at')
        .eq('id', context.workflowId)
        .single();
      if (workflow) {
        contextBlock += `\nCircuit: etape ${workflow.current_step}, statut ${workflow.status}`;
      }

      const { data: steps } = await supabase
        .from('workflow_steps')
        .select('step_number, name, status')
        .eq('instance_id', context.workflowId)
        .order('step_number');
      if (steps?.length) {
        contextBlock += `\nEtapes: ${steps.map((s: any) => `${s.step_number}. ${s.name} (${s.status})`).join(', ')}`;
      }
    }

    if (context.organizationName) {
      contextBlock += `\nOrganisation: ${context.organizationName}`;
    }
    if (context.currentPage) {
      contextBlock += `\nPage actuelle: ${context.currentPage}`;
    }

    const enrichedSystem =
      SYSTEM_PROMPTS.assistant + (contextBlock ? `\n\nCONTEXTE EN TEMPS REEL:${contextBlock}` : '');

    if (options?.stream && options?.onToken) {
      let finalResponse = '';
      await this.chatStream(
        messages,
        options.onToken,
        (full) => {
          finalResponse = full;
        },
        enrichedSystem,
        { model: options.model }
      );
      return {
        id: '',
        content: finalResponse,
        model: options.model || 'claude-sonnet-4-20250514',
        stopReason: 'end_turn',
        usage: { inputTokens: 0, outputTokens: 0 },
      };
    }

    return this.chat(messages, enrichedSystem, { model: options?.model });
  },

  /**
   * Get available models
   */
  getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
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
    ];
  },
};
