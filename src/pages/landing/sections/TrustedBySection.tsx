import React, { useState, useEffect } from 'react';
import { publicLandingApi, type TrustedCompany } from '../../../services/landingConfig';

const fallbackCompanies: TrustedCompany[] = [
  { name: 'Orange', logo_url: '' },
  { name: 'Ecobank', logo_url: '' },
  { name: 'NSIA', logo_url: '' },
  { name: 'Societe Generale', logo_url: '' },
  { name: 'Total Energies', logo_url: '' },
  { name: 'MTN', logo_url: '' },
  { name: 'UBA', logo_url: '' },
  { name: 'BSIC', logo_url: '' },
  { name: 'Orabank', logo_url: '' },
  { name: 'BIAO', logo_url: '' },
];

export const TrustedBySection: React.FC = () => {
  const [companies, setCompanies] = useState<TrustedCompany[]>(fallbackCompanies);

  useEffect(() => {
    publicLandingApi
      .getConfig()
      .then((config) => {
        if (config.trusted_companies && config.trusted_companies.length > 0) {
          setCompanies(config.trusted_companies);
        }
      })
      .catch(() => {
        // Keep fallback
      });
  }, []);

  return (
    <section id="trusted" className="py-20 bg-[#131C2E] border-b border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm text-white/40 font-medium mb-10 tracking-wider uppercase">
          +500 entreprises nous font confiance
        </p>

        {/* Infinite scroll logos */}
        <div className="relative">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#131C2E] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#131C2E] to-transparent z-10" />

          {/* Scrolling container */}
          <div className="flex animate-scroll-infinite gap-12">
            {[...companies, ...companies, ...companies].map((company, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-8 py-4 bg-white/5 rounded-2xl flex-shrink-0 hover:bg-white/10 transition-colors group border border-white/5"
              >
                {company.logo_url ? (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 overflow-hidden p-1.5">
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#B9975B]/10 text-[#B9975B] font-bold text-lg group-hover:bg-[#B9975B]/20 transition-colors">
                    {company.name.charAt(0)}
                  </div>
                )}
                <span className="font-medium text-white/60 whitespace-nowrap">{company.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'ENTREPRISES' },
            { value: '17', label: 'PAYS OHADA' },
            { value: '100%', label: 'CONFORMITÉ' },
            { value: '99.9%', label: 'DISPONIBILITÉ' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-medium text-[#B9975B] tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] text-white/40 mt-2 tracking-[0.2em] font-normal uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
        .animate-scroll-infinite {
          animation: scroll-infinite 30s linear infinite;
        }
        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default TrustedBySection;
