// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  department?: Department;
  organization: Organization;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface Department {
  id: string;
  name: string;
  parentId?: string;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  theme?: {
    primaryColor?: string;
    logo?: string;
  };
  features?: {
    signatures?: boolean;
    workflows?: boolean;
    archives?: boolean;
  };
}

// Document types
export interface Document {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  version: number;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
  tags: string[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  lockedBy?: User;
  lockedAt?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  icon: string;
  allowedExtensions: string[];
  maxFileSize: number;
  requiredMetadata?: MetadataField[];
}

export interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
}

export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'in_workflow'
  | 'approved'
  | 'rejected'
  | 'signed'
  | 'archived';

// Workflow types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStepTemplate[];
  isActive: boolean;
  createdBy: User;
  createdAt: string;
}

export interface WorkflowStepTemplate {
  id: string;
  order: number;
  name: string;
  type: WorkflowStepType;
  assigneeType: 'user' | 'role' | 'department';
  assigneeId: string;
  validationRule: 'all' | 'any' | 'majority';
  deadline?: number; // in hours
  canDelegate: boolean;
}

export type WorkflowStepType =
  | 'approval'
  | 'signature'
  | 'review'
  | 'information';

export interface WorkflowInstance {
  id: string;
  template: WorkflowTemplate;
  document: Document;
  status: WorkflowStatus;
  currentStep: number;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowStep {
  id: string;
  template: WorkflowStepTemplate;
  status: WorkflowStepStatus;
  assignees: WorkflowAssignee[];
  dueDate?: string;
  completedAt?: string;
}

export interface WorkflowAssignee {
  id: string;
  user: User;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  comment?: string;
  actionAt?: string;
}

export type WorkflowStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type WorkflowStepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped';

// Task types (for user's pending actions)
export interface Task {
  id: string;
  workflowInstance: WorkflowInstance;
  step: WorkflowStep;
  document: Document;
  type: WorkflowStepType;
  status: 'pending' | 'completed';
  dueDate?: string;
  createdAt: string;
}

// Signature types
export interface UserSignature {
  id: string;
  type: 'formal' | 'initials' | 'paraph';
  imageUrl: string;
  isDefault: boolean;
  createdAt: string;
}

export interface DocumentSignature {
  id: string;
  document: Document;
  user: User;
  signature: UserSignature;
  page: number;
  position: { x: number; y: number };
  timestamp: string;
  location?: { latitude: number; longitude: number };
  ipAddress: string;
  hash: string;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'document_approved'
  | 'document_rejected'
  | 'document_signed'
  | 'workflow_completed'
  | 'deadline_reminder'
  | 'mention';

// API types
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
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
  firstName: string;
  lastName: string;
  organizationCode?: string;
}
