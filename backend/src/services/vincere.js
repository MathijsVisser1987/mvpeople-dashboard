// Token persistence: uses Upstash Redis on Vercel, falls back to filesystem locally
let redis = null;
let fs = null;
let TOKEN_FILE = null;

async function getRedis() {
  if (redis) return redis;
  try {
    // Only use Redis if Upstash env vars are present (i.e. running on Vercel with KV store)
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      return redis;
    }
  } catch {
    // @upstash/redis not available or not configured
  }
  return null;
}

async function getFsPath() {
  if (TOKEN_FILE) return TOKEN_FILE;
  try {
    fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.default.dirname(fileURLToPath(import.meta.url));
    TOKEN_FILE = path.default.join(__dirname, '../../.vincere-tokens.json');
    return TOKEN_FILE;
  } catch {
    return null;
  }
}

const KV_KEY = 'vincere-tokens';

class VincereService {
  constructor() {
    this.domain = process.env.VINCERE_DOMAIN;
    this.apiKey = process.env.VINCERE_API_KEY;
    this.clientId = process.env.VINCERE_CLIENT_ID;
    this.redirectUri = process.env.VINCERE_REDIRECT_URI;
    this.idServer = process.env.VINCERE_ID_SERVER || 'https://id.vincere.io';
    this.apiBase = `https://${this.domain}/api/v2`;

    this.idToken = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this._tokensLoaded = false;
  }

  // --- Token persistence (KV on Vercel, filesystem locally) ---

  async _loadTokens() {
    if (this._tokensLoaded) return;
    this._tokensLoaded = true;

    // Try Upstash Redis first
    const store = await getRedis();
    if (store) {
      try {
        const data = await store.get(KV_KEY);
        if (data) {
          this.idToken = data.idToken || null;
          this.accessToken = data.accessToken || null;
          this.refreshToken = data.refreshToken || null;
          this.tokenExpiry = data.tokenExpiry ? new Date(data.tokenExpiry) : null;
          console.log('[Vincere] Loaded tokens from Redis');
          return;
        }
      } catch (err) {
        console.log('[Vincere] Redis load error:', err.message);
      }
    }

    // Fallback to filesystem (local dev)
    const filePath = await getFsPath();
    if (filePath && fs) {
      try {
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          this.idToken = data.idToken || null;
          this.accessToken = data.accessToken || null;
          this.refreshToken = data.refreshToken || null;
          this.tokenExpiry = data.tokenExpiry ? new Date(data.tokenExpiry) : null;
          console.log('[Vincere] Loaded tokens from file');
        }
      } catch {
        console.log('[Vincere] No saved tokens found');
      }
    }
  }

  async _saveTokens() {
    const data = {
      idToken: this.idToken,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenExpiry: this.tokenExpiry?.toISOString(),
    };

    // Try Upstash Redis first
    const store = await getRedis();
    if (store) {
      try {
        await store.set(KV_KEY, JSON.stringify(data));
        console.log('[Vincere] Tokens saved to Redis');
        return;
      } catch (err) {
        console.log('[Vincere] Redis save error:', err.message);
      }
    }

    // Fallback to filesystem (local dev)
    const filePath = await getFsPath();
    if (filePath && fs) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log('[Vincere] Tokens saved to file');
      } catch (err) {
        console.warn('[Vincere] File save error:', err.message);
      }
    }
  }

  // --- OAuth Flow ---

  getAuthorizationUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: 'vincere_auth',
    });
    return `${this.idServer}/oauth2/authorize?${params}`;
  }

  async exchangeCodeForTokens(code) {
    const res = await fetch(`${this.idServer}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Vincere token exchange failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    this.idToken = data.id_token;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in || 1800) * 1000);
    await this._saveTokens();
    console.log('[Vincere] Tokens obtained successfully');
    return data;
  }

  async refreshTokens() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Complete OAuth flow first.');
    }

    const res = await fetch(`${this.idServer}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Vincere token refresh failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    this.idToken = data.id_token;
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in || 1800) * 1000);
    await this._saveTokens();
    console.log('[Vincere] Tokens refreshed');
  }

  async ensureValidToken() {
    await this._loadTokens();
    if (!this.idToken || !this.refreshToken) {
      throw new Error('NOT_AUTHENTICATED');
    }
    // Refresh if token expires within 5 minutes
    if (!this.tokenExpiry || Date.now() > this.tokenExpiry.getTime() - 5 * 60 * 1000) {
      await this.refreshTokens();
    }
  }

  async isAuthenticated() {
    await this._loadTokens();
    return !!(this.idToken && this.refreshToken);
  }

  // --- API Calls ---

  async _apiGet(endpoint, params = {}) {
    await this.ensureValidToken();

    const url = new URL(`${this.apiBase}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    const res = await fetch(url, {
      headers: {
        'id-token': this.idToken,
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Vincere API error ${res.status}: ${err}`);
    }

    return res.json();
  }

  async getCandidatePlacements(candidateId) {
    return this._apiGet(`/candidate/${candidateId}/placement_status`);
  }

  async searchByOwner(entity, ownerId, startIndex = 0, limit = 50) {
    return this._apiGet(`/${entity}/search/fl=id;sort=created_date`, {
      owner_id: ownerId,
      start: startIndex,
      limit,
    });
  }

  async getPlacement(placementId) {
    return this._apiGet(`/placement/${placementId}`);
  }

  async getJobPlacements(jobId) {
    return this._apiGet(`/position/${jobId}/placements`);
  }

  async searchJobs(params = {}) {
    const queryParts = [];
    if (params.startDate) queryParts.push(`created_date:[${params.startDate} TO *]`);
    if (params.endDate) queryParts.push(`created_date:[* TO ${params.endDate}]`);

    return this._apiGet('/job/search/fl=id,created_date,job_title,status', {
      q: queryParts.length ? queryParts.join(' AND ') : undefined,
      start: params.start || 0,
      limit: params.limit || 100,
    });
  }

  async getRecruiterPlacements(vincereId) {
    try {
      const result = await this._apiGet(`/user/${vincereId}/placements`, {
        start: 0,
        limit: 100,
      });
      return result;
    } catch {
      try {
        const result = await this._apiGet(`/placement/search/fl=id,candidate_id,job_id,created_date,start_date,salary,percentage_of_salary,fee_value,status`, {
          sort: '-created_date',
          start: 0,
          limit: 100,
        });
        return result;
      } catch (err2) {
        console.warn(`[Vincere] Could not fetch placements for user ${vincereId}:`, err2.message);
        return { result: [] };
      }
    }
  }

  async getAllRecentPlacements(daysBack = 30) {
    try {
      const result = await this._apiGet('/placement/search/fl=id,candidate_id,job_id,created_date,start_date,fee_value,status,owner_id', {
        sort: '-created_date',
        start: 0,
        limit: 200,
      });
      return result;
    } catch (err) {
      console.warn('[Vincere] Placement search failed:', err.message);
      return { result: [], total: 0 };
    }
  }

  async getPlacementDetail(placementId) {
    try {
      return await this._apiGet(`/placement/${placementId}`);
    } catch (err) {
      console.warn(`[Vincere] Failed to get placement ${placementId}:`, err.message);
      return null;
    }
  }
}

// Singleton
const vincereService = new VincereService();
export default vincereService;
