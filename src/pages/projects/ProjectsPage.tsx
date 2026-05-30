/**
 * Projects List Page
 * View and manage all projects/folders
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Folder,
  Plus,
  Search,
  _Filter,
  Grid,
  List,
  Calendar,
  Users,
  FileText,
  _ChevronRight,
  MoreVertical,
  _Clock,
} from 'lucide-react';
import {
  Project,
  projectService,
  getStatusConfig,
  getPriorityConfig,
  ProjectStatus,
} from '../../services/projects';

type ViewMode = 'grid' | 'list';

export const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [_showNewProjectModal, setShowNewProjectModal] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const data = await projectService.getProjects(
          statusFilter !== 'all' ? { status: statusFilter } : undefined
        );
        setProjects(data);
      } catch (error) {
        // No fake fallback — show empty state on failure. The list rendering
        // already handles `projects.length === 0` with the empty-state UI.
        console.warn('[ProjectsPage] failed to load projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [statusFilter]);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOptions: { value: ProjectStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('common.all', 'Tous les statuts') },
    { value: 'active', label: t('users.status.active', 'Actifs') },
    { value: 'draft', label: t('documents.status.draft', 'Brouillons') },
    { value: 'on_hold', label: t('projects.status.on_hold', 'En pause') },
    { value: 'completed', label: t('workflows.status.completed', 'Terminés') },
    { value: 'archived', label: t('documents.status.archived', 'Archivés') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{t('nav.projects')}</h1>
          <p className="text-advist-gray900/70 mt-1">
            {t('documents.subtitle', 'Gérez vos projets et regroupez vos documents')}
          </p>
        </div>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90 transition-all"
        >
          <Plus size={18} />
          {t('common.create')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-gray900/50"
          />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-advist-border rounded-xl focus:outline-none focus:border-advist-dark"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
          className="px-4 py-2.5 border border-advist-border rounded-xl focus:outline-none focus:border-advist-dark"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex items-center border border-advist-border rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 ${viewMode === 'grid' ? 'bg-advist-dark text-white' : 'text-advist-gray900 hover:bg-advist-surface-dark/50'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 ${viewMode === 'list' ? 'bg-advist-dark text-white' : 'text-advist-gray900 hover:bg-advist-surface-dark/50'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-advist-dark"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <Folder size={48} className="mx-auto mb-4 text-advist-gray900/30" />
          <h2 className="text-lg font-medium text-advist-gray900">
            {t('projects.noProjects', 'Aucun projet trouvé')}
          </h2>
          <p className="text-advist-gray900/70 mt-1">
            {searchQuery
              ? t('projects.tryOtherTerms', "Essayez avec d'autres termes de recherche")
              : t('projects.createFirst', 'Créez votre premier projet')}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90"
            >
              <Plus size={16} />
              {t('projects.createProject', 'Créer un projet')}
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            const _priorityConfig = getPriorityConfig(project.priority);

            return (
              <Link
                key={project.id}
                to={`/user/projects/${project.id}`}
                className="bg-white rounded-xl border border-advist-border p-5 hover:border-advist-dark hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <Folder size={24} style={{ color: project.color }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Open menu
                      }}
                      className="p-1 hover:bg-advist-surface-dark rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <MoreVertical size={16} className="text-advist-gray900/50" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-advist-gray900 group-hover:text-advist-gray900 mb-1 truncate">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-advist-gray900/60 line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-advist-gray900/50">
                      {t('projects.progress', 'Progression')}
                    </span>
                    <span className="font-medium text-advist-gray900">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-advist-surface-dark rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-advist-gray900/50">
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {project.documentsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {project.membersCount}
                  </span>
                  {project.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(project.dueDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-advist-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-advist-border bg-advist-surface-dark/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-advist-gray900/70 uppercase tracking-wider">
                  {t('projects.project', 'Projet')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-advist-gray900/70 uppercase tracking-wider">
                  {t('common.status', 'Statut')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-advist-gray900/70 uppercase tracking-wider">
                  {t('projects.progress', 'Progression')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-advist-gray900/70 uppercase tracking-wider">
                  {t('nav.documents', 'Documents')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-advist-gray900/70 uppercase tracking-wider">
                  {t('projects.deadline', 'Échéance')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-advist-gray900/70 uppercase tracking-wider">
                  {t('common.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-advist-gray-cold">
              {filteredProjects.map((project) => {
                const statusConfig = getStatusConfig(project.status);

                return (
                  <tr
                    key={project.id}
                    className="hover:bg-advist-surface-dark/30 cursor-pointer"
                    onClick={() => navigate(`/user/projects/${project.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${project.color}20` }}
                        >
                          <Folder size={20} style={{ color: project.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-advist-gray900">{project.name}</p>
                          {project.reference && (
                            <p className="text-xs text-advist-gray900/50">{project.reference}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-advist-gray900/50">{project.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-advist-surface-dark rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${project.progress}%`,
                              backgroundColor: project.color,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-advist-gray900">
                        {project.completedDocumentsCount}/{project.documentsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {project.dueDate ? (
                        <span className="text-sm text-advist-gray900 flex items-center gap-1">
                          <Calendar size={14} className="text-advist-gray900/50" />
                          {new Date(project.dueDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-advist-gray900/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open menu
                        }}
                        className="p-2 hover:bg-advist-surface-dark rounded-lg transition-all"
                      >
                        <MoreVertical size={16} className="text-advist-gray900/50" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
