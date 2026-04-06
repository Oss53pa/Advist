import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  FileText,
  Server,
  _Shield,
  _Globe,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Database,
  HardDrive,
  _Cpu,
  Clock,
  ArrowRight,
  Plus,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Pause,
  Eye,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import { PaymentNotificationsWidget } from '../../components/superadmin';

// Mock data for tenants/organizations
const mockTenants = [
  {
    id: 1,
    name: 'ADVIST Demo',
    slug: 'advist-demo',
    plan: 'business',
    status: 'active',
    users: 12,
    maxUsers: 50,
    documents: 2456,
    storage: 45,
    maxStorage: 100,
    country: 'CI',
    createdAt: '2024-01-15',
    lastActivity: '2 min',
  },
  {
    id: 2,
    name: 'Société Générale CI',
    slug: 'sgci',
    plan: 'enterprise',
    status: 'active',
    users: 156,
    maxUsers: 500,
    documents: 12500,
    storage: 234,
    maxStorage: 500,
    country: 'CI',
    createdAt: '2023-06-01',
    lastActivity: '5 min',
  },
  {
    id: 3,
    name: 'Cabinet Juridique Kouassi',
    slug: 'cjk',
    plan: 'business',
    status: 'suspended',
    users: 8,
    maxUsers: 10,
    documents: 450,
    storage: 12,
    maxStorage: 20,
    country: 'CI',
    createdAt: '2024-03-20',
    lastActivity: '5 jours',
  },
  {
    id: 4,
    name: "Orange Côte d'Ivoire",
    slug: 'orange-ci',
    plan: 'enterprise',
    status: 'active',
    users: 89,
    maxUsers: 200,
    documents: 8900,
    storage: 156,
    maxStorage: 300,
    country: 'CI',
    createdAt: '2023-09-15',
    lastActivity: '10 min',
  },
  {
    id: 5,
    name: 'Test Organisation',
    slug: 'test-org',
    plan: 'business',
    status: 'trial',
    users: 3,
    maxUsers: 5,
    documents: 25,
    storage: 1,
    maxStorage: 5,
    country: 'SN',
    createdAt: '2024-11-01',
    lastActivity: '1h',
  },
];

// System metrics
const systemMetrics = [
  {
    label: 'Organisations',
    value: '47',
    change: '+5',
    trend: 'up',
    icon: Building2,
    color: 'bg-advist-gold-light text-advist-gray900',
  },
  {
    label: 'Utilisateurs totaux',
    value: '1,234',
    change: '+89',
    trend: 'up',
    icon: Users,
    color: 'bg-green-50 text-advist-success',
  },
  {
    label: 'Documents',
    value: '45,678',
    change: '+2,345',
    trend: 'up',
    icon: FileText,
    color: 'bg-advist-surface-dark text-advist-gray900',
  },
  {
    label: 'Stockage utilisé',
    value: '1.2 TB',
    change: '+50 GB',
    trend: 'up',
    icon: HardDrive,
    color: 'bg-advist-gold-light text-advist-gold-dark',
  },
];

// System health
const systemHealth = {
  api: { status: 'healthy', latency: '45ms', uptime: '99.99%' },
  database: { status: 'healthy', latency: '12ms', uptime: '99.98%' },
  storage: { status: 'warning', latency: '120ms', uptime: '99.5%' },
  queue: { status: 'healthy', latency: '8ms', uptime: '99.99%' },
  cache: { status: 'healthy', latency: '2ms', uptime: '100%' },
};

// Recent alerts
const recentAlerts = [
  { id: 1, type: 'warning', message: 'Stockage "Orange CI" à 80% de capacité', time: '5 min' },
  { id: 2, type: 'info', message: 'Nouvelle organisation créée: Test Organisation', time: '1h' },
  { id: 3, type: 'error', message: 'Échec paiement: Cabinet Juridique Kouassi', time: '2h' },
  { id: 4, type: 'success', message: 'Migration DB terminée avec succès', time: '3h' },
];

