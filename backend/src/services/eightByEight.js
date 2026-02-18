// 8x8 Work Analytics API Service
// Docs: https://developer.8x8.com/analytics/docs/work-analytics-extension-summary
// Auth: POST /analytics/work/v1/oauth/token
// Data: GET  /analytics/work/v2/extsum

// Token persistence via Upstash Redis (same as vincere.js)
let redis = null;

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
    // @upstash/redis not available
  }
  return null;
}

const KV_KEY_8X8 = '8x8-tokens';

class EightByEightService {
  constructor() {
    // 8x8 Work Analytics API — no region prefix in URLs per official docs
    this.baseUrl = 'https://api.8x8.com';
    this.apiKey = process.env.EIGHT_BY_EIGHT_API_KEY;
    this.secret = process.env.EIGHT_BY_EIGHT_SECRET;
    this.pbxId = process.env.EIGHT_BY_EIGHT_PBX_ID || 'mvpeople';

    this.accessToken = null;
    this.tokenExpiry = null;
    this._loadPromise = null;
    this._authPromise = null;
  }

  async _loadTokens() {
    // Skip if we already have a valid in-memory token
    if (this.isAuthenticated()) return;
    // Use promise-based guard so concurrent callers all await the same load
    if (this._loadPromise) return this._loadPromise;
    this._loadPromise = this._doLoadTokens();
    return this._loadPromise;
  }

  async _doLoadTokens() {
    try {
      const store = await getRedis();
      if (store) {
        try {
          const data = await store.get(KV_KEY_8X8);
          if (data) {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (parsed.tokenExpiry && new Date(parsed.tokenExpiry).getTime() > Date.now()) {
              this.accessToken = parsed.accessToken || null;
              this.tokenExpiry = new Date(parsed.tokenExpiry);
              console.log('[8x8] Loaded tokens from Redis (valid until', this.tokenExpiry.toISOString(), ')');
            } else {
              console.log('[8x8] Redis tokens expired, need re-auth');
            }
          }
        } catch (err) {
          console.log('[8x8] Redis load error:', err.message);
        }
      }
    } finally {
      this._loadPromise = null; // Allow future reloads when token expires
    }
  }

  async _saveTokens() {
    const data = {
      accessToken: this.accessToken,
      tokenExpiry: this.tokenExpiry?.toISOString(),
    };

    const store = await getRedis();
    if (store) {
      try {
        await store.set(KV_KEY_8X8, JSON.stringify(data));
        console.log('[8x8] Tokens saved to Redis');
      } catch (err) {
        console.log('[8x8] Redis save error:', err.message);
      }
    }
  }

  async authenticate(username, password) {
    const url = `${this.baseUrl}/analytics/work/v1/oauth/token`;
    console.log(`[8x8] Authenticating as "${username}" via ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          '8x8-apikey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ username, password }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[8x8] Auth failed: ${res.status} ${err}`);
        throw new Error(`8x8 auth failed (${res.status}): ${err}`);
      }

      const data = await res.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in || 1800) * 1000);
      await this._saveTokens();
      console.log(`[8x8] Authenticated OK, token valid for ${data.expires_in}s`);
      return data;
    } catch (err) {
      if (err.message.startsWith('8x8 auth failed')) throw err;
      throw new Error(`8x8 authentication error: ${err.message}`);
    }
  }

  isAuthenticated() {
    // 2-minute buffer before expiry to prevent mid-request token expiration
    return !!(this.accessToken && this.tokenExpiry &&
      Date.now() < this.tokenExpiry.getTime() - 2 * 60 * 1000);
  }

  async ensureAuthenticated() {
    // Try loading persisted tokens from KV first
    await this._loadTokens();
    if (this.isAuthenticated()) return;
    // Serialize concurrent auth attempts — only one runs, others wait
    if (this._authPromise) return this._authPromise;
    this._authPromise = this._doAuth();
    return this._authPromise;
  }

  async _doAuth() {
    try {
      const username = process.env.EIGHT_BY_EIGHT_USERNAME?.trim();
      const password = process.env.EIGHT_BY_EIGHT_PASSWORD?.trim();
      if (!username || !password) {
        throw new Error('EIGHT_BY_EIGHT_NOT_AUTHENTICATED');
      }
      // Retry up to 2 times with exponential backoff
      let lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await this.authenticate(username, password);
          return; // success
        } catch (err) {
          lastErr = err;
          if (attempt < 2) {
            const delay = 1000 * 2 ** attempt; // 1s, 2s
            console.log(`[8x8] Auth attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      throw lastErr;
    } finally {
      this._authPromise = null;
    }
  }

  // Get extension summary for all extensions in a time range
  async getExtensionSummary(startTime, endTime, timezone = 'Europe/Amsterdam') {
    await this.ensureAuthenticated();

    // Format: yyyy-MM-dd HH:mm:ss
    const formatDate = (d) => {
      const date = d instanceof Date ? d : new Date(d);
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    const params = new URLSearchParams({
      pbxId: this.pbxId,
      startTime: formatDate(startTime),
      endTime: formatDate(endTime),
      timeZone: timezone,
    });

    const url = `${this.baseUrl}/analytics/work/v2/extsum?${params}`;

    const doFetch = async () => {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          '8x8-apikey': this.apiKey,
        },
      });
      return res;
    };

    let res = await doFetch();

    // On 401, invalidate token, re-authenticate through the guard, and retry once
    if (res.status === 401) {
      console.log('[8x8] Got 401 on extsum, re-authenticating...');
      this.accessToken = null;
      this.tokenExpiry = null;
      await this.ensureAuthenticated();
      res = await doFetch();
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`8x8 extension summary failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    console.log(`[8x8] Extension summary: ${Array.isArray(data) ? data.length : 0} extensions`);
    return data;
  }

  // Get today's stats for all extensions
  async getTodayStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return this.getExtensionSummary(startOfDay, now);
  }

  // Get stats for the current month
  async getMonthStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.getExtensionSummary(startOfMonth, now);
  }

  // Parse extension stats into a simpler format keyed by extension number
  parseExtensionStats(rawData) {
    if (!Array.isArray(rawData)) return {};

    const stats = {};
    for (const ext of rawData) {
      const extNum = String(ext.Extension);
      stats[extNum] = {
        extension: extNum,
        name: `${ext.FirstName || ''} ${ext.LastName || ''}`.trim(),
        email: ext.Email || '',
        // Calls
        callsMade: (ext.External_Outbound_Total || 0) + (ext.Internal_Outbound_Total || 0),
        callsReceived: (ext.External_Inbound_Total || 0) + (ext.Internal_Inbound_Total || 0),
        externalCallsMade: ext.External_Outbound_Total || 0,
        externalCallsReceived: ext.External_Inbound_Total || 0,
        totalCalls: (ext.Outbound_Total || 0) + (ext.Inbound_Total || 0),
        // Talk time (convert ms to minutes)
        totalTalkTimeMinutes: Math.round((ext.Total_Talk_Time || 0) / 60000),
        outboundTalkTimeMinutes: Math.round((ext.Outbound_Talk_Time || 0) / 60000),
        inboundTalkTimeMinutes: Math.round((ext.Inbound_Talk_Time || 0) / 60000),
        avgTalkTimeSeconds: Math.round((ext.Avg_Talk_Time || 0) / 1000),
        // Answered
        totalAnswered: ext.Total_Answered || 0,
        totalMissed: ext.Total_Missed || 0,
        totalAbandoned: ext.Total_Abandoned || 0,
      };
    }
    return stats;
  }
}

const eightByEightService = new EightByEightService();
export default eightByEightService;
