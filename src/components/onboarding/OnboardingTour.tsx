/**
 * OnboardingTour — Visite guidée au premier login
 *
 * Affiche un overlay step-by-step la première fois qu'un utilisateur se connecte.
 * Stocke un flag dans Supabase (profiles.preferences.onboarding_completed)
 * pour ne plus l'afficher après. Peut être relancé manuellement depuis /help.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  FileText,
  GitBranch,
  PenTool,
  Bell,
  HelpCircle,
  PartyPopper,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';

interface OnboardingStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: string;
  action?: { label: string; route: string };
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Bienvenue sur ADVIST !',
    description:
      'Découvrez en 2 minutes comment digitaliser vos circuits de validation et signer électroniquement vos documents en toute sécurité.',
  },
  {
    id: 'documents',
    icon: FileText,
    title: 'Importez vos documents',
    description:
      "Glissez-déposez vos PDF, Word ou Excel. ADVIST gère le versioning automatiquement et vous permet d'ajouter des annotations collaboratives.",
    highlight: '/user/documents',
    action: { label: 'Voir les documents', route: '/user/documents' },
  },
  {
    id: 'workflows',
    icon: GitBranch,
    title: 'Configurez vos circuits',
    description:
      'Créez des circuits de validation séquentiels, parallèles ou conditionnels. Assignez vos collaborateurs en un clic, définissez des délais avec rappels automatiques.',
    highlight: '/user/workflows',
    action: { label: 'Créer un circuit', route: '/user/workflows' },
  },
  {
    id: 'signatures',
    icon: PenTool,
    title: 'Signez électroniquement',
    description:
      "Signature avancée conforme Loi CI 2013-546 et eIDAS. Horodatage serveur, sceau d'intégrité SHA-256, OTP obligatoire pour les externes.",
    highlight: '/user/signatures',
    action: { label: 'Voir mes signatures', route: '/user/signatures' },
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Restez informé',
    description:
      "Recevez des notifications par email, WhatsApp ou SMS. Rappels automatiques J-3 et J-1 avant l'échéance, escalade en cas de retard.",
    highlight: '/user/notifications',
  },
  {
    id: 'help',
    icon: HelpCircle,
    title: "Besoin d'aide ?",
    description:
      "Cliquez sur l'icône d'aide en haut à droite à tout moment pour accéder au centre d'aide, à la documentation, aux tutoriels et au support.",
  },
  {
    id: 'done',
    icon: PartyPopper,
    title: 'Vous êtes prêt !',
    description:
      "Vous pouvez relancer cette visite à tout moment depuis le centre d'aide. Bon démarrage avec ADVIST !",
  },
];

const STORAGE_KEY = 'advist-onboarding-completed';

export const OnboardingTour: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Check if onboarding should be shown
  useEffect(() => {
    if (!user) return;

    const checkOnboarding = async () => {
      // Check localStorage first (fast path)
      const localFlag = localStorage.getItem(STORAGE_KEY);
      if (localFlag === '1') return;

      // Check Supabase profile preferences
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .maybeSingle();

        const prefs = (profile?.preferences || {}) as Record<string, unknown>;
        if (prefs.onboarding_completed === true) {
          localStorage.setItem(STORAGE_KEY, '1');
          return;
        }

        // Show the tour
        setOpen(true);
      } catch {
        // On error, fall back to local flag only
      }
    };

    checkOnboarding();
  }, [user]);

  const finish = useCallback(async () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, '1');

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({
            preferences: { onboarding_completed: true },
          })
          .eq('id', user.id);
      } catch {
        // Non-blocking
      }
    }
  }, [user]);

  const skip = () => finish();

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const goToAction = () => {
    const action = STEPS[step].action;
    if (action) {
      finish();
      navigate(action.route);
    }
  };

  if (!open) return null;

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Skip button */}
        <button
          onClick={skip}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Passer la visite"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-primary-700 to-primary-900 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step indicator */}
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">
            Étape {step + 1} / {STEPS.length}
          </p>

          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mb-5">
            <Icon className="w-8 h-8 text-primary-700" />
          </div>

          {/* Title + description */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{currentStep.title}</h2>
          <p className="text-gray-600 leading-relaxed mb-6">{currentStep.description}</p>

          {/* Action button */}
          {currentStep.action && (
            <button
              onClick={goToAction}
              className="w-full mb-4 px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-900 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {currentStep.action.label} <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={prev}
              disabled={isFirst}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? 'w-6 bg-primary-700'
                      : i < step
                        ? 'w-1.5 bg-primary-300'
                        : 'w-1.5 bg-gray-200'
                  }`}
                  aria-label={`Aller à l'étape ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-900 hover:bg-primary-800 text-white rounded-lg text-sm font-semibold transition-all"
            >
              {isLast ? (
                <>
                  Terminer <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Suivant <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Skip link */}
          {!isLast && (
            <div className="text-center mt-4">
              <button
                onClick={skip}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Passer la visite guidée
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
