/**
 * Core TypeScript types for ADVIST
 * Version 2.0 - Enhanced with all v2 features
 */

// User roles — aligned with Atlas Studio Suite licence_seats.role
// Source of truth: licence_seats table (Atlas Studio universal seat system)
export type UserRole = 'app_super_admin' | 'app_admin' | 'editor' | 'viewer';

// Roles that grant administrative access to the application
export const ADMIN_SEAT_ROLES: readonly UserRole[] = ['app_super_admin', 'app_admin'];

// Slug of the Advist product in Atlas Studio's products table.
// Used to scope licence_seats / licences queries to Advist only — without
// this filter, a user holding a seat for another suite app would be
// misidentified as having Advist access.
export const ADVIST_PRODUCT_SLUG = 'advist';

export function isAdminUser(user: { role?: UserRole | null } | null | undefined): boolean {
  return !!user?.role && ADMIN_SEAT_ROLES.includes(user.role);
}

// User types
export interface User {
  id: string; // UUID from backend
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role: UserRole; // from licence_seats.role
  organization: Organization | null;
  department?: Department;
  is_active: boolean;
  // Atlas Studio platform-level super admin (separate from app roles).
  // Sourced from auth.users.app_metadata.is_atlas_super_admin.
  is_atlas_super_admin?: boolean;
  language: string;
  timezone: string;
  created_at: string;
  last_login?: string;
  color?: string; // For track changes
}

export interface Organization {
  id: string; // UUID from backend
  name: string;
  slug: string;
  logo?: string;
  is_active: boolean;
  // v2: Quotas and limits
  quotas: OrganizationQuotas;
  // Subscription plan/tier is owned by Atlas Studio (licences table) — never
  // duplicated on the local organization. Read it via useSubscriptionGuard.
  ohada_compliant: boolean;
  country: string;
  working_days: number[]; // 0-6, Sunday-Saturday
}

export interface OrganizationQuotas {
  max_users: number;
  current_users: number;
  max_storage_gb: number;
  current_storage_gb: number;
  max_documents: number;
  current_documents: number;
  max_active_workflows: number;
  current_active_workflows: number;
}

export interface Department {
  id: string; // UUID from backend
  name: string;
  organization: string; // UUID reference
  parent?: string; // UUID reference
  manager?: string; // UUID reference
}

export interface Role {
  id: string; // UUID from backend
  name: string;
  permissions: string[];
  organization: string; // UUID reference
}

// Document types
export interface Document {
  id: string; // UUID from backend
  title: string;
  description: string;
  document_type: DocumentType | null;
  owner: User;
  organization: Organization;
  current_version: number;
  file_size: number;
  is_locked: boolean;
  locked_by?: User;
  tags: Tag[];
  metadata: Record<string, unknown>;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  // v2: Document linking and folders
  folder?: DocumentFolder;
  parent_document?: string; // UUID reference
  linked_documents: DocumentLink[];
  file_hash: string;
  is_duplicate: boolean;
  duplicate_of?: string; // UUID reference
  // v2: Track changes
  track_changes_enabled: boolean;
  modifications: DocumentModification[];
  // v2: Confidentiality for conditional rules
  confidentiality_level: 'public' | 'internal' | 'confidential' | 'secret';
  amount?: number; // For conditional workflow rules
}

// v2: Document folders
export interface DocumentFolder {
  id: string; // UUID from backend
  name: string;
  description?: string;
  parent?: string; // UUID reference
  organization: string; // UUID reference
  created_by: User;
  created_at: string;
  documents_count: number;
  subfolders: DocumentFolder[];
}

// v2: Document links
export interface DocumentLink {
  id: string; // UUID from backend
  source_document: string; // UUID reference
  target_document: string; // UUID reference
  link_type: 'parent_child' | 'reference' | 'amendment' | 'annex';
  created_by: User;
  created_at: string;
}

// v2: Track changes
export interface DocumentModification {
  id: string; // UUID from backend
  document: string; // UUID reference
  version: number;
  user: User;
  modification_type: 'addition' | 'deletion' | 'replacement';
  page?: number;
  position_start: number;
  position_end: number;
  original_content?: string;
  new_content?: string;
  // For Excel
  cell_reference?: string;
  is_formula_protected: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by?: User;
  reviewed_at?: string;
  created_at: string;
}

