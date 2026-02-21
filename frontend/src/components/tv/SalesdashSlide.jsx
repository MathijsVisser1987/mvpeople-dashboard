import { Target, TrendingUp } from 'lucide-react';
import Avatar from '../Avatar';

// Calculate overall target completion % from KPI data
function getTargetPct(member) {
  const kpis = member.kpis || [];
  if (kpis.length === 0) return 0;
  const totalActual = kpis.reduce((s, k) => s + (k.actual || 0), 0);
  const totalProRated = kpis.reduce((s, k) => s + (k.proRated || 0), 0);
  return totalProRated > 0 ? Math.round((totalActual / totalProRated) * 100) : 0;
}

function getBarColor(pct) {
  if (pct >= 100) return '#00e676'; // green
  if (pct >= 80) return '#59D6D6';  // teal
  if (pct >= 60) return '#ffab00';  // amber
  return '#ff4444';                  // red
}

// Podium medal colors
const MEDAL = {
  1: { bg: 'bg-yellow-400/15', border: 'border-yellow-400/50', text: 'text-yellow-400', label: '1st' },
  2: { bg: 'bg-gray-300/10', border: 'border-gray-300/40', text: 'text-gray-300', label: '2nd' },
  3: { bg: 'bg-amber-600/10', border: 'border-amber-600/40', text: 'text-amber-500', label: '3rd' },
};

export default function SalesdashSlide({ members }) {
  if (!members || members.length === 0) return null;

  // Sort by deals desc for sales ranking
  const salesRanked = [...members].sort((a, b) => (b.deals || 0) - (a.deals || 0));

  // Sort by target completion for the bar chart
  const targetRanked = [...members]
    .map(m => ({ ...m, targetPct: getTargetPct(m) }))
    .sort((a, b) => b.targetPct - a.targetPct);

  const maxPct = Math.max(120, ...targetRanked.map(m => m.targetPct));

  // Podium: 2nd, 1st, 3rd
  const podium = [salesRanked[1], salesRanked[0], salesRanked[2]].filter(Boolean);
  const podiumHeights = ['55%', '75%', '42%'];

  return (
    <div className="w-full max-w-[92vw] h-full flex gap-[2vw]">
      {/* LEFT: Maandtargets */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-[0.6vw] mb-[1.5vh]">
          <Target className="text-mvp-accent" style={{ width: '3vh', height: '3vh' }} />
          <h2 className="text-[3vh] font-bold font-display uppercase tracking-wide">Maandtargets</h2>
        </div>

        {/* Bar chart */}
        <div className="flex-1 flex items-end gap-[0.8vw] pb-[1vh] relative min-h-0">
          {/* 100% target line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-white/20 z-10"
            style={{ bottom: `${(100 / maxPct) * 100}%` }}
          >
            <span className="absolute right-0 -top-[2vh] text-[1.2vh] text-white/30 font-display">100%</span>
          </div>

          {targetRanked.map(member => {
            const pct = member.targetPct;
            const barHeight = `${Math.min((pct / maxPct) * 100, 100)}%`;
            const color = getBarColor(pct);

            return (
              <div key={member.id} className="flex-1 flex flex-col items-center h-full min-w-0">
                {/* Photo on top of bar */}
                <div className="mb-[0.5vh] shrink-0" style={{ width: '5vh', height: '5vh' }}>
                  <Avatar member={member} size="w-full h-full" textSize="text-[1.8vh]" borderWidth="2px" />
                </div>

                {/* Percentage */}
                <div className="text-[1.6vh] font-bold font-display mb-[0.5vh]" style={{ color }}>
                  {pct}%
                </div>

                {/* Bar */}
                <div className="flex-1 w-full flex items-end min-h-0">
                  <div className="w-full relative rounded-t-[0.5vh] overflow-hidden" style={{ height: barHeight }}>
                    <div
                      className="absolute inset-0 rounded-t-[0.5vh]"
                      style={{
                        background: `linear-gradient(to top, ${color}40, ${color}cc)`,
                      }}
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="text-[1.3vh] font-semibold font-display mt-[0.5vh] truncate w-full text-center text-white/70">
                  {member.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Sales Ranking */}
      <div className="w-[35vw] flex flex-col min-w-0">
        <div className="flex items-center gap-[0.6vw] mb-[1.5vh]">
          <TrendingUp className="text-mvp-success" style={{ width: '3vh', height: '3vh' }} />
          <h2 className="text-[3vh] font-bold font-display uppercase tracking-wide">Top Sales</h2>
          <span className="text-[1.5vh] text-white/30 font-display ml-auto">deze maand</span>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-[1vw] mb-[2vh]" style={{ height: '22vh' }}>
          {podium.map((member, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const medal = MEDAL[rank];
            const height = podiumHeights[i];

            return (
              <div key={member.id} className="flex flex-col items-center flex-1" style={{ height }}>
                {/* Avatar */}
                <div className="shrink-0 mb-[0.5vh]" style={{ width: '6vh', height: '6vh' }}>
                  <Avatar member={member} size="w-full h-full" textSize="text-[2vh]" borderWidth="2px" />
                </div>

                {/* Podium block */}
                <div className={`flex-1 w-full ${medal.bg} border-t-2 ${medal.border} rounded-t-[0.8vh] flex flex-col items-center justify-start pt-[0.8vh]`}>
                  <div className={`text-[2.5vh] font-black font-display ${medal.text}`}>{medal.label}</div>
                  <div className="text-[1.4vh] font-bold font-display text-white truncate w-full text-center px-[0.3vw]">{member.name}</div>
                  <div className="text-[2vh] font-black font-display text-mvp-success mt-[0.3vh]">{member.deals}</div>
                  <div className="text-[0.9vh] text-white/30 font-display uppercase">deals</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ranked list (remaining members) */}
        <div className="flex-1 space-y-[0.8vh] min-h-0 overflow-hidden">
          {salesRanked.slice(3).map((member, i) => (
            <div
              key={member.id}
              className="flex items-center gap-[0.6vw] bg-mvp-card/50 rounded-[0.8vh] border border-mvp-border/50 px-[0.8vw] py-[0.6vh]"
            >
              <span className="text-[1.8vh] font-black font-display text-white/30 w-[2vw] text-center">
                {i + 4}
              </span>
              <div style={{ width: '4vh', height: '4vh' }}>
                <Avatar member={member} size="w-full h-full" textSize="text-[1.5vh]" borderWidth="1px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[1.5vh] font-bold font-display truncate">{member.name}</div>
              </div>
              <div className="text-[2vh] font-black font-display text-mvp-success">{member.deals}</div>
              <div className="text-[1vh] text-white/30 font-display">deals</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
