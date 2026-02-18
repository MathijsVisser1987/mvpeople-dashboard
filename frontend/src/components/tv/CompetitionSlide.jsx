import { useState, useEffect } from 'react';
import { Target, Clock, Trophy } from 'lucide-react';
import { getTimeRemaining } from '../../utils/formatters';
import Avatar from '../Avatar';

// End of current month
function endOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}

// Challenge config — easy to swap for different competitions
const CHALLENGE = {
  name: 'Lunchclub Sprint',
  description: 'Hit your individual deal target to win lunch on the company!',
  prize: 'Restaurant TBD ★',
  prizeImage: '/Lunchclub.png',
  endDate: endOfMonth(),
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

function ProgressBar({ current, target }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="w-full h-[1.2vh] bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00e676, #69f0ae)' }}
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
    const pctA = a.dealTarget > 0 ? a.deals / a.dealTarget : 0;
    const pctB = b.dealTarget > 0 ? b.deals / b.dealTarget : 0;
    return pctB - pctA;
  });

  return (
    <div className="w-full max-w-[90vw] relative rounded-[2vh] overflow-hidden">
      {/* Background restaurant image */}
      <img
        src={CHALLENGE.prizeImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay gradient for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(11,36,92,0.88) 0%, rgba(11,36,92,0.78) 40%, rgba(11,36,92,0.85) 100%)',
        }}
      />

      {/* Content — layered on top */}
      <div className="relative z-10 p-[2.5vh]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-[2vh]">
          <div className="flex items-center gap-[0.8vw]">
            <Target className="text-mvp-accent" style={{ width: '3.5vh', height: '3.5vh' }} />
            <div>
              <h2 className="text-[4vh] font-bold font-display text-white">{CHALLENGE.name}</h2>
              <p className="text-[1.8vh] text-white/50 font-body">{CHALLENGE.description}</p>
            </div>
          </div>

          {/* Prize badge + Countdown */}
          <div className="flex items-center gap-[1.5vw]">
            <div className="flex items-center gap-[0.4vw] bg-white/10 backdrop-blur-sm rounded-full px-[1vw] py-[0.6vh] border border-white/10">
              <Trophy className="text-mvp-gold" style={{ width: '2vh', height: '2vh' }} />
              <span className="text-[1.5vh] font-semibold text-mvp-gold font-display">{CHALLENGE.prize}</span>
            </div>
            <div className="flex items-center gap-[0.6vw]">
              <Clock className="text-white/40" style={{ width: '2.5vh', height: '2.5vh' }} />
              <div className="flex gap-[0.4vw]">
                {[
                  { value: time.days, label: 'D' },
                  { value: time.hours, label: 'H' },
                  { value: time.minutes, label: 'M' },
                  { value: time.seconds, label: 'S' },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-white/10 backdrop-blur-sm rounded-[0.8vh] px-[0.8vw] py-[0.6vh] text-center border border-white/10 min-w-[3vw]">
                    <div className="text-[2.5vh] font-bold text-white font-mono">{String(value).padStart(2, '0')}</div>
                    <div className="text-[0.9vh] text-white/30 uppercase tracking-widest font-display">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Participant progress cards */}
        <div className="grid grid-cols-2 gap-[0.8vw]">
          {participants.map(p => (
            <div
              key={p.name}
              className={`backdrop-blur-sm rounded-[1vh] p-[1.5vh] border ${
                p.qualified
                  ? 'bg-mvp-success/15 border-mvp-success/40'
                  : 'bg-white/8 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-[1vh]">
                <div className="flex items-center gap-[0.5vw]">
                  <Avatar member={p} size="w-[4vh] h-[4vh]" textSize="text-[1.5vh]" />
                  <span className="text-[2vh] font-semibold font-display text-white">{p.name}</span>
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
                <ProgressBar current={p.deals} target={p.dealTarget} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
