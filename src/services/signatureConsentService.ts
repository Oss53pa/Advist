/**
 * Signature Consent Service
 * Module 6 — Consentement explicite avant signature
 * Loi CI 2013-546 — Consentement expres a la signature electronique
 */
import { supabase } from '../lib/supabase';
import { hashSHA256 } from '../utils/encryption';

// ---------------------------------------------------------------------------
// Consent Text Templates (versioned)
// ---------------------------------------------------------------------------

const CONSENT_TEXTS: Record<string, string> = {
  CI_FR_v1: `CONSENTEMENT À LA SIGNATURE ÉLECTRONIQUE

En apposant votre signature sur ce document, vous reconnaissez et acceptez ce qui suit :

1. VALEUR JURIDIQUE
Votre signature électronique a la même valeur juridique qu'une signature manuscrite, conformément à la Loi ivoirienne n°2013-546 du 30 juillet 2013 relative aux transactions électroniques.

2. IDENTIFICATION
Vous confirmez être la personne identifiée ci-dessus et être autorisé(e) à signer ce document pour votre propre compte ou pour le compte de l'entité que vous représentez.

3. LECTURE DU DOCUMENT
Vous déclarez avoir lu et compris l'intégralité du document soumis à votre signature.

4. IRRÉVOCABILITÉ
Votre signature sera horodatée par un serveur certifié et ne pourra pas être retirée après validation. Le sceau d'intégrité cryptographique lie de manière irréversible votre signature au document.

5. TRAÇABILITÉ
Conformément à la Loi n°2013-450 relative à la protection des données personnelles, les informations suivantes seront enregistrées à des fins de preuve :
- Votre adresse IP et votre navigateur
- L'heure exacte de signature (horodatage serveur)
- Le résultat de la vérification de votre identité (OTP)
- L'empreinte cryptographique (SHA-256) du document au moment de la signature

6. CONSERVATION
Les preuves de votre signature seront conservées pendant une durée minimale de 10 ans, conformément à l'Acte Uniforme OHADA sur le droit commercial général.

En cochant les cases ci-dessous et en apposant votre signature, vous consentez expressément à toutes les conditions ci-dessus.`,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsentParams {
  documentId: string;
  signerEmail: string;
  signerName?: string;
  signerId?: string;
  identityConfirmed: boolean;
  legalEquivalenceAccepted: boolean;
  documentReadConfirmed: boolean;
  cguAccepted: boolean;
  cguVersion?: string;
}

export interface ConsentRecord {
  id: string;
  documentId: string;
  signerEmail: string;
  consentVersion: string;
  consentedAt: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class SignatureConsentService {
  /**
   * Retourne le texte de consentement courant pour une locale donnee
   */
  getCurrentConsentText(_locale = 'fr'): { text: string; version: string } {
    const version = 'CI_FR_v1';
    const text = CONSENT_TEXTS[version] || CONSENT_TEXTS.CI_FR_v1;
    return { text, version };
  }

  /**
   * Enregistre le consentement du signataire
   */
  async recordConsent(params: ConsentParams): Promise<ConsentRecord> {
    const { text, version } = this.getCurrentConsentText();
    const consentTextHash = await hashSHA256(text);

    const { data, error } = await supabase
      .from('signature_consents')
      .insert({
        document_id: params.documentId,
        signer_id: params.signerId || null,
        signer_email: params.signerEmail,
        signer_name: params.signerName || null,
        consent_version: version,
        consent_text: text,
        consent_text_hash: consentTextHash,
        identity_confirmed: params.identityConfirmed,
        legal_equivalence_accepted: params.legalEquivalenceAccepted,
        document_read_confirmed: params.documentReadConfirmed,
        cgu_accepted: params.cguAccepted,
        cgu_version: params.cguVersion || null,
        ip_address: null, // Set server-side if needed
        user_agent: navigator.userAgent,
      })
      .select('id, document_id, signer_email, consent_version, consented_at')
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      documentId: data.document_id,
      signerEmail: data.signer_email,
      consentVersion: data.consent_version,
      consentedAt: data.consented_at,
    };
  }

  /**
   * Recupere le consentement par ID
   */
  async getConsent(consentId: string) {
    const { data, error } = await supabase
      .from('signature_consents')
      .select('*')
      .eq('id', consentId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Recupere tous les consentements pour un document
   */
  async getDocumentConsents(documentId: string) {
    const { data, error } = await supabase
      .from('signature_consents')
      .select('*')
      .eq('document_id', documentId)
      .order('consented_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const signatureConsentService = new SignatureConsentService();
