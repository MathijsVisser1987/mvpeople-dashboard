import vincereService from './vincere.js';
import eightByEightService from './eightByEight.js';
import celebrationService from './celebrationService.js';
import historyService from './historyService.js';
import activityService from './activityService.js';
import { teamMembers, calculatePoints, computeBadges, isSalesdag, XP_RULES } from '../config/team.js';
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
// Short TTL so the incremental deal scan can make progress across requests
let cache = {
  leaderboard: null,
  lastFetch: null,
  ttl: 2 * 60 * 1000, // 2 minute cache — keeps deal scan progressing
};
let backgroundRefreshInProgress = false;

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

// Get today's call stats from 8x8
async function getTodayCallStats() {
  const stats = {};

  try {
    const rawData = await eightByEightService.getTodayStats();
    const parsed = eightByEightService.parseExtensionStats(rawData);

    for (const member of teamMembers) {
      const extStats = parsed[member.extension];
      if (extStats) {
        stats[member.extension] = extStats;
      }
    }
  } catch (err) {
    console.log('[Aggregator] Today 8x8 stats not available:', err.message);
  }

  return stats;
}

// Fast deal search via /deal/search endpoint (a few pages, quick)
async function getDealSearchStats() {
  if (!(await vincereService.isAuthenticated())) return {};
  try {
    return await vincereService.getDealStats(teamMembers);
  } catch (err) {
    console.log('[Aggregator] Deal search error:', err.message);
    return {};
  }
}

// Heavy placement scan (800+ jobs, progressive, 20s timeout)
async function getDealScanStats() {
  if (!(await vincereService.isAuthenticated())) {
    console.log('[Aggregator] Vincere not authenticated, skipping deal scan');
    return { stats: {}, scanComplete: false };
  }
  try {
    const result = await vincereService.getAllTeamDeals(teamMembers);
    const stats = {};
    const resultStats = result?.stats || result || {};
    for (const [vincereId, data] of Object.entries(resultStats)) {
      if (data && typeof data === 'object' && 'deals' in data) {
        stats[vincereId] = data;
      }
    }
    return { stats, scanComplete: result?.scanComplete || false };
  } catch (err) {
    console.error('[Aggregator] Deal scan error:', err.message);
    return { stats: {}, scanComplete: false };
  }
}

