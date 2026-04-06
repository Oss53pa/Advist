-- ============================================
-- Row Level Security Policies for ADVIST
-- ============================================
-- Pattern: organization-scoped tables use org membership check
-- Special cases: profiles, audit_logs, notifications

-- Pre-fix: ensure required columns exist on pre-existing tables
ALTER TABLE roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_name TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(128);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hash VARCHAR(128);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES profiles(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE retention_policies ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
-- Ensure all org-scoped tables have needed columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_id UUID;
ALTER TABLE audit_log_archives ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Helper function: get current user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name IN ('admin', 'owner', 'super_admin')
      AND ur.organization_id = public.get_user_org_id()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ORGANIZATIONS
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations FOR SELECT USING (
    id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_update" ON organizations FOR UPDATE USING (
    id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- DEPARTMENTS
-- ============================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_select" ON departments;
CREATE POLICY "departments_select" ON departments FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "departments_insert" ON departments;
CREATE POLICY "departments_insert" ON departments FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "departments_update" ON departments;
CREATE POLICY "departments_update" ON departments FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "departments_delete" ON departments;
CREATE POLICY "departments_delete" ON departments FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
    organization_id = public.get_user_org_id() OR id = auth.uid()
);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (
    id = auth.uid()
);
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
    id = auth.uid()
);

-- ============================================
-- ROLES
-- ============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select" ON roles;
CREATE POLICY "roles_select" ON roles FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "roles_insert" ON roles;
CREATE POLICY "roles_insert" ON roles FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "roles_update" ON roles;
CREATE POLICY "roles_update" ON roles FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "roles_delete" ON roles;
CREATE POLICY "roles_delete" ON roles FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- USER_ROLES
-- ============================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select" ON user_roles;
CREATE POLICY "user_roles_select" ON user_roles FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "user_roles_insert" ON user_roles;
CREATE POLICY "user_roles_insert" ON user_roles FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "user_roles_update" ON user_roles;
CREATE POLICY "user_roles_update" ON user_roles FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "user_roles_delete" ON user_roles;
CREATE POLICY "user_roles_delete" ON user_roles FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- DOCUMENT_TYPES
-- ============================================
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_types_select" ON document_types;
CREATE POLICY "document_types_select" ON document_types FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "document_types_insert" ON document_types;
CREATE POLICY "document_types_insert" ON document_types FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "document_types_update" ON document_types;
CREATE POLICY "document_types_update" ON document_types FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "document_types_delete" ON document_types;
CREATE POLICY "document_types_delete" ON document_types FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- FOLDERS
-- ============================================
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "folders_select" ON folders;
CREATE POLICY "folders_select" ON folders FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "folders_insert" ON folders;
CREATE POLICY "folders_insert" ON folders FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "folders_update" ON folders;
CREATE POLICY "folders_update" ON folders FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND (created_by = auth.uid() OR public.is_org_admin())
);
DROP POLICY IF EXISTS "folders_delete" ON folders;
CREATE POLICY "folders_delete" ON folders FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- DOCUMENTS
-- ============================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "documents_insert" ON documents;
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "documents_update" ON documents;
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND (created_by = auth.uid() OR public.is_org_admin())
);
DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- DOCUMENT_VERSIONS
-- ============================================
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_versions_select" ON document_versions;
CREATE POLICY "document_versions_select" ON document_versions FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_versions_insert" ON document_versions;
CREATE POLICY "document_versions_insert" ON document_versions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);

-- ============================================
-- DOCUMENT_ACCESS
-- ============================================
ALTER TABLE document_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_access_select" ON document_access;
CREATE POLICY "document_access_select" ON document_access FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_access_insert" ON document_access;
CREATE POLICY "document_access_insert" ON document_access FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_access_update" ON document_access;
CREATE POLICY "document_access_update" ON document_access FOR UPDATE USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_access_delete" ON document_access;
CREATE POLICY "document_access_delete" ON document_access FOR DELETE USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id()) AND public.is_org_admin()
);

-- ============================================
-- DOCUMENT_ANNOTATIONS
-- ============================================
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_annotations_select" ON document_annotations;
CREATE POLICY "document_annotations_select" ON document_annotations FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_annotations_insert" ON document_annotations;
CREATE POLICY "document_annotations_insert" ON document_annotations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_annotations_update" ON document_annotations;
CREATE POLICY "document_annotations_update" ON document_annotations FOR UPDATE USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "document_annotations_delete" ON document_annotations;
CREATE POLICY "document_annotations_delete" ON document_annotations FOR DELETE USING (
    user_id = auth.uid() OR public.is_org_admin()
);

