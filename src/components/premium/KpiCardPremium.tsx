import React from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

type DeltaType = 'positive' | 'negative' | 'neutral';

interface KpiCardPremiumProps {
  eyebrow: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string;
    type: DeltaType;
  };
  sparklineData?: { v: number }[];
  icon?: React.ReactNode;
  className?: string;
}

const deltaColors: Record<DeltaType, { text: string; bg: string; arrow: string }> = {
  positive: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    arrow: '\u2197',
  },
  negative: { text: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', arrow: '\u2198' },
  neutral: { text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', arrow: '\u2192' },
};

export const KpiCardPremium: React.FC<KpiCardPremiumProps> = ({
  eyebrow,
  value,
  unit,
  delta,
  sparklineData,
  icon,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white dark:bg-slate-900
        border border-slate-200/60 dark:border-slate-700/40
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.04)]
        transition-all duration-300 ease-out
        p-5 group
        ${className}
      `}
    >
      {/* Subtle top accent line — gold institutional */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B9975B]/30 via-[#D4B87E]/20 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Eyebrow */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 mb-2">
            {eyebrow}
          </p>

          {/* Value */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{unit}</span>
            )}
          </div>

          {/* Delta chip */}
          {delta && (
            <div
              className={`inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-full text-xs font-semibold ${deltaColors[delta.type].bg} ${deltaColors[delta.type].text}`}
            >
              <span>{deltaColors[delta.type].arrow}</span>
              <span>{delta.value}</span>
            </div>
          )}
        </div>

        {/* Icon or Sparkline */}
        <div className="flex-shrink-0">
          {sparklineData && sparklineData.length > 0 ? (
            <div className="w-20 h-10 opacity-60 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B9975B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#B9975B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#B9975B"
                    strokeWidth={1.5}
                    fill="url(#sparkGrad)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : icon ? (
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              {icon}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
