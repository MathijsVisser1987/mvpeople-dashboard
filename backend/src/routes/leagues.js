import { Router } from 'express';
import leagueService from '../services/leagueService.js';
import { buildLeaderboard } from '../services/dataAggregator.js';

const router = Router();

// GET /api/leagues - Get all leagues with current standings
router.get('/', async (req, res) => {
  try {
    const data = await buildLeaderboard();
    const leagues = leagueService.getLeagues(data.leaderboard);
    res.json({ leagues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leagues/definitions - Get league definitions
router.get('/definitions', (req, res) => {
  res.json({ definitions: leagueService.getDefinitions() });
});

export default router;
