/**
 * Marketing Analytics Page - Detailed analytics and performance metrics
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MousePointer,
  Users,
  Calendar,
} from 'lucide-react';
import { analyticsApi } from '../../../services/marketing';
import type { MarketingAnalytics, SocialPlatform } from '../../../types';

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

const platformNames: Record<string, string> = {
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
};

export default function MarketingAnalyticsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsApi.getOverview(period);
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  const calculateEngagementRate = (): string => {
    if (!analytics || !analytics.metrics.impressions) return '0';
    const engagement = (analytics.metrics.likes || 0) + (analytics.metrics.comments || 0) + (analytics.metrics.shares || 0);
    return ((engagement / analytics.metrics.impressions) * 100).toFixed(2);
  };

  const getTopPlatform = (): string => {
    if (!analytics?.by_platform) return '-';
    let topPlatform = '';
    let maxPosts = 0;
    Object.entries(analytics.by_platform).forEach(([platform, data]) => {
      if (data.posts > maxPosts) {
        maxPosts = data.posts;
        topPlatform = platform;
      }
    });
    return platformNames[topPlatform] || '-';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

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
              <BarChart3 className="h-6 w-6 text-primary-900" />
              {t('superadmin.marketing.analyticsPage.title')}
            </h1>
            <p className="text-primary-500">{t('superadmin.marketing.analyticsPage.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={7}>{t('superadmin.marketing.analyticsPage.last7days')}</option>
            <option value={30}>{t('superadmin.marketing.analyticsPage.last30days')}</option>
            <option value={90}>{t('superadmin.marketing.analyticsPage.last90days')}</option>
            <option value={365}>{t('superadmin.marketing.analyticsPage.last12months')}</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.analyticsPage.totalPublications')}</p>
              <p className="text-3xl font-bold text-primary-900">{analytics?.total_publications || 0}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary-900" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">{analytics?.total_published || 0} {t('superadmin.marketing.status.published')}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.analyticsPage.impressions')}</p>
              <p className="text-3xl font-bold text-primary-900">
                {(analytics?.metrics.impressions || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Eye className="h-6 w-6 text-primary-900" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary-500">
            <Users className="h-4 w-4 mr-1" />
            <span>{(analytics?.metrics.reach || 0).toLocaleString()} {t('superadmin.marketing.analyticsPage.reach')}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.analyticsPage.totalEngagement')}</p>
              <p className="text-3xl font-bold text-primary-900">
                {((analytics?.metrics.likes || 0) + (analytics?.metrics.comments || 0) + (analytics?.metrics.shares || 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Heart className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary-500">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span>{calculateEngagementRate()}% {t('superadmin.marketing.analyticsPage.engagementRate')}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">{t('superadmin.marketing.analyticsPage.clicks')}</p>
              <p className="text-3xl font-bold text-primary-900">
                {(analytics?.metrics.clicks || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MousePointer className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary-500">
            <span>{t('superadmin.marketing.analyticsPage.bestPlatform')}: {getTopPlatform()}</span>
          </div>
        </div>
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary-500" />
            {t('superadmin.marketing.analyticsPage.likes')}
          </h3>
          <p className="text-4xl font-bold text-primary-900">
            {(analytics?.metrics.likes || 0).toLocaleString()}
          </p>
          <div className="mt-4 space-y-2">
            {analytics?.by_platform && Object.entries(analytics.by_platform).map(([platform, data]) => (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${platformColors[platform]}`}>
                    <img src={platformIcons[platform]} alt={platform} className="w-3 h-3 filter brightness-0 invert" />
                  </div>
                  <span className="text-sm text-primary-600">{platformNames[platform]}</span>
                </div>
                <span className="text-sm font-medium text-primary-900">{data.likes}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary-900" />
            {t('superadmin.marketing.analyticsPage.comments')}
          </h3>
          <p className="text-4xl font-bold text-primary-900">
            {(analytics?.metrics.comments || 0).toLocaleString()}
          </p>
          <div className="mt-4 space-y-2">
            {analytics?.by_platform && Object.entries(analytics.by_platform).map(([platform, data]) => (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${platformColors[platform]}`}>
                    <img src={platformIcons[platform]} alt={platform} className="w-3 h-3 filter brightness-0 invert" />
                  </div>
                  <span className="text-sm text-primary-600">{platformNames[platform]}</span>
                </div>
                <span className="text-sm font-medium text-primary-900">{data.comments}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-500" />
            {t('superadmin.marketing.analyticsPage.shares')}
          </h3>
          <p className="text-4xl font-bold text-primary-900">
            {(analytics?.metrics.shares || 0).toLocaleString()}
          </p>
          <div className="mt-4 space-y-2">
            {analytics?.by_platform && Object.entries(analytics.by_platform).map(([platform, data]) => (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${platformColors[platform]}`}>
                    <img src={platformIcons[platform]} alt={platform} className="w-3 h-3 filter brightness-0 invert" />
                  </div>
                  <span className="text-sm text-primary-600">{platformNames[platform]}</span>
                </div>
                <span className="text-sm font-medium text-primary-900">{data.shares}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-primary-200">
          <h3 className="text-lg font-semibold text-primary-900">{t('superadmin.marketing.analyticsPage.platformPerformance')}</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics?.by_platform && Object.entries(analytics.by_platform).map(([platform, data]) => {
              const totalEngagement = data.likes + data.comments + data.shares;
              const maxEngagement = Math.max(
                ...Object.values(analytics.by_platform).map(p => p.likes + p.comments + p.shares)
              );
              const percentage = maxEngagement > 0 ? (totalEngagement / maxEngagement) * 100 : 0;

              return (
                <div key={platform} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${platformColors[platform]}`}>
                    <img src={platformIcons[platform]} alt={platform} className="w-6 h-6 filter brightness-0 invert" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-primary-900">{platformNames[platform]}</span>
                      <span className="text-sm text-primary-500">{data.posts} {t('superadmin.marketing.analyticsPage.publications')}</span>
                    </div>
                    <div className="w-full bg-primary-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${platformColors[platform]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-primary-500">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {data.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {data.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" /> {data.shares}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">{t('superadmin.marketing.analyticsPage.statusDistribution')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-3xl font-bold text-primary-600">{analytics?.by_status.draft || 0}</p>
            <p className="text-sm text-primary-500">{t('superadmin.marketing.status.draft')}</p>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-3xl font-bold text-primary-900">{analytics?.by_status.scheduled || 0}</p>
            <p className="text-sm text-primary-500">{t('superadmin.marketing.status.scheduled')}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{analytics?.by_status.published || 0}</p>
            <p className="text-sm text-primary-500">{t('superadmin.marketing.status.published')}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{analytics?.by_status.failed || 0}</p>
            <p className="text-sm text-primary-500">{t('superadmin.marketing.status.failed')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
