/**
 * Guided Tour Component
 * Immersive animated walkthrough of ADVIST features
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  GitBranch,
  PenTool,
  Shield,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  Upload,
  Clock,
  Sparkles,
  Eye,
  Zap,
  Award,
  ArrowRight,
  Lock,
  CheckCircle2,
  _FileCheck,
  Send,
  _Download,
} from 'lucide-react';

type ViewState = 'intro' | 'tour' | 'complete';

interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  bgPattern: string;
  features: string[];
  animation: 'upload' | 'workflow' | 'signature' | 'dashboard' | 'team' | 'security';
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    title: 'Importez vos documents',
    subtitle: 'Gestion documentaire intelligente',
    description:
      'Glissez-déposez vos fichiers et laissez ADVIST organiser automatiquement vos documents avec versioning et classification.',
    icon: Upload,
    gradient: 'from-primary-900 via-primary-900 to-primary-400',
    bgPattern:
      'radial-gradient(circle at 20% 80%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(34,211,238,0.3) 0%, transparent 50%)',
    features: ['Drag & drop', 'Versioning auto', 'OCR intégré'],
    animation: 'upload',
  },
  {
    id: 2,
    title: 'Créez vos workflows',
    subtitle: 'Automatisation des processus',
    description:
      'Définissez des circuits de validation multi-étapes avec approbateurs, délais et escalades automatiques.',
    icon: GitBranch,
    gradient: 'from-primary-900 via-primary-900 to-primary-400',
    bgPattern:
      'radial-gradient(circle at 30% 70%, rgba(147,51,234,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(236,72,153,0.3) 0%, transparent 50%)',
    features: ['Multi-étapes', 'Escalades auto', 'Notifications'],
    animation: 'workflow',
  },
  {
    id: 3,
    title: 'Signez électroniquement',
    subtitle: 'Signature légale certifiée',
    description:
      'Signez vos documents avec une valeur légale conforme eIDAS, certificat qualifié et horodatage.',
    icon: PenTool,
    gradient: 'from-green-600 via-green-500 to-primary-400',
    bgPattern:
      'radial-gradient(circle at 25% 75%, rgba(16,185,129,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(20,184,166,0.3) 0%, transparent 50%)',
    features: ['Conforme eIDAS', 'Certificat', 'Horodatage'],
    animation: 'signature',
  },
  {
    id: 4,
    title: 'Suivez en temps réel',
    subtitle: 'Tableaux de bord analytiques',
    description:
      "Visualisez vos KPIs, suivez l'avancement des validations et générez des rapports personnalisés.",
    icon: BarChart3,
    gradient: 'from-primary-500 via-orange-500 to-red-400',
    bgPattern:
      'radial-gradient(circle at 20% 80%, rgba(245,158,11,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(239,68,68,0.3) 0%, transparent 50%)',
    features: ['KPIs temps réel', 'Rapports', 'Alertes'],
    animation: 'dashboard',
  },
  {
    id: 5,
    title: 'Collaborez en équipe',
    subtitle: 'Travail collaboratif avancé',
    description:
      'Invitez vos collaborateurs avec des rôles précis et des permissions granulaires par projet.',
    icon: Users,
    gradient: 'from-primary-900 via-primary-900 to-primary-400',
    bgPattern:
      'radial-gradient(circle at 30% 70%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(139,92,246,0.3) 0%, transparent 50%)',
    features: ['Rôles flexibles', 'Permissions', 'Équipes'],
    animation: 'team',
  },
  {
    id: 6,
    title: 'Sécurité maximale',
    subtitle: 'Protection des données',
    description:
      'Vos documents sont protégés par un chiffrement AES-256 avec audit trail complet et conformité RGPD.',
    icon: Shield,
    gradient: 'from-primary-700 via-primary-600 to-primary-500',
    bgPattern:
      'radial-gradient(circle at 25% 75%, rgba(51,65,85,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(100,116,139,0.3) 0%, transparent 50%)',
    features: ['AES-256', 'RGPD', 'ISO 27001'],
    animation: 'security',
  },
];

export const GuidedTour: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = tourSteps[currentStep];

  const goToStep = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(index);
        setProgress(0);
        setIsTransitioning(false);
      }, 300);
    },
    [isTransitioning]
  );

  const goNext = useCallback(() => {
    if (currentStep === tourSteps.length - 1) {
      setViewState('complete');
    } else {
      goToStep((currentStep + 1) % tourSteps.length);
    }
  }, [currentStep, goToStep]);

  const goPrev = useCallback(() => {
    goToStep((currentStep - 1 + tourSteps.length) % tourSteps.length);
  }, [currentStep, goToStep]);

  useEffect(() => {
    if (!isPlaying || viewState !== 'tour') return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + 1.5;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, [isPlaying, viewState, goNext]);

  const togglePlay = () => setIsPlaying((prev) => !prev);

  const startTour = () => {
    setViewState('tour');
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const resetTour = () => {
    setViewState('intro');
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  // Intro Screen
  if (viewState === 'intro') {
    return (
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 rounded-2xl overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-900/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-900/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative p-8 text-center">
          {/* Logo animation */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-900 to-primary-900 rounded-2xl shadow-2xl mb-6 animate-float">
            <Eye className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Découvrez ADVIST</h2>
          <p className="text-primary-400 mb-8 max-w-sm mx-auto">
            Une visite guidée interactive pour explorer toutes les fonctionnalités de notre
            plateforme
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {tourSteps.slice(0, 3).map((s, i) => (
              <div
                key={s.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 transform hover:scale-105 transition-transform"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-lg flex items-center justify-center mb-2 mx-auto shadow-lg`}
                >
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-primary-300 font-medium">
                  {s.title.split(' ').slice(0, 2).join(' ')}
                </p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">6</p>
              <p className="text-xs text-primary-500">Fonctionnalités</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">~2min</p>
              <p className="text-xs text-primary-500">Durée</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-primary-500">Interactif</p>
            </div>
          </div>

          <button
            onClick={startTour}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-900 to-primary-900 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary-900/30 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5" />
            Commencer la visite
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-float { animation: float 3s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  // Complete Screen
  if (viewState === 'complete') {
    return (
      <div className="bg-gradient-to-br from-green-600 via-green-500 to-primary-400 rounded-2xl overflow-hidden relative">
        {/* Celebration particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-rise"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>
          ))}
        </div>

        <div className="relative p-8 text-center">
          {/* Trophy */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-bounce-slow">
            <Award className="w-14 h-14 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Visite terminée ! 🎉</h2>
          <p className="text-green-100 mb-6 max-w-sm mx-auto">
            Vous avez découvert les principales fonctionnalités d'ADVIST
          </p>

          {/* Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
            <p className="text-white/80 text-sm mb-3">Fonctionnalités explorées</p>
            <div className="flex flex-wrap justify-center gap-2">
              {tourSteps.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-white text-xs"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {s.title.split(' ').slice(0, 2).join(' ')}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={resetTour}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Recommencer
            </button>
            <button
              onClick={() => setViewState('intro')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-900 font-semibold rounded-xl hover:bg-green-50 transition-colors"
            >
              Terminer
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        <style>{`
          @keyframes rise {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(-300px) rotate(360deg); opacity: 0; }
          }
          .animate-rise { animation: rise 3s ease-out infinite; }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  // Main Tour View
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
      {/* Animation Area */}
      <div
        className={`relative h-72 bg-gradient-to-br ${step.gradient} overflow-hidden transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{ background: step.bgPattern }}
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-90`} />

        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/30 rounded-full animate-float-particle"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Step Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`transform transition-all duration-500 ${isTransitioning ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
          >
            <StepAnimation type={step.animation} />
          </div>
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full">
            <step.icon className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-medium">{step.subtitle}</span>
          </div>
          <div className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            {currentStep + 1} / {tourSteps.length}
          </div>
        </div>

        {/* Features pills */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
          {step.features.map((feature, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div
          className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        >
          <h3 className="text-xl font-bold text-primary-900 mb-2">{step.title}</h3>
          <p className="text-primary-600 mb-6 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex gap-1.5">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className="relative flex-1 h-1.5 rounded-full overflow-hidden bg-primary-100 hover:bg-primary-200 transition-colors"
              >
                {index === currentStep ? (
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${step.gradient} rounded-full transition-all duration-100`}
                    style={{ width: `${progress}%` }}
                  />
                ) : index < currentStep ? (
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${tourSteps[index].gradient} rounded-full`}
                  />
                ) : null}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-primary-400">Progression</span>
            <span className="text-xs text-primary-400">
              {Math.round((currentStep / (tourSteps.length - 1)) * 100)}%
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            className="flex items-center gap-2 px-4 py-2.5 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors text-primary-600 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`p-2.5 rounded-xl transition-colors ${isPlaying ? 'bg-primary-100 text-primary-600' : 'bg-primary-900 text-white'}`}
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={resetTour}
              className="p-2.5 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4 text-primary-600" />
            </button>
          </div>

          <button
            onClick={goNext}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
              currentStep === tourSteps.length - 1
                ? 'bg-primary-900 text-white hover:bg-primary-900'
                : 'bg-primary-900 text-white hover:bg-primary-800'
            }`}
          >
            {currentStep === tourSteps.length - 1 ? 'Terminer' : 'Suivant'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
        }
        .animate-float-particle { animation: float-particle 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// Enhanced Step Animations
const StepAnimation: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'upload':
      return <UploadAnimation />;
    case 'workflow':
      return <WorkflowAnimation />;
    case 'signature':
      return <SignatureAnimation />;
    case 'dashboard':
      return <DashboardAnimation />;
    case 'team':
      return <TeamAnimation />;
    case 'security':
      return <SecurityAnimation />;
    default:
      return null;
  }
};

const UploadAnimation: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 100 ? 0 : prev + 3));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Cloud/drop zone */}
      <div className="w-48 h-32 bg-white/95 rounded-2xl shadow-2xl flex flex-col items-center justify-center border-2 border-dashed border-primary-300 relative overflow-hidden">
        {/* Progress overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-900/20 to-transparent transition-all duration-100"
          style={{ height: `${uploadProgress}%` }}
        />

        <FileText className="w-10 h-10 text-primary-900 mb-2 relative z-10" />
        <div className="w-32 h-2 bg-primary-200 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full bg-gradient-to-r from-primary-900 to-primary-400 rounded-full transition-all duration-100"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-xs text-primary-500 mt-2 relative z-10">{uploadProgress}%</p>
      </div>

      {/* Floating upload icon */}
      <div className="absolute -top-6 animate-bounce">
        <div className="p-3 bg-white rounded-full shadow-lg">
          <Upload className="w-6 h-6 text-primary-900" />
        </div>
      </div>

      {/* File type badges */}
      <div className="flex gap-2 mt-4">
        {['PDF', 'DOCX', 'XLSX'].map((type, i) => (
          <span
            key={type}
            className="px-2 py-1 bg-white/80 rounded text-xs font-medium text-primary-600 shadow animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            {type}
          </span>
        ))}
      </div>
    </div>
  );
};

const WorkflowAnimation: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { icon: FileText, label: 'Création', color: 'bg-primary-900' },
    { icon: Send, label: 'Envoi', color: 'bg-primary-900' },
    { icon: Clock, label: 'Validation', color: 'bg-primary-900' },
    { icon: CheckCircle2, label: 'Approuvé', color: 'bg-primary-900' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                  i < activeStep
                    ? 'bg-primary-900'
                    : i === activeStep
                      ? `${s.color} scale-110 animate-pulse`
                      : 'bg-white/60'
                }`}
              >
                {i < activeStep ? (
                  <Check className="w-7 h-7 text-white" />
                ) : (
                  <s.icon
                    className={`w-7 h-7 ${i === activeStep ? 'text-white' : 'text-primary-400'}`}
                  />
                )}
              </div>
              <p
                className={`text-xs mt-2 font-medium ${i <= activeStep ? 'text-white' : 'text-white/60'}`}
              >
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-1 rounded-full overflow-hidden bg-white/30 -mt-6">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: i < activeStep ? '100%' : i === activeStep ? '50%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const SignatureAnimation: React.FC = () => {
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSigned((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Document */}
      <div className="w-48 h-32 bg-white rounded-xl shadow-2xl p-4 relative overflow-hidden">
        {/* Document lines */}
        <div className="space-y-2 mb-4">
          <div className="h-2 bg-primary-200 rounded w-full" />
          <div className="h-2 bg-primary-200 rounded w-3/4" />
          <div className="h-2 bg-primary-200 rounded w-5/6" />
        </div>

        {/* Signature area */}
        <div className="absolute bottom-3 left-3 right-3 h-10 border-b-2 border-dashed border-primary-300 flex items-end justify-center">
          <svg className="w-32 h-8" viewBox="0 0 120 30">
            <path
              d="M5,25 Q30,5 60,20 T115,15"
              fill="none"
              stroke="#1e3a5f"
              strokeWidth="2"
              strokeLinecap="round"
              className={signed ? 'animate-draw' : ''}
              style={{ strokeDasharray: 200, strokeDashoffset: signed ? 0 : 200 }}
            />
          </svg>
        </div>

        {/* Verified badge */}
        {signed && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-primary-900 rounded-full flex items-center justify-center animate-pop shadow-lg">
            <Check className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Pen */}
      <div
        className={`absolute -bottom-3 -right-3 transition-all duration-500 ${signed ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'}`}
      >
        <div className="p-2 bg-white rounded-full shadow-lg">
          <PenTool className="w-6 h-6 text-primary-900" />
        </div>
      </div>

      <style>{`
        @keyframes draw {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        .animate-draw { animation: draw 1.5s ease-out forwards; }
        @keyframes pop {
          0% { transform: scale(0); }
          80% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-pop { animation: pop 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

const DashboardAnimation: React.FC = () => {
  const [values, setValues] = useState([65, 80, 45, 90]);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues((prev) =>
        prev.map((v) => Math.max(20, Math.min(95, v + (Math.random() - 0.5) * 20)))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '1,234', label: 'Documents', color: 'from-primary-400 to-primary-900' },
    { value: '89%', label: 'Validés', color: 'from-green-400 to-green-600' },
    { value: '12', label: 'En attente', color: 'from-primary-400 to-primary-900' },
    { value: '5', label: 'Signés', color: 'from-primary-400 to-primary-900' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-3 shadow-xl relative overflow-hidden transform hover:scale-105 transition-transform"
        >
          {/* Progress bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${stat.color} opacity-20 transition-all duration-1000`}
            style={{ height: `${values[i]}%` }}
          />

          <div className="relative z-10">
            <p className="text-lg font-bold text-primary-900">{stat.value}</p>
            <p className="text-xs text-primary-500">{stat.label}</p>
          </div>

          {/* Mini chart */}
          <div className="absolute top-2 right-2">
            <Zap
              className={`w-4 h-4 ${i === 0 ? 'text-primary-900' : i === 1 ? 'text-primary-900' : i === 2 ? 'text-primary-900' : 'text-primary-900'}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const TeamAnimation: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 5);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const avatars = [
    { color: 'from-primary-400 to-primary-900', initials: 'MK' },
    { color: 'from-green-400 to-green-600', initials: 'SL' },
    { color: 'from-primary-400 to-primary-900', initials: 'JP' },
    { color: 'from-primary-400 to-primary-900', initials: 'AC' },
    { color: 'from-primary-400 to-primary-900', initials: 'LM' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        {avatars.map((avatar, i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center -ml-3 first:ml-0 border-3 border-white shadow-lg transition-all duration-300 ${
              i === activeIndex ? 'scale-125 z-10' : 'scale-100'
            }`}
          >
            <span className="text-white font-bold text-sm">{avatar.initials}</span>
          </div>
        ))}
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center -ml-3 border-3 border-white shadow-lg">
          <span className="text-primary-600 font-bold text-sm">+8</span>
        </div>
      </div>

      {/* Connection lines */}
      <div className="mt-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <p className="text-white text-sm">5 membres actifs</p>
      </div>
    </div>
  );
};

const SecurityAnimation: React.FC = () => {
  const [scanning, setScanning] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanning((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Shield with scanning effect */}
      <div className="relative">
        <div className="w-28 h-32 bg-white/95 rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"
            style={{ top: `${scanning}%` }}
          />

          <Shield className="w-14 h-14 text-primary-900 relative z-10" />
        </div>

        {/* Verified checkmark */}
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary-900 rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-6 h-6 text-white" />
        </div>

        {/* Lock icon */}
        <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center shadow-lg">
          <Lock className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Rotating security ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-44 h-44 border-2 border-white/20 rounded-full animate-spin-slow"
          style={{ borderTopColor: 'rgba(255,255,255,0.6)' }}
        />
      </div>

      {/* Security badges */}
      <div className="absolute -bottom-8 flex gap-2">
        {['AES-256', 'RGPD', 'ISO'].map((badge, _i) => (
          <span
            key={badge}
            className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs font-medium text-white"
          >
            {badge}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
};

export default GuidedTour;
