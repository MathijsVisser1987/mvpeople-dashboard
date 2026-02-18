/**
 * CV Generator - MVPeople Format
 *
 * Generates a professional PDF CV in MVPeople branding from candidate data.
 * The PDF is created with PDFKit and can be uploaded to Vincere as a file.
 */

import PDFDocument from 'pdfkit';

// MVPeople brand colors
const COLORS = {
  primary: '#1e40af',      // Dark blue
  accent: '#3b82f6',       // Blue
  dark: '#0f172a',         // Near black
  text: '#334155',         // Dark grey
  textLight: '#64748b',    // Medium grey
  divider: '#e2e8f0',      // Light grey
  white: '#ffffff',
  headerBg: '#1e293b',     // Dark slate
};

/**
 * Generate a PDF CV in MVPeople format
 *
 * @param {Object} candidate - Normalized candidate data
 * @param {Object} [aiAnalysis] - Optional AI enrichment data
 * @returns {Promise<Buffer>} PDF file as a Buffer
 */
export async function generateCV(candidate, aiAnalysis = null) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 40, left: 0, right: 0 },
        info: {
          Title: `CV - ${candidate.firstName} ${candidate.lastName}`,
          Author: 'MVPeople',
          Subject: 'Kandidaat CV',
          Creator: 'MVPeople LinkedIn Agent',
        },
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header / Banner ──
      drawHeader(doc, candidate);

      // ── Contact info ──
      let y = 180;
      y = drawContactBar(doc, candidate, y);

      // ── Summary ──
      if (candidate.summary || aiAnalysis?.summary) {
        y = drawSection(doc, 'Profiel', y);
        const summary = aiAnalysis?.summary || candidate.summary;
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
        doc.text(summary, 50, y, { width: 495, lineGap: 4 });
        y = doc.y + 20;
      }

      // ── Key highlights (from AI) ──
      if (aiAnalysis?.highlights?.length > 0) {
        y = drawSection(doc, 'Highlights', y);
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
        for (const highlight of aiAnalysis.highlights) {
          if (y > 740) { doc.addPage(); y = 50; }
          doc.text(`•  ${highlight}`, 55, y, { width: 490, lineGap: 2 });
          y = doc.y + 6;
        }
        y += 10;
      }

      // ── Experience ──
      if (candidate.experience?.length > 0) {
        y = drawSection(doc, 'Werkervaring', y);
        for (const exp of candidate.experience) {
          if (y > 700) { doc.addPage(); y = 50; }
          y = drawExperienceItem(doc, exp, y);
        }
      }

      // ── Education ──
      if (candidate.education?.length > 0) {
        y = drawSection(doc, 'Opleiding', y);
        for (const edu of candidate.education) {
          if (y > 720) { doc.addPage(); y = 50; }
          y = drawEducationItem(doc, edu, y);
        }
      }

      // ── Skills ──
      const skills = candidate.skills?.length > 0 ? candidate.skills
        : aiAnalysis?.skills?.length > 0 ? aiAnalysis.skills
        : null;

      if (skills) {
        y = drawSection(doc, 'Vaardigheden', y);
        y = drawSkillTags(doc, skills, y);
      }

      // ── Languages ──
      if (candidate.languages?.length > 0) {
        y = drawSection(doc, 'Talen', y);
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.text);
        doc.text(candidate.languages.join('  •  '), 55, y, { width: 490 });
        y = doc.y + 20;
      }

      // ── Footer ──
      drawFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Drawing functions ──

