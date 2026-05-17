import React from 'react';
import { motion } from 'framer-motion';

interface AxisScore {
  label: string;
  score: number; // 0-100
  color?: string;
}

interface AuditScoreRingProps {
  score: number; // 0-100
  label?: string;
  subtitle?: string;
  axes?: AxisScore[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const AuditScoreRing: React.FC<AuditScoreRingProps> = ({
  score,
  label = 'Score global',
  subtitle,
  axes,
  size = 160,
  strokeWidth = 10,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`
        rounded-2xl p-6
        bg-white dark:bg-slate-900
        border border-slate-200/60 dark:border-slate-700/40
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]
        ${className}
      `}
    >
      <div className="flex flex-col items-center">
        {/* Ring */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Score ring */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white"
            >
              {score}
            </motion.span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
              /100
            </span>
          </div>
        </div>

        {/* Label */}
        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}

        {/* Axes bars */}
        {axes && axes.length > 0 && (
          <div className="w-full mt-5 space-y-2.5">
            {axes.map((axis, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 w-24 truncate">
                  {axis.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${axis.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: axis.color || scoreColor }}
                  />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-slate-300 w-8 text-right">
                  {axis.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
