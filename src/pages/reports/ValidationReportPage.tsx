/**
 * Public Validation Report Page
 * Accessible via shareable link - can be viewed without authentication
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  PenTool,
  Shield,
  Download,
  AlertTriangle,
  Hash,
  QrCode,
  Loader2,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { Button, Badge } from '../../components/ui';
import { PrintButton } from '../../shared/PrintEngine';
import { WorkflowViewer } from '../../components/workflows';
import validationReportService from '../../services/validationReport';
import type { ValidationReportData } from '../../components/workflows/ValidationReport';
import type { WorkflowData } from '../../components/workflows/WorkflowViewer';

const ValidationReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const verificationCode = searchParams.get('code');

  const [report, setReport] = useState<ValidationReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  // Load report on mount
  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) {
        setError('ID du rapport non fourni');
        setLoading(false);
        return;
      }

      try {
        // If verification code is in URL, verify automatically
        if (verificationCode) {
          const result = await validationReportService.verifyReport(reportId, verificationCode);
          if (result.valid && result.report) {
            setReport(result.report);
            setIsVerified(true);
          } else {
            setError(result.message || 'Rapport non trouvé');
          }
        } else {
          // Try to load public report
          const reportData = await validationReportService.getReport(reportId);
          setReport(reportData);
          setIsVerified(false); // Requires verification for full access
        }
      } catch {
        setError('Impossible de charger le rapport');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId, verificationCode]);

  // Manual verification
  const handleVerify = async () => {
    if (!reportId || !verifyInput) return;

    setVerifying(true);
    try {
      const result = await validationReportService.verifyReport(reportId, verifyInput);
      if (result.valid && result.report) {
        setReport(result.report);
        setIsVerified(true);
        setError(null);
      } else {
        setError(result.message || 'Code invalide');
      }
    } catch {
      setError('Erreur de vérification');
    } finally {
      setVerifying(false);
    }
  };

  // PDF Generation
  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current || !report) return;

    setIsGeneratingPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `rapport-validation-${report.referenceNumber}.pdf`;

      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(options).from(reportRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [report]);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Convert ValidationReportData to WorkflowData for WorkflowViewer
  const convertToWorkflowData = (reportData: ValidationReportData): WorkflowData => {
    return {
      id: reportData.workflow.id,
      name: reportData.workflow.name,
      templateName: reportData.workflow.templateName,
      status: reportData.workflow.status,
      startedAt: reportData.workflow.startedAt,
      completedAt: reportData.workflow.completedAt,
      initiatedBy: reportData.workflow.initiatedBy,
      steps: reportData.steps.map((step) => ({
        id: step.id,
        order: step.order,
        name: step.name,
        type: step.type,
        status: step.status,
        assignee: step.assignee,
        completedAt: step.completedAt,
        completedBy: step.completedBy,
        comment: step.comment,
        signature: step.signature,
        deadline: step.deadline,
      })),
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-advist-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-advist-gray900 mx-auto mb-4" />
          <p className="text-advist-gray900">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !report) {
    return (
      <div className="min-h-screen bg-advist-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-advist-error mx-auto mb-4" />
          <h1 className="text-xl font-bold text-advist-gray900 mb-2">Rapport non trouvé</h1>
          <p className="text-advist-gray900 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-[#2a2a26] transition-all duration-240"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  // Verification required
  if (report && !isVerified && !verificationCode) {
    return (
      <div className="min-h-screen bg-advist-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock size={48} className="text-advist-gray900 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-advist-gray900 mb-2">Vérification requise</h1>
            <p className="text-advist-gray900">
              Entrez le code de vérification pour accéder au rapport complet
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              Code de vérification
            </label>
            <input
              type="text"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 border border-advist-bg rounded-xl font-mono text-center text-lg tracking-wider focus:outline-none focus:border-advist-dark"
            />
          </div>

          {error && <p className="text-advist-error text-sm text-center mb-4">{error}</p>}

          <Button
            variant="primary"
            className="w-full"
            onClick={handleVerify}
            disabled={verifying || !verifyInput}
          >
            {verifying ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              'Vérifier'
            )}
          </Button>

          {/* Preview info */}
          <div className="mt-6 pt-6 border-t border-advist-bg">
            <p className="text-sm text-advist-blue-light text-center mb-3">Aperçu du rapport</p>
            <div className="bg-advist-bg rounded-xl p-4">
              <p className="font-medium text-advist-gray900">{report.document.title}</p>
              <p className="text-sm text-advist-gray900">Ref: {report.referenceNumber}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full report display
  if (!report) return null;

  return (
    <div className="min-h-screen bg-advist-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="ADVIST" className="h-8" />
            <Badge
              variant={report.workflow.status === 'completed' ? 'success' : 'warning'}
              size="lg"
            >
              {report.workflow.status === 'completed' ? 'Workflow Terminé' : 'En Cours'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton config={{ title: 'Compte Rendu de Validation', appName: 'Advist' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                  RAPPORT DE VALIDATION
                </h2>
                <p>Référence : {report.referenceNumber}</p>
                <p>
                  Document : {report.document.title} — {report.document.type} — v
                  {report.document.version}
                </p>
                <p>
                  Workflow : {report.workflow.name} —{' '}
                  {report.workflow.status === 'completed' ? 'Terminé' : 'En cours'}
                </p>
                <p>Initié par : {report.workflow.initiatedBy.name}</p>
                <p>
                  Étapes : {report.steps.length} — Approuvées :{' '}
                  {report.steps.filter((s) => s.status === 'approved').length} — Rejetées :{' '}
                  {report.steps.filter((s) => s.status === 'rejected').length}
                </p>
                {report.verificationCode && <p>Code de vérification : {report.verificationCode}</p>}
              </div>
            </PrintButton>
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

        {/* Report Content - Compact for printing */}
        <div ref={reportRef} className="bg-white rounded-xl shadow-lg p-6 space-y-3">
          {/* Header - Compact */}
          <div className="text-center border-b-2 border-advist-dark pb-3">
            <h1 className="text-xl font-bold text-advist-gray900 mb-1">RAPPORT DE VALIDATION</h1>
            <p className="text-sm text-advist-gray900">Certificat de Workflow Documentaire</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-advist-bg rounded-xl">
              <Hash size={14} className="text-advist-blue-light" />
              <span className="font-mono text-sm font-medium text-advist-gray900">
                {report.referenceNumber}
              </span>
            </div>
          </div>

          {/* Document & Workflow Info - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Document Information */}
            <div className="bg-advist-bg rounded-xl p-3">
              <h2 className="text-sm font-semibold text-advist-gray900 mb-2 flex items-center gap-1">
                <FileText size={14} />
                Document
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-advist-blue-light">Titre</p>
                  <p className="font-medium text-advist-gray900 truncate">
                    {report.document.title}
                  </p>
                </div>
                <div>
                  <p className="text-advist-blue-light">Type</p>
                  <p className="font-medium text-advist-gray900">{report.document.type}</p>
                </div>
                <div>
                  <p className="text-advist-blue-light">Version</p>
                  <p className="font-medium text-advist-gray900">{report.document.version}</p>
                </div>
                <div>
                  <p className="text-advist-blue-light">Pages</p>
                  <p className="font-medium text-advist-gray900">{report.document.pageCount}</p>
                </div>
                <div>
                  <p className="text-advist-blue-light">Créé le</p>
                  <p className="font-medium text-advist-gray900">
                    {formatDate(report.document.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-advist-blue-light">Par</p>
                  <p className="font-medium text-advist-gray900">{report.document.createdBy}</p>
                </div>
              </div>
              {report.document.fileHash && (
                <div className="mt-2">
                  <p className="text-xs text-advist-blue-light">SHA-256</p>
                  <p className="font-mono text-[10px] text-advist-gray900 bg-white px-1 py-0.5 rounded break-all">
                    {report.document.fileHash}
                  </p>
                </div>
              )}
            </div>

            {/* Workflow Information */}
            <div className="bg-advist-gold-light rounded-xl p-3">
              <h2 className="text-sm font-semibold text-advist-gray900 mb-2 flex items-center gap-1">
                <Shield size={14} />
                Workflow
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-advist-gray900">Nom</p>
                  <p className="font-medium text-advist-gray900">{report.workflow.name}</p>
                </div>
                <div>
                  <p className="text-advist-gray900">Initié par</p>
                  <p className="font-medium text-advist-gray900">
                    {report.workflow.initiatedBy.name}
                  </p>
                </div>
                <div>
                  <p className="text-advist-gray900">Début</p>
                  <p className="font-medium text-advist-gray900">
                    {formatDate(report.workflow.startedAt)}
                  </p>
                </div>
                {report.workflow.completedAt && (
                  <div>
                    <p className="text-advist-gray900">Fin</p>
                    <p className="font-medium text-advist-gray900">
                      {formatDate(report.workflow.completedAt)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-advist-gray900">Statut</p>
                  <Badge
                    variant={report.workflow.status === 'completed' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {report.workflow.status === 'completed' ? 'Terminé' : 'En cours'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats - Compact */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-advist-bg rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-advist-gray900">{report.steps.length}</p>
              <p className="text-xs text-advist-blue-light">Étapes</p>
            </div>
            <div className="bg-green-50 border border-advist-success rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-advist-success">
                {report.steps.filter((s) => s.status === 'approved').length}
              </p>
              <p className="text-xs text-advist-success">Approuvées</p>
            </div>
            <div className="bg-advist-gold-light border border-advist-gold rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-advist-error">
                {report.steps.filter((s) => s.status === 'rejected').length}
              </p>
              <p className="text-xs text-advist-error">Rejetées</p>
            </div>
            <div className="bg-advist-gold-light border border-advist-gold rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-advist-gray900">
                {
                  report.steps.filter((s) => s.type === 'signature' && s.status === 'approved')
                    .length
                }
              </p>
              <p className="text-xs text-advist-gray900">Signatures</p>
            </div>
          </div>

          {/* Validation Steps - Using WorkflowViewer component */}
          <WorkflowViewer
            workflow={convertToWorkflowData(report)}
            variant="full"
            theme="light"
            showHeader={true}
            showSignatures={true}
            showComments={true}
          />

          {/* Final Signature - Compact */}
          {report.finalSignature && (
            <div className="border border-advist-dark rounded-xl overflow-hidden">
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
                    <div className="border border-advist-bg rounded p-2 bg-advist-surface-dark">
                      {report.finalSignature.signatureData && (
                        <img
                          src={report.finalSignature.signatureData}
                          alt="Signature finale"
                          className="h-12 object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Signer Info - Compact Grid */}
                  <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-advist-blue-light">Signé par</p>
                      <p className="font-medium text-advist-gray900">
                        {report.finalSignature.signedBy.name}
                      </p>
                      {report.finalSignature.signedBy.title && (
                        <p className="text-[10px] text-advist-gray900">
                          {report.finalSignature.signedBy.title}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-advist-blue-light">Date</p>
                      <p className="text-advist-gray900">
                        {formatDate(report.finalSignature.signedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Section - Compact */}
          <div className="bg-gradient-to-r from-advist-navy to-[#4a4843] rounded-xl p-3 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-sm font-semibold mb-1 flex items-center gap-1">
                  <Shield size={14} />
                  Vérification
                </h2>
                <div className="bg-white/10 rounded px-2 py-1 inline-block">
                  <p className="text-[10px] text-white/60">Code</p>
                  <p className="font-mono text-sm tracking-wider">{report.verificationCode}</p>
                </div>
              </div>

              {/* QR Code - Smaller */}
              <div className="bg-white rounded-xl p-2 flex-shrink-0">
                <div className="w-16 h-16 flex items-center justify-center">
                  {report.qrCodeData ? (
                    <img src={report.qrCodeData} alt="QR Code" className="w-full h-full" />
                  ) : (
                    <QrCode size={32} className="text-advist-gray900" />
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
          <div className="text-center text-[10px] text-advist-blue-light pt-2 border-t border-advist-bg">
            <p>
              ADVIST - GED | Réf: {report.referenceNumber} | {formatDate(report.generatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationReportPage;
