import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Eye,
  Calendar,
  ChevronRight,
  Bell,
  BarChart3,
  Settings,
  Database,
  Server,
  Zap,
  PenTool,
  History,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  FolderOpen,
  HardDrive,
  Workflow,
  ArrowUpRight,
  MoreHorizontal,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge, Button, Modal, MiniChart, ProgressCircle } from '../components/ui';
import { useAuthStore } from '../store';

// Données pour les graphiques de tendance (simulé)
const weeklyData = [35, 45, 32, 67, 52, 78, 62];
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Mock data for admin
const systemStats = [
  {
    label: 'Documents',
    value: '2,456',
    subLabel: 'Total actifs',
    change: '+12%',
    trend: 'up',
    icon: FileText,
    bgColor: 'bg-advist-dark',
  },
  {
    label: 'Utilisateurs',
    value: '156',
    subLabel: 'Actifs ce mois',
    change: '+8%',
    trend: 'up',
    icon: Users,
    bgColor: 'bg-advist-gold-light',
  },
  {
    label: 'Workflows',
    value: '89',
    subLabel: 'En cours',
    change: '+15%',
    trend: 'up',
    icon: GitBranch,
    bgColor: 'bg-advist-earth',
  },
  {
    label: 'Signatures',
    value: '312',
    subLabel: 'Ce mois',
    change: '+23%',
    trend: 'up',
    icon: PenTool,
    bgColor: 'bg-primary-900',
  },
];

const documentStats = {
  total: 2456,
  approved: 1823,
  pending: 421,
  rejected: 212,
};

const storageUsed = 45; // GB
const storageTotal = 100; // GB

const recentUsers = [
  { id: 1, name: 'Marie Dupont', email: 'marie.d@company.com', role: 'Manager', status: 'active', lastActive: '2 min', avatar: null },
  { id: 2, name: 'Pierre Martin', email: 'pierre.m@company.com', role: 'Utilisateur', status: 'active', lastActive: '15 min', avatar: null },
  { id: 3, name: 'Sophie Bernard', email: 'sophie.b@company.com', role: 'Admin', status: 'away', lastActive: '1h', avatar: null },
  { id: 4, name: 'Jean Kouassi', email: 'jean.k@company.com', role: 'Utilisateur', status: 'offline', lastActive: '3h', avatar: null },
];

const pendingApprovals = [
  { id: 1, type: 'user', title: 'Nouvelle demande d\'accès', user: 'Alice Martin', time: '5 min', priority: 'high' },
  { id: 2, type: 'workflow', title: 'Nouveau template workflow', user: 'Pierre Koffi', time: '30 min', priority: 'medium' },
  { id: 3, type: 'document', title: 'Document confidentiel', user: 'Marie Dupont', time: '1h', priority: 'high' },
];


const systemHealth = [
  { name: 'API Server', status: 'healthy', uptime: '99.9%', icon: Server },
  { name: 'Database', status: 'healthy', uptime: '99.8%', icon: Database },
  { name: 'Storage', status: 'warning', uptime: '98.5%', icon: HardDrive },
  { name: 'Auth Service', status: 'healthy', uptime: '99.9%', icon: Shield },
];

