-- ════════════════════════════════════════════════════════════════════
-- Advist — Multi-tenant invitation system
-- ════════════════════════════════════════════════════════════════════
-- Adapted from the generic multi-tenant invitation template to the
-- Atlas Studio uuid schema (the template used `text` org ids; Atlas
-- Studio's `organizations.id` is uuid).
--
-- Model:
--   • user_orgs   = AUTHORITATIVE membership (user_id ↔ org + role). This
--                   is what RLS reads. Written ONLY by the service-role
--                   (Edge Function) or the SECURITY DEFINER RPC below
--                   → no client-side privilege escalation (no INSERT/
--                   UPDATE/DELETE policy for the client).
--   • org_members = email-keyed display roster (list an invitee BEFORE
--                   they have accepted / have a user_id).
--
-- Consistency: user_orgs / org_members are backfilled from ACTIVE
-- licence_seats (the universal Atlas Studio access system) so the two
-- never diverge. Seat-role → membership-role mapping:
--   app_super_admin / app_admin → admin
--   editor                      → editor
--   viewer (and anything else)  → viewer
-- ════════════════════════════════════════════════════════════════════

-- 1) Membership (RLS source of truth) — uuid org_id, FK to existing organizations
CREATE TABLE IF NOT EXISTS public.user_orgs (
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer')),
  added_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

-- 2) Display roster (email key, for the admin "team" screen)
CREATE TABLE IF NOT EXISTS public.org_members (
  id            bigserial PRIMARY KEY,
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email         text NOT NULL,
  name          text,
  role          text NOT NULL DEFAULT 'viewer',
  active        boolean NOT NULL DEFAULT true,
  invited_at    timestamptz DEFAULT now(),
  last_login_at timestamptz,
  UNIQUE (org_id, email)
);

-- 3) RLS helper: org_ids of the current user (optionally a minimum role).
--    SECURITY DEFINER ⇒ reads user_orgs bypassing RLS ⇒ NO recursion when
--    business-table policies call it.
CREATE OR REPLACE FUNCTION public.auth_org_ids(min_role text DEFAULT NULL)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.user_orgs
  WHERE user_id = auth.uid()
    AND (
      min_role IS NULL
      OR (min_role = 'viewer')
      OR (min_role = 'editor' AND role IN ('admin','editor'))
      OR (min_role = 'admin'  AND role = 'admin')
    );
$$;

-- 4) RPC bootstrap: create an org + add self as admin (atomic, controlled).
--    The client cannot write user_orgs directly (no INSERT policy), but can
--    create an org it becomes admin of via this gated function.
CREATE OR REPLACE FUNCTION public.create_org_with_admin(p_org_id uuid, p_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organizations(id, name) VALUES (p_org_id, p_name)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_orgs(user_id, org_id, role) VALUES (auth.uid(), p_org_id, 'admin')
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'admin';
END; $$;

-- 5) RLS: user_orgs — user sees own memberships; writes via service-role / RPC.
ALTER TABLE public.user_orgs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_orgs_select_own ON public.user_orgs;
CREATE POLICY user_orgs_select_own ON public.user_orgs FOR SELECT
  USING (user_id = auth.uid());

-- 6) RLS: org_members — members read, admins manage.
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_members_select ON public.org_members;
CREATE POLICY org_members_select ON public.org_members FOR SELECT
  USING (org_id IN (SELECT public.auth_org_ids()));
DROP POLICY IF EXISTS org_members_admin_all ON public.org_members;
CREATE POLICY org_members_admin_all ON public.org_members FOR ALL
  USING (org_id IN (SELECT public.auth_org_ids('admin')))
  WITH CHECK (org_id IN (SELECT public.auth_org_ids('admin')));

