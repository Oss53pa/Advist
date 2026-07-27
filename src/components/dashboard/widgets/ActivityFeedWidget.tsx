/**
 * Activity Feed Widget
 */
import React, { useState, useEffect } from 'react';
import { FileText, GitBranch, PenTool, Eye, Upload, CheckCircle, User } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface ActivityFeedWidgetProps {
  config: WidgetConfig;
}

interface ActivityItem {
  id: number;
  type: 'upload' | 'view' | 'sign' | 'approve' | 'workflow' | 'comment';
  user: string;
  userAvatar?: string;
  action: string;
  target: string;
  time: string;
}

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({ config }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const mockActivities: ActivityItem[] = [
        {
          id: 1,
          type: 'sign',
          user: 'Marie Dupont',
          action: 'a signé',
          target: 'Contrat Q4',
          time: '2 min',
        },
        {
          id: 2,
          type: 'view',
          user: 'Pierre Martin',
          action: 'a consulté',
          target: 'Budget 2025',
          time: '15 min',
        },
        {
          id: 3,
          type: 'workflow',
          user: 'Sophie Bernard',
          action: 'a démarré',
          target: 'Workflow validation',
          time: '30 min',
        },
        {
          id: 4,
          type: 'upload',
          user: 'Jean Koné',
          action: 'a importé',
          target: 'Facture 1234',
          time: '1h',
        },
        {
          id: 5,
          type: 'approve',
          user: 'Aminata Touré',
          action: 'a approuvé',
          target: 'Rapport financier',
          time: '2h',
        },
        {
          id: 6,
          type: 'comment',
          user: 'Paul Diallo',
          action: 'a commenté',
          target: 'Contrat fournisseur',
          time: '3h',
        },
        {
          id: 7,
          type: 'sign',
          user: 'Marie Dupont',
          action: 'a signé',
          target: 'Avenant n°2',
          time: '4h',
        },
        {
          id: 8,
          type: 'upload',
          user: 'Pierre Martin',
          action: 'a importé',
          target: 'Note interne',
          time: '5h',
        },
      ];

      const limit = config.settings.limit || 10;
      setActivities(mockActivities.slice(0, limit));
      setLoading(false);
    };

    fetchData();
  }, [config]);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      upload: <Upload size={14} className="text-advist-gray900" />,
      view: <Eye size={14} className="text-advist-text-secondary" />,
      sign: <PenTool size={14} className="text-advist-gold-dark" />,
      approve: <CheckCircle size={14} className="text-advist-success" />,
      workflow: <GitBranch size={14} className="text-advist-gold" />,
      comment: <FileText size={14} className="text-advist-gray900" />,
    };
    return icons[type] || <FileText size={14} className="text-advist-text-secondary" />;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-advist-surface-dark rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 w-3/4 bg-advist-surface-dark rounded"></div>
              <div className="h-2 w-1/4 bg-advist-surface-dark rounded mt-1"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 group">
          <div className="w-8 h-8 bg-advist-surface-dark rounded-full flex items-center justify-center flex-shrink-0">
            {activity.userAvatar ? (
              <img
                src={activity.userAvatar}
                alt={activity.user}
                className="w-full h-full rounded-full"
              />
            ) : (
              <User size={14} className="text-advist-text-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-advist-gray900">
              <span className="font-medium">{activity.user}</span>
              <span className="mx-1 text-advist-text-secondary">{activity.action}</span>
              <span className="font-medium truncate">{activity.target}</span>
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {getActivityIcon(activity.type)}
              <span className="text-xs text-advist-text-muted">{activity.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeedWidget;
