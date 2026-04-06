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
  Check,
  Palette,
  Undo,
  Redo,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  Languages,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import {
  Card,
  Button,
  Badge,
  StatusBadge,
  Modal,
  Input,
} from '../../components/ui';
import { WordEditor, ExcelEditor, VersionComparison, AIDocumentAnalysis, DocumentTranslator, ValidationWorkflowPanel, ValidationStatusBadge } from '../../components/documents';
import type { ValidationStatus } from '../../components/documents';
import { ValidationReport, ValidationReportPreview } from '../../components/workflows';
import type { ValidationReportData } from '../../components/workflows';
import { AnomalyAlert } from '../../components/anomalies';
import { anomalyDetectionService, type Anomaly } from '../../services/anomalyDetection';
import { DocumentChat } from '../../components/collaboration/DocumentChat';
import type { ChatMessage, TypingUser } from '../../hooks/useDocumentCollaboration';

// Document view modes
type ViewMode = 'pdf' | 'word' | 'excel';

// Types for sidebar panels
type PanelId = 'ai' | 'translate' | 'info' | 'metadata' | 'owner' | 'validation' | 'workflow' | 'signatures' | 'versions' | 'linked' | 'comments' | 'activity' | 'actions';

interface SidebarPanel {
  id: PanelId;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}

// Annotation types
type AnnotationTool = 'select' | 'highlight' | 'note' | 'draw' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'signature' | 'stamp';

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

interface DocumentDetailPageProps {
  embedded?: boolean;
  onBack?: () => void;
}

