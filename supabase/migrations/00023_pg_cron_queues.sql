-- ============================================
-- Migration: Redis replacement
-- pg_cron for scheduled jobs + task queue table
-- ============================================

-- Enable pg_cron extension (available on Supabase Pro+)
-- CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ============================================
-- TASK QUEUE TABLE (replaces Redis Queue / Celery)
-- ============================================
CREATE TABLE IF NOT EXISTS task_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_queue_status ON task_queue(status, scheduled_for);
CREATE INDEX idx_task_queue_type ON task_queue(task_type);
CREATE INDEX idx_task_queue_org ON task_queue(organization_id);

-- RLS for task queue
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_queue_select" ON task_queue FOR SELECT USING (
    organization_id = public.get_user_org_id()
);
CREATE POLICY "task_queue_insert" ON task_queue FOR INSERT WITH CHECK (
    organization_id = public.get_user_org_id()
);

-- ============================================
-- CACHE TABLE (replaces Redis cache)
-- ============================================
CREATE TABLE IF NOT EXISTS cache_entries (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cache_expires ON cache_entries(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_cache_org ON cache_entries(organization_id);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_entries WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to process pending tasks
CREATE OR REPLACE FUNCTION process_task_queue()
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    task RECORD;
BEGIN
    -- Mark stale processing tasks as failed (> 30 min)
    UPDATE task_queue
    SET status = 'failed', error_message = 'Task timed out'
    WHERE status = 'processing'
      AND started_at < NOW() - INTERVAL '30 minutes';

    -- Retry failed tasks that haven't exceeded max retries
    UPDATE task_queue
    SET status = 'pending', retry_count = retry_count + 1
    WHERE status = 'failed'
      AND retry_count < max_retries
      AND updated_at < NOW() - INTERVAL '5 minutes';

    GET DIAGNOSTICS processed_count = ROW_COUNT;
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- pg_cron SCHEDULES (uncomment on Supabase Pro)
-- ============================================
-- Deadline check: every day at 08:00 UTC
-- SELECT cron.schedule(
--     'deadline-notifications',
--     '0 8 * * *',
--     $$SELECT net.http_post(
--         url := current_setting('app.settings.supabase_url') || '/functions/v1/deadline-cron',
--         headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
--     )$$
-- );

-- Clean expired cache: every hour
-- SELECT cron.schedule(
--     'clean-cache',
--     '0 * * * *',
--     $$SELECT clean_expired_cache()$$
-- );

-- Process task queue: every 5 minutes
-- SELECT cron.schedule(
--     'process-tasks',
--     '*/5 * * * *',
--     $$SELECT process_task_queue()$$
-- );

-- Clean old audit logs (archive after 90 days)
-- SELECT cron.schedule(
--     'archive-audit-logs',
--     '0 2 * * 0',
--     $$INSERT INTO audit_log_archives (organization_id, archived_data, archived_at)
--       SELECT organization_id, jsonb_agg(row_to_json(al)), NOW()
--       FROM audit_logs al
--       WHERE created_at < NOW() - INTERVAL '90 days'
--       GROUP BY organization_id;
--       DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';$$
-- );
