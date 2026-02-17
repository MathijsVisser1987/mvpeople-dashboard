import { Router } from 'express';
import { buildLeaderboard, clearCache } from '../services/dataAggregator.js';
import { badgeDefinitions } from '../config/team.js';

const router = Router();

// GET /api/leaderboard - Full leaderboard with stats
router.get('/', async (req, res) => {
  try {
    const data = await buildLeaderboard();
    res.json(data);
  } catch (err) {
    console.error('[Leaderboard] Error:', err.message);
    res.status(500).json({ error: 'Failed to build leaderboard', message: err.message });
  }
});

// GET /api/leaderboard/badges - All badge definitions
router.get('/badges', (req, res) => {
  const badges = Object.entries(badgeDefinitions).map(([id, def]) => ({
    id,
    name: def.name,
    icon: def.icon,
    description: def.description,
  }));
  res.json(badges);
});

// GET /api/leaderboard/activities - Activity breakdown for custom date range
router.get('/activities', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate query params required (YYYY-MM-DD)' });
    }
    const activityService = (await import('../services/activityService.js')).default;
    const data = await activityService.getTeamActivitiesForRange(startDate, endDate);
    res.json({ startDate, endDate, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaderboard/refresh - Force refresh cached data (including Vincere deal cache)
router.post('/refresh', async (req, res) => {
  clearCache();
  // Also clear KV caches
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
      await redis.del('vincere-deals-cache');
      await redis.del('vincere-deals-scan');
      await redis.del('celebrations');
      await redis.del('vincere-deals-snapshot');
      await redis.del('vincere-activities-cache');
    }
  } catch {}
  try {
    const data = await buildLeaderboard();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Refresh failed', message: err.message });
  }
});

export default router;
