/**
 * Sync Mapping Configuration Component
 * Configure document and folder sync mappings between ADVIST and external systems
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderSync,
  ArrowLeftRight,
  Plus,
  Trash2,
  _Settings,
  _Clock,
  Folder,
  FileText,
  Loader2,
  Check,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useIntegrationStore } from '../../stores';
import { CloudFolderPicker } from './CloudFolderPicker';
import type {
  IntegrationSyncMapping,
  IntegrationConnection,
  CloudFolder,
} from '../../services/integrations';

interface SyncMappingConfigProps {
  connection: IntegrationConnection;
  onClose: () => void;
}

type SyncDirection = 'bidirectional' | 'import_only' | 'export_only';

const SYNC_DIRECTION_OPTIONS: { value: SyncDirection; label: string; icon: React.ElementType }[] = [
  { value: 'bidirectional', label: 'Bidirectionnel', icon: ArrowLeftRight },
  { value: 'import_only', label: 'Import uniquement', icon: Folder },
  { value: 'export_only', label: 'Export uniquement', icon: FileText },
];

export const SyncMappingConfig: React.FC<SyncMappingConfigProps> = ({ connection, _onClose }) => {
  const { t } = useTranslation();
  const {
    syncMappings,
    isLoading,
    isSyncing,
    fetchSyncMappings,
    createSyncMapping,
    deleteSyncMapping,
    triggerSyncMapping,
  } = useIntegrationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [newMapping, setNewMapping] = useState({
    name: '',
    external_folder_id: '',
    external_folder_path: '',
    local_document_type: '',
    sync_direction: 'bidirectional' as SyncDirection,
    sync_schedule: '*/15 * * * *', // Every 15 minutes
    auto_workflow: false,
    workflow_template_id: '',
  });

  useEffect(() => {
    fetchSyncMappings();
  }, [fetchSyncMappings]);

  const connectionMappings = syncMappings.filter((m) => m.connection_id === connection.id);

  const handleCreateMapping = async () => {
    try {
      await createSyncMapping({
        connection_id: connection.id,
        ...newMapping,
      });
      setShowCreateModal(false);
      setNewMapping({
        name: '',
        external_folder_id: '',
        external_folder_path: '',
        local_document_type: '',
        sync_direction: 'bidirectional',
        sync_schedule: '*/15 * * * *',
        auto_workflow: false,
        workflow_template_id: '',
      });
    } catch (error) {
      console.error('Failed to create mapping:', error);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (window.confirm(t('integrations.mapping.confirmDelete', 'Supprimer ce mapping ?'))) {
      await deleteSyncMapping(id);
    }
  };

  const handleTriggerSync = async (id: string) => {
    await triggerSyncMapping(id);
  };

  const handleFolderSelect = (folder: CloudFolder) => {
    setNewMapping({
      ...newMapping,
      external_folder_id: folder.id,
      external_folder_path: folder.path || folder.name,
    });
    setShowFolderPicker(false);
  };

  const getSyncStatusBadge = (mapping: IntegrationSyncMapping) => {
    if (mapping.is_syncing) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" />
          {t('integrations.mapping.syncing', 'Sync en cours')}
        </Badge>
      );
    }
    if (mapping.last_sync_error) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle size={12} />
          {t('integrations.mapping.error', 'Erreur')}
        </Badge>
      );
    }
    if (mapping.last_sync_at) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Check size={12} />
          {t('integrations.mapping.synced', 'Synchronise')}
        </Badge>
      );
    }
    return <Badge variant="secondary">{t('integrations.mapping.pending', 'En attente')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-advist-gray900">
            {t('integrations.mapping.title', 'Mappings de synchronisation')}
          </h2>
          <p className="text-sm text-advist-gray900/60 mt-1">
            {t(
              'integrations.mapping.description',
              'Configurez les dossiers a synchroniser avec ADVIST'
            )}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-2" />
          {t('integrations.mapping.add', 'Ajouter un mapping')}
        </Button>
      </div>

      {/* Mappings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-advist-primary" />
        </div>
      ) : connectionMappings.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <FolderSync size={48} className="text-advist-gray900/30 mb-4" />
            <h3 className="text-lg font-medium text-advist-gray900 mb-2">
              {t('integrations.mapping.empty', 'Aucun mapping configure')}
            </h3>
            <p className="text-sm text-advist-gray900/60 mb-4">
              {t(
                'integrations.mapping.emptyDescription',
                'Creez un mapping pour synchroniser des dossiers entre votre systeme et ADVIST'
              )}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" />
              {t('integrations.mapping.createFirst', 'Creer le premier mapping')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {connectionMappings.map((mapping) => (
            <Card key={mapping.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-advist-primary/10 rounded-lg">
                  <FolderSync size={20} className="text-advist-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-advist-gray900 truncate">{mapping.name}</h4>
                    {getSyncStatusBadge(mapping)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-advist-gray900/70">
                    <div>
                      <span className="text-advist-gray900/50">
                        {t('integrations.mapping.externalFolder', 'Dossier externe')}:
                      </span>{' '}
                      <span className="font-medium">{mapping.external_folder_path}</span>
                    </div>
                    <div>
                      <span className="text-advist-gray900/50">
                        {t('integrations.mapping.direction', 'Direction')}:
                      </span>{' '}
                      <span className="font-medium capitalize">{mapping.sync_direction}</span>
                    </div>
                    <div>
                      <span className="text-advist-gray900/50">
                        {t('integrations.mapping.schedule', 'Planning')}:
                      </span>{' '}
                      <span className="font-medium">{mapping.sync_schedule}</span>
                    </div>
                    {mapping.last_sync_at && (
                      <div>
                        <span className="text-advist-gray900/50">
                          {t('integrations.mapping.lastSync', 'Derniere sync')}:
                        </span>{' '}
                        <span className="font-medium">
                          {new Date(mapping.last_sync_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {mapping.last_sync_error && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600">{mapping.last_sync_error}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTriggerSync(mapping.id)}
                    disabled={isSyncing || mapping.is_syncing}
                  >
                    <Play size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMapping(mapping.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Mapping Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('integrations.mapping.createTitle', 'Nouveau mapping de synchronisation')}
        size="lg"
      >
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('integrations.mapping.name', 'Nom du mapping')}
            </label>
            <Input
              value={newMapping.name}
              onChange={(e) => setNewMapping({ ...newMapping, name: e.target.value })}
              placeholder={t('integrations.mapping.namePlaceholder', 'Ex: Documents commerciaux')}
            />
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('integrations.mapping.folder', 'Dossier source')}
            </label>
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-advist-bg rounded-xl">
                {newMapping.external_folder_path ? (
                  <div className="flex items-center gap-2">
                    <Folder size={18} className="text-advist-primary" />
                    <span className="text-sm text-advist-gray900">
                      {newMapping.external_folder_path}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-advist-gray900/50">
                    {t('integrations.mapping.noFolderSelected', 'Aucun dossier selectionne')}
                  </span>
                )}
              </div>
              <Button variant="outline" onClick={() => setShowFolderPicker(true)}>
                <Folder size={16} className="mr-2" />
                {t('integrations.mapping.browse', 'Parcourir')}
              </Button>
            </div>
          </div>

          {/* Sync Direction */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('integrations.mapping.syncDirection', 'Direction de synchronisation')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {SYNC_DIRECTION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setNewMapping({ ...newMapping, sync_direction: option.value })}
                    className={`
                      p-3 rounded-xl border-2 text-left transition-all
                      ${
                        newMapping.sync_direction === option.value
                          ? 'border-advist-primary bg-advist-primary/5'
                          : 'border-advist-gray200 hover:border-advist-gray300'
                      }
                    `}
                  >
                    <Icon
                      size={20}
                      className={`mb-2 ${
                        newMapping.sync_direction === option.value
                          ? 'text-advist-primary'
                          : 'text-advist-gray900/60'
                      }`}
                    />
                    <p className="text-sm font-medium text-advist-gray900">{option.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-advist-gray900 mb-2">
              {t('integrations.mapping.schedule', 'Frequence de synchronisation')}
            </label>
            <select
              value={newMapping.sync_schedule}
              onChange={(e) => setNewMapping({ ...newMapping, sync_schedule: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-advist-gray200 rounded-xl focus:ring-2 focus:ring-advist-primary focus:border-advist-primary"
            >
              <option value="*/5 * * * *">Toutes les 5 minutes</option>
              <option value="*/15 * * * *">Toutes les 15 minutes</option>
              <option value="*/30 * * * *">Toutes les 30 minutes</option>
              <option value="0 * * * *">Toutes les heures</option>
              <option value="0 */4 * * *">Toutes les 4 heures</option>
              <option value="0 0 * * *">Une fois par jour</option>
            </select>
          </div>

          {/* Auto Workflow */}
          <div className="flex items-center justify-between p-4 bg-advist-bg rounded-xl">
            <div>
              <p className="font-medium text-advist-gray900">
                {t('integrations.mapping.autoWorkflow', 'Workflow automatique')}
              </p>
              <p className="text-sm text-advist-gray900/60">
                {t(
                  'integrations.mapping.autoWorkflowDesc',
                  'Demarrer automatiquement un workflow pour les nouveaux documents'
                )}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newMapping.auto_workflow}
                onChange={(e) => setNewMapping({ ...newMapping, auto_workflow: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-advist-gray200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-advist-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-advist-gray300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-advist-primary"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-advist-gray200">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button
              onClick={handleCreateMapping}
              disabled={!newMapping.name || !newMapping.external_folder_id}
            >
              {t('common.create', 'Creer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Folder Picker Modal */}
      <CloudFolderPicker
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        connectionId={connection.id}
        onSelect={handleFolderSelect}
        selectedFolderId={newMapping.external_folder_id}
      />
    </div>
  );
};

export default SyncMappingConfig;
