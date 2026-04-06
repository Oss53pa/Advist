import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  GitBranch,
  Plus,
  Upload,
  _X,
  PenTool,
  Eye,
  Clock,
  ArrowRight,
  Calendar,
  Sparkles,
  _Zap,
  BarChart3,
  Cloud,
} from 'lucide-react';
import { Modal } from '../components/ui';
import { NewDocumentForm } from '../components/documents/NewDocumentForm';
import { SmartCalendar } from '../components/calendar';
import { useAuthStore } from '../store';
import { FeatureGuard, CurrentPlanIndicator, PlanRequiredBadge } from '../components/subscription';
import { useTenantStore } from '../stores/tenantStore';

// Mock data
const userStats = {
  documentsThisMonth: 12,
  pendingSignatures: 5,
  activeWorkflows: 3,
  completedThisWeek: 8,
};

const recentActivity = [
  {
    id: 1,
    action: 'Document signé',
    document: 'Contrat de prestation Q4',
    time: '2 min',
    icon: PenTool,
  },
  {
    id: 2,
    action: 'Document consulté',
    document: 'Rapport financier 2024',
    time: '15 min',
    icon: Eye,
  },
  {
    id: 3,
    action: 'Workflow démarré',
    document: 'Procédure qualité v2',
    time: '1h',
    icon: GitBranch,
  },
  {
    id: 4,
    action: 'Document importé',
    document: 'Budget prévisionnel 2025',
    time: '2h',
    icon: Upload,
  },
];

const pendingDocuments = [
  {
    id: 1,
    title: 'Contrat de prestation Q4 2024',
    type: 'Contrat',
    deadline: '29 Nov',
    priority: 'high',
    assignedBy: 'Marie Dupont',
  },
  {
    id: 2,
    title: 'Budget prévisionnel 2025',
    type: 'Budget',
    deadline: '30 Nov',
    priority: 'medium',
    assignedBy: 'Pierre Martin',
  },
  {
    id: 3,
    title: 'Rapport annuel 2024',
    type: 'Rapport',
    deadline: '5 Déc',
    priority: 'low',
    assignedBy: 'Sophie Bernard',
  },
];

export const UserDashboard: React.FC = () => {
  const { _t } = useTranslation();
  const { user } = useAuthStore();
  const { _currentTenant } = useTenantStore();
  const navigate = useNavigate();
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  const basePath = '/user';

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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-advist-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-advist-gray900">
                {userStats.documentsThisMonth}
              </p>
              <p className="text-sm text-advist-gray900/70 mt-1">Documents ce mois</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText size={22} className="text-primary-900" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-advist-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-advist-gray900">
                {userStats.pendingSignatures}
              </p>
              <p className="text-sm text-advist-gray900/70 mt-1">À signer</p>
            </div>
            <div className="w-12 h-12 bg-advist-gold-light/20 rounded-xl flex items-center justify-center">
              <PenTool size={22} className="text-advist-gray900" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-advist-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-advist-gray900">{userStats.activeWorkflows}</p>
              <p className="text-sm text-advist-gray900/70 mt-1">Workflows actifs</p>
            </div>
            <div className="w-12 h-12 bg-advist-dark rounded-xl flex items-center justify-center">
              <GitBranch size={22} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-advist-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-advist-gray900">
                {userStats.completedThisWeek}
              </p>
              <p className="text-sm text-advist-gray900/70 mt-1">Complétés cette semaine</p>
            </div>
            <div className="w-12 h-12 bg-advist-dark rounded-xl flex items-center justify-center">
              <Clock size={22} className="text-white" />
            </div>
          </div>
        </div>
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
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-advist-surface-dark rounded-xl"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-advist-gold-light/20">
                    <activity.icon size={16} className="text-advist-gray900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-advist-gray900">{activity.action}</p>
                    <p className="text-xs text-advist-gray900/70 truncate">{activity.document}</p>
                  </div>
                  <span className="text-xs text-advist-blue-light">{activity.time}</span>
                </div>
              ))}
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
            {pendingDocuments.map((doc) => (
              <Link
                key={doc.id}
                to={`${basePath}/documents/${doc.id}`}
                className="block p-4 border border-advist-border rounded-xl hover:border-advist-dark hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${
                      doc.priority === 'high'
                        ? 'bg-advist-warning-light text-advist-warning'
                        : 'bg-advist-gold-light/20 text-advist-gray900'
                    }
                  `}
                  >
                    {doc.priority === 'high' ? 'Urgent' : doc.type}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-advist-blue-light">
                    <Calendar size={12} />
                    {doc.deadline}
                  </div>
                </div>
                <h3 className="font-medium text-advist-gray900 group-hover:text-advist-gray900 mb-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-advist-gray900/70">Assigné par {doc.assignedBy}</p>
              </Link>
            ))}
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

      {/* Feature-gated sections - Shows plan-based access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI Assistant - Business+ */}
        <FeatureGuard feature="aiAssistant" mode="overlay">
          <div className="bg-white rounded-xl border border-advist-border p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-primary-900" />
              </div>
              <div>
                <h3
                  className="font-semibold text-advist-gray900"
                  style={{ fontFamily: "'Grand Hotel', cursive" }}
                >
                  Proph3t
                </h3>
                <PlanRequiredBadge feature="aiAssistant" />
              </div>
            </div>
            <p className="text-sm text-advist-gray900/70 mb-4">
              Utilisez l'IA pour analyser vos documents, extraire des informations et générer des
              résumés automatiques.
            </p>
            <button className="w-full py-2 bg-primary-100 text-primary-800 rounded-lg font-medium hover:bg-primary-200 transition-colors">
              Ouvrir l'assistant
            </button>
          </div>
        </FeatureGuard>

        {/* Cloud Integration - Starter+ */}
        <FeatureGuard feature="cloudIntegration" mode="overlay">
          <div className="bg-white rounded-xl border border-advist-border p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Cloud size={20} className="text-primary-900" />
              </div>
              <div>
                <h3 className="font-semibold text-advist-gray900">Intégration Cloud</h3>
                <PlanRequiredBadge feature="cloudIntegration" />
              </div>
            </div>
            <p className="text-sm text-advist-gray900/70 mb-4">
              Synchronisez vos documents avec Google Drive, OneDrive, Dropbox et autres services
              cloud.
            </p>
            <button className="w-full py-2 bg-primary-100 text-primary-800 rounded-lg font-medium hover:bg-primary-200 transition-colors">
              Connecter un service
            </button>
          </div>
        </FeatureGuard>

        {/* Advanced Analytics - Business+ */}
        <FeatureGuard feature="workflowAnalytics" mode="overlay">
          <div className="bg-white rounded-xl border border-advist-border p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} className="text-primary-900" />
              </div>
              <div>
                <h3 className="font-semibold text-advist-gray900">Analytics avancés</h3>
                <PlanRequiredBadge feature="workflowAnalytics" />
              </div>
            </div>
            <p className="text-sm text-advist-gray900/70 mb-4">
              Analysez les performances de vos workflows et identifiez les goulots d'étranglement.
            </p>
            <button className="w-full py-2 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-colors">
              Voir les rapports
            </button>
          </div>
        </FeatureGuard>
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
