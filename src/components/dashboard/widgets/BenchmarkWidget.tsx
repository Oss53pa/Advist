/**
 * Benchmark Comparison Widget
 * Shows organization performance vs industry benchmarks
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';
import {
  analyticsService,
  BenchmarkData,
  getStatusColor,
  getStatusBgColor,
  getPercentileLabel,
} from '../../../services/analytics';

interface BenchmarkWidgetProps {
  config: WidgetConfig;
}

export const BenchmarkWidget: React.FC<BenchmarkWidgetProps> = ({ config }) => {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const benchmarkData = await analyticsService.getBenchmarkComparison();
        setData(benchmarkData);
      } catch (err) {
        // Mock data for demo
        setData({
          organizationMetrics: {
            documentsValidated: 156,
            documentsSigned: 89,
            documentsRejected: 12,
            avgValidationTimeDays: 5.2,
            avgSignatureTimeHours: 18.5,
            rejectionRate: 7.1,
            hoursSaved: 234,
            costSaved: 1400000,
          },
          benchmark: {
            sector: 'Services Financiers',
            sizeCategory: 'medium',
            sampleSize: 48,
            avgValidationTimeDays: 7.8,
            medianValidationTimeDays: 7.2,
            avgSignatureTimeHours: 24,
            avgRejectionRate: 12.5,
            top10ValidationTime: 3.2,
          },
          comparison: {
            validationTime: {
              yourValue: 5.2,
              industryAverage: 7.8,
              percentile: 85,
              status: 'excellent',
              isTopPerformer: true,
              message: 'Vous êtes dans le top 15% ✅',
            },
            signatureTime: {
              yourValue: 18.5,
              industryAverage: 24,
              percentile: 72,
              status: 'good',
            },
            rejectionRate: {
              yourValue: 7.1,
              industryAverage: 12.5,
              percentile: 78,
              status: 'good',
            },
          },
          overallStatus: 'above',
          overallPercentile: 78,
          statusMessage: 'Performance au-dessus de la moyenne (78e percentile)',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config]);

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4 animate-pulse">
        <div className="h-20 bg-advist-surface-dark rounded-lg"></div>
        <div className="flex-1 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-advist-surface-dark rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.benchmark) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Info size={40} className="text-advist-gray900/30 mb-3" />
        <p className="text-sm text-advist-gray900/70">
          Configurez votre secteur d'activité pour accéder aux benchmarks
        </p>
        <Link
          to="/user/settings"
          className="mt-3 text-sm text-advist-red hover:underline"
        >
          Configurer maintenant
        </Link>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status === 'excellent' || status === 'good') {
      return <CheckCircle size={16} className="text-advist-success" />;
    }
    if (status === 'below' || status === 'poor') {
      return <AlertCircle size={16} className="text-advist-gold-dark" />;
    }
    return <Info size={16} className="text-advist-text-secondary" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg mb-4 ${getStatusBgColor(data.overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.overallPercentile >= 75 ? (
              <Award size={24} className="text-advist-gold" />
            ) : (
              <BarChart3 size={24} className={getStatusColor(data.overallStatus)} />
            )}
            <div>
              <p className="font-semibold text-advist-gray900">
                {getPercentileLabel(data.overallPercentile)}
              </p>
              <p className="text-xs text-advist-gray900/60">
                {data.benchmark.sector} • {data.benchmark.sampleSize} organisations
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${getStatusColor(data.overallStatus)}`}>
              {data.overallPercentile}%
            </p>
            <p className="text-xs text-advist-gray900/50">percentile</p>
          </div>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="flex-1 space-y-3">
        {/* Validation Time */}
        <div className="p-3 border border-advist-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-advist-gray900">
              Temps de validation
            </span>
            {getStatusIcon(data.comparison!.validationTime.status)}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-advist-gray900">
                {data.comparison!.validationTime.yourValue} jours
              </p>
              <p className="text-xs text-advist-gray900/50">
                Moyenne secteur: {data.comparison!.validationTime.industryAverage} jours
              </p>
            </div>
            {data.comparison!.validationTime.isTopPerformer && (
              <span className="px-2 py-1 bg-green-50 text-advist-success text-xs font-medium rounded-full">
                Top 15% ✅
              </span>
            )}
          </div>
          {data.comparison!.validationTime.message && (
            <p className="mt-2 text-xs text-advist-success font-medium">
              {data.comparison!.validationTime.message}
            </p>
          )}
        </div>

        {/* Signature Time */}
        <div className="p-3 border border-advist-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-advist-gray900">
              Temps de signature
            </span>
            {getStatusIcon(data.comparison!.signatureTime.status)}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-advist-gray900">
                {data.comparison!.signatureTime.yourValue}h
              </p>
              <p className="text-xs text-advist-gray900/50">
                Moyenne secteur: {data.comparison!.signatureTime.industryAverage}h
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-advist-success" />
              <span className="text-advist-success font-medium">
                -{Math.round((1 - data.comparison!.signatureTime.yourValue / data.comparison!.signatureTime.industryAverage) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Rejection Rate */}
        <div className="p-3 border border-advist-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-advist-gray900">
              Taux de rejet
            </span>
            {getStatusIcon(data.comparison!.rejectionRate.status)}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-advist-gray900">
                {data.comparison!.rejectionRate.yourValue}%
              </p>
              <p className="text-xs text-advist-gray900/50">
                Moyenne secteur: {data.comparison!.rejectionRate.industryAverage}%
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown size={14} className="text-advist-success" />
              <span className="text-advist-success font-medium">
                -{Math.round((1 - data.comparison!.rejectionRate.yourValue / data.comparison!.rejectionRate.industryAverage) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Link to full report */}
      <Link
        to="/user/analytics/benchmark"
        className="flex items-center justify-center gap-1 pt-3 text-sm text-advist-gray900/70 hover:text-advist-gray900"
      >
        Voir le rapport complet <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default BenchmarkWidget;
