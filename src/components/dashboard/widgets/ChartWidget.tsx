/**
 * Chart Widget
 * Displays various chart types (line, bar, pie, donut)
 */
import React, { useEffect, useState } from 'react';
import { WidgetConfig } from '../../../services/dashboard';

interface ChartWidgetProps {
  config: WidgetConfig;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({ config }) => {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Mock chart data
      const mockData: ChartData = {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Documents',
            data: [12, 19, 8, 15, 22, 5, 3],
            color: '#1A1A2E',
          },
          {
            label: 'Validations',
            data: [8, 15, 6, 12, 18, 4, 2],
            color: '#7EAED9',
          },
        ],
      };

      setData(mockData);
      setLoading(false);
    };

    fetchData();
  }, [config]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse w-full h-full bg-advist-surface-dark/30 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  // Simple bar chart visualization
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));

  return (
    <div className="h-full flex flex-col">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {data.datasets.map((dataset, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.color }}
            ></div>
            <span className="text-xs text-advist-gray900/70">{dataset.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-2">
        {data.labels.map((label, idx) => (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className="w-full flex items-end justify-center gap-1 h-32">
              {data.datasets.map((dataset, datasetIdx) => (
                <div
                  key={datasetIdx}
                  className="w-3 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(dataset.data[idx] / maxValue) * 100}%`,
                    backgroundColor: dataset.color,
                    minHeight: '4px',
                  }}
                  title={`${dataset.label}: ${dataset.data[idx]}`}
                ></div>
              ))}
            </div>
            <span className="text-xs text-advist-gray900/50 mt-2">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartWidget;
