/**
 * Interactive Document Demo Component
 * Professional document management simulation
 */
import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Folder,
  Search,
  _Filter,
  Grid,
  List,
  _MoreVertical,
  Download,
  Share2,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  File,
  FileSpreadsheet,
  FileImage,
  Sparkles,
  Play,
  FolderOpen,
  Tag,
  Calendar,
  User,
  ChevronRight,
  Star,
  RotateCcw,
  Check,
  ArrowUpRight,
} from 'lucide-react';

interface Document {
  id: number;
  name: string;
  type: 'pdf' | 'excel' | 'image' | 'doc';
  size: string;
  status: 'approved' | 'pending' | 'draft';
  date: string;
  owner: string;
  starred?: boolean;
  tags?: string[];
}

const initialDocuments: Document[] = [
  {
    id: 1,
    name: 'Contrat_Fournisseur_2026.pdf',
    type: 'pdf',
    size: '2.4 MB',
    status: 'approved',
    date: '15 Déc 2026',
    owner: 'Marie Koné',
    starred: true,
    tags: ['Contrat', 'Urgent'],
  },
  {
    id: 2,
    name: 'Budget_Q4_2026.xlsx',
    type: 'excel',
    size: '1.8 MB',
    status: 'pending',
    date: '14 Déc 2026',
    owner: 'Jean Diallo',
    tags: ['Finance'],
  },
  {
    id: 3,
    name: 'Presentation_Client.pdf',
    type: 'pdf',
    size: '5.2 MB',
    status: 'draft',
    date: '13 Déc 2026',
    owner: 'Aminata Sow',
    tags: ['Commercial'],
  },
  {
    id: 4,
    name: 'Facture_INV-2026-001.pdf',
    type: 'pdf',
    size: '0.8 MB',
    status: 'approved',
    date: '12 Déc 2026',
    owner: 'Marie Koné',
    tags: ['Comptabilité'],
  },
  {
    id: 5,
    name: 'Logo_Entreprise_HD.png',
    type: 'image',
    size: '0.3 MB',
    status: 'approved',
    date: '10 Déc 2026',
    owner: 'Design Team',
    starred: true,
  },
  {
    id: 6,
    name: 'Rapport_Annuel_2026.pdf',
    type: 'pdf',
    size: '8.1 MB',
    status: 'pending',
    date: '08 Déc 2026',
    owner: 'Jean Diallo',
    tags: ['Rapport', 'Direction'],
  },
];

type ViewStep = 'intro' | 'browse' | 'upload' | 'preview';

