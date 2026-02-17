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
        <PartyPopper size={64} className="text-mvp-accent mx-auto mb-6 opacity-30" />
        <h2 className="text-4xl font-bold font-display text-white/30 mb-4">Recent Wins</h2>
        <p className="text-xl text-white/20 font-body">No celebrations yet. Close a deal to be the first!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px]">
      <div className="flex items-center gap-3 mb-8">
        <PartyPopper size={36} className="text-mvp-accent" />
        <h2 className="text-4xl font-bold font-display">Recent Wins</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {celebrations.slice(0, 8).map((cel) => (
          <div
            key={cel.id}
            className="bg-mvp-card rounded-2xl border border-mvp-border p-6 flex items-center gap-5"
          >
            <Avatar
              member={{ name: cel.recruiterName, avatar: cel.recruiterAvatar, photo: cel.recruiterPhoto, color: cel.recruiterColor }}
              size="w-16 h-16"
              textSize="text-2xl"
              borderWidth="3px"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-white font-display">{cel.recruiterName}</h3>
              <p className="text-lg text-mvp-accent font-display">Deal #{cel.dealCount}</p>
              <p className="text-sm text-white/30 font-body">{timeAgo(cel.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