export interface DocumentType {
  id: string; // UUID from backend
  name: string;
  description: string;
  allowed_extensions: string[];
  max_size: number;
  requires_signature: boolean;
  default_workflow?: string; // UUID reference
  // v2: Requires paraph per page
  requires_paraph: boolean;
  paraph_all_pages: boolean;
}

export interface DocumentVersion {
  id: string; // UUID from backend
  document: string; // UUID reference
  version_number: number;
  file: string;
  original_filename: string;
  file_size: number;
  file_hash: string;
  uploaded_by: User;
  comment: string;
  created_at: string;
  // v2: Track changes snapshot
  modifications_snapshot?: DocumentModification[];
}

export interface Tag {
  id: string; // UUID from backend
  name: string;
  color: string;
}

export type DocumentStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'cancelled'
  | 'signature_refused';

// v2: Document comments (distinct from annotations)
export interface DocumentComment {
  id: string; // UUID from backend
  document: string; // UUID reference
  user: User;
  content: string;
  parent_comment?: string; // UUID reference
  replies: DocumentComment[];
  mentions: User[];
  is_resolved: boolean;
  resolved_by?: User;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// Workflow types
export interface WorkflowTemplate {
  id: string; // UUID from backend
  name: string;
  description: string;
  organization: string; // UUID reference
  document_types: string[]; // UUID references
  steps_config: WorkflowStepConfig[];
  is_active: boolean;
  created_at: string;
  // v2: Versioning
  version: number;
  previous_version?: string; // UUID reference
  version_history: WorkflowTemplateVersion[];
  // v2: Conditional rules
  conditional_rules: WorkflowConditionalRule[];
  // v2: Fast-track configuration
  fast_track_enabled: boolean;
  fast_track_steps?: WorkflowStepConfig[];
  fast_track_deadline_hours?: number;
}

// v2: Workflow template versioning
export interface WorkflowTemplateVersion {
  id: string; // UUID from backend
  template_id: string; // UUID reference
  version: number;
  steps_config: WorkflowStepConfig[];
  conditional_rules: WorkflowConditionalRule[];
  created_at: string;
  created_by: User;
  change_description?: string;
}

// v2: Conditional workflow rules
export interface WorkflowConditionalRule {
  id: string; // UUID from backend
  name: string;
  condition_type: 'amount' | 'confidentiality' | 'document_type' | 'department' | 'metadata';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: string | number | string[];
  // Action when condition is met
  action_type: 'add_step' | 'add_assignee' | 'skip_step' | 'escalate' | 'require_double_approval';
  action_config: {
    step_config?: WorkflowStepConfig;
    assignee_user_id?: string; // UUID reference
    assignee_role_id?: string; // UUID reference
    step_to_skip?: number;
    escalation_user_id?: string; // UUID reference
  };
  priority: number; // Order of rule evaluation
  is_active: boolean;
}

export interface WorkflowStepConfig {
  order: number;
  name: string;
  type: 'approval' | 'signature' | 'review' | 'information' | 'paraph';
  assignee_type: 'user' | 'role' | 'department';
  assignee_id: string; // UUID reference
  validation_rule: 'all' | 'any' | 'majority';
  deadline_days?: number;
  can_delegate: boolean;
  // v2: Parallel/Sequential signatures
  signature_mode: 'sequential' | 'parallel' | 'mixed';
  parallel_group?: number; // Group ID for parallel signatures
  // v2: Paraph configuration
  requires_paraph_all_pages?: boolean;
}

export interface WorkflowInstance {
  id: string; // UUID from backend
  template: WorkflowTemplate;
  document: Document;
  status: WorkflowStatus;
  current_step: number;
  initiated_by: User;
  started_at: string;
  completed_at?: string;
  steps: WorkflowStep[];
  // v2: Versioning - snapshot of template at launch time
  template_version: number;
  template_snapshot: WorkflowTemplate;
  // v2: Recall/Cancel
  cancelled_at?: string;
  cancelled_by?: User;
  cancellation_reason?: string;
  // v2: Fast-track mode
  is_fast_track: boolean;
  fast_track_reason?: string;
  // v2: Reassignments history
  reassignments: WorkflowReassignment[];
}

// v2: Reassignment tracking
export interface WorkflowReassignment {
  id: string; // UUID from backend
  workflow: string; // UUID reference
  step: number;
  original_assignee: User;
  new_assignee: User;
  reason: string;
  reassigned_by: User;
  reassigned_at: string;
  type: 'delegation' | 'emergency' | 'departure';
}

export interface WorkflowStep {
  id: string; // UUID from backend
  workflow: string; // UUID reference
  step_number: number;
  name: string;
  type: string;
  status: WorkflowStepStatus;
  deadline?: string;
  assignees: WorkflowAssignee[];
  // v2: Parallel signature support
  signature_mode: 'sequential' | 'parallel' | 'mixed';
  parallel_group?: number;
  // v2: Escalation
  escalated: boolean;
  escalated_at?: string;
  escalated_to?: User;
}

export interface WorkflowAssignee {
  id: string; // UUID from backend
  step: string; // UUID reference
  user: User;
  status: 'pending' | 'approved' | 'rejected' | 'delegated' | 'signature_refused';
  comment?: string;
  acted_at?: string;
  // v2: Delegation tracking
  delegated_to?: User;
  delegation_reason?: string;
  // v2: Signature refusal (distinct from rejection)
  refusal_is_definitive?: boolean;
}

export type WorkflowStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'recalled'
  | 'signature_refused';
export type WorkflowStepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'skipped'
  | 'escalated';

// Task type (for my-tasks)
export interface Task {
  id: string; // UUID from backend
  step: WorkflowStep;
  document: Document;
  workflow: WorkflowInstance;
  deadline?: string;
  assigned_at: string;
}

// Signature types
export interface UserSignature {
  id: string; // UUID from backend
  user: string; // UUID reference
  name: string;
  type: 'formal' | 'initials' | 'paraph';
  image: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DocumentSignature {
  id: string; // UUID from backend
  document: string; // UUID reference
  user: User;
  signature: UserSignature;
  page: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  signed_at: string;
  ip_address: string;
  certificate_hash: string;
  // v2: OHADA compliance
  timestamp_authority?: string;
  legal_value: boolean;
}

// v2: Paraph per page tracking
export interface DocumentParaph {
  id: string; // UUID from backend
  document: string; // UUID reference
  user: User;
  signature: UserSignature;
  page: number;
  position_x: number;
  position_y: number;
  paraphed_at: string;
  ip_address: string;
}

// v2: Signature request with refusal support
export interface SignatureRequest {
  id: string; // UUID from backend
  document: Document;
  workflow_step: number;
  requester: User;
  signer: User;
  status: 'pending' | 'signed' | 'rejected' | 'refused_definitive';
  // v2: Definitive refusal
  refusal_reason?: string;
  refusal_is_definitive: boolean;
  // v2: Paraph requirement
  requires_paraph: boolean;
  paraph_all_pages: boolean;
  pages_to_paraph: number[];
  paraphs_completed: DocumentParaph[];
  // Signature mode
  signature_mode: 'sequential' | 'parallel';
  order_in_group?: number;
  created_at: string;
  expires_at?: string;
  signed_at?: string;
  refused_at?: string;
}

// v2: Data export for portability
export interface DataExportRequest {
  id: string; // UUID from backend
  organization: string; // UUID reference
  requested_by: User;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_format: 'zip' | 'json' | 'xml';
  include_documents: boolean;
  include_versions: boolean;
  include_metadata: boolean;
  include_audit_logs: boolean;
  include_signatures: boolean;
  download_url?: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
  file_size?: number;
}

// v2: Offline sync support
export interface OfflineAction {
  id: string;
  type: 'comment' | 'validation' | 'annotation';
  document_id: string; // UUID reference
  workflow_id?: string; // UUID reference
  step_id?: string; // UUID reference
  payload: Record<string, unknown>;
  created_at: string;
  synced: boolean;
  synced_at?: string;
  error?: string;
}

// Notification types
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'whatsapp' | 'sms';

export interface Notification {
  id: string; // UUID from backend
  subject: string;
  body: string;
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  action_url?: string;
  related_document?: string; // UUID reference
  created_at: string;
  read_at?: string;
  // WhatsApp specific
  whatsapp_message_id?: string;
  phone_number?: string;
}

// User notification preferences
export interface NotificationPreferences {
  email_enabled: boolean;
  email_address?: string;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number?: string;
  sms_enabled: boolean;
  sms_number?: string;
  // Notification types preferences
  workflow_updates: NotificationChannel[];
  document_comments: NotificationChannel[];
  signature_requests: NotificationChannel[];
  deadline_reminders: NotificationChannel[];
  system_alerts: NotificationChannel[];
  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string; // HH:mm format
  quiet_hours_end?: string;
  timezone: string;
}

// WhatsApp message templates
export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: 'authentication' | 'marketing' | 'utility';
  components: WhatsAppTemplateComponent[];
  status: 'approved' | 'pending' | 'rejected';
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  format?: 'text' | 'image' | 'document' | 'video';
  text?: string;
  parameters?: string[];
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_name?: string;
}

// Support ticket types
export type SupportTicketCategory = 'technical' | 'billing' | 'general';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  ticket_id: string;
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  organization: string;
  organization_name: string;
  created_by: string;
  created_by_name: string;
  created_by_email?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  messages?: SupportMessage[];
  messages_count?: number;
}

