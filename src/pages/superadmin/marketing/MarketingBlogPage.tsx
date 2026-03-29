/**
 * Marketing Blog Page - Gestion des articles de blog
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '../../../utils/sanitize';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  StarOff,
  Send,
  Archive,
  Image,
  X,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { blogApi } from '../../../services/marketing';
import type { BlogPost, BlogPostStatus } from '../../../types';
import { ImageUploader, RichTextEditor } from '../../../components/blog';

const STATUS_KEYS: Record<BlogPostStatus, string> = {
  draft: 'superadmin.marketing.blog.status.draft',
  published: 'superadmin.marketing.blog.status.published',
  archived: 'superadmin.marketing.blog.status.archived',
};

const STATUS_COLORS: Record<BlogPostStatus, string> = {
  draft: 'bg-primary-100 text-primary-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
};

const CATEGORY_KEYS = [
  'superadmin.marketing.blog.categories.news',
  'superadmin.marketing.blog.categories.tips',
  'superadmin.marketing.blog.categories.tutorials',
  'superadmin.marketing.blog.categories.caseStudies',
  'superadmin.marketing.blog.categories.product',
  'superadmin.marketing.blog.categories.other',
];

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  meta_title: string;
  meta_description: string;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  is_featured: boolean;
}

const initialFormData: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image_url: '',
  meta_title: '',
  meta_description: '',
  category: '',
  tags: [],
  status: 'draft',
  is_featured: false,
};

export default function MarketingBlogPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    loadPosts();
  }, [statusFilter, categoryFilter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await blogApi.list(params);
      setPosts(response.results || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setFormData(initialFormData);
    setTagInput('');
    setShowModal(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image_url: post.featured_image_url || '',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      category: post.category || '',
      tags: post.tags || [],
      status: post.status,
      is_featured: post.is_featured,
    });
    setTagInput('');
    setShowModal(true);
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Supprimer l'article "${post.title}" ?`)) return;

    try {
      await blogApi.delete(post.id);
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handlePublish = async (post: BlogPost) => {
    try {
      await blogApi.publish(post.id);
      await loadPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
    }
  };

  const handleArchive = async (post: BlogPost) => {
    try {
      await blogApi.archive(post.id);
      await loadPosts();
    } catch (error) {
      console.error('Error archiving post:', error);
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      await blogApi.update(post.id, { is_featured: !post.is_featured });
      await loadPosts();
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingPost) {
        await blogApi.update(editingPost.id, formData);
      } else {
        await blogApi.create(formData);
      }
      setShowModal(false);
      await loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">{t('superadmin.marketing.blog.title')}</h1>
          <p className="text-primary-600 mt-1">
            {t('superadmin.marketing.blog.subtitle')}
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800"
        >
          <Plus className="h-5 w-5" />
          {t('superadmin.marketing.blog.newArticle')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="h-5 w-5 text-primary-900" />
            </div>
            <div>
              <p className="text-sm text-primary-600">{t('superadmin.marketing.blog.totalArticles')}</p>
              <p className="text-xl font-bold">{posts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">{t('superadmin.marketing.blog.published')}</p>
              <p className="text-xl font-bold">
                {posts.filter(p => p.status === 'published').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Edit className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">{t('superadmin.marketing.blog.drafts')}</p>
              <p className="text-xl font-bold">
                {posts.filter(p => p.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">{t('superadmin.marketing.blog.featured')}</p>
              <p className="text-xl font-bold">
                {posts.filter(p => p.is_featured).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <input
                type="text"
                placeholder={t('superadmin.marketing.blog.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('superadmin.marketing.blog.allStatuses')}</option>
            <option value="draft">{t('superadmin.marketing.blog.status.draft')}</option>
            <option value="published">{t('superadmin.marketing.blog.status.published')}</option>
            <option value="archived">{t('superadmin.marketing.blog.status.archived')}</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('superadmin.marketing.blog.allCategories')}</option>
            {CATEGORY_KEYS.map(key => (
              <option key={key} value={t(key)}>{t(key)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-xl border border-primary-200">
        {loading ? (
          <div className="p-8 text-center text-primary-500">{t('common.loading')}</div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-primary-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary-300" />
            <p>{t('superadmin.marketing.blog.noArticles')}</p>
            <button
              onClick={handleCreateNew}
              className="mt-4 text-primary-900 hover:text-primary-700"
            >
              {t('superadmin.marketing.blog.createFirst')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-primary-200">
            {filteredPosts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-primary-50">
                <div className="flex items-start gap-4">
                  {/* Featured Image */}
                  <div className="flex-shrink-0 w-24 h-24 bg-primary-100 rounded-lg overflow-hidden">
                    {post.featured_image || post.featured_image_url ? (
                      <img
                        src={post.featured_image || post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-primary-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-primary-900">
                            {post.title}
                          </h3>
                          {post.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-primary-600 mt-1 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[post.status]}`}>
                        {t(STATUS_KEYS[post.status])}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-primary-500">
                      {post.category && (
                        <span className="bg-primary-100 px-2 py-0.5 rounded">
                          {post.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.views_count} {t('superadmin.marketing.blog.views')}
                      </span>
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.published_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFeatured(post)}
                      className={`p-2 rounded-lg ${
                        post.is_featured
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      }`}
                      title={post.is_featured ? t('superadmin.marketing.blog.removeFeatured') : t('superadmin.marketing.blog.setFeatured')}
                    >
                      {post.is_featured ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </button>
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(post)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        title="Publier"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    {post.status === 'published' && (
                      <button
                        onClick={() => handleArchive(post)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                        title="Archiver"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setPreviewPost(post)}
                      className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"
                      title="Apercu"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 bg-primary-100 text-primary-900 rounded-lg hover:bg-primary-200"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingPost ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-primary-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
              <div className="p-6 space-y-6">
                {/* Title & Slug */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Titre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          title: e.target.value,
                          slug: prev.slug || generateSlug(e.target.value),
                        }));
                      }}
                      className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Titre de l'article"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Slug (URL)
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="mon-article"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Extrait *
                  </label>
                  <textarea
                    required
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={2}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Court resume de l'article..."
                  />
                  <p className="text-xs text-primary-500 mt-1">
                    {formData.excerpt.length}/500 caracteres
                  </p>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Image a la une
                  </label>
                  <ImageUploader
                    value={formData.featured_image_url}
                    onChange={(url) => setFormData(prev => ({ ...prev, featured_image_url: url }))}
                    placeholder="Glissez une image ou cliquez pour selectionner"
                    aspectRatio="video"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Contenu *
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    placeholder="Redigez votre article..."
                    minHeight="350px"
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Categorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Selectionner...</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as BlogPostStatus }))}
                      className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="published">Publie</option>
                      <option value="archived">Archive</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="h-4 w-4 text-primary-900 rounded"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-primary-700">
                      Article en vedette
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Tags
                  </label>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ajouter un tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* SEO */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-primary-900 mb-4">SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Meta titre
                      </label>
                      <input
                        type="text"
                        value={formData.meta_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                        maxLength={70}
                        className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Titre pour les moteurs de recherche"
                      />
                      <p className="text-xs text-primary-500 mt-1">
                        {formData.meta_title.length}/70 caracteres
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Meta description
                      </label>
                      <textarea
                        value={formData.meta_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                        maxLength={160}
                        rows={2}
                        className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Description pour les moteurs de recherche"
                      />
                      <p className="text-xs text-primary-500 mt-1">
                        {formData.meta_description.length}/160 caracteres
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t bg-primary-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingPost ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Apercu de l'article</h2>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-2 hover:bg-primary-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {(previewPost.featured_image || previewPost.featured_image_url) && (
                <img
                  src={previewPost.featured_image || previewPost.featured_image_url}
                  alt={previewPost.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[previewPost.status]}`}>
                  {STATUS_LABELS[previewPost.status]}
                </span>
                {previewPost.category && (
                  <span className="px-2 py-1 text-xs bg-primary-100 rounded-full">
                    {previewPost.category}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-primary-900 mb-4">
                {previewPost.title}
              </h1>
              <p className="text-lg text-primary-600 mb-6 italic">
                {previewPost.excerpt}
              </p>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewPost.content) }}
              />
              {previewPost.tags && previewPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                  {previewPost.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
