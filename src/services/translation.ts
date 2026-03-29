/**
 * Document Translation Service
 * Supports: French, English, and African local languages (Bambara, Wolof, Dioula, Lingala)
 */

export type SupportedLanguage = 'fr' | 'en' | 'bm' | 'wo' | 'dyu' | 'ln';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'International' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'International' },
  { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan', flag: '🇲🇱', region: 'Mali, West Africa' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳', region: 'Senegal, Gambia' },
  { code: 'dyu', name: 'Dioula', nativeName: 'Julakan', flag: '🇨🇮', region: 'Côte d\'Ivoire, Burkina Faso' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩', region: 'DRC, Congo' },
];

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence: number;
  translatedAt: Date;
}

export interface DocumentTranslation {
  documentId: string;
  originalLanguage: SupportedLanguage;
  translations: {
    language: SupportedLanguage;
    title: string;
    content: string;
    summary?: string;
    translatedAt: Date;
  }[];
}

export interface AnnotationTranslation {
  annotationId: string;
  originalText: string;
  originalLanguage: SupportedLanguage;
  translations: {
    language: SupportedLanguage;
    text: string;
  }[];
}

// Common phrases dictionary for demo (would be API-based in production)
const TRANSLATION_DICTIONARY: Record<string, Record<SupportedLanguage, string>> = {
  // Legal terms
  'contrat': { fr: 'contrat', en: 'contract', bm: 'bɛnkan', wo: 'waafakaay', dyu: 'bɛnkan', ln: 'boyokani' },
  'signature': { fr: 'signature', en: 'signature', bm: 'tɔgɔda', wo: 'siiñ', dyu: 'tɔgɔda', ln: 'kombo' },
  'document': { fr: 'document', en: 'document', bm: 'sɛbɛn', wo: 'bataaxal', dyu: 'sɛbɛn', ln: 'mokanda' },
  'approuvé': { fr: 'approuvé', en: 'approved', bm: 'latigɛlen', wo: 'nangu na', dyu: 'sɔnna', ln: 'endimami' },
  'rejeté': { fr: 'rejeté', en: 'rejected', bm: 'banna', wo: 'baña', dyu: 'banna', ln: 'eboyami' },
  'en attente': { fr: 'en attente', en: 'pending', bm: 'a bɛ makɔnɔ', wo: 'di xaar', dyu: 'a bɛ kɔnɔ', ln: 'ezali kozela' },
  'urgent': { fr: 'urgent', en: 'urgent', bm: 'teliman', wo: 'bu gaaw', dyu: 'joona', ln: 'na mpasi' },
  'confidentiel': { fr: 'confidentiel', en: 'confidential', bm: 'gundo', wo: 'sutura', dyu: 'gundo', ln: 'ya kobombama' },

  // Document types
  'facture': { fr: 'facture', en: 'invoice', bm: 'jateminɛsɛbɛn', wo: 'faktiir', dyu: 'jatebɔsɛbɛn', ln: 'fakitire' },
  'rapport': { fr: 'rapport', en: 'report', bm: 'kunnafonisɛbɛn', wo: 'rapooru', dyu: 'kunnafonisɛbɛn', ln: 'raporo' },
  'bon de commande': { fr: 'bon de commande', en: 'purchase order', bm: 'sansɛbɛn', wo: 'komand', dyu: 'sansɛbɛn', ln: 'mokanda ya kosomba' },

  // Actions
  'signer': { fr: 'signer', en: 'sign', bm: 'tɔgɔda', wo: 'siiñ', dyu: 'tɔgɔda', ln: 'kotia kombo' },
  'valider': { fr: 'valider', en: 'validate', bm: 'latigɛ', wo: 'dëggu', dyu: 'sɔn', ln: 'kondima' },
  'télécharger': { fr: 'télécharger', en: 'download', bm: 'jigin', wo: 'wàccaat', dyu: 'jigin', ln: 'kokitisa' },

  // Common phrases
  'bonjour': { fr: 'bonjour', en: 'hello', bm: 'i ni ce', wo: 'nanga def', dyu: 'i ni ce', ln: 'mbote' },
  'merci': { fr: 'merci', en: 'thank you', bm: 'i ni ce', wo: 'jërëjëf', dyu: 'i ni ce', ln: 'matondo' },
  'veuillez': { fr: 'veuillez', en: 'please', bm: 'i ka', wo: 'buleen', dyu: 'i ka', ln: 'nabondela' },
};

