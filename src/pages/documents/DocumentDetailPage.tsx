import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ArrowLeft,
  Download,
  Lock,
  Unlock,
  Share2,
  History,
  MessageSquare,
  PenTool,
  GitBranch,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  User,
  Settings,
  Shield,
  Link2,
  ExternalLink,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Layers,
  FileSignature,
  Send,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  MoreVertical,
  Printer,
  Activity,
  Info,
  Tag,
  MousePointer,
  Highlighter,
  StickyNote,
  Pencil,
  Square,
  Circle,
  ArrowUpRight,
  Type,
  Stamp,
  X,
  _Check,
  _Palette,
  Undo,
  _Redo,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  Languages,
} from 'lucide-react';
import { Button, Badge, StatusBadge, Avatar, Modal, Input } from '../../components/ui';
import { PrintButton } from '../../shared/PrintEngine';
import {
  WordEditor,
  ExcelEditor,
  VersionComparison,
  AIDocumentAnalysis,
  DocumentTranslator,
  ValidationWorkflowPanel,
} from '../../components/documents';
import { ValidationReport } from '../../components/workflows';
import type { ValidationReportData } from '../../components/workflows';
import { AnomalyAlert } from '../../components/anomalies';
import { anomalyDetectionService, type Anomaly } from '../../services/anomalyDetection';
import { DocumentChat } from '../../components/collaboration/DocumentChat';
import type { ChatMessage, TypingUser } from '../../hooks/useDocumentCollaboration';
import { documentsService } from '../../services';
import {
  ensureChatSession,
  getChatMessages,
  sendChatMessage,
  subscribeChatMessages,
  type ChatMessageItem,
} from '../../services/documentChat';
import {
  getLinkedDocuments,
  createDocumentLink,
  deleteDocumentLink,
  searchOrgDocuments,
  DOCUMENT_LINK_RELATIONSHIPS,
  type LinkedDocumentItem,
  type DocumentSearchHit,
  type DocumentLinkRelationship,
} from '../../services/documentLinks';
import {
  getDocumentComments,
  getDocumentVersions,
  getDocumentSignatures,
  getDocumentWorkflow,
  getValidationSummary,
  getValidationHistory,
  getFullWorkflowInstanceForDocument,
  getDocumentPreviewUrl,
  type DocumentPreview,
  type DocCommentItem,
  type DocVersionItem,
  type DocSignatureItem,
  type DocWorkflowSummary,
  type ValidationSummaryShape,
  type ValidationHistoryItem,
} from '../../services/documentDetail';
import { getDocumentAnnotations, type AnnotationItem } from '../../services/documentAnnotations';
import { validationReportService } from '../../services/validationReport';
import type { Document as DocumentType, WorkflowInstance } from '../../types';
import { useAuthStore } from '../../store';

// Document view modes
type ViewMode = 'pdf' | 'word' | 'excel';

// Types for sidebar panels
type PanelId =
  | 'ai'
  | 'translate'
  | 'info'
  | 'metadata'
  | 'owner'
  | 'validation'
  | 'workflow'
  | 'signatures'
  | 'versions'
  | 'linked'
  | 'comments'
  | 'activity'
  | 'actions';

interface SidebarPanel {
  id: PanelId;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}

// Annotation types
type AnnotationTool =
  | 'select'
  | 'highlight'
  | 'note'
  | 'draw'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'signature'
  | 'stamp';

interface Annotation {
  id: string;
  type: AnnotationTool;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  content?: string;
  points?: { x: number; y: number }[];
}

const HIGHLIGHT_COLORS = [
  { name: 'Jaune', value: '#FEF08A' },
  { name: 'Vert', value: '#BBF7D0' },
  { name: 'Rose', value: '#FBCFE8' },
  { name: 'Bleu', value: '#BFDBFE' },
  { name: 'Orange', value: '#FED7AA' },
];

const STAMP_OPTIONS = [
  { label: 'APPROUVÉ', color: '#10B981', bgColor: '#D1FAE5' },
  { label: 'REJETÉ', color: '#F59E0B', bgColor: '#FDE68A' },
  { label: 'CONFIDENTIEL', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { label: 'BROUILLON', color: '#6B7280', bgColor: '#F3F4F6' },
  { label: 'URGENT', color: '#F59E0B', bgColor: '#FEF3C7' },
  { label: 'COPIE', color: '#3B82F6', bgColor: '#DBEAFE' },
];

/**
 * Discreet "Externe" pill displayed next to people who are not members
 * of the document's owning organisation (B2B partners on a co-signed
 * contract, or guest signatories invited by email). The org name is
 * shown when available so the reader knows where the person is from.
 */
const ExternalBadge: React.FC<{
  external?: { isExternal: boolean; organizationName?: string };
  size?: 'xs' | 'sm';
}> = ({ external, size = 'xs' }) => {
  if (!external?.isExternal) return null;
  const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#B9975B]/12 text-[#8A6C34] ring-1 ring-[#B9975B]/30 font-medium ${textSize}`}
      title={external.organizationName ? `Externe — ${external.organizationName}` : 'Externe'}
    >
      <ExternalLink size={size === 'sm' ? 12 : 10} />
      Externe
      {external.organizationName && (
        <span className="opacity-70">· {external.organizationName}</span>
      )}
    </span>
  );
};

interface DocumentDetailPageProps {
  embedded?: boolean;
  onBack?: () => void;
}

