-- Migration: Add is_emitter column to profiles
-- Concept "Utilisateur Émetteur" : un utilisateur interne qui peut créer et initier des workflows.
-- Les signataires/validateurs externes ne comptent pas dans le quota émetteur.
-- Business: 1 à 5 émetteurs max
-- Enterprise: illimité

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_emitter BOOLEAN DEFAULT FALSE;

-- Les admins et managers sont émetteurs par défaut.
-- NB : les rôles ne sont pas une colonne de `profiles` mais sont modélisés
-- via `user_roles` (jointure) → `roles.name`. On passe donc par une
-- sous-requête EXISTS (idempotente, ré-exécutable).
UPDATE profiles p
SET is_emitter = TRUE
WHERE EXISTS (
  SELECT 1
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = p.id
    AND ur.is_active = TRUE
    AND lower(r.name) IN ('admin', 'manager')
);

-- Index pour compter rapidement les émetteurs par organisation
CREATE INDEX IF NOT EXISTS idx_profiles_emitter_org
  ON profiles (organization_id, is_emitter)
  WHERE is_active = TRUE AND is_emitter = TRUE;

-- Commentaire
COMMENT ON COLUMN profiles.is_emitter IS 'Utilisateur émetteur: peut créer et initier des workflows. Quota: Business 1-5, Enterprise illimité.';
