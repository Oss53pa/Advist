/**
 * Workflow Status Widget
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface WorkflowStatusWidgetProps {
  config: WidgetConfig;
}

interface WorkflowStats {
  total: number;
  byStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    rejected: number;
  };
  recent: {
    id: number;
    documentTitle: string;
    status: string;
    currentStep: string;
    progress: number;
  }[];
}

export const WorkflowStatusWidget: React.FC<WorkflowStatusWidgetProps> = ({ config }) => {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const mockStats: WorkflowStats = {
        total: 24,
        byStatus: {
          pending: 5,
          in_progress: 8,
          completed: 9,
          rejected: 2,
        },
        recent: [
          {
            id: 1,
            documentTitle: 'Contrat Q4',
            status: 'in_progress',
            currentStep: 'Approbation DG',
            progress: 66,
          },
          {
            id: 2,
            documentTitle: 'Budget 2025',
            status: 'pending',
            currentStep: 'Revue finance',
            progress: 33,
          },
          {
            id: 3,
            documentTitle: 'Rapport annuel',
            status: 'in_progress',
            currentStep: 'Signature',
            progress: 80,
          },
        ],
      };

      setStats(mockStats);
      setLoading(false);
    };

    fetchData();
  }, [config]);

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { icon: React.ReactNode; color: string; bg: string; label: string }
    > = {
      pending: {
        icon: <Clock size={14} />,
        color: 'text-advist-accent',
        bg: 'bg-advist-gold',
        label: 'En attente',
      },
      in_progress: {
        icon: <Loader size={14} />,
        color: 'text-advist-gray900',
        bg: 'bg-advist-dark',
        label: 'En cours',
      },
      completed: {
        icon: <CheckCircle size={14} />,
        color: 'text-advist-success',
        bg: 'bg-advist-success',
        label: 'Terminés',
      },
      rejected: {
        icon: <XCircle size={14} />,
        color: 'text-advist-error',
        bg: 'bg-advist-error',
        label: 'Rejetés',
      },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="animate-pulse grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-advist-surface-dark rounded"></div>
          ))}
        </div>
        <div className="animate-pulse space-y-2 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-advist-surface-dark rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Status summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {Object.entries(stats.byStatus).map(([status, count]) => {
          const config = getStatusConfig(status);
          return (
            <div key={status} className="text-center p-2 rounded-lg bg-advist-surface-dark/30">
              <div className={`${config.color} flex justify-center mb-1`}>{config.icon}</div>
              <p className="text-lg font-bold text-advist-gray900">{count}</p>
              <p className="text-xs text-advist-gray900/50 truncate">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent workflows */}
      <div className="flex-1 space-y-2">
        <p className="text-xs font-medium text-advist-gray900/50 uppercase tracking-wider">
          En cours
        </p>
        {stats.recent.map((workflow) => {
          const config = getStatusConfig(workflow.status);
          return (
            <Link
              key={workflow.id}
              to={`/user/workflows/${workflow.id}`}
              className="block p-2 rounded-lg border border-advist-border hover:border-advist-dark transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-advist-gray900 truncate">
                  {workflow.documentTitle}
                </p>
                <span className={`text-xs ${config.color}`}>{workflow.progress}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-advist-surface-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.bg} transition-all`}
                    style={{ width: `${workflow.progress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-advist-gray900/50 mt-1">{workflow.currentStep}</p>
            </Link>
          );
        })}
      </div>

      <Link
        to="/user/workflows"
        className="flex items-center justify-center gap-1 pt-2 text-sm text-advist-gray900/70 hover:text-advist-gray900"
      >
        Voir tous les workflows <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default WorkflowStatusWidget;
