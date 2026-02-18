import vincereService from './vincere.js';
import eightByEightService from './eightByEight.js';
import celebrationService from './celebrationService.js';
import historyService from './historyService.js';
import activityService from './activityService.js';
import { teamMembers, calculatePoints, getMultiplier, computeBadges } from '../config/team.js';
import { ACTIVITY_POINTS_MAP } from '../config/goals.js';
import { calculateKPIActuals, calculateKPIStatus, TARGET_PROFILES } from '../config/kpiTargets.js';

const KV_TARGETS_KEY = 'kpi-target-overrides';

// Load custom target overrides from Redis
async function loadTargetOverrides() {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
      const data = await redis.get(KV_TARGETS_KEY);
      if (data) {
        return typeof data === 'string' ? JSON.parse(data) : data;
      }
    }
  } catch (err) {
    console.log('[Aggregator] Failed to load target overrides:', err.message);
  }
  return {};
}

// Cache to avoid hammering APIs
let cache = {
  leaderboard: null,
  lastFetch: null,
  ttl: 60 * 1000, // 1 minute cache
};

// Get call stats from 8x8 for all team members
async function getCallStats() {
  const stats = {};

  try {
    // ensureAuthenticated will auto-login from env vars if available
    const rawData = await eightByEightService.getMonthStats();
    const parsed = eightByEightService.parseExtensionStats(rawData);

    for (const member of teamMembers) {
      const extStats = parsed[member.extension];
      if (extStats) {
        stats[member.extension] = extStats;
      }
    }
  } catch (err) {
    console.log('[Aggregator] 8x8 not available:', err.message);
  }

  return stats;
}

// Get daily call stats for streak calculation (parallelized, reduced to 3 days)
async function getDailyCallStats(daysBack = 3) {
  const dailyStats = {};

  try {
    const now = new Date();
    const fetches = [];

    for (let i = 0; i < daysBack; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      const dateKey = startOfDay.toISOString().split('T')[0];

      fetches.push(
        eightByEightService.getExtensionSummary(startOfDay, endOfDay)
          .then(rawData => {
            dailyStats[dateKey] = eightByEightService.parseExtensionStats(rawData);
          })
          .catch(() => {}) // Silently skip failed days
      );
    }

    await Promise.all(fetches);
  } catch (err) {
    console.log('[Aggregator] Daily stats not available:', err.message);
  }

  return dailyStats;
}

// Get placement/deal stats from Vincere
// Strategy: fetch all jobs, group by created_by.id, check placements per job
async function getDealStats() {
  const stats = {};
  let scanComplete = false;

  if (!(await vincereService.isAuthenticated())) {
    console.log('[Aggregator] Vincere not authenticated, returning empty deal stats');
    return { stats, scanComplete };
  }

  try {
    const result = await vincereService.getAllTeamDeals(teamMembers);
    scanComplete = result.scanComplete || false;
    for (const [vincereId, data] of Object.entries(result.stats)) {
      stats[vincereId] = data;
    }
  } catch (err) {
    console.error('[Aggregator] Vincere fetch error:', err.message);
  }

  return { stats, scanComplete };
}

// Get activity stats from Vincere for all team members
async function getActivityStats() {
  if (!(await vincereService.isAuthenticated())) {
    console.log('[Aggregator] Vincere not authenticated, skipping activity fetch');
    return {};
  }

  try {
    return await activityService.getAllTeamActivities();
  } catch (err) {
    console.error('[Aggregator] Activity fetch error:', err.message);
    return {};
  }
}

