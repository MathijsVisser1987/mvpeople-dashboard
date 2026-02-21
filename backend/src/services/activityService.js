import vincereService from './vincere.js';
import { teamMembers, SALESDAG_MULTIPLIER, SALESDAG_ACTIVITY_NAMES } from '../config/team.js';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CLASSIFICATION,
  ACTIVITY_NAME_CLASSIFICATION,
  ACTIVITY_POINTS_MAP,
  ACTIVITY_NAME_POINTS,
  DEFAULT_ACTIVITY_POINTS,
} from '../config/goals.js';
import { getAmsterdamMonthStart, getAmsterdamNow, formatAmsterdamISO } from '../config/timezone.js';

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

  // Activity names worth highlighting as "wins"
  static NOTABLE_ACTIVITIES = new Set([
    'MOVE_CANDIDATE_TO_1ST_INTERVIEW',
    'MOVE_CANDIDATE_TO_2ND_INTERVIEW',
    'MOVE_CANDIDATE_TO_3RD_INTERVIEW',
    'MEETING_ARRANGED_WITH_CONTACT',
    'PLACEMENT_PERMANENT',
    'PLACEMENT_CONTRACT',
    'CV_SENT_TO_CLIENT',
  ]);

  static ACTIVITY_LABELS = {
    MOVE_CANDIDATE_TO_1ST_INTERVIEW: '1st Interview',
    MOVE_CANDIDATE_TO_2ND_INTERVIEW: '2nd Interview',
    MOVE_CANDIDATE_TO_3RD_INTERVIEW: '3rd Interview',
    MEETING_ARRANGED_WITH_CONTACT: 'Client Meeting',
    PLACEMENT_PERMANENT: 'Permanent Placement',
    PLACEMENT_CONTRACT: 'Contract Placement',
    CV_SENT_TO_CLIENT: 'CV Sent',
  };

  // Get the day of week (0=Sun..6=Sat) for a date string in Amsterdam timezone
  _getAmsterdamDayOfWeek(dateStr) {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        weekday: 'short',
      }).format(d);
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
    } catch { return null; }
  }

  // Get "YYYY-MM-DD" for a date in Amsterdam timezone (for same-day comparison)
  _getAmsterdamDateStr(date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);
  }

  // Check if a date string falls on a Thursday (Europe/Amsterdam timezone)
  _isThursday(dateStr) {
    return this._getAmsterdamDayOfWeek(dateStr) === 4;
  }

  // Aggregate activities for a single user
  _aggregateUserActivities(activities) {
    const result = {
      totalActivities: 0,
      activityPoints: 0,
      byType: {},
      byCategory: {},
      byActivityName: {},  // counts by activity_name (for KPI tracking)
      notableActivities: [], // recent interviews, meetings, placements
      salesdagToday: { salesCalls: 0, doubleXP: 0 },
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

      // Points: activity_name-specific points take precedence, then category:entity_type, then default
      let points = DEFAULT_ACTIVITY_POINTS;
      if (activity.activity_name && ACTIVITY_NAME_POINTS[activity.activity_name] !== undefined) {
        points = ACTIVITY_NAME_POINTS[activity.activity_name];
      } else if (typeKey && ACTIVITY_POINTS_MAP[typeKey] !== undefined) {
        points = ACTIVITY_POINTS_MAP[typeKey];
      }

      // Salesdag: double points on sales calls made on Thursdays
      const isSalesCall = activity.activity_name && SALESDAG_ACTIVITY_NAMES.has(activity.activity_name);
      const activityDate = activity.created_date || activity.insert_date || null;
      if (isSalesCall && this._isThursday(activityDate)) {
        const bonus = points * (SALESDAG_MULTIPLIER - 1);
        points *= SALESDAG_MULTIPLIER;

        // Track today's salesdag stats
        const ams = getAmsterdamNow();
        if (ams.dayOfWeek === 4 &&
            this._getAmsterdamDateStr(new Date(activityDate)) === this._getAmsterdamDateStr(new Date())) {
          result.salesdagToday.salesCalls++;
          result.salesdagToday.doubleXP += bonus;
        }
      }

      result.totalActivities++;
      result.activityPoints += points;

      if (typeKey) {
        result.byType[typeKey] = (result.byType[typeKey] || 0) + 1;
      }

      // Track by activity_name for KPI calculations
      if (activity.activity_name) {
        result.byActivityName[activity.activity_name] = (result.byActivityName[activity.activity_name] || 0) + 1;
      }

      if (catKey && result.byCategory[catKey]) {
        result.byCategory[catKey].count++;
        result.byCategory[catKey].points += points;
        if (typeKey) {
          result.byCategory[catKey].types[typeKey] = (result.byCategory[catKey].types[typeKey] || 0) + 1;
        }
      }

      // Collect notable activities with raw data for Recent Wins
      if (activity.activity_name && ActivityService.NOTABLE_ACTIVITIES.has(activity.activity_name)) {
        result.notableActivities.push({
          activityName: activity.activity_name,
          label: ActivityService.ACTIVITY_LABELS[activity.activity_name] || activity.activity_name,
          entityType: activity.entity_type || null,
          candidateName: activity.candidate_name || activity.candidate?.name || null,
          companyName: activity.company_name || activity.company?.name || null,
          contactName: activity.contact_name || activity.contact?.name || null,
          jobTitle: activity.position_title || activity.job_title || activity.job?.title || null,
          content: activity.content || activity.subject || null,
          createdDate: activity.created_date || activity.insert_date || null,
        });
      }
    }

    // Sort notable by date descending, keep last 10
    result.notableActivities.sort((a, b) =>
      new Date(b.createdDate || 0) - new Date(a.createdDate || 0)
    );
    result.notableActivities = result.notableActivities.slice(0, 10);

    return result;
  }

  // Fetch ALL activities for a date range (paginated, global endpoint)
  // Then filter/group by user client-side
  async _fetchAllActivities(startDate, endDate) {
    const allActivities = [];
    let page = 0;
    const maxPages = 100; // Safety limit — allow up to 2000 activities (20/page)
    const startTime = Date.now();
    const MAX_DURATION_MS = 25000; // 25s — leave time for deal scan within Vercel's 60s limit

    try {
      while (page < maxPages) {
        if (Date.now() - startTime > MAX_DURATION_MS) {
          console.log(`[Activities] Time limit reached at page ${page} (${allActivities.length} activities), returning partial results`);
          break;
        }

        const data = await vincereService.getActivities(startDate, endDate, page);

        let items = [];

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
        if (items.length === 0 || isLast) {
          console.log(`[Activities] All pages fetched: ${page + 1} pages, complete=${isLast}`);
          break;
        }
        page++;
      }
    } catch (err) {
      console.error('[Activities] Fetch error at page', page, ':', err.message);
    }

    console.log(`[Activities] Fetched ${allActivities.length} total activities in ${Date.now() - startTime}ms (${page + 1} pages)`);
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

  // Fetch and aggregate activities for ALL team members (current month, Amsterdam timezone)
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

    // Use Amsterdam timezone for month boundaries
    const now = new Date();
    const startOfMonth = getAmsterdamMonthStart();
    const startDate = startOfMonth.toISOString();
    const endDate = now.toISOString();

    console.log(`[Activities] Querying date range: ${startDate} to ${endDate} (Amsterdam month)`);

    // Fetch all activities globally, then group by user
    const allActivities = await this._fetchAllActivities(startDate, endDate);

    if (allActivities.length === 0) {
      console.log(`[Activities] No activities found for current month (${formatAmsterdamISO(startOfMonth)} - ${formatAmsterdamISO(now)}). This may be normal if no Vincere activities were logged this month.`);
    }
    const grouped = this._groupByUser(allActivities);

    const results = {};
    for (const member of teamMembers) {
      const userActivities = grouped[member.vincereId] || [];
      results[member.vincereId] = this._aggregateUserActivities(userActivities);
      console.log(`[Activities] ${member.shortName}: ${results[member.vincereId].totalActivities} activities, ${results[member.vincereId].activityPoints} pts`);
    }

    // Only cache if we actually fetched activities (don't cache empty results from 429s)
    const totalFetched = Object.values(results).reduce((s, r) => s + r.totalActivities, 0);
    if (store && totalFetched > 0) {
      try {
        await store.set(KV_ACTIVITIES_KEY, JSON.stringify({
          data: results,
          timestamp: Date.now(),
        }));
      } catch (err) {
        console.log('[Activities] Cache write error:', err.message);
      }
    } else if (totalFetched === 0) {
      console.log('[Activities] Skipping cache write — no activities fetched (possible rate limit)');
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