-- ============================================
-- DOCUMENT_COMMENTS
-- ============================================
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_comments_select" ON document_comments;
CREATE POLICY "document_comments_select" ON document_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_comments_insert" ON document_comments;
CREATE POLICY "document_comments_insert" ON document_comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_comments_update" ON document_comments;
CREATE POLICY "document_comments_update" ON document_comments FOR UPDATE USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "document_comments_delete" ON document_comments;
CREATE POLICY "document_comments_delete" ON document_comments FOR DELETE USING (
    user_id = auth.uid() OR public.is_org_admin()
);

-- ============================================
-- DOCUMENT_FOLDERS
-- ============================================
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_folders_select" ON document_folders;
CREATE POLICY "document_folders_select" ON document_folders FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_folders_insert" ON document_folders;
CREATE POLICY "document_folders_insert" ON document_folders FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_folders_delete" ON document_folders;
CREATE POLICY "document_folders_delete" ON document_folders FOR DELETE USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);

-- ============================================
-- PROJECTS
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND (created_by = auth.uid() OR public.is_org_admin())
);
DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- PROJECT_MEMBERS
-- ============================================
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_members_select" ON project_members;
CREATE POLICY "project_members_select" ON project_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
CREATE POLICY "project_members_insert" ON project_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "project_members_delete" ON project_members;
CREATE POLICY "project_members_delete" ON project_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id()) AND public.is_org_admin()
);

-- ============================================
-- PROJECT_DOCUMENTS
-- ============================================
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_documents_select" ON project_documents;
CREATE POLICY "project_documents_select" ON project_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "project_documents_insert" ON project_documents;
CREATE POLICY "project_documents_insert" ON project_documents FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "project_documents_delete" ON project_documents;
CREATE POLICY "project_documents_delete" ON project_documents FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id())
);

-- ============================================
-- WORKFLOW_TEMPLATES
-- ============================================
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_templates_select" ON workflow_templates;
CREATE POLICY "workflow_templates_select" ON workflow_templates FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "workflow_templates_insert" ON workflow_templates;
CREATE POLICY "workflow_templates_insert" ON workflow_templates FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "workflow_templates_update" ON workflow_templates;
CREATE POLICY "workflow_templates_update" ON workflow_templates FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);
DROP POLICY IF EXISTS "workflow_templates_delete" ON workflow_templates;
CREATE POLICY "workflow_templates_delete" ON workflow_templates FOR DELETE USING (
    organization_id = public.get_user_org_id() AND public.is_org_admin()
);

-- ============================================
-- WORKFLOW_INSTANCES
-- ============================================
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_instances_select" ON workflow_instances;
CREATE POLICY "workflow_instances_select" ON workflow_instances FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "workflow_instances_insert" ON workflow_instances;
CREATE POLICY "workflow_instances_insert" ON workflow_instances FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "workflow_instances_update" ON workflow_instances;
CREATE POLICY "workflow_instances_update" ON workflow_instances FOR UPDATE USING (
    organization_id = public.get_user_org_id()
);

-- ============================================
-- WORKFLOW_STEPS
-- ============================================
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_steps_select" ON workflow_steps;
CREATE POLICY "workflow_steps_select" ON workflow_steps FOR SELECT USING (
    EXISTS (SELECT 1 FROM workflow_instances wi WHERE wi.id = instance_id AND wi.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "workflow_steps_update" ON workflow_steps;
CREATE POLICY "workflow_steps_update" ON workflow_steps FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workflow_instances wi WHERE wi.id = instance_id AND wi.organization_id = public.get_user_org_id())
);

-- ============================================
-- WORKFLOW_ASSIGNEES
-- ============================================
ALTER TABLE workflow_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_assignees_select" ON workflow_assignees;
CREATE POLICY "workflow_assignees_select" ON workflow_assignees FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workflow_steps ws
        JOIN workflow_instances wi ON wi.id = ws.instance_id
        WHERE ws.id = step_id AND wi.organization_id = public.get_user_org_id()
    )
);
DROP POLICY IF EXISTS "workflow_assignees_update" ON workflow_assignees;
CREATE POLICY "workflow_assignees_update" ON workflow_assignees FOR UPDATE USING (
    user_id = auth.uid()
);

-- ============================================
-- WORKFLOW_HISTORY
-- ============================================
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_history_select" ON workflow_history;
CREATE POLICY "workflow_history_select" ON workflow_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM workflow_instances wi WHERE wi.id = instance_id AND wi.organization_id = public.get_user_org_id())
);

