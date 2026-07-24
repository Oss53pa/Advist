-- Migration: Create missing tables for SmartCalendar & user roles
-- Tables: roles, user_roles, deadlines, deadline_reminders, calendar_events
-- Applied to production on 2026-05-17

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select" ON roles FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- ============================================================
-- 2. USER_ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, role_id, organization_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select" ON user_roles FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "user_roles_insert" ON user_roles FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "user_roles_update" ON user_roles FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "user_roles_delete" ON user_roles FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);
CREATE INDEX idx_user_roles_org ON user_roles (organization_id);

-- ============================================================
-- 3. DEADLINES
-- ============================================================
CREATE TABLE IF NOT EXISTS deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    workflow_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'custom' CHECK (type IN ('expiration', 'renewal', 'payment', 'review', 'signature', 'custom')),
    date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due_soon', 'overdue', 'completed', 'cancelled')),
    document_name VARCHAR(500),
    document_type VARCHAR(100),
    assigned_to JSONB DEFAULT '[]',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reminders JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadlines_select" ON deadlines FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);
CREATE POLICY "deadlines_insert" ON deadlines FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);
CREATE POLICY "deadlines_update" ON deadlines FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);
CREATE POLICY "deadlines_delete" ON deadlines FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);

CREATE INDEX idx_deadlines_org ON deadlines (organization_id);
CREATE INDEX idx_deadlines_date ON deadlines (date);
CREATE INDEX idx_deadlines_status ON deadlines (status);
CREATE INDEX idx_deadlines_document ON deadlines (document_id);

-- ============================================================
-- 4. DEADLINE_REMINDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS deadline_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
    days_before INTEGER NOT NULL,
    channels JSONB NOT NULL DEFAULT '["in_app"]',
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_reminders_select" ON deadline_reminders FOR SELECT USING (
    deadline_id IN (SELECT id FROM deadlines WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY "deadline_reminders_insert" ON deadline_reminders FOR INSERT WITH CHECK (
    deadline_id IN (SELECT id FROM deadlines WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY "deadline_reminders_update" ON deadline_reminders FOR UPDATE USING (
    deadline_id IN (SELECT id FROM deadlines WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY "deadline_reminders_delete" ON deadline_reminders FOR DELETE USING (
    deadline_id IN (SELECT id FROM deadlines WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);

CREATE INDEX idx_deadline_reminders_deadline ON deadline_reminders (deadline_id);

-- ============================================================
-- 5. CALENDAR_EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    type VARCHAR(50) NOT NULL DEFAULT 'deadline' CHECK (type IN ('deadline', 'workflow', 'signature', 'meeting', 'reminder')),
    color VARCHAR(20),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    workflow_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);
CREATE POLICY "calendar_events_insert" ON calendar_events FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);
CREATE POLICY "calendar_events_update" ON calendar_events FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);
CREATE POLICY "calendar_events_delete" ON calendar_events FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
);

CREATE INDEX idx_calendar_events_org ON calendar_events (organization_id);
CREATE INDEX idx_calendar_events_start ON calendar_events (start);
CREATE INDEX idx_calendar_events_type ON calendar_events (type);
