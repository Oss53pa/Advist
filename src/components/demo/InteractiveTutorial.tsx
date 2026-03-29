/**
 * Interactive Tutorial Component
 * Engaging step-by-step tutorials for learning ADVIST
 */
import React, { useState } from 'react';
import {
  FileText,
  GitBranch,
  PenTool,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Play,
  RotateCcw,
  Lightbulb,
  Target,
  Sparkles,
  Hand,
  Award,
  Clock,
  BookOpen,
  Zap,
  MousePointer2,
  ArrowRight,
} from 'lucide-react';

interface TutorialStep {
  id: number;
  title: string;
  instruction: string;
  tip: string;
  action: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  duration: string;
  difficulty: 'Facile' | 'Moyen' | 'Avancé';
  steps: TutorialStep[];
}

const tutorials: Tutorial[] = [
  {
    id: 'documents',
    title: 'Gestion documentaire',
    description: 'Maîtrisez l\'import et l\'organisation de vos fichiers',
    icon: FileText,
    color: 'bg-primary-900',
    gradient: 'from-primary-900 to-primary-900',
    duration: '3 min',
    difficulty: 'Facile',
    steps: [
      {
        id: 1,
        title: 'Importer un document',
        instruction: 'Cliquez sur le bouton "Ajouter" en haut à droite ou glissez-déposez directement un fichier dans la zone centrale.',
        tip: 'ADVIST accepte les formats PDF, Word, Excel et images jusqu\'à 50 MB par fichier.',
        action: 'Ajouter un fichier',
      },
      {
        id: 2,
        title: 'Organiser en dossiers',
        instruction: 'Créez une arborescence de dossiers pour classer vos documents par projet, type ou département.',
        tip: 'Une structure claire facilite la recherche et le partage avec vos collaborateurs.',
        action: 'Créer un dossier',
      },
      {
        id: 3,
        title: 'Ajouter des métadonnées',
        instruction: 'Enrichissez vos documents avec des tags, descriptions et dates d\'échéance pour un suivi optimal.',
        tip: 'Les tags permettent de retrouver instantanément vos documents via la recherche.',
        action: 'Ajouter des tags',
      },
      {
        id: 4,
        title: 'Rechercher efficacement',
        instruction: 'Utilisez la barre de recherche avec filtres pour trouver n\'importe quel document en quelques secondes.',
        tip: 'La recherche fonctionne aussi sur le contenu OCR des documents scannés.',
        action: 'Rechercher',
      },
    ],
  },
  {
    id: 'workflows',
    title: 'Circuits de validation',
    description: 'Créez des workflows d\'approbation personnalisés',
    icon: GitBranch,
    color: 'bg-primary-900',
    gradient: 'from-primary-900 to-primary-700',
    duration: '5 min',
    difficulty: 'Moyen',
    steps: [
      {
        id: 1,
        title: 'Créer un workflow',
        instruction: 'Accédez à la section Workflows et cliquez sur "Nouveau". Donnez un nom explicite à votre circuit.',
        tip: 'Exemple : "Validation Contrat Fournisseur > 10K€" pour identifier rapidement le cas d\'usage.',
        action: 'Créer le workflow',
      },
      {
        id: 2,
        title: 'Définir les étapes',
        instruction: 'Ajoutez les approbateurs dans l\'ordre souhaité. Chaque étape peut avoir un ou plusieurs validateurs.',
        tip: 'Définissez des approbateurs de secours qui seront notifiés en cas d\'absence.',
        action: 'Ajouter une étape',
      },
      {
        id: 3,
        title: 'Configurer les délais',
        instruction: 'Définissez un délai maximum pour chaque étape. Des relances automatiques seront envoyées.',
        tip: 'Les rappels partent automatiquement à 50% et 80% du délai imparti.',
        action: 'Définir les délais',
      },
      {
        id: 4,
        title: 'Lancer le workflow',
        instruction: 'Associez un document au workflow pour démarrer le processus d\'approbation.',
        tip: 'Suivez l\'avancement en temps réel depuis votre tableau de bord.',
        action: 'Démarrer',
      },
    ],
  },
  {
    id: 'signature',
    title: 'Signature électronique',
    description: 'Signez vos documents en toute conformité légale',
    icon: PenTool,
    color: 'bg-primary-900',
    gradient: 'from-green-500 to-primary-900',
    duration: '2 min',
    difficulty: 'Facile',
    steps: [
      {
        id: 1,
        title: 'Sélectionner le document',
        instruction: 'Ouvrez le document à signer depuis votre liste. Seuls les documents approuvés sont éligibles.',
        tip: 'Vérifiez que le document a bien passé toutes les étapes de validation requises.',
        action: 'Ouvrir le document',
      },
      {
        id: 2,
        title: 'Positionner la zone',
        instruction: 'Cliquez à l\'endroit exact où vous souhaitez apposer votre signature sur le document.',
        tip: 'Vous pouvez redimensionner et déplacer la zone de signature après l\'avoir placée.',
        action: 'Placer la signature',
      },
      {
        id: 3,
        title: 'Créer votre signature',
        instruction: 'Dessinez votre signature à la main, tapez votre nom ou importez une image de signature.',
        tip: 'Votre signature est sauvegardée pour les futures utilisations.',
        action: 'Signer',
      },
      {
        id: 4,
        title: 'Confirmer et certifier',
        instruction: 'Validez votre signature. Un certificat avec horodatage est automatiquement généré.',
        tip: 'Le document signé est conforme au règlement eIDAS et a valeur légale.',
        action: 'Confirmer',
      },
    ],
  },
];

