-- ============================================================================
-- Migration 00038 : Reconstruction de la piste d'audit d'Advist
--
-- CONTEXTE
-- `audit_logs` était à l'origine le journal org-scopé d'Advist (migration 00032 :
-- chaînage SHA-256 sur organization_id, immuabilité — loi CI 2013-546). La table
-- a depuis été accaparée par le produit comptable (ajout de `tenant_id` NOT NULL
-- vers `societes`, writers post_journal_entry / validate_journal_entry /
-- apply_lettrage, chaîne de hash société-scopée). Advist ne peut plus y écrire :
--   - `tenant_id` (société) n'est pas déductible d'un `organization_id`
--     (une organisation a N sociétés) ;
--   - écrire des événements documentaires dans `audit_logs` les entrelacerait
--     dans la chaîne de hash de conformité COMPTABLE (corruption sémantique).
--
-- SOLUTION
-- Journal d'audit DÉDIÉ à Advist, org-scopé, reprenant fidèlement la conception
-- 00032 (immuable + chaîné), découplé de `audit_logs` désormais comptable.
-- Le writer et le lecteur applicatif sont réalignés sur cette table.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.advist_audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          text NOT NULL,               -- create | update | delete
  resource_type   text NOT NULL,               -- documents | document_signatures | workflow_instances
  resource_id     text NOT NULL,
  resource_name   text,
  details         text,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  hash            text,
  previous_hash   text
);

CREATE INDEX IF NOT EXISTS idx_advist_audit_org_time
  ON public.advist_audit_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advist_audit_resource
  ON public.advist_audit_logs (resource_type, resource_id);

-- ----------------------------------------------------------------------------
-- 2. Chaînage SHA-256 par organisation (miroir org-scopé de 00032)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advist_compute_audit_hash()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
DECLARE
  prev_hash text;
BEGIN
  SELECT hash INTO prev_hash
  FROM public.advist_audit_logs
  WHERE organization_id = NEW.organization_id
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.previous_hash = COALESCE(prev_hash, 'GENESIS');
  -- pgcrypto est installé dans le schéma `extensions` (Supabase) : on qualifie
  -- explicitement plutôt que d'élargir le search_path.
  NEW.hash = encode(
    extensions.digest(
      COALESCE(NEW.organization_id::text, '') || '|' ||
      COALESCE(NEW.action, '')                || '|' ||
      COALESCE(NEW.resource_type, '')         || '|' ||
      COALESCE(NEW.resource_id, '')           || '|' ||
      COALESCE(NEW.user_id::text, '')         || '|' ||
      COALESCE(NEW.created_at::text, '')      || '|' ||
      COALESCE(prev_hash, 'GENESIS'),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trig_advist_audit_hash_chain
  BEFORE INSERT ON public.advist_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.advist_compute_audit_hash();

-- ----------------------------------------------------------------------------
-- 3. Immuabilité — aucune modification ni suppression (réutilise 00032)
-- ----------------------------------------------------------------------------
CREATE TRIGGER trig_advist_audit_no_update
  BEFORE UPDATE ON public.advist_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modification();
CREATE TRIGGER trig_advist_audit_no_delete
  BEFORE DELETE ON public.advist_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modification();

-- ----------------------------------------------------------------------------
-- 4. Writer générique — journalise les entités métier d'Advist
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advist_auto_audit_log()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_action text;
  v_org    uuid;
  v_rec    jsonb;
  v_id     text;
BEGIN
  v_action = CASE TG_OP WHEN 'INSERT' THEN 'create'
                        WHEN 'UPDATE' THEN 'update'
                        WHEN 'DELETE' THEN 'delete' END;

  -- Snapshot JSON : accès aux champs sans supposer qu'ils existent.
  v_rec = to_jsonb(COALESCE(NEW, OLD));
  v_id  = v_rec->>'id';

  -- organization_id : direct, ou dérivé du document parent pour les signatures
  -- (document_signatures ne porte pas organization_id).
  IF TG_TABLE_NAME = 'document_signatures' THEN
    SELECT d.organization_id INTO v_org
    FROM public.documents d
    WHERE d.id = (v_rec->>'document_id')::uuid;
  ELSE
    v_org = (v_rec->>'organization_id')::uuid;
  END IF;

  -- Sans organisation résolvable, on n'audite pas (mais on ne bloque JAMAIS
  -- l'écriture métier).
  IF v_org IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.advist_audit_logs
    (organization_id, user_id, action, resource_type, resource_id, resource_name, details)
  VALUES (
    v_org,
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    v_id,
    COALESCE(v_rec->>'name', v_rec->>'title', v_id),
    TG_OP
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trig_advist_audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.advist_auto_audit_log();
CREATE TRIGGER trig_advist_audit_signatures
  AFTER INSERT OR UPDATE OR DELETE ON public.document_signatures
  FOR EACH ROW EXECUTE FUNCTION public.advist_auto_audit_log();
CREATE TRIGGER trig_advist_audit_workflows
  AFTER INSERT OR UPDATE OR DELETE ON public.workflow_instances
  FOR EACH ROW EXECUTE FUNCTION public.advist_auto_audit_log();

-- ----------------------------------------------------------------------------
-- 5. RLS — lecture par les membres de l'organisation, écriture via trigger only
-- ----------------------------------------------------------------------------
ALTER TABLE public.advist_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advist_audit_select_own_org" ON public.advist_audit_logs
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Immuabilité renforcée côté RLS (le writer est SECURITY DEFINER et contourne
-- la RLS ; aucune policy INSERT n'est accordée aux rôles anon/authenticated).
CREATE POLICY "advist_audit_deny_update" ON public.advist_audit_logs FOR UPDATE USING (false);
CREATE POLICY "advist_audit_deny_delete" ON public.advist_audit_logs FOR DELETE USING (false);

COMMENT ON TABLE public.advist_audit_logs IS
  'Piste d''audit d''Advist (org-scopée, immuable, chaînée SHA-256). Découplée de audit_logs, désormais propriété du produit comptable. Loi CI 2013-546.';
