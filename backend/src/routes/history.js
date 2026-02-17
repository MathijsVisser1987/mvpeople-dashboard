import { Router } from 'express';
import historyService from '../services/historyService.js';

const router = Router();

// GET /api/history - Get historical snapshots
router.get('/', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const history = await historyService.getHistory(days);
    res.json({ history, count: history.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/dates - Get available dates
router.get('/dates', async (req, res) => {
  try {
    const dates = await historyService.getAvailableDates();
    res.json({ dates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/history/snapshot - Manually trigger a snapshot (also used by cron)
router.post('/snapshot', async (req, res) => {
  try {
    const { buildLeaderboard } = await import('../services/dataAggregator.js');
    const data = await buildLeaderboard();
    const snapshot = await historyService.takeSnapshot(data);
    res.json({ success: !!snapshot, date: snapshot?.date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
