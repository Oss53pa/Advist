import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Lock,
  Folder,
  FolderPlus,
  ChevronRight,
  Copy,
  AlertTriangle,
  Link as LinkIcon,
  ExternalLink,
  GitBranch,
  _FileCheck,
  MessageSquare,
  History,
  Edit3,
  _Shield,
  _ArrowUpRight,
  FolderOpen,
  Home,
  Check,
  X,
  _Info,
  Users,
  Zap,
  UserPlus,
} from 'lucide-react';
import { Card, Button, Input, Badge, StatusBadge, Avatar, Modal } from '../../components/ui';
import { PrintButton } from '../../shared/PrintEngine';
import { documentsService } from '../../services';
import type {
  Document,
  DocumentFolder,
  DocumentLink,
  DocumentComment,
  DocumentModification,
} from '../../types';

// v2: Extended document with folder support
interface DocumentWithFolder extends Document {
  folder?: DocumentFolder;
  linked_documents: DocumentLink[];
  is_duplicate: boolean;
  duplicate_of?: number;
  track_changes_enabled: boolean;
  modifications: DocumentModification[];
  comments_count?: number;
}

export const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<DocumentFolder | null>(null);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateDoc, setDuplicateDoc] = useState<DocumentWithFolder | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedDocForLink, setSelectedDocForLink] = useState<DocumentWithFolder | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedDocForComments, setSelectedDocForComments] = useState<DocumentWithFolder | null>(
    null
  );
  const [showTrackChangesModal, setShowTrackChangesModal] = useState(false);
  const [selectedDocForTrackChanges, setSelectedDocForTrackChanges] =
    useState<DocumentWithFolder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', searchQuery, selectedStatus, currentFolder?.id],
    queryFn: () =>
      documentsService.list({
        search: searchQuery,
        status: selectedStatus || undefined,
      }),
  });

  // TODO: Replace with Supabase query when folders table is ready
  // const { data: foldersData } = useQuery({ queryKey: ['folders', currentFolder?.id], queryFn: () => foldersService.list(currentFolder?.id) });
  const folders: DocumentFolder[] = [];

  const documents = data?.results || [];

  // Map documents to extended interface
  const enhancedDocuments: DocumentWithFolder[] = documents.map((doc) => ({
    ...doc,
    folder: undefined,
    linked_documents: [],
    is_duplicate: false,
    track_changes_enabled: false,
    modifications: [],
    comments_count: 0,
  }));

  const handleDocumentUpload = (isDuplicate: boolean, existingDoc?: DocumentWithFolder) => {
    if (isDuplicate && existingDoc) {
      setDuplicateDoc(existingDoc);
      setShowDuplicateAlert(true);
    } else {
      // Normal upload
      setShowUploadModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            {t('documents.title', 'Documents')}
          </h1>
          <p className="text-advist-gray900/80 mt-1">
            {t('documents.subtitle', 'Gérez vos documents et leurs workflows')}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintButton config={{ title: 'Liste des documents', appName: 'Advist' }}>
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Document</th>
                    <th className="text-left py-2">Statut</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {enhancedDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b">
                      <td className="py-2">{doc.title}</td>
                      <td className="py-2">{doc.status}</td>
                      <td className="py-2">
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PrintButton>
          <Button
            variant="outline"
            onClick={() => setShowFolderModal(true)}
            leftIcon={<FolderPlus size={18} />}
          >
            {t('documents.newFolder', 'Nouveau dossier')}
          </Button>
          <Button onClick={() => setShowUploadModal(true)} leftIcon={<Plus size={18} />}>
            {t('documents.newDocument', 'Nouveau document')}
          </Button>
        </div>
      </div>

      {/* v2: Breadcrumb navigation for folders */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setCurrentFolder(null)}
          className="flex items-center gap-1 text-advist-gray900/80 hover:text-advist-gray900"
        >
          <Home size={16} />
          <span>{t('documents.root', 'Documents')}</span>
        </button>
        {currentFolder && (
          <>
            <ChevronRight size={16} className="text-advist-blue-light" />
            <span className="text-advist-gray900 font-medium">{currentFolder.name}</span>
          </>
        )}
      </div>

      {/* v2: Folders section */}
      {!currentFolder && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              hoverable
              padding="none"
              className="cursor-pointer"
              onClick={() => setCurrentFolder(folder)}
            >
              <div className="p-4 text-center">
                <div className="p-3 bg-primary-100 rounded-xl inline-block mb-2">
                  <Folder size={24} className="text-primary-900" />
                </div>
                <p className="font-medium text-advist-gray900 text-sm truncate">{folder.name}</p>
                <p className="text-xs text-advist-blue-light">
                  {folder.documents_count} {t('documents.files', 'fichiers')}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('documents.search', 'Rechercher un document...')}
              leftIcon={<Search size={18} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 border border-advist-blue-light rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold min-w-0"
            >
              <option value="">{t('documents.allStatuses', 'Tous les statuts')}</option>
              <option value="draft">{t('documents.status.draft', 'Brouillon')}</option>
              <option value="pending">{t('documents.status.pending', 'En attente')}</option>
              <option value="approved">{t('documents.status.approved', 'Approuvé')}</option>
              <option value="rejected">{t('documents.status.rejected', 'Rejeté')}</option>
              <option value="archived">{t('documents.status.archived', 'Archivé')}</option>
            </select>
            <Button variant="outline" leftIcon={<Filter size={18} />}>
              <span className="hidden sm:inline">
                {t('documents.moreFilters', 'Plus de filtres')}
              </span>
            </Button>
            <div className="flex border border-advist-blue-light rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-advist-dark text-white' : 'text-advist-gray900/80 hover:bg-advist-surface-dark'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-advist-dark text-white' : 'text-advist-gray900/80 hover:bg-advist-surface-dark'}`}
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Documents list/grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-advist-dark" />
        </div>
      ) : enhancedDocuments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-advist-blue-light mb-4" />
            <h3 className="text-lg font-medium text-advist-gray900">
              {t('documents.noDocuments', 'Aucun document')}
            </h3>
            <p className="text-advist-gray900/80 mt-1">
              {t('documents.noDocumentsDesc', 'Commencez par ajouter votre premier document')}
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowUploadModal(true)}
              leftIcon={<Plus size={18} />}
            >
              {t('documents.addDocument', 'Ajouter un document')}
            </Button>
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <DocumentListView
          documents={enhancedDocuments}
          onShowLinks={(doc) => {
            setSelectedDocForLink(doc);
            setShowLinkModal(true);
          }}
          onShowComments={(doc) => {
            setSelectedDocForComments(doc);
            setShowCommentsModal(true);
          }}
          onShowTrackChanges={(doc) => {
            setSelectedDocForTrackChanges(doc);
            setShowTrackChangesModal(true);
          }}
        />
      ) : (
        <DocumentGridView
          documents={enhancedDocuments}
          onShowLinks={(doc) => {
            setSelectedDocForLink(doc);
            setShowLinkModal(true);
          }}
          onShowComments={(doc) => {
            setSelectedDocForComments(doc);
            setShowCommentsModal(true);
          }}
          onShowTrackChanges={(doc) => {
            setSelectedDocForTrackChanges(doc);
            setShowTrackChangesModal(true);
          }}
        />
      )}

      {/* Upload modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        folders={folders}
        onDuplicateDetected={(existingDoc) =>
          handleDocumentUpload(true, existingDoc as DocumentWithFolder)
        }
      />

      {/* v2: Create folder modal */}
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        parentFolder={currentFolder}
      />

      {/* v2: Duplicate alert modal */}
      <DuplicateAlertModal
        isOpen={showDuplicateAlert}
        onClose={() => {
          setShowDuplicateAlert(false);
          setDuplicateDoc(null);
        }}
        duplicateOf={duplicateDoc}
      />

      {/* v2: Document links modal */}
      {selectedDocForLink && (
        <DocumentLinksModal
          isOpen={showLinkModal}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedDocForLink(null);
          }}
          document={selectedDocForLink}
        />
      )}

      {/* v2: Comments modal */}
      {selectedDocForComments && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedDocForComments(null);
          }}
          document={selectedDocForComments}
        />
      )}

      {/* v2: Track changes modal */}
      {selectedDocForTrackChanges && (
        <TrackChangesModal
          isOpen={showTrackChangesModal}
          onClose={() => {
            setShowTrackChangesModal(false);
            setSelectedDocForTrackChanges(null);
          }}
          document={selectedDocForTrackChanges}
        />
      )}
    </div>
  );
};

