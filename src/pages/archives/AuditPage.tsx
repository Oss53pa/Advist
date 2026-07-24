import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Search,
  Download,
  Eye,
  Calendar,
  User,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';
import { PrintButton } from '../../shared/PrintEngine';

interface AuditLog {
  id: string;
  action: string;
  action_type: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'share';
  resource_type: string;
  resource_id: string;
  resource_name: string;
  user_name: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: 'success' | 'failure' | 'warning';
  details?: Record<string, unknown>;
  changes?: { field: string; old_value: string; new_value: string }[];
}

const ACTION_TYPE_CONFIG = {
  create: { icon: UserPlus, color: 'green', label: 'Creation' },
  read: { icon: Eye, color: 'blue', label: 'Lecture' },
  update: { icon: Edit, color: 'yellow', label: 'Modification' },
  delete: { icon: Trash2, color: 'red', label: 'Suppression' },
  login: { icon: LogIn, color: 'blue', label: 'Connexion' },
  logout: { icon: LogOut, color: 'gray', label: 'Deconnexion' },
  export: { icon: Download, color: 'purple', label: 'Export' },
  share: { icon: RefreshCw, color: 'green', label: 'Partage' },
} as const;

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: 'green' as const, label: 'Succes' },
  failure: { icon: XCircle, color: 'red' as const, label: 'Echec' },
  warning: { icon: AlertTriangle, color: 'yellow' as const, label: 'Avertissement' },
};

