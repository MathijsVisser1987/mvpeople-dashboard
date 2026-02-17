import { TrendingUp } from 'lucide-react';
import { formatNumber, formatTalkTime } from '../../utils/formatters';
import Avatar from '../Avatar';

function CircularProgress({ value, max, color, label, displayValue }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="text-center">
      <svg width="180" height="180" className="mx-auto mb-4">
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke="#163478" strokeWidth="12"
        />
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          className="transition-all duration-1000"
        />
        <text x="90" y="85" textAnchor="middle" className="fill-white text-2xl font-bold" style={{ fontFamily: 'Montserrat' }}>
          {displayValue}
        </text>
        <text x="90" y="110" textAnchor="middle" className="fill-white/40 text-sm" style={{ fontFamily: 'Montserrat' }}>
          {Math.round(pct)}%
        </text>
      </svg>
      <div className="text-lg font-display font-semibold text-white/60">{label}</div>
    </div>
  );
}

// Monthly targets (configurable)
const TARGETS = {
  deals: 30,
  calls: 3000,
  talkTime: 5000,
};

export default function TeamTargetsSlide({ stats, members }) {
  const totalDeals = stats?.totalDeals || 0;
  const totalCalls = stats?.totalCalls || 0;
  const totalTalkTime = stats?.totalTalkTime || 0;

  return (
    <div className="w-full max-w-[1400px]">
      <div className="flex items-center gap-3 mb-10">
        <TrendingUp size={36} className="text-mvp-accent" />
        <h2 className="text-4xl font-bold font-display">Team Targets</h2>
        <span className="text-xl text-white/30 ml-2 font-body">
          {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Circular progress indicators */}
      <div className="grid grid-cols-3 gap-8 mb-10">
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
      <div className="grid grid-cols-7 gap-3">
        {(members || []).map(m => (
          <div key={m.id} className="bg-mvp-card rounded-xl border border-mvp-border p-4 text-center">
            <div className="mx-auto mb-2 w-12 h-12">
              <Avatar member={m} />
            </div>
            <div className="text-sm font-semibold font-display mb-2">{m.name}</div>
            <div className="text-lg font-bold text-mvp-success font-display">{m.deals}</div>
            <div className="text-[10px] text-white/30 font-display uppercase">deals</div>
            <div className="text-lg font-bold text-mvp-accent font-display mt-1">{m.calls}</div>
            <div className="text-[10px] text-white/30 font-display uppercase">calls</div>
          </div>
        ))}
      </div>
    </div>
  );
}
