/**
 * Stats Card Widget
 * Displays a key metric with optional trend indicator
 */
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, FileText, GitBranch, PenTool, CheckSquare } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface StatsCardWidgetProps {
  config: WidgetConfig;
}

interface StatsData {
  value: number;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
}

export const StatsCardWidget: React.FC<StatsCardWidgetProps> = ({ config }) => {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching based on metric type
    const fetchData = async () => {
      setLoading(true);
      // In production, fetch from API based on config.settings.metric
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockData: Record<string, StatsData> = {
        documents: {
          value: 127,
          label: 'Documents',
          trend: { value: 12, direction: 'up', period: 'vs dernier mois' },
        },
        workflows: {
          value: 8,
          label: 'Workflows actifs',
          trend: { value: 3, direction: 'up', period: 'vs semaine dernière' },
        },
        signatures: {
          value: 5,
          label: 'À signer',
          trend: { value: 2, direction: 'down', period: 'vs hier' },
        },
        pending_tasks: {
          value: 14,
          label: 'Tâches en attente',
          trend: { value: 0, direction: 'neutral', period: 'vs hier' },
        },
      };

      const metric = config.settings.metric || 'documents';
      setData(mockData[metric] || mockData.documents);
      setLoading(false);
    };

    fetchData();
  }, [config.settings.metric]);

  const getIcon = () => {
    const metric = config.settings.metric || 'documents';
    const icons: Record<string, React.ReactNode> = {
      documents: <FileText size={20} />,
      workflows: <GitBranch size={20} />,
      signatures: <PenTool size={20} />,
      pending_tasks: <CheckSquare size={20} />,
    };
    return icons[metric] || <FileText size={20} />;
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp size={14} className="text-advist-success" />;
    if (direction === 'down') return <TrendingDown size={14} className="text-advist-error" />;
    return <Minus size={14} className="text-advist-gray400" />;
  };

  const getTrendColor = (direction: string) => {
    if (direction === 'up') return 'text-advist-success';
    if (direction === 'down') return 'text-advist-error';
    return 'text-advist-gray500';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-16 bg-advist-gray100 rounded mb-2"></div>
          <div className="h-4 w-24 bg-advist-gray100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-advist-gray900">{data.value}</p>
          <p className="text-sm text-advist-gray500 mt-1">{data.label}</p>
        </div>
        <div className="w-10 h-10 bg-advist-gold-light rounded-xl flex items-center justify-center text-advist-gray900">
          {getIcon()}
        </div>
      </div>

      {config.settings.showTrend && data.trend && (
        <div className="flex items-center gap-1.5 mt-3">
          {getTrendIcon(data.trend.direction)}
          <span className={`text-sm font-medium ${getTrendColor(data.trend.direction)}`}>
            {data.trend.direction !== 'neutral' && (data.trend.direction === 'up' ? '+' : '-')}
            {data.trend.value}%
          </span>
          <span className="text-xs text-advist-gray400">{data.trend.period}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCardWidget;
