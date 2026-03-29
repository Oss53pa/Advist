import React from 'react';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileX,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon size={48} className="mx-auto text-advist-blue-light mb-4" />
      <h3 className="text-lg font-medium text-advist-gray900">{title}</h3>
      {description && (
        <p className="text-advist-gray900 mt-1 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
