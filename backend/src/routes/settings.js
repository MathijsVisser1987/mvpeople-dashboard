import { Router } from 'express';

const router = Router();
const KV_TARGETS_KEY = 'kpi-target-overrides';

async function getRedis() {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      return new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
    }
  } catch {}
  return null;
}

// GET /api/settings/targets — returns custom target overrides
router.get('/targets', async (req, res) => {
  try {
    const redis = await getRedis();
    if (!redis) {
      return res.json({});
    }
    const data = await redis.get(KV_TARGETS_KEY);
    if (!data) return res.json({});
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    res.json(parsed);
  } catch (err) {
    console.error('[Settings] Error loading targets:', err.message);
    res.status(500).json({ error: 'Failed to load target settings' });
  }
});

// POST /api/settings/targets — saves custom target overrides
router.post('/targets', async (req, res) => {
  try {
    const redis = await getRedis();
    if (!redis) {
      return res.status(503).json({ error: 'Redis not available' });
    }
    const overrides = req.body;
    await redis.set(KV_TARGETS_KEY, JSON.stringify(overrides));
    res.json({ success: true });
  } catch (err) {
    console.error('[Settings] Error saving targets:', err.message);
    res.status(500).json({ error: 'Failed to save target settings' });
  }
});

export default router;
