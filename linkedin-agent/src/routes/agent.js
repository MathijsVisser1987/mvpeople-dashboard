import { Router } from 'express';
import { processCandidate, processBatch } from '../services/agent.js';

const router = Router();

/**
 * POST /api/agent/process
 *
 * Process a single candidate. Accepts either:
 * - Structured JSON with candidate fields
 * - { text: "..." } with unstructured profile text (AI will parse)
 *
 * Options (query params):
 * - forceCreate=true  - Create even if duplicate found
 * - autoApply=true    - Auto-apply candidate to matched jobs
 */
router.post('/process', async (req, res) => {
  try {
    const { text, ...candidateData } = req.body;
    const input = text || candidateData;

    const options = {
      forceCreate: req.query.forceCreate === 'true',
      autoApply: req.query.autoApply === 'true',
    };

    console.log(`[API] Processing candidate...`);
    const result = await processCandidate(input, options);

    const statusCode = result.status === 'success' ? 201
      : result.status === 'duplicate' ? 200
      : result.status === 'validation_error' ? 400
      : 500;

    res.status(statusCode).json(result);
  } catch (err) {
    console.error('[API] Error processing candidate:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agent/batch
 *
 * Process multiple candidates at once.
 * Body: { candidates: [...], options: { forceCreate, autoApply } }
 */
router.post('/batch', async (req, res) => {
  try {
    const { candidates, options = {} } = req.body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'candidates array is required and must not be empty' });
    }

    if (candidates.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 candidates per batch' });
    }

    console.log(`[API] Processing batch of ${candidates.length} candidates...`);
    const result = await processBatch(candidates, options);
    res.json(result);
  } catch (err) {
    console.error('[API] Error processing batch:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agent/parse
 *
 * Parse unstructured text into structured candidate data (preview, no Vincere creation)
 */
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text field is required' });
    }

    const { parseUnstructuredProfile } = await import('../services/aiEnrichment.js');
    const parsed = await parseUnstructuredProfile(text);
    res.json(parsed);
  } catch (err) {
    console.error('[API] Error parsing text:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agent/enrich
 *
 * Enrich a candidate profile with AI (preview, no Vincere creation)
 */
router.post('/enrich', async (req, res) => {
  try {
    const { normalizeCandidate } = await import('../services/linkedinParser.js');
    const { enrichProfile, matchCandidateToJobs } = await import('../services/aiEnrichment.js');
    const { getOpenJobs } = await import('../services/vincereCandidate.js');

    const candidate = normalizeCandidate(req.body);

    const [analysis, jobs] = await Promise.all([
      enrichProfile(candidate),
      getOpenJobs().catch(() => []),
    ]);

    let jobMatches = [];
    if (jobs.length > 0) {
      jobMatches = await matchCandidateToJobs(candidate, jobs);
    }

    res.json({
      candidate,
      analysis,
      jobMatches,
    });
  } catch (err) {
    console.error('[API] Error enriching profile:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
