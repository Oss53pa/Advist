/**
 * Demo Modal Component
 * Enhanced with interactive demos, guided tour, and tutorials
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  X,
  Clock,
  CheckCircle,
  ArrowRight,
  Monitor,
  FileText,
  GitBranch,
  PenTool,
  Users,
  Sparkles,
  ChevronLeft,
  Lightbulb,
  Layers,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button, Input } from '../ui';
import { InteractiveWorkflowDemo } from './InteractiveWorkflowDemo';
import { InteractiveSignatureDemo } from './InteractiveSignatureDemo';
import { InteractiveDocumentDemo } from './InteractiveDocumentDemo';
import { GuidedTour } from './GuidedTour';
import { InteractiveTutorial } from './InteractiveTutorial';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DemoType = 'video' | 'interactive' | 'guided' | 'tutorial';
type InteractiveDemoType = 'workflow' | 'signature' | 'documents' | null;

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedDemo, setSelectedDemo] = useState<DemoType>('interactive');
  const [selectedInteractiveDemo, setSelectedInteractiveDemo] = useState<InteractiveDemoType>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const demoOptions = [
    {
      id: 'interactive' as DemoType,
      title: 'Démos interactives',
      description: 'Testez les fonctionnalités en conditions réelles',
      icon: Monitor,
      duration: 'Illimité',
      available: true,
      highlight: true,
    },
    {
      id: 'guided' as DemoType,
      title: 'Visite guidée',
      description: 'Découvrez ADVIST en 2 minutes',
      icon: Play,
      duration: '2 min',
      available: true,
    },
    {
      id: 'tutorial' as DemoType,
      title: 'Tutoriels',
      description: 'Apprenez pas à pas chaque fonctionnalité',
      icon: Lightbulb,
      duration: '5-10 min',
      available: true,
    },
    {
      id: 'video' as DemoType,
      title: 'Démo guidée live',
      description: 'Un expert vous accompagne en direct',
      icon: Users,
      duration: '30 min',
      available: true,
    },
  ];

  const interactiveDemos = [
    {
      id: 'workflow' as InteractiveDemoType,
      title: 'Workflow de validation',
      description: 'Simulez un circuit d\'approbation multi-étapes',
      icon: GitBranch,
      color: 'bg-primary-900',
    },
    {
      id: 'signature' as InteractiveDemoType,
      title: 'Signature électronique',
      description: 'Signez un document comme en production',
      icon: PenTool,
      color: 'bg-primary-900',
    },
    {
      id: 'documents' as InteractiveDemoType,
      title: 'Gestion documentaire',
      description: 'Explorez l\'interface de gestion de fichiers',
      icon: FileText,
      color: 'bg-primary-900',
    },
  ];

  const handleStartInteractiveDemo = () => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('demo_started', new Date().toISOString());
    onClose();
    navigate('/select-profile');
  };

  const handleRequestDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleBack = () => {
    setSelectedInteractiveDemo(null);
  };

  if (!isOpen) return null;

  // Render interactive demo content
  const renderInteractiveDemo = () => {
    switch (selectedInteractiveDemo) {
      case 'workflow':
        return <InteractiveWorkflowDemo />;
      case 'signature':
        return <InteractiveSignatureDemo />;
      case 'documents':
        return <InteractiveDocumentDemo />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={selectedInteractiveDemo ? '' : 'Découvrir ADVIST'}>
      {/* Back button when in interactive demo */}
      {selectedInteractiveDemo && (
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour aux démos
          </button>
        </div>
      )}

      {/* Interactive Demo View */}
      {selectedInteractiveDemo ? (
        renderInteractiveDemo()
      ) : !showRequestForm ? (
        <div className="space-y-6">
          {/* Demo Type Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {demoOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedDemo(option.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selectedDemo === option.id
                    ? 'border-advist-dark bg-advist-dark/5'
                    : 'border-advist-border hover:border-advist-dark/30'
                } ${option.highlight ? 'ring-2 ring-primary-400 ring-offset-2' : ''}`}
              >
                {option.highlight && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary-400 text-xs font-medium rounded-full text-primary-900">
                    Populaire
                  </span>
                )}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    selectedDemo === option.id
                      ? 'bg-advist-dark text-white'
                      : 'bg-advist-surface-dark text-advist-gray900'
                  }`}
                >
                  <option.icon size={20} />
                </div>
                <h3 className="font-semibold text-advist-gray900 text-sm">{option.title}</h3>
                <p className="text-xs text-advist-gray900/60 mt-1">{option.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-advist-gray900/50">
                  <Clock size={12} />
                  {option.duration}
                </div>
                {selectedDemo === option.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-advist-dark rounded-full flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Selected Demo Details */}
          {selectedDemo === 'interactive' && (
            <div className="bg-advist-bg rounded-xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-900 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-advist-gray900 mb-1">
                    Choisissez une démo interactive
                  </h3>
                  <p className="text-sm text-advist-gray900/70">
                    Testez les fonctionnalités clés d'ADVIST directement dans votre navigateur.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {interactiveDemos.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => setSelectedInteractiveDemo(demo.id)}
                    className="flex flex-col items-center p-4 bg-white rounded-xl border border-primary-100 hover:border-primary-200 hover:shadow-md transition-all"
                  >
                    <div className={`w-12 h-12 ${demo.color} rounded-xl flex items-center justify-center mb-3`}>
                      <demo.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-primary-900 text-sm text-center">{demo.title}</h4>
                    <p className="text-xs text-primary-500 text-center mt-1">{demo.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleStartInteractiveDemo} variant="outline" className="flex-1">
                  <Monitor size={18} className="mr-2" />
                  Accéder à la plateforme complète
                </Button>
              </div>
            </div>
          )}

          {selectedDemo === 'guided' && (
            <GuidedTour />
          )}

          {selectedDemo === 'tutorial' && (
            <InteractiveTutorial />
          )}

          {selectedDemo === 'video' && (
            <div className="bg-advist-bg rounded-xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-advist-gold-light rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-advist-gray900" />
                </div>
                <div>
                  <h3 className="font-semibold text-advist-gray900 mb-1">
                    Démo personnalisée avec un expert
                  </h3>
                  <p className="text-sm text-advist-gray900/70">
                    Un membre de notre équipe vous présentera ADVIST en fonction de vos besoins
                    spécifiques. Session de 30 minutes en visioconférence.
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {[
                  'Présentation adaptée à votre secteur',
                  'Réponses à toutes vos questions',
                  'Conseils personnalisés',
                  'Pas d\'engagement',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-advist-gray900">
                    <CheckCircle size={16} className="text-advist-success" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button onClick={() => setShowRequestForm(true)} className="w-full">
                <Users size={18} className="mr-2" />
                Réserver ma démo guidée
              </Button>
            </div>
          )}
        </div>
      ) : !submitted ? (
        /* Request Demo Form */
        <form onSubmit={handleRequestDemo} className="space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setShowRequestForm(false)}
              className="p-2 hover:bg-advist-surface-dark rounded-lg transition-all"
            >
              <ArrowRight size={18} className="rotate-180 text-advist-gray900" />
            </button>
            <div>
              <h3 className="font-semibold text-advist-gray900">Réserver une démo guidée</h3>
              <p className="text-sm text-advist-gray900/60">
                Remplissez le formulaire et nous vous contacterons
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom complet"
              placeholder="Jean Dupont"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email professionnel"
              type="email"
              placeholder="jean@entreprise.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Entreprise"
              placeholder="Nom de votre entreprise"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
            <Input
              label="Téléphone"
              type="tel"
              placeholder="+225 01 02 03 04 05"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRequestForm(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-[2]">
              Envoyer ma demande
            </Button>
          </div>
        </form>
      ) : (
        /* Success Message */
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-advist-success" />
          </div>
          <h3 className="text-xl font-semibold text-advist-gray900 mb-2">
            Demande envoyée !
          </h3>
          <p className="text-advist-gray900/70 mb-6">
            Notre équipe vous contactera dans les 24 heures pour planifier votre démo.
          </p>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      )}
    </Modal>
  );
};

export default DemoModal;
