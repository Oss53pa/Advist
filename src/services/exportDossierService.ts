/**
 * Export Dossier Service - Export complet d'un workflow
 *
 * Genere :
 * - PDF avec page de garde, documents, signatures, audit trail
 * - Page de certification (Module 5 — Loi CI 2013-546)
 * - Dossier de preuves ZIP autoportant (Module 4)
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import { generateVerificationCode } from '../utils/encryption';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

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
  signer_email: string;
  role: string;
  action: string;
  signed_at: string;
  method: string;
  signature_hash?: string;
  // Valeur probante fields
  server_timestamp?: string;
  document_hash?: string;
  signature_image_hash?: string;
  integrity_seal?: string;
  verification_method?: string;
  verified_at?: string;
  ip_address?: string;
  consent_version?: string;
}

interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  ip_address?: string;
}

interface ConsentData {
  signer_email: string;
  consent_version: string;
  consented_at: string;
  identity_confirmed: boolean;
  legal_equivalence_accepted: boolean;
}

interface VerificationData {
  signer_email: string;
  verification_level: string;
  otp_channel: string;
  verified_at: string;
  ip_address?: string;
}

interface ExportAdapter {
  getWorkflow(workflowId: string): Promise<WorkflowData>;
  getDocuments(workflowId: string): Promise<DocumentData[]>;
  getAuditTrail(workflowId: string): Promise<AuditEntry[]>;
  getSignatures(workflowId: string): Promise<SignatureData[]>;
  // Extended for evidence package
  getDocumentBlob?(documentId: string): Promise<Blob | null>;
  getConsents?(workflowId: string): Promise<ConsentData[]>;
  getVerifications?(workflowId: string): Promise<VerificationData[]>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

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
    const verificationCode = generateVerificationCode();

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

    doc.setDrawColor(200);
    doc.line(20, 110, 190, 110);

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
        head: [['Intervenant', 'Role', 'Action', 'Date', 'Methode', 'Sceau']],
        body: signatures.map((s) => [
          s.signer_name,
          s.role,
          s.action,
          s.server_timestamp
            ? new Date(s.server_timestamp).toLocaleString('fr-FR')
            : new Date(s.signed_at).toLocaleDateString('fr-FR'),
          s.method,
          s.integrity_seal
            ? `${s.integrity_seal.substring(0, 16)}...`
            : s.signature_hash
              ? `${s.signature_hash.substring(0, 12)}...`
              : 'N/A',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 30, 30] },
      });
    }

    // --- PISTE D'AUDIT ---
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

    // --- PAGE DE CERTIFICATION (Module 5) ---
    this.generateCertificationPage(doc, workflow, documents, signatures, verificationCode);

    // --- PIED DE PAGE ---
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

  // =========================================================================
  // MODULE 5 — PAGE DE CERTIFICATION IN-DOCUMENT
  // =========================================================================

  generateCertificationPage(
    doc: jsPDF,
    workflow: WorkflowData,
    documents: DocumentData[],
    signatures: SignatureData[],
    verificationCode: string
  ): void {
    doc.addPage();

    // Header
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.text('CERTIFICAT DE SIGNATURE ELECTRONIQUE', 105, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Conforme a la Loi ivoirienne n\u00b02013-546 du 30 juillet 2013', 105, 23, {
      align: 'center',
    });
    doc.text('relative aux transactions electroniques', 105, 29, { align: 'center' });

    doc.setTextColor(0);

    // Document info
    let y = 45;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENT', 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Titre : ${workflow.title}`, 14, y);
    y += 6;
    doc.text(`Reference : ${workflow.reference}`, 14, y);
    y += 6;
    if (documents.length > 0 && documents[0].hash_sha256) {
      doc.text(`Hash SHA-256 : ${documents[0].hash_sha256}`, 14, y);
      y += 6;
    }
    doc.text(`Date de creation : ${new Date(workflow.created_at).toLocaleString('fr-FR')}`, 14, y);
    y += 6;
    doc.text(`Statut : ${workflow.status}`, 14, y);
    y += 12;

    // Signatures table
    if (signatures.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATAIRES', 14, y);
      y += 4;

      (doc as any).autoTable({
        startY: y,
        head: [['Signataire', 'Email', 'Verification', 'Date (serveur)', "Sceau d'integrite"]],
        body: signatures.map((s) => [
          s.signer_name,
          s.signer_email || '',
          s.verification_method || s.method,
          s.server_timestamp
            ? new Date(s.server_timestamp).toLocaleString('fr-FR')
            : new Date(s.signed_at).toLocaleString('fr-FR'),
          s.integrity_seal ? `${s.integrity_seal.substring(0, 24)}...` : 'N/A',
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [30, 30, 30] },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Verification code
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFICATION', 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Code de verification : ${verificationCode}`, 14, y);
    y += 6;
    doc.text('Verifiable sur : https://verify.advist.africa', 14, y);
    y += 15;

    // Legal footer
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(7);
    doc.setTextColor(100);
    const legalLines = [
      'Ce document a ete signe electroniquement via la plateforme ADVIST (Atlas Studio).',
      "Conformement a l'article 9 de la Loi n\u00b02013-546, la signature electronique apposee",
      "beneficie de la presomption de fiabilite des lors que les conditions de l'article 11 sont reunies :",
      '(i) donnees de creation propres au signataire, (ii) identite verifiee par OTP,',
      '(iii) controle exclusif, (iv) detection de toute modification via le hash SHA-256.',
      '',
      'Duree de conservation des preuves : 10 ans (Acte Uniforme OHADA).',
    ];
    legalLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 4;
    });
  },

  // =========================================================================
  // MODULE 4 — DOSSIER DE PREUVES ZIP AUTOPORTANT
  // =========================================================================

  async exportEvidencePackage(workflowId: string, adapter: ExportAdapter): Promise<void> {
    const [workflow, documents, auditTrail, signatures] = await Promise.all([
      adapter.getWorkflow(workflowId),
      adapter.getDocuments(workflowId),
      adapter.getAuditTrail(workflowId),
      adapter.getSignatures(workflowId),
    ]);

    const consents = adapter.getConsents ? await adapter.getConsents(workflowId) : [];
    const verifications = adapter.getVerifications
      ? await adapter.getVerifications(workflowId)
      : [];
    const verificationCode = generateVerificationCode();

    const zip = new JSZip();

    // 1. Generate certified PDF (with certification page)
    const certifiedPdf = this.generateCertifiedPdf(
      workflow,
      documents,
      signatures,
      auditTrail,
      verificationCode
    );
    zip.file('02_DOCUMENT_SIGNE_CERTIFIE.pdf', certifiedPdf);

    // 2. Audit trail JSON
    zip.file(
      '04_PISTE_AUDIT/audit_trail.json',
      JSON.stringify(
        {
          workflow_id: workflowId,
          workflow_reference: workflow.reference,
          generated_at: new Date().toISOString(),
          events: auditTrail,
        },
        null,
        2
      )
    );

    // 3. Signature proofs
    signatures.forEach((sig, index) => {
      const proof = {
        signer_name: sig.signer_name,
        signer_email: sig.signer_email,
        signed_at: sig.server_timestamp || sig.signed_at,
        signature_type: sig.method,
        document_hash: sig.document_hash || null,
        signature_image_hash: sig.signature_image_hash || null,
        integrity_seal: sig.integrity_seal || sig.signature_hash || null,
        verification_method: sig.verification_method || null,
        verified_at: sig.verified_at || null,
        ip_address: sig.ip_address || null,
        consent_version: sig.consent_version || null,
      };
      const safeEmail = sig.signer_email?.replace(/[^a-zA-Z0-9]/g, '_') || `signataire_${index}`;
      zip.file(`05_PREUVES_SIGNATURES/${safeEmail}_preuve.json`, JSON.stringify(proof, null, 2));
    });

    // 4. Consent records
    if (consents.length > 0) {
      zip.file('05_PREUVES_SIGNATURES/consentements.json', JSON.stringify(consents, null, 2));
    }

    // 5. Verification records
    if (verifications.length > 0) {
      zip.file(
        '05_PREUVES_SIGNATURES/verifications_otp.json',
        JSON.stringify(verifications, null, 2)
      );
    }

    // 6. Hashes manifest
    const hashesManifest = {
      generated_at: new Date().toISOString(),
      workflow_reference: workflow.reference,
      verification_code: verificationCode,
      documents: documents.map((d) => ({
        name: d.name,
        hash_sha256: d.hash_sha256 || null,
      })),
      signatures: signatures.map((s) => ({
        signer: s.signer_name,
        document_hash: s.document_hash || null,
        signature_image_hash: s.signature_image_hash || null,
        integrity_seal: s.integrity_seal || null,
      })),
    };
    zip.file('06_HASHES_MANIFEST.json', JSON.stringify(hashesManifest, null, 2));

    // 7. Verification guide for judge/lawyer
    zip.file(
      '07_GUIDE_VERIFICATION.txt',
      this.generateVerificationGuide(workflow, verificationCode)
    );

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dossier_Preuves_${workflow.reference}_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Generate the certified PDF as ArrayBuffer (for ZIP inclusion)
   */
  generateCertifiedPdf(
    workflow: WorkflowData,
    documents: DocumentData[],
    signatures: SignatureData[],
    auditTrail: AuditEntry[],
    verificationCode: string
  ): ArrayBuffer {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Cover page
    doc.setFontSize(22);
    doc.text('DOSSIER CERTIFIE', 105, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text(workflow.title, 105, 55, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Reference : ${workflow.reference}`, 20, 75);
    doc.text(`Statut : ${workflow.status}`, 20, 82);
    doc.text(`Initiateur : ${workflow.initiator}`, 20, 89);
    doc.text(`Code de verification : ${verificationCode}`, 20, 96);

    // Signatures page
    if (signatures.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('SIGNATURES', 20, 20);

      (doc as any).autoTable({
        startY: 30,
        head: [['Signataire', 'Date (serveur)', 'Verification', 'Sceau']],
        body: signatures.map((s) => [
          `${s.signer_name}\n${s.signer_email || ''}`,
          s.server_timestamp
            ? new Date(s.server_timestamp).toLocaleString('fr-FR')
            : new Date(s.signed_at).toLocaleString('fr-FR'),
          s.verification_method || s.method,
          s.integrity_seal ? `${s.integrity_seal.substring(0, 20)}...` : 'N/A',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 30, 30] },
      });
    }

    // Certification page
    this.generateCertificationPage(doc, workflow, documents, signatures, verificationCode);

    // Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `ADVIST - Document certifie - Page ${i}/${pageCount} - ${new Date().toLocaleString('fr-FR')}`,
        105,
        290,
        { align: 'center' }
      );
    }

    return doc.output('arraybuffer');
  },

  /**
   * Generate the verification guide text for judges/lawyers
   */
  generateVerificationGuide(workflow: WorkflowData, verificationCode: string): string {
    return `GUIDE DE VERIFICATION DE L'AUTHENTICITE DU DOCUMENT
====================================================

Ce dossier contient toutes les preuves de la signature electronique
du document "${workflow.title}".
Reference : ${workflow.reference}

----------------------------------------------------
METHODE 1 - Verification en ligne (la plus simple)
----------------------------------------------------
Rendez-vous sur https://verify.advist.africa
Saisissez le code de verification : ${verificationCode}
Le systeme affichera toutes les signatures et leur authenticite.

----------------------------------------------------
METHODE 2 - Verification par hash (methode technique)
----------------------------------------------------
1. Ouvrez le fichier du document original
2. Calculez son empreinte SHA-256 avec un outil gratuit
   (ex: sha256sum sous Linux, certutil sous Windows)
3. Comparez avec la valeur dans 06_HASHES_MANIFEST.json
4. Si les valeurs sont identiques : le document n'a pas ete modifie

----------------------------------------------------
METHODE 3 - Verification des identites des signataires
----------------------------------------------------
Consultez le dossier 05_PREUVES_SIGNATURES/
Chaque fichier JSON contient :
  - L'email du signataire
  - La methode de verification utilisee (OTP email/SMS)
  - L'horodatage serveur de la signature
  - L'adresse IP depuis laquelle la signature a ete apposee
  - Le sceau d'integrite cryptographique

----------------------------------------------------
METHODE 4 - Verification du sceau d'integrite
----------------------------------------------------
Le sceau d'integrite est calcule comme suit :
  SHA-256( hash_document | hash_signature | id_signataire | timestamp_serveur )

Pour verifier :
1. Recuperez les 4 valeurs dans le fichier de preuve du signataire
2. Concatenez-les avec le separateur "|"
3. Calculez le SHA-256 du resultat
4. Comparez avec le sceau stocke dans le fichier de preuve

Si les valeurs correspondent : la signature est authentique et
le document n'a pas ete modifie depuis la signature.

----------------------------------------------------
BASE LEGALE
----------------------------------------------------
- Loi ivoirienne n\u00b02013-546 du 30 juillet 2013
  Articles 9 a 15 : valeur juridique des signatures electroniques
  Article 11 : presomption de fiabilite si conditions techniques respectees

- Loi n\u00b02013-450 du 19 juin 2013
  Protection des donnees personnelles

- Acte Uniforme OHADA sur le droit commercial general
  Conservation des preuves de signature

----------------------------------------------------
CONTACT
----------------------------------------------------
Pour toute question : legal@advist.africa
Plateforme : https://advist.atlas-studio.org
Editeur : Atlas Studio SARL - Abidjan, Cote d'Ivoire
`;
  },
};

export default exportDossierService;
