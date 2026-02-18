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
      <svg
        viewBox="0 0 100 100"
        className="mx-auto mb-[0.8vh]"
        style={{ width: '13vh', height: '13vh' }}
      >
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
        <text x="50" y="45" textAnchor="middle" dominantBaseline="central"
          fill="white" fontWeight="bold" fontFamily="Montserrat" fontSize="16">
          {displayValue}
        </text>
        <text x="50" y="62" textAnchor="middle" dominantBaseline="central"
          fill="rgba(255,255,255,0.4)" fontFamily="Montserrat" fontSize="10">
          {Math.round(pct)}%
        </text>
      </svg>
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
      <div className="grid grid-cols-7 gap-[0.8vw]">
        {(members || []).map(m => (
          <div key={m.id} className="bg-mvp-card rounded-[1vh] border border-mvp-border p-[1vh] text-center">
            <div className="mx-auto mb-[0.5vh]" style={{ width: '4vh', height: '4vh' }}>
              <Avatar member={m} />
            </div>
            <div className="text-[1.4vh] font-semibold font-display mb-[0.3vh] whitespace-nowrap overflow-visible">{m.name}</div>
            <div className="text-[1.8vh] font-bold text-mvp-success font-display">{m.deals}</div>
            <div className="text-[0.8vh] text-white/30 font-display uppercase">deals</div>
            <div className="text-[1.8vh] font-bold text-mvp-accent font-display mt-[0.2vh]">{m.calls}</div>
            <div className="text-[0.8vh] text-white/30 font-display uppercase">calls</div>
          </div>
        ))}
      </div>
    </div>
  );
}
