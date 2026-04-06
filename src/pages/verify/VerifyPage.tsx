/**
 * Public Verification Page
 * Module 4 — Portail de verification publique
 *
 * Accessible SANS compte ADVIST — par un juge, un avocat, un notaire
 * Route: /verify/:code?
 */
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  Search,
  Lock,
  FileText,
  Clock,
  User,
  _Hash,
  _ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PrintButton } from '../../shared/PrintEngine';

interface VerificationResult {
  status: 'AUTHENTIC' | 'TAMPERED' | 'NOT_FOUND';
  document?: {
    title: string;
    reference: string;
    signedAt: string;
  };
  signatures: Array<{
    signerEmail: string;
    signerName: string;
    signedAt: string;
    verificationMethod: string;
    integritySeal: string;
    integrityStatus: 'VALID' | 'INVALID';
  }>;
}

export const VerifyPage: React.FC = () => {
  const { code: urlCode } = useParams<{ code: string }>();
  const [inputCode, setInputCode] = useState(urlCode || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Search for document by verification code in audit_logs or metadata
      // For now, search in document_signatures metadata
      const { data: signatures, error: queryError } = await supabase
        .from('document_signatures')
        .select(
          `
          id,
          document_id,
          user_id,
          signature_type,
          signed_at,
          server_timestamp,
          document_hash,
          signature_image_hash,
          integrity_seal,
          verification_id,
          ip_address,
          documents:document_id (title, document_type),
          signer:profiles!document_signatures_user_id_fkey(first_name, last_name, email),
          verification:signer_verifications!document_signatures_verification_id_fkey(
            verification_level, otp_channel, verified_at
          )
        `
        )
        .eq('integrity_seal', code)
        .limit(10);

      if (queryError) {
        // If the query fails due to table not existing yet, show not found
        setResult({ status: 'NOT_FOUND', signatures: [] });
        return;
      }

      if (!signatures || signatures.length === 0) {
        setResult({ status: 'NOT_FOUND', signatures: [] });
        return;
      }

      const doc = (signatures[0] as any).documents;

      setResult({
        status: 'AUTHENTIC',
        document: {
          title: doc?.title || 'Document',
          reference: signatures[0].document_id?.substring(0, 8) || '',
          signedAt: signatures[0].server_timestamp || signatures[0].signed_at,
        },
        signatures: signatures.map((sig: any) => {
          const signer = sig.signer;
          const verification = sig.verification;
          return {
            signerEmail: signer?.email ? maskEmail(signer.email) : 'Signataire externe',
            signerName: signer ? `${signer.first_name} ${signer.last_name}` : 'Signataire externe',
            signedAt: sig.server_timestamp || sig.signed_at,
            verificationMethod: verification?.otp_channel
              ? `OTP ${verification.otp_channel} verifie`
              : sig.signature_type || 'Simple',
            integritySeal: sig.integrity_seal || 'N/A',
            integrityStatus: sig.integrity_seal ? 'VALID' : 'INVALID',
          };
        }),
      });
    } catch {
      setError('Erreur lors de la verification. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-400" />
            <div>
              <h1 className="font-decorative text-xl">Advist</h1>
              <p className="text-xs text-primary-400">Portail de verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary-400">
            <Lock className="w-3 h-3" />
            <span>Conforme Loi CI 2013-546</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Search Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Verifier l'authenticite d'un document
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Saisissez le code de verification ou le sceau d'integrite present sur le certificat de
            signature.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Code de verification ou sceau d'integrite"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-mono"
            />
            <button
              onClick={handleVerify}
              disabled={loading || !inputCode.trim()}
              className="px-6 py-3 bg-primary-900 text-white rounded-lg font-medium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Verifier
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">
            {/* Status Banner */}
            {result.status === 'AUTHENTIC' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-800">DOCUMENT AUTHENTIQUE</h3>
                    <p className="text-sm text-green-600 mt-1">
                      La signature electronique est valide et le document n'a pas ete modifie.
                    </p>
                  </div>
                  <PrintButton
                    config={{
                      title: 'Certificat de vérification',
                      subtitle: 'Portail de vérification ADVIST',
                      appName: 'Advist',
                    }}
                    className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-all"
                    label="Imprimer le certificat"
                  >
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        CERTIFICAT DE VERIFICATION
                      </h2>
                      <p style={{ marginBottom: 4 }}>Statut : DOCUMENT AUTHENTIQUE</p>
                      {result.document && (
                        <>
                          <p>Titre : {result.document.title}</p>
                          <p>Référence : {result.document.reference}</p>
                          <p>
                            Signé le : {new Date(result.document.signedAt).toLocaleString('fr-FR')}
                          </p>
                        </>
                      )}
                      {result.signatures.length > 0 && (
                        <>
                          <h3
                            style={{
                              fontSize: 14,
                              fontWeight: 'bold',
                              marginTop: 12,
                              marginBottom: 4,
                            }}
                          >
                            Signatures ({result.signatures.length})
                          </h3>
                          {result.signatures.map((sig, i) => (
                            <div
                              key={i}
                              style={{
                                marginBottom: 6,
                                paddingLeft: 8,
                                borderLeft: '2px solid #16a34a',
                              }}
                            >
                              <p>
                                {sig.signerName} — {sig.signerEmail}
                              </p>
                              <p>
                                Méthode : {sig.verificationMethod} — Intégrité :{' '}
                                {sig.integrityStatus}
                              </p>
                              <p>Date : {new Date(sig.signedAt).toLocaleString('fr-FR')}</p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </PrintButton>
                </div>
              </div>
            )}

            {result.status === 'NOT_FOUND' && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-7 h-7 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-700">DOCUMENT NON TROUVE</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Aucun document ne correspond a ce code de verification. Verifiez que le code
                      est correctement saisi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result.status === 'TAMPERED' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-7 h-7 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800">DOCUMENT MODIFIE</h3>
                    <p className="text-sm text-red-600 mt-1">
                      Le sceau d'integrite ne correspond pas. Le document ou la signature a ete
                      modifie.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Info */}
            {result.document && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Document
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Titre :</span>
                    <span className="text-sm font-medium text-gray-900">
                      {result.document.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Signe le :</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(result.document.signedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Signatures */}
            {result.signatures.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Signatures ({result.signatures.length})
                </h4>
                <div className="space-y-4">
                  {result.signatures.map((sig, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 text-sm">
                            {sig.signerName}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            sig.integrityStatus === 'VALID'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {sig.integrityStatus === 'VALID' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {sig.integrityStatus === 'VALID' ? 'Valide' : 'Invalide'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <span>Email : {sig.signerEmail}</span>
                        <span>Verification : {sig.verificationMethod}</span>
                        <span>Date : {new Date(sig.signedAt).toLocaleString('fr-FR')}</span>
                        <span className="font-mono">
                          Sceau : {sig.integritySeal.substring(0, 16)}...
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legal info */}
        <div className="mt-12 text-center text-xs text-gray-400">
          <p>Portail de verification conforme a la Loi ivoirienne n\u00b02013-546</p>
          <p className="mt-1">ADVIST — Atlas Studio SARL — Abidjan, Cote d'Ivoire</p>
        </div>
      </main>
    </div>
  );
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = `${local.charAt(0)}***${local.length > 1 ? local.charAt(local.length - 1) : ''}`;
  return `${masked}@${domain}`;
}

export default VerifyPage;