-- 7) + 8) Backfill membership & roster from ACTIVE licence_seats.
--    `licence_seats` (l'ancien système d'accès mutualisé Atlas Studio) n'existe
--    pas dans le schéma de ce dépôt : sans garde, ces INSERT échouent avec
--    « relation licence_seats does not exist ». On enveloppe donc le backfill
--    dans un bloc conditionnel en SQL dynamique (EXECUTE) — il ne s'exécute que
--    si la table est présente (ex. base mutualisée), et est inoffensif sinon.
DO $backfill$
BEGIN
  IF to_regclass('public.licence_seats') IS NULL THEN
    RAISE NOTICE 'licence_seats absente : backfill user_orgs/org_members ignoré.';
    RETURN;
  END IF;

  -- 7) Backfill membership, deduped à une ligne par (user_id, org_id),
  --    en gardant le rôle le plus fort.
  EXECUTE $sql$
    INSERT INTO public.user_orgs (user_id, org_id, role)
    SELECT user_id, org_id, role FROM (
      SELECT
        ls.user_id,
        ls.tenant_id AS org_id,
        CASE ls.role
          WHEN 'app_super_admin' THEN 'admin'
          WHEN 'app_admin'       THEN 'admin'
          WHEN 'editor'          THEN 'editor'
          ELSE 'viewer'
        END AS role,
        ROW_NUMBER() OVER (
          PARTITION BY ls.user_id, ls.tenant_id
          ORDER BY CASE ls.role
            WHEN 'app_super_admin' THEN 1
            WHEN 'app_admin'       THEN 2
            WHEN 'editor'          THEN 3
            ELSE 4 END
        ) AS rn
      FROM public.licence_seats ls
      WHERE ls.user_id IS NOT NULL
        AND ls.status = 'active'
        AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = ls.tenant_id)
    ) t
    WHERE t.rn = 1
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = EXCLUDED.role;
  $sql$;

  -- 8) Backfill roster, dedupé par (org_id, email) en préférant actif + rôle fort.
  EXECUTE $sql$
    INSERT INTO public.org_members (org_id, email, name, role, active)
    SELECT org_id, email, name, role, active FROM (
      SELECT
        ls.tenant_id AS org_id,
        ls.email,
        ls.full_name AS name,
        CASE ls.role
          WHEN 'app_super_admin' THEN 'admin'
          WHEN 'app_admin'       THEN 'admin'
          WHEN 'editor'          THEN 'editor'
          ELSE 'viewer'
        END AS role,
        (ls.status = 'active') AS active,
        ROW_NUMBER() OVER (
          PARTITION BY ls.tenant_id, lower(ls.email)
          ORDER BY (ls.status = 'active') DESC,
            CASE ls.role
              WHEN 'app_super_admin' THEN 1
              WHEN 'app_admin'       THEN 2
              WHEN 'editor'          THEN 3
              ELSE 4 END
        ) AS rn
      FROM public.licence_seats ls
      WHERE ls.email IS NOT NULL
        AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = ls.tenant_id)
    ) t
    WHERE t.rn = 1
    ON CONFLICT (org_id, email) DO NOTHING;
  $sql$;
END
$backfill$;

-- ════════════════════════════════════════════════════════════════════
-- PATTERN TO COPY ONTO EACH NEW BUSINESS TABLE (one with organization_id)
-- Read = any member ; write = editor/admin. NOTE the column is
-- `organization_id` (not `org_id`) on Advist business tables.
-- Existing Advist tables (documents, folders, projects, workflow_instances,
-- signatures, …) ALREADY have RLS — do NOT add these on top (permissive
-- policies OR-combine and would widen access).
-- ════════════════════════════════════════════════════════════════════
-- ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY yt_select ON public.your_table FOR SELECT
--   USING (organization_id IN (SELECT public.auth_org_ids()));
-- CREATE POLICY yt_insert ON public.your_table FOR INSERT
--   WITH CHECK (organization_id IN (SELECT public.auth_org_ids('editor')));
-- CREATE POLICY yt_update ON public.your_table FOR UPDATE
--   USING (organization_id IN (SELECT public.auth_org_ids('editor')));
-- CREATE POLICY yt_delete ON public.your_table FOR DELETE
--   USING (organization_id IN (SELECT public.auth_org_ids('editor')));
