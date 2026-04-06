import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  PenTool,
  Check,
  Shield,
  Stamp,
  Award,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  CheckCircle,
  XCircle,
  Ban,
  _AlertTriangle,
  GitBranch,
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/ui';
import { WorkflowViewer } from '../../components/workflows';

// Workflow step interface
interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  type: 'consultation' | 'validation' | 'approval' | 'signature' | 'paraph';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'skipped';
  assignee: {
    id: number;
    name: string;
    email: string;
    role?: string;
    department?: string;
  };
  completedAt?: string;
  completedBy?: {
    id: number;
    name: string;
    email: string;
  };
  comment?: string;
}

// Mock document data - in real app, fetch from API
const mockDocuments: Record<string, any> = {
  '1': {
    id: 1,
    title: 'Contrat de prestation Q4 2024',
    total_pages: 12,
    file_url: '/sample.pdf',
    requestedBy: 'Marie Dupont',
    deadline: '2024-11-29T18:00:00Z',
    signature_mode: 'sequential',
    order_in_group: 2,
    total_in_group: 3,
    requires_paraph: true,
    paraph_all_pages: true,
    pages_to_sign: [12],
    pages_to_paraph: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    paraphs_completed: [],
    ohada_compliant: true,
    legal_value: true,
    workflow: {
      id: 'wf-001',
      name: 'Validation Contrat Standard',
      status: 'in_progress',
      startedAt: '2024-11-22T09:00:00Z',
      steps: [
        {
          id: 'step-1',
          order: 1,
          name: 'Consultation Juridique',
          type: 'consultation',
          status: 'approved',
          assignee: {
            id: 2,
            name: 'Sophie Bernard',
            email: 'sophie.bernard@example.com',
            role: 'Juriste',
            department: 'Direction Juridique',
          },
          completedAt: '2024-11-24T11:30:00Z',
          completedBy: { id: 2, name: 'Sophie Bernard', email: 'sophie.bernard@example.com' },
          comment: 'Document conforme aux exigences légales. Clause 5.2 vérifiée.',
        },
        {
          id: 'step-2',
          order: 2,
          name: 'Validation Achats',
          type: 'validation',
          status: 'approved',
          assignee: {
            id: 3,
            name: 'Pierre Martin',
            email: 'pierre.martin@example.com',
            role: 'Responsable Achats',
            department: 'Direction des Achats',
          },
          completedAt: '2024-11-25T14:45:00Z',
          completedBy: { id: 3, name: 'Pierre Martin', email: 'pierre.martin@example.com' },
          comment: 'Conditions commerciales validées. Montants conformes au budget prévu.',
        },
        {
          id: 'step-3',
          order: 3,
          name: 'Approbation Direction',
          type: 'approval',
          status: 'in_progress',
          assignee: {
            id: 4,
            name: 'Jean Dupont',
            email: 'jean.dupont@example.com',
            role: 'Directeur',
            department: 'Direction Générale',
          },
        },
        {
          id: 'step-4',
          order: 4,
          name: 'Signature Finale',
          type: 'signature',
          status: 'pending',
          assignee: {
            id: 5,
            name: 'Marie Leblanc',
            email: 'marie.leblanc@example.com',
            role: 'Directrice Générale',
            department: 'Direction Générale',
          },
        },
      ] as WorkflowStep[],
    },
  },
  '2': {
    id: 2,
    title: 'Accord de confidentialité',
    total_pages: 4,
    file_url: '/sample.pdf',
    requestedBy: 'Pierre Martin',
    deadline: '2024-11-30T18:00:00Z',
    signature_mode: 'parallel',
    requires_paraph: false,
    paraph_all_pages: false,
    pages_to_sign: [4],
    pages_to_paraph: [],
    paraphs_completed: [],
    ohada_compliant: true,
    legal_value: true,
  },
  '3': {
    id: 3,
    title: 'Procès-verbal AG extraordinaire',
    total_pages: 8,
    file_url: '/sample.pdf',
    requestedBy: 'Sophie Laurent',
    deadline: '2024-12-01T18:00:00Z',
    signature_mode: 'sequential',
    order_in_group: 1,
    total_in_group: 5,
    requires_paraph: true,
    paraph_all_pages: false,
    pages_to_sign: [8],
    pages_to_paraph: [1, 8],
    paraphs_completed: [1],
    ohada_compliant: true,
    legal_value: true,
  },
};

