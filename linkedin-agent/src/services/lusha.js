/**
 * Lusha API Service
 *
 * Enriches candidate profiles with contact information (email, phone)
 * via the Lusha API.
 *
 * API Reference: https://www.lusha.com/docs/api/
 */

const LUSHA_API_BASE = 'https://api.lusha.com';

/**
 * Enrich a person's contact details via Lusha
 *
 * @param {Object} params
 * @param {string} params.firstName - First name
 * @param {string} params.lastName - Last name
 * @param {string} [params.company] - Current company name
 * @param {string} [params.linkedinUrl] - LinkedIn profile URL
 * @returns {Object} Enriched contact data
 */
export async function enrichContact({ firstName, lastName, company, linkedinUrl }) {
  const apiKey = process.env.LUSHA_API_KEY;
  if (!apiKey) {
    throw new Error('LUSHA_API_KEY is not configured');
  }

  // Build query parameters
  const params = new URLSearchParams();
  if (firstName) params.set('firstName', firstName);
  if (lastName) params.set('lastName', lastName);
  if (company) params.set('company', company);
  if (linkedinUrl) params.set('linkedinUrl', linkedinUrl);

  console.log(`[Lusha] Enriching: ${firstName} ${lastName} @ ${company || 'unknown'}`);

  const response = await fetch(`${LUSHA_API_BASE}/person?${params}`, {
    headers: {
      'api_key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Lusha API error: ${response.status} - ${text}`);
  }

  const data = await response.json();

  // Normalize the response
  const result = {
    firstName: data.data?.firstName || firstName,
    lastName: data.data?.lastName || lastName,
    email: null,
    phone: null,
    company: data.data?.organization?.name || company,
    title: data.data?.jobTitle || null,
    location: data.data?.location || null,
    source: 'lusha',
  };

  // Extract primary email
  if (data.data?.emailAddresses?.length > 0) {
    result.email = data.data.emailAddresses[0].email;
    result.allEmails = data.data.emailAddresses.map(e => ({
      email: e.email,
      type: e.type,
    }));
  }

  // Extract primary phone
  if (data.data?.phoneNumbers?.length > 0) {
    result.phone = data.data.phoneNumbers[0].internationalNumber;
    result.allPhones = data.data.phoneNumbers.map(p => ({
      phone: p.internationalNumber,
      type: p.type,
    }));
  }

  console.log(`[Lusha] Found: email=${!!result.email}, phone=${!!result.phone}`);
  return result;
}
