-- ============================================
-- Triggers & Utility Functions for ADVIST
-- ============================================

-- 1. Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables that have the column
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'organizations', 'departments', 'profiles', 'roles', 'user_roles',
        'document_types', 'folders', 'documents', 'document_access',
        'document_annotations', 'document_comments', 'projects',
        'project_workflows', 'workflow_templates', 'workflow_instances', 'workflow_steps',
        'user_signatures', 'signature_certificates', 'document_signatures',
        'qualified_certificates', 'identity_verification_sessions',
        'notification_templates', 'notification_preferences',
        'subscription_plans', 'subscriptions', 'invoices', 'payments', 'addons', 'subscription_addons',
        'collaboration_presence', 'document_shares',
        'support_tickets', 'support_messages',
        'consent_purposes', 'consents', 'data_subject_requests',
        'processing_activities', 'data_breaches', 'privacy_impact_assessments',
        'registered_deliveries', 'qualified_archives', 'attribute_attestations',
        'integration_connections', 'integration_field_mappings', 'webhooks',
        'social_accounts', 'post_templates', 'publications',
        'blog_posts', 'newsletter_subscribers', 'newsletters',
        'ip_allowlists', 'api_keys',
        'retention_policies', 'archived_documents', 'archive_jobs',
        'asset_categories', 'information_assets', 'risk_register',
        'control_objectives', 'control_implementations', 'risk_treatments',
        'internal_audits', 'audit_findings', 'management_reviews',
        'isms_documents', 'security_incidents',
        'competence_records', 'training_records',
        'business_continuity_plans', 'supplier_assessments',
        'corrective_actions', 'document_change_requests',
        'organization_profiles', 'industry_benchmarks',
        'roi_calculations', 'organization_best_practices',
        'ai_conversations', 'electronic_seals',
        'salesforce_mappings'
    ]) LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
            tbl
        );
    END LOOP;
END $$;

-- 2. Handle new user: create profile after auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            CONCAT(
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                ' ',
                COALESCE(NEW.raw_user_meta_data->>'last_name', '')
            )
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Check organization quota before document insert
CREATE OR REPLACE FUNCTION public.check_org_document_quota()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_docs INTEGER;
BEGIN
    SELECT o.max_documents INTO max_docs
    FROM organizations o
    WHERE o.id = NEW.organization_id;

    IF max_docs IS NOT NULL THEN
        SELECT COUNT(*) INTO current_count
        FROM documents
        WHERE organization_id = NEW.organization_id
          AND deleted_at IS NULL;

        IF current_count >= max_docs THEN
            RAISE EXCEPTION 'Organization document quota exceeded (% / %)', current_count, max_docs;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_document_quota
    BEFORE INSERT ON documents
    FOR EACH ROW EXECUTE FUNCTION public.check_org_document_quota();

-- 4. Update organization storage usage after document changes
CREATE OR REPLACE FUNCTION public.update_org_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE organizations
        SET storage_used_mb = storage_used_mb + COALESCE(NEW.file_size, 0) / (1024 * 1024)
        WHERE id = NEW.organization_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE organizations
        SET storage_used_mb = GREATEST(0, storage_used_mb - COALESCE(OLD.file_size, 0) / (1024 * 1024))
        WHERE id = OLD.organization_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_storage_on_document_insert
    AFTER INSERT ON documents
    FOR EACH ROW EXECUTE FUNCTION public.update_org_storage_usage();

CREATE TRIGGER update_storage_on_document_delete
    AFTER DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION public.update_org_storage_usage();

-- 5. Cryptographic chaining for audit logs (SHA-256)
CREATE OR REPLACE FUNCTION public.chain_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash TEXT;
    payload TEXT;
BEGIN
    -- Get the hash of the previous audit log entry for this org
    SELECT hash INTO prev_hash
    FROM audit_logs
    WHERE organization_id = NEW.organization_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    NEW.previous_hash = COALESCE(prev_hash, 'GENESIS');

    -- Build the payload to hash
    payload = CONCAT(
        NEW.id::TEXT,
        NEW.organization_id::TEXT,
        COALESCE(NEW.user_id::TEXT, ''),
        NEW.action::TEXT,
        NEW.resource_type,
        COALESCE(NEW.resource_id::TEXT, ''),
        NEW.created_at::TEXT,
        NEW.previous_hash
    );

    NEW.hash = encode(extensions.digest(payload, 'sha256'), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chain_audit_log_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.chain_audit_log();

-- 6. Auto audit log: generic trigger for business tables
CREATE OR REPLACE FUNCTION public.auto_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_action audit_action;
    v_org_id UUID;
    v_resource_name TEXT;
    v_details JSONB;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action = 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        v_action = 'update';
    ELSIF TG_OP = 'DELETE' THEN
        v_action = 'delete';
    END IF;

    -- Get org_id from the record
    IF TG_OP = 'DELETE' THEN
        v_org_id = OLD.organization_id;
        v_resource_name = COALESCE(OLD.name, OLD.title, OLD.id::TEXT);
    ELSE
        v_org_id = NEW.organization_id;
        v_resource_name = COALESCE(NEW.name, NEW.title, NEW.id::TEXT);
    END IF;

    -- Skip if no org_id (shouldn't happen but safety)
    IF v_org_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Build details
    IF TG_OP = 'UPDATE' THEN
        -- Only log changed columns (compare OLD and NEW as JSONB)
        v_details = jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP
        );
    ELSE
        v_details = jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP
        );
    END IF;

    INSERT INTO audit_logs (organization_id, user_id, action, resource_type, resource_id, resource_name, details, created_at)
    VALUES (
        v_org_id,
        auth.uid(),
        v_action,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        v_resource_name,
        v_details,
        now()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply auto audit to key business tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'documents', 'workflow_instances', 'document_signatures'
    ]) LOOP
        EXECUTE format(
            'CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION public.auto_audit_log()',
            tbl, tbl
        );
    END LOOP;
END $$;
