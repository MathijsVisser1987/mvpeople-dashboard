import { formatNumber } from '../../utils/formatters';
import Avatar from '../Avatar';

const MEDALS = { 1: '\uD83E\uDD47', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };

const RANK_STYLES = {
  1: { border: 'border-yellow-400/50', bg: 'bg-yellow-400/5', rankColor: 'text-yellow-400' },
  2: { border: 'border-gray-300/30', bg: 'bg-gray-300/5', rankColor: 'text-gray-300' },
  3: { border: 'border-amber-600/30', bg: 'bg-amber-500/5', rankColor: 'text-amber-500' },
};

export default function MVPOfYearSlide({ standings }) {
  if (!standings || standings.length === 0) {
    return <div className="text-[3vh] text-white/30 font-display">Loading YTD standings...</div>;
  }

  return (
    <div className="w-full max-w-[90vw]">
      <div className="flex items-center gap-[0.8vw] mb-[2.5vh]">
        <span style={{ fontSize: '3.5vh' }}>{'\uD83C\uDFC6'}</span>
        <h2 className="text-[4vh] font-bold font-display">MVP of the Year 2026</h2>
        <span className="text-[2vh] text-white/30 ml-[0.5vw] font-body">Year-to-Date</span>
      </div>

      <div className="grid grid-cols-7 gap-[1vw] items-end">
        {standings.slice(0, 7).map((entry) => {
          const style = RANK_STYLES[entry.rank] || { border: 'border-mvp-border', bg: '', rankColor: 'text-white/30' };
          const medal = MEDALS[entry.rank];
          const member = { name: entry.name, color: entry.color, photo: entry.photo, avatar: entry.name?.[0] };

          return (
            <div
              key={entry.vincereId}
              className={`${style.bg} bg-mvp-card rounded-[1.5vh] border ${style.border} p-[1.2vh] text-center flex flex-col items-center`}
            >
              {/* Rank / Medal */}
              <div className={`text-[2.5vh] font-black font-display mb-[0.5vh] ${style.rankColor}`}>
                {medal || `#${entry.rank}`}
              </div>

              {/* Avatar */}
              <div className="mb-[0.8vh]" style={{ width: '7vh', height: '7vh' }}>
                <Avatar member={member} size="w-full h-full" textSize="text-[2.5vh]" borderWidth="2px" />
              </div>

              {/* Name */}
              <div className="text-[1.8vh] font-bold text-white font-display mb-[0.5vh] truncate w-full">{entry.name}</div>

              {/* Total YTD Points */}
              <div className="text-[2.8vh] font-black gradient-gold font-display leading-none">{formatNumber(entry.totalPoints)}</div>
              <div className="text-[0.9vh] text-white/30 uppercase tracking-wider font-display mb-[1vh]">ytd xp</div>

              {/* Current month */}
              <div className="w-full space-y-[0.5vh]">
                <div className="flex justify-between items-center">
                  <span className="text-[1vh] text-white/40 font-display">This Month</span>
                  <span className="text-[1.4vh] font-bold text-mvp-accent font-display">{formatNumber(entry.currentMonthPoints)}</span>
                </div>
                {/* Gap to position above */}
                {entry.pointsGap > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[1vh] text-white/40 font-display">Gap</span>
                    <span className="text-[1.4vh] font-bold text-red-400 font-display">-{formatNumber(entry.pointsGap)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
