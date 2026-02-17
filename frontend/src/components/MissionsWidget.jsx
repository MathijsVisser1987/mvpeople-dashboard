import { useState } from 'react';
import { Target, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useMissions } from '../hooks/useMissions';
import Avatar from './Avatar';

function MiniProgressBar({ pct, completed }) {
  return (
    <div className="w-full h-1.5 bg-mvp-dark rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: completed ? '#00e676' : '#59D6D6' }}
      />
    </div>
  );
}

export default function MissionsWidget() {
  const { missions, loading } = useMissions();
  const [expanded, setExpanded] = useState(null);

  if (loading || missions.length === 0) return null;

  const sorted = [...missions].sort((a, b) => b.totalXp - a.totalXp);

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-mvp-accent" />
        <h2 className="text-lg font-bold font-display">Missions</h2>
      </div>

      <div className="space-y-2">
        {sorted.map(m => (
          <div key={m.name} className="bg-mvp-dark/50 rounded-lg border border-mvp-border overflow-hidden">
            {/* Summary row */}
            <button
              onClick={() => setExpanded(expanded === m.name ? null : m.name)}
              className="w-full flex items-center gap-3 p-3 hover:bg-mvp-dark/80 transition-colors"
            >
              <Avatar member={m} size="w-8 h-8" textSize="text-xs" />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-semibold">{m.name}</span>
                  <span className="text-[10px] text-white/30 font-display">
                    {m.completedCount}/{m.totalMissions}
                  </span>
                </div>
                <MiniProgressBar pct={(m.completedCount / m.totalMissions) * 100} completed={m.completedCount === m.totalMissions} />
              </div>
              <span className="text-sm font-bold text-mvp-gold font-display">{m.totalXp} XP</span>
              {expanded === m.name ? (
                <ChevronUp size={14} className="text-white/30" />
              ) : (
                <ChevronDown size={14} className="text-white/30" />
              )}
            </button>

            {/* Expanded missions */}
            {expanded === m.name && (
              <div className="px-3 pb-3 space-y-1.5">
                {m.missions.map(mission => (
                  <div key={mission.id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                    mission.completed ? 'bg-mvp-success/5' : ''
                  }`}>
                    <span>{mission.icon}</span>
                    <span className={`flex-1 font-display ${mission.completed ? 'text-white/60' : ''}`}>
                      {mission.name}
                    </span>
                    <span className="text-white/30 font-mono">{mission.current}/{mission.target}</span>
                    {mission.completed && <CheckCircle2 size={12} className="text-mvp-success" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
