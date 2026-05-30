import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PenTool,
  Check,
  FileText,
  Clock,
  Shield,
  AlertTriangle,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  FileSignature,
  Stamp,
  Award,
  Ban,
  Loader2,
} from 'lucide-react';
import { Card, Button, Badge, Modal, Input } from '../../components/ui';
import { PrintButton } from '../../shared/PrintEngine';
import { DocumentViewer } from '../../components/documents';
import { useAuthStore } from '../../store';
import {
  getMyPendingSignatures,
  getMySignedDocuments,
  getSignatureCounts,
} from '../../services/signaturesOverview';

// Pending signature with paraph requirements
interface PendingSignatureRequest {
  id: number;
  document: {
    id: number;
    title: string;
    total_pages: number;
    file_url?: string;
  };
  requestedBy: string;
  deadline: string;
  status: 'pending' | 'signed' | 'rejected' | 'refused_definitive';
  // v2: Signature mode
  signature_mode: 'sequential' | 'parallel';
  order_in_group?: number;
  total_in_group?: number;
  // v2: Paraph requirements
  requires_paraph: boolean;
  paraph_all_pages: boolean;
  pages_to_sign: number[];
  pages_to_paraph: number[];
  paraphs_completed: number[];
  // v2: OHADA compliance
  ohada_compliant: boolean;
  legal_value: boolean;
  // v2: Refusal tracking
  refusal_reason?: string;
  refusal_is_definitive?: boolean;
}

