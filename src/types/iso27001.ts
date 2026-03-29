/**
 * ISO 27001:2022 Types - SMSI (ISMS)
 *
 * Types pour la gestion du Système de Management de la Sécurité de l'Information
 */

// =============================================================================
// CONTROL CATEGORIES & CONTROLS (Annex A)
// =============================================================================

export interface ControlCategory {
  id: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  control_count: number;
  order: number;
}

export interface Control {
  id: string;
  category: string;
  category_detail?: ControlCategory;
  code: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  control_types: ControlType[];
  security_properties: SecurityProperty[];
  cybersecurity_concepts: CybersecurityConcept[];
  operational_capabilities: string[];
  security_domains: string[];
  implementation_guidance: string;
  iso27002_section: string;
  nist_mapping: string[];
  is_active: boolean;
  order: number;
}

export type ControlType = 'preventive' | 'detective' | 'corrective';
export type SecurityProperty = 'confidentiality' | 'integrity' | 'availability';
export type CybersecurityConcept = 'identify' | 'protect' | 'detect' | 'respond' | 'recover';

// =============================================================================
// STATEMENT OF APPLICABILITY (SoA / DdA)
// =============================================================================

export interface StatementOfApplicability {
  id: string;
  organization: string;
  version: string;
  title: string;
  description: string;
  risk_register?: string;
  status: SoAStatus;
  prepared_by?: string;
  prepared_by_detail?: UserSummary;
  reviewed_by?: string;
  reviewed_by_detail?: UserSummary;
  approved_by?: string;
  approved_by_detail?: UserSummary;
  approved_at?: string;
  total_controls: number;
  applicable_controls: number;
  implemented_controls: number;
  created_at: string;
  updated_at: string;
}

export type SoAStatus = 'draft' | 'in_review' | 'approved' | 'superseded';

export interface ControlImplementation {
  id: string;
  soa: string;
  control: string;
  control_detail?: Control;
  is_applicable: boolean;
  applicability_justification: string;
  implementation_status: ImplementationStatus;
  implementation_percentage: number;
  implementation_description: string;
  implementation_method: string;
  control_owner?: string;
  control_owner_detail?: UserSummary;
  evidence_description: string;
  effectiveness: EffectivenessLevel;
  effectiveness_notes: string;
  last_effectiveness_review?: string;
  target_implementation_date?: string;
  actual_implementation_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ImplementationStatus =
  | 'not_started'
  | 'in_progress'
  | 'partial'
  | 'implemented'
  | 'not_applicable';

export type EffectivenessLevel =
  | 'not_evaluated'
  | 'ineffective'
  | 'partial'
  | 'effective'
  | 'highly';

// =============================================================================
// RISK MANAGEMENT
// =============================================================================

export interface RiskRegister {
  id: string;
  organization: string;
  name: string;
  description: string;
  scope?: string;
  period_start: string;
  period_end: string;
  status: RiskRegisterStatus;
  reviewed_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  risks_count?: number;
  high_risks_count?: number;
}

export type RiskRegisterStatus = 'draft' | 'in_review' | 'approved' | 'archived';

export interface Risk {
  id: string;
  register: string;
  reference: string;
  title: string;
  description: string;
  risk_type: RiskType;
  threat?: string;
  threat_detail?: Threat;
  vulnerability?: string;
  vulnerability_detail?: Vulnerability;
  risk_owner?: string;
  risk_owner_detail?: UserSummary;

  // Inherent risk (before controls)
  inherent_impact: number;
  inherent_likelihood: number;
  inherent_risk_score: number;
  inherent_risk_level: RiskLevel;

  // Current risk (with existing controls)
  current_impact: number;
  current_likelihood: number;
  current_risk_score: number;
  current_risk_level: RiskLevel;
  existing_controls_description: string;

  // Treatment
  treatment_option: TreatmentOption;
  treatment_justification: string;

