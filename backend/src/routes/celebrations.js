import { Router } from 'express';
import celebrationService from '../services/celebrationService.js';
import { teamMembers } from '../config/team.js';

const router = Router();

// GET /api/celebrations - Last N celebrations
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const celebrations = await celebrationService.getCelebrations(limit);
    res.json(celebrations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/celebrations/unseen - Unseen celebrations for TV mode
router.get('/unseen', async (req, res) => {
  try {
    const unseen = await celebrationService.getUnseenCelebrations();
    res.json(unseen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/celebrations/seen - Mark celebrations as displayed
router.post('/seen', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }
    await celebrationService.markSeen(ids);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/celebrations/test - Create a test celebration
router.post('/test', async (req, res) => {
  try {
    const celebration = await celebrationService.createTestCelebration(teamMembers);
    res.json(celebration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
