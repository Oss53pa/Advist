/**
 * Contextual Annotation Panel Component
 * Allows annotating directly on sections, graphs, tables, etc.
 */
import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  FileText,
  Table2,
  BarChart3,
  Image,
  Type,
  CheckCircle,
  Circle,
  Plus,
  X,
  ChevronRight,
  Filter,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

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

export type ContextType =
  | 'page'
  | 'section'
  | 'paragraph'
  | 'table'
  | 'graph'
  | 'image'
  | 'header'
  | 'footer';

export interface ContextualAnnotation {
  id: string;
  document_id: string;
  version_id: string;
  annotation_type: 'highlight' | 'comment' | 'correction' | 'question';
  page_number: number;
  position: { x: number; y: number };
  content: { text: string };
  color: string;
  context_type: ContextType;
  context_type_display: string;
  section_id: string;
  section_title: string;
  element_selector: string;
  quoted_text: string;
  author: string;
  author_name: string;
  is_private: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  workflow_step: string | null;
  created_at: string;
  updated_at: string;
}

interface ContextualAnnotationPanelProps {
  documentId: string;
  versionNumber: number;
  annotations: ContextualAnnotation[];
  currentUserId: string;
  canAnnotate: boolean;
  onCreateAnnotation: (annotation: Partial<ContextualAnnotation>) => Promise<void>;
  onResolveAnnotation: (annotationId: string) => Promise<void>;
  onDeleteAnnotation: (annotationId: string) => Promise<void>;
  onAnnotationClick?: (annotation: ContextualAnnotation) => void;
  isLoading?: boolean;
}

const CONTEXT_TYPE_CONFIG: Record<
  ContextType,
  { label: string; icon: React.ElementType; color: string }
> = {
  page: { label: 'Page', icon: FileText, color: 'bg-gray-100 text-gray-700' },
  section: { label: 'Section', icon: Type, color: 'bg-blue-100 text-blue-700' },
  paragraph: { label: 'Paragraphe', icon: Type, color: 'bg-purple-100 text-purple-700' },
  table: { label: 'Tableau', icon: Table2, color: 'bg-green-100 text-green-700' },
  graph: { label: 'Graphique', icon: BarChart3, color: 'bg-orange-100 text-orange-700' },
  image: { label: 'Image', icon: Image, color: 'bg-pink-100 text-pink-700' },
  header: { label: 'En-tête', icon: Type, color: 'bg-cyan-100 text-cyan-700' },
  footer: { label: 'Pied de page', icon: Type, color: 'bg-teal-100 text-teal-700' },
};

const ANNOTATION_COLORS = [
  { name: 'Jaune', value: '#FEF08A' },
  { name: 'Vert', value: '#BBF7D0' },
  { name: 'Bleu', value: '#BFDBFE' },
  { name: 'Rose', value: '#FBCFE8' },
  { name: 'Orange', value: '#FED7AA' },
];

