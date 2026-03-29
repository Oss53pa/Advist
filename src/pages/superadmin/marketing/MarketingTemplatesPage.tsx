/**
 * Marketing Templates Page - Manage post templates
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  X,
  FileText,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { templatesApi } from '../../../services/marketing';
import type { PostTemplate, SocialPlatform } from '../../../types';

const platformColors: Record<string, string> = {
  facebook: 'bg-primary-900',
  linkedin: 'bg-primary-800',
  twitter: 'bg-black',
  instagram: 'bg-primary-500',
  whatsapp: 'bg-green-500',
};

const platformIcons: Record<string, string> = {
  facebook: 'https://cdn.simpleicons.org/facebook',
  linkedin: 'https://cdn.simpleicons.org/linkedin',
  twitter: 'https://cdn.simpleicons.org/x',
  instagram: 'https://cdn.simpleicons.org/instagram',
  whatsapp: 'https://cdn.simpleicons.org/whatsapp',
};

const platforms: SocialPlatform[] = ['facebook', 'linkedin', 'twitter', 'instagram', 'whatsapp'];

export default function MarketingTemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PostTemplate | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: '',
    platforms: [] as SocialPlatform[],
    tags: [] as string[],
    media_urls: [] as string[],
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await templatesApi.list({ search: searchQuery || undefined });
      setTemplates(data.results);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      category: '',
      platforms: [],
      tags: [],
      media_urls: [],
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: PostTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category,
      platforms: template.platforms,
      tags: template.tags,
      media_urls: template.media_urls,
    });
    setShowModal(true);
    setActionMenu(null);
  };

  const handleDuplicate = async (template: PostTemplate) => {
    try {
      await templatesApi.create({
        ...template,
        name: `${template.name} (copie)`,
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
    setActionMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('superadmin.marketing.templates.confirmDelete'))) return;
    try {
      await templatesApi.delete(id);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
    setActionMenu(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, formData);
      } else {
        await templatesApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlatform = (platform: SocialPlatform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
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
            <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-900" />
              {t('superadmin.marketing.templates.title')}
            </h1>
            <p className="text-primary-500">{t('superadmin.marketing.templates.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('superadmin.marketing.templates.new')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" />
        <input
          type="text"
          placeholder={t('superadmin.marketing.templates.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-primary-400 mx-auto mb-4" />
          <p className="text-primary-500">{t('superadmin.marketing.templates.noTemplates')}</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-4 text-primary-900 hover:text-primary-800"
          >
            {t('superadmin.marketing.templates.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-primary-900">{template.name}</h3>
                    {template.category && (
                      <span className="text-sm text-primary-500">{template.category}</span>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === template.id ? null : template.id)}
                      className="text-primary-400 hover:text-primary-600"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {actionMenu === template.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-10">
                        <button
                          onClick={() => handleEdit(template)}
                          className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {t('superadmin.marketing.templates.duplicate')}
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-primary-600 mb-4 line-clamp-3">{template.content}</p>

                {template.media_urls && template.media_urls.length > 0 && (
                  <div className="flex gap-1 mb-3 overflow-hidden">
                    {template.media_urls.slice(0, 3).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Template image ${index + 1}`}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ))}
                    {template.media_urls.length > 3 && (
                      <div className="w-12 h-12 bg-primary-100 rounded flex items-center justify-center text-xs text-primary-500">
                        +{template.media_urls.length - 3}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {template.platforms.map((platform) => (
                    <div
                      key={platform}
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                    >
                      <img
                        src={platformIcons[platform]}
                        alt={platform}
                        className="w-3 h-3 filter brightness-0 invert"
                      />
                    </div>
                  ))}
                </div>

                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-primary-50 border-t border-primary-100 text-xs text-primary-500">
                {t('superadmin.marketing.templates.createdOn')} {new Date(template.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-primary-200">
              <h2 className="text-xl font-semibold text-primary-900">
                {editingTemplate ? t('superadmin.marketing.templates.edit') : t('superadmin.marketing.templates.new')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">{t('superadmin.marketing.templates.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    placeholder={t('superadmin.marketing.templates.namePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.templates.description')}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    placeholder={t('superadmin.marketing.templates.descriptionPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">{t('superadmin.marketing.templates.content')}</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    placeholder={t('superadmin.marketing.templates.contentPlaceholder')}
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('superadmin.marketing.templates.images')}
                  </label>
                  {formData.media_urls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {formData.media_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                media_urls: prev.media_urls.filter((_, i) => i !== index),
                              }));
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-2 border-dashed border-primary-300 rounded-lg p-4">
                    <div className="flex flex-col items-center">
                      <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="h-8 w-8 text-primary-400" />
                        <span className="mt-2 text-sm text-primary-500">{t('superadmin.marketing.templates.clickToAddImages')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              Array.from(files).forEach((file) => {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setFormData((prev) => ({
                                    ...prev,
                                    media_urls: [...prev.media_urls, result],
                                  }));
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-xs text-primary-400">{t('superadmin.marketing.templates.or')}</span>
                        <input
                          type="url"
                          placeholder={t('superadmin.marketing.templates.pasteImageUrl')}
                          className="px-3 py-1 text-sm border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const url = (e.target as HTMLInputElement).value.trim();
                              if (url) {
                                setFormData((prev) => ({
                                  ...prev,
                                  media_urls: [...prev.media_urls, url],
                                }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.templates.category')}
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    placeholder={t('superadmin.marketing.templates.categoryPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('superadmin.marketing.templates.targetPlatforms')}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {platforms.map((platform) => (
                      <button
                        key={platform}
                        type="button"
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

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">{t('superadmin.marketing.templates.tags')}</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-primary-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder={t('superadmin.marketing.templates.addTagPlaceholder')}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag((e.target as HTMLInputElement).value.trim());
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.content || submitting}
                className="px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('common.saving') : editingTemplate ? t('common.edit') : t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
