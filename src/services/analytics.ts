/**
 * Analytics Service
 * Handles benchmarking, ROI calculation, and executive reports
 */
import { supabase, invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';
import { invokeRpc } from './supabase-crud';

// Types for Industry Sector
export interface IndustrySector {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
}

// Types for Organization Profile
export type SizeCategory = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';

export interface OrganizationProfile {
  id: string;
  organizationId: string;
  sector?: IndustrySector;
  sizeCategory: SizeCategory;
  employeeCount: number;
  participateInBenchmarking: boolean;
  anonymizeData: boolean;
  hourlyCost: number;
  currency: string;
}

// Types for Benchmark Comparison
export interface BenchmarkComparison {
  yourValue: number;
  industryAverage: number;
  percentile: number;
  status: 'excellent' | 'good' | 'average' | 'below' | 'poor';
  isTopPerformer?: boolean;
  message?: string;
}

export interface BenchmarkData {
  organizationMetrics: {
    documentsValidated: number;
    documentsSigned: number;
    documentsRejected: number;
    avgValidationTimeDays: number;
    avgSignatureTimeHours: number;
    rejectionRate: number;
    hoursSaved: number;
    costSaved: number;
  };
  benchmark: {
    sector: string;
    sizeCategory: string;
    sampleSize: number;
    avgValidationTimeDays: number;
    medianValidationTimeDays: number;
    avgSignatureTimeHours: number;
    avgRejectionRate: number;
    top10ValidationTime: number;
  } | null;
  comparison: {
    validationTime: BenchmarkComparison;
    signatureTime: BenchmarkComparison;
    rejectionRate: BenchmarkComparison;
  } | null;
  overallStatus: 'top' | 'above' | 'average' | 'below' | 'low' | 'no_data';
  overallPercentile: number;
  statusMessage: string;
}

// Types for ROI
export interface ROISummary {
  headline: string;
  totalHoursSaved: number;
  totalCostSaved: number;
  efficiencyGain: number;
  currency: string;
}

export interface TimeSavings {
  validation: {
    hoursSaved: number;
    perDocument: number;
    reductionPct: number;
  };
  signature: {
    hoursSaved: number;
    perDocument: number;
    reductionPct: number;
  };
  errorCorrection: {
    hoursSaved: number;
    errorsPrevented: number;
  };
  totalHours: number;
  totalHoursPerMonth: number;
}

export interface CostSavings {
  labor: { amount: number; description: string };
  errors: { amount: number; description: string };
  paper: { amount: number; description: string };
  total: number;
  perDocument: number;
}

export interface ROIData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  summary: ROISummary;
  documentsProcessed: number;
  timeSavings: TimeSavings | null;
  costSavings: CostSavings | null;
  metrics: {
    costPerValidation: {
      withAdvist: number;
      manualEstimate: number;
    };
    timeToSignature: {
      withAdvistHours: number;
      manualEstimateHours: number;
    };
    errorRate: {
      withAdvist: number;
      manualEstimate: number;
      reductionPct: number;
    };
  } | null;
  comparison: {
    beforeAdvist: {
      validationTimeHours: number;
      signatureTimeHours: number;
      errorRatePct: number;
    };
    withAdvist: {
      validationTimeHours: number;
      signatureTimeHours: number;
      errorRatePct: number;
    };
  } | null;
}

// Types for Business Metrics
export interface BusinessMetric {
  value: number;
  unit: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    changePct: number;
    previousValue?: number;
  };
  comparison?: {
    manualEstimate: number;
    savingsPct: number;
  };
  description?: string;
}

export interface BusinessMetrics {
  costPerValidation: BusinessMetric;
  timeToSignature: BusinessMetric;
  errorRateAvoided: BusinessMetric & {
    manualErrorRate?: number;
    currentErrorRate?: number;
  };
  documentsProcessed: {
    value: number;
    validated: number;
    signed: number;
    rejected: number;
  };
  period: {
    start: string;
    end: string;
  };
  hasData?: boolean;
}

