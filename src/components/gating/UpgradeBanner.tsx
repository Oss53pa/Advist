/**
 * UpgradeBanner — Bannière d'upgrade vers plan Entreprise
 *
 * Design: fond #1a1a1a, bordure amber #EF9F27, icône cadenas,
 * texte "Disponible en plan Entreprise", bouton "Voir les offres"
 *
 * Redirige vers Atlas Studio (paiements externalisés).
 */
import React from 'react';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { FEATURE_LABELS, type PlanFeature } from '../../config/planFeatures';

const ATLAS_STUDIO_PRICING = 'https://atlas-studio.org/applications/advist';

interface UpgradeBannerProps {
  feature?: PlanFeature;
  requiredPlan?: 'Business' | 'Entreprise';
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  feature,
  requiredPlan = 'Entreprise',
  title,
  description,
  size = 'md',
  className = '',
}) => {
  const featureLabel = feature ? FEATURE_LABELS[feature] : null;
  const effectiveTitle = title || featureLabel || 'Fonctionnalité verrouillée';
  const effectiveDescription =
    description ||
    `Disponible en plan ${requiredPlan}. Upgradez pour débloquer cette fonctionnalité.`;

  const sizes = {
    sm: {
      padding: 'p-4',
      iconSize: 'w-8 h-8',
      iconBox: 'w-10 h-10',
      title: 'text-sm',
      desc: 'text-xs',
      btn: 'px-3 py-2 text-xs',
    },
    md: {
      padding: 'p-6',
      iconSize: 'w-10 h-10',
      iconBox: 'w-14 h-14',
      title: 'text-lg',
      desc: 'text-sm',
      btn: 'px-5 py-2.5 text-sm',
    },
    lg: {
      padding: 'p-8',
      iconSize: 'w-12 h-12',
      iconBox: 'w-16 h-16',
      title: 'text-2xl',
      desc: 'text-base',
      btn: 'px-6 py-3 text-base',
    },
  };
  const s = sizes[size];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 ${s.padding} ${className}`}
      style={{
        backgroundColor: '#1a1a1a',
        borderColor: '#EF9F27',
      }}
      role="region"
      aria-label="Fonctionnalité disponible en plan Entreprise"
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(239, 159, 39, 0.08)' }}
      />

      <div className="relative flex flex-col sm:flex-row items-start gap-5">
        {/* Lock icon */}
        <div
          className={`${s.iconBox} rounded-xl flex items-center justify-center shrink-0 border`}
          style={{
            backgroundColor: 'rgba(239, 159, 39, 0.1)',
            borderColor: 'rgba(239, 159, 39, 0.3)',
          }}
        >
          <Lock className={s.iconSize} style={{ color: '#EF9F27' }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(239, 159, 39, 0.15)',
                color: '#EF9F27',
              }}
            >
              <Sparkles className="w-3 h-3" />
              Plan {requiredPlan}
            </span>
          </div>
          <h3 className={`${s.title} font-bold text-white mb-1`}>{effectiveTitle}</h3>
          <p className={`${s.desc} text-white/60 leading-relaxed mb-4`}>{effectiveDescription}</p>

          {/* CTA Button */}
          <a
            href={ATLAS_STUDIO_PRICING}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 ${s.btn} rounded-lg font-bold transition-all hover:scale-[1.02] shadow-lg`}
            style={{
              backgroundColor: '#EF9F27',
              color: '#0d0d0d',
              boxShadow: '0 4px 20px rgba(239, 159, 39, 0.25)',
            }}
          >
            Voir les offres
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default UpgradeBanner;