// v2: Enhanced list view with new features
const DocumentListView: React.FC<{
  documents: DocumentWithFolder[];
  onShowLinks: (doc: DocumentWithFolder) => void;
  onShowComments: (doc: DocumentWithFolder) => void;
  onShowTrackChanges: (doc: DocumentWithFolder) => void;
}> = ({ documents, onShowLinks, onShowComments, onShowTrackChanges }) => {
  const { t } = useTranslation();

  return (
    <Card padding="none">
      <table className="w-full">
        <thead className="bg-advist-surface-dark/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-advist-gray900/80">
              {t('documents.document', 'Document')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-advist-gray900/80">
              {t('documents.folder', 'Dossier')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-advist-gray900/80">
              {t('documents.type', 'Type')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-advist-gray900/80">
              {t('documents.owner', 'Propriétaire')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-advist-gray900/80">
              {t('documents.status', 'Statut')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-advist-gray900/80">
              {t('documents.features', 'Fonctionnalités')}
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-advist-gray900/80">
              {t('documents.actions', 'Actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E0E0D8]">
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="hover:bg-advist-surface-dark/30 transition-all duration-240"
            >
              <td className="px-4 py-3">
                <Link to={`${doc.id}`} className="flex items-center gap-3">
                  <div className="p-2 bg-advist-surface-dark rounded-xl relative">
                    <FileText size={20} className="text-advist-gray900/80" />
                    {/* v2: Duplicate indicator */}
                    {doc.is_duplicate && (
                      <div className="absolute -top-1 -right-1 p-0.5 bg-primary-100 rounded-full">
                        <Copy size={10} className="text-advist-gray900" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-advist-gray900 hover:underline">{doc.title}</p>
                      {/* v2: Linked documents indicator */}
                      {doc.linked_documents.length > 0 && (
                        <Badge variant="info" size="sm">
                          <LinkIcon size={10} className="mr-1" />
                          {doc.linked_documents.length}
                        </Badge>
                      )}
                    </div>
                    {doc.is_locked && (
                      <span className="flex items-center gap-1 text-xs text-advist-blue-light">
                        <Lock size={12} /> {t('documents.locked', 'Verrouillé')}
                      </span>
                    )}
                    {doc.is_duplicate && (
                      <span className="flex items-center gap-1 text-xs text-advist-gray900">
                        <AlertTriangle size={12} />{' '}
                        {t('documents.possibleDuplicate', 'Doublon possible')}
                      </span>
                    )}
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3">
                {doc.folder ? (
                  <div className="flex items-center gap-1 text-sm text-advist-gray900/80">
                    <Folder size={14} className="text-advist-gray900" />
                    {doc.folder.name}
                  </div>
                ) : (
                  <span className="text-xs text-advist-blue-light">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" size="sm">
                  {doc.document_type?.name || t('documents.undefined', 'Non défini')}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={`${doc.owner.first_name} ${doc.owner.last_name}`}
                    src={doc.owner.avatar}
                    size="xs"
                  />
                  <span className="text-sm text-advist-gray900/80">
                    {doc.owner.first_name} {doc.owner.last_name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {/* v2: Track changes button */}
                  {doc.track_changes_enabled && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onShowTrackChanges(doc);
                      }}
                      className={`p-1.5 rounded transition-all duration-240 ${
                        doc.modifications.length > 0
                          ? 'bg-advist-gold-light/20 text-advist-gray900/80'
                          : 'text-advist-blue-light hover:bg-advist-surface-dark'
                      }`}
                      title={t('documents.trackChanges', 'Suivi des modifications')}
                    >
                      <History size={16} />
                      {doc.modifications.length > 0 && (
                        <span className="sr-only">{doc.modifications.length}</span>
                      )}
                    </button>
                  )}
                  {/* v2: Links button */}
                  {doc.linked_documents.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onShowLinks(doc);
                      }}
                      className="p-1.5 rounded bg-advist-gold-light/20 text-advist-gray900/80"
                      title={t('documents.linkedDocs', 'Documents liés')}
                    >
                      <LinkIcon size={16} />
                    </button>
                  )}
                  {/* v2: Comments button */}
                  {doc.comments_count && doc.comments_count > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onShowComments(doc);
                      }}
                      className="p-1.5 rounded bg-primary-100 text-advist-gray900 flex items-center gap-1"
                      title={t('documents.comments', 'Commentaires')}
                    >
                      <MessageSquare size={16} />
                      <span className="text-xs">{doc.comments_count}</span>
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <DocumentActions
                  document={doc}
                  onShowLinks={() => onShowLinks(doc)}
                  onShowComments={() => onShowComments(doc)}
                  onShowTrackChanges={() => onShowTrackChanges(doc)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

// v2: Enhanced grid view with new features
const DocumentGridView: React.FC<{
  documents: DocumentWithFolder[];
  onShowLinks: (doc: DocumentWithFolder) => void;
  onShowComments: (doc: DocumentWithFolder) => void;
  onShowTrackChanges: (doc: DocumentWithFolder) => void;
}> = ({ documents, onShowLinks, onShowComments, onShowTrackChanges }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <Card key={doc.id} hoverable padding="none">
          <Link to={`${doc.id}`}>
            <div className="aspect-[4/3] bg-advist-surface-dark flex items-center justify-center relative">
              <FileText size={48} className="text-advist-blue-light" />
              {/* v2: Feature indicators */}
              <div className="absolute top-2 right-2 flex gap-1">
                {doc.is_duplicate && (
                  <div
                    className="p-1 bg-primary-100 rounded"
                    title={t('documents.duplicate', 'Doublon')}
                  >
                    <Copy size={14} className="text-advist-gray900" />
                  </div>
                )}
                {doc.track_changes_enabled && (
                  <div
                    className="p-1 bg-advist-gold-light/20 rounded"
                    title={t('documents.trackChanges', 'Suivi actif')}
                  >
                    <History size={14} className="text-advist-gray900/80" />
                  </div>
                )}
                {doc.linked_documents.length > 0 && (
                  <div
                    className="p-1 bg-advist-gold-light/20 rounded"
                    title={t('documents.linked', 'Documents liés')}
                  >
                    <LinkIcon size={14} className="text-advist-gray900/80" />
                  </div>
                )}
              </div>
              {/* v2: Folder badge */}
              {doc.folder && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-white/90 rounded text-xs">
                  <Folder size={12} className="text-advist-gray900" />
                  <span className="text-advist-gray900/80">{doc.folder.name}</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-advist-gray900 line-clamp-2">{doc.title}</h3>
                <DocumentActions
                  document={doc}
                  onShowLinks={() => onShowLinks(doc)}
                  onShowComments={() => onShowComments(doc)}
                  onShowTrackChanges={() => onShowTrackChanges(doc)}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status={doc.status} />
                <div className="flex items-center gap-2">
                  {doc.comments_count && doc.comments_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-advist-blue-light">
                      <MessageSquare size={12} /> {doc.comments_count}
                    </span>
                  )}
                  <span className="text-xs text-advist-blue-light">
                    {new Date(doc.updated_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
};

// v2: Enhanced document actions with new features
const DocumentActions: React.FC<{
  document: DocumentWithFolder;
  onShowLinks: () => void;
  onShowComments: () => void;
  onShowTrackChanges: () => void;
}> = ({ document, onShowLinks, onShowComments, onShowTrackChanges }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    navigate(`${document.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    navigate(`${document.id}`);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    // TODO: Implement delete confirmation modal
    console.info('Delete document:', document.id);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-1 rounded hover:bg-advist-surface-dark transition-all duration-240"
      >
        <MoreVertical size={18} className="text-advist-gray900/80" />
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-advist-border py-1 z-20">
            <button
              onClick={handleView}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
            >
              <Eye size={16} /> {t('documents.view', 'Voir')}
            </button>
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
            >
              <Edit3 size={16} /> {t('documents.edit', 'Modifier')}
            </button>
            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
            >
              <Download size={16} /> {t('documents.download', 'Télécharger')}
            </button>

            <hr className="my-1 border-advist-border" />

            {/* v2: Link documents */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onShowLinks();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
            >
              <LinkIcon size={16} /> {t('documents.manageLinks', 'Gérer les liens')}
              {document.linked_documents.length > 0 && (
                <Badge variant="info" size="sm" className="ml-auto">
                  {document.linked_documents.length}
                </Badge>
              )}
            </button>

            {/* v2: Comments */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onShowComments();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
            >
              <MessageSquare size={16} /> {t('documents.comments', 'Commentaires')}
              {document.comments_count && document.comments_count > 0 && (
                <Badge variant="success" size="sm" className="ml-auto">
                  {document.comments_count}
                </Badge>
              )}
            </button>

            {/* v2: Track changes */}
            {document.track_changes_enabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onShowTrackChanges();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-advist-gray900/80 hover:bg-advist-surface-dark"
              >
                <History size={16} /> {t('documents.trackChanges', 'Suivi des modifications')}
                {document.modifications.length > 0 && (
                  <Badge variant="warning" size="sm" className="ml-auto">
                    {document.modifications.length}
                  </Badge>
                )}
              </button>
            )}

            <hr className="my-1 border-advist-border" />

            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-advist-error hover:bg-advist-error/10"
            >
              <Trash2 size={16} /> {t('documents.delete', 'Supprimer')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Interface for uploaded file
interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
}

// Interface for annex
interface Annex {
  id: string;
  file: File;
  name: string;
  description: string;
  type: string;
  size: number;
}

// Interface for external signatory
interface ExternalSignatory {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  role: 'signer' | 'validator' | 'observer';
  order: number;
}

// Interface for metadata field value
interface MetadataValue {
  fieldId: string;
  fieldName: string;
  value: string;
}

// v2: Enhanced upload modal with folder selection, annexes, and more
const UploadDocumentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  folders: DocumentFolder[];
  onDuplicateDetected?: (existingDoc: Document) => void;
}> = ({ isOpen, onClose, folders, _onDuplicateDetected }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    'document' | 'annexes' | 'metadata' | 'workflow' | 'signatories'
  >('document');

  // Document state
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<number | ''>('');
  const [confidentiality, setConfidentiality] = useState<
    'public' | 'internal' | 'confidential' | 'secret'
  >('internal');
  const [description, setDescription] = useState('');
  const [enableTrackChanges, setEnableTrackChanges] = useState(false);
  const [mainFile, setMainFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Annexes state
  const [annexes, setAnnexes] = useState<Annex[]>([]);
  const [annexDragActive, setAnnexDragActive] = useState(false);

  // Metadata state
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [metadataValues, setMetadataValues] = useState<MetadataValue[]>([]);
  const [expirationDate, setExpirationDate] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  // Workflow state
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [launchWorkflowNow, setLaunchWorkflowNow] = useState(false);
  const [fastTrack, setFastTrack] = useState(false);

  // External signatories state
  const [externalSignatories, setExternalSignatories] = useState<ExternalSignatory[]>([]);
  const [newSignatory, setNewSignatory] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    role: 'signer' as const,
  });

  // Mock workflows
  const workflows = [
    { id: 1, name: 'Validation contrat standard', steps: 3 },
    { id: 2, name: 'Approbation facture', steps: 2 },
    { id: 3, name: 'Signature direction', steps: 4 },
  ];

  // Mock metadata fields based on document type
  const metadataFields =
    documentType === '1'
      ? [
          { id: 'client', name: 'Client', type: 'text', required: true },
          { id: 'contractNumber', name: 'Numero de contrat', type: 'text', required: true },
          { id: 'startDate', name: 'Date de debut', type: 'date', required: false },
          { id: 'endDate', name: 'Date de fin', type: 'date', required: false },
        ]
      : documentType === '2'
        ? [
            { id: 'supplier', name: 'Fournisseur', type: 'text', required: true },
            { id: 'invoiceNumber', name: 'Numero de facture', type: 'text', required: true },
            { id: 'dueDate', name: "Date d'echeance", type: 'date', required: true },
          ]
        : [];

  const handleDrag = (e: React.DragEvent, isAnnex = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      isAnnex ? setAnnexDragActive(true) : setDragActive(true);
    } else if (e.type === 'dragleave') {
      isAnnex ? setAnnexDragActive(false) : setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, isAnnex = false) => {
    e.preventDefault();
    e.stopPropagation();
    isAnnex ? setAnnexDragActive(false) : setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (isAnnex) {
      const newAnnexes: Annex[] = files.map((file, index) => ({
        id: `annex_${Date.now()}_${index}`,
        file,
        name: file.name,
        description: '',
        type: file.type,
        size: file.size,
      }));
      setAnnexes([...annexes, ...newAnnexes]);
    } else if (files.length > 0) {
      const file = files[0];
      setMainFile({
        id: `file_${Date.now()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 100,
        status: 'complete',
      });
      if (!documentTitle) {
        setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isAnnex = false) => {
    const files = Array.from(e.target.files || []);
    if (isAnnex) {
      const newAnnexes: Annex[] = files.map((file, index) => ({
        id: `annex_${Date.now()}_${index}`,
        file,
        name: file.name,
        description: '',
        type: file.type,
        size: file.size,
      }));
      setAnnexes([...annexes, ...newAnnexes]);
    } else if (files.length > 0) {
      const file = files[0];
      setMainFile({
        id: `file_${Date.now()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 100,
        status: 'complete',
      });
      if (!documentTitle) {
        setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const removeAnnex = (id: string) => {
    setAnnexes(annexes.filter((a) => a.id !== id));
  };

  const updateAnnexDescription = (id: string, description: string) => {
    setAnnexes(annexes.map((a) => (a.id === id ? { ...a, description } : a)));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addExternalSignatory = () => {
    if (newSignatory.email && newSignatory.firstName && newSignatory.lastName) {
      setExternalSignatories([
        ...externalSignatories,
        {
          ...newSignatory,
          id: `sig_${Date.now()}`,
          order: externalSignatories.length + 1,
        },
      ]);
      setNewSignatory({ email: '', firstName: '', lastName: '', company: '', role: 'signer' });
    }
  };

  const removeSignatory = (id: string) => {
    setExternalSignatories(externalSignatories.filter((s) => s.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSubmit = () => {
    console.info('Submitting document:', {
      title: documentTitle,
      type: documentType,
      folder: selectedFolder,
      confidentiality,
      description,
      enableTrackChanges,
      mainFile,
      annexes,
      tags,
      metadataValues,
      expirationDate,
      amount,
      reference,
      selectedWorkflow,
      launchWorkflowNow,
      fastTrack,
      externalSignatories,
    });
    onClose();
  };

  const tabs = [
    { key: 'document', label: 'Document', count: mainFile ? 1 : 0 },
    { key: 'annexes', label: 'Annexes', count: annexes.length },
    {
      key: 'metadata',
      label: 'Metadonnees',
      count: tags.length + metadataValues.filter((m) => m.value).length,
    },
    { key: 'workflow', label: 'Workflow', count: selectedWorkflow ? 1 : 0 },
    { key: 'signatories', label: 'Signataires', count: externalSignatories.length },
  ];

  const isValid = mainFile && documentTitle.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('documents.newDocument', 'Nouveau document')}
      size="xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Tabs */}
        <div className="border-b border-advist-border flex-shrink-0">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-240 relative
                  ${
                    activeTab === tab.key
                      ? 'text-advist-gray900 border-b-2 border-advist-dark'
                      : 'text-advist-gray900/80 hover:text-advist-gray900'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-advist-surface-dark rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Document Tab */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <Input
                label={t('documents.documentTitle', 'Titre du document')}
                placeholder={t('documents.titlePlaceholder', 'Ex: Contrat de prestation')}
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-1">
                    {t('documents.documentType', 'Type de document')} *
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-2 border border-advist-blue-light rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  >
                    <option value="">{t('documents.selectType', 'Selectionner un type')}</option>
                    <option value="1">{t('documents.types.contract', 'Contrat')}</option>
                    <option value="2">{t('documents.types.invoice', 'Facture')}</option>
                    <option value="3">{t('documents.types.report', 'Rapport')}</option>
                    <option value="4">Bon de commande</option>
                    <option value="5">Avenant</option>
                    <option value="6">Note interne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-1">
                    {t('documents.folder', 'Dossier')}
                  </label>
                  <select
                    value={selectedFolder}
                    onChange={(e) =>
                      setSelectedFolder(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-4 py-2 border border-advist-blue-light rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  >
                    <option value="">{t('documents.noFolder', 'Aucun dossier')}</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Confidentiality level */}
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  {t('documents.confidentiality', 'Niveau de confidentialite')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'public', label: 'Public', icon: '🌍' },
                    { value: 'internal', label: 'Interne', icon: '🏢' },
                    { value: 'confidential', label: 'Confidentiel', icon: '🔒' },
                    { value: 'secret', label: 'Secret', icon: '🔐' },
                  ].map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setConfidentiality(level.value as typeof confidentiality)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-center ${
                        confidentiality === level.value
                          ? 'border-advist-dark bg-advist-surface-dark'
                          : 'border-advist-border hover:border-advist-blue-light'
                      }`}
                    >
                      <span className="text-lg block mb-1">{level.icon}</span>
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  {t('documents.file', 'Fichier principal')} *
                </label>
                {mainFile ? (
                  <div className="flex items-center gap-3 p-4 border border-advist-border rounded-xl bg-advist-bg">
                    <div className="p-3 bg-white rounded-xl">
                      <FileText size={24} className="text-advist-gray900/80" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-advist-gray900">{mainFile.name}</p>
                      <p className="text-sm text-advist-blue-light">
                        {formatFileSize(mainFile.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMainFile(null)}
                      className="text-advist-error"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center transition-all duration-240 cursor-pointer
                      ${dragActive ? 'border-advist-dark bg-advist-surface-dark' : 'border-advist-blue-light hover:border-advist-dark'}
                    `}
                    onDragEnter={(e) => handleDrag(e)}
                    onDragLeave={(e) => handleDrag(e)}
                    onDragOver={(e) => handleDrag(e)}
                    onDrop={(e) => handleDrop(e)}
                    onClick={() => document.getElementById('mainFileInput')?.click()}
                  >
                    <input
                      id="mainFileInput"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      onChange={(e) => handleFileSelect(e)}
                    />
                    <FileText size={48} className="mx-auto text-advist-blue-light mb-4" />
                    <p className="text-advist-gray900">
                      Glissez-deposez votre fichier ici ou{' '}
                      <span className="font-medium underline">parcourir</span>
                    </p>
                    <p className="text-sm text-advist-blue-light mt-2">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX jusqu'a 100 MB
                    </p>
                  </div>
                )}
              </div>

              {/* Track changes option */}
              <div className="flex items-center gap-3 p-3 bg-advist-surface-dark/50 rounded-xl">
                <input
                  type="checkbox"
                  id="trackChanges"
                  checked={enableTrackChanges}
                  onChange={(e) => setEnableTrackChanges(e.target.checked)}
                  className="rounded border-advist-border text-advist-gray900 focus:ring-advist-gold"
                />
                <label htmlFor="trackChanges" className="flex-1 cursor-pointer">
                  <span className="font-medium text-advist-gray900">
                    Activer le suivi des modifications
                  </span>
                  <p className="text-xs text-advist-gray900/80">
                    Toutes les modifications seront tracees avec identification de l'auteur
                  </p>
                </label>
                <History size={20} className="text-advist-blue-light" />
              </div>

              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-advist-blue-light rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  placeholder="Description du document..."
                />
              </div>
            </div>
          )}

          {/* Annexes Tab */}
          {activeTab === 'annexes' && (
            <div className="space-y-4">
              <div className="p-3 bg-advist-gold-light rounded-xl text-sm text-advist-gray900">
                <strong>Pieces jointes:</strong> Ajoutez les annexes, avenants ou documents
                complementaires lies a ce document principal.
              </div>

              {/* Annexes list */}
              {annexes.length > 0 && (
                <div className="space-y-3">
                  {annexes.map((annex, index) => (
                    <div
                      key={annex.id}
                      className="flex items-start gap-3 p-4 border border-advist-border rounded-xl"
                    >
                      <div className="p-2 bg-advist-surface-dark rounded-xl">
                        <FileText size={20} className="text-advist-gray900/80" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm">
                            Annexe {index + 1}
                          </Badge>
                          <p className="font-medium text-advist-gray900">{annex.name}</p>
                          <span className="text-xs text-advist-blue-light">
                            ({formatFileSize(annex.size)})
                          </span>
                        </div>
                        <input
                          type="text"
                          value={annex.description}
                          onChange={(e) => updateAnnexDescription(annex.id, e.target.value)}
                          placeholder="Description de l'annexe..."
                          className="w-full mt-2 px-3 py-1.5 text-sm border border-advist-border rounded focus:outline-none focus:ring-1 focus:ring-advist-gold"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnnex(annex.id)}
                        className="text-advist-error"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add annexes zone */}
              <div
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center transition-all duration-240 cursor-pointer
                  ${annexDragActive ? 'border-advist-dark bg-advist-surface-dark' : 'border-advist-blue-light hover:border-advist-dark'}
                `}
                onDragEnter={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, true)}
                onDragOver={(e) => handleDrag(e, true)}
                onDrop={(e) => handleDrop(e, true)}
                onClick={() => document.getElementById('annexFileInput')?.click()}
              >
                <input
                  id="annexFileInput"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => handleFileSelect(e, true)}
                />
                <Plus size={32} className="mx-auto text-advist-blue-light mb-2" />
                <p className="text-advist-gray900 font-medium">Ajouter des annexes</p>
                <p className="text-sm text-advist-blue-light mt-1">
                  Glissez-deposez ou cliquez pour ajouter des fichiers
                </p>
              </div>

              {annexes.length === 0 && (
                <div className="text-center py-8 text-advist-blue-light">
                  <LinkIcon size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Aucune annexe ajoutee</p>
                </div>
              )}
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-advist-error"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={addTag}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {/* Common metadata */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Reference interne"
                  placeholder="REF-2024-001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <Input
                  label="Montant (FCFA)"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <Input
                label="Date d'expiration"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />

              {/* Type-specific metadata */}
              {metadataFields.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-advist-gray900 border-b border-advist-border pb-2">
                    Metadonnees specifiques ({documentType === '1' ? 'Contrat' : 'Facture'})
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {metadataFields.map((field) => (
                      <Input
                        key={field.id}
                        label={field.name + (field.required ? ' *' : '')}
                        type={field.type === 'date' ? 'date' : 'text'}
                        placeholder={`Saisir ${field.name.toLowerCase()}...`}
                        value={metadataValues.find((m) => m.fieldId === field.id)?.value || ''}
                        onChange={(e) => {
                          const existing = metadataValues.find((m) => m.fieldId === field.id);
                          if (existing) {
                            setMetadataValues(
                              metadataValues.map((m) =>
                                m.fieldId === field.id ? { ...m, value: e.target.value } : m
                              )
                            );
                          } else {
                            setMetadataValues([
                              ...metadataValues,
                              {
                                fieldId: field.id,
                                fieldName: field.name,
                                value: e.target.value,
                              },
                            ]);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-3 bg-advist-surface-dark rounded-xl text-sm text-advist-gray900">
                <strong>Workflow:</strong> Selectionnez un modele de workflow pour declencher
                automatiquement le processus de validation et signature.
              </div>

              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Modele de workflow
                </label>
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <label
                      key={workflow.id}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedWorkflow === String(workflow.id)
                          ? 'border-advist-dark bg-advist-surface-dark'
                          : 'border-advist-border hover:border-advist-blue-light'
                      }`}
                    >
                      <input
                        type="radio"
                        name="workflow"
                        value={workflow.id}
                        checked={selectedWorkflow === String(workflow.id)}
                        onChange={(e) => setSelectedWorkflow(e.target.value)}
                        className="text-advist-gray900"
                      />
                      <GitBranch size={20} className="text-advist-gray900/80" />
                      <div className="flex-1">
                        <p className="font-medium text-advist-gray900">{workflow.name}</p>
                        <p className="text-xs text-advist-blue-light">{workflow.steps} etapes</p>
                      </div>
                    </label>
                  ))}
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedWorkflow === ''
                        ? 'border-advist-dark bg-advist-surface-dark'
                        : 'border-advist-border hover:border-advist-blue-light'
                    }`}
                  >
                    <input
                      type="radio"
                      name="workflow"
                      value=""
                      checked={selectedWorkflow === ''}
                      onChange={() => setSelectedWorkflow('')}
                      className="text-advist-gray900"
                    />
                    <X size={20} className="text-advist-blue-light" />
                    <div className="flex-1">
                      <p className="font-medium text-advist-gray900">Sans workflow</p>
                      <p className="text-xs text-advist-blue-light">
                        Le document sera cree en brouillon
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {selectedWorkflow && (
                <div className="space-y-3 p-4 bg-advist-bg rounded-xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="launchNow"
                      checked={launchWorkflowNow}
                      onChange={(e) => setLaunchWorkflowNow(e.target.checked)}
                      className="rounded border-advist-border text-advist-gray900"
                    />
                    <label htmlFor="launchNow" className="text-sm text-advist-gray900">
                      Demarrer le workflow immediatement apres la creation
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fastTrack"
                      checked={fastTrack}
                      onChange={(e) => setFastTrack(e.target.checked)}
                      className="rounded border-advist-border text-advist-gray900"
                    />
                    <label
                      htmlFor="fastTrack"
                      className="text-sm text-advist-gray900 flex items-center gap-1"
                    >
                      <Zap size={14} className="text-advist-gold-dark" />
                      Mode urgent (Fast-Track)
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Signatories Tab */}
          {activeTab === 'signatories' && (
            <div className="space-y-4">
              <div className="p-3 bg-advist-gold-light rounded-xl text-sm text-advist-gold-dark">
                <strong>Signataires externes:</strong> Ajoutez des personnes externes a votre
                organisation qui devront signer ou valider ce document.
              </div>

              {/* Existing signatories */}
              {externalSignatories.length > 0 && (
                <div className="space-y-2">
                  {externalSignatories.map((signatory, index) => (
                    <div
                      key={signatory.id}
                      className="flex items-center gap-3 p-3 border border-advist-border rounded-xl"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-advist-surface-dark rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <Avatar name={`${signatory.firstName} ${signatory.lastName}`} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium text-advist-gray900">
                          {signatory.firstName} {signatory.lastName}
                        </p>
                        <p className="text-xs text-advist-blue-light">
                          {signatory.email} {signatory.company && `• ${signatory.company}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          signatory.role === 'signer'
                            ? 'primary'
                            : signatory.role === 'validator'
                              ? 'success'
                              : 'secondary'
                        }
                        size="sm"
                      >
                        {signatory.role === 'signer'
                          ? 'Signataire'
                          : signatory.role === 'validator'
                            ? 'Validateur'
                            : 'Observateur'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSignatory(signatory.id)}
                        className="text-advist-error"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add signatory form */}
              <div className="p-4 border border-advist-border rounded-xl space-y-4">
                <h4 className="font-medium text-advist-gray900">Ajouter un signataire externe</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prenom"
                    value={newSignatory.firstName}
                    onChange={(e) =>
                      setNewSignatory({ ...newSignatory, firstName: e.target.value })
                    }
                    placeholder="Jean"
                  />
                  <Input
                    label="Nom"
                    value={newSignatory.lastName}
                    onChange={(e) => setNewSignatory({ ...newSignatory, lastName: e.target.value })}
                    placeholder="Dupont"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={newSignatory.email}
                    onChange={(e) => setNewSignatory({ ...newSignatory, email: e.target.value })}
                    placeholder="jean@entreprise.com"
                  />
                  <Input
                    label="Entreprise (optionnel)"
                    value={newSignatory.company}
                    onChange={(e) => setNewSignatory({ ...newSignatory, company: e.target.value })}
                    placeholder="Entreprise SA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-advist-gray900 mb-1">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'signer', label: 'Signataire', desc: 'Doit signer le document' },
                      { value: 'validator', label: 'Validateur', desc: 'Approuve le document' },
                      { value: 'observer', label: 'Observateur', desc: 'Consultation uniquement' },
                    ].map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() =>
                          setNewSignatory({
                            ...newSignatory,
                            role: role.value as ExternalSignatory['role'],
                          })
                        }
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          newSignatory.role === role.value
                            ? 'border-advist-dark bg-advist-surface-dark'
                            : 'border-advist-border hover:border-advist-blue-light'
                        }`}
                      >
                        <span className="text-sm font-medium text-advist-gray900 block">
                          {role.label}
                        </span>
                        <span className="text-xs text-advist-blue-light">{role.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={addExternalSignatory}
                  disabled={
                    !newSignatory.email || !newSignatory.firstName || !newSignatory.lastName
                  }
                  className="w-full"
                >
                  <UserPlus size={16} className="mr-2" />
                  Ajouter le signataire
                </Button>
              </div>

              {externalSignatories.length === 0 && (
                <div className="text-center py-4 text-advist-blue-light">
                  <Users size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Aucun signataire externe ajoute</p>
                  <p className="text-xs">Les signataires internes seront definis par le workflow</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-advist-border flex-shrink-0 px-4 pb-4">
          <div className="text-sm text-advist-blue-light">
            {mainFile ? '1 fichier' : '0 fichier'} • {annexes.length} annexe(s) •{' '}
            {externalSignatories.length} signataire(s) externe(s)
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button leftIcon={<Plus size={18} />} onClick={handleSubmit} disabled={!isValid}>
              Creer le document
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// v2: Create folder modal
const CreateFolderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  parentFolder?: DocumentFolder | null;
}> = ({ isOpen, onClose, parentFolder }) => {
  const { t } = useTranslation();
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('documents.createFolder', 'Créer un dossier')}
      size="md"
    >
      <div className="space-y-4">
        {parentFolder && (
          <div className="flex items-center gap-2 p-3 bg-advist-surface-dark/50 rounded-xl text-sm">
            <FolderOpen size={16} className="text-advist-gray900" />
            <span className="text-advist-gray900/80">
              {t('documents.insideFolder', 'Dans le dossier:')}
            </span>
            <span className="font-medium text-advist-gray900">{parentFolder.name}</span>
          </div>
        )}

        <Input
          label={t('documents.folderName', 'Nom du dossier')}
          placeholder={t('documents.folderNamePlaceholder', 'Ex: Contrats 2024')}
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-advist-gray900 mb-1">
            {t('documents.description', 'Description (optionnel)')}
          </label>
          <textarea
            rows={2}
            value={folderDescription}
            onChange={(e) => setFolderDescription(e.target.value)}
            className="w-full px-4 py-2 border border-advist-blue-light rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
            placeholder={t('documents.folderDescPlaceholder', 'Description du dossier...')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Annuler')}
          </Button>
          <Button leftIcon={<FolderPlus size={18} />} disabled={!folderName.trim()}>
            {t('documents.createFolder', 'Créer le dossier')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Duplicate alert modal
const DuplicateAlertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  duplicateOf?: DocumentWithFolder | null;
}> = ({ isOpen, onClose, duplicateOf }) => {
  const { t } = useTranslation();

  if (!duplicateOf) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('documents.duplicateDetected', 'Doublon détecté')}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-advist-warning-light rounded-xl border border-advist-warning/30">
          <AlertTriangle size={24} className="text-advist-gray900 shrink-0" />
          <div>
            <p className="font-medium text-advist-gray900">
              {t('documents.duplicateWarning', 'Ce fichier semble être un doublon')}
            </p>
            <p className="text-sm text-advist-gray900/80 mt-1">
              {t(
                'documents.duplicateDesc',
                'Un document avec le même contenu existe déjà dans le système.'
              )}
            </p>
          </div>
        </div>

        <div className="p-4 bg-advist-surface-dark/50 rounded-xl">
          <p className="text-sm font-medium text-advist-gray900 mb-2">
            {t('documents.existingDocument', 'Document existant:')}
          </p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl">
              <FileText size={20} className="text-advist-gray900/80" />
            </div>
            <div>
              <p className="font-medium text-advist-gray900">{duplicateOf.title}</p>
              <p className="text-xs text-advist-gray900/80">
                {t('documents.createdBy', 'Créé par')} {duplicateOf.owner.first_name}{' '}
                {duplicateOf.owner.last_name}
                {' • '}
                {new Date(duplicateOf.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Annuler')}
          </Button>
          <Button variant="outline" leftIcon={<Eye size={18} />}>
            {t('documents.viewExisting', "Voir l'existant")}
          </Button>
          <Button leftIcon={<Plus size={18} />}>
            {t('documents.uploadAnyway', 'Importer quand même')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Document links modal
const DocumentLinksModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  document: DocumentWithFolder;
}> = ({ isOpen, onClose, document }) => {
  const { t } = useTranslation();
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkType, setLinkType] = useState<'parent_child' | 'reference' | 'amendment' | 'annex'>(
    'reference'
  );

  const linkTypeLabels = {
    parent_child: t('documents.linkTypes.parentChild', 'Parent/Enfant'),
    reference: t('documents.linkTypes.reference', 'Référence'),
    amendment: t('documents.linkTypes.amendment', 'Avenant'),
    annex: t('documents.linkTypes.annex', 'Annexe'),
  };

  const linkTypeColors = {
    parent_child: 'bg-advist-gold-light/20 text-advist-gray900/80',
    reference: 'bg-advist-gold-light/20 text-advist-gray900/80',
    amendment: 'bg-primary-100 text-advist-gold-dark',
    annex: 'bg-primary-100 text-advist-gray900',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('documents.documentLinks', 'Documents liés')}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-advist-surface-dark/50 rounded-xl">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-advist-gray900/80" />
            <span className="font-medium text-advist-gray900">{document.title}</span>
          </div>
          <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowAddLink(true)}>
            {t('documents.addLink', 'Ajouter un lien')}
          </Button>
        </div>

        {showAddLink && (
          <div className="p-4 border border-advist-border rounded-xl space-y-3">
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1">
                {t('documents.linkType', 'Type de lien')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(linkTypeLabels) as Array<keyof typeof linkTypeLabels>).map((type) => (
                  <button
                    key={type}
                    onClick={() => setLinkType(type)}
                    className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      linkType === type
                        ? `${linkTypeColors[type]} border-current`
                        : 'border-advist-border text-advist-gray900/80'
                    }`}
                  >
                    {linkTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label={t('documents.searchDocument', 'Rechercher un document')}
              placeholder={t('documents.searchPlaceholder', 'Tapez pour rechercher...')}
              leftIcon={<Search size={18} />}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddLink(false)}>
                {t('common.cancel', 'Annuler')}
              </Button>
              <Button size="sm" leftIcon={<LinkIcon size={16} />}>
                {t('documents.createLink', 'Créer le lien')}
              </Button>
            </div>
          </div>
        )}

        {/* Existing links */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-advist-gray900">
            {t('documents.existingLinks', 'Liens existants')}
          </h4>
          {document.linked_documents.length === 0 ? (
            <p className="text-sm text-advist-blue-light text-center py-4">
              {t('documents.noLinks', 'Aucun document lié')}
            </p>
          ) : (
            document.linked_documents.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 border border-advist-border rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-advist-surface-dark rounded-xl">
                    <FileText size={16} className="text-advist-gray900/80" />
                  </div>
                  <div>
                    <p className="font-medium text-advist-gray900">
                      Document #{link.target_document}
                    </p>
                    <Badge size="sm" className={linkTypeColors[link.link_type]}>
                      {linkTypeLabels[link.link_type]}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <ExternalLink size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-advist-gray900/70">
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-advist-border">
          <Button variant="ghost" onClick={onClose}>
            {t('common.close', 'Fermer')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Comments modal
const CommentsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  document: DocumentWithFolder;
}> = ({ isOpen, onClose, document }) => {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // Mock comments
  const comments: DocumentComment[] = [
    {
      id: 1,
      document: document.id,
      user: {
        id: 1,
        first_name: 'Marie',
        last_name: 'Dupont',
        email: 'marie@example.com',
        role: 'manager',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
        color: '#4F46E5',
      },
      content: 'Il faudrait revoir la clause 3.2 concernant les délais de paiement.',
      replies: [
        {
          id: 2,
          document: document.id,
          user: {
            id: 2,
            first_name: 'Jean',
            last_name: 'Martin',
            email: 'jean@example.com',
            role: 'user',
            organization: null,
            is_active: true,
            is_org_admin: false,
            language: 'fr',
            timezone: 'Europe/Paris',
            created_at: '',
            color: '#059669',
          },
          content: "D'accord, je m'en occupe. Quel délai suggères-tu ?",
          replies: [],
          mentions: [],
          is_resolved: false,
          created_at: '2024-11-26T10:30:00Z',
          updated_at: '2024-11-26T10:30:00Z',
        },
      ],
      mentions: [],
      is_resolved: false,
      created_at: '2024-11-26T09:00:00Z',
      updated_at: '2024-11-26T09:00:00Z',
    },
    {
      id: 3,
      document: document.id,
      user: {
        id: 3,
        first_name: 'Sophie',
        last_name: 'Laurent',
        email: 'sophie@example.com',
        role: 'manager',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
        color: '#F59E0B',
      },
      content: 'Validation terminée de mon côté. Tout est conforme.',
      replies: [],
      mentions: [],
      is_resolved: true,
      resolved_by: {
        id: 3,
        first_name: 'Sophie',
        last_name: 'Laurent',
        email: 'sophie@example.com',
        role: 'manager',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
      },
      resolved_at: '2024-11-26T14:00:00Z',
      created_at: '2024-11-26T11:00:00Z',
      updated_at: '2024-11-26T14:00:00Z',
    },
  ];

  const renderComment = (comment: DocumentComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : ''}`}>
      <div
        className={`p-3 rounded-xl ${comment.is_resolved ? 'bg-green-50 border border-advist-success' : 'bg-advist-surface-dark/50'}`}
      >
        <div className="flex items-start gap-3">
          <Avatar
            name={`${comment.user.first_name} ${comment.user.last_name}`}
            size="sm"
            className="shrink-0"
            style={{ borderColor: comment.user.color, borderWidth: 2 }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-advist-gray900">
                {comment.user.first_name} {comment.user.last_name}
              </span>
              <span className="text-xs text-advist-blue-light">
                {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {comment.is_resolved && (
                <Badge variant="success" size="sm">
                  <Check size={10} className="mr-1" />
                  {t('documents.resolved', 'Résolu')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-advist-gray900/80 mt-1">{comment.content}</p>
            {!comment.is_resolved && !isReply && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs text-advist-gray900/80 hover:text-advist-gray900"
                >
                  {t('documents.reply', 'Répondre')}
                </button>
                <button className="text-xs text-advist-gray900 hover:text-advist-gray900">
                  {t('documents.markResolved', 'Marquer comme résolu')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {comment.replies.map((reply) => renderComment(reply, true))}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-2 flex gap-2">
          <Input
            placeholder={t('documents.writeReply', 'Écrire une réponse...')}
            className="flex-1"
          />
          <Button size="sm" onClick={() => setReplyingTo(null)}>
            {t('documents.send', 'Envoyer')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('documents.comments', 'Commentaires')}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-advist-surface-dark/50 rounded-xl">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-advist-gray900/80" />
            <span className="font-medium text-advist-gray900">{document.title}</span>
          </div>
          <Badge variant="secondary">
            {comments.length} {t('documents.commentsCount', 'commentaire(s)')}
          </Badge>
        </div>

        {/* Add comment */}
        <div className="flex gap-3 p-3 border border-advist-border rounded-xl">
          <Avatar name="Vous" size="sm" />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t(
                'documents.writeComment',
                "Ajouter un commentaire... Utilisez @ pour mentionner quelqu'un"
              )}
              className="w-full p-2 border border-advist-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-advist-gold"
              rows={2}
            />
            <div className="flex justify-between items-center mt-2">
              <button className="text-sm text-advist-gray900/80 hover:text-advist-gray900 flex items-center gap-1">
                <Users size={14} />
                {t('documents.mention', 'Mentionner')}
              </button>
              <Button size="sm" disabled={!newComment.trim()}>
                {t('documents.comment', 'Commenter')}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => renderComment(comment))}
        </div>

        <div className="flex justify-end pt-4 border-t border-advist-border">
          <Button variant="ghost" onClick={onClose}>
            {t('common.close', 'Fermer')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// v2: Track changes modal
const TrackChangesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  document: DocumentWithFolder;
}> = ({ isOpen, onClose, document }) => {
  const { t } = useTranslation();

  // Mock modifications with user colors
  const modifications: (DocumentModification & { user: { color?: string } })[] = [
    {
      id: 1,
      document: document.id,
      version: 2,
      user: {
        id: 1,
        first_name: 'Marie',
        last_name: 'Dupont',
        email: 'marie@example.com',
        role: 'manager',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
        color: '#4F46E5',
      },
      modification_type: 'addition',
      page: 3,
      position_start: 100,
      position_end: 200,
      new_content:
        'Article 5 - Conditions de paiement modifiées pour inclure un délai de 45 jours.',
      is_formula_protected: false,
      status: 'pending',
      created_at: '2024-11-26T14:30:00Z',
    },
    {
      id: 2,
      document: document.id,
      version: 2,
      user: {
        id: 2,
        first_name: 'Jean',
        last_name: 'Martin',
        email: 'jean@example.com',
        role: 'user',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
        color: '#059669',
      },
      modification_type: 'deletion',
      page: 1,
      position_start: 50,
      position_end: 80,
      original_content: 'Paragraphe initial supprimé',
      is_formula_protected: false,
      status: 'accepted',
      reviewed_by: {
        id: 3,
        first_name: 'Sophie',
        last_name: 'Laurent',
        email: 'sophie@example.com',
        role: 'manager',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
      },
      reviewed_at: '2024-11-26T15:00:00Z',
      created_at: '2024-11-26T10:00:00Z',
    },
    {
      id: 3,
      document: document.id,
      version: 2,
      user: {
        id: 3,
        first_name: 'Sophie',
        last_name: 'Laurent',
        email: 'sophie@example.com',
        role: 'manager',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
        color: '#F59E0B',
      },
      modification_type: 'replacement',
      page: 2,
      position_start: 200,
      position_end: 250,
      original_content: '30 jours',
      new_content: '45 jours',
      is_formula_protected: false,
      status: 'rejected',
      reviewed_by: {
        id: 1,
        first_name: 'Marie',
        last_name: 'Dupont',
        email: 'marie@example.com',
        role: 'manager',
        organization: null,
        is_active: true,
        is_org_admin: false,
        language: 'fr',
        timezone: 'Europe/Paris',
        created_at: '',
      },
      reviewed_at: '2024-11-26T16:00:00Z',
      created_at: '2024-11-26T11:00:00Z',
    },
  ];

  const modificationTypeLabels = {
    addition: {
      label: t('documents.modification.addition', 'Ajout'),
      color: 'bg-primary-100 text-advist-gray900',
      icon: Plus,
    },
    deletion: {
      label: t('documents.modification.deletion', 'Suppression'),
      color: 'bg-advist-bg text-advist-gray900/70',
      icon: X,
    },
    replacement: {
      label: t('documents.modification.replacement', 'Remplacement'),
      color: 'bg-primary-100 text-advist-gold-dark',
      icon: GitBranch,
    },
  };

  const statusLabels = {
    pending: {
      label: t('documents.status.pending', 'En attente'),
      color: 'bg-primary-100 text-advist-gold-dark',
    },
    accepted: {
      label: t('documents.status.accepted', 'Accepté'),
      color: 'bg-primary-100 text-advist-gray900',
    },
    rejected: {
      label: t('documents.status.rejected', 'Rejeté'),
      color: 'bg-advist-bg text-advist-gray900/70',
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('documents.trackChanges', 'Suivi des modifications')}
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-advist-surface-dark/50 rounded-xl">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-advist-gray900/80" />
            <span className="font-medium text-advist-gray900">{document.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {modifications.filter((m) => m.status === 'pending').length}{' '}
              {t('documents.pendingChanges', 'en attente')}
            </Badge>
            <Badge variant="success">{t('documents.trackingActive', 'Suivi actif')}</Badge>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 p-2 border border-advist-border rounded-xl">
          <span className="text-sm text-advist-gray900/80">
            {t('documents.legend', 'Légende')}:
          </span>
          {Object.entries(modificationTypeLabels).map(([key, { label, color, icon: Icon }]) => (
            <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded ${color}`}>
              <Icon size={12} />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* Modifications list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {modifications.map((mod) => {
            const typeInfo = modificationTypeLabels[mod.modification_type];
            const StatusIcon = typeInfo.icon;
            const statusInfo = statusLabels[mod.status];

            return (
              <div
                key={mod.id}
                className="p-4 border rounded-xl"
                style={{ borderLeftColor: mod.user.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded ${typeInfo.color}`}>
                      <StatusIcon size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-advist-gray900">
                          {mod.user.first_name} {mod.user.last_name}
                        </span>
                        <Badge size="sm" className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <Badge size="sm" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        {mod.page && (
                          <span className="text-xs text-advist-blue-light">
                            {t('documents.page', 'Page')} {mod.page}
                          </span>
                        )}
                      </div>

                      {/* Content display */}
                      <div className="mt-2 text-sm">
                        {mod.modification_type === 'deletion' && mod.original_content && (
                          <div className="p-2 bg-advist-bg rounded text-advist-gray900/70 line-through">
                            {mod.original_content}
                          </div>
                        )}
                        {mod.modification_type === 'addition' && mod.new_content && (
                          <div className="p-2 bg-primary-100 rounded text-advist-gray900">
                            {mod.new_content}
                          </div>
                        )}
                        {mod.modification_type === 'replacement' && (
                          <div className="space-y-1">
                            {mod.original_content && (
                              <div className="p-2 bg-advist-bg rounded text-advist-gray900/70 line-through">
                                {mod.original_content}
                              </div>
                            )}
                            {mod.new_content && (
                              <div className="p-2 bg-primary-100 rounded text-advist-gray900">
                                {mod.new_content}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-advist-blue-light">
                        <span>
                          {new Date(mod.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {mod.reviewed_by && (
                          <span>
                            •{' '}
                            {mod.status === 'accepted'
                              ? t('documents.acceptedBy', 'Accepté par')
                              : t('documents.rejectedBy', 'Rejeté par')}{' '}
                            {mod.reviewed_by.first_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for pending modifications */}
                  {mod.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-advist-gray900 hover:bg-primary-100"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-advist-gray900/70 hover:bg-advist-bg"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-advist-border">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Check size={16} />}>
              {t('documents.acceptAll', 'Tout accepter')}
            </Button>
            <Button variant="outline" size="sm" leftIcon={<X size={16} />}>
              {t('documents.rejectAll', 'Tout rejeter')}
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose}>
            {t('common.close', 'Fermer')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentsPage;
