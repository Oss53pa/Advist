-- ============================================================================
-- Migration 00030: CGU Versions & Acceptances
-- Module 8 — Mentions legales et CGU
-- ============================================================================

-- Versions des CGU
CREATE TABLE IF NOT EXISTS cgu_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,        -- ex: '2026-04-01'
  content_hash VARCHAR(256) NOT NULL,          -- SHA-256 du contenu CGU
  effective_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  summary TEXT,                                 -- Resume des changements
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Une seule version courante
CREATE UNIQUE INDEX idx_cgu_versions_current ON cgu_versions(is_current) WHERE is_current = TRUE;

-- Acceptations des CGU
CREATE TABLE IF NOT EXISTS cgu_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,   -- NULL pour signataires externes
  email VARCHAR(255) NOT NULL,
  cgu_version_id UUID NOT NULL REFERENCES cgu_versions(id) ON DELETE RESTRICT,
  ip_address INET,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_cgu_acceptances_user ON cgu_acceptances(user_id);
CREATE INDEX idx_cgu_acceptances_email ON cgu_acceptances(email);
CREATE INDEX idx_cgu_acceptances_version ON cgu_acceptances(cgu_version_id);

-- Insertion de la premiere version CGU
INSERT INTO cgu_versions (version, content_hash, effective_date, is_current, summary)
VALUES (
  '2026-04-01',
  'initial',  -- Sera mis a jour avec le vrai hash
  '2026-04-01',
  TRUE,
  'Version initiale des CGU - Signature electronique conforme Loi CI 2013-546'
);

-- Commentaires
COMMENT ON TABLE cgu_versions IS 'Versions des Conditions Generales d Utilisation';
COMMENT ON TABLE cgu_acceptances IS 'Acceptations tracees des CGU par les utilisateurs';
