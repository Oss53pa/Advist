/**
 * Dashboard Service
 * Customizable dashboards with widgets and drag & drop support
 */
import { supabase, invokeEdgeFunction } from '../lib/supabase';
import { parseSupabaseError } from './supabase-helpers';
import { generateSecureId } from '../utils/encryption';

// Widget types available in the system
export type WidgetType =
  | 'stats_card'
  | 'chart_line'
  | 'chart_bar'
  | 'chart_pie'
  | 'chart_donut'
  | 'recent_documents'
  | 'pending_tasks'
  | 'workflow_status'
  | 'calendar_mini'
  | 'notifications'
  | 'activity_feed'
  | 'quick_actions'
  | 'security_alerts'
  | 'folder_overview'
  | 'team_activity'
  | 'deadlines'
  | 'document_stats'
  | 'custom_kpi';

// Widget sizes for grid layout
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: WidgetPosition;
  settings: WidgetSettings;
  visible: boolean;
  refreshInterval?: number; // seconds, 0 = no auto refresh
}

export interface WidgetSettings {
  // Stats card settings
  metric?: 'documents' | 'workflows' | 'signatures' | 'pending_tasks' | 'custom';
  customMetricEndpoint?: string;
  showTrend?: boolean;
  trendPeriod?: 'day' | 'week' | 'month';

  // Chart settings
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  dataSource?: string;
  dateRange?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  groupBy?: 'day' | 'week' | 'month';

  // List settings
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;

  // Document settings
  documentTypes?: string[];
  statuses?: string[];

  // Calendar settings
  showWeekends?: boolean;
  eventTypes?: string[];

  // Security settings
  severityFilter?: string[];
  anomalyTypes?: string[];

  // Folder settings
  folderId?: string;
  showSubfolders?: boolean;

  // Custom settings
  customData?: Record<string, unknown>;

  // Display settings
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  showBorder?: boolean;
  iconName?: string;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  layout: 'grid' | 'free';
  columns: number;
  rowHeight: number;
  gap: number;
  widgets: WidgetConfig[];
  theme?: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'default' | 'admin' | 'user' | 'manager' | 'custom';
  thumbnail?: string;
  config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>;
  isSystem: boolean;
}

