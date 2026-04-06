/**
 * Cloud Folder Picker Component
 * Allows users to browse and select folders from connected cloud storage
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Home,
  Loader2,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useIntegrationStore } from '../../stores';
import type { CloudFolder } from '../../services/integrations';

interface CloudFolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
  onSelect: (folder: CloudFolder) => void;
  selectedFolderId?: string;
}

export const CloudFolderPicker: React.FC<CloudFolderPickerProps> = ({
  isOpen,
  onClose,
  connectionId,
  onSelect,
  _selectedFolderId,
}) => {
  const { t } = useTranslation();
  const {
    currentFolders,
    folderBreadcrumb,
    isLoading,
    browseFolders,
    navigateToFolder,
    navigateUp,
  } = useIntegrationStore();

  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [localSelectedFolder, setLocalSelectedFolder] = useState<CloudFolder | null>(null);

  useEffect(() => {
    if (isOpen && connectionId) {
      // Load root folders
      browseFolders(connectionId);
    }
  }, [isOpen, connectionId, browseFolders]);

  const handleFolderClick = (folder: CloudFolder) => {
    setLocalSelectedFolder(folder);
  };

  const handleFolderDoubleClick = (folder: CloudFolder) => {
    navigateToFolder(folder);
    browseFolders(connectionId, folder.id);
  };

  const handleNavigateUp = () => {
    if (folderBreadcrumb.length > 0) {
      const parentId =
        folderBreadcrumb.length > 1 ? folderBreadcrumb[folderBreadcrumb.length - 2].id : undefined;
      navigateUp();
      browseFolders(connectionId, parentId);
    }
  };

  const handleNavigateToRoot = () => {
    // Reset breadcrumb and load root
    while (folderBreadcrumb.length > 0) {
      navigateUp();
    }
    browseFolders(connectionId);
  };

  const handleConfirm = () => {
    if (localSelectedFolder) {
      onSelect(localSelectedFolder);
      onClose();
    }
  };

  const handleRefresh = () => {
    const currentParentId =
      folderBreadcrumb.length > 0 ? folderBreadcrumb[folderBreadcrumb.length - 1].id : undefined;
    browseFolders(connectionId, currentParentId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('integrations.folderPicker.title', 'Selectionner un dossier')}
      size="lg"
    >
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 p-3 bg-advist-bg rounded-xl">
          <Button variant="ghost" size="sm" onClick={handleNavigateToRoot} className="p-1">
            <Home size={18} />
          </Button>

          {folderBreadcrumb.length > 0 && (
            <>
              <ChevronRight size={16} className="text-advist-gray900/40" />
              <Button variant="ghost" size="sm" onClick={handleNavigateUp} className="p-1">
                <ChevronLeft size={18} />
              </Button>
            </>
          )}

          <div className="flex items-center gap-1 overflow-x-auto">
            {folderBreadcrumb.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                {index > 0 && (
                  <ChevronRight size={14} className="text-advist-gray900/40 flex-shrink-0" />
                )}
                <span className="text-sm text-advist-gray900 truncate max-w-[150px]">
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Folder List */}
        <div className="border border-advist-gray200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-advist-primary" />
            </div>
          ) : currentFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-advist-gray900/60">
              <Folder size={48} className="mb-2 opacity-50" />
              <p>{t('integrations.folderPicker.empty', 'Aucun dossier')}</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {currentFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  onDoubleClick={() => handleFolderDoubleClick(folder)}
                  onMouseEnter={() => setHoveredFolder(folder.id)}
                  onMouseLeave={() => setHoveredFolder(null)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer
                    border-b border-advist-gray200 last:border-b-0
                    transition-colors
                    ${
                      localSelectedFolder?.id === folder.id
                        ? 'bg-advist-primary/10'
                        : hoveredFolder === folder.id
                          ? 'bg-advist-bg'
                          : ''
                    }
                  `}
                >
                  {hoveredFolder === folder.id || localSelectedFolder?.id === folder.id ? (
                    <FolderOpen size={20} className="text-advist-primary flex-shrink-0" />
                  ) : (
                    <Folder size={20} className="text-advist-gray900/60 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-advist-gray900 truncate">
                      {folder.name}
                    </p>
                    {folder.path && (
                      <p className="text-xs text-advist-gray900/50 truncate">{folder.path}</p>
                    )}
                  </div>

                  {localSelectedFolder?.id === folder.id && (
                    <Check size={18} className="text-advist-primary flex-shrink-0" />
                  )}

                  <ChevronRight size={16} className="text-advist-gray900/30 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected folder info */}
        {localSelectedFolder && (
          <div className="p-3 bg-advist-primary/5 rounded-xl">
            <p className="text-sm text-advist-gray900">
              <span className="font-medium">
                {t('integrations.folderPicker.selected', 'Selectionne')}:
              </span>{' '}
              {localSelectedFolder.name}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-advist-gray200">
          <Button variant="outline" onClick={onClose}>
            <X size={16} className="mr-2" />
            {t('common.cancel', 'Annuler')}
          </Button>
          <Button onClick={handleConfirm} disabled={!localSelectedFolder}>
            <Check size={16} className="mr-2" />
            {t('common.confirm', 'Confirmer')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CloudFolderPicker;
