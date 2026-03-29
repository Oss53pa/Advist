import React from 'react';

interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  color = 'bg-advist-dark',
  height = 40,
  className = '',
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className={`flex items-end gap-1 ${className}`} style={{ height }}>
      {data.map((value, index) => (
        <div
          key={index}
          className={`w-2 rounded-t ${color} opacity-60 hover:opacity-100 transition-opacity`}
          style={{ height: `${((value - min) / range) * 100}%`, minHeight: '4px' }}
        />
      ))}
    </div>
  );
};

export default MiniChart;
