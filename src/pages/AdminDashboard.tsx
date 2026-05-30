import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  GitBranch,
  ArrowRight,
  Users,
  TrendingDown,
  Shield,
  BarChart3,
  Database,
  Server,
  PenTool,
  History,
  AlertTriangle,
  UserPlus,
  HardDrive,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { Avatar, MiniChart, ProgressCircle } from '../components/ui';
import { useAuthStore } from '../store';
import { useTenantStore } from '../stores/tenantStore';
import {
  getAdminSystemStats,
  getAdminWeeklyActivity,
  getAdminRecentUsers,
  getAdminPendingApprovals,
  getAdminDocumentStats,
  type AdminSystemStats,
  type AdminRecentUser,
  type AdminPendingApproval,
  type AdminDocumentStats,
} from '../services/adminOverview';
import {
  getRecentActivity,
  getOrgUsage,
  type RecentActivityItem,
  type OrgUsage,
} from '../services/dashboardOverview';

/* ------------------------------------------------------------------ */
/* Static infra-health stubs                                            */
/* These describe the Atlas Studio platform, not the tenant org. We    */
/* keep them as informational green stubs (the per-org admin can't act */
/* on platform health anyway).                                          */
/* ------------------------------------------------------------------ */
const systemHealth = [
  { name: 'API Server', status: 'healthy' as const, uptime: '99.9%', icon: Server },
  { name: 'Database', status: 'healthy' as const, uptime: '99.8%', icon: Database },
  { name: 'Storage', status: 'healthy' as const, uptime: '99.5%', icon: HardDrive },
  { name: 'Auth Service', status: 'healthy' as const, uptime: '99.9%', icon: Shield },
];

function activityTypeOf(
  resourceType: string | null
): 'user' | 'workflow' | 'security' | 'document' {
  const t = (resourceType || '').toLowerCase();
  if (t.includes('user') || t.includes('member') || t.includes('profile')) return 'user';
  if (t.includes('workflow')) return 'workflow';
  if (t.includes('role') || t.includes('permission') || t.includes('auth')) return 'security';
  return 'document';
}