export const AuditPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const orgId = user?.organization?.id;

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    const fetchAuditLogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select(
            `
            id,
            action,
            resource_type,
            resource_id,
            resource_name,
            details,
            ip_address,
            user_agent,
            created_at,
            user:user_id (
              id,
              first_name,
              last_name,
              email
            )
          `
          )
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Error fetching audit logs:', error);
          setAuditLogs([]);
          return;
        }

        const mapped: AuditLog[] = (data || []).map((row: any) => {
          const details = row.details || {};
          // The action column is the audit_action enum value (create, read, update, etc.)
          const actionType = row.action as AuditLog['action_type'];
          // Derive a human-readable label from action + resource
          const actionLabel = details.label || `${row.action} ${row.resource_type || ''}`.trim();
          // Derive status from details or default to success
          const status: AuditLog['status'] = details.status || 'success';

          const profile = row.user as any;
          const userName = profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
            : 'Utilisateur inconnu';
          const userEmail = profile?.email || '';

          return {
            id: row.id,
            action: actionLabel,
            action_type: actionType,
            resource_type: row.resource_type || '',
            resource_id: row.resource_id || '',
            resource_name: row.resource_name || '',
            user_name: userName,
            user_email: userEmail,
            ip_address: row.ip_address || '',
            user_agent: row.user_agent || '',
            timestamp: row.created_at,
            status,
            details: details,
            changes: details.changes || undefined,
          };
        });

        setAuditLogs(mapped);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setAuditLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditLogs();
  }, [orgId]);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActionType =
      selectedActionType === 'all' || log.action_type === selectedActionType;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesResource = selectedResource === 'all' || log.resource_type === selectedResource;
    const matchesDateStart =
      !dateRange.start || new Date(log.timestamp) >= new Date(dateRange.start);
    const matchesDateEnd =
      !dateRange.end || new Date(log.timestamp) <= new Date(`${dateRange.end}T23:59:59`);
    return (
      matchesSearch &&
      matchesActionType &&
      matchesStatus &&
      matchesResource &&
      matchesDateStart &&
      matchesDateEnd
    );
  });

  const stats = {
    total: auditLogs.length,
    success: auditLogs.filter((l) => l.status === 'success').length,
    failure: auditLogs.filter((l) => l.status === 'failure').length,
    warning: auditLogs.filter((l) => l.status === 'warning').length,
  };

  const resourceTypes = [...new Set(auditLogs.map((l) => l.resource_type).filter(Boolean))];

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('audit.title')}</h1>
          <p className="text-advist-gray900 mt-1">{t('audit.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton
            config={{
              title: "Piste d'audit",
              subtitle: 'Journal de traçabilité',
              appName: 'Advist',
            }}
          >
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date/Heure</th>
                    <th className="text-left py-2">Action</th>
                    <th className="text-left py-2">Utilisateur</th>
                    <th className="text-left py-2">Ressource</th>
                    <th className="text-left py-2">IP</th>
                    <th className="text-left py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="py-1">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                      <td className="py-1">{log.action}</td>
                      <td className="py-1">{log.user_name}</td>
                      <td className="py-1">{log.resource_name}</td>
                      <td className="py-1">{log.ip_address}</td>
                      <td className="py-1">{STATUS_CONFIG[log.status].label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PrintButton>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export certifié OHADA
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            {t('common.loading')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Shield} label={t('audit.allLogs')} value={stats.total} color="blue" />
        <StatsCard
          icon={CheckCircle}
          label={t('audit.status.success')}
          value={stats.success}
          color="green"
        />
        <StatsCard
          icon={XCircle}
          label={t('audit.status.failure')}
          value={stats.failure}
          color="red"
        />
        <StatsCard
          icon={AlertTriangle}
          label={t('audit.status.warning')}
          value={stats.warning}
          color="yellow"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light"
                />
                <input
                  type="text"
                  placeholder={t('audit.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-advist-bg rounded-xl text-advist-gray900 placeholder-advist-blue-light focus:outline-none focus:ring-2 focus:ring-advist-gold"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
              >
                <option value="all">{t('common.all')}</option>
                <option value="create">{t('audit.actionTypes.create')}</option>
                <option value="read">{t('audit.actionTypes.read')}</option>
                <option value="update">{t('audit.actionTypes.update')}</option>
                <option value="delete">{t('audit.actionTypes.delete')}</option>
                <option value="login">{t('audit.actionTypes.login')}</option>
                <option value="logout">{t('audit.actionTypes.logout')}</option>
                <option value="export">{t('audit.actionTypes.export')}</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
              >
                <option value="all">{t('users.allStatuses')}</option>
                <option value="success">{t('audit.status.success')}</option>
                <option value="failure">{t('audit.status.failure')}</option>
                <option value="warning">{t('audit.status.warning')}</option>
              </select>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
              >
                <option value="all">{t('common.all')}</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-advist-gray900">Periode:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
            />
            <span className="text-sm text-advist-gray900">a</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
            />
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      {isLoading ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-advist-gold mb-4" />
            <p className="text-advist-gray900">{t('common.loading')}</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-advist-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                    Date/Heure
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                    Ressource
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                    Adresse IP
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-advist-gray900">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-advist-gray900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-advist-bg">
                {filteredLogs.map((log) => (
                  <AuditLogRow key={log.id} log={log} onViewDetails={handleViewDetails} />
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Shield size={48} className="mx-auto text-advist-blue-light mb-4" />
              <h3 className="text-lg font-medium text-advist-gray900">{t('audit.noLogs')}</h3>
              <p className="text-advist-gray900 mt-1">{t('common.filter')}</p>
            </div>
          )}
        </Card>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <AuditDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
          log={selectedLog}
        />
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}> = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-advist-gold-light text-advist-gray900',
    green: 'bg-green-50 text-advist-success',
    yellow: 'bg-advist-gold-light text-advist-gold-dark',
    red: 'bg-advist-gold-light text-advist-error',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xl font-bold text-advist-gray900">{value}</p>
          <p className="text-xs text-advist-gray900">{label}</p>
        </div>
      </div>
    </Card>
  );
};

// Audit Log Row Component
const AuditLogRow: React.FC<{
  log: AuditLog;
  onViewDetails: (log: AuditLog) => void;
}> = ({ log, onViewDetails }) => {
  const actionConfig = ACTION_TYPE_CONFIG[log.action_type];
  const statusConfig = STATUS_CONFIG[log.status];
  const ActionIcon = actionConfig.icon;
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDate(log.timestamp);

  return (
    <tr className="hover:bg-advist-bg/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-advist-blue-light" />
          <div>
            <p className="text-sm font-medium text-advist-gray900">{date}</p>
            <p className="text-xs text-advist-blue-light">{time}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded bg-${actionConfig.color}-50`}>
            <ActionIcon size={14} className={`text-${actionConfig.color}-600`} />
          </div>
          <div>
            <p className="text-sm font-medium text-advist-gray900">{log.action}</p>
            <Badge
              variant={
                actionConfig.color as 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'
              }
              size="sm"
            >
              {actionConfig.label}
            </Badge>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <User size={14} className="text-advist-blue-light" />
          <div>
            <p className="text-sm font-medium text-advist-gray900">{log.user_name}</p>
            <p className="text-xs text-advist-blue-light">{log.user_email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-advist-gray900">{log.resource_name}</p>
          <p className="text-xs text-advist-blue-light">{log.resource_type}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs bg-advist-bg px-2 py-1 rounded">{log.ip_address}</code>
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusConfig.color} size="sm">
          <StatusIcon size={12} className="mr-1" />
          {statusConfig.label}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onViewDetails(log)}
          className="p-1.5 rounded hover:bg-advist-bg"
          title="Voir les details"
        >
          <Eye size={14} className="text-advist-gray900" />
        </button>
      </td>
    </tr>
  );
};

// Audit Detail Modal
const AuditDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog;
}> = ({ isOpen, onClose, log }) => {
  const statusConfig = STATUS_CONFIG[log.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Details de l'evenement" size="lg">
      <div className="space-y-6">
        {/* Status Banner */}
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            log.status === 'success'
              ? 'bg-green-50'
              : log.status === 'failure'
                ? 'bg-advist-gold-light'
                : 'bg-advist-gold-light'
          }`}
        >
          <StatusIcon
            size={24}
            className={
              log.status === 'success'
                ? 'text-advist-success'
                : log.status === 'failure'
                  ? 'text-advist-error'
                  : 'text-advist-gold-dark'
            }
          />
          <div>
            <p className="font-medium text-advist-gray900">{log.action}</p>
            <p className="text-sm text-advist-gray900">
              {new Date(log.timestamp).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Utilisateur" value={log.user_name} />
          <DetailItem label="Email" value={log.user_email} />
          <DetailItem label="Adresse IP" value={log.ip_address} />
          <DetailItem label="Type de ressource" value={log.resource_type} />
          <DetailItem label="Nom de la ressource" value={log.resource_name} />
          <DetailItem label="ID de la ressource" value={log.resource_id} />
        </div>

        {/* User Agent */}
        <div>
          <p className="text-sm font-medium text-advist-gray900 mb-1">Navigateur</p>
          <code className="block text-xs bg-advist-bg p-3 rounded-xl break-all">
            {log.user_agent}
          </code>
        </div>

        {/* Changes (if any) */}
        {log.changes && log.changes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-advist-gray900 mb-2">Modifications apportees</p>
            <div className="space-y-2">
              {log.changes.map((change, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-advist-bg/50 rounded-xl">
                  <span className="text-sm font-medium text-advist-gray900 min-w-24">
                    {change.field}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-advist-error bg-advist-gold-light px-2 py-1 rounded">
                      {change.old_value}
                    </span>
                    <ChevronRight size={16} className="text-advist-blue-light" />
                    <span className="text-sm text-advist-success bg-green-50 px-2 py-1 rounded">
                      {change.new_value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-advist-bg">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Detail Item Component
const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-advist-blue-light mb-1">{label}</p>
    <p className="text-sm font-medium text-advist-gray900">{value}</p>
  </div>
);

export default AuditPage;
