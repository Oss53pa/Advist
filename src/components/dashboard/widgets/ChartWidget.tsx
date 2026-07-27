/**
 * Chart Widget
 * Displays various chart types (line, bar, pie, donut)
 * Data fetched from Supabase: documents and workflow steps grouped by day of week
 */
import React, { useEffect, useState } from 'react';
import { WidgetConfig } from '../../../services/dashboard';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store';

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

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export const ChartWidget: React.FC<ChartWidgetProps> = ({ config }) => {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const orgId = user?.organization?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (!orgId) {
        setData({ labels: DAY_LABELS.slice(1).concat(DAY_LABELS[0]), datasets: [] });
        setLoading(false);
        return;
      }

      try {
        // Fetch documents created in the last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const [docsRes, stepsRes] = await Promise.all([
          supabase
            .from('documents')
            .select('created_at')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .gte('created_at', fourWeeksAgo.toISOString()),
          supabase
            .from('workflow_steps')
            .select('completed_at, instance:workflow_instances!inner(organization_id)')
            .eq('instance.organization_id', orgId)
            .eq('status', 'completed')
            .gte('completed_at', fourWeeksAgo.toISOString()),
        ]);

        // Group documents by day of week (Mon-Sun order)
        const docsByDay = [0, 0, 0, 0, 0, 0, 0]; // index 0=Mon ... 6=Sun
        if (docsRes.data) {
          for (const doc of docsRes.data) {
            const jsDay = new Date(doc.created_at).getDay(); // 0=Sun
            const idx = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0
            docsByDay[idx]++;
          }
        }

        // Group validations by day of week
        const valsByDay = [0, 0, 0, 0, 0, 0, 0];
        if (stepsRes.data) {
          for (const step of stepsRes.data as any[]) {
            if (!step.completed_at) continue;
            const jsDay = new Date(step.completed_at).getDay();
            const idx = jsDay === 0 ? 6 : jsDay - 1;
            valsByDay[idx]++;
          }
        }

        const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        setData({
          labels,
          datasets: [
            { label: 'Documents', data: docsByDay, color: '#1A1A2E' },
            { label: 'Validations', data: valsByDay, color: '#7EAED9' },
          ],
        });
      } catch (err) {
        console.error('ChartWidget fetch error:', err);
        setData({
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [
            { label: 'Documents', data: [0, 0, 0, 0, 0, 0, 0], color: '#1A1A2E' },
            { label: 'Validations', data: [0, 0, 0, 0, 0, 0, 0], color: '#7EAED9' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config, orgId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse w-full h-full bg-advist-surface-dark/30 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  // Simple bar chart visualization
  const maxValue = Math.max(...data.datasets.flatMap((d) => d.data));

  return (
    <div className="h-full flex flex-col">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {data.datasets.map((dataset, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dataset.color }}></div>
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
