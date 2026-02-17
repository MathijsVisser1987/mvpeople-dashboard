import { Trophy } from 'lucide-react';
import { formatNumber, formatTalkTime } from '../../utils/formatters';
import Avatar from '../Avatar';

export default function LeaderboardSlide({ members }) {
  if (!members || members.length === 0) {
    return <div className="text-3xl text-white/30 font-display">Loading leaderboard...</div>;
  }

  return (
    <div className="w-full max-w-[1600px]">
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={36} className="text-mvp-gold" />
        <h2 className="text-4xl font-bold font-display">Leaderboard</h2>
        <span className="text-xl text-white/30 ml-2 font-body">This Month</span>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const borderClass = rank === 1
            ? 'border-mvp-accent/40 glow-teal'
            : rank === 2
            ? 'border-gray-400/20'
            : rank === 3
            ? 'border-amber-600/20'
            : 'border-mvp-border';

          return (
            <div
              key={member.id}
              className={`bg-mvp-card rounded-2xl border ${borderClass} px-8 py-5 flex items-center gap-6 ${
                isTop3 ? 'scale-[1.02]' : ''
              }`}
            >
              {/* Rank */}
              <div className={`text-3xl font-black font-display w-12 text-center ${
                rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-500' : 'text-white/30'
              }`}>
                {rank}
              </div>

              {/* Avatar */}
              <Avatar member={member} size="w-14 h-14" textSize="text-xl" />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-white font-display">{member.name}</h3>
                <p className="text-sm text-white/40 font-body">{member.role}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-10">
                <div className="text-center">
                  <div className="text-sm text-white/40 font-display uppercase tracking-wider mb-1">Deals</div>
                  <div className="text-2xl font-bold text-mvp-success font-display">{member.deals}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-white/40 font-display uppercase tracking-wider mb-1">Calls</div>
                  <div className="text-2xl font-bold text-mvp-accent font-display">{formatNumber(member.calls)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-white/40 font-display uppercase tracking-wider mb-1">Talk</div>
                  <div className="text-2xl font-bold text-mvp-fire font-display">{formatTalkTime(member.talkTimeMinutes)}</div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right min-w-[100px]">
                <div className="text-3xl font-black gradient-gold font-display">{formatNumber(member.points)}</div>
                <div className="text-xs text-white/30 uppercase tracking-wider font-display">points</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
