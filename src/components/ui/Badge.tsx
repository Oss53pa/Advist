import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'primary' | 'danger' | 'critical';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-advist-surface-dark text-advist-text-secondary',
  success: 'bg-green-50 text-advist-success',
  warning: 'bg-advist-gold-light text-advist-gold-dark',
  error: 'bg-advist-gold-light text-advist-gold-dark',
  info: 'bg-advist-gold-light text-advist-gold-dark',
  outline: 'bg-transparent border border-advist-border text-advist-text-secondary',
  primary: 'bg-advist-gold text-advist-gray900',
  danger: 'bg-advist-dark text-white',
  critical: 'bg-advist-gold text-advist-gray900',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

// Status badge helper for documents/workflows
type StatusType = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived' | 'in_progress' | 'completed' | 'cancelled';

const statusVariantMap: Record<StatusType, BadgeVariant> = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  archived: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'critical',
};

const statusLabelMap: Record<StatusType, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  approved: 'Valide',
  rejected: 'Rejete',
  archived: 'Archive',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

export const StatusBadge: React.FC<{ status: StatusType; className?: string }> = ({
  status,
  className,
}) => {
  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {statusLabelMap[status]}
    </Badge>
  );
};