export const DocumentDetailPage: React.FC<DocumentDetailPageProps> = ({ embedded = false, onBack }) => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/user';

  const [showShareModal, setShowShareModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showValidationReport, setShowValidationReport] = useState(false);
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Chat state (mock data - would be from real-time service)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'J\'ai termine la revision de l\'article 3.',
      author: { id: '1', name: 'Marie Dupont', avatar: undefined },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      content: 'Parfait, je vais verifier les modifications.',
      author: { id: '2', name: 'Pierre Martin', avatar: undefined },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '3',
      content: 'Il faudrait ajouter une clause sur la confidentialite.',
      author: { id: '1', name: 'Marie Dupont', avatar: undefined },
      createdAt: new Date(Date.now() - 900000).toISOString(),
      pageReference: 5,
    },
  ]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Anomaly detection state
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId>('ai');

  // Annotation states
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([
    // Sample annotations
    { id: '1', type: 'highlight', page: 1, x: 48, y: 180, width: 400, height: 20, color: '#FEF08A' },
    { id: '2', type: 'note', page: 1, x: 450, y: 280, color: '#FEF08A', content: 'Vérifier ce montant' },
    { id: '3', type: 'stamp', page: 1, x: 400, y: 50, color: '#10B981', content: 'APPROUVÉ' },
  ]);
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
  const [isEditMode, setIsEditMode] = useState(false);

  // Mock document data - with file extension to determine document type
  const documentId = parseInt(id || '1');

  // Simulate different document types based on ID
  const getDocumentByType = (docId: number) => {
    const baseDoc = {
      id: docId,
      description: 'Document de démonstration.',
      owner: {
        id: 1,
        first_name: 'Marie',
        last_name: 'Dupont',
        email: 'marie.dupont@advist.com',
      },
      current_version: 3,
      is_locked: false,
      tags: [
        { id: 1, name: 'Contrat', color: '#3B82F6' },
        { id: 2, name: 'Q4-2024', color: '#10B981' },
      ],
      metadata: {
        client: 'TechCorp SA',
        montant: '45 000 €',
        date_debut: '2024-10-01',
        date_fin: '2024-12-31',
      },
      status: 'pending' as const,
      created_at: '2024-11-20T10:30:00Z',
      updated_at: '2024-11-27T14:45:00Z',
      file_hash: 'SHA256:a7b9c3d4e5f6...',
      ohada_compliant: true,
      ohada_certificate_id: 'OHADA-2024-0012547',
      requires_paraph: true,
      paraph_pages: [1, 5, 8, 12],
      signature_status: {
        required_signatures: 2,
        completed_signatures: 1,
        pending_signatures: 1,
      },
    };

    // Return different document types based on ID for demo
    if (docId === 2) {
      return {
        ...baseDoc,
        title: 'Rapport financier Q4 2024',
        filename: 'rapport_financier_q4_2024.docx',
        file_extension: 'docx',
        file_size: 1458000,
        total_pages: 8,
        document_type: { id: 2, name: 'Rapport', requires_signature: false },
      };
    } else if (docId === 3) {
      return {
        ...baseDoc,
        title: 'Budget prévisionnel 2025',
        filename: 'budget_previsionnel_2025.xlsx',
        file_extension: 'xlsx',
        file_size: 856000,
        total_pages: 1,
        document_type: { id: 3, name: 'Tableur', requires_signature: false },
      };
    } else {
      return {
        ...baseDoc,
        title: 'Contrat de prestation Q4 2024',
        filename: 'contrat_prestation_q4_2024.pdf',
        file_extension: 'pdf',
        file_size: 2458000,
        total_pages: 12,
        document_type: { id: 1, name: 'Contrat', requires_signature: true },
      };
    }
  };

  const document = getDocumentByType(documentId);

  // Detect anomalies when document loads
  useEffect(() => {
    const documentData = {
      id: document?.id,
      document_date: document?.created_at,
      amount: document?.metadata?.montant ? parseFloat(document.metadata.montant.replace(/[^\d]/g, '')) : undefined,
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

  const linkedDocuments = [
    { id: 2, title: 'Annexe technique', relationship: 'annexe', status: 'approved' as const },
    { id: 3, title: 'Contrat Q3 2024', relationship: 'parent', status: 'signed' as const },
  ];

  const signatureDetails = [
    {
      id: 1,
      signer: { first_name: 'Marie', last_name: 'Dupont' },
      status: 'completed' as const,
      signed_at: '2024-11-26T10:30:00Z',
      certificate_id: 'SIG-2024-001234',
    },
    {
      id: 2,
      signer: { first_name: 'Jean', last_name: 'Dupont' },
      status: 'pending' as const,
      deadline: '2024-11-30T18:00:00Z',
    },
  ];

  const versions = [
    { id: 3, version: 3, by: 'Marie Dupont', comment: 'Version finale', date: '27 Nov 2024' },
    { id: 2, version: 2, by: 'Pierre Martin', comment: 'Corrections', date: '25 Nov 2024' },
    { id: 1, version: 1, by: 'Marie Dupont', comment: 'Version initiale', date: '20 Nov 2024' },
  ];

  const comments = [
    { id: 1, author: 'Sophie Bernard', content: 'Vérifier la clause 5.2', date: '26 Nov 09:15' },
    { id: 2, author: 'Pierre Martin', content: 'Clause 5.2 corrigée.', date: '26 Nov 14:30' },
  ];

  const workflow = {
    template: 'Validation contrat standard',
    status: 'in_progress',
    current_step: 3,
    steps: [
      { name: 'Consultation', status: 'completed', assignee: 'Sophie B.', date: '24 Nov' },
      { name: 'Validation', status: 'completed', assignee: 'Pierre M.', date: '25 Nov' },
      { name: 'Approbation', status: 'in_progress', assignee: 'Jean D.', deadline: '29 Nov' },
      { name: 'Signature', status: 'pending', assignee: 'Marie D.' },
    ],
  };

  // Validation Report Data
  const validationReportData: ValidationReportData = {
    id: 'vr-2024-001',
    referenceNumber: 'ADVIST-2024-DOC-00145-VAL',
    document: {
      id: document.id?.toString() || '1',
      title: document.title,
      type: document.type,
      version: document.version,
      createdAt: '2024-11-20T10:00:00Z',
      createdBy: document.owner.name,
      fileHash: 'a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
      pageCount: 15,
    },
    workflow: {
      id: 'wf-001',
      name: workflow.template,
      templateName: 'Contrat Standard',
      startedAt: '2024-11-22T09:00:00Z',
      completedAt: workflow.status === 'completed' ? '2024-11-27T16:30:00Z' : undefined,
      status: workflow.status as 'in_progress' | 'completed' | 'rejected' | 'cancelled',
      initiatedBy: {
        id: 1,
        name: 'Marie Dupont',
        email: 'marie.dupont@example.com',
        department: 'Direction Juridique',
      },
    },
    steps: [
      {
        id: 'step-1',
        order: 1,
        name: 'Consultation',
        type: 'consultation',
        status: 'approved',
        assignee: {
          id: 2,
          name: 'Sophie Bernard',
          email: 'sophie.bernard@example.com',
          role: 'Juriste',
          department: 'Direction Juridique',
        },
        completedAt: '2024-11-24T11:30:00Z',
        completedBy: {
          id: 2,
          name: 'Sophie Bernard',
          email: 'sophie.bernard@example.com',
        },
        comment: 'Document conforme aux exigences légales. Clause 5.2 vérifiée.',
        signature: {
          type: 'draw',
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAIeF9DAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFfSURBVGiB7doxSsRAGMXx/y4WYmFhYSFYWAgWFoKFhWBhIVhYCBYWgoWFYGEhWFgIFhaChaAHeACP4REUEVFEt3ABtxCLycYxJMvu6sw37sL/K2YmM8y8ZAbOIKIoiqIoiqLoXfLu+HQ6LSIyIyJHIrIqIsfq+qK+/hGR9yJypfvvqOu7ur5VLpfr9fr5arW6p3u+ISLn6nmAqiqqqi9E5Eq9/bWInIjIM9X+IiLfRORJvf2DiDwTkRt1fUVdt9X1Y/X2IvKirp+q60t1fayuT9T1gbq+oN7+VL39kXr7Y3V9ot7+RF0fq+tD9fZ76u2P1dsfq7c/VG+/ra5P1NtfqOsr6u2P1fWhevtt9fan6u2v1NsfqetD9fbb6vpMXZ+ot79R13fU29+q6wt1faWuj9T1ubq+VNe36u3v1fWBuj5W13fq+kxdH6nrU3V9ot7+Ul1fq+t7dX2tro/V9am6PlHXF+r6Ql1fqus7dX2nrq/U9aG6PlbXp+r6RkT+AB3zj4+Oj48fHx8fHx8/Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pv9/Aab8hbxQ4YPXAAAA',
          timestamp: '2024-11-24T11:30:00Z',
          ipAddress: '192.168.1.100',
        },
      },
      {
        id: 'step-2',
        order: 2,
        name: 'Validation',
        type: 'validation',
        status: 'approved',
        assignee: {
          id: 3,
          name: 'Pierre Martin',
          email: 'pierre.martin@example.com',
          role: 'Responsable Achats',
          department: 'Direction des Achats',
        },
        completedAt: '2024-11-25T14:45:00Z',
        completedBy: {
          id: 3,
          name: 'Pierre Martin',
          email: 'pierre.martin@example.com',
        },
        comment: 'Conditions commerciales validées. Montants conformes au budget.',
        signature: {
          type: 'draw',
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAIeF9DAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFfSURBVGiB7doxSsRAGMXx/y4WYmFhYSFYWAgWFoKFhWBhIVhYCBYWgoWFYGEhWFgIFhaChaAHeACP4REUEVFEt3ABtxCLycYxJMvu6sw37sL/K2YmM8y8ZAbOIKIoiqIoiqLoXfLu+HQ6LSIyIyJHIrIqIsfq+qK+/hGR9yJypfvvqOu7ur5VLpfr9fr5arW6p3u+ISLn6nmAqiqqqi9E5Eq9/bWInIjIM9X+IiLfRORJvf2DiDwTkRt1fUVdt9X1Y/X2IvKirp+q60t1fayuT9T1gbq+oN7+VL39kXr7Y3V9ot7+RF0fq+tD9fZ76u2P1dsfq7c/VG+/ra5P1NtfqOsr6u2P1fWhevtt9fan6u2v1NsfqetD9fbb6vpMXZ+ot79R13fU29+q6wt1faWuj9T1ubq+VNe36u3v1fWBuj5W13fq+kxdH6nrU3V9ot7+Ul1fq+t7dX2tro/V9am6PlHXF+r6Ql1fqus7dX2nrq/U9aG6PlbXp+r6RkT+AB3zj4+Oj48fHx8fHx8/Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pv9/Aab8hbxQ4YPXAAAA',
          timestamp: '2024-11-25T14:45:00Z',
          ipAddress: '192.168.1.105',
        },
      },
      {
        id: 'step-3',
        order: 3,
        name: 'Approbation',
        type: 'approval',
        status: workflow.current_step === 3 ? 'in_progress' : 'approved',
        assignee: {
          id: 4,
          name: 'Jean Dupont',
          email: 'jean.dupont@example.com',
          role: 'Directeur',
          department: 'Direction Générale',
        },
        completedAt: workflow.current_step > 3 ? '2024-11-26T10:00:00Z' : undefined,
        completedBy: workflow.current_step > 3 ? {
          id: 4,
          name: 'Jean Dupont',
          email: 'jean.dupont@example.com',
        } : undefined,
        comment: workflow.current_step > 3 ? 'Approuvé pour signature.' : undefined,
      },
      {
        id: 'step-4',
        order: 4,
        name: 'Signature',
        type: 'signature',
        status: 'pending',
        assignee: {
          id: 5,
          name: 'Marie Leblanc',
          email: 'marie.leblanc@example.com',
          role: 'Directrice Générale',
          department: 'Direction Générale',
        },
      },
    ],
    finalSignature: workflow.status === 'completed' ? {
      signedBy: {
        id: 5,
        name: 'Marie Leblanc',
        email: 'marie.leblanc@example.com',
        title: 'Directrice Générale',
      },
      signedAt: '2024-11-27T16:30:00Z',
      signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAIeF9DAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFfSURBVGiB7doxSsRAGMXx/y4WYmFhYSFYWAgWFoKFhWBhIVhYCBYWgoWFYGEhWFgIFhaChaAHeACP4REUEVFEt3ABtxCLycYxJMvu6sw37sL/K2YmM8y8ZAbOIKIoiqIoiqLoXfLu+HQ6LSIyIyJHIrIqIsfq+qK+/hGR9yJypfvvqOu7ur5VLpfr9fr5arW6p3u+ISLn6nmAqiqqqi9E5Eq9/bWInIjIM9X+IiLfRORJvf2DiDwTkRt1fUVdt9X1Y/X2IvKirp+q60t1fayuT9T1gbq+oN7+VL39kXr7Y3V9ot7+RF0fq+tD9fZ76u2P1dsfq7c/VG+/ra5P1NtfqOsr6u2P1fWhevtt9fan6u2v1NsfqetD9fbb6vpMXZ+ot79R13fU29+q6wt1faWuj9T1ubq+VNe36u3v1fWBuj5W13fq+kxdH6nrU3V9ot7+Ul1fq+t7dX2tro/V9am6PlHXF+r6Ql1fqus7dX2nrq/U9aG6PlbXp+r6RkT+AB3zj4+Oj48fHx8fHx8/Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pv9/Aab8hbxQ4YPXAAAA',
      certificateId: 'CERT-2024-00892',
      reason: 'Signature du contrat pour approbation finale',
    } : undefined,
    verificationCode: 'ADVIST-VRF-8A3B-C7D2-E9F4',
    generatedAt: new Date().toISOString(),
  };

  const activities = [
    { action: 'Version uploadée', user: 'Marie D.', time: '2h', icon: <Layers size={14} /> },
    { action: 'Commentaire ajouté', user: 'Pierre M.', time: '1j', icon: <MessageSquare size={14} /> },
    { action: 'Workflow démarré', user: 'Marie D.', time: '2j', icon: <GitBranch size={14} /> },
    { action: 'Document créé', user: 'Marie D.', time: '7j', icon: <FileText size={14} /> },
  ];

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))  } ${  sizes[i]}`;
  };

  // Chat handlers
  const handleSendMessage = (content: string, replyTo?: string, pageReference?: number) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      author: { id: 'current', name: 'Vous', avatar: undefined },
      createdAt: new Date().toISOString(),
      replyTo,
      pageReference,
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleStartTyping = () => {
    // In real app, would emit to websocket
  };

  const handleStopTyping = () => {
    // In real app, would emit to websocket
  };

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
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  // Sidebar panels configuration
  const panels: SidebarPanel[] = [
    {
      id: 'ai',
      icon: <Sparkles size={20} />,
      label: 'Analyse IA',
      badge: <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-dark rounded-full animate-pulse" />
    },
    {
      id: 'translate',
      icon: <Languages size={20} />,
      label: 'Traduction',
      badge: <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-dark rounded-full" />
    },
    { id: 'info', icon: <Info size={20} />, label: 'Informations' },
    { id: 'metadata', icon: <Tag size={20} />, label: 'Métadonnées' },
    { id: 'owner', icon: <User size={20} />, label: 'Propriétaire' },
    {
      id: 'validation',
      icon: <CheckCircle size={20} />,
      label: 'Validation',
      badge: <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-gold rounded-full" />
    },
    {
      id: 'workflow',
      icon: <GitBranch size={20} />,
      label: 'Workflow',
      badge: <span className="absolute -top-1 -right-1 w-2 h-2 bg-advist-dark rounded-full" />
    },
    {
      id: 'signatures',
      icon: <PenTool size={20} />,
      label: 'Signatures',
      badge: document.signature_status.pending_signatures > 0 ? (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-advist-gold text-advist-gray900 text-[10px] flex items-center justify-center rounded-full">
          {document.signature_status.pending_signatures}
        </span>
      ) : undefined
    },
    { id: 'versions', icon: <History size={20} />, label: 'Versions' },
    { id: 'linked', icon: <Link2 size={20} />, label: 'Documents liés' },
    {
      id: 'comments',
      icon: <MessageSquare size={20} />,
      label: 'Commentaires',
      badge: comments.length > 0 ? (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-advist-text-secondary text-white text-[10px] flex items-center justify-center rounded-full">
          {comments.length}
        </span>
      ) : undefined
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
              annotations={annotations.filter(a => a.content).map(a => ({ id: a.id, content: a.content || '' }))}
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
                onResolve={(id) => setAnomalies(prev => prev.filter(a => a.id !== id))}
                onDismiss={(id) => setAnomalies(prev => prev.filter(a => a.id !== id))}
              />
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Type</span>
                <span className="text-sm font-medium text-advist-gray900">{document.document_type.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Taille</span>
                <span className="text-sm font-medium text-advist-gray900">{formatFileSize(document.file_size)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Version</span>
                <span className="text-sm font-medium text-advist-gray900">v{document.current_version}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                <span className="text-sm text-advist-blue-light">Pages</span>
                <span className="text-sm font-medium text-advist-gray900">{document.total_pages}</span>
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
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
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
                <div key={key} className="flex justify-between items-center py-2 border-b border-[#F0F0EB]">
                  <span className="text-sm text-advist-blue-light capitalize">{key.replace('_', ' ')}</span>
                  <span className="text-sm font-medium text-advist-gray900">{value}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" leftIcon={<Edit size={14} />}>
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

      case 'validation':
        return (
          <div className="p-4">
            <ValidationWorkflowPanel
              documentId={document.id.toString()}
              validationSummary={{
                status: 'under_review' as ValidationStatus,
                status_display: 'En révision',
                submitted_at: '2024-11-25T10:00:00Z',
                submitted_by: { id: '1', name: 'Marie Dupont' },
                completed_at: null,
                completed_by: null,
                notes: 'Document soumis pour validation du contrat Q4.',
                comments: {
                  total: 3,
                  resolved: 1,
                  pending: 2,
                },
                can_submit: false,
                can_validate: true,
              }}
              validationHistory={[
                {
                  type: 'workflow_action',
                  timestamp: '2024-11-25T10:00:00Z',
                  user: { id: '1', name: 'Marie Dupont' },
                  action: 'Document soumis pour révision',
                },
                {
                  type: 'workflow_action',
                  timestamp: '2024-11-25T14:30:00Z',
                  user: { id: '2', name: 'Pierre Martin' },
                  action: 'Révision commencée',
                },
                {
                  type: 'comment',
                  timestamp: '2024-11-25T15:00:00Z',
                  user: { id: '2', name: 'Pierre Martin' },
                  content: 'Vérifier la clause 5.2 sur les conditions de paiement.',
                  context: {
                    type: 'section',
                    section_id: 'article-5',
                    page: 3,
                  },
                  resolved: false,
                },
              ]}
              currentUserId="current"
              isOwner={true}
              canReview={true}
              onSubmitForReview={async (notes) => {
                console.log('Submitting for review:', notes);
              }}
              onStartReview={async () => {
                console.log('Starting review');
              }}
              onRequestChanges={async (comments) => {
                console.log('Requesting changes:', comments);
              }}
              onValidate={async (comments) => {
                console.log('Validating:', comments);
              }}
              onReject={async (reason) => {
                console.log('Rejecting:', reason);
              }}
            />
          </div>
        );

      case 'workflow':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-advist-gray900 text-lg">Workflow</h3>
              <Badge variant="info" size="sm">En cours</Badge>
            </div>
            <p className="text-sm text-[#585858] bg-[#F9F9F7] p-3 rounded-xl">{workflow.template}</p>

            {/* Progress indicator */}
            <div className="flex items-center gap-1">
              {workflow.steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className={`flex-1 h-1.5 rounded-full ${
                    step.status === 'completed' ? 'bg-advist-success' :
                    step.status === 'in_progress' ? 'bg-advist-dark' :
                    'bg-advist-border'
                  }`} />
                </React.Fragment>
              ))}
            </div>

            <div className="space-y-3 mt-4">
              {workflow.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-240 ${
                    step.status === 'in_progress' ? 'bg-advist-gold-light border border-advist-gold' :
                    step.status === 'completed' ? 'bg-green-50/50' :
                    'bg-[#F9F9F7]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'completed' ? 'bg-advist-success text-white' :
                    step.status === 'in_progress' ? 'bg-advist-dark text-white' :
                    'bg-advist-border text-advist-text-secondary'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${
                        step.status === 'in_progress' ? 'text-advist-gray900' :
                        step.status === 'completed' ? 'text-advist-success' :
                        'text-advist-gray900'
                      }`}>{step.name}</p>
                      {step.status === 'in_progress' && step.deadline && (
                        <Badge variant="warning" size="sm">{step.deadline}</Badge>
                      )}
                      {step.status === 'completed' && step.date && (
                        <span className="text-xs text-advist-success">{step.date}</span>
                      )}
                    </div>
                    <p className="text-sm text-advist-blue-light mt-0.5">{step.assignee}</p>
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
                {validationReportData.steps.filter(s => s.status === 'approved').length} / {validationReportData.steps.length} étapes validées
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
                {document.signature_status.completed_signatures}/{document.signature_status.required_signatures}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <div className="h-3 bg-[#E0E0D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                  style={{ width: `${(document.signature_status.completed_signatures / document.signature_status.required_signatures) * 100}%` }}
                />
              </div>
              <p className="text-xs text-advist-blue-light mt-1 text-center">
                {document.signature_status.completed_signatures} sur {document.signature_status.required_signatures} signatures
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
                      <p className="font-medium text-advist-gray900">
                        {sig.signer.first_name} {sig.signer.last_name}
                      </p>
                      <p className="text-xs text-advist-blue-light">
                        {sig.status === 'completed'
                          ? `Signé le ${sig.signed_at?.split('T')[0]}`
                          : `Échéance: ${sig.deadline?.split('T')[0]}`
                        }
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
              <Button className="w-full mt-4" leftIcon={<PenTool size={16} />} onClick={() => setShowSignModal(true)}>
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
              <Badge variant="gray" size="sm">v{document.current_version}</Badge>
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
                      <span className="text-lg font-semibold text-advist-gray900">v{v.version}</span>
                      {v.version === document.current_version && (
                        <Badge variant="info" size="sm">Actuelle</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-[#585858] mb-1">{v.comment}</p>
                  <p className="text-xs text-advist-blue-light">{v.by} • {v.date}</p>
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
              <Badge variant="gray" size="sm">{linkedDocuments.length}</Badge>
            </div>
            <div className="space-y-2">
              {linkedDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  to={`${basePath}/documents/${doc.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-[#E0E0D8] hover:border-advist-blue-light hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 bg-advist-bg rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-advist-blue-light" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-advist-gray900">{doc.title}</p>
                    <p className="text-xs text-advist-blue-light capitalize">{doc.relationship}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </Link>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full" leftIcon={<Link2 size={14} />}>
              Ajouter un lien
            </Button>
          </div>
        );

      case 'comments':
        return (
          <div className="p-4 space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-advist-gray900 text-lg">Commentaires</h3>
              <Badge variant="gray" size="sm">{comments.length}</Badge>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="p-4 bg-[#F9F9F7] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.author} size="sm" />
                      <span className="text-sm font-medium text-advist-gray900">{c.author}</span>
                    </div>
                    <span className="text-xs text-advist-blue-light">{c.date}</span>
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
                      <p className="text-xs text-advist-blue-light">{a.user} • Il y a {a.time}</p>
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
              <Button variant="outline" className="w-full justify-start" size="sm" leftIcon={<Download size={16} />}>
                Télécharger
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" leftIcon={<Share2 size={16} />} onClick={() => setShowShareModal(true)}>
                Partager
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" leftIcon={<Printer size={16} />} onClick={() => window.print()}>
                Imprimer
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" leftIcon={<Edit size={16} />}>
                Modifier les métadonnées
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" leftIcon={<GitBranch size={16} />} onClick={() => setShowWorkflowModal(true)}>
                Lancer un workflow
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm" leftIcon={document.is_locked ? <Unlock size={16} /> : <Lock size={16} />}>
                {document.is_locked ? 'Déverrouiller' : 'Verrouiller'}
              </Button>
              <div className="pt-2 border-t border-[#E0E0D8]">
                <Button variant="outline" className="w-full justify-start text-advist-error hover:bg-advist-gold-light border-advist-gold" size="sm" leftIcon={<Trash2 size={16} />}>
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
      .filter(a => a.page === currentPage)
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
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(annotation.id); }}
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
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(annotation.id); }}
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
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(annotation.id); }}
              >
                <button className="absolute -top-2 -right-2 w-4 h-4 bg-advist-error text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            );

          case 'draw':
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

          default:
            return null;
        }
      });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col print:h-auto print:block">
      {/* Top Bar */}
      {!embedded && (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E0E0D8] print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBack ? onBack() : navigate(-1)}
            className="p-2 hover:bg-advist-bg rounded-xl transition-all duration-240"
          >
            <ArrowLeft size={20} className="text-advist-gray900" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-advist-gray900">{document.title}</h1>
              <StatusBadge status={document.status} />
              {document.is_locked && (
                <Lock size={14} className="text-advist-gold" />
              )}
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
                  onClick={() => { setViewMode('pdf'); setIsEditMode(false); }}
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
                    onClick={() => { setViewMode('word'); setIsEditMode(true); }}
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
                    onClick={() => { setViewMode('excel'); setIsEditMode(true); }}
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            {isBookmarked ? (
              <BookmarkCheck size={18} className="text-advist-gold" />
            ) : (
              <Bookmark size={18} />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer size={18} />
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={16} />}>
            Télécharger
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Share2 size={16} />} onClick={() => setShowShareModal(true)}>
            Partager
          </Button>
          {document.signature_status?.pending_signatures > 0 && (
            <Button size="sm" leftIcon={<PenTool size={16} />} onClick={() => setShowSignModal(true)}>
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
            <Badge variant="success" size="sm">Certifié</Badge>
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
                  console.log('Saving Word document:', content);
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
                  console.log('Saving Excel document:', data);
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
        {viewMode === 'pdf' && <>
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
                        selectedColor === color.value ? 'border-primary-800' : 'border-transparent'
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
                  {annotationTools.find(t => t.id === activeTool)?.icon}
                </span>
                <span className="text-sm text-advist-text-secondary">
                  {annotationTools.find(t => t.id === activeTool)?.label}
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
                {/* Page header */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-advist-gray900">CONTRAT DE PRESTATION DE SERVICES</h2>
                  <p className="text-advist-text-secondary mt-1">Année 2024 - Quatrième Trimestre</p>
                </div>

                {/* Document content simulation */}
                <div className="space-y-4 text-sm text-advist-gray900">
                  <p className="font-semibold">ENTRE LES SOUSSIGNÉS :</p>
                  <p><strong>ADVIST SARL</strong>, société à responsabilité limitée au capital de 100 000 €, immatriculée au RCS sous le numéro 123 456 789, dont le siège social est situé à Abidjan, Côte d'Ivoire,</p>
                  <p className="mt-2">Représentée par Mme Marie DUPONT, en sa qualité de Directrice Générale,</p>
                  <p className="mt-4 font-semibold">ET</p>
                  <p><strong>TECHCORP SA</strong>, société anonyme au capital de 500 000 €...</p>

                  <div className="mt-8">
                    <p className="font-semibold">ARTICLE 1 - OBJET</p>
                    <p className="mt-2">Le présent contrat a pour objet de définir les conditions...</p>
                  </div>

                  <div className="mt-6">
                    <p className="font-semibold">ARTICLE 2 - DURÉE</p>
                    <p className="mt-2">Le présent contrat est conclu pour une durée de 3 mois...</p>
                  </div>
                </div>

                {/* Render annotations */}
                {renderAnnotations()}

                {/* Draw current path */}
                {isDrawing && currentPath.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                    <path
                      d={currentPath.reduce((acc, point, idx) => {
                        return acc + (idx === 0 ? `M ${point.x}% ${point.y}%` : ` L ${point.x}% ${point.y}%`);
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
                    <span className="text-xs text-advist-gold-dark font-medium">Paraphe requis</span>
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
        </>}
      </div>

      {/* Stamp Picker Modal */}
      {showStampPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStampPicker(false)}>
          <div className="bg-white rounded-xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
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
                    selectedStamp.label === stamp.label ? 'border-primary-800' : 'border-transparent'
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
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Partager le document">
        <div className="space-y-4">
          <Input
            label="Email ou nom"
            placeholder="Rechercher un utilisateur..."
            leftIcon={<User size={18} />}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowShareModal(false)}>Annuler</Button>
            <Button>Partager</Button>
          </div>
        </div>
      </Modal>

      {/* Workflow Modal */}
      <Modal isOpen={showWorkflowModal} onClose={() => setShowWorkflowModal(false)} title="Lancer un workflow">
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
            <Button variant="ghost" onClick={() => setShowWorkflowModal(false)}>Annuler</Button>
            <Button leftIcon={<GitBranch size={18} />}>Lancer</Button>
          </div>
        </div>
      </Modal>

      {/* Validation Report Modal */}
      <ValidationReport
        data={validationReportData}
        isOpen={showValidationReport}
        onClose={() => setShowValidationReport(false)}
        onDownload={() => console.log('PDF downloaded')}
        onPrint={() => window.print()}
      />

      {/* Version Comparison Modal */}
      <VersionComparison
        isOpen={showVersionComparison}
        onClose={() => setShowVersionComparison(false)}
        documentId={document.id}
        versions={versions}
        documentTitle={document.title}
      />

      {/* Real-time Chat */}
      <div className="print:hidden">
        <DocumentChat
          messages={chatMessages}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onStartTyping={handleStartTyping}
          onStopTyping={handleStopTyping}
          currentPage={currentPage}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      </div>
    </div>
  );
};

export default DocumentDetailPage;