export const SignDocumentPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const document = mockDocuments[id || '1'] || mockDocuments['1'];

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paraphedPages, setParaphedPages] = useState<number[]>(document.paraphs_completed || []);
  const [signatureApplied, setSignatureApplied] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [pin, setPin] = useState('');
  const [showRefusalPanel, setShowRefusalPanel] = useState(false);
  const [refusalReason, setRefusalReason] = useState('');
  const [isDefinitiveRefusal, setIsDefinitiveRefusal] = useState(false);
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(true);

  const totalPages = document.total_pages;
  const needsParaphOnCurrentPage = document.pages_to_paraph.includes(currentPage);
  const isCurrentPageParaphed = paraphedPages.includes(currentPage);
  const needsSignatureOnCurrentPage = document.pages_to_sign.includes(currentPage);
  const allParaphsComplete = document.pages_to_paraph.every((p: number) =>
    paraphedPages.includes(p)
  );
  const canSign = !document.requires_paraph || allParaphsComplete;

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
    setSignatureApplied(true);
    setShowPinConfirm(false);
    // In real app, submit signature to backend
  };

  const handleRefuse = () => {
    // In real app, submit refusal to backend
    navigate(-1);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="h-screen flex flex-col bg-advist-bg">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-advist-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-advist-surface-dark rounded-xl transition-all duration-240 text-advist-gray900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-advist-gray900 font-semibold">{document.title}</h1>
            <p className="text-sm text-advist-text-muted">
              {t('signatures.requestedBy', 'Demandé par')} {document.requestedBy} • {totalPages}{' '}
              pages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {document.ohada_compliant && (
            <Badge
              variant="success"
              className="bg-advist-success/20 text-advist-success border-advist-success/30"
            >
              <Award size={14} className="mr-1" />
              OHADA
            </Badge>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-advist-surface-dark rounded-xl px-2 py-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-advist-gold/30 rounded text-advist-gray900"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-advist-gray900 min-w-[50px] text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-advist-gold/30 rounded text-advist-gray900"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={handleRotate}
            className="p-2 hover:bg-advist-surface-dark rounded-xl text-advist-gray900"
          >
            <RotateCw size={18} />
          </button>

          <button className="p-2 hover:bg-advist-surface-dark rounded-xl text-advist-gray900">
            <Download size={18} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-advist-surface-dark rounded-xl text-advist-gray900"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Progress bar for paraphs */}
      {document.requires_paraph && (
        <div className="px-4 py-2 bg-white border-b border-advist-border">
          <div className="flex items-center gap-3">
            <Stamp size={16} className="text-advist-gold-dark" />
            <span className="text-sm text-advist-gray900">
              {t('signatures.paraphProgress', 'Progression des paraphes')}: {paraphedPages.length}/
              {document.pages_to_paraph.length}
            </span>
            <div className="flex-1 h-2 bg-advist-surface-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-advist-gold rounded-full transition-all"
                style={{
                  width: `${(paraphedPages.length / document.pages_to_paraph.length) * 100}%`,
                }}
              />
            </div>
            {allParaphsComplete && <CheckCircle size={16} className="text-advist-success" />}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Workflow & Comments using WorkflowViewer component */}
        {showWorkflowPanel && document.workflow && (
          <WorkflowViewer
            workflow={document.workflow}
            variant="sidebar"
            theme="light"
            showHeader={true}
            collapsible={true}
            showSignatures={true}
            showComments={true}
            className="w-80 border-r border-primary-200 shadow-sm"
          />
        )}

        {/* Toggle Workflow Panel Button (when hidden) */}
        {!showWorkflowPanel && document.workflow && (
          <button
            onClick={() => setShowWorkflowPanel(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-r-lg border border-l-0 border-advist-border hover:bg-advist-surface-dark transition-all duration-240 z-10 shadow-md"
          >
            <GitBranch size={18} className="text-advist-gold-dark" />
          </button>
        )}

        {/* Document Viewer */}
        <div className="flex-1 overflow-auto bg-advist-surface-dark flex items-center justify-center p-4 relative">
          <div
            className="bg-white shadow-2xl relative"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              width: '800px',
              minHeight: '1000px',
            }}
          >
            {/* Document content placeholder */}
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <FileText size={64} className="text-advist-text-muted mb-4" />
              <p className="text-advist-text-secondary text-lg">
                Page {currentPage} / {totalPages}
              </p>
              <p className="text-advist-text-muted text-sm mt-2">{document.title}</p>

              {/* In real app, render actual PDF page here */}
            </div>

            {/* Page indicators overlay */}
            {needsParaphOnCurrentPage && (
              <div
                className={`absolute top-4 right-4 px-4 py-2 rounded-xl font-medium shadow-lg ${
                  isCurrentPageParaphed
                    ? 'bg-advist-success text-white'
                    : 'bg-advist-gold-light text-advist-gold-dark border-2 border-advist-gold'
                }`}
              >
                {isCurrentPageParaphed ? (
                  <span className="flex items-center gap-2">
                    <Check size={18} /> {t('signatures.paraphed', 'Paraphé')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Stamp size={18} /> {t('signatures.paraphRequired', 'Paraphe requis')}
                  </span>
                )}
              </div>
            )}

            {needsSignatureOnCurrentPage && (
              <div
                className={`absolute bottom-4 right-4 px-4 py-2 rounded-xl font-medium shadow-lg ${
                  signatureApplied
                    ? 'bg-advist-success text-white'
                    : 'bg-advist-gold-light text-advist-gray900 border-2 border-advist-dark'
                }`}
              >
                {signatureApplied ? (
                  <span className="flex items-center gap-2">
                    <Check size={18} /> {t('signatures.signed', 'Signé')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <PenTool size={18} /> {t('signatures.signatureRequired', 'Signature requise')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-advist-border flex flex-col">
          {/* Page navigation */}
          <div className="p-4 border-b border-advist-border">
            <h3 className="text-advist-gray900 font-medium mb-3">Pages</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const needsParaph = document.pages_to_paraph.includes(page);
                const isParaphed = paraphedPages.includes(page);
                const needsSign = document.pages_to_sign.includes(page);

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      w-10 h-10 rounded-xl text-sm font-medium transition-all
                      ${currentPage === page ? 'ring-2 ring-advist-gold ring-offset-2 ring-offset-white' : ''}
                      ${
                        needsSign
                          ? signatureApplied
                            ? 'bg-advist-success text-white'
                            : 'bg-advist-surface-dark text-advist-text-secondary border border-advist-gold'
                          : needsParaph
                            ? isParaphed
                              ? 'bg-advist-success text-white'
                              : 'bg-advist-gold/30 text-advist-gold-dark border border-advist-gold'
                            : 'bg-advist-surface-dark text-advist-text-muted hover:bg-advist-gold/20'
                      }
                    `}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-1 p-4 space-y-4">
            <h3 className="text-advist-gray900 font-medium">Actions</h3>

            {/* Quick paraph all pages button */}
            {document.requires_paraph && !allParaphsComplete && (
              <Button
                onClick={() => setParaphedPages([...document.pages_to_paraph])}
                className="w-full bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-900 hover:to-orange-600 text-white shadow-lg"
                leftIcon={<Stamp size={18} />}
              >
                <span className="flex flex-col items-start">
                  <span className="font-semibold">
                    {t('signatures.paraphAllPages', 'Parapher toutes les pages')}
                  </span>
                  <span className="text-xs opacity-80">
                    {document.pages_to_paraph.length - paraphedPages.length}{' '}
                    {t('signatures.pagesRemaining', 'pages restantes')}
                  </span>
                </span>
              </Button>
            )}

            {needsParaphOnCurrentPage && !isCurrentPageParaphed && (
              <Button
                onClick={handleParaphPage}
                className="w-full bg-advist-gold hover:bg-advist-gold-dark text-advist-gray900"
                leftIcon={<Stamp size={18} />}
              >
                {t('signatures.paraphThisPage', 'Parapher cette page')}
              </Button>
            )}

            {canSign && !signatureApplied && (
              <Button
                onClick={handleSign}
                className="w-full bg-advist-dark hover:bg-advist-dark text-white"
                leftIcon={<PenTool size={18} />}
              >
                {t('signatures.applySignature', 'Apposer ma signature')}
              </Button>
            )}

            {signatureApplied && (
              <Button
                onClick={() => navigate(-1)}
                className="w-full bg-advist-success hover:bg-advist-success text-white"
                leftIcon={<Check size={18} />}
              >
                {t('signatures.done', 'Terminé')}
              </Button>
            )}

            <div className="border-t border-advist-border pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRefusalPanel(!showRefusalPanel)}
                className="w-full border-advist-border text-advist-error hover:bg-advist-error/10"
                leftIcon={<XCircle size={18} />}
              >
                {t('signatures.refuse', 'Refuser de signer')}
              </Button>
            </div>

            {showRefusalPanel && (
              <div className="p-4 bg-advist-surface-dark rounded-xl space-y-3">
                <textarea
                  value={refusalReason}
                  onChange={(e) => setRefusalReason(e.target.value)}
                  placeholder={t('signatures.refusalReasonPlaceholder', 'Motif du refus...')}
                  className="w-full p-3 bg-white border border-advist-border rounded-xl text-advist-gray900 placeholder-primary-400 resize-none"
                  rows={3}
                />
                <label className="flex items-center gap-2 text-sm text-advist-text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefinitiveRefusal}
                    onChange={(e) => setIsDefinitiveRefusal(e.target.checked)}
                    className="rounded border-primary-500"
                  />
                  <span className="flex items-center gap-1">
                    <Ban size={14} />
                    {t('signatures.definitiveRefusal', 'Refus définitif')}
                  </span>
                </label>
                <Button
                  onClick={handleRefuse}
                  disabled={!refusalReason.trim()}
                  className="w-full bg-advist-error hover:bg-advist-error text-white disabled:opacity-50"
                  leftIcon={<XCircle size={18} />}
                >
                  {t('signatures.confirmRefusal', 'Confirmer le refus')}
                </Button>
              </div>
            )}
          </div>

          {/* Page navigation buttons */}
          <div className="p-4 border-t border-advist-border flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={handlePrevPage}
              className="text-advist-gray900"
              leftIcon={<ChevronLeft size={18} />}
            >
              {t('common.previous', 'Précédent')}
            </Button>
            <span className="text-advist-text-muted text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              className="text-advist-gray900"
              rightIcon={<ChevronRight size={18} />}
            >
              {t('common.next', 'Suivant')}
            </Button>
          </div>
        </div>
      </div>

      {/* PIN Confirmation Overlay */}
      {showPinConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center space-y-4">
            <div className="p-4 bg-advist-gold-light rounded-full inline-block">
              <Shield size={32} className="text-advist-gray900" />
            </div>
            <h3 className="font-semibold text-xl text-advist-gray900">
              {t('signatures.confirmIdentity', 'Confirmez votre identité')}
            </h3>
            <p className="text-advist-text-secondary">
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
            <div className="flex gap-3 justify-center pt-4">
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
  );
};

export default SignDocumentPage;
