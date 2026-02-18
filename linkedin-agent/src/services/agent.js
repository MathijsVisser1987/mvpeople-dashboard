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
import { enrichContact } from './lusha.js';
import { generateCV } from './cvGenerator.js';
import {
  searchCandidateByLinkedIn,
  searchCandidateByEmail,
  searchCandidateByName,
  createCandidate,
  getOpenJobs,
  addCandidateToJob,
  uploadCandidateFile,
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

    // Step 3: Lusha contact enrichment
    result.steps.push({ step: 'lusha_enrich', status: 'running' });
    try {
      if (process.env.LUSHA_API_KEY) {
        const lushaResult = await enrichContact({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          company: candidate.currentCompany,
          linkedinUrl: candidate.linkedinUrl,
        });

        if (lushaResult.email && !candidate.email) candidate.email = lushaResult.email;
        if (lushaResult.phone && !candidate.phone) candidate.phone = lushaResult.phone;
        candidate._lushaData = lushaResult;

        const found = [];
        if (lushaResult.email) found.push(`email: ${lushaResult.email}`);
        if (lushaResult.phone) found.push(`tel: ${lushaResult.phone}`);

        result.steps[2].status = 'done';
        result.steps[2].detail = found.length > 0
          ? `Gevonden: ${found.join(', ')}`
          : 'Geen contactgegevens gevonden';
        result.steps[2].lushaData = lushaResult;
      } else {
        result.steps[2].status = 'skipped';
        result.steps[2].detail = 'Lusha niet geconfigureerd (LUSHA_API_KEY)';
      }
    } catch (err) {
      result.steps[2].status = 'skipped';
      result.steps[2].detail = `Lusha overgeslagen: ${err.message}`;
      console.log(`[Agent] Lusha enrichment failed: ${err.message}`);
    }

    // Step 4: Check duplicates (LinkedIn URL → email → naam)
    const dupStepIdx = result.steps.length;
    result.steps.push({ step: 'duplicate_check', status: 'running' });
    let existingCandidate = null;
    let matchedOn = null;

    // First: check by LinkedIn URL (most specific)
    if (candidate.linkedinUrl) {
      existingCandidate = await searchCandidateByLinkedIn(candidate.linkedinUrl);
      if (existingCandidate) matchedOn = 'LinkedIn URL';
    }

    // Second: check by email (including Lusha-enriched email)
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
        result.steps[dupStepIdx].status = 'warning';
        result.steps[dupStepIdx].detail = `${nameMatches.length} mogelijke duplicaten gevonden op naam`;
        result.steps[dupStepIdx].duplicates = nameMatches;
      }
    }

    if (existingCandidate && !options.forceCreate) {
      result.steps[dupStepIdx].status = 'duplicate';
      result.steps[dupStepIdx].detail = `Kandidaat bestaat al in Vincere (ID: ${existingCandidate.id}, gevonden op ${matchedOn})`;
      result.vincereId = existingCandidate.id;
      result.status = 'duplicate';
      result.duplicate = existingCandidate;
      result.matchedOn = matchedOn;
      return result;
    }
    result.steps[dupStepIdx].status = result.steps[dupStepIdx].status || 'done';
    result.steps[dupStepIdx].detail = result.steps[dupStepIdx].detail || 'Geen duplicaten gevonden';

    // Step 5: AI Enrichment
    const aiStepIdx = result.steps.length;
    result.steps.push({ step: 'ai_enrichment', status: 'running' });
    let aiAnalysis = null;
    try {
      aiAnalysis = await enrichProfile(candidate);
      candidate.aiAnalysis = formatAiAnalysis(aiAnalysis);
      candidate._aiAnalysis = aiAnalysis; // Pass raw AI data to createCandidate for field mapping
      candidate.skills = [...new Set([...(candidate.skills || []), ...(aiAnalysis.skills || [])])];

      result.steps[aiStepIdx].status = 'done';
      result.steps[aiStepIdx].detail = `${aiAnalysis.seniorityLevel} - ${aiAnalysis.suggestedTitles?.slice(0, 3).join(', ')}`;
      result.steps[aiStepIdx].analysis = aiAnalysis;
    } catch (err) {
      result.steps[aiStepIdx].status = 'skipped';
      result.steps[aiStepIdx].detail = `AI enrichment overgeslagen: ${err.message}`;
      console.log(`[Agent] AI enrichment failed: ${err.message}`);
    }

    // Step 6: Job Matching
    const matchStepIdx = result.steps.length;
    result.steps.push({ step: 'job_matching', status: 'running' });
    try {
      const openJobs = await getOpenJobs();
      if (openJobs.length > 0) {
        const matches = await matchCandidateToJobs(candidate, openJobs);
        candidate.jobMatches = matches;
        result.jobMatches = matches;
        result.steps[matchStepIdx].status = 'done';
        result.steps[matchStepIdx].detail = `${matches.length} matches gevonden uit ${openJobs.length} vacatures`;
      } else {
        result.steps[matchStepIdx].status = 'skipped';
        result.steps[matchStepIdx].detail = 'Geen openstaande vacatures gevonden';
      }
    } catch (err) {
      result.steps[matchStepIdx].status = 'skipped';
      result.steps[matchStepIdx].detail = `Job matching overgeslagen: ${err.message}`;
      console.log(`[Agent] Job matching failed: ${err.message}`);
    }

    // Step 7: Create in Vincere
    const createStepIdx = result.steps.length;
    result.steps.push({ step: 'create_vincere', status: 'running' });
    const vincereResult = await createCandidate(candidate);
    result.vincereId = vincereResult.id;
    result.steps[createStepIdx].status = 'done';
    result.steps[createStepIdx].detail = `ID: ${vincereResult.id} (${vincereResult.fieldsPopulated || '?'} velden ingevuld)`;

    // Step 8: Generate CV in MVPeople format and upload to Vincere
    const cvStepIdx = result.steps.length;
    result.steps.push({ step: 'cv_generate', status: 'running' });
    try {
      const cvBuffer = await generateCV(candidate, aiAnalysis);
      const filename = `CV_${candidate.firstName}_${candidate.lastName}_MVPeople.pdf`;
      await uploadCandidateFile(result.vincereId, cvBuffer, filename);

      result.steps[cvStepIdx].status = 'done';
      result.steps[cvStepIdx].detail = `${filename} geüpload (${Math.round(cvBuffer.length / 1024)} KB)`;
    } catch (err) {
      result.steps[cvStepIdx].status = 'skipped';
      result.steps[cvStepIdx].detail = `CV generatie overgeslagen: ${err.message}`;
      console.log(`[Agent] CV generation failed: ${err.message}`);
    }

    // Step 9: Auto-apply to matched jobs (if enabled)
    if (options.autoApply && result.jobMatches.length > 0) {
      const applyStepIdx = result.steps.length;
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
      result.steps[applyStepIdx].status = 'done';
      result.steps[applyStepIdx].detail = `Aangemeld bij ${applied.length} vacatures`;
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
