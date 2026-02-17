import { useState, useEffect } from 'react';
import { Trophy, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLeagues } from '../hooks/useLeagues';
import { formatNumber, formatTalkTime, getTimeRemaining } from '../utils/formatters';
import Avatar from '../components/Avatar';

function formatMetricValue(value, metric) {
  if (metric === 'talkTimeMinutes') return formatTalkTime(value);
  return formatNumber(value);
}

function CountdownTimer({ endDate }) {
  const [time, setTime] = useState(getTimeRemaining(new Date(endDate)));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(new Date(endDate))), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="flex items-center gap-2">
      <Clock size={14} className="text-white/40" />
      <span className="text-sm font-mono text-white/50">
        {time.days}d {String(time.hours).padStart(2, '0')}h {String(time.minutes).padStart(2, '0')}m
      </span>
    </div>
  );
}

function LeagueCard({ league }) {
  const [expanded, setExpanded] = useState(false);
  const top3 = (league.standings || []).slice(0, 3);
  const rest = (league.standings || []).slice(3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-mvp-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{league.icon}</span>
            <div>
              <h3 className="text-xl font-bold font-display">{league.name}</h3>
              <p className="text-sm text-white/40 font-body">{league.description}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs uppercase tracking-wider font-display px-2 py-1 rounded-full ${
              league.period === 'week'
                ? 'bg-mvp-accent/20 text-mvp-accent'
                : 'bg-mvp-gold/20 text-mvp-gold'
            }`}>
              {league.period === 'week' ? 'Weekly' : 'Monthly'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30 font-body">Prize: {league.prize}</p>
          <CountdownTimer endDate={league.endDate} />
        </div>
      </div>

      {/* Top 3 */}
      <div className="p-5 space-y-3">
        {top3.map((p, i) => (
          <div key={p.name} className={`flex items-center gap-3 p-3 rounded-lg ${
            i === 0 ? 'bg-mvp-accent/10 border border-mvp-accent/20' : ''
          }`}>
            <span className="text-lg w-8 text-center">{medals[i]}</span>
            <Avatar member={p} size="w-10 h-10" textSize="text-sm" />
            <span className="flex-1 font-display font-semibold">{p.name}</span>
            <span className={`font-display font-bold text-lg ${
              i === 0 ? 'text-mvp-accent' : 'text-white/60'
            }`}>
              {formatMetricValue(p.value, league.metric)}
            </span>
          </div>
        ))}

        {/* Expandable rest */}
        {rest.length > 0 && (
          <>
            {expanded && rest.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg">
                <span className="text-sm text-white/30 w-8 text-center font-display">{i + 4}</span>
                <Avatar member={p} size="w-10 h-10" textSize="text-sm" />
                <span className="flex-1 font-display">{p.name}</span>
                <span className="font-display text-white/40">
                  {formatMetricValue(p.value, league.metric)}
                </span>
              </div>
            ))}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-mvp-accent/60 hover:text-mvp-accent font-display transition-colors w-full text-center py-2"
            >
              {expanded ? 'Show less' : `Show ${rest.length} more`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Leagues() {
  const { leagues, loading } = useLeagues();

  return (
    <div className="min-h-screen bg-mvp-dark">
      {/* Header */}
      <header className="border-b border-mvp-border bg-mvp-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <img src="/mvpeople-logo.png" alt="MVPeople" className="h-8" />
          <Trophy size={20} className="text-mvp-gold" />
          <h1 className="text-xl font-bold font-display">Leagues</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-mvp-accent" />
          </div>
        ) : leagues.length === 0 ? (
          <div className="text-center py-20 text-white/30 font-body">
            No league data available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {leagues.map(league => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
