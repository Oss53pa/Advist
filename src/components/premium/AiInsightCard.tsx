import React from 'react';
import { motion } from 'framer-motion';

interface AiInsightCardProps {
  title: string;
  description: string;
  confidence?: number; // 0-100
  confidenceLabel?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
  className?: string;
}

export const AiInsightCard: React.FC<AiInsightCardProps> = ({
  title,
  description,
  confidence,
  confidenceLabel,
  primaryAction,
  secondaryAction,
  icon,
  className = '',
}) => {
  const confidenceColor =
    confidence && confidence >= 80
      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
      : confidence && confidence >= 50
        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
        : 'text-slate-500 bg-slate-100 dark:bg-slate-800';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br from-white via-white to-[#f5f0e8]/40
        dark:from-slate-900 dark:via-slate-900 dark:to-[#b8a47e]/5
        border border-slate-200/60 dark:border-slate-700/40
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]
        ${className}
      `}
    >
      {/* Gold gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#b8a47e]/8 to-transparent rounded-bl-full" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {icon && (
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center text-[#b8a47e] shadow-sm">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {title}
            </h4>
            {confidence !== undefined && (
              <span
                className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${confidenceColor}`}
              >
                {confidenceLabel || `${confidence}% confiance`}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
          {description}
        </p>

        {/* CTAs */}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
