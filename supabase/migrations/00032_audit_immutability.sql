-- ============================================================================
-- Migration 00032: Audit Trail Immutability & Hash Chaining
-- P0-A001/A002: Trigger bloquant UPDATE/DELETE sur audit_logs
-- P1-A003/A005: Chainage SHA-256 automatique
-- P1-A004: Immutabilite signature_audit_log
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. Trigger d'immutabilite — EMPECHE toute modification/suppression
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_IMMUTABLE: Les enregistrements d audit ne peuvent etre ni modifies ni supprimes. Table: %, Operation: %',
    TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

-- audit_logs : immutable
CREATE TRIGGER trig_audit_logs_no_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trig_audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- signature_audit_log : immutable
CREATE TRIGGER trig_signature_audit_log_no_update
  BEFORE UPDATE ON signature_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trig_signature_audit_log_no_delete
  BEFORE DELETE ON signature_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================================
-- 2. RLS explicite DENY pour UPDATE/DELETE
-- ============================================================================

CREATE POLICY "audit_logs_deny_update" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "audit_logs_deny_delete" ON audit_logs FOR DELETE USING (false);
CREATE POLICY "signature_audit_log_deny_update" ON signature_audit_log FOR UPDATE USING (false);
CREATE POLICY "signature_audit_log_deny_delete" ON signature_audit_log FOR DELETE USING (false);

-- ============================================================================
-- 3. Chainage SHA-256 automatique sur audit_logs
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(128);
BEGIN
  SELECT hash INTO prev_hash
  FROM audit_logs
  WHERE organization_id = NEW.organization_id
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.previous_hash = COALESCE(prev_hash, 'GENESIS');
  NEW.hash = encode(
    digest(
      COALESCE(NEW.organization_id::text, '') || '|' ||
      COALESCE(NEW.action::text, '') || '|' ||
      COALESCE(NEW.resource_type::text, '') || '|' ||
      COALESCE(NEW.resource_id::text, '') || '|' ||
      COALESCE(NEW.user_id::text, '') || '|' ||
      COALESCE(NEW.created_at::text, '') || '|' ||
      COALESCE(prev_hash, 'GENESIS'),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_audit_hash_chain
  BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION compute_audit_hash();

-- ============================================================================
-- 4. RLS document_shares: enforcer expires_at cote DB
-- ============================================================================

DROP POLICY IF EXISTS "document_shares_select" ON document_shares;
CREATE POLICY "document_shares_select" ON document_shares FOR SELECT USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_id
      AND d.organization_id = public.get_user_org_id()
    )
  )
);

-- Politique pour acces anonyme via token (signataires externes)
CREATE POLICY "document_shares_select_by_token" ON document_shares FOR SELECT TO anon USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

-- ============================================================================
-- 5. Bloquer modification file_path apres premiere signature
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_file_path_change_after_signature()
RETURNS TRIGGER AS $$
DECLARE
  has_signatures BOOLEAN;
BEGIN
  IF OLD.file_path IS DISTINCT FROM NEW.file_path THEN
    SELECT EXISTS (
      SELECT 1 FROM document_signatures
      WHERE document_id = NEW.id AND status = 'signed'
    ) INTO has_signatures;

    IF has_signatures THEN
      RAISE EXCEPTION 'INTEGRITY_LOCK: Le fichier ne peut pas etre modifie apres signature. Document ID: %', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_prevent_file_change_after_signature
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION prevent_file_path_change_after_signature();

-- ============================================================================
-- 6. Acces anon aux signer_verifications et signature_consents
-- ============================================================================

CREATE POLICY "anon_insert_signer_verifications" ON signer_verifications
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_signer_verifications" ON signer_verifications
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_signer_verifications" ON signer_verifications
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert_signature_consents" ON signature_consents
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_signature_consents" ON signature_consents
  FOR SELECT TO anon USING (true);

-- ============================================================================
-- Commentaires
-- ============================================================================
COMMENT ON FUNCTION prevent_audit_modification() IS 'Garantit l immutabilite de la piste d audit - Loi CI 2013-546';
COMMENT ON FUNCTION compute_audit_hash() IS 'Chaine SHA-256 automatique sur audit_logs pour detection d alteration';
COMMENT ON FUNCTION prevent_file_path_change_after_signature() IS 'Empeche la modification du fichier apres signature';