// Default widget definitions
export const WIDGET_DEFINITIONS: Record<WidgetType, {
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  defaultSettings: Partial<WidgetSettings>;
}> = {
  stats_card: {
    name: 'Carte statistique',
    description: 'Affiche une métrique clé avec tendance',
    icon: 'trending-up',
    defaultSize: 'small',
    minWidth: 1,
    minHeight: 1,
    maxWidth: 2,
    maxHeight: 2,
    defaultSettings: {
      showTrend: true,
      trendPeriod: 'week',
    },
  },
  chart_line: {
    name: 'Graphique linéaire',
    description: 'Évolution temporelle des données',
    icon: 'line-chart',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 3,
    defaultSettings: {
      dateRange: 'month',
      groupBy: 'day',
    },
  },
  chart_bar: {
    name: 'Graphique en barres',
    description: 'Comparaison de données',
    icon: 'bar-chart-2',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 3,
    defaultSettings: {
      dateRange: 'month',
    },
  },
  chart_pie: {
    name: 'Graphique circulaire',
    description: 'Répartition des données',
    icon: 'pie-chart',
    defaultSize: 'small',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 3,
    maxHeight: 3,
    defaultSettings: {},
  },
  chart_donut: {
    name: 'Graphique en anneau',
    description: 'Répartition avec total central',
    icon: 'circle',
    defaultSize: 'small',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 3,
    maxHeight: 3,
    defaultSettings: {},
  },
  recent_documents: {
    name: 'Documents récents',
    description: 'Liste des derniers documents',
    icon: 'file-text',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 4,
    defaultSettings: {
      limit: 5,
      sortBy: 'updated_at',
      sortOrder: 'desc',
    },
  },
  pending_tasks: {
    name: 'Tâches en attente',
    description: 'Tâches à traiter',
    icon: 'check-square',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 4,
    defaultSettings: {
      limit: 10,
      sortBy: 'deadline',
      sortOrder: 'asc',
    },
  },
  workflow_status: {
    name: 'Statut des workflows',
    description: 'Vue d\'ensemble des workflows',
    icon: 'git-branch',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 3,
    defaultSettings: {},
  },
  calendar_mini: {
    name: 'Mini calendrier',
    description: 'Calendrier des échéances',
    icon: 'calendar',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 3,
    maxHeight: 3,
    defaultSettings: {
      showWeekends: false,
    },
  },
  notifications: {
    name: 'Notifications',
    description: 'Notifications récentes',
    icon: 'bell',
    defaultSize: 'small',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 3,
    maxHeight: 4,
    defaultSettings: {
      limit: 5,
    },
  },
  activity_feed: {
    name: 'Fil d\'activité',
    description: 'Activité récente',
    icon: 'activity',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 3,
    maxWidth: 4,
    maxHeight: 5,
    defaultSettings: {
      limit: 10,
    },
  },
  quick_actions: {
    name: 'Actions rapides',
    description: 'Raccourcis pour actions fréquentes',
    icon: 'zap',
    defaultSize: 'small',
    minWidth: 2,
    minHeight: 1,
    maxWidth: 4,
    maxHeight: 2,
    defaultSettings: {},
  },
  security_alerts: {
    name: 'Alertes sécurité',
    description: 'Alertes de sécurité actives',
    icon: 'shield-alert',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 4,
    defaultSettings: {
      severityFilter: ['critical', 'high'],
      limit: 5,
    },
  },
  folder_overview: {
    name: 'Vue dossier',
    description: 'Aperçu d\'un dossier/projet',
    icon: 'folder',
    defaultSize: 'large',
    minWidth: 3,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 4,
    defaultSettings: {
      showSubfolders: true,
    },
  },
  team_activity: {
    name: 'Activité équipe',
    description: 'Activité des membres de l\'équipe',
    icon: 'users',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 4,
    defaultSettings: {
      limit: 5,
    },
  },
  deadlines: {
    name: 'Échéances',
    description: 'Prochaines échéances',
    icon: 'clock',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 3,
    defaultSettings: {
      limit: 5,
      sortBy: 'deadline',
      sortOrder: 'asc',
    },
  },
  document_stats: {
    name: 'Stats documents',
    description: 'Statistiques de documents',
    icon: 'bar-chart',
    defaultSize: 'medium',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 3,
    defaultSettings: {
      dateRange: 'month',
    },
  },
  custom_kpi: {
    name: 'KPI personnalisé',
    description: 'Indicateur personnalisé',
    icon: 'target',
    defaultSize: 'small',
    minWidth: 1,
    minHeight: 1,
    maxWidth: 4,
    maxHeight: 4,
    defaultSettings: {},
  },
};

