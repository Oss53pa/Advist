/**
 * Validation Report Service — Supabase Implementation
 *
 * Handles generation, storage, and sharing of validation reports.
 * Report generation remains client-side; persistence uses Supabase.
 */
import { supabase } from '../lib/supabase';
import { parseSupabaseError, downloadFile } from './supabase-helpers';
import { generateVerificationCode as generateVerificationCodeUtil } from '../utils/encryption';
import type { ValidationReportData, ValidationStep, AuthorizedSigner } from '../components/workflows/ValidationReport';
import type { WorkflowInstance, Document } from '../types';

// ---------------------------------------------------------------------------
// Helpers — pure functions (unchanged)
// ---------------------------------------------------------------------------

const generateReferenceNumber = (documentId: string | number, workflowId: string | number): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `VR-${year}${month}${day}-${documentId}-${workflowId}`;
};

const generateVerificationCode = (): string => {
  return generateVerificationCodeUtil();
};

const generateQRCode = async (data: string): Promise<string> => {
  try {
    const QRCode = await import('qrcode');
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#383733',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

const mapStepStatus = (status: string): ValidationStep['status'] => {
  switch (status) {
    case 'completed':
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'in_progress':
      return 'in_progress';
    case 'skipped':
      return 'skipped';
    default:
      return 'pending';
  }
};

const mapStepType = (type: string): ValidationStep['type'] => {
  switch (type) {
    case 'approval':
      return 'approval';
    case 'signature':
      return 'signature';
    case 'review':
    case 'validation':
      return 'validation';
    case 'paraph':
      return 'paraph';
    case 'information':
    case 'consultation':
      return 'consultation';
    default:
      return 'validation';
  }
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateReportOptions {
  workflowInstance: WorkflowInstance;
  document: Document;
  includeQRCode?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const validationReportService = {
  /**
   * Generate a validation report from a workflow instance (client-side)
   */
  async generateReport(options: GenerateReportOptions): Promise<ValidationReportData> {
    const { workflowInstance, document, includeQRCode = true } = options;

    const referenceNumber = generateReferenceNumber(document.id, workflowInstance.id);
    const verificationCode = generateVerificationCode();
    const reportId = `${document.id}-${workflowInstance.id}-${Date.now()}`;

    const verificationUrl = `${window.location.origin}/reports/validation/${reportId}?code=${verificationCode}`;

    let qrCodeData: string | undefined;
    if (includeQRCode) {
      qrCodeData = await generateQRCode(verificationUrl);
    }

    const steps: ValidationStep[] = workflowInstance.steps.map((step) => {
      const mainAssignee = step.assignees[0];
      const completedAssignee = step.assignees.find(a => a.status === 'approved' || a.status === 'rejected');

      return {
        id: String(step.id),
        order: step.step_number,
        name: step.name,
        type: mapStepType(step.type),
        status: mapStepStatus(step.status),
        assignee: {
          id: mainAssignee?.user?.id || 0,
          name: mainAssignee?.user ? `${mainAssignee.user.first_name} ${mainAssignee.user.last_name}` : 'Non assigné',
          email: mainAssignee?.user?.email || '',
          role: mainAssignee?.user?.role,
          department: mainAssignee?.user?.department?.name,
          title: '',
        },
        completedAt: completedAssignee?.acted_at,
        completedBy: completedAssignee ? {
          id: completedAssignee.user.id,
          name: `${completedAssignee.user.first_name} ${completedAssignee.user.last_name}`,
          email: completedAssignee.user.email,
          delegatedFrom: completedAssignee.delegated_to
            ? `${mainAssignee?.user?.first_name} ${mainAssignee?.user?.last_name}`
            : undefined,
        } : undefined,
        comment: completedAssignee?.comment,
        signature: undefined,
        paraphPages: [],
        deadline: step.deadline,
      };
    });

    const authorizedSigners: AuthorizedSigner[] = workflowInstance.template.steps_config
      .filter(step => step.type === 'signature' || step.type === 'approval' || step.type === 'paraph')
      .map((step) => ({
        id: step.assignee_id,
        name: '',
        email: '',
        role: step.assignee_type,
        signatureType: step.type as 'signature' | 'paraph' | 'approval' | 'validation',
        canDelegate: step.can_delegate,
      }));

    const reportData: ValidationReportData = {
      id: reportId,
      referenceNumber,
      document: {
        id: String(document.id),
        title: document.title,
        type: document.document_type?.name || 'Document',
        version: String(document.current_version),
        createdAt: document.created_at,
        createdBy: `${document.owner.first_name} ${document.owner.last_name}`,
        fileHash: document.file_hash,
        pageCount: 1,
      },
      workflow: {
        id: String(workflowInstance.id),
        name: workflowInstance.template.name,
        templateName: workflowInstance.template.name,
        startedAt: workflowInstance.started_at,
        completedAt: workflowInstance.completed_at,
        status: workflowInstance.status as 'in_progress' | 'completed' | 'rejected' | 'cancelled',
        initiatedBy: {
          id: workflowInstance.initiated_by.id,
          name: `${workflowInstance.initiated_by.first_name} ${workflowInstance.initiated_by.last_name}`,
          email: workflowInstance.initiated_by.email,
          department: workflowInstance.initiated_by.department?.name,
        },
      },
      steps,
      authorizedSigners,
      verificationCode,
      qrCodeData,
      generatedAt: new Date().toISOString(),
    };

    return reportData;
  },

  /**
   * Save a validation report to Supabase Storage
   */
  async saveReport(report: ValidationReportData): Promise<{ id: string; url: string }> {
    const path = `validation-reports/${report.id}.json`;
    const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
    const file = new File([blob], `${report.id}.json`, { type: 'application/json' });

    const { error } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true });

    if (error) throw new Error(error.message);

    return {
      id: report.id,
      url: `${window.location.origin}/reports/validation/${report.id}`,
    };
  },

  /**
   * Get a validation report by ID from storage
   */
  async getReport(reportId: string): Promise<ValidationReportData> {
    const path = `validation-reports/${reportId}.json`;
    const blob = await downloadFile('documents', path);
    if (!blob) throw new Error('Rapport non trouvé');

    const text = await blob.text();
    return JSON.parse(text) as ValidationReportData;
  },

  /**
   * Get validation report by document ID
   */
  async getReportByDocument(documentId: number | string): Promise<ValidationReportData | null> {
    try {
      // List reports in the validation-reports folder
      const { data: files } = await supabase.storage
        .from('documents')
        .list('validation-reports', { search: String(documentId) });

      if (!files || files.length === 0) return null;

      // Get the latest report for this document
      const matching = files.filter(f => f.name.startsWith(String(documentId)));
      if (matching.length === 0) return null;

      const latest = matching.sort((a, b) =>
        (b.created_at || '').localeCompare(a.created_at || ''),
      )[0];

      return this.getReport(latest.name.replace('.json', ''));
    } catch {
      return null;
    }
  },

  /**
   * Verify a validation report
   */
  async verifyReport(
    reportId: string,
    verificationCode: string,
  ): Promise<{ valid: boolean; report?: ValidationReportData; message?: string }> {
    try {
      const report = await this.getReport(reportId);
      if (report.verificationCode === verificationCode) {
        return { valid: true, report };
      }
      return { valid: false, message: 'Code de vérification invalide' };
    } catch {
      return {
        valid: false,
        message: 'Code de vérification invalide ou rapport non trouvé',
      };
    }
  },

  /**
   * Generate a shareable link for the report
   */
  getShareableLink(reportId: string, verificationCode?: string): string {
    const baseUrl = `${window.location.origin}/reports/validation/${reportId}`;
    if (verificationCode) {
      return `${baseUrl}?code=${verificationCode}`;
    }
    return baseUrl;
  },

  /**
   * Send report via email — requires Edge Function (Phase 5)
   */
  async sendReportByEmail(
    reportId: string,
    recipients: string[],
    message?: string,
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('send-validation-report', {
      body: { reportId, recipients, message },
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Download report as PDF — requires Edge Function (Phase 5)
   */
  async downloadReportPDF(reportId: string): Promise<Blob> {
    const { data, error } = await supabase.functions.invoke('generate-report-pdf', {
      body: { reportId },
    });
    if (error) throw new Error(error.message);
    return data as Blob;
  },
};

export default validationReportService;