-- ============================================
-- NOTIFICATIONS (filtered by recipient)
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (
    recipient_id = auth.uid()
);
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (
    recipient_id = auth.uid()
);
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);

-- ============================================
-- NOTIFICATION_PREFERENCES
-- ============================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_select" ON notification_preferences;
CREATE POLICY "notification_preferences_select" ON notification_preferences FOR SELECT USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "notification_preferences_insert" ON notification_preferences;
CREATE POLICY "notification_preferences_insert" ON notification_preferences FOR INSERT WITH CHECK (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "notification_preferences_update" ON notification_preferences;
CREATE POLICY "notification_preferences_update" ON notification_preferences FOR UPDATE USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "notification_preferences_delete" ON notification_preferences;
CREATE POLICY "notification_preferences_delete" ON notification_preferences FOR DELETE USING (
    user_id = auth.uid()
);

-- ============================================
-- AUDIT_LOGS (immutable - SELECT only)
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);
-- No UPDATE or DELETE policies: audit logs are immutable

-- ============================================
-- SUBSCRIPTIONS / BILLING (admin only for write)
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_select" ON invoices;
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

-- ============================================
-- SUPPORT_TICKETS
-- ============================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_select" ON support_tickets;
CREATE POLICY "support_tickets_select" ON support_tickets FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "support_tickets_insert" ON support_tickets;
CREATE POLICY "support_tickets_insert" ON support_tickets FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "support_tickets_update" ON support_tickets;
CREATE POLICY "support_tickets_update" ON support_tickets FOR UPDATE USING (
    organization_id = public.get_user_org_id() AND (user_id = auth.uid() OR public.is_org_admin())
);

-- ============================================
-- SUPPORT_MESSAGES
-- ============================================
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_messages_select" ON support_messages;
CREATE POLICY "support_messages_select" ON support_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets st WHERE st.id = ticket_id AND st.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "support_messages_insert" ON support_messages;
CREATE POLICY "support_messages_insert" ON support_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets st WHERE st.id = ticket_id AND st.organization_id = public.get_user_org_id())
);

-- ============================================
-- DOCUMENT_SIGNATURES
-- ============================================
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_signatures_select" ON document_signatures;
CREATE POLICY "document_signatures_select" ON document_signatures FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_signatures_insert" ON document_signatures;
CREATE POLICY "document_signatures_insert" ON document_signatures FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_signatures_update" ON document_signatures;
CREATE POLICY "document_signatures_update" ON document_signatures FOR UPDATE USING (
    user_id = auth.uid()
);

-- ============================================
-- USER_SIGNATURES
-- ============================================
ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_signatures_select" ON user_signatures;
CREATE POLICY "user_signatures_select" ON user_signatures FOR SELECT USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "user_signatures_insert" ON user_signatures;
CREATE POLICY "user_signatures_insert" ON user_signatures FOR INSERT WITH CHECK (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "user_signatures_update" ON user_signatures;
CREATE POLICY "user_signatures_update" ON user_signatures FOR UPDATE USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "user_signatures_delete" ON user_signatures;
CREATE POLICY "user_signatures_delete" ON user_signatures FOR DELETE USING (
    user_id = auth.uid()
);

-- ============================================
-- AI_CONVERSATIONS
-- ============================================
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_conversations_select" ON ai_conversations;
CREATE POLICY "ai_conversations_select" ON ai_conversations FOR SELECT USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "ai_conversations_insert" ON ai_conversations;
CREATE POLICY "ai_conversations_insert" ON ai_conversations FOR INSERT WITH CHECK (
    user_id = auth.uid() AND organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "ai_conversations_update" ON ai_conversations;
CREATE POLICY "ai_conversations_update" ON ai_conversations FOR UPDATE USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "ai_conversations_delete" ON ai_conversations;
CREATE POLICY "ai_conversations_delete" ON ai_conversations FOR DELETE USING (
    user_id = auth.uid()
);

-- ============================================
-- AI_MESSAGES
-- ============================================
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_messages_select" ON ai_messages;
CREATE POLICY "ai_messages_select" ON ai_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_conversations ac WHERE ac.id = conversation_id AND ac.user_id = auth.uid())
);
DROP POLICY IF EXISTS "ai_messages_insert" ON ai_messages;
CREATE POLICY "ai_messages_insert" ON ai_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ai_conversations ac WHERE ac.id = conversation_id AND ac.user_id = auth.uid())
);

-- ============================================
-- Org-scoped tables: standard pattern
-- (SELECT same org, INSERT same org, UPDATE same org + admin, DELETE admin only)
-- ============================================

