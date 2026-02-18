import { useState, useEffect } from 'react';
import { Target, Clock } from 'lucide-react';
import { getTimeRemaining } from '../../utils/formatters';
import Avatar from '../Avatar';

const CHALLENGE = {
  name: 'Lunchclub Sprint',
  description: 'Hit your individual deal target to win lunch on the company!',
  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
};

// Individual deal targets per team member (by shortName)
const DEAL_TARGETS = {
  Marcos: 2,
  Floris: 3,
  Mathijs: 3,
  Burcu: 1,
  Milan: 1,
  Viviana: 1,
  Harry: 1,
};

function ProgressBar({ current, target, color }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
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

  const participants = (members || []).map(m => {
    const dealTarget = DEAL_TARGETS[m.name] || 1;
    const deals = m.deals || 0;
    return {
      name: m.name,
      color: m.color,
      avatar: m.avatar,
      photo: m.photo,
      deals,
      dealTarget,
      qualified: deals >= dealTarget,
    };
  }).sort((a, b) => {
    // Sort by completion percentage descending
    const pctA = a.dealTarget > 0 ? a.deals / a.dealTarget : 0;
    const pctB = b.dealTarget > 0 ? b.deals / b.dealTarget : 0;
    return pctB - pctA;
  });

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

      {/* Participant progress — individual deal targets */}
      <div className="grid grid-cols-2 gap-[0.8vw]">
        {participants.map(p => (
          <div key={p.name} className={`bg-mvp-card rounded-[1vh] p-[1.5vh] border ${p.qualified ? 'border-mvp-success/50' : 'border-mvp-border'}`}>
            <div className="flex items-center justify-between mb-[1vh]">
              <div className="flex items-center gap-[0.5vw]">
                <Avatar member={p} size="w-[4vh] h-[4vh]" textSize="text-[1.5vh]" />
                <span className="text-[2vh] font-semibold font-display">{p.name}</span>
              </div>
              {p.qualified ? (
                <span className="text-[1.3vh] font-semibold text-mvp-success font-display">Qualified</span>
              ) : (
                <span className="text-[1.3vh] text-white/30 font-display">In Progress</span>
              )}
            </div>
            <div>
              <div className="flex justify-between text-[1.2vh] text-white/40 mb-[0.3vh] font-display">
                <span>Deals</span>
                <span className="font-semibold">{p.deals}/{p.dealTarget}</span>
              </div>
              <ProgressBar current={p.deals} target={p.dealTarget} color="#00e676" />
            </div>
          </div>
        ))}
      </div>

      {/* Lunchclub sfeer foto */}
      <div className="mt-[1.5vh] rounded-[1.5vh] overflow-hidden" style={{ maxHeight: '14vh' }}>
        <img src="/Lunchclub.png" alt="Lunchclub" className="w-full h-full object-cover rounded-[1.5vh] opacity-80" />
      </div>
    </div>
  );
}
