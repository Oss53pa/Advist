/**
 * ISO 27001:2022 Service - SMSI (ISMS)
 *
 * Supabase service pour la gestion du Système de Management de la Sécurité de l'Information
 */
import { supabase } from '../lib/supabase';
import { invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError, getPaginationRange } from './supabase-helpers';
import { invokeRpc } from './supabase-crud';
import type {
  PaginatedResponse,
  ControlCategory,
  Control,
  StatementOfApplicability,
  ControlImplementation,
  ControlImplementationFormData,
  RiskRegister,
  Risk,
  RiskFormData,
  RiskTreatmentPlan,
  ThreatCategory,
  Threat,
  Vulnerability,
  AuditProgram,
  InternalAudit,
  AuditFinding,
  AuditFindingFormData,
  CorrectiveAction,
  CorrectiveActionFormData,
  ManagementReview,
  InformationAsset,
  AssetCategory,
  ISMSScope,
  ISMSObjective,
  SecurityPolicy,
  PolicyAcknowledgment,
  ISO27001Dashboard,
} from '@/types/iso27001';

const PAGE_SIZE = 20;

// =============================================================================
// CONTROLS (Annex A)
// =============================================================================

export const controlService = {
  /**
   * Get all control categories
   */
  getCategories: async (): Promise<ControlCategory[]> => {
    const { data, error } = await supabase
      .from('iso_control_categories')
      .select('*')
      .order('code', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as ControlCategory[];
  },

  /**
   * Get all controls
   */
  getControls: async (params?: {
    category?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Control>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_controls')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('code', { ascending: true });

    if (params?.category) query = query.eq('category', params.category);
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as Control[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific control
   */
  getControl: async (id: string): Promise<Control> => {
    const { data, error } = await supabase
      .from('iso_controls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Control;
  },

  /**
   * Get controls by category code
   */
  getControlsByCategory: async (categoryCode: string): Promise<Control[]> => {
    const { data, error } = await supabase
      .from('iso_controls')
      .select('*')
      .eq('category', categoryCode)
      .order('code', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as Control[];
  },
};

// =============================================================================
// STATEMENT OF APPLICABILITY (SoA / DdA)
// =============================================================================

export const soaService = {
  /**
   * Get all SoA versions
   */
  getVersions: async (params?: {
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<StatementOfApplicability>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_soa')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as StatementOfApplicability[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific SoA
   */
  getSoA: async (id: string): Promise<StatementOfApplicability> => {
    const { data, error } = await supabase
      .from('iso_soa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as StatementOfApplicability;
  },

  /**
   * Get current/active SoA
   */
  getCurrentSoA: async (): Promise<StatementOfApplicability> => {
    const { data, error } = await supabase
      .from('iso_soa')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as StatementOfApplicability;
  },

  /**
   * Create a new SoA version
   */
  createSoA: async (data: {
    version: string;
    title?: string;
    description?: string;
    risk_register?: string;
  }): Promise<StatementOfApplicability> => {
    const { data: created, error } = await supabase
      .from('iso_soa')
      .insert(data)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as StatementOfApplicability;
  },

  /**
   * Submit SoA for review
   */
  submitForReview: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_soa')
      .update({ status: 'under_review', submitted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Approve SoA
   */
  approveSoA: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_soa')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get control implementations for a SoA
   */
  getImplementations: async (
    soaId: string,
    params?: {
      category?: string;
      status?: string;
      page?: number;
    }
  ): Promise<PaginatedResponse<ControlImplementation>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_control_implementations')
      .select('*', { count: 'exact' })
      .eq('soa_id', soaId)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.category) query = query.eq('category', params.category);
    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as ControlImplementation[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Update a control implementation
   */
  updateImplementation: async (
    soaId: string,
    controlId: string,
    data: ControlImplementationFormData
  ): Promise<ControlImplementation> => {
    const { data: updated, error } = await supabase
      .from('iso_control_implementations')
      .update(data as Record<string, unknown>)
      .eq('soa_id', soaId)
      .eq('control_id', controlId)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as ControlImplementation;
  },

  /**
   * Bulk update implementations
   */
  bulkUpdateImplementations: async (
    soaId: string,
    updates: Array<{ control_id: string } & ControlImplementationFormData>
  ): Promise<{ updated: number }> => {
    let updatedCount = 0;
    for (const item of updates) {
      const { control_id, ...updateData } = item;
      const { error } = await supabase
        .from('iso_control_implementations')
        .update(updateData as Record<string, unknown>)
        .eq('soa_id', soaId)
        .eq('control_id', control_id);

      if (error) throw parseSupabaseError(error);
      updatedCount++;
    }
    return { updated: updatedCount };
  },

  /**
   * Export SoA to Excel/PDF
   */
  exportSoA: async (id: string, format: 'xlsx' | 'pdf'): Promise<Blob> => {
    return invokeEdgeFunction<Blob>('export-data', {
      type: 'soa',
      id,
      format,
    });
  },
};

// =============================================================================
// RISK MANAGEMENT
// =============================================================================

export const riskService = {
  /**
   * Get all risk registers
   */
  getRegisters: async (params?: {
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<RiskRegister>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_risk_registers')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as RiskRegister[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific risk register
   */
  getRegister: async (id: string): Promise<RiskRegister> => {
    const { data, error } = await supabase
      .from('iso_risk_registers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as RiskRegister;
  },

  /**
   * Get current/active risk register
   */
  getCurrentRegister: async (): Promise<RiskRegister> => {
    const { data, error } = await supabase
      .from('iso_risk_registers')
      .select('*')
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as RiskRegister;
  },

  /**
   * Create a new risk register
   */
  createRegister: async (data: Partial<RiskRegister>): Promise<RiskRegister> => {
    const { data: created, error } = await supabase
      .from('iso_risk_registers')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as RiskRegister;
  },

  /**
   * Get risks in a register
   */
  getRisks: async (
    registerId: string,
    params?: {
      risk_level?: string;
      status?: string;
      owner?: string;
      page?: number;
    }
  ): Promise<PaginatedResponse<Risk>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_risks')
      .select('*', { count: 'exact' })
      .eq('register_id', registerId)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.risk_level) query = query.eq('risk_level', params.risk_level);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.owner) query = query.eq('owner', params.owner);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as Risk[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific risk
   */
  getRisk: async (id: string): Promise<Risk> => {
    const { data, error } = await supabase
      .from('iso_risks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Risk;
  },

  /**
   * Create a new risk
   */
  createRisk: async (registerId: string, data: RiskFormData): Promise<Risk> => {
    const { data: created, error } = await supabase
      .from('iso_risks')
      .insert({ ...data, register_id: registerId } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as Risk;
  },

  /**
   * Update a risk
   */
  updateRisk: async (id: string, data: Partial<RiskFormData>): Promise<Risk> => {
    const { data: updated, error } = await supabase
      .from('iso_risks')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as Risk;
  },

  /**
   * Accept a risk
   */
  acceptRisk: async (id: string, justification: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_risks')
      .update({
        status: 'accepted',
        acceptance_justification: justification,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get treatment plans for a risk
   */
  getTreatmentPlans: async (riskId: string): Promise<RiskTreatmentPlan[]> => {
    const { data, error } = await supabase
      .from('iso_risk_treatment_plans')
      .select('*')
      .eq('risk_id', riskId)
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return data as RiskTreatmentPlan[];
  },

  /**
   * Create a treatment plan
   */
  createTreatmentPlan: async (
    riskId: string,
    data: Partial<RiskTreatmentPlan>
  ): Promise<RiskTreatmentPlan> => {
    const { data: created, error } = await supabase
      .from('iso_risk_treatment_plans')
      .insert({ ...data, risk_id: riskId } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as RiskTreatmentPlan;
  },

  /**
   * Get risk heat map data
   */
  getHeatMapData: async (registerId: string): Promise<{
    matrix: number[][];
    risks_by_cell: Record<string, Risk[]>;
  }> => {
    return invokeRpc<{
      matrix: number[][];
      risks_by_cell: Record<string, Risk[]>;
    }>('get_risk_heatmap', { register_id: registerId });
  },

  /**
   * Export risk register
   */
  exportRegister: async (id: string, format: 'xlsx' | 'pdf'): Promise<Blob> => {
    return invokeEdgeFunction<Blob>('export-data', {
      type: 'risk_register',
      id,
      format,
    });
  },
};

// =============================================================================
// THREATS & VULNERABILITIES
// =============================================================================

export const threatService = {
  /**
   * Get threat categories
   */
  getCategories: async (): Promise<ThreatCategory[]> => {
    const { data, error } = await supabase
      .from('iso_threat_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as ThreatCategory[];
  },

  /**
   * Get all threats
   */
  getThreats: async (params?: {
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<Threat>> => {
    let query = supabase
      .from('iso_threats')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    if (params?.category) query = query.eq('category', params.category);
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    return {
      results: (data as Threat[]) ?? [],
      count: count ?? 0,
      next: null,
      previous: null,
    };
  },

  /**
   * Get all vulnerabilities
   */
  getVulnerabilities: async (params?: {
    type?: string;
    search?: string;
  }): Promise<PaginatedResponse<Vulnerability>> => {
    let query = supabase
      .from('iso_vulnerabilities')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    if (params?.type) query = query.eq('type', params.type);
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    return {
      results: (data as Vulnerability[]) ?? [],
      count: count ?? 0,
      next: null,
      previous: null,
    };
  },
};

// =============================================================================
// INTERNAL AUDITS
// =============================================================================

export const auditService = {
  /**
   * Get audit programs
   */
  getPrograms: async (params?: {
    year?: number;
    status?: string;
  }): Promise<PaginatedResponse<AuditProgram>> => {
    let query = supabase
      .from('iso_audit_programs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.year) query = query.eq('year', params.year);
    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    return {
      results: (data as AuditProgram[]) ?? [],
      count: count ?? 0,
      next: null,
      previous: null,
    };
  },

  /**
   * Get a specific audit program
   */
  getProgram: async (id: string): Promise<AuditProgram> => {
    const { data, error } = await supabase
      .from('iso_audit_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as AuditProgram;
  },

  /**
   * Get audits in a program
   */
  getAudits: async (
    programId: string,
    params?: {
      status?: string;
      type?: string;
    }
  ): Promise<PaginatedResponse<InternalAudit>> => {
    let query = supabase
      .from('iso_internal_audits')
      .select('*', { count: 'exact' })
      .eq('program_id', programId)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.type) query = query.eq('type', params.type);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    return {
      results: (data as InternalAudit[]) ?? [],
      count: count ?? 0,
      next: null,
      previous: null,
    };
  },

  /**
   * Get a specific audit
   */
  getAudit: async (id: string): Promise<InternalAudit> => {
    const { data, error } = await supabase
      .from('iso_internal_audits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as InternalAudit;
  },

  /**
   * Create a new audit
   */
  createAudit: async (programId: string, data: Partial<InternalAudit>): Promise<InternalAudit> => {
    const { data: created, error } = await supabase
      .from('iso_internal_audits')
      .insert({ ...data, program_id: programId } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as InternalAudit;
  },

  /**
   * Update audit status
   */
  updateAuditStatus: async (id: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_internal_audits')
      .update({ status })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get findings for an audit
   */
  getFindings: async (
    auditId: string,
    params?: {
      type?: string;
      status?: string;
    }
  ): Promise<PaginatedResponse<AuditFinding>> => {
    let query = supabase
      .from('iso_audit_findings')
      .select('*', { count: 'exact' })
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false });

    if (params?.type) query = query.eq('type', params.type);
    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    return {
      results: (data as AuditFinding[]) ?? [],
      count: count ?? 0,
      next: null,
      previous: null,
    };
  },

  /**
   * Create a finding
   */
  createFinding: async (auditId: string, data: AuditFindingFormData): Promise<AuditFinding> => {
    const { data: created, error } = await supabase
      .from('iso_audit_findings')
      .insert({ ...data, audit_id: auditId } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as AuditFinding;
  },

  /**
   * Update a finding
   */
  updateFinding: async (id: string, data: Partial<AuditFinding>): Promise<AuditFinding> => {
    const { data: updated, error } = await supabase
      .from('iso_audit_findings')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as AuditFinding;
  },

  /**
   * Close a finding
   */
  closeFinding: async (id: string, resolution_notes: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_audit_findings')
      .update({
        status: 'closed',
        resolution_notes,
        closed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },
};

// =============================================================================
// CORRECTIVE ACTIONS
// =============================================================================

export const correctiveActionService = {
  /**
   * Get all corrective actions
   */
  getActions: async (params?: {
    status?: string;
    source_type?: string;
    responsible?: string;
    overdue?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<CorrectiveAction>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_corrective_actions')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.source_type) query = query.eq('source_type', params.source_type);
    if (params?.responsible) query = query.eq('responsible', params.responsible);
    if (params?.overdue) {
      query = query
        .lt('due_date', new Date().toISOString())
        .not('status', 'in', '("completed","verified")');
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as CorrectiveAction[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific action
   */
  getAction: async (id: string): Promise<CorrectiveAction> => {
    const { data, error } = await supabase
      .from('iso_corrective_actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as CorrectiveAction;
  },

  /**
   * Create a new action
   */
  createAction: async (data: CorrectiveActionFormData): Promise<CorrectiveAction> => {
    const { data: created, error } = await supabase
      .from('iso_corrective_actions')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as CorrectiveAction;
  },

  /**
   * Update an action
   */
  updateAction: async (id: string, data: Partial<CorrectiveAction>): Promise<CorrectiveAction> => {
    const { data: updated, error } = await supabase
      .from('iso_corrective_actions')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as CorrectiveAction;
  },

  /**
   * Complete an action
   */
  completeAction: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_corrective_actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Verify effectiveness
   */
  verifyEffectiveness: async (
    id: string,
    data: { is_effective: boolean; review: string }
  ): Promise<void> => {
    const { error } = await supabase
      .from('iso_corrective_actions')
      .update({
        status: 'verified',
        is_effective: data.is_effective,
        effectiveness_review: data.review,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get overdue actions
   */
  getOverdue: async (): Promise<CorrectiveAction[]> => {
    const { data, error } = await supabase
      .from('iso_corrective_actions')
      .select('*')
      .lt('due_date', new Date().toISOString())
      .not('status', 'in', '("completed","verified")')
      .order('due_date', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as CorrectiveAction[];
  },
};

// =============================================================================
// MANAGEMENT REVIEWS
// =============================================================================

export const managementReviewService = {
  /**
   * Get all reviews
   */
  getReviews: async (params?: {
    status?: string;
    year?: number;
    page?: number;
  }): Promise<PaginatedResponse<ManagementReview>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_management_reviews')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.year) query = query.eq('year', params.year);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as ManagementReview[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific review
   */
  getReview: async (id: string): Promise<ManagementReview> => {
    const { data, error } = await supabase
      .from('iso_management_reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as ManagementReview;
  },

  /**
   * Create a new review
   */
  createReview: async (data: Partial<ManagementReview>): Promise<ManagementReview> => {
    const { data: created, error } = await supabase
      .from('iso_management_reviews')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as ManagementReview;
  },

  /**
   * Update a review
   */
  updateReview: async (id: string, data: Partial<ManagementReview>): Promise<ManagementReview> => {
    const { data: updated, error } = await supabase
      .from('iso_management_reviews')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as ManagementReview;
  },

  /**
   * Complete a review
   */
  completeReview: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_management_reviews')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },
};

// =============================================================================
// INFORMATION ASSETS
// =============================================================================

export const assetService = {
  /**
   * Get asset categories
   */
  getCategories: async (): Promise<AssetCategory[]> => {
    const { data, error } = await supabase
      .from('iso_asset_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw parseSupabaseError(error);
    return data as AssetCategory[];
  },

  /**
   * Get all assets
   */
  getAssets: async (params?: {
    category?: string;
    classification?: string;
    status?: string;
    owner?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<InformationAsset>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_information_assets')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.category) query = query.eq('category', params.category);
    if (params?.classification) query = query.eq('classification', params.classification);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.owner) query = query.eq('owner', params.owner);
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as InformationAsset[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific asset
   */
  getAsset: async (id: string): Promise<InformationAsset> => {
    const { data, error } = await supabase
      .from('iso_information_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as InformationAsset;
  },

  /**
   * Create an asset
   */
  createAsset: async (data: Partial<InformationAsset>): Promise<InformationAsset> => {
    const { data: created, error } = await supabase
      .from('iso_information_assets')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as InformationAsset;
  },

  /**
   * Update an asset
   */
  updateAsset: async (id: string, data: Partial<InformationAsset>): Promise<InformationAsset> => {
    const { data: updated, error } = await supabase
      .from('iso_information_assets')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as InformationAsset;
  },

  /**
   * Export asset inventory
   */
  exportInventory: async (format: 'xlsx' | 'pdf'): Promise<Blob> => {
    return invokeEdgeFunction<Blob>('export-data', {
      type: 'asset_inventory',
      format,
    });
  },
};

// =============================================================================
// ISMS SCOPE & OBJECTIVES
// =============================================================================

export const scopeService = {
  /**
   * Get ISMS scope
   */
  getScope: async (): Promise<ISMSScope> => {
    const { data, error } = await supabase
      .from('iso_isms_scope')
      .select('*')
      .limit(1)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as ISMSScope;
  },

  /**
   * Update ISMS scope
   */
  updateScope: async (data: Partial<ISMSScope>): Promise<ISMSScope> => {
    // Get current scope first for the ID
    const current = await scopeService.getScope();

    const { data: updated, error } = await supabase
      .from('iso_isms_scope')
      .update(data as Record<string, unknown>)
      .eq('id', (current as Record<string, unknown>).id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as ISMSScope;
  },

  /**
   * Get ISMS objectives
   */
  getObjectives: async (params?: {
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<ISMSObjective>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_isms_objectives')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as ISMSObjective[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific objective
   */
  getObjective: async (id: string): Promise<ISMSObjective> => {
    const { data, error } = await supabase
      .from('iso_isms_objectives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as ISMSObjective;
  },

  /**
   * Create an objective
   */
  createObjective: async (data: Partial<ISMSObjective>): Promise<ISMSObjective> => {
    const { data: created, error } = await supabase
      .from('iso_isms_objectives')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as ISMSObjective;
  },

  /**
   * Add measurement to objective
   */
  addMeasurement: async (
    objectiveId: string,
    data: {
      measurement_date: string;
      period_start: string;
      period_end: string;
      actual_value: string;
      notes?: string;
      evidence?: string;
    }
  ): Promise<void> => {
    // Fetch current measurements, append, and update
    const objective = await scopeService.getObjective(objectiveId);
    const measurements = [...((objective as Record<string, unknown>).measurements as unknown[] ?? []), data];

    const { error } = await supabase
      .from('iso_isms_objectives')
      .update({ measurements })
      .eq('id', objectiveId);

    if (error) throw parseSupabaseError(error);
  },
};

// =============================================================================
// SECURITY POLICIES
// =============================================================================

export const policyService = {
  /**
   * Get all policies
   */
  getPolicies: async (params?: {
    type?: string;
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<SecurityPolicy>> => {
    const page = params?.page ?? 1;
    const { from, to } = getPaginationRange(page, PAGE_SIZE);

    let query = supabase
      .from('iso_security_policies')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (params?.type) query = query.eq('type', params.type);
    if (params?.status) query = query.eq('status', params.status);

    const { data, error, count } = await query;
    if (error) throw parseSupabaseError(error);

    const total = count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      results: (data as SecurityPolicy[]) ?? [],
      count: total,
      next: page < totalPages ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
    };
  },

  /**
   * Get a specific policy
   */
  getPolicy: async (id: string): Promise<SecurityPolicy> => {
    const { data, error } = await supabase
      .from('iso_security_policies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as SecurityPolicy;
  },

  /**
   * Create a policy
   */
  createPolicy: async (data: Partial<SecurityPolicy>): Promise<SecurityPolicy> => {
    const { data: created, error } = await supabase
      .from('iso_security_policies')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return created as SecurityPolicy;
  },

  /**
   * Update a policy
   */
  updatePolicy: async (id: string, data: Partial<SecurityPolicy>): Promise<SecurityPolicy> => {
    const { data: updated, error } = await supabase
      .from('iso_security_policies')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return updated as SecurityPolicy;
  },

  /**
   * Publish a policy
   */
  publishPolicy: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('iso_security_policies')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Acknowledge a policy
   */
  acknowledgePolicy: async (id: string): Promise<PolicyAcknowledgment> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('iso_security_policies')
      .select('id')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);

    // Insert acknowledgment record (likely a join table or JSONB column update)
    return invokeRpc<PolicyAcknowledgment>('acknowledge_security_policy', {
      policy_id: id,
      user_id: user.id,
    });
  },

  /**
   * Get pending acknowledgments for current user
   */
  getPendingAcknowledgments: async (): Promise<SecurityPolicy[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const result = await invokeRpc<SecurityPolicy[]>('get_pending_policy_acknowledgments', {
      p_user_id: user.id,
    });
    return result;
  },
};

// =============================================================================
// DASHBOARD
// =============================================================================

export const dashboardService = {
  /**
   * Get ISO 27001 dashboard data
   */
  getDashboard: async (): Promise<ISO27001Dashboard> => {
    return invokeRpc<ISO27001Dashboard>('get_iso27001_dashboard');
  },

  /**
   * Get compliance summary
   */
  getComplianceSummary: async (): Promise<{
    overall_compliance: number;
    by_category: Array<{
      category: string;
      compliance: number;
    }>;
  }> => {
    return invokeRpc<{
      overall_compliance: number;
      by_category: Array<{
        category: string;
        compliance: number;
      }>;
    }>('get_iso27001_compliance_summary');
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  controls: controlService,
  soa: soaService,
  risks: riskService,
  threats: threatService,
  audits: auditService,
  correctiveActions: correctiveActionService,
  managementReviews: managementReviewService,
  assets: assetService,
  scope: scopeService,
  policies: policyService,
  dashboard: dashboardService,
};
