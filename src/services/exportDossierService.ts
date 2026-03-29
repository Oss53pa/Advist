/**
 * Export Dossier Service - Export complet d'un workflow en PDF avec audit trail
 *
 * Génère un PDF contenant :
 * - Page de garde avec métadonnées
 * - Liste des documents avec SHA-256
 * - Signatures et validations
 * - Piste d'audit complète
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface WorkflowData {
  title: string;
  reference: string;
  status: string;
  initiator: string;
  created_at: string;
}

interface DocumentData {
  name: string;
  mime_type: string;
  size: number;
  hash_sha256?: string;
  created_at: string;
}

interface SignatureData {
  signer_name: string;
  role: string;
  action: string;
  signed_at: string;
  method: string;
  signature_hash?: string;
}

interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  ip_address?: string;
}

interface ExportAdapter {
  getWorkflow(workflowId: string): Promise<WorkflowData>;
  getDocuments(workflowId: string): Promise<DocumentData[]>;
  getAuditTrail(workflowId: string): Promise<AuditEntry[]>;
  getSignatures(workflowId: string): Promise<SignatureData[]>;
}

export const exportDossierService = {
  /**
   * Exporte le dossier complet d'un workflow en PDF
   */
  async exportDossierComplet(workflowId: string, adapter: ExportAdapter): Promise<void> {
    const [workflow, documents, auditTrail, signatures] = await Promise.all([
      adapter.getWorkflow(workflowId),
      adapter.getDocuments(workflowId),
      adapter.getAuditTrail(workflowId),
      adapter.getSignatures(workflowId),
    ]);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // --- PAGE DE GARDE ---
    doc.setFontSize(22);
    doc.text('DOSSIER DE WORKFLOW', 105, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text(workflow.title, 105, 55, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Reference : ${workflow.reference}`, 20, 75);
    doc.text(
      `Date creation : ${new Date(workflow.created_at).toLocaleDateString('fr-FR')}`,
      20,
      82
    );
    doc.text(`Statut : ${workflow.status}`, 20, 89);
    doc.text(`Initiateur : ${workflow.initiator}`, 20, 96);

    // Ligne de separation
    doc.setDrawColor(200);
    doc.line(20, 110, 190, 110);

    // Resume
    doc.setFontSize(10);
    doc.text(`Documents : ${documents.length}`, 20, 120);
    doc.text(`Signatures : ${signatures.length}`, 20, 127);
    doc.text(`Evenements audit : ${auditTrail.length}`, 20, 134);

    // --- SECTION DOCUMENTS ---
    if (documents.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('DOCUMENTS DU DOSSIER', 20, 20);

      (doc as any).autoTable({
        startY: 30,
        head: [['Nom', 'Type', 'Taille', 'SHA-256', 'Ajoute le']],
        body: documents.map((d) => [
          d.name,
          d.mime_type,
          `${(d.size / 1024).toFixed(1)} Ko`,
          d.hash_sha256 ? `${d.hash_sha256.substring(0, 16)}...` : 'N/A',
          new Date(d.created_at).toLocaleDateString('fr-FR'),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 30, 30] },
      });
    }

    // --- SECTION SIGNATURES ---
    if (signatures.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('SIGNATURES ET VALIDATIONS', 20, 20);

      (doc as any).autoTable({
        startY: 30,
        head: [['Intervenant', 'Role', 'Action', 'Date', 'Methode', 'Hash']],
        body: signatures.map((s) => [
          s.signer_name,
          s.role,
          s.action,
          new Date(s.signed_at).toLocaleDateString('fr-FR'),
          s.method,
          s.signature_hash ? `${s.signature_hash.substring(0, 12)}...` : 'N/A',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 30, 30] },
      });
    }

    // --- PISTE D'AUDIT COMPLÈTE ---
    if (auditTrail.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("PISTE D'AUDIT COMPLETE", 20, 20);

      (doc as any).autoTable({
        startY: 30,
        head: [['Horodatage', 'Acteur', 'Action', 'Detail', 'IP']],
        body: auditTrail.map((e) => [
          new Date(e.timestamp).toLocaleString('fr-FR'),
          e.actor,
          e.action,
          e.detail,
          e.ip_address || 'N/A',
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [30, 30, 30] },
      });
    }

    // --- PIED DE PAGE LÉGAL ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `ADVIST - Dossier certifie - Page ${i}/${pageCount} - Genere le ${new Date().toLocaleString('fr-FR')}`,
        105,
        290,
        { align: 'center' }
      );
    }

    const filename = `Dossier_${workflow.reference}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  },
};

export default exportDossierService;
