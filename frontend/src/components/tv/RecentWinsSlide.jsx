import { PartyPopper, Briefcase, Users, UserCheck, Send } from 'lucide-react';
import Avatar from '../Avatar';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ACTIVITY_ICONS = {
  MOVE_CANDIDATE_TO_1ST_INTERVIEW: UserCheck,
  MOVE_CANDIDATE_TO_2ND_INTERVIEW: UserCheck,
  MOVE_CANDIDATE_TO_3RD_INTERVIEW: UserCheck,
  MEETING_ARRANGED_WITH_CONTACT: Users,
  PLACEMENT_PERMANENT: Briefcase,
  PLACEMENT_CONTRACT: Briefcase,
  CV_SENT_TO_CLIENT: Send,
};

const ACTIVITY_COLORS = {
  MOVE_CANDIDATE_TO_1ST_INTERVIEW: 'text-purple-400',
  MOVE_CANDIDATE_TO_2ND_INTERVIEW: 'text-purple-400',
  MOVE_CANDIDATE_TO_3RD_INTERVIEW: 'text-purple-400',
  MEETING_ARRANGED_WITH_CONTACT: 'text-blue-400',
  PLACEMENT_PERMANENT: 'text-mvp-success',
  PLACEMENT_CONTRACT: 'text-mvp-success',
  CV_SENT_TO_CLIENT: 'text-orange-400',
};

export default function RecentWinsSlide({ celebrations, activityWins }) {
  // Merge deal celebrations and activity wins into one sorted list
  const allWins = [];

  // Add deal celebrations
  if (celebrations?.length) {
    for (const cel of celebrations) {
      allWins.push({
        id: cel.id,
        type: 'deal',
        recruiterName: cel.recruiterName,
        recruiterAvatar: cel.recruiterAvatar,
        recruiterPhoto: cel.recruiterPhoto,
        recruiterColor: cel.recruiterColor,
        label: `Deal #${cel.dealCount}`,
        detail: null,
        timestamp: cel.timestamp,
      });
    }
  }

  // Add activity wins (interviews, meetings, etc.)
  if (activityWins?.length) {
    for (const act of activityWins) {
      // Build detail string from candidate/company/job info
      const parts = [];
      if (act.candidateName) parts.push(act.candidateName);
      if (act.companyName) parts.push(act.companyName);
      if (act.contactName && !parts.includes(act.contactName)) parts.push(act.contactName);
      if (act.jobTitle) parts.push(act.jobTitle);

      allWins.push({
        id: `act_${act.activityName}_${act.createdDate}_${act.recruiterName}`,
        type: 'activity',
        activityName: act.activityName,
        recruiterName: act.recruiterName,
        recruiterAvatar: act.recruiterAvatar,
        recruiterPhoto: act.recruiterPhoto,
        recruiterColor: act.recruiterColor,
        label: act.label,
        detail: parts.length > 0 ? parts.join(' — ') : null,
        timestamp: act.createdDate,
      });
    }
  }

  // Sort by timestamp descending
  allWins.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  // Deduplicate by id
  const seen = new Set();
  const uniqueWins = allWins.filter(w => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });

  const wins = uniqueWins.slice(0, 8);

  if (wins.length === 0) {
    return (
      <div className="text-center">
        <PartyPopper className="text-mvp-accent mx-auto mb-[3vh] opacity-30" style={{ width: '8vh', height: '8vh' }} />
        <h2 className="text-[5vh] font-bold font-display text-white/30 mb-[2vh]">Recent Wins</h2>
        <p className="text-[2.5vh] text-white/20 font-body">No wins yet this month. Keep pushing!</p>
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
        {wins.map((win) => {
          const Icon = win.type === 'deal' ? Briefcase : (ACTIVITY_ICONS[win.activityName] || PartyPopper);
          const colorClass = win.type === 'deal' ? 'text-mvp-success' : (ACTIVITY_COLORS[win.activityName] || 'text-mvp-accent');

          return (
            <div
              key={win.id}
              className="bg-mvp-card rounded-[1.5vh] border border-mvp-border p-[1.8vh] flex items-center gap-[1vw]"
            >
              <Avatar
                member={{ name: win.recruiterName, avatar: win.recruiterAvatar, photo: win.recruiterPhoto, color: win.recruiterColor }}
                size="w-[6vh] h-[6vh]"
                textSize="text-[2vh]"
                borderWidth="3px"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-[2.5vh] font-bold text-white font-display">{win.recruiterName}</h3>
                <div className="flex items-center gap-[0.4vw]">
                  <Icon className={colorClass} style={{ width: '2vh', height: '2vh' }} />
                  <span className={`text-[1.8vh] font-semibold font-display ${colorClass}`}>{win.label}</span>
                </div>
                {win.detail && (
                  <p className="text-[1.3vh] text-white/50 font-body truncate mt-[0.2vh]">{win.detail}</p>
                )}
                <p className="text-[1.1vh] text-white/25 font-body mt-[0.2vh]">{timeAgo(win.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