// Default dashboard templates
export const DEFAULT_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'user-default',
    name: 'Tableau de bord utilisateur',
    description: 'Vue standard pour les utilisateurs',
    category: 'user',
    isSystem: true,
    config: {
      name: 'Mon tableau de bord',
      isDefault: true,
      layout: 'grid',
      columns: 4,
      rowHeight: 120,
      gap: 16,
      widgets: [
        {
          id: 'stats-docs',
          type: 'stats_card',
          title: 'Documents ce mois',
          size: 'small',
          position: { x: 0, y: 0, w: 1, h: 1 },
          settings: { metric: 'documents', showTrend: true },
          visible: true,
        },
        {
          id: 'stats-pending',
          type: 'stats_card',
          title: 'En attente',
          size: 'small',
          position: { x: 1, y: 0, w: 1, h: 1 },
          settings: { metric: 'pending_tasks' },
          visible: true,
        },
        {
          id: 'stats-workflows',
          type: 'stats_card',
          title: 'Workflows actifs',
          size: 'small',
          position: { x: 2, y: 0, w: 1, h: 1 },
          settings: { metric: 'workflows' },
          visible: true,
        },
        {
          id: 'stats-signatures',
          type: 'stats_card',
          title: 'À signer',
          size: 'small',
          position: { x: 3, y: 0, w: 1, h: 1 },
          settings: { metric: 'signatures' },
          visible: true,
        },
        {
          id: 'quick-actions',
          type: 'quick_actions',
          title: 'Actions rapides',
          size: 'medium',
          position: { x: 0, y: 1, w: 2, h: 1 },
          settings: {},
          visible: true,
        },
        {
          id: 'pending-tasks',
          type: 'pending_tasks',
          title: 'Tâches à traiter',
          size: 'medium',
          position: { x: 2, y: 1, w: 2, h: 2 },
          settings: { limit: 5 },
          visible: true,
        },
        {
          id: 'recent-docs',
          type: 'recent_documents',
          title: 'Documents récents',
          size: 'medium',
          position: { x: 0, y: 2, w: 2, h: 2 },
          settings: { limit: 5 },
          visible: true,
        },
        {
          id: 'calendar',
          type: 'calendar_mini',
          title: 'Calendrier',
          size: 'medium',
          position: { x: 2, y: 3, w: 2, h: 2 },
          settings: {},
          visible: true,
        },
      ],
    },
  },
  {
    id: 'admin-default',
    name: 'Tableau de bord administrateur',
    description: 'Vue complète pour les administrateurs',
    category: 'admin',
    isSystem: true,
    config: {
      name: 'Administration',
      isDefault: true,
      layout: 'grid',
      columns: 4,
      rowHeight: 120,
      gap: 16,
      widgets: [
        {
          id: 'stats-docs',
          type: 'stats_card',
          title: 'Total documents',
          size: 'small',
          position: { x: 0, y: 0, w: 1, h: 1 },
          settings: { metric: 'documents', showTrend: true },
          visible: true,
        },
        {
          id: 'stats-users',
          type: 'stats_card',
          title: 'Utilisateurs actifs',
          size: 'small',
          position: { x: 1, y: 0, w: 1, h: 1 },
          settings: { metric: 'custom', customMetricEndpoint: '/stats/active-users' },
          visible: true,
        },
        {
          id: 'stats-workflows',
          type: 'stats_card',
          title: 'Workflows actifs',
          size: 'small',
          position: { x: 2, y: 0, w: 1, h: 1 },
          settings: { metric: 'workflows' },
          visible: true,
        },
        {
          id: 'stats-security',
          type: 'stats_card',
          title: 'Alertes sécurité',
          size: 'small',
          position: { x: 3, y: 0, w: 1, h: 1 },
          settings: { metric: 'custom', customMetricEndpoint: '/security/stats/open-anomalies' },
          visible: true,
        },
        {
          id: 'chart-docs',
          type: 'chart_line',
          title: 'Évolution des documents',
          size: 'large',
          position: { x: 0, y: 1, w: 3, h: 2 },
          settings: { dateRange: 'month', groupBy: 'day' },
          visible: true,
        },
        {
          id: 'security-alerts',
          type: 'security_alerts',
          title: 'Alertes sécurité',
          size: 'medium',
          position: { x: 3, y: 1, w: 1, h: 2 },
          settings: { severityFilter: ['critical', 'high'], limit: 5 },
          visible: true,
        },
        {
          id: 'team-activity',
          type: 'team_activity',
          title: 'Activité équipe',
          size: 'medium',
          position: { x: 0, y: 3, w: 2, h: 2 },
          settings: { limit: 8 },
          visible: true,
        },
        {
          id: 'workflow-status',
          type: 'workflow_status',
          title: 'Statut workflows',
          size: 'medium',
          position: { x: 2, y: 3, w: 2, h: 2 },
          settings: {},
          visible: true,
        },
      ],
    },
  },
];