// Merge deal search + scan results: take the higher deal count from either source
function mergeDealStats(dealSearchStats, dealScanResult) {
  const stats = { ...dealScanResult.stats };
  for (const m of teamMembers) {
    const searchData = dealSearchStats[m.vincereId];
    if (!searchData) continue;
    if (!stats[m.vincereId]) {
      stats[m.vincereId] = { deals: 0, activePlacements: 0, pipelineValue: 0 };
    }
    if (searchData.dealCount > (stats[m.vincereId].deals || 0)) {
      console.log(`[Aggregator] ${m.shortName}: deal search found ${searchData.dealCount} deals vs scan ${stats[m.vincereId].deals}`);
      stats[m.vincereId].deals = searchData.dealCount;
    }
    if (searchData.pipelineValue > 0 && !stats[m.vincereId].pipelineValue) {
      stats[m.vincereId].pipelineValue = searchData.pipelineValue;
    }
  }
  return { stats, scanComplete: dealScanResult.scanComplete };
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

// Build the full leaderboard
// Uses stale-while-revalidate: returns stale cache instantly, refreshes in background
export async function buildLeaderboard() {
  // Fresh cache — return immediately
  if (cache.leaderboard && cache.lastFetch && Date.now() - cache.lastFetch < cache.ttl) {
    return cache.leaderboard;
  }

  // Stale cache available — return it instantly and refresh in background
  if (cache.leaderboard && cache.lastFetch && !backgroundRefreshInProgress) {
    backgroundRefreshInProgress = true;
    _refreshLeaderboard().finally(() => { backgroundRefreshInProgress = false; });
    return cache.leaderboard;
  }

  // No cache at all (first request ever) — must wait for data
  return _refreshLeaderboard();
}

async function _refreshLeaderboard() {

  // Phase 1: Fetch fast data sources concurrently
  // Deal search (/deal/search) is fast (a few pages) and safe to run alongside activities.
  // The heavy placement scan runs AFTER activities to avoid Vincere 429 rate limits.
  const [callStats, todayCallStats, activityStats, targetOverrides, dealSearchStats] = await Promise.all([
    getCallStats(),
    getTodayCallStats(),
    getActivityStats(),
    loadTargetOverrides(),
    getDealSearchStats(),
  ]);

  // Phase 2: Heavy placement scan — sequential after activities to avoid 429s
  const dealScanResult = await getDealScanStats();

  // Merge: take the higher deal count from either source
  const { stats: dealStats, scanComplete } = mergeDealStats(dealSearchStats, dealScanResult);

  // Detect new deals and create celebrations (only when scan is complete)
  try {
    await celebrationService.detectNewDeals(dealStats, teamMembers, scanComplete);
  } catch (err) {
    console.log('[Aggregator] Celebration detection error:', err.message);
  }

  const leaderboard = teamMembers.map((member, index) => {
    const calls = callStats[member.extension] || {};
    const todayCalls = todayCallStats[member.extension] || {};
    const deals = dealStats[member.vincereId] || {};
    const activities = activityStats[member.vincereId] || {};

    const callsMade = calls.callsMade || calls.externalCallsMade || 0;
    const talkTimeMinutes = calls.totalTalkTimeMinutes || 0;
    const callsToday = todayCalls.callsMade || todayCalls.externalCallsMade || 0;
    const talkTimeToday = todayCalls.totalTalkTimeMinutes || 0;

    // Deal counting: use MAX of placement scan and activity-based count
    // Activity-based is fast & reliable; scan is slow but has renewal filtering
    const scanDeals = deals.deals || 0;
    const activityDeals =
      (activities.byActivityName?.PLACEMENT_PERMANENT || 0) +
      (activities.byActivityName?.PLACEMENT_CONTRACT || 0);
    const dealsCount = Math.max(scanDeals, activityDeals);
    if (activityDeals > 0 && scanDeals !== activityDeals) {
      console.log(`[Aggregator] ${member.shortName} deal count: scan=${scanDeals}, activities=${activityDeals}, using=${dealsCount}`);
    }
    const pipelineValue = deals.pipelineValue || 0;

    // Activity points: subtract deal/placement-related category points to avoid double-counting
    // Deals are already counted via the placement scan (dealsCount * POINTS_PER_DEAL)
    const dealCategoryPoints = activities.byCategory?.DEALS_REVENUE?.points || 0;
    const activityPointsNet = Math.max(0, (activities.activityPoints || 0) - dealCategoryPoints);

    const points = calculatePoints(dealsCount, callsMade, talkTimeMinutes, activityPointsNet);

    const badgeStats = {
      deals: dealsCount,
      maxDailyCalls: callsToday,
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
      callsToday,
      talkTimeToday,
      pipelineValue,
      points,
      badges: computeBadges(badgeStats),
      hasCallData: !!callStats[member.extension],
      hasDealData: !!dealStats[member.vincereId]?.deals,
      activities: activities.byCategory || {},
      activityPoints: activityPointsNet,
      totalActivities: activities.totalActivities || 0,
      activityTypes: activities.byType || {},
      activityNames: activities.byActivityName || {},
      kpis: kpiStatus,
      // Headhunt Challenge for starters: 60 Headhunt Completed = €500 bonus
      headhuntChallenge: member.targetProfile === 'starter' ? {
        current: activities.byActivityName?.PHONE_OUTBOUND_NOT_CONNECTED_WITH_CANDIDATE || 0,
        target: 60,
        bonus: 500,
        qualified: (activities.byActivityName?.PHONE_OUTBOUND_NOT_CONNECTED_WITH_CANDIDATE || 0) >= 60,
      } : null,
      salesdagToday: activities.salesdagToday || { salesCalls: 0, doubleXP: 0 },
    };
  });

  leaderboard.sort((a, b) => b.points - a.points);

  let celebrations = [];
  try {
    celebrations = await celebrationService.getCelebrations(5);
  } catch {}

  // Collect recent notable activities (interviews, meetings, etc.) across all members
  const recentActivityWins = [];
  for (const member of teamMembers) {
    const activities = activityStats[member.vincereId] || {};
    if (activities.notableActivities) {
      for (const act of activities.notableActivities) {
        recentActivityWins.push({
          ...act,
          recruiterName: member.shortName,
          recruiterColor: member.color,
          recruiterAvatar: member.avatar,
          recruiterPhoto: member.photo || null,
        });
      }
    }
  }
  recentActivityWins.sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));

  const result = {
    leaderboard,
    isSalesdag: isSalesdag(),
    xpRules: XP_RULES,
    recentActivityWins: recentActivityWins.slice(0, 15),
    teamStats: {
      totalDeals: leaderboard.reduce((s, m) => s + m.deals, 0),
      totalCalls: leaderboard.reduce((s, m) => s + m.calls, 0),
      totalPipeline: leaderboard.reduce((s, m) => s + m.pipelineValue, 0),
      totalTalkTime: leaderboard.reduce((s, m) => s + m.talkTimeMinutes, 0),
      totalActivities: leaderboard.reduce((s, m) => s + m.totalActivities, 0),
      totalCallsToday: leaderboard.reduce((s, m) => s + m.callsToday, 0),
      totalTalkTimeToday: leaderboard.reduce((s, m) => s + m.talkTimeToday, 0),
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

  // Update YTD standings (non-blocking)
  import('./ytdService.js').then(m => m.default.updateCurrentMonth(result)).catch(() => {});

  return result;
}

export function clearCache() {
  cache.leaderboard = null;
  cache.lastFetch = null;
  backgroundRefreshInProgress = false;
}
