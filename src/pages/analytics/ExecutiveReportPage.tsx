/**
 * Executive Report Page
 * C-level dashboard with comprehensive analytics and insights
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  FileText,
  _Users,
  Award,
  AlertCircle,
  CheckCircle,
  Download,
  _Share2,
  _Calendar,
  ChevronDown,
  ArrowUpRight,
  Lightbulb,
  Target,
  _Activity,
} from 'lucide-react';
import {
  analyticsService,
  ExecutiveReport,
  ExecutiveReportType,
  formatCurrency,
  getStatusColor,
  getStatusBgColor,
  getPercentileLabel,
} from '../../services/analytics';
import { PrintButton } from '../../shared/PrintEngine';

type DateRange = '7d' | '30d' | '90d' | '365d' | 'custom';

export const ExecutiveReportPage: React.FC = () => {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Try to get latest report or generate new one
      const reports = await analyticsService.listReports(1);
      if (reports.length > 0) {
        setReport(reports[0]);
      } else {
        await generateReport();
      }
    } catch (err) {
      // No silent mock fallback. Surface the real state of the analytics
      // backend (often: edge function not deployed for this tenant) so
      // the user doesn't see fabricated ROI / benchmark numbers.
      setReport(null);
      setLoadError(
        err instanceof Error
          ? err.message
          : "Le service d'analytique n'est pas disponible pour votre organisation."
      );
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    setLoadError(null);
    try {
      const reportType =
        dateRange === '7d'
          ? 'weekly'
          : dateRange === '30d'
            ? 'monthly'
            : dateRange === '90d'
              ? 'quarterly'
              : 'annual';

      const newReport = await analyticsService.generateReport({
        reportType: reportType as ExecutiveReportType,
      });
      setReport(newReport);
    } catch (err) {
      // Same posture as loadReport: no fabricated demo data.
      setReport(null);
      setLoadError(
        err instanceof Error ? err.message : 'Impossible de générer le rapport pour le moment.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    try {
      const blob = await analyticsService.downloadReportPDF(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${report.reportType}-${report.periodEnd}.pdf`;
      a.click();
    } catch (err) {
      console.error('Failed to download PDF:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-advist-surface-dark rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-advist-surface-dark rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-advist-surface-dark rounded-xl"></div>
          <div className="h-80 bg-advist-surface-dark rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-16">
        <BarChart3 size={48} className="mx-auto mb-4 text-advist-gray900/30" />
        <h2 className="text-lg font-medium text-advist-gray900">Aucun rapport disponible</h2>
        <p className="text-advist-gray900/70 mt-1">
          {loadError || 'Générez votre premier rapport exécutif'}
        </p>
        <button
          onClick={generateReport}
          disabled={generating}
          className="mt-4 px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90 disabled:opacity-50"
        >
          {generating ? 'Génération...' : 'Générer un rapport'}
        </button>
      </div>
    );
  }

  const summary = report.executiveSummary;
  const kpis = report.kpiDashboard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">Rapport Exécutif</h1>
          <p className="text-advist-gray900/70 mt-1">
            {report.periodStart} au {report.periodEnd}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-advist-border rounded-xl focus:outline-none focus:border-advist-dark bg-white"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="365d">12 derniers mois</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-advist-gray900/50 pointer-events-none"
            />
          </div>

          <button
            onClick={generateReport}
            disabled={generating}
            className="px-4 py-2.5 border border-advist-border rounded-xl hover:border-advist-dark transition-colors disabled:opacity-50"
          >
            {generating ? 'Génération...' : 'Actualiser'}
          </button>

          <PrintButton
            config={{ title: 'Rapport exécutif', appName: 'Advist', orientation: 'landscape' }}
          >
            <div>
              <h2 className="text-lg font-bold mb-4">
                Rapport Exécutif — {report.periodStart} au {report.periodEnd}
              </h2>
              <p className="mb-4">{summary.headline}</p>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Indicateur</th>
                    <th className="text-left py-2">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Documents traités</td>
                    <td className="py-2">{summary.keyMetrics.documentsProcessed}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Heures économisées</td>
                    <td className="py-2">{Math.round(summary.keyMetrics.hoursSaved)}h</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Économies réalisées</td>
                    <td className="py-2">{formatCurrency(summary.keyMetrics.costSaved)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Classement secteur</td>
                    <td className="py-2">
                      {getPercentileLabel(summary.keyMetrics.industryRanking)}
                    </td>
                  </tr>
                </tbody>
              </table>
              {report.actionItems.length > 0 && (
                <>
                  <h3 className="font-semibold mb-2">Actions recommandées</h3>
                  <ul className="list-disc pl-5 text-sm">
                    {report.actionItems.map((item, idx) => (
                      <li key={idx}>
                        {item.title} — {item.description}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </PrintButton>

          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90"
          >
            <Download size={16} />
            Télécharger PDF
          </button>
        </div>
      </div>

      {/* Executive Summary Headline */}
      <div className="bg-gradient-to-r from-advist-navy to-advist-navy/90 text-white p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Target size={20} className="text-advist-red" />
          <span className="text-white/70 text-sm">Résumé exécutif</span>
        </div>
        <p className="text-lg font-medium">{summary.headline}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Documents Processed */}
        <div className="bg-white p-5 rounded-xl border border-advist-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-advist-gold-light rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-advist-gray900" />
            </div>
            {kpis.documents_processed?.trend !== 0 && (
              <span
                className={`flex items-center gap-1 text-sm ${
                  kpis.documents_processed?.trend > 0 ? 'text-advist-success' : 'text-advist-error'
                }`}
              >
                {kpis.documents_processed?.trend > 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {Math.abs(kpis.documents_processed?.trend || 0)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-advist-gray900">
            {summary.keyMetrics.documentsProcessed}
          </p>
          <p className="text-sm text-advist-gray900/60">Documents traités</p>
        </div>

        {/* Hours Saved */}
        <div className="bg-white p-5 rounded-xl border border-advist-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-advist-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-advist-gray900">
            {Math.round(summary.keyMetrics.hoursSaved)}h
          </p>
          <p className="text-sm text-advist-gray900/60">Heures économisées</p>
        </div>

        {/* Cost Saved */}
        <div className="bg-white p-5 rounded-xl border border-advist-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-advist-surface-dark rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-advist-gray900" />
            </div>
          </div>
          <p className="text-2xl font-bold text-advist-gray900">
            {formatCurrency(summary.keyMetrics.costSaved)}
          </p>
          <p className="text-sm text-advist-gray900/60">Économies réalisées</p>
        </div>

        {/* Industry Ranking */}
        <div className="bg-white p-5 rounded-xl border border-advist-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-advist-gold-light rounded-lg flex items-center justify-center">
              <Award size={20} className="text-advist-gold-dark" />
            </div>
            {summary.keyMetrics.industryRanking >= 75 && (
              <span className="px-2 py-1 bg-green-50 text-advist-success text-xs font-medium rounded-full">
                Top performer
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-advist-gray900">
            {getPercentileLabel(summary.keyMetrics.industryRanking)}
          </p>
          <p className="text-sm text-advist-gray900/60">Classement secteur</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highlights & Concerns */}
        <div className="bg-white p-6 rounded-xl border border-advist-border">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-4">Points clés</h2>

          {/* Highlights */}
          {summary.highlights.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-advist-gray900/50 uppercase tracking-wider mb-2">
                Points positifs
              </p>
              <div className="space-y-2">
                {summary.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle size={18} className="text-advist-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-advist-success">{highlight.title}</p>
                      <p className="text-xs text-advist-success/70">{highlight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {summary.concerns.length > 0 && (
            <div>
              <p className="text-xs font-medium text-advist-gray900/50 uppercase tracking-wider mb-2">
                Points d'attention
              </p>
              <div className="space-y-2">
                {summary.concerns.map((concern, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      concern.severity === 'critical'
                        ? 'bg-advist-gold-light'
                        : concern.severity === 'warning'
                          ? 'bg-advist-gold-light'
                          : 'bg-advist-gold-light'
                    }`}
                  >
                    <AlertCircle
                      size={18}
                      className={
                        concern.severity === 'critical'
                          ? 'text-advist-error'
                          : concern.severity === 'warning'
                            ? 'text-advist-gold-dark'
                            : 'text-advist-gray900'
                      }
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          concern.severity === 'critical'
                            ? 'text-advist-error'
                            : concern.severity === 'warning'
                              ? 'text-advist-gold-dark'
                              : 'text-advist-gray900'
                        }`}
                      >
                        {concern.title}
                      </p>
                      <p
                        className={`text-xs ${
                          concern.severity === 'critical'
                            ? 'text-advist-error/70'
                            : concern.severity === 'warning'
                              ? 'text-advist-gold-dark/70'
                              : 'text-advist-gray900/70'
                        }`}
                      >
                        {concern.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Benchmark Comparison */}
        <div className="bg-white p-6 rounded-xl border border-advist-border">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
            Comparaison sectorielle
          </h2>

          {report.benchmarkComparison.available ? (
            <>
              <div
                className={`p-4 rounded-lg mb-4 ${getStatusBgColor(report.benchmarkComparison.overallStatus || 'average')}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-advist-gray900">
                      {report.benchmarkComparison.statusMessage}
                    </p>
                    <p className="text-xs text-advist-gray900/60 mt-1">
                      {report.benchmarkComparison.sectorInfo?.name} •{' '}
                      {report.benchmarkComparison.sectorInfo?.sampleSize} organisations
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${getStatusColor(report.benchmarkComparison.overallStatus || 'average')}`}
                    >
                      {report.benchmarkComparison.overallPercentile}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {report.benchmarkComparison.comparisons?.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-advist-border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-advist-gray900">{comp.metric}</p>
                      <p className="text-xs text-advist-gray900/50">Moyenne: {comp.industryAvg}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-advist-gray900">{comp.yourValue}</p>
                      {comp.isTopPerformer && (
                        <span className="text-xs text-advist-success">Top performer ✅</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BarChart3 size={40} className="mx-auto mb-3 text-advist-gray900/30" />
              <p className="text-sm text-advist-gray900/70">
                Configurez votre secteur pour accéder aux benchmarks
              </p>
              <Link
                to="/user/settings"
                className="mt-2 inline-block text-sm text-advist-red hover:underline"
              >
                Configurer
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ROI Summary */}
      {report.roiSummary.available && (
        <div className="bg-white p-6 rounded-xl border border-advist-border">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-4">
            Retour sur investissement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-advist-gold-light rounded-lg text-center">
              <p className="text-3xl font-bold text-advist-gray900">
                {Math.round(report.roiSummary.totalHoursSaved || 0)}h
              </p>
              <p className="text-sm text-advist-gray900/70">Heures économisées</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-advist-success">
                {formatCurrency(report.roiSummary.totalCostSaved || 0, report.roiSummary.currency)}
              </p>
              <p className="text-sm text-advist-success/70">Économies totales</p>
            </div>
            <div className="p-4 bg-advist-surface-dark rounded-lg text-center">
              <p className="text-3xl font-bold text-advist-gray900">
                +{Math.round(report.roiSummary.efficiencyGainPct || 0)}%
              </p>
              <p className="text-sm text-advist-gray900/70">Gain d'efficacité</p>
            </div>
            <div className="p-4 bg-advist-surface-dark/50 rounded-lg">
              <p className="text-sm text-advist-gray900/70 leading-relaxed">
                {report.roiSummary.headline}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Items */}
      {report.actionItems.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-advist-border">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-advist-gold" />
            <h2 className="text-lg font-semibold text-advist-gray900">Actions recommandées</h2>
          </div>
          <div className="space-y-3">
            {report.actionItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  item.priority === 'high' || item.priority === 'critical'
                    ? 'border-advist-gold bg-advist-gold-light'
                    : 'border-advist-border bg-advist-surface-dark/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.priority === 'critical'
                            ? 'bg-advist-gold-light text-advist-error'
                            : item.priority === 'high'
                              ? 'bg-advist-gold-light text-advist-gold-dark'
                              : 'bg-advist-gold-light text-advist-gray900'
                        }`}
                      >
                        {item.priority === 'critical'
                          ? 'Critique'
                          : item.priority === 'high'
                            ? 'Important'
                            : 'Normal'}
                      </span>
                      <span className="text-xs text-advist-gray900/50">{item.category}</span>
                    </div>
                    <p className="font-medium text-advist-gray900">{item.title}</p>
                    <p className="text-sm text-advist-gray900/60 mt-1">{item.description}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-advist-gray900/30" />
                </div>
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs text-advist-gray900/70">
                    Impact attendu: <span className="font-medium">{item.impact}</span>
                  </p>
                  {item.adoptionRate && (
                    <p className="text-xs text-advist-gray900/50 mt-1">{item.adoptionRate}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveReportPage;
