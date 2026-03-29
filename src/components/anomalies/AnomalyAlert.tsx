import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  PenTool,
  FileText,
  Shield,
  Activity,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  Anomaly,
  AnomalySeverity,
  AnomalyCategory,
  anomalyDetectionService,
  getSeverityLabel,
  getCategoryLabel,
} from '../../services/anomalyDetection';

interface AnomalyAlertProps {
  anomalies: Anomaly[];
  onResolve?: (anomalyId: string) => void;
  onDismiss?: (anomalyId: string) => void;
  compact?: boolean;
  showResolveActions?: boolean;
}

const SEVERITY_CONFIG: Record<AnomalySeverity, {
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  info: {
    icon: <Info size={18} />,
    bgColor: 'bg-advist-gold-light',
    textColor: 'text-advist-gray900',
    borderColor: 'border-advist-gold',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bgColor: 'bg-advist-gold-light',
    textColor: 'text-advist-gold-dark',
    borderColor: 'border-advist-gold',
  },
  error: {
    icon: <AlertCircle size={18} />,
    bgColor: 'bg-advist-gold-light',
    textColor: 'text-advist-error',
    borderColor: 'border-advist-gold',
  },
  critical: {
    icon: <XCircle size={18} />,
    bgColor: 'bg-advist-surface-dark',
    textColor: 'text-advist-gray900',
    borderColor: 'border-advist-dark',
  },
};

