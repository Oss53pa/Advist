import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  PenTool,
  ArrowLeft,
  Shield,
  User,
  Calendar,
  Building2,
  Lock,
  ChevronDown,
  Send,
  X,
  Upload,
  Edit3,
  Type,
  Trash2,
  Image,
  Check,
  Mail,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { DocumentDetailPage } from '../documents/DocumentDetailPage';
import { ConsentScreen } from '../../components/signature/ConsentScreen';
import { signerOtpService } from '../../services/signerOtpService';
import { signatureService } from '../../services/signatureService';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExternalStep =
  | 'loading'
  | 'error'
  | 'ready'
  | 'viewing'
  | 'otp_sending'
  | 'otp_input'
  | 'otp_verified'
  | 'consent'
  | 'signing'
  | 'signed';

interface ShareData {
  id: string;
  token: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  documentPages: number;
  documentSize: string;
  signerEmail: string;
  signerName: string;
  senderName: string;
  senderEmail: string;
  senderOrganization: string;
  message?: string;
  expiresAt: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExternalUserPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromSettings = searchParams.get('from') === 'settings';

  // Flow state
  const [step, setStep] = useState<ExternalStep>('loading');
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // View / activity
  const [hasViewed, setHasViewed] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [comment, setComment] = useState('');

  // OTP state
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Consent state
  const [consentId, setConsentId] = useState<string | null>(null);

