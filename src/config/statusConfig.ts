import { CheckCircle, Clock, XCircle, Archive, Ban } from 'lucide-react';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'rejected'
  | 'archived'
  | 'blocked';

export interface StatusConfig {
  label: string;
  color: 'green' | 'gray' | 'yellow' | 'blue' | 'red' | 'purple';
  icon?: React.ElementType;
}

export const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  active: { label: 'Actif', color: 'green', icon: CheckCircle },
  inactive: { label: 'Inactif', color: 'gray', icon: XCircle },
  pending: { label: 'En attente', color: 'yellow', icon: Clock },
  completed: { label: 'Termine', color: 'blue', icon: CheckCircle },
  rejected: { label: 'Rejete', color: 'red', icon: XCircle },
  archived: { label: 'Archive', color: 'gray', icon: Archive },
  blocked: { label: 'Bloque', color: 'red', icon: Ban },
};

export const getStatusConfig = (status: StatusType): StatusConfig => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
};

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));
