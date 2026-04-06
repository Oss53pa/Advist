import React, { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  PenTool,
  Shield,
  Building2,
  Download,
  Printer,
  _Eye,
  AlertTriangle,
  Hash,
  QrCode,
  Mail,
  _Phone,
  ArrowRight,
  Check,
  _X,
  Share2,
  Copy,
  _Link,
  _Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge, Modal } from '../ui';

// Types for the validation report
export interface ValidationStep {
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
    isExternal?: boolean;
    company?: string;
    title?: string; // Job title
    phone?: string;
  };
  completedAt?: string;
  completedBy?: {
    id: number;
    name: string;
    email: string;
    title?: string;
    delegatedFrom?: string;
  };
  comment?: string;
  signature?: {
    type: 'draw' | 'text' | 'upload' | 'certificate';
    data: string; // Base64 image or text
    certificateId?: string;
    timestamp: string;
    ipAddress?: string;
  };
  paraphPages?: number[]; // Pages where paraph was applied
  paraphSignature?: string; // Base64 image of paraph
  deadline?: string;
  reminderSent?: boolean;
}

// Authorized signers for the document
export interface AuthorizedSigner {
  id: number;
  name: string;
  email: string;
  title?: string;
  role: string;
  department?: string;
  signatureType: 'signature' | 'paraph' | 'approval' | 'validation';
  canDelegate: boolean;
  delegatedTo?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ValidationReportData {
  id: string;
  referenceNumber: string;
  document: {
    id: string;
    title: string;
    type: string;
    version: string;
    createdAt: string;
    createdBy: string;
    fileHash?: string; // SHA-256 hash for integrity
    pageCount: number;
  };
  workflow: {
    id: string;
    name: string;
    templateName?: string;
    startedAt: string;
    completedAt?: string;
    status: 'in_progress' | 'completed' | 'rejected' | 'cancelled';
    initiatedBy: {
      id: number;
      name: string;
      email: string;
      department?: string;
    };
  };
  steps: ValidationStep[];
  // Authorized signers for the document
  authorizedSigners?: AuthorizedSigner[];
  finalSignature?: {
    signedBy: {
      id: number;
      name: string;
      email: string;
      title?: string;
    };
    signedAt: string;
    signatureData: string;
    certificateId?: string;
    reason?: string;
  };
  verificationCode: string;
  qrCodeData?: string;
  generatedAt: string;
}

interface ValidationReportProps {
  data: ValidationReportData;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: (method: 'link' | 'email') => void;
  shareUrl?: string;
  documentId?: string | number;
}

// PDF Generation utility
const generatePDF = async (element: HTMLElement, filename: string): Promise<Blob> => {
  const html2pdf = (await import('html2pdf.js')).default;

  const options = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  return await html2pdf().set(options).from(element).outputPdf('blob');
};

export const ValidationReport: React.FC<ValidationReportProps> = ({
  data,
  isOpen,
  onClose,
  onDownload,
  onPrint,
  onShare,
  shareUrl,
  _documentId,
}) => {
  const { _t } = useTranslation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate and download PDF
  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const filename = `rapport-validation-${data.referenceNumber}.pdf`;
      const pdfBlob = await generatePDF(reportRef.current, filename);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onDownload) onDownload();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [data.referenceNumber, onDownload]);

  // Copy share link to clipboard
  const handleCopyLink = useCallback(async () => {
    const url = shareUrl || `${window.location.origin}/reports/validation/${data.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [shareUrl, data.id]);

  // Share via email
  const handleShareEmail = useCallback(() => {
    const url = shareUrl || `${window.location.origin}/reports/validation/${data.id}`;
    const subject = encodeURIComponent(`Rapport de Validation - ${data.document.title}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-joint le rapport de validation pour le document "${data.document.title}".\n\n` +
        `Référence: ${data.referenceNumber}\n` +
        `Statut: ${data.workflow.status === 'completed' ? 'Terminé' : 'En cours'}\n\n` +
        `Accéder au rapport: ${url}\n\n` +
        `Code de vérification: ${data.verificationCode}\n\n` +
        `Cordialement,\nADVIST`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    if (onShare) onShare('email');
  }, [shareUrl, data, onShare]);

  // Open report in new tab (for external sharing)
  const handleOpenExternal = useCallback(() => {
    const url = shareUrl || `${window.location.origin}/reports/validation/${data.id}`;
    window.open(url, '_blank');
  }, [shareUrl, data.id]);

  const getStepTypeLabel = (type: ValidationStep['type']) => {
    switch (type) {
      case 'consultation':
        return 'Consultation';
      case 'validation':
        return 'Validation';
      case 'approval':
        return 'Approbation';
      case 'signature':
        return 'Signature';
      case 'paraph':
        return 'Paraphe';
      default:
        return type;
    }
  };

  const getStepTypeColor = (type: ValidationStep['type']) => {
    switch (type) {
      case 'consultation':
        return 'bg-advist-surface-dark text-advist-gray900';
      case 'validation':
        return 'bg-green-50 text-advist-success';
      case 'approval':
        return 'bg-green-50 text-advist-success';
      case 'signature':
        return 'bg-advist-gold-light text-advist-gray900';
      case 'paraph':
        return 'bg-advist-gold-light text-advist-gold-dark';
      default:
        return 'bg-advist-surface-dark text-advist-gray900';
    }
  };

  const getStatusIcon = (status: ValidationStep['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="text-advist-success" />;
      case 'rejected':
        return <XCircle size={20} className="text-advist-error" />;
      case 'pending':
        return <Clock size={20} className="text-advist-text-muted" />;
      case 'in_progress':
        return <Clock size={20} className="text-advist-gray900" />;
      case 'skipped':
        return <ArrowRight size={20} className="text-advist-text-muted" />;
      default:
        return <Clock size={20} className="text-advist-text-muted" />;
    }
  };

  const getStatusLabel = (status: ValidationStep['status']) => {
    switch (status) {
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'skipped':
        return 'Ignoré';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ValidationStep['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-advist-success';
      case 'rejected':
        return 'bg-advist-gold-light text-advist-error';
      case 'pending':
        return 'bg-advist-surface-dark text-advist-text-secondary';
      case 'in_progress':
        return 'bg-advist-gold-light text-advist-gray900';
      case 'skipped':
        return 'bg-advist-surface-dark text-advist-text-secondary';
      default:
        return 'bg-advist-surface-dark text-advist-text-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWorkflowStatusBadge = () => {
    switch (data.workflow.status) {
      case 'completed':
        return (
          <Badge variant="success" size="lg">
            Workflow Terminé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="lg">
            Workflow Rejeté
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="gray" size="lg">
            Workflow Annulé
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" size="lg">
            En Cours
          </Badge>
        );
    }
  };

  const handlePrint = useCallback(() => {
    if (!reportRef.current) return;

    // Get the report HTML content
    const reportContent = reportRef.current.innerHTML;

    // Create a new window for printing
    const printWindow = window.open('', 'PrintValidationReport', 'width=800,height=600');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimer le rapport');
      return;
    }

    // Write compact print document
    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport de Validation - ${data.referenceNumber}</title>
<style>
@page { size: A4 portrait; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.4; color: #333; background: white; width: 100%; max-width: 180mm; margin: 0 auto; padding: 10mm; }
h1 { font-size: 14pt; margin-bottom: 2mm; }
h2 { font-size: 10pt; margin-bottom: 2mm; }
h3 { font-size: 9pt; }
.text-center { text-align: center; }
.font-bold { font-weight: bold; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-mono { font-family: monospace; font-size: 7pt; }
.text-2xl { font-size: 14pt; }
.text-lg { font-size: 10pt; }
.text-sm { font-size: 7pt; }
.text-xs { font-size: 6pt; }
.text-3xl { font-size: 12pt; }
.mb-1, .mb-2 { margin-bottom: 1mm; }
.mb-3, .mb-4 { margin-bottom: 2mm; }
.mb-6 { margin-bottom: 3mm; }
.mt-1, .mt-2 { margin-top: 1mm; }
.mt-4 { margin-top: 2mm; }
.p-2 { padding: 1.5mm; }
.p-3 { padding: 2mm; }
.p-4 { padding: 2.5mm; }
.p-6 { padding: 3mm; }
.px-4 { padding-left: 2.5mm; padding-right: 2.5mm; }
.px-6 { padding-left: 3mm; padding-right: 3mm; }
.py-2 { padding-top: 1.5mm; padding-bottom: 1.5mm; }
.py-3 { padding-top: 2mm; padding-bottom: 2mm; }
.pb-4, .pb-6 { padding-bottom: 2mm; }
.pt-4 { padding-top: 2mm; }
.space-y-6 > * + * { margin-top: 3mm; }
.space-y-4 > * + * { margin-top: 2mm; }
.space-y-3 > * + * { margin-top: 1.5mm; }
.space-y-2 > * + * { margin-top: 1mm; }
.gap-1 { gap: 0.5mm; }
.gap-2 { gap: 1mm; }
.gap-3 { gap: 1.5mm; }
.gap-4 { gap: 2mm; }
.gap-6 { gap: 3mm; }
.flex { display: flex; }
.flex-1 { flex: 1; }
.flex-wrap { flex-wrap: wrap; }
.flex-shrink-0 { flex-shrink: 0; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.inline-flex { display: inline-flex; }
.inline-block { display: inline-block; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); gap: 2mm; }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); gap: 1.5mm; }
.col-span-2 { grid-column: span 2; }
.rounded-lg, .rounded-xl { border-radius: 2px; }
.rounded-full { border-radius: 50%; }
.border { border: 0.5pt solid #ddd; }
.border-2 { border: 1pt solid #ddd; }
.border-b { border-bottom: 0.5pt solid #ddd; }
.border-b-2 { border-bottom: 1pt solid #333; }
.border-t { border-top: 0.5pt solid #ddd; }
.bg-white { background: white; }
.bg-advist-surface-dark, [class*="bg-[#F4F4F4]"], [class*="bg-[#F8FAFC]"] { background: #f5f5f5; }
.bg-advist-gold-light { background: #eff6ff; }
.bg-green-50 { background: #f0fdf4; }
.bg-advist-gold-light { background: #fffbeb; }
.bg-advist-surface-dark { background: #faf5ff; }
.bg-advist-gold-light { background: #fef2f2; }
[class*="bg-advist-dark"], .bg-gradient-to-r { background: advist-navy; color: white; }
.text-white { color: white; }
[class*="text-advist-gray900"] { color: #333; }
[class*="text-advist-gray900"] { color: #555; }
[class*="text-[#A29790]"], [class*="text-[#6B7280]"] { color: #888; }
.text-advist-gray900, .text-advist-gray900, .text-advist-gray900 { color: #2563eb; }
.text-advist-success, .text-advist-success, .text-advist-success { color: #16a34a; }
.text-advist-gold-dark, .text-advist-gold-dark, .text-advist-gold-dark { color: #F59E0B; }
.text-advist-gray900, .text-advist-gray900 { color: #7c3aed; }
.text-advist-error, .text-advist-error { color: #F59E0B; }
.border-advist-success { border-color: #bbf7d0; }
.border-advist-gold { border-color: #bfdbfe; }
.border-advist-gold { border-color: #fde68a; }
[class*="border-[#EAEAEA]"], [class*="border-[#E5E7EB]"] { border-color: #ddd; }
.overflow-hidden { overflow: hidden; }
.break-all { word-break: break-all; }
.tracking-wider { letter-spacing: 0.03em; }
.w-6, .h-6 { width: 4mm; height: 4mm; }
.w-8, .h-8 { width: 5mm; height: 5mm; }
.w-24, .h-24 { width: 18mm; height: 18mm; }
img { max-width: 100%; height: auto; }
.max-h-16 { max-height: 10mm; }
.max-h-24 { max-height: 15mm; }
.h-12 { height: 8mm; }
svg { width: 3mm; height: 3mm; }
[class*="size-"] { width: 3mm; height: 3mm; }
/* Badge compact */
[class*="bg-advist-surface-dark"], [class*="bg-green-50"], [class*="bg-green-50"], [class*="bg-advist-gold-light"], [class*="bg-advist-gold-light"], [class*="bg-advist-gold-light"], [class*="bg-advist-surface-dark"] {
  padding: 0.5mm 1.5mm; border-radius: 1px; font-size: 6pt; font-weight: 500; display: inline-block;
}
.bg-advist-surface-dark { background: #f3e8ff; color: #7c3aed; }
.bg-green-50 { background: #dcfce7; color: #16a34a; }
.bg-green-50 { background: #d1fae5; color: #047857; }
.bg-advist-gold-light { background: #dbeafe; color: #2563eb; }
.bg-advist-gold-light { background: #ffedd5; color: #ea580c; }
.bg-advist-gold-light { background: #FDE68A; color: #F59E0B; }
.bg-advist-surface-dark { background: #f3f4f6; color: #4b5563; }
/* Hide buttons */
button, .no-print { display: none !important; }
</style>
</head>
<body>${reportContent}</body>
</html>`);

    printWindow.document.close();

    // Print after content loads
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);

    if (onPrint) onPrint();
  }, [data.referenceNumber, onPrint]);

  const _completedSteps = data.steps.filter(
    (s) => s.status === 'approved' || s.status === 'rejected'
  );
  const approvedSteps = data.steps.filter((s) => s.status === 'approved');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rapport de Validation" size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E7EB] sticky top-0 bg-white z-10 print:hidden">
          <div className="flex items-center gap-2">
            {getWorkflowStatusBadge()}
            <span className="text-sm text-[#6B7280]">Généré le {formatDate(data.generatedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Share Button with Dropdown */}
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowShareMenu(!showShareMenu)}>
                <Share2 size={16} className="mr-1" />
                Partager
              </Button>

              {/* Share Dropdown Menu */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-2 z-20">
                  <button
                    onClick={() => {
                      handleCopyLink();
                      setShowShareMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] flex items-center gap-2"
                  >
                    {copySuccess ? (
                      <>
                        <Check size={16} className="text-advist-success" />
                        <span className="text-advist-success">Lien copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="text-advist-gray900" />
                        <span>Copier le lien</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      handleShareEmail();
                      setShowShareMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] flex items-center gap-2"
                  >
                    <Mail size={16} className="text-advist-gray900" />
                    <span>Envoyer par email</span>
                  </button>
                  <button
                    onClick={() => {
                      handleOpenExternal();
                      setShowShareMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] flex items-center gap-2"
                  >
                    <ExternalLink size={16} className="text-advist-gray900" />
                    <span>Ouvrir dans un nouvel onglet</span>
                  </button>
                  <div className="border-t border-[#E5E7EB] my-2" />
                  <div className="px-4 py-2">
                    <p className="text-xs text-[#6B7280] mb-1">Lien de partage:</p>
                    <p className="text-xs font-mono text-advist-gray900 break-all">
                      {shareUrl || `${window.location.origin}/reports/validation/${data.id}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={16} className="mr-1" />
              Imprimer
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 size={16} className="mr-1 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-1" />
                  Télécharger PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Click outside to close share menu */}
        {showShareMenu && (
          <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
        )}

        {/* Report Content - Compact for printing */}
        <div
          ref={reportRef}
          className="validation-report-content space-y-3 bg-white"
          data-print="true"
        >
          {/* Header - Compact */}
          <div className="text-center border-b-2 border-advist-dark pb-3">
            <h1 className="text-xl font-bold text-advist-gray900 mb-1">RAPPORT DE VALIDATION</h1>
            <p className="text-sm text-advist-gray900">Certificat de Workflow Documentaire</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#F8FAFC] rounded-lg">
              <Hash size={14} className="text-[#6B7280]" />
              <span className="font-mono text-sm font-medium text-advist-gray900">
                {data.referenceNumber}
              </span>
            </div>
          </div>

          {/* Document & Workflow Info - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Document Information */}
            <div className="bg-[#F8FAFC] rounded-lg p-3">
              <h2 className="text-sm font-semibold text-advist-gray900 mb-2 flex items-center gap-1">
                <FileText size={14} />
                Document
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[#6B7280]">Titre</p>
                  <p className="font-medium text-advist-gray900 truncate">{data.document.title}</p>
                </div>
                <div>
                  <p className="text-[#6B7280]">Type</p>
                  <p className="font-medium text-advist-gray900">{data.document.type}</p>
                </div>
                <div>
                  <p className="text-[#6B7280]">Version</p>
                  <p className="font-medium text-advist-gray900">{data.document.version}</p>
                </div>
                <div>
                  <p className="text-[#6B7280]">Pages</p>
                  <p className="font-medium text-advist-gray900">{data.document.pageCount}</p>
                </div>
                <div>
                  <p className="text-[#6B7280]">Créé le</p>
                  <p className="font-medium text-advist-gray900">
                    {formatDate(data.document.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[#6B7280]">Par</p>
                  <p className="font-medium text-advist-gray900">{data.document.createdBy}</p>
                </div>
              </div>
              {data.document.fileHash && (
                <div className="mt-2">
                  <p className="text-xs text-[#6B7280]">SHA-256</p>
                  <p className="font-mono text-[10px] text-advist-gray900 bg-white px-1 py-0.5 rounded break-all">
                    {data.document.fileHash}
                  </p>
                </div>
              )}
            </div>

            {/* Workflow Information */}
            <div className="bg-advist-gold-light rounded-lg p-3">
              <h2 className="text-sm font-semibold text-advist-gray900 mb-2 flex items-center gap-1">
                <Shield size={14} />
                Workflow
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-advist-gray900">Nom</p>
                  <p className="font-medium text-advist-gray900">{data.workflow.name}</p>
                </div>
                {data.workflow.templateName && (
                  <div>
                    <p className="text-advist-gray900">Modèle</p>
                    <p className="font-medium text-advist-gray900">{data.workflow.templateName}</p>
                  </div>
                )}
                <div>
                  <p className="text-advist-gray900">Initié par</p>
                  <p className="font-medium text-advist-gray900">
                    {data.workflow.initiatedBy.name}
                  </p>
                </div>
                <div>
                  <p className="text-advist-gray900">Début</p>
                  <p className="font-medium text-advist-gray900">
                    {formatDate(data.workflow.startedAt)}
                  </p>
                </div>
                {data.workflow.completedAt && (
                  <div>
                    <p className="text-advist-gray900">Fin</p>
                    <p className="font-medium text-advist-gray900">
                      {formatDate(data.workflow.completedAt)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-advist-gray900">Statut</p>
                  <Badge
                    variant={
                      data.workflow.status === 'completed'
                        ? 'success'
                        : data.workflow.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                    size="sm"
                  >
                    {data.workflow.status === 'completed'
                      ? 'Terminé'
                      : data.workflow.status === 'rejected'
                        ? 'Rejeté'
                        : 'En cours'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats - Compact */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-advist-gray900">{data.steps.length}</p>
              <p className="text-xs text-[#6B7280]">Étapes</p>
            </div>
            <div className="bg-green-50 border border-advist-success rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-advist-success">{approvedSteps.length}</p>
              <p className="text-xs text-advist-success">Approuvées</p>
            </div>
            <div className="bg-advist-gold-light border border-advist-gold rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-advist-error">
                {data.steps.filter((s) => s.status === 'rejected').length}
              </p>
              <p className="text-xs text-advist-error">Rejetées</p>
            </div>
            <div className="bg-advist-gold-light border border-advist-gold rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-advist-gray900">
                {data.steps.filter((s) => s.type === 'signature' && s.status === 'approved').length}
              </p>
              <p className="text-xs text-advist-gray900">Signatures</p>
            </div>
          </div>

          {/* Authorized Signers Section - Compact */}
          {data.authorizedSigners && data.authorizedSigners.length > 0 && (
            <div className="border border-advist-dark rounded-lg overflow-hidden">
              <div className="bg-advist-surface-dark px-3 py-2">
                <h2 className="text-sm font-semibold text-advist-gray900 flex items-center gap-1">
                  <Shield size={14} />
                  Signataires Autorisés
                </h2>
              </div>
              <div className="p-2 bg-white">
                <div className="grid grid-cols-3 gap-2">
                  {data.authorizedSigners.map((signer) => (
                    <div
                      key={signer.id}
                      className="border border-advist-dark rounded p-2 bg-advist-surface-dark/30 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-advist-gray900">{signer.name}</p>
                          {signer.title && (
                            <p className="text-sm text-advist-gray900">{signer.title}</p>
                          )}
                          <p className="text-xs text-[#6B7280] mt-1">{signer.email}</p>
                          {signer.department && (
                            <p className="text-xs text-[#6B7280]">{signer.department}</p>
                          )}
                        </div>
                        <Badge
                          className={
                            signer.signatureType === 'signature'
                              ? 'bg-advist-gold-light text-advist-gray900'
                              : signer.signatureType === 'paraph'
                                ? 'bg-advist-gold-light text-advist-gold-dark'
                                : signer.signatureType === 'approval'
                                  ? 'bg-green-50 text-advist-success'
                                  : 'bg-green-50 text-advist-success'
                          }
                          size="sm"
                        >
                          {signer.signatureType === 'signature'
                            ? 'Signataire'
                            : signer.signatureType === 'paraph'
                              ? 'Parapheur'
                              : signer.signatureType === 'approval'
                                ? 'Approbateur'
                                : 'Validateur'}
                        </Badge>
                      </div>
                      <div className="mt-2 pt-2 border-t border-advist-dark text-xs text-advist-gray900">
                        <span className="text-[#6B7280]">Rôle: </span>
                        {signer.role}
                        {signer.canDelegate && (
                          <span className="ml-2 text-advist-gray900">(peut déléguer)</span>
                        )}
                      </div>
                      {signer.delegatedTo && (
                        <div className="mt-1 text-xs text-advist-gold-dark">
                          Délégué à: {signer.delegatedTo.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation Steps - Compact Table Format */}
          <div>
            <h2 className="text-sm font-semibold text-advist-gray900 mb-2 flex items-center gap-1">
              <Clock size={14} />
              Historique des Validations
            </h2>

            <div className="space-y-2">
              {data.steps.map((step, _index) => (
                <div
                  key={step.id}
                  className={`border rounded-lg overflow-hidden ${
                    step.status === 'approved'
                      ? 'border-advist-success bg-green-50/30'
                      : step.status === 'rejected'
                        ? 'border-advist-gold bg-advist-gold-light/30'
                        : 'border-[#E5E7EB] bg-white'
                  }`}
                >
                  {/* Step Header - Compact */}
                  <div className="p-2 flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-advist-dark text-white flex items-center justify-center font-bold text-[10px]">
                        {step.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <h3 className="text-xs font-semibold text-advist-gray900">{step.name}</h3>
                          <Badge className={getStepTypeColor(step.type)} size="sm">
                            {getStepTypeLabel(step.type)}
                          </Badge>
                          <Badge className={getStatusColor(step.status)} size="sm">
                            {getStatusLabel(step.status)}
                          </Badge>
                        </div>

                        {/* Assignee Info - Compact inline */}
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-advist-gray900 flex-wrap">
                          <span className="flex items-center gap-0.5">
                            <User size={10} />
                            {step.assignee.name}
                          </span>
                          {step.assignee.department && (
                            <span className="flex items-center gap-0.5">
                              <Building2 size={10} />
                              {step.assignee.department}
                            </span>
                          )}
                          {step.completedAt && (
                            <span className="flex items-center gap-0.5 text-[#6B7280]">
                              <Calendar size={10} />
                              {formatDate(step.completedAt)}
                            </span>
                          )}
                        </div>

                        {/* Delegation info */}
                        {step.completedBy && step.completedBy.id !== step.assignee.id && (
                          <div className="text-[10px] text-advist-gold-dark">
                            Délégué à: {step.completedBy.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Signature Display - Smaller */}
                    <div className="flex-shrink-0 ml-2">
                      {step.signature?.data && step.status === 'approved' ? (
                        <div className="bg-white border border-advist-border rounded p-1">
                          <img
                            src={step.signature.data}
                            alt={`Signature`}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        getStatusIcon(step.status)
                      )}
                    </div>
                  </div>

                  {/* Comment Section - Compact */}
                  {step.comment && (
                    <div className="px-2 pb-1.5">
                      <div className="flex items-start gap-1 text-[10px] text-advist-gray900 italic">
                        <MessageSquare size={10} className="text-[#6B7280] mt-0.5 flex-shrink-0" />
                        <span>"{step.comment}"</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final Document Signature - Compact */}
          {data.finalSignature && (
            <div className="border border-advist-dark rounded-lg overflow-hidden">
              <div className="bg-advist-dark text-white px-3 py-2">
                <h2 className="text-sm font-semibold flex items-center gap-1">
                  <PenTool size={14} />
                  Signature Finale
                </h2>
              </div>
              <div className="p-3 bg-white">
                <div className="flex items-center gap-4">
                  {/* Signature */}
                  <div className="flex-shrink-0">
                    <div className="border border-[#E5E7EB] rounded p-2 bg-advist-surface-dark">
                      {data.finalSignature.signatureData && (
                        <img
                          src={data.finalSignature.signatureData}
                          alt="Signature finale"
                          className="h-12 object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Signer Info - Compact Grid */}
                  <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#6B7280]">Signé par</p>
                      <p className="font-medium text-advist-gray900">
                        {data.finalSignature.signedBy.name}
                      </p>
                      {data.finalSignature.signedBy.title && (
                        <p className="text-[10px] text-advist-gray900">
                          {data.finalSignature.signedBy.title}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Date</p>
                      <p className="text-advist-gray900">
                        {formatDate(data.finalSignature.signedAt)}
                      </p>
                    </div>
                    {data.finalSignature.certificateId && (
                      <div>
                        <p className="text-[#6B7280]">Certificat</p>
                        <p className="font-mono text-[10px] text-advist-gray900">
                          {data.finalSignature.certificateId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Section - Compact */}
          <div className="bg-gradient-to-r from-advist-navy to-[#4a4843] rounded-lg p-3 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-sm font-semibold mb-1 flex items-center gap-1">
                  <Shield size={14} />
                  Vérification
                </h2>
                <div className="bg-white/10 rounded px-2 py-1 inline-block">
                  <p className="text-[10px] text-white/60">Code</p>
                  <p className="font-mono text-sm tracking-wider">{data.verificationCode}</p>
                </div>
              </div>

              {/* QR Code - Smaller */}
              <div className="bg-white rounded-lg p-2 flex-shrink-0">
                <div className="w-16 h-16 flex items-center justify-center">
                  {data.qrCodeData ? (
                    <img src={data.qrCodeData} alt="QR Code" className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-[#F8FAFC] rounded-lg flex items-center justify-center">
                      <QrCode size={48} className="text-advist-gray900" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legal Notice - Compact */}
          <div className="bg-advist-gold-light rounded p-2 border border-advist-gold">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-advist-gold-dark flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-advist-gold-dark">
                <p>
                  Ce rapport constitue une preuve électronique conforme au Règlement eIDAS. Les
                  signatures apposées ont valeur juridique équivalente aux signatures manuscrites.
                </p>
              </div>
            </div>
          </div>

          {/* Footer - Compact */}
          <div className="text-center text-[10px] text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
            <p>
              ADVIST - GED | Réf: {data.referenceNumber} | {formatDate(data.generatedAt)}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Preview version for embedding
export const ValidationReportPreview: React.FC<{
  data: ValidationReportData;
  compact?: boolean;
}> = ({ data, compact = false }) => {
  const _formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const approvedSteps = data.steps.filter((s) => s.status === 'approved');

  if (compact) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-advist-gray900" />
            <span className="font-medium text-advist-gray900">Rapport de Validation</span>
          </div>
          <Badge variant={data.workflow.status === 'completed' ? 'success' : 'warning'}>
            {data.workflow.status === 'completed' ? 'Terminé' : 'En cours'}
          </Badge>
        </div>
        <div className="text-sm text-advist-gray900">
          <p>
            {approvedSteps.length} / {data.steps.length} étapes validées
          </p>
          <p className="text-xs text-[#6B7280] mt-1">Réf: {data.referenceNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-advist-gray900 flex items-center gap-2">
            <FileText size={18} />
            Rapport de Validation
          </h3>
          <p className="text-sm text-[#6B7280] mt-1">Réf: {data.referenceNumber}</p>
        </div>
        <Badge variant={data.workflow.status === 'completed' ? 'success' : 'warning'} size="lg">
          {data.workflow.status === 'completed' ? 'Terminé' : 'En cours'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-[#F8FAFC] rounded-lg">
          <p className="text-2xl font-bold text-advist-gray900">{data.steps.length}</p>
          <p className="text-xs text-[#6B7280]">Étapes</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-advist-success">{approvedSteps.length}</p>
          <p className="text-xs text-advist-success">Approuvées</p>
        </div>
        <div className="text-center p-3 bg-advist-gold-light rounded-lg">
          <p className="text-2xl font-bold text-advist-gray900">
            {data.steps.filter((s) => s.signature).length}
          </p>
          <p className="text-xs text-advist-gray900">Signatures</p>
        </div>
      </div>

      {/* Mini timeline */}
      <div className="flex items-center gap-1">
        {data.steps.map((step, _index) => (
          <div
            key={step.id}
            className={`flex-1 h-2 rounded-full ${
              step.status === 'approved'
                ? 'bg-advist-success'
                : step.status === 'rejected'
                  ? 'bg-advist-error'
                  : step.status === 'in_progress'
                    ? 'bg-advist-dark'
                    : 'bg-advist-border'
            }`}
            title={`${step.name}: ${step.status}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ValidationReport;