export const DocumentDetailPage: React.FC<DocumentDetailPageProps> = ({
  embedded = false,
  onBack,
}) => {
  const { _t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/user';

  const { user: authUser } = useAuthStore();
  const currentUserId = authUser?.id || '';

  const [showShareModal, setShowShareModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [_showSignModal, setShowSignModal] = useState(false);
  const [showValidationReport, setShowValidationReport] = useState(false);
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  // Chat: persisted in `collaboration_chat_messages`, live via Realtime
  // postgres_changes subscription on that table (filtered by session).
  // The floating DocumentChat widget below is fed from this state.
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessagesState, setChatMessagesState] = useState<ChatMessageItem[]>([]);
  // Typing indicators are not persisted — they would need an ephemeral
  // broadcast layer. Leaving as an empty array for now; the chat widget
  // still renders fine without typing dots.
  const typingUsers: TypingUser[] = [];

  // Anomaly detection state
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId>('ai');

  // Annotation states — real fetch from `document_annotations` happens
  // in a useEffect lower in the file. Starts empty so no fake highlight
  // flashes before the real data arrives.
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedColor, setSelectedColor] = useState('#FEF08A');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(STAMP_OPTIONS[0]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const documentRef = useRef<HTMLDivElement>(null);

  // View mode state - determines which editor to show
  const [viewMode, setViewMode] = useState<ViewMode>('pdf');
  const [_isEditMode, setIsEditMode] = useState(false);

  // Real document fetched from Supabase (was: getDocumentByType mock).
  // The id from the route is a UUID; do NOT parseInt it.
  const documentId = id || '';
  const [documentLoading, setDocumentLoading] = useState(true);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [realDocument, setRealDocument] = useState<Awaited<
    ReturnType<typeof documentsService.get>
  > | null>(null);

  useEffect(() => {
    if (!documentId) {
      setDocumentLoading(false);
      setDocumentError('Document introuvable.');
      return;
    }
    let cancelled = false;
    setDocumentLoading(true);
    setDocumentError(null);
    documentsService
      .get(documentId)
      .then((d) => {
        if (cancelled) return;
        setRealDocument(d);
      })
      .catch((err) => {
        if (cancelled) return;
        setDocumentError(err instanceof Error ? err.message : 'Document introuvable.');
      })
      .finally(() => {
        if (!cancelled) setDocumentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Adapt the real Document to the rich shape the existing JSX consumes.
  // Fields without DB columns (ohada_*, signature_status counts, total_pages,
  // file_extension) are derived from metadata or sensible defaults.
  const fileExtension =
    ((realDocument?.metadata as Record<string, string> | undefined)?.file_extension as string) ||
    (realDocument?.metadata as Record<string, string> | undefined)?.['extension'] ||
    (realDocument as { file_name?: string } | null)?.file_name?.split('.').pop() ||
    'pdf';
  const document = {
    id: realDocument?.id || documentId || '1',
    title: realDocument?.title || 'Document',
    description: realDocument?.description || '',
    filename:
      (realDocument as { file_name?: string } | null)?.file_name ||
      (realDocument?.title ? `${realDocument.title}.${fileExtension}` : 'document'),
    file_extension: fileExtension,
    file_size: realDocument?.file_size || 0,
    total_pages:
      ((realDocument?.metadata as Record<string, number> | undefined)?.total_pages as number) || 1,
    owner: realDocument?.owner || { id: '', first_name: '', last_name: '', email: '' },
    current_version: realDocument?.current_version || 1,
    is_locked: realDocument?.is_locked || false,
    tags: realDocument?.tags || [],
    metadata: realDocument?.metadata || {},
    status: realDocument?.status || ('draft' as const),
    created_at: realDocument?.created_at || new Date().toISOString(),
    updated_at: realDocument?.updated_at || new Date().toISOString(),
    file_hash: realDocument?.file_hash || '',
    document_type: realDocument?.document_type
      ? {
          id: realDocument.document_type.id,
          name: realDocument.document_type.name,
          requires_signature: realDocument.document_type.requires_signature,
        }
      : { id: '', name: 'Document', requires_signature: false },
    // Derive optional UI flags from metadata, defaulting to false/empty
    ohada_compliant:
      ((realDocument?.metadata as Record<string, boolean> | undefined)
        ?.ohada_compliant as boolean) || false,
    ohada_certificate_id:
      ((realDocument?.metadata as Record<string, string> | undefined)
        ?.ohada_certificate_id as string) || '',
    requires_paraph:
      ((realDocument?.metadata as Record<string, boolean> | undefined)
        ?.requires_paraph as boolean) || false,
    paraph_pages:
      ((realDocument?.metadata as Record<string, number[]> | undefined)
        ?.paraph_pages as number[]) || [],
    signature_status: {
      required_signatures: 0,
      completed_signatures: 0,
      pending_signatures: 0,
    },
  };

  // Detect anomalies when document loads
  useEffect(() => {
    const documentData = {
      id: document?.id,
      document_date: document?.created_at,
      amount: (() => {
        const m = (document?.metadata as Record<string, unknown> | undefined)?.montant;
        if (typeof m === 'string') return parseFloat(m.replace(/[^\d]/g, ''));
        if (typeof m === 'number') return m;
        return undefined;
      })(),
      title: document?.title,
      document_type: document?.document_type?.name,
    };
    const detectedAnomalies = anomalyDetectionService.detectAnomaliesLocally(documentData);
    setAnomalies(detectedAnomalies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Determine available view modes based on file extension
  const getAvailableViewModes = (): ViewMode[] => {
    switch (document.file_extension) {
      case 'doc':
      case 'docx':
      case 'odt':
      case 'rtf':
        return ['pdf', 'word'];
      case 'xls':
      case 'xlsx':
      case 'ods':
      case 'csv':
        return ['pdf', 'excel'];
      default:
        return ['pdf'];
    }
  };

  const availableViewModes = getAvailableViewModes();
  const canEdit = availableViewModes.length > 1;

  // Real per-document side data fetched from Supabase. Linked documents
  // Linked documents: real fetch via `document_links` (migration 00035),
  // both directions merged. Loading + create/delete state for the
  // small "add a link" picker.
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedDocumentItem[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<DocumentSearchHit[]>([]);
  const [linkRelationship, setLinkRelationship] = useState<DocumentLinkRelationship>('related');

  const [signatureDetails, setSignatureDetails] = useState<DocSignatureItem[]>([]);
  const [versions, setVersions] = useState<DocVersionItem[]>([]);
  const [comments, setComments] = useState<DocCommentItem[]>([]);
  const [workflowRaw, setWorkflowRaw] = useState<DocWorkflowSummary | null>(null);
  const [validationSummaryData, setValidationSummaryData] = useState<ValidationSummaryShape | null>(
    null
  );
  const [validationHistoryData, setValidationHistoryData] = useState<ValidationHistoryItem[]>([]);
  // Lazy: fetched only when the user opens the report modal, so we don't
  // pay the cost on every detail-page mount.
  const [validationReportData, setValidationReportData] = useState<ValidationReportData | null>(
    null
  );
  const [validationReportLoading, setValidationReportLoading] = useState(false);

  // The document's owning organization is the anchor for "is this person
  // external?". An external is anyone whose profile.organization_id
  // doesn't match this — a B2B partner OR a guest signatory.
  const docOrgId =
    (realDocument?.organization as { id?: string } | undefined)?.id ||
    (realDocument as { organization_id?: string } | undefined)?.organization_id ||
    null;

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    Promise.all([
      getDocumentComments(documentId, docOrgId),
      getDocumentVersions(documentId, docOrgId),
      getDocumentSignatures(documentId, docOrgId),
      getDocumentWorkflow(documentId, docOrgId),
    ]).then(([c, v, s, w]) => {
      if (cancelled) return;
      setComments(c);
      setVersions(v);
      setSignatureDetails(s);
      setWorkflowRaw(w);
    });
    return () => {
      cancelled = true;
    };
  }, [documentId, docOrgId]);

  // Annotations: real fetch from document_annotations.
  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    getDocumentAnnotations(documentId).then((rows: AnnotationItem[]) => {
      if (cancelled) return;
      // Map AnnotationItem → UI Annotation (compatible shape).
      setAnnotations(rows as Annotation[]);
    });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Linked documents: fetch both directions from `document_links`.
  const refreshLinkedDocuments = async () => {
    if (!documentId) return;
    const links = await getLinkedDocuments(documentId);
    setLinkedDocuments(links);
  };
  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    getLinkedDocuments(documentId).then((links) => {
      if (cancelled) return;
      setLinkedDocuments(links);
    });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Search debouncing for the "Add link" picker.
  useEffect(() => {
    if (!showAddLink) return;
    const q = linkSearchQuery.trim();
    if (q.length < 2) {
      setLinkSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const hits = await searchOrgDocuments(q, documentId, 10);
      if (!cancelled) setLinkSearchResults(hits);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [linkSearchQuery, showAddLink, documentId]);

  const handleAddLink = async (targetId: string) => {
    if (!documentId || !currentUserId) return;
    const result = await createDocumentLink(
      {
        sourceDocumentId: documentId,
        targetDocumentId: targetId,
        relationship: linkRelationship,
      },
      currentUserId
    );
    if (result.ok) {
      setShowAddLink(false);
      setLinkSearchQuery('');
      setLinkSearchResults([]);
      await refreshLinkedDocuments();
    } else {
      console.warn('[documentLinks] create failed:', result.error);
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    const ok = await deleteDocumentLink(linkId);
    if (ok) await refreshLinkedDocuments();
  };

  // PDF / file preview: signed URL from Supabase Storage. The actual
  // file bytes are served by Storage via a TTL-limited URL so RLS
  // continues to apply at the bucket level.
  const [preview, setPreview] = useState<DocumentPreview>({
    url: null,
    mimeType: null,
    fileName: null,
  });
  const [previewLoading, setPreviewLoading] = useState(true);
  useEffect(() => {
    if (!documentId) {
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    getDocumentPreviewUrl(documentId)
      .then((p) => {
        if (cancelled) return;
        setPreview(p);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Inline validation panel: status / submitted-by / completion / counts
  // + history (workflow_history + comments). Re-fetches when document
  // changes or the current user identity is known (used to decide
  // can_submit).
  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    const isOwner = !!(realDocument && currentUserId && realDocument.owner?.id === currentUserId);
    Promise.all([
      getValidationSummary(documentId, { currentUserId, isOwner, currentOrgId: docOrgId }),
      getValidationHistory(documentId, 50, docOrgId),
    ]).then(([summary, history]) => {
      if (cancelled) return;
      setValidationSummaryData(summary);
      setValidationHistoryData(history);
    });
    return () => {
      cancelled = true;
    };
  }, [documentId, currentUserId, realDocument, docOrgId]);

  /**
   * Build the full ValidationReportData on demand by combining:
   *  - the real Document (`realDocument`)
   *  - a fully-hydrated WorkflowInstance fetched from Supabase
   * Routed through `validationReportService.generateReport()` so the
   * output shape matches what the ValidationReport component expects.
   */
  const ensureValidationReport = async () => {
    if (!documentId || !realDocument || validationReportLoading) return;
    if (validationReportData) return;
    setValidationReportLoading(true);
    try {
      const fullInstance = (await getFullWorkflowInstanceForDocument(
        documentId
      )) as WorkflowInstance | null;
      if (!fullInstance) {
        setValidationReportData(null);
        return;
      }
      const report = await validationReportService.generateReport({
        workflowInstance: fullInstance,
        document: realDocument as DocumentType,
      });
      setValidationReportData(report);
    } catch (err) {
      console.warn('[DocumentDetail] validation report generation failed:', err);
      setValidationReportData(null);
    } finally {
      setValidationReportLoading(false);
    }
  };

  // Trigger the lazy fetch when the modal opens.
  useEffect(() => {
    if (showValidationReport && !validationReportData && !validationReportLoading) {
      ensureValidationReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showValidationReport]);

  // Chat: ensure a collaboration session exists for this document, then
  // load history and subscribe to live INSERTs. Cancellation is async-
  // safe: we keep the unsubscribe handle even if the doc id changes
  // mid-flight.
  useEffect(() => {
    if (!documentId) {
      setChatSessionId(null);
      setChatMessagesState([]);
      return;
    }
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const sessionId = await ensureChatSession(documentId);
      if (cancelled || !sessionId) return;
      setChatSessionId(sessionId);
      const history = await getChatMessages(sessionId, docOrgId);
      if (cancelled) return;
      setChatMessagesState(history);
      unsubscribe = subscribeChatMessages(sessionId, docOrgId, (m) => {
        // Dedupe: the sender's INSERT also fires the subscription, but
        // sendChatMessage already pushes the optimistic copy. Replace
        // by id if it already exists.
        setChatMessagesState((prev) => {
          const exists = prev.some((x) => x.id === m.id);
          return exists ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
        });
      });
    })();
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [documentId, docOrgId]);

  // Empty fallback workflow shape so the rich JSX below (which doesn't
  // null-check) keeps rendering an empty steps list instead of crashing
  // when the document has no workflow instance attached.
  const workflow: DocWorkflowSummary = workflowRaw ?? {
    template: '—',
    status: 'pending',
    current_step: 0,
    steps: [],
  };

  const activities = [
    { action: 'Version uploadée', user: 'Marie D.', time: '2h', icon: <Layers size={14} /> },
    {
      action: 'Commentaire ajouté',
      user: 'Pierre M.',
      time: '1j',
      icon: <MessageSquare size={14} />,
    },
    { action: 'Workflow démarré', user: 'Marie D.', time: '2j', icon: <GitBranch size={14} /> },
    { action: 'Document créé', user: 'Marie D.', time: '7j', icon: <FileText size={14} /> },
  ];

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Chat handlers — wired to the real `collaboration_chat_messages`
  // table via documentChat service. Optimistic update on send: push the
  // returned row immediately, the subscription dedup will reconcile.
  const handleSendMessage = async (content: string, replyTo?: string, pageReference?: number) => {
    if (!chatSessionId || !currentUserId || !content.trim()) return;
    const sent = await sendChatMessage(chatSessionId, currentUserId, content, {
      pageReference,
      replyTo,
    });
    if (sent) {
      setChatMessagesState((prev) => {
        const exists = prev.some((x) => x.id === sent.id);
        return exists ? prev : [...prev, sent];
      });
    }
  };
  // Typing indicators stay no-op until we add a broadcast layer for
  // ephemeral signals. Stubbed so the widget prop stays stable.
  const handleStartTyping = () => {
    /* noop */
  };
  const handleStopTyping = () => {
    /* noop */
  };
  void typingUsers;

  // Annotation tools configuration
  const annotationTools = [
    { id: 'select' as AnnotationTool, icon: <MousePointer size={18} />, label: 'Sélection' },
    { id: 'highlight' as AnnotationTool, icon: <Highlighter size={18} />, label: 'Surlignage' },
    { id: 'note' as AnnotationTool, icon: <StickyNote size={18} />, label: 'Note' },
    { id: 'draw' as AnnotationTool, icon: <Pencil size={18} />, label: 'Dessin libre' },
    { id: 'rectangle' as AnnotationTool, icon: <Square size={18} />, label: 'Rectangle' },
    { id: 'circle' as AnnotationTool, icon: <Circle size={18} />, label: 'Cercle' },
    { id: 'arrow' as AnnotationTool, icon: <ArrowUpRight size={18} />, label: 'Flèche' },
    { id: 'text' as AnnotationTool, icon: <Type size={18} />, label: 'Texte' },
    { id: 'signature' as AnnotationTool, icon: <PenTool size={18} />, label: 'Signature' },
    { id: 'stamp' as AnnotationTool, icon: <Stamp size={18} />, label: 'Tampon' },
  ];

  // Handle document click for adding annotations
  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') return;

    const rect = documentRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: activeTool,
      page: currentPage,
      x,
      y,
      color: activeTool === 'stamp' ? selectedStamp.color : selectedColor,
      content: activeTool === 'stamp' ? selectedStamp.label : undefined,
    };

    if (activeTool === 'highlight') {
      newAnnotation.width = 30;
      newAnnotation.height = 3;
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      newAnnotation.width = 15;
      newAnnotation.height = 10;
    }

    setAnnotations([...annotations, newAnnotation]);
  };

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'draw') return;
    setIsDrawing(true);
    const rect = documentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const rect = documentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentPath([...currentPath, { x, y }]);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'draw',
        page: currentPage,
        x: currentPath[0].x,
        y: currentPath[0].y,
        color: selectedColor,
        points: currentPath,
      };
      setAnnotations([...annotations, newAnnotation]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  // Delete annotation
  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  // Sidebar panels configuration
  const panels: SidebarPanel[] = [
    {
      id: 'ai',
      icon: <Sparkles size={20} />,
      label: 'Analyse IA',
      badge: (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-dark rounded-full animate-pulse" />
      ),
    },
    {
      id: 'translate',
      icon: <Languages size={20} />,
      label: 'Traduction',
      badge: <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-dark rounded-full" />,
    },
    { id: 'info', icon: <Info size={20} />, label: 'Informations' },
    { id: 'metadata', icon: <Tag size={20} />, label: 'Métadonnées' },
    { id: 'owner', icon: <User size={20} />, label: 'Propriétaire' },
    {
      id: 'validation',
      icon: <CheckCircle size={20} />,
      label: 'Validation',
      badge: <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-gold rounded-full" />,
    },
    {
      id: 'workflow',
      icon: <GitBranch size={20} />,
      label: 'Workflow',
      badge: <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-dark rounded-full" />,
    },
    {
      id: 'signatures',
      icon: <PenTool size={20} />,
      label: 'Signatures',
      badge:
        document.signature_status.pending_signatures > 0 ? (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-advist-gold text-advist-gray900 text-[10px] flex items-center justify-center rounded-full">
            {document.signature_status.pending_signatures}
          </span>
        ) : undefined,
    },
    { id: 'versions', icon: <History size={20} />, label: 'Versions' },
    { id: 'linked', icon: <Link2 size={20} />, label: 'Documents liés' },
    {
      id: 'comments',
      icon: <MessageSquare size={20} />,
      label: 'Commentaires',
      badge:
        comments.length > 0 ? (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-advist-text-secondary text-white text-[10px] flex items-center justify-center rounded-full">
            {comments.length}
          </span>
        ) : undefined,
    },
    { id: 'activity', icon: <Activity size={20} />, label: 'Activité' },
    { id: 'actions', icon: <Settings size={20} />, label: 'Actions' },
  ];

  // Render panel content based on active panel
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'ai':
        return (
          <div className="p-4">
            <AIDocumentAnalysis
              documentId={document.id?.toString() || '1'}
              documentType={document.document_type?.name}
              documentTitle={document.title}
            />
          </div>
        );

      case 'translate':
        return (
          <div className="p-4">
            <DocumentTranslator
              documentId={document.id?.toString() || '1'}
              documentTitle={document.title}
              documentContent="Ce contrat porte sur la location de bureaux de 200m² situés à Abidjan Plateau. Le loyer mensuel est fixé à 500 000 FCFA avec une caution de 3 mois."
              documentSummary={document.description}
              annotations={annotations
                .filter((a) => a.content)
                .map((a) => ({ id: a.id, content: a.content || '' }))}
            />
          </div>
        );

      case 'info':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-advist-gray900 text-lg">Informations</h3>

            {/* Anomaly Alerts */}
            {anomalies.length > 0 && (
              <AnomalyAlert
                anomalies={anomalies}
                compact
                onResolve={(id) => setAnomalies((prev) => prev.filter((a) => a.id !== id))}
                onDismiss={(id) => setAnomalies((prev) => prev.filter((a) => a.id !== id))}
              />
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Type</span>
                <span className="text-sm font-medium text-advist-gray900">
                  {document.document_type.name}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Taille</span>
                <span className="text-sm font-medium text-advist-gray900">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Version</span>
                <span className="text-sm font-medium text-advist-gray900">
                  v{document.current_version}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Pages</span>
                <span className="text-sm font-medium text-advist-gray900">
                  {document.total_pages}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Créé le</span>
                <span className="text-sm font-medium text-advist-gray900">20 Nov 2024</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Modifié le</span>
                <span className="text-sm font-medium text-advist-gray900">27 Nov 2024</span>
              </div>
              <div className="pt-2">
                <span className="text-sm text-advist-blue-light">Tags</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {document.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" size="sm">
                      <span
                        className="w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'metadata':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-advist-gray900 text-lg">Métadonnées</h3>
            <div className="space-y-3">
              {Object.entries(document.metadata).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center py-2 border-b border-[#F0F0EB]"
                >
                  <span className="text-sm text-advist-blue-light capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-advist-gray900">{String(value)}</span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              leftIcon={<Edit size={14} />}
            >
              Modifier les métadonnées
            </Button>
          </div>
        );

      case 'owner':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-advist-gray900 text-lg">Propriétaire</h3>
            <div className="flex items-center gap-4 p-4 bg-[#F9F9F7] rounded-xl">
              <Avatar name={`${document.owner.first_name} ${document.owner.last_name}`} size="lg" />
              <div>
                <p className="font-semibold text-advist-gray900 text-lg">
                  {document.owner.first_name} {document.owner.last_name}
                </p>
                <p className="text-sm text-advist-blue-light">{document.owner.email}</p>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" leftIcon={<User size={14} />}>
                Transférer la propriété
              </Button>
            </div>
          </div>
        );

      case 'validation': {
        // Real summary + history come from getValidationSummary /
        // getValidationHistory (state set by useEffect on documentId).
        // Until the first fetch resolves we render a tiny loading state
        // rather than show fake "Sophie Bernard / Pierre Martin" rows.
        const isOwnerDoc = !!(
          realDocument &&
          currentUserId &&
          realDocument.owner?.id === currentUserId
        );
        if (!validationSummaryData) {
          return (
            <div className="p-4 text-sm text-advist-blue-light">Chargement de la validation…</div>
          );
        }
        // The presentational panel doesn't know about external users —
        // append a textual "· Externe (Org)" suffix to people names so
        // the information surfaces inside the existing UI without
        // forking the component.
        const decorateName = (
          name: string,
          ext?: { isExternal?: boolean; organizationName?: string }
        ) => {
          if (!ext?.isExternal) return name;
          return ext.organizationName
            ? `${name} · Externe (${ext.organizationName})`
            : `${name} · Externe`;
        };
        const decoratedSummary = {
          ...validationSummaryData,
          submitted_by: validationSummaryData.submitted_by
            ? {
                ...validationSummaryData.submitted_by,
                name: decorateName(
                  validationSummaryData.submitted_by.name,
                  validationSummaryData.submitted_by_external
                ),
              }
            : null,
          completed_by: validationSummaryData.completed_by
            ? {
                ...validationSummaryData.completed_by,
                name: decorateName(
                  validationSummaryData.completed_by.name,
                  validationSummaryData.completed_by_external
                ),
              }
            : null,
        };
        const decoratedHistory = validationHistoryData.map((h) => ({
          ...h,
          user: h.user ? { ...h.user, name: decorateName(h.user.name, h.userExternal) } : null,
        }));
        return (
          <div className="p-4">
            <ValidationWorkflowPanel
              documentId={String(document.id)}
              validationSummary={decoratedSummary as never}
              validationHistory={decoratedHistory as never}
              currentUserId={currentUserId}
              isOwner={isOwnerDoc}
              canReview={validationSummaryData.can_validate}
              onSubmitForReview={async (notes) => {
                // TODO: wire to a workflow-launching RPC. For now, just
                // surface the intent so users see something happens.
                console.info('[validation] submit for review:', notes);
              }}
              onStartReview={async () => {
                console.info('[validation] start review');
              }}
              onRequestChanges={async (commentsText) => {
                console.info('[validation] request changes:', commentsText);
              }}
              onValidate={async (commentsText) => {
                console.info('[validation] validate:', commentsText);
              }}
              onReject={async (reason) => {
                console.info('[validation] reject:', reason);
              }}
            />
          </div>
        );
      }

      case 'workflow':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-advist-gray900 text-lg">Workflow</h3>
              <Badge variant="info" size="sm">
                En cours
              </Badge>
            </div>
            <p className="text-sm text-[#585858] bg-[#F9F9F7] p-3 rounded-xl">
              {workflow.template}
            </p>

            {/* Progress indicator */}
            <div className="flex items-center gap-1">
              {workflow.steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className={`flex-1 h-1.5 rounded-full ${
                      step.status === 'completed'
                        ? 'bg-advist-success'
                        : step.status === 'in_progress'
                          ? 'bg-advist-dark'
                          : 'bg-advist-border'
                    }`}
                  />
                </React.Fragment>
              ))}
            </div>

            <div className="space-y-3 mt-4">
              {workflow.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-240 ${
                    step.status === 'in_progress'
                      ? 'bg-advist-gold-light border border-advist-gold'
                      : step.status === 'completed'
                        ? 'bg-green-50/50'
                        : 'bg-[#F9F9F7]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.status === 'completed'
                        ? 'bg-advist-success text-white'
                        : step.status === 'in_progress'
                          ? 'bg-advist-dark text-white'
                          : 'bg-advist-border text-advist-text-secondary'
                    }`}
                  >
                    {step.status === 'completed' ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium ${
                          step.status === 'in_progress'
                            ? 'text-advist-gray900'
                            : step.status === 'completed'
                              ? 'text-advist-success'
                              : 'text-advist-gray900'
                        }`}
                      >
                        {step.name}
                      </p>
                      {step.status === 'in_progress' && step.deadline && (
                        <Badge variant="warning" size="sm">
                          {step.deadline}
                        </Badge>
                      )}
                      {step.status === 'completed' && step.date && (
                        <span className="text-xs text-advist-success">{step.date}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-sm text-advist-blue-light">{step.assignee}</p>
                      <ExternalBadge external={step.assigneeExternal} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Report Button */}
            <div className="pt-4 mt-4 border-t border-advist-bg">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<FileText size={14} />}
                onClick={() => setShowValidationReport(true)}
              >
                Voir le rapport de validation
              </Button>
              <p className="text-xs text-advist-blue-light text-center mt-2">
                {validationReportData
                  ? `${validationReportData.steps.filter((s) => s.status === 'approved').length} / ${validationReportData.steps.length} étapes validées`
                  : workflowRaw
                    ? '—'
                    : 'Aucun workflow attaché'}
              </p>
            </div>
          </div>
        );

      case 'signatures':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-advist-gray900 text-lg">Signatures</h3>
              <Badge
                variant={document.signature_status.pending_signatures > 0 ? 'warning' : 'success'}
                size="sm"
              >
                {document.signature_status.completed_signatures}/
                {document.signature_status.required_signatures}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <div className="h-3 bg-[#E0E0D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                  style={{
                    width: `${(document.signature_status.completed_signatures / document.signature_status.required_signatures) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-advist-blue-light mt-1 text-center">
                {document.signature_status.completed_signatures} sur{' '}
                {document.signature_status.required_signatures} signatures
              </p>
            </div>

            {/* Signers list */}
            <div className="space-y-3 mt-4">
              {signatureDetails.map((sig) => (
                <div
                  key={sig.id}
                  className={`p-4 rounded-xl border ${
                    sig.status === 'completed'
                      ? 'bg-green-50 border-advist-success'
                      : 'bg-advist-gold-light border-advist-gold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={`${sig.signer.first_name} ${sig.signer.last_name}`} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-advist-gray900">
                          {sig.signer.first_name} {sig.signer.last_name}
                        </p>
                        <ExternalBadge external={sig.signerExternal} />
                      </div>
                      <p className="text-xs text-advist-blue-light">
                        {sig.signerExternal?.jobTitle && `${sig.signerExternal.jobTitle} · `}
                        {sig.status === 'completed'
                          ? `Signé le ${sig.signed_at?.split('T')[0]}`
                          : `Échéance: ${sig.deadline?.split('T')[0]}`}
                      </p>
                    </div>
                    {sig.status === 'completed' ? (
                      <div className="w-8 h-8 bg-advist-success rounded-full flex items-center justify-center">
                        <CheckCircle size={18} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-advist-gold rounded-full flex items-center justify-center">
                        <Clock size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {document.requires_paraph && (
              <div className="p-3 bg-advist-gold-light border border-advist-gold rounded-xl mt-4">
                <div className="flex items-center gap-2 text-advist-gold-dark">
                  <FileSignature size={16} />
                  <span className="text-sm font-medium">Paraphe requis</span>
                </div>
                <p className="text-xs text-advist-gold-dark mt-1">
                  Pages: {document.paraph_pages?.join(', ')}
                </p>
              </div>
            )}

            {document.signature_status.pending_signatures > 0 && (
              <Button
                className="w-full mt-4"
                leftIcon={<PenTool size={16} />}
                onClick={() => setShowSignModal(true)}
              >
                Signer maintenant
              </Button>
            )}
          </div>
        );

      case 'versions':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-advist-gray900 text-lg">Versions</h3>
              <Badge variant="gray" size="sm">
                v{document.current_version}
              </Badge>
            </div>

            {/* Compare Versions Button */}
            {versions.length > 1 && (
              <button
                onClick={() => setShowVersionComparison(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-advist-navy to-primary-800 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <GitBranch size={18} />
                <span className="font-medium">Comparer les versions</span>
              </button>
            )}

            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    v.version === document.current_version
                      ? 'bg-advist-gold-light border-advist-gold'
                      : 'bg-white border-[#E0E0D8] hover:border-advist-blue-light'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-advist-gray900">
                        v{v.version}
                      </span>
                      {v.version === document.current_version && (
                        <Badge variant="info" size="sm">
                          Actuelle
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-[#585858] mb-1">{v.comment}</p>
                  <p className="text-xs text-advist-blue-light">
                    {v.by} • {v.date}
                  </p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full" leftIcon={<Layers size={14} />}>
              Uploader une nouvelle version
            </Button>
          </div>
        );

      case 'linked':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-advist-gray900 text-lg">Documents liés</h3>
              <Badge variant="gray" size="sm">
                {linkedDocuments.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {linkedDocuments.length === 0 && !showAddLink && (
                <p className="text-sm text-advist-blue-light text-center py-6">
                  Aucun document lié pour l'instant.
                </p>
              )}
              {linkedDocuments.map((doc) => (
                <div
                  key={doc.linkId}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-[#E0E0D8] hover:border-advist-blue-light transition-all"
                >
                  <Link
                    to={`${basePath}/documents/${doc.documentId}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 bg-advist-bg rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-advist-blue-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-advist-gray900 truncate">{doc.title}</p>
                      <p className="text-xs text-advist-blue-light capitalize">
                        {doc.direction === 'incoming' ? '← ' : '→ '}
                        {DOCUMENT_LINK_RELATIONSHIPS.find((r) => r.value === doc.relationship)
                          ?.label || doc.relationship}
                      </p>
                    </div>
                    <StatusBadge status={doc.status as never} />
                  </Link>
                  {doc.direction === 'outgoing' && (
                    <button
                      onClick={() => handleRemoveLink(doc.linkId)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-advist-error/10 rounded-lg transition-all"
                      title="Supprimer le lien"
                    >
                      <X size={14} className="text-advist-error" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {showAddLink ? (
              <div className="space-y-3 p-3 border border-advist-gold rounded-xl bg-advist-gold-light/30">
                <div>
                  <label className="block text-xs font-medium text-advist-gray900 mb-1">
                    Relation
                  </label>
                  <select
                    value={linkRelationship}
                    onChange={(e) =>
                      setLinkRelationship(e.target.value as DocumentLinkRelationship)
                    }
                    className="w-full px-3 py-2 text-sm border border-[#E0E0D8] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  >
                    {DOCUMENT_LINK_RELATIONSHIPS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-advist-gray900 mb-1">
                    Rechercher un document
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    placeholder="Titre du document…"
                    className="w-full px-3 py-2 text-sm border border-[#E0E0D8] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  />
                </div>
                {linkSearchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {linkSearchResults.map((hit) => (
                      <button
                        key={hit.id}
                        onClick={() => handleAddLink(hit.id)}
                        className="w-full flex items-center gap-2 p-2 text-left rounded-lg hover:bg-white transition-colors"
                      >
                        <FileText size={14} className="text-advist-blue-light flex-shrink-0" />
                        <span className="text-sm text-advist-gray900 truncate flex-1">
                          {hit.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {linkSearchQuery.length >= 2 && linkSearchResults.length === 0 && (
                  <p className="text-xs text-advist-blue-light">Aucun résultat.</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowAddLink(false);
                      setLinkSearchQuery('');
                      setLinkSearchResults([]);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<Link2 size={14} />}
                onClick={() => setShowAddLink(true)}
              >
                Ajouter un lien
              </Button>
            )}
          </div>
        );

      case 'comments':
        return (
          <div className="p-4 space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-advist-gray900 text-lg">Commentaires</h3>
              <Badge variant="gray" size="sm">
                {comments.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="p-4 bg-[#F9F9F7] rounded-xl">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar name={c.author} size="sm" />
                      <span className="text-sm font-medium text-advist-gray900">{c.author}</span>
                      <ExternalBadge external={c.authorExternal} />
                    </div>
                    <span className="text-xs text-advist-blue-light whitespace-nowrap">
                      {c.date}
                    </span>
                  </div>
                  <p className="text-sm text-[#585858] pl-8">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#E0E0D8]">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 px-4 py-3 text-sm border border-[#E0E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-advist-gold focus:border-transparent"
              />
              <Button size="sm" disabled={!newComment.trim()} className="px-4">
                <Send size={16} />
              </Button>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-advist-gray900 text-lg">Activité</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E0E0D8]" />

              <div className="space-y-4">
                {activities.map((a, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative">
                    <div className="w-8 h-8 bg-white border-2 border-[#E0E0D8] rounded-full flex items-center justify-center z-10">
                      <span className="text-advist-blue-light">{a.icon}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium text-advist-gray900">{a.action}</p>
                      <p className="text-xs text-advist-blue-light">
                        {a.user} • Il y a {a.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full">
              Voir tout l'historique
            </Button>
          </div>
        );

      case 'actions':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-advist-gray900 text-lg">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                leftIcon={<Download size={16} />}
              >
                Télécharger
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                leftIcon={<Share2 size={16} />}
                onClick={() => setShowShareModal(true)}
              >
                Partager
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                leftIcon={<Printer size={16} />}
                onClick={() => window.print()}
              >
                Imprimer
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                leftIcon={<Edit size={16} />}
              >
                Modifier les métadonnées
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                leftIcon={<GitBranch size={16} />}
                onClick={() => setShowWorkflowModal(true)}
              >
                Lancer un workflow
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                leftIcon={document.is_locked ? <Unlock size={16} /> : <Lock size={16} />}
              >
                {document.is_locked ? 'Déverrouiller' : 'Verrouiller'}
              </Button>
              <div className="pt-2 border-t border-[#E0E0D8]">
                <Button
                  variant="outline"
                  className="w-full justify-start text-advist-error hover:bg-advist-gold-light border-advist-gold"
                  size="sm"
                  leftIcon={<Trash2 size={16} />}
                >
                  Supprimer le document
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render annotations on the document
  const renderAnnotations = () => {
    if (!showAnnotations) return null;

    return annotations
      .filter((a) => a.page === currentPage)
      .map((annotation) => {
        switch (annotation.type) {
          case 'highlight':
            return (
              <div
                key={annotation.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  width: `${annotation.width}%`,
                  height: `${annotation.height}%`,
                  backgroundColor: annotation.color,
                  opacity: 0.5,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAnnotation(annotation.id);
                }}
              >
                <button className="absolute -top-2 -right-2 w-4 h-4 bg-advist-error text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            );

          case 'note':
            return (
              <div
                key={annotation.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="w-8 h-8 rounded-xl shadow-lg flex items-center justify-center relative"
                  style={{ backgroundColor: annotation.color }}
                >
                  <StickyNote size={16} className="text-advist-gold-dark" />
                  <button
                    className="absolute -top-2 -right-2 w-4 h-4 bg-advist-error text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    onClick={() => deleteAnnotation(annotation.id)}
                  >
                    <X size={10} />
                  </button>
                </div>
                <div className="absolute left-10 top-0 bg-white border border-advist-border rounded-xl p-2 shadow-lg min-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <p className="text-xs text-advist-gray900">{annotation.content || 'Note vide'}</p>
                </div>
              </div>
            );

          case 'stamp':
            return (
              <div
                key={annotation.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="px-4 py-2 border-4 rounded-xl font-bold text-lg transform -rotate-12 relative"
                  style={{
                    borderColor: annotation.color,
                    color: annotation.color,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {annotation.content}
                  <button
                    className="absolute -top-3 -right-3 w-5 h-5 bg-advist-error text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    onClick={() => deleteAnnotation(annotation.id)}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );

          case 'rectangle':
            return (
              <div
                key={annotation.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  width: `${annotation.width}%`,
                  height: `${annotation.height}%`,
                  border: `3px solid ${annotation.color}`,
                  backgroundColor: 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAnnotation(annotation.id);
                }}
              >
                <button className="absolute -top-2 -right-2 w-4 h-4 bg-advist-error text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            );

          case 'circle':
            return (
              <div
                key={annotation.id}
                className="absolute cursor-pointer group rounded-full"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  width: `${annotation.width}%`,
                  height: `${annotation.height}%`,
                  border: `3px solid ${annotation.color}`,
                  backgroundColor: 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAnnotation(annotation.id);
                }}
              >
                <button className="absolute -top-2 -right-2 w-4 h-4 bg-advist-error text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            );

          case 'draw': {
            if (!annotation.points || annotation.points.length < 2) return null;
            const pathD = annotation.points.reduce((acc, point, idx) => {
              return acc + (idx === 0 ? `M ${point.x}% ${point.y}%` : ` L ${point.x}% ${point.y}%`);
            }, '');
            return (
              <svg
                key={annotation.id}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <path
                  d={pathD}
                  stroke={annotation.color}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          }

          default:
            return null;
        }
      });
  };

  if (documentLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] text-sm text-advist-blue-light">
        Chargement du document…
      </div>
    );
  }
  if (documentError || !realDocument) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-3 text-center">
        <FileText size={40} className="text-advist-gray900/30" />
        <h2 className="text-lg font-medium text-advist-gray900">Document introuvable</h2>
        <p className="text-sm text-advist-blue-light max-w-md">
          {documentError ||
            'Ce document n’existe pas ou vous n’avez pas les droits pour le consulter.'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col print:h-auto print:block">
      {/* Top Bar */}
      {!embedded && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E0E0D8] print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (onBack ? onBack() : navigate(-1))}
              className="p-2 hover:bg-advist-bg rounded-xl transition-all duration-240"
            >
              <ArrowLeft size={20} className="text-advist-gray900" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-advist-gray900">{document.title}</h1>
                <StatusBadge status={document.status} />
                {document.is_locked && <Lock size={14} className="text-advist-gold" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-advist-blue-light">
                <span>v{document.current_version}</span>
                <span>•</span>
                <span>{formatFileSize(document.file_size)}</span>
                <span>•</span>
                <span>{document.total_pages} pages</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            {canEdit && (
              <>
                <div className="flex items-center bg-advist-bg rounded-xl p-1">
                  <button
                    onClick={() => {
                      setViewMode('pdf');
                      setIsEditMode(false);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      viewMode === 'pdf'
                        ? 'bg-white shadow text-advist-gray900 font-medium'
                        : 'text-advist-blue-light hover:text-advist-gray900'
                    }`}
                  >
                    Aperçu
                  </button>
                  {availableViewModes.includes('word') && (
                    <button
                      onClick={() => {
                        setViewMode('word');
                        setIsEditMode(true);
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1 ${
                        viewMode === 'word'
                          ? 'bg-advist-dark text-white shadow font-medium'
                          : 'text-advist-blue-light hover:text-advist-gray900'
                      }`}
                    >
                      <Edit size={14} />
                      Word
                    </button>
                  )}
                  {availableViewModes.includes('excel') && (
                    <button
                      onClick={() => {
                        setViewMode('excel');
                        setIsEditMode(true);
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1 ${
                        viewMode === 'excel'
                          ? 'bg-advist-success text-white shadow font-medium'
                          : 'text-advist-blue-light hover:text-advist-gray900'
                      }`}
                    >
                      <Edit size={14} />
                      Excel
                    </button>
                  )}
                </div>
                <div className="w-px h-6 bg-advist-surface-dark" />
              </>
            )}

            <Button variant="ghost" size="sm" onClick={() => setIsBookmarked(!isBookmarked)}>
              {isBookmarked ? (
                <BookmarkCheck size={18} className="text-advist-gold" />
              ) : (
                <Bookmark size={18} />
              )}
            </Button>
            <PrintButton
              config={{ title: 'Détail du document', appName: 'Advist' }}
              className="p-2 hover:bg-advist-bg rounded-xl transition-all duration-240 text-advist-blue-light hover:text-advist-gray900"
            >
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                  {document.title}
                </h1>
                <p>
                  Version : v{document.current_version} — {document.total_pages} pages —{' '}
                  {formatFileSize(document.file_size)}
                </p>
                <p>Statut : {document.status}</p>
                <p>Type : {document.document_type?.name}</p>
                {document.ohada_compliant && (
                  <p>Conforme OHADA — Certificat : {document.ohada_certificate_id}</p>
                )}
              </div>
            </PrintButton>
            <Button variant="outline" size="sm" leftIcon={<Download size={16} />}>
              Télécharger
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 size={16} />}
              onClick={() => setShowShareModal(true)}
            >
              Partager
            </Button>
            {document.signature_status?.pending_signatures > 0 && (
              <Button
                size="sm"
                leftIcon={<PenTool size={16} />}
                onClick={() => setShowSignModal(true)}
              >
                Signer
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* OHADA Banner */}
      {document.ohada_compliant && (
        <div className="flex items-center justify-between px-4 py-2 bg-green-50 border-b border-advist-success print:hidden">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-advist-success" />
            <span className="text-sm font-medium text-advist-success">Document conforme OHADA</span>
            <Badge variant="success" size="sm">
              Certifié
            </Badge>
          </div>
          <span className="text-xs text-advist-success">{document.ohada_certificate_id}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Word Editor Mode */}
        {viewMode === 'word' && (
          <>
            <div className="flex-1">
              <WordEditor
                onSave={(content) => {
                  console.info('Saving Word document:', content);
                  // Here you would save the document
                }}
              />
            </div>
            {/* Sidebar for Word mode */}
            {!sidebarCollapsed && (
              <>
                <div className="w-16 bg-[#F9F9F7] border-l border-[#E0E0D8] flex flex-col py-2">
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      onClick={() => setActivePanel(panel.id)}
                      className={`relative mx-2 my-1 p-3 rounded-xl transition-all group ${
                        activePanel === panel.id
                          ? 'bg-advist-dark text-white shadow-lg'
                          : 'hover:bg-[#E0E0D8] text-advist-blue-light hover:text-advist-gray900'
                      }`}
                      title={panel.label}
                    >
                      {panel.icon}
                      {panel.badge}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-advist-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {panel.label}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="w-[450px] bg-white border-l border-[#E0E0D8] overflow-y-auto">
                  {renderPanelContent()}
                </div>
              </>
            )}
          </>
        )}

        {/* Excel Editor Mode */}
        {viewMode === 'excel' && (
          <>
            <div className="flex-1">
              <ExcelEditor
                onSave={(data) => {
                  console.info('Saving Excel document:', data);
                  // Here you would save the document
                }}
              />
            </div>
            {/* Sidebar for Excel mode */}
            {!sidebarCollapsed && (
              <>
                <div className="w-16 bg-[#F9F9F7] border-l border-[#E0E0D8] flex flex-col py-2">
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      onClick={() => setActivePanel(panel.id)}
                      className={`relative mx-2 my-1 p-3 rounded-xl transition-all group ${
                        activePanel === panel.id
                          ? 'bg-advist-dark text-white shadow-lg'
                          : 'hover:bg-[#E0E0D8] text-advist-blue-light hover:text-advist-gray900'
                      }`}
                      title={panel.label}
                    >
                      {panel.icon}
                      {panel.badge}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-advist-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {panel.label}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="w-[450px] bg-white border-l border-[#E0E0D8] overflow-y-auto">
                  {renderPanelContent()}
                </div>
              </>
            )}
          </>
        )}

        {/* PDF Viewer Mode (default) */}
        {viewMode === 'pdf' && (
          <>
            {/* Left Annotation Toolbar */}
            <div className="w-14 bg-[#2D2D2D] flex flex-col items-center py-3 gap-1 print:hidden">
              {annotationTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    if (tool.id === 'stamp') setShowStampPicker(true);
                  }}
                  className={`relative p-2.5 rounded-xl transition-all group ${
                    activeTool === tool.id
                      ? 'bg-advist-dark text-white'
                      : 'text-advist-text-muted hover:bg-[#3D3D3D] hover:text-white'
                  }`}
                  title={tool.label}
                >
                  {tool.icon}
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-advist-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    {tool.label}
                  </div>
                </button>
              ))}

              <div className="w-8 h-px bg-advist-surface-dark my-2" />

              {/* Color Picker Button */}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2.5 rounded-xl text-advist-text-muted hover:bg-[#3D3D3D] hover:text-white transition-all"
                  title="Couleur"
                >
                  <div
                    className="w-5 h-5 rounded border-2 border-white"
                    style={{ backgroundColor: selectedColor }}
                  />
                </button>

                {/* Color Picker Dropdown */}
                {showColorPicker && (
                  <div className="absolute left-full ml-2 bg-white rounded-xl shadow-xl p-2 z-30">
                    <div className="flex gap-1">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            setSelectedColor(color.value);
                            setShowColorPicker(false);
                          }}
                          className={`w-8 h-8 rounded-xl border-2 transition-transform hover:scale-110 ${
                            selectedColor === color.value
                              ? 'border-primary-800'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Show/Hide Annotations */}
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`p-2.5 rounded-xl transition-all ${
                  showAnnotations
                    ? 'text-advist-text-muted hover:bg-[#3D3D3D] hover:text-white'
                    : 'text-advist-error bg-advist-dark/30'
                }`}
                title={showAnnotations ? 'Masquer annotations' : 'Afficher annotations'}
              >
                {showAnnotations ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>

              <div className="flex-1" />

              {/* Undo/Redo */}
              <button
                onClick={() => {
                  if (annotations.length > 0) {
                    setAnnotations(annotations.slice(0, -1));
                  }
                }}
                className="p-2.5 rounded-xl text-advist-text-muted hover:bg-[#3D3D3D] hover:text-white transition-all"
                title="Annuler"
              >
                <Undo size={18} />
              </button>

              {/* Save Annotations */}
              <button
                className="p-2.5 rounded-xl text-advist-text-muted hover:bg-[#3D3D3D] hover:text-white transition-all"
                title="Sauvegarder les annotations"
              >
                <Save size={18} />
              </button>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 flex flex-col bg-[#525659] relative print:bg-white">
              {/* Viewer Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#3A3D40] border-b border-[#2a2d30] print:hidden">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                  <span className="text-sm text-white px-2">
                    Page {currentPage} / {document.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(document.total_pages, currentPage + 1))}
                    disabled={currentPage === document.total_pages}
                    className="p-1.5 hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                </div>

                {/* Active tool indicator */}
                {activeTool !== 'select' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-advist-dark/20 rounded-xl">
                    <span className="text-advist-text-secondary">
                      {annotationTools.find((t) => t.id === activeTool)?.icon}
                    </span>
                    <span className="text-sm text-advist-text-secondary">
                      {annotationTools.find((t) => t.id === activeTool)?.label}
                    </span>
                    <button
                      onClick={() => setActiveTool('select')}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <X size={14} className="text-advist-text-secondary" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    className="p-1.5 hover:bg-white/10 rounded"
                  >
                    <ZoomOut size={18} className="text-white" />
                  </button>
                  <span className="text-sm text-white w-12 text-center">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    className="p-1.5 hover:bg-white/10 rounded"
                  >
                    <ZoomIn size={18} className="text-white" />
                  </button>
                  <div className="w-px h-5 bg-white/20 mx-2" />
                  <button className="p-1.5 hover:bg-white/10 rounded">
                    <RotateCw size={18} className="text-white" />
                  </button>
                  <button className="p-1.5 hover:bg-white/10 rounded">
                    <Maximize2 size={18} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Document Display */}
              <div className="flex-1 overflow-auto p-8 flex items-start justify-center print:p-0 print:block print:overflow-visible print:bg-white">
                <div
                  className="bg-white shadow-2xl rounded-xl overflow-hidden transition-transform print:shadow-none print:rounded-none print:transform-none"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                  {/* Simulated document page */}
                  <div
                    ref={documentRef}
                    className={`w-[595px] h-[842px] p-12 relative print:w-full print:h-auto print:p-8 ${
                      activeTool !== 'select' ? 'cursor-crosshair' : ''
                    }`}
                    onClick={handleDocumentClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Real file preview from Supabase Storage.
                        PDFs render in an iframe (browser-native viewer).
                        Images render via <img>. Office formats fall back
                        to a download CTA — the dedicated WordEditor /
                        ExcelEditor view modes handle those when the user
                        switches modes from the top toolbar. */}
                    {previewLoading ? (
                      <div className="flex items-center justify-center h-full text-sm text-advist-blue-light">
                        Chargement du document…
                      </div>
                    ) : preview.url ? (
                      (() => {
                        const mime = preview.mimeType || '';
                        const ext = (preview.fileName || '').split('.').pop()?.toLowerCase() || '';
                        const isPdf = mime === 'application/pdf' || ext === 'pdf';
                        const isImage = mime.startsWith('image/');
                        if (isPdf) {
                          return (
                            <iframe
                              title={preview.fileName || document.title}
                              src={preview.url}
                              className="w-full h-full border-0 print:hidden"
                            />
                          );
                        }
                        if (isImage) {
                          return (
                            <img
                              src={preview.url}
                              alt={preview.fileName || document.title}
                              className="max-w-full max-h-full object-contain mx-auto"
                            />
                          );
                        }
                        return (
                          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                            <FileText size={40} className="text-advist-gray900/30" />
                            <p className="text-sm font-medium text-advist-gray900">
                              {preview.fileName || document.title}
                            </p>
                            <p className="text-xs text-advist-blue-light max-w-xs">
                              Aperçu intégré non disponible pour ce format. Utilisez les modes Word
                              / Excel ci-dessus ou téléchargez le fichier.
                            </p>
                            <a
                              href={preview.url}
                              download={preview.fileName || undefined}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-advist-dark text-white rounded-xl text-sm hover:bg-advist-dark/90"
                            >
                              <Download size={14} />
                              Télécharger
                            </a>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                        <FileText size={40} className="text-advist-gray900/30" />
                        <p className="text-sm font-medium text-advist-gray900">
                          Aucun fichier rattaché
                        </p>
                        <p className="text-xs text-advist-blue-light max-w-xs">
                          Ce document n'a pas (encore) de fichier associé dans le stockage.
                        </p>
                      </div>
                    )}

                    {/* Render annotations */}
                    {renderAnnotations()}

                    {/* Draw current path */}
                    {isDrawing && currentPath.length > 1 && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ overflow: 'visible' }}
                      >
                        <path
                          d={currentPath.reduce((acc, point, idx) => {
                            return (
                              acc +
                              (idx === 0
                                ? `M ${point.x}% ${point.y}%`
                                : ` L ${point.x}% ${point.y}%`)
                            );
                          }, '')}
                          stroke={selectedColor}
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}

                    {/* Paraph indicator */}
                    {document.paraph_pages?.includes(currentPage) && (
                      <div className="absolute bottom-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-advist-gold-light border border-advist-gold rounded-xl print:hidden">
                        <FileSignature size={14} className="text-advist-gold-dark" />
                        <span className="text-xs text-advist-gold-dark font-medium">
                          Paraphe requis
                        </span>
                      </div>
                    )}

                    {/* Page number */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-advist-text-muted print:hidden">
                      {currentPage} / {document.total_pages}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Double Sidebar */}
            {!sidebarCollapsed && (
              <div className="print:hidden flex">
                {/* Sidebar 1 - Icon Navigation */}
                <div className="w-16 bg-[#F9F9F7] border-l border-[#E0E0D8] flex flex-col py-2">
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      onClick={() => setActivePanel(panel.id)}
                      className={`relative mx-2 my-1 p-3 rounded-xl transition-all group ${
                        activePanel === panel.id
                          ? 'bg-advist-dark text-white shadow-lg'
                          : 'hover:bg-[#E0E0D8] text-advist-blue-light hover:text-advist-gray900'
                      }`}
                      title={panel.label}
                    >
                      {panel.icon}
                      {panel.badge}

                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-advist-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {panel.label}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Sidebar 2 - Content Panel */}
                <div className="w-[450px] bg-white border-l border-[#E0E0D8] overflow-y-auto">
                  {renderPanelContent()}
                </div>
              </div>
            )}

            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`absolute top-1/2 -translate-y-1/2 p-1.5 bg-white border border-[#E0E0D8] rounded-l-lg shadow-md hover:bg-advist-bg transition-all z-10 print:hidden ${
                sidebarCollapsed ? 'right-0' : 'right-[514px]'
              }`}
            >
              {sidebarCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </>
        )}
      </div>

      {/* Stamp Picker Modal */}
      {showStampPicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowStampPicker(false)}
        >
          <div className="bg-white rounded-xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-advist-gray900 mb-3">Choisir un tampon</h3>
            <div className="grid grid-cols-2 gap-2">
              {STAMP_OPTIONS.map((stamp) => (
                <button
                  key={stamp.label}
                  onClick={() => {
                    setSelectedStamp(stamp);
                    setShowStampPicker(false);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedStamp.label === stamp.label
                      ? 'border-primary-800'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: stamp.bgColor }}
                >
                  <span className="font-bold text-sm" style={{ color: stamp.color }}>
                    {stamp.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Partager le document"
      >
        <div className="space-y-4">
          <Input
            label="Email ou nom"
            placeholder="Rechercher un utilisateur..."
            leftIcon={<User size={18} />}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowShareModal(false)}>
              Annuler
            </Button>
            <Button>Partager</Button>
          </div>
        </div>
      </Modal>

      {/* Workflow Modal */}
      <Modal
        isOpen={showWorkflowModal}
        onClose={() => setShowWorkflowModal(false)}
        title="Lancer un workflow"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">Modèle</label>
            <select className="w-full p-3 border border-[#E0E0D8] rounded-xl">
              <option>Validation contrat standard</option>
              <option>Approbation budget</option>
              <option>Validation procédure qualité</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowWorkflowModal(false)}>
              Annuler
            </Button>
            <Button leftIcon={<GitBranch size={18} />}>Lancer</Button>
          </div>
        </div>
      </Modal>

      {/* Validation Report Modal — only rendered once the real data is
          loaded from Supabase (lazy, on first open). If the document has
          no workflow attached, validationReportData stays null and the
          modal simply doesn't open. */}
      {validationReportData && (
        <ValidationReport
          data={validationReportData}
          isOpen={showValidationReport}
          onClose={() => setShowValidationReport(false)}
          onDownload={() => console.info('PDF downloaded')}
          onPrint={() => window.print()}
        />
      )}

      {/* Version Comparison Modal */}
      <VersionComparison
        isOpen={showVersionComparison}
        onClose={() => setShowVersionComparison(false)}
        documentId={String(document.id) as unknown as number}
        versions={versions.map((v) => ({
          id: v.id,
          document: String(document.id),
          version_number: v.version,
          file: '',
          original_filename: '',
          file_size: v.fileSize,
          file_hash: v.fileHash || '',
          uploaded_by: {
            id: '',
            email: '',
            first_name: v.by.split(' ')[0] || '',
            last_name: v.by.split(' ').slice(1).join(' '),
          } as never,
          comment: v.comment,
          created_at: v.date,
        }))}
        documentTitle={document.title}
      />

      {/* Real-time Chat — persisted in collaboration_chat_messages with
          live Realtime subscription. Mapped from our richer
          ChatMessageItem to the widget's narrower ChatMessage shape. */}
      <div className="print:hidden">
        <DocumentChat
          messages={chatMessagesState.map<ChatMessage>((m) => ({
            id: m.id,
            author: {
              id: m.author.id,
              name: m.authorExternal?.isExternal
                ? m.authorExternal.organizationName
                  ? `${m.author.name} · Externe (${m.authorExternal.organizationName})`
                  : `${m.author.name} · Externe`
                : m.author.name,
              avatar: m.author.avatar,
            },
            content: m.content,
            replyTo: m.replyTo,
            pageReference: m.pageReference,
            createdAt: m.createdAt,
          }))}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onStartTyping={handleStartTyping}
          onStopTyping={handleStopTyping}
          currentPage={currentPage}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen((v) => !v)}
        />
      </div>
    </div>
  );
};

export default DocumentDetailPage;
