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

// POST /api/leaderboard/refresh - Force refresh cached data
router.post('/refresh', async (req, res) => {
  clearCache();
  try {
    const data = await buildLeaderboard();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Refresh failed', message: err.message });
  }
});

export default router;
