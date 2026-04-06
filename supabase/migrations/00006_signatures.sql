-- User Signatures (stored signature images/data)
CREATE TABLE IF NOT EXISTS user_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    signature_data TEXT, -- base64 encoded signature image
    signature_type signature_type DEFAULT 'simple',
    is_default BOOLEAN DEFAULT false,
    certificate_id UUID, -- FK added after certificates table
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Signature Certificates
CREATE TABLE IF NOT EXISTS signature_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    certificate_data TEXT NOT NULL,
    issuer VARCHAR(500),
    subject VARCHAR(500),
    serial_number VARCHAR(255),
    not_before TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    fingerprint VARCHAR(128),
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add FK from user_signatures to signature_certificates
DO $$ BEGIN
    ALTER TABLE user_signatures
        ADD CONSTRAINT fk_user_signatures_certificate
        FOREIGN KEY (certificate_id) REFERENCES signature_certificates(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Document Signatures (actual signature instances on documents)
CREATE TABLE IF NOT EXISTS document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_signature_id UUID REFERENCES user_signatures(id) ON DELETE SET NULL,
    signature_type signature_type DEFAULT 'simple',
    status signature_status DEFAULT 'pending',
    page_number INTEGER,
    x_position FLOAT,
    y_position FLOAT,
    width FLOAT,
    height FLOAT,
    signature_hash VARCHAR(256),
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    location VARCHAR(255),
    signed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Signature Audit Log
CREATE TABLE IF NOT EXISTS signature_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_signature_id UUID NOT NULL REFERENCES document_signatures(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Qualified Certificates (eIDAS)
CREATE TABLE IF NOT EXISTS qualified_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(255) NOT NULL,
    certificate_id_external VARCHAR(500),
    level VARCHAR(50) DEFAULT 'qualified',
    status verification_status DEFAULT 'pending',
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Identity Verification Sessions
CREATE TABLE IF NOT EXISTS identity_verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(255) NOT NULL,
    session_id_external VARCHAR(500),
    status verification_status DEFAULT 'pending',
    verification_method VARCHAR(100),
    result JSONB,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
