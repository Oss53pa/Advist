-- ════════════════════════════════════════════════════════════════════
-- Advist — harden SECURITY DEFINER helper grants
-- ════════════════════════════════════════════════════════════════════
-- The Supabase security linter flags SECURITY DEFINER functions exposed
-- to the `anon` role via /rest/v1/rpc/*. These helpers are only meaningful
-- for signed-in users:
--   • auth_org_ids        — used inside RLS policies evaluated for the
--                           authenticated role; must stay executable by
--                           `authenticated`, never needed by `anon`.
--   • create_org_with_admin — a signed-in user action (uses auth.uid()).
--
-- Revoke EXECUTE from anon/public, keep it for authenticated only.
-- (The remaining "authenticated can execute" linter notice is by design —
--  an RLS helper has to be callable by signed-in users, same posture as
--  the pre-existing public.fna_auth_org_ids.)
-- ════════════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.auth_org_ids(text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.auth_org_ids(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_org_with_admin(uuid, text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.create_org_with_admin(uuid, text) TO authenticated;
