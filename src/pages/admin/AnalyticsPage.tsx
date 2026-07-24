import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileSignature,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';
import { PrintButton } from '../../shared/PrintEngine';

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

interface MonthlyDataItem {
  month: string;
  documents: number;
  signatures: number;
  workflows: number;
}

interface TopSigner {
  name: string;
  role: string;
  count: number;
  avatar: string;
}

interface DepartmentStat {
  name: string;
  documents: number;
  signatures: number;
  completion: number;
}

const MONTH_NAMES = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sept',
  'Oct',
  'Nov',
  'Déc',
];
const TYPE_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#6B7280',
  '#EF4444',
  '#14B8A6',
  '#EC4899',
];
const WF_STATUS_COLORS: Record<string, string> = {
  completed: '#10B981',
  active: '#3B82F6',
  paused: '#F59E0B',
  cancelled: '#EF4444',
  failed: '#EF4444',
};
const WF_STATUS_LABELS: Record<string, string> = {
  completed: 'Complétés',
  active: 'En cours',
  paused: 'En attente',
  cancelled: 'Annulés',
  failed: 'Échoués',
};

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const orgId = user?.organization?.id;
  const [dateRange, setDateRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  // State for all analytics data
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [documentsByType, setDocumentsByType] = useState<ChartData[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataItem[]>([]);
  const [topSigners, setTopSigners] = useState<TopSigner[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);

  const fetchAnalytics = async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const [
        docCountRes,
        sigCountRes,
        activeWfRes,
        docTypesRes,
        wfStatusRes,
        docsForMonthly,
        sigsForMonthly,
        wfForMonthly,
        topSignersRes,
        auditLogsRes,
        deptDocsRes,
      ] = await Promise.all([
        // KPI: total documents
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .is('deleted_at', null),
        // KPI: total signatures completed
        supabase
          .from('document_signatures')
          .select('*, documents!inner(organization_id)', { count: 'exact', head: true })
          .eq('documents.organization_id', orgId)
          .eq('status', 'signed'),
        // KPI: active workflows
        supabase
          .from('workflow_instances')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'active'),
        // Documents by type (with type name)
        supabase
          .from('documents')
          .select('document_type_id, document_types(name)')
          .eq('organization_id', orgId)
          .is('deleted_at', null),
        // Workflow status distribution
        supabase.from('workflow_instances').select('status').eq('organization_id', orgId),
        // Documents created per month (last 12 months)
        supabase
          .from('documents')
          .select('created_at')
          .eq('organization_id', orgId)
          .is('deleted_at', null)
          .gte(
            'created_at',
            new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString()
          ),
        // Signatures per month
        supabase
          .from('document_signatures')
          .select('created_at, documents!inner(organization_id)')
          .eq('documents.organization_id', orgId)
          .eq('status', 'signed')
          .gte(
            'created_at',
            new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString()
          ),
        // Workflows per month
        supabase
          .from('workflow_instances')
          .select('created_at')
          .eq('organization_id', orgId)
          .gte(
            'created_at',
            new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString()
          ),
        // Top signers
        supabase
          .from('document_signatures')
          .select(
            'user_id, profiles!document_signatures_user_id_fkey(first_name, last_name, job_title), documents!inner(organization_id)'
          )
          .eq('documents.organization_id', orgId)
          .eq('status', 'signed'),
        // Recent activity from audit logs
        supabase
          .from('audit_logs')
          .select(
            'id, action, resource_type, resource_name, user_id, created_at, profiles:user_id(first_name, last_name)'
          )
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(5),
        // Department stats: documents per department
        supabase
          .from('documents')
          .select(
            'created_by, profiles!documents_created_by_fkey(department_id, departments:department_id(name))'
          )
          .eq('organization_id', orgId)
          .is('deleted_at', null),
      ]);

      // --- KPIs ---
      const totalDocs = docCountRes.count ?? 0;
      const totalSigs = sigCountRes.count ?? 0;
      const activeWfs = activeWfRes.count ?? 0;

      setTotalDocuments(totalDocs);
      setKpiData([
        {
          label: 'Documents traités',
          value: totalDocs.toLocaleString('fr-FR'),
          change: 0,
          changeLabel: '',
          icon: FileText,
          color: 'blue',
        },
        {
          label: 'Signatures effectuées',
          value: totalSigs.toLocaleString('fr-FR'),
          change: 0,
          changeLabel: '',
          icon: FileSignature,
          color: 'green',
        },
        {
          label: 'Workflows actifs',
          value: activeWfs.toLocaleString('fr-FR'),
          change: 0,
          changeLabel: '',
          icon: Activity,
          color: 'purple',
        },
        {
          label: 'Temps moyen validation',
          value: '-',
          change: 0,
          changeLabel: '',
          icon: Clock,
          color: 'orange',
        },
      ]);

      // --- Documents by type ---
      if (docTypesRes.data) {
        const typeCounts: Record<string, number> = {};
        for (const doc of docTypesRes.data as any[]) {
          const typeName = doc.document_types?.name || 'Autres';
          typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
        }
        const total = Object.values(typeCounts).reduce((a, b) => a + b, 0) || 1;
        const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        setDocumentsByType(
          sorted.map(([label, count], idx) => ({
            label,
            value: Math.round((count / total) * 100),
            color: TYPE_COLORS[idx % TYPE_COLORS.length],
          }))
        );
      }

      // --- Workflow status ---
      if (wfStatusRes.data) {
        const statusCounts: Record<string, number> = {};
        for (const wf of wfStatusRes.data) {
          statusCounts[wf.status] = (statusCounts[wf.status] || 0) + 1;
        }
        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
        setWorkflowStatus(
          Object.entries(statusCounts).map(([status, count]) => ({
            label: WF_STATUS_LABELS[status] || status,
            value: Math.round((count / total) * 100),
            color: WF_STATUS_COLORS[status] || '#6B7280',
          }))
        );
      }

      // --- Monthly data ---
      const now = new Date();
      const monthBuckets: MonthlyDataItem[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthBuckets.push({
          month: MONTH_NAMES[d.getMonth()],
          documents: 0,
          signatures: 0,
          workflows: 0,
        });
      }
      const bucketIndex = (dateStr: string) => {
        const d = new Date(dateStr);
        const monthsDiff =
          (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        return 11 - monthsDiff;
      };

      if (docsForMonthly.data) {
        for (const doc of docsForMonthly.data) {
          const idx = bucketIndex(doc.created_at);
          if (idx >= 0 && idx < 12) monthBuckets[idx].documents++;
        }
      }
      if (sigsForMonthly.data) {
        for (const sig of sigsForMonthly.data) {
          const idx = bucketIndex(sig.created_at);
          if (idx >= 0 && idx < 12) monthBuckets[idx].signatures++;
        }
      }
      if (wfForMonthly.data) {
        for (const wf of wfForMonthly.data) {
          const idx = bucketIndex(wf.created_at);
          if (idx >= 0 && idx < 12) monthBuckets[idx].workflows++;
        }
      }
      setMonthlyData(monthBuckets);

      // --- Top signers ---
      if (topSignersRes.data) {
        const signerCounts: Record<string, { name: string; role: string; count: number }> = {};
        for (const sig of topSignersRes.data as any[]) {
          const uid = sig.user_id;
          if (!signerCounts[uid]) {
            const p = sig.profiles;
            signerCounts[uid] = {
              name: p ? `${p.first_name} ${p.last_name}`.trim() : '-',
              role: p?.job_title || '',
              count: 0,
            };
          }
          signerCounts[uid].count++;
        }
        const sorted = Object.values(signerCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopSigners(
          sorted.map((s) => ({
            ...s,
            avatar: s.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
          }))
        );
      }

      // --- Recent activity ---
      if (auditLogsRes.data) {
        const actionMap: Record<string, { type: ActivityItem['type']; action: string }> = {
          sign: { type: 'signature', action: 'a signé' },
          create: { type: 'document', action: 'a créé' },
          approve: { type: 'workflow', action: 'a approuvé' },
          reject: { type: 'workflow', action: 'a rejeté' },
          login: { type: 'user', action: "s'est connecté" },
          update: { type: 'document', action: 'a modifié' },
          delete: { type: 'document', action: 'a supprimé' },
        };
        setRecentActivity(
          (auditLogsRes.data as any[]).map((log) => {
            const mapped = actionMap[log.action] || {
              type: 'document' as const,
              action: log.action,
            };
            const profile = log.profiles;
            return {
              id: log.id,
              type: mapped.type,
              action: mapped.action,
              user: profile ? `${profile.first_name} ${profile.last_name}`.trim() : '-',
              target: log.resource_name || '',
              timestamp: new Date(log.created_at),
            };
          })
        );
      }

      // --- Department stats ---
      if (deptDocsRes.data) {
        const deptCounts: Record<string, { documents: number }> = {};
        for (const doc of deptDocsRes.data as any[]) {
          const deptName = doc.profiles?.departments?.name || 'Non assigné';
          if (!deptCounts[deptName]) deptCounts[deptName] = { documents: 0 };
          deptCounts[deptName].documents++;
        }
        setDepartmentStats(
          Object.entries(deptCounts)
            .sort((a, b) => b[1].documents - a[1].documents)
            .map(([name, data]) => ({
              name,
              documents: data.documents,
              signatures: 0,
              completion: 0,
            }))
        );
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [orgId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics().finally(() => setIsRefreshing(false));
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signature':
        return FileSignature;
      case 'document':
        return FileText;
      case 'workflow':
        return Activity;
      case 'user':
        return Users;
      default:
        return FileText;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'signature':
        return 'text-advist-success bg-green-50';
      case 'document':
        return 'text-advist-gray900 bg-advist-gold-light';
      case 'workflow':
        return 'text-advist-gray900 bg-advist-surface-dark';
      case 'user':
        return 'text-advist-gold-dark bg-advist-gold-light';
      default:
        return 'text-advist-text-secondary bg-advist-surface-dark';
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
            {t('analytics.subtitle', "Vue d'ensemble de l'activité de votre organisation")}
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
          <PrintButton
            config={{
              title: 'Rapport analytique',
              appName: 'Advist',
              format: 'A4',
              orientation: 'landscape',
            }}
          >
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi, index) => (
                  <div key={index} className="p-5 border rounded-xl">
                    <p className="text-sm text-advist-text-secondary">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </div>
                ))}
              </div>
              {/* Documents by type */}
              <div>
                <h3 className="font-semibold mb-2">Documents par type</h3>
                {documentsByType.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                ))}
              </div>
              {/* Workflow status */}
              <div>
                <h3 className="font-semibold mb-2">Statut des workflows</h3>
                {workflowStatus.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
              {/* Department stats */}
              <div>
                <h3 className="font-semibold mb-2">Performance par département</h3>
                {departmentStats.map((dept, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{dept.name}</span>
                    <span>
                      {dept.documents} docs, {dept.signatures} signatures, {dept.completion}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </PrintButton>
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
                  <span
                    className={`text-sm font-medium ${kpi.change >= 0 ? 'text-advist-success' : 'text-advist-error'}`}
                  >
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-xs text-advist-gray900">{kpi.changeLabel}</span>
                </div>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  kpi.color === 'blue'
                    ? 'bg-advist-gold-light'
                    : kpi.color === 'green'
                      ? 'bg-green-50'
                      : kpi.color === 'purple'
                        ? 'bg-advist-surface-dark'
                        : 'bg-advist-gold-light'
                }`}
              >
                <kpi.icon
                  size={24}
                  className={`${
                    kpi.color === 'blue'
                      ? 'text-advist-gray900'
                      : kpi.color === 'green'
                        ? 'text-advist-success'
                        : kpi.color === 'purple'
                          ? 'text-advist-gray900'
                          : 'text-advist-gold-dark'
                  }`}
                />
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
                  const prevTotal = documentsByType
                    .slice(0, index)
                    .reduce((sum, i) => sum + i.value, 0);
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
                  <p className="text-2xl font-bold text-advist-gray900">
                    {totalDocuments.toLocaleString('fr-FR')}
                  </p>
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
              <span className="text-lg font-bold text-advist-success">
                {workflowStatus.find((s) => s.label === 'Complétés')?.value ?? 0}%
              </span>
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
                      <span className="font-medium">{activity.user}</span> {activity.action}{' '}
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
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">
                  Département
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">
                  Documents
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">
                  Signatures
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">
                  Taux complétion
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">
                  Tendance
                </th>
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
                            dept.completion >= 90
                              ? 'bg-advist-success'
                              : dept.completion >= 80
                                ? 'bg-advist-dark'
                                : 'bg-advist-gold'
                          }`}
                          style={{ width: `${dept.completion}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-advist-gray900 w-10">
                        {dept.completion}%
                      </span>
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
              {
                label: 'Signatures électroniques',
                status: 'compliant',
                detail: 'Certifié eIDAS',
              },
              { label: 'Horodatage', status: 'compliant', detail: 'TSA qualifié' },
              { label: 'Traçabilité', status: 'compliant', detail: 'Audit complet' },
              { label: 'Conservation', status: 'warning', detail: '5 docs à archiver' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 bg-advist-bg rounded-xl"
              >
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
                <stat.icon
                  size={20}
                  className={`mb-2 ${
                    stat.color === 'blue'
                      ? 'text-advist-gray900'
                      : stat.color === 'green'
                        ? 'text-advist-success'
                        : stat.color === 'purple'
                          ? 'text-advist-gray900'
                          : 'text-advist-gold-dark'
                  }`}
                />
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
