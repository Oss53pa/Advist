import React from 'react';

// Map des couleurs ADVIST
const colorMap: Record<string, string> = {
  'advist-navy': '#252D44',
  'advist-blue-light': '#7EAED9',
  'advist-red': '#F59E0B',
  'advist-earth': '#8C3A27',
  'advist-bg': '#E8EAEC',
  'advist-gray-cold': '#E8EAEC',
};

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
  className?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 60,
  strokeWidth = 6,
  color = 'advist-navy',
  trackColor = 'advist-bg',
  showValue = true,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Résoudre la couleur (soit depuis le map, soit utiliser directement si c'est déjà hex/rgb)
  const resolveColor = (c: string) => colorMap[c] || (c.startsWith('#') || c.startsWith('rgb') ? c : '#252D44');

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolveColor(trackColor)}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolveColor(color)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-advist-gray900">{value}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressCircle;
