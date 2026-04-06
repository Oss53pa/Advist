/**
 * Marketing Publications Page - List and manage social media publications
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  _Edit,
  Trash2,
  Send,
  Clock,
  Eye,
  ArrowLeft,
  X,
  Upload,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { publicationsApi, templatesApi } from '../../../services/marketing';
import type {
  Publication,
  PublicationCreateData,
  PostTemplate,
  SocialPlatform,
} from '../../../types';

const platformIcons: Record<string, string> = {
  facebook: 'https://cdn.simpleicons.org/facebook',
  linkedin: 'https://cdn.simpleicons.org/linkedin',
  twitter: 'https://cdn.simpleicons.org/x',
  instagram: 'https://cdn.simpleicons.org/instagram',
  whatsapp: 'https://cdn.simpleicons.org/whatsapp',
};

const platformColors: Record<string, string> = {
  facebook: 'bg-primary-900',
  linkedin: 'bg-primary-800',
  twitter: 'bg-black',
  instagram: 'bg-gradient-to-r from-primary-900 to-primary-700',
  whatsapp: 'bg-green-500',
};

const platforms: SocialPlatform[] = ['facebook', 'linkedin', 'twitter', 'instagram', 'whatsapp'];

export default function MarketingPublicationsPage() {
  const { t } = useTranslation();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<PublicationCreateData>({
    title: '',
    content: '',
    platforms: [],
    scheduled_at: '',
  });
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await publicationsApi.list({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        ordering: '-created_at',
      });
      setPublications(data.results);
    } catch (error) {
      console.error('Error fetching publications:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await templatesApi.list();
        setTemplates(data.results);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  const handleCreatePublication = async (publish: boolean = false) => {
    try {
      setSubmitting(true);
      const data: PublicationCreateData = {
        ...formData,
        media: selectedMedia || undefined,
      };
      const publication = await publicationsApi.create(data);

      if (publish) {
        await publicationsApi.publish(publication.id);
      }

      setShowCreateModal(false);
      resetForm();
      fetchPublications();
    } catch (error) {
      console.error('Error creating publication:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publicationsApi.publish(id);
      fetchPublications();
    } catch (error) {
      console.error('Error publishing:', error);
    }
    setActionMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('superadmin.marketing.publications.confirmDelete'))) return;
    try {
      await publicationsApi.delete(id);
      fetchPublications();
    } catch (error) {
      console.error('Error deleting:', error);
    }
    setActionMenu(null);
  };

  const handleSchedule = async (id: string) => {
    const date = prompt('Date de publication (YYYY-MM-DD HH:MM):');
    if (!date) return;
    try {
      await publicationsApi.schedule(id, new Date(date).toISOString());
      fetchPublications();
    } catch (error) {
      console.error('Error scheduling:', error);
    }
    setActionMenu(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      platforms: [],
      scheduled_at: '',
    });
    setSelectedMedia(null);
  };

  const togglePlatform = (platform: SocialPlatform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const applyTemplate = (template: PostTemplate) => {
    setFormData((prev) => ({
      ...prev,
      content: template.content,
      platforms: template.platforms,
      template: template.id,
    }));
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-primary-100 text-primary-700',
      scheduled: 'bg-primary-100 text-primary-800',
      publishing: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}
      >
        {t(`superadmin.marketing.status.${status}`)}
      </span>
    );
  };

  const viewPublication = async (id: string) => {
    try {
      const publication = await publicationsApi.get(id);
      setSelectedPublication(publication);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching publication:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/superadmin/marketing" className="text-primary-500 hover:text-primary-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">
              {t('superadmin.marketing.publications.title')}
            </h1>
            <p className="text-primary-500">{t('superadmin.marketing.publications.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('superadmin.marketing.publications.newPublication')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
          <input
            type="text"
            placeholder={t('superadmin.marketing.publications.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900 appearance-none bg-white"
          >
            <option value="">{t('superadmin.marketing.publications.allStatuses')}</option>
            <option value="draft">{t('superadmin.marketing.status.draft')}</option>
            <option value="scheduled">{t('superadmin.marketing.status.scheduled')}</option>
            <option value="published">{t('superadmin.marketing.status.published')}</option>
            <option value="failed">{t('superadmin.marketing.status.failed')}</option>
          </select>
        </div>
      </div>

      {/* Publications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
          </div>
        ) : publications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-primary-500">
              {t('superadmin.marketing.publications.noPublicationFound')}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-primary-900 hover:text-primary-800"
            >
              {t('superadmin.marketing.publications.createFirst')}
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-primary-200">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  {t('superadmin.marketing.publications.publicationColumn')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  {t('superadmin.marketing.publications.platformsColumn')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  {t('superadmin.marketing.publications.statusColumn')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  {t('superadmin.marketing.publications.dateColumn')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase tracking-wider">
                  {t('superadmin.marketing.publications.actionsColumn')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-200">
              {publications.map((publication) => (
                <tr key={publication.id} className="hover:bg-primary-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-primary-900">{publication.title}</p>
                      <p className="text-sm text-primary-500 truncate max-w-xs">
                        {publication.content.substring(0, 60)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {publication.platforms.map((platform) => (
                        <div
                          key={platform}
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                          title={platform}
                        >
                          <img
                            src={platformIcons[platform]}
                            alt={platform}
                            className="w-3.5 h-3.5 filter brightness-0 invert"
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(publication.status)}
                    {publication.results_summary && publication.status === 'published' && (
                      <span className="ml-2 text-xs text-primary-500">
                        {publication.results_summary.success}/{publication.results_summary.total}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-primary-500">
                    {publication.scheduled_at ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(publication.scheduled_at).toLocaleDateString('fr-FR')}
                      </span>
                    ) : (
                      new Date(publication.created_at).toLocaleDateString('fr-FR')
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionMenu(actionMenu === publication.id ? null : publication.id)
                        }
                        className="text-primary-400 hover:text-primary-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {actionMenu === publication.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-10">
                          <button
                            onClick={() => viewPublication(publication.id)}
                            className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            {t('superadmin.marketing.publications.viewDetails')}
                          </button>
                          {publication.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handlePublish(publication.id)}
                                className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                              >
                                <Send className="h-4 w-4" />
                                {t('superadmin.marketing.publications.publishNow')}
                              </button>
                              <button
                                onClick={() => handleSchedule(publication.id)}
                                className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                              >
                                <Clock className="h-4 w-4" />
                                {t('superadmin.marketing.publications.schedule')}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(publication.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('superadmin.marketing.publications.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-primary-200">
              <h2 className="text-xl font-semibold text-primary-900">
                {t('superadmin.marketing.publications.newPublicationTitle')}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.publications.titleLabel')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    placeholder={t('superadmin.marketing.publications.titlePlaceholder')}
                  />
                </div>

                {/* Templates */}
                {templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      {t('superadmin.marketing.publications.useTemplate')}
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="px-3 py-2 bg-primary-100 hover:bg-primary-200 rounded-lg text-sm whitespace-nowrap"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.publications.contentLabel')}
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    placeholder={t('superadmin.marketing.publications.contentPlaceholder')}
                  />
                  <p className="mt-1 text-sm text-primary-500">
                    {formData.content.length} {t('superadmin.marketing.publications.characters')}
                  </p>
                </div>

                {/* Media */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.publications.mediaLabel')}
                  </label>
                  <div className="border-2 border-dashed border-primary-300 rounded-lg p-6">
                    {selectedMedia ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-8 w-8 text-primary-400" />
                          <div>
                            <p className="font-medium text-primary-900">{selectedMedia.name}</p>
                            <p className="text-sm text-primary-500">
                              {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedMedia(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="h-10 w-10 text-primary-400" />
                        <span className="mt-2 text-sm text-primary-500">
                          {t('superadmin.marketing.publications.clickToAddMedia')}
                        </span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => setSelectedMedia(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('superadmin.marketing.publications.targetPlatforms')}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {platforms.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                          formData.platforms.includes(platform)
                            ? 'border-primary-900 bg-primary-50'
                            : 'border-primary-200 hover:border-primary-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                        >
                          <img
                            src={platformIcons[platform]}
                            alt={platform}
                            className="w-3 h-3 filter brightness-0 invert"
                          />
                        </div>
                        <span className="capitalize">{platform}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.publications.scheduleFor')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
                    <input
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
              >
                {t('superadmin.marketing.common.cancel')}
              </button>
              <button
                onClick={() => handleCreatePublication(false)}
                disabled={
                  !formData.title ||
                  !formData.content ||
                  formData.platforms.length === 0 ||
                  submitting
                }
                className="px-4 py-2 border border-primary-900 text-primary-900 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('superadmin.marketing.publications.saveDraft')}
              </button>
              <button
                onClick={() => handleCreatePublication(true)}
                disabled={
                  !formData.title ||
                  !formData.content ||
                  formData.platforms.length === 0 ||
                  submitting
                }
                className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {t('superadmin.marketing.publications.publishNowBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPublication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-primary-200">
              <h2 className="text-xl font-semibold text-primary-900">
                {selectedPublication.title}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPublication(null);
                }}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedPublication.status)}
                  <span className="text-sm text-primary-500">
                    {t('superadmin.marketing.publications.createdOn')}{' '}
                    {new Date(selectedPublication.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-primary-700 mb-2">
                    {t('superadmin.marketing.publications.contentLabel')}
                  </h3>
                  <p className="text-primary-900 whitespace-pre-wrap">
                    {selectedPublication.content}
                  </p>
                </div>

                {selectedPublication.media_url && (
                  <div>
                    <h3 className="text-sm font-medium text-primary-700 mb-2">
                      {t('superadmin.marketing.publications.mediaLabel')}
                    </h3>
                    <img
                      src={selectedPublication.media_url}
                      alt="Media"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-primary-700 mb-2">
                    {t('superadmin.marketing.publications.platformsColumn')}
                  </h3>
                  <div className="flex gap-2">
                    {selectedPublication.platforms.map((platform) => (
                      <div
                        key={platform}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                      >
                        <img
                          src={platformIcons[platform]}
                          alt={platform}
                          className="w-5 h-5 filter brightness-0 invert"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPublication.results && selectedPublication.results.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-primary-700 mb-2">
                      {t('superadmin.marketing.publications.results')}
                    </h3>
                    <div className="space-y-2">
                      {selectedPublication.results.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${platformColors[result.platform]}`}
                            >
                              <img
                                src={platformIcons[result.platform]}
                                alt={result.platform}
                                className="w-4 h-4 filter brightness-0 invert"
                              />
                            </div>
                            <span className="capitalize">{result.platform}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {result.status === 'success' ? (
                              <>
                                <span className="text-sm text-primary-500">
                                  {result.metrics.likes || 0} likes, {result.metrics.comments || 0}{' '}
                                  commentaires
                                </span>
                                {result.external_url && (
                                  <a
                                    href={result.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-900 hover:text-primary-800 text-sm"
                                  >
                                    {t('superadmin.marketing.publications.viewPost')}
                                  </a>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-red-600">
                                {result.error_message || t('superadmin.marketing.status.failed')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
