import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  GitBranch,
  Plus,
  Upload,
  PenTool,
  Eye,
  Clock,
  ArrowRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Modal } from '../components/ui';
import { NewDocumentForm } from '../components/documents/NewDocumentForm';
import { SmartCalendar } from '../components/calendar';
import { useAuthStore } from '../store';
import { CurrentPlanIndicator } from '../components/subscription';
import {
  getDashboardStats,
  getRecentActivity,
  getPendingDocuments,
  type DashboardStats,
  type RecentActivityItem,
  type PendingDocumentItem,
} from '../services/dashboardOverview';

// --- helpers -------------------------------------------------------------

/** Pick an icon for an audit-log action label. */
function activityIcon(action: string): React.ElementType {
  const a = action.toLowerCase();
  if (a.includes('sign')) return PenTool;
  if (a.includes('view') || a.includes('consult') || a.includes('read')) return Eye;
  if (a.includes('workflow')) return GitBranch;
  if (a.includes('import') || a.includes('upload') || a.includes('create')) return Upload;
  return FileText;
}

/** Compact relative time, FR. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

/** Day/month, FR (e.g. "29 nov."). */
function formatDueDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export const UserDashboard: React.FC = () => {
  const { _t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  const basePath = '/user';
  const orgId = user?.organization?.id;
  const userId = user?.id;

  const [stats, setStats] = useState<DashboardStats>({
    documentsThisMonth: 0,
    pendingSignatures: 0,
    activeWorkflows: 0,
    completedThisWeek: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getDashboardStats(orgId, userId),
      getRecentActivity(orgId, 4),
      getPendingDocuments(orgId, 3),
    ])
      .then(([s, a, p]) => {
        if (cancelled) return;
        setStats(s);
        setRecentActivity(a);
        setPendingDocuments(p);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, userId]);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-advist-gray900">
              Bonjour, {user?.first_name || 'Utilisateur'}
            </h1>
            <p className="text-advist-gray900/70 mt-1">Voici un aperçu de votre activité</p>
          </div>
          <CurrentPlanIndicator size="md" />
        </div>
        <button
          onClick={() => setShowNewDocModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-advist-dark text-white rounded-xl hover:bg-advist-dark transition-all duration-240 font-medium"
        >
          <Plus size={18} />
          Nouveau document
        </button>
      </div>

      {/* Stats Row — premium cards with a unified gold accent + top hairline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { value: stats.documentsThisMonth, label: 'Documents ce mois', Icon: FileText },
          { value: stats.pendingSignatures, label: 'À signer', Icon: PenTool },
          { value: stats.activeWorkflows, label: 'Workflows actifs', Icon: GitBranch },
          { value: stats.completedThisWeek, label: 'Complétés cette semaine', Icon: Clock },
        ].map(({ value, label, Icon }) => (
          <div
            key={label}
            className="relative overflow-hidden bg-white rounded-2xl border border-[#e8ebf0] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_30px_-12px_rgba(15,23,42,0.10)] transition-shadow hover:shadow-[0_1px_3px_rgba(15,23,42,0.05),0_16px_40px_-12px_rgba(15,23,42,0.16)]"
          >
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#B9975B] to-[#D4B87E]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-[#131C2E] tracking-tight">{value}</p>
                <p className="text-sm text-[#78716A] mt-1">{label}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#B9975B]/12 ring-1 ring-[#B9975B]/20">
                <Icon size={22} className="text-[#8A6C34]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-advist-border p-5">
            <h2 className="font-semibold text-advist-gray900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowNewDocModal(true)}
                className="flex flex-col items-center gap-2 p-4 bg-advist-surface-dark hover:bg-advist-surface-dark rounded-xl transition-all duration-240"
              >
                <div className="w-10 h-10 bg-advist-dark rounded-xl flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-advist-gray900">Importer</span>
              </button>
              <button
                onClick={() => navigate(`${basePath}/workflows`)}
                className="flex flex-col items-center gap-2 p-4 bg-advist-surface-dark hover:bg-advist-surface-dark rounded-xl transition-all duration-240"
              >
                <div className="w-10 h-10 bg-advist-dark rounded-xl flex items-center justify-center">
                  <GitBranch size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-advist-gray900">Workflow</span>
              </button>
              <button
                onClick={() => navigate(`${basePath}/signatures`)}
                className="flex flex-col items-center gap-2 p-4 bg-advist-surface-dark hover:bg-advist-surface-dark rounded-xl transition-all duration-240"
              >
                <div className="w-10 h-10 bg-advist-dark rounded-xl flex items-center justify-center">
                  <PenTool size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-advist-gray900">Signer</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-advist-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-advist-gray900">Activité récente</h2>
              <Link
                to={`${basePath}/documents`}
                className="text-sm text-advist-gray900/70 hover:text-advist-gray900 flex items-center gap-1"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-advist-gray900/40">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="py-8 text-center text-sm text-advist-gray900/50">
                  Aucune activité récente
                </p>
              ) : (
                recentActivity.map((activity) => {
                  const ActivityIcon = activityIcon(activity.action);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-advist-surface-dark rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#B9975B]/14 ring-1 ring-[#B9975B]/20">
                        <ActivityIcon size={16} className="text-[#8A6C34]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-advist-gray900 capitalize">
                          {activity.action}
                        </p>
                        {activity.resourceName && (
                          <p className="text-xs text-advist-gray900/70 truncate">
                            {activity.resourceName}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-advist-gray900/50">
                        {relativeTime(activity.at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Pending Documents */}
        <div className="bg-white rounded-xl border border-advist-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-advist-gray900">Documents en attente</h2>
            <Link
              to={`${basePath}/signatures`}
              className="text-sm text-advist-gray900/70 hover:text-advist-gray900 flex items-center gap-1"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-advist-gray900/40">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : pendingDocuments.length === 0 ? (
              <p className="py-8 text-center text-sm text-advist-gray900/50">
                Aucun document en attente
              </p>
            ) : (
              pendingDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  to={`${basePath}/documents/${doc.id}`}
                  className="block p-4 border border-advist-border rounded-xl hover:border-advist-dark hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#B9975B]/14 text-[#8A6C34]">
                      En cours
                    </span>
                    <div className="flex items-center gap-1 text-xs text-advist-gray900/50">
                      <Calendar size={12} />
                      {formatDueDate(doc.dueDate)}
                    </div>
                  </div>
                  <h3 className="font-medium text-advist-gray900 mb-1">{doc.title}</h3>
                </Link>
              ))
            )}
          </div>
          <button
            onClick={() => navigate(`${basePath}/signatures`)}
            className="w-full mt-4 py-3 text-sm font-medium text-white bg-advist-dark hover:bg-advist-dark-hover rounded-xl transition-all duration-240"
          >
            Voir tous les documents à signer
          </button>
        </div>
      </div>

      {/* Smart Calendar Section */}
      <div className="bg-white rounded-xl border border-advist-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-advist-gray900">Calendrier des échéances</h2>
          <Link
            to={`${basePath}/calendar`}
            className="text-sm text-advist-gray900/70 hover:text-advist-gray900 flex items-center gap-1"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        <SmartCalendar compact />
      </div>

      {/* New Document Modal */}
      <Modal
        isOpen={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
        title="Nouveau document"
        size="lg"
      >
        <NewDocumentForm onClose={() => setShowNewDocModal(false)} basePath={basePath} />
      </Modal>
    </div>
  );
};

export default UserDashboard;
