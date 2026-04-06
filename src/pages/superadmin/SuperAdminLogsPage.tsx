import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Search,
  _Filter,
  Download,
  RefreshCw,
  _Calendar,
  _Clock,
  User,
  Building2,
  Globe,
  Activity,
  Shield,
  _Settings,
  LogIn,
  _LogOut,
  _Upload,
  _Trash2,
  _Edit,
  Eye,
  _Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  _Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Server,
  _Database,
  Zap,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/ui';

// Types
interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  category: 'auth' | 'document' | 'workflow' | 'user' | 'system' | 'billing' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  user: {
    id: string;
    email: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  resource?: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, unknown>;
  success: boolean;
}

// Mock data
const mockLogs: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    action: 'user.login',
    category: 'auth',
    severity: 'info',
    user: { id: 'u1', email: 'admin@sgci.com', name: 'Amadou Diallo' },
    tenant: { id: 't1', name: 'Société Générale CI' },
    ip: '192.168.1.50',
    userAgent: 'Chrome/120.0 Windows 10',
    details: { method: '2FA', location: 'Abidjan, CI' },
    success: true,
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    action: 'document.create',
    category: 'document',
    severity: 'info',
    user: { id: 'u2', email: 'finance@bceao.int', name: 'Moussa Traoré' },
    tenant: { id: 't3', name: 'BCEAO' },
    resource: 'Document',
    resourceId: 'doc-123',
    ip: '172.16.0.25',
    userAgent: 'Firefox/121.0 Ubuntu',
    details: { filename: 'Rapport_Annuel_2024.pdf', size: '2.4MB' },
    success: true,
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    action: 'workflow.approve',
    category: 'workflow',
    severity: 'info',
    user: { id: 'u3', email: 'dg@orange-ci.com', name: 'Fatou Koné' },
    tenant: { id: 't2', name: "Orange Côte d'Ivoire" },
    resource: 'Workflow',
    resourceId: 'wf-456',
    ip: '10.0.0.100',
    userAgent: 'Safari/17.0 macOS',
    details: { step: 'Direction Générale', documentId: 'doc-789' },
    success: true,
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    action: 'user.login_failed',
    category: 'security',
    severity: 'warning',
    user: { id: 'unknown', email: 'unknown@test.com', name: 'Inconnu' },
    tenant: { id: 't1', name: 'Société Générale CI' },
    ip: '45.33.32.156',
    userAgent: 'Unknown',
    details: { reason: 'Invalid credentials', attempts: 3 },
    success: false,
  },
  {
    id: 'log-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    action: 'signature.complete',
    category: 'document',
    severity: 'info',
    user: { id: 'u4', email: 'juridique@nsia.ci', name: 'Aïcha Coulibaly' },
    tenant: { id: 't5', name: 'NSIA Assurances' },
    resource: 'Signature',
    resourceId: 'sig-321',
    ip: '192.168.5.12',
    userAgent: 'Chrome/120.0 Windows 11',
    details: { documentName: 'Contrat_Assurance.pdf', signatureType: 'qualified' },
    success: true,
  },
  {
    id: 'log-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    action: 'user.role_change',
    category: 'user',
    severity: 'warning',
    user: { id: 'u1', email: 'admin@sgci.com', name: 'Amadou Diallo' },
    tenant: { id: 't1', name: 'Société Générale CI' },
    resource: 'User',
    resourceId: 'u5',
    ip: '192.168.1.50',
    userAgent: 'Chrome/120.0 Windows 10',
    details: { targetUser: 'nouveau@sgci.com', oldRole: 'user', newRole: 'admin' },
    success: true,
  },
  {
    id: 'log-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    action: 'system.backup',
    category: 'system',
    severity: 'info',
    user: { id: 'system', email: 'system@advist.com', name: 'Système' },
    tenant: { id: 'platform', name: 'Plateforme' },
    ip: '127.0.0.1',
    userAgent: 'ADVIST Scheduler',
    details: { type: 'full', size: '45GB', duration: '15min' },
    success: true,
  },
  {
    id: 'log-008',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    action: 'billing.payment',
    category: 'billing',
    severity: 'info',
    user: { id: 'u6', email: 'finance@ecobank.ml', name: 'Ibrahim Sanogo' },
    tenant: { id: 't4', name: 'Ecobank Mali' },
    resource: 'Invoice',
    resourceId: 'inv-789',
    ip: '192.168.50.12',
    userAgent: 'Chrome/120.0 Android',
    details: { amount: 750000, currency: 'FCFA', method: 'card' },
    success: true,
  },
  {
    id: 'log-009',
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    action: 'security.ip_blocked',
    category: 'security',
    severity: 'critical',
    user: { id: 'system', email: 'system@advist.com', name: 'Système' },
    tenant: { id: 'platform', name: 'Plateforme' },
    ip: '185.220.101.1',
    userAgent: 'ADVIST Security',
    details: { blockedIP: '185.220.101.1', reason: 'Brute force attack', attempts: 150 },
    success: true,
  },
  {
    id: 'log-010',
    timestamp: new Date(Date.now() - 1000 * 60 * 40),
    action: 'document.delete',
    category: 'document',
    severity: 'warning',
    user: { id: 'u2', email: 'finance@bceao.int', name: 'Moussa Traoré' },
    tenant: { id: 't3', name: 'BCEAO' },
    resource: 'Document',
    resourceId: 'doc-old-001',
    ip: '172.16.0.25',
    userAgent: 'Firefox/121.0 Ubuntu',
    details: { filename: 'Archive_2020.pdf', permanent: false },
    success: true,
  },
];

