/**
 * Dashboard Store
 * Zustand store for managing dashboard state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DashboardConfig,
  WidgetConfig,
  WidgetPosition,
  dashboardService,
  DEFAULT_TEMPLATES,
  createWidget,
  WidgetType,
} from '../services/dashboard';

interface DashboardState {
  // Current dashboard
  currentDashboard: DashboardConfig | null;
  dashboards: DashboardConfig[];

  // UI state
  isEditing: boolean;
  selectedWidgetId: string | null;
  isDragging: boolean;
  isLoading: boolean;
  error: string | null;

  // Widget data cache
  widgetData: Record<string, unknown>;

  // Actions
  loadDashboards: () => Promise<void>;
  loadDashboard: (id: string) => Promise<void>;
  loadDefaultDashboard: () => Promise<void>;
  createDashboard: (name: string, templateId?: string) => Promise<DashboardConfig>;
  updateDashboard: (data: Partial<DashboardConfig>) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  setDefaultDashboard: (id: string) => Promise<void>;
  duplicateDashboard: (id: string, name: string) => Promise<DashboardConfig>;

  // Widget actions
  addWidget: (type: WidgetType, title?: string) => void;
  updateWidget: (widgetId: string, config: Partial<WidgetConfig>) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetPosition: (widgetId: string, position: WidgetPosition) => void;
  updateWidgetPositions: (positions: { widgetId: string; position: WidgetPosition }[]) => void;
  setWidgetData: (widgetId: string, data: unknown) => void;

  // UI actions
  setEditing: (editing: boolean) => void;
  selectWidget: (widgetId: string | null) => void;
  setDragging: (dragging: boolean) => void;
  saveDashboard: () => Promise<void>;
  cancelEdit: () => void;

  // Local/offline support
  saveLocal: () => void;
  loadLocal: () => void;
}

// Create default user dashboard locally
const createDefaultDashboard = (): DashboardConfig => {
  const template = DEFAULT_TEMPLATES.find((t) => t.id === 'user-default');
  if (template) {
    return {
      id: 'local-default',
      ...template.config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    id: 'local-default',
    name: 'Mon tableau de bord',
    isDefault: true,
    layout: 'grid',
    columns: 4,
    rowHeight: 120,
    gap: 16,
    widgets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDashboard: null,
      dashboards: [],
      isEditing: false,
      selectedWidgetId: null,
      isDragging: false,
      isLoading: false,
      error: null,
      widgetData: {},

      // Load all dashboards
      loadDashboards: async () => {
        set({ isLoading: true, error: null });
        try {
          const dashboards = await dashboardService.getDashboards();
          set({ dashboards, isLoading: false });
        } catch (_error) {
          // Fallback to local dashboards
          get().loadLocal();
          set({ isLoading: false });
        }
      },

      // Load a specific dashboard
      loadDashboard: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const dashboard = await dashboardService.getDashboard(id);
          set({ currentDashboard: dashboard, isLoading: false });
        } catch (_error) {
          set({
            error: 'Impossible de charger le tableau de bord',
            isLoading: false,
          });
        }
      },

      // Load default dashboard
      loadDefaultDashboard: async () => {
        set({ isLoading: true, error: null });
        try {
          const dashboard = await dashboardService.getDefaultDashboard();
          set({ currentDashboard: dashboard, isLoading: false });
        } catch {
          // Create local default if API fails
          const localDefault = createDefaultDashboard();
          set({ currentDashboard: localDefault, isLoading: false });
        }
      },

      // Create a new dashboard
      createDashboard: async (name: string, templateId?: string) => {
        set({ isLoading: true, error: null });
        try {
          let dashboard: DashboardConfig;
          if (templateId) {
            dashboard = await dashboardService.createFromTemplate(templateId, name);
          } else {
            dashboard = await dashboardService.createDashboard({
              name,
              isDefault: false,
              layout: 'grid',
              columns: 4,
              rowHeight: 120,
              gap: 16,
              widgets: [],
            });
          }
          set((state) => ({
            dashboards: [...state.dashboards, dashboard],
            currentDashboard: dashboard,
            isLoading: false,
          }));
          return dashboard;
        } catch (error) {
          set({ error: 'Impossible de créer le tableau de bord', isLoading: false });
          throw error;
        }
      },

      // Update current dashboard
      updateDashboard: async (data: Partial<DashboardConfig>) => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        const updated = {
          ...currentDashboard,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        set({ currentDashboard: updated });

        try {
          await dashboardService.updateDashboard(currentDashboard.id, data);
        } catch (_error) {
          // Keep local changes, save to localStorage
          get().saveLocal();
        }
      },

      // Delete a dashboard
      deleteDashboard: async (id: string) => {
        try {
          await dashboardService.deleteDashboard(id);
          set((state) => ({
            dashboards: state.dashboards.filter((d) => d.id !== id),
            currentDashboard: state.currentDashboard?.id === id ? null : state.currentDashboard,
          }));
        } catch (_error) {
          set({ error: 'Impossible de supprimer le tableau de bord' });
        }
      },

      // Set default dashboard
      setDefaultDashboard: async (id: string) => {
        try {
          await dashboardService.setDefaultDashboard(id);
          set((state) => ({
            dashboards: state.dashboards.map((d) => ({
              ...d,
              isDefault: d.id === id,
            })),
          }));
        } catch (_error) {
          set({ error: 'Impossible de définir le tableau de bord par défaut' });
        }
      },

      // Duplicate a dashboard
      duplicateDashboard: async (id: string, name: string) => {
        try {
          const dashboard = await dashboardService.duplicateDashboard(id, name);
          set((state) => ({
            dashboards: [...state.dashboards, dashboard],
          }));
          return dashboard;
        } catch (error) {
          set({ error: 'Impossible de dupliquer le tableau de bord' });
          throw error;
        }
      },

      // Add a new widget
      addWidget: (type: WidgetType, title?: string) => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        const widget = createWidget(type, title);

        // Find available position
        const positions = currentDashboard.widgets.map((w) => w.position);
        const maxY = positions.length > 0 ? Math.max(...positions.map((p) => p.y + p.h)) : 0;

        widget.position.y = maxY;

        set({
          currentDashboard: {
            ...currentDashboard,
            widgets: [...currentDashboard.widgets, widget],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      // Update a widget
      updateWidget: (widgetId: string, config: Partial<WidgetConfig>) => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        set({
          currentDashboard: {
            ...currentDashboard,
            widgets: currentDashboard.widgets.map((w) =>
              w.id === widgetId ? { ...w, ...config } : w
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      // Remove a widget
      removeWidget: (widgetId: string) => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        set({
          currentDashboard: {
            ...currentDashboard,
            widgets: currentDashboard.widgets.filter((w) => w.id !== widgetId),
            updatedAt: new Date().toISOString(),
          },
          selectedWidgetId: null,
        });
      },

      // Update widget position (single)
      updateWidgetPosition: (widgetId: string, position: WidgetPosition) => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        set({
          currentDashboard: {
            ...currentDashboard,
            widgets: currentDashboard.widgets.map((w) =>
              w.id === widgetId ? { ...w, position } : w
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      // Update multiple widget positions (for drag & drop)
      updateWidgetPositions: (positions) => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        const positionMap = new Map(positions.map((p) => [p.widgetId, p.position]));

        set({
          currentDashboard: {
            ...currentDashboard,
            widgets: currentDashboard.widgets.map((w) => {
              const newPosition = positionMap.get(w.id);
              return newPosition ? { ...w, position: newPosition } : w;
            }),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      // Set widget data
      setWidgetData: (widgetId: string, data: unknown) => {
        set((state) => ({
          widgetData: {
            ...state.widgetData,
            [widgetId]: data,
          },
        }));
      },

      // UI actions
      setEditing: (editing: boolean) => {
        set({ isEditing: editing, selectedWidgetId: editing ? null : get().selectedWidgetId });
      },

      selectWidget: (widgetId: string | null) => {
        set({ selectedWidgetId: widgetId });
      },

      setDragging: (dragging: boolean) => {
        set({ isDragging: dragging });
      },

      saveDashboard: async () => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        set({ isLoading: true });
        try {
          await dashboardService.updateDashboard(currentDashboard.id, currentDashboard);
          set({ isEditing: false, isLoading: false });
        } catch (_error) {
          get().saveLocal();
          set({ isEditing: false, isLoading: false });
        }
      },

      cancelEdit: () => {
        // Reload dashboard to discard changes
        const { currentDashboard } = get();
        if (currentDashboard) {
          get().loadDashboard(currentDashboard.id);
        }
        set({ isEditing: false, selectedWidgetId: null });
      },

      // Local storage
      saveLocal: () => {
        const { currentDashboard, dashboards } = get();
        localStorage.setItem('advist-dashboards', JSON.stringify(dashboards));
        if (currentDashboard) {
          localStorage.setItem('advist-current-dashboard', JSON.stringify(currentDashboard));
        }
      },

      loadLocal: () => {
        try {
          const dashboardsJson = localStorage.getItem('advist-dashboards');
          const currentJson = localStorage.getItem('advist-current-dashboard');

          if (dashboardsJson) {
            set({ dashboards: JSON.parse(dashboardsJson) });
          }

          if (currentJson) {
            set({ currentDashboard: JSON.parse(currentJson) });
          } else {
            set({ currentDashboard: createDefaultDashboard() });
          }
        } catch {
          set({ currentDashboard: createDefaultDashboard() });
        }
      },
    }),
    {
      name: 'advist-dashboard-store',
      partialize: (state) => ({
        currentDashboard: state.currentDashboard,
        dashboards: state.dashboards,
      }),
    }
  )
);

export default useDashboardStore;
