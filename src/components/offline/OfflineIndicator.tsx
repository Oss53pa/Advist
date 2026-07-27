/**
 * OfflineIndicator Component
 * Shows the current online/offline status and pending sync actions
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfflineStore } from '../../stores/offlineStore';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const { isOnline, isSyncing, pendingCount, lastSyncAt, syncNow, init } = useOfflineStore();
  const [showDetails, setShowDetails] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      init().then(() => setInitialized(true));
    }
  }, [init, initialized]);

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return t('common.never');
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return t('common.just_now');
    if (diff < 3600) return t('common.minutes_ago', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('common.hours_ago', { count: Math.floor(diff / 3600) });
    return t('common.days_ago', { count: Math.floor(diff / 86400) });
  };

  // Don't show anything if online with no pending actions
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="relative">
      {/* Status indicator button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isOnline
            ? isSyncing
              ? 'bg-advist-gold-light text-advist-gray900 dark:bg-advist-dark/30 dark:text-advist-gold'
              : pendingCount > 0
                ? 'bg-advist-gold-light text-advist-gold-dark dark:bg-advist-gold-dark/30 dark:text-advist-gold'
                : 'bg-green-50 text-advist-success dark:bg-green-50/30 dark:text-advist-success'
            : 'bg-advist-gold-light text-advist-error dark:bg-advist-dark/30 dark:text-advist-gold'
        }`}
      >
        {/* Status icon */}
        {isSyncing ? (
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
        ) : isOnline ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        )}

        {/* Status text */}
        <span>
          {isSyncing
            ? t('offline.syncing')
            : isOnline
              ? pendingCount > 0
                ? t('offline.pending', { count: pendingCount })
                : t('offline.online')
              : t('offline.offline')}
        </span>

        {/* Pending count badge */}
        {pendingCount > 0 && !isSyncing && (
          <span
            className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
              isOnline ? 'bg-advist-gold text-advist-gray900' : 'bg-advist-error text-white'
            }`}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {/* Details dropdown */}
      {showDetails && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDetails(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-advist-dark rounded-lg shadow-lg border border-advist-border dark:border-primary-700 z-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-advist-gray900 dark:text-white mb-3">
                {t('offline.status_title')}
              </h3>

              {/* Connection status */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                  {t('offline.connection')}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isOnline ? 'text-advist-success' : 'text-advist-error'
                  }`}
                >
                  {isOnline ? t('offline.connected') : t('offline.disconnected')}
                </span>
              </div>

              {/* Pending actions */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                  {t('offline.pending_actions')}
                </span>
                <span className="text-sm font-medium text-advist-gray900 dark:text-white">
                  {pendingCount}
                </span>
              </div>

              {/* Last sync */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-advist-text-secondary dark:text-advist-text-muted">
                  {t('offline.last_sync')}
                </span>
                <span className="text-sm text-advist-gray900 dark:text-white">
                  {formatRelativeTime(lastSyncAt)}
                </span>
              </div>

              {/* Sync button */}
              {isOnline && pendingCount > 0 && (
                <button
                  onClick={() => {
                    syncNow();
                    setShowDetails(false);
                  }}
                  disabled={isSyncing}
                  className="w-full py-2 px-4 bg-advist-dark text-white rounded-lg text-sm font-medium hover:bg-advist-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSyncing ? (
                    <span className="flex items-center justify-center gap-2">
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
                    </span>
                  ) : (
                    t('offline.sync_now')
                  )}
                </button>
              )}

              {/* Offline message */}
              {!isOnline && (
                <div className="p-3 bg-advist-surface-dark dark:bg-advist-dark/50 rounded-lg">
                  <p className="text-xs text-advist-text-secondary dark:text-advist-text-muted">
                    {t('offline.offline_message')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
