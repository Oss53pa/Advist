/**
 * Pending Tasks Widget
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface PendingTasksWidgetProps {
  config: WidgetConfig;
}

interface TaskItem {
  id: number;
  title: string;
  documentTitle: string;
  type: 'approval' | 'signature' | 'review';
  deadline: string;
  isUrgent: boolean;
}

export const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({ config }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const mockTasks: TaskItem[] = [
        {
          id: 1,
          title: 'Approbation requise',
          documentTitle: 'Contrat Q4',
          type: 'approval',
          deadline: '29 Nov',
          isUrgent: true,
        },
        {
          id: 2,
          title: 'Signature requise',
          documentTitle: 'Budget 2025',
          type: 'signature',
          deadline: '30 Nov',
          isUrgent: false,
        },
        {
          id: 3,
          title: 'Revue demandée',
          documentTitle: 'Rapport annuel',
          type: 'review',
          deadline: '5 Déc',
          isUrgent: false,
        },
        {
          id: 4,
          title: 'Approbation requise',
          documentTitle: 'Facture 1234',
          type: 'approval',
          deadline: '7 Déc',
          isUrgent: false,
        },
        {
          id: 5,
          title: 'Signature requise',
          documentTitle: 'Avenant contrat',
          type: 'signature',
          deadline: '10 Déc',
          isUrgent: false,
        },
      ];

      const limit = config.settings.limit || 5;
      setTasks(mockTasks.slice(0, limit));
      setLoading(false);
    };

    fetchData();
  }, [config]);

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      approval: { bg: 'bg-advist-gold-light', text: 'text-advist-gold-dark', label: 'Approbation' },
      signature: { bg: 'bg-advist-dark', text: 'text-white', label: 'Signature' },
      review: { bg: 'bg-advist-surface-dark', text: 'text-advist-gray900', label: 'Revue' },
    };
    return badges[type] || badges.approval;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-3 border border-advist-border rounded-lg">
            <div className="h-4 w-3/4 bg-advist-surface-dark rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-advist-surface-dark rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const badge = getTypeBadge(task.type);
        return (
          <Link
            key={task.id}
            to={`/user/workflows/${task.id}`}
            className={`block p-3 rounded-lg border transition-all hover:shadow-sm ${
              task.isUrgent
                ? 'border-advist-gold bg-advist-gold-light/50 hover:border-advist-gold-dark'
                : 'border-advist-border hover:border-advist-gold'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {task.isUrgent && <AlertCircle size={14} className="text-advist-gold-dark" />}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm font-medium text-advist-gray900">{task.documentTitle}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-advist-text-secondary">
                <Clock size={12} />
                {task.deadline}
              </div>
            </div>
          </Link>
        );
      })}
      <Link
        to="/user/workflows"
        className="flex items-center justify-center gap-1 pt-2 text-sm text-advist-text-secondary hover:text-advist-gold-dark"
      >
        Voir toutes les tâches <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default PendingTasksWidget;
