import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';

type ChartType = 'area' | 'bar' | 'line';

interface PremiumChartProps {
  data: Record<string, unknown>[];
  type?: ChartType;
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string; // default: gold #B9975B
  secondaryDataKey?: string;
  secondaryColor?: string;
  showGrid?: boolean;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 bg-[#131C2E] dark:bg-[#1B2740] border border-[#1B2740] shadow-xl">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold tabular-nums text-white">
          {entry.value?.toLocaleString?.() ?? entry.value}
        </p>
      ))}
    </div>
  );
};

export const PremiumChart: React.FC<PremiumChartProps> = ({
  data,
  type = 'area',
  dataKey,
  xAxisKey = 'name',
  title,
  subtitle,
  height = 280,
  color = '#B9975B',
  secondaryDataKey,
  secondaryColor = '#131C2E',
  showGrid = true,
  className = '',
}) => {
  const gradientId = `premium-grad-${dataKey}`;
  const secondaryGradientId = `premium-grad-secondary-${dataKey}`;

  const axisStyle = {
    fontSize: 11,
    fontWeight: 500,
    fill: '#94a3b8',
  };

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />}
          <XAxis dataKey={xAxisKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
          {secondaryDataKey && (
            <Bar dataKey={secondaryDataKey} fill={secondaryColor} radius={[6, 6, 0, 0]} />
          )}
        </BarChart>
      );
    }

    if (type === 'line') {
      return (
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />}
          <XAxis dataKey={xAxisKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />
          {secondaryDataKey && (
            <Line
              type="monotone"
              dataKey={secondaryDataKey}
              stroke={secondaryColor}
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
          )}
        </LineChart>
      );
    }

    // Default: area
    return (
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          {secondaryDataKey && (
            <linearGradient id={secondaryGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />}
        <XAxis dataKey={xAxisKey} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
        {secondaryDataKey && (
          <Area
            type="monotone"
            dataKey={secondaryDataKey}
            stroke={secondaryColor}
            strokeWidth={2}
            fill={`url(#${secondaryGradientId})`}
            dot={false}
          />
        )}
      </AreaChart>
    );
  };

  return (
    <div
      className={`
        rounded-2xl p-5
        bg-white dark:bg-slate-900
        border border-slate-200/60 dark:border-slate-700/40
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]
        ${className}
      `}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-5">
          {title && (
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          )}
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
