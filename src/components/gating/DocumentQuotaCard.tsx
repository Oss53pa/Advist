/**
 * DocumentQuotaCard — Compteur X / 50 documents ce mois
 *
 * Affiche une carte de progression pour la limite mensuelle de documents
 * (uniquement en plan Business). Affiche un banner "Limite atteinte"
 * quand current >= max.
 *
 * En plan Enterprise (max = null), affiche un simple compteur "Illimité".
 */
import React from 'react';
import { FileText, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useDocumentQuota, useTenantPlan } from '../../hooks/useTenantPlan';

const ATLAS_STUDIO_PRICING = 'https://atlas-studio.org/applications/advist';

interface DocumentQuotaCardProps {
  className?: string;
  compact?: boolean;
}

export const DocumentQuotaCard: React.FC<DocumentQuotaCardProps> = ({
  className = '',
  compact = false,
}) => {
  const quota = useDocumentQuota();
  const plan = useTenantPlan();

  // Enterprise: show unlimited indicator
  if (quota.isUnlimited) {
    if (compact) {
      return (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 ${className}`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">Documents illimités</span>
        </div>
      );
    }
    return (
      <div className={`bg-white border border-emerald-200 rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Plan {plan.displayName}
            </p>
            <p className="text-sm font-bold text-gray-900">
              {quota.current} documents ce mois &bull;{' '}
              <span className="text-emerald-600">Illimité</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Business: show quota bar
  const { current, max, percentage, limitReached } = quota;
  const warning = percentage >= 80 && !limitReached;
  const barColor = limitReached ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-primary-700';

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
          limitReached
            ? 'bg-red-50 border-red-200'
            : warning
              ? 'bg-amber-50 border-amber-200'
              : 'bg-gray-50 border-gray-200'
        } ${className}`}
      >
        <FileText
          className={`w-4 h-4 ${
            limitReached ? 'text-red-600' : warning ? 'text-amber-600' : 'text-gray-600'
          }`}
        />
        <span
          className={`text-xs font-medium ${
            limitReached ? 'text-red-700' : warning ? 'text-amber-700' : 'text-gray-700'
          }`}
        >
          {current} / {max} documents
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border ${
        limitReached
          ? 'border-red-300 shadow-md shadow-red-100'
          : warning
            ? 'border-amber-300 shadow-sm'
            : 'border-gray-200'
      } p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              limitReached ? 'bg-red-50' : warning ? 'bg-amber-50' : 'bg-primary-50'
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                limitReached ? 'text-red-600' : warning ? 'text-amber-600' : 'text-primary-700'
              }`}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Quota mensuel
            </p>
            <p className="text-sm font-bold text-gray-900">
              {current} / {max} documents ce mois
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-bold ${
            limitReached ? 'text-red-600' : warning ? 'text-amber-600' : 'text-primary-700'
          }`}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status message */}
      {limitReached ? (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-800">Limite mensuelle atteinte</p>
              <p className="text-xs text-red-600 mt-0.5">
                Passez en Entreprise pour un volume illimité de documents.
              </p>
              <a
                href={ATLAS_STUDIO_PRICING}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Upgrader
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      ) : warning ? (
        <p className="text-xs text-amber-700">
          Attention : vous approchez de la limite mensuelle. Pensez à upgrader.
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          {quota.remaining} documents restants ce mois en plan {plan.displayName}
        </p>
      )}
    </div>
  );
};

export default DocumentQuotaCard;