function relativeShort(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return 'à l’instant';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}j`;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { currentTenant } = useTenantStore();
  const tenantQuotas = currentTenant?.quotas;
  const navigate = useNavigate();
  const basePath = '/admin';
  const orgId = user?.organization?.id;
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const [stats, setStats] = useState<AdminSystemStats>({
    documentsTotal: 0,
    documentsChangePct: 0,
    usersActive: 0,
    usersChangePct: 0,
    workflowsActive: 0,
    workflowsChangePct: 0,
    signaturesThisMonth: 0,
    signaturesChangePct: 0,
  });
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [recentUsers, setRecentUsers] = useState<AdminRecentUser[]>([]);
  const [activityLog, setActivityLog] = useState<RecentActivityItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AdminPendingApproval[]>([]);
  const [documentStats, setDocumentStats] = useState<AdminDocumentStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [usage, setUsage] = useState<OrgUsage>({
    currentUsers: 0,
    currentDocuments: 0,
    currentActiveWorkflows: 0,
    currentStorageGb: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getAdminSystemStats(orgId),
      getAdminWeeklyActivity(orgId),
      getAdminRecentUsers(orgId, 4),
      getRecentActivity(orgId, 4),
      getAdminPendingApprovals(orgId, 3),
      getAdminDocumentStats(orgId),
      getOrgUsage(orgId),
    ])
      .then(([s, w, ru, al, pa, ds, u]) => {
        if (cancelled) return;
        setStats(s);
        setWeeklyData(w);
        setRecentUsers(ru);
        setActivityLog(al);
        setPendingApprovals(pa);
        setDocumentStats(ds);
        setUsage(u);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // Storage display: enterprise (-1) renders as "illimité"
  const storageMax = tenantQuotas?.maxStorage ?? currentTenant?.quotas?.max_storage_gb ?? 100;
  const storageUnlimited = storageMax === -1;
  const storageUsed = usage.currentStorageGb;
  const storageTotalDisplay = storageUnlimited ? '∞' : `${storageMax} GB`;
  const storagePct = storageUnlimited
    ? 0
    : Math.min(100, Math.round((storageUsed / storageMax) * 100));

  // KPI cards built from real stats
  const systemStats = [
    {
      label: 'Documents',
      value: stats.documentsTotal.toLocaleString('fr-FR'),
      subLabel: 'Total actifs',
      change: stats.documentsChangePct,
      icon: FileText,
      bgColor: 'bg-advist-dark',
    },
    {
      label: 'Utilisateurs',
      value: stats.usersActive.toLocaleString('fr-FR'),
      subLabel: 'Actifs',
      change: stats.usersChangePct,
      icon: Users,
      bgColor: 'bg-advist-gold-light',
    },
    {
      label: 'Workflows',
      value: stats.workflowsActive.toLocaleString('fr-FR'),
      subLabel: 'En cours',
      change: stats.workflowsChangePct,
      icon: GitBranch,
      bgColor: 'bg-advist-earth',
    },
    {
      label: 'Signatures',
      value: stats.signaturesThisMonth.toLocaleString('fr-FR'),
      subLabel: 'Ce mois',
      change: stats.signaturesChangePct,
      icon: PenTool,
      bgColor: 'bg-primary-900',
    },
  ];

  const approvedPct =
    documentStats.total > 0 ? Math.round((documentStats.approved / documentStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-advist-navy to-advist-navy/70 rounded-[18px] p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-white/60 text-sm">{today}</p>
              <h1 className="text-2xl font-bold mt-1">
                Bonjour, {user?.first_name || 'Administrateur'} !
              </h1>
              <p className="text-white/70 mt-2">Voici un aperçu de votre organisation</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`${basePath}/users`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-advist-gray900 rounded-[12px] font-medium hover:bg-white/90 transition-all duration-240"
              >
                <UserPlus size={18} />
                Nouvel utilisateur
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-[12px] font-medium transition-all duration-240">
                <Download size={18} />
                Rapport
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => {
          const trendUp = stat.change >= 0;
          return (
            <div
              key={index}
              className="bg-white rounded-card p-5 border border-advist-border shadow-card hover:shadow-card-hover hover:border-advist-dark/20 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-[12px] ${stat.bgColor} shadow-lg`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <div className="flex items-center gap-1">
                  {trendUp ? (
                    <ArrowUpRight size={16} className="text-advist-earth" />
                  ) : (
                    <TrendingDown size={16} className="text-advist-warning" />
                  )}
                  <span
                    className={`text-sm font-semibold ${trendUp ? 'text-advist-earth' : 'text-advist-warning'}`}
                  >
                    {trendUp ? '+' : ''}
                    {stat.change}%
                  </span>
                </div>
              </div>
              <p className="text-3xl font-bold text-advist-gray900">{stat.value}</p>
              <p className="text-sm text-advist-blue-light mt-1">{stat.label}</p>
              <div className="mt-3 pt-3 border-t border-advist-border">
                <MiniChart data={weeklyData.map((v) => v + index * 2)} color={stat.bgColor} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1 - Utilisateurs + Système */}
        <div className="flex flex-col gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-card border border-advist-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-advist-border">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-advist-blue-light" />
                <h3 className="font-semibold text-advist-gray900">Utilisateurs actifs</h3>
              </div>
              <Link
                to={`${basePath}/users`}
                className="text-xs text-advist-gray900 hover:underline"
              >
                Voir tous
              </Link>
            </div>
            <div className="p-4 space-y-3 min-h-[120px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-xs text-advist-blue-light">
                  Chargement…
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-advist-blue-light">
                  Aucun utilisateur actif
                </div>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={u.name} size="sm" />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white
                      ${
                        u.status === 'active'
                          ? 'bg-advist-earth'
                          : u.status === 'away'
                            ? 'bg-advist-warning'
                            : 'bg-advist-surface-dark'
                      }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-advist-gray900 truncate">{u.name}</p>
                      <p className="text-xs text-advist-blue-light">{u.role}</p>
                    </div>
                    <span className="text-xs text-advist-blue-light">{u.lastActive}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-card border border-advist-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-advist-blue-light" />
                <h3 className="font-semibold text-advist-gray900">Système</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-advist-earth rounded-full animate-pulse" />
                <span className="text-xs text-advist-earth font-medium">En ligne</span>
              </div>
            </div>
            <div className="space-y-2">
              {systemHealth.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-advist-surface-dark/50 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <service.icon size={14} className="text-advist-blue-light" />
                    <span className="text-sm text-advist-gray900">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-advist-blue-light">{service.uptime}</span>
                    <div className="w-2 h-2 rounded-full bg-advist-earth" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2 - Activités + Documents Stats */}
        <div className="flex flex-col gap-6">
          {/* Activity Log */}
          <div className="bg-white rounded-card border border-advist-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-advist-border">
              <div className="flex items-center gap-2">
                <History size={18} className="text-advist-earth" />
                <h3 className="font-semibold text-advist-gray900">Journal d'activité</h3>
              </div>
              <Link
                to={`${basePath}/audit`}
                className="text-xs text-advist-gray900 hover:underline"
              >
                Voir tout
              </Link>
            </div>
            <div className="p-4 space-y-3 min-h-[160px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-xs text-advist-blue-light">
                  Chargement…
                </div>
              ) : activityLog.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-advist-blue-light">
                  Aucune activité récente
                </div>
              ) : (
                activityLog.map((log) => {
                  const type = activityTypeOf(log.resourceName);
                  return (
                    <div key={log.id} className="flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded-xl mt-0.5 ${
                          type === 'user'
                            ? 'bg-advist-gold-light/20 text-advist-gray900'
                            : type === 'workflow'
                              ? 'bg-advist-earth/20 text-advist-earth'
                              : type === 'security'
                                ? 'bg-advist-error/20 text-advist-error'
                                : 'bg-advist-surface-dark text-advist-gray900'
                        }`}
                      >
                        {type === 'user' && <Users size={12} />}
                        {type === 'workflow' && <GitBranch size={12} />}
                        {type === 'security' && <Shield size={12} />}
                        {type === 'document' && <FileText size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-advist-gray900 truncate">{log.action}</p>
                        <p className="text-xs text-advist-blue-light">
                          {log.resourceName || '—'} • {relativeShort(log.at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Document Stats */}
          <div className="bg-white rounded-card border border-advist-border shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-advist-blue-light" />
              <h3 className="font-semibold text-advist-gray900">Statut documents</h3>
            </div>
            <div className="flex items-center justify-center mb-4">
              <ProgressCircle
                value={approvedPct}
                size={100}
                strokeWidth={10}
                color="advist-earth"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-advist-earth" />
                  <span className="text-sm text-advist-gray900">Approuvés</span>
                </div>
                <span className="text-sm font-semibold text-advist-gray900">
                  {documentStats.approved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-advist-gold-light" />
                  <span className="text-sm text-advist-gray900">En attente</span>
                </div>
                <span className="text-sm font-semibold text-advist-gray900">
                  {documentStats.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-advist-error" />
                  <span className="text-sm text-advist-gray900">Rejetés</span>
                </div>
                <span className="text-sm font-semibold text-advist-gray900">
                  {documentStats.rejected}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 - Stockage + En attente */}
        <div className="flex flex-col gap-6">
          {/* Storage */}
          <div className="bg-white rounded-card border border-advist-border shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive size={18} className="text-advist-blue-light" />
              <h3 className="font-semibold text-advist-gray900">Stockage</h3>
            </div>
            <div className="flex items-center gap-4">
              <ProgressCircle
                value={storagePct}
                size={70}
                strokeWidth={8}
                color="advist-blue-light"
              />
              <div>
                <p className="text-2xl font-bold text-advist-gray900">{storageUsed} GB</p>
                <p className="text-sm text-advist-blue-light">sur {storageTotalDisplay}</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-advist-surface-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-advist-gold-light rounded-full transition-all duration-500"
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-advist-dark rounded-card p-5 shadow-card-hover flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-advist-warning/20 rounded-xl">
                  <AlertTriangle size={18} className="text-advist-warning" />
                </div>
                <h3 className="font-semibold text-white">En attente</h3>
              </div>
              <span className="px-2.5 py-1 bg-advist-warning text-white text-xs font-bold rounded-full">
                {pendingApprovals.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[120px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-xs text-white/60">
                  Chargement…
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-white/60">
                  Aucune demande en attente
                </div>
              ) : (
                pendingApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white/10 hover:bg-white/15 rounded-[10px] transition-all duration-240 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
                          item.priority === 'high'
                            ? 'bg-advist-warning/30 text-advist-warning'
                            : 'bg-advist-gold-light/30 text-advist-blue-light'
                        }`}
                      >
                        {item.priority === 'high' ? 'Urgent' : 'Normal'}
                      </span>
                      <span className="text-[10px] text-white/50">{item.time}</span>
                    </div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">Par {item.user}</p>
                  </div>
                ))
              )}
            </div>
            {pendingApprovals.length > 0 && (
              <button className="w-full mt-4 py-2.5 bg-advist-warning hover:bg-advist-warning/90 text-white font-semibold rounded-btn transition-all duration-240 flex items-center justify-center gap-2">
                Traiter les demandes
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
