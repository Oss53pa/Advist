import React, { useState, useEffect } from 'react';
import {
  Languages,
  ChevronDown,
  ChevronUp,
  _RefreshCw,
  Check,
  Copy,
  ArrowRight,
  Loader2,
  Globe,
  FileText,
  MessageSquare,
  Sparkles,
  Volume2,
  Download,
} from 'lucide-react';
import {
  translationService,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../services/translation';

interface TranslatedContent {
  title: string;
  content: string;
  summary?: string;
  annotations?: { id: string; original: string; translated: string }[];
}

interface DocumentTranslatorProps {
  documentId: string;
  documentTitle: string;
  documentContent?: string;
  documentSummary?: string;
  annotations?: { id: string; content: string }[];
  onTranslationComplete?: (
    translation: TranslatedContent,
    targetLanguage: SupportedLanguage
  ) => void;
}

export const DocumentTranslator: React.FC<DocumentTranslatorProps> = ({
  documentId,
  documentTitle,
  documentContent = '',
  documentSummary,
  annotations = [],
  onTranslationComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>('fr');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-detect source language on mount
  useEffect(() => {
    if (documentContent || documentTitle) {
      detectLanguage();
    }
  }, [documentTitle]);

  const detectLanguage = async () => {
    setIsDetecting(true);
    try {
      const detected = await translationService.detectLanguage(
        `${documentTitle} ${documentContent}`
      );
      setSourceLanguage(detected);
      // Set target to a different language
      if (detected === 'fr') {
        setTargetLanguage('en');
      } else {
        setTargetLanguage('fr');
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTranslate = async () => {
    if (sourceLanguage === targetLanguage) return;

    setIsTranslating(true);
    try {
      // Translate document content
      const docTranslation = await translationService.translateDocument(
        documentId,
        {
          title: documentTitle,
          body: documentContent,
          summary: documentSummary,
        },
        targetLanguage,
        sourceLanguage
      );

      // Translate annotations
      const translatedAnnotations = await Promise.all(
        annotations.map(async (annotation) => {
          const result = await translationService.translateAnnotation(
            annotation.id,
            annotation.content,
            targetLanguage,
            sourceLanguage
          );
          return {
            id: annotation.id,
            original: annotation.content,
            translated: result.text,
          };
        })
      );

      const result: TranslatedContent = {
        title: docTranslation.title,
        content: docTranslation.content,
        summary: docTranslation.summary,
        annotations: translatedAnnotations,
      };

      setTranslatedContent(result);
      // TODO: Get confidence score from translation API response
      setConfidence(90);
      onTranslationComplete?.(result, targetLanguage);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    setTranslatedContent(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getLanguageInfo = (code: SupportedLanguage) => {
    return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  };

  const LanguageSelector = ({
    value,
    onChange,
    isOpen,
    setIsOpen,
    label,
  }: {
    value: SupportedLanguage;
    onChange: (lang: SupportedLanguage) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    label: string;
  }) => {
    const selectedLang = getLanguageInfo(value);

    return (
      <div className="relative flex-1">
        <label className="block text-xs text-advist-text-secondary dark:text-advist-text-muted mb-1">
          {label}
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-advist-surface-dark dark:bg-advist-dark border border-advist-border dark:border-primary-600 rounded-lg hover:bg-advist-surface-dark dark:hover:bg-advist-surface-dark transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedLang?.flag}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-advist-gray900 dark:text-white">
                {selectedLang?.nativeName}
              </p>
              <p className="text-xs text-advist-text-secondary dark:text-advist-text-muted">
                {selectedLang?.region}
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-advist-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-advist-dark border border-advist-border dark:border-primary-700 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onChange(lang.code);
                    setIsOpen(false);
                    setTranslatedContent(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-advist-surface-dark dark:hover:bg-advist-dark transition-colors ${
                    value === lang.code ? 'bg-advist-gold-light dark:bg-advist-dark/20' : ''
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-advist-gray900 dark:text-white">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-advist-text-secondary dark:text-advist-text-muted">
                      {lang.name} - {lang.region}
                    </p>
                  </div>
                  {value === lang.code && <Check size={16} className="text-advist-gray900" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-advist-dark rounded-xl border border-advist-border dark:border-primary-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-advist-surface-dark dark:hover:bg-advist-dark/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-900 to-primary-900 flex items-center justify-center">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-advist-gray900 dark:text-white">
              Traduction Automatique
            </h3>
            <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
              FR, EN, Bambara, Wolof et plus
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-advist-text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-advist-text-muted" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-advist-border dark:border-primary-700">
          {/* Language Selectors */}
          <div className="mt-4 flex items-end gap-2">
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              isOpen={showSourceSelector}
              setIsOpen={setShowSourceSelector}
              label="Langue source"
            />

            <button
              onClick={swapLanguages}
              className="p-2.5 mb-0.5 bg-advist-surface-dark dark:bg-advist-dark rounded-lg hover:bg-advist-border dark:hover:bg-advist-surface-dark transition-colors"
              title="Inverser les langues"
            >
              <ArrowRight
                size={18}
                className="text-advist-text-secondary dark:text-advist-text-muted"
              />
            </button>

            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
              isOpen={showTargetSelector}
              setIsOpen={setShowTargetSelector}
              label="Langue cible"
            />
          </div>

          {/* Auto-detect indicator */}
          {isDetecting && (
            <div className="mt-3 flex items-center gap-2 text-sm text-advist-gray900 dark:text-advist-gold">
              <Loader2 size={14} className="animate-spin" />
              Détection automatique de la langue...
            </div>
          )}

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || sourceLanguage === targetLanguage}
            className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              isTranslating || sourceLanguage === targetLanguage
                ? 'bg-advist-surface-dark dark:bg-advist-dark text-advist-text-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-900 to-primary-900 text-white hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isTranslating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Traduction en cours...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Traduire le document
              </>
            )}
          </button>

          {/* Translation Results */}
          {translatedContent && (
            <div className="mt-4 space-y-4">
              {/* Confidence Score */}
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-50/20 rounded-lg border border-advist-success dark:border-advist-success">
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-advist-success dark:text-advist-success" />
                  <span className="text-sm font-medium text-advist-success dark:text-advist-success">
                    Traduction terminée
                  </span>
                </div>
                <span className="text-sm text-advist-success dark:text-advist-success">
                  Confiance: {confidence.toFixed(0)}%
                </span>
              </div>

              {/* Translated Title */}
              <div className="p-3 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-advist-text-secondary dark:text-advist-text-muted">
                    <FileText size={14} />
                    Titre traduit
                  </div>
                  <button
                    onClick={() => copyToClipboard(translatedContent.title, 'title')}
                    className="p-1 hover:bg-advist-border dark:hover:bg-advist-surface-dark rounded"
                  >
                    {copiedField === 'title' ? (
                      <Check size={14} className="text-advist-success" />
                    ) : (
                      <Copy size={14} className="text-advist-text-muted" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-medium text-advist-gray900 dark:text-white">
                  {translatedContent.title}
                </p>
              </div>

              {/* Translated Summary */}
              {translatedContent.summary && (
                <div className="p-3 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-advist-text-secondary dark:text-advist-text-muted">
                      <FileText size={14} />
                      Résumé traduit
                    </div>
                    <button
                      onClick={() => copyToClipboard(translatedContent.summary!, 'summary')}
                      className="p-1 hover:bg-advist-border dark:hover:bg-advist-surface-dark rounded"
                    >
                      {copiedField === 'summary' ? (
                        <Check size={14} className="text-advist-success" />
                      ) : (
                        <Copy size={14} className="text-advist-text-muted" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-advist-gray900 dark:text-advist-text-muted">
                    {translatedContent.summary}
                  </p>
                </div>
              )}

              {/* Translated Annotations */}
              {translatedContent.annotations && translatedContent.annotations.length > 0 && (
                <div className="p-3 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-advist-text-secondary dark:text-advist-text-muted mb-3">
                    <MessageSquare size={14} />
                    Annotations traduites ({translatedContent.annotations.length})
                  </div>
                  <div className="space-y-2">
                    {translatedContent.annotations.map((annotation, idx) => (
                      <div
                        key={annotation.id}
                        className="p-2 bg-white dark:bg-advist-dark rounded border border-advist-border dark:border-primary-600"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-advist-text-muted">#{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-advist-text-muted line-through">
                              {annotation.original}
                            </p>
                            <p className="text-sm text-advist-gray900 dark:text-white">
                              {annotation.translated}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Generate and download translation as text file
                    const content = `${translatedContent.title}\n\n${translatedContent.summary || ''}\n\n${translatedContent.content}`;
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `translation_${targetLanguage}_${documentId}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-advist-surface-dark dark:bg-advist-dark text-advist-gray900 dark:text-advist-text-muted rounded-lg hover:bg-advist-border dark:hover:bg-advist-surface-dark transition-colors text-sm"
                >
                  <Download size={16} />
                  Télécharger
                </button>
                <button
                  onClick={() => {
                    // Use browser's speech synthesis API
                    const utterance = new SpeechSynthesisUtterance(
                      `${translatedContent.title}. ${translatedContent.summary || ''}`
                    );
                    utterance.lang =
                      targetLanguage === 'fr'
                        ? 'fr-FR'
                        : targetLanguage === 'en'
                          ? 'en-US'
                          : targetLanguage;
                    window.speechSynthesis.cancel(); // Stop any ongoing speech
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-advist-surface-dark dark:bg-advist-dark text-advist-gray900 dark:text-advist-text-muted rounded-lg hover:bg-advist-border dark:hover:bg-advist-surface-dark transition-colors text-sm"
                >
                  <Volume2 size={16} />
                  Écouter
                </button>
              </div>
            </div>
          )}

          {/* Supported Languages Info */}
          <div className="mt-4 p-3 bg-advist-gold-light dark:bg-advist-dark/20 rounded-lg border border-advist-gold dark:border-advist-dark">
            <div className="flex items-start gap-2">
              <Globe size={16} className="text-advist-gray900 dark:text-advist-gold mt-0.5" />
              <div>
                <p className="text-sm font-medium text-advist-gray900 dark:text-advist-text-secondary">
                  Langues supportées
                </p>
                <p className="text-xs text-advist-gray900 dark:text-advist-gold mt-1">
                  Français, English, Bambara (Mali), Wolof (Sénégal), Dioula (Côte d'Ivoire),
                  Lingala (RDC)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTranslator;
