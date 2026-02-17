import { Bell, Briefcase, Phone, Award, Flame } from 'lucide-react';

// Generate activity feed from leaderboard data
function generateActivities(members) {
  if (!members || members.length === 0) return [];

  const activities = [];
  const iconMap = {
    deal: { icon: Briefcase, color: 'text-mvp-success' },
    badge: { icon: Award, color: 'text-mvp-accent' },
    calls: { icon: Phone, color: 'text-mvp-accent' },
    streak: { icon: Flame, color: 'text-mvp-fire' },
  };

  // Create activities based on real stats
  for (const m of members) {
    if (m.deals > 0) {
      activities.push({
        type: 'deal',
        name: m.name,
        message: `has ${m.deals} deal${m.deals !== 1 ? 's' : ''} closed this month`,
        sort: m.deals * 10,
        ...iconMap.deal,
      });
    }
    if (m.streak >= 5) {
      activities.push({
        type: 'streak',
        name: m.name,
        message: `is on a ${m.streak}-day streak! (2x multiplier)`,
        sort: m.streak * 5,
        ...iconMap.streak,
      });
    }
    if (m.calls >= 50) {
      activities.push({
        type: 'calls',
        name: m.name,
        message: `made ${m.calls} calls this month`,
        sort: m.calls / 10,
        ...iconMap.calls,
      });
    }
    if ((m.badges || []).length >= 3) {
      activities.push({
        type: 'badge',
        name: m.name,
        message: `has earned ${m.badges.length} badges`,
        sort: m.badges.length * 3,
        ...iconMap.badge,
      });
    }
  }

  // Sort by impact
  activities.sort((a, b) => b.sort - a.sort);
  return activities.slice(0, 8);
}

export default function ActivityFeed({ members }) {
  const activities = generateActivities(members);

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={18} className="text-mvp-warning" />
        <h2 className="text-lg font-bold font-display">Activity Feed</h2>
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-4 font-body">No activity yet</p>
        ) : (
          activities.map((activity, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-mvp-dark/50 transition-colors"
            >
              <div className={`mt-0.5 ${activity.color}`}>
                <activity.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body">
                  <span className="font-semibold text-white font-display">{activity.name}</span>{' '}
                  <span className="text-white/50">{activity.message}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
