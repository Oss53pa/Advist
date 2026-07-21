import React from 'react';

import { ArrowRight, Play, Check, Star, Shield } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useLandingContent } from '../../../hooks/useLandingContent';

interface CTASectionProps {
  onDemoClick?: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onDemoClick }) => {
  const { ref, isVisible } = useScrollAnimation();
  const { content: remoteContent } = useLandingContent('advist');
  const remoteCta = remoteContent?.cta;
  const ctaTitle = remoteCta?.title ?? 'Pret a transformer votre gestion documentaire ?';

  return (
    <section ref={ref} className="py-32 bg-[#131C2E] relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#B9975B]/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Headline */}
        <h2
          className={`text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          {ctaTitle}
        </h2>

        <p
          className={`text-base text-white/40 font-light max-w-2xl mx-auto mb-12 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          Commencez gratuitement et decouvrez comment ADVIST peut accelerer vos processus de
          validation et de signature.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <a href="https://atlas-studio.org/portal?app=advist">
            <button className="group relative flex items-center justify-center gap-3 px-7 py-3.5 bg-[#B9975B] text-[#131C2E] text-sm font-medium rounded-xl overflow-hidden transition-all duration-300 hover:bg-[#D4B87E] hover:shadow-[0_0_40px_8px_rgba(200,169,97,0.15)] hover:scale-[1.02]">
              <span className="relative z-10">Demarrer gratuitement</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </a>
          <button
            onClick={onDemoClick}
            className="group flex items-center justify-center gap-3 px-7 py-3.5 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm"
          >
            <Play className="w-5 h-5 text-white/70" fill="currentColor" />
            <span className="font-medium text-white/80">Voir la demo</span>
          </button>
        </div>

        {/* Trust elements */}
        <div
          className={`flex flex-wrap items-center justify-center gap-6 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#B9975B]/40" />
            <span className="text-sm text-white/40">Souscrivez maintenant</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#B9975B]/40" />
            <span className="text-sm text-white/40">Sans carte bancaire</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#B9975B]/40" />
            <span className="text-sm text-white/40">Support inclus</span>
          </div>
        </div>

        {/* Testimonial */}
        <div
          className={`mt-16 max-w-xl mx-auto transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-[#B9975B]/10">
            <div className="flex items-center gap-1 justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[#B9975B]/60 text-[#B9975B]/60" />
              ))}
            </div>
            <p className="text-white/60 italic mb-4">
              "ADVIST a revolutionne notre gestion documentaire. Nous avons reduit de 70% le temps
              de validation de nos contrats."
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B9975B]/10 flex items-center justify-center text-[#B9975B] font-bold text-sm">
                AK
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white/80">Aminata Kone</p>
                <p className="text-xs text-white/40">Directrice Juridique, Orange CI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div
          className={`mt-12 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          {[
            { label: 'OHADA' },
            { label: 'Loi CI 2013-546' },
            { label: 'RGPD' },
            { label: 'Audit SHA-256' },
          ].map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10"
            >
              <Shield className="w-4 h-4 text-[#B9975B]/30" />
              <span className="text-sm font-medium text-white/50">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
