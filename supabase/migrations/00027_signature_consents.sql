-- ============================================================================
-- Migration 00027: Signature Consents
-- Module 6 — Consentement explicite avant signature
-- Loi CI 2013-546 — Consentement expres a la signature electronique
-- ============================================================================

CREATE TABLE IF NOT EXISTS signature_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Liens
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_signature_id UUID REFERENCES document_signatures(id) ON DELETE SET NULL,
  signer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL pour externes

  -- Identite du signataire
  signer_email VARCHAR(255) NOT NULL,
  signer_name VARCHAR(255),

  -- Texte de consentement (stocke integralement pour preuve)
  consent_version VARCHAR(20) NOT NULL,        -- ex: 'CI_FR_v1.0'
  consent_text TEXT NOT NULL,                   -- texte complet affiche
  consent_text_hash VARCHAR(256) NOT NULL,      -- SHA-256 du texte (preuve d'integrite)

  -- Checkboxes
  identity_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  legal_equivalence_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  document_read_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  cgu_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  cgu_version VARCHAR(20),

  -- Traçabilite
  ip_address INET,
  user_agent TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadonnees
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_signature_consents_document ON signature_consents(document_id);
CREATE INDEX idx_signature_consents_signer ON signature_consents(signer_email);
CREATE INDEX idx_signature_consents_signature ON signature_consents(document_signature_id);

-- Commentaire
COMMENT ON TABLE signature_consents IS 'Consentement explicite avant signature electronique - Loi CI 2013-546';
COMMENT ON COLUMN signature_consents.consent_text IS 'Texte integral du consentement affiche au signataire (preuve)';
COMMENT ON COLUMN signature_consents.consent_text_hash IS 'SHA-256 du texte de consentement pour verification d integrite';
