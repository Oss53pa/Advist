/**
 * Compliance Service - eIDAS & RGPD
 *
 * Handles all compliance-related Supabase queries including:
 * - Consent management
 * - Data Subject Rights (DSAR)
 * - Processing register
 * - Data breaches
 * - Privacy Impact Assessments
 * - eIDAS Trust Services
 */
import { supabase } from '../lib/supabase';
import { invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError, getPaginationRange } from './supabase-helpers';
import { invokeRpc } from './supabase-crud';
import type {
  PaginatedResponse,
  ConsentPurpose,
  Consent,
  ConsentFormData,
  DataSubjectRequest,
  DataSubjectRequestCreateData,
  ProcessingActivity,
  DataRetentionPolicy,
  DataRetentionExecution,
  DataBreach,
  DataBreachCreateData,
  PrivacyImpactAssessment,
  PIARisk,
  SignatureProofFile,
  QualifiedTimestamp,
  ElectronicSeal,
  RegisteredDelivery,
  RegisteredDeliveryCreateData,
  QualifiedArchive,
  AttributeAttestation,
  ComplianceDashboard,
  DataExportOptions,
} from '@/types';

const PAGE_SIZE = 20;

// =============================================================================
// CONSENT MANAGEMENT
// =============================================================================

export const consentService = {
  /**
   * Get all consent purposes
   */
  getPurposes: async (): Promise<ConsentPurpose[]> => {
    const { data, error } = await supabase
      .from('consent_purposes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return data as ConsentPurpose[];
  },

  /**
   * Get consent form data (purposes grouped by requirement)
   */
  getFormData: async (): Promise<ConsentFormData> => {
    const purposes = await consentService.getPurposes();
    return {
      required: purposes.filter((p) => p.is_required),
      optional: purposes.filter((p) => !p.is_required),
      version: Math.max(...purposes.map((p) => p.version), 1),
    };
  },

  /**
   * Get user's consents
   */
  getMyConsents: async (): Promise<Consent[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('consents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return data as Consent[];
  },

  /**
   * Grant consent for a purpose
   */
  grantConsent: async (purposeCode: string, consentText: string): Promise<Consent> => {
    const { data, error } = await supabase
      .from('consents')
      .insert({
        purpose_code: purposeCode,
        consent_text_hash: await hashText(consentText),
        consent_form_version: '1.0',
        ip_address: '0.0.0.0',
        user_agent: navigator.userAgent,
        is_granted: true,
      })
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Consent;
  },

  /**
   * Grant multiple consents at once
   */
  grantMultiple: async (purposeCodes: string[]): Promise<{ granted: string[] }> => {
    const inserts = purposeCodes.map((code) => ({
      purpose_code: code,
      consent_form_version: '1.0',
      is_granted: true,
    }));

    const { error } = await supabase.from('consents').insert(inserts);

    if (error) throw parseSupabaseError(error);
    return { granted: purposeCodes };
  },

  /**
   * Withdraw consent
   */
  withdrawConsent: async (consentId: string, reason?: string): Promise<void> => {
    const { error } = await supabase
      .from('consents')
      .update({
        is_granted: false,
        withdrawn_at: new Date().toISOString(),
        withdrawal_reason: reason,
      })
      .eq('id', consentId);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Check if user has consent for a purpose
   */
  hasConsent: async (purposeCode: string): Promise<boolean> => {
    const consents = await consentService.getMyConsents();
    return consents.some((c) => c.purpose_code === purposeCode && c.is_granted);
  },
};

// =============================================================================
// DATA SUBJECT RIGHTS (DSAR)
// =============================================================================

export const dsarService = {
  /**
   * Get all data subject requests
   */
  getRequests: async (params?: {
    status?: string;
    request_type?: string;
    page?: number;
  }): Promise<PaginatedResponse<DataSubjectRequest>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('data_subject_requests')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.request_type) query = query.eq('request_type', params.request_type);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as DataSubjectRequest[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific request
   */
  getRequest: async (id: string): Promise<DataSubjectRequest> => {
    const { data, error } = await supabase
      .from('data_subject_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as DataSubjectRequest;
  },

  /**
   * Create a new data subject request
   */
  createRequest: async (data: DataSubjectRequestCreateData): Promise<DataSubjectRequest> => {
    const { data: created, error } = await supabase
      .from('data_subject_requests')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as DataSubjectRequest;
  },

  /**
   * Verify identity for a request
   */
  verifyIdentity: async (id: string, method: string): Promise<void> => {
    const { error } = await supabase
      .from('data_subject_requests')
      .update({
        identity_verified: true,
        identity_verification_method: method,
        identity_verified_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Assign a request to a handler
   */
  assignRequest: async (id: string, assigneeId: string): Promise<void> => {
    const { error } = await supabase
      .from('data_subject_requests')
      .update({ assignee_id: assigneeId })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Extend the deadline
   */
  extendDeadline: async (id: string, reason: string): Promise<{ new_deadline: string }> => {
    return invokeRpc<{ new_deadline: string }>('extend_dsar_deadline', {
      request_id: id,
      extension_reason: reason,
    });
  },

  /**
   * Complete a request
   */
  completeRequest: async (id: string, summary: string): Promise<void> => {
    const { error } = await supabase
      .from('data_subject_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_summary: summary,
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Reject a request
   */
  rejectRequest: async (id: string, reason: string): Promise<void> => {
    const { error } = await supabase
      .from('data_subject_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get overdue requests
   */
  getOverdue: async (): Promise<DataSubjectRequest[]> => {
    const { data, error } = await supabase
      .from('data_subject_requests')
      .select('*')
      .lt('deadline', new Date().toISOString())
      .not('status', 'in', '("completed","rejected")')
      .order('deadline', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as DataSubjectRequest[];
  },

  /**
   * Export user data
   */
  exportData: async (options: DataExportOptions): Promise<Blob | Record<string, unknown>> => {
    return invokeEdgeFunction<Blob | Record<string, unknown>>('export-data', {
      format: options.format,
      ...options,
    });
  },
};

// =============================================================================
// PROCESSING REGISTER
// =============================================================================

export const processingRegisterService = {
  /**
   * Get all processing activities
   */
  getActivities: async (params?: {
    legal_basis?: string;
    sensitive_data?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<ProcessingActivity>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('processing_activities')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.legal_basis) query = query.eq('legal_basis', params.legal_basis);
    if (params?.sensitive_data !== undefined)
      query = query.eq('sensitive_data', params.sensitive_data);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as ProcessingActivity[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific activity
   */
  getActivity: async (id: string): Promise<ProcessingActivity> => {
    const { data, error } = await supabase
      .from('processing_activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as ProcessingActivity;
  },

  /**
   * Create a new activity
   */
  createActivity: async (data: Partial<ProcessingActivity>): Promise<ProcessingActivity> => {
    const { data: created, error } = await supabase
      .from('processing_activities')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as ProcessingActivity;
  },

  /**
   * Update an activity
   */
  updateActivity: async (
    id: string,
    data: Partial<ProcessingActivity>
  ): Promise<ProcessingActivity> => {
    const { data: updated, error } = await supabase
      .from('processing_activities')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as ProcessingActivity;
  },

  /**
   * Delete an activity
   */
  deleteActivity: async (id: string): Promise<void> => {
    const { error } = await supabase.from('processing_activities').delete().eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Export the register
   */
  exportRegister: async (): Promise<{
    organization: string;
    export_date: string;
    activities: ProcessingActivity[];
  }> => {
    const { data, error } = await supabase
      .from('processing_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return {
      organization: '',
      export_date: new Date().toISOString(),
      activities: data as ProcessingActivity[],
    };
  },

  /**
   * Get activities requiring review
   */
  getRequiringReview: async (): Promise<ProcessingActivity[]> => {
    const { data, error } = await supabase
      .from('processing_activities')
      .select('*')
      .lt('next_review_date', new Date().toISOString())
      .order('next_review_date', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as ProcessingActivity[];
  },
};

// =============================================================================
// DATA RETENTION
// =============================================================================

export const retentionService = {
  /**
   * Get all retention policies
   */
  getPolicies: async (): Promise<PaginatedResponse<DataRetentionPolicy>> => {
    const { data, error, count } = await supabase
      .from('data_retention_policies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);

    return {
      results: (data as DataRetentionPolicy[]) ?? [],
      count: count ?? 0,
      next: null,
      previous: null,
    };
  },

  /**
   * Get a specific policy
   */
  getPolicy: async (id: string): Promise<DataRetentionPolicy> => {
    const { data, error } = await supabase
      .from('data_retention_policies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as DataRetentionPolicy;
  },

  /**
   * Create a policy
   */
  createPolicy: async (data: Partial<DataRetentionPolicy>): Promise<DataRetentionPolicy> => {
    const { data: created, error } = await supabase
      .from('data_retention_policies')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as DataRetentionPolicy;
  },

  /**
   * Update a policy
   */
  updatePolicy: async (
    id: string,
    data: Partial<DataRetentionPolicy>
  ): Promise<DataRetentionPolicy> => {
    const { data: updated, error } = await supabase
      .from('data_retention_policies')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as DataRetentionPolicy;
  },

  /**
   * Execute a policy manually
   */
  executePolicy: async (id: string): Promise<{ execution_id: string }> => {
    return invokeRpc<{ execution_id: string }>('execute_retention_policy', {
      policy_id: id,
    });
  },

  /**
   * Get executions
   */
  getExecutions: async (params?: {
    status?: string;
  }): Promise<PaginatedResponse<DataRetentionExecution>> => {
    let query = supabase
      .from('data_retention_executions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    return {
      results: (data as DataRetentionExecution[]) ?? [],
      count: count ?? 0,
      next: null,
      previous: null,
    };
  },
};

// =============================================================================
// DATA BREACH
// =============================================================================

export const breachService = {
  /**
   * Get all breaches
   */
  getBreaches: async (params?: {
    status?: string;
    severity?: string;
    page?: number;
  }): Promise<PaginatedResponse<DataBreach>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('data_breaches')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.severity) query = query.eq('severity', params.severity);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as DataBreach[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific breach
   */
  getBreach: async (id: string): Promise<DataBreach> => {
    const { data, error } = await supabase.from('data_breaches').select('*').eq('id', id).single();

    if (error) throw parseSupabaseError(error);
    return data as DataBreach;
  },

  /**
   * Report a new breach
   */
  reportBreach: async (data: DataBreachCreateData): Promise<DataBreach> => {
    const { data: created, error } = await supabase
      .from('data_breaches')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as DataBreach;
  },

  /**
   * Update a breach
   */
  updateBreach: async (id: string, data: Partial<DataBreach>): Promise<DataBreach> => {
    const { data: updated, error } = await supabase
      .from('data_breaches')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as DataBreach;
  },

  /**
   * Notify CNIL
   */
  notifyCNIL: async (id: string, content: string, reference?: string): Promise<void> => {
    const { error } = await supabase
      .from('data_breaches')
      .update({
        cnil_notified: true,
        cnil_notification_content: content,
        cnil_reference: reference,
        cnil_notified_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Notify affected users
   */
  notifyUsers: async (id: string, method: string, content: string): Promise<void> => {
    const { error } = await supabase
      .from('data_breaches')
      .update({
        users_notified: true,
        user_notification_method: method,
        user_notification_content: content,
        users_notified_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Resolve a breach
   */
  resolveBreach: async (
    id: string,
    lessonsLearned: string,
    preventiveMeasures: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('data_breaches')
      .update({
        status: 'resolved',
        lessons_learned: lessonsLearned,
        preventive_measures: preventiveMeasures,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get breaches pending CNIL notification
   */
  getPendingCNIL: async (): Promise<DataBreach[]> => {
    const { data, error } = await supabase
      .from('data_breaches')
      .select('*')
      .eq('cnil_notified', false)
      .neq('status', 'resolved')
      .order('created_at', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as DataBreach[];
  },

  /**
   * Get breaches with overdue CNIL notification
   */
  getOverdueCNIL: async (): Promise<DataBreach[]> => {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('data_breaches')
      .select('*')
      .eq('cnil_notified', false)
      .lt('detected_at', seventyTwoHoursAgo)
      .neq('status', 'resolved')
      .order('detected_at', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as DataBreach[];
  },
};

// =============================================================================
// PRIVACY IMPACT ASSESSMENT
// =============================================================================

export const piaService = {
  /**
   * Get all PIAs
   */
  getAssessments: async (params?: {
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<PrivacyImpactAssessment>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('privacy_impact_assessments')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as PrivacyImpactAssessment[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific PIA
   */
  getAssessment: async (id: string): Promise<PrivacyImpactAssessment> => {
    const { data, error } = await supabase
      .from('privacy_impact_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as PrivacyImpactAssessment;
  },

  /**
   * Create a PIA
   */
  createAssessment: async (
    data: Partial<PrivacyImpactAssessment>
  ): Promise<PrivacyImpactAssessment> => {
    const { data: created, error } = await supabase
      .from('privacy_impact_assessments')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as PrivacyImpactAssessment;
  },

  /**
   * Update a PIA
   */
  updateAssessment: async (
    id: string,
    data: Partial<PrivacyImpactAssessment>
  ): Promise<PrivacyImpactAssessment> => {
    const { data: updated, error } = await supabase
      .from('privacy_impact_assessments')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as PrivacyImpactAssessment;
  },

  /**
   * Submit for review
   */
  submitForReview: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('privacy_impact_assessments')
      .update({ status: 'under_review', submitted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Approve a PIA
   */
  approveAssessment: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('privacy_impact_assessments')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Reject a PIA
   */
  rejectAssessment: async (id: string, comments: string): Promise<void> => {
    const { error } = await supabase
      .from('privacy_impact_assessments')
      .update({
        status: 'rejected',
        review_comments: comments,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Add a risk to PIA
   */
  addRisk: async (id: string, risk: PIARisk): Promise<{ risks: PIARisk[] }> => {
    // Fetch current risks, append, and update
    const current = await piaService.getAssessment(id);
    const updatedRisks = [...(current.risks ?? []), risk];

    const { data, error } = await supabase
      .from('privacy_impact_assessments')
      .update({ risks: updatedRisks })
      .eq('id', id)
      .select('risks')
      .single();

    if (error) throw parseSupabaseError(error);
    return { risks: (data as { risks: PIARisk[] }).risks };
  },

  /**
   * Record DPO review
   */
  recordDPOReview: async (id: string, opinion: string): Promise<void> => {
    const { error } = await supabase
      .from('privacy_impact_assessments')
      .update({
        dpo_opinion: opinion,
        dpo_reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },
};

// =============================================================================
// eIDAS SIGNATURE PROOFS
// =============================================================================

export const signatureProofService = {
  /**
   * Get all signature proofs
   */
  getProofs: async (params?: {
    signature_level?: string;
    page?: number;
  }): Promise<PaginatedResponse<SignatureProofFile>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('signature_proofs')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.signature_level) query = query.eq('signature_level', params.signature_level);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as SignatureProofFile[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific proof
   */
  getProof: async (id: string): Promise<SignatureProofFile> => {
    const { data, error } = await supabase
      .from('signature_proofs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as SignatureProofFile;
  },

  /**
   * Download proof as JSON
   */
  downloadProof: async (id: string): Promise<Blob> => {
    return invokeEdgeFunction<Blob>('export-data', {
      type: 'signature_proof',
      id,
      format: 'json',
    });
  },

  /**
   * Verify proof integrity
   */
  verifyProof: async (
    id: string
  ): Promise<{
    is_valid: boolean;
    chain_hash_valid: boolean;
    pdf_hash_valid: boolean;
  }> => {
    return invokeRpc<{
      is_valid: boolean;
      chain_hash_valid: boolean;
      pdf_hash_valid: boolean;
    }>('verify_signature_proof', { proof_id: id });
  },
};

// =============================================================================
// eIDAS TRUST SERVICES
// =============================================================================

export const trustServicesService = {
  // Qualified Timestamps
  timestamps: {
    getAll: async (): Promise<PaginatedResponse<QualifiedTimestamp>> => {
      const { data, error, count } = await supabase
        .from('qualified_timestamps')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw parseSupabaseError(error);
      return {
        results: (data as QualifiedTimestamp[]) ?? [],
        count: count ?? 0,
        next: null,
        previous: null,
      };
    },
    verify: async (id: string): Promise<{ status: string; result: Record<string, unknown> }> => {
      return invokeRpc<{ status: string; result: Record<string, unknown> }>(
        'verify_qualified_timestamp',
        {
          timestamp_id: id,
        }
      );
    },
  },

  // Electronic Seals
  seals: {
    getAll: async (): Promise<PaginatedResponse<ElectronicSeal>> => {
      const { data, error, count } = await supabase
        .from('electronic_seals')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw parseSupabaseError(error);
      return {
        results: (data as ElectronicSeal[]) ?? [],
        count: count ?? 0,
        next: null,
        previous: null,
      };
    },
    create: async (data: Partial<ElectronicSeal>): Promise<ElectronicSeal> => {
      const { data: created, error } = await supabase
        .from('electronic_seals')
        .insert(data as Record<string, unknown>)
        .select('*')
        .single();

      if (error) throw parseSupabaseError(error);
      return created as ElectronicSeal;
    },
  },

  // Registered Deliveries
  registeredDeliveries: {
    getAll: async (params?: {
      status?: string;
    }): Promise<PaginatedResponse<RegisteredDelivery>> => {
      let query = supabase
        .from('registered_deliveries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params?.status) query = query.eq('status', params.status);

      const { data, error, count } = await query;
      if (error) throw parseSupabaseError(error);

      return {
        results: (data as RegisteredDelivery[]) ?? [],
        count: count ?? 0,
        next: null,
        previous: null,
      };
    },
    get: async (id: string): Promise<RegisteredDelivery> => {
      const { data, error } = await supabase
        .from('registered_deliveries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw parseSupabaseError(error);
      return data as RegisteredDelivery;
    },
    create: async (data: RegisteredDeliveryCreateData): Promise<RegisteredDelivery> => {
      const { data: created, error } = await supabase
        .from('registered_deliveries')
        .insert(data as Record<string, unknown>)
        .select('*')
        .single();

      if (error) throw parseSupabaseError(error);
      return created as RegisteredDelivery;
    },
    markSent: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('registered_deliveries')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw parseSupabaseError(error);
    },
    markDelivered: async (id: string, recipientIp?: string): Promise<void> => {
      const { error } = await supabase
        .from('registered_deliveries')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          recipient_ip: recipientIp,
        })
        .eq('id', id);

      if (error) throw parseSupabaseError(error);
    },
    markRead: async (id: string, recipientIp?: string): Promise<void> => {
      const { error } = await supabase
        .from('registered_deliveries')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          recipient_ip: recipientIp,
        })
        .eq('id', id);

      if (error) throw parseSupabaseError(error);
    },
  },

  // Qualified Archives
  archives: {
    getAll: async (): Promise<PaginatedResponse<QualifiedArchive>> => {
      const { data, error, count } = await supabase
        .from('qualified_archives')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw parseSupabaseError(error);
      return {
        results: (data as QualifiedArchive[]) ?? [],
        count: count ?? 0,
        next: null,
        previous: null,
      };
    },
    get: async (id: string): Promise<QualifiedArchive> => {
      const { data, error } = await supabase
        .from('qualified_archives')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw parseSupabaseError(error);
      return data as QualifiedArchive;
    },
    verifyIntegrity: async (
      id: string
    ): Promise<{ status: string; result: Record<string, unknown> }> => {
      return invokeRpc<{ status: string; result: Record<string, unknown> }>(
        'verify_archive_integrity',
        {
          archive_id: id,
        }
      );
    },
  },

  // Attribute Attestations
  attestations: {
    getAll: async (): Promise<PaginatedResponse<AttributeAttestation>> => {
      const { data, error, count } = await supabase
        .from('attribute_attestations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw parseSupabaseError(error);
      return {
        results: (data as AttributeAttestation[]) ?? [],
        count: count ?? 0,
        next: null,
        previous: null,
      };
    },
    get: async (id: string): Promise<AttributeAttestation> => {
      const { data, error } = await supabase
        .from('attribute_attestations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw parseSupabaseError(error);
      return data as AttributeAttestation;
    },
    revoke: async (id: string, reason: string): Promise<void> => {
      const { error } = await supabase
        .from('attribute_attestations')
        .update({
          status: 'revoked',
          revocation_reason: reason,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw parseSupabaseError(error);
    },
  },
};

// =============================================================================
// COMPLIANCE DASHBOARD
// =============================================================================

export const complianceDashboardService = {
  /**
   * Get compliance dashboard statistics
   */
  getDashboard: async (): Promise<ComplianceDashboard> => {
    return invokeRpc<ComplianceDashboard>('get_compliance_dashboard');
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Hash text using SHA-256 (for consent text verification)
 */
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  consent: consentService,
  dsar: dsarService,
  processingRegister: processingRegisterService,
  retention: retentionService,
  breach: breachService,
  pia: piaService,
  signatureProof: signatureProofService,
  trustServices: trustServicesService,
  dashboard: complianceDashboardService,
};
