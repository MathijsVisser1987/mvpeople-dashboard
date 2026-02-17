import { Trophy, Flame, TrendingUp, Phone, Briefcase, Clock, Loader2 } from 'lucide-react';
import { badgeDefinitions } from '../data/mockData';
import { formatCurrency, formatNumber, formatTalkTime } from '../utils/formatters';

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center glow-gold">
        <Trophy size={18} className="text-yellow-900" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
        <span className="text-gray-800 font-bold text-sm">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
        <span className="text-amber-200 font-bold text-sm">3</span>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-mvp-border flex items-center justify-center">
      <span className="text-white/50 font-bold text-sm">{rank}</span>
    </div>
  );
}

function StreakIndicator({ streak }) {
  if (!streak || streak < 3) return null;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      streak >= 5
        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    }`}>
      <Flame size={12} />
      <span>{streak}d</span>
      <span className="text-[10px] opacity-70">
        {streak >= 5 ? '2x' : '1.5x'}
      </span>
    </div>
  );
}

function MemberRow({ member, rank }) {
  const isTop3 = rank <= 3;
  const borderClass = rank === 1
    ? 'border-yellow-500/30 glow-gold'
    : rank === 2
    ? 'border-gray-400/20'
    : rank === 3
    ? 'border-amber-600/20'
    : 'border-mvp-border';

  return (
    <div
      className={`bg-mvp-card rounded-xl border ${borderClass} p-4 hover:bg-mvp-card/80 transition-all hover:scale-[1.01] ${
        isTop3 ? 'animate-slide-up' : ''
      }`}
      style={{ animationDelay: `${rank * 0.05}s` }}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <RankBadge rank={rank} />

        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
          style={{ backgroundColor: member.color + '20', color: member.color, border: `2px solid ${member.color}40` }}
        >
          {member.avatar}
        </div>

        {/* Name & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white truncate">{member.name}</h3>
            <StreakIndicator streak={member.streak} />
          </div>
          <p className="text-xs text-white/40">{member.role}</p>
          {/* Badges row */}
          <div className="flex gap-1 mt-1">
            {(member.badges || []).slice(0, 4).map(badgeId => {
              const badge = badgeDefinitions[badgeId];
              if (!badge) return null;
              return (
                <span
                  key={badgeId}
                  className="text-sm cursor-default"
                  title={`${badge.name}: ${badge.description}`}
                >
                  {badge.icon}
                </span>
              );
            })}
            {(member.badges || []).length > 4 && (
              <span className="text-xs text-white/30">+{member.badges.length - 4}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:grid grid-cols-4 gap-6 text-right">
          <div>
            <div className="flex items-center justify-end gap-1 text-white/40 mb-0.5">
              <Briefcase size={11} />
              <span className="text-[10px] uppercase tracking-wider">Deals</span>
            </div>
            <span className="text-lg font-bold text-mvp-success">{member.deals}</span>
          </div>
          <div>
            <div className="flex items-center justify-end gap-1 text-white/40 mb-0.5">
              <Phone size={11} />
              <span className="text-[10px] uppercase tracking-wider">Calls</span>
            </div>
            <span className="text-lg font-bold text-mvp-electric">{formatNumber(member.calls)}</span>
          </div>
          <div>
            <div className="flex items-center justify-end gap-1 text-white/40 mb-0.5">
              <Clock size={11} />
              <span className="text-[10px] uppercase tracking-wider">Talk</span>
            </div>
            <span className="text-lg font-bold text-mvp-fire">{formatTalkTime(member.talkTimeMinutes)}</span>
          </div>
          <div>
            <div className="flex items-center justify-end gap-1 text-white/40 mb-0.5">
              <TrendingUp size={11} />
              <span className="text-[10px] uppercase tracking-wider">Pipeline</span>
            </div>
            <span className="text-lg font-bold text-mvp-gold">{formatCurrency(member.pipelineValue)}</span>
          </div>
        </div>

        {/* Points */}
        <div className="text-right ml-2">
          <div className="text-2xl font-black gradient-gold">{formatNumber(member.points)}</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider">points</div>
        </div>
      </div>

      {/* Mobile stats */}
      <div className="sm:hidden grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-mvp-border">
        <div className="text-center">
          <div className="text-xs text-white/40">Deals</div>
          <div className="font-bold text-mvp-success">{member.deals}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/40">Calls</div>
          <div className="font-bold text-mvp-electric">{member.calls}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/40">Talk</div>
          <div className="font-bold text-mvp-fire">{formatTalkTime(member.talkTimeMinutes)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/40">Pipeline</div>
          <div className="font-bold text-mvp-gold">{formatCurrency(member.pipelineValue)}</div>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard({ members, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-mvp-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={20} className="text-mvp-gold" />
        <h2 className="text-lg font-bold">Leaderboard</h2>
        <span className="text-xs text-white/30 ml-1">This Month</span>
      </div>
      <div className="space-y-2">
        {(members || []).map((member, index) => (
          <MemberRow key={member.id} member={member} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
