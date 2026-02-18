/**
 * Popup Script
 *
 * Manages the extension popup UI:
 * - Extracts profile data from the active LinkedIn tab
 * - Enriches with Lusha contact data
 * - Sends to backend for processing
 * - Displays step-by-step results
 */

const STEP_NAMES = {
  parse: 'Parsing',
  normalize: 'Normaliseren',
  lusha_enrich: 'Lusha',
  duplicate_check: 'Duplicaat check',
  ai_enrichment: 'AI Verrijking',
  job_matching: 'Job Matching',
  create_vincere: 'Vincere',
  cv_generate: 'CV genereren',
  auto_apply: 'Auto-apply',
};

const STEP_ICONS = {
  done: '\u2713',
  error: '\u2717',
  warning: '!',
  skipped: '-',
  duplicate: '=',
  running: '\u2026',
};

let profileData = null;
let lushaData = null;

// ── Init ──

document.addEventListener('DOMContentLoaded', async () => {
  await checkHealth();
  await loadSettings();
  setupSettingsPanel();
  await extractFromTab();
});

// ── Health check ──

async function checkHealth() {
  const dot = document.getElementById('statusDot');
  try {
    const response = await sendMessage({ action: 'checkHealth' });
    dot.classList.add(response.success ? 'ok' : 'err');
  } catch {
    dot.classList.add('err');
  }
}

// ── Settings ──

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['apiUrl', 'lushaApiKey'], (result) => {
      document.getElementById('apiUrlInput').value = result.apiUrl || 'http://localhost:3002';
      document.getElementById('lushaKeyInput').value = result.lushaApiKey || '';
      resolve();
    });
  });
}

function setupSettingsPanel() {
  const toggle = document.getElementById('settingsToggle');
  const panel = document.getElementById('settingsPanel');
  const main = document.getElementById('mainContent');
  const cancel = document.getElementById('settingsCancel');
  const save = document.getElementById('settingsSave');

  toggle.addEventListener('click', () => {
    const visible = panel.classList.toggle('visible');
    main.style.display = visible ? 'none' : 'block';
  });

  cancel.addEventListener('click', () => {
    panel.classList.remove('visible');
    main.style.display = 'block';
    loadSettings();
  });

  save.addEventListener('click', () => {
    const apiUrl = document.getElementById('apiUrlInput').value.replace(/\/+$/, '');
    const lushaApiKey = document.getElementById('lushaKeyInput').value.trim();
    chrome.storage.sync.set({ apiUrl, lushaApiKey }, () => {
      panel.classList.remove('visible');
      main.style.display = 'block';
      checkHealth();
    });
  });
}

// ── Extract profile from tab ──

async function extractFromTab() {
  const content = document.getElementById('mainContent');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes('linkedin.com/in/')) {
      content.innerHTML = `
        <div class="not-linkedin">
          <div class="icon">&#128100;</div>
          <p>Ga naar een LinkedIn profiel om een kandidaat toe te voegen aan Vincere.</p>
        </div>
      `;
      return;
    }

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProfile' });

    if (!response?.success) {
      content.innerHTML = `
        <div class="not-linkedin">
          <div class="icon">&#9888;</div>
          <p>Kon profieldata niet uitlezen. Ververs de LinkedIn pagina en probeer opnieuw.</p>
        </div>
      `;
      return;
    }

    profileData = response.data;
    renderProfileCard();
  } catch (err) {
    content.innerHTML = `
      <div class="not-linkedin">
        <div class="icon">&#9888;</div>
        <p>Fout bij uitlezen: ${err.message}<br><br>Ververs de LinkedIn pagina en probeer opnieuw.</p>
      </div>
    `;
  }
}

// ── Lusha enrichment ──