// Notification templates in different languages
export const NOTIFICATION_TEMPLATES: Record<string, Record<SupportedLanguage, string>> = {
  'document_pending_signature': {
    fr: 'Le document "{title}" attend votre signature',
    en: 'Document "{title}" is awaiting your signature',
    bm: 'Sɛbɛn "{title}" bɛ i ka tɔgɔda makɔnɔ',
    wo: 'Bataaxal "{title}" di xaar sa siiñ',
    dyu: 'Sɛbɛn "{title}" bɛ i ka tɔgɔda kɔnɔ',
    ln: 'Mokanda "{title}" ezali kozela kombo na yo',
  },
  'document_approved': {
    fr: 'Le document "{title}" a été approuvé',
    en: 'Document "{title}" has been approved',
    bm: 'Sɛbɛn "{title}" latigɛlen don',
    wo: 'Bataaxal "{title}" nangu nañu ko',
    dyu: 'Sɛbɛn "{title}" sɔnna',
    ln: 'Mokanda "{title}" endimami',
  },
  'document_rejected': {
    fr: 'Le document "{title}" a été rejeté',
    en: 'Document "{title}" has been rejected',
    bm: 'Sɛbɛn "{title}" banna',
    wo: 'Bataaxal "{title}" baña nañu ko',
    dyu: 'Sɛbɛn "{title}" banna',
    ln: 'Mokanda "{title}" eboyami',
  },
  'workflow_step_assigned': {
    fr: 'Une nouvelle étape vous a été assignée pour "{title}"',
    en: 'A new step has been assigned to you for "{title}"',
    bm: 'Baara kura dira i ma "{title}" kan',
    wo: 'Jàpp bu bees nañu la def ci "{title}"',
    dyu: 'Baara kura dira i ma "{title}" kan',
    ln: 'Etape ya sika epesami na yo mpo na "{title}"',
  },
  'deadline_reminder': {
    fr: 'Rappel : Le document "{title}" expire dans {days} jours',
    en: 'Reminder: Document "{title}" expires in {days} days',
    bm: 'Hakili jigin: Sɛbɛn "{title}" bɛna ban tile {days} kɔnɔ',
    wo: 'Fàttali: Bataaxal "{title}" dina jeex ci {days} fan',
    dyu: 'Hakili jigin: Sɛbɛn "{title}" bɛna ban tile {days} kɔnɔ',
    ln: 'Kokanisa: Mokanda "{title}" ekosila na mikolo {days}',
  },
  'comment_added': {
    fr: '{user} a ajouté un commentaire sur "{title}"',
    en: '{user} added a comment on "{title}"',
    bm: '{user} ye kuma fara "{title}" kan',
    wo: '{user} def na ci wax ci "{title}"',
    dyu: '{user} ye kuma fara "{title}" kan',
    ln: '{user} abakisi makanisi na "{title}"',
  },
};

class TranslationService {
  private cache: Map<string, TranslationResult> = new Map();

  /**
   * Get language info by code
   */
  getLanguageInfo(code: SupportedLanguage): LanguageInfo | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  }

  /**
   * Detect language of text (simplified - would use ML in production)
   */
  async detectLanguage(text: string): Promise<SupportedLanguage> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simple heuristic detection
    const frenchIndicators = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'est', 'sont', 'dans', 'pour'];
    const englishIndicators = ['the', 'a', 'an', 'and', 'or', 'is', 'are', 'in', 'for', 'to', 'of'];

    const words = text.toLowerCase().split(/\s+/);

    let frenchScore = 0;
    let englishScore = 0;

    words.forEach(word => {
      if (frenchIndicators.includes(word)) frenchScore++;
      if (englishIndicators.includes(word)) englishScore++;
    });

    return englishScore > frenchScore ? 'en' : 'fr';
  }

  /**
   * Translate text from one language to another
   */
  async translateText(
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<TranslationResult> {
    // Check cache
    const cacheKey = `${text}_${sourceLanguage || 'auto'}_${targetLanguage}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Detect source language if not provided
    const detectedSource = sourceLanguage || await this.detectLanguage(text);

    // TODO: Replace with real translation API call via edge function
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple word-by-word translation for demo
    let translatedText = text;
    let confidence = 0.85;

    // Look up words in dictionary
    Object.entries(TRANSLATION_DICTIONARY).forEach(([key, translations]) => {
      const sourceWord = translations[detectedSource];
      const targetWord = translations[targetLanguage];

      if (sourceWord && targetWord) {
        const regex = new RegExp(`\\b${sourceWord}\\b`, 'gi');
        translatedText = translatedText.replace(regex, targetWord);
      }
    });

    // If source and target are the same, return original
    if (detectedSource === targetLanguage) {
      translatedText = text;
      confidence = 1;
    }

    // For demo: if translating to local languages, add a note
    if (['bm', 'wo', 'dyu', 'ln'].includes(targetLanguage) && translatedText === text) {
      // Simulate translation by adding language markers
      const langInfo = this.getLanguageInfo(targetLanguage);
      confidence = 0.75;
      // In production, this would be actual translation
    }

    const result: TranslationResult = {
      originalText: text,
      translatedText,
      sourceLanguage: detectedSource,
      targetLanguage,
      confidence,
      translatedAt: new Date(),
    };

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Translate document content
   */
  async translateDocument(
    documentId: string,
    content: {
      title: string;
      body: string;
      summary?: string;
    },
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<DocumentTranslation['translations'][0]> {
    const [titleResult, bodyResult, summaryResult] = await Promise.all([
      this.translateText(content.title, targetLanguage, sourceLanguage),
      this.translateText(content.body, targetLanguage, sourceLanguage),
      content.summary ? this.translateText(content.summary, targetLanguage, sourceLanguage) : null,
    ]);

    return {
      language: targetLanguage,
      title: titleResult.translatedText,
      content: bodyResult.translatedText,
      summary: summaryResult?.translatedText,
      translatedAt: new Date(),
    };
  }

  /**
   * Translate annotation
   */
  async translateAnnotation(
    annotationId: string,
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<AnnotationTranslation['translations'][0]> {
    const result = await this.translateText(text, targetLanguage, sourceLanguage);

    return {
      language: targetLanguage,
      text: result.translatedText,
    };
  }

  /**
   * Get notification in user's preferred language
   */
  getNotificationText(
    templateKey: string,
    language: SupportedLanguage,
    variables: Record<string, string> = {}
  ): string {
    const template = NOTIFICATION_TEMPLATES[templateKey]?.[language]
      || NOTIFICATION_TEMPLATES[templateKey]?.['fr']
      || templateKey;

    let text = template;
    Object.entries(variables).forEach(([key, value]) => {
      text = text.replace(`{${key}}`, value);
    });

    return text;
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    texts: string[],
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<TranslationResult[]> {
    return Promise.all(
      texts.map(text => this.translateText(text, targetLanguage, sourceLanguage))
    );
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const translationService = new TranslationService();
export default translationService;
