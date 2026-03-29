/**
 * Project Detail Page
 * Consolidated view with visual timeline
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Folder,
  FileText,
  Users,
  Calendar,
  Clock,
  ChevronLeft,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  GitBranch,
  CheckCircle,
  MessageCircle,
  Flag,
  UserPlus,
  FileUp,
  Play,
  RefreshCw,
  PenTool,
  Link as LinkIcon,
  Search,
  X,
} from 'lucide-react';
import {
  ProjectDetail,
  TimelineEntry,
  projectService,
  getStatusConfig,
  getPriorityConfig,
  getTimelineEventConfig,
} from '../../services/projects';
import { Button } from '../../components/ui';
import { UploadDocumentModal } from '../../components/documents';

export const ProjectDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'timeline' | 'members' | 'settings'>('documents');

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await projectService.getProject(id);
        setProject(data);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-advist-dark"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <Folder size={48} className="mx-auto mb-4 text-advist-gray900/30" />
        <h2 className="text-lg font-medium text-advist-gray900">{t('projects.notFound', 'Projet non trouvé')}</h2>
        <p className="text-advist-gray900/70 mt-1">{t('projects.notFoundDesc', 'Ce projet n\'existe pas ou a été supprimé.')}</p>
        <Link
          to="/user/projects"
          className="inline-flex items-center gap-2 mt-4 text-advist-gray900 hover:text-advist-gray900/80"
        >
          <ChevronLeft size={16} />
          {t('projects.backToProjects', 'Retour aux projets')}
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(project.status);
  const priorityConfig = getPriorityConfig(project.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/user/projects"
            className="p-2 hover:bg-advist-surface-dark rounded-lg transition-all mt-1"
          >
            <ChevronLeft size={20} className="text-advist-gray900" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${project.color  }20` }}
              >
                <Folder size={24} style={{ color: project.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-advist-gray900">{project.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                  {project.reference && (
                    <span className="text-xs text-advist-gray900/50">Réf: {project.reference}</span>
                  )}
                </div>
              </div>
            </div>
            {project.description && (
              <p className="text-advist-gray900/70 mt-3 max-w-2xl">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-advist-surface-dark rounded-lg transition-all">
            <Edit2 size={18} className="text-advist-gray900" />
          </button>
          <button className="p-2 hover:bg-advist-surface-dark rounded-lg transition-all">
            <MoreVertical size={18} className="text-advist-gray900" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-advist-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{project.documentsCount}</p>
              <p className="text-sm text-advist-gray900/70">{t('nav.documents', 'Documents')}</p>
            </div>
            <FileText size={20} className="text-advist-blue-light" />
          </div>
          <div className="mt-2">
            <div className="h-1.5 bg-advist-surface-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-advist-dark transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="text-xs text-advist-gray900/50 mt-1">
              {project.completedDocumentsCount}/{project.documentsCount} {t('projects.completed', 'complétés')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-advist-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{project.membersCount}</p>
              <p className="text-sm text-advist-gray900/70">{t('projects.members', 'Membres')}</p>
            </div>
            <Users size={20} className="text-advist-blue-light" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-advist-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{project.progress}%</p>
              <p className="text-sm text-advist-gray900/70">{t('projects.progress', 'Progression')}</p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#EAEAEA"
                  strokeWidth="4"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#3A4654"
                  strokeWidth="4"
                  strokeDasharray={`${project.progress * 1.256} 125.6`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-advist-border p-4">
          <div className="flex items-center justify-between">
            <div>
              {project.dueDate ? (
                <>
                  <p className="text-2xl font-bold text-advist-gray900">
                    {new Date(project.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-sm text-advist-gray900/70">{t('projects.deadline', 'Échéance')}</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-advist-gray900/30">—</p>
                  <p className="text-sm text-advist-gray900/70">{t('projects.noDeadline', 'Pas d\'échéance')}</p>
                </>
              )}
            </div>
            <Calendar size={20} className="text-advist-blue-light" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-advist-border">
        <div className="border-b border-advist-border">
          <div className="flex">
            {[
              { id: 'documents', label: t('nav.documents', 'Documents'), icon: FileText },
              { id: 'timeline', label: t('projects.timeline', 'Chronologie'), icon: Clock },
              { id: 'members', label: t('projects.members', 'Membres'), icon: Users },
              { id: 'settings', label: t('nav.settings', 'Paramètres'), icon: GitBranch },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2
                  ${activeTab === tab.id
                    ? 'border-advist-dark text-advist-gray900'
                    : 'border-transparent text-advist-gray900/50 hover:text-advist-gray900'
                  }
                `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'documents' && (
            <ProjectDocumentsTab project={project} />
          )}
          {activeTab === 'timeline' && (
            <ProjectTimelineTab project={project} />
          )}
          {activeTab === 'members' && (
            <ProjectMembersTab project={project} />
          )}
          {activeTab === 'settings' && (
            <ProjectSettingsTab project={project} />
          )}
        </div>
      </div>
    </div>
  );
};

// Documents Tab
const ProjectDocumentsTab: React.FC<{ project: ProjectDetail }> = ({ project }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-advist-surface-dark text-advist-text-secondary',
      pending: 'bg-advist-gold-light text-advist-gold-dark',
      in_review: 'bg-advist-gold-light text-advist-gray900',
      approved: 'bg-green-50 text-advist-success',
      signed: 'bg-advist-surface-dark text-advist-gray900',
    };
    return styles[status] || styles.draft;
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { bg: string; label: string }> = {
      main: { bg: 'bg-advist-dark text-white', label: 'Principal' },
      supporting: { bg: 'bg-advist-gold-light/20 text-advist-gray900', label: 'Annexe' },
      reference: { bg: 'bg-advist-surface-dark text-advist-text-secondary', label: 'Référence' },
      output: { bg: 'bg-green-50 text-advist-success', label: 'Livrable' },
      template: { bg: 'bg-advist-surface-dark text-advist-gray900', label: 'Modèle' },
    };
    return styles[role] || styles.main;
  };

  const handleDocumentCreated = (document: unknown) => {
    console.log('Document created:', document);
    // Ici on pourrait rafraîchir la liste des documents du projet
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-advist-gray900">Documents du projet</h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90 transition-all"
          >
            <Plus size={16} />
            Ajouter un document
          </button>

          {/* Dropdown menu */}
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-advist-border z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setShowAddMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-advist-surface-dark/50 transition-all"
                >
                  <FileUp size={18} className="text-advist-gray900" />
                  <div>
                    <p className="font-medium text-advist-gray900">Nouveau document</p>
                    <p className="text-xs text-advist-gray900/60">Télécharger un fichier</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsLinkModalOpen(true);
                    setShowAddMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-advist-surface-dark/50 transition-all border-t border-advist-border"
                >
                  <LinkIcon size={18} className="text-advist-gray900" />
                  <div>
                    <p className="font-medium text-advist-gray900">Lier un document</p>
                    <p className="text-xs text-advist-gray900/60">Document existant</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {project.documents.length === 0 ? (
        <div className="text-center py-12 text-advist-gray900/50">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucun document dans ce projet</p>
          <p className="text-sm mt-1">Ajoutez des documents pour commencer</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90 transition-all"
          >
            <Plus size={16} className="inline mr-2" />
            Ajouter un document
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {project.documents.map((doc) => {
            const roleBadge = getRoleBadge(doc.role);
            return (
              <Link
                key={doc.id}
                to={`/user/documents/${doc.documentId}`}
                className="flex items-center gap-4 p-4 border border-advist-border rounded-xl hover:border-advist-dark transition-all group"
              >
                <div className="w-10 h-10 bg-advist-gold-light/20 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-advist-gray900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-advist-gray900 group-hover:text-advist-gray900 truncate">
                    {doc.documentTitle}
                  </p>
                  <p className="text-xs text-advist-gray900/50">{doc.documentType}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(doc.documentStatus)}`}>
                  {doc.documentStatus}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal Ajouter Document - utilise le même composant que DocumentsPage */}
      <UploadDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Modal Lier Document Existant */}
      <LinkExistingDocumentModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        projectId={project.id}
        existingDocumentIds={project.documents.map(d => d.documentId)}
        onDocumentLinked={(docId) => {
          console.log('Document linked:', docId);
          // Ici on pourrait rafraîchir la liste des documents du projet
        }}
      />
    </div>
  );
};

// Modal pour lier un document existant
const LinkExistingDocumentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingDocumentIds: number[];
  onDocumentLinked?: (documentId: number) => void;
}> = ({ isOpen, onClose, projectId, existingDocumentIds, onDocumentLinked }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [selectedRole, setSelectedRole] = useState<'main' | 'supporting' | 'reference' | 'output' | 'template'>('supporting');

  // Mock des documents disponibles (à remplacer par un vrai appel API)
  const availableDocuments = [
    { id: 101, title: 'Contrat de prestation 2024', type: 'Contrat', status: 'approved', owner: 'Jean Dupont', updatedAt: '2024-11-20' },
    { id: 102, title: 'Facture #F-2024-089', type: 'Facture', status: 'signed', owner: 'Marie Martin', updatedAt: '2024-11-18' },
    { id: 103, title: 'Rapport annuel Q3', type: 'Rapport', status: 'approved', owner: 'Pierre Bernard', updatedAt: '2024-11-15' },
    { id: 104, title: 'Cahier des charges v2', type: 'Cahier des charges', status: 'draft', owner: 'Sophie Lefebvre', updatedAt: '2024-11-10' },
    { id: 105, title: 'Avenant contrat A-2024', type: 'Avenant', status: 'pending', owner: 'Jean Dupont', updatedAt: '2024-11-08' },
    { id: 106, title: 'Bon de commande BC-456', type: 'Bon de commande', status: 'approved', owner: 'Marie Martin', updatedAt: '2024-11-05' },
    { id: 107, title: 'PV de réunion 15/11', type: 'PV', status: 'approved', owner: 'Pierre Bernard', updatedAt: '2024-11-16' },
    { id: 108, title: 'Devis commercial DEV-789', type: 'Devis', status: 'draft', owner: 'Sophie Lefebvre', updatedAt: '2024-11-12' },
  ].filter(doc => !existingDocumentIds.includes(doc.id));

  const filteredDocuments = availableDocuments.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDocument = (id: number) => {
    setSelectedDocuments(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleLink = () => {
    selectedDocuments.forEach(docId => {
      console.log(`Linking document ${docId} to project ${projectId} with role ${selectedRole}`);
      if (onDocumentLinked) {
        onDocumentLinked(docId);
      }
    });
    setSelectedDocuments([]);
    setSearchQuery('');
    onClose();
  };

  const roleOptions = [
    { value: 'main', label: 'Principal', description: 'Document principal du projet' },
    { value: 'supporting', label: 'Annexe', description: 'Document complémentaire' },
    { value: 'reference', label: 'Référence', description: 'Document de référence' },
    { value: 'output', label: 'Livrable', description: 'Résultat du projet' },
    { value: 'template', label: 'Modèle', description: 'Modèle à utiliser' },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-advist-surface-dark text-advist-text-secondary',
      pending: 'bg-advist-gold-light text-advist-gold-dark',
      approved: 'bg-green-50 text-advist-success',
      signed: 'bg-advist-surface-dark text-advist-gray900',
    };
    return styles[status] || styles.draft;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-advist-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-gold-light/20 rounded-xl">
              <LinkIcon size={20} className="text-advist-gray900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-advist-gray900">Lier un document existant</h2>
              <p className="text-sm text-advist-gray900/60">Sélectionnez les documents à ajouter au projet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-advist-surface-dark rounded-lg transition-all"
          >
            <X size={20} className="text-advist-gray900" />
          </button>
        </div>

        {/* Search and Role Selection */}
        <div className="px-6 py-4 border-b border-advist-border space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-gray900/40" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-advist-border rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              Rôle du document dans le projet
            </label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value as typeof selectedRole)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedRole === role.value
                      ? 'bg-advist-dark text-white'
                      : 'bg-advist-surface-dark text-advist-gray900 hover:bg-advist-gold-light/20'
                  }`}
                  title={role.description}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-advist-gray900/50">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p>Aucun document disponible</p>
              <p className="text-sm mt-1">Tous les documents sont déjà liés au projet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedDocuments.includes(doc.id)
                      ? 'border-advist-dark bg-advist-gold-light/10'
                      : 'border-advist-border hover:border-advist-blue-light'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedDocuments.includes(doc.id)
                      ? 'border-advist-dark bg-advist-dark'
                      : 'border-advist-border'
                  }`}>
                    {selectedDocuments.includes(doc.id) && (
                      <CheckCircle size={14} className="text-white" />
                    )}
                  </div>
                  <div className="w-10 h-10 bg-advist-gold-light/20 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-advist-gray900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-advist-gray900 truncate">{doc.title}</p>
                    <p className="text-xs text-advist-gray900/50">
                      {doc.type} • {doc.owner} • {new Date(doc.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-advist-border">
          <p className="text-sm text-advist-gray900/60">
            {selectedDocuments.length} document(s) sélectionné(s)
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-advist-gray900 hover:bg-advist-surface-dark rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleLink}
              disabled={selectedDocuments.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                selectedDocuments.length > 0
                  ? 'bg-advist-dark text-white hover:bg-advist-dark/90'
                  : 'bg-advist-surface-dark text-advist-gray900/40 cursor-not-allowed'
              }`}
            >
              <LinkIcon size={16} />
              Lier au projet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timeline Tab - Visual chronology
const ProjectTimelineTab: React.FC<{ project: ProjectDetail }> = ({ project }) => {
  const getEventIcon = (eventType: string) => {
    const icons: Record<string, React.ReactNode> = {
      created: <Folder size={16} />,
      status_changed: <RefreshCw size={16} />,
      document_added: <FileUp size={16} />,
      document_removed: <Trash2 size={16} />,
      document_approved: <CheckCircle size={16} />,
      document_signed: <PenTool size={16} />,
      member_added: <UserPlus size={16} />,
      member_removed: <Users size={16} />,
      workflow_started: <Play size={16} />,
      workflow_completed: <CheckCircle size={16} />,
      comment: <MessageCircle size={16} />,
      deadline_approaching: <Clock size={16} />,
      milestone_reached: <Flag size={16} />,
    };
    return icons[eventType] || <Clock size={16} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-advist-gray900">Chronologie du projet</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-advist-surface-dark text-advist-gray900 rounded-xl hover:bg-advist-surface-dark/80 transition-all">
          <MessageCircle size={16} />
          Ajouter un commentaire
        </button>
      </div>

      {project.timeline.length === 0 ? (
        <div className="text-center py-12 text-advist-gray900/50">
          <Clock size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucune activité pour ce projet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-advist-surface-dark" />

          {/* Timeline entries */}
          <div className="space-y-6">
            {project.timeline.map((entry, index) => {
              const config = getTimelineEventConfig(entry.eventType);
              return (
                <div key={entry.id} className="relative flex gap-4">
                  {/* Timeline node */}
                  <div
                    className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                      ${config.color.replace('text-', 'bg-').replace('500', '100')}
                    `}
                  >
                    <div className={config.color}>{getEventIcon(entry.eventType)}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-advist-gray900">{entry.title}</p>
                        {entry.description && (
                          <p className="text-sm text-advist-gray900/70 mt-1">{entry.description}</p>
                        )}
                        {entry.user && (
                          <p className="text-xs text-advist-gray900/50 mt-2">
                            Par {entry.user.name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-advist-gray900/50 whitespace-nowrap ml-4">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>

                    {/* Related document link */}
                    {entry.documentId && entry.documentTitle && (
                      <Link
                        to={`/user/documents/${entry.documentId}`}
                        className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-advist-surface-dark/50 rounded-lg text-sm text-advist-gray900 hover:bg-advist-surface-dark transition-all"
                      >
                        <FileText size={14} />
                        {entry.documentTitle}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Members Tab
const ProjectMembersTab: React.FC<{ project: ProjectDetail }> = ({ project }) => {
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      viewer: 'Lecteur',
      contributor: 'Contributeur',
      editor: 'Éditeur',
      manager: 'Gestionnaire',
      admin: 'Administrateur',
    };
    return labels[role] || role;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-advist-gray900">Membres du projet</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90 transition-all">
          <UserPlus size={16} />
          Ajouter un membre
        </button>
      </div>

      {/* Owner */}
      <div className="mb-6">
        <p className="text-xs font-medium text-advist-gray900/50 uppercase tracking-wider mb-2">
          Propriétaire
        </p>
        <div className="flex items-center gap-3 p-3 bg-advist-surface-dark/30 rounded-xl">
          <div className="w-10 h-10 bg-advist-dark rounded-full flex items-center justify-center text-white font-medium">
            {project.owner.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-advist-gray900">{project.owner.name}</p>
            <p className="text-xs text-advist-gray900/50">Propriétaire du projet</p>
          </div>
        </div>
      </div>

      {/* Members */}
      {project.members.length > 0 && (
        <div>
          <p className="text-xs font-medium text-advist-gray900/50 uppercase tracking-wider mb-2">
            Membres ({project.members.length})
          </p>
          <div className="space-y-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 border border-advist-border rounded-xl hover:border-advist-dark/30 transition-all"
              >
                <div className="w-10 h-10 bg-advist-gold-light/20 rounded-full flex items-center justify-center text-advist-gray900 font-medium">
                  {member.userName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-advist-gray900">{member.userName}</p>
                  <p className="text-xs text-advist-gray900/50">{member.userEmail}</p>
                </div>
                <span className="px-2 py-1 bg-advist-surface-dark rounded text-xs font-medium text-advist-gray900">
                  {getRoleLabel(member.role)}
                </span>
                <button className="p-1 hover:bg-advist-surface-dark rounded transition-all">
                  <MoreVertical size={16} className="text-advist-gray900/50" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Tab
const ProjectSettingsTab: React.FC<{ project: ProjectDetail }> = ({ project }) => {
  return (
    <div className="space-y-6">
      {/* Workflows */}
      <div>
        <h3 className="font-semibold text-advist-gray900 mb-4">Workflows du projet</h3>
        {project.workflows.length === 0 ? (
          <div className="text-center py-8 text-advist-gray900/50 border border-dashed border-advist-border rounded-xl">
            <GitBranch size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun workflow configuré</p>
            <button className="mt-3 text-sm text-advist-gray900 hover:underline">
              Ajouter un workflow
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {project.workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center gap-4 p-4 border border-advist-border rounded-xl"
              >
                <GitBranch size={20} className="text-advist-gray900" />
                <div className="flex-1">
                  <p className="font-medium text-advist-gray900">{workflow.workflowTemplateName}</p>
                  <p className="text-xs text-advist-gray900/50">
                    {workflow.autoStart ? 'Démarrage automatique' : 'Démarrage manuel'}
                  </p>
                </div>
                {workflow.isDefault && (
                  <span className="px-2 py-0.5 bg-advist-dark text-white text-xs rounded">
                    Par défaut
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project settings */}
      <div>
        <h3 className="font-semibold text-advist-gray900 mb-4">Paramètres</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-advist-border rounded-xl">
            <div>
              <p className="font-medium text-advist-gray900">Approbation requise</p>
              <p className="text-xs text-advist-gray900/50">
                Les documents nécessitent une approbation avant validation
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full ${project.settings.requireApprovalForDocuments ? 'bg-advist-dark' : 'bg-advist-surface-dark'}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-all ${project.settings.requireApprovalForDocuments ? 'ml-5' : 'ml-1'}`} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-advist-border rounded-xl">
            <div>
              <p className="font-medium text-advist-gray900">Archivage automatique</p>
              <p className="text-xs text-advist-gray900/50">
                Archiver le projet une fois terminé
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full ${project.settings.autoArchiveOnComplete ? 'bg-advist-dark' : 'bg-advist-surface-dark'}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-all ${project.settings.autoArchiveOnComplete ? 'ml-5' : 'ml-1'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
