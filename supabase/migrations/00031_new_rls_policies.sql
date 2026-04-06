-- ============================================================================
-- Migration 00031: RLS Policies for Legal Evidence Tables
-- Securite : Row Level Security pour les nouvelles tables
-- ============================================================================

-- ============================================================================
-- signer_verifications
-- ============================================================================
ALTER TABLE signer_verifications ENABLE ROW LEVEL SECURITY;

-- Service role : acces complet
CREATE POLICY "service_role_signer_verifications" ON signer_verifications
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Utilisateurs authentifies : lecture de leurs propres verifications
CREATE POLICY "users_read_own_verifications" ON signer_verifications
  FOR SELECT TO authenticated
  USING (
    signer_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- signature_consents
-- ============================================================================
ALTER TABLE signature_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_signature_consents" ON signature_consents
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "users_read_own_consents" ON signature_consents
  FOR SELECT TO authenticated
  USING (
    signer_id = auth.uid()
    OR signer_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- document_retention
-- ============================================================================
ALTER TABLE document_retention ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_document_retention" ON document_retention
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "org_members_read_retention" ON document_retention
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Seuls les admins peuvent modifier la retention
CREATE POLICY "org_admins_manage_retention" ON document_retention
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- cgu_versions
-- ============================================================================
ALTER TABLE cgu_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_cgu_versions" ON cgu_versions
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Lecture publique des versions CGU (necessaire pour tous)
CREATE POLICY "public_read_cgu_versions" ON cgu_versions
  FOR SELECT TO authenticated USING (TRUE);

-- ============================================================================
-- cgu_acceptances
-- ============================================================================
ALTER TABLE cgu_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_cgu_acceptances" ON cgu_acceptances
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "users_read_own_cgu_acceptances" ON cgu_acceptances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_cgu_acceptances" ON cgu_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