export interface SupportMessage {
  id: string;
  ticket: string;
  author: string;
  author_name: string;
  author_email: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface SupportTicketStats {
  total: number;
  new: number;
  in_progress: number;
  waiting: number;
  resolved: number;
  closed: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  by_category: {
    technical: number;
    billing: number;
    general: number;
  };
}

// Marketing types
export type SocialPlatform = 'facebook' | 'linkedin' | 'twitter' | 'instagram' | 'whatsapp';
export type PublicationStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
export type PublicationResultStatus = 'pending' | 'success' | 'failed';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  platform_display: string;
  account_name: string;
  account_id: string;
  is_active: boolean;
  connected_by: string;
  connected_by_name: string;
  connected_at: string;
  metadata: Record<string, unknown>;
  token_expires_at?: string;
}

export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  media_urls: string[];
  platforms: SocialPlatform[];
  category: string;
  tags: string[];
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationResult {
  id: string;
  platform: SocialPlatform;
  external_post_id: string;
  external_url: string;
  status: PublicationResultStatus;
  status_display: string;
  error_message: string;
  published_at?: string;
  metrics: PublicationMetrics;
  metrics_updated_at?: string;
}

export interface PublicationMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
}

export interface Publication {
  id: string;
  title: string;
  content: string;
  media?: string;
  media_url?: string;
  media_type?: string;
  platforms: SocialPlatform[];
  status: PublicationStatus;
  status_display: string;
  scheduled_at?: string;
  published_at?: string;
  template?: string;
  template_name?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  results?: PublicationResult[];
  results_summary?: {
    total: number;
    success: number;
    failed: number;
  };
}

