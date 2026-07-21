import React from 'react';
import { motion } from 'framer-motion';

interface HeroBrandHeaderProps {
  title?: string;
  subtitle?: string;
  chips?: { label: string; variant?: 'default' | 'accent' | 'muted' }[];
  className?: string;
}

export const HeroBrandHeader: React.FC<HeroBrandHeaderProps> = ({
  title = 'Advist',
  subtitle,
  chips,
  className = '',
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative py-8 ${className}`}
    >
      {/* Wordmark */}
      <h1 className="font-decorative text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight">
        {title}
      </h1>

      {/* Sub-eyebrow */}
      {subtitle && (
        <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
          {subtitle}
        </p>
      )}

      {/* Context chips */}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {chips.map((chip, i) => (
            <span
              key={i}
              className={`
                inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider
                ${
                  chip.variant === 'accent'
                    ? 'bg-[#F5EDDD] text-[#8A6C34] dark:bg-[#8A6C34]/25 dark:text-[#D4B87E]'
                    : chip.variant === 'muted'
                      ? 'bg-[#F1ECE1] text-[#78716A] dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-[#131C2E] text-white dark:bg-white dark:text-[#131C2E]'
                }
              `}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {/* Filet doré — signature Ivoire & Laiton */}
      <div
        className="mt-6 h-px w-full opacity-70"
        style={{
          background:
            'linear-gradient(90deg, transparent, #C9A96B 18%, #B9975B 50%, #C9A96B 82%, transparent)',
        }}
      />
    </motion.header>
  );
};
