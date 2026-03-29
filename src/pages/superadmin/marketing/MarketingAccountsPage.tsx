/**
 * Marketing Accounts Page - Manage connected social accounts
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  RefreshCw,
  Unlink,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { socialAccountsApi } from '../../../services/marketing';
import type { SocialAccount, SocialPlatform } from '../../../types';

const platformColors: Record<string, string> = {
  facebook: 'bg-primary-900',
  linkedin: 'bg-primary-800',
  twitter: 'bg-black',
  instagram: 'bg-gradient-to-r from-primary-900 to-primary-700',
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
  whatsapp: 'WhatsApp Business',
};

const platforms: SocialPlatform[] = ['facebook', 'linkedin', 'twitter', 'instagram', 'whatsapp'];

export default function MarketingAccountsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await socialAccountsApi.list();
      setAccounts(data.results);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDisconnect = async (id: string) => {
    if (!confirm(t('superadmin.marketing.accounts.confirmDisconnect'))) return;
    try {
      await socialAccountsApi.disconnect(id);
      fetchAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
    setActionMenu(null);
  };

  const handleRefreshToken = async (id: string) => {
    try {
      await socialAccountsApi.refreshToken(id);
      fetchAccounts();
      alert(t('superadmin.marketing.accounts.tokenRefreshed'));
    } catch (error) {
      console.error('Error refreshing token:', error);
      alert(t('superadmin.marketing.accounts.tokenRefreshError'));
    }
    setActionMenu(null);
  };

  const handleConnect = async (platform: SocialPlatform) => {
    setConnecting(true);
    try {
      // TODO: Implement OAuth flow for each platform
      await socialAccountsApi.create({
        platform,
        account_name: `${platformNames[platform]}`,
        account_id: `${platform}_${Date.now()}`,
        is_active: true,
        metadata: {},
      });
      fetchAccounts();
      setShowConnectModal(false);
    } catch (error) {
      console.error('Error connecting account:', error);
    } finally {
      setConnecting(false);
    }
  };

  const isTokenExpiringSoon = (account: SocialAccount): boolean => {
    if (!account.token_expires_at) return false;
    const expiryDate = new Date(account.token_expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 7;
  };

  const connectedPlatforms = accounts.filter((a) => a.is_active).map((a) => a.platform);

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
              <Users className="h-6 w-6 text-primary-900" />
              {t('superadmin.marketing.accounts.title')}
            </h1>
            <p className="text-primary-500">{t('superadmin.marketing.accounts.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('superadmin.marketing.accounts.connectAccount')}
        </button>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="h-12 w-12 text-primary-400 mx-auto mb-4" />
          <p className="text-primary-500 mb-4">{t('superadmin.marketing.accounts.noAccounts')}</p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="text-primary-900 hover:text-primary-800"
          >
            {t('superadmin.marketing.accounts.connectFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-lg shadow overflow-hidden ${
                !account.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className={`h-2 ${platformColors[account.platform]}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${platformColors[account.platform]}`}
                    >
                      <img
                        src={platformIcons[account.platform]}
                        alt={account.platform}
                        className="w-6 h-6 filter brightness-0 invert"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-900">{account.account_name}</h3>
                      <p className="text-sm text-primary-500">{platformNames[account.platform]}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === account.id ? null : account.id)}
                      className="text-primary-400 hover:text-primary-600"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {actionMenu === account.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-10">
                        <button
                          onClick={() => handleRefreshToken(account.id)}
                          className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {t('superadmin.marketing.accounts.refreshToken')}
                        </button>
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Unlink className="h-4 w-4" />
                          {t('superadmin.marketing.accounts.disconnect')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {account.is_active ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">{t('superadmin.marketing.accounts.connected')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">{t('superadmin.marketing.accounts.disconnected')}</span>
                      </>
                    )}
                  </div>

                  {isTokenExpiringSoon(account) && (
                    <div className="flex items-center gap-2 text-primary-900">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{t('superadmin.marketing.accounts.tokenExpiring')}</span>
                    </div>
                  )}

                  {account.metadata && typeof account.metadata === 'object' && (
                    <div className="text-sm text-primary-500">
                      {(account.metadata as Record<string, unknown>).followers_count && (
                        <span>
                          {((account.metadata as Record<string, unknown>).followers_count as number).toLocaleString()} {t('superadmin.marketing.accounts.followers')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-primary-100 text-xs text-primary-500">
                  {t('superadmin.marketing.accounts.connectedOn')} {new Date(account.connected_at).toLocaleDateString('fr-FR')}
                  {account.connected_by_name && ` ${t('superadmin.marketing.accounts.by')} ${account.connected_by_name}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Platform Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('superadmin.marketing.accounts.platformOverview')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {platforms.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform);
            return (
              <div
                key={platform}
                className={`flex flex-col items-center p-4 rounded-lg border-2 ${
                  isConnected
                    ? 'border-green-200 bg-green-50'
                    : 'border-primary-200 bg-primary-50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                >
                  <img
                    src={platformIcons[platform]}
                    alt={platform}
                    className="w-6 h-6 filter brightness-0 invert"
                  />
                </div>
                <span className="mt-2 text-sm font-medium text-primary-700">
                  {platformNames[platform]}
                </span>
                {isConnected ? (
                  <span className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t('superadmin.marketing.accounts.connected')}
                  </span>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    className="mt-1 text-xs text-primary-900 hover:text-primary-800"
                  >
                    {t('superadmin.marketing.accounts.connect')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-primary-200">
              <h2 className="text-xl font-semibold text-primary-900">{t('superadmin.marketing.accounts.connectAccount')}</h2>
              <p className="text-sm text-primary-500 mt-1">
                {t('superadmin.marketing.accounts.selectPlatform')}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-3">
                {platforms.map((platform) => {
                  const isConnected = connectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => !isConnected && handleConnect(platform)}
                      disabled={isConnected || connecting}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                        isConnected
                          ? 'border-primary-200 bg-primary-50 cursor-not-allowed'
                          : 'border-primary-200 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                      >
                        <img
                          src={platformIcons[platform]}
                          alt={platform}
                          className="w-5 h-5 filter brightness-0 invert"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-primary-900">
                          {platformNames[platform]}
                        </span>
                        {isConnected && (
                          <span className="block text-xs text-green-600">{t('superadmin.marketing.accounts.alreadyConnected')}</span>
                        )}
                      </div>
                      {!isConnected && (
                        <Plus className="h-5 w-5 text-primary-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-primary-500 text-center">
                {t('superadmin.marketing.accounts.oauthNote')}
              </p>
            </div>

            <div className="flex justify-end p-6 border-t border-primary-200">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