export interface PublicationCreateData {
  title: string;
  content: string;
  media?: File;
  media_url?: string;
  platforms: SocialPlatform[];
  scheduled_at?: string;
  template?: string;
}

export interface PublicationUpdateData {
  title?: string;
  content?: string;
  media?: File;
  media_url?: string;
  platforms?: SocialPlatform[];
  scheduled_at?: string;
  status?: 'draft' | 'scheduled';
}

export interface MarketingAnalytics {
  period_days: number;
  total_publications: number;
  total_published: number;
  total_failed: number;
  metrics: PublicationMetrics;
  by_platform: Record<
    SocialPlatform,
    {
      posts: number;
      likes: number;
      comments: number;
      shares: number;
    }
  >;
  by_status: {
    draft: number;
    scheduled: number;
    published: number;
    failed: number;
  };
}

// Blog types
export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  status_display: string;
  is_featured: boolean;
  views_count: number;
  author: string;
  author_name: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostCreateData {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featured_image?: File;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  category?: string;
  tags?: string[];
  status?: BlogPostStatus;
  is_featured?: boolean;
}

// Newsletter types
export type SubscriberType = 'prospect' | 'client';
export type NewsletterStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  subscriber_type: SubscriberType;
  type_display: string;
  user?: string;
  user_email?: string;
  organization?: string;
  organization_name?: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
  preferences: Record<string, boolean>;
}

export interface SubscriberStats {
  total: number;
  active: number;
  prospects: number;
  clients: number;
  unsubscribed: number;
}

