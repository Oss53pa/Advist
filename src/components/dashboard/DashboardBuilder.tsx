/**
 * Dashboard Builder Component
 * Customizable dashboard with drag & drop widget support
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  Settings,
  Save,
  X,
  _Move,
  Trash2,
  Edit2,
  _Copy,
  _MoreVertical,
  GripVertical,
  _Maximize2,
  _Minimize2,
  RefreshCw,
  _ChevronDown,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  WidgetConfig,
  WidgetType,
  WIDGET_DEFINITIONS,
  _WidgetPosition,
} from '../../services/dashboard';

// Widget Content Components
import { StatsCardWidget } from './widgets/StatsCardWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { RecentDocumentsWidget } from './widgets/RecentDocumentsWidget';
import { PendingTasksWidget } from './widgets/PendingTasksWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { ActivityFeedWidget } from './widgets/ActivityFeedWidget';
import { SecurityAlertsWidget } from './widgets/SecurityAlertsWidget';
import { WorkflowStatusWidget } from './widgets/WorkflowStatusWidget';

interface DashboardBuilderProps {
  className?: string;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({ className = '' }) => {
  const {
    currentDashboard,
    isEditing,
    selectedWidgetId,
    isDragging,
    setEditing,
    selectWidget,
    setDragging,
    addWidget,
    _updateWidget,
    removeWidget,
    updateWidgetPosition,
    saveDashboard,
    cancelEdit,
  } = useDashboardStore();

  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle widget drag start
  const handleDragStart = useCallback(
    (widgetId: string, e: React.MouseEvent) => {
      if (!isEditing) return;
      setDraggedWidget(widgetId);
      setDragging(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
    },
    [isEditing, setDragging]
  );

  // Handle widget drag
  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedWidget || !gridRef.current || !currentDashboard) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const colWidth = gridRect.width / currentDashboard.columns;
      const rowHeight = currentDashboard.rowHeight + currentDashboard.gap;

      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;

      const widget = currentDashboard.widgets.find((w) => w.id === draggedWidget);
      if (!widget) return;

      const newX = Math.max(
        0,
        Math.min(
          currentDashboard.columns - widget.position.w,
          Math.round((widget.position.x * colWidth + deltaX) / colWidth)
        )
      );
      const newY = Math.max(0, Math.round((widget.position.y * rowHeight + deltaY) / rowHeight));

      if (newX !== widget.position.x || newY !== widget.position.y) {
        updateWidgetPosition(draggedWidget, {
          ...widget.position,
          x: newX,
          y: newY,
        });
        setDragStartPos({ x: e.clientX, y: e.clientY });
      }
    },
    [draggedWidget, currentDashboard, dragStartPos, updateWidgetPosition]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    setDragging(false);
  }, [setDragging]);

  // Mouse events for drag
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e as unknown as React.MouseEvent);
      const handleMouseUp = () => handleDragEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  // Render widget content based on type
  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'stats_card':
        return <StatsCardWidget config={widget} />;
      case 'chart_line':
      case 'chart_bar':
      case 'chart_pie':
      case 'chart_donut':
        return <ChartWidget config={widget} />;
      case 'recent_documents':
        return <RecentDocumentsWidget config={widget} />;
      case 'pending_tasks':
        return <PendingTasksWidget config={widget} />;
      case 'quick_actions':
        return <QuickActionsWidget config={widget} />;
      case 'calendar_mini':
        return <CalendarWidget config={widget} />;
      case 'activity_feed':
        return <ActivityFeedWidget config={widget} />;
      case 'security_alerts':
        return <SecurityAlertsWidget config={widget} />;
      case 'workflow_status':
        return <WorkflowStatusWidget config={widget} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-advist-text-secondary">
            Widget: {widget.type}
          </div>
        );
    }
  };

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-advist-gold"></div>
      </div>
    );
  }

  const { columns, rowHeight, gap, widgets } = currentDashboard;
  const _colWidth = `calc((100% - ${gap * (columns - 1)}px) / ${columns})`;

  return (
    <div className={`relative ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">{currentDashboard.name}</h1>
          {currentDashboard.description && (
            <p className="text-advist-text-secondary mt-1">{currentDashboard.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setShowWidgetPicker(true)}
                className="flex items-center gap-2 px-4 py-2 bg-advist-gold-light text-advist-gray900 rounded-xl hover:bg-advist-gold/30 transition-all"
              >
                <Plus size={18} />
                Ajouter widget
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 border border-advist-border text-advist-gray900 rounded-xl hover:bg-advist-surface-dark transition-all"
              >
                <X size={18} />
                Annuler
              </button>
              <button
                onClick={saveDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-advist-dark text-white rounded-xl hover:bg-advist-dark/90 transition-all"
              >
                <Save size={18} />
                Enregistrer
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-advist-surface-dark text-advist-gray900 rounded-xl hover:bg-advist-gold-light transition-all"
            >
              <Edit2 size={18} />
              Personnaliser
            </button>
          )}
        </div>
      </div>

      {/* Widget Grid */}
      <div
        ref={gridRef}
        className="relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          minHeight: '600px',
        }}
      >
        {widgets
          .filter((w) => w.visible)
          .map((widget) => {
            const isSelected = selectedWidgetId === widget.id;
            const isBeingDragged = draggedWidget === widget.id;

            return (
              <div
                key={widget.id}
                className={`
                bg-white rounded-xl border transition-all relative
                ${isEditing ? 'cursor-move' : ''}
                ${isSelected ? 'border-advist-gold ring-2 ring-advist-gold/20' : 'border-advist-border'}
                ${isBeingDragged ? 'opacity-75 z-50 shadow-lg' : ''}
              `}
                style={{
                  gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
                  gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
                  minHeight: `${rowHeight * widget.position.h + gap * (widget.position.h - 1)}px`,
                }}
                onClick={() => isEditing && selectWidget(widget.id)}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-advist-border">
                  {isEditing && (
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-2 text-advist-text-secondary hover:text-advist-gray900"
                      onMouseDown={(e) => handleDragStart(widget.id, e)}
                    >
                      <GripVertical size={16} />
                    </div>
                  )}
                  <h3 className="font-medium text-advist-gray900 flex-1 truncate">
                    {widget.title}
                  </h3>
                  {isEditing && isSelected && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open settings modal
                        }}
                        className="p-1.5 hover:bg-advist-surface-dark rounded-lg transition-all"
                        title="Paramètres"
                      >
                        <Settings size={14} className="text-advist-text-secondary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWidget(widget.id);
                        }}
                        className="p-1.5 hover:bg-advist-gold-light rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={14} className="text-advist-error" />
                      </button>
                    </div>
                  )}
                  {!isEditing && widget.refreshInterval && widget.refreshInterval > 0 && (
                    <button
                      className="p-1.5 hover:bg-advist-surface-dark rounded-lg transition-all"
                      title="Actualiser"
                    >
                      <RefreshCw size={14} className="text-advist-text-secondary" />
                    </button>
                  )}
                </div>

                {/* Widget Content */}
                <div className="p-4 h-[calc(100%-52px)] overflow-auto">
                  {renderWidgetContent(widget)}
                </div>
              </div>
            );
          })}

        {/* Empty state */}
        {widgets.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-advist-text-secondary">
            <Plus size={48} className="mb-4 opacity-50" />
            <p className="text-lg">Aucun widget</p>
            <p className="text-sm mt-1">Cliquez sur "Personnaliser" pour ajouter des widgets</p>
          </div>
        )}
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-advist-border">
              <h2 className="text-lg font-semibold text-advist-gray900">Ajouter un widget</h2>
              <button
                onClick={() => setShowWidgetPicker(false)}
                className="p-2 hover:bg-advist-surface-dark rounded-lg transition-all"
              >
                <X size={20} className="text-advist-text-secondary" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(
                  Object.entries(WIDGET_DEFINITIONS) as [
                    WidgetType,
                    (typeof WIDGET_DEFINITIONS)[WidgetType],
                  ][]
                ).map(([type, definition]) => (
                  <button
                    key={type}
                    onClick={() => {
                      addWidget(type);
                      setShowWidgetPicker(false);
                    }}
                    className="flex flex-col items-center p-4 border border-advist-border rounded-xl hover:border-advist-gold hover:bg-advist-gold-light/30 transition-all group"
                  >
                    <div className="w-12 h-12 bg-advist-gold-light rounded-xl flex items-center justify-center mb-3 group-hover:bg-advist-dark group-hover:text-white transition-all">
                      <WidgetIcon name={definition.icon} />
                    </div>
                    <span className="font-medium text-advist-gray900 text-sm">
                      {definition.name}
                    </span>
                    <span className="text-xs text-advist-text-secondary mt-1 text-center">
                      {definition.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Widget Icon component
const WidgetIcon: React.FC<{ name: string }> = ({ name }) => {
  // Dynamic icon rendering based on name
  const iconMap: Record<string, React.FC<{ size?: number }>> = {
    'trending-up': ({ size = 24 }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    'line-chart': ({ size = 24 }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    'bar-chart-2': ({ size = 24 }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    'pie-chart': ({ size = 24 }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  };

  const IconComponent = iconMap[name];
  if (IconComponent) {
    return <IconComponent size={24} />;
  }

  // Fallback
  return <div className="w-6 h-6 bg-current rounded opacity-50" />;
};

export default DashboardBuilder;
