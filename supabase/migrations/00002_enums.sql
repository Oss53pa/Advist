-- Document statuses
CREATE TYPE document_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'archived', 'deleted');

-- Workflow step types
CREATE TYPE workflow_step_type AS ENUM ('approval', 'review', 'signature', 'notification', 'task', 'condition');

-- Workflow step status
CREATE TYPE workflow_step_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected', 'skipped', 'cancelled');

-- Workflow instance status
CREATE TYPE workflow_instance_status AS ENUM ('active', 'completed', 'cancelled', 'paused', 'failed');

-- Notification types
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success', 'task', 'workflow', 'document', 'system', 'mention', 'comment', 'share');

-- Notification channel
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'push', 'whatsapp');

-- Audit action types
CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'share', 'sign', 'approve', 'reject', 'archive', 'restore');

-- Signature types
CREATE TYPE signature_type AS ENUM ('simple', 'advanced', 'qualified');

-- Signature status
CREATE TYPE signature_status AS ENUM ('pending', 'signed', 'rejected', 'expired', 'revoked');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'suspended', 'expired');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');

-- Support ticket status
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'waiting_support', 'resolved', 'closed');

-- Support ticket priority
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Data subject request type (GDPR)
CREATE TYPE dsr_type AS ENUM ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection');

-- Data subject request status
CREATE TYPE dsr_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');

-- Consent status
CREATE TYPE consent_status AS ENUM ('granted', 'withdrawn', 'expired');

-- Publication status (marketing)
CREATE TYPE publication_status AS ENUM ('draft', 'scheduled', 'published', 'failed', 'cancelled');

-- Social platform
CREATE TYPE social_platform AS ENUM ('linkedin', 'twitter', 'facebook', 'instagram');

-- ISO 27001 risk level
CREATE TYPE risk_level AS ENUM ('very_low', 'low', 'medium', 'high', 'very_high', 'critical');

-- ISO 27001 control status
CREATE TYPE control_status AS ENUM ('not_implemented', 'partially_implemented', 'implemented', 'not_applicable');

-- Archive status
CREATE TYPE archive_status AS ENUM ('pending', 'archived', 'restored', 'expired', 'deleted');

-- Integration type
CREATE TYPE integration_type AS ENUM ('salesforce', 'google_drive', 'sharepoint', 'dropbox', 'slack', 'teams', 'webhook', 'api');

-- Integration sync status
CREATE TYPE sync_status AS ENUM ('idle', 'syncing', 'completed', 'failed', 'paused');

-- Document access level
CREATE TYPE access_level AS ENUM ('viewer', 'commenter', 'editor', 'admin');

-- Identity verification status
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- Billing interval
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');

-- Blog post status
CREATE TYPE blog_post_status AS ENUM ('draft', 'published', 'archived');

-- Data breach severity
CREATE TYPE breach_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Share link access type
CREATE TYPE share_access_type AS ENUM ('view', 'download', 'comment', 'edit');