  // Signature states
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load share data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadShareData = async () => {
      // P0-E001: Pas de mode demo — toujours valider le token
      if (!token) {
        setErrorMessage('Aucun token de partage fourni. Verifiez le lien recu par email.');
        setStep('error');
        return;
      }

      try {
        // Fetch document share by token
        const { data: share, error } = await supabase
          .from('document_shares')
          .select(`
            id,
            token,
            document_id,
            access_type,
            expires_at,
            is_active,
            created_at,
            documents:document_id (
              id, title, document_type, file_size,
              organization:organization_id (name),
              owner:created_by (first_name, last_name, email)
            )
          `)
          .eq('token', token)
          .eq('is_active', true)
          .single();

        if (error || !share) {
          setErrorMessage('Ce lien de signature est invalide ou a expire.');
          setStep('error');
          return;
        }

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
          setErrorMessage('Ce lien de signature a expire.');
          setStep('error');
          return;
        }

        const doc = share.documents as any;
        setShareData({
          id: share.id,
          token: share.token,
          documentId: doc.id,
          documentTitle: doc.title || 'Document',
          documentType: doc.document_type || 'Document',
          documentPages: 0,
          documentSize: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : '',
          signerEmail: '',  // External signer email from workflow step
          signerName: '',
          senderName: doc.owner ? `${doc.owner.first_name} ${doc.owner.last_name}` : '',
          senderEmail: doc.owner?.email || '',
          senderOrganization: doc.organization?.name || '',
          message: '',
          expiresAt: share.expires_at || '',
          createdAt: share.created_at,
        });
        setStep('ready');
      } catch {
        setErrorMessage('Erreur lors du chargement du document.');
        setStep('error');
      }
    };

    loadShareData();
  }, [token]);

  // ---------------------------------------------------------------------------
  // OTP countdown timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // OTP handlers
  // ---------------------------------------------------------------------------

  const handleSendOtp = async () => {
    if (!shareData) return;
    setOtpLoading(true);
    setOtpError('');

    try {
      const result = await signerOtpService.sendOtp({
        email: shareData.signerEmail,
        name: shareData.signerName,
        documentId: shareData.documentId,
        documentShareId: shareData.id,
      });
      setVerificationId(result.verificationId);
      setOtpCountdown(result.expiresIn);
      setStep('otp_input');
    } catch (err) {
      setOtpError((err as Error).message || 'Erreur lors de l\'envoi du code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newDigits.every((d) => d !== '') && newDigits.join('').length === 6) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    if (!verificationId) return;
    const otpCode = code || otpDigits.join('');
    if (otpCode.length !== 6) return;

    setOtpLoading(true);
    setOtpError('');

    try {
      const result = await signerOtpService.verifyOtp(verificationId, otpCode);

      if (result.verified) {
        setStep('otp_verified');
        // Small delay for visual feedback then proceed to consent
        setTimeout(() => setStep('consent'), 1000);
      } else if (result.locked) {
        setOtpError('Trop de tentatives. Veuillez demander un nouveau code.');
      } else {
        setOtpError(
          `Code incorrect. ${result.remainingAttempts} tentative(s) restante(s).`,
        );
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setOtpError((err as Error).message || 'Erreur de verification');
    } finally {
      setOtpLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Consent handler
  // ---------------------------------------------------------------------------

  const handleConsent = (id: string) => {
    setConsentId(id);
    setStep('signing');
  };

  // ---------------------------------------------------------------------------
  // Sign handler
  // ---------------------------------------------------------------------------

  const handleSign = async () => {
    if (!shareData) return;

    try {
      await signatureService.signDocument(
        shareData.documentId,
        shareData.signerEmail, // signerId = email for externals
        shareData.signerName,
        shareData.signerEmail,
        {
          data: typedSignature || uploadedSignature || '',
          format: signatureMode === 'upload' ? 'png' : 'text',
        },
        'simple',
        undefined,
        verificationId || undefined,
        consentId || undefined,
      );
      setStep('signed');
    } catch (err) {
      setOtpError((err as Error).message || 'Erreur lors de la signature');
    }
  };

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const data = shareData;
  const daysRemaining = data?.expiresAt
    ? Math.max(0, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 86400000))
    : 30;
  const isSigned = step === 'signed';

  // ---------------------------------------------------------------------------
  // Error screen
  // ---------------------------------------------------------------------------

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h2>
          <p className="text-gray-500">{errorMessage}</p>
          <Link to="/" className="mt-6 inline-block text-primary-600 hover:underline text-sm">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading screen
  // ---------------------------------------------------------------------------

  if (step === 'loading' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="flex items-center gap-3 text-primary-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement du document...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-primary-50 lg:overflow-hidden">
      {/* Header - Organization Branding */}
      <header className="flex-shrink-0 bg-white border-b border-primary-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 bg-primary-900 text-white text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <span>Connexion securisee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary-400 hidden sm:inline">Propulse par</span>
            <span className="font-decorative text-lg">Advist</span>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fromSettings && (
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors -ml-1"
                >
                  <ArrowLeft className="w-5 h-5 text-primary-600" />
                </button>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-primary-900 to-primary-800 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                {data.senderOrganization.charAt(0)}
              </div>
              <div>
                <h1 className="text-base font-semibold text-primary-900">{data.senderOrganization}</h1>
                <p className="text-xs text-primary-500">vous a envoye un document a signer</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg text-sm">
              <User className="w-4 h-4 text-primary-400" />
              <span className="font-medium text-primary-700">{data.signerName || data.signerEmail}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-5 overflow-y-auto lg:overflow-hidden">
        <div className="lg:h-full grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left Column */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Status Card */}
            {isSigned ? (
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-green-800">Document signe avec succes</h2>
                  <p className="text-sm text-green-600">Une copie vous sera envoyee par email.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white font-medium rounded-lg hover:bg-primary-800 transition-colors">
                  <Download className="w-4 h-4" />
                  Telecharger
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-primary-900">Action requise</h2>
                  <p className="text-sm text-primary-700">Expire dans {daysRemaining} jour(s)</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-primary-700 bg-primary-100 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {new Date(data.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            )}

            {/* Document Card */}
            <div className="flex-1 bg-white rounded-xl border border-primary-200 flex flex-col">
              <div className="p-4 sm:p-5 flex gap-4 sm:gap-5">
                <div className="w-14 h-16 sm:w-16 sm:h-20 bg-gradient-to-b from-red-500 to-red-600 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg shadow-red-500/20">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="text-[10px] font-bold mt-1">PDF</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-primary-900 leading-tight line-clamp-2">{data.documentTitle}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-primary-500">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary-50 text-primary-800 font-medium rounded-md text-xs">{data.documentType}</span>
                    {data.documentPages > 0 && <span>{data.documentPages} pages</span>}
                    {data.documentSize && (
                      <>
                        <span className="hidden sm:inline text-primary-300">&#8226;</span>
                        <span className="hidden sm:inline">{data.documentSize}</span>
                      </>
                    )}
                  </div>

                  {data.message && (
                    <div className="hidden sm:block mt-4 p-3 bg-primary-50 rounded-lg border-l-4 border-primary-900">
                      <p className="text-sm text-primary-600 italic line-clamp-2">"{data.message}"</p>
                      <p className="text-xs text-primary-400 mt-1">-- {data.senderName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="flex-1 px-5 border-t border-primary-100">
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className="w-full py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary-400" />
                    <span className="font-medium text-primary-700">Historique</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${showActivity ? 'rotate-180' : ''}`} />
                </button>

                {showActivity && (
                  <div className="pb-3 space-y-2">
                    <div className="flex items-center gap-3 text-xs py-1">
                      <div className="w-2 h-2 bg-primary-300 rounded-full flex-shrink-0" />
                      <span className="font-medium text-primary-700">Document envoye</span>
                      <span className="text-primary-400">&#8226;</span>
                      <span className="text-primary-400">{data.senderName}</span>
                      <span className="text-primary-400 ml-auto">
                        {new Date(data.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {hasViewed && (
                      <div className="flex items-center gap-3 text-xs py-1">
                        <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0" />
                        <span className="font-medium text-primary-700">Document consulte</span>
                        <span className="text-primary-400">&#8226;</span>
                        <span className="text-primary-400">Vous</span>
                      </div>
                    )}
                    {verificationId && step !== 'otp_sending' && (
                      <div className="flex items-center gap-3 text-xs py-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        <span className="font-medium text-blue-700">Identite verifiee (OTP)</span>
                      </div>
                    )}
                    {consentId && (
                      <div className="flex items-center gap-3 text-xs py-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        <span className="font-medium text-blue-700">Consentement enregistre</span>
                      </div>
                    )}
                    {isSigned && (
                      <div className="flex items-center gap-3 text-xs py-1">
                        <div className="w-2 h-2 bg-primary-900 rounded-full flex-shrink-0" />
                        <span className="font-medium text-green-600">Document signe</span>
                        <span className="text-primary-400">&#8226;</span>
                        <span className="text-primary-400">Vous</span>
                        <span className="text-primary-400 ml-auto">A l'instant</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-5 border-t border-primary-100">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* View Button */}
                  <button
                    onClick={() => {
                      setShowDocument(true);
                      setHasViewed(true);
                    }}
                    className={`flex-1 flex items-center justify-center gap-3 py-3.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                      hasViewed
                        ? 'bg-green-50 text-green-600 border-2 border-green-200'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200 active:bg-primary-300 border-2 border-transparent'
                    }`}
                  >
                    {hasViewed ? <CheckCircle className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    {hasViewed ? 'Document consulte' : 'Consulter'}
                  </button>

                  {/* Sign Button — starts OTP flow */}
                  <button
                    onClick={() => {
                      // P0-E001: Toujours passer par OTP
                      setStep('otp_sending');
                      handleSendOtp();
                    }}
                    disabled={!hasViewed || isSigned}
                    className={`flex-1 flex items-center justify-center gap-3 py-3.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                      isSigned
                        ? 'bg-green-50 text-green-600 border-2 border-green-200'
                        : !hasViewed
                        ? 'bg-primary-50 text-primary-400 cursor-not-allowed border-2 border-transparent'
                        : 'bg-primary-900 text-white hover:bg-primary-800 active:bg-primary-800 shadow-lg shadow-primary-900/25 border-2 border-transparent'
                    }`}
                  >
                    {isSigned ? <CheckCircle className="w-5 h-5" /> : <PenTool className="w-5 h-5" />}
                    {isSigned ? 'Signe' : 'Signer'}
                  </button>
                </div>

                {!hasViewed && !isSigned && (
                  <p className="text-xs text-center text-primary-400 mt-3">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    Vous devez d'abord consulter le document avant de pouvoir le signer
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-2 flex flex-col gap-5 pb-16 lg:pb-0">
            {/* Sender Card */}
            <div className="bg-white rounded-xl border border-primary-200 p-5">
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">Expediteur</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-900 to-primary-900 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  {data.senderName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary-900">{data.senderName}</p>
                  <p className="text-sm text-primary-500">{data.senderEmail}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-100 flex items-center gap-2 text-sm text-primary-600">
                <Building2 className="w-4 h-4 text-primary-400" />
                <span>{data.senderOrganization}</span>
              </div>
            </div>

            {/* Comment Section */}
            <div className="flex-1 bg-white rounded-xl border border-primary-200 p-5 flex flex-col">
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">Commentaire</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajouter un message pour l'expediteur (optionnel)..."
                className="flex-1 w-full p-3 border border-primary-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all text-sm"
              />
              <button
                disabled={!comment.trim()}
                className={`mt-3 w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  comment.trim()
                    ? 'bg-primary-900 text-white hover:bg-primary-800'
                    : 'bg-primary-100 text-primary-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                Envoyer
              </button>
            </div>

            {/* Security Badge */}
            <div className="hidden lg:block bg-primary-900 rounded-xl p-5 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Signature securisee</p>
                  <p className="text-xs text-primary-400">Valeur legale garantie</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-primary-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Verification OTP obligatoire</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Horodatage serveur certifie</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Sceau d'integrite SHA-256</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Conforme Loi CI 2013-546</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Desktop */}
      <footer className="flex-shrink-0 py-3 border-t border-primary-200 bg-white hidden lg:block">
        <div className="px-4 sm:px-6 flex items-center justify-between text-xs text-primary-400">
          <div className="flex items-center gap-1.5">
            <span>Propulse par</span>
            <span className="font-decorative text-base text-primary-600">Advist</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              eIDAS
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              OHADA
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary-900 text-white px-4 py-2.5 flex items-center justify-between text-xs z-30 safe-area-inset-bottom">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          <span>Signature securisee</span>
        </div>
        <div className="flex items-center gap-3 text-primary-400">
          <span>eIDAS</span>
          <span>&#8226;</span>
          <span>OHADA</span>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocument && (
        <div className="fixed inset-0 bg-black/80 z-50 animate-in fade-in duration-150">
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-shrink-0 bg-primary-900 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{data.documentTitle}</h3>
                  <p className="text-xs text-primary-400">{data.documentPages > 0 ? `${data.documentPages} pages` : ''} {data.documentSize}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocument(false)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-primary-200">
              <DocumentDetailPage embedded={true} />
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* OTP VERIFICATION MODAL                                             */}
      {/* ================================================================== */}
      {(step === 'otp_sending' || step === 'otp_input' || step === 'otp_verified') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Verification d'identite</h3>
                  <p className="text-xs text-gray-500">Loi CI 2013-546 — Art. 11</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStep('ready');
                  setOtpDigits(['', '', '', '', '', '']);
                  setOtpError('');
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'otp_sending' && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-600">Envoi du code de verification...</p>
                  <p className="text-sm text-gray-400 mt-1">{data.signerEmail}</p>
                </div>
              )}

              {step === 'otp_input' && (
                <>
                  <p className="text-center text-gray-600 mb-1">
                    Un code a 6 chiffres a ete envoye a
                  </p>
                  <p className="text-center font-semibold text-gray-900 mb-6">
                    {data.signerEmail}
                  </p>

                  {/* OTP Inputs */}
                  <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                          otpError
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-primary-500'
                        }`}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-center text-red-500 text-sm mb-4">
                      <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                      {otpError}
                    </p>
                  )}

                  {/* Countdown */}
                  <div className="text-center text-sm text-gray-400 mb-4">
                    {otpCountdown > 0 ? (
                      <span>Code valide pendant {formatCountdown(otpCountdown)}</span>
                    ) : (
                      <button
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="text-primary-600 hover:underline flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Renvoyer un nouveau code
                      </button>
                    )}
                  </div>

                  {otpLoading && (
                    <div className="flex justify-center">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                    </div>
                  )}
                </>
              )}

              {step === 'otp_verified' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-700">Identite verifiee</h4>
                  <p className="text-sm text-gray-500 mt-1">Redirection vers le consentement...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* CONSENT MODAL                                                      */}
      {/* ================================================================== */}
      {step === 'consent' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col">
            <ConsentScreen
              documentId={data.documentId}
              documentTitle={data.documentTitle}
              signerName={data.signerName}
              signerEmail={data.signerEmail}
              onConsent={handleConsent}
              onCancel={() => setStep('ready')}
            />
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* SIGNATURE MODAL                                                    */}
      {/* ================================================================== */}
      {step === 'signing' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-primary-100 flex items-center justify-between">
              <h3 className="font-semibold text-primary-900">Signer le document</h3>
              <button
                onClick={() => setStep('ready')}
                className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-primary-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Verification badges */}
              <div className="flex items-center gap-2 mb-4">
                {verificationId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    OTP verifie
                  </span>
                )}
                {consentId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Consentement
                  </span>
                )}
              </div>

              {/* Identity */}
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg mb-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-900" />
                </div>
                <div>
                  <p className="font-medium text-primary-900 text-sm">{data.signerName || 'Signataire'}</p>
                  <p className="text-xs text-primary-500">{data.signerEmail}</p>
                </div>
              </div>

              {/* Signature Mode Tabs */}
              <div className="flex gap-1 p-1 bg-primary-100 rounded-lg mb-4">
                {[
                  { id: 'draw' as const, icon: Edit3, label: 'Dessiner' },
                  { id: 'type' as const, icon: Type, label: 'Saisir' },
                  { id: 'upload' as const, icon: Upload, label: 'Importer' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSignatureMode(mode.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                      signatureMode === mode.id
                        ? 'bg-white text-primary-900 shadow-sm'
                        : 'text-primary-500 hover:text-primary-700'
                    }`}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Draw Mode */}
              {signatureMode === 'draw' && (
                <div className="border-2 border-dashed border-primary-200 rounded-lg h-28 flex items-center justify-center bg-primary-50 cursor-crosshair hover:border-primary-400 transition-all group mb-4">
                  <div className="text-center">
                    <Edit3 className="w-6 h-6 text-primary-300 group-hover:text-primary-400 mx-auto mb-1 transition-colors" />
                    <span className="text-primary-400 text-xs">Dessinez ici</span>
                  </div>
                </div>
              )}

              {/* Type Mode */}
              {signatureMode === 'type' && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Saisissez votre nom"
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all text-sm mb-2"
                  />
                  <div className="p-6 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-2xl font-serif italic text-primary-800 text-center">
                      {typedSignature || 'Signature'}
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Mode */}
              {signatureMode === 'upload' && (
                <div className="mb-4">
                  {!uploadedSignature ? (
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setUploadedSignature(ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary-200 rounded-lg hover:border-primary-400 transition-all">
                        <Image className="w-8 h-8 text-primary-300 group-hover:text-primary-400 transition-colors" />
                        <p className="text-sm text-primary-500">Cliquez ou glissez une image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="p-6 bg-primary-50 rounded-lg border border-primary-200">
                        <img src={uploadedSignature} alt="Signature" className="max-h-20 mx-auto object-contain" />
                      </div>
                      <button
                        onClick={() => setUploadedSignature(null)}
                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-primary-100 flex justify-end gap-2 bg-primary-50">
              <button
                onClick={() => setStep('ready')}
                className="px-4 py-2 text-primary-600 text-sm font-medium hover:bg-primary-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSign}
                disabled={signatureMode === 'upload' && !uploadedSignature}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  !(signatureMode === 'upload' && !uploadedSignature)
                    ? 'bg-primary-900 text-white hover:bg-primary-800'
                    : 'bg-primary-100 text-primary-400 cursor-not-allowed'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Signer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Landing */}
      {!fromSettings && (
        <div className="fixed bottom-14 lg:bottom-4 left-4 z-40">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-primary-900 text-white rounded-lg lg:rounded-xl shadow-lg hover:bg-primary-800 transition-colors text-xs lg:text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ExternalUserPage;
