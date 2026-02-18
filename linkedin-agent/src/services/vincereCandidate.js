/**
 * Vincere Candidate Service
 *
 * Handles creating and managing candidates in Vincere CRM.
 * Uses the Vincere REST API v2.
 *
 * API Reference: https://api.vincere.io/developer/docs
 */

import { vincereConfig } from '../config/vincere.js';
import { getAccessToken } from './vincereAuth.js';

async function vincereRequest(method, endpoint, body = null) {
  const token = await getAccessToken();
  const url = `${vincereConfig.baseUrl}${endpoint}`;

  const headers = {
    'x-api-key': vincereConfig.apiKey,
    'id-token': token,
    'Content-Type': 'application/json',
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`[Vincere] ${method} ${url}`);
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vincere API error: ${response.status} ${response.statusText} - ${text}`);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) return null;

  return response.json();
}

// ── Functional Expertise cache ──
let expertiseCache = null;
let expertiseCacheTime = 0;
const EXPERTISE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get functional expertise options from Vincere.
 * Returns { functional: [...], sub: { "Parent Name": [...] } }
 *
 * Tries multiple Vincere API endpoints since the endpoint can vary:
 * - /candidate/functionalexpertise
 * - /functionalexpertise
 * - /settings/functionalexpertise
 */
export async function getFunctionalExpertise() {
  // Return cached if fresh
  if (expertiseCache && (Date.now() - expertiseCacheTime) < EXPERTISE_CACHE_TTL) {
    return expertiseCache;
  }

  const endpoints = [
    '/candidate/functionalexpertise',
    '/functionalexpertise',
    '/settings/functionalexpertise',
    '/candidate/industries/functional_expertise',
  ];

  let functionalList = null;

  for (const endpoint of endpoints) {
    try {
      const result = await vincereRequest('GET', endpoint);
      if (result && (Array.isArray(result) || result.items || result.result)) {
        functionalList = Array.isArray(result) ? result : (result.items || result.result || []);
        console.log(`[Vincere] Loaded ${functionalList.length} functional expertise items from ${endpoint}`);
        break;
      }
    } catch (err) {
      // Try next endpoint
      console.log(`[Vincere] ${endpoint} not available: ${err.message}`);
    }
  }

  if (!functionalList) {
    console.log('[Vincere] Could not fetch functional expertise from API, using empty list');
    return { functional: [], sub: {} };
  }

  // Parse the response - Vincere may return flat list or nested structure
  const result = { functional: [], sub: {} };

  for (const item of functionalList) {
    const name = item.name || item.label || item.value || (typeof item === 'string' ? item : null);
    if (!name) continue;

    result.functional.push(name);

    // Try to get sub-expertise for this functional expertise
    const subItems = item.children || item.sub_functional_expertise || item.sub_items || [];
    if (subItems.length > 0) {
      result.sub[name] = subItems.map(s => s.name || s.label || s.value || s).filter(Boolean);
    }
  }

  // If we got functional items but no sub items, try fetching sub-expertise separately
  if (result.functional.length > 0 && Object.keys(result.sub).length === 0) {
    for (const funcName of result.functional.slice(0, 30)) { // Limit to avoid too many requests
      try {
        const subEndpoints = [
          `/candidate/functionalexpertise/${encodeURIComponent(funcName)}/sub`,
          `/candidate/subfunctionalexpertise?functional_expertise=${encodeURIComponent(funcName)}`,
          `/subfunctionalexpertise?parent=${encodeURIComponent(funcName)}`,
        ];

        for (const subEndpoint of subEndpoints) {
          try {
            const subResult = await vincereRequest('GET', subEndpoint);
            const subList = Array.isArray(subResult) ? subResult : (subResult?.items || subResult?.result || []);
            if (subList.length > 0) {
              result.sub[funcName] = subList.map(s => s.name || s.label || s.value || s).filter(Boolean);
              break;
            }
          } catch {
            // Try next sub-endpoint
          }
        }
      } catch {
        // Skip this functional expertise
      }
    }
  }

  expertiseCache = result;
  expertiseCacheTime = Date.now();

  console.log(`[Vincere] Expertise cache: ${result.functional.length} functional, ${Object.keys(result.sub).length} with sub-items`);
  return result;
}

/**
 * Search for existing candidate by email
 */
export async function searchCandidateByEmail(email) {
  if (!email) return null;
  try {
    const result = await vincereRequest('GET', `/candidate/search/fl=id,name,email&q=email:${encodeURIComponent(email)}`);
    if (result?.result?.items?.length > 0) {
      return result.result.items[0];
    }
  } catch (err) {
    console.log(`[Vincere] Search by email failed: ${err.message}`);
  }
  return null;
}

/**
 * Search for existing candidate by LinkedIn URL
 */
export async function searchCandidateByLinkedIn(linkedinUrl) {
  if (!linkedinUrl) return null;
  try {
    // Search in candidate social/web profiles for the LinkedIn URL
    const vanityName = linkedinUrl.match(/linkedin\.com\/in\/([^/?]+)/)?.[1];
    if (!vanityName) return null;

    // Try searching by LinkedIn vanity name in the candidate index
    const result = await vincereRequest('GET', `/candidate/search/fl=id,name,email&q=linkedin:${encodeURIComponent(vanityName)}`);
    if (result?.result?.items?.length > 0) {
      return result.result.items[0];
    }

    // Fallback: search with the full URL as a keyword
    const resultFull = await vincereRequest('GET', `/candidate/search/fl=id,name,email&q=${encodeURIComponent(linkedinUrl)}`);
    if (resultFull?.result?.items?.length > 0) {
      return resultFull.result.items[0];
    }
  } catch (err) {
    console.log(`[Vincere] Search by LinkedIn URL failed: ${err.message}`);
  }
  return null;
}

/**
 * Search for existing candidate by name
 */
export async function searchCandidateByName(firstName, lastName) {
  try {
    const query = `name:${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}`;
    const result = await vincereRequest('GET', `/candidate/search/fl=id,name,email&q=${query}`);
    if (result?.result?.items?.length > 0) {
      return result.result.items;
    }
  } catch (err) {
    console.log(`[Vincere] Search by name failed: ${err.message}`);
  }
  return [];
}

/**
 * Create a new candidate in Vincere with maximum field pre-population.
 *
 * Fills as many Vincere fields as possible from LinkedIn data, Lusha
 * enrichment, and AI analysis so the recruiter has minimal manual work.
 *
 * Vincere candidate API fields reference:
 *   first_name, last_name, email, phone, mobile, current_job_title,
 *   company_name, address, linkedin_url, summary, source, skills,
 *   desired_job_title, desired_salary, desired_salary_currency,
 *   availability, education_summary, note, registration_date,
 *   candidate_source, languages
 */
export async function createCandidate(candidateData) {
  const ai = candidateData._aiAnalysis || null;

  // ── Core fields ──
  const payload = {
    first_name: candidateData.firstName,
    last_name: candidateData.lastName,
    registration_date: new Date().toISOString(),
    candidate_source: 'LinkedIn',
  };

  // ── Contact info (LinkedIn + Lusha enriched) ──
  if (candidateData.email) payload.email = candidateData.email;
  if (candidateData.phone) {
    // Try to split into phone/mobile
    const phone = candidateData.phone;
    if (phone.includes('+316') || phone.includes('+31 6') || phone.match(/^06/)) {
      payload.mobile = phone;
    } else {
      payload.phone = phone;
    }
  }

  // ── Professional info ──
  if (candidateData.currentTitle) payload.current_job_title = candidateData.currentTitle;
  if (candidateData.currentCompany) payload.company_name = candidateData.currentCompany;

  // ── LinkedIn URL (native Vincere field) ──
  if (candidateData.linkedinUrl) payload.linkedin_url = candidateData.linkedinUrl;

  // ── Location / Address ──
  if (candidateData.location) {
    const loc = parseLocation(candidateData.location);
    payload.address = loc;
  }

  // ── Summary / Description ──
  const summaryParts = [];
  if (ai?.summary) summaryParts.push(ai.summary);
  else if (candidateData.summary) summaryParts.push(candidateData.summary);

  if (ai?.highlights?.length > 0) {
    summaryParts.push('\nHighlights:\n' + ai.highlights.map(h => `• ${h}`).join('\n'));
  }
  if (summaryParts.length > 0) {
    payload.summary = summaryParts.join('\n');
  }

  // ── Skills (as comma-separated string for Vincere) ──
  const allSkills = [...new Set([
    ...(candidateData.skills || []),
    ...(ai?.skills || []),
  ])];
  if (allSkills.length > 0) {
    payload.skills = allSkills.join(', ');
  }

  // ── AI-derived fields ──
  if (ai?.suggestedTitles?.length > 0) {
    payload.desired_job_title = ai.suggestedTitles[0];
  }
  if (ai?.industries?.length > 0) {
    payload.industry = ai.industries[0];
  }

  // ── Functional Expertise (AI-determined) ──
  if (ai?.functionalExpertise) {
    payload.functional_expertise = ai.functionalExpertise;
  }
  if (ai?.subFunctionalExpertise) {
    payload.sub_functional_expertise = ai.subFunctionalExpertise;
  }

  // ── Education summary ──
  if (candidateData.education?.length > 0) {
    payload.education_summary = candidateData.education
      .map(edu => [edu.degree, edu.institution, edu.year].filter(Boolean).join(' - '))
      .join('\n');
  }

  // ── Languages ──
  if (candidateData.languages?.length > 0) {
    payload.languages = candidateData.languages.join(', ');
  }

  // ── Experience summary (for the description field) ──
  if (candidateData.experience?.length > 0) {
    const expText = candidateData.experience
      .map(exp => {
        const parts = [exp.title];
        if (exp.company) parts.push(`@ ${exp.company}`);
        if (exp.duration) parts.push(`(${exp.duration})`);
        return parts.join(' ');
      })
      .join('\n');
    payload.description = `Werkervaring:\n${expText}`;
  }

  // ── Tags / custom fields from AI ──
  if (ai?.seniorityLevel) {
    payload.seniority = ai.seniorityLevel;
  }

  // Create candidate
  const result = await vincereRequest('POST', '/candidate', payload);
  const candidateId = result?.id;

  if (!candidateId) {
    throw new Error('Failed to create candidate - no ID returned');
  }

  const fieldsSet = Object.keys(payload).length;
  console.log(`[Vincere] Created candidate ${candidateId}: ${candidateData.firstName} ${candidateData.lastName} (${fieldsSet} velden ingevuld)`);

  // ── Post-creation enrichment (notes, web links) ──
  const enrichmentTasks = [];

  // Add AI analysis as a comprehensive note
  if (candidateData.aiAnalysis) {
    enrichmentTasks.push(
      addCandidateNote(candidateId, `AI Analyse:\n${candidateData.aiAnalysis}`).catch(err =>
        console.log(`[Vincere] Failed to add AI analysis note: ${err.message}`)
      )
    );
  }

  // Add Lusha data as a note for reference
  if (candidateData._lushaData) {
    const lusha = candidateData._lushaData;
    const lushaLines = ['Lusha Verrijking:'];
    if (lusha.allEmails?.length > 0) lushaLines.push(`Emails: ${lusha.allEmails.map(e => `${e.email} (${e.type})`).join(', ')}`);
    if (lusha.allPhones?.length > 0) lushaLines.push(`Telefoon: ${lusha.allPhones.map(p => `${p.phone} (${p.type})`).join(', ')}`);
    if (lushaLines.length > 1) {
      enrichmentTasks.push(
        addCandidateNote(candidateId, lushaLines.join('\n')).catch(err =>
          console.log(`[Vincere] Failed to add Lusha note: ${err.message}`)
        )
      );
    }
  }

  // Add job match suggestions as a note
  if (candidateData.jobMatches?.length > 0) {
    const matchText = candidateData.jobMatches
      .map(m => `- ${m.title} (${m.score}% match) - ${m.reason}`)
      .join('\n');
    enrichmentTasks.push(
      addCandidateNote(candidateId, `Gesuggereerde vacatures:\n${matchText}`).catch(err =>
        console.log(`[Vincere] Failed to add job matches: ${err.message}`)
      )
    );
  }

  // Add salary indication from AI as a note
  if (ai?.salaryIndication) {
    enrichmentTasks.push(
      addCandidateNote(candidateId, `Salarisindicatie (AI): ${ai.salaryIndication}`).catch(err =>
        console.log(`[Vincere] Failed to add salary note: ${err.message}`)
      )
    );
  }

  // Add red flags if any
  if (ai?.redFlags?.length > 0) {
    enrichmentTasks.push(
      addCandidateNote(candidateId, `Aandachtspunten:\n${ai.redFlags.map(f => `⚠ ${f}`).join('\n')}`).catch(err =>
        console.log(`[Vincere] Failed to add red flags note: ${err.message}`)
      )
    );
  }

  await Promise.all(enrichmentTasks);

  return {
    id: candidateId,
    fieldsPopulated: fieldsSet,
    ...result,
  };
}

/**
 * Parse a location string into Vincere address components
 * Examples: "Amsterdam, Nederland" → { city: "Amsterdam", country: "Nederland" }
 *           "Rotterdam, Zuid-Holland, Nederland" → { city: "Rotterdam", state: "Zuid-Holland", country: "Nederland" }
 */
function parseLocation(location) {
  const parts = location.split(',').map(p => p.trim()).filter(Boolean);
  const address = {};

  if (parts.length === 1) {
    address.city = parts[0];
  } else if (parts.length === 2) {
    address.city = parts[0];
    address.country = parts[1];
  } else if (parts.length >= 3) {
    address.city = parts[0];
    address.state = parts[1];
    address.country = parts[parts.length - 1];
  }

  return address;
}

/**
 * Add a note/comment to a candidate
 */
export async function addCandidateNote(candidateId, content) {
  return vincereRequest('POST', `/candidate/${candidateId}/note`, {
    content,
    category: 'NOTE',
    insert_date: new Date().toISOString(),
  });
}

/**
 * Upload a file (e.g. CV PDF) to a candidate in Vincere
 *
 * Uses multipart/form-data upload to the candidate's document endpoint.
 */
export async function uploadCandidateFile(candidateId, fileBuffer, filename, contentType = 'application/pdf') {
  const token = await getAccessToken();
  const url = `${vincereConfig.baseUrl}/candidate/${candidateId}/document`;

  // Build multipart form data manually
  const boundary = `----FormBoundary${Date.now()}`;
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const headerBuffer = Buffer.from(header, 'utf-8');
  const footerBuffer = Buffer.from(footer, 'utf-8');
  const body = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

  console.log(`[Vincere] Uploading ${filename} (${fileBuffer.length} bytes) to candidate ${candidateId}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': vincereConfig.apiKey,
      'id-token': token,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`File upload failed: ${response.status} ${response.statusText} - ${text}`);
  }

  if (response.status === 204) return { success: true };
  return response.json();
}

/**
 * Update an existing candidate
 */
export async function updateCandidate(candidateId, updates) {
  return vincereRequest('PUT', `/candidate/${candidateId}`, updates);
}

/**
 * Get candidate details
 */
export async function getCandidate(candidateId) {
  return vincereRequest('GET', `/candidate/${candidateId}`);
}

/**
 * Get open jobs/positions for matching
 */
export async function getOpenJobs(limit = 50) {
  try {
    const result = await vincereRequest('GET', `/job/search/fl=id,job_title,company_name,industry,location&q=status:OPEN&limit=${limit}`);
    return result?.result?.items || [];
  } catch (err) {
    console.log(`[Vincere] Failed to fetch open jobs: ${err.message}`);
    return [];
  }
}

/**
 * Add candidate to a job (create application)
 */
export async function addCandidateToJob(candidateId, jobId) {
  return vincereRequest('POST', `/candidate/${candidateId}/application`, {
    job_id: jobId,
    stage: 'APPLIED',
  });
}
