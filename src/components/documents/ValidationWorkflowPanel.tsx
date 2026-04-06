/**
 * Validation Workflow Panel Component
 * Manages document validation workflow: draft → submitted → under_review → validated/rejected
 */
import React, { useState } from 'react';
import {
  Send,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ValidationStatusBadge, ValidationStatus } from './ValidationStatusBadge';

// Helper function for relative time formatting
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
};

interface ValidationSummary {
  status: ValidationStatus;
  status_display: string;
  submitted_at: string | null;
  submitted_by: { id: string; name: string } | null;
  completed_at: string | null;
  completed_by: { id: string; name: string } | null;
  notes: string;
  comments: {
    total: number;
    resolved: number;
    pending: number;
  };
  can_submit: boolean;
  can_validate: boolean;
}

interface ValidationHistoryEntry {
  type: 'comment' | 'workflow_action';
  timestamp: string;
  user: { id: string; name: string } | null;
  content?: string;
  action?: string;
  comment?: string;
  step?: string;
  context?: {
    type: string;
    section_id: string;
    page: number;
  };
  resolved?: boolean;
}

interface ValidationWorkflowPanelProps {
  documentId: string;
  validationSummary: ValidationSummary;
  validationHistory?: ValidationHistoryEntry[];
  currentUserId: string;
  isOwner: boolean;
  canReview: boolean;
  onSubmitForReview: (notes: string) => Promise<void>;
  onStartReview: () => Promise<void>;
  onRequestChanges: (comments: string) => Promise<void>;
  onValidate: (comments: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const ValidationWorkflowPanel: React.FC<ValidationWorkflowPanelProps> = ({
  _documentId,
  validationSummary,
  validationHistory = [],
  _currentUserId,
  isOwner,
  canReview,
  onSubmitForReview,
  onStartReview,
  onRequestChanges,
  onValidate,
  onReject,
  isLoading = false,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    if (isLoading) return;

    try {
      switch (action) {
        case 'submit':
          await onSubmitForReview(actionNotes);
          break;
        case 'start_review':
          await onStartReview();
          break;
        case 'request_changes':
          if (!actionNotes.trim()) {
            alert('Veuillez fournir des commentaires pour les modifications demandées');
            return;
          }
          await onRequestChanges(actionNotes);
          break;
        case 'validate':
          await onValidate(actionNotes);
          break;
        case 'reject':
          if (!actionNotes.trim()) {
            alert('Veuillez fournir une raison pour le rejet');
            return;
          }
          await onReject(actionNotes);
          break;
      }
      setActionNotes('');
      setActiveAction(null);
    } catch (error) {
      console.error('Validation action failed:', error);
    }
  };

  const renderActionButtons = () => {
    const { status, can_submit, can_validate } = validationSummary;

    // Owner actions
    if (isOwner && can_submit) {
      return (
        <div className="space-y-3">
          {activeAction === 'submit' ? (
            <div className="space-y-2">
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Notes pour les réviseurs (optionnel)"
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAction('submit')} disabled={isLoading}>
                  <Send size={14} className="mr-1" />
                  Confirmer la soumission
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveAction(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setActiveAction('submit')}
              className="w-full"
              disabled={isLoading}
            >
              <Send size={16} className="mr-2" />
              Soumettre pour révision
            </Button>
          )}
        </div>
      );
    }

    // Reviewer actions
    if (canReview && can_validate) {
      if (status === 'submitted') {
        return (
          <Button
            onClick={() => handleAction('start_review')}
            className="w-full"
            disabled={isLoading}
          >
            <Eye size={16} className="mr-2" />
            Commencer la révision
          </Button>
        );
      }

      if (status === 'under_review') {
        return (
          <div className="space-y-3">
            {activeAction ? (
              <div className="space-y-2">
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    activeAction === 'reject'
                      ? 'Raison du rejet (requis)'
                      : activeAction === 'request_changes'
                        ? 'Commentaires sur les modifications (requis)'
                        : 'Commentaires (optionnel)'
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                  rows={3}
                  required={activeAction === 'reject' || activeAction === 'request_changes'}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={activeAction === 'reject' ? 'danger' : 'primary'}
                    onClick={() => handleAction(activeAction)}
                    disabled={isLoading}
                  >
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveAction(null);
                      setActionNotes('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveAction('request_changes')}
                  disabled={isLoading}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  <MessageSquare size={14} className="mr-1" />
                  Modifications
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveAction('validate')}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={14} className="mr-1" />
                  Valider
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setActiveAction('reject')}
                  disabled={isLoading}
                >
                  <XCircle size={14} className="mr-1" />
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        );
      }
    }

    return null;
  };

  const renderStatusInfo = () => {
    const { status, submitted_by, submitted_at, completed_by, completed_at, notes } =
      validationSummary;

    return (
      <div className="space-y-3 text-sm">
        {submitted_by && submitted_at && (
          <div className="flex items-center gap-2 text-gray-600">
            <User size={14} />
            <span>
              Soumis par <strong>{submitted_by.name}</strong>
            </span>
            <Clock size={14} className="ml-2" />
            <span>{formatRelativeTime(submitted_at)}</span>
          </div>
        )}

        {completed_by && completed_at && (status === 'validated' || status === 'rejected') && (
          <div className="flex items-center gap-2 text-gray-600">
            <User size={14} />
            <span>
              {status === 'validated' ? 'Validé' : 'Rejeté'} par{' '}
              <strong>{completed_by.name}</strong>
            </span>
            <Clock size={14} className="ml-2" />
            <span>{formatRelativeTime(completed_at)}</span>
          </div>
        )}

        {notes && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-gray-700">{notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderCommentsSummary = () => {
    const { comments } = validationSummary;

    if (comments.total === 0) return null;

    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <MessageSquare size={14} className="text-gray-500" />
          <span>{comments.total} commentaires</span>
        </div>
        {comments.pending > 0 && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertTriangle size={14} />
            <span>{comments.pending} en attente</span>
          </div>
        )}
        {comments.resolved > 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle size={14} />
            <span>{comments.resolved} résolus</span>
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    if (validationHistory.length === 0) {
      return <p className="text-sm text-gray-500 text-center py-4">Aucun historique disponible</p>;
    }

    return (
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {validationHistory.map((entry, index) => (
          <div key={index} className="flex gap-3 p-2 rounded-md hover:bg-gray-50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              {entry.type === 'comment' ? (
                <MessageSquare size={14} className="text-gray-600" />
              ) : (
                <Eye size={14} className="text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{entry.user?.name || 'Système'}</span>
                <span className="text-gray-400">{formatRelativeTime(entry.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {entry.type === 'comment' ? entry.content : entry.action || entry.comment}
              </p>
              {entry.context && entry.context.section_id && (
                <span className="text-xs text-blue-600">Section: {entry.context.section_id}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Workflow de validation</h3>
          <ValidationStatusBadge status={validationSummary.status} size="md" />
        </div>

        {/* Status info */}
        {renderStatusInfo()}

        {/* Comments summary */}
        {renderCommentsSummary()}

        {/* Action buttons */}
        {renderActionButtons()}

        {/* History toggle */}
        <div className="border-t pt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Historique de validation
          </button>

          {showHistory && <div className="mt-3">{renderHistory()}</div>}
        </div>
      </div>
    </Card>
  );
};

export default ValidationWorkflowPanel;
