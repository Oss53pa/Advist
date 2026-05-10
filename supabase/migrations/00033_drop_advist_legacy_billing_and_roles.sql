-- =============================================================================
-- Migration 00033 — Drop Advist legacy billing & role tables
-- =============================================================================
--
-- Atlas Studio Suite is now the source of truth for:
--   * Subscription / plan management → tables `plans`, `licences`, `subscriptions`
--   * Role / seat management         → table  `licence_seats` (.role)
--
-- This migration drops Advist-specific legacy tables that have been replaced
-- by the Atlas Studio universal schema. The frontend stopped reading from
-- these tables in earlier phases (Phases 1–3.5).
--
-- Verified row counts at migration time:
--   subscription_plans   : 0 rows  (safe)
--   payments             : 0 rows  (safe)
--   billing_history      : 0 rows  (safe)
--   user_roles           : 0 rows  (safe)
--   profiles.role_id     : 1 row   (single legacy assignment, ignored)
--   roles                : 4 rows  (seed data — admin/manager/accountant/user)
--   role_permissions     : 59 rows (permission matrix on the 4 seed roles)
--
-- Verified shared with Atlas Studio (NOT dropped):
--   subscriptions        — universal (solution_id, app_id, mrr_fcfa, …)
--   subscription_addons  — FK to Atlas Studio subscriptions/addons
--   addons               — Atlas Studio addon catalog
--   invoices             — universal (tenant_id, app_id, cinetpay_…)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Step 1 — Rewrite is_org_admin() to read from licence_seats.role
--   (must happen BEFORE dropping user_roles/roles, since it references them)
--   New definition: a user is "org admin" if they hold an active licence_seat
--   with role app_super_admin or app_admin in their current organization's
--   tenant. Atlas Studio Suite owns this assignment.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.licence_seats ls
    WHERE ls.user_id = auth.uid()
      AND ls.status = 'active'
      AND ls.role IN ('app_super_admin', 'app_admin')
  )
$function$;

-- -----------------------------------------------------------------------------
-- Step 2 — Drop the now-unused profiles.role_id column
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role_id;

-- -----------------------------------------------------------------------------
-- Step 3 — Drop role-related tables (Advist legacy)
--   role_permissions and user_roles depend on roles → drop them first.
--   CASCADE ensures any leftover RLS policies referencing these tables are
--   removed too.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles      CASCADE;
DROP TABLE IF EXISTS public.roles           CASCADE;

-- -----------------------------------------------------------------------------
-- Step 4 — Drop Advist legacy subscription/payment tables
--   subscription_plans is not referenced (Advist now reads plans from Atlas).
--   payments has no rows; Atlas Studio tracks payments via
--     invoices.cinetpay_transaction_id / invoices.stripe_payment_intent_id.
--   billing_history has no rows; Atlas Studio uses licence_audit_log.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.payments           CASCADE;
DROP TABLE IF EXISTS public.billing_history    CASCADE;

COMMIT;
