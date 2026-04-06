-- ============================================================================
-- Migration 00026: Signer Verifications (OTP)
-- Module 1 — Verification d'identite du signataire avant signature
-- Loi CI 2013-546, Article 11 — Identification du signataire
-- ============================================================================

-- Enum pour le niveau de verification
DO $$ BEGIN
  CREATE TYPE verification_level AS ENUM ('basic', 'standard', 'reinforced', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum pour le statut de verification
DO $$ BEGIN
  CREATE TYPE verification_status_otp AS ENUM ('pending', 'verified', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS signer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lien vers le partage de document (signataire externe)
  document_share_id UUID REFERENCES document_shares(id) ON DELETE SET NULL,

  -- Lien vers le document
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Identite du signataire
  signer_email VARCHAR(255) NOT NULL,
  signer_name VARCHAR(255),
  signer_phone VARCHAR(50),           -- Pour SMS OTP (niveau renforce)

  -- Configuration OTP
  verification_level verification_level NOT NULL DEFAULT 'standard',
  otp_channel VARCHAR(20) NOT NULL DEFAULT 'email',  -- 'email' | 'sms'
  otp_hash VARCHAR(256) NOT NULL,     -- SHA-256 du code OTP (jamais en clair)
  otp_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  otp_expires_at TIMESTAMPTZ NOT NULL,  -- sent_at + 10 minutes

  -- Tentatives
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,

  -- Resultat
  verified_at TIMESTAMPTZ,            -- NULL si pas encore verifie
  status verification_status_otp NOT NULL DEFAULT 'pending',

  -- Metadonnees de traçabilite
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide par email et document
CREATE INDEX idx_signer_verifications_email ON signer_verifications(signer_email);
CREATE INDEX idx_signer_verifications_document ON signer_verifications(document_id);
CREATE INDEX idx_signer_verifications_status ON signer_verifications(status);
CREATE INDEX idx_signer_verifications_share ON signer_verifications(document_share_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_signer_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_signer_verifications_updated_at
  BEFORE UPDATE ON signer_verifications
  FOR EACH ROW EXECUTE FUNCTION update_signer_verifications_updated_at();

-- Commentaire table
COMMENT ON TABLE signer_verifications IS 'Verification OTP des signataires avant signature - Loi CI 2013-546 Art.11';
COMMENT ON COLUMN signer_verifications.otp_hash IS 'SHA-256 du code OTP - jamais stocke en clair';
