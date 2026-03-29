import React from 'react';

const companies = [
  { name: 'Orange' },
  { name: 'Ecobank' },
  { name: 'NSIA' },
  { name: 'Societe Generale' },
  { name: 'Total Energies' },
  { name: 'MTN' },
  { name: 'UBA' },
  { name: 'BSIC' },
  { name: 'Orabank' },
  { name: 'BIAO' },
];

export const TrustedBySection: React.FC = () => {
  return (
    <section id="trusted" className="py-20 bg-white border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm text-gray-400 font-medium mb-10 tracking-wider uppercase">
          +2,500 entreprises nous font confiance
        </p>

        {/* Infinite scroll logos */}
        <div className="relative">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Scrolling container */}
          <div className="flex animate-scroll-infinite gap-12">
            {[...companies, ...companies, ...companies].map((company, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-8 py-4 bg-gray-50 rounded-2xl flex-shrink-0 hover:bg-gray-100 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-lg group-hover:bg-gray-300 transition-colors">
                  {company.name.charAt(0)}
                </div>
                <span className="font-semibold text-gray-600 whitespace-nowrap">{company.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '2,500+', label: 'Entreprises' },
            { value: '2M+', label: 'Documents/mois' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '4.9/5', label: 'Satisfaction' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
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
