/**
 * Content Script - LinkedIn Profile Data Extraction
 *
 * Runs on linkedin.com/in/* pages.
 * Extracts candidate data from the DOM and sends it to the popup on request.
 */

function extractProfileData() {
  const data = {
    linkedinUrl: window.location.href.split('?')[0],
    source: 'LinkedIn Chrome Extension',
  };

  // Name - from the main profile heading
  const nameEl =
    document.querySelector('.text-heading-xlarge') ||
    document.querySelector('h1.inline.t-24') ||
    document.querySelector('h1');
  if (nameEl) {
    const fullName = nameEl.textContent.trim();
    const parts = fullName.split(/\s+/);
    data.firstName = parts[0] || '';
    data.lastName = parts.slice(1).join(' ') || '';
    data.fullName = fullName;
  }

  // Headline / current title
  const headlineEl =
    document.querySelector('.text-body-medium.break-words') ||
    document.querySelector('.pv-top-card--list .text-body-medium') ||
    document.querySelector('div.text-body-medium');
  if (headlineEl) {
    data.currentTitle = headlineEl.textContent.trim();
  }

  // Location
  const locationEl =
    document.querySelector('.text-body-small.inline.t-black--light.break-words') ||
    document.querySelector('span.t-black--light.break-words');
  if (locationEl) {
    data.location = locationEl.textContent.trim();
  }

  // About / Summary
  const aboutSection = document.querySelector('#about');
  if (aboutSection) {
    const aboutContainer = aboutSection.closest('section');
    if (aboutContainer) {
      const aboutText =
        aboutContainer.querySelector('.inline-show-more-text') ||
        aboutContainer.querySelector('.pv-shared-text-with-see-more span[aria-hidden="true"]') ||
        aboutContainer.querySelector('div.display-flex span[aria-hidden="true"]');
      if (aboutText) {
        data.summary = aboutText.textContent.trim();
      }
    }
  }

  // Current company - from experience section or top card
  const companyEl =
    document.querySelector('.pv-text-details__right-panel-item-text') ||
    document.querySelector('div[aria-label="Current company"]');
  if (companyEl) {
    data.currentCompany = companyEl.textContent.trim();
  }

  // Experience entries
  data.experience = [];
  const experienceSection = document.querySelector('#experience');
  if (experienceSection) {
    const section = experienceSection.closest('section');
    if (section) {
      const items = section.querySelectorAll('li.artdeco-list__item');
      items.forEach(item => {
        const title = item.querySelector('div.display-flex.align-items-center span[aria-hidden="true"]')
          || item.querySelector('.t-bold span[aria-hidden="true"]');
        const company = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');
        const duration = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]');

        if (title) {
          const exp = { title: title.textContent.trim() };
          if (company) exp.company = company.textContent.trim();
          if (duration) exp.duration = duration.textContent.trim();
          data.experience.push(exp);
        }
      });

      // If no company was found from top card, use first experience entry
      if (!data.currentCompany && data.experience.length > 0 && data.experience[0].company) {
        data.currentCompany = data.experience[0].company;
      }
    }
  }

  // Skills
  data.skills = [];
  const skillsSection = document.querySelector('#skills');
  if (skillsSection) {
    const section = skillsSection.closest('section');
    if (section) {
      const skillItems = section.querySelectorAll('span.t-bold span[aria-hidden="true"]');
      skillItems.forEach(el => {
        const skill = el.textContent.trim();
        if (skill && !data.skills.includes(skill)) {
          data.skills.push(skill);
        }
      });
    }
  }

  // Education
  data.education = [];
  const educationSection = document.querySelector('#education');
  if (educationSection) {
    const section = educationSection.closest('section');
    if (section) {
      const items = section.querySelectorAll('li.artdeco-list__item');
      items.forEach(item => {
        const institution = item.querySelector('.t-bold span[aria-hidden="true"]');
        const degree = item.querySelector('.t-14.t-normal span[aria-hidden="true"]');

        if (institution) {
          const edu = { institution: institution.textContent.trim() };
          if (degree) edu.degree = degree.textContent.trim();
          data.education.push(edu);
        }
      });
    }
  }

  return data;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProfile') {
    try {
      const data = extractProfileData();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // Keep message channel open for async response
});
