import { Trophy } from 'lucide-react';
import { formatNumber, formatTalkTime } from '../../utils/formatters';
import Avatar from '../Avatar';

const RANK_STYLES = {
  1: { border: 'border-yellow-400/50', glow: 'glow-teal', rankColor: 'text-yellow-400', bg: 'bg-yellow-400/5' },
  2: { border: 'border-gray-300/30', glow: '', rankColor: 'text-gray-300', bg: 'bg-gray-300/5' },
  3: { border: 'border-amber-600/30', glow: '', rankColor: 'text-amber-500', bg: 'bg-amber-500/5' },
};

export default function LeaderboardSlide({ members }) {
  if (!members || members.length === 0) {
    return <div className="text-[3vh] text-white/30 font-display">Loading leaderboard...</div>;
  }

  return (
    <div className="w-full max-w-[90vw]">
      <div className="flex items-center gap-[0.8vw] mb-[2.5vh]">
        <Trophy className="text-mvp-gold" style={{ width: '3.5vh', height: '3.5vh' }} />
        <h2 className="text-[4vh] font-bold font-display">Leaderboard</h2>
        <span className="text-[2vh] text-white/30 ml-[0.5vw] font-body">This Month</span>
      </div>

      <div className="grid grid-cols-7 gap-[1vw] items-end">
        {members.map((member, index) => {
          const rank = index + 1;
          const style = RANK_STYLES[rank] || { border: 'border-mvp-border', glow: '', rankColor: 'text-white/30', bg: '' };

          return (
            <div
              key={member.id}
              className={`${style.bg} bg-mvp-card rounded-[1.5vh] border ${style.border} ${style.glow} p-[1.2vh] text-center flex flex-col items-center`}
            >
              {/* Rank */}
              <div className={`text-[2.5vh] font-black font-display mb-[0.8vh] ${style.rankColor}`}>
                #{rank}
              </div>

              {/* Avatar */}
              <div className="mb-[0.8vh]" style={{ width: '7vh', height: '7vh' }}>
                <Avatar member={member} size="w-full h-full" textSize="text-[2.5vh]" borderWidth="2px" />
              </div>

              {/* Name */}
              <div className="text-[1.8vh] font-bold text-white font-display mb-[0.3vh] truncate w-full">{member.name}</div>
              <div className="text-[1vh] text-white/30 font-body mb-[1vh] truncate w-full">{member.role}</div>

              {/* Points */}
              <div className="text-[2.5vh] font-black gradient-gold font-display leading-none">{formatNumber(member.points)}</div>
              <div className="text-[0.9vh] text-white/30 uppercase tracking-wider font-display mb-[1vh]">points</div>

              {/* Stats */}
              <div className="w-full space-y-[0.5vh]">
                <div className="flex justify-between items-center">
                  <span className="text-[1vh] text-white/40 font-display">Deals</span>
                  <span className="text-[1.6vh] font-bold text-mvp-success font-display">{member.deals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[1vh] text-white/40 font-display">Calls</span>
                  <span className="text-[1.6vh] font-bold text-mvp-accent font-display">{formatNumber(member.calls)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[1vh] text-white/40 font-display">Talk</span>
                  <span className="text-[1.6vh] font-bold text-mvp-fire font-display">{formatTalkTime(member.talkTimeMinutes)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
