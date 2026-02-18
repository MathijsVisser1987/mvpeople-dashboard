import { Router } from 'express';
import { enrichContact } from '../services/lusha.js';

const router = Router();

/**
 * POST /api/lusha/enrich
 *
 * Enrich a candidate with Lusha contact data.
 * Body: { firstName, lastName, company?, linkedinUrl? }
 */
router.post('/enrich', async (req, res) => {
  try {
    const { firstName, lastName, company, linkedinUrl } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }

    const result = await enrichContact({ firstName, lastName, company, linkedinUrl });
    res.json(result);
  } catch (err) {
    console.error('[API] Lusha enrichment error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
