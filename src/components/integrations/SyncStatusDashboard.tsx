/**
 * Sync Status Dashboard Component
 * Displays synchronization status and logs for all integrations
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Clock,
  RefreshCw,
  FileText,
  _ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useIntegrationStore } from '../../stores';

interface SyncStatusDashboardProps {
  connectionId?: string;
}

export const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({ connectionId }) => {
  const { t } = useTranslation();
  const { syncLogs, connections, isLoading, fetchSyncLogs, fetchConnections } =
    useIntegrationStore();

  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchSyncLogs(connectionId);
    if (!connectionId) {
      fetchConnections();
    }
  }, [connectionId, fetchSyncLogs, fetchConnections]);

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const filteredLogs = syncLogs.filter((log) => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check size={16} className="text-green-500" />;
      case 'failed':
        return <X size={16} className="text-red-500" />;
      case 'in_progress':
        return <Loader2 size={16} className="animate-spin text-blue-500" />;
      case 'partial':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('integrations.sync.completed', 'Termine')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('integrations.sync.failed', 'Echoue')}</Badge>;
      case 'in_progress':
        return <Badge variant="warning">{t('integrations.sync.inProgress', 'En cours')}</Badge>;
      case 'partial':
        return <Badge variant="warning">{t('integrations.sync.partial', 'Partiel')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getConnectionName = (connId: string) => {
    const conn = connections.find((c) => c.id === connId);
    return conn?.name || connId;
  };

  // Calculate stats
  const stats = {
    total: syncLogs.length,
    completed: syncLogs.filter((l) => l.status === 'completed').length,
    failed: syncLogs.filter((l) => l.status === 'failed').length,
    inProgress: syncLogs.filter((l) => l.status === 'in_progress').length,
    totalRecords: syncLogs.reduce((sum, l) => sum + (l.records_processed || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.total}</p>
              <p className="text-sm text-advist-gray900/60">
                {t('integrations.sync.totalSyncs', 'Syncs totales')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.completed}</p>
              <p className="text-sm text-advist-gray900/60">
                {t('integrations.sync.successful', 'Reussies')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.failed}</p>
              <p className="text-sm text-advist-gray900/60">
                {t('integrations.sync.failed', 'Echouees')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.totalRecords}</p>
              <p className="text-sm text-advist-gray900/60">
                {t('integrations.sync.recordsProcessed', 'Enregistrements')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-advist-gray900/60" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-advist-gray200 rounded-lg text-sm focus:ring-2 focus:ring-advist-primary focus:border-advist-primary"
          >
            <option value="all">{t('integrations.sync.filterAll', 'Tous les statuts')}</option>
            <option value="completed">{t('integrations.sync.filterCompleted', 'Termines')}</option>
            <option value="failed">{t('integrations.sync.filterFailed', 'Echoues')}</option>
            <option value="in_progress">
              {t('integrations.sync.filterInProgress', 'En cours')}
            </option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSyncLogs(connectionId)}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Actualiser')}
        </Button>
      </div>

      {/* Sync Logs Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-advist-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-advist-gray900/60">
            <Activity size={48} className="mb-4 opacity-50" />
            <p>{t('integrations.sync.noLogs', 'Aucun log de synchronisation')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-advist-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-gray900/60 uppercase tracking-wider">
                    {t('integrations.sync.status', 'Statut')}
                  </th>
                  {!connectionId && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-advist-gray900/60 uppercase tracking-wider">
                      {t('integrations.sync.connection', 'Connexion')}
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-gray900/60 uppercase tracking-wider">
                    {t('integrations.sync.type', 'Type')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-gray900/60 uppercase tracking-wider">
                    {t('integrations.sync.records', 'Enregistrements')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-gray900/60 uppercase tracking-wider">
                    {t('integrations.sync.duration', 'Duree')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-gray900/60 uppercase tracking-wider">
                    {t('integrations.sync.startedAt', 'Debut')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-gray900/60 uppercase tracking-wider">
                    {t('integrations.sync.details', 'Details')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-advist-gray200">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-advist-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </td>
                      {!connectionId && (
                        <td className="px-4 py-3 text-sm text-advist-gray900">
                          {getConnectionName(log.connection_id)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-advist-gray900 capitalize">
                        {log.sync_type}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">{log.records_created || 0} created</span>
                          <span className="text-blue-600">{log.records_updated || 0} updated</span>
                          {(log.records_failed || 0) > 0 && (
                            <span className="text-red-600">{log.records_failed} failed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-advist-gray900">
                        {log.duration_seconds ? `${log.duration_seconds}s` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-advist-gray900/70">
                        {new Date(log.started_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => toggleLogExpanded(log.id)}>
                          {expandedLogs.has(log.id) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </Button>
                      </td>
                    </tr>
                    {expandedLogs.has(log.id) && (
                      <tr className="bg-advist-bg/30">
                        <td colSpan={connectionId ? 6 : 7} className="px-4 py-4">
                          <div className="space-y-3">
                            {log.error_message && (
                              <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-sm font-medium text-red-700 mb-1">
                                  {t('integrations.sync.errorMessage', "Message d'erreur")}:
                                </p>
                                <p className="text-sm text-red-600">{log.error_message}</p>
                              </div>
                            )}
                            {log.errors && log.errors.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-advist-gray900 mb-2">
                                  {t('integrations.sync.errors', 'Erreurs')} ({log.errors.length}):
                                </p>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {log.errors.map((error, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-red-50 rounded text-xs text-red-600"
                                    >
                                      {typeof error === 'string' ? error : JSON.stringify(error)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {log.details && (
                              <div>
                                <p className="text-sm font-medium text-advist-gray900 mb-2">
                                  {t('integrations.sync.details', 'Details')}:
                                </p>
                                <pre className="p-3 bg-advist-gray100 rounded-lg text-xs overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SyncStatusDashboard;