export const ContextualAnnotationPanel: React.FC<ContextualAnnotationPanelProps> = ({
  documentId,
  versionNumber,
  annotations,
  currentUserId,
  canAnnotate,
  onCreateAnnotation,
  onResolveAnnotation,
  onDeleteAnnotation,
  onAnnotationClick,
  isLoading = false,
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterContext, setFilterContext] = useState<ContextType | 'all'>('all');
  const [filterResolved, setFilterResolved] = useState<'all' | 'pending' | 'resolved'>('all');
  const [expandedAnnotation, setExpandedAnnotation] = useState<string | null>(null);

  // New annotation form state
  const [newAnnotation, setNewAnnotation] = useState({
    context_type: 'section' as ContextType,
    section_id: '',
    section_title: '',
    quoted_text: '',
    content: '',
    color: ANNOTATION_COLORS[0].value,
    page_number: 1,
  });

  // Filter annotations
  const filteredAnnotations = useMemo(() => {
    return annotations.filter((ann) => {
      if (filterContext !== 'all' && ann.context_type !== filterContext) return false;
      if (filterResolved === 'pending' && ann.is_resolved) return false;
      if (filterResolved === 'resolved' && !ann.is_resolved) return false;
      return true;
    });
  }, [annotations, filterContext, filterResolved]);

  // Group annotations by context
  const groupedAnnotations = useMemo(() => {
    const groups: Record<string, ContextualAnnotation[]> = {};
    filteredAnnotations.forEach((ann) => {
      const key = ann.section_id || ann.context_type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ann);
    });
    return groups;
  }, [filteredAnnotations]);

  const handleCreateAnnotation = async () => {
    if (!newAnnotation.content.trim()) return;

    await onCreateAnnotation({
      context_type: newAnnotation.context_type,
      section_id: newAnnotation.section_id,
      section_title: newAnnotation.section_title,
      quoted_text: newAnnotation.quoted_text,
      content: { text: newAnnotation.content },
      color: newAnnotation.color,
      page_number: newAnnotation.page_number,
      annotation_type: 'comment',
      position: { x: 0, y: 0 },
    });

    setNewAnnotation({
      context_type: 'section',
      section_id: '',
      section_title: '',
      quoted_text: '',
      content: '',
      color: ANNOTATION_COLORS[0].value,
      page_number: 1,
    });
    setShowNewForm(false);
  };

  const renderAnnotationItem = (annotation: ContextualAnnotation) => {
    const contextConfig = CONTEXT_TYPE_CONFIG[annotation.context_type];
    const ContextIcon = contextConfig.icon;
    const isExpanded = expandedAnnotation === annotation.id;
    const isOwner = annotation.author === currentUserId;

    return (
      <div
        key={annotation.id}
        className={`border rounded-lg p-3 transition-all ${
          annotation.is_resolved ? 'bg-gray-50 opacity-75' : 'bg-white'
        } ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}
        style={{ borderLeftColor: annotation.color, borderLeftWidth: 4 }}
      >
        {/* Header */}
        <div
          className="flex items-start gap-2 cursor-pointer"
          onClick={() => {
            setExpandedAnnotation(isExpanded ? null : annotation.id);
            onAnnotationClick?.(annotation);
          }}
        >
          <div className={`p-1 rounded ${contextConfig.color}`}>
            <ContextIcon size={14} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {annotation.section_title || contextConfig.label}
              </span>
              {annotation.is_resolved && (
                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              )}
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">
              {annotation.content.text}
            </p>
          </div>

          <ChevronRight
            size={16}
            className={`text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Quoted text */}
            {annotation.quoted_text && (
              <div className="p-2 bg-yellow-50 border-l-2 border-yellow-400 text-sm italic text-gray-600">
                "{annotation.quoted_text}"
              </div>
            )}

            {/* Full comment */}
            <p className="text-sm text-gray-700">{annotation.content.text}</p>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{annotation.author_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>
                  {formatRelativeTime(annotation.created_at)}
                </span>
              </div>
              {annotation.page_number > 0 && (
                <span>Page {annotation.page_number}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!annotation.is_resolved && canAnnotate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolveAnnotation(annotation.id);
                  }}
                  disabled={isLoading}
                >
                  <CheckCircle size={14} className="mr-1" />
                  Résoudre
                </Button>
              )}
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Supprimer cette annotation ?')) {
                      onDeleteAnnotation(annotation.id);
                    }
                  }}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            {/* Resolution info */}
            {annotation.is_resolved && annotation.resolved_by_name && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} />
                Résolu par {annotation.resolved_by_name}
                {annotation.resolved_at && (
                  <span>
                    {' '}
                    {formatRelativeTime(annotation.resolved_at)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNewAnnotationForm = () => (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Nouvelle annotation</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowNewForm(false)}
        >
          <X size={16} />
        </Button>
      </div>

      {/* Context type selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de contexte
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CONTEXT_TYPE_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = newAnnotation.context_type === key;
            return (
              <button
                key={key}
                onClick={() =>
                  setNewAnnotation({ ...newAnnotation, context_type: key as ContextType })
                }
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={14} />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Section
          </label>
          <input
            type="text"
            value={newAnnotation.section_id}
            onChange={(e) =>
              setNewAnnotation({ ...newAnnotation, section_id: e.target.value })
            }
            placeholder="ex: section-3.2"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre Section
          </label>
          <input
            type="text"
            value={newAnnotation.section_title}
            onChange={(e) =>
              setNewAnnotation({ ...newAnnotation, section_title: e.target.value })
            }
            placeholder="ex: Analyse financière"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {/* Page number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de page
        </label>
        <input
          type="number"
          min={1}
          value={newAnnotation.page_number}
          onChange={(e) =>
            setNewAnnotation({ ...newAnnotation, page_number: parseInt(e.target.value) || 1 })
          }
          className="w-24 px-3 py-2 border rounded-md text-sm"
        />
      </div>

      {/* Quoted text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texte sélectionné (optionnel)
        </label>
        <textarea
          value={newAnnotation.quoted_text}
          onChange={(e) =>
            setNewAnnotation({ ...newAnnotation, quoted_text: e.target.value })
          }
          placeholder="Copiez le texte que vous annotez..."
          className="w-full px-3 py-2 border rounded-md text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Commentaire *
        </label>
        <textarea
          value={newAnnotation.content}
          onChange={(e) =>
            setNewAnnotation({ ...newAnnotation, content: e.target.value })
          }
          placeholder="Votre commentaire..."
          className="w-full px-3 py-2 border rounded-md text-sm resize-none"
          rows={3}
          required
        />
      </div>

      {/* Color selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Couleur
        </label>
        <div className="flex gap-2">
          {ANNOTATION_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() =>
                setNewAnnotation({ ...newAnnotation, color: color.value })
              }
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                newAnnotation.color === color.value
                  ? 'ring-2 ring-offset-2 ring-blue-400'
                  : 'border-gray-200'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setShowNewForm(false)}
        >
          Annuler
        </Button>
        <Button
          onClick={handleCreateAnnotation}
          disabled={!newAnnotation.content.trim() || isLoading}
        >
          <Plus size={16} className="mr-1" />
          Ajouter
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Annotations contextuelles
          <Badge variant="secondary" className="ml-2">
            {annotations.length}
          </Badge>
        </h3>
        {canAnnotate && !showNewForm && (
          <Button size="sm" onClick={() => setShowNewForm(true)}>
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-gray-400" />
        </div>

        {/* Context type filter */}
        <select
          value={filterContext}
          onChange={(e) => setFilterContext(e.target.value as ContextType | 'all')}
          className="text-sm border rounded-md px-2 py-1"
        >
          <option value="all">Tous les types</option>
          {Object.entries(CONTEXT_TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        {/* Resolution status filter */}
        <select
          value={filterResolved}
          onChange={(e) =>
            setFilterResolved(e.target.value as 'all' | 'pending' | 'resolved')
          }
          className="text-sm border rounded-md px-2 py-1"
        >
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="resolved">Résolus</option>
        </select>
      </div>

      {/* New annotation form */}
      {showNewForm && renderNewAnnotationForm()}

      {/* Annotations list */}
      {filteredAnnotations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune annotation</p>
          {canAnnotate && (
            <Button
              size="sm"
              variant="link"
              onClick={() => setShowNewForm(true)}
              className="mt-2"
            >
              Ajouter la première annotation
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAnnotations.map(renderAnnotationItem)}
        </div>
      )}

      {/* Summary */}
      {annotations.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center gap-4 pt-2 border-t">
          <span className="flex items-center gap-1">
            <Circle size={10} className="text-amber-500" />
            {annotations.filter((a) => !a.is_resolved).length} en attente
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle size={10} className="text-green-500" />
            {annotations.filter((a) => a.is_resolved).length} résolus
          </span>
        </div>
      )}
    </div>
  );
};

export default ContextualAnnotationPanel;
