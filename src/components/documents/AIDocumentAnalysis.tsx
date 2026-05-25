import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Brain,
  Shield,
  ListChecks,
  Info,
  AlertCircle,
  FileWarning,
  Calendar,
  Users,
  Euro,
  MapPin,
  _Loader2,
  Settings,
  Cloud,
} from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { aiService, DocumentAnalysisResult } from '../../services/ai';
import { isProph3tConfigured } from '../../lib/proph3t';
import { useTenantStore } from '../../stores/tenantStore';

// Types
interface DocumentSummary {
  type: string;
  description: string;
  keyPoints: {
    icon: React.ElementType;
    label: string;
    value: string;
  }[];
}

interface AttentionPoint {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  clause?: string;
  page?: number;
}

interface ValidationItem {
  id: string;
  label: string;
  status: 'valid' | 'invalid' | 'pending' | 'warning';
  details?: string;
  page?: number;
}

interface AIAnalysis {
  summary: DocumentSummary;
  attentionPoints: AttentionPoint[];
  validationChecklist: ValidationItem[];
  confidence: number;
  analyzedAt: Date;
}

interface AIDocumentAnalysisProps {
  documentId: string;
  documentType?: string;
  documentTitle?: string;
  documentContent?: string; // Actual document content for real AI analysis
  onAnalysisComplete?: (analysis: AIAnalysis) => void;
}

// Icon mapping for dynamic key points from AI
const getIconForLabel = (label: string): React.ElementType => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('locat') || lowerLabel.includes('adresse') || lowerLabel.includes('lieu'))
    return MapPin;
  if (
    lowerLabel.includes('montant') ||
    lowerLabel.includes('prix') ||
    lowerLabel.includes('loyer') ||
    lowerLabel.includes('euro') ||
    lowerLabel.includes('fcfa')
  )
    return Euro;
  if (
    lowerLabel.includes('date') ||
    lowerLabel.includes('durée') ||
    lowerLabel.includes('échéance') ||
    lowerLabel.includes('période')
  )
    return Calendar;
  if (
    lowerLabel.includes('partie') ||
    lowerLabel.includes('fournisseur') ||
    lowerLabel.includes('client') ||
    lowerLabel.includes('prestataire')
  )
    return Users;
  return FileText;
};

// Convert Claude API response to internal format
const convertClaudeAnalysis = (result: DocumentAnalysisResult): AIAnalysis => {
  return {
    summary: {
      type: result.summary.type,
      description: result.summary.description,
      keyPoints: result.summary.keyPoints.map((kp) => ({
        icon: getIconForLabel(kp.label),
        label: kp.label,
        value: kp.value,
      })),
    },
    attentionPoints: result.attentionPoints.map((ap, idx) => ({
      id: String(idx + 1),
      severity: ap.severity,
      title: ap.title,
      description: ap.description,
      clause: ap.clause,
      page: ap.page,
    })),
    validationChecklist: result.validationChecklist.map((vc, idx) => ({
      id: String(idx + 1),
      label: vc.label,
      status: vc.status,
      details: vc.details,
    })),
    confidence: Math.round(result.confidence * 100),
    analyzedAt: new Date(),
  };
};

