import { vincereConfig } from '../config/vincere.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, '../../.vincere-tokens.json');

let tokens = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
};

function loadTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      tokens = data;
      console.log('[VincereAuth] Tokens loaded from file');
      return true;
    }
  } catch (err) {
    console.error('[VincereAuth] Failed to load tokens:', err.message);
  }
  return false;
}

function saveTokens() {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log('[VincereAuth] Tokens saved to file');
  } catch (err) {
    console.error('[VincereAuth] Failed to save tokens:', err.message);
  }
}

export function getLoginUrl() {
  const params = new URLSearchParams({
    client_id: vincereConfig.clientId,
    redirect_uri: vincereConfig.redirectUri,
    response_type: 'code',
    state: 'linkedin-agent',
  });
  return `${vincereConfig.idServer}/oauth2/authorize?${params}`;
}

export async function handleCallback(code) {
  const response = await fetch(`${vincereConfig.idServer}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: vincereConfig.clientId,
      code,
      grant_type: 'authorization_code',
      redirect_uri: vincereConfig.redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  tokens.accessToken = data.access_token;
  tokens.refreshToken = data.refresh_token;
  tokens.expiresAt = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000); // 5 min buffer
  saveTokens();
  return tokens;
}

async function refreshAccessToken() {
  if (!tokens.refreshToken) {
    throw new Error('No refresh token available. Please login via /auth/vincere/login');
  }

  const response = await fetch(`${vincereConfig.idServer}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: vincereConfig.clientId,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  tokens.accessToken = data.access_token;
  if (data.refresh_token) {
    tokens.refreshToken = data.refresh_token;
  }
  tokens.expiresAt = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);
  saveTokens();
  console.log('[VincereAuth] Token refreshed successfully');
}

export async function getAccessToken() {
  if (!tokens.accessToken) {
    loadTokens();
  }

  if (!tokens.accessToken) {
    throw new Error('Not authenticated. Please login via /auth/vincere/login');
  }

  if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
    await refreshAccessToken();
  }

  return tokens.accessToken;
}

export function getAuthHeaders() {
  return {
    'x-api-key': vincereConfig.apiKey,
    'id-token': tokens.accessToken,
    'Content-Type': 'application/json',
  };
}

export function isAuthenticated() {
  if (!tokens.accessToken) loadTokens();
  return !!tokens.accessToken;
}

// Initialize
loadTokens();