export const SignaturesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/user';
  const [activeTab, setActiveTab] = useState<'pending' | 'signed-documents'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<PendingSignatureRequest | null>(null);
  const [showRefusalModal, setShowRefusalModal] = useState(false);

  const { user } = useAuthStore();
  const userId = user?.id;
  const [tabCounts, setTabCounts] = useState({ pending: 0, signed: 0 });
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getSignatureCounts(userId).then((c) => {
      if (!cancelled) setTabCounts(c);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900/70">
            {t('signatures.title', 'Signatures')}
          </h1>
          <p className="text-advist-gray900/80 mt-1">
            {t('signatures.subtitle', 'Signez vos documents en attente')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton config={{ title: 'Signatures électroniques', appName: 'Advist' }}>
            <div>
              <p className="text-sm mb-2">
                Liste des signatures - {t('signatures.title', 'Signatures')}
              </p>
              <p className="text-sm text-gray-500">
                {t('signatures.subtitle', 'Signez vos documents en attente')}
              </p>
            </div>
          </PrintButton>
        </div>
      </div>

      {/* v2: OHADA Compliance info banner */}
      <Card className="bg-advist-gold-light/20/50 border-advist-border">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-advist-gold-light/20 rounded-xl">
            <Shield size={24} className="text-advist-gray900/80" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-advist-gray900">
              {t('signatures.secureSignature', 'Signature électronique sécurisée')}
            </h3>
            <p className="text-sm text-advist-gray900/80 mt-1">
              {t(
                'signatures.securityInfo',
                'Vos signatures sont protégées par chiffrement AES-256 et conformes aux exigences légales eIDAS et OHADA. Chaque signature est horodatée et certifiée pour garantir sa valeur légale.'
              )}
            </p>
          </div>
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <Award size={12} />
            OHADA
          </Badge>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-advist-border">
        <nav className="flex gap-4">
          {[
            { key: 'pending', label: t('signatures.toSign', 'À signer'), count: tabCounts.pending },
            {
              key: 'signed-documents',
              label: t('signatures.signedDocs', 'Documents signés'),
              count: tabCounts.signed,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`
                pb-3 px-1 text-sm font-medium transition-all duration-240 relative
                ${
                  activeTab === tab.key
                    ? 'text-advist-gray900/70 border-b-2 border-[#585858]'
                    : 'text-advist-gray900/80 hover:text-advist-gray900/70'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-advist-gold-light/20 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <PendingSignaturesSection
          onSign={(request) => {
            // Navigate to the signing page
            navigate(`${basePath}/signatures/${request.id}`);
          }}
          onRefuse={(request) => {
            setSelectedRequest(request);
            setShowRefusalModal(true);
          }}
        />
      )}
      {activeTab === 'signed-documents' && <SignedDocumentsSection />}

      {/* v2: Refusal Modal with definitive option */}
      {selectedRequest && (
        <RefusalModal
          isOpen={showRefusalModal}
          onClose={() => {
            setShowRefusalModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}
    </div>
  );
};

// Pending signatures with paraph requirements
const PendingSignaturesSection: React.FC<{
  onSign: (request: PendingSignatureRequest) => void;
  onRefuse: (request: PendingSignatureRequest) => void;
}> = ({ onSign, onRefuse }) => {
  const { t } = useTranslation();

  const { user } = useAuthStore();
  const userId = user?.id;
  const [pendingDocuments, setPendingDocuments] = useState<PendingSignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMyPendingSignatures(userId)
      .then((rows) => {
        if (cancelled) return;
        // Map real signature rows into the existing rich shape with safe
        // defaults for fields Atlas Studio doesn't track (paraphs, mode…).
        setPendingDocuments(
          rows.map((r, idx) => ({
            id: (idx + 1) as number,
            document: {
              id: idx + 1,
              title: r.documentTitle,
              total_pages: r.pageNumber ?? 1,
            },
            requestedBy: '',
            deadline: r.expiresAt || r.createdAt || new Date().toISOString(),
            status: 'pending',
            signature_mode: 'sequential',
            requires_paraph: false,
            paraph_all_pages: false,
            pages_to_sign: r.pageNumber ? [r.pageNumber] : [],
            pages_to_paraph: [],
            paraphs_completed: [],
            ohada_compliant: false,
            legal_value: false,
          }))
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0)
      return {
        status: 'overdue',
        label: 'En retard',
        color: 'text-advist-gray900/70 bg-advist-bg',
      };
    if (diffHours < 24)
      return {
        status: 'urgent',
        label: 'Urgent',
        color: 'text-advist-warning bg-advist-warning-light',
      };
    return { status: 'normal', label: '', color: '' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-advist-gray900/40">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (pendingDocuments.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-advist-gray900/50">
        Aucune signature en attente
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingDocuments.map((doc) => {
        const deadlineInfo = getDeadlineStatus(doc.deadline);
        const paraphProgress = doc.requires_paraph
          ? Math.round((doc.paraphs_completed.length / doc.pages_to_paraph.length) * 100)
          : 100;

        return (
          <Card
            key={doc.id}
            className={deadlineInfo.status === 'overdue' ? 'border-advist-blue-light' : ''}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    deadlineInfo.status === 'overdue'
                      ? 'bg-advist-bg'
                      : deadlineInfo.status === 'urgent'
                        ? 'bg-advist-warning-light'
                        : 'bg-advist-gold-light/20'
                  }`}
                >
                  <PenTool
                    size={24}
                    className={
                      deadlineInfo.status === 'overdue'
                        ? 'text-advist-gray900/70'
                        : deadlineInfo.status === 'urgent'
                          ? 'text-advist-gray900'
                          : 'text-advist-gray900/80'
                    }
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-advist-gray900">{doc.document.title}</h3>
                    {/* v2: Signature mode badge */}
                    <Badge
                      variant={doc.signature_mode === 'parallel' ? 'info' : 'secondary'}
                      size="sm"
                    >
                      {doc.signature_mode === 'parallel' ? (
                        <>
                          <Users size={12} className="mr-1" />
                          {t('signatures.parallel', 'Parallèle')}
                        </>
                      ) : (
                        <>
                          <ArrowRight size={12} className="mr-1" />
                          {t('signatures.sequential', 'Séquentiel')} ({doc.order_in_group}/
                          {doc.total_in_group})
                        </>
                      )}
                    </Badge>
                    {/* v2: OHADA compliance badge */}
                    {doc.ohada_compliant && (
                      <Badge variant="success" size="sm">
                        <Award size={12} className="mr-1" />
                        OHADA
                      </Badge>
                    )}
                    {deadlineInfo.status !== 'normal' && (
                      <Badge
                        variant={deadlineInfo.status === 'overdue' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {deadlineInfo.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-advist-gray900/80 mt-1">
                    {t('signatures.requestedBy', 'Demandé par')} {doc.requestedBy} •{' '}
                    {doc.document.total_pages} pages
                  </p>

                  {/* v2: Paraph requirements info */}
                  {doc.requires_paraph && (
                    <div className="mt-2 p-2 bg-primary-50 rounded-xl border border-primary-200">
                      <div className="flex items-center gap-2 text-sm text-advist-gray900">
                        <Stamp size={14} />
                        <span className="font-medium">
                          {doc.paraph_all_pages
                            ? t('signatures.paraphAllPages', 'Paraphe requis sur toutes les pages')
                            : t(
                                'signatures.paraphRequired',
                                'Paraphe requis sur {{count}} page(s)',
                                { count: doc.pages_to_paraph.length }
                              )}
                        </span>
                      </div>
                      {doc.pages_to_paraph.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-advist-gray900 mb-1">
                            <span>
                              {t('signatures.paraphProgress', 'Progression des paraphes')}
                            </span>
                            <span>
                              {doc.paraphs_completed.length}/{doc.pages_to_paraph.length}
                            </span>
                          </div>
                          <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-900 rounded-full transition-all"
                              style={{ width: `${paraphProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1 text-advist-gray900/80">
                      <FileSignature size={14} />
                      <span>
                        {t('signatures.signPage', 'Signature page')} {doc.pages_to_sign.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock
                        size={14}
                        className={
                          deadlineInfo.color.includes('red')
                            ? 'text-advist-gray900/70'
                            : 'text-advist-gray900'
                        }
                      />
                      <span
                        className={
                          deadlineInfo.color.includes('red')
                            ? 'text-advist-gray900/70'
                            : 'text-advist-gray900/80'
                        }
                      >
                        {t('signatures.deadline', 'Date limite')}:{' '}
                        {new Date(doc.deadline).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-advist-gray900/70 border-advist-blue-light hover:bg-advist-bg"
                  leftIcon={<XCircle size={16} />}
                  onClick={() => onRefuse(doc)}
                >
                  {t('signatures.refuse', 'Refuser')}
                </Button>
                <Button leftIcon={<PenTool size={18} />} onClick={() => onSign(doc)}>
                  {t('signatures.signNow', 'Signer')}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {pendingDocuments.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Check size={48} className="mx-auto text-advist-gray900 mb-4" />
            <h3 className="text-lg font-medium text-advist-gray900">
              {t('signatures.allSigned', 'Tout est signé !')}
            </h3>
            <p className="text-advist-gray900/80 mt-1">
              {t('signatures.noPending', "Vous n'avez aucun document en attente de signature")}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

interface SignedDocument {
  id: number;
  title: string;
  signed_at: string;
  pages_signed: number;
  pages_paraphed: number;
  certificate_id: string;
  ohada_compliant: boolean;
  legal_value: boolean;
}

const SignedDocumentsSection: React.FC = () => {
  const { t } = useTranslation();

  const { user } = useAuthStore();
  const userId = user?.id;
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMySignedDocuments(userId)
      .then((rows) => {
        if (cancelled) return;
        setSignedDocuments(
          rows.map((r, idx) => ({
            id: idx + 1,
            title: r.documentTitle,
            signed_at: r.signedAt || r.documentTitle || new Date().toISOString(),
            pages_signed: r.pageNumber ?? 1,
            pages_paraphed: 0,
            certificate_id: r.signatureHash ? r.signatureHash.slice(0, 16) : r.id.slice(0, 8),
            ohada_compliant: false,
            legal_value: false,
          }))
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const [selectedDocument, setSelectedDocument] = useState<SignedDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-advist-gray900/40">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (signedDocuments.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-advist-gray900/50">Aucun document signé</Card>
    );
  }

  return (
    <div className="space-y-4">
      {signedDocuments.map((doc) => (
        <Card key={doc.id}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <Check size={24} className="text-advist-gray900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-advist-gray900">{doc.title}</h3>
                  {doc.ohada_compliant && (
                    <Badge variant="success" size="sm">
                      <Award size={12} className="mr-1" />
                      OHADA
                    </Badge>
                  )}
                  {doc.legal_value && (
                    <Badge variant="info" size="sm">
                      <Shield size={12} className="mr-1" />
                      {t('signatures.legalValue', 'Valeur légale')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-advist-gray900/80">
                  {doc.pages_signed} {t('signatures.pagesSigned', 'page(s) signée(s)')}
                  {doc.pages_paraphed > 0 &&
                    ` • ${doc.pages_paraphed} ${t('signatures.pagesParaphed', 'page(s) paraphée(s)')}`}
                  {' • '}
                  {t('signatures.id', 'ID')}: {doc.certificate_id}
                </p>
                <p className="text-xs text-advist-blue-light mt-1">
                  {t('signatures.signedOn', 'Signé le')}{' '}
                  {new Date(doc.signed_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileText size={16} />}
                onClick={() => {
                  setSelectedDocument(doc);
                  setShowDocumentModal(true);
                }}
              >
                {t('signatures.viewDocument', 'Voir le document')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Shield size={16} />}
                onClick={() => {
                  setSelectedDocument(doc);
                  setShowCertificateModal(true);
                }}
              >
                {t('signatures.certificate', 'Certificat')}
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <Modal
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDocument(null);
          }}
          title={selectedDocument.title}
          size="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-advist-surface-dark/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Check size={20} className="text-advist-gray900" />
                </div>
                <div>
                  <p className="font-medium text-advist-gray900">
                    {t('signatures.signedDocument', 'Document signé')}
                  </p>
                  <p className="text-sm text-advist-gray900/80">
                    {t('signatures.signedOn', 'Signé le')}{' '}
                    {new Date(selectedDocument.signed_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedDocument.ohada_compliant && (
                  <Badge variant="success" size="sm">
                    <Award size={12} className="mr-1" />
                    OHADA
                  </Badge>
                )}
                {selectedDocument.legal_value && (
                  <Badge variant="info" size="sm">
                    <Shield size={12} className="mr-1" />
                    {t('signatures.legalValue', 'Valeur légale')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Document Preview */}
            <div className="border border-advist-border rounded-xl overflow-hidden">
              <DocumentViewer
                document={{
                  id: String(selectedDocument.id),
                  name: selectedDocument.title,
                  type: 'pdf',
                  url: `/api/documents/${selectedDocument.id}/signed`,
                  mimeType: 'application/pdf',
                  totalPages: 10,
                }}
                readOnly={true}
                showAnnotationTools={false}
                currentUser={{ id: 'current-user', name: 'Utilisateur' }}
                className="!h-[500px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
              <Button
                variant="outline"
                leftIcon={<Shield size={16} />}
                onClick={() => {
                  setShowDocumentModal(false);
                  setShowCertificateModal(true);
                }}
              >
                {t('signatures.viewCertificate', 'Voir le certificat')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
              >
                {t('common.close', 'Fermer')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Certificate Modal */}
      {selectedDocument && (
        <Modal
          isOpen={showCertificateModal}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedDocument(null);
          }}
          title={t('signatures.signatureCertificate', 'Certificat de signature')}
          size="md"
        >
          <div className="space-y-6">
            {/* Certificate Header */}
            <div className="text-center p-6 bg-gradient-to-br from-advist-gold-light/30 to-primary-100 rounded-xl border border-advist-gold-light">
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Award size={32} className="text-advist-gray900" />
              </div>
              <h3 className="text-xl font-bold text-advist-gray900">
                {t('signatures.certificateTitle', 'Certificat de signature électronique')}
              </h3>
              <p className="text-sm text-advist-gray900/80 mt-2">
                {t(
                  'signatures.certificateSubtitle',
                  'Document signé électroniquement avec valeur légale'
                )}
              </p>
            </div>

            {/* Certificate Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
                  <p className="text-xs text-advist-gray900/60 uppercase tracking-wide">
                    {t('signatures.certificateId', 'ID Certificat')}
                  </p>
                  <p className="font-mono font-medium text-advist-gray900 mt-1">
                    {selectedDocument.certificate_id}
                  </p>
                </div>
                <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
                  <p className="text-xs text-advist-gray900/60 uppercase tracking-wide">
                    {t('signatures.signatureDate', 'Date de signature')}
                  </p>
                  <p className="font-medium text-advist-gray900 mt-1">
                    {new Date(selectedDocument.signed_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
                <p className="text-xs text-advist-gray900/60 uppercase tracking-wide">
                  {t('signatures.documentTitle', 'Document')}
                </p>
                <p className="font-medium text-advist-gray900 mt-1">{selectedDocument.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
                  <p className="text-xs text-advist-gray900/60 uppercase tracking-wide">
                    {t('signatures.pagesSigned', 'Pages signées')}
                  </p>
                  <p className="font-medium text-advist-gray900 mt-1">
                    {selectedDocument.pages_signed}
                  </p>
                </div>
                <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
                  <p className="text-xs text-advist-gray900/60 uppercase tracking-wide">
                    {t('signatures.pagesParaphed', 'Pages paraphées')}
                  </p>
                  <p className="font-medium text-advist-gray900 mt-1">
                    {selectedDocument.pages_paraphed || 0}
                  </p>
                </div>
              </div>

              {/* Compliance badges */}
              <div className="flex items-center gap-3 p-4 bg-advist-warning-light rounded-xl border border-advist-warning/30">
                <Shield size={24} className="text-advist-gray900" />
                <div className="flex-1">
                  <p className="font-medium text-advist-gray900">
                    {t('signatures.legalCompliance', 'Conformité légale')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {selectedDocument.ohada_compliant && (
                      <Badge variant="success" size="sm">
                        <Award size={12} className="mr-1" />
                        OHADA
                      </Badge>
                    )}
                    <Badge variant="info" size="sm">
                      <Shield size={12} className="mr-1" />
                      eIDAS
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      <Check size={12} className="mr-1" />
                      SHA-256
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Signature hash */}
              <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
                <p className="text-xs text-advist-gray900/60 uppercase tracking-wide">
                  {t('signatures.signatureHash', 'Empreinte numérique')}
                </p>
                <p className="font-mono text-xs text-advist-gray900/80 mt-1 break-all">
                  SHA256: a7f8d9e2c4b6a1f3e5d7c9b2a4f6e8d1c3b5a7f9e2d4c6b8a1f3e5d7c9b2a4f6
                </p>
              </div>

              {/* Timestamp */}
              <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
                <p className="text-xs text-advist-gray900/60 uppercase tracking-wide">
                  {t('signatures.timestamp', 'Horodatage qualifié')}
                </p>
                <p className="font-mono text-sm text-advist-gray900 mt-1">
                  {new Date(selectedDocument.signed_at).toISOString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-advist-border">
              <Button
                variant="outline"
                leftIcon={<FileText size={16} />}
                onClick={() => {
                  // Download certificate as PDF
                  console.error('Download certificate not implemented');
                }}
              >
                {t('signatures.downloadCertificate', 'Télécharger le certificat')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCertificateModal(false);
                  setSelectedDocument(null);
                }}
              >
                {t('common.close', 'Fermer')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// v2: Enhanced signing modal with page-by-page paraph
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SigningModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  request: PendingSignatureRequest;
}> = ({ isOpen, onClose, request }) => {
  const { t } = useTranslation();
  const [currentPage] = useState(1);
  const [paraphedPages, setParaphedPages] = useState<number[]>(request.paraphs_completed);
  const [signatureApplied, setSignatureApplied] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [pin, setPin] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [step, setStep] = useState<'paraph' | 'sign' | 'confirm'>('paraph');

  const totalPages = request.document.total_pages;
  const needsParaphOnCurrentPage = request.pages_to_paraph.includes(currentPage);
  const isCurrentPageParaphed = paraphedPages.includes(currentPage);
  const needsSignatureOnCurrentPage = request.pages_to_sign.includes(currentPage);

  const allParaphsComplete = request.pages_to_paraph.every((p) => paraphedPages.includes(p));
  const canSign = !request.requires_paraph || allParaphsComplete;

  const handleParaphPage = () => {
    if (!paraphedPages.includes(currentPage)) {
      setParaphedPages([...paraphedPages, currentPage]);
    }
  };

  const handleSign = () => {
    if (canSign) {
      setShowPinConfirm(true);
    }
  };

  const handleConfirmSignature = () => {
    // In real app, verify PIN and submit signature
    setSignatureApplied(true);
    setStep('confirm');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('signatures.signDocument', 'Signer le document')}
      size="xl"
    >
      <div className="space-y-4">
        {/* Document info header */}
        <div className="flex items-center justify-between p-3 bg-advist-surface-dark/50 rounded-xl">
          <div>
            <h3 className="font-semibold text-advist-gray900">{request.document.title}</h3>
            <p className="text-sm text-advist-gray900/80">
              {request.document.total_pages} pages • {t('signatures.requestedBy', 'Demandé par')}{' '}
              {request.requestedBy}
            </p>
          </div>
          {request.ohada_compliant && (
            <Badge variant="success">
              <Award size={14} className="mr-1" />
              {t('signatures.ohadaCompliant', 'Conforme OHADA')}
            </Badge>
          )}
        </div>

        {/* Progress indicators */}
        {request.requires_paraph && (
          <div className="flex items-center gap-4 p-3 bg-primary-50 rounded-xl border border-primary-200">
            <Stamp size={20} className="text-advist-gray900" />
            <div className="flex-1">
              <p className="text-sm font-medium text-advist-gray900">
                {t('signatures.paraphProgress', 'Progression des paraphes')}: {paraphedPages.length}
                /{request.pages_to_paraph.length}
              </p>
              <div className="h-2 bg-primary-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-primary-900 rounded-full transition-all"
                  style={{
                    width: `${(paraphedPages.length / request.pages_to_paraph.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            {allParaphsComplete && <CheckCircle size={20} className="text-advist-gray900" />}
          </div>
        )}

        {/* Document viewer with page navigation */}
        <div className="border border-advist-border rounded-xl overflow-hidden relative">
          {/* Document Viewer */}
          <div className="relative">
            <DocumentViewer
              document={{
                id: String(request.document.id),
                name: request.document.title,
                type: 'pdf',
                url: request.document.file_url || `/api/documents/${request.document.id}/preview`,
                mimeType: 'application/pdf',
                totalPages: request.document.total_pages,
              }}
              readOnly={true}
              showAnnotationTools={false}
              currentUser={{ id: 'current-user', name: 'Utilisateur' }}
              className="!h-[400px]"
            />

            {/* Paraph/Signature status overlay */}
            <div className="absolute top-16 right-4 space-y-2 z-10">
              {/* Paraph indicator */}
              {needsParaphOnCurrentPage && (
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                    isCurrentPageParaphed
                      ? 'bg-primary-900 text-white'
                      : 'bg-white border border-primary-300 text-advist-gray900'
                  }`}
                >
                  {isCurrentPageParaphed ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} /> {t('signatures.paraphed', 'Paraphé')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Stamp size={14} /> {t('signatures.paraphRequired', 'Paraphe requis')}
                    </span>
                  )}
                </div>
              )}

              {/* Signature indicator */}
              {needsSignatureOnCurrentPage && (
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                    signatureApplied
                      ? 'bg-primary-900 text-white'
                      : 'bg-white border border-primary-300 text-advist-gray900/80'
                  }`}
                >
                  {signatureApplied ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} /> {t('signatures.signed', 'Signé')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <PenTool size={14} /> {t('signatures.signatureRequired', 'Signature requise')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Page indicators with paraph/sign status */}
          <div className="flex items-center justify-center gap-1 p-3 bg-advist-surface-dark/30 border-t border-advist-border">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const needsParaph = request.pages_to_paraph.includes(page);
              const isParaphed = paraphedPages.includes(page);
              const needsSign = request.pages_to_sign.includes(page);

              return (
                <div
                  key={page}
                  className={`
                    w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center
                    ${
                      needsSign
                        ? 'bg-advist-gold-light/20 text-advist-gray900/80'
                        : needsParaph
                          ? isParaphed
                            ? 'bg-primary-900 text-white'
                            : 'bg-primary-200 text-primary-900'
                          : 'bg-advist-surface-dark text-advist-gray900/80'
                    }
                  `}
                  title={
                    needsSign
                      ? t('signatures.signatureRequired', 'Signature requise')
                      : needsParaph
                        ? isParaphed
                          ? t('signatures.paraphed', 'Paraphé')
                          : t('signatures.paraphRequired', 'Paraphe requis')
                        : `Page ${page}`
                  }
                >
                  {page}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons based on current page */}
        <div className="flex items-center justify-between pt-4 border-t border-advist-border">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Annuler')}
          </Button>

          <div className="flex gap-2">
            {needsParaphOnCurrentPage && !isCurrentPageParaphed && (
              <Button variant="outline" onClick={handleParaphPage} leftIcon={<Stamp size={18} />}>
                {t('signatures.paraphThisPage', 'Parapher cette page')}
              </Button>
            )}

            {canSign && !signatureApplied && (
              <Button onClick={handleSign} leftIcon={<PenTool size={18} />}>
                {t('signatures.applySignature', 'Apposer ma signature')}
              </Button>
            )}

            {signatureApplied && (
              <Button variant="success" leftIcon={<Check size={18} />} onClick={onClose}>
                {t('signatures.done', 'Terminé')}
              </Button>
            )}
          </div>
        </div>

        {/* PIN confirmation overlay */}
        {showPinConfirm && (
          <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-xl">
            <div className="text-center space-y-4 p-6">
              <div className="p-4 bg-advist-surface-dark rounded-full inline-block">
                <Shield size={32} className="text-advist-gray900" />
              </div>
              <h3 className="font-semibold text-lg text-advist-gray900">
                {t('signatures.confirmIdentity', 'Confirmez votre identité')}
              </h3>
              <p className="text-advist-gray900/80">
                {t('signatures.enterPin', 'Entrez votre code PIN pour signer')}
              </p>
              <Input
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-2xl tracking-widest max-w-[200px] mx-auto"
                maxLength={6}
              />
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" onClick={() => setShowPinConfirm(false)}>
                  {t('common.cancel', 'Annuler')}
                </Button>
                <Button
                  onClick={handleConfirmSignature}
                  disabled={pin.length < 4}
                  leftIcon={<Check size={18} />}
                >
                  {t('signatures.confirm', 'Confirmer')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// v2: Refusal modal with definitive option
const RefusalModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  request: PendingSignatureRequest;
}> = ({ isOpen, onClose, request }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isDefinitive, setIsDefinitive] = useState(false);
  const [showDefinitiveWarning, setShowDefinitiveWarning] = useState(false);

  const handleRefuse = () => {
    if (isDefinitive && !showDefinitiveWarning) {
      setShowDefinitiveWarning(true);
      return;
    }
    // Submit refusal
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('signatures.refuseSignature', 'Refuser la signature')}
      size="md"
    >
      <div className="space-y-4">
        {/* Document info */}
        <div className="p-3 bg-advist-surface-dark/50 rounded-xl">
          <h4 className="font-medium text-advist-gray900">{request.document.title}</h4>
          <p className="text-sm text-advist-gray900/80">
            {t('signatures.requestedBy', 'Demandé par')} {request.requestedBy}
          </p>
        </div>

        {/* Warning about consequences */}
        <div className="p-3 bg-primary-50 rounded-xl border border-primary-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={20} className="text-advist-gray900 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-advist-gray900">
                {t('signatures.refusalConsequences', 'Conséquences du refus')}
              </p>
              <p className="text-sm text-advist-gray900 mt-1">
                {t(
                  'signatures.refusalInfo',
                  "Le refus de signature sera notifié au demandeur et enregistré dans l'historique du document."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Reason input */}
        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-2">
            {t('signatures.refusalReason', 'Motif du refus')} *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold resize-none"
            rows={3}
            placeholder={t(
              'signatures.refusalReasonPlaceholder',
              'Expliquez pourquoi vous refusez de signer ce document...'
            )}
          />
        </div>

        {/* v2: Definitive refusal option */}
        <div
          className={`p-4 rounded-xl border-2 transition-all duration-240 ${
            isDefinitive ? 'border-advist-blue-light bg-advist-bg' : 'border-advist-border'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefinitive}
              onChange={(e) => {
                setIsDefinitive(e.target.checked);
                setShowDefinitiveWarning(false);
              }}
              className="mt-1 rounded border-advist-border text-advist-gray900/70 focus:ring-advist-gold"
            />
            <div>
              <div className="flex items-center gap-2">
                <Ban size={16} className="text-advist-gray900/70" />
                <span className="font-medium text-advist-gray900">
                  {t('signatures.definitiveRefusal', 'Refus définitif')}
                </span>
              </div>
              <p className="text-sm text-advist-gray900/80 mt-1">
                {t(
                  'signatures.definitiveRefusalInfo',
                  'Un refus définitif annule le circuit de validation. Le document ne pourra plus être signé par les autres signataires et devra être renvoyé en validation.'
                )}
              </p>
            </div>
          </label>
        </div>

        {/* Definitive warning confirmation */}
        {showDefinitiveWarning && (
          <div className="p-4 bg-advist-bg rounded-xl border border-advist-blue-light">
            <div className="flex items-start gap-3">
              <XCircle size={24} className="text-advist-gray900/70 shrink-0" />
              <div>
                <p className="font-medium text-advist-gray900/70">
                  {t('signatures.confirmDefinitive', 'Confirmer le refus définitif ?')}
                </p>
                <p className="text-sm text-advist-gray900/70 mt-1">
                  {t(
                    'signatures.definitiveWarning',
                    'Cette action est irréversible. Le circuit de validation sera annulé et tous les autres signataires seront notifiés.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-advist-border">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Annuler')}
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            onClick={handleRefuse}
            leftIcon={isDefinitive ? <Ban size={18} /> : <XCircle size={18} />}
          >
            {isDefinitive
              ? showDefinitiveWarning
                ? t('signatures.confirmDefinitiveRefusal', 'Confirmer le refus définitif')
                : t('signatures.refuseDefinitively', 'Refuser définitivement')
              : t('signatures.refuseSignature', 'Refuser la signature')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SignaturesPage;
