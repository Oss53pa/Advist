import React from 'react';
import { Card } from './Card';

type StatsColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'navy';

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: StatsColor;
  highlight?: boolean;
  onClick?: () => void;
  active?: boolean;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  className?: string;
}

const colorClasses: Record<StatsColor, { bg: string; text: string }> = {
  blue: { bg: 'bg-advist-gold-light', text: 'text-advist-gray900' },
  green: { bg: 'bg-green-50', text: 'text-advist-success' },
  yellow: { bg: 'bg-advist-gold-light', text: 'text-advist-gold-dark' },
  red: { bg: 'bg-advist-gold-light', text: 'text-advist-error' },
  purple: { bg: 'bg-advist-surface-dark', text: 'text-advist-gray900' },
  gray: { bg: 'bg-advist-surface-dark', text: 'text-advist-text-secondary' },
  navy: { bg: 'bg-gradient-to-br from-primary-50 to-orange-50', text: 'text-advist-gold' },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  color = 'blue',
  highlight = false,
  onClick,
  active = false,
  trend,
  className = '',
}) => {
  const colors = colorClasses[color];
  const isClickable = !!onClick;

  return (
    <Card
      className={`p-4 ${isClickable ? 'cursor-pointer' : ''} ${
        active ? 'ring-2 ring-advist-navy' : ''
      } ${highlight ? 'border-advist-dark' : ''} ${className}`}
      onClick={onClick}
      hoverable={isClickable}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colors.bg}`}>
          <Icon size={20} className={colors.text} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-advist-gray900">{value}</p>
          <p className="text-sm text-advist-gray900">{label}</p>
          {trend && (
            <p
              className={`text-xs mt-1 ${
                trend.direction === 'up' ? 'text-advist-success' : 'text-advist-error'
              }`}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
