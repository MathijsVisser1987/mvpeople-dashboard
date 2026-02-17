// Team member mappings: Vincere IDs + 8x8 Extensions
export const teamMembers = [
  {
    name: 'Burcu Yasa',
    shortName: 'Burcu',
    avatar: 'B',
    photo: '/burcu.jpg.png',
    color: '#00e676',
    role: 'Recruiter',
    vincereId: 29060,
    email: 'burcu@mvpeoplegroup.com',
    extension: '1007',
  },
  {
    name: 'Floris Akkerhuis',
    shortName: 'Floris',
    avatar: 'F',
    photo: '/floris.jpg.png',
    color: '#00d4ff',
    role: 'Recruiter',
    vincereId: 28956,
    email: 'fa@mvpeoplegroup.com',
    extension: '1001',
  },
  {
    name: 'Harry Vidler',
    shortName: 'Harry',
    avatar: 'H',
    photo: '/Harry.jpg.jpg',
    color: '#ff4444',
    role: 'Recruiter',
    vincereId: 29093,
    email: 'harry@mvpeoplegroup.com',
    extension: '1004',
  },
  {
    name: 'Marcos Sanches',
    shortName: 'Marcos',
    avatar: 'M',
    photo: '/Marcos.png',
    color: '#ff6b35',
    role: 'Senior Recruiter',
    vincereId: 28957,
    email: 'marcos@mvpeoplegroup.com',
    extension: '1002',
  },
  {
    name: 'Mathijs Visser',
    shortName: 'Mathijs',
    avatar: 'MA',
    photo: '/mathijs.png.png',
    color: '#6c5ce7',
    role: 'Managing Director',
    vincereId: 28955,
    email: 'mv@mvpeoplegroup.com',
    extension: '1000',
  },
  {
    name: 'Milan Zeedijk',
    shortName: 'Milan',
    avatar: 'MI',
    photo: '/Milan.png',
    color: '#ffab00',
    role: 'Recruiter',
    vincereId: 28994,
    email: 'milan@mvpeoplegroup.com',
    extension: '1005',
  },
  {
    name: 'Viviana Vahl',
    shortName: 'Viviana',
    avatar: 'V',
    photo: '/Viviana.jpg.jpg',
    color: '#ff5ecc',
    role: 'Recruiter',
    vincereId: 29027,
    email: 'viviana@mvpeoplegroup.com',
    extension: '1008',
  },
];

// Points system
export const POINTS_PER_DEAL = 500;
export const POINTS_PER_CALL = 2;
export const POINTS_PER_MINUTE_TALK = 1;

export function calculatePoints(deals, calls, talkTimeMinutes, streakDays, activityPoints = 0) {
  const base = (deals * POINTS_PER_DEAL) + (calls * POINTS_PER_CALL) + (talkTimeMinutes * POINTS_PER_MINUTE_TALK) + activityPoints;
  if (streakDays >= 5) return Math.round(base * 2);
  if (streakDays >= 3) return Math.round(base * 1.5);
  return base;
}

export function getMultiplier(streakDays) {
  if (streakDays >= 5) return 2;
  if (streakDays >= 3) return 1.5;
  return 1;
}

// Badge definitions
export const badgeDefinitions = {
  'first-deal': { name: 'First Deal', icon: '🎯', description: 'Closed your first deal', threshold: (s) => s.deals >= 1 },
  'call-machine': { name: 'Call Machine', icon: '📞', description: '50+ calls in a single day', threshold: (s) => s.maxDailyCalls >= 50 },
  'speed-demon': { name: 'Speed Demon', icon: '⚡', description: 'Closed a deal within 24 hours', threshold: () => false },
  'streak-master': { name: 'Streak Master', icon: '🔥', description: '5+ day activity streak', threshold: (s) => s.streak >= 5 },
  'pipeline-king': { name: 'Pipeline King', icon: '👑', description: 'Pipeline value over €100K', threshold: (s) => s.pipelineValue >= 100000 },
  'rising-star': { name: 'Rising Star', icon: '⭐', description: 'Most improved this month', threshold: () => false },
  'closer': { name: 'Closer', icon: '💰', description: '5+ deals closed this month', threshold: (s) => s.deals >= 5 },
  'iron-will': { name: 'Iron Will', icon: '💪', description: '7+ day streak', threshold: (s) => s.streak >= 7 },
};

export function computeBadges(stats) {
  return Object.entries(badgeDefinitions)
    .filter(([, def]) => def.threshold(stats))
    .map(([id]) => id);
}
