// Token persistence: uses Upstash Redis on Vercel, falls back to filesystem locally
let redis = null;
let fs = null;
let TOKEN_FILE = null;

async function getRedis() {
  if (redis) return redis;
  try {
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
const KV_DEALS_KEY = 'vincere-deals-cache';

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
    this._loadPromise = null;
    this._tokensLoadedAt = null; // Track when tokens were loaded for staleness check
  }

  // --- Token persistence ---

  async _loadTokens() {
    // Re-read from Redis every 10 minutes (warm Vercel instances may have stale tokens)
    const STALE_MS = 10 * 60 * 1000;
    if (this._loadPromise && this._tokensLoadedAt && Date.now() - this._tokensLoadedAt < STALE_MS) {
      return this._loadPromise;
    }
    this._loadPromise = this._doLoadTokens();
    return this._loadPromise;
  }

  async _doLoadTokens() {
    try {
      const store = await getRedis();
      if (store) {
        try {
          const data = await store.get(KV_KEY);
          if (data) {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            this.idToken = parsed.idToken || null;
            this.accessToken = parsed.accessToken || null;
            this.refreshToken = parsed.refreshToken || null;
            this.tokenExpiry = parsed.tokenExpiry ? new Date(parsed.tokenExpiry) : null;
            console.log('[Vincere] Loaded tokens from Redis');
            return;
          }
        } catch (err) {
          console.log('[Vincere] Redis load error:', err.message);
        }
      }

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
    } finally {
      if (this.idToken && this.refreshToken) {
        this._tokensLoadedAt = Date.now();
      } else {
        // No tokens found — clear promise so next call retries from Redis
        this._loadPromise = null;
        this._tokensLoadedAt = null;
        console.log('[Vincere] No tokens loaded — will retry on next request');
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
    this._loadPromise = null; // Clear so next _loadTokens() sees fresh tokens
    this._tokensLoadedAt = Date.now();
    await this._saveTokens();
    console.log('[Vincere] Tokens obtained successfully');
    return data;
  }

  async refreshTokens() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Complete OAuth flow first.');
    }

    let res;
    try {
      res = await fetch(`${this.idServer}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });
    } catch (networkErr) {
      console.error('[Vincere] Token refresh network error:', networkErr.message);
      throw networkErr;
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`[Vincere] Token refresh failed: ${res.status} ${err}`);
      // 400/401/403 = refresh token is invalid/expired — clear tokens so isAuthenticated() returns false
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        console.error('[Vincere] Refresh token rejected — clearing tokens. Re-authenticate via OAuth.');
        this.idToken = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this._loadPromise = null;
        this._tokensLoadedAt = null;
      }
      throw new Error(`Vincere token refresh failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    this.idToken = data.id_token;
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in || 1800) * 1000);
    this._tokensLoadedAt = Date.now();
    await this._saveTokens();
    console.log('[Vincere] Tokens refreshed');
  }

  async ensureValidToken() {
    await this._loadTokens();
    if (!this.idToken || !this.refreshToken) {
      throw new Error('NOT_AUTHENTICATED');
    }
    if (!this.tokenExpiry || Date.now() > this.tokenExpiry.getTime() - 5 * 60 * 1000) {
      await this.refreshTokens();
    }
  }

  async isAuthenticated() {
    await this._loadTokens();
    return !!(this.idToken && this.refreshToken);
  }

  // --- API Calls ---

  async _apiGet(endpoint, params = {}, retries = 3) {
    await this.ensureValidToken();

    const url = new URL(`${this.apiBase}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
      const res = await fetch(url, {
        headers: {
          'id-token': this.idToken,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 429 && attempt < retries) {
        const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        console.log(`[Vincere] Rate limited on ${endpoint}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Vincere API ${res.status} ${endpoint}: ${err}`);
      }

      return res.json();
    }
  }

  async _apiPost(endpoint, body = {}, params = {}, retries = 3) {
    await this.ensureValidToken();

    const url = new URL(`${this.apiBase}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'id-token': this.idToken,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429 && attempt < retries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`[Vincere] Rate limited on POST ${endpoint}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Vincere API POST ${res.status} ${endpoint}: ${err}`);
      }

      return res.json();
    }
  }

  // Fetch activities for a date range (global endpoint, no per-user filter available)
  // Dates must be full ISO datetime strings (e.g. "2026-02-01T00:00:00.000Z")
  async getActivities(startDate, endDate, page = 0) {
    // Ensure full ISO datetime format
    const startISO = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`;
    const endISO = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
    return this._apiPost('/activities', {
      created_date_from: startISO,
      created_date_to: endISO,
    }, { index: page });
  }

  // --- Placement/Deal fetching ---
  // Vincere API v2: 10 items per page, no way to increase.
  // /position/{id}/placements → [ { placement_id, placed_by, status, ... } ]
  // No /placement/search endpoint. Must scan jobs individually.
  // Deals attributed by placed_by email, not job creator.
  //
  // Progressive scan: each request scans a chunk of jobs, results accumulate in KV.
  // Full scan of 866+ jobs takes multiple requests to complete.

  async getJobPlacements(jobId) {
    return this._apiGet(`/position/${jobId}/placements`);
  }

  // Scan a chunk of jobs for placements, accumulating results in KV
  async getAllTeamDeals(teamMembers) {
    const store = await getRedis();

    // Month-specific scan key so it auto-resets each month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const KV_SCAN_KEY = `vincere-deals-scan-${monthKey}`;

    // Load existing scan state from KV
    let scanState = null;
    if (store) {
      try {
        const cached = await store.get(KV_SCAN_KEY);
        if (cached) {
          scanState = typeof cached === 'string' ? JSON.parse(cached) : cached;
        }
      } catch (err) {
        console.log('[Vincere] Scan state read error:', err.message);
      }
    }

    // If we have a completed scan that's less than 1 hour old, use it
    if (scanState && scanState.complete && scanState.timestamp &&
        Date.now() - scanState.timestamp < 60 * 60 * 1000) {
      console.log('[Vincere] Using completed scan from', new Date(scanState.timestamp).toISOString());
      return { stats: scanState.stats, scanComplete: true };
    }

    // Build email → vincereId lookup
    const emailToId = {};
    for (const m of teamMembers) {
      if (m.email) emailToId[m.email.toLowerCase()] = m.vincereId;
    }

    // Initialize or continue scan
    let stats = {};
    let scannedJobIds = new Set();
    let seenAppIds = new Set();
    let nextStart = 0;
    let totalJobs = null;
    let unmatchedEmails = {};

    if (scanState && !scanState.complete && scanState.stats) {
      // Continue from where we left off
      stats = scanState.stats;
      scannedJobIds = new Set(scanState.scannedJobIds || []);
      seenAppIds = new Set(scanState.seenAppIds || []);
      nextStart = scanState.nextStart || 0;
      totalJobs = scanState.totalJobs || null;
      unmatchedEmails = scanState.unmatchedEmails || {};
      console.log(`[Vincere] Resuming scan from start=${nextStart}, scanned ${scannedJobIds.size} jobs, ${seenAppIds.size} unique app IDs`);
    } else {
      // Fresh scan
      for (const m of teamMembers) {
        stats[m.vincereId] = { deals: 0, activePlacements: 0, pipelineValue: 0 };
      }
    }

    const startTime = Date.now();
    const MAX_DURATION_MS = 20000; // Stop after 20s to leave room for response

    try {
      // Fetch job pages and check placements until time runs out
      while (totalJobs === null || nextStart < totalJobs) {
        if (Date.now() - startTime > MAX_DURATION_MS) {
          console.log(`[Vincere] Time limit reached at start=${nextStart}, saving progress`);
          break;
        }

        // Fetch a page of job IDs (newest first — recent placements found faster)
        const data = await this._apiGet(
          '/job/search/fl=id;sort=created_date desc',
          { start: nextStart }
        );
        const items = data?.result?.items || [];
        if (totalJobs === null) totalJobs = data?.result?.total || 0;

        if (items.length === 0) break;

        // Check placements for these jobs (batch 3 at a time to avoid rate limits)
        const jobIds = items.map(j => j.id).filter(id => id && !scannedJobIds.has(id));
        if (jobIds.length > 0) {
          const results = [];
          const BATCH_SIZE = 3;
          for (let b = 0; b < jobIds.length; b += BATCH_SIZE) {
            const batch = jobIds.slice(b, b + BATCH_SIZE);
            const batchResults = await Promise.allSettled(
              batch.map(jobId => this.getJobPlacements(jobId))
            );
            results.push(...batchResults);
            if (b + BATCH_SIZE < jobIds.length) {
              await new Promise(r => setTimeout(r, 200)); // small pause between batches
            }
          }

          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            scannedJobIds.add(jobIds[i]);

            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
              for (const placement of result.value) {
                // Only count placements from the current month
                if (!placement.placed_date) continue;
                const placedDate = new Date(placement.placed_date);
                if (placedDate < monthStart) continue;

                // Use application_id as unique deal key: each APP ID = max 1 deal.
                // Only count renewal_number 0, 1, null/undefined (new placements).
                // renewal_number 2, 3, etc. are contract extensions.
                const renewalNum = placement.renewal_number ?? placement.renewal ?? null;
                if (renewalNum !== null && renewalNum !== undefined && renewalNum > 1) {
                  continue; // Contract extension, skip
                }

                // Deduplicate by application_id across entire scan
                const appId = placement.application_id;
                if (appId && seenAppIds.has(appId)) {
                  continue; // Already counted this application
                }
                if (appId) seenAppIds.add(appId);

                const placedByEmail = (placement.placed_by || '').toLowerCase();
                const vincereId = emailToId[placedByEmail];
                if (vincereId && stats[vincereId]) {
                  stats[vincereId].deals++;
                  if (placement.status !== 'terminated' && placement.status !== 'cancelled') {
                    stats[vincereId].activePlacements++;
                    // Accumulate pipeline value from placement financial fields
                    const fee = placement.nfi || placement.fee || placement.margin ||
                                placement.total_fee || placement.value || 0;
                    if (typeof fee === 'number' && fee > 0) {
                      stats[vincereId].pipelineValue += fee;
                    }
                  }
                } else if (placedByEmail) {
                  unmatchedEmails[placedByEmail] = (unmatchedEmails[placedByEmail] || 0) + 1;
                }
              }
            }
          }
        }

        nextStart += items.length;
      }
    } catch (err) {
      console.error('[Vincere] Deal scan error:', err.message);
    }

    const isComplete = totalJobs !== null && nextStart >= totalJobs;

    if (Object.keys(unmatchedEmails).length > 0) {
      console.log('[Vincere] Unmatched placed_by emails:', JSON.stringify(unmatchedEmails));
    }

    for (const m of teamMembers) {
      const s = stats[m.vincereId] || { deals: 0 };
      console.log(`[Vincere] ${m.shortName}: ${s.deals} placements (${s.activePlacements || 0} active)`);
    }
    console.log(`[Vincere] Scan ${isComplete ? 'COMPLETE' : 'IN PROGRESS'}: ${scannedJobIds.size}/${totalJobs || '?'} jobs scanned`);

    // Save scan state to KV
    if (store) {
      try {
        await store.set(KV_SCAN_KEY, JSON.stringify({
          stats,
          scannedJobIds: [...scannedJobIds],
          seenAppIds: [...seenAppIds],
          nextStart,
          totalJobs,
          unmatchedEmails,
          complete: isComplete,
          timestamp: isComplete ? Date.now() : (scanState?.timestamp || Date.now()),
        }));
      } catch (err) {
        console.log('[Vincere] Scan state write error:', err.message);
      }
    }

    return { stats, scanComplete: isComplete };
  }

  // Search Vincere deals for pipeline value (uses /deal/search endpoint)
  async getDealStats(teamMembers) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const stats = {};
    for (const m of teamMembers) {
      stats[m.vincereId] = { dealCount: 0, pipelineValue: 0, wonValue: 0 };
    }

    // Build vincereId set and email lookup for matching
    const idSet = new Set(teamMembers.map(m => m.vincereId));
    const emailToId = {};
    for (const m of teamMembers) {
      if (m.email) emailToId[m.email.toLowerCase()] = m.vincereId;
    }

    try {
      let start = 0;
      let total = null;
      const maxPages = 20;

      while (total === null || start < total) {
        if (start / 10 >= maxPages) break;

        const data = await this._apiGet(
          '/deal/search/fl=id,title,status,created_by,owner,value,nfi,margin,fee,created_date,closed_date;sort=created_date desc',
          { start }
        );
        const items = data?.result?.items || [];
        if (total === null) total = data?.result?.total || 0;
        if (items.length === 0) break;

        for (const deal of items) {
          // Only count deals from current month
          const dealDate = deal.closed_date || deal.created_date;
          if (dealDate) {
            const d = new Date(dealDate);
            if (d < monthStart) continue;
          }

          // Try to match deal to team member via owner or created_by
          let vincereId = null;
          if (deal.owner?.id && idSet.has(deal.owner.id)) {
            vincereId = deal.owner.id;
          } else if (deal.created_by?.id && idSet.has(deal.created_by.id)) {
            vincereId = deal.created_by.id;
          } else if (deal.owner?.email && emailToId[deal.owner.email.toLowerCase()]) {
            vincereId = emailToId[deal.owner.email.toLowerCase()];
          } else if (deal.created_by?.email && emailToId[deal.created_by.email.toLowerCase()]) {
            vincereId = emailToId[deal.created_by.email.toLowerCase()];
          }

          if (vincereId && stats[vincereId]) {
            const value = deal.nfi || deal.value || deal.fee || deal.margin || 0;
            stats[vincereId].dealCount++;
            stats[vincereId].pipelineValue += (typeof value === 'number' ? value : 0);
            if (deal.status === 'WON' || deal.status === 'won' || deal.status === 'CLOSED_WON') {
              stats[vincereId].wonValue += (typeof value === 'number' ? value : 0);
            }
          }
        }

        start += items.length;
      }

      console.log('[Vincere] Deal search complete:', JSON.stringify(
        Object.fromEntries(teamMembers.map(m => [m.shortName, stats[m.vincereId]]))
      ));
    } catch (err) {
      console.log('[Vincere] Deal search error (endpoint may not exist):', err.message);
    }

    return stats;
  }
}

const vincereService = new VincereService();
export default vincereService;
