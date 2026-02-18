/**
 * AI Enrichment Service
 *
 * Uses OpenAI to analyze and enrich candidate profiles:
 * - Parse unstructured profile text into structured data
 * - Generate candidate summaries in Dutch
 * - Match candidates to open positions
 * - Suggest tags and classifications
 */

import OpenAI from 'openai';
import { openaiConfig } from '../config/vincere.js';

let openai = null;

function getClient() {
  if (!openai) {
    if (!openaiConfig.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured. Set it in your .env file.');
    }
    openai = new OpenAI({ apiKey: openaiConfig.apiKey });
  }
  return openai;
}

/**
 * Enrich a candidate profile with AI analysis
 *
 * Generates:
 * - Professional summary in Dutch
 * - Extracted skills list
 * - Suggested job titles for searching
 * - Seniority level assessment
 */
export async function enrichProfile(candidate) {
  const client = getClient();

  const profileText = buildProfileText(candidate);

  const response = await client.chat.completions.create({
    model: openaiConfig.model,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Je bent een recruitment AI assistant voor MVPeople, een Nederlands recruitmentbureau.
Analyseer het LinkedIn profiel en geef een gestructureerde analyse terug.

Antwoord altijd in het Nederlands, in JSON format met deze velden:
{
  "summary": "Professionele samenvatting van de kandidaat (2-3 zinnen, Nederlands)",
  "skills": ["lijst", "van", "technische", "en", "soft", "skills"],
  "suggestedTitles": ["mogelijke", "functietitels", "voor", "matching"],
  "seniorityLevel": "junior|medior|senior|lead|executive",
  "industries": ["relevante", "sectoren"],
  "highlights": ["3-5 opvallende punten uit het profiel"],
  "tags": ["korte", "tags", "voor", "vincere", "classificatie"],
  "salaryIndication": "Geschatte salarisrange op basis van ervaring en functie (optioneel)",
  "redFlags": ["eventuele aandachtspunten, of lege array"],
  "matchingKeywords": ["zoektermen", "voor", "job", "matching"],
  "functionalExpertise": "Het hoofdgebied van expertise. Kies EXACT één uit: Accounting & Finance | Administration & Office Support | Banking & Financial Services | Construction & Engineering | Customer Service | Education & Training | Executive Management | Healthcare & Medical | Hospitality & Tourism | Human Resources | Information Technology | Legal | Logistics & Supply Chain | Manufacturing & Production | Marketing & Communications | Media & Creative | Mining & Resources | Real Estate & Property | Retail & Consumer | Sales & Business Development | Science & Research | Trades & Services | Transport & Automotive",
  "subFunctionalExpertise": "Een specifiekere sub-expertise binnen het hoofdgebied. Voorbeelden per categorie: IT → Software Development, Data Engineering, Cloud & DevOps, Cybersecurity, IT Support, IT Management, ERP/CRM, AI & Machine Learning. Finance → Financial Analysis, Controlling, Tax, Audit, Treasury. Sales → Account Management, Business Development, Inside Sales, Sales Management. HR → Recruitment, HR Business Partner, Learning & Development, Compensation & Benefits. Marketing → Digital Marketing, Content, Brand Management, Marketing Analytics. Kies de meest passende sub-expertise."
}

BELANGRIJK voor functionalExpertise: Gebruik EXACT de naam uit de lijst hierboven (Engelse benaming). Dit wordt direct in Vincere gezet als classificatie.
BELANGRIJK voor subFunctionalExpertise: Wees zo specifiek mogelijk op basis van het profiel.`
      },
      {
        role: 'user',
        content: `Analyseer dit LinkedIn profiel:\n\n${profileText}`
      }
    ],
  });

  const analysis = JSON.parse(response.choices[0].message.content);

  return {
    ...analysis,
    model: openaiConfig.model,
    enrichedAt: new Date().toISOString(),
  };
}

/**
 * Match a candidate against a list of open jobs
 */
export async function matchCandidateToJobs(candidate, jobs) {
  if (!jobs || jobs.length === 0) return [];

  const client = getClient();

  const profileText = buildProfileText(candidate);
  const jobsList = jobs.map((j, i) => `${i + 1}. ${j.job_title} bij ${j.company_name || 'Onbekend'} (${j.location || 'Onbekend'}) [ID: ${j.id}]`).join('\n');

  const response = await client.chat.completions.create({
    model: openaiConfig.model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Je bent een recruitment AI die kandidaten matcht aan vacatures.
Beoordeel de match tussen de kandidaat en elke vacature.

Antwoord in JSON:
{
  "matches": [
    {
      "jobId": 123,
      "title": "Functietitel",
      "score": 85,
      "reason": "Korte uitleg waarom dit een goede match is (Nederlands)"
    }
  ]
}

Geef alleen matches met score >= 50. Sorteer op score (hoogste eerst). Max 5 matches.`
      },
      {
        role: 'user',
        content: `Kandidaat profiel:\n${profileText}\n\nOpenstaande vacatures:\n${jobsList}`
      }
    ],
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result.matches || [];
}