// Mock AI analysis function (fallback when Claude is not configured)
const getMockAnalysis = async (documentType?: string): Promise<AIAnalysis> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock analysis based on document type
  const analyses: Record<string, AIAnalysis> = {
    contract: {
      summary: {
        type: 'Contrat de Location Commerciale',
        description:
          'Ce contrat porte sur la location de bureaux de 200m² situés à Abidjan Plateau, Zone commerciale des Deux-Plateaux. Le loyer mensuel est fixé à 500 000 FCFA avec une caution de 3 mois. La durée du bail est de 3 ans renouvelable, avec échéance au 31/12/2027.',
        keyPoints: [
          { icon: MapPin, label: 'Localisation', value: 'Abidjan Plateau, Deux-Plateaux' },
          { icon: Euro, label: 'Loyer mensuel', value: '500 000 FCFA' },
          { icon: Calendar, label: 'Durée', value: "3 ans (jusqu'au 31/12/2027)" },
          { icon: Users, label: 'Parties', value: 'SARL TECHNO CI / SCI IMMO PLUS' },
        ],
      },
      attentionPoints: [
        {
          id: '1',
          severity: 'critical',
          title: 'Clause résolutoire stricte',
          description:
            "En cas d'impayé supérieur à 1 mois, le bailleur peut résilier le contrat sans préavis ni indemnité.",
          clause: 'Article 8.2',
          page: 4,
        },
        {
          id: '2',
          severity: 'warning',
          title: 'Révision annuelle du loyer',
          description:
            "Le loyer sera révisé chaque année selon l'indice ICC avec un plafond de +5%.",
          clause: 'Article 5.3',
          page: 3,
        },
        {
          id: '3',
          severity: 'info',
          title: 'Charges récupérables',
          description:
            "Les charges comprennent l'entretien des parties communes, la sécurité et le gardiennage.",
          clause: 'Article 6',
          page: 3,
        },
      ],
      validationChecklist: [
        {
          id: '1',
          label: 'Identité du bailleur vérifiée',
          status: 'valid',
          details: 'SCI IMMO PLUS - RCCM CI-ABJ-2020-B-12345',
        },
        {
          id: '2',
          label: 'Identité du preneur vérifiée',
          status: 'valid',
          details: 'SARL TECHNO CI - RCCM CI-ABJ-2019-B-54321',
        },
        {
          id: '3',
          label: 'Signature du bailleur',
          status: 'invalid',
          details: 'Signature manquante',
          page: 8,
        },
        { id: '4', label: 'Signature du preneur', status: 'valid', page: 8 },
        {
          id: '5',
          label: 'Paraphe de toutes les pages',
          status: 'warning',
          details: 'Pages 3 et 5 non paraphées',
          page: 3,
        },
        { id: '6', label: 'Annexe 1 - État des lieux', status: 'valid' },
        {
          id: '7',
          label: 'Annexe 2 - Diagnostics techniques',
          status: 'invalid',
          details: 'Document manquant',
        },
        { id: '8', label: 'Annexe 3 - Plan des locaux', status: 'valid' },
        {
          id: '9',
          label: 'Conformité OHADA',
          status: 'valid',
          details: "Conforme aux dispositions de l'Acte Uniforme",
        },
        {
          id: '10',
          label: 'Clause de juridiction',
          status: 'pending',
          details: 'À vérifier par le service juridique',
        },
      ],
      confidence: 94,
      analyzedAt: new Date(),
    },
    invoice: {
      summary: {
        type: 'Facture Commerciale',
        description:
          'Facture pour la fourniture de matériel informatique comprenant 10 ordinateurs portables et accessoires. Montant HT de 4 500 000 FCFA, TVA 18% incluse. Conditions de paiement à 30 jours.',
        keyPoints: [
          { icon: FileText, label: 'N° Facture', value: 'FAC-2024-00123' },
          { icon: Euro, label: 'Montant TTC', value: '5 310 000 FCFA' },
          { icon: Calendar, label: 'Échéance', value: '15/01/2025' },
          { icon: Users, label: 'Fournisseur', value: 'TECH SUPPLIES SARL' },
        ],
      },
      attentionPoints: [
        {
          id: '1',
          severity: 'warning',
          title: 'Échéance proche',
          description: "La date d'échéance de paiement est dans moins de 15 jours.",
          page: 1,
        },
        {
          id: '2',
          severity: 'info',
          title: 'Remise commerciale appliquée',
          description: 'Une remise de 5% a été appliquée sur le montant total.',
          page: 1,
        },
      ],
      validationChecklist: [
        { id: '1', label: 'Numéro de facture présent', status: 'valid' },
        { id: '2', label: 'Mentions légales complètes', status: 'valid' },
        { id: '3', label: 'Calcul TVA correct', status: 'valid' },
        {
          id: '4',
          label: 'Bon de commande référencé',
          status: 'warning',
          details: 'Référence à vérifier',
        },
        { id: '5', label: 'Signature fournisseur', status: 'valid' },
      ],
      confidence: 98,
      analyzedAt: new Date(),
    },
    default: {
      summary: {
        type: 'Document',
        description:
          "Document en cours d'analyse. Les informations détaillées seront disponibles après traitement complet par notre système d'intelligence artificielle.",
        keyPoints: [
          { icon: FileText, label: 'Type', value: 'À déterminer' },
          { icon: Calendar, label: 'Date', value: new Date().toLocaleDateString('fr-FR') },
        ],
      },
      attentionPoints: [],
      validationChecklist: [{ id: '1', label: 'Analyse en cours', status: 'pending' }],
      confidence: 0,
      analyzedAt: new Date(),
    },
  };

  // Return appropriate analysis based on document type
  const analysisType = documentType?.toLowerCase().includes('contrat')
    ? 'contract'
    : documentType?.toLowerCase().includes('facture')
      ? 'invoice'
      : 'contract'; // Default to contract for demo

  return analyses[analysisType] || analyses.default;
};

