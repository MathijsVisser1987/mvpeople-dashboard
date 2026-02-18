import { PartyPopper } from 'lucide-react';
import Avatar from '../Avatar';

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RecentWinsSlide({ celebrations }) {
  if (!celebrations || celebrations.length === 0) {
    return (
      <div className="text-center">
        <PartyPopper className="text-mvp-accent mx-auto mb-[3vh] opacity-30" style={{ width: '8vh', height: '8vh' }} />
        <h2 className="text-[5vh] font-bold font-display text-white/30 mb-[2vh]">Recent Wins</h2>
        <p className="text-[2.5vh] text-white/20 font-body">No celebrations yet. Close a deal to be the first!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[90vw]">
      <div className="flex items-center gap-[0.8vw] mb-[3vh]">
        <PartyPopper className="text-mvp-accent" style={{ width: '3.5vh', height: '3.5vh' }} />
        <h2 className="text-[4vh] font-bold font-display">Recent Wins</h2>
      </div>

      <div className="grid grid-cols-2 gap-[1vw]">
        {celebrations.slice(0, 8).map((cel) => (
          <div
            key={cel.id}
            className="bg-mvp-card rounded-[1.5vh] border border-mvp-border p-[2vh] flex items-center gap-[1vw]"
          >
            <Avatar
              member={{ name: cel.recruiterName, avatar: cel.recruiterAvatar, photo: cel.recruiterPhoto, color: cel.recruiterColor }}
              size="w-[7vh] h-[7vh]"
              textSize="text-[2.5vh]"
              borderWidth="3px"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-[3vh] font-bold text-white font-display">{cel.recruiterName}</h3>
              <p className="text-[2vh] text-mvp-accent font-display">Deal #{cel.dealCount}</p>
              <p className="text-[1.3vh] text-white/30 font-body">{timeAgo(cel.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
