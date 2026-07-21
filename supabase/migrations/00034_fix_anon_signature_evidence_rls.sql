-- ============================================================================
-- Migration 00034 : Correctif de securite CRITIQUE
-- Revoque l'acces direct `anon` aux tables de preuve de signature.
--
-- CONTEXTE
-- La migration 00032 accordait a `anon` : SELECT/INSERT/UPDATE sur
-- signer_verifications et SELECT/INSERT sur signature_consents, toutes en
-- USING(true) / WITH CHECK(true). La cle `anon` etant publique (presente dans
-- le bundle JS), la RLS constituait l'unique frontiere de securite.
--
-- Consequences avant correctif :
--   1. Fuite PII : signer_email / signer_phone / ip_address / user_agent de
--      TOUS les signataires, toutes organisations confondues.
--   2. Contournement OTP par ecriture : UPDATE ... SET status='verified'
--      suffisait a valider une identite sans connaitre le code. Idem pour
--      remettre `attempts` a 0 (neutralisation de l'anti-brute-force).
--   3. Contournement OTP par cassage : `otp_hash` (SHA-256 non sale d'un code
--      a 6 chiffres) etait lisible => 10^6 hachages pre-calculables.
--
-- PRINCIPE DU CORRECTIF
-- L'Edge Function `verify-signer-otp` opere en SERVICE_ROLE et realise deja
-- 100 % des INSERT/UPDATE sur signer_verifications. Les droits d'ecriture
-- `anon` sont donc de la surface d'attaque pure, sans usage legitime.
-- Le seul besoin de lecture `anon` est la page publique /verify, qui lit
-- 3 colonnes non sensibles via une jointure depuis document_signatures.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. signer_verifications — suppression des droits d'ecriture anon
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_insert_signer_verifications" ON signer_verifications;
DROP POLICY IF EXISTS "anon_update_signer_verifications" ON signer_verifications;
DROP POLICY IF EXISTS "anon_select_signer_verifications" ON signer_verifications;

-- ----------------------------------------------------------------------------
-- 2. signer_verifications — lecture anon strictement encadree
--
-- Autorisee uniquement pour les verifications effectivement rattachees a une
-- signature publiee (document_signatures.verification_id). Une verification en
-- cours (OTP en vol) reste donc invisible a `anon`.
-- ----------------------------------------------------------------------------
CREATE POLICY "anon_read_published_verification" ON signer_verifications
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM document_signatures ds
      WHERE ds.verification_id = signer_verifications.id
    )
  );

-- Restriction au niveau colonne : la RLS filtre les lignes, pas les colonnes.
-- On retire le SELECT table-wide puis on ne re-accorde que les 3 colonnes
-- consommees par /verify. otp_hash, signer_email, signer_phone, ip_address,
-- user_agent, attempts ne sont plus jamais exposes a `anon`.
REVOKE ALL ON signer_verifications FROM anon;
GRANT SELECT (id, verification_level, otp_channel, verified_at)
  ON signer_verifications TO anon;

-- ----------------------------------------------------------------------------
-- 3. signature_consents — suppression de la lecture anon
--
-- Aucun appelant applicatif : signatureConsentService.getConsent() et
-- getDocumentConsents() ne sont references nulle part dans src/.
-- Seul recordConsent() (INSERT) est utilise, par ConsentScreen.tsx.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_signature_consents" ON signature_consents;
DROP POLICY IF EXISTS "anon_insert_signature_consents" ON signature_consents;

-- INSERT conserve (signataire externe non authentifie) mais contraint :
-- le document cible doit exister. Empeche l'injection de consentements
-- orphelins / le remplissage de la table de preuve avec du bruit.
CREATE POLICY "anon_insert_consent_for_existing_document" ON signature_consents
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id)
  );

REVOKE ALL ON signature_consents FROM anon;
GRANT INSERT ON signature_consents TO anon;

-- ----------------------------------------------------------------------------
-- 4. Tracabilite
-- ----------------------------------------------------------------------------
COMMENT ON POLICY "anon_read_published_verification" ON signer_verifications IS
  'Lecture publique limitee aux verifications rattachees a une signature publiee (page /verify). Colonnes restreintes par GRANT.';
COMMENT ON POLICY "anon_insert_consent_for_existing_document" ON signature_consents IS
  'Consentement de signataire externe non authentifie, restreint aux documents existants.';
