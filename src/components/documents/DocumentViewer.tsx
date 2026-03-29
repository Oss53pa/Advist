import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Image,
  File,
  Highlighter,
  MessageSquare,
  Stamp,
  PenTool,
  Type,
  Square,
  Circle,
  Trash2,
  Undo,
  Redo,
  Save,
  X,
  Move,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { documentsService } from '../../services/documents';

// Types for annotations
export interface Annotation {
  id: string;
  type: 'highlight' | 'comment' | 'stamp' | 'drawing' | 'text' | 'shape';
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  author: string;
  authorId: string;
  createdAt: string;
  data?: any;
}

export interface DocumentViewerProps {
  document: {
    id: string;
    name: string;
    type: string;
    url: string;
    mimeType: string;
    totalPages?: number;
  };
  annotations?: Annotation[];
  onAnnotationAdd?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onAnnotationUpdate?: (annotationId: string, data: Partial<Annotation>) => void;
  onSign?: () => void;
  readOnly?: boolean;
  showAnnotationTools?: boolean;
  currentUser: {
    id: string;
    name: string;
  };
  className?: string;
}

type AnnotationTool = 'select' | 'highlight' | 'comment' | 'stamp' | 'drawing' | 'text' | 'shape';

const STAMPS = [
  { id: 'approved', label: 'Approuvé', color: '#10B981' },
  { id: 'rejected', label: 'Rejeté', color: '#F59E0B' },
  { id: 'pending', label: 'En attente', color: '#F59E0B' },
  { id: 'reviewed', label: 'Révisé', color: '#3B82F6' },
  { id: 'confidential', label: 'Confidentiel', color: '#6B7280' },
];

