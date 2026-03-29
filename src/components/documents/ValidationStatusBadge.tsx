/**
 * Validation Status Badge Component
 * Displays document validation status with appropriate styling
 */
import React from 'react';
import {
  FileEdit,
  Send,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export type ValidationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'validated'
  | 'rejected';

interface ValidationStatusBadgeProps {
  status: ValidationStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<ValidationStatus, {
  label: string;
  variant: 'secondary' | 'warning' | 'success' | 'destructive';
  icon: React.ElementType;
  color: string;
}> = {
  draft: {
    label: 'Brouillon',
    variant: 'secondary',
    icon: FileEdit,
    color: 'text-gray-500',
  },
  submitted: {
    label: 'Soumis',
    variant: 'warning',
    icon: Send,
    color: 'text-orange-500',
  },
  under_review: {
    label: 'En revision',
    variant: 'warning',
    icon: Eye,
    color: 'text-blue-500',
  },
  changes_requested: {
    label: 'Modifications demandees',
    variant: 'warning',
    icon: AlertCircle,
    color: 'text-amber-500',
  },
  validated: {
    label: 'Valide',
    variant: 'success',
    icon: CheckCircle,
    color: 'text-green-500',
  },
  rejected: {
    label: 'Rejete',
    variant: 'destructive',
    icon: XCircle,
    color: 'text-red-500',
  },
};

export const ValidationStatusBadge: React.FC<ValidationStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <Badge
      variant={config.variant}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className={config.color} />}
      {config.label}
    </Badge>
  );
};

export default ValidationStatusBadge;
