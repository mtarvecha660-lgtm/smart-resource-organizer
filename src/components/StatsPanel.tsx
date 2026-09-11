// File: src/components/StatsPanel.tsx
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { ResourceItem, ResourceCategory } from '../types/resource';

interface StatsPanelProps {
  resources: ResourceItem[];
  onClose?: () => void;
}

interface DailyTrendPoint {
  dateKey: string;
  label: string;
  fullDate: string;
  Link: number;
  Document: number;
  GitHub: number;
  Reel: number;
  total: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyTrendPoint;
    dataKey: string;
    value: number;
    color: string;
  }>;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ resources, onClose }) => {
  const [chartMode, setChartMode] = useState<'stacked' | 'total'>('stacked');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute 30-day timeline metrics
  const { trendData, totalLast30Days, peakDay, mostActiveCategory, averageDaily } = useMemo(() => {
    const points: DailyTrendPoint[] = [];
    const dateMap = new Map<string, DailyTrendPoint>();

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
      const fullDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);

      const entry: DailyTrendPoint = {
        dateKey,
        label,
        fullDate,
        Link: 0,
        Document: 0,
        GitHub: 0,
        Reel: 0,
        total: 0,
      };

      dateMap.set(dateKey, entry);
      points.push(entry);
    }

    const categoryCounts: Record<ResourceCategory, number> = {
      Link: 0,
      Document: 0,
      GitHub: 0,
      Reel: 0,
    };

    let total30 = 0;

    resources.forEach((item) => {
      if (!item.createdAt) return;

      let dateObj: Date | null = null;
      if ('toDate' in item.createdAt && typeof item.createdAt.toDate === 'function') {
        dateObj = item.createdAt.toDate();
      } else if ('seconds' in item.createdAt && typeof item.createdAt.seconds === 'number') {
        dateObj = new Date(item.createdAt.seconds * 1000);
      }

      if (!dateObj || isNaN(dateObj.getTime())) return;

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const entry = dateMap.get(key);
      if (entry) {
        if (item.category in entry) {
          entry[item.category as keyof Pick<DailyTrendPoint, 'Link' | 'Document' | 'GitHub' | 'Reel'>] += 1;
        }
        entry.total += 1;
        total30 += 1;
        categoryCounts[item.category] += 1;
      }
    });

    let maxCount = 0;
    let peak: { date: string; count: number } = { date: 'None', count: 0 };
    points.forEach((pt) => {
      if (pt.total > maxCount) {
        maxCount = pt.total;
        peak = { date: pt.label, count: pt.total };
      }
    });

    let topCategory: { name: string; count: number } = { name: 'None', count: 0 };
    (Object.keys(categoryCounts) as ResourceCategory[]).forEach((cat) => {
      if (categoryCounts[cat] > topCategory.count) {
        topCategory = { name: cat, count: categoryCounts[cat] };
      }
    });

    const avg = (total30 / 30).toFixed(1);

    return {
      trendData: points,
      totalLast30Days: total30,
      peakDay: peak,
      mostActiveCategory: topCategory,
      averageDaily: avg,
    };
  }, [resources]);

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 shadow-md text-xs font-mono">
          <p className="text-zinc-900 dark:text-zinc-100 font-semibold border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1.5 font-sans">
            {dataPoint.fullDate}
          </p>
          <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
            {chartMode === 'stacked' ? (
              <>
                <div className="flex justify-between gap-4">
                  <span>Links:</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{dataPoint.Link}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Documents:</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{dataPoint.Document}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>GitHub:</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{dataPoint.GitHub}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Reels:</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{dataPoint.Reel}</span>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1 flex justify-between gap-4 font-semibold text-zinc-900 dark:text-zinc-100">
                  <span>Total:</span>
                  <span>{dataPoint.total}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between gap-4 font-semibold text-zinc-900 dark:text-zinc-100">
                <span>Total:</span>
                <span>{dataPoint.total}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="stats-panel"
      className="mb-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Activity Metrics
              </h2>
              <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60">
                30d window
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded border border-zinc-200 dark:border-zinc-700/60 font-mono text-[10px]">
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setChartMode('total')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                chartMode === 'total'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Total
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Minimalist Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
            <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                30-Day Ingest
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {totalLast30Days}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">items</span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Daily Velocity
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {averageDaily}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">avg / day</span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Peak Velocity
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {peakDay.count}
                </span>
                <span className="font-mono text-[10px] text-zinc-400 truncate">
                  {peakDay.count > 0 ? `on ${peakDay.date}` : 'zero'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Primary Category
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {mostActiveCategory.name}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  ({mostActiveCategory.count})
                </span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="w-full h-52 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid
                  stroke="#71717a"
                  strokeDasharray="2 2"
                  vertical={false}
                  opacity={0.15}
                />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={{ stroke: '#52525b', opacity: 0.3 }}
                  interval={4}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={{ stroke: '#52525b', opacity: 0.3 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '8px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#a1a1aa',
                  }}
                  iconSize={7}
                />

                {chartMode === 'stacked' ? (
                  <>
                    <Bar
                      dataKey="Link"
                      name="Links"
                      stackId="trendStack"
                      fill="#71717a"
                    />
                    <Bar
                      dataKey="Document"
                      name="Docs"
                      stackId="trendStack"
                      fill="#a1a1aa"
                    />
                    <Bar
                      dataKey="GitHub"
                      name="GitHub"
                      stackId="trendStack"
                      fill="#52525b"
                    />
                    <Bar
                      dataKey="Reel"
                      name="Reels"
                      stackId="trendStack"
                      fill="#d4d4d8"
                      radius={[2, 2, 0, 0]}
                    />
                  </>
                ) : (
                  <Bar
                    dataKey="total"
                    name="Creations"
                    fill="#71717a"
                    radius={[2, 2, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
