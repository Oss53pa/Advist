import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Award,
  Globe,
  Check,
  Sparkles,
  Zap,
  FileText,
  PenTool,
  GitBranch,
  Users,
  BarChart3,
  Lock,
  CheckCircle,
} from 'lucide-react';

export interface HeroSectionProps {
  onDemoClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onDemoClick }) => {
  const { t } = useTranslation();
  const [currentWord, setCurrentWord] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  const ANIMATED_WORDS = [
    { text: t('landing.hero.word1', 'Validez') },
    { text: t('landing.hero.word2', 'Signez') },
    { text: t('landing.hero.word3', 'Accélérez') },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % ANIMATED_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [ANIMATED_WORDS.length]);

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#0A0A0B]">
      {/* Subtle background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C8A961]/[0.03] rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-12rem)]">
          {/* Left content */}
          <div className="space-y-8 z-10">
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#C8A961]/10 backdrop-blur-xl border border-[#C8A961]/20 rounded-full animate-fade-in-up group hover:bg-[#C8A961]/15 transition-all cursor-pointer">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C8A961]" />
                <span className="text-sm font-medium text-[#C8A961]">Nouveau</span>
              </div>
              <span className="text-sm text-white/50">Proph3t IA maintenant disponible</span>
              <ArrowRight className="w-4 h-4 text-[#C8A961]/50 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Main headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-light leading-[1.2] tracking-tight">
                <span className="text-white">
                  <span className="inline-block overflow-hidden h-[1.2em] align-bottom">
                    <span key={currentWord} className="inline-block animate-slide-up text-white">
                      {ANIMATED_WORDS[currentWord].text}
                    </span>
                  </span>
                </span>
                <br />
                <span className="text-white/90">vos documents</span>
                <br />
                <span className="text-[#C8A961] font-light">en toute sécurité.</span>
              </h1>

              <p className="text-base md:text-lg text-[#C8A961]/80 font-light italic mt-2">
                « L'avis de confiance, la trace qui sécurise. »
              </p>

              <p className="text-base md:text-lg text-white/50 max-w-xl leading-relaxed animate-fade-in-up animation-delay-200 font-light">
                {t(
                  'landing.hero.subtitle',
                  'La plateforme tout-en-un pour digitaliser vos circuits de validation, signer électroniquement et automatiser vos processus documentaires.'
                )}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
              <Link to="/register">
                <button className="group relative flex items-center justify-center gap-3 px-7 py-3.5 bg-[#C8A961] text-[#0A0A0B] font-medium text-sm rounded-xl overflow-hidden transition-all duration-300 hover:bg-[#D4B872] hover:shadow-[0_0_40px_8px_rgba(200,169,97,0.15)] hover:scale-[1.02]">
                  <Sparkles className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">
                    {t('landing.hero.cta', 'Commencer gratuitement')}
                  </span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <button
                onClick={onDemoClick}
                className="group flex items-center justify-center gap-3 px-7 py-3.5 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <Play className="w-4 h-4 text-white/70" fill="currentColor" />
                <span className="font-normal text-sm text-white/80">
                  {t('landing.hero.demo', 'Voir la démo')}
                </span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-8 animate-fade-in-up animation-delay-600">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-[#C8A961]/20 border-2 border-[#0A0A0B] flex items-center justify-center text-xs font-bold text-[#C8A961]"
                    >
                      {['AD', 'MC', 'IK', 'FN'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-white/40 font-light">
                    Rejoint par <span className="text-white/70 font-medium">500+ entreprises</span>{' '}
                    en Afrique
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-3">
                {[
                  { icon: ShieldCheck, label: 'eIDAS' },
                  { icon: Award, label: 'ISO 27001' },
                  { icon: Globe, label: 'OHADA' },
                ].map((cert, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"
                  >
                    <cert.icon className="w-4 h-4 text-[#C8A961]/60" />
                    <span className="text-xs font-medium text-white/50">{cert.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Interactive Product Preview (hidden on mobile to avoid cramped layout) */}
          <div className="relative lg:ml-8 animate-fade-in-right animation-delay-300 hidden md:block">
            <ProductPreview />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a
            href="#trusted"
            className="flex flex-col items-center gap-2 text-[#C8A961]/40 hover:text-[#C8A961]/60 transition-colors"
          >
            <span className="text-xs font-medium tracking-wider uppercase">Découvrir</span>
            <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-current rounded-full animate-scroll-down" />
            </div>
          </a>
        </div>
      </div>

      <HeroStyles />
    </section>
  );
};

// Premium Product Preview Component
const ProductPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Dashboard', 'Documents', 'Signatures', 'Workflows'];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Main container */}
      <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-[#C8A961]/10 overflow-hidden shadow-2xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/15" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
          </div>
          <div className="flex-1 mx-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-sm max-w-xs mx-auto">
              <Lock className="w-3 h-3 text-[#C8A961]/40" />
              <span className="text-white/30">app.advist.com</span>
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-14 bg-black/20 border-r border-white/5 py-4 flex flex-col items-center gap-2">
            {[BarChart3, FileText, GitBranch, PenTool, Users].map((Icon, i) => (
              <button
                key={i}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  i === activeTab
                    ? 'bg-[#C8A961]/20 text-[#C8A961]'
                    : 'text-white/20 hover:text-white/40'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4 min-h-[400px]">
            {activeTab === 0 && <DashboardPreview />}
            {activeTab === 1 && <DocumentsPreview />}
            {activeTab === 2 && <SignaturesPreview />}
            {activeTab === 3 && <WorkflowsPreview />}
          </div>
        </div>

        {/* Tab indicators */}
        <div className="flex items-center justify-center gap-2 py-3 bg-black/20 border-t border-white/5">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === i
                  ? 'bg-[#C8A961] text-[#0A0A0B]'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Floating notifications */}
      <div className="absolute -top-4 -right-4 animate-float">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#C8A961]/10 backdrop-blur-xl rounded-xl border border-[#C8A961]/20">
          <Check className="w-5 h-5 text-[#C8A961]" />
          <div>
            <p className="text-sm font-semibold text-white/90">Document signé</p>
            <p className="text-xs text-white/40">À l'instant</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 animate-float animation-delay-1000">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
          <div className="w-10 h-10 bg-[#C8A961]/10 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#C8A961]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">Workflow terminé</p>
            <p className="text-xs text-white/40">3 validations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Preview
const DashboardPreview: React.FC = () => (
  <div className="space-y-4 animate-fade-in">
    {/* Stats row */}
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Documents', value: '2,456', trend: '+12%' },
        { label: 'En cours', value: '89', trend: '23 actifs' },
        { label: 'Signés', value: '1,847', trend: '+8%' },
      ].map((stat, i) => (
        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="w-8 h-8 bg-[#C8A961]/10 rounded-lg flex items-center justify-center mb-2">
            <FileText className="w-4 h-4 text-[#C8A961]/60" />
          </div>
          <p className="text-xl font-bold text-[#C8A961]">{stat.value}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">{stat.label}</p>
            <span className="text-xs text-white/50">{stat.trend}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Chart placeholder */}
    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-white/80">Activité mensuelle</span>
        <div className="flex gap-1">
          {['7j', '30j', '90j'].map((p, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-1 rounded ${i === 1 ? 'bg-[#C8A961] text-[#0A0A0B]' : 'text-white/40'}`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="h-24 flex items-end gap-1">
        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-[#C8A961]/20 rounded-t hover:bg-[#C8A961]/30 transition-opacity"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>

    {/* Recent activity */}
    <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5">
        <span className="text-sm font-medium text-white/80">Activité récente</span>
      </div>
      {[
        { action: 'Document signé', time: '2 min', icon: CheckCircle },
        { action: 'Workflow validé', time: '15 min', icon: GitBranch },
        { action: 'Nouveau document', time: '1h', icon: FileText },
      ].map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-2 border-b border-white/5 last:border-0"
        >
          <item.icon className="w-4 h-4 text-[#C8A961]/40" />
          <span className="flex-1 text-sm text-white/60">{item.action}</span>
          <span className="text-xs text-white/30">{item.time}</span>
        </div>
      ))}
    </div>
  </div>
);

// Documents Preview
const DocumentsPreview: React.FC = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="flex gap-3">
      <div className="flex-1 h-9 bg-white/5 rounded-lg flex items-center px-3 gap-2 border border-white/5">
        <div className="w-4 h-4 rounded-full bg-white/20" />
        <span className="text-sm text-white/30">Rechercher...</span>
      </div>
      <button className="h-9 px-4 bg-[#C8A961] text-[#0A0A0B] rounded-lg text-sm font-medium">
        + Nouveau
      </button>
    </div>

    <div className="grid grid-cols-3 gap-2">
      {['Contrats', 'Factures', 'RH'].map((name, i) => (
        <div
          key={i}
          className="p-3 bg-white/5 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 bg-[#C8A961]/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#C8A961]/50" />
          </div>
          <p className="text-xs font-medium text-white/80">{name}</p>
          <p className="text-[10px] text-white/30">{12 + i * 8} fichiers</p>
        </div>
      ))}
    </div>

    <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
      {[
        { name: 'Contrat_2024.pdf', status: 'Validé' },
        { name: 'Facture_Q4.xlsx', status: 'En cours' },
        { name: 'NDA_Partner.pdf', status: 'À signer' },
      ].map((doc, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white/50" />
          </div>
          <span className="flex-1 text-sm text-white/70 truncate">{doc.name}</span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#C8A961]/10 text-[#C8A961]/80">
            {doc.status}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Signatures Preview
const SignaturesPreview: React.FC = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="flex gap-2">
      <button className="px-3 py-1.5 bg-[#C8A961] text-[#0A0A0B] rounded-lg text-xs font-medium">
        À signer (3)
      </button>
      <button className="px-3 py-1.5 bg-white/5 text-white/60 rounded-lg text-xs border border-white/10">
        Signés (47)
      </button>
    </div>

    {[
      { title: 'Contrat de prestation Q4', from: 'Marie D.', urgent: true },
      { title: 'Accord de confidentialité', from: 'Pierre M.', urgent: false },
    ].map((doc, i) => (
      <div
        key={i}
        className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#C8A961]/10 rounded-lg flex items-center justify-center">
            <PenTool className="w-5 h-5 text-[#C8A961]/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white/90 truncate">{doc.title}</span>
              {doc.urgent && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#C8A961]/10 text-[#C8A961] rounded font-medium">
                  Urgent
                </span>
              )}
            </div>
            <p className="text-xs text-white/40">Demandé par {doc.from}</p>
          </div>
          <button className="h-8 px-3 bg-[#C8A961] text-[#0A0A0B] rounded-lg text-xs font-medium">
            Signer
          </button>
        </div>
      </div>
    ))}

    <div className="p-4 bg-white/5 rounded-xl border border-[#C8A961]/10">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-[#C8A961]/50" />
        <span className="text-xs font-medium text-white/70">Signature certifiée eIDAS</span>
      </div>
      <svg className="w-full h-8" viewBox="0 0 200 30">
        <path
          d="M10,20 Q40,5 70,18 T130,15 T180,20"
          fill="none"
          stroke="rgba(200,169,97,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  </div>
);

// Workflows Preview
const WorkflowsPreview: React.FC = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-white/80">Workflows actifs</span>
      <button className="h-8 px-3 bg-[#C8A961] text-[#0A0A0B] rounded-lg text-xs font-medium">
        + Nouveau
      </button>
    </div>

    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C8A961]/10 rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-[#C8A961]/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">Validation Contrat</p>
            <p className="text-xs text-white/40">3 étapes • 2 validées</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 bg-[#C8A961]/10 text-[#C8A961] rounded-full font-medium">
          En cours
        </span>
      </div>

      <div className="flex items-center gap-2">
        {['Finance', 'Juridique', 'Direction'].map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  i < 2 ? 'bg-[#C8A961] text-[#0A0A0B]' : 'bg-white/10'
                }`}
              >
                {i < 2 ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 bg-white/40 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-1 ${i < 2 ? 'text-[#C8A961]/70' : 'text-white/30'}`}>
                {step}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`flex-1 h-0.5 rounded ${i < 1 ? 'bg-[#C8A961]/40' : 'bg-white/10'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {[
        { name: 'Budget 2025', progress: 80 },
        { name: 'Révision NDA', progress: 100 },
      ].map((wf, i) => (
        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
          <p className="text-xs font-medium text-white/80 mb-2 truncate">{wf.name}</p>
          <div className="h-1.5 bg-white/10 rounded-full mb-1">
            <div
              className="h-full rounded-full bg-[#C8A961]/40"
              style={{ width: `${wf.progress}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-white/30">{wf.progress}%</span>
            <span className="text-[10px] font-medium text-[#C8A961]/50">
              {wf.progress === 100 ? 'Terminé' : 'En cours'}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Styles
const HeroStyles: React.FC = () => (
  <style>{`
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    @keyframes slide-up {
      0% { transform: translateY(100%); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes fade-in-up {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-in-right {
      0% { opacity: 0; transform: translateX(40px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    @keyframes fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes scroll-down {
      0% { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(8px); opacity: 0; }
    }

    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
    .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
    .animate-fade-in-right { animation: fade-in-right 1s ease-out forwards; }
    .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
    .animate-scroll-down { animation: scroll-down 1.5s ease-in-out infinite; }

    .animation-delay-200 { animation-delay: 0.2s; opacity: 0; }
    .animation-delay-300 { animation-delay: 0.3s; opacity: 0; }
    .animation-delay-400 { animation-delay: 0.4s; opacity: 0; }
    .animation-delay-600 { animation-delay: 0.6s; opacity: 0; }
    .animation-delay-1000 { animation-delay: 1s; }
  `}</style>
);

export default HeroSection;
