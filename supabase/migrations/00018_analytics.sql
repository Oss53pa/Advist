-- Organization Profiles (analytics)
CREATE TABLE organization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    maturity_level INTEGER DEFAULT 1,
    digital_score DECIMAL(5,2) DEFAULT 0,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    security_score DECIMAL(5,2) DEFAULT 0,
    last_assessment_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id)
);

-- Organization Metrics
CREATE TABLE organization_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(50),
    dimensions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, metric_date, metric_type)
);

-- Industry Benchmarks
CREATE TABLE industry_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100) NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    period DATE NOT NULL,
    avg_value DECIMAL(15,2),
    median_value DECIMAL(15,2),
    p25_value DECIMAL(15,2),
    p75_value DECIMAL(15,2),
    p90_value DECIMAL(15,2),
    sample_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(industry, metric_type, period)
);

-- Organization Benchmark Positions
CREATE TABLE organization_benchmark_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    benchmark_id UUID NOT NULL REFERENCES industry_benchmarks(id) ON DELETE CASCADE,
    org_value DECIMAL(15,2) NOT NULL,
    percentile DECIMAL(5,2),
    calculated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, benchmark_id)
);

-- ROI Calculations
CREATE TABLE roi_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    investment DECIMAL(15,2) DEFAULT 0,
    savings DECIMAL(15,2) DEFAULT 0,
    roi_percentage DECIMAL(10,2) DEFAULT 0,
    methodology TEXT,
    assumptions JSONB DEFAULT '{}',
    breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Best Practices
CREATE TABLE best_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    industry VARCHAR(100),
    difficulty VARCHAR(50) DEFAULT 'medium',
    impact VARCHAR(50) DEFAULT 'medium',
    implementation_guide TEXT,
    resources JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Organization Best Practices (tracking)
CREATE TABLE organization_best_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    best_practice_id UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, best_practice_id)
);

-- Executive Reports
CREATE TABLE executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    summary TEXT,
    generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
