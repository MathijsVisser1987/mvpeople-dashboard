import { formatNumber } from '../utils/formatters';

const MEDALS = { 1: '\uD83E\uDD47', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };

export default function MVPOfYear({ standings }) {
  if (!standings || standings.length === 0) return null;

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{'\uD83C\uDFC6'}</span>
        <h3 className="text-sm font-bold font-display">MVP of the Year 2026</h3>
        <span className="text-[10px] text-white/30 ml-auto font-body">YTD</span>
      </div>

      <div className="space-y-2">
        {standings.map((entry) => {
          const medal = MEDALS[entry.rank];
          return (
            <div key={entry.vincereId} className="flex items-center gap-2.5">
              {/* Rank */}
              <span className="w-6 text-center text-sm font-display">
                {medal || <span className="text-white/30 text-xs">#{entry.rank}</span>}
              </span>

              {/* Avatar */}
              <div className="w-7 h-7 rounded-full overflow-hidden bg-mvp-dark flex items-center justify-center shrink-0">
                {entry.photo ? (
                  <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold font-display" style={{ color: entry.color }}>{entry.name?.[0]}</span>
                )}
              </div>

              {/* Name + current month */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white font-display truncate">{entry.name}</div>
                <div className="text-[10px] text-white/30 font-body">
                  +{formatNumber(entry.currentMonthPoints)} this month
                </div>
              </div>

              {/* Total points */}
              <div className="text-right">
                <div className="text-sm font-bold font-display" style={{ color: entry.color }}>
                  {formatNumber(entry.totalPoints)}
                </div>
                {entry.pointsGap > 0 && (
                  <div className="text-[10px] text-red-400/70 font-display">-{formatNumber(entry.pointsGap)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
