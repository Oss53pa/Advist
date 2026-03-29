/**
 * OfflineBanner Component
 * Full-width banner shown when the application is offline
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfflineStore } from '../../stores/offlineStore';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline, pendingCount } = useOfflineStore();
  const [dismissed, setDismissed] = useState(false);

  // Show banner when offline and not dismissed
  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Icon and message */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
            </div>
            <div>
              <p className="font-medium">
                {t('offline.banner_title')}
              </p>
              <p className="text-sm text-advist-gold-light">
                {pendingCount > 0
                  ? t('offline.banner_pending', { count: pendingCount })
                  : t('offline.banner_message')
                }
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 rounded-full hover:bg-advist-gold/20 transition-colors"
            aria-label={t('common.close')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OfflineBanner;