-- Macro for remaining org-scoped tables (with graceful skip if column missing)
DO $$
DECLARE
    tbl TEXT;
    has_col BOOLEAN;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'notification_templates',
        'consent_purposes', 'consents', 'data_subject_requests',
        'processing_activities', 'data_breaches', 'privacy_impact_assessments',
        'integration_connections', 'integration_sync_logs', 'integration_field_mappings',
        'webhooks', 'webhook_deliveries', 'salesforce_mappings',
        'social_accounts', 'post_templates', 'publications', 'publication_results',
        'blog_posts', 'newsletter_subscribers', 'newsletters',
        'security_events', 'ip_allowlists', 'api_keys',
        'retention_policies', 'archived_documents', 'archive_jobs',
        'asset_categories', 'information_assets', 'risk_register',
        'control_implementations', 'risk_treatments',
        'internal_audits', 'audit_findings', 'management_reviews',
        'isms_documents', 'security_incidents',
        'competence_records', 'training_records',
        'business_continuity_plans', 'supplier_assessments',
        'corrective_actions', 'document_change_requests',
        'organization_profiles', 'organization_metrics',
        'organization_benchmark_positions', 'roi_calculations',
        'organization_best_practices', 'executive_reports',
        'billing_history', 'audit_log_archives',
        'collaboration_sessions'
    ]) LOOP
        -- Check if table exists and has organization_id column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'organization_id'
        ) INTO has_col;

        IF NOT has_col THEN
            RAISE NOTICE 'Skipping RLS for table % — no organization_id column', tbl;
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "%s_select" ON %I FOR SELECT USING (organization_id = public.get_user_org_id())',
            tbl, tbl
        );
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (organization_id = public.get_user_org_id())',
            tbl, tbl
        );
        EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "%s_update" ON %I FOR UPDATE USING (organization_id = public.get_user_org_id())',
            tbl, tbl
        );
        EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "%s_delete" ON %I FOR DELETE USING (organization_id = public.get_user_org_id() AND public.is_org_admin())',
            tbl, tbl
        );
    END LOOP;
END $$;

-- Tables without organization_id (special handling)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_plans_select" ON subscription_plans;
CREATE POLICY "subscription_plans_select" ON subscription_plans FOR SELECT USING (is_active = true AND is_public = true);

ALTER TABLE control_objectives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "control_objectives_select" ON control_objectives;
CREATE POLICY "control_objectives_select" ON control_objectives FOR SELECT TO authenticated USING (true);

ALTER TABLE industry_benchmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "industry_benchmarks_select" ON industry_benchmarks;
CREATE POLICY "industry_benchmarks_select" ON industry_benchmarks FOR SELECT TO authenticated USING (true);

ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "best_practices_select" ON best_practices;
CREATE POLICY "best_practices_select" ON best_practices FOR SELECT TO authenticated USING (is_active = true);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "addons_select" ON addons;
CREATE POLICY "addons_select" ON addons FOR SELECT USING (is_active = true);

ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_addons_select" ON subscription_addons;
CREATE POLICY "subscription_addons_select" ON subscription_addons FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_id AND s.organization_id = public.get_user_org_id())
);

-- Session-scoped tables (via session -> document -> org)
ALTER TABLE collaboration_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collaboration_presence_select" ON collaboration_presence;
CREATE POLICY "collaboration_presence_select" ON collaboration_presence FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN documents d ON d.id = cs.document_id
        WHERE cs.id = session_id AND d.organization_id = public.get_user_org_id()
    )
);
DROP POLICY IF EXISTS "collaboration_presence_insert" ON collaboration_presence;
CREATE POLICY "collaboration_presence_insert" ON collaboration_presence FOR INSERT WITH CHECK (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "collaboration_presence_update" ON collaboration_presence;
CREATE POLICY "collaboration_presence_update" ON collaboration_presence FOR UPDATE USING (
    user_id = auth.uid()
);

ALTER TABLE collaboration_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collab_chat_select" ON collaboration_chat_messages;
CREATE POLICY "collab_chat_select" ON collaboration_chat_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN documents d ON d.id = cs.document_id
        WHERE cs.id = session_id AND d.organization_id = public.get_user_org_id()
    )
);
DROP POLICY IF EXISTS "collab_chat_insert" ON collaboration_chat_messages;
CREATE POLICY "collab_chat_insert" ON collaboration_chat_messages FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

