import { Award } from 'lucide-react';
import { badgeDefinitions } from '../data/mockData';

export default function BadgeShowcase({ members }) {
  const memberList = members || [];

  // Count how many people have each badge
  const badgeCounts = {};
  memberList.forEach(member => {
    (member.badges || []).forEach(b => {
      badgeCounts[b] = (badgeCounts[b] || 0) + 1;
    });
  });

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award size={18} className="text-mvp-accent" />
        <h2 className="text-lg font-bold">Badges</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(badgeDefinitions).map(([id, badge]) => {
          const count = badgeCounts[id] || 0;
          const earned = count > 0;

          return (
            <div
              key={id}
              className={`rounded-xl p-3 text-center border transition-all hover:scale-105 ${
                earned
                  ? 'bg-mvp-dark border-mvp-border'
                  : 'bg-mvp-dark/50 border-mvp-border/50 opacity-40'
              }`}
            >
              <div className="text-3xl mb-1.5">{badge.icon}</div>
              <div className="text-xs font-semibold text-white/80 mb-0.5">{badge.name}</div>
              <div className="text-[10px] text-white/30 leading-tight">{badge.description}</div>
              {earned && (
                <div className="mt-1.5 text-[10px] font-medium" style={{ color: badge.color }}>
                  {count}/{memberList.length} earned
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
