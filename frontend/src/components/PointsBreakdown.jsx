import { Zap, Info } from 'lucide-react';

const rules = [
  { label: 'Deal Closed', points: '100 pts', color: 'text-mvp-success', bg: 'bg-mvp-success/10' },
  { label: 'Call Made', points: '2 pts', color: 'text-mvp-accent', bg: 'bg-mvp-accent/10' },
  { label: 'Per Minute Talk Time', points: '1 pt', color: 'text-mvp-fire', bg: 'bg-mvp-fire/10' },
];

const multipliers = [
  { label: '3+ Day Streak', mult: '1.5x', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { label: '5+ Day Streak', mult: '2x', color: 'text-red-400', bg: 'bg-red-400/10' },
];

export default function PointsBreakdown() {
  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-mvp-accent" />
        <h2 className="text-lg font-bold font-display">Points System</h2>
      </div>

      <div className="space-y-2 mb-4">
        {rules.map((rule) => (
          <div key={rule.label} className="flex items-center justify-between p-2 rounded-lg bg-mvp-dark border border-mvp-border">
            <span className="text-sm text-white/70 font-body">{rule.label}</span>
            <span className={`text-sm font-bold font-display ${rule.color}`}>{rule.points}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <Info size={12} className="text-white/30" />
        <span className="text-xs text-white/30 uppercase tracking-wider font-display">Streak Multipliers</span>
      </div>
      <div className="space-y-2">
        {multipliers.map((m) => (
          <div key={m.label} className="flex items-center justify-between p-2 rounded-lg bg-mvp-dark border border-mvp-border">
            <span className="text-sm text-white/70 font-body">{m.label}</span>
            <span className={`text-sm font-bold font-display ${m.color}`}>{m.mult}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