ALTER TABLE collaboration_cursors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collab_cursors_select" ON collaboration_cursors;
CREATE POLICY "collab_cursors_select" ON collaboration_cursors FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN documents d ON d.id = cs.document_id
        WHERE cs.id = session_id AND d.organization_id = public.get_user_org_id()
    )
);
DROP POLICY IF EXISTS "collab_cursors_upsert" ON collaboration_cursors;
CREATE POLICY "collab_cursors_upsert" ON collaboration_cursors FOR INSERT WITH CHECK (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "collab_cursors_update" ON collaboration_cursors;
CREATE POLICY "collab_cursors_update" ON collaboration_cursors FOR UPDATE USING (
    user_id = auth.uid()
);

-- Document shares
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_shares_select" ON document_shares;
CREATE POLICY "document_shares_select" ON document_shares FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "document_shares_insert" ON document_shares;
CREATE POLICY "document_shares_insert" ON document_shares FOR INSERT WITH CHECK (
    created_by = auth.uid()
);
DROP POLICY IF EXISTS "document_shares_update" ON document_shares;
CREATE POLICY "document_shares_update" ON document_shares FOR UPDATE USING (
    created_by = auth.uid()
);
DROP POLICY IF EXISTS "document_shares_delete" ON document_shares;
CREATE POLICY "document_shares_delete" ON document_shares FOR DELETE USING (
    created_by = auth.uid() OR public.is_org_admin()
);

-- Login history (user sees own)
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "login_history_select" ON login_history;
CREATE POLICY "login_history_select" ON login_history FOR SELECT USING (
    user_id = auth.uid()
);

-- Active sessions (user sees own)
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "active_sessions_select" ON active_sessions;
CREATE POLICY "active_sessions_select" ON active_sessions FOR SELECT USING (
    user_id = auth.uid()
);
DROP POLICY IF EXISTS "active_sessions_delete" ON active_sessions;
CREATE POLICY "active_sessions_delete" ON active_sessions FOR DELETE USING (
    user_id = auth.uid()
);

-- Signature-related (via document org)
ALTER TABLE signature_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signature_audit_log_select" ON signature_audit_log;
CREATE POLICY "signature_audit_log_select" ON signature_audit_log FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM document_signatures ds
        JOIN documents d ON d.id = ds.document_id
        WHERE ds.id = document_signature_id AND d.organization_id = public.get_user_org_id()
    )
);

ALTER TABLE signature_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signature_certificates_select" ON signature_certificates;
CREATE POLICY "signature_certificates_select" ON signature_certificates FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

ALTER TABLE qualified_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qualified_certificates_select" ON qualified_certificates;
CREATE POLICY "qualified_certificates_select" ON qualified_certificates FOR SELECT USING (
    user_id = auth.uid()
);

ALTER TABLE identity_verification_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "identity_verification_sessions_select" ON identity_verification_sessions;
CREATE POLICY "identity_verification_sessions_select" ON identity_verification_sessions FOR SELECT USING (
    user_id = auth.uid()
);

-- eIDAS tables (org-scoped)
ALTER TABLE signature_proof_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signature_proof_files_select" ON signature_proof_files;
CREATE POLICY "signature_proof_files_select" ON signature_proof_files FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM document_signatures ds
        JOIN documents d ON d.id = ds.document_id
        WHERE ds.id = document_signature_id AND d.organization_id = public.get_user_org_id()
    )
);

ALTER TABLE qualified_timestamps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qualified_timestamps_select" ON qualified_timestamps;
CREATE POLICY "qualified_timestamps_select" ON qualified_timestamps FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

ALTER TABLE electronic_seals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "electronic_seals_select" ON electronic_seals;
CREATE POLICY "electronic_seals_select" ON electronic_seals FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

ALTER TABLE registered_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "registered_deliveries_select" ON registered_deliveries;
CREATE POLICY "registered_deliveries_select" ON registered_deliveries FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

ALTER TABLE qualified_archives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qualified_archives_select" ON qualified_archives;
CREATE POLICY "qualified_archives_select" ON qualified_archives FOR SELECT USING (
    organization_id = public.get_user_org_id()
);

ALTER TABLE attribute_attestations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attribute_attestations_select" ON attribute_attestations;
CREATE POLICY "attribute_attestations_select" ON attribute_attestations FOR SELECT USING (
    user_id = auth.uid()
);

-- Project workflows and timeline
ALTER TABLE project_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_workflows_select" ON project_workflows;
CREATE POLICY "project_workflows_select" ON project_workflows FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id())
);

ALTER TABLE project_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_timeline_select" ON project_timeline;
CREATE POLICY "project_timeline_select" ON project_timeline FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.organization_id = public.get_user_org_id())
);
