/**
 * Stats Card Widget
 * Displays a key metric with optional trend indicator
 * Data fetched from Supabase counts
 */
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, FileText, GitBranch, PenTool, CheckSquare } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store';

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
  const { user } = useAuthStore();
  const orgId = user?.organization?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const metric = config.settings.metric || 'documents';

      if (!orgId) {
        setData({ value: 0, label: metric });
        setLoading(false);
        return;
      }

      try {
        let value = 0;
        let label = '';

        switch (metric) {
          case 'documents': {
            const { count } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', orgId)
              .is('deleted_at', null);
            value = count ?? 0;
            label = 'Documents';
            break;
          }
          case 'workflows': {
            const { count } = await supabase
              .from('workflow_instances')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', orgId)
              .eq('status', 'active');
            value = count ?? 0;
            label = 'Workflows actifs';
            break;
          }
          case 'signatures': {
            const { count } = await supabase
              .from('document_signatures')
              .select('*, documents!inner(organization_id)', { count: 'exact', head: true })
              .eq('documents.organization_id', orgId)
              .eq('status', 'pending');
            value = count ?? 0;
            label = 'À signer';
            break;
          }
          case 'pending_tasks': {
            const { count } = await supabase
              .from('workflow_assignees')
              .select('*, step:workflow_steps!inner(instance:workflow_instances!inner(organization_id))', { count: 'exact', head: true })
              .eq('step.instance.organization_id', orgId)
              .eq('status', 'pending');
            value = count ?? 0;
            label = 'Tâches en attente';
            break;
          }
          default: {
            value = 0;
            label = metric;
          }
        }

        setData({ value, label });
      } catch (err) {
        console.error('StatsCardWidget fetch error:', err);
        setData({ value: 0, label: metric });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config.settings.metric, orgId]);

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
