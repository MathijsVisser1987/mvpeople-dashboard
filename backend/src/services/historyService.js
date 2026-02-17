// Historical data service: stores daily snapshots of leaderboard data in KV
// Keys: history:YYYY-MM-DD → { leaderboard, teamStats, timestamp }
// Index: history:index → [date1, date2, ...] (sorted desc, max 90 days)

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

const KV_INDEX = 'history:index';
const MAX_DAYS = 90;

class HistoryService {
  // Take a snapshot of today's leaderboard data
  async takeSnapshot(leaderboardData) {
    const store = await getRedis();
    if (!store || !leaderboardData) return null;

    const today = new Date().toISOString().split('T')[0];
    const key = `history:${today}`;

    // Slim down leaderboard entries to just the stats we need
    const snapshot = {
      date: today,
      timestamp: new Date().toISOString(),
      members: (leaderboardData.leaderboard || []).map(m => ({
        name: m.name,
        fullName: m.fullName,
        color: m.color,
        photo: m.photo,
        deals: m.deals,
        calls: m.calls,
        talkTimeMinutes: m.talkTimeMinutes,
        pipelineValue: m.pipelineValue,
        points: m.points,
        streak: m.streak,
        badges: m.badges,
      })),
      teamStats: leaderboardData.teamStats || {},
    };

    try {
      await store.set(key, JSON.stringify(snapshot));

      // Update index
      let index = [];
      try {
        const raw = await store.get(KV_INDEX);
        if (raw) {
          index = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!Array.isArray(index)) index = [];
        }
      } catch {}

      if (!index.includes(today)) {
        index.unshift(today);
      }
      // Keep only last MAX_DAYS
      if (index.length > MAX_DAYS) {
        const removed = index.splice(MAX_DAYS);
        // Clean up old snapshots
        for (const oldDate of removed) {
          try { await store.del(`history:${oldDate}`); } catch {}
        }
      }
      await store.set(KV_INDEX, JSON.stringify(index));

      console.log(`[History] Snapshot saved for ${today}`);
      return snapshot;
    } catch (err) {
      console.log('[History] Save error:', err.message);
      return null;
    }
  }

  // Get historical data for the last N days
  async getHistory(days = 30) {
    const store = await getRedis();
    if (!store) return [];

    try {
      let index = [];
      const raw = await store.get(KV_INDEX);
      if (raw) {
        index = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!Array.isArray(index)) index = [];
      }

      const datesToFetch = index.slice(0, days);
      const results = [];

      // Fetch in parallel (batches of 10)
      for (let i = 0; i < datesToFetch.length; i += 10) {
        const batch = datesToFetch.slice(i, i + 10);
        const fetched = await Promise.allSettled(
          batch.map(async (date) => {
            const data = await store.get(`history:${date}`);
            if (data) {
              return typeof data === 'string' ? JSON.parse(data) : data;
            }
            return null;
          })
        );
        for (const r of fetched) {
          if (r.status === 'fulfilled' && r.value) {
            results.push(r.value);
          }
        }
      }

      return results;
    } catch (err) {
      console.log('[History] Get error:', err.message);
      return [];
    }
  }

  // Get available dates
  async getAvailableDates() {
    const store = await getRedis();
    if (!store) return [];

    try {
      const raw = await store.get(KV_INDEX);
      if (raw) {
        const index = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(index) ? index : [];
      }
    } catch {}
    return [];
  }
}

const historyService = new HistoryService();
export default historyService;
