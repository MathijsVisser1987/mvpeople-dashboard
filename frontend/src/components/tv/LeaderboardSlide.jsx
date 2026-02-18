import { Trophy } from 'lucide-react';
import { formatNumber, formatTalkTime } from '../../utils/formatters';
import Avatar from '../Avatar';

export default function LeaderboardSlide({ members }) {
  if (!members || members.length === 0) {
    return <div className="text-[3vh] text-white/30 font-display">Loading leaderboard...</div>;
  }

  return (
    <div className="w-full max-w-[90vw]">
      <div className="flex items-center gap-[0.8vw] mb-[2vh]">
        <Trophy className="text-mvp-gold" style={{ width: '3.5vh', height: '3.5vh' }} />
        <h2 className="text-[4vh] font-bold font-display">Leaderboard</h2>
        <span className="text-[2vh] text-white/30 ml-[0.5vw] font-body">This Month</span>
      </div>

      <div className="flex flex-col gap-[0.8vh]">
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
              className={`bg-mvp-card rounded-[1vh] border ${borderClass} px-[1.5vw] py-[1vh] flex items-center gap-[1vw] ${
                isTop3 ? 'scale-[1.01]' : ''
              }`}
            >
              {/* Rank */}
              <div className={`text-[3vh] font-black font-display w-[2.5vw] text-center ${
                rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-500' : 'text-white/30'
              }`}>
                {rank}
              </div>

              {/* Avatar */}
              <Avatar member={member} size="w-[5.5vh] h-[5.5vh]" textSize="text-[2vh]" />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[2.5vh] font-bold text-white font-display">{member.name}</h3>
                <p className="text-[1.3vh] text-white/40 font-body">{member.role}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-[2.5vw]">
                <div className="text-center">
                  <div className="text-[1.2vh] text-white/40 font-display uppercase tracking-wider mb-[0.3vh]">Deals</div>
                  <div className="text-[2.5vh] font-bold text-mvp-success font-display">{member.deals}</div>
                </div>
                <div className="text-center">
                  <div className="text-[1.2vh] text-white/40 font-display uppercase tracking-wider mb-[0.3vh]">Calls</div>
                  <div className="text-[2.5vh] font-bold text-mvp-accent font-display">{formatNumber(member.calls)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[1.2vh] text-white/40 font-display uppercase tracking-wider mb-[0.3vh]">Talk</div>
                  <div className="text-[2.5vh] font-bold text-mvp-fire font-display">{formatTalkTime(member.talkTimeMinutes)}</div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right min-w-[6vw]">
                <div className="text-[3vh] font-black gradient-gold font-display">{formatNumber(member.points)}</div>
                <div className="text-[1vh] text-white/30 uppercase tracking-wider font-display">points</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
