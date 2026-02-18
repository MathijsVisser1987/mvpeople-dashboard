import { TrendingUp } from 'lucide-react';
import { formatNumber, formatTalkTime } from '../../utils/formatters';
import Avatar from '../Avatar';

function CircularProgress({ value, max, color, label, displayValue }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = 40;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="text-center">
      <div className="relative mx-auto mb-[0.8vh]" style={{ width: '13vh', height: '13vh' }}>
        {/* SVG ring only */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50" cy="50" r={radius}
            fill="none" stroke="#163478" strokeWidth={strokeWidth}
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
        {/* HTML text overlay — always centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[2.2vh] font-bold text-white font-display leading-tight">{displayValue}</span>
          <span className="text-[1.3vh] text-white/40 font-display leading-tight">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-[1.6vh] font-display font-semibold text-white/60">{label}</div>
    </div>
  );
}

// Monthly targets (configurable)
const TARGETS = {
  deals: 30,
  calls: 2000,
  talkTime: 5000,
};

export default function TeamTargetsSlide({ stats, members }) {
  const totalDeals = stats?.totalDeals || 0;
  const totalCalls = stats?.totalCalls || 0;
  const totalTalkTime = stats?.totalTalkTime || 0;

  return (
    <div className="w-full max-w-[90vw]">
      <div className="flex items-center gap-[0.8vw] mb-[2vh]">
        <TrendingUp className="text-mvp-accent" style={{ width: '3.5vh', height: '3.5vh' }} />
        <h2 className="text-[3.5vh] font-bold font-display">Team Targets</h2>
        <span className="text-[1.8vh] text-white/30 ml-[0.5vw] font-body">
          {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Circular progress indicators */}
      <div className="grid grid-cols-3 gap-[2vw] mb-[2vh]">
        <CircularProgress
          value={totalDeals}
          max={TARGETS.deals}
          color="#00e676"
          label="Total Deals"
          displayValue={totalDeals}
        />
        <CircularProgress
          value={totalCalls}
          max={TARGETS.calls}
          color="#59D6D6"
          label="Total Calls"
          displayValue={formatNumber(totalCalls)}
        />
        <CircularProgress
          value={totalTalkTime}
          max={TARGETS.talkTime}
          color="#ff6b35"
          label="Talk Time"
          displayValue={formatTalkTime(totalTalkTime)}
        />
      </div>

      {/* Individual contributions */}
      <div className="grid grid-cols-7 gap-[1vw]">
        {(members || []).map(m => (
          <div key={m.id} className="bg-mvp-card rounded-[1vh] border border-mvp-border p-[1.2vh] text-center">
            <div className="mx-auto mb-[0.8vh]" style={{ width: '7vh', height: '7vh' }}>
              <Avatar member={m} size="w-full h-full" textSize="text-[2.5vh]" />
            </div>
            <div className="text-[1.8vh] font-semibold font-display mb-[0.8vh] truncate">{m.name}</div>
            <div className="text-[2.5vh] font-bold text-mvp-success font-display leading-none">{m.deals}</div>
            <div className="text-[1.1vh] text-white/30 font-display uppercase mb-[0.5vh]">deals</div>
            <div className="text-[2.5vh] font-bold text-mvp-accent font-display leading-none">{m.calls}</div>
            <div className="text-[1.1vh] text-white/30 font-display uppercase">calls</div>
            {m.headhuntChallenge && (
              <div className="w-full mt-[0.8vh] pt-[0.6vh] border-t border-white/10">
                <div className="flex justify-between text-[0.9vh] text-amber-400/80 font-display mb-[0.3vh]">
                  <span>Headhunt</span>
                  <span>{m.headhuntChallenge.current}/{m.headhuntChallenge.target}</span>
                </div>
                <div className="h-[0.6vh] bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((m.headhuntChallenge.current / m.headhuntChallenge.target) * 100, 100)}%`,
                      background: m.headhuntChallenge.qualified
                        ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(90deg, #d97706, #b45309)',
                    }}
                  />
                </div>
                {m.headhuntChallenge.qualified && (
                  <div className="text-[0.8vh] text-amber-400 font-bold font-display mt-[0.3vh] uppercase">Qualified!</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
