export type PriorityType = 'low' | 'medium' | 'high' | 'urgent';

export interface PriorityConfig {
  label: string;
  color: 'gray' | 'yellow' | 'red' | 'purple';
  order: number;
}

export const PRIORITY_CONFIG: Record<PriorityType, PriorityConfig> = {
  low: { label: 'Basse', color: 'gray', order: 1 },
  medium: { label: 'Moyenne', color: 'yellow', order: 2 },
  high: { label: 'Haute', color: 'red', order: 3 },
  urgent: { label: 'Urgente', color: 'purple', order: 4 },
};

export const getPriorityConfig = (priority: PriorityType): PriorityConfig => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
};

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([value, config]) => ({
    value,
    label: config.label,
  }));
