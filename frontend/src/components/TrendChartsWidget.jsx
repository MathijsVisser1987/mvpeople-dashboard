import { BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useHistory } from '../hooks/useHistory';
import { formatNumber, formatTalkTime } from '../utils/formatters';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-mvp-card border border-mvp-border rounded-lg p-2 shadow-lg text-xs">
      <p className="text-white/40 font-display mb-0.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-display" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function MiniChart({ data, dataKey, color, label }) {
  if (data.length === 0) {
    return (
      <div className="bg-mvp-dark/50 rounded-lg border border-mvp-border p-3 text-center">
        <p className="text-xs text-white/20 font-body">No trend data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-mvp-dark/50 rounded-lg border border-mvp-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-display font-semibold text-white/60">{label}</span>
        <span className="text-sm font-bold font-display" style={{ color }}>
          {data.length > 0 ? data[data.length - 1]?.value ?? 0 : 0}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data}>
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} name={label} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrendChartsWidget() {
  const { history, loading } = useHistory(14);

  if (loading) return null;

  const metrics = [
    { key: 'totalDeals', label: 'Deals', color: '#00e676' },
    { key: 'totalCalls', label: 'Calls', color: '#59D6D6' },
    { key: 'totalTalkTime', label: 'Talk Time', color: '#ff6b35' },
    { key: 'totalPipeline', label: 'Pipeline', color: '#ffd700' },
  ];

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-mvp-accent" />
        <h2 className="text-lg font-bold font-display">Trends</h2>
        <span className="text-xs text-white/30 font-body ml-1">Last {history.length} days</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(metric => {
          const data = [...history].reverse().map(h => ({
            date: h.date?.substring(5),
            value: h.teamStats?.[metric.key] || 0,
          }));

          return (
            <MiniChart
              key={metric.key}
              data={data}
              dataKey="value"
              color={metric.color}
              label={metric.label}
            />
          );
        })}
      </div>
    </div>
  );
}
