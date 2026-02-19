import { Zap } from 'lucide-react';

// Color palette for XP rules display
const COLORS = [
  'text-mvp-success',
  'text-blue-400',
  'text-purple-400',
  'text-cyan-400',
  'text-indigo-400',
  'text-yellow-400',
  'text-green-400',
  'text-orange-400',
  'text-pink-400',
  'text-mvp-accent',
  'text-mvp-fire',
];

function formatPoints(pts, salesdagPts) {
  const label = pts >= 1 ? `${pts} XP` : `${pts} XP`;
  if (salesdagPts) return `${label} (${salesdagPts} on Thu)`;
  return label;
}

export default function PointsBreakdown({ xpRules, isSalesdag }) {
  // Use API data (single source of truth from backend/src/config/team.js XP_RULES)
  const rules = xpRules || [];

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-mvp-accent" />
        <h2 className="text-lg font-bold font-display">XP Points</h2>
        {isSalesdag && (
          <span className="text-[10px] font-bold text-orange-400 bg-orange-400/15 px-2 py-0.5 rounded-full font-display">
            SALESDAG 2X
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {rules.map((rule, i) => (
          <div key={rule.label} className="flex items-center justify-between p-2 rounded-lg bg-mvp-dark border border-mvp-border">
            <span className="text-xs text-white/70 font-body">{rule.label}</span>
            <span className={`text-xs font-bold font-display ${COLORS[i % COLORS.length]}`}>
              {formatPoints(rule.points, rule.salesdagPoints)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
