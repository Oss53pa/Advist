import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, X, Plus, Loader2 } from 'lucide-react';
import { Button, Input } from '../ui';
import { documentsService } from '../../services/documents';

interface NewDocumentFormProps {
  onClose: () => void;
  basePath: string;
}

export const NewDocumentForm: React.FC<NewDocumentFormProps> = ({ onClose, basePath }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !docType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('document_type', docType);
      if (description) {
        formData.append('description', description);
      }

      const newDocument = await documentsService.create(formData);
      onClose();
      navigate(`${basePath}/documents/${newDocument.id}`);
    } catch (err: unknown) {
      console.error('Failed to create document:', err);
      // Fallback for demo mode without backend
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        onClose();
        navigate(`${basePath}/documents`);
      } else {
        setError(
          t('documents.createError', 'Erreur lors de la création du document. Veuillez réessayer.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentTypes = [
    { value: 'contract', label: t('documents.types.contract', 'Contrat') },
    { value: 'report', label: t('documents.types.report', 'Rapport') },
    { value: 'policy', label: t('documents.types.policy', 'Politique') },
    { value: 'procedure', label: t('documents.types.procedure', 'Procédure') },
    { value: 'invoice', label: t('documents.types.invoice', 'Facture') },
    { value: 'other', label: t('documents.types.other', 'Autre') },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive ? 'border-advist-dark bg-advist-bg/50' : 'border-advist-blue-light hover:border-advist-dark'}
          ${file ? 'bg-green-50 border-advist-success' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText size={32} className="text-advist-success" />
            <div className="text-left">
              <p className="font-medium text-advist-success">{file.name}</p>
              <p className="text-sm text-advist-success">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="p-1 hover:bg-green-50 rounded-full"
            >
              <X size={18} className="text-advist-success" />
            </button>
          </div>
        ) : (
          <>
            <Upload size={40} className="mx-auto text-advist-blue-light mb-4" />
            <p className="font-medium text-advist-gray900">
              {t('documents.dragDrop', 'Glissez-déposez votre fichier ici')}
            </p>
            <p className="text-sm text-advist-blue-light mt-1">
              {t('documents.orClick', 'ou cliquez pour parcourir')}
            </p>
            <p className="text-xs text-advist-blue-light mt-3">
              PDF, Word, Excel, PowerPoint • Max 50 MB
            </p>
          </>
        )}
      </div>

      {/* Document Title */}
      <Input
        label={t('documents.title', 'Titre du document')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('documents.titlePlaceholder', 'Ex: Contrat de prestation 2024')}
        required
      />

      {/* Document Type */}
      <div>
        <label className="block text-sm font-medium text-advist-gray900 mb-2">
          {t('documents.type', 'Type de document')}
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full px-4 py-2.5 bg-advist-bg rounded-xl text-advist-gray900 focus:outline-none focus:ring-2 focus:ring-advist-gold"
          required
        >
          <option value="">{t('documents.selectType', 'Sélectionnez un type')}</option>
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-advist-gray900 mb-2">
          {t('documents.description', 'Description')}{' '}
          <span className="text-advist-blue-light">({t('common.optional', 'optionnel')})</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('documents.descriptionPlaceholder', 'Ajoutez une description...')}
          className="w-full px-4 py-3 bg-advist-bg rounded-xl text-advist-gray900 placeholder-advist-blue-light focus:outline-none focus:ring-2 focus:ring-advist-gold resize-none"
          rows={3}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-advist-gold-light border border-advist-gold rounded-xl text-advist-error text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-advist-bg">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {t('common.cancel', 'Annuler')}
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!file || !title || !docType || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              {t('common.processing', 'Création...')}
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              {t('documents.create', 'Créer le document')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default NewDocumentForm;
