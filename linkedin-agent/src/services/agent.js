/**
 * LinkedIn → Vincere AI Agent
 *
 * Orchestrates the full pipeline:
 * 1. Receive candidate data (structured or unstructured)
 * 2. Parse and normalize the data
 * 3. Check for duplicates in Vincere
 * 4. Enrich with AI (summary, skills, tags)
 * 5. Match against open jobs
 * 6. Create candidate in Vincere with all enrichments
 *
 * Returns a detailed result of each step for transparency.
 */

import { normalizeCandidate, validateCandidate } from './linkedinParser.js';
import { enrichProfile, matchCandidateToJobs, parseUnstructuredProfile } from './aiEnrichment.js';
import {
  searchCandidateByLinkedIn,
  searchCandidateByEmail,
  searchCandidateByName,
  createCandidate,
  getOpenJobs,
  addCandidateToJob,
} from './vincereCandidate.js';

/**
 * Process a single candidate through the full pipeline
 */
export async function processCandidate(input, options = {}) {
  const result = {
    status: 'pending',
    steps: [],
    candidate: null,
    vincereId: null,
    jobMatches: [],
    errors: [],
    startedAt: new Date().toISOString(),
  };

  try {
    // Step 1: Parse input
    result.steps.push({ step: 'parse', status: 'running' });

    let candidateData;
    if (typeof input === 'string') {
      // Unstructured text - use AI to parse
      result.steps[0].detail = 'Parsing unstructured text with AI';
      candidateData = await parseUnstructuredProfile(input);
      result.steps[0].status = 'done';
      result.steps[0].detail = `Parsed: ${candidateData.firstName} ${candidateData.lastName}`;
    } else {
      // Structured input
      candidateData = input;
      result.steps[0].status = 'done';
      result.steps[0].detail = 'Structured input received';
    }

    // Step 2: Normalize
    result.steps.push({ step: 'normalize', status: 'running' });
    const candidate = normalizeCandidate(candidateData);
    result.candidate = candidate;

    const validation = validateCandidate(candidate);
    if (!validation.valid) {
      result.steps[1].status = 'error';
      result.steps[1].detail = validation.errors.join(', ');
      result.errors = validation.errors;
      result.status = 'validation_error';
      return result;
    }
    result.steps[1].status = 'done';
    result.steps[1].detail = `${candidate.firstName} ${candidate.lastName}`;

    // Step 3: Check duplicates (LinkedIn URL → email → naam)
    result.steps.push({ step: 'duplicate_check', status: 'running' });
    let existingCandidate = null;
    let matchedOn = null;

    // First: check by LinkedIn URL (most specific)
    if (candidate.linkedinUrl) {
      existingCandidate = await searchCandidateByLinkedIn(candidate.linkedinUrl);
      if (existingCandidate) matchedOn = 'LinkedIn URL';
    }

    // Second: check by email
    if (!existingCandidate && candidate.email) {
      existingCandidate = await searchCandidateByEmail(candidate.email);
      if (existingCandidate) matchedOn = 'email';
    }

    // Third: check by name (least specific)
    if (!existingCandidate) {
      const nameMatches = await searchCandidateByName(candidate.firstName, candidate.lastName);
      if (nameMatches.length === 1) {
        existingCandidate = nameMatches[0];
        matchedOn = 'naam';
      } else if (nameMatches.length > 1) {
        result.steps[2].status = 'warning';
        result.steps[2].detail = `${nameMatches.length} mogelijke duplicaten gevonden op naam`;
        result.steps[2].duplicates = nameMatches;
      }
    }

    if (existingCandidate && !options.forceCreate) {
      result.steps[2].status = 'duplicate';
      result.steps[2].detail = `Kandidaat bestaat al in Vincere (ID: ${existingCandidate.id}, gevonden op ${matchedOn})`;
      result.vincereId = existingCandidate.id;
      result.status = 'duplicate';
      result.duplicate = existingCandidate;
      result.matchedOn = matchedOn;
      return result;
    }
    result.steps[2].status = result.steps[2].status || 'done';
    result.steps[2].detail = result.steps[2].detail || 'Geen duplicaten gevonden';

    // Step 4: AI Enrichment
    result.steps.push({ step: 'ai_enrichment', status: 'running' });
    let aiAnalysis = null;
    try {
      aiAnalysis = await enrichProfile(candidate);
      candidate.aiAnalysis = formatAiAnalysis(aiAnalysis);
      candidate.skills = [...new Set([...(candidate.skills || []), ...(aiAnalysis.skills || [])])];

      result.steps[3].status = 'done';
      result.steps[3].detail = `${aiAnalysis.seniorityLevel} - ${aiAnalysis.suggestedTitles?.slice(0, 3).join(', ')}`;
      result.steps[3].analysis = aiAnalysis;
    } catch (err) {
      result.steps[3].status = 'skipped';
      result.steps[3].detail = `AI enrichment overgeslagen: ${err.message}`;
      console.log(`[Agent] AI enrichment failed: ${err.message}`);
    }

    // Step 5: Job Matching
    result.steps.push({ step: 'job_matching', status: 'running' });
    try {
      const openJobs = await getOpenJobs();
      if (openJobs.length > 0) {
        const matches = await matchCandidateToJobs(candidate, openJobs);
        candidate.jobMatches = matches;
        result.jobMatches = matches;
        result.steps[4].status = 'done';
        result.steps[4].detail = `${matches.length} matches gevonden uit ${openJobs.length} vacatures`;
      } else {
        result.steps[4].status = 'skipped';
        result.steps[4].detail = 'Geen openstaande vacatures gevonden';
      }
    } catch (err) {
      result.steps[4].status = 'skipped';
      result.steps[4].detail = `Job matching overgeslagen: ${err.message}`;
      console.log(`[Agent] Job matching failed: ${err.message}`);
    }

    // Step 6: Create in Vincere
    result.steps.push({ step: 'create_vincere', status: 'running' });
    const vincereResult = await createCandidate(candidate);
    result.vincereId = vincereResult.id;
    result.steps[5].status = 'done';
    result.steps[5].detail = `Kandidaat aangemaakt met ID: ${vincereResult.id}`;

    // Step 7: Auto-apply to matched jobs (if enabled)
    if (options.autoApply && result.jobMatches.length > 0) {
      result.steps.push({ step: 'auto_apply', status: 'running' });
      const applied = [];
      for (const match of result.jobMatches.slice(0, 3)) {
        try {
          await addCandidateToJob(result.vincereId, match.jobId);
          applied.push(match);
        } catch (err) {
          console.log(`[Agent] Failed to apply to job ${match.jobId}: ${err.message}`);
        }
      }
      result.steps[6].status = 'done';
      result.steps[6].detail = `Aangemeld bij ${applied.length} vacatures`;
    }

    result.status = 'success';
    result.completedAt = new Date().toISOString();
    return result;

  } catch (err) {
    result.status = 'error';
    result.errors.push(err.message);
    const lastStep = result.steps[result.steps.length - 1];
    if (lastStep && lastStep.status === 'running') {
      lastStep.status = 'error';
      lastStep.detail = err.message;
    }
    return result;
  }
}

