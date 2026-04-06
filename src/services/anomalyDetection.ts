/**
 * Anomaly Detection Service
 * Detects inconsistencies in documents: dates, amounts, signatures, etc.
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';
import { invokeRpc } from './supabase-crud';
import { invokeEdgeFunction } from '../lib/supabase';

export type AnomalySeverity = 'info' | 'warning' | 'error' | 'critical';
export type AnomalyCategory =
  | 'date'
  | 'amount'
  | 'signature'
  | 'metadata'
  | 'content'
  | 'compliance'
  | 'behavior'
  | 'security'
  | 'fraud';

// Security anomaly types
export type SecurityAnomalyType =
  | 'unusual_login_time'
  | 'unusual_location'
  | 'multiple_failed_logins'
  | 'brute_force'
  | 'impossible_travel'
  | 'new_device'
  | 'suspicious_ip'
  | 'bulk_operation'
  | 'data_exfiltration'
  | 'unusual_api_usage'
  | 'suspicious_validation'
  | 'unusual_validation_time'
  | 'unusual_validation_location'
  | 'rapid_approval'
  | 'bulk_approval'
  | 'pattern_deviation';

export interface Anomaly {
  id: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  title: string;
  description: string;
  field?: string;
  expectedValue?: string;
  actualValue?: string;
  suggestion?: string;
  documentId: number;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    id: number;
    name: string;
  };
  resolutionNote?: string;
}

export interface AnomalyRule {
  id: string;
  name: string;
  description: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  enabled: boolean;
  conditions: AnomalyCondition[];
}

export interface AnomalyCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'not_contains'
    | 'regex'
    | 'date_before'
    | 'date_after'
    | 'date_range';
  value: string | number | Date;
  value2?: string | number | Date; // For range conditions
}

export interface DocumentAnalysisResult {
  documentId: number;
  analyzedAt: string;
  anomalies: Anomaly[];
  score: number; // 0-100, 100 being no anomalies
  summary: {
    total: number;
    byCategory: Record<AnomalyCategory, number>;
    bySeverity: Record<AnomalySeverity, number>;
  };
}

// Pre-defined anomaly rules
export const DEFAULT_RULES: Omit<AnomalyRule, 'id'>[] = [
  // Date anomalies
  {
    name: 'Date dans le futur',
    description: 'La date du document est dans le futur',
    category: 'date',
    severity: 'warning',
    enabled: true,
    conditions: [{ field: 'document_date', operator: 'date_after', value: new Date() }],
  },
  {
    name: 'Date de signature antérieure',
    description: 'La date de signature est antérieure à la date du document',
    category: 'date',
    severity: 'error',
    enabled: true,
    conditions: [{ field: 'signature_date', operator: 'date_before', value: 'document_date' }],
  },
  {
    name: 'Document expiré',
    description: "Le document a dépassé sa date d'expiration",
    category: 'date',
    severity: 'critical',
    enabled: true,
    conditions: [{ field: 'expiration_date', operator: 'date_before', value: new Date() }],
  },
  {
    name: 'Durée de validité anormale',
    description: 'La durée de validité du document semble anormalement longue ou courte',
    category: 'date',
    severity: 'warning',
    enabled: true,
    conditions: [{ field: 'validity_days', operator: 'greater_than', value: 3650 }], // > 10 years
  },

  // Amount anomalies
  {
    name: 'Montant négatif',
    description: 'Un montant négatif a été détecté',
    category: 'amount',
    severity: 'error',
    enabled: true,
    conditions: [{ field: 'amount', operator: 'less_than', value: 0 }],
  },
  {
    name: 'Montant anormalement élevé',
    description: 'Le montant dépasse le seuil configuré',
    category: 'amount',
    severity: 'warning',
    enabled: true,
    conditions: [{ field: 'amount', operator: 'greater_than', value: 100000000 }], // 100M FCFA
  },
  {
    name: 'TVA incohérente',
    description: 'Le calcul de TVA ne correspond pas au taux standard',
    category: 'amount',
    severity: 'warning',
    enabled: true,
    conditions: [{ field: 'vat_rate', operator: 'not_equals', value: 18 }],
  },

  // Compliance anomalies
  {
    name: 'Mention OHADA manquante',
    description: 'Le document ne contient pas les mentions légales OHADA requises',
    category: 'compliance',
    severity: 'warning',
    enabled: true,
    conditions: [{ field: 'ohada_compliant', operator: 'equals', value: false }],
  },
  {
    name: 'Signature non conforme',
    description: "La signature électronique n'est pas conforme aux standards",
    category: 'signature',
    severity: 'error',
    enabled: true,
    conditions: [{ field: 'signature_valid', operator: 'equals', value: false }],
  },

  // Metadata anomalies
  {
    name: 'Métadonnées manquantes',
    description: 'Des champs obligatoires sont manquants',
    category: 'metadata',
    severity: 'warning',
    enabled: true,
    conditions: [{ field: 'required_fields_missing', operator: 'greater_than', value: 0 }],
  },
];

export const anomalyDetectionService = {
  /**
   * Analyze a document for anomalies
   */
  async analyzeDocument(documentId: number): Promise<DocumentAnalysisResult> {
    return invokeRpc<DocumentAnalysisResult>('analyze_document_anomalies', {
      p_document_id: documentId,
    });
  },

  /**
   * Get anomalies for a document
   */
  async getAnomalies(documentId: number): Promise<Anomaly[]> {
    const { data, error } = await supabase
      .from('anomalies')
      .select('*')
      .eq('document_id', documentId)
      .order('detected_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return data as unknown as Anomaly[];
  },

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(anomalyId: string, note?: string): Promise<Anomaly> {
    const { data, error } = await supabase
      .from('anomalies')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_note: note,
      })
      .eq('id', anomalyId)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as Anomaly;
  },

  /**
   * Dismiss an anomaly (mark as false positive)
   */
  async dismissAnomaly(anomalyId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('anomalies')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_note: reason,
        is_false_positive: true,
      })
      .eq('id', anomalyId);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get all active anomalies for the organization
   */
  async getAllAnomalies(filters?: {
    category?: AnomalyCategory;
    severity?: AnomalySeverity;
    resolved?: boolean;
    documentId?: number;
  }): Promise<Anomaly[]> {
    let query = supabase.from('anomalies').select('*').order('detected_at', { ascending: false });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.resolved !== undefined) query = query.eq('resolved', filters.resolved);
    if (filters?.documentId) query = query.eq('document_id', filters.documentId);

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return data as unknown as Anomaly[];
  },

  /**
   * Get anomaly detection rules
   */
  async getRules(): Promise<AnomalyRule[]> {
    const { data, error } = await supabase
      .from('anomaly_rules')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as unknown as AnomalyRule[];
  },

  /**
   * Update anomaly detection rules
   */
  async updateRule(ruleId: string, data: Partial<AnomalyRule>): Promise<AnomalyRule> {
    const { data: updated, error } = await supabase
      .from('anomaly_rules')
      .update(data as Record<string, unknown>)
      .eq('id', ruleId)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as unknown as AnomalyRule;
  },

  /**
   * Create custom anomaly rule
   */
  async createRule(data: Omit<AnomalyRule, 'id'>): Promise<AnomalyRule> {
    const { data: created, error } = await supabase
      .from('anomaly_rules')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as unknown as AnomalyRule;
  },

  /**
   * Delete custom anomaly rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase.from('anomaly_rules').delete().eq('id', ruleId);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get anomaly statistics
   */
  async getStats(): Promise<{
    total: number;
    unresolved: number;
    byCategory: Record<AnomalyCategory, number>;
    bySeverity: Record<AnomalySeverity, number>;
    trend: Array<{ date: string; count: number }>;
  }> {
    return invokeRpc<{
      total: number;
      unresolved: number;
      byCategory: Record<AnomalyCategory, number>;
      bySeverity: Record<AnomalySeverity, number>;
      trend: Array<{ date: string; count: number }>;
    }>('get_anomaly_stats');
  },

  /**
   * Client-side anomaly detection (for real-time validation)
   */
  detectAnomaliesLocally(documentData: Record<string, any>): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const now = new Date();

    // Date validations
    if (documentData.document_date) {
      const docDate = new Date(documentData.document_date);
      if (docDate > now) {
        anomalies.push({
          id: `local-${Date.now()}-1`,
          category: 'date',
          severity: 'warning',
          title: 'Date dans le futur',
          description: `La date du document (${docDate.toLocaleDateString('fr-FR')}) est dans le futur`,
          field: 'document_date',
          actualValue: docDate.toISOString(),
          suggestion: 'Vérifiez la date du document',
          documentId: documentData.id || 0,
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }
    }

    // Signature date validation
    if (documentData.signature_date && documentData.document_date) {
      const sigDate = new Date(documentData.signature_date);
      const docDate = new Date(documentData.document_date);
      if (sigDate < docDate) {
        anomalies.push({
          id: `local-${Date.now()}-2`,
          category: 'date',
          severity: 'error',
          title: 'Date de signature incohérente',
          description: 'La signature est datée avant la création du document',
          field: 'signature_date',
          expectedValue: `Après ${docDate.toLocaleDateString('fr-FR')}`,
          actualValue: sigDate.toLocaleDateString('fr-FR'),
          suggestion: 'La date de signature doit être postérieure à la date du document',
          documentId: documentData.id || 0,
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }
    }

    // Expiration validation
    if (documentData.expiration_date) {
      const expDate = new Date(documentData.expiration_date);
      if (expDate < now) {
        anomalies.push({
          id: `local-${Date.now()}-3`,
          category: 'date',
          severity: 'critical',
          title: 'Document expiré',
          description: `Le document a expiré le ${expDate.toLocaleDateString('fr-FR')}`,
          field: 'expiration_date',
          actualValue: expDate.toISOString(),
          suggestion: "Ce document n'est plus valide",
          documentId: documentData.id || 0,
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }
    }

    // Amount validations
    if (documentData.amount !== undefined) {
      const amount = parseFloat(documentData.amount);

      if (amount < 0) {
        anomalies.push({
          id: `local-${Date.now()}-4`,
          category: 'amount',
          severity: 'error',
          title: 'Montant négatif',
          description: 'Le montant ne peut pas être négatif',
          field: 'amount',
          actualValue: String(amount),
          suggestion: 'Vérifiez le montant saisi',
          documentId: documentData.id || 0,
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }

      if (amount > 100000000) {
        anomalies.push({
          id: `local-${Date.now()}-5`,
          category: 'amount',
          severity: 'warning',
          title: 'Montant élevé',
          description: `Le montant (${amount.toLocaleString('fr-FR')} FCFA) dépasse 100M FCFA`,
          field: 'amount',
          actualValue: String(amount),
          suggestion: 'Vérifiez que ce montant est correct',
          documentId: documentData.id || 0,
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }
    }

    // TVA validation
    if (documentData.amount && documentData.vat_amount) {
      const amount = parseFloat(documentData.amount);
      const vatAmount = parseFloat(documentData.vat_amount);
      const expectedVat = amount * 0.18; // 18% TVA in Côte d'Ivoire
      const tolerance = amount * 0.001; // 0.1% tolerance

      if (Math.abs(vatAmount - expectedVat) > tolerance) {
        anomalies.push({
          id: `local-${Date.now()}-6`,
          category: 'amount',
          severity: 'warning',
          title: 'TVA incohérente',
          description: 'Le montant de TVA ne correspond pas au taux de 18%',
          field: 'vat_amount',
          expectedValue: expectedVat.toFixed(2),
          actualValue: vatAmount.toFixed(2),
          suggestion: `TVA attendue: ${expectedVat.toLocaleString('fr-FR')} FCFA`,
          documentId: documentData.id || 0,
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }
    }

    // Total validation
    if (documentData.amount && documentData.vat_amount && documentData.total) {
      const amount = parseFloat(documentData.amount);
      const vatAmount = parseFloat(documentData.vat_amount);
      const total = parseFloat(documentData.total);
      const expectedTotal = amount + vatAmount;

      if (Math.abs(total - expectedTotal) > 1) {
        // 1 FCFA tolerance for rounding
        anomalies.push({
          id: `local-${Date.now()}-7`,
          category: 'amount',
          severity: 'error',
          title: 'Total incohérent',
          description: 'Le total ne correspond pas à la somme HT + TVA',
          field: 'total',
          expectedValue: expectedTotal.toFixed(2),
          actualValue: total.toFixed(2),
          suggestion: `Total attendu: ${expectedTotal.toLocaleString('fr-FR')} FCFA`,
          documentId: documentData.id || 0,
          detectedAt: now.toISOString(),
          resolved: false,
        });
      }
    }

    // Required fields validation
    const requiredFields = ['title', 'document_type', 'document_date'];
    const missingFields = requiredFields.filter((f) => !documentData[f]);

    if (missingFields.length > 0) {
      anomalies.push({
        id: `local-${Date.now()}-8`,
        category: 'metadata',
        severity: 'warning',
        title: 'Champs obligatoires manquants',
        description: `Les champs suivants sont manquants: ${missingFields.join(', ')}`,
        suggestion: 'Complétez tous les champs obligatoires',
        documentId: documentData.id || 0,
        detectedAt: now.toISOString(),
        resolved: false,
      });
    }

    return anomalies;
  },
};

// Helper functions
export function getSeverityColor(severity: AnomalySeverity): string {
  switch (severity) {
    case 'info':
      return 'blue';
    case 'warning':
      return 'orange';
    case 'error':
      return 'red';
    case 'critical':
      return 'purple';
    default:
      return 'gray';
  }
}

export function getCategoryLabel(category: AnomalyCategory): string {
  const labels: Record<AnomalyCategory, string> = {
    date: 'Date',
    amount: 'Montant',
    signature: 'Signature',
    metadata: 'Métadonnées',
    content: 'Contenu',
    compliance: 'Conformité',
    behavior: 'Comportement',
  };
  return labels[category];
}

export function getSeverityLabel(severity: AnomalySeverity): string {
  const labels: Record<AnomalySeverity, string> = {
    info: 'Information',
    warning: 'Avertissement',
    error: 'Erreur',
    critical: 'Critique',
  };
  return labels[severity];
}

export default anomalyDetectionService;

// ============================================================================
// Security Anomaly Detection Service
// ============================================================================

export interface SecurityAnomaly {
  id: string;
  anomalyType: SecurityAnomalyType;
  severity: AnomalySeverity;
  status: 'open' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved' | 'escalated';
  title: string;
  description: string;
  details: Record<string, unknown>;
  confidenceScore: number;
  userId?: string;
  userName?: string;
  documentId?: string;
  documentTitle?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  detectedAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  autoResponseTaken: boolean;
  autoResponseActions: string[];
  relatedEvents: SecurityEvent[];
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  riskLevel: AnomalySeverity;
  description: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  deviceFingerprint?: string;
  createdAt: string;
}

export interface SecurityAlert {
  id: string;
  anomalyId?: string;
  eventId?: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'webhook' | 'in_app';
  title: string;
  message: string;
  priority: AnomalySeverity;
  isSent: boolean;
  sentAt?: string;
  isRead: boolean;
  readAt?: string;
  requiresAction: boolean;
  actionTaken: boolean;
  createdAt: string;
}

export interface ForensicReport {
  id: string;
  title: string;
  reportType: 'incident' | 'fraud' | 'audit' | 'compliance' | 'investigation';
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'archived';
  summary: string;
  findings: ForensicFinding[];
  anomalyIds: string[];
  eventIds: string[];
  affectedUserIds: string[];
  affectedDocumentIds: string[];
  incidentStart?: string;
  incidentEnd?: string;
  timelineData: TimelineEntry[];
  recommendations: ForensicRecommendation[];
  impactAssessment: ImpactAssessment;
  attachments: ForensicAttachment[];
  createdBy: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  reviewedBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reviewedAt?: string;
  pdfReportUrl?: string;
}

export interface ForensicFinding {
  title: string;
  description: string;
  severity: AnomalySeverity;
  evidence: string[];
  affectedResources: string[];
  timeline: { timestamp: string; event: string }[];
}

export interface TimelineEntry {
  timestamp: string;
  event: string;
  severity: AnomalySeverity;
  details?: Record<string, unknown>;
}

export interface ForensicRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  implemented: boolean;
}

export interface ImpactAssessment {
  dataCompromised: boolean;
  usersAffectedCount: number;
  documentsAffectedCount: number;
  financialImpact: number;
  reputationRisk: 'low' | 'medium' | 'high';
  regulatoryImplications: string[];
}

export interface ForensicAttachment {
  name: string;
  url: string;
  type: 'log' | 'image' | 'document' | 'screenshot' | 'other';
}

export interface UserBehaviorProfile {
  userId: string;
  typicalHoursStart: number;
  typicalHoursEnd: number;
  typicalDays: number[];
  typicalCountries: string[];
  typicalCities: string[];
  avgValidationTimeSeconds: number;
  minValidationTimeSeconds: number;
  riskScore: number;
  isLearning: boolean;
  sampleSize: number;
}

// Security Anomaly Detection API Service
export const securityAnomalyService = {
  /**
   * Get all security anomalies
   */
  async getAnomalies(filters?: {
    status?: SecurityAnomaly['status'];
    severity?: AnomalySeverity;
    anomalyType?: SecurityAnomalyType;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SecurityAnomaly[]> {
    let query = supabase
      .from('security_anomalies')
      .select('*')
      .order('detected_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.anomalyType) query = query.eq('anomaly_type', filters.anomalyType);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.startDate) query = query.gte('detected_at', filters.startDate);
    if (filters?.endDate) query = query.lte('detected_at', filters.endDate);

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityAnomaly[];
  },

  /**
   * Get a single security anomaly
   */
  async getAnomaly(id: string): Promise<SecurityAnomaly> {
    const { data, error } = await supabase
      .from('security_anomalies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityAnomaly;
  },

  /**
   * Update anomaly status
   */
  async updateAnomalyStatus(
    id: string,
    status: SecurityAnomaly['status'],
    notes?: string
  ): Promise<SecurityAnomaly> {
    const { data, error } = await supabase
      .from('security_anomalies')
      .update({
        status,
        investigation_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityAnomaly;
  },

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(id: string, resolutionNotes: string): Promise<SecurityAnomaly> {
    const { data, error } = await supabase
      .from('security_anomalies')
      .update({
        status: 'resolved',
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityAnomaly;
  },

  /**
   * Mark anomaly as false positive
   */
  async markFalsePositive(id: string, reason: string): Promise<SecurityAnomaly> {
    const { data, error } = await supabase
      .from('security_anomalies')
      .update({
        status: 'false_positive',
        resolution_notes: reason,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityAnomaly;
  },

  /**
   * Escalate anomaly
   */
  async escalateAnomaly(
    id: string,
    assignToUserId: string,
    notes?: string
  ): Promise<SecurityAnomaly> {
    const { data, error } = await supabase
      .from('security_anomalies')
      .update({
        status: 'escalated',
        assigned_to: assignToUserId,
        escalation_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityAnomaly;
  },

  /**
   * Get security events
   */
  async getEvents(filters?: {
    eventType?: string;
    riskLevel?: AnomalySeverity;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SecurityEvent[]> {
    let query = supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.eventType) query = query.eq('event_type', filters.eventType);
    if (filters?.riskLevel) query = query.eq('risk_level', filters.riskLevel);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityEvent[];
  },

  /**
   * Get security alerts
   */
  async getAlerts(filters?: {
    channel?: SecurityAlert['channel'];
    priority?: AnomalySeverity;
    isRead?: boolean;
  }): Promise<SecurityAlert[]> {
    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.channel) query = query.eq('channel', filters.channel);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.isRead !== undefined) query = query.eq('is_read', filters.isRead);

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return data as unknown as SecurityAlert[];
  },

  /**
   * Mark alert as read
   */
  async markAlertRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('security_alerts')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get security statistics
   */
  async getStats(): Promise<{
    totalAnomalies: number;
    openAnomalies: number;
    resolvedAnomalies: number;
    bySeverity: Record<AnomalySeverity, number>;
    byType: Record<SecurityAnomalyType, number>;
    trend: { date: string; count: number }[];
    recentAlerts: SecurityAlert[];
  }> {
    return invokeRpc<{
      totalAnomalies: number;
      openAnomalies: number;
      resolvedAnomalies: number;
      bySeverity: Record<AnomalySeverity, number>;
      byType: Record<SecurityAnomalyType, number>;
      trend: { date: string; count: number }[];
      recentAlerts: SecurityAlert[];
    }>('get_security_stats');
  },

  /**
   * Get user behavior profile
   */
  async getUserProfile(userId: string): Promise<UserBehaviorProfile> {
    const { data, error } = await supabase
      .from('user_behavior_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as UserBehaviorProfile;
  },

  /**
   * Report a validation for anomaly detection
   */
  async reportValidation(data: {
    documentId: string;
    workflowStepId?: string;
    validationTimeSeconds: number;
    location?: {
      country?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  }): Promise<{
    isAnomaly: boolean;
    anomaly?: SecurityAnomaly;
    warnings: string[];
  }> {
    return invokeRpc<{
      isAnomaly: boolean;
      anomaly?: SecurityAnomaly;
      warnings: string[];
    }>('report_validation_event', {
      p_document_id: data.documentId,
      p_workflow_step_id: data.workflowStepId,
      p_validation_time_seconds: data.validationTimeSeconds,
      p_location: data.location,
    });
  },
};

// Forensic Reports API Service
export const forensicReportService = {
  /**
   * Get all forensic reports
   */
  async getReports(filters?: {
    status?: ForensicReport['status'];
    reportType?: ForensicReport['reportType'];
    startDate?: string;
    endDate?: string;
  }): Promise<ForensicReport[]> {
    let query = supabase
      .from('forensic_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.reportType) query = query.eq('report_type', filters.reportType);
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return data as unknown as ForensicReport[];
  },

  /**
   * Get a single forensic report
   */
  async getReport(id: string): Promise<ForensicReport> {
    const { data, error } = await supabase
      .from('forensic_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as ForensicReport;
  },

  /**
   * Create a new forensic report
   */
  async createReport(data: {
    title: string;
    reportType: ForensicReport['reportType'];
    anomalyIds?: string[];
    summary?: string;
  }): Promise<ForensicReport> {
    const { data: created, error } = await supabase
      .from('forensic_reports')
      .insert({
        title: data.title,
        report_type: data.reportType,
        anomaly_ids: data.anomalyIds,
        summary: data.summary,
        status: 'draft',
      })
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as unknown as ForensicReport;
  },

  /**
   * Update a forensic report
   */
  async updateReport(id: string, data: Partial<ForensicReport>): Promise<ForensicReport> {
    const { data: updated, error } = await supabase
      .from('forensic_reports')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as unknown as ForensicReport;
  },

  /**
   * Add a finding to a report
   */
  async addFinding(id: string, finding: ForensicFinding): Promise<ForensicReport> {
    const current = await forensicReportService.getReport(id);
    const updatedFindings = [...(current.findings ?? []), finding];

    const { data, error } = await supabase
      .from('forensic_reports')
      .update({ findings: updatedFindings })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as ForensicReport;
  },

  /**
   * Add a recommendation to a report
   */
  async addRecommendation(
    id: string,
    recommendation: ForensicRecommendation
  ): Promise<ForensicReport> {
    const current = await forensicReportService.getReport(id);
    const updatedRecommendations = [...(current.recommendations ?? []), recommendation];

    const { data, error } = await supabase
      .from('forensic_reports')
      .update({ recommendations: updatedRecommendations })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as ForensicReport;
  },

  /**
   * Complete a forensic report
   */
  async completeReport(id: string): Promise<ForensicReport> {
    const { data, error } = await supabase
      .from('forensic_reports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as ForensicReport;
  },

  /**
   * Generate PDF report
   */
  async generatePdf(id: string): Promise<{ pdfUrl: string }> {
    return invokeEdgeFunction<{ pdfUrl: string }>('export-data', {
      type: 'forensic_report_pdf',
      id,
      format: 'pdf',
    });
  },

  /**
   * Auto-generate report from anomalies
   */
  async generateFromAnomalies(anomalyIds: string[]): Promise<ForensicReport> {
    return invokeRpc<ForensicReport>('generate_forensic_report', {
      p_anomaly_ids: anomalyIds,
    });
  },
};

// Real-time security alerts WebSocket service
export class SecurityAlertWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(private baseUrl: string) {}

  connect(token: string): void {
    const wsUrl = `${this.baseUrl}/ws/security/alerts/?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.info('Security alerts WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      console.info('WebSocket closed');
      this.emit('disconnected', {});
      this.attemptReconnect(token);
    };
  }

  private handleMessage(data: { type: string; payload: unknown }): void {
    switch (data.type) {
      case 'new_anomaly':
        this.emit('anomaly', data.payload as SecurityAnomaly);
        break;
      case 'new_alert':
        this.emit('alert', data.payload as SecurityAlert);
        break;
      case 'anomaly_updated':
        this.emit('anomaly_updated', data.payload as SecurityAnomaly);
        break;
      case 'high_risk_event':
        this.emit('high_risk', data.payload);
        break;
      default:
        this.emit('message', data);
    }
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.info(`Attempting reconnect in ${delay}ms...`);
      setTimeout(() => this.connect(token), delay);
    } else {
      console.error('Max reconnect attempts reached');
      this.emit('max_reconnects', {});
    }
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendAcknowledgment(alertId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'acknowledge_alert',
          alert_id: alertId,
        })
      );
    }
  }
}

// Helper functions for security anomalies
export function getSecurityAnomalyTitle(type: SecurityAnomalyType): string {
  const titles: Record<SecurityAnomalyType, string> = {
    unusual_login_time: 'Connexion à heure inhabituelle',
    unusual_location: 'Localisation inhabituelle',
    multiple_failed_logins: 'Tentatives de connexion multiples',
    brute_force: 'Tentative de force brute',
    impossible_travel: 'Déplacement impossible détecté',
    new_device: 'Nouvel appareil détecté',
    suspicious_ip: 'IP suspecte',
    bulk_operation: 'Opération en masse',
    data_exfiltration: 'Exfiltration de données possible',
    unusual_api_usage: 'Utilisation API inhabituelle',
    suspicious_validation: 'Validation suspecte (trop rapide)',
    unusual_validation_time: 'Heure de validation inhabituelle',
    unusual_validation_location: 'Géolocalisation de validation inhabituelle',
    rapid_approval: 'Approbation trop rapide',
    bulk_approval: 'Approbations en masse suspectes',
    pattern_deviation: 'Déviation du comportement habituel',
  };
  return titles[type] || 'Anomalie de sécurité';
}

export function getSecuritySeverityConfig(severity: AnomalySeverity): {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
} {
  const configs = {
    info: {
      color: 'text-advist-gray900',
      bgColor: 'bg-advist-surface-dark',
      icon: 'info',
      label: 'Information',
    },
    warning: {
      color: 'text-advist-gold-dark',
      bgColor: 'bg-advist-gold-light',
      icon: 'alert-triangle',
      label: 'Avertissement',
    },
    error: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: 'x-circle',
      label: 'Erreur',
    },
    critical: {
      color: 'text-advist-gray900',
      bgColor: 'bg-advist-surface-dark',
      icon: 'alert-octagon',
      label: 'Critique',
    },
  };
  return configs[severity] || configs.info;
}