const activityLog = [
  { id: 1, action: 'Nouvel utilisateur créé', user: 'Admin', target: 'Jean Kouassi', time: '2 min', type: 'user' },
  { id: 2, action: 'Workflow modifié', user: 'Marie Dupont', target: 'Validation Contrats', time: '15 min', type: 'workflow' },
  { id: 3, action: 'Permission mise à jour', user: 'Admin', target: 'Groupe Managers', time: '30 min', type: 'security' },
  { id: 4, action: 'Document archivé', user: 'Système', target: 'Rapport 2023', time: '1h', type: 'document' },
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const basePath = '/admin';
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
              <p className="text-white/70 mt-2">
                Voici un aperçu de votre organisation
              </p>
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
        {systemStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-card p-5 border border-advist-border shadow-card hover:shadow-card-hover hover:border-advist-dark/20 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-[12px] ${stat.bgColor} shadow-lg`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <div className="flex items-center gap-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight size={16} className="text-advist-earth" />
                ) : (
                  <TrendingDown size={16} className="text-advist-warning" />
                )}
                <span className={`text-sm font-semibold ${stat.trend === 'up' ? 'text-advist-earth' : 'text-advist-warning'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
            <p className="text-3xl font-bold text-advist-gray900">{stat.value}</p>
            <p className="text-sm text-advist-blue-light mt-1">{stat.label}</p>
            <div className="mt-3 pt-3 border-t border-advist-border">
              <MiniChart data={weeklyData.map(v => v + index * 10)} color={stat.bgColor} />
            </div>
          </div>
        ))}
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
              <Link to={`${basePath}/users`} className="text-xs text-advist-gray900 hover:underline">
                Voir tous
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={u.name} size="sm" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white
                      ${u.status === 'active' ? 'bg-advist-earth' :
                        u.status === 'away' ? 'bg-advist-warning' : 'bg-advist-surface-dark'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-advist-gray900 truncate">{u.name}</p>
                    <p className="text-xs text-advist-blue-light">{u.role}</p>
                  </div>
                  <span className="text-xs text-advist-blue-light">{u.lastActive}</span>
                </div>
              ))}
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
                <div key={index} className="flex items-center justify-between p-2.5 bg-advist-surface-dark/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <service.icon size={14} className="text-advist-blue-light" />
                    <span className="text-sm text-advist-gray900">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-advist-blue-light">{service.uptime}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'healthy' ? 'bg-advist-earth' :
                      service.status === 'warning' ? 'bg-advist-warning' : 'bg-advist-error'
                    }`} />
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
              <Link to={`${basePath}/audit`} className="text-xs text-advist-gray900 hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {activityLog.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-xl mt-0.5 ${
                    log.type === 'user' ? 'bg-advist-gold-light/20 text-advist-gray900' :
                    log.type === 'workflow' ? 'bg-advist-earth/20 text-advist-earth' :
                    log.type === 'security' ? 'bg-advist-error/20 text-advist-error' :
                    'bg-advist-surface-dark text-advist-gray900'
                  }`}>
                    {log.type === 'user' && <Users size={12} />}
                    {log.type === 'workflow' && <GitBranch size={12} />}
                    {log.type === 'security' && <Shield size={12} />}
                    {log.type === 'document' && <FileText size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-advist-gray900 truncate">{log.action}</p>
                    <p className="text-xs text-advist-blue-light">{log.user} • {log.time}</p>
                  </div>
                </div>
              ))}
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
                value={Math.round((documentStats.approved / documentStats.total) * 100)}
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
                <span className="text-sm font-semibold text-advist-gray900">{documentStats.approved}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-advist-gold-light" />
                  <span className="text-sm text-advist-gray900">En attente</span>
                </div>
                <span className="text-sm font-semibold text-advist-gray900">{documentStats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-advist-error" />
                  <span className="text-sm text-advist-gray900">Rejetés</span>
                </div>
                <span className="text-sm font-semibold text-advist-gray900">{documentStats.rejected}</span>
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
                value={Math.round((storageUsed / storageTotal) * 100)}
                size={70}
                strokeWidth={8}
                color="advist-blue-light"
              />
              <div>
                <p className="text-2xl font-bold text-advist-gray900">{storageUsed} GB</p>
                <p className="text-sm text-advist-blue-light">sur {storageTotal} GB</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-advist-surface-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-advist-gold-light rounded-full transition-all duration-500"
                style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
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
            <div className="space-y-2">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="p-3 bg-white/10 hover:bg-white/15 rounded-[10px] transition-all duration-240 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
                      item.priority === 'high' ? 'bg-advist-warning/30 text-advist-warning' : 'bg-advist-gold-light/30 text-advist-blue-light'
                    }`}>
                      {item.priority === 'high' ? 'Urgent' : 'Normal'}
                    </span>
                    <span className="text-[10px] text-white/50">{item.time}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">Par {item.user}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 bg-advist-warning hover:bg-advist-warning/90 text-white font-semibold rounded-btn transition-all duration-240 flex items-center justify-center gap-2">
              Traiter les demandes
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
