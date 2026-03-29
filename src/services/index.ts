/**
 * Services index - Export all services
 */
export { supabase, invokeEdgeFunction } from './api';
export { authService } from './auth';
export { documentsService } from './documents';
export { workflowsService } from './workflows';
export { notificationsService } from './notifications';
export { offlineService } from './offline';
export { validationReportService } from './validationReport';
export { subscriptionsService } from './subscriptions';
export { whatsappService } from './whatsapp';
export { deadlinesService } from './deadlines';
export { anomalyDetectionService } from './anomalyDetection';
export { claudeService } from './claude';
export { openRouterService } from './openrouter';
export { aiService } from './ai';
export type { AIMessage, AIResponse, DocumentAnalysisResult } from './ai';
export {
  consentService,
  dsarService,
  processingRegisterService,
  retentionService,
  breachService,
  piaService,
  signatureProofService,
  trustServicesService,
  complianceDashboardService,
} from './compliance';
export { default as complianceService } from './compliance';
export {
  integrationService,
  salesforceService,
  INTEGRATION_PROVIDERS,
} from './integrations';
export type {
  IntegrationConnection,
  IntegrationProvider,
  IntegrationStatus,
  SalesforceConnection,
  CloudFolder,
  CloudFile,
  ERPDocument,
} from './integrations';
