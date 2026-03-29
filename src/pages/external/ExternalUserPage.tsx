import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  MessageSquare,
  Send,
  X,
  Upload,
  Edit3,
  Type,
  Trash2,
  Image,
  Check,
  ExternalLink,
} from 'lucide-react';
import { DocumentDetailPage } from '../documents/DocumentDetailPage';

// Données de démonstration
const DEMO_DOCUMENT = {
  id: 'doc-ext-001',
  title: 'Contrat de Prestation de Services 2024',
  type: 'Contrat',
  sender: {
    name: 'Marie Dupont',
    email: 'marie.dupont@entreprise.com',
    organization: 'Entreprise SARL',
    logo: null,
  },
  recipient: {
    name: 'Jean Martin',
    email: 'jean.martin@client.com',
  },
  createdAt: '2024-01-15T10:30:00',
  expiresAt: '2024-02-15T23:59:59',
  status: 'pending_signature',
  message: 'Bonjour Jean, veuillez trouver ci-joint le contrat de prestation pour l\'année 2024. Merci de le signer avant le 15 février.',
  pages: 12,
  size: '2.4 MB',
  actions: [
    { type: 'view', label: 'Consulter le document', required: true },
    { type: 'sign', label: 'Signer électroniquement', required: true },
  ],
};

const DEMO_ACTIVITY = [
  { date: '15 Jan 2024, 10:30', action: 'Document envoyé', user: 'Marie Dupont' },
  { date: '15 Jan 2024, 14:22', action: 'Document ouvert', user: 'Vous' },
];

