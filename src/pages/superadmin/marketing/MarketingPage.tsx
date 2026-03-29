/**
 * Marketing Dashboard - Main page for social media management
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Calendar,
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  Mail,
  UserPlus,
} from 'lucide-react';
import { analyticsApi, publicationsApi } from '../../../services/marketing';
import type { MarketingAnalytics, Publication } from '../../../types';

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

export default function MarketingPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);
  const [recentPublications, setRecentPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, publicationsData] = await Promise.all([
          analyticsApi.getOverview(30),
          publicationsApi.list({ ordering: '-created_at' }),
        ]);
        setAnalytics(analyticsData);
        setRecentPublications(publicationsData.results.slice(0, 5));
      } catch (error) {
        console.error('Error fetching marketing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickLinks = [
    { name: t('superadmin.marketing.publications'), href: '/superadmin/marketing/posts', icon: FileText, color: 'bg-primary-900' },
    { name: t('superadmin.marketing.calendar'), href: '/superadmin/marketing/calendar', icon: Calendar, color: 'bg-primary-800' },
    { name: t('superadmin.marketing.templates'), href: '/superadmin/marketing/templates', icon: FileText, color: 'bg-primary-700' },
    { name: t('superadmin.marketing.blog'), href: '/superadmin/marketing/blog', icon: BookOpen, color: 'bg-primary-900' },
    { name: t('superadmin.marketing.newsletters'), href: '/superadmin/marketing/newsletters', icon: Mail, color: 'bg-primary-800' },
    { name: t('superadmin.marketing.subscribers'), href: '/superadmin/marketing/subscribers', icon: UserPlus, color: 'bg-primary-700' },
    { name: t('superadmin.marketing.accounts'), href: '/superadmin/marketing/accounts', icon: Users, color: 'bg-primary-900' },
    { name: t('superadmin.marketing.analytics'), href: '/superadmin/marketing/analytics', icon: BarChart3, color: 'bg-primary-800' },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-primary-100 text-primary-700',
      scheduled: 'bg-primary-100 text-primary-800',
      publishing: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
        {t(`superadmin.marketing.status.${status}`)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary-900" />
            {t('superadmin.marketing.title')}
          </h1>
          <p className="text-primary-500 mt-1">{t('superadmin.marketing.subtitle')}</p>
        </div>
        <Link
          to="/superadmin/marketing/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('superadmin.marketing.newPublication')}
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-full ${link.color}`}>
              <link.icon className="h-6 w-6 text-white" />
            </div>
            <span className="mt-2 text-sm font-medium text-primary-700">{link.name}</span>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.totalPublications')}</p>
              <p className="text-2xl font-bold text-primary-900">{analytics?.total_publications || 0}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <FileText className="h-6 w-6 text-primary-900" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              {analytics?.by_status.published || 0} {t('superadmin.marketing.published')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.scheduled')}</p>
              <p className="text-2xl font-bold text-primary-900">{analytics?.by_status.scheduled || 0}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Clock className="h-6 w-6 text-primary-900" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary-500">
            <span>{analytics?.by_status.draft || 0} {t('superadmin.marketing.drafts')}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.totalEngagement')}</p>
              <p className="text-2xl font-bold text-primary-900">
                {((analytics?.metrics.likes || 0) + (analytics?.metrics.comments || 0) + (analytics?.metrics.shares || 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Heart className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-primary-500">
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {analytics?.metrics.likes || 0}
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {analytics?.metrics.comments || 0}
            </span>
            <span className="flex items-center">
              <Share2 className="h-3 w-3 mr-1" />
              {analytics?.metrics.shares || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.reach')}</p>
              <p className="text-2xl font-bold text-primary-900">
                {(analytics?.metrics.reach || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary-500">
            <span>{(analytics?.metrics.impressions || 0).toLocaleString()} {t('superadmin.marketing.impressions')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Platform */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">{t('superadmin.marketing.performanceByPlatform')}</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics?.by_platform && Object.entries(analytics.by_platform).map(([platform, data]) => (
                <div key={platform} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${platformColors[platform]}`}>
                      <img
                        src={platformIcons[platform]}
                        alt={platform}
                        className="w-5 h-5 filter brightness-0 invert"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-primary-900 capitalize">{platform}</p>
                      <p className="text-sm text-primary-500">{data.posts} publications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-primary-600">
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1 text-primary-500" />
                      {data.likes}
                    </span>
                    <span className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1 text-primary-900" />
                      {data.comments}
                    </span>
                    <span className="flex items-center">
                      <Share2 className="h-4 w-4 mr-1 text-green-500" />
                      {data.shares}
                    </span>
                  </div>
                </div>
              ))}
              {(!analytics?.by_platform || Object.keys(analytics.by_platform).length === 0) && (
                <p className="text-center text-primary-500 py-4">{t('superadmin.marketing.noDataAvailable')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Publications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-primary-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">{t('superadmin.marketing.recentPublications')}</h2>
            <Link to="/superadmin/marketing/posts" className="text-sm text-primary-900 hover:text-primary-800">
              {t('superadmin.marketing.viewAll')}
            </Link>
          </div>
          <div className="divide-y divide-primary-200">
            {recentPublications.map((publication) => (
              <div key={publication.id} className="p-4 hover:bg-primary-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary-900 truncate">{publication.title}</p>
                    <p className="text-sm text-primary-500 truncate">{publication.content.substring(0, 60)}...</p>
                    <div className="flex items-center gap-2 mt-2">
                      {publication.platforms.map((platform) => (
                        <div
                          key={platform}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                          title={platform}
                        >
                          <img
                            src={platformIcons[platform]}
                            alt={platform}
                            className="w-3 h-3 filter brightness-0 invert"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    {getStatusBadge(publication.status)}
                    <span className="text-xs text-primary-500 mt-2">
                      {new Date(publication.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentPublications.length === 0 && (
              <p className="text-center text-primary-500 py-8">{t('superadmin.marketing.noPublication')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('superadmin.marketing.statusOverview')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg">
            <div className="p-2 bg-primary-200 rounded-full">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{analytics?.by_status.draft || 0}</p>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.status.draft')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg">
            <div className="p-2 bg-primary-200 rounded-full">
              <Clock className="h-5 w-5 text-primary-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{analytics?.by_status.scheduled || 0}</p>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.status.scheduled')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-200 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{analytics?.by_status.published || 0}</p>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.status.published')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <div className="p-2 bg-red-200 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{analytics?.by_status.failed || 0}</p>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.status.failed')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
