import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Minus,
  Edit3,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui';

interface Change {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  line: number;
  section?: string;
  oldContent?: string;
  newContent?: string;
  position: { x: number; y: number };
}

interface Version {
  id: string;
  versionNumber: string;
  createdAt: string;
  createdBy: {
    name: string;
    avatar?: string;
  };
  fileUrl: string;
  changesSummary?: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

interface VersionCompareProps {
  leftVersion: Version;
  rightVersion: Version;
  changes: Change[];
  onClose?: () => void;
}

export const VersionCompare: React.FC<VersionCompareProps> = ({
  leftVersion,
  rightVersion,
  changes,
  onClose,
}) => {
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [showChangesOnly, setShowChangesOnly] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Group changes by type
  const changesByType = {
    additions: changes.filter(c => c.type === 'addition'),
    deletions: changes.filter(c => c.type === 'deletion'),
    modifications: changes.filter(c => c.type === 'modification'),
  };

  const totalChanges = changes.length;
  const currentChange = changes[currentChangeIndex];

  // Synchronized scrolling
  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll) return;

    const sourcePanel = source === 'left' ? leftPanelRef.current : rightPanelRef.current;
    const targetPanel = source === 'left' ? rightPanelRef.current : leftPanelRef.current;

    if (sourcePanel && targetPanel) {
      targetPanel.scrollTop = sourcePanel.scrollTop;
      targetPanel.scrollLeft = sourcePanel.scrollLeft;
    }
  };

  // Navigate to change
  const navigateToChange = (index: number) => {
    if (index >= 0 && index < changes.length) {
      setCurrentChangeIndex(index);
      // Scroll to change position
      const change = changes[index];

      // Calculate scroll position based on change position
      const scrollToPosition = (panel: HTMLDivElement | null) => {
        if (!panel) return;

        // Calculate the target scroll position based on change.position.y (percentage)
        // or change.line if position is not available
        let targetScrollTop: number;

        if (change.position && change.position.y !== undefined) {
          // Position is in percentage, convert to pixels
          const scrollHeight = panel.scrollHeight;
          const clientHeight = panel.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          targetScrollTop = (change.position.y / 100) * scrollHeight - clientHeight / 2;
          targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));
        } else if (change.line) {
          // Estimate position based on line number (assuming ~24px per line)
          const estimatedLineHeight = 24;
          const clientHeight = panel.clientHeight;
          targetScrollTop = (change.line * estimatedLineHeight) - clientHeight / 2;
          targetScrollTop = Math.max(0, targetScrollTop);
        } else {
          return;
        }

        // Smooth scroll to the position
        panel.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      };

      // Scroll both panels to the change position
      scrollToPosition(leftPanelRef.current);
      if (!syncScroll) {
        // If sync scroll is disabled, scroll right panel independently
        scrollToPosition(rightPanelRef.current);
      }
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 border-advist-success text-advist-success';
      case 'deletion':
        return 'bg-advist-gold-light border-advist-gold text-advist-error';
      case 'modification':
        return 'bg-advist-gold-light border-advist-gold text-advist-gold-dark';
      default:
        return 'bg-advist-surface-dark border-primary-500 text-advist-gray900';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <Plus size={14} />;
      case 'deletion':
        return <Minus size={14} />;
      case 'modification':
        return <Edit3 size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} bg-white`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-advist-bg bg-advist-dark text-white">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">Comparaison de versions</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-white/20 rounded">v{leftVersion.versionNumber}</span>
            <ArrowRight size={16} />
            <span className="px-2 py-1 bg-advist-gold-light/30 rounded">v{rightVersion.versionNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="p-1 hover:bg-white/10 rounded"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(200, z + 10))}
              className="p-1 hover:bg-white/10 rounded"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Sync scroll toggle */}
          <button
            onClick={() => setSyncScroll(!syncScroll)}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
              syncScroll ? 'bg-advist-gold-light/30' : 'bg-white/10'
            }`}
          >
            {syncScroll ? <Eye size={14} /> : <EyeOff size={14} />}
            Sync scroll
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Changes Summary Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-advist-bg border-b border-advist-border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-advist-gray900">
            {totalChanges} modifications :
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-advist-success">
              <Plus size={14} />
              {changesByType.additions.length} ajouts
            </span>
            <span className="flex items-center gap-1 text-sm text-advist-error">
              <Minus size={14} />
              {changesByType.deletions.length} suppressions
            </span>
            <span className="flex items-center gap-1 text-sm text-advist-gold-dark">
              <Edit3 size={14} />
              {changesByType.modifications.length} éditions
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-advist-blue-light">
            {currentChangeIndex + 1} / {totalChanges}
          </span>
          <button
            onClick={() => navigateToChange(currentChangeIndex - 1)}
            disabled={currentChangeIndex === 0}
            className="p-1.5 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={() => navigateToChange(currentChangeIndex + 1)}
            disabled={currentChangeIndex === totalChanges - 1}
            className="p-1.5 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDown size={18} />
          </button>
          <Button size="sm" variant="outline" onClick={() => navigateToChange(currentChangeIndex + 1)}>
            Modification suivante →
          </Button>
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Old Version */}
        <div className="flex-1 flex flex-col border-r border-advist-border">
          <div className="px-4 py-2 bg-advist-gold-light border-b border-advist-gold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-advist-error" />
              <span className="font-medium text-advist-error">Version {leftVersion.versionNumber}</span>
              <span className="text-sm text-advist-error">
                (ancienne)
              </span>
            </div>
            <span className="text-xs text-advist-error">
              {new Date(leftVersion.createdAt).toLocaleDateString('fr-FR')} par {leftVersion.createdBy.name}
            </span>
          </div>
          <div
            ref={leftPanelRef}
            className="flex-1 overflow-auto p-4"
            onScroll={() => handleScroll('left')}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          >
            {/* Document content would go here */}
            {/* This is a placeholder - in reality, render PDF/document viewer */}
            <div className="space-y-4">
              {/* Simulated document content with highlighted deletions */}
              <div className="p-4 border rounded-lg">
                <p className="text-advist-gray900 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  <span className="bg-advist-gold-light line-through px-1 mx-1">
                    Texte supprimé ici
                  </span>
                  Sed do eiusmod tempor incididunt ut labore.
                </p>
              </div>

              {/* Show changes markers */}
              {changes.filter(c => c.type === 'deletion').map((change) => (
                <div
                  key={change.id}
                  className={`p-3 rounded-lg border-l-4 ${getChangeColor(change.type)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getChangeIcon(change.type)}
                    <span className="text-sm font-medium">Ligne {change.line}</span>
                  </div>
                  <p className="text-sm line-through">{change.oldContent}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - New Version */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 bg-green-50 border-b border-advist-success flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-advist-success" />
              <span className="font-medium text-advist-success">Version {rightVersion.versionNumber}</span>
              <span className="text-sm text-advist-success">
                (nouvelle)
              </span>
            </div>
            <span className="text-xs text-advist-success">
              {new Date(rightVersion.createdAt).toLocaleDateString('fr-FR')} par {rightVersion.createdBy.name}
            </span>
          </div>
          <div
            ref={rightPanelRef}
            className="flex-1 overflow-auto p-4"
            onScroll={() => handleScroll('right')}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          >
            {/* Document content would go here */}
            <div className="space-y-4">
              {/* Simulated document content with highlighted additions */}
              <div className="p-4 border rounded-lg">
                <p className="text-advist-gray900 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  <span className="bg-green-50 px-1 mx-1">
                    Nouveau texte ajouté
                  </span>
                  Sed do eiusmod tempor incididunt ut labore.
                </p>
              </div>

              {/* Show changes markers */}
              {changes.filter(c => c.type === 'addition').map((change) => (
                <div
                  key={change.id}
                  className={`p-3 rounded-lg border-l-4 ${getChangeColor(change.type)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getChangeIcon(change.type)}
                    <span className="text-sm font-medium">Ligne {change.line}</span>
                  </div>
                  <p className="text-sm">{change.newContent}</p>
                </div>
              ))}

              {changes.filter(c => c.type === 'modification').map((change) => (
                <div
                  key={change.id}
                  className={`p-3 rounded-lg border-l-4 ${getChangeColor(change.type)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getChangeIcon(change.type)}
                    <span className="text-sm font-medium">Ligne {change.line}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-advist-error line-through">{change.oldContent}</p>
                    <p className="text-sm text-advist-success">{change.newContent}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Changes List Panel */}
      <div className="h-48 border-t border-advist-border bg-white overflow-hidden flex flex-col">
        <div className="px-4 py-2 bg-advist-bg border-b border-advist-border flex items-center justify-between">
          <span className="font-medium text-advist-gray900">Liste des modifications</span>
          <button
            onClick={() => setShowChangesOnly(!showChangesOnly)}
            className="text-sm text-advist-blue-light hover:text-advist-gray900"
          >
            {showChangesOnly ? 'Tout afficher' : 'Modifications uniquement'}
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-primary-100">
            {changes.map((change, index) => (
              <button
                key={change.id}
                onClick={() => navigateToChange(index)}
                className={`w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-advist-bg transition-colors ${
                  index === currentChangeIndex ? 'bg-advist-gold-light/10' : ''
                }`}
              >
                <div className={`p-1 rounded ${getChangeColor(change.type)}`}>
                  {getChangeIcon(change.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-advist-gray900 truncate">
                    {change.section || `Ligne ${change.line}`}
                  </p>
                  <p className="text-xs text-advist-blue-light truncate">
                    {change.type === 'addition' && change.newContent}
                    {change.type === 'deletion' && change.oldContent}
                    {change.type === 'modification' && `${change.oldContent} → ${change.newContent}`}
                  </p>
                </div>
                {index === currentChangeIndex && (
                  <Check size={16} className="text-advist-gray900" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionCompare;