const logStats = [
  { label: 'Logs (24h)', value: '45,678', icon: Activity, color: 'bg-primary-50 text-primary-900' },
  { label: 'Erreurs', value: '23', icon: XCircle, color: 'bg-red-50 text-red-600' },
  {
    label: 'Avertissements',
    value: '156',
    icon: AlertTriangle,
    color: 'bg-primary-50 text-primary-900',
  },
  { label: 'Connexions', value: '1,234', icon: LogIn, color: 'bg-green-50 text-primary-900' },
];

export const SuperAdminLogsPage: React.FC = () => {
  const { _t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterTenant, setFilterTenant] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "À l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger">Critique</Badge>;
      case 'error':
        return <Badge variant="danger">Erreur</Badge>;
      case 'warning':
        return <Badge variant="warning">Attention</Badge>;
      case 'info':
        return <Badge variant="default">Info</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <LogIn size={14} className="text-primary-900" />;
      case 'document':
        return <FileText size={14} className="text-primary-900" />;
      case 'workflow':
        return <Activity size={14} className="text-primary-900" />;
      case 'user':
        return <User size={14} className="text-orange-500" />;
      case 'system':
        return <Server size={14} className="text-primary-500" />;
      case 'billing':
        return <Zap size={14} className="text-primary-900" />;
      case 'security':
        return <Shield size={14} className="text-red-500" />;
      default:
        return <Activity size={14} className="text-primary-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user.login': 'Connexion utilisateur',
      'user.login_failed': 'Échec connexion',
      'user.logout': 'Déconnexion',
      'user.role_change': 'Changement de rôle',
      'document.create': 'Création document',
      'document.update': 'Modification document',
      'document.delete': 'Suppression document',
      'document.view': 'Consultation document',
      'workflow.create': 'Création workflow',
      'workflow.approve': 'Approbation workflow',
      'workflow.reject': 'Rejet workflow',
      'signature.request': 'Demande signature',
      'signature.complete': 'Signature effectuée',
      'system.backup': 'Backup système',
      'system.restore': 'Restauration',
      'billing.payment': 'Paiement reçu',
      'billing.invoice': 'Facture générée',
      'security.ip_blocked': 'IP bloquée',
      'security.mfa_enabled': '2FA activé',
    };
    return labels[action] || action;
  };

  // Filter logs
  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tenant.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesTenant = filterTenant === 'all' || log.tenant.id === filterTenant;

    return matchesSearch && matchesCategory && matchesSeverity && matchesTenant;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique tenants
  const uniqueTenants = Array.from(new Set(mockLogs.map((l) => JSON.stringify(l.tenant)))).map(
    (t) => JSON.parse(t)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Logs & Audit</h1>
          <p className="text-primary-600 mt-1">Journal d'activité global de la plateforme ADVIST</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {logStats.map((stat, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600">{stat.label}</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"
            />
            <input
              type="text"
              placeholder="Rechercher dans les logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900"
            />
          </div>

          {/* Date range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-xl focus:outline-none text-sm"
          >
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="custom">Personnalisé</option>
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-xl focus:outline-none text-sm"
          >
            <option value="all">Toutes catégories</option>
            <option value="auth">Authentification</option>
            <option value="document">Documents</option>
            <option value="workflow">Workflows</option>
            <option value="user">Utilisateurs</option>
            <option value="system">Système</option>
            <option value="billing">Facturation</option>
            <option value="security">Sécurité</option>
          </select>

          {/* Severity filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-xl focus:outline-none text-sm"
          >
            <option value="all">Tous niveaux</option>
            <option value="critical">Critique</option>
            <option value="error">Erreur</option>
            <option value="warning">Attention</option>
            <option value="info">Info</option>
          </select>

          {/* Tenant filter */}
          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-xl focus:outline-none text-sm"
          >
            <option value="all">Toutes organisations</option>
            {uniqueTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>

          <span className="text-sm text-primary-500">{filteredLogs.length} entrées</span>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50 border-b border-primary-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">
                  Horodatage
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">
                  Utilisateur
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">
                  Organisation
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-primary-600">
                  Niveau
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-primary-600">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-primary-600">IP</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-primary-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100 font-mono text-sm">
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-primary-50 transition-colors cursor-pointer ${
                    log.severity === 'critical' || log.severity === 'error'
                      ? 'bg-red-50/30'
                      : log.severity === 'warning'
                        ? 'bg-primary-50/30'
                        : ''
                  }`}
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="py-3 px-4">
                    <div className="text-primary-900">{formatTimestamp(log.timestamp)}</div>
                    <div className="text-xs text-primary-500">{formatTimeAgo(log.timestamp)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(log.category)}
                      <span className="text-primary-900">{getActionLabel(log.action)}</span>
                    </div>
                    <div className="text-xs text-primary-500">{log.action}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-primary-900">{log.user.name}</div>
                    <div className="text-xs text-primary-500">{log.user.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={12} className="text-primary-400" />
                      <span className="text-primary-700">{log.tenant.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{getSeverityBadge(log.severity)}</td>
                  <td className="py-3 px-4 text-center">
                    {log.success ? (
                      <CheckCircle size={18} className="mx-auto text-primary-900" />
                    ) : (
                      <XCircle size={18} className="mx-auto text-red-500" />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Globe size={12} className="text-primary-400" />
                      <span className="text-primary-600">{log.ip}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm">
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-primary-100">
          <p className="text-sm text-primary-500">
            Affichage {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredLogs.length)} sur {filteredLogs.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Détail du log"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center gap-3">
                {getCategoryIcon(selectedLog.category)}
                <div>
                  <p className="font-medium text-primary-900">
                    {getActionLabel(selectedLog.action)}
                  </p>
                  <p className="text-xs text-primary-500 font-mono">{selectedLog.action}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getSeverityBadge(selectedLog.severity)}
                {selectedLog.success ? (
                  <Badge variant="success">Succès</Badge>
                ) : (
                  <Badge variant="danger">Échec</Badge>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 mb-1">Horodatage</p>
                <p className="font-medium text-primary-900 font-mono text-sm">
                  {formatTimestamp(selectedLog.timestamp)}
                </p>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 mb-1">ID Log</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-primary-900 font-mono text-sm">{selectedLog.id}</p>
                  <button className="text-primary-400 hover:text-primary-600">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 mb-1">Utilisateur</p>
                <p className="font-medium text-primary-900">{selectedLog.user.name}</p>
                <p className="text-xs text-primary-500">{selectedLog.user.email}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 mb-1">Organisation</p>
                <p className="font-medium text-primary-900">{selectedLog.tenant.name}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 mb-1">Adresse IP</p>
                <p className="font-medium text-primary-900 font-mono">{selectedLog.ip}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 mb-1">User Agent</p>
                <p className="font-medium text-primary-900 text-xs truncate">
                  {selectedLog.userAgent}
                </p>
              </div>
            </div>

            {/* Resource */}
            {selectedLog.resource && (
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-500 mb-1">Ressource concernée</p>
                <p className="font-medium text-primary-900">
                  {selectedLog.resource}: {selectedLog.resourceId}
                </p>
              </div>
            )}

            {/* Details JSON */}
            <div className="p-3 bg-primary-900 rounded-xl">
              <p className="text-xs text-primary-400 mb-2">Détails (JSON)</p>
              <pre className="text-sm text-green-500 font-mono overflow-x-auto">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1">
                <Copy size={14} className="mr-2" />
                Copier JSON
              </Button>
              <Button variant="outline" className="flex-1">
                <ExternalLink size={14} className="mr-2" />
                Voir ressource
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminLogsPage;
