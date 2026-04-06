import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  GitBranch,
  PenTool,
  Shield,
  Smartphone,
  BarChart3,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  Lock,
  Search,
} from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const FeaturesSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section ref={ref} id="features" className="py-32 bg-[#0F0F11] relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C8A961]/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C8A961]/10 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A961]/10 border border-[#C8A961]/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-[#C8A961]" />
            <span className="text-sm font-medium text-[#C8A961]">Fonctionnalites</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 tracking-tight">
            Tout ce dont vous avez
            <br />
            <span className="text-[#C8A961]">besoin pour reussir</span>
          </h2>
          <p className="text-base text-white/40 font-light max-w-2xl mx-auto">
            Une plateforme complete pour digitaliser et automatiser vos processus documentaires
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Large Feature Card - Document Management */}
          <div
            className={`col-span-12 md:col-span-8 row-span-2 group relative rounded-3xl overflow-hidden transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            onMouseEnter={() => setHoveredCard(0)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute inset-0 bg-[#1A1A1D]" />

            <div className="relative p-8 md:p-12 h-full flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C8A961]/10 backdrop-blur rounded-full mb-6">
                  <FileText className="w-4 h-4 text-[#C8A961]" />
                  <span className="text-sm font-medium text-[#C8A961]">Gestion documentaire</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-light text-white mb-4">
                  Centralisez tous
                  <br />
                  vos documents
                </h3>
                <p className="text-lg text-white/40 max-w-md">
                  Versioning automatique, recherche full-text, OCR integre et organisation
                  intelligente de vos fichiers.
                </p>
              </div>

              {/* Feature preview */}
              <div className="mt-8">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <Search className="w-4 h-4 text-white/30" />
                    <span className="text-sm text-white/30">
                      Rechercher dans 2,456 documents...
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { name: 'Contrat_Partenariat_2024.pdf', status: 'Valide' },
                      { name: 'Facture_Q4_2024.xlsx', status: 'En revision' },
                      { name: 'NDA_Confidentiel.pdf', status: 'A signer' },
                    ].map((doc, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer ${hoveredCard === 0 ? 'animate-fade-in' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="w-10 h-10 bg-[#C8A961]/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#C8A961]/50" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white/90">{doc.name}</p>
                          <p className="text-xs text-white/30">Modifie il y a 2h</p>
                        </div>
                        <div className="w-2 h-2 bg-[#C8A961]/30 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {['Versioning auto', 'OCR integre', 'Full-text search', 'Tags'].map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-[#C8A961]/10 rounded-full text-xs font-medium text-[#C8A961]/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Workflows Card */}
          <div
            className={`col-span-12 md:col-span-4 group relative rounded-3xl overflow-hidden bg-[#1A1A1D] transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="relative p-6 md:p-8 h-full flex flex-col min-h-[280px]">
              <div className="w-12 h-12 bg-[#C8A961] rounded-xl flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-[#0A0A0B]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Workflows sur mesure</h3>
              <p className="text-sm text-white/40 mb-auto">
                Creez des circuits de validation multi-niveaux avec conditions et delegations.
              </p>

              {/* Mini workflow preview */}
              <div className="mt-6 flex items-center gap-2">
                {['Finance', 'Legal', 'CEO'].map((step, i) => (
                  <React.Fragment key={i}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < 2 ? 'bg-[#C8A961] text-[#0A0A0B]' : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {i < 2 ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < 2 && (
                      <div className={`w-8 h-0.5 ${i < 1 ? 'bg-[#C8A961]' : 'bg-white/20'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Signature Card */}
          <div
            className={`col-span-12 md:col-span-4 group relative rounded-3xl overflow-hidden bg-[#0A0A0B] border border-[#C8A961]/10 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative p-6 md:p-8 h-full flex flex-col min-h-[280px]">
              <div className="w-12 h-12 bg-[#C8A961]/10 rounded-xl flex items-center justify-center mb-4">
                <PenTool className="w-6 h-6 text-[#C8A961]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Signature electronique</h3>
              <p className="text-sm text-white/40 mb-auto">
                Signez legalement avec valeur juridique, horodatage qualifie et certificat eIDAS.
              </p>

              {/* Signature preview */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl">
                <svg className="w-full h-12" viewBox="0 0 200 40">
                  <path
                    d="M10,30 Q30,10 50,25 T90,20 T130,30 T170,25"
                    fill="none"
                    stroke="rgba(200,169,97,0.4)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                </svg>
                <div className="flex items-center gap-2 mt-2">
                  <Lock className="w-3 h-3 text-[#C8A961]/40" />
                  <span className="text-xs text-[#C8A961]/40">Certifie eIDAS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div
            className={`col-span-12 md:col-span-4 group relative rounded-3xl overflow-hidden bg-[#1A1A1D] transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative p-6 md:p-8 h-full flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#C8A961] rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-[#0A0A0B]" />
                </div>
                <TrendingUp className="w-6 h-6 text-[#C8A961]/40" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Analytics temps reel</h3>
              <p className="text-sm text-white/40 mb-auto">KPIs et tableaux de bord</p>

              <div className="flex items-end gap-1 h-16 mt-4">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#C8A961]/20 rounded-t transition-all duration-500 group-hover:bg-[#C8A961]/40"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile App Card */}
          <div
            className={`col-span-12 md:col-span-4 group relative rounded-3xl overflow-hidden bg-[#0A0A0B] border border-white/5 transition-all duration-700 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 bg-[#C8A961]/10 rounded-full text-xs font-medium text-[#C8A961]">
                À VENIR
              </span>
            </div>
            <div className="relative p-6 md:p-8 h-full flex flex-col min-h-[200px]">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-white/70" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Application mobile</h3>
              <p className="text-sm text-white/40">iOS & Android - Bientôt disponible</p>

              <div className="flex gap-2 mt-auto pt-4">
                <div className="flex-1 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white/60">App Store</span>
                </div>
                <div className="flex-1 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white/60">Play Store</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div
            className={`col-span-12 md:col-span-4 group relative rounded-3xl overflow-hidden bg-[#1A1A1D] transition-all duration-700 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative p-6 md:p-8 h-full flex flex-col min-h-[200px]">
              <div className="w-12 h-12 bg-[#C8A961] rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#0A0A0B]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Securite maximale</h3>
              <p className="text-sm text-white/40">Chiffrement AES-256, detection fraude IA</p>

              <div className="flex flex-wrap gap-2 mt-auto pt-4">
                {['AES-256', 'ISO 27001', 'RGPD'].map((badge, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-[#C8A961]/10 rounded text-xs text-[#C8A961]/70"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className={`mt-16 text-center transition-all duration-700 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <a href="https://atlas-studio.org/portal?app=advist">
            <button className="group inline-flex items-center gap-3 px-7 py-3.5 bg-[#C8A961] text-[#0A0A0B] text-sm font-medium rounded-full hover:bg-[#D4B872] transition-all hover:shadow-[0_0_40px_8px_rgba(200,169,97,0.15)]">
              Decouvrir toutes les fonctionnalites
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes draw {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
        .animate-draw {
          animation: draw 2s ease-out forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;
