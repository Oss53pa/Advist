/**
 * OfflineManager Component
 * Settings page component for managing offline data and preferences
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardContent } from '../ui';
import { useOfflineStore } from '../../stores/offlineStore';
import { offlineService } from '../../services/offline';

export function OfflineManager() {
  const { t } = useTranslation();
  const {
    isOnline,
    pendingCount,
    cachedDocuments,
    estimatedSize,
    isSyncing,
    lastSyncAt,
    lastSyncResult,
    syncNow,
    clearOfflineData,
    refreshStorageStats,
  } = useOfflineStore();

  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [syncQueue, setSyncQueue] = useState<Array<{ id: string; type: string; retries: number }>>(
    []
  );

  useEffect(() => {
    refreshStorageStats();
    loadSyncQueue();
  }, [refreshStorageStats]);

  const loadSyncQueue = async () => {
    const queue = await offlineService.getSyncQueue();
    setSyncQueue(
      queue.map((item) => ({
        id: item.id,
        type: item.action.type,
        retries: item.retries,
      }))
    );
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearOfflineData();
      setShowClearConfirm(false);
      setSyncQueue([]);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSync = async () => {
    await syncNow();
    await loadSyncQueue();
    await refreshStorageStats();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('common.never');
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-advist-gray900 dark:text-white">
            {t('offline.manager_title')}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Connection Status */}
            <div className="p-4 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isOnline
                      ? 'bg-green-50 text-advist-success dark:bg-green-50/30 dark:text-advist-success'
                      : 'bg-advist-gold-light text-advist-error dark:bg-advist-dark/30 dark:text-advist-gold'
                  }`}
                >
                  {isOnline ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                    {t('offline.connection')}
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      isOnline ? 'text-advist-success' : 'text-advist-error'
                    }`}
                  >
                    {isOnline ? t('offline.connected') : t('offline.disconnected')}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Actions */}
            <div className="p-4 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    pendingCount > 0
                      ? 'bg-advist-gold-light text-advist-gold-dark dark:bg-advist-gold-dark/30 dark:text-advist-gold'
                      : 'bg-advist-surface-dark text-advist-text-secondary dark:bg-advist-surface-dark dark:text-advist-text-muted'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                    {t('offline.pending_actions')}
                  </p>
                  <p className="text-lg font-semibold text-advist-gray900 dark:text-white">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Cached Documents */}
            <div className="p-4 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-advist-gold-light text-advist-gray900 dark:bg-advist-dark/30 dark:text-advist-gold flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                    {t('offline.cached_documents')}
                  </p>
                  <p className="text-lg font-semibold text-advist-gray900 dark:text-white">
                    {cachedDocuments}
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Used */}
            <div className="p-4 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-advist-surface-dark text-advist-gray900 dark:bg-advist-dark/30 dark:text-advist-text-secondary flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                    {t('offline.storage_used')}
                  </p>
                  <p className="text-lg font-semibold text-advist-gray900 dark:text-white">
                    {estimatedSize}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-advist-gray900 dark:text-white">
              {t('offline.sync_status')}
            </h3>
            <button
              onClick={handleSync}
              disabled={!isOnline || isSyncing || pendingCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-advist-dark text-white rounded-lg text-sm font-medium hover:bg-advist-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSyncing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('offline.syncing')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t('offline.sync_now')}
                </>
              )}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Last sync info */}
            <div className="flex items-center justify-between p-4 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
              <div>
                <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                  {t('offline.last_sync')}
                </p>
                <p className="font-medium text-advist-gray900 dark:text-white">
                  {formatDate(lastSyncAt)}
                </p>
              </div>
              {lastSyncResult && (
                <div className="text-right">
                  <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                    {t('offline.last_result')}
                  </p>
                  <p className="font-medium">
                    <span className="text-advist-success">
                      {lastSyncResult.synced} {t('offline.synced')}
                    </span>
                    {lastSyncResult.failed > 0 && (
                      <span className="text-advist-error ml-2">
                        {lastSyncResult.failed} {t('offline.failed')}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Sync queue */}
            {syncQueue.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-advist-gray900 dark:text-advist-text-muted mb-2">
                  {t('offline.sync_queue')}
                </h4>
                <div className="space-y-2">
                  {syncQueue.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            item.type === 'comment'
                              ? 'bg-advist-gold-light text-advist-gray900 dark:bg-advist-dark/30 dark:text-advist-gold'
                              : item.type === 'validation'
                                ? 'bg-green-50 text-advist-success dark:bg-green-50/30 dark:text-advist-success'
                                : 'bg-advist-surface-dark text-advist-gray900 dark:bg-advist-dark/30 dark:text-advist-text-secondary'
                          }`}
                        >
                          {t(`offline.action_type_${item.type}`)}
                        </span>
                      </div>
                      {item.retries > 0 && (
                        <span className="text-xs text-advist-gold-dark">
                          {t('offline.retries', { count: item.retries })}
                        </span>
                      )}
                    </div>
                  ))}
                  {syncQueue.length > 5 && (
                    <p className="text-sm text-advist-text-secondary text-center">
                      {t('offline.more_items', { count: syncQueue.length - 5 })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {pendingCount === 0 && (
              <div className="text-center py-4">
                <svg
                  className="w-12 h-12 mx-auto text-advist-text-muted dark:text-advist-text-secondary mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                  {t('offline.all_synced')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-advist-gray900 dark:text-white">
            {t('offline.data_management')}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
              {t('offline.data_management_description')}
            </p>

            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-advist-gold-light text-advist-error rounded-lg text-sm font-medium hover:bg-advist-gold-light dark:bg-advist-dark/20 dark:text-advist-gold dark:hover:bg-advist-dark/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t('offline.clear_all_data')}
              </button>
            ) : (
              <div className="p-4 bg-advist-gold-light dark:bg-advist-dark/20 rounded-lg">
                <p className="text-sm text-advist-error dark:text-advist-gold mb-4">
                  {t('offline.clear_confirm')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearData}
                    disabled={isClearing}
                    className="px-4 py-2 bg-advist-error text-white rounded-lg text-sm font-medium hover:bg-advist-dark disabled:opacity-50 transition-colors"
                  >
                    {isClearing ? t('common.processing') : t('common.confirm')}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-white text-advist-gray900 rounded-lg text-sm font-medium hover:bg-advist-surface-dark border border-advist-border transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info about offline functionality */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-advist-gray900 dark:text-white">
            {t('offline.about_title')}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-advist-text-secondary dark:text-advist-text-muted">
            <p>{t('offline.about_description')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('offline.feature_comments')}</li>
              <li>{t('offline.feature_validations')}</li>
              <li>{t('offline.feature_annotations')}</li>
              <li>{t('offline.feature_cache')}</li>
            </ul>
            <p className="text-advist-gold-dark dark:text-advist-gold">
              {t('offline.warning_signatures')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OfflineManager;