export const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTenant, setSelectedTenant] = useState<(typeof mockTenants)[0] | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);

  const getPlanBadge = (plan: string) => {
    const styles = {
      starter: 'bg-advist-surface-dark text-advist-gray900',
      business: 'bg-advist-gold-light text-advist-gray900',
      enterprise: 'bg-advist-surface-dark text-advist-gray900',
    };
    return styles[plan as keyof typeof styles] || styles.starter;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-advist-success', label: 'Actif' };
      case 'suspended':
        return { icon: Pause, color: 'text-advist-gold-dark', label: 'Suspendu' };
      case 'trial':
        return { icon: Clock, color: 'text-advist-gray900', label: 'Essai' };
      default:
        return { icon: XCircle, color: 'text-advist-error', label: 'Inactif' };
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle size={16} className="text-advist-error" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-advist-gold-dark" />;
      case 'success':
        return <CheckCircle size={16} className="text-advist-success" />;
      default:
        return <Activity size={16} className="text-advist-gray900" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            {t('superadmin.title', 'Console Super Admin')}
          </h1>
          <p className="text-advist-blue-light mt-1">
            {t('superadmin.subtitle', 'Gestion globale de la plateforme ADVIST')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/superadmin/tenants/new')}>
            <Plus size={18} className="mr-2" />
            {t('superadmin.newTenant', 'Nouvelle organisation')}
          </Button>
          <Button variant="ghost">
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-advist-bg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-advist-blue-light">{metric.label}</p>
                <p className="text-3xl font-bold text-advist-gray900 mt-2">{metric.value}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {metric.trend === 'up' ? (
                    <TrendingUp size={14} className="text-advist-success" />
                  ) : (
                    <TrendingDown size={14} className="text-advist-error" />
                  )}
                  <span
                    className={`text-sm font-medium ${metric.trend === 'up' ? 'text-advist-success' : 'text-advist-error'}`}
                  >
                    {metric.change}
                  </span>
                  <span className="text-xs text-advist-blue-light">ce mois</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${metric.color}`}>
                <metric.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tenants List */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-advist-bg overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-advist-bg">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-advist-blue-light" />
              <h2 className="font-semibold text-advist-gray900">
                {t('superadmin.tenants', 'Organisations')}
              </h2>
            </div>
            <Link
              to="/superadmin/tenants"
              className="text-sm text-advist-gray900 hover:underline flex items-center gap-1"
            >
              {t('common.seeAll', 'Voir tout')} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-advist-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Utilisateurs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Stockage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-advist-blue-light uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-advist-bg">
                {mockTenants.map((tenant) => {
                  const status = getStatusBadge(tenant.status);
                  const storagePercent = (tenant.storage / tenant.maxStorage) * 100;
                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-advist-bg/50 transition-all duration-240"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-advist-dark rounded-xl flex items-center justify-center text-white font-semibold">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-advist-gray900">{tenant.name}</p>
                            <p className="text-xs text-advist-blue-light">{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-xl capitalize ${getPlanBadge(tenant.plan)}`}
                        >
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-medium text-advist-gray900">{tenant.users}</span>
                          <span className="text-advist-blue-light">/{tenant.maxUsers}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-advist-gray900">{tenant.storage} GB</span>
                            <span className="text-advist-blue-light">
                              {Math.round(storagePercent)}%
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-advist-bg rounded-full">
                            <div
                              className={`h-full rounded-full ${
                                storagePercent > 80
                                  ? 'bg-advist-error'
                                  : storagePercent > 60
                                    ? 'bg-advist-gold'
                                    : 'bg-advist-success'
                              }`}
                              style={{ width: `${storagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <status.icon size={14} className={status.color} />
                          <span className="text-sm text-advist-gray900">{status.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowTenantModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-xl border border-advist-bg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Server size={18} className="text-advist-blue-light" />
                <h2 className="font-semibold text-advist-gray900">
                  {t('superadmin.systemHealth', 'État du système')}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-advist-success rounded-full animate-pulse" />
                <span className="text-xs text-advist-success font-medium">Opérationnel</span>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(systemHealth).map(([name, data]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 bg-advist-bg rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        data.status === 'healthy'
                          ? 'bg-advist-success'
                          : data.status === 'warning'
                            ? 'bg-advist-gold'
                            : 'bg-advist-error'
                      }`}
                    />
                    <span className="text-sm font-medium text-advist-gray900 capitalize">
                      {name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-advist-blue-light">{data.latency}</p>
                    <p className="text-xs text-advist-success">{data.uptime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Notifications Widget */}
          <PaymentNotificationsWidget compact />

          {/* Recent Alerts */}
          <div className="bg-advist-dark rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-[#F8F868]" />
                <h2 className="font-semibold">{t('superadmin.alerts', 'Alertes récentes')}</h2>
              </div>
              <span className="px-2 py-1 bg-[#F8F868] text-advist-gray900 text-xs font-bold rounded-xl">
                {recentAlerts.length}
              </span>
            </div>

            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-white/10 rounded-xl">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-white/50 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4 text-white border-white/20 hover:bg-white/10"
            >
              {t('superadmin.viewAllAlerts', 'Voir toutes les alertes')}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-advist-bg p-5">
            <h3 className="font-semibold text-advist-gray900 mb-4">
              {t('superadmin.quickActions', 'Actions rapides')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex flex-col items-center gap-2 p-4 bg-advist-bg rounded-xl hover:bg-advist-bg transition-all duration-240">
                <Database size={20} className="text-advist-gray900" />
                <span className="text-xs text-advist-gray900">Backup DB</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-advist-bg rounded-xl hover:bg-advist-bg transition-all duration-240">
                <Zap size={20} className="text-advist-gray900" />
                <span className="text-xs text-advist-gray900">Vider cache</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-advist-bg rounded-xl hover:bg-advist-bg transition-all duration-240">
                <BarChart3 size={20} className="text-advist-gray900" />
                <span className="text-xs text-advist-gray900">Rapports</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-advist-bg rounded-xl hover:bg-advist-bg transition-all duration-240">
                <Settings size={20} className="text-advist-gray900" />
                <span className="text-xs text-advist-gray900">Config</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Detail Modal */}
      <Modal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        title={selectedTenant?.name || ''}
        size="lg"
      >
        {selectedTenant && (
          <div className="space-y-6">
            {/* Tenant Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Plan</p>
                <p className="font-semibold text-advist-gray900 capitalize">
                  {selectedTenant.plan}
                </p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Pays</p>
                <p className="font-semibold text-advist-gray900">{selectedTenant.country}</p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Créé le</p>
                <p className="font-semibold text-advist-gray900">
                  {new Date(selectedTenant.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="p-4 bg-advist-bg rounded-xl">
                <p className="text-sm text-advist-blue-light">Dernière activité</p>
                <p className="font-semibold text-advist-gray900">{selectedTenant.lastActivity}</p>
              </div>
            </div>

            {/* Usage Stats */}
            <div>
              <h4 className="font-medium text-advist-gray900 mb-3">Utilisation</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilisateurs</span>
                    <span>
                      {selectedTenant.users}/{selectedTenant.maxUsers}
                    </span>
                  </div>
                  <div className="h-2 bg-advist-bg rounded-full">
                    <div
                      className="h-full bg-advist-dark rounded-full"
                      style={{
                        width: `${(selectedTenant.users / selectedTenant.maxUsers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Documents</span>
                    <span>{selectedTenant.documents.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-advist-bg rounded-full">
                    <div className="h-full bg-advist-dark rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stockage</span>
                    <span>
                      {selectedTenant.storage} GB / {selectedTenant.maxStorage} GB
                    </span>
                  </div>
                  <div className="h-2 bg-advist-bg rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        selectedTenant.storage / selectedTenant.maxStorage > 0.8
                          ? 'bg-advist-error'
                          : 'bg-advist-success'
                      }`}
                      style={{
                        width: `${(selectedTenant.storage / selectedTenant.maxStorage) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-advist-bg">
              <Button variant="outline" className="flex-1">
                <Eye size={16} className="mr-2" />
                {t('superadmin.impersonate', 'Se connecter comme')}
              </Button>
              <Button variant="outline" className="flex-1">
                <Settings size={16} className="mr-2" />
                {t('common.configure', 'Configurer')}
              </Button>
              {selectedTenant.status === 'active' ? (
                <Button variant="danger" className="flex-1">
                  <Pause size={16} className="mr-2" />
                  {t('superadmin.suspend', 'Suspendre')}
                </Button>
              ) : (
                <Button className="flex-1">
                  <CheckCircle size={16} className="mr-2" />
                  {t('superadmin.activate', 'Activer')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
