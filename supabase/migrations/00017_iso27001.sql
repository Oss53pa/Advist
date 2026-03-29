-- ISO 27001 Information Security Management System

-- Asset Categories
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

-- Information Assets
CREATE TABLE information_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type VARCHAR(100),
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    custodian_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    classification VARCHAR(50) DEFAULT 'internal',
    confidentiality_level INTEGER DEFAULT 1,
    integrity_level INTEGER DEFAULT 1,
    availability_level INTEGER DEFAULT 1,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    value_assessment JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Risk Register
CREATE TABLE risk_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    risk_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    asset_id UUID REFERENCES information_assets(id) ON DELETE SET NULL,
    threat VARCHAR(500),
    vulnerability VARCHAR(500),
    likelihood INTEGER DEFAULT 3,
    impact INTEGER DEFAULT 3,
    inherent_risk_level risk_level DEFAULT 'medium',
    residual_risk_level risk_level DEFAULT 'medium',
    risk_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    treatment_plan TEXT,
    treatment_status VARCHAR(50) DEFAULT 'identified',
    treatment_due_date DATE,
    accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    review_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, risk_id)
);

-- Control Objectives (Annex A)
CREATE TABLE control_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clause_number VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    is_annex_a BOOLEAN DEFAULT true,
    parent_id UUID REFERENCES control_objectives(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Control Implementations
CREATE TABLE control_implementations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id UUID NOT NULL REFERENCES control_objectives(id) ON DELETE CASCADE,
    status control_status DEFAULT 'not_implemented',
    implementation_details TEXT,
    evidence TEXT,
    evidence_files JSONB DEFAULT '[]',
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    implementation_date DATE,
    review_date DATE,
    effectiveness VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, control_id)
);

-- Risk Treatments
CREATE TABLE risk_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID NOT NULL REFERENCES risk_register(id) ON DELETE CASCADE,
    control_id UUID REFERENCES control_objectives(id) ON DELETE SET NULL,
    treatment_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'planned',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    effectiveness_review TEXT,
    cost_estimate DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Internal Audits
CREATE TABLE internal_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    audit_type VARCHAR(100),
    scope TEXT,
    lead_auditor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'planned',
    planned_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    summary TEXT,
    findings_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit Findings
CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES internal_audits(id) ON DELETE CASCADE,
    finding_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    finding_type VARCHAR(50) DEFAULT 'observation',
    severity risk_level DEFAULT 'medium',
    control_id UUID REFERENCES control_objectives(id) ON DELETE SET NULL,
    corrective_action TEXT,
    responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'open',
    closed_at TIMESTAMPTZ,
    evidence TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Management Reviews
CREATE TABLE management_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    review_date DATE NOT NULL,
    attendees UUID[] DEFAULT '{}',
    agenda TEXT,
    minutes TEXT,
    decisions JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ISMS Documents
CREATE TABLE isms_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    document_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'draft',
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    review_date DATE,
    classification VARCHAR(50) DEFAULT 'internal',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Security Incidents
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity risk_level DEFAULT 'medium',
    category VARCHAR(100),
    reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'reported',
    containment_actions TEXT,
    root_cause TEXT,
    corrective_actions TEXT,
    lessons_learned TEXT,
    reported_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, incident_id)
);

-- Competence Records
CREATE TABLE competence_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    competence_area VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(50),
    certification VARCHAR(255),
    certified_at DATE,
    expires_at DATE,
    evidence_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Training Records
CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    training_name VARCHAR(255) NOT NULL,
    description TEXT,
    training_type VARCHAR(100),
    provider VARCHAR(255),
    completed_at DATE,
    score DECIMAL(5,2),
    passed BOOLEAN,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Business Continuity Plans
CREATE TABLE business_continuity_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'draft',
    scope TEXT,
    objectives TEXT,
    recovery_strategies JSONB DEFAULT '[]',
    contact_list JSONB DEFAULT '[]',
    testing_schedule JSONB,
    last_tested_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    review_date DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Supplier Assessments
CREATE TABLE supplier_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    service_description TEXT,
    risk_level risk_level DEFAULT 'medium',
    assessment_date DATE,
    next_review_date DATE,
    data_processing BOOLEAN DEFAULT false,
    dpa_signed BOOLEAN DEFAULT false,
    sla_details JSONB,
    security_measures TEXT,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Corrective Actions
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_type VARCHAR(100) NOT NULL,
    source_id UUID,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    root_cause TEXT,
    action_plan TEXT,
    responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'open',
    completed_at TIMESTAMPTZ,
    verification TEXT,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    effectiveness VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Document Change Requests
CREATE TABLE document_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    isms_document_id UUID REFERENCES isms_documents(id) ON DELETE SET NULL,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    implemented_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
