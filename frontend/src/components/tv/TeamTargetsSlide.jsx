import { TrendingUp } from 'lucide-react';
import { formatNumber, formatTalkTime } from '../../utils/formatters';
import Avatar from '../Avatar';

function CircularProgress({ value, max, color, label, displayValue }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const size = 18; // vh units
  const svgSize = size;
  const radius = size * 0.39;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;

  return (
    <div className="text-center">
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="mx-auto mb-[1.5vh]"
        style={{ width: `${svgSize}vh`, height: `${svgSize}vh` }}
      >
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="#163478" strokeWidth={size * 0.067}
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={color} strokeWidth={size * 0.067}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-1000"
        />
        <text x={center} y={center - 0.5} textAnchor="middle" dominantBaseline="auto" className="fill-white font-bold" style={{ fontFamily: 'Montserrat', fontSize: `${size * 0.14}vh` }}>
          {displayValue}
        </text>
        <text x={center} y={center + size * 0.12} textAnchor="middle" dominantBaseline="auto" className="fill-white/40" style={{ fontFamily: 'Montserrat', fontSize: `${size * 0.08}vh` }}>
          {Math.round(pct)}%
        </text>
      </svg>
      <div className="text-[2vh] font-display font-semibold text-white/60">{label}</div>
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
    <div className="w-full max-w-[90vw]">
      <div className="flex items-center gap-[0.8vw] mb-[3vh]">
        <TrendingUp className="text-mvp-accent" style={{ width: '3.5vh', height: '3.5vh' }} />
        <h2 className="text-[4vh] font-bold font-display">Team Targets</h2>
        <span className="text-[2vh] text-white/30 ml-[0.5vw] font-body">
          {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Circular progress indicators */}
      <div className="grid grid-cols-3 gap-[2vw] mb-[3vh]">
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
      <div className="grid grid-cols-7 gap-[0.5vw]">
        {(members || []).map(m => (
          <div key={m.id} className="bg-mvp-card rounded-[1vh] border border-mvp-border p-[1vh] text-center">
            <div className="mx-auto mb-[0.5vh]" style={{ width: '5vh', height: '5vh' }}>
              <Avatar member={m} />
            </div>
            <div className="text-[1.5vh] font-semibold font-display mb-[0.5vh]">{m.name}</div>
            <div className="text-[2vh] font-bold text-mvp-success font-display">{m.deals}</div>
            <div className="text-[0.9vh] text-white/30 font-display uppercase">deals</div>
            <div className="text-[2vh] font-bold text-mvp-accent font-display mt-[0.3vh]">{m.calls}</div>
            <div className="text-[0.9vh] text-white/30 font-display uppercase">calls</div>
          </div>
        ))}
      </div>
    </div>
  );
}
