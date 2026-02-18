/**
 * LinkedIn Profile Parser
 *
 * Parses LinkedIn profile data from different input formats:
 * 1. Manually provided profile data (JSON)
 * 2. LinkedIn profile URL (extracts what we can from public profile)
 *
 * Note: LinkedIn's public profiles have limited data. For full scraping,
 * you'd need LinkedIn Recruiter API or a third-party enrichment service.
 * This parser focuses on structured input that recruiters can provide.
 */

/**
 * Parse a LinkedIn profile URL to extract the vanity name
 */
export function parseLinkedInUrl(url) {
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
  return match ? match[1] : null;
}

/**
 * Normalize candidate data from various input formats into a standard structure
 */
export function normalizeCandidate(input) {
  const candidate = {
    firstName: input.firstName || input.first_name || '',
    lastName: input.lastName || input.last_name || '',
    email: input.email || '',
    phone: input.phone || input.phoneNumber || '',
    linkedinUrl: input.linkedinUrl || input.linkedin_url || input.linkedin || '',
    currentTitle: input.currentTitle || input.title || input.headline || '',
    currentCompany: input.currentCompany || input.company || '',
    location: input.location || input.city || '',
    summary: input.summary || input.about || input.description || '',
    skills: input.skills || [],
    experience: input.experience || [],
    education: input.education || [],
    languages: input.languages || [],
    source: 'LinkedIn',
    rawInput: input,
  };

  // Parse name from full name if first/last not provided
  if (!candidate.firstName && !candidate.lastName && input.name) {
    const parts = input.name.trim().split(/\s+/);
    candidate.firstName = parts[0] || '';
    candidate.lastName = parts.slice(1).join(' ') || '';
  }

  // Extract vanity name from LinkedIn URL
  if (candidate.linkedinUrl) {
    candidate.linkedinVanityName = parseLinkedInUrl(candidate.linkedinUrl);
  }

  // Ensure skills is an array
  if (typeof candidate.skills === 'string') {
    candidate.skills = candidate.skills.split(',').map(s => s.trim()).filter(Boolean);
  }

  return candidate;
}

/**
 * Validate that we have minimum required data to create a Vincere candidate
 */
export function validateCandidate(candidate) {
  const errors = [];

  if (!candidate.firstName) errors.push('firstName is required');
  if (!candidate.lastName) errors.push('lastName is required');
  if (!candidate.email && !candidate.phone && !candidate.linkedinUrl) {
    errors.push('At least one contact method is required (email, phone, or linkedinUrl)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse bulk candidates from a list
 */
export function parseBulkCandidates(candidates) {
  return candidates.map((input, index) => {
    const candidate = normalizeCandidate(input);
    const validation = validateCandidate(candidate);
    return {
      index,
      candidate,
      ...validation,
    };
  });
}
