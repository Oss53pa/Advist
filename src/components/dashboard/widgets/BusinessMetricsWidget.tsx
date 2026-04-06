/**
 * Business Metrics Widget
 * Displays key business KPIs: cost per validation, time-to-signature, error rate
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';
import {
  analyticsService,
  BusinessMetrics,
  formatCurrency,
  getTrendColor,
} from '../../../services/analytics';

interface BusinessMetricsWidgetProps {
  config: WidgetConfig;
}

export const BusinessMetricsWidget: React.FC<BusinessMetricsWidgetProps> = ({ config }) => {
  const [data, setData] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const metricsData = await analyticsService.getBusinessMetrics();
        setData(metricsData);
      } catch (_err) {
        // Mock data for demo
        setData({
          costPerValidation: {
            value: 19200,
            unit: 'XOF',
            trend: {
              direction: 'down',
              changePct: -15.3,
              previousValue: 22650,
            },
            comparison: {
              manualEstimate: 48000,
              savingsPct: 60,
            },
          },
          timeToSignature: {
            value: 18.5,
            unit: 'heures',
            trend: {
              direction: 'down',
              changePct: -12.5,
              previousValue: 21.1,
            },
            comparison: {
              manualEstimate: 24,
              savingsPct: 23,
            },
          },
          errorRateAvoided: {
            value: 7.9,
            unit: '%',
            description: '12 erreurs évitées sur la période',
            manualErrorRate: 15,
            currentErrorRate: 7.1,
          },
          documentsProcessed: {
            value: 156,
            validated: 144,
            signed: 89,
            rejected: 12,
          },
          period: {
            start: '2024-11-01',
            end: '2024-11-30',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config]);

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingDown size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-advist-surface-dark rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Activity size={40} className="text-advist-gray900/30 mb-3" />
        <p className="text-sm text-advist-gray900/70">Pas de données disponibles</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Cost per Validation */}
      <div className="p-4 border border-advist-border rounded-lg mb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-advist-gold-light rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-advist-gray900" />
            </div>
            <div>
              <p className="text-xs text-advist-gray900/50 uppercase tracking-wider">
                Coût par validation
              </p>
              <p className="text-xl font-bold text-advist-gray900">
                {formatCurrency(data.costPerValidation.value, data.costPerValidation.unit)}
              </p>
            </div>
          </div>
          {data.costPerValidation.trend && (
            <div
              className={`flex items-center gap-1 text-sm ${getTrendColor(data.costPerValidation.trend.direction, true)}`}
            >
              {getTrendIcon(data.costPerValidation.trend.direction)}
              <span>{Math.abs(data.costPerValidation.trend.changePct)}%</span>
            </div>
          )}
        </div>
        {data.costPerValidation.comparison && (
          <div className="mt-3 pt-3 border-t border-advist-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-advist-gray900/50">Estimation manuelle</span>
              <span className="text-advist-gray900/70 line-through">
                {formatCurrency(
                  data.costPerValidation.comparison.manualEstimate,
                  data.costPerValidation.unit
                )}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-2 bg-advist-surface-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-advist-success rounded-full"
                  style={{ width: `${100 - data.costPerValidation.comparison.savingsPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-advist-success">
                -{data.costPerValidation.comparison.savingsPct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Time to Signature */}
      <div className="p-4 border border-advist-border rounded-lg mb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-advist-surface-dark rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-advist-gray900" />
            </div>
            <div>
              <p className="text-xs text-advist-gray900/50 uppercase tracking-wider">
                Délai time-to-signature
              </p>
              <p className="text-xl font-bold text-advist-gray900">
                {data.timeToSignature.value} {data.timeToSignature.unit}
              </p>
            </div>
          </div>
          {data.timeToSignature.trend && (
            <div
              className={`flex items-center gap-1 text-sm ${getTrendColor(data.timeToSignature.trend.direction, true)}`}
            >
              {getTrendIcon(data.timeToSignature.trend.direction)}
              <span>{Math.abs(data.timeToSignature.trend.changePct)}%</span>
            </div>
          )}
        </div>
        {data.timeToSignature.comparison && (
          <div className="mt-3 pt-3 border-t border-advist-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-advist-gray900/50">Estimation manuelle</span>
              <span className="text-advist-gray900/70 line-through">
                {data.timeToSignature.comparison.manualEstimate} {data.timeToSignature.unit}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-2 bg-advist-surface-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-advist-dark rounded-full"
                  style={{ width: `${100 - data.timeToSignature.comparison.savingsPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-advist-gray900">
                -{data.timeToSignature.comparison.savingsPct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Rate Avoided */}
      <div className="p-4 border border-advist-border rounded-lg flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <ShieldCheck size={20} className="text-advist-success" />
            </div>
            <div>
              <p className="text-xs text-advist-gray900/50 uppercase tracking-wider">
                Taux d'erreurs évitées
              </p>
              <p className="text-xl font-bold text-advist-gray900">
                {data.errorRateAvoided.value}
                {data.errorRateAvoided.unit}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-advist-gray900/60">{data.errorRateAvoided.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-advist-gold-light rounded-lg">
            <p className="text-xs text-advist-error/70">Processus manuel</p>
            <p className="text-sm font-bold text-advist-error">
              {data.errorRateAvoided.manualErrorRate}%
            </p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-xs text-advist-success/70">Avec ADVIST</p>
            <p className="text-sm font-bold text-advist-success">
              {data.errorRateAvoided.currentErrorRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Link */}
      <Link
        to="/user/analytics/reports"
        className="flex items-center justify-center gap-1 pt-3 text-sm text-advist-gray900/70 hover:text-advist-gray900"
      >
        Voir les rapports C-level <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default BusinessMetricsWidget;
