import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Layers, 
  Sparkles, 
  X, 
  ChevronDown, 
  ChevronUp,
  BarChart2
} from 'lucide-react';
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

export const StatsPanel: React.FC<StatsPanelProps> = ({ resources, onClose }) => {
  const [chartMode, setChartMode] = useState<'stacked' | 'total'>('stacked');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute 30-day timeline data points
  const { trendData, totalLast30Days, peakDay, mostActiveCategory, averageDaily } = useMemo(() => {
    const points: DailyTrendPoint[] = [];
    const dateMap = new Map<string, DailyTrendPoint>();

    const now = new Date();
    // Build 30 days up to today
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
        year: 'numeric' 
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

    // Aggregate items into daily buckets
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

    // Determine Peak Day
    let maxCount = 0;
    let peak: { date: string; count: number } = { date: 'None yet', count: 0 };
    points.forEach((pt) => {
      if (pt.total > maxCount) {
        maxCount = pt.total;
        peak = { date: pt.label, count: pt.total };
      }
    });

    // Determine Most Active Category
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

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DailyTrendPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-xl p-3 shadow-xl text-xs text-slate-100 min-w-[170px] backdrop-blur-md">
          <p className="font-semibold text-white border-b border-slate-800 pb-1.5 mb-2">
            {dataPoint.fullDate}
          </p>
          <div className="space-y-1 font-mono">
            {chartMode === 'stacked' ? (
              <>
                <div className="flex items-center justify-between text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Web Links:
                  </span>
                  <span>{dataPoint.Link}</span>
                </div>
                <div className="flex items-center justify-between text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Documents:
                  </span>
                  <span>{dataPoint.Document}</span>
                </div>
                <div className="flex items-center justify-between text-violet-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                    GitHub:
                  </span>
                  <span>{dataPoint.GitHub}</span>
                </div>
                <div className="flex items-center justify-between text-pink-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    Reels:
                  </span>
                  <span>{dataPoint.Reel}</span>
                </div>
                <div className="border-t border-slate-800 pt-1 mt-1 flex items-center justify-between font-semibold text-slate-200">
                  <span>Total Added:</span>
                  <span>{dataPoint.total}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Total Resources:
                </span>
                <span className="font-bold">{dataPoint.total}</span>
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
      className="mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Resource Creation Trends
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                Last 30 Days
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Daily additions, platform velocity, and collection activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart Display Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setChartMode('total')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                chartMode === 'total'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Total
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close stats"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400">Total (30 Days)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-semibold text-white tracking-tight">
                  {totalLast30Days}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">items added</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400">Daily Average</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-semibold text-white tracking-tight">
                  {averageDaily}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">res / day</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400">Peak Activity</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-semibold text-indigo-300 tracking-tight truncate">
                  {peakDay.count > 0 ? `${peakDay.count} items` : '0'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {peakDay.count > 0 ? `on ${peakDay.date}` : 'No activity'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400">Top Format</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-semibold text-white tracking-tight truncate">
                  {mostActiveCategory.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate font-mono">
                  ({mostActiveCategory.count})
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.35}
                />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  interval={4}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }}
                  iconSize={8}
                />

                {chartMode === 'stacked' ? (
                  <>
                    <Bar
                      dataKey="Link"
                      name="Web Links"
                      stackId="trendStack"
                      fill="#60a5fa"
                    />
                    <Bar
                      dataKey="Document"
                      name="Documents"
                      stackId="trendStack"
                      fill="#fbbf24"
                    />
                    <Bar
                      dataKey="GitHub"
                      name="GitHub Repos"
                      stackId="trendStack"
                      fill="#a78bfa"
                    />
                    <Bar
                      dataKey="Reel"
                      name="Reels & Media"
                      stackId="trendStack"
                      fill="#f472b6"
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                ) : (
                  <Bar
                    dataKey="total"
                    name="Total Creations"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
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
