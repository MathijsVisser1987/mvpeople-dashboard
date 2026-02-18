/**
 * Background Service Worker
 *
 * Handles communication between content script and the backend API.
 * Stores API URL in chrome.storage for configurability.
 */

const DEFAULT_API_URL = 'http://localhost:3002';

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('apiUrl', (result) => {
    if (!result.apiUrl) {
      chrome.storage.sync.set({ apiUrl: DEFAULT_API_URL });
    }
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processCandidate') {
    handleProcessCandidate(request.data, request.options)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async
  }

  if (request.action === 'checkHealth') {
    handleHealthCheck()
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function getApiUrl() {
  return new Promise(resolve => {
    chrome.storage.sync.get('apiUrl', (result) => {
      resolve(result.apiUrl || DEFAULT_API_URL);
    });
  });
}

async function handleProcessCandidate(candidateData, options = {}) {
  const apiUrl = await getApiUrl();
  const params = new URLSearchParams();
  if (options.forceCreate) params.set('forceCreate', 'true');
  if (options.autoApply) params.set('autoApply', 'true');

  const response = await fetch(`${apiUrl}/api/agent/process?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error: ${response.status} - ${text}`);
  }

  return response.json();
}

async function handleHealthCheck() {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/health`);
  return response.json();
}
