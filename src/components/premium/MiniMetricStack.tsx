import React from 'react';
import { motion } from 'framer-motion';

interface MiniMetric {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'danger';
}

interface MiniMetricStackProps {
  metrics: MiniMetric[];
  columns?: 2 | 3;
  className?: string;
}

const colorMap = {
  default: 'bg-slate-50 dark:bg-slate-800/50',
  success: 'bg-emerald-50/60 dark:bg-emerald-950/20',
  warning: 'bg-amber-50/60 dark:bg-amber-950/20',
  danger: 'bg-rose-50/60 dark:bg-rose-950/20',
};

const trendSymbols = {
  up: { symbol: '\u2191', color: 'text-emerald-500' },
  down: { symbol: '\u2193', color: 'text-rose-500' },
  neutral: { symbol: '\u2022', color: 'text-slate-400' },
};

export const MiniMetricStack: React.FC<MiniMetricStackProps> = ({
  metrics,
  columns = 3,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 ${columns === 3 ? 'md:grid-cols-3' : ''} gap-3 ${className}`}>
      {metrics.map((metric, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className={`
            rounded-xl p-3.5
            ${colorMap[metric.color || 'default']}
            border border-slate-200/40 dark:border-slate-700/30
          `}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {metric.icon && (
              <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
                {metric.icon}
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500 truncate">
              {metric.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
              {metric.value}
            </span>
            {metric.trend && (
              <span className={`text-xs font-semibold ${trendSymbols[metric.trend].color}`}>
                {trendSymbols[metric.trend].symbol}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
