/**
 * Security Alerts Widget
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, AlertOctagon, Info, ArrowRight, MapPin, Clock } from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';

interface SecurityAlertsWidgetProps {
  config: WidgetConfig;
}

interface SecurityAlertItem {
  id: string;
  type: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  user?: string;
  location?: string;
  time: string;
}

export const SecurityAlertsWidget: React.FC<SecurityAlertsWidgetProps> = ({ config }) => {
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 400));

      const mockAlerts: SecurityAlertItem[] = [
        {
          id: '1',
          type: 'suspicious_validation',
          title: 'Validation suspecte',
          severity: 'high',
          user: 'user@example.com',
          time: '5 min',
        },
        {
          id: '2',
          type: 'unusual_location',
          title: 'Connexion inhabitulle',
          severity: 'medium',
          user: 'admin@example.com',
          location: 'Nigeria',
          time: '15 min',
        },
        {
          id: '3',
          type: 'bulk_approval',
          title: 'Approbations en masse',
          severity: 'critical',
          user: 'manager@example.com',
          time: '1h',
        },
        {
          id: '4',
          type: 'new_device',
          title: 'Nouvel appareil',
          severity: 'low',
          user: 'user2@example.com',
          time: '2h',
        },
      ];

      const severityFilter = config.settings.severityFilter || ['critical', 'high'];
      const limit = config.settings.limit || 5;

      const filtered = mockAlerts
        .filter(a => severityFilter.includes(a.severity))
        .slice(0, limit);

      setAlerts(filtered);
      setLoading(false);
    };

    fetchData();
  }, [config]);

  const getSeverityConfig = (severity: string) => {
    const configs: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
      critical: {
        icon: <AlertOctagon size={16} />,
        bg: 'bg-advist-surface-dark',
        border: 'border-advist-dark',
        text: 'text-advist-gray900',
      },
      high: {
        icon: <AlertTriangle size={16} />,
        bg: 'bg-advist-gold-light',
        border: 'border-advist-gold',
        text: 'text-advist-error',
      },
      medium: {
        icon: <AlertTriangle size={16} />,
        bg: 'bg-advist-gold-light',
        border: 'border-advist-gold',
        text: 'text-advist-gold-dark',
      },
      low: {
        icon: <Info size={16} />,
        bg: 'bg-advist-gold-light',
        border: 'border-advist-gold',
        text: 'text-advist-gray900',
      },
    };
    return configs[severity] || configs.low;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse p-3 border border-advist-border rounded-lg">
            <div className="h-4 w-3/4 bg-advist-surface-dark rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-advist-surface-dark rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-advist-gray900/50">
        <Shield size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Aucune alerte de sécurité</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const config = getSeverityConfig(alert.severity);
        return (
          <Link
            key={alert.id}
            to={`/admin/security/anomalies/${alert.id}`}
            className={`block p-3 rounded-lg border transition-all hover:shadow-sm ${config.bg} ${config.border}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${config.text}`}>{config.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-advist-gray900 text-sm">{alert.title}</p>
                {alert.user && (
                  <p className="text-xs text-advist-gray900/60 truncate">{alert.user}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {alert.location && (
                    <span className="flex items-center gap-1 text-xs text-advist-gray900/50">
                      <MapPin size={10} />
                      {alert.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-advist-gray900/50">
                    <Clock size={10} />
                    {alert.time}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.text} ${config.bg}`}>
                {alert.severity}
              </span>
            </div>
          </Link>
        );
      })}
      <Link
        to="/admin/security"
        className="flex items-center justify-center gap-1 pt-2 text-sm text-advist-gray900/70 hover:text-advist-gray900"
      >
        Voir toutes les alertes <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default SecurityAlertsWidget;