// Types for Best Practices
export type BestPracticeCategory =
  | 'validation'
  | 'signature'
  | 'workflow'
  | 'collaboration'
  | 'security'
  | 'efficiency';
export type BestPracticePriority = 'low' | 'medium' | 'high' | 'critical';
export type BestPracticeStatus =
  | 'not_adopted'
  | 'suggested'
  | 'in_progress'
  | 'implemented'
  | 'dismissed';

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: BestPracticeCategory;
  priority: BestPracticePriority;
  expectedTimeSavingPct: number;
  expectedErrorReductionPct: number;
  adoptionRate: number;
  successRate: number;
  implementationSteps: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  adoptionStatus: BestPracticeStatus;
}

// Types for Executive Report
export type ExecutiveReportType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';

export interface ExecutiveSummary {
  keyMetrics: {
    documentsProcessed: number;
    hoursSaved: number;
    costSaved: number;
    efficiencyGain: number;
    industryRanking: number;
  };
  highlights: Array<{
    title: string;
    description: string;
    icon: string;
    color: string;
  }>;
  concerns: Array<{
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    expectedImpact: string;
    priority: string;
  }>;
  headline: string;
}

export interface KPIDashboard {
  [key: string]: {
    value: string | number;
    label: string;
    trend: number;
    status: 'excellent' | 'good' | 'neutral' | 'warning' | 'critical';
    icon: string;
  };
}

export interface ExecutiveReport {
  id: string;
  organizationId: string;
  reportType: ExecutiveReportType;
  title: string;
  periodStart: string;
  periodEnd: string;
  executiveSummary: ExecutiveSummary;
  kpiDashboard: KPIDashboard;
  benchmarkComparison: {
    available: boolean;
    overallPercentile?: number;
    overallStatus?: string;
    statusMessage?: string;
    comparisons?: Array<{
      metric: string;
      yourValue: string;
      industryAvg: string;
      percentile?: number;
      isTopPerformer?: boolean;
      message?: string;
    }>;
    sectorInfo?: {
      name: string;
      sampleSize: number;
    };
  };
  roiSummary: {
    available: boolean;
    headline?: string;
    totalHoursSaved?: number;
    totalCostSaved?: number;
    currency?: string;
    efficiencyGainPct?: number;
  };
  trendAnalysis: {
    period: { start: string; end: string };
    charts: {
      documentsOverTime: { labels: string[]; data: number[]; title: string };
      validationTimeTrend: { labels: string[]; data: number[]; title: string };
      efficiencyTrend: { labels: string[]; data: number[]; title: string };
    };
  };
  actionItems: Array<{
    priority: string;
    category: string;
    title: string;
    description: string;
    impact: string;
    adoptionRate?: string;
  }>;
  pdfUrl?: string;
  createdAt: string;
}