async function enrichWithLusha() {
  const lushaSection = document.getElementById('lushaSection');

  const lushaApiKey = await new Promise(resolve => {
    chrome.storage.sync.get('lushaApiKey', r => resolve(r.lushaApiKey));
  });

  if (!lushaApiKey) {
    lushaSection.innerHTML = `
      <h3>Lusha</h3>
      <div class="lusha-status">Configureer je Lusha API key in de instellingen</div>
    `;
    return;
  }

  lushaSection.innerHTML = `
    <h3>Lusha</h3>
    <div class="lusha-status"><span class="spinner"></span> Contactgegevens ophalen...</div>
  `;

  try {
    const apiUrl = await new Promise(resolve => {
      chrome.storage.sync.get('apiUrl', r => resolve(r.apiUrl || 'http://localhost:3002'));
    });

    const response = await fetch(`${apiUrl}/api/lusha/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        company: profileData.currentCompany,
        linkedinUrl: profileData.linkedinUrl,
      }),
    });

    if (!response.ok) throw new Error(`${response.status}`);

    lushaData = await response.json();

    // Merge Lusha data into profile
    if (lushaData.email && !profileData.email) profileData.email = lushaData.email;
    if (lushaData.phone && !profileData.phone) profileData.phone = lushaData.phone;

    lushaSection.innerHTML = `
      <h3>Lusha contactgegevens</h3>
      <div class="lusha-data">
        ${lushaData.email ? `<div class="item"><span class="label">Email</span><span class="value">${lushaData.email}</span></div>` : ''}
        ${lushaData.phone ? `<div class="item"><span class="label">Telefoon</span><span class="value">${lushaData.phone}</span></div>` : ''}
        ${lushaData.company ? `<div class="item"><span class="label">Bedrijf</span><span class="value">${lushaData.company}</span></div>` : ''}
        ${!lushaData.email && !lushaData.phone ? '<div class="lusha-status">Geen contactgegevens gevonden</div>' : ''}
      </div>
    `;
  } catch (err) {
    lushaSection.innerHTML = `
      <h3>Lusha</h3>
      <div class="lusha-status">Fout: ${err.message}</div>
    `;
  }
}

// ── Render profile card ──

function renderProfileCard() {
  const content = document.getElementById('mainContent');
  const d = profileData;

  content.innerHTML = `
    <div class="profile-card">
      <div class="profile-name">${d.firstName || ''} ${d.lastName || ''}</div>
      <div class="profile-title">${d.currentTitle || 'Onbekende functie'}</div>
      <div class="profile-meta">
        ${d.currentCompany ? `<span>&#127970; ${d.currentCompany}</span>` : ''}
        ${d.location ? `<span>&#128205; ${d.location}</span>` : ''}
        ${d.skills?.length ? `<span>&#128736; ${d.skills.length} skills</span>` : ''}
      </div>
    </div>

    <div class="lusha-section" id="lushaSection">
      <h3>Lusha contactgegevens</h3>
      <button class="btn btn-lusha" id="lushaBtn" onclick="enrichWithLusha()">
        &#128270; Ophalen via Lusha
      </button>
    </div>

    <div class="options">
      <label><input type="checkbox" id="autoApply"> Auto-apply vacatures</label>
      <label><input type="checkbox" id="forceCreate"> Forceer aanmaken</label>
    </div>

    <button class="btn btn-primary" id="processBtn">
      Toevoegen aan Vincere
    </button>

    <div id="resultArea"></div>
  `;

  document.getElementById('processBtn').addEventListener('click', processCandidate);
}

// ── Process candidate ──

async function processCandidate() {
  const btn = document.getElementById('processBtn');
  const resultArea = document.getElementById('resultArea');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Verwerken...';
  resultArea.innerHTML = '';

  try {
    const options = {
      forceCreate: document.getElementById('forceCreate')?.checked,
      autoApply: document.getElementById('autoApply')?.checked,
    };

    const response = await sendMessage({
      action: 'processCandidate',
      data: profileData,
      options,
    });

    if (!response.success) {
      throw new Error(response.error || 'Onbekende fout');
    }

    renderResult(response.result, resultArea);
  } catch (err) {
    resultArea.innerHTML = `<div class="banner error" style="margin-top: 12px;">Fout: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Toevoegen aan Vincere';
  }
}

// ── Render result ──

function renderResult(data, container) {
  const statusText = {
    success: `Aangemaakt in Vincere (ID: ${data.vincereId})`,
    duplicate: `Duplicaat gevonden (ID: ${data.vincereId}, via ${data.matchedOn || '?'})`,
    validation_error: 'Validatie mislukt',
    error: data.errors?.[0] || 'Er is een fout opgetreden',
  };

  const statusClass = data.status === 'success' ? 'success'
    : data.status === 'duplicate' ? 'duplicate' : 'error';

  let html = `<div class="banner ${statusClass}" style="margin-top: 12px;">${statusText[data.status] || data.status}</div>`;

  if (data.steps?.length > 0) {
    html += '<div class="steps">';
    for (const step of data.steps) {
      html += `
        <div class="step">
          <div class="step-icon ${step.status}">${STEP_ICONS[step.status] || '?'}</div>
          <span class="step-name">${STEP_NAMES[step.step] || step.step}</span>
          <span class="step-detail">${step.detail || ''}</span>
        </div>
      `;
    }
    html += '</div>';
  }

  if (data.jobMatches?.length > 0) {
    html += '<div class="matches"><h3>Vacature matches</h3>';
    for (const m of data.jobMatches) {
      html += `
        <div class="match">
          <span class="match-score">${m.score}%</span>
          <div>
            <div class="match-title">${m.title}</div>
            <div class="match-reason">${m.reason}</div>
          </div>
        </div>
      `;
    }
    html += '</div>';
  }

  container.innerHTML = html;
}

// ── Helpers ──

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
