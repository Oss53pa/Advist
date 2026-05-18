import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  GitBranch,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus,
  X,
  PenTool,
  Eye,
  Calendar,
  ChevronRight,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Badge, Avatar, StatusBadge, Button, Modal } from '../components/ui';
import { NewDocumentForm } from '../components/documents/NewDocumentForm';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { PrintButton } from '../shared/PrintEngine';
import { DocumentQuotaCard } from '../components/gating';
import { useDocumentQuota } from '../hooks/useTenantPlan';
import { KpiCardPremium, HeroBrandHeader, MiniMetricStack } from '../components/premium';

interface RecentDoc {
  id: string;
  title: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  date: string;
  type: string;
  owner: string;
}

interface PendingTask {
  id: string;
  document: string;
  documentId: string;
  type: 'approval' | 'review' | 'signature';
  typeLabel: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  assignedBy: { name: string; avatar: string };
}

const getQuickActions = (t: (key: string, fallback?: string) => string) => [
  {
    id: 1,
    label: t('dashboard.actions.newDocument', 'Nouveau document'),
    icon: Plus,
    action: 'new-doc',
  },
  {
    id: 2,
    label: t('dashboard.actions.startWorkflow', 'Lancer un workflow'),
    icon: GitBranch,
    action: 'new-workflow',
  },
  { id: 3, label: t('dashboard.actions.sign', 'Signer'), icon: PenTool, action: 'sign' },
];

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const documentQuota = useDocumentQuota();

  // Stats state
  const [docCount, setDocCount] = useState(0);
  const [activeWorkflowCount, setActiveWorkflowCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);

  // Recent documents state
  const [recentDocuments, setRecentDocuments] = useState<RecentDoc[]>([]);

  // Pending tasks state
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);

  // Today activity state
  const [todayApproved, setTodayApproved] = useState(0);
  const [todaySignatures, setTodaySignatures] = useState(0);
  const [todayWorkflows, setTodayWorkflows] = useState(0);

  const orgId = user?.organization?.id;

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [
          docCountRes,
          activeWfRes,
          pendingRes,
          approvedRes,
          recentDocsRes,
          tasksRes,
          todayApprovedRes,
          todaySignaturesRes,
          todayWorkflowsRes,
        ] = await Promise.all([
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .is('deleted_at', null),
          supabase
            .from('workflow_instances')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'active'),
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'pending_review')
            .is('deleted_at', null),
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'approved')
            .is('deleted_at', null),
          supabase
            .from('documents')
            .select(
              'id, title, status, created_at, document_type_id, created_by, document_types(name), profiles!documents_created_by_fkey(first_name, last_name)'
            )
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('workflow_assignees')
            .select(
              `
              id,
              status,
              step:workflow_steps(
                id,
                name,
                step_type,
                due_date,
                instance:workflow_instances(
                  id,
                  name,
                  document_id,
                  document:documents(id, title),
                  started_by,
                  starter:profiles!workflow_instances_started_by_fkey(first_name, last_name)
                )
              )
            `
            )
            .eq('user_id', user?.id)
            .eq('status', 'pending')
            .limit(10),
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'approved')
            .gte('approved_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
          supabase
            .from('document_signatures')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'signed')
            .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
          supabase
            .from('workflow_instances')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        ]);

        setDocCount(docCountRes.count ?? 0);
        setActiveWorkflowCount(activeWfRes.count ?? 0);
        setPendingCount(pendingRes.count ?? 0);
        setApprovedCount(approvedRes.count ?? 0);

        if (recentDocsRes.data) {
          setRecentDocuments(
            recentDocsRes.data.map((doc: any) => ({
              id: doc.id,
              title: doc.title,
              status: doc.status === 'pending_review' ? 'pending' : doc.status,
              date: doc.created_at,
              type: doc.document_types?.name || '-',
              owner:
                doc.created_by === user?.id
                  ? 'Vous'
                  : doc.profiles
                    ? `${doc.profiles.first_name} ${doc.profiles.last_name}`.trim()
                    : '-',
            }))
          );
        }

        if (tasksRes.data) {
          const mapped: PendingTask[] = [];
          for (const assignee of tasksRes.data as any[]) {
            const step = assignee.step;
            if (!step?.instance) continue;
            const inst = step.instance;
            const stepType = step.step_type as 'approval' | 'review' | 'signature';
            const typeLabels: Record<string, string> = {
              approval: t('dashboard.taskTypes.approval', 'Approbation'),
              review: t('dashboard.taskTypes.review', 'Revue'),
              signature: t('dashboard.taskTypes.signature', 'Signature'),
            };
            mapped.push({
              id: assignee.id,
              document: inst.document?.title || inst.name,
              documentId: inst.document?.id || inst.id,
              type: stepType,
              typeLabel: typeLabels[stepType] || stepType,
              deadline: step.due_date || '',
              priority: step.due_date
                ? new Date(step.due_date).getTime() - Date.now() < 24 * 60 * 60 * 1000
                  ? 'high'
                  : new Date(step.due_date).getTime() - Date.now() < 72 * 60 * 60 * 1000
                    ? 'medium'
                    : 'low'
                : 'low',
              assignedBy: {
                name: inst.starter
                  ? `${inst.starter.first_name} ${inst.starter.last_name}`.trim()
                  : '-',
                avatar: '',
              },
            });
          }
          setPendingTasks(mapped);
        }

        setTodayApproved(todayApprovedRes.count ?? 0);
        setTodaySignatures(todaySignaturesRes.count ?? 0);
        setTodayWorkflows(todayWorkflowsRes.count ?? 0);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [orgId, user?.id, t]);

  const quickActions = getQuickActions(t);
  const [showTaskDetail, setShowTaskDetail] = useState<PendingTask | null>(null);

  const basePath = location.pathname.startsWith('/user')
    ? '/user'
    : location.pathname.startsWith('/admin')
      ? '/admin'
      : '/app';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Bonjour');
    if (hour < 18) return t('dashboard.goodAfternoon', 'Bon apres-midi');
    return t('dashboard.goodEvening', 'Bonsoir');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-doc':
        if (documentQuota.limitReached) {
          window.open('https://atlas-studio.org/applications/advist', '_blank');
          return;
        }
        setShowNewDocModal(true);
        break;
      case 'new-workflow':
        navigate(`${basePath}/workflows`);
        break;
      case 'sign':
        navigate(`${basePath}/signatures`);
        break;
    }
  };

  const handleTaskClick = (task: (typeof pendingTasks)[0]) => {
    setShowTaskDetail(task);
  };

  const handleTaskAction = (action: 'approve' | 'reject' | 'view') => {
    if (!showTaskDetail) return;
    if (action === 'view') {
      navigate(`${basePath}/documents/${showTaskDetail.documentId}`);
    } else {
      setShowTaskDetail(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('dashboard.today', "Aujourd'hui");
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return t('dashboard.tomorrow', 'Demain');
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getDeadlineUrgency = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 24) return 'urgent';
    if (hoursLeft < 72) return 'soon';
    return 'normal';
  };

  // Mini metrics for the activity panel
  const activityMetrics = useMemo(
    () => [
      { label: 'Approuves', value: todayApproved, trend: 'up' as const, color: 'success' as const },
      {
        label: 'Signatures',
        value: todaySignatures,
        trend: 'up' as const,
        color: 'default' as const,
      },
      {
        label: 'Workflows',
        value: todayWorkflows,
        trend: 'neutral' as const,
        color: 'warning' as const,
      },
    ],
    [todayApproved, todaySignatures, todayWorkflows]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <HeroBrandHeader
          title={`${getGreeting()}, ${user?.first_name || 'Utilisateur'}`}
          subtitle={t('dashboard.subtitle', 'Voici un apercu de votre activite documentaire')}
          chips={[
            { label: user?.organization?.name || 'Organisation', variant: 'default' },
            { label: user?.role || 'Admin', variant: 'accent' },
          ]}
        />

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <PrintButton config={{ title: 'Tableau de bord', appName: 'Advist' }}>
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Documents', value: docCount },
                  { label: 'Workflows actifs', value: activeWorkflowCount },
                  { label: 'En attente', value: pendingCount },
                  { label: 'Approuves', value: approvedCount },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-[#e1e5ec]">
                    <p className="text-sm font-medium text-[#5e6b7d]">{stat.label}</p>
                    <p className="text-4xl font-bold text-[#0f172a]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </PrintButton>
          {quickActions.map((action) => {
            const isNewDoc = action.action === 'new-doc';
            const blocked = isNewDoc && documentQuota.limitReached;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.action)}
                disabled={blocked}
                title={blocked ? 'Limite mensuelle atteinte' : action.label}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                  ${
                    blocked
                      ? 'bg-[#e1e5ec] text-[#8b95a5] cursor-not-allowed'
                      : isNewDoc
                        ? 'bg-[#0f172a] text-white hover:bg-[#1e293b] shadow-lg shadow-[#0f172a]/15'
                        : 'bg-white text-[#0f172a] border border-[#e1e5ec] hover:border-[#b8a47e] hover:shadow-md'
                  }
                `}
              >
                <action.icon size={16} />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document quota card */}
      <DocumentQuotaCard />

      {/* KPI Cards — Premium Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardPremium
          eyebrow={t('dashboard.stats.documents', 'Documents')}
          value={isLoading ? '...' : docCount}
          icon={<FileText size={20} />}
          delta={docCount > 0 ? { value: `${docCount} total`, type: 'neutral' } : undefined}
        />
        <KpiCardPremium
          eyebrow={t('dashboard.stats.activeWorkflows', 'Workflows actifs')}
          value={isLoading ? '...' : activeWorkflowCount}
          icon={<GitBranch size={20} />}
          delta={activeWorkflowCount > 0 ? { value: 'En cours', type: 'positive' } : undefined}
        />
        <KpiCardPremium
          eyebrow={t('dashboard.stats.pending', 'En attente')}
          value={isLoading ? '...' : pendingCount}
          icon={<Clock size={20} />}
          delta={
            pendingCount > 0 ? { value: `${pendingCount} a traiter`, type: 'negative' } : undefined
          }
        />
        <KpiCardPremium
          eyebrow={t('dashboard.stats.approved', 'Approuves')}
          value={isLoading ? '...' : approvedCount}
          icon={<CheckCircle size={20} />}
          delta={approvedCount > 0 ? { value: 'Valides', type: 'positive' } : undefined}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending Tasks - 2 columns */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-[#e1e5ec] overflow-hidden shadow-card">
            <div className="flex items-center justify-between p-6 border-b border-[#e1e5ec]">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">
                  {t('dashboard.pendingTasks', 'Taches en attente')}
                </h2>
                <p className="text-sm text-[#5e6b7d] mt-0.5">
                  {pendingTasks.length}{' '}
                  {t('dashboard.tasksRequireAttention', 'taches necessitent votre attention')}
                </p>
              </div>
              <Link
                to={`${basePath}/workflows`}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] hover:text-[#b8a47e] transition-colors"
              >
                {t('dashboard.viewAll', 'Voir tout')}
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-[#e1e5ec]">
              {pendingTasks.map((task) => {
                const urgency = getDeadlineUrgency(task.deadline);
                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-[#f7f8fa] transition-all duration-200 text-left group"
                  >
                    {/* Priority bar */}
                    <div
                      className={`w-1 h-12 rounded-full flex-shrink-0 ${
                        task.priority === 'high'
                          ? 'bg-red-500'
                          : task.priority === 'medium'
                            ? 'bg-[#b8a47e]'
                            : 'bg-emerald-500'
                      }`}
                    />
                    <Avatar name={task.assignedBy.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#0f172a] truncate">{task.document}</p>
                        <Badge
                          variant={
                            task.type === 'signature'
                              ? 'info'
                              : task.type === 'approval'
                                ? 'warning'
                                : 'secondary'
                          }
                          size="sm"
                        >
                          {task.type === 'signature' && <PenTool size={10} className="mr-1" />}
                          {task.type === 'approval' && <CheckCircle size={10} className="mr-1" />}
                          {task.type === 'review' && <Eye size={10} className="mr-1" />}
                          {task.typeLabel}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#5e6b7d] mt-1">
                        {t('dashboard.assignedBy', 'Assigne par')} {task.assignedBy.name}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        urgency === 'urgent'
                          ? 'bg-red-50 text-red-600'
                          : urgency === 'soon'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[#f7f8fa] text-[#5e6b7d]'
                      }`}
                    >
                      <Calendar size={12} />
                      {formatDate(task.deadline)}
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-[#8b95a5] group-hover:text-[#0f172a] transition-colors"
                    />
                  </button>
                );
              })}
            </div>

            {pendingTasks.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <p className="text-[#0f172a] font-semibold">
                  {t('dashboard.allCaughtUp', 'Vous etes a jour !')}
                </p>
                <p className="text-sm text-[#5e6b7d] mt-1">
                  {t('dashboard.noTasksPending', 'Aucune tache en attente')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Urgent Alert */}
          {pendingTasks.some((t) => getDeadlineUrgency(t.deadline) === 'urgent') && (
            <div className="bg-gradient-to-r from-[#f5f0e8] to-amber-50/50 rounded-2xl p-5 border border-[#b8a47e]/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#b8a47e] rounded-xl flex-shrink-0">
                  <Zap size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f172a] text-sm">
                    {t('dashboard.urgentAttention', 'Attention urgente')}
                  </h3>
                  <p className="text-xs text-[#5e6b7d] mt-1 leading-relaxed">
                    {t(
                      'dashboard.urgentTasksCount',
                      'Taches dont la date limite approche dans les 24h'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Documents */}
          <div className="bg-white rounded-2xl border border-[#e1e5ec] overflow-hidden shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-[#e1e5ec]">
              <h2 className="text-sm font-bold text-[#0f172a]">
                {t('dashboard.recentDocuments', 'Documents recents')}
              </h2>
              <Link
                to={`${basePath}/documents`}
                className="p-2 hover:bg-[#f7f8fa] rounded-xl transition-colors"
              >
                <ArrowRight size={16} className="text-[#0f172a]" />
              </Link>
            </div>

            <div className="divide-y divide-[#e1e5ec]">
              {recentDocuments.slice(0, 4).map((doc) => (
                <Link
                  key={doc.id}
                  to={`${basePath}/documents/${doc.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-[#f7f8fa] transition-colors group"
                >
                  <div className="p-2 bg-[#f7f8fa] rounded-xl group-hover:bg-[#0f172a] transition-colors">
                    <FileText
                      size={16}
                      className="text-[#5e6b7d] group-hover:text-[#b8a47e] transition-colors"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0f172a] text-sm truncate">{doc.title}</p>
                    <p className="text-[11px] text-[#8b95a5] mt-0.5">
                      {doc.type} &middot; {formatDate(doc.date)}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </Link>
              ))}
            </div>

            <Link
              to={`${basePath}/documents`}
              className="flex items-center justify-center gap-2 p-4 text-xs font-semibold text-[#0f172a] hover:text-[#b8a47e] hover:bg-[#f7f8fa] transition-colors border-t border-[#e1e5ec]"
            >
              {t('dashboard.viewAllDocuments', 'Voir tous les documents')}
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Activity Summary — Midnight panel */}
          <div className="bg-[#0f172a] rounded-2xl p-5 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                {t('dashboard.todayActivity', 'Activite du jour')}
              </h3>
              <Sparkles size={16} className="text-[#b8a47e]" />
            </div>
            <MiniMetricStack metrics={activityMetrics} columns={3} />
          </div>
        </div>
      </div>

      {/* New Document Modal */}
      <Modal
        isOpen={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
        title={t('dashboard.newDocument', 'Nouveau document')}
        size="lg"
      >
        <NewDocumentForm onClose={() => setShowNewDocModal(false)} basePath={basePath} />
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!showTaskDetail}
        onClose={() => setShowTaskDetail(null)}
        title={t('dashboard.taskDetail', 'Detail de la tache')}
        size="md"
      >
        {showTaskDetail && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-[#f7f8fa] rounded-xl">
              <div className="p-3 bg-white rounded-xl border border-[#e1e5ec]">
                <FileText size={22} className="text-[#0f172a]" />
              </div>
              <div>
                <p className="font-bold text-[#0f172a]">{showTaskDetail.document}</p>
                <p className="text-sm text-[#5e6b7d] mt-1">
                  {t('dashboard.assignedBy', 'Assigne par')} {showTaskDetail.assignedBy.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#f7f8fa] rounded-xl">
                <p className="text-[10px] text-[#8b95a5] uppercase tracking-wider font-bold">
                  {t('dashboard.taskType', 'Type')}
                </p>
                <p className="font-semibold text-[#0f172a] mt-1">{showTaskDetail.typeLabel}</p>
              </div>
              <div className="p-4 bg-[#f7f8fa] rounded-xl">
                <p className="text-[10px] text-[#8b95a5] uppercase tracking-wider font-bold">
                  {t('dashboard.deadline', 'Echeance')}
                </p>
                <p className="font-semibold text-[#0f172a] mt-1">
                  {formatDate(showTaskDetail.deadline)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#5e6b7d]">{t('dashboard.priority', 'Priorite')}:</span>
              <Badge
                variant={
                  showTaskDetail.priority === 'high'
                    ? 'danger'
                    : showTaskDetail.priority === 'medium'
                      ? 'warning'
                      : 'success'
                }
              >
                {showTaskDetail.priority === 'high'
                  ? t('dashboard.high', 'Haute')
                  : showTaskDetail.priority === 'medium'
                    ? t('dashboard.medium', 'Moyenne')
                    : t('dashboard.low', 'Basse')}
              </Badge>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#e1e5ec]">
              <Button variant="outline" className="flex-1" onClick={() => handleTaskAction('view')}>
                <Eye size={16} className="mr-2" />
                {t('dashboard.viewDocument', 'Voir le document')}
              </Button>
              {showTaskDetail.type === 'approval' && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleTaskAction('reject')}
                  >
                    <X size={16} className="mr-2" />
                    {t('dashboard.reject', 'Refuser')}
                  </Button>
                  <Button className="flex-1" onClick={() => handleTaskAction('approve')}>
                    <CheckCircle size={16} className="mr-2" />
                    {t('dashboard.approve', 'Approuver')}
                  </Button>
                </>
              )}
              {showTaskDetail.type === 'signature' && (
                <Button className="flex-1" onClick={() => navigate(`${basePath}/signatures`)}>
                  <PenTool size={16} className="mr-2" />
                  {t('dashboard.sign', 'Signer')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
