import vincereService from './vincere.js';
import { teamMembers } from '../config/team.js';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CLASSIFICATION,
  ACTIVITY_NAME_CLASSIFICATION,
  ACTIVITY_POINTS_MAP,
  DEFAULT_ACTIVITY_POINTS,
} from '../config/goals.js';

let redis = null;

async function getRedis() {
  if (redis) return redis;
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      return redis;
    }
  } catch {}
  return null;
}

const KV_ACTIVITIES_KEY = 'vincere-activities-cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class ActivityService {

  // Build activity type key from a raw activity record
  // Returns "CATEGORY:ENTITY_TYPE" string, e.g. "COMMENT:CANDIDATE"
  _getActivityTypeKey(activity) {
    const category = activity.category;
    const entityType = activity.entity_type;
    if (!category || !entityType) return null;
    return `${category}:${entityType}`;
  }

  // Classify an activity into one of our 4 categories
  _classifyActivity(activity) {
    // Try activity_name first (more specific)
    if (activity.activity_name && ACTIVITY_NAME_CLASSIFICATION[activity.activity_name]) {
      return ACTIVITY_NAME_CLASSIFICATION[activity.activity_name];
    }
    // Fall back to category:entity_type
    const typeKey = this._getActivityTypeKey(activity);
    if (typeKey && ACTIVITY_CLASSIFICATION[typeKey]) {
      return ACTIVITY_CLASSIFICATION[typeKey];
    }
    return null;
  }

  // Extract user ID from a raw activity record
  _extractUserId(activity) {
    return activity.created_by_id || null;
  }

  // Aggregate activities for a single user
  _aggregateUserActivities(activities) {
    const result = {
      totalActivities: 0,
      activityPoints: 0,
      byType: {},
      byCategory: {},
    };

    // Initialize categories
    for (const [catKey, cat] of Object.entries(ACTIVITY_CATEGORIES)) {
      result.byCategory[catKey] = {
        id: cat.id,
        label: cat.label,
        emoji: cat.emoji,
        count: 0,
        points: 0,
        types: {},
      };
    }

    for (const activity of activities) {
      const typeKey = this._getActivityTypeKey(activity);
      const catKey = this._classifyActivity(activity);
      const points = typeKey ? (ACTIVITY_POINTS_MAP[typeKey] ?? DEFAULT_ACTIVITY_POINTS) : DEFAULT_ACTIVITY_POINTS;

      result.totalActivities++;
      result.activityPoints += points;

      if (typeKey) {
        result.byType[typeKey] = (result.byType[typeKey] || 0) + 1;
      }

      if (catKey && result.byCategory[catKey]) {
        result.byCategory[catKey].count++;
        result.byCategory[catKey].points += points;
        if (typeKey) {
          result.byCategory[catKey].types[typeKey] = (result.byCategory[catKey].types[typeKey] || 0) + 1;
        }
      }
    }

    return result;
  }

  // Fetch ALL activities for a date range (paginated, global endpoint)
  // Then filter/group by user client-side
  async _fetchAllActivities(startDate, endDate) {
    const allActivities = [];
    let page = 0;
    const maxPages = 50; // Safety limit
    const startTime = Date.now();
    const MAX_DURATION_MS = 25000; // 25s time limit

    try {
      while (page < maxPages) {
        if (Date.now() - startTime > MAX_DURATION_MS) {
          console.log(`[Activities] Time limit reached at page ${page}, returning partial results`);
          break;
        }

        const data = await vincereService.getActivities(startDate, endDate, page);

        let items = [];
        let total = 0;

        // Vincere uses Spring Data pagination: { content: [...], slice_index, num_of_elements, last }
        if (data?.content) {
          items = data.content;
        } else if (data?.result?.items) {
          items = data.result.items;
        } else if (Array.isArray(data)) {
          items = data;
        }

        allActivities.push(...items);

        // Check if this is the last page
        const isLast = data?.last === true;
        if (items.length === 0 || isLast) break;
        page++;
      }
    } catch (err) {
      console.error('[Activities] Fetch error:', err.message);
    }

    console.log(`[Activities] Fetched ${allActivities.length} total activities in ${Date.now() - startTime}ms`);
    return allActivities;
  }

  // Group activities by user (vincereId)
  _groupByUser(activities) {
    // Build vincereId lookup from team members
    const idSet = new Set(teamMembers.map(m => m.vincereId));
    const grouped = {};

    for (const m of teamMembers) {
      grouped[m.vincereId] = [];
    }

    for (const activity of activities) {
      const userId = this._extractUserId(activity);
      if (userId && idSet.has(userId)) {
        grouped[userId].push(activity);
      }
    }

    return grouped;
  }

  // Fetch and aggregate activities for ALL team members (current month)
  async getAllTeamActivities() {
    const store = await getRedis();

    // Check cache
    if (store) {
      try {
        const cached = await store.get(KV_ACTIVITIES_KEY);
        if (cached) {
          const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            console.log('[Activities] Using cached data');
            return parsed.data;
          }
        }
      } catch (err) {
        console.log('[Activities] Cache read error:', err.message);
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = startOfMonth.toISOString();
    const endDate = now.toISOString();

    console.log(`[Activities] Querying date range: ${startDate} to ${endDate}`);

    // Fetch all activities globally, then group by user
    const allActivities = await this._fetchAllActivities(startDate, endDate);

    if (allActivities.length === 0) {
      console.log(`[Activities] No activities found for current month (${startOfMonth.toLocaleDateString()} - ${now.toLocaleDateString()}). This may be normal if no Vincere activities were logged this month.`);
    }
    const grouped = this._groupByUser(allActivities);

    const results = {};
    for (const member of teamMembers) {
      const userActivities = grouped[member.vincereId] || [];
      results[member.vincereId] = this._aggregateUserActivities(userActivities);
      console.log(`[Activities] ${member.shortName}: ${results[member.vincereId].totalActivities} activities, ${results[member.vincereId].activityPoints} pts`);
    }

    // Cache results
    if (store) {
      try {
        await store.set(KV_ACTIVITIES_KEY, JSON.stringify({
          data: results,
          timestamp: Date.now(),
        }));
      } catch (err) {
        console.log('[Activities] Cache write error:', err.message);
      }
    }

    return results;
  }

  // Fetch activities for a custom date range (for reports, no cache)
  async getTeamActivitiesForRange(startDate, endDate) {
    const allActivities = await this._fetchAllActivities(startDate, endDate);
    const grouped = this._groupByUser(allActivities);

    const results = {};
    for (const member of teamMembers) {
      const userActivities = grouped[member.vincereId] || [];
      results[member.vincereId] = this._aggregateUserActivities(userActivities);
    }

    return results;
  }
}

const activityService = new ActivityService();
export default activityService;
