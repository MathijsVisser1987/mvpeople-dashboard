// 8x8 Work Analytics API Service
// Docs: https://developer.8x8.com/analytics/docs/work-analytics-extension-summary
// Auth: POST /analytics/work/v1/oauth/token
// Data: GET  /analytics/work/v2/extsum

class EightByEightService {
  constructor() {
    const region = process.env.EIGHT_BY_EIGHT_REGION || 'eu';
    const baseUrl = process.env.EIGHT_BY_EIGHT_BASE_URL || `https://api.8x8.com/${region}`;
    this.baseUrl = baseUrl;
    this.apiKey = process.env.EIGHT_BY_EIGHT_API_KEY;
    this.secret = process.env.EIGHT_BY_EIGHT_SECRET;
    this.pbxId = process.env.EIGHT_BY_EIGHT_PBX_ID || 'mvpeople';

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate(username, password) {
    // Try EU-prefixed URL first, then fall back to global
    const urls = [
      `${this.baseUrl}/analytics/work/v1/oauth/token`,
      `https://api.8x8.com/analytics/work/v1/oauth/token`,
    ];

    let lastError;
    for (const url of urls) {
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
          lastError = `${res.status}: ${err}`;
          continue;
        }

        const data = await res.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + (data.expires_in || 1800) * 1000);
        console.log(`[8x8] Authenticated via ${url}`);
        return data;
      } catch (err) {
        lastError = err.message;
      }
    }
    throw new Error(`8x8 authentication failed: ${lastError}`);
  }

  async authenticateWithApiKey() {
    // Some 8x8 setups allow API key + secret auth without username/password
    const urls = [
      `${this.baseUrl}/analytics/work/v1/oauth/token`,
      `https://api.8x8.com/analytics/work/v1/oauth/token`,
    ];

    let lastError;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            '8x8-apikey': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.apiKey,
            client_secret: this.secret,
          }),
        });

        if (!res.ok) {
          lastError = `${res.status}: ${await res.text()}`;
          continue;
        }

        const data = await res.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + (data.expires_in || 1800) * 1000);
        console.log(`[8x8] Authenticated via API key at ${url}`);
        return data;
      } catch (err) {
        lastError = err.message;
      }
    }
    throw new Error(`8x8 API key auth failed: ${lastError}`);
  }

  isAuthenticated() {
    return !!(this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry.getTime());
  }

  async ensureAuthenticated() {
    if (!this.isAuthenticated()) {
      // Try auto-auth from env vars (useful for serverless cold starts)
      const username = process.env.EIGHT_BY_EIGHT_USERNAME;
      const password = process.env.EIGHT_BY_EIGHT_PASSWORD;
      if (username && password) {
        await this.authenticate(username, password);
      } else {
        throw new Error('EIGHT_BY_EIGHT_NOT_AUTHENTICATED');
      }
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

    // Try EU-prefixed URL, then global
    const urls = [
      `${this.baseUrl}/analytics/work/v2/extsum?${params}`,
      `https://api.8x8.com/analytics/work/v2/extsum?${params}`,
    ];

    let lastError;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            '8x8-apikey': this.apiKey,
          },
        });

        if (!res.ok) {
          lastError = `${res.status}: ${await res.text()}`;
          continue;
        }

        const data = await res.json();
        console.log(`[8x8] Extension summary fetched from ${url} - ${Array.isArray(data) ? data.length : 0} extensions`);
        return data;
      } catch (err) {
        lastError = err.message;
      }
    }
    throw new Error(`8x8 extension summary failed: ${lastError}`);
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