export const AIDocumentAnalysis: React.FC<AIDocumentAnalysisProps> = ({
  documentId,
  documentType,
  _documentTitle,
  documentContent,
  onAnalysisComplete,
}) => {
  const { config, isReady } = useAIStore();
  const tenantId = useTenantStore((s) => s.currentTenant?.id);
  const societyId = tenantId !== undefined ? String(tenantId) : undefined;
  const coreAvailable = isProph3tConfigured();
  const [useCore, setUseCore] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingRealAI, setIsUsingRealAI] = useState(false);
  const [usedCore, setUsedCore] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    attention: true,
    checklist: true,
  });

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Voie « Atlas core » (Mode B, confidentiel) : prioritaire si activée.
      const canUseCore = useCore && coreAvailable && !!documentContent;
      // Voie locale (Claude/OpenRouter via ai-proxy), inchangée.
      const canUseRealAI =
        isReady() && config.features.documentAnalysisEnabled && !!documentContent;
      setIsUsingRealAI(canUseCore || canUseRealAI);
      setUsedCore(canUseCore);

      let result: AIAnalysis;

      if (canUseCore && documentContent) {
        // Document = donnée confidentielle → le core ne sollicite que des
        // providers sans rétention (Ollama/Claude). Jamais un tier gratuit.
        const aiResult = await aiService.analyzeDocument(documentContent, documentType, {
          useCore: true,
          societyId,
        });
        result = convertClaudeAnalysis(aiResult);
      } else if (canUseRealAI && documentContent) {
        // Use real AI API (Claude or OpenRouter)
        const aiResult = await aiService.analyzeDocument(documentContent, documentType);
        result = convertClaudeAnalysis(aiResult);
      } else {
        // Fall back to mock data
        result = await getMockAnalysis(documentType);
      }

      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse du document");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, documentType, documentContent, useCore]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getSeverityStyles = (severity: AttentionPoint['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-advist-gold-light dark:bg-advist-dark/20',
          border: 'border-advist-gold dark:border-advist-gold',
          icon: 'text-advist-error dark:text-advist-gold',
          badge:
            'bg-advist-gold-light text-advist-error dark:bg-advist-dark dark:text-advist-gold-light',
        };
      case 'warning':
        return {
          bg: 'bg-advist-gold-light dark:bg-advist-gold-dark/20',
          border: 'border-advist-gold dark:border-advist-gold',
          icon: 'text-advist-gold-dark dark:text-advist-gold',
          badge:
            'bg-advist-gold-light text-advist-gold-dark dark:bg-advist-gold-dark dark:text-advist-gold-light',
        };
      case 'info':
        return {
          bg: 'bg-advist-gold-light dark:bg-advist-dark/20',
          border: 'border-advist-gold dark:border-advist-dark',
          icon: 'text-advist-gray900 dark:text-advist-gold',
          badge:
            'bg-advist-gold-light text-advist-gray900 dark:bg-advist-dark dark:text-advist-text-secondary',
        };
    }
  };

  const getStatusStyles = (status: ValidationItem['status']) => {
    switch (status) {
      case 'valid':
        return { icon: CheckCircle2, color: 'text-advist-success dark:text-advist-success' };
      case 'invalid':
        return { icon: XCircle, color: 'text-advist-error dark:text-advist-gold' };
      case 'warning':
        return { icon: AlertCircle, color: 'text-advist-gold-dark dark:text-advist-gold' };
      case 'pending':
        return { icon: Clock, color: 'text-advist-text-muted dark:text-advist-text-secondary' };
    }
  };

  const getValidationStats = () => {
    if (!analysis) return { valid: 0, invalid: 0, warning: 0, pending: 0, total: 0 };
    const items = analysis.validationChecklist;
    return {
      valid: items.filter((i) => i.status === 'valid').length,
      invalid: items.filter((i) => i.status === 'invalid').length,
      warning: items.filter((i) => i.status === 'warning').length,
      pending: items.filter((i) => i.status === 'pending').length,
      total: items.length,
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-advist-dark rounded-xl border border-advist-border dark:border-primary-700 p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-900 to-primary-900 opacity-20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-900 to-primary-900 flex items-center justify-center relative">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-advist-gray900 dark:text-advist-text-muted">
            Analyse Proph3t en cours...
          </p>
          <p className="text-xs text-advist-text-secondary dark:text-advist-text-muted mt-1">
            Extraction des informations clés
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-advist-dark rounded-xl border border-advist-gold dark:border-advist-gold p-6">
        <div className="flex items-center gap-3 text-advist-error dark:text-advist-gold">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadAnalysis}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-advist-gold-light dark:bg-advist-dark/20 text-advist-error dark:text-advist-gold rounded-lg hover:bg-advist-gold-light dark:hover:bg-advist-dark/40 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const stats = getValidationStats();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  Analyse <span style={{ fontFamily: "'Grand Hotel', cursive" }}>Proph3t</span>
                </h3>
                {usedCore ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                    <Cloud className="w-3 h-3" /> Atlas core · confidentiel
                  </span>
                ) : !isUsingRealAI ? (
                  <span className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                    Démo
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-white/80">
                Confiance: {analysis.confidence}% • Analysé{' '}
                {analysis.analyzedAt.toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {coreAvailable && (
              <button
                onClick={() => setUseCore((v) => !v)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                  useCore ? 'bg-white text-primary-900' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Analyser via le Proph3t core Atlas Studio (confidentiel, sans rétention)"
              >
                <Cloud className="w-4 h-4" />
                {useCore ? 'Core' : 'Local'}
              </button>
            )}
            <button
              onClick={loadAnalysis}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Relancer l'analyse"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hint to configure AI */}
        {!isUsingRealAI && (
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
            <p className="text-sm text-white/70">
              Activez l'IA pour une analyse reelle de vos documents
            </p>
            <a
              href="/settings"
              className="flex items-center gap-1 text-sm font-medium text-white hover:underline"
            >
              <Settings className="w-4 h-4" />
              Configurer
            </a>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-white dark:bg-advist-dark rounded-xl border border-advist-border dark:border-primary-700 overflow-hidden">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between p-4 hover:bg-advist-surface-dark dark:hover:bg-advist-dark/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-advist-surface-dark dark:bg-advist-dark/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-advist-gray900 dark:text-advist-text-secondary" />
            </div>
            <span className="font-medium text-advist-gray900 dark:text-white">
              Résumé de <span style={{ fontFamily: "'Grand Hotel', cursive" }}>Proph3t</span>
            </span>
          </div>
          {expandedSections.summary ? (
            <ChevronUp className="w-5 h-5 text-advist-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-advist-text-muted" />
          )}
        </button>

        {expandedSections.summary && (
          <div className="px-4 pb-4 border-t border-advist-border dark:border-primary-700">
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-advist-surface-dark text-advist-gray900 dark:bg-advist-dark/30 dark:text-advist-gray900">
                {analysis.summary.type}
              </span>
              <p className="mt-3 text-sm text-advist-gray900 dark:text-advist-text-muted leading-relaxed">
                {analysis.summary.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {analysis.summary.keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-advist-surface-dark dark:bg-advist-dark/50"
                  >
                    <point.icon className="w-4 h-4 text-advist-text-secondary dark:text-advist-text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-advist-text-secondary dark:text-advist-text-muted">
                        {point.label}
                      </p>
                      <p className="text-sm font-medium text-advist-gray900 dark:text-white truncate">
                        {point.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attention Points Section */}
      <div className="bg-white dark:bg-advist-dark rounded-xl border border-advist-border dark:border-primary-700 overflow-hidden">
        <button
          onClick={() => toggleSection('attention')}
          className="w-full flex items-center justify-between p-4 hover:bg-advist-surface-dark dark:hover:bg-advist-dark/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-advist-gold-light dark:bg-advist-gold-dark/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-advist-gold-dark dark:text-advist-gold" />
            </div>
            <span className="font-medium text-advist-gray900 dark:text-white">
              Points d'Attention
            </span>
            {analysis.attentionPoints.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-advist-gold-light text-advist-gold-dark dark:bg-advist-gold-dark/30 dark:text-advist-gold-light">
                {analysis.attentionPoints.length}
              </span>
            )}
          </div>
          {expandedSections.attention ? (
            <ChevronUp className="w-5 h-5 text-advist-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-advist-text-muted" />
          )}
        </button>

        {expandedSections.attention && (
          <div className="px-4 pb-4 border-t border-advist-border dark:border-primary-700">
            <div className="mt-4 space-y-3">
              {analysis.attentionPoints.length === 0 ? (
                <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted text-center py-4">
                  Aucun point d'attention détecté
                </p>
              ) : (
                analysis.attentionPoints.map((point) => {
                  const styles = getSeverityStyles(point.severity);
                  const SeverityIcon =
                    point.severity === 'critical'
                      ? AlertTriangle
                      : point.severity === 'warning'
                        ? FileWarning
                        : Info;

                  return (
                    <div
                      key={point.id}
                      className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <SeverityIcon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-advist-gray900 dark:text-white">
                              {point.title}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${styles.badge}`}
                            >
                              {point.severity === 'critical'
                                ? 'Critique'
                                : point.severity === 'warning'
                                  ? 'Attention'
                                  : 'Info'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-advist-text-secondary dark:text-advist-text-muted">
                            {point.description}
                          </p>
                          {(point.clause || point.page) && (
                            <div className="mt-2 flex items-center gap-3 text-xs text-advist-text-secondary dark:text-advist-text-muted">
                              {point.clause && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {point.clause}
                                </span>
                              )}
                              {point.page && <span>Page {point.page}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Checklist Section */}
      <div className="bg-white dark:bg-advist-dark rounded-xl border border-advist-border dark:border-primary-700 overflow-hidden">
        <button
          onClick={() => toggleSection('checklist')}
          className="w-full flex items-center justify-between p-4 hover:bg-advist-surface-dark dark:hover:bg-advist-dark/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-50/30 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-advist-success dark:text-advist-success" />
            </div>
            <span className="font-medium text-advist-gray900 dark:text-white">
              Checklist de Validation
            </span>
          </div>
          {expandedSections.checklist ? (
            <ChevronUp className="w-5 h-5 text-advist-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-advist-text-muted" />
          )}
        </button>

        {expandedSections.checklist && (
          <div className="px-4 pb-4 border-t border-advist-border dark:border-primary-700">
            {/* Stats Bar */}
            <div className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-advist-surface-dark dark:bg-advist-dark/50">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-advist-success" />
                <span className="text-sm font-medium text-advist-gray900 dark:text-advist-text-muted">
                  {stats.valid} valide{stats.valid > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-advist-error" />
                <span className="text-sm font-medium text-advist-gray900 dark:text-advist-text-muted">
                  {stats.invalid} manquant{stats.invalid > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-advist-gold-dark" />
                <span className="text-sm font-medium text-advist-gray900 dark:text-advist-text-muted">
                  {stats.warning} à vérifier
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="h-2 rounded-full bg-advist-border dark:bg-advist-dark overflow-hidden flex">
                <div
                  className="h-full bg-advist-success transition-all duration-500"
                  style={{ width: `${(stats.valid / stats.total) * 100}%` }}
                />
                <div
                  className="h-full bg-advist-gold transition-all duration-500"
                  style={{ width: `${(stats.warning / stats.total) * 100}%` }}
                />
                <div
                  className="h-full bg-advist-error transition-all duration-500"
                  style={{ width: `${(stats.invalid / stats.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="mt-4 space-y-2">
              {analysis.validationChecklist.map((item) => {
                const statusConfig = getStatusStyles(item.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                      item.status === 'invalid'
                        ? 'bg-advist-gold-light dark:bg-advist-dark/10'
                        : item.status === 'warning'
                          ? 'bg-advist-gold-light dark:bg-advist-gold-dark/10'
                          : 'hover:bg-advist-surface-dark dark:hover:bg-advist-dark/30'
                    }`}
                  >
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          item.status === 'invalid' || item.status === 'warning'
                            ? 'font-medium text-advist-gray900 dark:text-white'
                            : 'text-advist-gray900 dark:text-advist-text-muted'
                        }`}
                      >
                        {item.label}
                      </p>
                      {item.details && (
                        <p className="text-xs text-advist-text-secondary dark:text-advist-text-muted mt-0.5">
                          {item.details}
                          {item.page && ` • Page ${item.page}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDocumentAnalysis;