/**
 * Process multiple candidates in batch
 */
export async function processBatch(candidates, options = {}) {
  const results = {
    total: candidates.length,
    success: 0,
    duplicates: 0,
    errors: 0,
    items: [],
    startedAt: new Date().toISOString(),
  };

  for (const input of candidates) {
    const result = await processCandidate(input, options);
    results.items.push(result);

    if (result.status === 'success') results.success++;
    else if (result.status === 'duplicate') results.duplicates++;
    else results.errors++;
  }

  results.completedAt = new Date().toISOString();
  return results;
}

/**
 * Format AI analysis as readable text for Vincere notes
 */
function formatAiAnalysis(analysis) {
  const lines = [];
  if (analysis.summary) lines.push(`Samenvatting: ${analysis.summary}`);
  if (analysis.seniorityLevel) lines.push(`Niveau: ${analysis.seniorityLevel}`);
  if (analysis.suggestedTitles?.length > 0) lines.push(`Functietitels: ${analysis.suggestedTitles.join(', ')}`);
  if (analysis.industries?.length > 0) lines.push(`Sectoren: ${analysis.industries.join(', ')}`);
  if (analysis.highlights?.length > 0) {
    lines.push(`Highlights:`);
    analysis.highlights.forEach(h => lines.push(`  - ${h}`));
  }
  if (analysis.tags?.length > 0) lines.push(`Tags: ${analysis.tags.join(', ')}`);
  if (analysis.salaryIndication) lines.push(`Salarisindicatie: ${analysis.salaryIndication}`);
  if (analysis.redFlags?.length > 0) {
    lines.push(`Aandachtspunten:`);
    analysis.redFlags.forEach(f => lines.push(`  ⚠ ${f}`));
  }
  return lines.join('\n');
}