export interface Newsletter {
  id: string;
  subject: string;
  preview_text: string;
  content: string;
  target_audience: SubscriberType[];
  status: NewsletterStatus;
  status_display: string;
  scheduled_at?: string;
  sent_at?: string;
  recipients_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterCreateData {
  subject: string;
  preview_text?: string;
  content: string;
  target_audience: SubscriberType[];
  scheduled_at?: string;
}

// =============================================================================
// eIDAS & RGPD Compliance Types
// =============================================================================

// Consent Management
export type ConsentLegalBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interest'
  | 'public_interest'
  | 'legitimate_interest';

export interface ConsentPurpose {
  id: string;
  code: string;
  name: string;
  description: string;
  legal_basis: ConsentLegalBasis;
  is_required: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  id: string;
  user?: string;
  user_email?: string;
  external_email?: string;
  external_name?: string;
  purpose: string;
  purpose_name: string;
  purpose_code: string;
  purpose_version: number;
  is_granted: boolean;
  granted_at: string;
  withdrawn_at?: string;
  expires_at?: string;
  ip_address: string;
  user_agent: string;
  consent_form_version: string;
  consent_text_hash: string;
  proof_hash: string;
  metadata: Record<string, unknown>;
}

export interface ConsentFormData {
  required: ConsentPurpose[];
  optional: ConsentPurpose[];
  version: number;
}

// Data Subject Rights (DSAR)
export type DSRRequestType =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'restriction'
  | 'portability'
  | 'objection'
  | 'automated_decision';
export type DSRStatus =
  | 'pending'
  | 'identity_verification'
  | 'processing'
  | 'extension_requested'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface DataSubjectRequest {
  id: string;
  reference_number: string;
  user?: string;
  requester_email: string;
  requester_name: string;
  requester_phone?: string;
  identity_verified: boolean;
  identity_verification_method?: string;
  identity_verification_date?: string;
  request_type: DSRRequestType;
  request_type_display: string;
  description?: string;
  specific_data: string[];
  status: DSRStatus;
  status_display: string;
  requested_at: string;
  deadline: string;
  extension_reason?: string;
  completed_at?: string;
  response_summary?: string;
  response_file?: string;
  rejection_reason?: string;
  assigned_to?: string;
  ip_address?: string;
  organization: string;
  is_overdue: boolean;
  days_remaining?: number;
}

export interface DataSubjectRequestCreateData {
  requester_email: string;
  requester_name: string;
  requester_phone?: string;
  request_type: DSRRequestType;
  description?: string;
  specific_data?: string[];
}

// Processing Register (RGPD Art. 30)
export interface ProcessingActivity {
  id: string;
  organization: string;
  name: string;
  code: string;
  description: string;
  controller_name: string;
  controller_contact: string;
  dpo_contact?: string;
  purposes: string;
  legal_basis: ConsentLegalBasis;
  legal_basis_display: string;
  legitimate_interest_assessment?: string;
  data_categories: string[];
  sensitive_data: boolean;
  data_subjects: string[];
  recipients: string[];
  third_party_processors: Array<{
    name: string;
    purpose: string;
    country: string;
  }>;
  international_transfers: boolean;
  transfer_countries: string[];
  transfer_safeguards?: string;
  retention_period: string;
  retention_criteria?: string;
  security_measures: string;
  requires_dpia: boolean;
  dpia_reference?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_review?: string;
  next_review?: string;
}

// Data Retention
export type RetentionAction = 'delete' | 'anonymize' | 'archive';

export interface DataRetentionPolicy {
  id: string;
  organization: string;
  data_category: string;
  description: string;
  retention_period_days: number;
  archive_period_days: number;
  action_after_retention: RetentionAction;
  action_display: string;
  legal_basis: string;
  legal_reference?: string;
  auto_apply: boolean;
  notify_before_days: number;
  is_active: boolean;
  total_retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface DataRetentionExecution {
  id: string;
  policy: string;
  policy_name: string;
  executed_at: string;
  records_processed: number;
  records_deleted: number;
  records_anonymized: number;
  records_archived: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  execution_log: Array<{
    timestamp: string;
    action: string;
    details?: Record<string, unknown>;
  }>;
}

// Data Breach (RGPD Art. 33-34)
export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BreachType = 'confidentiality' | 'integrity' | 'availability';
export type BreachStatus =
  | 'detected'
  | 'investigating'
  | 'contained'
  | 'notified_cnil'
  | 'notified_users'
  | 'resolved'
  | 'closed';

export interface DataBreach {
  id: string;
  reference_number: string;
  organization: string;
  detected_at: string;
  detected_by?: string;
  detection_method: string;
  title: string;
  description: string;
  breach_type: BreachType;
  breach_type_display: string;
  severity: BreachSeverity;
  severity_display: string;
  data_categories_affected: string[];
  records_affected_count: number;
  individuals_affected_count: number;
  risk_to_rights: string;
  risk_level: BreachSeverity;
  containment_measures: string;
  remediation_measures?: string;
  status: BreachStatus;
  status_display: string;
  cnil_notification_required: boolean;
  cnil_notified_at?: string;
  cnil_reference?: string;
  cnil_notification_content?: string;
  user_notification_required: boolean;
  users_notified_at?: string;
  user_notification_method?: string;
  user_notification_content?: string;
  resolved_at?: string;
  lessons_learned?: string;
  preventive_measures?: string;
  cnil_deadline: string;
  is_cnil_deadline_passed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataBreachCreateData {
  detected_at: string;
  detection_method: string;
  title: string;
  description: string;
  breach_type: BreachType;
  severity: BreachSeverity;
  data_categories_affected: string[];
  records_affected_count: number;
  individuals_affected_count: number;
  risk_to_rights: string;
  risk_level: BreachSeverity;
  containment_measures: string;
}

// Privacy Impact Assessment (AIPD/PIA)
export type PIAStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived';
export type RiskLevel = 'acceptable' | 'tolerable' | 'unacceptable';

export interface PIARisk {
  risk: string;
  probability: 'high' | 'medium' | 'low';
  severity: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface PrivacyImpactAssessment {
  id: string;
  reference_number: string;
  organization: string;
  processing_activity?: string;
  processing_activity_name?: string;
  title: string;
  description: string;
  necessity_assessment: string;
  proportionality_assessment: string;
  risks: PIARisk[];
  mitigation_measures: string[];
  residual_risk_level?: RiskLevel;
  conclusion?: string;
  recommendations?: string;
  dpo_consulted: boolean;
  dpo_opinion?: string;
  dpo_consultation_date?: string;
  cnil_consultation_required: boolean;
  cnil_consulted_at?: string;
  cnil_reference?: string;
  cnil_response?: string;
  status: PIAStatus;
  status_display: string;
  created_by: string;
  created_by_name: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
  next_review_date?: string;
}

// eIDAS Signature Levels
export type SignatureLevel = 'simple' | 'advanced' | 'qualified';
export type AuthenticationMethod =
  | 'email_otp'
  | 'sms_otp'
  | 'totp'
  | 'franceconnect'
  | 'franceconnect_plus'
  | 'video_identification'
  | 'id_document'
  | 'certificate';

export interface SignatureProofFile {
  id: string;
  reference_number: string;
  document: string;
  document_title: string;
  document_version: string;
  document_hash_sha256: string;
  document_hash_sha512?: string;
  document_size: number;
  signer?: string;
  signer_email: string;
  signer_external_email?: string;
  signer_name: string;
  signer_organization?: string;
  authentication_method: AuthenticationMethod;
  authentication_timestamp: string;
  signature_timestamp: string;
  ip_address: string;
  user_agent: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  device_fingerprint?: string;
  signature_level: SignatureLevel;
  certificate_issuer?: string;
  certificate_serial?: string;
  certificate_subject?: string;
  certificate_valid_from?: string;
  certificate_valid_to?: string;
  timestamp_authority?: string;
  timestamp_hash?: string;
  trust_service_provider?: string;
  trust_service_reference?: string;
  signature_hash: string;
  workflow_instance?: string;
  workflow_step?: number;
  previous_proofs: string[];
  proof_document?: string;
  proof_document_hash?: string;
  proof_chain_hash: string;
  proof_json: SignatureProofJSON;
  created_at: string;
}

export interface SignatureProofJSON {
  document: {
    nom: string;
    hash_sha256: string;
    hash_sha512?: string;
    taille: number;
    date_creation: string;
  };
  signataire: {
    identite: string;
    email: string;
    organisation?: string;
    methode_authentification: string;
    authentification_timestamp: string;
    adresse_ip: string;
    user_agent: string;
    geolocalisation?: {
      latitude: number;
      longitude: number;
      city?: string;
      country?: string;
    };
  };
  signature: {
    reference: string;
    date_heure: string;
    niveau: SignatureLevel;
    hash_signature: string;
    certificat: {
      emetteur?: string;
      numero_serie?: string;
      sujet?: string;
      valide_du?: string;
      valide_jusqua?: string;
    };
    horodatage_qualifie: {
      autorite?: string;
      hash?: string;
    };
    prestataire_confiance: {
      nom?: string;
      reference?: string;
    };
  };
  workflow: {
    instance_id?: string;
    etape?: number;
    signatures_precedentes: string[];
  };
  integrite: {
    hash_chaine_preuves: string;
    genere_le: string;
  };
}

// eIDAS Trust Services
export interface QualifiedTimestamp {
  id: string;
  document?: string;
  document_title?: string;
  data_hash: string;
  hash_algorithm: string;
  timestamp_authority: string;
  timestamp_policy_oid?: string;
  timestamp_token_base64: string;
  serial_number: string;
  timestamp: string;
  accuracy_microseconds: number;
  is_verified: boolean;
  verification_date?: string;
  verification_result: Record<string, unknown>;
  created_at: string;
}

export type SealLevel = 'simple' | 'advanced' | 'qualified';

export interface ElectronicSeal {
  id: string;
  organization: string;
  organization_name: string;
  document: string;
  document_title: string;
  seal_level: SealLevel;
  certificate_issuer: string;
  certificate_serial: string;
  certificate_subject: string;
  document_hash: string;
  seal_timestamp: string;
  seal_value_base64: string;
  trust_service_provider: string;
  created_at: string;
}

export type RegisteredDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'expired';

export interface RegisteredDelivery {
  id: string;
  reference_number: string;
  sender: string;
  sender_name: string;
  sender_organization: string;
  recipient_email: string;
  recipient_name: string;
  document: string;
  document_title: string;
  document_hash: string;
  status: RegisteredDeliveryStatus;
  status_display: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  expires_at: string;
  sending_proof: Record<string, unknown>;
  delivery_proof: Record<string, unknown>;
  reading_proof: Record<string, unknown>;
  trust_service_provider: string;
  provider_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisteredDeliveryCreateData {
  recipient_email: string;
  recipient_name: string;
  document: string;
  expires_at: string;
}

export type ArchiveFormat = 'pdf_a' | 'pdf_a3' | 'original';

export interface QualifiedArchive {
  id: string;
  reference_number: string;
  organization: string;
  organization_name: string;
  document: string;
  document_title: string;
  document_hash_sha256: string;
  document_hash_sha512: string;
  archived_at: string;
  archive_until: string;
  archive_format: ArchiveFormat;
  integrity_checks: Array<{
    checked_at: string;
    sha256_valid: boolean;
    sha512_valid: boolean;
  }>;
  last_integrity_check?: string;
  integrity_valid: boolean;
  trust_service_provider: string;
  archive_reference: string;
  archived_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AttributeType =
  | 'role'
  | 'authorization'
  | 'qualification'
  | 'mandate'
  | 'membership'
  | 'custom';

export interface AttributeAttestation {
  id: string;
  reference_number: string;
  subject_user: string;
  subject_user_name: string;
  subject_organization: string;
  attribute_type: AttributeType;
  attribute_type_display: string;
  attribute_name: string;
  attribute_value: Record<string, unknown>;
  attribute_description?: string;
  issued_at: string;
  valid_from: string;
  valid_until: string;
  is_revoked: boolean;
  revoked_at?: string;
  revocation_reason?: string;
  issuer_organization: string;
  issuer_user: string;
  issuer_user_name: string;
  trust_service_provider: string;
  attestation_reference?: string;
  attestation_hash: string;
  created_at: string;
}

// Compliance Dashboard
export interface ComplianceDashboard {
  // Consent stats
  total_consents: number;
  active_consents: number;
  withdrawn_consents: number;
  consent_rate: number;

  // DSAR stats
  total_requests: number;
  pending_requests: number;
  overdue_requests: number;
  average_response_days: number;

  // Breach stats
  total_breaches: number;
  open_breaches: number;
  breaches_requiring_cnil: number;

  // Processing register
  total_processing_activities: number;
  activities_requiring_review: number;

  // Signatures
  total_signatures: number;
  qualified_signatures: number;
  advanced_signatures: number;
  simple_signatures: number;
}

// Data Export
export interface DataExportOptions {
  format: 'json' | 'xml' | 'pdf';
  include_documents?: boolean;
  include_signatures?: boolean;
  include_consents?: boolean;
  include_audit_logs?: boolean;
}

// =============================================================================
// ISO 27001 ISMS Types (re-exported from dedicated module)
// =============================================================================
export * from './iso27001';
