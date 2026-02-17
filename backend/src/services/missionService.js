// Missions system: individual challenges with progress tracking
// Missions are computed from current stats, no KV storage needed for definitions

const MISSION_DEFINITIONS = [
  // Daily missions
  {
    id: 'daily-10-calls',
    name: '10 Calls Today',
    description: 'Make at least 10 outbound calls today',
    icon: '📞',
    category: 'daily',
    xp: 25,
    check: (m) => ({ current: Math.min(m.calls, 10), target: 10 }),
  },
  {
    id: 'daily-30-calls',
    name: '30 Calls Today',
    description: 'Make at least 30 outbound calls today',
    icon: '🔥',
    category: 'daily',
    xp: 75,
    check: (m) => ({ current: Math.min(m.calls, 30), target: 30 }),
  },
  {
    id: 'daily-60min-talk',
    name: '60 Min Talk Time',
    description: 'Spend at least 60 minutes on calls today',
    icon: '🎙️',
    category: 'daily',
    xp: 50,
    check: (m) => ({ current: Math.min(m.talkTimeMinutes, 60), target: 60 }),
  },

  // Weekly missions
  {
    id: 'weekly-100-calls',
    name: 'Century Club',
    description: 'Make 100+ calls this week',
    icon: '💯',
    category: 'weekly',
    xp: 200,
    check: (m) => ({ current: Math.min(m.calls, 100), target: 100 }),
  },
  {
    id: 'weekly-1-deal',
    name: 'Weekly Closer',
    description: 'Close at least 1 deal this week',
    icon: '🤝',
    category: 'weekly',
    xp: 300,
    check: (m) => ({ current: Math.min(m.deals, 1), target: 1 }),
  },

  // Monthly missions
  {
    id: 'monthly-500-calls',
    name: 'Phone Warrior',
    description: 'Make 500+ calls this month',
    icon: '⚔️',
    category: 'monthly',
    xp: 500,
    check: (m) => ({ current: Math.min(m.calls, 500), target: 500 }),
  },
  {
    id: 'monthly-3-deals',
    name: 'Hat Trick',
    description: 'Close 3 deals in one month',
    icon: '🎩',
    category: 'monthly',
    xp: 1000,
    check: (m) => ({ current: Math.min(m.deals, 3), target: 3 }),
  },
  {
    id: 'monthly-5-deals',
    name: 'Deal Machine',
    description: 'Close 5 deals in one month',
    icon: '🏭',
    category: 'monthly',
    xp: 2000,
    check: (m) => ({ current: Math.min(m.deals, 5), target: 5 }),
  },
  {
    id: 'monthly-1000min-talk',
    name: 'Marathon Talker',
    description: 'Log 1000+ minutes of talk time this month',
    icon: '🏃',
    category: 'monthly',
    xp: 750,
    check: (m) => ({ current: Math.min(m.talkTimeMinutes, 1000), target: 1000 }),
  },
  {
    id: 'monthly-streak-5',
    name: 'Consistency King',
    description: 'Maintain a 5+ day activity streak',
    icon: '👑',
    category: 'monthly',
    xp: 400,
    check: (m) => ({ current: Math.min(m.streak, 5), target: 5 }),
  },
];

class MissionService {
  getMissions(leaderboard) {
    if (!leaderboard || leaderboard.length === 0) return [];

    return leaderboard.map(member => {
      const missions = MISSION_DEFINITIONS.map(mission => {
        const progress = mission.check(member);
        const completed = progress.current >= progress.target;
        const pct = progress.target > 0 ? Math.min(Math.round((progress.current / progress.target) * 100), 100) : 0;

        return {
          id: mission.id,
          name: mission.name,
          description: mission.description,
          icon: mission.icon,
          category: mission.category,
          xp: mission.xp,
          current: progress.current,
          target: progress.target,
          pct,
          completed,
        };
      });

      const totalXp = missions.filter(m => m.completed).reduce((sum, m) => sum + m.xp, 0);
      const completedCount = missions.filter(m => m.completed).length;

      return {
        name: member.name,
        fullName: member.fullName,
        color: member.color,
        photo: member.photo,
        avatar: member.avatar,
        missions,
        totalXp,
        completedCount,
        totalMissions: missions.length,
      };
    });
  }

  getDefinitions() {
    return MISSION_DEFINITIONS.map(({ check, ...rest }) => rest);
  }
}

const missionService = new MissionService();
export default missionService;
