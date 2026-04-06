/**
 * Version Comparison Component
 * Compare two versions of a document side by side
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  GitCompare,
  _ChevronLeft,
  _ChevronRight,
  ZoomIn,
  ZoomOut,
  ArrowLeftRight,
  Check,
  X,
  Plus,
  Minus,
  FileText,
  Clock,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button, Badge, Modal } from '../ui';
import {
  documentsService,
  VersionComparison as VersionComparisonData,
} from '../../services/documents';

interface DocumentVersion {
  id: number;
  version: number;
  by: string;
  comment: string;
  date: string;
  changes?: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

interface VersionComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  versions: DocumentVersion[];
  documentTitle: string;
}

interface DiffItem {
  id: number;
  type: 'addition' | 'deletion' | 'modification';
  page?: number;
  section: string;
  oldText: string | null;
  newText: string | null;
  lineNumber?: number;
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({
  isOpen,
  onClose,
  documentId,
  versions,
  documentTitle,
}) => {
  const [leftVersion, setLeftVersion] = useState<number>(versions[1]?.version || 1);
  const [rightVersion, setRightVersion] = useState<number>(versions[0]?.version || 2);
  const [zoom, setZoom] = useState(100);
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  // API data state
  const [comparison, setComparison] = useState<VersionComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comparison data from backend
  const fetchComparison = useCallback(async () => {
    if (!documentId || leftVersion === rightVersion) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await documentsService.compareVersions(documentId, leftVersion, rightVersion);
      setComparison(data);
    } catch (err) {
      console.error('Failed to fetch version comparison:', err);
      setError('Erreur lors de la comparaison des versions');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, leftVersion, rightVersion]);

  useEffect(() => {
    if (isOpen) {
      fetchComparison();
    }
  }, [isOpen, fetchComparison]);

  // Transform API changes to display format
  const diffs: DiffItem[] =
    comparison?.changes?.map((change, index) => ({
      id: index + 1,
      type: change.type,
      page: change.page,
      section: change.section || change.description,
      oldText: change.old_content || null,
      newText: change.new_content || null,
      lineNumber: undefined,
    })) || [];

  const leftVersionData = versions.find((v) => v.version === leftVersion);
  const rightVersionData = versions.find((v) => v.version === rightVersion);

  const stats = comparison?.summary || {
    additions: diffs.filter((d) => d.type === 'addition').length,
    deletions: diffs.filter((d) => d.type === 'deletion').length,
    modifications: diffs.filter((d) => d.type === 'modification').length,
  };

  const swapVersions = () => {
    const temp = leftVersion;
    setLeftVersion(rightVersion);
    setRightVersion(temp);
  };

  const getDiffTypeColor = (type: 'addition' | 'deletion' | 'modification') => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 border-advist-success text-advist-success';
      case 'deletion':
        return 'bg-advist-gold-light border-advist-gold text-advist-error';
      case 'modification':
        return 'bg-advist-gold-light border-advist-gold text-advist-gold-dark';
    }
  };

  const getDiffIcon = (type: 'addition' | 'deletion' | 'modification') => {
    switch (type) {
      case 'addition':
        return <Plus size={14} className="text-advist-success" />;
      case 'deletion':
        return <Minus size={14} className="text-advist-error" />;
      case 'modification':
        return <ArrowLeftRight size={14} className="text-advist-gold-dark" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl" className="!max-w-7xl">
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-advist-border bg-gradient-to-r from-advist-navy to-primary-900 text-white -mx-6 -mt-6 px-6 pt-6 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <GitCompare size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Comparaison de versions</h2>
              <p className="text-sm text-white/70">{documentTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Version Selectors */}
        <div className="flex items-center justify-between p-4 bg-advist-surface-dark border-b border-advist-border">
          <div className="flex items-center gap-4">
            {/* Left Version Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-advist-text-secondary">Version ancienne:</span>
              <select
                value={leftVersion}
                onChange={(e) => setLeftVersion(Number(e.target.value))}
                className="px-3 py-2 border border-advist-border rounded-lg bg-white text-sm focus:ring-2 focus:ring-advist-gold/20 focus:border-advist-dark"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.version} disabled={v.version === rightVersion}>
                    v{v.version} - {v.date}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={swapVersions}
              className="p-2 hover:bg-advist-border rounded-lg transition-colors"
              title="Inverser les versions"
            >
              <ArrowLeftRight size={18} className="text-advist-text-secondary" />
            </button>

            {/* Right Version Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-advist-text-secondary">Version recente:</span>
              <select
                value={rightVersion}
                onChange={(e) => setRightVersion(Number(e.target.value))}
                className="px-3 py-2 border border-advist-border rounded-lg bg-white text-sm focus:ring-2 focus:ring-advist-gold/20 focus:border-advist-dark"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.version} disabled={v.version === leftVersion}>
                    v{v.version} - {v.date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-white border border-advist-border rounded-lg">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 hover:bg-advist-surface-dark rounded"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="p-1 hover:bg-advist-surface-dark rounded"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <div className="flex items-center bg-white border border-advist-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-advist-dark text-white'
                    : 'text-advist-text-secondary hover:bg-advist-surface-dark'
                }`}
              >
                Cote a cote
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'unified'
                    ? 'bg-advist-dark text-white'
                    : 'text-advist-text-secondary hover:bg-advist-surface-dark'
                }`}
              >
                Unifie
              </button>
            </div>

            <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-advist-border rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showDiffOnly}
                onChange={(e) => setShowDiffOnly(e.target.checked)}
                className="w-4 h-4 rounded border-advist-border text-advist-gray900 focus:ring-advist-gold"
              />
              <span className="text-sm text-advist-text-secondary">Differences uniquement</span>
            </label>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-4 py-3 bg-white border-b border-advist-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Plus size={16} className="text-advist-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-advist-gray900">{stats.additions}</p>
              <p className="text-xs text-advist-text-secondary">Ajouts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-advist-gold-light rounded-lg flex items-center justify-center">
              <Minus size={16} className="text-advist-error" />
            </div>
            <div>
              <p className="text-sm font-semibold text-advist-gray900">{stats.deletions}</p>
              <p className="text-xs text-advist-text-secondary">Suppressions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-advist-gold-light rounded-lg flex items-center justify-center">
              <ArrowLeftRight size={16} className="text-advist-gold-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold text-advist-gray900">{stats.modifications}</p>
              <p className="text-xs text-advist-text-secondary">Modifications</p>
            </div>
          </div>
          <div className="ml-auto text-sm text-advist-text-secondary">
            Total: {stats.additions + stats.deletions + stats.modifications} changements
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-advist-gold" />
              <span className="ml-3 text-advist-text-secondary">
                Chargement de la comparaison...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="w-12 h-12 text-advist-error mb-3" />
              <p className="text-advist-error font-medium">{error}</p>
              <Button variant="outline" onClick={fetchComparison} className="mt-4">
                Réessayer
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && diffs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Check className="w-12 h-12 text-advist-success mb-3" />
              <p className="text-advist-text-secondary">
                Aucune différence détectée entre les versions
              </p>
            </div>
          )}

          {/* Comparison View */}
          {!isLoading && !error && diffs.length > 0 && viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-2 divide-x divide-primary-200 h-full">
              {/* Left Panel - Old Version */}
              <div className="flex flex-col">
                <div className="sticky top-0 bg-advist-surface-dark px-4 py-2 border-b border-advist-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="gray">v{leftVersion}</Badge>
                      <span className="text-sm font-medium text-advist-gray900">
                        {leftVersionData?.comment}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-advist-text-secondary">
                      <User size={12} />
                      <span>{leftVersionData?.by}</span>
                      <Clock size={12} className="ml-2" />
                      <span>{leftVersionData?.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-4" style={{ fontSize: `${zoom}%` }}>
                  {diffs.map((diff) => (
                    <div
                      key={diff.id}
                      className={`p-3 rounded-lg border ${
                        diff.type === 'deletion' || diff.type === 'modification'
                          ? 'bg-advist-gold-light border-advist-gold'
                          : 'bg-advist-surface-dark border-advist-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {diff.page && (
                          <>
                            <span className="text-xs font-medium text-advist-text-secondary">
                              Page {diff.page}
                            </span>
                            <span className="text-xs text-advist-text-muted">|</span>
                          </>
                        )}
                        <span className="text-xs text-advist-text-secondary">{diff.section}</span>
                      </div>
                      {diff.oldText ? (
                        <p
                          className={`text-sm ${diff.type !== 'addition' ? 'text-advist-error line-through' : 'text-advist-gray900'}`}
                        >
                          {diff.oldText}
                        </p>
                      ) : (
                        <p className="text-sm text-advist-text-muted italic">Aucun contenu</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - New Version */}
              <div className="flex flex-col">
                <div className="sticky top-0 bg-advist-surface-dark px-4 py-2 border-b border-advist-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">v{rightVersion}</Badge>
                      <span className="text-sm font-medium text-advist-gray900">
                        {rightVersionData?.comment}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-advist-text-secondary">
                      <User size={12} />
                      <span>{rightVersionData?.by}</span>
                      <Clock size={12} className="ml-2" />
                      <span>{rightVersionData?.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-4" style={{ fontSize: `${zoom}%` }}>
                  {diffs.map((diff) => (
                    <div
                      key={diff.id}
                      className={`p-3 rounded-lg border ${
                        diff.type === 'addition' || diff.type === 'modification'
                          ? 'bg-green-50 border-advist-success'
                          : 'bg-advist-surface-dark border-advist-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {diff.page && (
                          <>
                            <span className="text-xs font-medium text-advist-text-secondary">
                              Page {diff.page}
                            </span>
                            <span className="text-xs text-advist-text-muted">|</span>
                          </>
                        )}
                        <span className="text-xs text-advist-text-secondary">{diff.section}</span>
                      </div>
                      {diff.newText ? (
                        <p
                          className={`text-sm ${diff.type !== 'deletion' ? 'text-advist-success' : 'text-advist-gray900'}`}
                        >
                          {diff.newText}
                        </p>
                      ) : (
                        <p className="text-sm text-advist-text-muted italic">Supprime</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !isLoading && !error && diffs.length > 0 ? (
            /* Unified View */
            <div className="p-4 space-y-4" style={{ fontSize: `${zoom}%` }}>
              {diffs.map((diff) => (
                <div
                  key={diff.id}
                  className={`p-4 rounded-xl border-2 ${getDiffTypeColor(diff.type)}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        diff.type === 'addition'
                          ? 'bg-green-50'
                          : diff.type === 'deletion'
                            ? 'bg-advist-gold-light'
                            : 'bg-advist-gold-light'
                      }`}
                    >
                      {getDiffIcon(diff.type)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold capitalize">
                        {diff.type === 'addition'
                          ? 'Ajout'
                          : diff.type === 'deletion'
                            ? 'Suppression'
                            : 'Modification'}
                      </span>
                      {diff.page && (
                        <span className="text-xs text-advist-text-secondary ml-2">
                          Page {diff.page}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-advist-text-secondary ml-auto">
                      {diff.section}
                    </span>
                  </div>

                  {diff.type === 'modification' ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-advist-gold-light rounded-lg">
                        <span className="text-xs text-advist-error font-medium">Avant:</span>
                        <p className="text-sm text-advist-error line-through mt-1">
                          {diff.oldText}
                        </p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg">
                        <span className="text-xs text-advist-success font-medium">Apres:</span>
                        <p className="text-sm text-advist-success mt-1">{diff.newText}</p>
                      </div>
                    </div>
                  ) : diff.type === 'addition' ? (
                    <p className="text-sm text-advist-success">{diff.newText}</p>
                  ) : (
                    <p className="text-sm text-advist-error line-through">{diff.oldText}</p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-advist-border bg-advist-surface-dark">
          <p className="text-sm text-advist-text-secondary">
            Comparaison entre v{leftVersion} et v{rightVersion}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button variant="primary" leftIcon={<FileText size={16} />}>
              Exporter le rapport
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VersionComparison;
