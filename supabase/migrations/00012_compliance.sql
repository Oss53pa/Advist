-- GDPR/eIDAS Compliance Tables

-- Consent Purposes
CREATE TABLE IF NOT EXISTS consent_purposes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    legal_basis VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    retention_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

-- Consents
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    purpose_id UUID NOT NULL REFERENCES consent_purposes(id) ON DELETE CASCADE,
    status consent_status DEFAULT 'granted',
    granted_at TIMESTAMPTZ DEFAULT now(),
    withdrawn_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    proof JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Data Subject Requests
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    request_type dsr_type NOT NULL,
    status dsr_status DEFAULT 'pending',
    requester_email VARCHAR(255) NOT NULL,
    requester_name VARCHAR(255),
    description TEXT,
    response TEXT,
    processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Processing Activities (GDPR Article 30)
CREATE TABLE IF NOT EXISTS processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(100) NOT NULL,
    data_categories TEXT[] DEFAULT '{}',
    data_subjects TEXT[] DEFAULT '{}',
    recipients TEXT[] DEFAULT '{}',
    transfers_outside_eu BOOLEAN DEFAULT false,
    transfer_safeguards TEXT,
    retention_period VARCHAR(255),
    security_measures TEXT,
    dpo_contact VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Data Breaches
CREATE TABLE IF NOT EXISTS data_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    severity breach_severity DEFAULT 'medium',
    discovered_at TIMESTAMPTZ NOT NULL,
    reported_to_authority BOOLEAN DEFAULT false,
    reported_at TIMESTAMPTZ,
    affected_individuals INTEGER,
    data_types_affected TEXT[] DEFAULT '{}',
    containment_measures TEXT,
    remediation_steps TEXT,
    reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'open',
    closed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Privacy Impact Assessments
CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    project_name VARCHAR(255),
    assessor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft',
    risk_level risk_level DEFAULT 'medium',
    findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    review_date DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- eIDAS: Signature Proof Files
CREATE TABLE IF NOT EXISTS signature_proof_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_signature_id UUID NOT NULL REFERENCES document_signatures(id) ON DELETE CASCADE,
    proof_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(256) NOT NULL,
    algorithm VARCHAR(50) DEFAULT 'SHA-256',
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- eIDAS: Qualified Timestamps
CREATE TABLE IF NOT EXISTS qualified_timestamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    timestamp_token TEXT NOT NULL,
    tsa_provider VARCHAR(255) NOT NULL,
    algorithm VARCHAR(50) DEFAULT 'SHA-256',
    hash VARCHAR(256) NOT NULL,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- eIDAS: Electronic Seals
CREATE TABLE IF NOT EXISTS electronic_seals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    seal_certificate TEXT NOT NULL,
    issuer VARCHAR(500),
    serial_number VARCHAR(255),
    not_before TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- eIDAS: Registered Deliveries
CREATE TABLE IF NOT EXISTS registered_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    proof_token TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- eIDAS: Qualified Archives
CREATE TABLE IF NOT EXISTS qualified_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
    archive_provider VARCHAR(255) NOT NULL,
    archive_id_external VARCHAR(500),
    integrity_hash VARCHAR(256),
    algorithm VARCHAR(50) DEFAULT 'SHA-256',
    archived_at TIMESTAMPTZ DEFAULT now(),
    retention_until TIMESTAMPTZ NOT NULL,
    status archive_status DEFAULT 'archived',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- eIDAS: Attribute Attestations
CREATE TABLE IF NOT EXISTS attribute_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attribute_type VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    verification_method VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
