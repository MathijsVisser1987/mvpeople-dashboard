import { useState, useEffect } from 'react';
import { Target, Clock } from 'lucide-react';
import { getTimeRemaining } from '../../utils/formatters';
import Avatar from '../Avatar';

const CHALLENGE = {
  name: 'Lunchclub Sprint',
  description: 'Most deals + calls this week wins lunch on the company',
  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  targets: { deals: 3, calls: 50 },
};

function ProgressBar({ current, target, color }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="w-full h-4 bg-mvp-dark rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function CompetitionSlide({ members }) {
  const [time, setTime] = useState(getTimeRemaining(CHALLENGE.endDate));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(CHALLENGE.endDate)), 1000);
    return () => clearInterval(interval);
  }, []);

  const participants = (members || []).map(m => ({
    name: m.name,
    color: m.color,
    avatar: m.avatar,
    photo: m.photo,
    deals: Math.min(m.deals || 0, CHALLENGE.targets.deals),
    calls: Math.min(m.calls || 0, CHALLENGE.targets.calls),
    qualified: (m.deals || 0) >= CHALLENGE.targets.deals && (m.calls || 0) >= CHALLENGE.targets.calls,
  })).sort((a, b) => (b.deals + b.calls / CHALLENGE.targets.calls) - (a.deals + a.calls / CHALLENGE.targets.calls));

  return (
    <div className="w-full max-w-[1400px]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Target size={36} className="text-mvp-accent" />
          <div>
            <h2 className="text-4xl font-bold font-display">{CHALLENGE.name}</h2>
            <p className="text-lg text-white/40 font-body">{CHALLENGE.description}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-3">
          <Clock size={24} className="text-white/40" />
          <div className="flex gap-2">
            {[
              { value: time.days, label: 'D' },
              { value: time.hours, label: 'H' },
              { value: time.minutes, label: 'M' },
              { value: time.seconds, label: 'S' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-mvp-card rounded-xl px-4 py-3 text-center border border-mvp-border min-w-[60px]">
                <div className="text-2xl font-bold text-white font-mono">{String(value).padStart(2, '0')}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-display">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Targets */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-mvp-card rounded-xl p-5 border border-mvp-border">
          <span className="text-sm text-white/40 uppercase tracking-wider font-display">Deal Target</span>
          <div className="text-3xl font-bold text-mvp-success font-display">{CHALLENGE.targets.deals} deals</div>
        </div>
        <div className="bg-mvp-card rounded-xl p-5 border border-mvp-border">
          <span className="text-sm text-white/40 uppercase tracking-wider font-display">Call Target</span>
          <div className="text-3xl font-bold text-mvp-accent font-display">{CHALLENGE.targets.calls} calls</div>
        </div>
      </div>

      {/* Participant progress */}
      <div className="grid grid-cols-2 gap-4">
        {participants.map(p => (
          <div key={p.name} className="bg-mvp-card rounded-xl p-5 border border-mvp-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar member={p} size="w-10 h-10" textSize="text-sm" />
                <span className="text-lg font-semibold font-display">{p.name}</span>
              </div>
              {p.qualified && (
                <span className="text-sm font-semibold text-mvp-success font-display">Qualified</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm text-white/40 mb-1 font-display">
                  <span>Deals</span>
                  <span>{p.deals}/{CHALLENGE.targets.deals}</span>
                </div>
                <ProgressBar current={p.deals} target={CHALLENGE.targets.deals} color="#00e676" />
              </div>
              <div>
                <div className="flex justify-between text-sm text-white/40 mb-1 font-display">
                  <span>Calls</span>
                  <span>{p.calls}/{CHALLENGE.targets.calls}</span>
                </div>
                <ProgressBar current={p.calls} target={CHALLENGE.targets.calls} color="#59D6D6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
