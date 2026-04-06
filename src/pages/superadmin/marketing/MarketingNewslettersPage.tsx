/**
 * Marketing Newsletters Page - Gestion des campagnes newsletter
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '../../../utils/sanitize';
import {
  Mail,
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Clock,
  Copy,
  Eye,
  X,
  Users,
  BarChart3,
  MousePointer,
  CheckCircle,
  _AlertCircle,
} from 'lucide-react';
import { newslettersApi, subscribersApi } from '../../../services/marketing';
import type {
  Newsletter,
  NewsletterStatus,
  SubscriberStats,
  NewsletterCreateData,
} from '../../../types';

const STATUS_LABELS: Record<NewsletterStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiee',
  sending: 'Envoi en cours',
  sent: 'Envoyee',
  failed: 'Echec',
};

const STATUS_COLORS: Record<NewsletterStatus, string> = {
  draft: 'bg-primary-100 text-primary-800',
  scheduled: 'bg-primary-100 text-primary-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

interface NewsletterFormData {
  subject: string;
  preview_text: string;
  content: string;
  target_audience: string[];
  scheduled_at: string;
}

const initialFormData: NewsletterFormData = {
  subject: '',
  preview_text: '',
  content: '',
  target_audience: [],
  scheduled_at: '',
};

export default function MarketingNewslettersPage() {
  const { t } = useTranslation();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [formData, setFormData] = useState<NewsletterFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [previewNewsletter, setPreviewNewsletter] = useState<Newsletter | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<Newsletter | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const [newslettersResponse, statsResponse] = await Promise.all([
        newslettersApi.list(params),
        subscribersApi.stats(),
      ]);

      setNewsletters(newslettersResponse.results || []);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingNewsletter(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleEdit = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setFormData({
      subject: newsletter.subject,
      preview_text: newsletter.preview_text || '',
      content: newsletter.content,
      target_audience: newsletter.target_audience || [],
      scheduled_at: newsletter.scheduled_at || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (newsletter: Newsletter) => {
    if (
      !confirm(t('superadmin.marketing.newsletters.confirmDelete', { subject: newsletter.subject }))
    )
      return;

    try {
      await newslettersApi.delete(newsletter.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const handleSend = async (newsletter: Newsletter) => {
    if (
      !confirm(t('superadmin.marketing.newsletters.confirmSend', { subject: newsletter.subject }))
    )
      return;

    try {
      await newslettersApi.send(newsletter.id);
      await loadData();
    } catch (error) {
      console.error('Error sending newsletter:', error);
    }
  };

  const handleSchedule = async () => {
    if (!showScheduleModal || !scheduleDate) return;

    try {
      await newslettersApi.schedule(showScheduleModal.id, scheduleDate);
      setShowScheduleModal(null);
      setScheduleDate('');
      await loadData();
    } catch (error) {
      console.error('Error scheduling newsletter:', error);
    }
  };

  const handleDuplicate = async (newsletter: Newsletter) => {
    try {
      await newslettersApi.duplicate(newsletter.id);
      await loadData();
    } catch (error) {
      console.error('Error duplicating newsletter:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: NewsletterCreateData = {
        subject: formData.subject,
        preview_text: formData.preview_text,
        content: formData.content,
        target_audience: formData.target_audience,
      };

      if (formData.scheduled_at) {
        data.scheduled_at = formData.scheduled_at;
      }

      if (editingNewsletter) {
        await newslettersApi.update(editingNewsletter.id, data);
      } else {
        await newslettersApi.create(data);
      }
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving newsletter:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleAudience = (audience: string) => {
    setFormData((prev) => ({
      ...prev,
      target_audience: prev.target_audience.includes(audience)
        ? prev.target_audience.filter((a) => a !== audience)
        : [...prev.target_audience, audience],
    }));
  };

  const filteredNewsletters = newsletters.filter((n) =>
    n.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstimatedRecipients = () => {
    if (!stats) return 0;
    if (formData.target_audience.length === 0) return stats.active;
    let count = 0;
    if (formData.target_audience.includes('prospect')) count += stats.prospects;
    if (formData.target_audience.includes('client')) count += stats.clients;
    return count;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">
            {t('superadmin.marketing.newsletters.title')}
          </h1>
          <p className="text-primary-600 mt-1">{t('superadmin.marketing.newsletters.subtitle')}</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800"
        >
          <Plus className="h-5 w-5" />
          {t('superadmin.marketing.newsletters.new')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Mail className="h-5 w-5 text-primary-900" />
            </div>
            <div>
              <p className="text-sm text-primary-600">
                {t('superadmin.marketing.newsletters.total')}
              </p>
              <p className="text-xl font-bold">{newsletters.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">
                {t('superadmin.marketing.newsletters.sent')}
              </p>
              <p className="text-xl font-bold">
                {newsletters.filter((n) => n.status === 'sent').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">
                {t('superadmin.marketing.newsletters.scheduled')}
              </p>
              <p className="text-xl font-bold">
                {newsletters.filter((n) => n.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-900" />
            </div>
            <div>
              <p className="text-sm text-primary-600">
                {t('superadmin.marketing.newsletters.activeSubscribers')}
              </p>
              <p className="text-xl font-bold">{stats?.active || 0}</p>
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
                placeholder={t('superadmin.marketing.newsletters.searchPlaceholder')}
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
            <option value="">{t('superadmin.marketing.newsletters.allStatuses')}</option>
            <option value="draft">{t('superadmin.marketing.newsletters.drafts')}</option>
            <option value="scheduled">
              {t('superadmin.marketing.newsletters.scheduledFilter')}
            </option>
            <option value="sent">{t('superadmin.marketing.newsletters.sentFilter')}</option>
            <option value="failed">{t('superadmin.marketing.newsletters.failed')}</option>
          </select>
        </div>
      </div>

      {/* Newsletters List */}
      <div className="bg-white rounded-xl border border-primary-200">
        {loading ? (
          <div className="p-8 text-center text-primary-500">{t('common.loading')}</div>
        ) : filteredNewsletters.length === 0 ? (
          <div className="p-8 text-center text-primary-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary-300" />
            <p>{t('superadmin.marketing.newsletters.noNewsletters')}</p>
            <button
              onClick={handleCreateNew}
              className="mt-4 text-primary-900 hover:text-primary-700"
            >
              {t('superadmin.marketing.newsletters.createFirst')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-primary-200">
            {filteredNewsletters.map((newsletter) => (
              <div key={newsletter.id} className="p-4 hover:bg-primary-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-primary-900">{newsletter.subject}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[newsletter.status]}`}
                      >
                        {STATUS_LABELS[newsletter.status]}
                      </span>
                    </div>

                    {newsletter.preview_text && (
                      <p className="text-sm text-primary-600 mt-1">{newsletter.preview_text}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-primary-500">
                      {newsletter.target_audience && newsletter.target_audience.length > 0 ? (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {newsletter.target_audience
                            .map((a) =>
                              a === 'prospect'
                                ? t('superadmin.marketing.newsletters.prospects')
                                : t('superadmin.marketing.newsletters.clients')
                            )
                            .join(', ')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {t('superadmin.marketing.newsletters.allSubscribers')}
                        </span>
                      )}

                      {newsletter.status === 'sent' && (
                        <>
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {newsletter.recipients_count}{' '}
                            {t('superadmin.marketing.newsletters.recipients')}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            {newsletter.open_rate}% {t('superadmin.marketing.newsletters.openRate')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="h-4 w-4" />
                            {newsletter.click_rate}%{' '}
                            {t('superadmin.marketing.newsletters.clickRate')}
                          </span>
                        </>
                      )}

                      {newsletter.scheduled_at && newsletter.status === 'scheduled' && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t('superadmin.marketing.newsletters.scheduledFor')}:{' '}
                          {new Date(newsletter.scheduled_at).toLocaleString('fr-FR')}
                        </span>
                      )}

                      {newsletter.sent_at && (
                        <span>
                          {t('superadmin.marketing.newsletters.sentOn')}{' '}
                          {new Date(newsletter.sent_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {newsletter.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSend(newsletter)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          title="Envoyer maintenant"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowScheduleModal(newsletter);
                            setScheduleDate('');
                          }}
                          className="p-2 bg-primary-100 text-primary-900 rounded-lg hover:bg-primary-200"
                          title="Planifier"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setPreviewNewsletter(newsletter)}
                      className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"
                      title="Apercu"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(newsletter)}
                      className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"
                      title="Dupliquer"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {newsletter.status === 'draft' && (
                      <button
                        onClick={() => handleEdit(newsletter)}
                        className="p-2 bg-primary-100 text-primary-900 rounded-lg hover:bg-primary-200"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(newsletter)}
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
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingNewsletter
                  ? t('superadmin.marketing.newsletters.edit')
                  : t('superadmin.marketing.newsletters.new')}
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
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.newsletters.subject')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder={t('superadmin.marketing.newsletters.subjectPlaceholder')}
                  />
                </div>

                {/* Preview text */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.newsletters.previewText')}
                  </label>
                  <input
                    type="text"
                    value={formData.preview_text}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, preview_text: e.target.value }))
                    }
                    maxLength={150}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder={t('superadmin.marketing.newsletters.previewTextPlaceholder')}
                  />
                  <p className="text-xs text-primary-500 mt-1">
                    {formData.preview_text.length}/150{' '}
                    {t('superadmin.marketing.newsletters.characters')}
                  </p>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('superadmin.marketing.newsletters.targetAudience')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.target_audience.includes('prospect')}
                        onChange={() => toggleAudience('prospect')}
                        className="h-4 w-4 text-primary-900 rounded"
                      />
                      <span>
                        {t('superadmin.marketing.newsletters.prospects')} ({stats?.prospects || 0})
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.target_audience.includes('client')}
                        onChange={() => toggleAudience('client')}
                        className="h-4 w-4 text-primary-900 rounded"
                      />
                      <span>
                        {t('superadmin.marketing.newsletters.clients')} ({stats?.clients || 0})
                      </span>
                    </label>
                  </div>
                  <p className="text-sm text-primary-500 mt-2">
                    {t('superadmin.marketing.newsletters.estimatedRecipients')}:{' '}
                    {getEstimatedRecipients()} {t('superadmin.marketing.newsletters.subscribers')}
                  </p>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t('superadmin.marketing.newsletters.content')} *
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    rows={12}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    placeholder={t('superadmin.marketing.newsletters.contentPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t bg-primary-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
                >
                  {saving
                    ? t('common.saving')
                    : editingNewsletter
                      ? t('common.update')
                      : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {t('superadmin.marketing.newsletters.scheduleTitle')}
              </h2>
              <button
                onClick={() => setShowScheduleModal(null)}
                className="p-2 hover:bg-primary-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                {t('superadmin.marketing.newsletters.scheduleDateLabel')}
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-primary-50">
              <button
                onClick={() => setShowScheduleModal(null)}
                className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSchedule}
                disabled={!scheduleDate}
                className="px-6 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
              >
                {t('superadmin.marketing.newsletters.schedule')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewNewsletter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {t('superadmin.marketing.newsletters.preview')}
              </h2>
              <button
                onClick={() => setPreviewNewsletter(null)}
                className="p-2 hover:bg-primary-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Email header simulation */}
              <div className="bg-primary-100 p-4 border-b">
                <div className="text-sm">
                  <p>
                    <strong>De:</strong> ADVIST &lt;newsletter@advist.fr&gt;
                  </p>
                  <p>
                    <strong>Sujet:</strong> {previewNewsletter.subject}
                  </p>
                  {previewNewsletter.preview_text && (
                    <p className="text-primary-500 mt-1">{previewNewsletter.preview_text}</p>
                  )}
                </div>
              </div>
              {/* Email content */}
              <div
                className="p-6"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewNewsletter.content) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