export const InteractiveTutorial: React.FC = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleSelectTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const handleCompleteStep = () => {
    if (!selectedTutorial) return;

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    if (currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const handleBack = () => {
    setSelectedTutorial(null);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const isComplete = selectedTutorial && completedSteps.length === selectedTutorial.steps.length;

  // Tutorial Selection Screen
  if (!selectedTutorial) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-200">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-3">Tutoriels interactifs</h2>
          <p className="text-primary-500 max-w-md mx-auto">
            Apprenez à utiliser ADVIST étape par étape avec nos guides pratiques.
          </p>
        </div>

        <div className="space-y-3">
          {tutorials.map(tutorial => (
            <button
              key={tutorial.id}
              onClick={() => handleSelectTutorial(tutorial)}
              className="w-full flex items-center gap-4 p-5 bg-white border border-primary-200 rounded-2xl hover:border-primary-300 hover:shadow-md transition-all text-left group"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${tutorial.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                <tutorial.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-primary-900">{tutorial.title}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    tutorial.difficulty === 'Facile' ? 'bg-primary-100 text-green-600' :
                    tutorial.difficulty === 'Moyen' ? 'bg-primary-100 text-primary-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tutorial.difficulty}
                  </span>
                </div>
                <p className="text-sm text-primary-500 truncate">{tutorial.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-primary-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{tutorial.duration}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-primary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const step = selectedTutorial.steps[currentStep];
  const progress = (completedSteps.length / selectedTutorial.steps.length) * 100;

  // Completion Screen
  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-4 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200">
          <Award className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-primary-900 mb-2">Tutoriel terminé !</h3>
        <p className="text-primary-500 mb-8 max-w-sm mx-auto">
          Félicitations ! Vous maîtrisez maintenant <strong>{selectedTutorial.title.toLowerCase()}</strong>.
        </p>

        {/* Achievement Badge */}
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-50 to-orange-50 border border-primary-200 rounded-2xl mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs text-primary-900 font-medium uppercase tracking-wider">Badge débloqué</p>
            <p className="font-semibold text-primary-900">{selectedTutorial.title}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-6 py-3 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Recommencer
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors"
          >
            Autres tutoriels
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Tutorial Step Screen
  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Header */}
      <div className={`bg-gradient-to-r ${selectedTutorial.gradient} rounded-2xl p-5 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
            {currentStep + 1} / {selectedTutorial.steps.length}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <selectedTutorial.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{selectedTutorial.title}</h3>
            <p className="text-white/70 text-sm">{selectedTutorial.description}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-3 mb-6">
        {selectedTutorial.steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => completedSteps.includes(i) && setCurrentStep(i)}
            disabled={!completedSteps.includes(i) && i !== currentStep}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
              completedSteps.includes(i)
                ? 'bg-primary-900 text-white shadow-lg shadow-green-200'
                : i === currentStep
                ? `bg-gradient-to-br ${selectedTutorial.gradient} text-white shadow-lg scale-110`
                : 'bg-primary-100 text-primary-400'
            }`}
          >
            {completedSteps.includes(i) ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="text-sm">{i + 1}</span>
            )}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-primary-200 rounded-2xl overflow-hidden">
        <div className="p-6">
          {/* Step Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 bg-gradient-to-br ${selectedTutorial.gradient} rounded-xl flex items-center justify-center`}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-primary-500 uppercase tracking-wider">Étape {currentStep + 1}</p>
              <h4 className="text-lg font-bold text-primary-900">{step.title}</h4>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-primary-600 mb-6 leading-relaxed">{step.instruction}</p>

          {/* Tip */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-primary-900" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800 mb-1">Conseil pro</p>
                <p className="text-sm text-primary-700">{step.tip}</p>
              </div>
            </div>
          </div>

          {/* Interactive Action */}
          <div className="bg-primary-50 rounded-xl p-6 text-center mb-6">
            <p className="text-sm text-primary-500 mb-4">Cliquez pour simuler l'action</p>
            <div className="relative inline-block">
              <button
                onClick={handleCompleteStep}
                className={`px-8 py-4 bg-gradient-to-r ${selectedTutorial.gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all`}
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {step.action}
                </span>
              </button>
              <div className="absolute -top-2 -right-2 animate-bounce">
                <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center shadow-lg">
                  <MousePointer2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-primary-50 border-t">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>

          <div className="flex items-center gap-1">
            {selectedTutorial.steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  completedSteps.includes(i)
                    ? 'bg-primary-900'
                    : i === currentStep
                    ? 'bg-primary-900'
                    : 'bg-primary-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleCompleteStep}
            className="flex items-center gap-2 px-4 py-2 text-primary-900 font-medium hover:bg-primary-100 rounded-lg transition-colors"
          >
            {currentStep === selectedTutorial.steps.length - 1 ? 'Terminer' : 'Suivant'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTutorial;