// Analytics Service
export const analyticsService = {
  /**
   * Get benchmark comparison for the organization
   */
  async getBenchmarkComparison(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<BenchmarkData> {
    return invokeRpc<BenchmarkData>('get_benchmark_comparison', {
      p_start_date: params?.startDate ?? null,
      p_end_date: params?.endDate ?? null,
    });
  },

  /**
   * Get ROI calculation
   */
  async getROI(params?: { startDate?: string; endDate?: string }): Promise<ROIData> {
    return invokeRpc<ROIData>('get_roi_analysis', {
      p_start_date: params?.startDate ?? null,
      p_end_date: params?.endDate ?? null,
    });
  },

  /**
   * Get business metrics
   */
  async getBusinessMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<BusinessMetrics> {
    return invokeRpc<BusinessMetrics>('get_business_metrics', {
      p_start_date: params?.startDate ?? null,
      p_end_date: params?.endDate ?? null,
    });
  },

  /**
   * Get suggested best practices
   */
  async getBestPractices(limit?: number): Promise<BestPractice[]> {
    const { data, error } = await supabase
      .from('analytics_metrics')
      .select('*')
      .eq('metric_type', 'best_practice')
      .order('priority', { ascending: false })
      .limit(limit ?? 50);

    if (error) throw parseSupabaseError(error);
    return (data as unknown as BestPractice[]) ?? [];
  },

  /**
   * Update best practice adoption status
   */
  async updateBestPracticeStatus(
    practiceId: string,
    status: BestPracticeStatus,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('analytics_metrics')
      .update({ adoption_status: status, notes, updated_at: new Date().toISOString() })
      .eq('id', practiceId);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Get organization analytics profile
   */
  async getProfile(): Promise<OrganizationProfile> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('report_type', 'organization_profile')
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as OrganizationProfile;
  },

  /**
   * Update organization analytics profile
   */
  async updateProfile(data: Partial<OrganizationProfile>): Promise<OrganizationProfile> {
    const { data: result, error } = await supabase
      .from('analytics_reports')
      .update(data as Record<string, unknown>)
      .eq('report_type', 'organization_profile')
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return result as unknown as OrganizationProfile;
  },

  /**
   * Get available industry sectors
   */
  async getSectors(): Promise<IndustrySector[]> {
    return invokeRpc<IndustrySector[]>('get_industry_sectors');
  },

  /**
   * Generate executive report
   */
  async generateReport(params: {
    reportType: ExecutiveReportType;
    startDate?: string;
    endDate?: string;
  }): Promise<ExecutiveReport> {
    return invokeEdgeFunction<ExecutiveReport>('generate-executive-report', {
      report_type: params.reportType,
      start_date: params.startDate ?? null,
      end_date: params.endDate ?? null,
    });
  },

  /**
   * Get executive report by ID
   */
  async getReport(reportId: string): Promise<ExecutiveReport> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as ExecutiveReport;
  },

  /**
   * List executive reports
   */
  async listReports(limit?: number): Promise<ExecutiveReport[]> {
    let query = supabase
      .from('analytics_reports')
      .select('*')
      .eq('report_type', 'executive')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw parseSupabaseError(error);
    return (data as unknown as ExecutiveReport[]) ?? [];
  },

  /**
   * Download executive report as PDF
   */
  async downloadReportPDF(reportId: string): Promise<Blob> {
    return invokeEdgeFunction<Blob>('export-data', {
      type: 'executive_report_pdf',
      report_id: reportId,
    });
  },

  /**
   * Share executive report
   */
  async shareReport(reportId: string, userIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('analytics_reports')
      .update({
        shared_with: userIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) throw parseSupabaseError(error);
  },
};

// Helper functions
export function formatCurrency(amount: number, currency: string = 'XOF'): string {
  if (currency === 'XOF') {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M FCFA`;
    } else if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K FCFA`;
    }
    return `${Math.round(amount)} FCFA`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Au-dessus de la moyenne';
  if (percentile >= 25) return 'Dans la moyenne';
  return 'À améliorer';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    excellent: 'text-advist-success',
    good: 'text-advist-gray900',
    average: 'text-advist-text-secondary',
    below: 'text-advist-gold-dark',
    poor: 'text-red-600',
    top: 'text-advist-success',
    above: 'text-advist-gray900',
    low: 'text-red-600',
  };
  return colors[status] || 'text-advist-text-secondary';
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    excellent: 'bg-green-50',
    good: 'bg-advist-surface-dark',
    average: 'bg-advist-bg',
    below: 'bg-advist-gold-light',
    poor: 'bg-red-100',
    top: 'bg-green-50',
    above: 'bg-advist-surface-dark',
    low: 'bg-red-100',
  };
  return colors[status] || 'bg-advist-bg';
}

export function getTrendIcon(direction: 'up' | 'down' | 'stable'): string {
  const icons: Record<string, string> = {
    up: 'trending-up',
    down: 'trending-down',
    stable: 'minus',
  };
  return icons[direction] || 'minus';
}

export function getTrendColor(
  direction: 'up' | 'down' | 'stable',
  lowerIsBetter: boolean = false
): string {
  if (direction === 'stable') return 'text-advist-text-secondary';

  const isPositive = lowerIsBetter ? direction === 'down' : direction === 'up';
  return isPositive ? 'text-advist-success' : 'text-red-600';
}

export default analyticsService;
