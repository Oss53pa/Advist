-- ============================================================================
-- Migration 00028: Document Retention & Anti-Deletion Triggers
-- Module 7 — Conservation legale 10 ans
-- Acte Uniforme OHADA — Conservation des preuves de signature
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_retention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Liens
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Politique de retention
  document_type VARCHAR(100),          -- 'CONTRACT', 'ORDER', 'NDA', etc.
  legal_basis TEXT,                     -- ex: 'OHADA Art. 17', 'Loi CI 2013-546'
  retention_years INTEGER NOT NULL DEFAULT 10,
  retain_until TIMESTAMPTZ NOT NULL,   -- Date jusqu'a laquelle la suppression est interdite

  -- Verrouillage
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  locked_by UUID REFERENCES profiles(id),
  locked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Demande de deverrouillage (workflow admin)
  unlock_requested_by UUID REFERENCES profiles(id),
  unlock_requested_at TIMESTAMPTZ,
  unlock_reason TEXT,

  -- Chemin de stockage
  storage_path TEXT,                    -- Chemin dans Supabase Storage

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un seul record de retention par document
CREATE UNIQUE INDEX idx_document_retention_unique ON document_retention(document_id);
CREATE INDEX idx_document_retention_org ON document_retention(organization_id);
CREATE INDEX idx_document_retention_until ON document_retention(retain_until);
CREATE INDEX idx_document_retention_locked ON document_retention(is_locked) WHERE is_locked = TRUE;

-- ============================================================================
-- Trigger : empeche la suppression de documents sous retention
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_document_deletion()
RETURNS TRIGGER AS $$
DECLARE
  retention_record RECORD;
BEGIN
  SELECT retain_until, is_locked INTO retention_record
  FROM document_retention
  WHERE document_id = OLD.id
    AND is_locked = TRUE
    AND retain_until > NOW()
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'RETENTION_LOCK: Document en periode de retention legale. Suppression impossible avant le %. Base legale: conservation obligatoire.',
      retention_record.retain_until;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_prevent_document_deletion
  BEFORE DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION prevent_document_deletion();

-- ============================================================================
-- Trigger : empeche la suppression de signatures sur documents sous retention
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_signature_deletion()
RETURNS TRIGGER AS $$
DECLARE
  retention_record RECORD;
BEGIN
  SELECT dr.retain_until, dr.is_locked INTO retention_record
  FROM document_retention dr
  WHERE dr.document_id = OLD.document_id
    AND dr.is_locked = TRUE
    AND dr.retain_until > NOW()
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'RETENTION_LOCK: Signature liee a un document en periode de retention legale. Suppression impossible avant le %.',
      retention_record.retain_until;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_prevent_signature_deletion
  BEFORE DELETE ON document_signatures
  FOR EACH ROW EXECUTE FUNCTION prevent_signature_deletion();

-- ============================================================================
-- Trigger : empeche la suppression de la retention elle-meme tant qu'active
-- ============================================================================

CREATE OR REPLACE FUNCTION check_retention_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = TRUE AND OLD.retain_until > NOW() THEN
    RAISE EXCEPTION 'RETENTION_LOCK: Impossible de supprimer un enregistrement de retention actif. Retention jusqu au %.',
      OLD.retain_until;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_retention_self_protection
  BEFORE DELETE ON document_retention
  FOR EACH ROW EXECUTE FUNCTION check_retention_before_delete();

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_document_retention_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_document_retention_updated_at
  BEFORE UPDATE ON document_retention
  FOR EACH ROW EXECUTE FUNCTION update_document_retention_updated_at();

-- Commentaires
COMMENT ON TABLE document_retention IS 'Politique de retention legale des documents signes - OHADA / Loi CI 2013-546';
COMMENT ON FUNCTION prevent_document_deletion() IS 'Empeche la suppression de documents sous retention legale';
COMMENT ON FUNCTION prevent_signature_deletion() IS 'Empeche la suppression de signatures sur documents sous retention';
