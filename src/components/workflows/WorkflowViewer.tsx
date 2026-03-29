/**
 * WorkflowViewer Component
 * Displays workflow steps, comments, and signatures in a reusable panel
 * Can be used in signature pages, document detail pages, and external report views
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Calendar,
  GitBranch,
  Eye,
  EyeOff,
  Building2,
  Mail,
  PenTool,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Badge } from '../ui';

// Workflow step interface
export interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  type: 'consultation' | 'validation' | 'approval' | 'signature' | 'paraph';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'skipped';
  assignee: {
    id: number;
    name: string;
    email: string;
    role?: string;
    department?: string;
    title?: string;
  };
  completedAt?: string;
  completedBy?: {
    id: number;
    name: string;
    email: string;
    title?: string;
    delegatedFrom?: string;
  };
  comment?: string;
  signature?: {
    type: 'draw' | 'text' | 'upload' | 'certificate';
    data: string;
    timestamp: string;
    ipAddress?: string;
  };
  deadline?: string;
}

export interface WorkflowData {
  id: string;
  name: string;
  templateName?: string;
  status: 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  initiatedBy?: {
    id: number;
    name: string;
    email: string;
    department?: string;
  };
  steps: WorkflowStep[];
}

interface WorkflowViewerProps {
  workflow: WorkflowData;
  variant?: 'sidebar' | 'inline' | 'full';
  theme?: 'dark' | 'light';
  showHeader?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showSignatures?: boolean;
  showComments?: boolean;
  onStepClick?: (step: WorkflowStep) => void;
  className?: string;
}

export const WorkflowViewer: React.FC<WorkflowViewerProps> = ({
  workflow,
  variant = 'sidebar',
  theme = 'light',
  showHeader = true,
  collapsible = true,
  defaultCollapsed = false,
  showSignatures = true,
  showComments = true,
  onStepClick,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);

  const isDark = theme === 'dark';

  // Theme classes
  const themeClasses = {
    container: isDark ? 'bg-[#2D2D2D] border-[#3D3D3D]' : 'bg-white border-[#E5E7EB]',
    header: isDark ? 'border-[#3D3D3D]' : 'border-[#E5E7EB]',
    text: isDark ? 'text-white' : 'text-[#1A1A2E]',
    textMuted: isDark ? 'text-advist-text-muted' : 'text-[#6B7280]',
    textSubtle: isDark ? 'text-advist-text-secondary' : 'text-[#6B7280]',
    stepBg: isDark ? 'bg-[#3D3D3D]' : 'bg-[#F8FAFC]',
    stepBorder: isDark ? 'border-[#4D4D4D]' : 'border-[#E5E7EB]',
    commentBg: isDark ? 'bg-black/20' : 'bg-[#F8FAFC]',
    hover: isDark ? 'hover:bg-[#3D3D3D]' : 'hover:bg-[#F8FAFC]',
  };

  // Helper functions
  const getStepTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      consultation: 'Consultation',
      validation: 'Validation',
      approval: 'Approbation',
      signature: 'Signature',
      paraph: 'Paraphe',
    };
    return labels[type] || type;
  };

  const getStepTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      consultation: isDark
        ? 'bg-advist-dark/20 text-advist-gray900 border-advist-dark/30'
        : 'bg-advist-surface-dark text-advist-gray900',
      validation: isDark
        ? 'bg-advist-success/20 text-advist-success border-advist-success/30'
        : 'bg-green-50 text-advist-success',
      approval: isDark
        ? 'bg-advist-success/20 text-green-400 border-advist-success/30'
        : 'bg-green-50 text-advist-success',
      signature: isDark
        ? 'bg-advist-dark/20 text-advist-text-secondary border-advist-gold/30'
        : 'bg-advist-gold-light text-advist-gray900',
      paraph: isDark
        ? 'bg-advist-gold/20 text-advist-gold-light border-advist-gold/30'
        : 'bg-advist-gold-light text-advist-gold-dark',
    };
    return colors[type] || (isDark ? 'bg-advist-text-secondary/20 text-advist-text-muted' : 'bg-advist-surface-dark text-advist-gray900');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className={isDark ? 'text-advist-success' : 'text-advist-success'} />;
      case 'rejected':
        return <XCircle size={16} className={isDark ? 'text-advist-gold' : 'text-advist-gold-dark'} />;
      case 'in_progress':
        return <Clock size={16} className={isDark ? 'text-advist-gold' : 'text-advist-gold-dark'} />;
      case 'skipped':
        return <ArrowRight size={16} className="text-advist-text-muted" />;
      default:
        return <Clock size={16} className="text-advist-text-secondary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: 'Approuvé',
      rejected: 'Rejeté',
      pending: 'En attente',
      in_progress: 'En cours',
      skipped: 'Ignoré',
    };
    return labels[status] || status;
  };

  const getStepStatusBg = (status: string) => {
    if (isDark) {
      switch (status) {
        case 'approved': return 'bg-advist-success/10 border-advist-success/30';
        case 'rejected': return 'bg-advist-error/10 border-advist-gold/30';
        case 'in_progress': return 'bg-advist-dark/10 border-advist-gold/30';
        default: return `${themeClasses.stepBg} ${themeClasses.stepBorder}`;
      }
    } else {
      switch (status) {
        case 'approved': return 'bg-green-50/50 border-advist-success';
        case 'rejected': return 'bg-advist-gold-light/50 border-advist-gold';
        case 'in_progress': return 'bg-advist-gold-light border-advist-gold';
        default: return 'bg-white border-[#E5E7EB]';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleStepExpand = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const approvedSteps = workflow.steps.filter(s => s.status === 'approved');
  const stepsWithComments = workflow.steps.filter(s => s.comment);

  // Render progress bar
  const renderProgressBar = () => (
    <div className="flex items-center gap-1">
      {workflow.steps.map((step, idx) => (
        <div
          key={idx}
          className={`flex-1 h-1.5 rounded-full transition-colors ${
            step.status === 'approved' ? 'bg-advist-success' :
            step.status === 'rejected' ? 'bg-advist-error' :
            step.status === 'in_progress' ? 'bg-advist-dark' :
            isDark ? 'bg-advist-surface-dark' : 'bg-advist-border'
          }`}
          title={`${step.name}: ${getStatusLabel(step.status)}`}
        />
      ))}
    </div>
  );

  // Render a single step
  const renderStep = (step: WorkflowStep) => {
    const isExpanded = expandedSteps.includes(step.id);
    const hasDetails = step.comment || (showSignatures && step.signature);

    return (
      <div
        key={step.id}
        className={`p-3 rounded-lg border transition-colors ${getStepStatusBg(step.status)} ${
          onStepClick ? 'cursor-pointer' : ''
        }`}
        onClick={() => onStepClick?.(step)}
      >
        {/* Step Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${
              isDark ? 'bg-white/10 text-white' : 'bg-[#1A1A2E] text-white'
            } text-xs flex items-center justify-center font-bold`}>
              {step.order}
            </span>
            <span className={`${themeClasses.text} text-sm font-medium`}>{step.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Signature indicator */}
            {showSignatures && step.signature?.data && step.status === 'approved' && (
              <div className={`${isDark ? 'bg-white/10' : 'bg-white'} border ${isDark ? 'border-primary-600' : 'border-advist-border'} rounded p-1`}>
                <img
                  src={step.signature.data}
                  alt={`Signature de ${step.completedBy?.name || step.assignee.name}`}
                  className="h-6 w-auto object-contain"
                />
              </div>
            )}
            {getStatusIcon(step.status)}
          </div>
        </div>

        {/* Step Type Badge */}
        <Badge className={`${getStepTypeColor(step.type)} text-xs mb-2`}>
          {getStepTypeLabel(step.type)}
        </Badge>

        {/* Assignee */}
        <div className={`flex items-center gap-2 text-xs ${themeClasses.textMuted} mb-1`}>
          <User size={12} />
          <span>{step.assignee.name}</span>
          {step.assignee.role && (
            <span className={themeClasses.textSubtle}>({step.assignee.role})</span>
          )}
        </div>
        {step.assignee.department && (
          <div className={`flex items-center gap-2 text-xs ${themeClasses.textSubtle} mb-1`}>
            <Building2 size={12} />
            <span>{step.assignee.department}</span>
          </div>
        )}

        {/* Delegated info */}
        {step.completedBy && step.completedBy.id !== step.assignee.id && (
          <div className="mt-1 text-xs text-advist-gold">
            Délégué à: {step.completedBy.name}
            {step.completedBy.delegatedFrom && (
              <span className={themeClasses.textSubtle}> (par {step.completedBy.delegatedFrom})</span>
            )}
          </div>
        )}

        {/* Completion Info */}
        {step.completedAt && (
          <div className={`flex items-center gap-2 text-xs ${themeClasses.textSubtle} mt-2`}>
            <Calendar size={12} />
            <span>{formatDate(step.completedAt)}</span>
          </div>
        )}

        {/* Expandable details */}
        {hasDetails && variant !== 'full' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStepExpand(step.id);
            }}
            className={`mt-2 flex items-center gap-1 text-xs ${themeClasses.textMuted} ${themeClasses.hover} rounded px-2 py-1`}
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {isExpanded ? 'Masquer les détails' : 'Voir les détails'}
          </button>
        )}

        {/* Comment - always show in full variant, or when expanded */}
        {showComments && step.comment && (variant === 'full' || isExpanded) && (
          <div className={`mt-3 p-2 ${themeClasses.commentBg} rounded-lg`}>
            <div className="flex items-start gap-2">
              <MessageSquare size={12} className={`${themeClasses.textMuted} mt-0.5 flex-shrink-0`} />
              <div>
                <p className={`text-xs font-medium ${themeClasses.textMuted} mb-1`}>Commentaire</p>
                <p className={`text-xs ${themeClasses.textSubtle} leading-relaxed`}>{step.comment}</p>
              </div>
            </div>
          </div>
        )}

        {/* Signature details - always show in full variant, or when expanded */}
        {showSignatures && step.signature && (variant === 'full' || isExpanded) && (
          <div className={`mt-3 p-2 ${isDark ? 'bg-advist-dark/10 border-advist-gold/30' : 'bg-advist-gold-light border-advist-gold'} border rounded-lg`}>
            <div className="flex items-start gap-2">
              <PenTool size={12} className="text-advist-gray900 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-advist-gray900 mb-2">
                  {step.type === 'signature' ? 'Signature' : 'Signature de validation'}
                </p>
                {step.signature.data && (
                  <div className={`${isDark ? 'bg-white/10' : 'bg-white'} border ${isDark ? 'border-primary-600' : 'border-advist-border'} rounded-lg p-2 mb-2 inline-block`}>
                    <img
                      src={step.signature.data}
                      alt="Signature"
                      className="max-h-12 object-contain"
                    />
                  </div>
                )}
                <div className={`grid grid-cols-2 gap-2 text-xs ${themeClasses.textSubtle}`}>
                  <div>
                    <span className={themeClasses.textMuted}>Horodatage: </span>
                    {formatDate(step.signature.timestamp)}
                  </div>
                  {step.signature.ipAddress && (
                    <div>
                      <span className={themeClasses.textMuted}>IP: </span>
                      <span className="font-mono">{step.signature.ipAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Full variant (for report pages)
  if (variant === 'full') {
    return (
      <div className={`${className}`}>
        {/* Header */}
        {showHeader && (
          <div className="mb-4">
            <h2 className={`text-lg font-semibold ${themeClasses.text} mb-2 flex items-center gap-2`}>
              <Clock size={20} />
              Historique des Validations
            </h2>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {workflow.steps.map(step => renderStep(step))}
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className={`flex flex-col overflow-hidden ${themeClasses.container} border-r ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className={`p-4 border-b ${themeClasses.header} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-advist-gold" />
            <h3 className={`${themeClasses.text} font-medium`}>Workflow</h3>
          </div>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1 ${themeClasses.hover} rounded ${themeClasses.textMuted}`}
            >
              {isCollapsed ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          )}
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Workflow Info */}
          <div className={`p-4 border-b ${themeClasses.header}`}>
            <h4 className={`text-sm ${themeClasses.text} font-medium mb-2`}>{workflow.name}</h4>
            {workflow.initiatedBy && (
              <div className={`flex items-center gap-2 text-xs ${themeClasses.textMuted} mb-1`}>
                <User size={12} />
                <span>Initié par {workflow.initiatedBy.name}</span>
              </div>
            )}
            <div className={`flex items-center gap-2 text-xs ${themeClasses.textMuted}`}>
              <Calendar size={12} />
              <span>Démarré le {formatDate(workflow.startedAt)}</span>
            </div>
            {workflow.completedAt && (
              <div className={`flex items-center gap-2 text-xs ${themeClasses.textMuted} mt-1`}>
                <CheckCircle size={12} />
                <span>Terminé le {formatDate(workflow.completedAt)}</span>
              </div>
            )}

            {/* Progress indicator */}
            <div className="mt-3">
              {renderProgressBar()}
              <div className={`flex justify-between text-xs ${themeClasses.textSubtle} mt-1`}>
                <span>{approvedSteps.length}/{workflow.steps.length} étapes</span>
                <span>{stepsWithComments.length} commentaire(s)</span>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {workflow.steps.map(step => renderStep(step))}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t ${themeClasses.header}`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className={themeClasses.textMuted} />
              <span className={`text-sm ${themeClasses.text}`}>
                {workflow.status === 'completed' ? 'Workflow terminé' :
                 workflow.status === 'rejected' ? 'Workflow rejeté' :
                 workflow.status === 'cancelled' ? 'Workflow annulé' :
                 'Workflow en cours'}
              </span>
            </div>
            <p className={`text-xs ${themeClasses.textSubtle}`}>
              Les commentaires et signatures des validateurs sont visibles ci-dessus
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkflowViewer;