// Dashboard API Service
export const dashboardService = {
  /**
   * Get all dashboards for the current user
   */
  async getDashboards(): Promise<DashboardConfig[]> {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw parseSupabaseError(error);
    return (data as unknown as DashboardConfig[]) ?? [];
  },

  /**
   * Get a single dashboard
   */
  async getDashboard(id: string): Promise<DashboardConfig> {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as DashboardConfig;
  },

  /**
   * Get the default dashboard for the current user
   */
  async getDefaultDashboard(): Promise<DashboardConfig> {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) throw parseSupabaseError(error);
    return data as unknown as DashboardConfig;
  },

  /**
   * Create a new dashboard
   */
  async createDashboard(data: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardConfig> {
    const { data: result, error } = await supabase
      .from('dashboards')
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return result as unknown as DashboardConfig;
  },

  /**
   * Update a dashboard
   */
  async updateDashboard(id: string, data: Partial<DashboardConfig>): Promise<DashboardConfig> {
    const { data: result, error } = await supabase
      .from('dashboards')
      .update({ ...data, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return result as unknown as DashboardConfig;
  },

  /**
   * Delete a dashboard
   */
  async deleteDashboard(id: string): Promise<void> {
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Set a dashboard as default
   */
  async setDefaultDashboard(id: string): Promise<void> {
    // First, unset any current default
    const { error: unsetError } = await supabase
      .from('dashboards')
      .update({ is_default: false })
      .eq('is_default', true);

    if (unsetError) throw parseSupabaseError(unsetError);

    // Then set the new default
    const { error } = await supabase
      .from('dashboards')
      .update({ is_default: true })
      .eq('id', id);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Duplicate a dashboard
   */
  async duplicateDashboard(id: string, name: string): Promise<DashboardConfig> {
    // Fetch the original dashboard
    const original = await dashboardService.getDashboard(id);

    // Create a copy with new name
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = original;
    const { data: result, error } = await supabase
      .from('dashboards')
      .insert({
        ...rest,
        name,
        is_default: false,
      } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return result as unknown as DashboardConfig;
  },

  /**
   * Get available templates
   */
  async getTemplates(): Promise<DashboardTemplate[]> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('type', 'template')
      .order('name', { ascending: true });

    if (error) throw parseSupabaseError(error);

    // Merge server templates with built-in defaults
    const serverTemplates = (data as unknown as DashboardTemplate[]) ?? [];
    return [...DEFAULT_TEMPLATES, ...serverTemplates];
  },

  /**
   * Create dashboard from template
   */
  async createFromTemplate(templateId: string, name?: string): Promise<DashboardConfig> {
    // Check built-in templates first
    const builtIn = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (builtIn) {
      return dashboardService.createDashboard({
        ...builtIn.config,
        name: name ?? builtIn.config.name,
      });
    }

    // Otherwise invoke the edge function for server-side template creation
    return invokeEdgeFunction<DashboardConfig>('create-dashboard-from-template', {
      template_id: templateId,
      name: name ?? null,
    });
  },

  /**
   * Update widget configuration
   */
  async updateWidget(dashboardId: string, widgetId: string, config: Partial<WidgetConfig>): Promise<WidgetConfig> {
    const { data: result, error } = await supabase
      .from('dashboard_widgets')
      .update(config as Record<string, unknown>)
      .eq('dashboard_id', dashboardId)
      .eq('id', widgetId)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return result as unknown as WidgetConfig;
  },

  /**
   * Add a widget to a dashboard
   */
  async addWidget(dashboardId: string, widget: Omit<WidgetConfig, 'id'>): Promise<WidgetConfig> {
    const { data: result, error } = await supabase
      .from('dashboard_widgets')
      .insert({
        ...widget,
        dashboard_id: dashboardId,
      } as Record<string, unknown>)
      .select('*')
      .single();

    if (error) throw parseSupabaseError(error);
    return result as unknown as WidgetConfig;
  },

  /**
   * Remove a widget from a dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    const { error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('dashboard_id', dashboardId)
      .eq('id', widgetId);

    if (error) throw parseSupabaseError(error);
  },

  /**
   * Update widget positions (for drag & drop)
   */
  async updateWidgetPositions(
    dashboardId: string,
    positions: { widgetId: string; position: WidgetPosition }[]
  ): Promise<void> {
    // Update each widget position in parallel
    const updates = positions.map(({ widgetId, position }) =>
      supabase
        .from('dashboard_widgets')
        .update({ position } as Record<string, unknown>)
        .eq('dashboard_id', dashboardId)
        .eq('id', widgetId)
    );

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);
    if (firstError?.error) throw parseSupabaseError(firstError.error);
  },

  /**
   * Get widget data
   */
  async getWidgetData(dashboardId: string, widgetId: string): Promise<unknown> {
    return invokeEdgeFunction('get-widget-data', {
      dashboard_id: dashboardId,
      widget_id: widgetId,
    });
  },
};

// Helper functions
export function getWidgetDimensions(size: WidgetSize): { w: number; h: number } {
  const dimensions = {
    small: { w: 1, h: 1 },
    medium: { w: 2, h: 2 },
    large: { w: 3, h: 2 },
    full: { w: 4, h: 2 },
  };
  return dimensions[size];
}

export function generateWidgetId(): string {
  return generateSecureId('widget');
}

export function createWidget(type: WidgetType, title?: string): WidgetConfig {
  const definition = WIDGET_DEFINITIONS[type];
  const dimensions = getWidgetDimensions(definition.defaultSize);

  return {
    id: generateWidgetId(),
    type,
    title: title || definition.name,
    size: definition.defaultSize,
    position: { x: 0, y: 0, ...dimensions },
    settings: { ...definition.defaultSettings },
    visible: true,
  };
}

export default dashboardService;