export const ExternalUserPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromSettings = searchParams.get('from') === 'settings';

  const [hasViewed, setHasViewed] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [comment, setComment] = useState('');

  // Signature states
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState(DEMO_DOCUMENT.recipient.name);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [confirmedIdentity, setConfirmedIdentity] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSign = () => {
    setIsSigned(true);
    setShowSignature(false);
  };

  const daysRemaining = 30;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-primary-50 lg:overflow-hidden">
      {/* Header - Organization Branding */}
      <header className="flex-shrink-0 bg-white border-b border-primary-200 sticky top-0 z-10">
        {/* Top bar with security indicator */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 bg-primary-900 text-white text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <span>Connexion sécurisée</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary-400 hidden sm:inline">Propulsé par</span>
            <span className="font-decorative text-lg">Advist</span>
          </div>
        </div>

        {/* Main header */}
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
              {/* Organization Logo/Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-primary-900 to-primary-800 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                {DEMO_DOCUMENT.sender.organization.charAt(0)}
              </div>
              <div>
                <h1 className="text-base font-semibold text-primary-900">{DEMO_DOCUMENT.sender.organization}</h1>
                <p className="text-xs text-primary-500">vous a envoyé un document à signer</p>
              </div>
            </div>

            {/* Recipient info */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg text-sm">
              <User className="w-4 h-4 text-primary-400" />
              <span className="font-medium text-primary-700">{DEMO_DOCUMENT.recipient.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-5 overflow-y-auto lg:overflow-hidden">
        <div className="lg:h-full grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left Column - Document Info */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Status Card */}
            {isSigned ? (
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-green-800">{t('external.documentSigned')}</h2>
                  <p className="text-sm text-green-600">{t('external.emailCopyConfirm')}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white font-medium rounded-lg hover:bg-primary-800 transition-colors">
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-primary-900">{t('external.actionRequired')}</h2>
                  <p className="text-sm text-primary-700">{t('external.expiresIn', { days: daysRemaining })}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-primary-700 bg-primary-100 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {new Date(DEMO_DOCUMENT.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            )}

            {/* Document Card - Takes remaining space */}
            <div className="flex-1 bg-white rounded-xl border border-primary-200 flex flex-col">
              <div className="p-4 sm:p-5 flex gap-4 sm:gap-5">
                {/* Document Icon */}
                <div className="w-14 h-16 sm:w-16 sm:h-20 bg-gradient-to-b from-red-500 to-red-600 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg shadow-red-500/20">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="text-[10px] font-bold mt-1">PDF</span>
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-primary-900 leading-tight line-clamp-2">{DEMO_DOCUMENT.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-primary-500">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary-50 text-primary-800 font-medium rounded-md text-xs">{DEMO_DOCUMENT.type}</span>
                    <span>{DEMO_DOCUMENT.pages} pages</span>
                    <span className="hidden sm:inline text-primary-300">•</span>
                    <span className="hidden sm:inline">{DEMO_DOCUMENT.size}</span>
                  </div>

                  {/* Message - Hidden on small mobile, visible on larger screens */}
                  {DEMO_DOCUMENT.message && (
                    <div className="hidden sm:block mt-4 p-3 bg-primary-50 rounded-lg border-l-4 border-primary-900">
                      <p className="text-sm text-primary-600 italic line-clamp-2">"{DEMO_DOCUMENT.message}"</p>
                      <p className="text-xs text-primary-400 mt-1">— {DEMO_DOCUMENT.sender.name}</p>
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
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-500 text-xs rounded">
                      {DEMO_ACTIVITY.length + (isSigned ? 1 : 0)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${showActivity ? 'rotate-180' : ''}`} />
                </button>

                {showActivity && (
                  <div className="pb-3 space-y-2">
                    {DEMO_ACTIVITY.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 text-xs py-1">
                        <div className="w-2 h-2 bg-primary-300 rounded-full flex-shrink-0" />
                        <span className="font-medium text-primary-700">{activity.action}</span>
                        <span className="text-primary-400">•</span>
                        <span className="text-primary-400">{activity.user}</span>
                        <span className="text-primary-400 ml-auto">{activity.date}</span>
                      </div>
                    ))}
                    {isSigned && (
                      <div className="flex items-center gap-3 text-xs py-1">
                        <div className="w-2 h-2 bg-primary-900 rounded-full flex-shrink-0" />
                        <span className="font-medium text-green-600">Document signé</span>
                        <span className="text-primary-400">•</span>
                        <span className="text-primary-400">Vous</span>
                        <span className="text-primary-400 ml-auto">À l'instant</span>
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
                    {hasViewed ? 'Document consulté' : 'Consulter'}
                  </button>

                  {/* Sign Button */}
                  <button
                    onClick={() => setShowSignature(true)}
                    disabled={!hasViewed || isSigned}
                    className={`flex-1 flex items-center justify-center gap-3 py-3.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                      isSigned
                        ? 'bg-green-50 text-green-600 border-2 border-green-200'
                        : !hasViewed
                        ? 'bg-primary-50 text-primary-400 cursor-not-allowed border-2 border-transparent'
                        : 'bg-primary-900 text-white hover:bg-primary-900 active:bg-primary-800 shadow-lg shadow-primary-900/25 border-2 border-transparent'
                    }`}
                  >
                    {isSigned ? <CheckCircle className="w-5 h-5" /> : <PenTool className="w-5 h-5" />}
                    {isSigned ? 'Signé' : 'Signer'}
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
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">Expéditeur</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-900 to-primary-900 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  {DEMO_DOCUMENT.sender.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary-900">{DEMO_DOCUMENT.sender.name}</p>
                  <p className="text-sm text-primary-500">{DEMO_DOCUMENT.sender.email}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-100 flex items-center gap-2 text-sm text-primary-600">
                <Building2 className="w-4 h-4 text-primary-400" />
                <span>{DEMO_DOCUMENT.sender.organization}</span>
              </div>
            </div>

            {/* Comment Section */}
            <div className="flex-1 bg-white rounded-xl border border-primary-200 p-5 flex flex-col">
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">Commentaire</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajouter un message pour l'expéditeur (optionnel)..."
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

            {/* Security Badge - Hidden on mobile, shown in mobile footer instead */}
            <div className="hidden lg:block bg-primary-900 rounded-xl p-5 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Signature sécurisée</p>
                  <p className="text-xs text-primary-400">Valeur légale garantie</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-primary-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Chiffrement de bout en bout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Horodatage certifié</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Conforme eIDAS & OHADA</span>
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
            <span>Propulsé par</span>
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

      {/* Mobile Footer - Fixed bottom bar with security info */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary-900 text-white px-4 py-2.5 flex items-center justify-between text-xs z-30 safe-area-inset-bottom">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          <span>Signature sécurisée</span>
        </div>
        <div className="flex items-center gap-3 text-primary-400">
          <span>eIDAS</span>
          <span>•</span>
          <span>OHADA</span>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocument && (
        <div className="fixed inset-0 bg-black/80 z-50 animate-in fade-in duration-150">
          <div className="absolute inset-0 flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-primary-900 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{DEMO_DOCUMENT.title}</h3>
                  <p className="text-xs text-primary-400">{DEMO_DOCUMENT.pages} pages • {DEMO_DOCUMENT.size}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocument(false)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto bg-primary-200">
              <DocumentDetailPage embedded={true} />
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-primary-100 flex items-center justify-between">
              <h3 className="font-semibold text-primary-900">Signer le document</h3>
              <button
                onClick={() => setShowSignature(false)}
                className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-primary-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* Identity */}
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg mb-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-900" />
                </div>
                <div>
                  <p className="font-medium text-primary-900 text-sm">{DEMO_DOCUMENT.recipient.name}</p>
                  <p className="text-xs text-primary-500">{DEMO_DOCUMENT.recipient.email}</p>
                </div>
              </div>

              {/* Signature Mode Tabs */}
              <div className="flex gap-1 p-1 bg-primary-100 rounded-lg mb-4">
                {[
                  { id: 'draw', icon: Edit3, label: 'Dessiner' },
                  { id: 'type', icon: Type, label: 'Saisir' },
                  { id: 'upload', icon: Upload, label: 'Importer' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSignatureMode(mode.id as 'draw' | 'type' | 'upload')}
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

              {/* Legal Agreement */}
              <div className="space-y-3 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmedIdentity}
                    onChange={(e) => setConfirmedIdentity(e.target.checked)}
                    className="w-4 h-4 rounded border-primary-300 text-primary-900 focus:ring-primary-500/20 mt-0.5"
                  />
                  <span className="text-xs text-primary-600 leading-relaxed group-hover:text-primary-900 transition-colors">
                    Je confirme être <strong>{DEMO_DOCUMENT.recipient.name}</strong> et reconnais que cette signature électronique a la même valeur juridique qu'une signature manuscrite.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-primary-300 text-primary-900 focus:ring-primary-500/20 mt-0.5"
                  />
                  <span className="text-xs text-primary-600 leading-relaxed group-hover:text-primary-900 transition-colors">
                    J'accepte les{' '}
                    <a
                      href="/legal/cgu"
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-900 hover:underline font-medium"
                    >
                      Conditions Générales d'Utilisation
                    </a>{' '}
                    et la{' '}
                    <a
                      href="/legal/privacy"
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-900 hover:underline font-medium"
                    >
                      Politique de Confidentialité
                    </a>{' '}
                    d'ADVIST.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-primary-100 flex justify-end gap-2 bg-primary-50">
              <button
                onClick={() => setShowSignature(false)}
                className="px-4 py-2 text-primary-600 text-sm font-medium hover:bg-primary-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSign}
                disabled={!confirmedIdentity || !acceptedTerms || (signatureMode === 'upload' && !uploadedSignature)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  confirmedIdentity && acceptedTerms && !(signatureMode === 'upload' && !uploadedSignature)
                    ? 'bg-primary-900 text-white hover:bg-primary-900'
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

      {/* Back to Landing (Dev only) */}
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
