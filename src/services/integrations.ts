/**
 * Integration Services API
 * Supports Microsoft 365, Google Workspace, Sage, SAP, and Salesforce integrations
 * Migrated from legacy api stub to direct Supabase queries.
 */
import { supabase } from '../lib/supabase';
import { invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';

// ==========================================
// Types
// ==========================================

export type IntegrationProvider =
  | 'microsoft_365'
  | 'google_workspace'
  | 'sage_100'
  | 'sage_x3'
  | 'sage_bc'
  | 'sap_b1'
  | 'sap_s4'
  | 'salesforce';

export type IntegrationStatus = 'pending' | 'connected' | 'expired' | 'error' | 'disconnected';

export type SyncDirection = 'import_only' | 'export_only' | 'bidirectional';

export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider;
  provider_display: string;
  name: string;
  status: IntegrationStatus;
  status_display: string;
  is_token_expired: boolean;
  last_sync_at: string | null;
  last_error: string;
  sync_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConnectionDetail extends IntegrationConnection {
  document_mappings: IntegrationDocumentMapping[];
  sync_mappings: IntegrationSyncMapping[];
  recent_logs: IntegrationSyncLog[];
}

export interface IntegrationDocumentMapping {
  id: string;
  integration: string;
  external_document_type: string;
  external_document_code: string;
  document_type: string;
  document_type_name: string;
  field_mappings: Record<string, string>;
  sync_direction: SyncDirection;
  sync_direction_display: string;
  auto_start_workflow: boolean;
  workflow_template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSyncMapping {
  id: string;
  integration: string;
  external_folder_id: string;
  external_folder_path: string;
  local_folder_path: string;
  document_type: string;
  document_type_name: string;
  sync_direction: SyncDirection;
  auto_sync: boolean;
  sync_interval_minutes: number;
  include_patterns: string[];
  exclude_patterns: string[];
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSyncLog {
  id: string;
  integration: string;
  sync_type: string;
  status: string;
  status_display: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: Array<{ error: string; document_id?: string }>;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface IntegrationWorkflowTrigger {
  id: string;
  integration: string;
  name: string;
  description: string;
  trigger_event: string;
  trigger_event_display: string;
  trigger_conditions: Record<string, unknown>;
  action_type: string;
  action_type_display: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  execution_count: number;
  last_execution_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CloudFolder {
  id: string;
  name: string;
  path: string;
  parent_id: string | null;
  web_url: string | null;
  child_count: number;
}

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  mime_type: string;
  size: number;
  created_at: string;
  modified_at: string;
  web_url: string | null;
  download_url: string | null;
}

export interface ERPDocument {
  id: string;
  doc_type: string;
  doc_number: string;
  status: string;
  date: string;
  due_date: string | null;
  total_amount: number;
  currency: string;
  vendor_code: string | null;
  vendor_name: string | null;
  customer_code: string | null;
  customer_name: string | null;
  lines: unknown[];
  metadata: Record<string, unknown>;
}

export interface ERPCredentials {
  api_url: string;
  username: string;
  password: string;
  company_code?: string;
  database_name?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details: Record<string, unknown>;
}

// ==========================================
// Provider Configuration
// ==========================================

export const INTEGRATION_PROVIDERS: Record<
  IntegrationProvider,
  {
    name: string;
    category: 'cloud' | 'erp' | 'crm';
    icon: string;
    description: string;
    authType: 'oauth' | 'credentials';
    features: string[];
  }
> = {
  microsoft_365: {
    name: 'Microsoft 365',
    category: 'cloud',
    icon: 'microsoft',
    description: 'SharePoint, OneDrive, Outlook, Teams',
    authType: 'oauth',
    features: ['file_sync', 'calendar', 'email', 'notifications'],
  },
  google_workspace: {
    name: 'Google Workspace',
    category: 'cloud',
    icon: 'google',
    description: 'Google Drive, Gmail, Calendar',
    authType: 'oauth',
    features: ['file_sync', 'calendar', 'email'],
  },
  sage_100: {
    name: 'Sage 100',
    category: 'erp',
    icon: 'sage',
    description: 'Comptabilité, Gestion commerciale',
    authType: 'credentials',
    features: ['documents', 'vendors', 'customers'],
  },
  sage_x3: {
    name: 'Sage X3',
    category: 'erp',
    icon: 'sage',
    description: 'ERP entreprise',
    authType: 'credentials',
    features: ['documents', 'vendors', 'customers', 'workflows'],
  },
  sage_bc: {
    name: 'Sage Business Cloud',
    category: 'erp',
    icon: 'sage',
    description: 'Comptabilité Cloud',
    authType: 'oauth',
    features: ['documents', 'vendors', 'customers'],
  },
  sap_b1: {
    name: 'SAP Business One',
    category: 'erp',
    icon: 'sap',
    description: 'ERP PME',
    authType: 'credentials',
    features: ['documents', 'vendors', 'customers', 'attachments'],
  },
  sap_s4: {
    name: 'SAP S/4HANA',
    category: 'erp',
    icon: 'sap',
    description: 'ERP nouvelle génération',
    authType: 'oauth',
    features: ['documents', 'vendors', 'customers', 'workflows'],
  },
  salesforce: {
    name: 'Salesforce',
    category: 'crm',
    icon: 'salesforce',
    description: 'CRM, Contrats, Opportunités',
    authType: 'oauth',
    features: ['documents', 'opportunities', 'contracts', 'workflows'],
  },
};

// ==========================================
// Integration Connection API
// ==========================================

export const integrationService = {
  // Connection CRUD
  async getConnections(): Promise<IntegrationConnection[]> {
    const { data, error } = await supabase
      .from('integration_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return (data as IntegrationConnection[]) ?? [];
  },

  async getConnection(id: string): Promise<IntegrationConnectionDetail> {
    // Fetch connection with related data
    const { data: conn, error: connError } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('id', id)
      .single();

    if (connError) throw parseSupabaseError(connError);

    // Fetch related mappings and logs in parallel
    const [docMappings, syncMappings, recentLogs] = await Promise.all([
      supabase
        .from('integration_mappings')
        .select('*')
        .eq('integration', id)
        .eq('mapping_type', 'document'),
      supabase
        .from('integration_mappings')
        .select('*')
        .eq('integration', id)
        .eq('mapping_type', 'sync'),
      supabase
        .from('integration_sync_logs')
        .select('*')
        .eq('integration', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (docMappings.error) throw parseSupabaseError(docMappings.error);
    if (syncMappings.error) throw parseSupabaseError(syncMappings.error);
    if (recentLogs.error) throw parseSupabaseError(recentLogs.error);

    return {
      ...(conn as IntegrationConnection),
      document_mappings: (docMappings.data as IntegrationDocumentMapping[]) ?? [],
      sync_mappings: (syncMappings.data as IntegrationSyncMapping[]) ?? [],
      recent_logs: (recentLogs.data as IntegrationSyncLog[]) ?? [],
    };
  },

  async createConnection(data: {
    provider: IntegrationProvider;
    name: string;
    config?: Record<string, unknown>;
  }): Promise<IntegrationConnection> {
    const { data: conn, error } = await supabase
      .from('integration_connections')
      .insert(data)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return conn as IntegrationConnection;
  },

  async updateConnection(
    id: string,
    data: Partial<IntegrationConnection>
  ): Promise<IntegrationConnection> {
    const { data: conn, error } = await supabase
      .from('integration_connections')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return conn as IntegrationConnection;
  },

  async deleteConnection(id: string): Promise<void> {
    const { error } = await supabase.from('integration_connections').delete().eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  // OAuth Flow
  async getAuthorizationUrl(
    id: string,
    redirectUri: string
  ): Promise<{ authorization_url: string; state: string }> {
    return invokeEdgeFunction<{ authorization_url: string; state: string }>('integration-oauth', {
      action: 'authorize_url',
      connection_id: id,
      redirect_uri: redirectUri,
    });
  },

  async handleOAuthCallback(
    id: string,
    code: string,
    state: string,
    redirectUri: string
  ): Promise<{ success: boolean; message: string }> {
    return invokeEdgeFunction<{ success: boolean; message: string }>('integration-oauth', {
      action: 'oauth_callback',
      connection_id: id,
      code,
      state,
      redirect_uri: redirectUri,
    });
  },

  // Credentials Auth (for on-premise ERP)
  async connectWithCredentials(
    id: string,
    credentials: ERPCredentials
  ): Promise<TestConnectionResult> {
    return invokeEdgeFunction<TestConnectionResult>('integration-erp', {
      action: 'connect',
      connection_id: id,
      credentials,
    });
  },

  // Connection Actions
  async disconnect(id: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase
      .from('integration_connections')
      .update({ status: 'disconnected', sync_enabled: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return {
      success: true,
      message: `Connection ${(data as IntegrationConnection).name} disconnected.`,
    };
  },

  async testConnection(id: string): Promise<TestConnectionResult> {
    return invokeEdgeFunction<TestConnectionResult>('integration-test', {
      connection_id: id,
    });
  },

  async syncNow(
    id: string,
    fullSync: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    return invokeEdgeFunction<{ success: boolean; message: string }>('integration-sync', {
      connection_id: id,
      full_sync: fullSync,
    });
  },

  // Cloud Storage Operations
  async listFolders(
    id: string,
    parentId?: string
  ): Promise<{ folders: CloudFolder[]; files: CloudFile[] }> {
    return invokeEdgeFunction<{ folders: CloudFolder[]; files: CloudFile[] }>(
      'integration-cloud-storage',
      {
        action: 'list_folders',
        connection_id: id,
        parent_id: parentId,
      }
    );
  },

  async listFiles(
    id: string,
    folderId?: string
  ): Promise<{ files: CloudFile[]; next_page_token?: string }> {
    return invokeEdgeFunction<{ files: CloudFile[]; next_page_token?: string }>(
      'integration-cloud-storage',
      {
        action: 'list_files',
        connection_id: id,
        folder_id: folderId,
      }
    );
  },

  // ERP Document Operations
  async listERPDocuments(
    id: string,
    docType: string,
    pageToken?: string
  ): Promise<{ documents: ERPDocument[]; next_page_token?: string }> {
    return invokeEdgeFunction<{ documents: ERPDocument[]; next_page_token?: string }>(
      'integration-erp',
      {
        action: 'list_documents',
        connection_id: id,
        doc_type: docType,
        page_token: pageToken,
      }
    );
  },

  // Document Mappings
  async getDocumentMappings(): Promise<IntegrationDocumentMapping[]> {
    const { data, error } = await supabase
      .from('integration_mappings')
      .select('*')
      .eq('mapping_type', 'document')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return (data as IntegrationDocumentMapping[]) ?? [];
  },

  async createDocumentMapping(
    data: Partial<IntegrationDocumentMapping>
  ): Promise<IntegrationDocumentMapping> {
    const { data: mapping, error } = await supabase
      .from('integration_mappings')
      .insert({ ...data, mapping_type: 'document' } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return mapping as IntegrationDocumentMapping;
  },

  async updateDocumentMapping(
    id: string,
    data: Partial<IntegrationDocumentMapping>
  ): Promise<IntegrationDocumentMapping> {
    const { data: mapping, error } = await supabase
      .from('integration_mappings')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return mapping as IntegrationDocumentMapping;
  },

  async deleteDocumentMapping(id: string): Promise<void> {
    const { error } = await supabase.from('integration_mappings').delete().eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  // Sync Mappings (Folders)
  async getSyncMappings(): Promise<IntegrationSyncMapping[]> {
    const { data, error } = await supabase
      .from('integration_mappings')
      .select('*')
      .eq('mapping_type', 'sync')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return (data as IntegrationSyncMapping[]) ?? [];
  },

  async createSyncMapping(data: Partial<IntegrationSyncMapping>): Promise<IntegrationSyncMapping> {
    const { data: mapping, error } = await supabase
      .from('integration_mappings')
      .insert({ ...data, mapping_type: 'sync' } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return mapping as IntegrationSyncMapping;
  },

  async updateSyncMapping(
    id: string,
    data: Partial<IntegrationSyncMapping>
  ): Promise<IntegrationSyncMapping> {
    const { data: mapping, error } = await supabase
      .from('integration_mappings')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return mapping as IntegrationSyncMapping;
  },

  async deleteSyncMapping(id: string): Promise<void> {
    const { error } = await supabase.from('integration_mappings').delete().eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  async triggerSyncMapping(id: string): Promise<{ success: boolean; message: string }> {
    return invokeEdgeFunction<{ success: boolean; message: string }>('integration-sync', {
      action: 'trigger_mapping',
      mapping_id: id,
    });
  },

  // Sync Logs
  async getSyncLogs(connectionId?: string, limit: number = 50): Promise<IntegrationSyncLog[]> {
    let query = supabase
      .from('integration_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (connectionId) {
      query = query.eq('integration', connectionId);
    }

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return (data as IntegrationSyncLog[]) ?? [];
  },

  // Workflow Triggers
  async getWorkflowTriggers(): Promise<IntegrationWorkflowTrigger[]> {
    const { data, error } = await supabase
      .from('integration_workflow_triggers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return (data as IntegrationWorkflowTrigger[]) ?? [];
  },

  async createWorkflowTrigger(
    data: Partial<IntegrationWorkflowTrigger>
  ): Promise<IntegrationWorkflowTrigger> {
    const { data: trigger, error } = await supabase
      .from('integration_workflow_triggers')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return trigger as IntegrationWorkflowTrigger;
  },

  async updateWorkflowTrigger(
    id: string,
    data: Partial<IntegrationWorkflowTrigger>
  ): Promise<IntegrationWorkflowTrigger> {
    const { data: trigger, error } = await supabase
      .from('integration_workflow_triggers')
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return trigger as IntegrationWorkflowTrigger;
  },

  async deleteWorkflowTrigger(id: string): Promise<void> {
    const { error } = await supabase.from('integration_workflow_triggers').delete().eq('id', id);

    if (error) throw parseSupabaseError(error);
  },
};

// ==========================================
// Salesforce-Specific API
// ==========================================

export interface SalesforceConnection {
  id: string;
  status: IntegrationStatus;
  status_display: string;
  is_token_expired: boolean;
  instance_url: string;
  sf_org_id: string;
  sf_username: string;
  last_sync_at: string | null;
  last_error: string;
  sync_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  StageName: string;
  Amount: number | null;
  CloseDate: string;
  AccountId: string | null;
  Account?: { Name: string };
  OwnerId: string | null;
  Owner?: { Name: string };
  CreatedDate: string;
  LastModifiedDate: string;
}

export const salesforceService = {
  async getConnection(): Promise<SalesforceConnection | null> {
    try {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('provider', 'salesforce')
        .limit(1);

      if (error) throw parseSupabaseError(error);
      return data && data.length > 0 ? (data[0] as SalesforceConnection) : null;
    } catch {
      return null;
    }
  },

  async getAuthorizationUrl(
    redirectUri: string,
    isSandbox: boolean = false
  ): Promise<{ authorization_url: string; state: string; connection_id: string }> {
    return invokeEdgeFunction<{ authorization_url: string; state: string; connection_id: string }>(
      'salesforce-oauth',
      {
        action: 'authorize_url',
        redirect_uri: redirectUri,
        is_sandbox: isSandbox,
      }
    );
  },

  async handleOAuthCallback(
    code: string,
    state: string,
    redirectUri: string
  ): Promise<{ success: boolean; message: string; connection_id: string }> {
    return invokeEdgeFunction<{ success: boolean; message: string; connection_id: string }>(
      'salesforce-oauth',
      {
        action: 'oauth_callback',
        code,
        state,
        redirect_uri: redirectUri,
      }
    );
  },

  async disconnect(id: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('integration_connections')
      .update({ status: 'disconnected', sync_enabled: false })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
    return { success: true, message: 'Salesforce connection disconnected.' };
  },

  async testConnection(id: string): Promise<TestConnectionResult> {
    return invokeEdgeFunction<TestConnectionResult>('salesforce-api', {
      action: 'test',
      connection_id: id,
    });
  },

  async syncNow(id: string): Promise<{ success: boolean; message: string }> {
    return invokeEdgeFunction<{ success: boolean; message: string }>('salesforce-api', {
      action: 'sync',
      connection_id: id,
    });
  },

  async query(
    id: string,
    soql: string
  ): Promise<{ success: boolean; total_size: number; records: unknown[] }> {
    return invokeEdgeFunction<{ success: boolean; total_size: number; records: unknown[] }>(
      'salesforce-api',
      {
        action: 'query',
        connection_id: id,
        query: soql,
      }
    );
  },

  async getOpportunities(
    id: string,
    stage?: string,
    limit: number = 50
  ): Promise<{ success: boolean; count: number; opportunities: SalesforceOpportunity[] }> {
    return invokeEdgeFunction<{
      success: boolean;
      count: number;
      opportunities: SalesforceOpportunity[];
    }>('salesforce-api', {
      action: 'get_opportunities',
      connection_id: id,
      stage,
      limit,
    });
  },

  async generateContract(
    id: string,
    opportunityId: string,
    templateId: string,
    autoSignature: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    return invokeEdgeFunction<{ success: boolean; message: string }>('salesforce-api', {
      action: 'generate_contract',
      connection_id: id,
      opportunity_id: opportunityId,
      template_id: templateId,
      auto_signature: autoSignature,
    });
  },
};

export default integrationService;