const CATEGORY_ICONS: Record<AnomalyCategory, React.ReactNode> = {
  date: <Calendar size={14} />,
  amount: <DollarSign size={14} />,
  signature: <PenTool size={14} />,
  metadata: <FileText size={14} />,
  content: <FileText size={14} />,
  compliance: <Shield size={14} />,
  behavior: <Activity size={14} />,
};

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({
  anomalies,
  onResolve,
  onDismiss,
  compact = false,
  showResolveActions = true,
}) => {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const [dismissReason, setDismissReason] = useState<Record<string, string>>({});

  // Filter out resolved anomalies
  const activeAnomalies = anomalies.filter(a => !a.resolved);

  if (activeAnomalies.length === 0) {
    return null;
  }

  // Group anomalies by severity for summary
  const bySeverity = activeAnomalies.reduce((acc, anomaly) => {
    acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
    return acc;
  }, {} as Record<AnomalySeverity, number>);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleResolve = async (anomalyId: string) => {
    setResolvingIds(prev => new Set(prev).add(anomalyId));
    try {
      await anomalyDetectionService.resolveAnomaly(anomalyId);
      onResolve?.(anomalyId);
    } catch (err) {
      console.error('Failed to resolve anomaly:', err);
    } finally {
      setResolvingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(anomalyId);
        return newSet;
      });
    }
  };

  const handleDismiss = async (anomalyId: string) => {
    const reason = dismissReason[anomalyId];
    if (!reason) return;

    setDismissingIds(prev => new Set(prev).add(anomalyId));
    try {
      await anomalyDetectionService.dismissAnomaly(anomalyId, reason);
      onDismiss?.(anomalyId);
    } catch (err) {
      console.error('Failed to dismiss anomaly:', err);
    } finally {
      setDismissingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(anomalyId);
        return newSet;
      });
    }
  };

  // Compact view - just a summary banner
  if (compact) {
    const highestSeverity = bySeverity.critical ? 'critical' :
      bySeverity.error ? 'error' :
      bySeverity.warning ? 'warning' : 'info';

    const config = SEVERITY_CONFIG[highestSeverity];

    return (
      <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
        <span className={config.textColor}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.textColor}`}>
          {activeAnomalies.length} anomalie{activeAnomalies.length > 1 ? 's' : ''} détectée{activeAnomalies.length > 1 ? 's' : ''}
        </span>
        <div className="flex gap-2 ml-auto">
          {bySeverity.critical && (
            <span className="px-2 py-0.5 bg-advist-surface-dark text-advist-gray900 rounded-full text-xs">
              {bySeverity.critical} critique{bySeverity.critical > 1 ? 's' : ''}
            </span>
          )}
          {bySeverity.error && (
            <span className="px-2 py-0.5 bg-advist-gold-light text-advist-error rounded-full text-xs">
              {bySeverity.error} erreur{bySeverity.error > 1 ? 's' : ''}
            </span>
          )}
          {bySeverity.warning && (
            <span className="px-2 py-0.5 bg-advist-gold-light text-advist-gold-dark rounded-full text-xs">
              {bySeverity.warning} avertissement{bySeverity.warning > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full view - expandable list
  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-advist-gold-dark" />
          <div>
            <h3 className="font-medium text-advist-gray900">
              {activeAnomalies.length} anomalie{activeAnomalies.length > 1 ? 's' : ''} détectée{activeAnomalies.length > 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-advist-blue-light">
              Vérifiez ces éléments avant de continuer
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['critical', 'error', 'warning', 'info'] as AnomalySeverity[]).map(severity => {
            const count = bySeverity[severity];
            if (!count) return null;
            const config = SEVERITY_CONFIG[severity];
            return (
              <span
                key={severity}
                className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bgColor} ${config.textColor}`}
              >
                {count} {getSeverityLabel(severity).toLowerCase()}
              </span>
            );
          })}
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-2">
        {activeAnomalies.map((anomaly) => {
          const config = SEVERITY_CONFIG[anomaly.severity];
          const isExpanded = expandedIds.has(anomaly.id);
          const isResolving = resolvingIds.has(anomaly.id);
          const isDismissing = dismissingIds.has(anomaly.id);

          return (
            <div
              key={anomaly.id}
              className={`rounded-xl border ${config.borderColor} overflow-hidden`}
            >
              {/* Header */}
              <button
                onClick={() => toggleExpanded(anomaly.id)}
                className={`w-full flex items-center gap-3 p-4 ${config.bgColor} text-left`}
              >
                <span className={config.textColor}>{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${config.textColor}`}>
                      {anomaly.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                      {CATEGORY_ICONS[anomaly.category]}
                      <span className="ml-1">{getCategoryLabel(anomaly.category)}</span>
                    </span>
                  </div>
                  <p className={`text-sm ${config.textColor} opacity-80 truncate`}>
                    {anomaly.description}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={18} className={config.textColor} />
                ) : (
                  <ChevronDown size={18} className={config.textColor} />
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 bg-white space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    {anomaly.field && (
                      <div>
                        <p className="text-xs text-advist-blue-light">Champ concerné</p>
                        <p className="text-sm font-medium text-advist-gray900">{anomaly.field}</p>
                      </div>
                    )}
                    {anomaly.expectedValue && (
                      <div>
                        <p className="text-xs text-advist-blue-light">Valeur attendue</p>
                        <p className="text-sm font-medium text-advist-success">{anomaly.expectedValue}</p>
                      </div>
                    )}
                    {anomaly.actualValue && (
                      <div>
                        <p className="text-xs text-advist-blue-light">Valeur actuelle</p>
                        <p className="text-sm font-medium text-advist-error">{anomaly.actualValue}</p>
                      </div>
                    )}
                  </div>

                  {/* Suggestion */}
                  {anomaly.suggestion && (
                    <div className="p-3 bg-advist-gold-light border border-advist-gold rounded-lg">
                      <p className="text-xs text-advist-gray900 font-medium mb-1">Suggestion</p>
                      <p className="text-sm text-advist-gray900">{anomaly.suggestion}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {showResolveActions && (
                    <div className="flex gap-3 pt-3 border-t border-advist-border">
                      <Button
                        size="sm"
                        onClick={() => handleResolve(anomaly.id)}
                        disabled={isResolving || isDismissing}
                        className="flex-1"
                      >
                        {isResolving ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Check size={14} className="mr-1" />
                        )}
                        Marquer comme résolu
                      </Button>

                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Raison du rejet..."
                          value={dismissReason[anomaly.id] || ''}
                          onChange={(e) => setDismissReason(prev => ({
                            ...prev,
                            [anomaly.id]: e.target.value,
                          }))}
                          className="flex-1 px-3 py-1 text-sm bg-advist-bg border border-advist-border rounded-lg focus:outline-none focus:ring-2 focus:ring-advist-blue-light/30"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismiss(anomaly.id)}
                          disabled={isDismissing || isResolving || !dismissReason[anomaly.id]}
                        >
                          {isDismissing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <X size={14} />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyAlert;
