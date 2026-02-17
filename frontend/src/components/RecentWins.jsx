import { PartyPopper } from 'lucide-react';
import Avatar from './Avatar';

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RecentWins({ celebrations }) {
  if (!celebrations || celebrations.length === 0) return null;

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-accent/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <PartyPopper size={18} className="text-mvp-accent" />
        <h2 className="text-lg font-bold font-display">Recent Wins</h2>
      </div>

      <div className="space-y-3">
        {celebrations.map((cel) => (
          <div
            key={cel.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-mvp-dark/50 transition-colors"
          >
            <Avatar
              member={{ name: cel.recruiterName, avatar: cel.recruiterAvatar, photo: cel.recruiterPhoto, color: cel.recruiterColor }}
              size="w-8 h-8"
              textSize="text-xs"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body">
                <span className="font-semibold text-white font-display">{cel.recruiterName}</span>{' '}
                <span className="text-white/50">closed deal #{cel.dealCount}</span>
              </p>
              <p className="text-[10px] text-white/30">{timeAgo(cel.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
