import { useState, useEffect } from 'react';
import { Trophy, Clock } from 'lucide-react';
import { useLeagues } from '../hooks/useLeagues';
import { formatNumber, formatTalkTime, getTimeRemaining } from '../utils/formatters';
import Avatar from './Avatar';

function formatMetricValue(value, metric) {
  if (metric === 'talkTimeMinutes') return formatTalkTime(value);
  return formatNumber(value);
}

function MiniCountdown({ endDate }) {
  const [time, setTime] = useState(getTimeRemaining(new Date(endDate)));
  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(new Date(endDate))), 60000);
    return () => clearInterval(interval);
  }, [endDate]);
  return (
    <span className="text-[10px] text-white/30 font-mono">
      {time.days}d {time.hours}h left
    </span>
  );
}

function LeagueRow({ league }) {
  const top3 = (league.standings || []).slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-mvp-dark/50 rounded-lg p-3 border border-mvp-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{league.icon}</span>
          <span className="text-sm font-display font-bold">{league.name}</span>
          <span className={`text-[10px] uppercase tracking-wider font-display px-1.5 py-0.5 rounded ${
            league.period === 'week' ? 'bg-mvp-accent/10 text-mvp-accent' : 'bg-mvp-gold/10 text-mvp-gold'
          }`}>
            {league.period === 'week' ? 'W' : 'M'}
          </span>
        </div>
        <MiniCountdown endDate={league.endDate} />
      </div>
      <div className="space-y-1.5">
        {top3.map((p, i) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="text-xs w-5">{medals[i]}</span>
            <Avatar member={p} size="w-6 h-6" textSize="text-[10px]" />
            <span className="flex-1 text-xs font-display">{p.name}</span>
            <span className={`text-xs font-bold font-display ${i === 0 ? 'text-mvp-accent' : 'text-white/40'}`}>
              {formatMetricValue(p.value, league.metric)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaguesWidget() {
  const { leagues, loading } = useLeagues();

  if (loading || leagues.length === 0) return null;

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-mvp-gold" />
        <h2 className="text-lg font-bold font-display">Leagues</h2>
      </div>
      <div className="space-y-3">
        {leagues.map(league => (
          <LeagueRow key={league.id} league={league} />
        ))}
      </div>
    </div>
  );
}
