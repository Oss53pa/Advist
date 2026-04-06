-- ============================================================================
-- Migration 00029: Signature Integrity Fields
-- Modules 2 & 3 — Horodatage serveur + Liaison cryptographique signature-document
-- ============================================================================

-- Ajout des colonnes de valeur probante a document_signatures
ALTER TABLE document_signatures
  ADD COLUMN IF NOT EXISTS server_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS document_hash VARCHAR(256),
  ADD COLUMN IF NOT EXISTS signature_image_hash VARCHAR(256),
  ADD COLUMN IF NOT EXISTS integrity_seal VARCHAR(256),
  ADD COLUMN IF NOT EXISTS verification_id UUID REFERENCES signer_verifications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consent_id UUID REFERENCES signature_consents(id) ON DELETE SET NULL;

-- Index pour la recherche par verification et consent
CREATE INDEX IF NOT EXISTS idx_document_signatures_verification ON document_signatures(verification_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_consent ON document_signatures(consent_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_integrity ON document_signatures(integrity_seal);

-- Commentaires
COMMENT ON COLUMN document_signatures.server_timestamp IS 'Horodatage serveur authoritative (pas client) - incontestable';
COMMENT ON COLUMN document_signatures.document_hash IS 'SHA-256 du document au moment de la signature';
COMMENT ON COLUMN document_signatures.signature_image_hash IS 'SHA-256 de l image de signature';
COMMENT ON COLUMN document_signatures.integrity_seal IS 'SHA-256(document_hash + signature_image_hash + signer_id + server_timestamp) - sceau d integrite';
COMMENT ON COLUMN document_signatures.verification_id IS 'Reference vers la verification OTP du signataire';
COMMENT ON COLUMN document_signatures.consent_id IS 'Reference vers le consentement explicite du signataire';