const COLORS = [
  '#FFEB3B', // Yellow
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#F44336', // Red
  '#9C27B0', // Purple
  '#FF9800', // Orange
];

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  annotations = [],
  onAnnotationAdd,
  onAnnotationDelete,
  onAnnotationUpdate,
  onSign,
  readOnly = false,
  showAnnotationTools = true,
  currentUser,
  className,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(document.totalPages || 1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedStamp, setSelectedStamp] = useState(STAMPS[0]);
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>(annotations);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState<{ x: number; y: number }[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get document type icon
  const getDocumentIcon = () => {
    if (document.mimeType.includes('pdf')) return <FileText size={20} />;
    if (document.mimeType.includes('image')) return <Image size={20} />;
    return <File size={20} />;
  };

  // Handle zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));

  // Handle rotation
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Handle page navigation
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
  };

  // Handle print
  const handlePrint = () => {
    const printWindow = window.open(document.url, '_blank');
    printWindow?.print();
  };

  // Save annotation to undo stack
  const saveToUndoStack = () => {
    setUndoStack((prev) => [...prev, [...localAnnotations]]);
    setRedoStack([]);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, [...localAnnotations]]);
      setLocalAnnotations(previousState);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, [...localAnnotations]]);
      setLocalAnnotations(nextState);
      setRedoStack((prev) => prev.slice(0, -1));
    }
  };

  // Add annotation
  const addAnnotation = (type: Annotation['type'], x: number, y: number, data?: any) => {
    saveToUndoStack();
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type,
      page: currentPage,
      x,
      y,
      color: selectedColor,
      author: currentUser.name,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
      ...data,
    };
    setLocalAnnotations((prev) => [...prev, newAnnotation]);
    onAnnotationAdd?.(newAnnotation);
  };

  // Handle canvas click for annotations
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || activeTool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    switch (activeTool) {
      case 'highlight':
        addAnnotation('highlight', x, y, { width: 20, height: 2 });
        break;
      case 'comment':
        setCommentPosition({ x, y });
        setShowCommentInput(true);
        break;
      case 'stamp':
        addAnnotation('stamp', x, y, { stampId: selectedStamp.id, label: selectedStamp.label });
        break;
      case 'text':
        setCommentPosition({ x, y });
        setShowCommentInput(true);
        break;
    }
  };

  // Handle comment submission
  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      addAnnotation(activeTool === 'text' ? 'text' : 'comment', commentPosition.x, commentPosition.y, {
        content: commentText,
      });
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  // Delete annotation
  const deleteAnnotation = (annotationId: string) => {
    saveToUndoStack();
    setLocalAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    onAnnotationDelete?.(annotationId);
  };

  // Save all annotations
  const handleSaveAnnotations = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Convert document.id to number (assuming it's a string in the component)
      const documentId = typeof document.id === 'string' ? parseInt(document.id, 10) : document.id;

      // Save annotations to backend
      await documentsService.saveAnnotations(documentId, localAnnotations);

      setSaveStatus('success');
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save annotations:', error);
      setSaveStatus('error');
      // Reset error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Render document based on type
  const renderDocument = () => {
    const style = {
      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
      transformOrigin: 'center center',
    };

    if (document.mimeType.includes('pdf')) {
      return (
        <div className="relative w-full h-full" style={style}>
          {/* PDF Viewer using iframe - for production, use react-pdf or pdf.js */}
          <iframe
            src={`${document.url}#page=${currentPage}&toolbar=0`}
            className="w-full h-full border-0"
            title={document.name}
          />
          {/* Annotation overlay */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={handleCanvasClick}
          >
            {renderAnnotations()}
          </div>
        </div>
      );
    }

    if (document.mimeType.includes('image')) {
      return (
        <div className="relative flex items-center justify-center h-full" style={style}>
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
          />
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={handleCanvasClick}
          >
            {renderAnnotations()}
          </div>
        </div>
      );
    }

    // Office documents - use Microsoft Office Online viewer or Google Docs
    if (
      document.mimeType.includes('word') ||
      document.mimeType.includes('excel') ||
      document.mimeType.includes('powerpoint') ||
      document.mimeType.includes('document') ||
      document.mimeType.includes('spreadsheet') ||
      document.mimeType.includes('presentation')
    ) {
      return (
        <div className="relative w-full h-full" style={style}>
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.url)}`}
            className="w-full h-full border-0"
            title={document.name}
          />
        </div>
      );
    }

    // Fallback for unsupported types
    return (
      <div className="flex flex-col items-center justify-center h-full text-advist-gray900">
        <File size={64} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">{t('viewer.unsupportedFormat', 'Format non supporté pour la prévisualisation')}</p>
        <p className="text-sm mt-2">{document.mimeType}</p>
        <Button variant="outline" className="mt-4" onClick={handleDownload}>
          <Download size={16} className="mr-2" />
          {t('viewer.download', 'Télécharger le fichier')}
        </Button>
      </div>
    );
  };

  // Render annotations layer
  const renderAnnotations = () => {
    const pageAnnotations = localAnnotations.filter((a) => a.page === currentPage);

    return (
      <>
        {pageAnnotations.map((annotation) => (
          <div
            key={annotation.id}
            className="absolute group"
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {annotation.type === 'highlight' && (
              <div
                className="h-6 rounded opacity-50"
                style={{
                  backgroundColor: annotation.color,
                  width: `${annotation.width || 100}px`,
                }}
              />
            )}

            {annotation.type === 'comment' && (
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg"
                  style={{ backgroundColor: annotation.color }}
                >
                  <MessageSquare size={16} />
                </div>
                <div className="absolute left-10 top-0 bg-white border border-advist-bg rounded-lg p-3 shadow-lg min-w-[200px] hidden group-hover:block z-10">
                  <p className="text-xs text-advist-gray-cold mb-1">
                    {annotation.author} - {new Date(annotation.createdAt).toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-advist-gray900">{annotation.content}</p>
                  {!readOnly && annotation.authorId === currentUser.id && (
                    <button
                      onClick={() => deleteAnnotation(annotation.id)}
                      className="absolute top-2 right-2 text-advist-error hover:text-advist-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {annotation.type === 'stamp' && (
              <div
                className="px-4 py-2 rounded font-bold text-white text-sm uppercase transform -rotate-12 shadow-lg"
                style={{ backgroundColor: STAMPS.find((s) => s.id === annotation.data?.stampId)?.color || '#6B7280' }}
              >
                {annotation.data?.label || annotation.content}
              </div>
            )}

            {annotation.type === 'text' && (
              <div
                className="px-2 py-1 bg-white border rounded text-sm"
                style={{ borderColor: annotation.color }}
              >
                {annotation.content}
              </div>
            )}

            {annotation.type === 'drawing' && annotation.data?.path && (
              <svg className="absolute inset-0 pointer-events-none overflow-visible">
                <path
                  d={annotation.data.path}
                  stroke={annotation.color}
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            )}
          </div>
        ))}

        {/* Comment input overlay */}
        {showCommentInput && (
          <div
            className="absolute z-20"
            style={{
              left: `${commentPosition.x}%`,
              top: `${commentPosition.y}%`,
            }}
          >
            <div className="bg-white border border-advist-bg rounded-lg p-3 shadow-xl min-w-[250px]">
              <textarea
                autoFocus
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={activeTool === 'text' ? t('viewer.enterText', 'Entrez le texte...') : t('viewer.enterComment', 'Entrez votre commentaire...')}
                className="w-full p-2 border border-advist-bg rounded text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCommentInput(false);
                    setCommentText('');
                  }}
                >
                  {t('common.cancel', 'Annuler')}
                </Button>
                <Button size="sm" onClick={handleCommentSubmit}>
                  {t('common.add', 'Ajouter')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-advist-dark rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[700px]'} ${className || ''}`}
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-advist-dark/90 text-white border-b border-advist-dark/70">
        <div className="flex items-center gap-3">
          {getDocumentIcon()}
          <span className="font-medium truncate max-w-[300px]">{document.name}</span>
          <Badge variant="secondary" size="sm">
            {document.type.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-advist-dark/70 rounded px-2 py-1">
            <button onClick={handleZoomOut} className="p-1 hover:bg-advist-gold-light/30 rounded">
              <ZoomOut size={16} />
            </button>
            <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-advist-gold-light/30 rounded">
              <ZoomIn size={16} />
            </button>
          </div>

          <button onClick={handleRotate} className="p-2 hover:bg-advist-dark/70 rounded" title={t('viewer.rotate', 'Rotation')}>
            <RotateCw size={18} />
          </button>

          <div className="w-px h-6 bg-advist-dark/70" />

          <button onClick={handleDownload} className="p-2 hover:bg-advist-dark/70 rounded" title={t('viewer.download', 'Télécharger')}>
            <Download size={18} />
          </button>

          <button onClick={handlePrint} className="p-2 hover:bg-advist-dark/70 rounded" title={t('viewer.print', 'Imprimer')}>
            <Printer size={18} />
          </button>

          <button onClick={toggleFullscreen} className="p-2 hover:bg-advist-dark/70 rounded" title={t('viewer.fullscreen', 'Plein écran')}>
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {onSign && (
            <>
              <div className="w-px h-6 bg-advist-dark/70" />
              <Button size="sm" onClick={onSign} className="bg-advist-gold-light hover:bg-advist-gold-light/80">
                <PenTool size={14} className="mr-1" />
                {t('viewer.sign', 'Signer')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Annotation toolbar */}
      {showAnnotationTools && !readOnly && (
        <div className="flex items-center gap-2 px-4 py-2 bg-advist-bg border-b border-advist-border">
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded ${activeTool === 'select' ? 'bg-advist-dark/90 text-white' : 'hover:bg-advist-bg'}`}
              title={t('viewer.tools.select', 'Sélection')}
            >
              <Move size={16} />
            </button>
            <button
              onClick={() => setActiveTool('highlight')}
              className={`p-2 rounded ${activeTool === 'highlight' ? 'bg-advist-dark/90 text-white' : 'hover:bg-advist-bg'}`}
              title={t('viewer.tools.highlight', 'Surlignage')}
            >
              <Highlighter size={16} />
            </button>
            <button
              onClick={() => setActiveTool('comment')}
              className={`p-2 rounded ${activeTool === 'comment' ? 'bg-advist-dark/90 text-white' : 'hover:bg-advist-bg'}`}
              title={t('viewer.tools.comment', 'Commentaire')}
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded ${activeTool === 'text' ? 'bg-advist-dark/90 text-white' : 'hover:bg-advist-bg'}`}
              title={t('viewer.tools.text', 'Texte')}
            >
              <Type size={16} />
            </button>
            <button
              onClick={() => setActiveTool('stamp')}
              className={`p-2 rounded ${activeTool === 'stamp' ? 'bg-advist-dark/90 text-white' : 'hover:bg-advist-bg'}`}
              title={t('viewer.tools.stamp', 'Tampon')}
            >
              <Stamp size={16} />
            </button>
          </div>

          {/* Color picker */}
          {(activeTool === 'highlight' || activeTool === 'comment' || activeTool === 'drawing') && (
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded ${selectedColor === color ? 'ring-2 ring-advist-navy ring-offset-1' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* Stamp selector */}
          {activeTool === 'stamp' && (
            <select
              value={selectedStamp.id}
              onChange={(e) => setSelectedStamp(STAMPS.find((s) => s.id === e.target.value) || STAMPS[0])}
              className="px-3 py-1.5 bg-white border border-advist-border rounded-lg text-sm"
            >
              {STAMPS.map((stamp) => (
                <option key={stamp.id} value={stamp.id}>
                  {stamp.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('viewer.undo', 'Annuler')}
            >
              <Undo size={16} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('viewer.redo', 'Rétablir')}
            >
              <Redo size={16} />
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleSaveAnnotations}
            disabled={isSaving}
            leftIcon={
              isSaving ? <Loader2 size={14} className="animate-spin" /> :
              saveStatus === 'success' ? <CheckCircle size={14} className="text-advist-success" /> :
              saveStatus === 'error' ? <AlertCircle size={14} className="text-advist-error" /> :
              <Save size={14} />
            }
            className={
              saveStatus === 'success' ? 'bg-advist-success hover:bg-advist-success' :
              saveStatus === 'error' ? 'bg-advist-error hover:bg-advist-error' : ''
            }
          >
            {isSaving ? t('viewer.saving', 'Enregistrement...') :
             saveStatus === 'success' ? t('viewer.saved', 'Enregistré') :
             saveStatus === 'error' ? t('viewer.saveError', 'Erreur') :
             t('viewer.saveAnnotations', 'Enregistrer')}
          </Button>
        </div>
      )}

      {/* Document content */}
      <div className="flex-1 overflow-auto bg-advist-surface-dark relative">
        <div className="min-h-full flex items-center justify-center p-4">
          {renderDocument()}
        </div>
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 px-4 py-2 bg-advist-dark/90 text-white border-t border-advist-dark/70">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-1 hover:bg-advist-dark/70 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm">
            {t('viewer.page', 'Page')} {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-1 hover:bg-advist-dark/70 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
