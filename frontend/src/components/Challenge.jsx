import { useState, useEffect } from 'react';
import { Target, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getTimeRemaining } from '../utils/formatters';

// Challenge config - editable
const CHALLENGE_CONFIG = {
  name: 'Lunchclub Sprint',
  description: 'Most deals + calls this week wins lunch on the company',
  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  targets: {
    deals: 3,
    calls: 50,
  },
};

function CountdownTimer({ endDate }) {
  const [time, setTime] = useState(getTimeRemaining(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (time.total <= 0) {
    return <span className="text-mvp-fire font-bold font-display">ENDED</span>;
  }

  return (
    <div className="flex gap-2">
      {[
        { value: time.days, label: 'D' },
        { value: time.hours, label: 'H' },
        { value: time.minutes, label: 'M' },
        { value: time.seconds, label: 'S' },
      ].map(({ value, label }) => (
        <div key={label} className="bg-mvp-dark rounded-lg px-2.5 py-1.5 text-center min-w-[44px] border border-mvp-border">
          <div className="text-lg font-bold text-white font-mono">
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-[9px] text-white/30 uppercase tracking-widest font-display">{label}</div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ current, target, color }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="w-full h-2 bg-mvp-dark rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function Challenge({ members }) {
  const challenge = CHALLENGE_CONFIG;
  const memberList = members || [];

  // Build participant progress from real data
  const participants = memberList.map(m => {
    const dealsProgress = Math.min(m.deals || 0, challenge.targets.deals);
    const callsProgress = Math.min(m.calls || 0, challenge.targets.calls);
    return {
      id: m.id,
      name: m.name,
      color: m.color,
      dealsProgress,
      callsProgress,
      qualified: dealsProgress >= challenge.targets.deals && callsProgress >= challenge.targets.calls,
    };
  }).sort((a, b) => (b.dealsProgress + b.callsProgress / challenge.targets.calls) - (a.dealsProgress + a.callsProgress / challenge.targets.calls));

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-accent/30 p-5 glow-accent">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} className="text-mvp-accent" />
            <h2 className="text-lg font-bold font-display">{challenge.name}</h2>
          </div>
          <p className="text-sm text-white/50 font-body">{challenge.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-white/40" />
          <CountdownTimer endDate={challenge.endDate} />
        </div>
      </div>

      {/* Targets */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-mvp-dark rounded-lg p-3 border border-mvp-border">
          <span className="text-xs text-white/40 uppercase tracking-wider font-display">Deal Target</span>
          <div className="text-xl font-bold text-mvp-success font-display">{challenge.targets.deals} deals</div>
        </div>
        <div className="bg-mvp-dark rounded-lg p-3 border border-mvp-border">
          <span className="text-xs text-white/40 uppercase tracking-wider font-display">Call Target</span>
          <div className="text-xl font-bold text-mvp-accent font-display">{challenge.targets.calls} calls</div>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-2.5">
        {participants.map(p => (
          <div key={p.id} className="bg-mvp-dark rounded-lg p-3 border border-mvp-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display"
                  style={{ backgroundColor: p.color + '20', color: p.color }}
                >
                  {p.name[0]}
                </div>
                <span className="font-medium text-sm font-display">{p.name}</span>
              </div>
              {p.qualified ? (
                <div className="flex items-center gap-1 text-xs text-mvp-success font-display">
                  <CheckCircle2 size={14} />
                  <span className="font-semibold">Qualified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-white/30 font-display">
                  <XCircle size={14} />
                  <span>In Progress</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] text-white/40 mb-1 font-display">
                  <span>Deals</span>
                  <span>{p.dealsProgress}/{challenge.targets.deals}</span>
                </div>
                <ProgressBar current={p.dealsProgress} target={challenge.targets.deals} color="#00e676" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/40 mb-1 font-display">
                  <span>Calls</span>
                  <span>{p.callsProgress}/{challenge.targets.calls}</span>
                </div>
                <ProgressBar current={p.callsProgress} target={challenge.targets.calls} color="#59D6D6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