  // Residual risk (after treatment)
  residual_impact?: number;
  residual_likelihood?: number;
  residual_risk_score?: number;
  residual_risk_level?: RiskLevel;

  // Acceptance
  is_accepted: boolean;
  accepted_by?: string;
  accepted_at?: string;
  acceptance_justification: string;

  status: RiskStatus;
  last_review_date?: string;
  next_review_date?: string;

  created_by?: string;
  created_at: string;
  updated_at: string;

  // Related items
  treatment_plans?: RiskTreatmentPlan[];
  linked_controls?: string[];
}

export type RiskType = 'confidentiality' | 'integrity' | 'availability' | 'combined';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TreatmentOption = 'accept' | 'reduce' | 'transfer' | 'avoid' | 'share' | '';
export type RiskStatus =
  | 'identified'
  | 'assessed'
  | 'treatment_planned'
  | 'treatment_in_progress'
  | 'treated'
  | 'closed'
  | 'monitoring';

export interface RiskTreatmentPlan {
  id: string;
  risk: string;
  reference: string;
  title: string;
  description: string;
  actions: TreatmentAction[];
  expected_residual_impact: number;
  expected_residual_likelihood: number;
  expected_residual_score: number;
  estimated_cost?: number;
  estimated_effort_days?: number;
  resources_required: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: TreatmentPlanStatus;
  progress_percentage: number;
  responsible?: string;
  responsible_detail?: UserSummary;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentAction {
  id: string;
  description: string;
  responsible?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export type TreatmentPlanStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

// =============================================================================
// THREATS & VULNERABILITIES
// =============================================================================

export interface ThreatCategory {
  id: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  category_type: ThreatCategoryType;
  is_active: boolean;
  order: number;
}

export type ThreatCategoryType =
  | 'physical'
  | 'natural'
  | 'human_deliberate'
  | 'human_accidental'
  | 'technical'
  | 'organizational';

export interface Threat {
  id: string;
  organization?: string;
  category: string;
  category_detail?: ThreatCategory;
  code: string;
  name: string;
  name_en: string;
  description: string;
  examples: string[];
  typical_controls: string[];
  is_active: boolean;
  is_global: boolean;
  created_at: string;
}

export interface Vulnerability {
  id: string;
  organization?: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  vulnerability_type: VulnerabilityType;
  related_threats: string[];
  is_active: boolean;
  is_global: boolean;
  created_at: string;
}

export type VulnerabilityType =
  | 'technical'
  | 'organizational'
  | 'physical'
  | 'human'
  | 'process';

// =============================================================================
// INTERNAL AUDITS
// =============================================================================

export interface AuditProgram {
  id: string;
  organization: string;
  name: string;
  description: string;
  year: number;
  objectives: string;
  scope: string;
  lead_auditor?: string;
  lead_auditor_detail?: UserSummary;
  status: AuditProgramStatus;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  audits_count?: number;
  completed_audits_count?: number;
}

export type AuditProgramStatus = 'draft' | 'approved' | 'in_progress' | 'completed';

export interface InternalAudit {
  id: string;
  program: string;
  reference: string;
  title: string;
  audit_type: AuditType;
  scope: string;
  clauses_audited: string[];
  processes_audited: string[];
  audit_criteria: string;
  lead_auditor?: string;
  lead_auditor_detail?: UserSummary;
  audit_team?: UserSummary[];
  external_auditors: ExternalAuditor[];
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: AuditStatus;
  conclusion?: AuditConclusion;
  executive_summary: string;
  report_date?: string;
  report_document?: string;
  created_at: string;
  updated_at: string;
  findings_count?: number;
  open_findings_count?: number;
}

export type AuditType = 'full' | 'partial' | 'follow_up' | 'surveillance' | 'special';
export type AuditStatus =
  | 'planned'
  | 'preparation'
  | 'in_progress'
  | 'reporting'
  | 'completed'
  | 'cancelled';
export type AuditConclusion =
  | 'conformant'
  | 'minor_nc'
  | 'major_nc'
  | 'not_conformant';

export interface ExternalAuditor {
  name: string;
  organization: string;
  role: string;
}

export interface AuditFinding {
  id: string;
  audit: string;
  reference: string;
  title: string;
  description: string;
  finding_type: FindingType;
  clause_reference: string;
  control_reference?: string;
  control_detail?: Control;
  evidence: string;
  risk_impact?: RiskLevel;
  auditee?: string;
  auditee_detail?: UserSummary;
  auditee_response: string;
  auditee_response_date?: string;
  status: FindingStatus;
  resolution_date?: string;
  resolution_notes: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  corrective_actions?: CorrectiveAction[];
}

export type FindingType =
  | 'nc_major'
  | 'nc_minor'
  | 'observation'
  | 'opportunity'
  | 'positive';

export type FindingStatus =
  | 'open'
  | 'pending'
  | 'action_planned'
  | 'in_progress'
  | 'verification'
  | 'closed';

// =============================================================================
// CORRECTIVE ACTIONS
// =============================================================================

export interface CorrectiveAction {
  id: string;
  organization: string;
  finding?: string;
  source_type: CorrectiveActionSource;
  source_reference: string;
  reference: string;
  title: string;
  problem_description: string;
  root_cause_analysis: string;
  root_cause: string;
  action_description: string;
  expected_outcome: string;
  responsible?: string;
  responsible_detail?: UserSummary;
  due_date: string;
  extension_date?: string;
  completion_date?: string;
  status: CorrectiveActionStatus;
  progress_percentage: number;
  effectiveness_review: string;
  is_effective?: boolean;
  effectiveness_reviewed_by?: string;
  effectiveness_reviewed_at?: string;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export type CorrectiveActionSource =
  | 'audit_finding'
  | 'management_review'
  | 'incident'
  | 'risk'
  | 'improvement'
  | 'external';

export type CorrectiveActionStatus =
  | 'open'
  | 'in_progress'
  | 'pending_verification'
  | 'verified'
  | 'closed'
  | 'cancelled';

// =============================================================================
// MANAGEMENT REVIEWS
// =============================================================================

export interface ManagementReview {
  id: string;
  organization: string;
  reference: string;
  title: string;
  review_date: string;
  chairperson?: string;
  chairperson_detail?: UserSummary;
  attendees?: ManagementReviewAttendee[];
  external_attendees: ExternalAttendee[];

  // Inputs (Clause 9.3.2)
  previous_actions_status: string;
  changes_internal_external: string;
  changes_interested_parties: string;
  nonconformities_summary: string;
  corrective_actions_status: string;
  monitoring_results: string;
  audit_results: string;
  objectives_fulfillment: string;
  risk_treatment_status: string;
  improvement_opportunities: string;
  additional_inputs: Record<string, unknown>;

  // Outputs (Clause 9.3.3)
  decisions: ReviewDecision[];
  continual_improvement_actions: ImprovementAction[];
  resource_needs: ResourceNeed[];

  isms_effectiveness_conclusion: string;
  overall_conclusion: string;
  next_review_date?: string;
  status: ManagementReviewStatus;
  minutes_document?: string;
  created_at: string;
  updated_at: string;
}

export type ManagementReviewStatus =
  | 'scheduled'
  | 'preparation'
  | 'conducted'
  | 'minutes_pending'
  | 'completed';

export interface ManagementReviewAttendee {
  id: string;
  user: string;
  user_detail?: UserSummary;
  role: string;
  attended: boolean;
}

export interface ExternalAttendee {
  name: string;
  organization: string;
  role: string;
}

export interface ReviewDecision {
  id: string;
  description: string;
  responsible?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ImprovementAction {
  id: string;
  description: string;
  responsible?: string;
  due_date?: string;
}

export interface ResourceNeed {
  id: string;
  description: string;
  type: 'human' | 'financial' | 'technical' | 'other';
  estimated_cost?: number;
  justification: string;
}

// =============================================================================
// INFORMATION ASSETS
// =============================================================================

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  asset_type: AssetType;
  parent?: string;
  is_active: boolean;
  order: number;
}

export type AssetType =
  | 'information'
  | 'software'
  | 'hardware'
  | 'service'
  | 'people'
  | 'intangible'
  | 'physical';

export interface InformationAsset {
  id: string;
  organization: string;
  asset_id: string;
  name: string;
  description: string;
  category: string;
  category_detail?: AssetCategory;
  confidentiality_level: ClassificationLevel;
  integrity_level: number;
  availability_level: number;
  business_value: BusinessValue;
  value_justification: string;
  asset_owner?: string;
  asset_owner_detail?: UserSummary;
  custodian?: string;
  custodian_detail?: UserSummary;
  department?: string;
  location: string;
  location_details: Record<string, unknown>;
  parent_asset?: string;
  lifecycle_status: LifecycleStatus;
  acquisition_date?: string;
  review_date?: string;
  retirement_date?: string;
  disposal_date?: string;
  disposal_method: string;
  metadata: Record<string, unknown>;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  linked_risks?: string[];
}

export type ClassificationLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'secret';

export type BusinessValue = 'low' | 'medium' | 'high' | 'critical';

export type LifecycleStatus =
  | 'planned'
  | 'development'
  | 'active'
  | 'maintenance'
  | 'retiring'
  | 'retired'
  | 'disposed';

// =============================================================================
// ISMS SCOPE & OBJECTIVES
// =============================================================================

export interface ISMSScope {
  id: string;
  organization: string;
  name: string;
  description: string;
  scope_statement: string;
  organizational_boundaries: string;
  geographical_boundaries: string;
  technological_boundaries: string;
  exclusions: ScopeExclusion[];
  interfaces: ScopeInterface[];
  internal_issues: ContextIssue[];
  external_issues: ContextIssue[];
  interested_parties: InterestedParty[];
  version: number;
  is_active: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScopeExclusion {
  control_code: string;
  justification: string;
}

export interface ScopeInterface {
  name: string;
  description: string;
  type: 'internal' | 'external';
}

export interface ContextIssue {
  id: string;
  description: string;
  type: string;
  impact: 'low' | 'medium' | 'high';
}

export interface InterestedParty {
  id: string;
  name: string;
  type: 'internal' | 'external';
  requirements: string[];
  expectations: string[];
}

export interface ISMSObjective {
  id: string;
  organization: string;
  code: string;
  title: string;
  description: string;
  related_policy?: string;
  target_value: string;
  measurement_method: string;
  measurement_frequency: MeasurementFrequency;
  responsible?: string;
  responsible_detail?: UserSummary;
  start_date: string;
  target_date: string;
  resources_needed: string;
  status: ObjectiveStatus;
  created_at: string;
  updated_at: string;
  measurements?: ISMSObjectiveMeasurement[];
  linked_controls?: string[];
}

export type MeasurementFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type ObjectiveStatus = 'draft' | 'active' | 'achieved' | 'not_achieved' | 'cancelled';

export interface ISMSObjectiveMeasurement {
  id: string;
  objective: string;
  measurement_date: string;
  period_start: string;
  period_end: string;
  actual_value: string;
  target_value: string;
  achievement_percentage: number;
  is_target_met: boolean;
  notes: string;
  evidence: string;
  measured_by?: string;
  created_at: string;
}

// =============================================================================
// SECURITY POLICIES
// =============================================================================

export interface SecurityPolicy {
  id: string;
  organization: string;
  code: string;
  title: string;
  description: string;
  policy_type: PolicyType;
  version: string;
  effective_date: string;
  review_date: string;
  expiry_date?: string;
  document?: string;
  content_summary: string;
  owner?: string;
  owner_detail?: UserSummary;
  reviewer?: string;
  approver?: string;
  applicable_to: PolicyApplicability;
  status: PolicyStatus;
  approved_at?: string;
  published_at?: string;
  requires_acknowledgment: boolean;
  created_at: string;
  updated_at: string;
  linked_controls?: string[];
  acknowledgments_count?: number;
  pending_acknowledgments_count?: number;
}

export type PolicyType =
  | 'policy'
  | 'standard'
  | 'procedure'
  | 'guideline'
  | 'instruction';

export type PolicyStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'retired';

export interface PolicyApplicability {
  all_personnel?: boolean;
  departments?: string[];
  roles?: string[];
  locations?: string[];
}

export interface PolicyAcknowledgment {
  id: string;
  policy: string;
  user: string;
  user_detail?: UserSummary;
  acknowledged_at: string;
  ip_address?: string;
  proof_hash: string;
}

// =============================================================================
// DASHBOARD & STATISTICS
// =============================================================================

export interface ISO27001Dashboard {
  // SoA Statistics
  soa_stats: {
    total_controls: number;
    applicable_controls: number;
    implemented_controls: number;
    implementation_percentage: number;
    by_category: CategoryStats[];
  };

  // Risk Statistics
  risk_stats: {
    total_risks: number;
    by_level: Record<RiskLevel, number>;
    treated_risks: number;
    accepted_risks: number;
    overdue_reviews: number;
  };

  // Audit Statistics
  audit_stats: {
    planned_audits: number;
    completed_audits: number;
    open_findings: number;
    overdue_findings: number;
    nc_major_count: number;
    nc_minor_count: number;
  };

  // Corrective Actions
  corrective_action_stats: {
    total: number;
    open: number;
    overdue: number;
    effectiveness_rate: number;
  };

  // Objectives
  objective_stats: {
    total: number;
    achieved: number;
    on_track: number;
    at_risk: number;
  };

  // Recent Activity
  recent_activities: RecentActivity[];

  // Upcoming Items
  upcoming_reviews: UpcomingItem[];
  upcoming_audits: UpcomingItem[];
}

export interface CategoryStats {
  category_code: string;
  category_name: string;
  total: number;
  applicable: number;
  implemented: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'risk' | 'audit' | 'finding' | 'action' | 'policy' | 'review';
  action: string;
  description: string;
  user?: UserSummary;
  timestamp: string;
}

export interface UpcomingItem {
  id: string;
  type: string;
  title: string;
  due_date: string;
  responsible?: UserSummary;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface UserSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

export interface ControlImplementationFormData {
  is_applicable: boolean;
  applicability_justification?: string;
  implementation_status: ImplementationStatus;
  implementation_percentage: number;
  implementation_description?: string;
  implementation_method?: string;
  control_owner?: string;
  evidence_description?: string;
  effectiveness?: EffectivenessLevel;
  effectiveness_notes?: string;
  target_implementation_date?: string;
  notes?: string;
}

export interface RiskFormData {
  reference: string;
  title: string;
  description: string;
  risk_type: RiskType;
  threat?: string;
  vulnerability?: string;
  risk_owner?: string;
  inherent_impact: number;
  inherent_likelihood: number;
  current_impact: number;
  current_likelihood: number;
  existing_controls_description?: string;
  treatment_option?: TreatmentOption;
  treatment_justification?: string;
}

export interface AuditFindingFormData {
  reference: string;
  title: string;
  description: string;
  finding_type: FindingType;
  clause_reference?: string;
  control_reference?: string;
  evidence: string;
  risk_impact?: RiskLevel;
  auditee?: string;
}

export interface CorrectiveActionFormData {
  finding?: string;
  source_type: CorrectiveActionSource;
  source_reference?: string;
  reference: string;
  title: string;
  problem_description: string;
  root_cause_analysis?: string;
  root_cause?: string;
  action_description: string;
  expected_outcome?: string;
  responsible?: string;
  due_date: string;
}
