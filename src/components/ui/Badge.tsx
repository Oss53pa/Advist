import React from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline'
  | 'primary'
  | 'danger'
  | 'critical'
  | 'secondary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#f7f8fa] text-[#5e6b7d]',
  secondary: 'bg-[#f0f2f5] text-[#5e6b7d]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-600',
  info: 'bg-indigo-50 text-indigo-600',
  outline: 'bg-transparent border border-[#e1e5ec] text-[#5e6b7d]',
  primary: 'bg-[#0f172a] text-white',
  danger: 'bg-red-500 text-white',
  critical: 'bg-[#b8a47e] text-[#0f172a]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
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
        inline-flex items-center font-semibold rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

type StatusType =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const statusVariantMap: Record<StatusType, BadgeVariant> = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  archived: 'default',
  in_progress: 'info',
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
