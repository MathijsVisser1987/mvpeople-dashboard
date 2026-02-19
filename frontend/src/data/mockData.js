// XP Points: 500 per deal, 0.5 per call, 0.25 per minute talk time

const POINTS_PER_DEAL = 500;
const POINTS_PER_CALL = 0.5;
const POINTS_PER_MINUTE = 0.25;

function calculatePoints(deals, calls, talkTimeMinutes) {
  return Math.round((deals * POINTS_PER_DEAL) + (calls * POINTS_PER_CALL) + (talkTimeMinutes * POINTS_PER_MINUTE));
}

export const teamMembers = [
  {
    id: 1,
    name: 'Marcos',
    avatar: 'M',
    color: '#ff6b35',
    role: 'Senior Recruiter',
    deals: 8,
    calls: 342,
    talkTimeMinutes: 1840,
    callsToday: 24,
    talkTimeToday: 86,
    pipelineValue: 124500,
    badges: ['first-deal', 'call-machine', 'pipeline-king'],
    weeklyDeals: [1, 2, 1, 0, 2, 1, 1],
    weeklyCalls: [45, 52, 48, 50, 55, 42, 50],
  },
  {
    id: 2,
    name: 'Floris',
    avatar: 'F',
    color: '#00d4ff',
    role: 'Recruiter',
    deals: 6,
    calls: 298,
    talkTimeMinutes: 1560,
    callsToday: 18,
    talkTimeToday: 62,
    pipelineValue: 98000,
    badges: ['first-deal', 'speed-demon', 'rising-star'],
    weeklyDeals: [1, 0, 2, 1, 0, 1, 1],
    weeklyCalls: [40, 38, 45, 42, 48, 43, 42],
  },
  {
    id: 3,
    name: 'Mathijs',
    avatar: 'MA',
    color: '#6c5ce7',
    role: 'Managing Director',
    deals: 5,
    calls: 189,
    talkTimeMinutes: 1120,
    callsToday: 12,
    talkTimeToday: 45,
    pipelineValue: 156000,
    badges: ['first-deal', 'pipeline-king', 'closer'],
    weeklyDeals: [1, 1, 0, 1, 0, 1, 1],
    weeklyCalls: [25, 28, 30, 22, 26, 30, 28],
  },
  {
    id: 4,
    name: 'Burcu',
    avatar: 'B',
    color: '#00e676',
    role: 'Recruiter',
    deals: 7,
    calls: 378,
    talkTimeMinutes: 2010,
    callsToday: 32,
    talkTimeToday: 94,
    pipelineValue: 89000,
    badges: ['first-deal', 'call-machine'],
    weeklyDeals: [1, 1, 1, 1, 1, 1, 1],
    weeklyCalls: [52, 55, 50, 58, 54, 56, 53],
  },
  {
    id: 5,
    name: 'Milan',
    avatar: 'MI',
    color: '#ffab00',
    role: 'Recruiter',
    deals: 4,
    calls: 256,
    talkTimeMinutes: 1340,
    callsToday: 15,
    talkTimeToday: 38,
    pipelineValue: 67000,
    badges: ['first-deal', 'rising-star'],
    weeklyDeals: [0, 1, 1, 0, 1, 0, 1],
    weeklyCalls: [35, 38, 36, 40, 32, 38, 37],
  },
  {
    id: 6,
    name: 'Viviana',
    avatar: 'V',
    color: '#ff5ecc',
    role: 'Recruiter',
    deals: 5,
    calls: 312,
    talkTimeMinutes: 1680,
    callsToday: 22,
    talkTimeToday: 71,
    pipelineValue: 82000,
    badges: ['first-deal', 'call-machine'],
    weeklyDeals: [1, 0, 1, 1, 0, 1, 1],
    weeklyCalls: [42, 48, 44, 46, 45, 43, 44],
  },
  {
    id: 7,
    name: 'Harry',
    avatar: 'H',
    color: '#ff4444',
    role: 'Recruiter',
    deals: 3,
    calls: 224,
    talkTimeMinutes: 980,
    callsToday: 10,
    talkTimeToday: 28,
    pipelineValue: 54000,
    badges: ['first-deal'],
    weeklyDeals: [0, 0, 1, 0, 1, 0, 1],
    weeklyCalls: [30, 32, 35, 28, 34, 33, 32],
  },
];

// Add computed points to each member
export const leaderboardData = teamMembers
  .map(member => ({
    ...member,
    points: calculatePoints(member.deals, member.calls, member.talkTimeMinutes),
  }))
  .sort((a, b) => b.points - a.points);

export const badgeDefinitions = {
  'first-deal': {
    name: 'First Deal',
    icon: '🎯',
    description: 'Closed your first deal',
    color: '#59D6D6',
  },
  'call-machine': {
    name: 'Call Machine',
    icon: '📞',
    description: '50+ calls in a single day',
    color: '#59D6D6',
  },
  'speed-demon': {
    name: 'Speed Demon',
    icon: '⚡',
    description: 'Closed a deal within 24 hours',
    color: '#ffab00',
  },
  'pipeline-king': {
    name: 'Pipeline King',
    icon: '👑',
    description: 'Pipeline value over €100K',
    color: '#ffd700',
  },
  'rising-star': {
    name: 'Rising Star',
    icon: '⭐',
    description: 'Most improved this month',
    color: '#00e676',
  },
  'closer': {
    name: 'Closer',
    icon: '💰',
    description: '5+ deals closed this month',
    color: '#ff5ecc',
  },
};

export const activeChallenge = {
  name: 'Lunchclub Sprint',
  description: 'Most deals + calls this week wins lunch on the company',
  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  targets: {
    deals: 3,
    calls: 50,
  },
  participants: leaderboardData.map(m => ({
    id: m.id,
    name: m.name,
    color: m.color,
    dealsProgress: Math.min(m.weeklyDeals.slice(-3).reduce((a, b) => a + b, 0), 3),
    callsProgress: Math.min(m.weeklyCalls.slice(-1)[0], 50),
    qualified: false,
  })).map(p => ({
    ...p,
    qualified: p.dealsProgress >= 3 && p.callsProgress >= 50,
  })),
};

export const teamStats = {
  totalDeals: teamMembers.reduce((sum, m) => sum + m.deals, 0),
  totalCalls: teamMembers.reduce((sum, m) => sum + m.calls, 0),
  totalPipeline: teamMembers.reduce((sum, m) => sum + m.pipelineValue, 0),
  totalTalkTime: teamMembers.reduce((sum, m) => sum + m.talkTimeMinutes, 0),
  avgDealsPerRecruiter: Math.round(teamMembers.reduce((sum, m) => sum + m.deals, 0) / teamMembers.length * 10) / 10,
};