function drawHeader(doc, candidate) {
  // Full-width header bar
  doc.rect(0, 0, 595, 160).fill(COLORS.headerBg);

  // MVPeople logo text
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.accent);
  doc.text('MVPEOPLE', 50, 25, { width: 200 });

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.textLight);
  doc.text('Recruitment & Staffing', 50, 40, { width: 200 });

  // "CONFIDENTIAL" tag
  doc.font('Helvetica').fontSize(7).fillColor(COLORS.textLight);
  doc.text('VERTROUWELIJK', 480, 25, { width: 80, align: 'right' });

  // Candidate name
  const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
  doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.white);
  doc.text(fullName, 50, 70, { width: 495 });

  // Title & company
  const subtitle = [candidate.currentTitle, candidate.currentCompany].filter(Boolean).join('  |  ');
  if (subtitle) {
    doc.font('Helvetica').fontSize(13).fillColor(COLORS.accent);
    doc.text(subtitle, 50, 110, { width: 495 });
  }

  // Location
  if (candidate.location) {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.textLight);
    doc.text(candidate.location, 50, 135, { width: 495 });
  }
}

function drawContactBar(doc, candidate, y) {
  const contacts = [];
  if (candidate.email) contacts.push(`Email: ${candidate.email}`);
  if (candidate.phone) contacts.push(`Tel: ${candidate.phone}`);
  if (candidate.linkedinUrl) contacts.push(`LinkedIn: ${candidate.linkedinUrl}`);

  if (contacts.length === 0) return y + 10;

  doc.rect(0, y - 10, 595, 30).fill('#f1f5f9');
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.textLight);
  doc.text(contacts.join('     |     '), 50, y - 2, { width: 495, align: 'center' });
  return y + 30;
}

function drawSection(doc, title, y) {
  if (y > 720) { doc.addPage(); y = 50; }

  // Blue accent line
  doc.rect(50, y, 40, 3).fill(COLORS.accent);
  y += 10;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.dark);
  doc.text(title.toUpperCase(), 50, y, { width: 495 });
  y = doc.y + 10;

  return y;
}

function drawExperienceItem(doc, exp, y) {
  // Title
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark);
  doc.text(exp.title || 'Functie', 55, y, { width: 370 });

  // Duration (right aligned)
  if (exp.duration) {
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.textLight);
    doc.text(exp.duration, 400, y + 2, { width: 145, align: 'right' });
  }

  y = doc.y + 2;

  // Company
  if (exp.company) {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.accent);
    doc.text(exp.company, 55, y, { width: 490 });
    y = doc.y + 4;
  }

  // Description
  if (exp.description) {
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);
    doc.text(exp.description, 55, y, { width: 490, lineGap: 2 });
    y = doc.y + 4;
  }

  // Divider
  y += 6;
  doc.rect(55, y, 490, 0.5).fill(COLORS.divider);
  y += 12;

  return y;
}

function drawEducationItem(doc, edu, y) {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark);
  doc.text(edu.degree || edu.institution || 'Opleiding', 55, y, { width: 370 });

  if (edu.year) {
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.textLight);
    doc.text(edu.year, 400, y + 2, { width: 145, align: 'right' });
  }

  y = doc.y + 2;

  if (edu.institution && edu.degree) {
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.accent);
    doc.text(edu.institution, 55, y, { width: 490 });
    y = doc.y;
  }

  y += 14;
  return y;
}

function drawSkillTags(doc, skills, y) {
  let x = 55;
  const maxWidth = 540;

  for (const skill of skills) {
    const textWidth = doc.font('Helvetica').fontSize(9).widthOfString(skill);
    const tagWidth = textWidth + 16;

    if (x + tagWidth > maxWidth) {
      x = 55;
      y += 24;
      if (y > 740) { doc.addPage(); y = 50; }
    }

    // Tag background
    doc.roundedRect(x, y, tagWidth, 20, 4).fill('#e0e7ff');

    // Tag text
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.primary);
    doc.text(skill, x + 8, y + 5, { width: textWidth + 4 });

    x += tagWidth + 8;
  }

  return y + 36;
}

function drawFooter(doc) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer line
    doc.rect(50, 800, 495, 0.5).fill(COLORS.divider);

    // Footer text
    doc.font('Helvetica').fontSize(7).fillColor(COLORS.textLight);
    doc.text(
      `Dit CV is vertrouwelijk opgesteld door MVPeople  •  Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}  •  Pagina ${i + 1}/${pages.count}`,
      50, 808,
      { width: 495, align: 'center' }
    );
  }
}
