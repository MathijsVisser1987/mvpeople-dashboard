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
    <div className="w-full h-[1.2vh] bg-mvp-dark rounded-full overflow-hidden">
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
    <div className="w-full max-w-[90vw]">
      <div className="flex items-center justify-between mb-[2.5vh]">
        <div className="flex items-center gap-[0.8vw]">
          <Target className="text-mvp-accent" style={{ width: '3.5vh', height: '3.5vh' }} />
          <div>
            <h2 className="text-[4vh] font-bold font-display">{CHALLENGE.name}</h2>
            <p className="text-[1.8vh] text-white/40 font-body">{CHALLENGE.description}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-[0.8vw]">
          <Clock className="text-white/40" style={{ width: '2.5vh', height: '2.5vh' }} />
          <div className="flex gap-[0.4vw]">
            {[
              { value: time.days, label: 'D' },
              { value: time.hours, label: 'H' },
              { value: time.minutes, label: 'M' },
              { value: time.seconds, label: 'S' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-mvp-card rounded-[0.8vh] px-[0.8vw] py-[0.8vh] text-center border border-mvp-border min-w-[3vw]">
                <div className="text-[2.5vh] font-bold text-white font-mono">{String(value).padStart(2, '0')}</div>
                <div className="text-[0.9vh] text-white/30 uppercase tracking-widest font-display">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Targets */}
      <div className="grid grid-cols-2 gap-[1vw] mb-[2vh]">
        <div className="bg-mvp-card rounded-[1vh] p-[1.5vh] border border-mvp-border">
          <span className="text-[1.3vh] text-white/40 uppercase tracking-wider font-display">Deal Target</span>
          <div className="text-[3.5vh] font-bold text-mvp-success font-display">{CHALLENGE.targets.deals} deals</div>
        </div>
        <div className="bg-mvp-card rounded-[1vh] p-[1.5vh] border border-mvp-border">
          <span className="text-[1.3vh] text-white/40 uppercase tracking-wider font-display">Call Target</span>
          <div className="text-[3.5vh] font-bold text-mvp-accent font-display">{CHALLENGE.targets.calls} calls</div>
        </div>
      </div>

      {/* Participant progress */}
      <div className="grid grid-cols-2 gap-[0.8vw]">
        {participants.map(p => (
          <div key={p.name} className="bg-mvp-card rounded-[1vh] p-[1.5vh] border border-mvp-border">
            <div className="flex items-center justify-between mb-[1vh]">
              <div className="flex items-center gap-[0.5vw]">
                <Avatar member={p} size="w-[4vh] h-[4vh]" textSize="text-[1.5vh]" />
                <span className="text-[2vh] font-semibold font-display">{p.name}</span>
              </div>
              {p.qualified && (
                <span className="text-[1.3vh] font-semibold text-mvp-success font-display">Qualified</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-[1vw]">
              <div>
                <div className="flex justify-between text-[1.2vh] text-white/40 mb-[0.3vh] font-display">
                  <span>Deals</span>
                  <span>{p.deals}/{CHALLENGE.targets.deals}</span>
                </div>
                <ProgressBar current={p.deals} target={CHALLENGE.targets.deals} color="#00e676" />
              </div>
              <div>
                <div className="flex justify-between text-[1.2vh] text-white/40 mb-[0.3vh] font-display">
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
