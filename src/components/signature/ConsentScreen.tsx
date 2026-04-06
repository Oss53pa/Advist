/**
 * ConsentScreen — Consentement explicite avant signature electronique
 * Module 6 — Loi CI 2013-546
 *
 * Affiche le texte legal et requiert 3 checkboxes obligatoires
 * avant de permettre l'acces a l'interface de signature.
 */
import React, { useState, useRef } from 'react';
import { Shield, FileText, Scale, ScrollText, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { signatureConsentService } from '../../services/signatureConsentService';

interface ConsentScreenProps {
  documentId: string;
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  signerId?: string;
  onConsent: (consentId: string) => void;
  onCancel: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  documentId,
  documentTitle,
  signerName,
  signerEmail,
  signerId,
  onConsent,
  onCancel,
}) => {
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [documentRead, setDocumentRead] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { text: consentText } = signatureConsentService.getCurrentConsentText();

  const allChecked = identityConfirmed && legalAccepted && documentRead && cguAccepted;

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleSubmit = async () => {
    if (!allChecked) return;

    setLoading(true);
    setError('');

    try {
      const result = await signatureConsentService.recordConsent({
        documentId,
        signerEmail,
        signerName,
        signerId,
        identityConfirmed,
        legalEquivalenceAccepted: legalAccepted,
        documentReadConfirmed: documentRead,
        cguAccepted,
      });

      onConsent(result.id);
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de l\'enregistrement du consentement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-700" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Consentement obligatoire
          </h3>
          <p className="text-sm text-gray-500">
            Loi ivoirienne n°2013-546 — Signature electronique
          </p>
        </div>
      </div>

      {/* Document info */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Document :</span>
          <span className="font-medium text-gray-900">{documentTitle}</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <span className="text-gray-600">Signataire :</span>
          <span className="font-medium text-gray-900">{signerName || signerEmail}</span>
        </div>
      </div>

      {/* Legal text (scrollable) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed max-h-[300px]"
      >
        {consentText}
      </div>

      {!hasScrolledToBottom && (
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-amber-600 flex items-center justify-center gap-1">
            <ScrollText className="w-3 h-3" />
            Veuillez lire l'integralite du texte en faisant defiler vers le bas
          </p>
        </div>
      )}

      {/* Checkboxes */}
      <div className="px-4 py-3 space-y-3 border-t border-gray-200 bg-gray-50">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={identityConfirmed}
            onChange={(e) => setIdentityConfirmed(e.target.checked)}
            disabled={!hasScrolledToBottom}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <span className={`text-sm ${!hasScrolledToBottom ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
            Je confirme etre <strong>{signerName || signerEmail}</strong> et etre autorise(e) a signer ce document.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            disabled={!hasScrolledToBottom}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <span className={`text-sm ${!hasScrolledToBottom ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
            <Scale className="w-3 h-3 inline mr-1" />
            J'accepte que ma signature electronique a la meme valeur juridique qu'une signature manuscrite
            (Loi n°2013-546).
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={documentRead}
            onChange={(e) => setDocumentRead(e.target.checked)}
            disabled={!hasScrolledToBottom}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <span className={`text-sm ${!hasScrolledToBottom ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
            Je declare avoir lu et compris l'integralite du document « {documentTitle} ».
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={cguAccepted}
            onChange={(e) => setCguAccepted(e.target.checked)}
            disabled={!hasScrolledToBottom}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <span className={`text-sm ${!hasScrolledToBottom ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
            J'accepte les{' '}
            <a href="/legal/cgu" target="_blank" className="text-primary-600 underline hover:text-primary-700">
              Conditions Generales d'Utilisation
            </a>{' '}
            d'ADVIST.
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!allChecked || loading}
          className="gap-2"
        >
          {loading ? (
            <>Enregistrement...</>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Continuer vers la signature
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConsentScreen;
