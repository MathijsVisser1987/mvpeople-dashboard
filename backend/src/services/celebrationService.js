// Celebration detection: compares current deal counts against stored snapshot
// Stores celebrations in Upstash Redis KV

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
  } catch {
    // @upstash/redis not available
  }
  return null;
}

const KV_CELEBRATIONS = 'celebrations';
const KV_SNAPSHOT = 'vincere-deals-snapshot';
const MAX_CELEBRATIONS = 20;

class CelebrationService {
  async detectNewDeals(dealStats, teamMembers, scanComplete = false) {
    const store = await getRedis();
    if (!store) return [];

    // Only detect celebrations when the Vincere scan is fully complete
    // to avoid false positives from progressive scan partial results
    if (!scanComplete) {
      return [];
    }

    // Load previous snapshot
    let snapshot = {};
    try {
      const raw = await store.get(KV_SNAPSHOT);
      if (raw) {
        snapshot = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    } catch (err) {
      console.log('[Celebrations] Snapshot load error:', err.message);
    }

    const isFirstRun = Object.keys(snapshot).length === 0;
    const newCelebrations = [];

    // Build current deal counts
    const currentCounts = {};
    for (const member of teamMembers) {
      const stats = dealStats[member.vincereId];
      currentCounts[member.vincereId] = stats?.deals || 0;
    }

    if (!isFirstRun) {
      // Compare current vs snapshot, create celebrations for increases
      for (const member of teamMembers) {
        const prev = snapshot[member.vincereId] || 0;
        const curr = currentCounts[member.vincereId] || 0;

        if (curr > prev) {
          const newDeals = curr - prev;
          for (let i = 0; i < newDeals; i++) {
            const dealNum = prev + i + 1;
            const id = `cel_${member.vincereId}_deal${dealNum}`;
            newCelebrations.push({
              id,
              recruiterName: member.shortName,
              recruiterFullName: member.name,
              recruiterColor: member.color,
              recruiterAvatar: member.avatar,
              recruiterPhoto: member.photo || null,
              dealCount: dealNum,
              timestamp: new Date().toISOString(),
              seen: false,
            });
          }
        }
      }
    } else {
      console.log('[Celebrations] First run - saving baseline without generating celebrations');
    }

    // Save new snapshot
    try {
      await store.set(KV_SNAPSHOT, JSON.stringify(currentCounts));
    } catch (err) {
      console.log('[Celebrations] Snapshot save error:', err.message);
    }

    // Append new celebrations to existing list
    if (newCelebrations.length > 0) {
      try {
        let existing = [];
        const raw = await store.get(KV_CELEBRATIONS);
        if (raw) {
          existing = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!Array.isArray(existing)) existing = [];
        }

        // Deduplicate by id
        const existingIds = new Set(existing.map(c => c.id));
        const toAdd = newCelebrations.filter(c => !existingIds.has(c.id));

        if (toAdd.length > 0) {
          const merged = [...toAdd, ...existing].slice(0, MAX_CELEBRATIONS);
          await store.set(KV_CELEBRATIONS, JSON.stringify(merged));
          console.log(`[Celebrations] ${toAdd.length} new celebration(s) stored`);

          // Send Slack notifications for new deals
          try {
            const slackService = (await import('./slackService.js')).default;
            if (slackService.isConfigured()) {
              for (const cel of toAdd) {
                await slackService.notifyDeal(cel.recruiterName, cel.dealCount, cel.recruiterColor);
              }
            }
          } catch {}
        }
      } catch (err) {
        console.log('[Celebrations] Save error:', err.message);
      }
    }

    return newCelebrations;
  }

  async getCelebrations(limit = 10) {
    const store = await getRedis();
    if (!store) return [];

    try {
      const raw = await store.get(KV_CELEBRATIONS);
      if (raw) {
        const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(list)) return list.slice(0, limit);
      }
    } catch (err) {
      console.log('[Celebrations] Get error:', err.message);
    }
    return [];
  }

  async getUnseenCelebrations() {
    const all = await this.getCelebrations(MAX_CELEBRATIONS);
    return all.filter(c => !c.seen);
  }

  async markSeen(ids) {
    const store = await getRedis();
    if (!store) return;

    try {
      const raw = await store.get(KV_CELEBRATIONS);
      if (raw) {
        const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(list)) {
          const idSet = new Set(ids);
          for (const c of list) {
            if (idSet.has(c.id)) c.seen = true;
          }
          await store.set(KV_CELEBRATIONS, JSON.stringify(list));
        }
      }
    } catch (err) {
      console.log('[Celebrations] Mark seen error:', err.message);
    }
  }

  async createTestCelebration(teamMembers) {
    const store = await getRedis();
    if (!store) return null;

    const member = teamMembers[Math.floor(Math.random() * teamMembers.length)];
    const celebration = {
      id: `cel_test_${Date.now()}`,
      recruiterName: member.shortName,
      recruiterFullName: member.name,
      recruiterColor: member.color,
      recruiterAvatar: member.avatar,
      recruiterPhoto: member.photo || null,
      dealCount: Math.floor(Math.random() * 10) + 1,
      timestamp: new Date().toISOString(),
      seen: false,
    };

    try {
      let existing = [];
      const raw = await store.get(KV_CELEBRATIONS);
      if (raw) {
        existing = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!Array.isArray(existing)) existing = [];
      }
      const merged = [celebration, ...existing].slice(0, MAX_CELEBRATIONS);
      await store.set(KV_CELEBRATIONS, JSON.stringify(merged));
    } catch (err) {
      console.log('[Celebrations] Test save error:', err.message);
    }

    return celebration;
  }
}

const celebrationService = new CelebrationService();
export default celebrationService;
