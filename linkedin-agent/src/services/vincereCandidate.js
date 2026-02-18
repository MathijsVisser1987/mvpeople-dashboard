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
 * Create a new candidate in Vincere
 *
 * Required fields: first_name, last_name
 * Recommended: email, phone, current_job_title, company_name
 */
export async function createCandidate(candidateData) {
  // Build the Vincere candidate payload
  const payload = {
    first_name: candidateData.firstName,
    last_name: candidateData.lastName,
    registration_date: new Date().toISOString(),
  };

  // Add optional fields
  if (candidateData.email) {
    payload.email = candidateData.email;
  }
  if (candidateData.phone) {
    payload.phone = candidateData.phone;
  }
  if (candidateData.currentTitle) {
    payload.current_job_title = candidateData.currentTitle;
  }
  if (candidateData.currentCompany) {
    payload.company_name = candidateData.currentCompany;
  }
  if (candidateData.location) {
    payload.address = { city: candidateData.location };
  }

  // Create candidate
  const result = await vincereRequest('POST', '/candidate', payload);
  const candidateId = result?.id;

  if (!candidateId) {
    throw new Error('Failed to create candidate - no ID returned');
  }

  console.log(`[Vincere] Created candidate ${candidateId}: ${candidateData.firstName} ${candidateData.lastName}`);

  // Add supplementary data
  const enrichmentTasks = [];

  // Add LinkedIn URL as a web link
  if (candidateData.linkedinUrl) {
    enrichmentTasks.push(
      addCandidateNote(candidateId, `LinkedIn: ${candidateData.linkedinUrl}`).catch(err =>
        console.log(`[Vincere] Failed to add LinkedIn link: ${err.message}`)
      )
    );
  }

  // Add summary/description as a note
  if (candidateData.summary) {
    enrichmentTasks.push(
      addCandidateNote(candidateId, `Profiel samenvatting:\n${candidateData.summary}`).catch(err =>
        console.log(`[Vincere] Failed to add summary note: ${err.message}`)
      )
    );
  }

  // Add AI analysis as a note
  if (candidateData.aiAnalysis) {
    enrichmentTasks.push(
      addCandidateNote(candidateId, `AI Analyse:\n${candidateData.aiAnalysis}`).catch(err =>
        console.log(`[Vincere] Failed to add AI analysis note: ${err.message}`)
      )
    );
  }

  // Add skills as custom fields or notes
  if (candidateData.skills?.length > 0) {
    enrichmentTasks.push(
      addCandidateNote(candidateId, `Skills: ${candidateData.skills.join(', ')}`).catch(err =>
        console.log(`[Vincere] Failed to add skills: ${err.message}`)
      )
    );
  }

  // Add job matches as notes
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

  await Promise.all(enrichmentTasks);

  return {
    id: candidateId,
    ...result,
  };
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
