/**
 * Best Practices Widget
 * Displays suggested best practices based on organization's performance
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Clock,
  Play,
  _ChevronRight,
  TrendingUp,
  Star,
  Users,
} from 'lucide-react';
import { WidgetConfig } from '../../../services/dashboard';
import { analyticsService, BestPractice, BestPracticeStatus } from '../../../services/analytics';

interface BestPracticesWidgetProps {
  config: WidgetConfig;
}

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-advist-gold-light', text: 'text-advist-error', border: 'border-advist-gold' },
  high: { bg: 'bg-advist-gold-light', text: 'text-advist-gold-dark', border: 'border-advist-gold' },
  medium: { bg: 'bg-advist-gold-light', text: 'text-advist-gray900', border: 'border-advist-gold' },
  low: {
    bg: 'bg-advist-surface-dark',
    text: 'text-advist-gray900',
    border: 'border-advist-border',
  },
};

const statusIcons: Record<BestPracticeStatus, React.ReactNode> = {
  not_adopted: <Lightbulb size={14} className="text-advist-gold" />,
  suggested: <Lightbulb size={14} className="text-advist-gold" />,
  in_progress: <Clock size={14} className="text-advist-gray900" />,
  implemented: <CheckCircle size={14} className="text-advist-success" />,
  dismissed: null,
};

export const BestPracticesWidget: React.FC<BestPracticesWidgetProps> = ({ config }) => {
  const [practices, setPractices] = useState<BestPractice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await analyticsService.getBestPractices(4);
        setPractices(data);
      } catch (_err) {
        // Mock data for demo
        setPractices([
          {
            id: '1',
            title: 'Validation parallèle',
            description:
              'Permettre la validation simultanée par plusieurs approbateurs pour réduire les délais.',
            category: 'workflow',
            priority: 'high',
            expectedTimeSavingPct: 35,
            expectedErrorReductionPct: 0,
            adoptionRate: 78,
            successRate: 92,
            implementationSteps: [
              {
                step: 1,
                title: 'Configurer',
                description: "Activer l'option dans les paramètres de workflow",
              },
              { step: 2, title: 'Former', description: 'Former les équipes à la nouvelle méthode' },
            ],
            adoptionStatus: 'not_adopted',
          },
          {
            id: '2',
            title: 'Modèles de documents',
            description:
              'Utiliser des modèles standardisés pour réduire les erreurs et accélérer la création.',
            category: 'efficiency',
            priority: 'medium',
            expectedTimeSavingPct: 25,
            expectedErrorReductionPct: 40,
            adoptionRate: 85,
            successRate: 88,
            implementationSteps: [],
            adoptionStatus: 'in_progress',
          },
          {
            id: '3',
            title: 'Notifications intelligentes',
            description:
              'Activer les rappels automatiques pour les documents en attente depuis trop longtemps.',
            category: 'workflow',
            priority: 'medium',
            expectedTimeSavingPct: 20,
            expectedErrorReductionPct: 15,
            adoptionRate: 65,
            successRate: 85,
            implementationSteps: [],
            adoptionStatus: 'not_adopted',
          },
          {
            id: '4',
            title: 'Signature mobile',
            description:
              'Permettre la signature depuis mobile pour accélérer les validations urgentes.',
            category: 'signature',
            priority: 'high',
            expectedTimeSavingPct: 45,
            expectedErrorReductionPct: 0,
            adoptionRate: 72,
            successRate: 94,
            implementationSteps: [],
            adoptionStatus: 'implemented',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config]);

  const handleStartPractice = async (practiceId: string) => {
    try {
      await analyticsService.updateBestPracticeStatus(practiceId, 'in_progress');
      setPractices((prev) =>
        prev.map((p) => (p.id === practiceId ? { ...p, adoptionStatus: 'in_progress' } : p))
      );
    } catch (err) {
      console.error('Failed to update practice status:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-advist-surface-dark rounded-lg"></div>
        ))}
      </div>
    );
  }

  // Filter out dismissed practices
  const visiblePractices = practices.filter((p) => p.adoptionStatus !== 'dismissed');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-advist-gold" />
          <span className="text-xs font-medium text-advist-gray900/50 uppercase tracking-wider">
            Recommandé pour vous
          </span>
        </div>
      </div>

      {/* Practices List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {visiblePractices.map((practice) => {
          const colors = priorityColors[practice.priority];
          const isImplemented = practice.adoptionStatus === 'implemented';
          const isInProgress = practice.adoptionStatus === 'in_progress';

          return (
            <div
              key={practice.id}
              className={`p-3 rounded-lg border ${
                isImplemented
                  ? 'bg-green-50 border-advist-success'
                  : isInProgress
                    ? 'bg-advist-gold-light border-advist-gold'
                    : `${colors.bg} ${colors.border}`
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{statusIcons[practice.adoptionStatus]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${
                        isImplemented
                          ? 'text-advist-success'
                          : isInProgress
                            ? 'text-advist-gray900'
                            : colors.text
                      }`}
                    >
                      {practice.title}
                    </p>
                    {practice.adoptionStatus === 'not_adopted' && (
                      <button
                        onClick={() => handleStartPractice(practice.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-advist-dark text-white text-xs rounded-md hover:bg-advist-dark/90 transition-colors"
                      >
                        <Play size={10} />
                        Démarrer
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-advist-gray900/60 mt-1 line-clamp-2">
                    {practice.description}
                  </p>

                  {/* Impact metrics */}
                  <div className="flex items-center gap-3 mt-2">
                    {practice.expectedTimeSavingPct > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <TrendingUp size={12} className="text-advist-success" />
                        <span className="text-advist-success font-medium">
                          +{practice.expectedTimeSavingPct}% efficacité
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-advist-gray900/50">
                      <Users size={12} />
                      <span>{practice.adoptionRate}% des top performers</span>
                    </div>
                  </div>

                  {/* Progress indicator for in_progress */}
                  {isInProgress && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-advist-gray900">En cours d'implémentation</span>
                      </div>
                      <div className="h-1 bg-advist-surface-dark rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-advist-dark rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Implemented badge */}
                  {isImplemented && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-advist-success">
                      <CheckCircle size={12} />
                      <span>Implémentée avec succès</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 p-3 bg-advist-surface-dark/30 rounded-lg">
        <p className="text-xs text-advist-gray900/70 text-center">
          Les organisations performantes utilisent en moyenne{' '}
          <span className="font-semibold">4.5 pratiques</span> sur 6
        </p>
      </div>

      {/* Link */}
      <Link
        to="/user/analytics/best-practices"
        className="flex items-center justify-center gap-1 pt-3 text-sm text-advist-gray900/70 hover:text-advist-gray900"
      >
        Voir toutes les recommandations <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default BestPracticesWidget;