export const InteractiveDocumentDemo: React.FC = () => {
  const [step, setStep] = useState<ViewStep>('intro');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const stats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === 'approved').length,
    pending: documents.filter((d) => d.status === 'pending').length,
    totalSize: '18.6 MB',
  };

  const getFileIcon = (type: string, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    switch (type) {
      case 'pdf':
        return <FileText className={`${sizeClass} text-red-500`} />;
      case 'excel':
        return <FileSpreadsheet className={`${sizeClass} text-gray-900`} />;
      case 'image':
        return <FileImage className={`${sizeClass} text-gray-900`} />;
      default:
        return <File className={`${sizeClass} text-gray-500`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Approuvé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" /> Brouillon
          </span>
        );
      default:
        return null;
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !activeFilter || doc.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      setUploadProgress(i);
    }

    const newDoc: Document = {
      id: documents.length + 1,
      name: 'Nouveau_Document_Import.pdf',
      type: 'pdf',
      size: '1.2 MB',
      status: 'draft',
      date: "Aujourd'hui",
      owner: 'Vous',
      tags: ['Nouveau'],
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsUploading(false);
    setUploadProgress(0);
    setStep('browse');
  };

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
    setStep('preview');
  };

  const resetDemo = () => {
    setStep('intro');
    setDocuments(initialDocuments);
    setSelectedDocs([]);
    setSearchQuery('');
    setActiveFilter(null);
  };

  // Introduction Screen
  if (step === 'intro') {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200">
              <Folder className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Gestion documentaire</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Explorez une interface intuitive pour gérer, organiser et retrouver vos documents.
          </p>
        </div>

        {/* Features Preview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Fonctionnalités clés</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Upload, label: 'Import facile', desc: 'Glisser-déposer' },
              { icon: Search, label: 'Recherche rapide', desc: 'Filtres avancés' },
              { icon: Tag, label: 'Tags & dossiers', desc: 'Organisation flexible' },
              { icon: Eye, label: 'Prévisualisation', desc: 'Aperçu instantané' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 text-white text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-100">Documents</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-white text-center">
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className="text-xs text-green-100">Approuvés</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-white text-center">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-gray-100">En attente</p>
          </div>
        </div>

        <button
          onClick={() => setStep('browse')}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
        >
          <Play className="w-5 h-5" />
          Explorer l'interface
        </button>
      </div>
    );
  }

  // Document Preview
  if (step === 'preview' && previewDoc) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <button
          onClick={() => setStep('browse')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Retour à la liste
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Document Header */}
          <div className="bg-gray-50 p-6 border-b">
            <div className="flex items-start gap-4">
              <div className="w-16 h-20 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                {getFileIcon(previewDoc.type, 'lg')}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{previewDoc.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {previewDoc.owner}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {previewDoc.date}
                  </span>
                </div>
                {getStatusBadge(previewDoc.status)}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="p-6">
            <div className="bg-gray-100 rounded-xl p-8 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6 max-h-48 overflow-hidden relative">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Aperçu du document</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Taille</p>
                <p className="font-medium text-gray-900">{previewDoc.size}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="font-medium text-gray-900 uppercase">{previewDoc.type}</p>
              </div>
            </div>

            {previewDoc.tags && previewDoc.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {previewDoc.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-50 text-gray-800 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Télécharger
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
                Partager
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
                Ouvrir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload View
  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <button
          onClick={() => setStep('browse')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Annuler
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ajouter un document</h3>
            <p className="text-gray-500">Importez vos fichiers en quelques secondes</p>
          </div>

          {isUploading ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-gray-900 animate-pulse" />
              </div>
              <p className="text-gray-900 font-medium mb-4">Téléversement en cours...</p>
              <div className="max-w-xs mx-auto">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div
                className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-gray-400 hover:bg-gray-50/50 transition-all cursor-pointer group"
                onClick={handleUpload}
              >
                <div className="w-16 h-16 bg-gray-100 group-hover:bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
                <p className="text-gray-900 font-medium mb-1">Glissez-déposez vos fichiers ici</p>
                <p className="text-sm text-gray-500 mb-4">ou cliquez pour parcourir</p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span>PDF</span>
                  <span>•</span>
                  <span>Word</span>
                  <span>•</span>
                  <span>Excel</span>
                  <span>•</span>
                  <span>Images</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Taille max: 50 MB</p>
              </div>

              <button
                onClick={handleUpload}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
              >
                <Upload className="w-5 h-5" />
                Simuler un import
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Browse View (Main)
  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Mes Documents</h3>
              <p className="text-white/60 text-sm">
                {documents.length} fichiers • {stats.totalSize}
              </p>
            </div>
          </div>
          <button
            onClick={() => setStep('upload')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-white font-bold text-lg">{stats.total}</p>
            <p className="text-white/60 text-xs">Total</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-green-500 font-bold text-lg">{stats.approved}</p>
            <p className="text-white/60 text-xs">Approuvés</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-gray-400 font-bold text-lg">{stats.pending}</p>
            <p className="text-white/60 text-xs">En attente</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un document..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
          >
            <Grid className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
          >
            <List className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { id: null, label: 'Tous', count: documents.length },
          { id: 'approved', label: 'Approuvés', count: stats.approved },
          { id: 'pending', label: 'En attente', count: stats.pending },
          {
            id: 'draft',
            label: 'Brouillons',
            count: documents.filter((d) => d.status === 'draft').length,
          },
        ].map((filter) => (
          <button
            key={filter.id || 'all'}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${
                activeFilter === filter.id ? 'bg-white/20' : 'bg-gray-200'
              }`}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Actions */}
      {selectedDocs.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
          <span className="text-sm font-medium text-gray-800">
            {selectedDocs.length} sélectionné(s)
          </span>
          <div className="flex gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Télécharger"
            >
              <Download className="w-4 h-4 text-gray-900" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Partager">
              <Share2 className="w-4 h-4 text-gray-900" />
            </button>
            <button className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Supprimer">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
            <button
              onClick={() => setSelectedDocs([])}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Désélectionner"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handlePreview(doc)}
              className={`relative p-4 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-gray-300 ${
                selectedDocs.includes(doc.id) ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
              }`}
            >
              {/* Checkbox */}
              <div
                onClick={(e) => toggleSelect(doc.id, e)}
                className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedDocs.includes(doc.id)
                    ? 'bg-gray-900 border-gray-900'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {selectedDocs.includes(doc.id) && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Star */}
              {doc.starred && (
                <div className="absolute top-3 right-3">
                  <Star className="w-4 h-4 text-gray-400 fill-gray-400" />
                </div>
              )}

              <div className="pt-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                  {getFileIcon(doc.type, 'lg')}
                </div>
                <h4 className="font-medium text-gray-900 text-sm truncate mb-1">{doc.name}</h4>
                <p className="text-xs text-gray-500 mb-2">
                  {doc.size} • {doc.date}
                </p>
                {getStatusBadge(doc.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handlePreview(doc)}
              className={`flex items-center gap-4 p-4 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-gray-300 ${
                selectedDocs.includes(doc.id) ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
              }`}
            >
              {/* Checkbox */}
              <div
                onClick={(e) => toggleSelect(doc.id, e)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  selectedDocs.includes(doc.id)
                    ? 'bg-gray-900 border-gray-900'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {selectedDocs.includes(doc.id) && <Check className="w-3 h-3 text-white" />}
              </div>

              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                {getFileIcon(doc.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{doc.name}</h4>
                  {doc.starred && (
                    <Star className="w-3 h-3 text-gray-400 fill-gray-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {doc.owner} • {doc.date}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {getStatusBadge(doc.status)}
                <span className="text-xs text-gray-400">{doc.size}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun document trouvé</p>
          <p className="text-sm text-gray-400">Modifiez vos filtres ou votre recherche</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <button
          onClick={resetDemo}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer
        </button>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Simulation interactive
        </p>
      </div>
    </div>
  );
};

export default InteractiveDocumentDemo;