// Calculate streak from daily stats
function calculateStreak(extension, dailyStats) {
  const dates = Object.keys(dailyStats).sort().reverse();
  let streak = 0;

  for (const date of dates) {
    const dayData = dailyStats[date]?.[extension];
    if (dayData && (dayData.callsMade > 0 || dayData.totalCalls > 0)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Find max daily calls for badge calculation
function getMaxDailyCalls(extension, dailyStats) {
  let max = 0;
  for (const date of Object.keys(dailyStats)) {
    const dayData = dailyStats[date]?.[extension];
    if (dayData) {
      max = Math.max(max, dayData.callsMade || 0);
    }
  }
  return max;
}

// Build the full leaderboard
export async function buildLeaderboard() {
  // Check cache
  if (cache.leaderboard && cache.lastFetch && Date.now() - cache.lastFetch < cache.ttl) {
    return cache.leaderboard;
  }

  // Fetch 8x8 calls + Vincere activities + target overrides concurrently
  // Then run the heavy deal scan separately to avoid rate-limiting activities
  const [callStats, dailyStats, activityStats, targetOverrides] = await Promise.all([
    getCallStats(),
    getDailyCallStats(3),
    getActivityStats(),
    loadTargetOverrides(),
  ]);

  // Deal scan is heavy (800+ API calls) — run after activities to avoid 429s
  const dealResult = await getDealStats();
  const dealStats = dealResult.stats;
  const scanComplete = dealResult.scanComplete;

  // Detect new deals and create celebrations (only when scan is complete)
  try {
    await celebrationService.detectNewDeals(dealStats, teamMembers, scanComplete);
  } catch (err) {
    console.log('[Aggregator] Celebration detection error:', err.message);
  }

  const leaderboard = teamMembers.map((member, index) => {
    const calls = callStats[member.extension] || {};
    const deals = dealStats[member.vincereId] || {};
    const activities = activityStats[member.vincereId] || {};
    const streak = calculateStreak(member.extension, dailyStats);
    const maxDailyCalls = getMaxDailyCalls(member.extension, dailyStats);

    const callsMade = calls.callsMade || calls.externalCallsMade || 0;
    const talkTimeMinutes = calls.totalTalkTimeMinutes || 0;
    const dealsCount = deals.deals || 0;
    const pipelineValue = deals.pipelineValue || 0;

    // Activity points: subtract deal/placement-related category points to avoid double-counting
    // Deals are already counted via the placement scan (dealsCount * POINTS_PER_DEAL)
    const dealCategoryPoints = activities.byCategory?.DEALS_REVENUE?.points || 0;
    const activityPointsNet = Math.max(0, (activities.activityPoints || 0) - dealCategoryPoints);

    const points = calculatePoints(dealsCount, callsMade, talkTimeMinutes, streak, activityPointsNet);
    const multiplier = getMultiplier(streak);

    const badgeStats = {
      deals: dealsCount,
      maxDailyCalls,
      streak,
      pipelineValue,
    };

    // KPI Target/Actual/Variance calculations
    const kpiActuals = calculateKPIActuals(activities.byActivityName || {}, dealsCount);
    const memberOverrides = targetOverrides[String(member.vincereId)] || null;
    const kpiStatus = calculateKPIStatus(member.targetProfile, kpiActuals, memberOverrides);

    return {
      id: index + 1,
      name: member.shortName,
      fullName: member.name,
      avatar: member.avatar,
      photo: member.photo || null,
      color: member.color,
      role: member.role,
      vincereId: member.vincereId,
      extension: member.extension,
      targetProfile: member.targetProfile,
      deals: dealsCount,
      calls: callsMade,
      talkTimeMinutes,
      pipelineValue,
      streak,
      multiplier,
      points,
      badges: computeBadges(badgeStats),
      hasCallData: !!callStats[member.extension],
      hasDealData: !!dealStats[member.vincereId]?.deals,
      activities: activities.byCategory || {},
      activityPoints: activityPointsNet,
      totalActivities: activities.totalActivities || 0,
      activityTypes: activities.byType || {},
      kpis: kpiStatus,
    };
  });

  leaderboard.sort((a, b) => b.points - a.points);

  let celebrations = [];
  try {
    celebrations = await celebrationService.getCelebrations(5);
  } catch {}

  const result = {
    leaderboard,
    teamStats: {
      totalDeals: leaderboard.reduce((s, m) => s + m.deals, 0),
      totalCalls: leaderboard.reduce((s, m) => s + m.calls, 0),
      totalPipeline: leaderboard.reduce((s, m) => s + m.pipelineValue, 0),
      totalTalkTime: leaderboard.reduce((s, m) => s + m.talkTimeMinutes, 0),
      totalActivities: leaderboard.reduce((s, m) => s + m.totalActivities, 0),
    },
    celebrations,
    targetProfiles: TARGET_PROFILES,
    apiStatus: {
      vincere: await vincereService.isAuthenticated(),
      eightByEight: eightByEightService.isAuthenticated(),
    },
    lastUpdated: new Date().toISOString(),
  };

  cache.leaderboard = result;
  cache.lastFetch = Date.now();

  // Auto-snapshot: save once per day (non-blocking)
  historyService.takeSnapshot(result).catch(() => {});

  return result;
}

export function clearCache() {
  cache.leaderboard = null;
  cache.lastFetch = null;
}
