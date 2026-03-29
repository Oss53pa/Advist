import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Upload,
  X,
  PenTool,
  Eye,
  Calendar,
  ChevronRight,
  Zap,
  Bell,
  MoreHorizontal,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, Avatar, StatusBadge, Button, Modal, Input } from '../components/ui';
import { NewDocumentForm } from '../components/documents/NewDocumentForm';
import { useAuthStore } from '../store';

// Mock data - would come from API
const getStats = (t: (key: string, fallback?: string) => string) => [
  {
    label: t('dashboard.stats.documents', 'Documents'),
    value: 156,
    icon: FileText,
    change: '+12%',
    trend: 'up',
    color: 'from-advist-dark to-advist-dark/80',
    bgLight: 'bg-advist-surface-dark',
    textColor: 'text-advist-gray900',
  },
  {
    label: t('dashboard.stats.activeWorkflows', 'Workflows actifs'),
    value: 23,
    icon: GitBranch,
    change: '+5%',
    trend: 'up',
    color: 'from-advist-gold to-advist-gold-dark',
    bgLight: 'bg-advist-gold-light',
    textColor: 'text-advist-gold-dark',
  },
  {
    label: t('dashboard.stats.pending', 'En attente'),
    value: 8,
    icon: Clock,
    change: '-2',
    trend: 'down',
    color: 'from-advist-warning to-advist-gold-dark',
    bgLight: 'bg-advist-gold-light',
    textColor: 'text-advist-gold-dark',
  },
  {
    label: t('dashboard.stats.approved', 'Approuvés'),
    value: 45,
    icon: CheckCircle,
    change: '+18%',
    trend: 'up',
    color: 'from-advist-success to-advist-success/80',
    bgLight: 'bg-green-50',
    textColor: 'text-advist-success',
  },
];

const recentDocuments = [
  {
    id: 1,
    title: 'Contrat de prestation Q4 2024',
    status: 'pending' as const,
    date: '2024-11-28',
    type: 'Contrat',
    owner: 'Marie Dupont',
  },
  {
    id: 2,
    title: 'Rapport financier annuel',
    status: 'approved' as const,
    date: '2024-11-27',
    type: 'Rapport',
    owner: 'Pierre Martin',
  },
  {
    id: 3,
    title: 'Politique de confidentialité',
    status: 'draft' as const,
    date: '2024-11-26',
    type: 'Politique',
    owner: 'Vous',
  },
  {
    id: 4,
    title: 'Accord de partenariat',
    status: 'rejected' as const,
    date: '2024-11-25',
    type: 'Contrat',
    owner: 'Sophie Bernard',
  },
  {
    id: 5,
    title: 'Procédure qualité ISO',
    status: 'approved' as const,
    date: '2024-11-24',
    type: 'Procédure',
    owner: 'Vous',
  },
];

const getPendingTasks = (t: (key: string, fallback?: string) => string) => [
  {
    id: 1,
    document: 'Contrat de prestation Q4 2024',
    documentId: 1,
    type: 'approval' as const,
    typeLabel: t('dashboard.taskTypes.approval', 'Approbation'),
    deadline: '2024-11-29',
    priority: 'high' as const,
    assignedBy: { name: 'Marie Dupont', avatar: '' },
  },
  {
    id: 2,
    document: 'Budget prévisionnel 2025',
    documentId: 5,
    type: 'signature' as const,
    typeLabel: t('dashboard.taskTypes.signature', 'Signature'),
    deadline: '2024-11-30',
    priority: 'medium' as const,
    assignedBy: { name: 'Pierre Martin', avatar: '' },
  },
  {
    id: 3,
    document: 'Procédure qualité v2',
    documentId: 3,
    type: 'review' as const,
    typeLabel: t('dashboard.taskTypes.review', 'Revue'),
    deadline: '2024-12-01',
    priority: 'low' as const,
    assignedBy: { name: 'Sophie Bernard', avatar: '' },
  },
];

