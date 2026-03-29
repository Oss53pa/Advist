import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DemoModal } from '../components/demo/DemoModal';
import {
  InteractiveWorkflowDemo,
  InteractiveSignatureDemo,
  InteractiveDocumentDemo,
} from '../components/demo';

import {
  Header,
  HeroSection,
  TrustedBySection,
  FeaturesSection,
  PricingSection,
  CTASection,
  Footer,
} from './landing/sections';
import { useScrollAnimation } from './landing/hooks/useScrollAnimation';

import {
  FileText,
  GitBranch,
  PenTool,
  Shield,
  ArrowRight,
  Play,
  Star,
  Zap,
  Check,
  Sparkles,
  Monitor,
  Quote,
  Search,
  RefreshCw,
  BadgeCheck,
  Fingerprint,
  ScrollText,
  Database,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <HeroSection onDemoClick={() => setIsDemoModalOpen(true)} />
      <TrustedBySection />
      <FeaturesSection />
      <HowItWorksSection />
      <ComplianceSection />
      <InteractiveDemoSection onOpenModal={() => setIsDemoModalOpen(true)} />
      <TestimonialsSection />
      <PricingSection />
      <IAPromotionSection />
      <CTASection onDemoClick={() => setIsDemoModalOpen(true)} />
      <Footer />
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
};

// --- How It Works ---

const HowItWorksSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: FileText,
      title: 'Importez',
      desc: 'Glissez-deposez vos fichiers ou connectez votre cloud',
    },
    {
      icon: GitBranch,
      title: 'Configurez',
      desc: 'Definissez vos circuits de validation en quelques clics',
    },
    {
      icon: PenTool,
      title: 'Validez & Signez',
      desc: 'Approuvez et signez electroniquement en toute securite',
    },
    { icon: Shield, title: 'Archivez', desc: 'Stockage securise avec audit trail complet' },
  ];

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isVisible, steps.length]);

  return (
    <section ref={ref} id="how-it-works" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
            <Zap className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-500">Simple & rapide</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Demarrez en 4 etapes
          </h2>
          <p className="text-lg text-gray-400">Configuration en moins de 5 minutes</p>
        </div>

        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-24 left-0 right-0 h-px bg-gray-200 hidden md:block">
            <div
              className="h-full bg-gray-900 transition-all duration-500"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative text-center transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
                onMouseEnter={() => setActiveStep(i)}
              >
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all duration-300 ${
                    i <= activeStep
                      ? 'bg-gray-900 text-white scale-110'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>

                <div
                  className={`relative p-6 bg-white rounded-2xl border-2 transition-all duration-300 ${
                    i === activeStep
                      ? 'border-gray-900 shadow-xl scale-105'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                      i === activeStep ? 'bg-gray-900 scale-110' : 'bg-gray-100'
                    }`}
                  >
                    <step.icon
                      className={`w-8 h-8 ${i === activeStep ? 'text-white' : 'text-gray-500'}`}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Compliance ---

const ComplianceSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();

  const items = [
    {
      icon: ScrollText,
      title: 'RGPD Complet',
      description: 'Gestion des consentements, droits des personnes, registre des traitements',
      badges: ['Art. 7', 'Art. 15-22', 'Art. 30'],
    },
    {
      icon: Fingerprint,
      title: 'eIDAS Qualifie',
      description: 'Signatures simples, avancees et qualifiees avec horodatage certifie',
      badges: ['Simple', 'Avance', 'Qualifie'],
    },
    {
      icon: Database,
      title: 'Retention des Donnees',
      description:
        'Politiques de conservation configurables, suppression automatique et archivage legal',
      badges: ['Auto-purge', 'Archivage'],
    },
    {
      icon: RefreshCw,
      title: 'Integrations securisees',
      description: 'Connexions chiffrees avec M365, Google Workspace, Sage, SAP et Salesforce',
      badges: ['Webhooks', 'API', 'SSO'],
    },
  ];

  const certifications = [
    { name: 'ISO 27001', desc: "Securite de l'information" },
    { name: 'eIDAS', desc: 'Signatures electroniques' },
    { name: 'RGPD', desc: 'Protection des donnees' },
    { name: 'OHADA', desc: 'Droit des affaires' },
  ];

  return (
    <section ref={ref} id="compliance" className="py-32 bg-gray-950 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur border border-white/10 rounded-full mb-6">
            <BadgeCheck className="w-4 h-4 text-white/60" />
            <span className="text-sm font-medium text-white/70">Conformite & Integrations</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Conforme RGPD & eIDAS</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Respectez les reglementations europeennes et africaines sans effort
          </p>
        </div>

        <div
          className={`grid md:grid-cols-2 gap-6 mb-16 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-7 h-7 text-white/70" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.badges.map((badge, j) => (
                      <span
                        key={j}
                        className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-medium text-white/60"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="flex flex-wrap justify-center gap-4">
            {certifications.map((cert, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl"
              >
                <BadgeCheck className="w-5 h-5 text-white/40" />
                <div>
                  <p className="font-bold text-white/80">{cert.name}</p>
                  <p className="text-xs text-gray-600">{cert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Interactive Demo ---

type DemoTab = 'workflow' | 'signature' | 'documents';

const InteractiveDemoSection: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeDemo, setActiveDemo] = useState<DemoTab>('workflow');

  const demoTabs = [
    { id: 'workflow' as DemoTab, label: 'Workflow', icon: GitBranch },
    { id: 'signature' as DemoTab, label: 'Signature', icon: PenTool },
    { id: 'documents' as DemoTab, label: 'Documents', icon: FileText },
  ];

  return (
    <section ref={ref} id="demo" className="py-32 bg-gray-950 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        <div
          className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full mb-6">
            <Play className="w-4 h-4 text-white/60" />
            <span className="text-sm font-medium text-white/70">Essayez maintenant</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Testez ADVIST en <span className="text-white/40">conditions reelles</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Decouvrez nos fonctionnalites cles avec ces demos interactives. Aucune inscription
            requise.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/10 rounded-2xl p-1.5 border border-white/10">
            {demoTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDemo(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeDemo === tab.id
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Demo container */}
        <div
          className={`relative transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gray-900 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    {React.createElement(
                      demoTabs.find((t) => t.id === activeDemo)?.icon || Monitor,
                      { className: 'w-6 h-6 text-white' }
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {activeDemo === 'workflow' && 'Simulation de workflow'}
                      {activeDemo === 'signature' && 'Signature electronique'}
                      {activeDemo === 'documents' && 'Gestion documentaire'}
                    </h3>
                    <p className="text-white/40 text-sm">
                      {activeDemo === 'workflow' && 'Approuvez un document en 3 etapes'}
                      {activeDemo === 'signature' && 'Signez un document de test'}
                      {activeDemo === 'documents' && "Explorez l'interface de gestion"}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl">
                  <Sparkles className="w-4 h-4 text-white/60" />
                  <span className="text-white/60 text-sm font-medium">Demo interactive</span>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-[500px] overflow-y-auto bg-gray-50">
              {activeDemo === 'workflow' && <InteractiveWorkflowDemo />}
              {activeDemo === 'signature' && <InteractiveSignatureDemo />}
              {activeDemo === 'documents' && <InteractiveDocumentDemo />}
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onOpenModal}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl hover:shadow-xl transition-all"
            >
              <Play className="w-5 h-5" />
              Decouvrir toutes les demos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/register">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all">
                Essai gratuit 1 mois
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Testimonials ---

const TestimonialsSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      quote:
        'ADVIST a revolutionne notre gestion documentaire. Nous avons reduit de 70% le temps de validation de nos contrats.',
      author: 'Aminata Kone',
      role: 'Directrice Juridique',
      company: 'Orange CI',
    },
    {
      quote:
        'La signature electronique nous permet de finaliser nos accords commerciaux en quelques heures au lieu de plusieurs jours.',
      author: 'Jean-Baptiste Diallo',
      role: 'Directeur General',
      company: 'Ecobank Senegal',
    },
    {
      quote:
        'Interface intuitive et adoption facile par toutes nos equipes. Le support est reactif et professionnel.',
      author: 'Fatou Sarr',
      role: 'Responsable Qualite',
      company: 'Total Energies',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section ref={ref} className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
            <Star className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-500">Temoignages</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ce qu'ils disent de nous
          </h2>
        </div>

        <div
          className={`relative max-w-4xl mx-auto mb-12 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="relative bg-white rounded-3xl p-8 md:p-12 border border-gray-200 shadow-lg">
            <Quote className="w-12 h-12 text-gray-200 mb-6" />
            <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed mb-8">
              "{testimonials[activeIndex].quote}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-xl font-bold">
                {testimonials[activeIndex].author
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <p className="font-bold text-gray-900">{testimonials[activeIndex].author}</p>
                <p className="text-gray-400">
                  {testimonials[activeIndex].role}, {testimonials[activeIndex].company}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeIndex ? 'bg-gray-900 w-8' : 'bg-gray-200 w-2 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- IA Promotion (Proph3t) ---

const IAPromotionSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();

  const iaFeatures = [
    {
      icon: Sparkles,
      title: 'Assistant IA conversationnel',
      description: 'Posez vos questions et obtenez des reponses instantanees sur vos documents',
    },
    {
      icon: FileText,
      title: 'Generation automatique',
      description: "Creez des documents professionnels en quelques secondes grace a l'IA",
    },
    {
      icon: Search,
      title: 'Analyse intelligente',
      description: 'Extraction automatique des informations cles de vos documents',
    },
    {
      icon: GitBranch,
      title: 'Suggestions de workflows',
      description: "L'IA vous recommande les meilleurs circuits de validation",
    },
  ];

  return (
    <section ref={ref} id="proph3t" className="py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div
          className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-500">Nouveau - Option IA</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Decouvrez <span className="font-decorative">Proph3t</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Votre assistant IA intelligent pour transformer votre gestion documentaire
          </p>
        </div>

        <div
          className={`relative transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="relative bg-white rounded-3xl border border-gray-200 p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Features */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Offre IA</h3>
                    <p className="text-gray-400">Disponible pour Business & Enterprise</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {iaFeatures.map((feature, i) => (
                    <div key={i} className="group flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition-all duration-300">
                        <feature.icon className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing CTA */}
              <div className="lg:pl-8 lg:border-l border-gray-200">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium text-gray-400 mb-2">A partir de</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">25 000</span>
                      <span className="text-lg text-gray-400">FCFA/mois</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Ajoute a votre plan mensuel</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      'Integre directement a votre interface',
                      'Pas de configuration requise',
                      'Activable a tout moment',
                      'Annulation flexible',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/register">
                    <button className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                      Essayer l'offre IA gratuitement
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Inclus dans le mois d'essai gratuit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
