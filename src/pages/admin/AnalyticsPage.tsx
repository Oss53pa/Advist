import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileSignature,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

// Types
interface KPIData {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface ActivityItem {
  id: string;
  type: 'document' | 'signature' | 'workflow' | 'user';
  action: string;
  user: string;
  target: string;
  timestamp: Date;
}

// Mock Data
const kpiData: KPIData[] = [
  {
    label: 'Documents traités',
    value: '1,247',
    change: 12.5,
    changeLabel: 'vs mois dernier',
    icon: FileText,
    color: 'blue',
  },
  {
    label: 'Signatures effectuées',
    value: '3,892',
    change: 8.3,
    changeLabel: 'vs mois dernier',
    icon: FileSignature,
    color: 'green',
  },
  {
    label: 'Workflows actifs',
    value: '156',
    change: -2.1,
    changeLabel: 'vs mois dernier',
    icon: Activity,
    color: 'purple',
  },
  {
    label: 'Temps moyen validation',
    value: '2.4j',
    change: -15.2,
    changeLabel: 'vs mois dernier',
    icon: Clock,
    color: 'orange',
  },
];

const documentsByType: ChartData[] = [
  { label: 'Contrats', value: 35, color: '#3B82F6' },
  { label: 'Factures', value: 25, color: '#10B981' },
  { label: 'Rapports', value: 20, color: '#8B5CF6' },
  { label: 'Procès-verbaux', value: 12, color: '#F59E0B' },
  { label: 'Autres', value: 8, color: '#6B7280' },
];

const workflowStatus: ChartData[] = [
  { label: 'Complétés', value: 68, color: '#10B981' },
  { label: 'En cours', value: 22, color: '#3B82F6' },
  { label: 'En attente', value: 7, color: '#F59E0B' },
  { label: 'Rejetés', value: 3, color: '#F59E0B' },
];

const monthlyData = [
  { month: 'Jan', documents: 120, signatures: 340, workflows: 45 },
  { month: 'Fév', documents: 145, signatures: 420, workflows: 52 },
  { month: 'Mar', documents: 132, signatures: 380, workflows: 48 },
  { month: 'Avr', documents: 168, signatures: 490, workflows: 61 },
  { month: 'Mai', documents: 155, signatures: 450, workflows: 55 },
  { month: 'Juin', documents: 189, signatures: 520, workflows: 68 },
  { month: 'Juil', documents: 201, signatures: 580, workflows: 72 },
  { month: 'Août', documents: 178, signatures: 510, workflows: 64 },
  { month: 'Sept', documents: 210, signatures: 620, workflows: 78 },
  { month: 'Oct', documents: 225, signatures: 680, workflows: 85 },
  { month: 'Nov', documents: 198, signatures: 590, workflows: 74 },
  { month: 'Déc', documents: 156, signatures: 470, workflows: 58 },
];

const topSigners = [
  { name: 'Mamadou Diallo', role: 'Directeur Général', count: 245, avatar: 'MD' },
  { name: 'Aminata Sow', role: 'DAF', count: 198, avatar: 'AS' },
  { name: 'Ibrahima Ndiaye', role: 'DRH', count: 156, avatar: 'IN' },
  { name: 'Fatou Diop', role: 'Directrice Juridique', count: 134, avatar: 'FD' },
  { name: 'Ousmane Fall', role: 'Chef de Projet', count: 112, avatar: 'OF' },
];

const recentActivity: ActivityItem[] = [
  { id: '1', type: 'signature', action: 'a signé', user: 'Mamadou Diallo', target: 'Contrat_2024_001.pdf', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '2', type: 'document', action: 'a créé', user: 'Aminata Sow', target: 'Rapport_Q4_2024.pdf', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
  { id: '3', type: 'workflow', action: 'a approuvé', user: 'Ibrahima Ndiaye', target: 'Workflow #WF-2024-156', timestamp: new Date(Date.now() - 1000 * 60 * 32) },
  { id: '4', type: 'user', action: 'a été ajouté', user: 'Fatou Diop', target: "à l'équipe Finance", timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { id: '5', type: 'signature', action: 'a rejeté', user: 'Ousmane Fall', target: 'Devis_Client_X.pdf', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
];

const departmentStats = [
  { name: 'Direction Générale', documents: 89, signatures: 234, completion: 95 },
  { name: 'Finance', documents: 156, signatures: 412, completion: 88 },
  { name: 'Ressources Humaines', documents: 78, signatures: 198, completion: 92 },
  { name: 'Juridique', documents: 124, signatures: 356, completion: 97 },
  { name: 'Commercial', documents: 201, signatures: 489, completion: 85 },
];

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signature': return FileSignature;
      case 'document': return FileText;
      case 'workflow': return Activity;
      case 'user': return Users;
      default: return FileText;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'signature': return 'text-advist-success bg-green-50';
      case 'document': return 'text-advist-gray900 bg-advist-gold-light';
      case 'workflow': return 'text-advist-gray900 bg-advist-surface-dark';
      case 'user': return 'text-advist-gold-dark bg-advist-gold-light';
      default: return 'text-advist-text-secondary bg-advist-surface-dark';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            {t('analytics.title', 'Reporting & Analytics')}
          </h1>
          <p className="text-advist-gray900 mt-1">
            {t('analytics.subtitle', 'Vue d\'ensemble de l\'activité de votre organisation')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center bg-white rounded-xl border border-advist-bg p-1">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-240 ${
                  dateRange === range
                    ? 'bg-advist-dark text-white'
                    : 'text-advist-gray900 hover:bg-advist-bg'
                }`}
              >
                {range === 'week' && 'Semaine'}
                {range === 'month' && 'Mois'}
                {range === 'quarter' && 'Trimestre'}
                {range === 'year' && 'Année'}
              </button>
            ))}
          </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-advist-gray900 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-advist-gray900">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.change >= 0 ? (
                    <ArrowUpRight size={14} className="text-advist-success" />
                  ) : (
                    <ArrowDownRight size={14} className="text-advist-error" />
                  )}
                  <span className={`text-sm font-medium ${kpi.change >= 0 ? 'text-advist-success' : 'text-advist-error'}`}>
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-xs text-advist-gray900">{kpi.changeLabel}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${
                kpi.color === 'blue' ? 'bg-advist-gold-light' :
                kpi.color === 'green' ? 'bg-green-50' :
                kpi.color === 'purple' ? 'bg-advist-surface-dark' :
                'bg-advist-gold-light'
              }`}>
                <kpi.icon size={24} className={`${
                  kpi.color === 'blue' ? 'text-advist-gray900' :
                  kpi.color === 'green' ? 'text-advist-success' :
                  kpi.color === 'purple' ? 'text-advist-gray900' :
                  'text-advist-gold-dark'
                }`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-advist-gray900">Évolution mensuelle</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-advist-dark" />
                <span className="text-advist-gray900">Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-advist-success" />
                <span className="text-advist-gray900">Signatures</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-advist-dark" />
                <span className="text-advist-gray900">Workflows</span>
              </div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: '200px' }}>
                  <div
                    className="w-full bg-advist-success rounded-t transition-all hover:bg-advist-success"
                    style={{ height: `${(data.signatures / 700) * 100}%` }}
                    title={`Signatures: ${data.signatures}`}
                  />
                  <div
                    className="w-full bg-advist-dark transition-all hover:bg-advist-dark"
                    style={{ height: `${(data.documents / 700) * 100}%` }}
                    title={`Documents: ${data.documents}`}
                  />
                  <div
                    className="w-full bg-advist-dark rounded-b transition-all hover:bg-advist-dark"
                    style={{ height: `${(data.workflows / 700) * 100}%` }}
                    title={`Workflows: ${data.workflows}`}
                  />
                </div>
                <span className="text-xs text-advist-gray900">{data.month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Document Types Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-6">Types de documents</h2>

          {/* Simple Donut representation */}
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {documentsByType.reduce((acc, item, index) => {
                  const prevTotal = documentsByType.slice(0, index).reduce((sum, i) => sum + i.value, 0);
                  const circumference = 2 * Math.PI * 35;
                  const strokeDasharray = `${(item.value / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((prevTotal / 100) * circumference);

                  acc.push(
                    <circle
                      key={item.label}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all hover:opacity-80"
                    />
                  );
                  return acc;
                }, [] as React.ReactNode[])}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-advist-gray900">1,247</p>
                  <p className="text-xs text-advist-gray900">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {documentsByType.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-advist-gray900">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-advist-gray900">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-6">Statut des workflows</h2>

          <div className="space-y-4">
            {workflowStatus.map((status) => (
              <div key={status.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-advist-gray900">{status.label}</span>
                  <span className="text-sm font-medium text-advist-gray900">{status.value}%</span>
                </div>
                <div className="h-2 bg-advist-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${status.value}%`, backgroundColor: status.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-advist-bg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-advist-gray900">Taux de complétion</span>
              <span className="text-lg font-bold text-advist-success">68%</span>
            </div>
          </div>
        </Card>

        {/* Top Signers */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-6">Top signataires</h2>

          <div className="space-y-4">
            {topSigners.map((signer, index) => (
              <div key={signer.name} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-advist-dark text-white text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-advist-gray900 truncate">{signer.name}</p>
                  <p className="text-xs text-advist-gray900 truncate">{signer.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-advist-gray900">{signer.count}</p>
                  <p className="text-xs text-advist-gray900">signatures</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-6">Activité récente</h2>

          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${colorClass}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-advist-gray900">
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-advist-gray900 mt-0.5">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="ghost" className="w-full mt-4">
            Voir toute l'activité
          </Button>
        </Card>
      </div>

      {/* Department Stats */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-advist-gray900">Performance par département</h2>
          <Button variant="outline" size="sm">
            <Filter size={14} className="mr-2" />
            Filtrer
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-advist-bg">
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">Département</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Documents</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Signatures</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Taux complétion</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept) => (
                <tr key={dept.name} className="border-b border-advist-bg hover:bg-advist-bg">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-advist-bg rounded-xl">
                        <Building2 size={16} className="text-advist-gray900" />
                      </div>
                      <span className="font-medium text-advist-gray900">{dept.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-medium text-advist-gray900">{dept.documents}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-medium text-advist-gray900">{dept.signatures}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-advist-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dept.completion >= 90 ? 'bg-advist-success' :
                            dept.completion >= 80 ? 'bg-advist-dark' :
                            'bg-advist-gold'
                          }`}
                          style={{ width: `${dept.completion}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-advist-gray900 w-10">{dept.completion}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp size={14} className="text-advist-success" />
                      <span className="text-sm text-advist-success">+5.2%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compliance & Audit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle size={24} className="text-advist-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-advist-gray900">Conformité OHADA</h2>
              <p className="text-sm text-advist-gray900">Statut de conformité réglementaire</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Archivage légal', status: 'compliant', detail: '100% conforme' },
              { label: 'Signatures électroniques', status: 'compliant', detail: 'Certifié eIDAS' },
              { label: 'Horodatage', status: 'compliant', detail: 'TSA qualifié' },
              { label: 'Traçabilité', status: 'compliant', detail: 'Audit complet' },
              { label: 'Conservation', status: 'warning', detail: '5 docs à archiver' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-advist-bg rounded-xl">
                <div className="flex items-center gap-3">
                  {item.status === 'compliant' ? (
                    <CheckCircle size={18} className="text-advist-success" />
                  ) : (
                    <AlertTriangle size={18} className="text-advist-gold-dark" />
                  )}
                  <span className="text-sm font-medium text-advist-gray900">{item.label}</span>
                </div>
                <Badge variant={item.status === 'compliant' ? 'success' : 'warning'}>
                  {item.detail}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-advist-gold-light rounded-xl">
              <Eye size={24} className="text-advist-gray900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-advist-gray900">Résumé d'audit</h2>
              <p className="text-sm text-advist-gray900">30 derniers jours</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Actions tracées', value: '12,456', icon: Activity, color: 'blue' },
              { label: 'Connexions', value: '3,892', icon: Users, color: 'green' },
              { label: 'Documents consultés', value: '8,234', icon: Eye, color: 'purple' },
              { label: 'Modifications', value: '1,567', icon: FileText, color: 'orange' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-advist-bg rounded-xl">
                <stat.icon size={20} className={`mb-2 ${
                  stat.color === 'blue' ? 'text-advist-gray900' :
                  stat.color === 'green' ? 'text-advist-success' :
                  stat.color === 'purple' ? 'text-advist-gray900' :
                  'text-advist-gold-dark'
                }`} />
                <p className="text-xl font-bold text-advist-gray900">{stat.value}</p>
                <p className="text-xs text-advist-gray900">{stat.label}</p>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            <FileText size={16} className="mr-2" />
            Générer rapport d'audit
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
