-- Audit Logs (with cryptographic chaining for tamper-evidence)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    resource_name VARCHAR(500),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    previous_hash VARCHAR(128),
    hash VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit Log Archives (for compliance retention)
CREATE TABLE audit_log_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    archive_date DATE NOT NULL,
    file_path TEXT NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    checksum VARCHAR(128),
    archived_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
