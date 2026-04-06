/**
 * Marketing Subscribers Page - Gestion des abonnes newsletter
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Mail,
  UserCheck,
  UserX,
  Download,
  Trash2,
  _Filter,
  Building2,
  Calendar,
} from 'lucide-react';
import { subscribersApi } from '../../../services/marketing';
import type { NewsletterSubscriber, SubscriberStats, SubscriberType } from '../../../types';

const TYPE_LABELS: Record<SubscriberType, string> = {
  prospect: 'Prospect',
  client: 'Client',
};

const TYPE_COLORS: Record<SubscriberType, string> = {
  prospect: 'bg-primary-100 text-primary-800',
  client: 'bg-green-100 text-green-800',
};

export default function MarketingSubscribersPage() {
  const { t } = useTranslation();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [typeFilter, activeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | boolean> = {};
      if (typeFilter) params.subscriber_type = typeFilter;
      if (activeFilter === 'active') params.is_active = true;
      if (activeFilter === 'inactive') params.is_active = false;

      const [subscribersResponse, statsResponse] = await Promise.all([
        subscribersApi.list(params),
        subscribersApi.stats(),
      ]);

      setSubscribers(subscribersResponse.results || []);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (subscriber: NewsletterSubscriber) => {
    if (
      !confirm(
        t('superadmin.marketing.subscribers.confirmUnsubscribe', { email: subscriber.email })
      )
    )
      return;

    try {
      await subscribersApi.unsubscribe(subscriber.id);
      await loadData();
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  const handleDelete = async (subscriber: NewsletterSubscriber) => {
    if (!confirm(t('superadmin.marketing.subscribers.confirmDelete', { email: subscriber.email })))
      return;

    try {
      await subscribersApi.delete(subscriber.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleBulkUnsubscribe = async () => {
    if (
      !confirm(
        t('superadmin.marketing.subscribers.confirmBulkUnsubscribe', { count: selectedIds.length })
      )
    )
      return;

    try {
      await Promise.all(selectedIds.map((id) => subscribersApi.unsubscribe(id)));
      setSelectedIds([]);
      await loadData();
    } catch (error) {
      console.error('Error bulk unsubscribing:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Email', 'Prenom', 'Nom', 'Type', 'Actif', 'Date inscription'].join(','),
      ...filteredSubscribers.map((s) =>
        [
          s.email,
          s.first_name || '',
          s.last_name || '',
          TYPE_LABELS[s.subscriber_type],
          s.is_active ? 'Oui' : 'Non',
          new Date(s.subscribed_at).toLocaleDateString('fr-FR'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `abonnes_newsletter_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscribers.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.first_name && s.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.last_name && s.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">
            {t('superadmin.marketing.subscribers.title')}
          </h1>
          <p className="text-primary-600 mt-1">{t('superadmin.marketing.subscribers.subtitle')}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
        >
          <Download className="h-5 w-5" />
          {t('superadmin.marketing.subscribers.exportCsv')}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-900" />
              </div>
              <div>
                <p className="text-sm text-primary-600">
                  {t('superadmin.marketing.subscribers.total')}
                </p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-primary-600">
                  {t('superadmin.marketing.subscribers.active')}
                </p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Mail className="h-5 w-5 text-primary-900" />
              </div>
              <div>
                <p className="text-sm text-primary-600">
                  {t('superadmin.marketing.subscribers.prospects')}
                </p>
                <p className="text-xl font-bold">{stats.prospects}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building2 className="h-5 w-5 text-primary-900" />
              </div>
              <div>
                <p className="text-sm text-primary-600">
                  {t('superadmin.marketing.subscribers.clients')}
                </p>
                <p className="text-xl font-bold">{stats.clients}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-primary-600">
                  {t('superadmin.marketing.subscribers.unsubscribed')}
                </p>
                <p className="text-xl font-bold">{stats.unsubscribed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-primary-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <input
                type="text"
                placeholder={t('superadmin.marketing.subscribers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('superadmin.marketing.subscribers.allTypes')}</option>
            <option value="prospect">{t('superadmin.marketing.subscribers.prospects')}</option>
            <option value="client">{t('superadmin.marketing.subscribers.clients')}</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('superadmin.marketing.subscribers.allStatuses')}</option>
            <option value="active">{t('superadmin.marketing.subscribers.activeFilter')}</option>
            <option value="inactive">
              {t('superadmin.marketing.subscribers.unsubscribedFilter')}
            </option>
          </select>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkUnsubscribe}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <UserX className="h-4 w-4" />
              {t('superadmin.marketing.subscribers.unsubscribe')} ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-xl border border-primary-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-primary-500">{t('common.loading')}</div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-8 text-center text-primary-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary-300" />
            <p>{t('superadmin.marketing.subscribers.noSubscribers')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-primary-50 border-b border-primary-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredSubscribers.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-primary-900 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary-600">
                  {t('superadmin.marketing.subscribers.subscriber')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary-600">
                  {t('superadmin.marketing.subscribers.type')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary-600">
                  {t('superadmin.marketing.subscribers.organization')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary-600">
                  {t('superadmin.marketing.subscribers.status')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary-600">
                  {t('superadmin.marketing.subscribers.subscription')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-primary-600">
                  {t('superadmin.marketing.subscribers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-200">
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-primary-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(subscriber.id)}
                      onChange={() => toggleSelect(subscriber.id)}
                      className="h-4 w-4 text-primary-900 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-primary-900">{subscriber.email}</p>
                      {(subscriber.first_name || subscriber.last_name) && (
                        <p className="text-sm text-primary-500">
                          {subscriber.first_name} {subscriber.last_name}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${TYPE_COLORS[subscriber.subscriber_type]}`}
                    >
                      {TYPE_LABELS[subscriber.subscriber_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-primary-600">
                    {subscriber.organization_name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {subscriber.is_active ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <UserCheck className="h-4 w-4" />
                        {t('superadmin.marketing.subscribers.activeStatus')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-red-600">
                        <UserX className="h-4 w-4" />
                        {t('superadmin.marketing.subscribers.unsubscribedStatus')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm text-primary-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(subscriber.subscribed_at).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {subscriber.is_active && (
                        <button
                          onClick={() => handleUnsubscribe(subscriber)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                          title="Desabonner"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(subscriber)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
