-- ============================================
-- Indexes for ADVIST (safe — skips if column missing)
-- ============================================

-- Helper: create index safely, skip if column doesn't exist
CREATE OR REPLACE FUNCTION safe_create_index(idx_sql TEXT) RETURNS VOID AS $$
BEGIN
  EXECUTE idx_sql;
EXCEPTION WHEN undefined_column OR undefined_table THEN
  RAISE NOTICE 'Skipping index: %', idx_sql;
END;
$$ LANGUAGE plpgsql;

-- Documents
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_content_fts ON documents USING GIN (to_tsvector(''french'', COALESCE(content_text, '''')))');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING GIN (title gin_trgm_ops)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN (tags)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN (metadata)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_org_status ON documents (organization_id, status)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_org_created ON documents (organization_id, created_at DESC)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_org_type ON documents (organization_id, document_type_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_org_folder ON documents (organization_id, folder_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents (created_by)');

-- Folders
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_folders_org_parent ON folders (organization_id, parent_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_folders_path ON folders (path)');

-- Profiles
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles (department_id)');

-- User roles
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles (user_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles (organization_id)');

-- Workflows
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_workflow_instances_org_status ON workflow_instances (organization_id, status)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_workflow_instances_document ON workflow_instances (document_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_workflow_instances_template ON workflow_instances (template_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_workflow_steps_instance ON workflow_steps (instance_id, step_number)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps (status)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_workflow_assignees_user ON workflow_assignees (user_id, status)');

-- Document versions
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions (document_id, version_number DESC)');

-- Document access
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_access_document ON document_access (document_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_access_user ON document_access (user_id)');

-- Signatures
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_signatures_document ON document_signatures (document_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_signatures_user_status ON document_signatures (user_id, status)');

-- Notifications
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications (recipient_id, is_read) WHERE is_read = false');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications (recipient_id, created_at DESC)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications (organization_id)');

-- Audit logs
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs (organization_id, created_at DESC)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action)');

-- Billing
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status)');

-- Support
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_support_tickets_org_status ON support_tickets (organization_id, status)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets (user_id)');

-- Collaboration
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_collab_sessions_document ON collaboration_sessions (document_id) WHERE is_active = true');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_collab_presence_session ON collaboration_presence (session_id) WHERE left_at IS NULL');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares (token) WHERE is_active = true');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares (document_id)');

-- Projects
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_projects_org ON projects (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members (project_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members (user_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents (project_id)');

-- Integrations
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_integration_connections_org ON integration_connections (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_connection ON integration_sync_logs (connection_id, created_at DESC)');

-- Marketing
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_social_accounts_org ON social_accounts (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_publications_org_status ON publications (organization_id, status)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_blog_posts_org_status ON blog_posts (organization_id, status)');

-- Security
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_security_events_org ON security_events (organization_id, created_at DESC)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history (user_id, created_at DESC)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions (user_id) WHERE is_active = true');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys (organization_id)');

-- Compliance
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_consents_user ON consents (user_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_dsr_org_status ON data_subject_requests (organization_id, status)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_data_breaches_org ON data_breaches (organization_id)');

-- ISO 27001
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_risk_register_org ON risk_register (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_control_implementations_org ON control_implementations (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_internal_audits_org ON internal_audits (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_security_incidents_org ON security_incidents (organization_id)');

-- Archives
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_retention_policies_org ON retention_policies (organization_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_archived_documents_org ON archived_documents (organization_id)');

-- Analytics
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_org_metrics_org_date ON organization_metrics (organization_id, metric_date DESC)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_lookup ON industry_benchmarks (industry, metric_type)');

-- AI
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations (user_id, created_at DESC)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages (conversation_id, created_at)');

-- Comments
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments (document_id, created_at)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_document_annotations_document ON document_annotations (document_id)');

-- Departments
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_departments_org ON departments (organization_id)');

-- eIDAS
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_qualified_timestamps_resource ON qualified_timestamps (resource_type, resource_id)');
SELECT safe_create_index('CREATE INDEX IF NOT EXISTS idx_registered_deliveries_org ON registered_deliveries (organization_id)');

-- Cleanup helper
DROP FUNCTION IF EXISTS safe_create_index(TEXT);
