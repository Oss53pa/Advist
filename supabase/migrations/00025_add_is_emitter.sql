-- Migration: Add is_emitter column to profiles
-- Concept "Utilisateur Émetteur" : un utilisateur interne qui peut créer et initier des workflows.
-- Les signataires/validateurs externes ne comptent pas dans le quota émetteur.
-- Business: 1 à 5 émetteurs max
-- Enterprise: illimité

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_emitter BOOLEAN DEFAULT FALSE;

-- Les admins et managers sont émetteurs par défaut
UPDATE profiles SET is_emitter = TRUE WHERE role IN ('admin', 'manager');

-- Index pour compter rapidement les émetteurs par organisation
CREATE INDEX IF NOT EXISTS idx_profiles_emitter_org
  ON profiles (organization_id, is_emitter)
  WHERE is_active = TRUE AND is_emitter = TRUE;

-- Commentaire
COMMENT ON COLUMN profiles.is_emitter IS 'Utilisateur émetteur: peut créer et initier des workflows. Quota: Business 1-5, Enterprise illimité.';
