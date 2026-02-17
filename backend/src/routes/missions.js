import { Router } from 'express';
import missionService from '../services/missionService.js';
import { buildLeaderboard } from '../services/dataAggregator.js';

const router = Router();

// GET /api/missions - Get all missions with progress for each team member
router.get('/', async (req, res) => {
  try {
    const data = await buildLeaderboard();
    const missions = missionService.getMissions(data.leaderboard);
    res.json({ missions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/missions/definitions - Get mission definitions
router.get('/definitions', (req, res) => {
  res.json({ definitions: missionService.getDefinitions() });
});

export default router;
