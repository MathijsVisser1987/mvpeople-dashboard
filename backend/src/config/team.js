// Team member mappings: Vincere IDs + 8x8 Extensions
export const teamMembers = [
  {
    name: 'Burcu Yasa',
    shortName: 'Burcu',
    avatar: 'B',
    photo: '/burcu.jpg.png',
    color: '#00e676',
    role: 'Recruitment Consultant',
    vincereId: 29060,
    email: 'burcu@mvpeoplegroup.com',
    extension: '1007',
    targetProfile: 'starter',
  },
  {
    name: 'Floris Akkerhuis',
    shortName: 'Floris',
    avatar: 'F',
    photo: '/floris.jpg.png',
    color: '#00d4ff',
    role: 'Recruitment Consultant',
    vincereId: 28956,
    email: 'fa@mvpeoplegroup.com',
    extension: '1001',
    targetProfile: 'recruiter360',
  },
  {
    name: 'Harry Vidler',
    shortName: 'Harry',
    avatar: 'H',
    photo: '/Harry.jpg.jpg',
    color: '#ff4444',
    role: 'Recruitment Consultant',
    vincereId: 29093,
    email: 'harry@mvpeoplegroup.com',
    extension: '1004',
    targetProfile: 'starter',
  },
  {
    name: 'Marcos Sanches',
    shortName: 'Marcos',
    avatar: 'M',
    photo: '/Marcos.png',
    color: '#ff6b35',
    role: 'Recruitment Consultant',
    vincereId: 28957,
    email: 'marcos@mvpeoplegroup.com',
    extension: '1002',
    targetProfile: 'recruiter360',
  },
  {
    name: 'Mathijs Visser',
    shortName: 'Mathijs',
    avatar: 'MA',
    photo: '/mathijs.png.png',
    color: '#6c5ce7',
    role: 'Recruitment Consultant',
    vincereId: 28955,
    email: 'mv@mvpeoplegroup.com',
    extension: '1000',
    targetProfile: 'recruiter360',
  },
  {
    name: 'Milan Zeedijk',
    shortName: 'Milan',
    avatar: 'MI',
    photo: '/Milan.png',
    color: '#ffab00',
    role: 'Recruitment Consultant',
    vincereId: 28994,
    email: 'milan@mvpeoplegroup.com',
    extension: '1005',
    targetProfile: 'starter',
  },
  {
    name: 'Viviana Vahl',
    shortName: 'Viviana',
    avatar: 'V',
    photo: '/Viviana.jpg.jpg',
    color: '#ff5ecc',
    role: 'Recruitment Consultant',
    vincereId: 29027,
    email: 'viviana@mvpeoplegroup.com',
    extension: '1008',
    targetProfile: 'starter',
  },
];

// Salesdag: double points on Sales Calls every Thursday
export const SALESDAG_MULTIPLIER = 2;

export const SALESDAG_ACTIVITY_NAMES = new Set([
  'PHONE_OUTBOUND_CONNECTED_WITH_CONTACT',
  'PHONE_OUTBOUND_LEFT_MESSAGE_CONTACT',
  'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CONTACT',
]);

export function isSalesdag() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
  return now.getDay() === 4; // Thursday
}

// Points system — single source of truth for XP values
export const POINTS_PER_DEAL = 500;
export const POINTS_PER_CALL = 0.5;
export const POINTS_PER_MINUTE_TALK = 0.25;

// XP display rules (used by frontend PointsBreakdown via API)
export const XP_RULES = [
  { label: 'Deal Closed', points: 500 },
  { label: '1st Interview Arranged', points: 40 },
  { label: 'Job Order Received', points: 30 },
  { label: 'CV Sent to Job', points: 20 },
  { label: 'CV Spec Sent', points: 10 },
  { label: 'Client Meeting', points: 10 },
  { label: 'Sales Call', points: 5, salesdagPoints: 10 },
  { label: 'Job Lead Added', points: 5 },
  { label: 'New Candidate Added', points: 1 },
  { label: 'Call Made (8x8)', points: 0.5 },
  { label: 'Talk Time (per min)', points: 0.25 },
];

export function calculatePoints(deals, calls, talkTimeMinutes, activityPoints = 0) {
  return Math.round(
    (deals * POINTS_PER_DEAL) +
    (calls * POINTS_PER_CALL) +
    (talkTimeMinutes * POINTS_PER_MINUTE_TALK) +
    activityPoints
  );
}

// Badge definitions
export const badgeDefinitions = {
  'first-deal': { name: 'First Deal', icon: '🎯', description: 'Closed your first deal', threshold: (s) => s.deals >= 1 },
  'call-machine': { name: 'Call Machine', icon: '📞', description: '50+ calls in a single day', threshold: (s) => s.maxDailyCalls >= 50 },
  'speed-demon': { name: 'Speed Demon', icon: '⚡', description: 'Closed a deal within 24 hours', threshold: () => false },
  'pipeline-king': { name: 'Pipeline King', icon: '👑', description: 'Pipeline value over €100K', threshold: (s) => s.pipelineValue >= 100000 },
  'rising-star': { name: 'Rising Star', icon: '⭐', description: 'Most improved this month', threshold: () => false },
  'closer': { name: 'Closer', icon: '💰', description: '5+ deals closed this month', threshold: (s) => s.deals >= 5 },
};

export function computeBadges(stats) {
  return Object.entries(badgeDefinitions)
    .filter(([, def]) => def.threshold(stats))
    .map(([id]) => id);
}
