import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Trash2,
  Link as LinkIcon,
  History,
  Users,
  Zap,
  UserPlus,
  X,
} from 'lucide-react';
import { Button, Input, Badge, Modal } from '../ui';
import type { DocumentFolder } from '../../types';

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

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders?: DocumentFolder[];
  onDocumentCreated?: (document: unknown) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  folders = [],
  onDocumentCreated,
}) => {
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
    const documentData = {
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
    };
    console.info('Submitting document:', documentData);
    if (onDocumentCreated) {
      onDocumentCreated(documentData);
    }
    onClose();
  };

  const tabs = [
    { key: 'document', label: t('documents.tabs.document', 'Document'), count: mainFile ? 1 : 0 },
    { key: 'annexes', label: t('documents.tabs.annexes', 'Annexes'), count: annexes.length },
    {
      key: 'metadata',
      label: t('documents.tabs.metadata', 'Metadonnees'),
      count: tags.length + metadataValues.filter((m) => m.value).length,
    },
    {
      key: 'workflow',
      label: t('documents.tabs.workflow', 'Workflow'),
      count: selectedWorkflow ? 1 : 0,
    },
    {
      key: 'signatories',
      label: t('documents.tabs.signatories', 'Signataires'),
      count: externalSignatories.length,
    },
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
                    <option value="4">
                      {t('documents.types.purchaseOrder', 'Bon de commande')}
                    </option>
                    <option value="5">{t('documents.types.amendment', 'Avenant')}</option>
                    <option value="6">{t('documents.types.internalNote', 'Note interne')}</option>
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
                    {
                      value: 'public',
                      label: t('documents.confidentialityLevels.public', 'Public'),
                      icon: '🌍',
                    },
                    {
                      value: 'internal',
                      label: t('documents.confidentialityLevels.internal', 'Interne'),
                      icon: '🏢',
                    },
                    {
                      value: 'confidential',
                      label: t('documents.confidentialityLevels.confidential', 'Confidentiel'),
                      icon: '🔒',
                    },
                    {
                      value: 'secret',
                      label: t('documents.confidentialityLevels.secret', 'Secret'),
                      icon: '🔐',
                    },
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
                      {t('documents.upload.dragDrop', 'Glissez-deposez votre fichier ici ou')}{' '}
                      <span className="font-medium underline">
                        {t('documents.upload.browse', 'parcourir')}
                      </span>
                    </p>
                    <p className="text-sm text-advist-blue-light mt-2">
                      {t(
                        'documents.upload.supportedFormats',
                        "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX jusqu'a 100 MB"
                      )}
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
                    {t('documents.upload.trackChanges', 'Activer le suivi des modifications')}
                  </span>
                  <p className="text-xs text-advist-gray900/80">
                    {t(
                      'documents.upload.trackChangesDesc',
                      "Toutes les modifications seront tracees avec identification de l'auteur"
                    )}
                  </p>
                </label>
                <History size={20} className="text-advist-blue-light" />
              </div>

              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-1">
                  {t('documents.upload.descriptionOptional', 'Description (optionnel)')}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-advist-blue-light rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
                  placeholder={t(
                    'documents.upload.descriptionPlaceholder',
                    'Description du document...'
                  )}
                />
              </div>
            </div>
          )}

          {/* Annexes Tab */}
          {activeTab === 'annexes' && (
            <div className="space-y-4">
              <div className="p-3 bg-advist-gold-light rounded-xl text-sm text-advist-gray900">
                <strong>{t('documents.upload.attachments', 'Pieces jointes:')}</strong>{' '}
                {t(
                  'documents.upload.attachmentsDesc',
                  'Ajoutez les annexes, avenants ou documents complementaires lies a ce document principal.'
                )}
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
                            {t('documents.upload.annex', 'Annexe')} {index + 1}
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
                          placeholder={t(
                            'documents.upload.annexDescPlaceholder',
                            "Description de l'annexe..."
                          )}
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
                <p className="text-advist-gray900 font-medium">
                  {t('documents.upload.addAnnexes', 'Ajouter des annexes')}
                </p>
                <p className="text-sm text-advist-blue-light mt-1">
                  {t(
                    'documents.upload.dropOrClick',
                    'Glissez-deposez ou cliquez pour ajouter des fichiers'
                  )}
                </p>
              </div>

              {annexes.length === 0 && (
                <div className="text-center py-8 text-advist-blue-light">
                  <LinkIcon size={40} className="mx-auto mb-2 opacity-50" />
                  <p>{t('documents.upload.noAnnexes', 'Aucune annexe ajoutee')}</p>
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
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={t('documents.upload.addTag', 'Ajouter un tag...')}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button variant="outline" onClick={addTag} disabled={!newTag.trim()}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {/* Quick metadata */}
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Date d'expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
                <Input
                  label="Montant"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                <Input
                  label="Reference externe"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="REF-001"
                />
              </div>

              {/* Dynamic metadata fields based on document type */}
              {metadataFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-advist-gray900 mb-3">
                    Metadonnees specifiques au type
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {metadataFields.map((field) => (
                      <Input
                        key={field.id}
                        label={`${field.name}${field.required ? ' *' : ''}`}
                        type={field.type}
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
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-advist-gray900 mb-2">
                  Workflow de validation
                </label>
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      type="button"
                      onClick={() => setSelectedWorkflow(String(workflow.id))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedWorkflow === String(workflow.id)
                          ? 'border-advist-dark bg-advist-surface-dark'
                          : 'border-advist-border hover:border-advist-blue-light'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl ${selectedWorkflow === String(workflow.id) ? 'bg-advist-dark' : 'bg-advist-surface-dark'}`}
                      >
                        <Zap
                          size={20}
                          className={
                            selectedWorkflow === String(workflow.id)
                              ? 'text-white'
                              : 'text-advist-gray900'
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-advist-gray900">{workflow.name}</p>
                        <p className="text-sm text-advist-blue-light">{workflow.steps} etapes</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedWorkflow && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-advist-surface-dark/50 rounded-xl">
                    <input
                      type="checkbox"
                      id="launchNow"
                      checked={launchWorkflowNow}
                      onChange={(e) => setLaunchWorkflowNow(e.target.checked)}
                      className="rounded border-advist-border text-advist-gray900 focus:ring-advist-gold"
                    />
                    <label htmlFor="launchNow" className="flex-1 cursor-pointer">
                      <span className="font-medium text-advist-gray900">
                        Lancer le workflow immediatement
                      </span>
                      <p className="text-xs text-advist-gray900/80">
                        Le workflow demarrera des la creation du document
                      </p>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-advist-gold-light rounded-xl">
                    <input
                      type="checkbox"
                      id="fastTrack"
                      checked={fastTrack}
                      onChange={(e) => setFastTrack(e.target.checked)}
                      className="rounded border-advist-border text-advist-gold-dark focus:ring-orange-500"
                    />
                    <label htmlFor="fastTrack" className="flex-1 cursor-pointer">
                      <span className="font-medium text-advist-gold-dark">Mode Fast Track</span>
                      <p className="text-xs text-advist-gold-dark">
                        Priorite haute - Delais reduits de 50%
                      </p>
                    </label>
                    <Zap size={20} className="text-advist-gold-dark" />
                  </div>
                </div>
              )}

              {!selectedWorkflow && (
                <div className="text-center py-8 text-advist-blue-light">
                  <Zap size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Aucun workflow selectionne</p>
                  <p className="text-xs">Le document sera cree en brouillon</p>
                </div>
              )}
            </div>
          )}

          {/* Signatories Tab */}
          {activeTab === 'signatories' && (
            <div className="space-y-6">
              <div className="p-3 bg-advist-gold-light rounded-xl text-sm text-advist-gray900">
                <strong>Signataires externes:</strong> Ajoutez les personnes externes a votre
                organisation qui doivent signer ou valider ce document.
              </div>

              {/* List of external signatories */}
              {externalSignatories.length > 0 && (
                <div className="space-y-2">
                  {externalSignatories.map((sig, index) => (
                    <div
                      key={sig.id}
                      className="flex items-center gap-3 p-3 border border-advist-border rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-advist-gold-light/20 flex items-center justify-center text-advist-gray900 font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-advist-gray900">
                          {sig.firstName} {sig.lastName}
                          {sig.company && (
                            <span className="text-advist-blue-light"> - {sig.company}</span>
                          )}
                        </p>
                        <p className="text-sm text-advist-blue-light">{sig.email}</p>
                      </div>
                      <Badge
                        variant={
                          sig.role === 'signer'
                            ? 'default'
                            : sig.role === 'validator'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {sig.role === 'signer'
                          ? 'Signataire'
                          : sig.role === 'validator'
                            ? 'Validateur'
                            : 'Observateur'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSignatory(sig.id)}
                        className="text-advist-error"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new signatory form */}
              <div className="p-4 border border-advist-border rounded-xl space-y-4">
                <p className="font-medium text-advist-gray900">Ajouter un signataire</p>
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

export default UploadDocumentModal;