const getQuickActions = (t: (key: string, fallback?: string) => string) => [
  { id: 1, label: t('dashboard.actions.newDocument', 'Nouveau document'), icon: Plus, action: 'new-doc' },
  { id: 2, label: t('dashboard.actions.startWorkflow', 'Lancer un workflow'), icon: GitBranch, action: 'new-workflow' },
  { id: 3, label: t('dashboard.actions.sign', 'Signer'), icon: PenTool, action: 'sign' },
];

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  // Get translated data
  const stats = getStats(t);
  const pendingTasks = getPendingTasks(t);
  const quickActions = getQuickActions(t);

  const [showTaskDetail, setShowTaskDetail] = useState<typeof pendingTasks[0] | null>(null);

  // Get the base path for navigation (e.g., /user, /admin, or /app)
  const basePath = location.pathname.startsWith('/user')
    ? '/user'
    : location.pathname.startsWith('/admin')
      ? '/admin'
      : '/app';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Bonjour');
    if (hour < 18) return t('dashboard.goodAfternoon', 'Bon après-midi');
    return t('dashboard.goodEvening', 'Bonsoir');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-doc':
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

  const handleTaskClick = (task: typeof pendingTasks[0]) => {
    setShowTaskDetail(task);
  };

  const handleTaskAction = (action: 'approve' | 'reject' | 'view') => {
    if (!showTaskDetail) return;

    if (action === 'view') {
      navigate(`${basePath}/documents/${showTaskDetail.documentId}`);
    } else {
      // Handle approve/reject
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

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-advist-gray900">
            {getGreeting()}, {user?.first_name || 'Utilisateur'}
          </h1>
          <p className="text-advist-text-secondary mt-2">
            {t('dashboard.subtitle', 'Voici un aperçu de votre activité documentaire')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.action)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                ${action.action === 'new-doc'
                  ? 'bg-advist-dark text-white hover:bg-advist-dark/90 shadow-lg shadow-advist-dark/20'
                  : 'bg-white text-advist-gray900 border border-advist-border hover:border-advist-gold hover:shadow-md'
                }
              `}
            >
              <action.icon size={18} />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-2xl p-6 border border-advist-border hover:border-advist-gold hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="relative flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-advist-text-secondary">{stat.label}</p>
                <p className="text-4xl font-bold text-advist-gray900">{stat.value}</p>
                <div className="flex items-center gap-1.5">
                  {stat.trend === 'up' ? (
                    <TrendingUp size={14} className="text-advist-success" />
                  ) : (
                    <TrendingDown size={14} className="text-advist-gold-dark" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-advist-success' : 'text-advist-gold-dark'}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-advist-text-secondary">{t('dashboard.vsLastMonth', 'vs mois dernier')}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgLight}`}>
                <stat.icon size={24} className={stat.textColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending Tasks - Takes 2 columns */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-advist-border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-advist-border">
              <div>
                <h2 className="text-lg font-semibold text-advist-gray900">
                  {t('dashboard.pendingTasks', 'Tâches en attente')}
                </h2>
                <p className="text-sm text-advist-text-secondary mt-0.5">
                  {pendingTasks.length} {t('dashboard.tasksRequireAttention', 'tâches nécessitent votre attention')}
                </p>
              </div>
              <Link
                to={`${basePath}/workflows`}
                className="flex items-center gap-1.5 text-sm font-medium text-advist-gray900 hover:text-advist-gold-dark transition-all duration-240"
              >
                {t('dashboard.viewAll', 'Voir tout')}
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="divide-y divide-advist-border">
              {pendingTasks.map((task) => {
                const urgency = getDeadlineUrgency(task.deadline);

                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-advist-surface-dark transition-all duration-240 text-left group"
                  >
                    {/* Priority indicator */}
                    <div className={`
                      w-1 h-12 rounded-full flex-shrink-0
                      ${task.priority === 'high' ? 'bg-advist-error' : task.priority === 'medium' ? 'bg-advist-gold' : 'bg-advist-success'}
                    `} />

                    {/* Avatar */}
                    <Avatar name={task.assignedBy.name} size="md" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-advist-gray900 truncate">{task.document}</p>
                        <Badge
                          variant={task.type === 'signature' ? 'info' : task.type === 'approval' ? 'warning' : 'secondary'}
                          size="sm"
                        >
                          {task.type === 'signature' && <PenTool size={10} className="mr-1" />}
                          {task.type === 'approval' && <CheckCircle size={10} className="mr-1" />}
                          {task.type === 'review' && <Eye size={10} className="mr-1" />}
                          {task.typeLabel}
                        </Badge>
                      </div>
                      <p className="text-sm text-advist-text-secondary mt-1">
                        {t('dashboard.assignedBy', 'Assigné par')} {task.assignedBy.name}
                      </p>
                    </div>

                    {/* Deadline */}
                    <div className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium
                      ${urgency === 'urgent' ? 'bg-advist-gold-light text-advist-error' : urgency === 'soon' ? 'bg-advist-gold-light text-advist-gold-dark' : 'bg-advist-surface-dark text-advist-gray900'}
                    `}>
                      <Calendar size={14} />
                      {formatDate(task.deadline)}
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={20} className="text-advist-text-secondary group-hover:text-advist-gray900 transition-all duration-240" />
                  </button>
                );
              })}
            </div>

            {pendingTasks.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-advist-gold-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-advist-success" />
                </div>
                <p className="text-advist-gray900 font-medium">{t('dashboard.allCaughtUp', 'Vous êtes à jour !')}</p>
                <p className="text-sm text-advist-text-secondary mt-1">{t('dashboard.noTasksPending', 'Aucune tâche en attente')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Alert */}
          {pendingTasks.some(t => getDeadlineUrgency(t.deadline) === 'urgent') && (
            <div className="bg-gradient-to-r from-advist-gold-light to-yellow-50 rounded-2xl p-5 border border-advist-gold">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-advist-gold rounded-xl">
                  <Zap size={20} className="text-advist-gray900" />
                </div>
                <div>
                  <h3 className="font-semibold text-advist-gray900">{t('dashboard.urgentAttention', 'Attention urgente')}</h3>
                  <p className="text-sm text-advist-text-secondary mt-1">
                    {t('dashboard.urgentTasksCount', 'Vous avez des tâches dont la date limite approche dans les 24h')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Documents */}
          <div className="bg-white rounded-2xl border border-advist-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-advist-border">
              <h2 className="text-lg font-semibold text-advist-gray900">
                {t('dashboard.recentDocuments', 'Documents récents')}
              </h2>
              <Link
                to={`${basePath}/documents`}
                className="p-2 hover:bg-advist-surface-dark rounded-xl transition-all duration-240"
              >
                <ArrowRight size={18} className="text-advist-gray900" />
              </Link>
            </div>

            <div className="divide-y divide-advist-border">
              {recentDocuments.slice(0, 4).map((doc) => (
                <Link
                  key={doc.id}
                  to={`${basePath}/documents/${doc.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-advist-surface-dark transition-all duration-240 group"
                >
                  <div className="p-2 bg-advist-surface-dark rounded-xl group-hover:bg-advist-dark transition-all duration-240">
                    <FileText size={18} className="text-advist-gray900 group-hover:text-white transition-all duration-240" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-advist-gray900 text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-advist-text-secondary mt-0.5">
                      {doc.type} • {formatDate(doc.date)}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </Link>
              ))}
            </div>

            <Link
              to={`${basePath}/documents`}
              className="flex items-center justify-center gap-2 p-4 text-sm font-medium text-advist-gray900 hover:text-advist-gold-dark hover:bg-advist-surface-dark transition-all duration-240 border-t border-advist-border"
            >
              {t('dashboard.viewAllDocuments', 'Voir tous les documents')}
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Activity Summary */}
          <div className="bg-advist-dark rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('dashboard.todayActivity', "Activité du jour")}</h3>
              <Bell size={18} className="text-advist-gold" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-advist-success rounded-full" />
                <p className="text-sm text-advist-text-muted">{t('dashboard.activity.documentsApproved', { count: 3 })}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-advist-gold rounded-full" />
                <p className="text-sm text-advist-text-muted">{t('dashboard.activity.signaturesCompleted', { count: 2 })}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-advist-warning rounded-full" />
                <p className="text-sm text-advist-text-muted">{t('dashboard.activity.workflowStarted', { count: 1 })}</p>
              </div>
            </div>
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
        title={t('dashboard.taskDetail', 'Détail de la tâche')}
        size="md"
      >
        {showTaskDetail && (
          <div className="space-y-6">
            {/* Document info */}
            <div className="flex items-start gap-4 p-4 bg-advist-surface-dark rounded-xl">
              <div className="p-3 bg-white rounded-xl">
                <FileText size={24} className="text-advist-gray900" />
              </div>
              <div>
                <p className="font-semibold text-advist-gray900">{showTaskDetail.document}</p>
                <p className="text-sm text-advist-text-secondary mt-1">
                  {t('dashboard.assignedBy', 'Assigné par')} {showTaskDetail.assignedBy.name}
                </p>
              </div>
            </div>

            {/* Task details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-advist-surface-dark rounded-xl">
                <p className="text-xs text-advist-text-secondary uppercase tracking-wide">{t('dashboard.taskType', 'Type de tâche')}</p>
                <p className="font-medium text-advist-gray900 mt-1">{showTaskDetail.typeLabel}</p>
              </div>
              <div className="p-4 bg-advist-surface-dark rounded-xl">
                <p className="text-xs text-advist-text-secondary uppercase tracking-wide">{t('dashboard.deadline', 'Échéance')}</p>
                <p className="font-medium text-advist-gray900 mt-1">{formatDate(showTaskDetail.deadline)}</p>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-advist-gray900">{t('dashboard.priority', 'Priorité')}:</span>
              <Badge
                variant={showTaskDetail.priority === 'high' ? 'danger' : showTaskDetail.priority === 'medium' ? 'warning' : 'success'}
              >
                {showTaskDetail.priority === 'high' ? t('dashboard.high', 'Haute') : showTaskDetail.priority === 'medium' ? t('dashboard.medium', 'Moyenne') : t('dashboard.low', 'Basse')}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-advist-border">
              <Button variant="outline" className="flex-1" onClick={() => handleTaskAction('view')}>
                <Eye size={16} className="mr-2" />
                {t('dashboard.viewDocument', 'Voir le document')}
              </Button>
              {showTaskDetail.type === 'approval' && (
                <>
                  <Button variant="outline" className="flex-1 text-advist-error border-advist-error/20 hover:bg-advist-gold-light" onClick={() => handleTaskAction('reject')}>
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

