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
  default: 'bg-[#FAF7F1] text-[#78716A]',
  secondary: 'bg-[#F1ECE1] text-[#78716A]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-600',
  info: 'bg-indigo-50 text-indigo-600',
  outline: 'bg-transparent border border-[#E8E2D6] text-[#78716A]',
  primary: 'bg-[#131C2E] text-white',
  danger: 'bg-red-500 text-white',
  critical: 'bg-[#B9975B] text-[#131C2E]',
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