/**
 * Parse unstructured text (e.g. copy-pasted LinkedIn profile) into structured candidate data
 */
export async function parseUnstructuredProfile(text) {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: openaiConfig.model,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Je bent een data extraction AI. Extraheer gestructureerde kandidaat gegevens uit ongestructureerde tekst.

Antwoord in JSON:
{
  "firstName": "Voornaam",
  "lastName": "Achternaam",
  "email": "email als gevonden of null",
  "phone": "telefoon als gevonden of null",
  "currentTitle": "Huidige functietitel",
  "currentCompany": "Huidig bedrijf",
  "location": "Locatie/stad",
  "summary": "Korte samenvatting",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "Functietitel",
      "company": "Bedrijf",
      "duration": "Periode",
      "description": "Korte beschrijving"
    }
  ],
  "education": [
    {
      "degree": "Opleiding",
      "institution": "School/Universiteit",
      "year": "Jaar"
    }
  ],
  "languages": ["Nederlands", "Engels"],
  "linkedinUrl": "LinkedIn URL als gevonden of null"
}`
      },
      {
        role: 'user',
        content: `Extraheer de gegevens uit deze tekst:\n\n${text}`
      }
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Build a text representation of the candidate for AI prompts
 */
function buildProfileText(candidate) {
  const parts = [];

  if (candidate.firstName || candidate.lastName) {
    parts.push(`Naam: ${candidate.firstName} ${candidate.lastName}`);
  }
  if (candidate.currentTitle) {
    parts.push(`Functie: ${candidate.currentTitle}`);
  }
  if (candidate.currentCompany) {
    parts.push(`Bedrijf: ${candidate.currentCompany}`);
  }
  if (candidate.location) {
    parts.push(`Locatie: ${candidate.location}`);
  }
  if (candidate.summary) {
    parts.push(`Over:\n${candidate.summary}`);
  }
  if (candidate.skills?.length > 0) {
    parts.push(`Skills: ${candidate.skills.join(', ')}`);
  }
  if (candidate.experience?.length > 0) {
    parts.push(`Ervaring:`);
    candidate.experience.forEach(exp => {
      parts.push(`  - ${exp.title} bij ${exp.company} (${exp.duration || 'onbekend'})`);
      if (exp.description) parts.push(`    ${exp.description}`);
    });
  }
  if (candidate.education?.length > 0) {
    parts.push(`Opleiding:`);
    candidate.education.forEach(edu => {
      parts.push(`  - ${edu.degree} @ ${edu.institution} (${edu.year || 'onbekend'})`);
    });
  }
  if (candidate.languages?.length > 0) {
    parts.push(`Talen: ${candidate.languages.join(', ')}`);
  }
  if (candidate.linkedinUrl) {
    parts.push(`LinkedIn: ${candidate.linkedinUrl}`);
  }

  return parts.join('\n');
}
