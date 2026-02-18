import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import leaderboardRoutes from './routes/leaderboard.js';
import authRoutes from './routes/auth.js';
import celebrationRoutes from './routes/celebrations.js';
import historyRoutes from './routes/history.js';
import leagueRoutes from './routes/leagues.js';
import missionRoutes from './routes/missions.js';
import vincereService from './services/vincere.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Vincere OAuth callback at exact registered redirect URI
app.get('/api/vincere/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }
  try {
    await vincereService.exchangeCodeForTokens(code);
    res.redirect('/?vincere=connected');
  } catch (err) {
    console.error('[Auth] Vincere callback error:', err.message);
    res.status(500).json({ error: 'Token exchange failed', message: err.message });
  }
});

// Routes
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/celebrations', celebrationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/missions', missionRoutes);

// Settings routes — inline to avoid import issues in serverless
app.get('/api/settings/targets', async (req, res) => {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return res.json({});
    }
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
    const data = await redis.get('kpi-target-overrides');
    if (!data) return res.json({});
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    res.json(parsed);
  } catch (err) {
    console.error('[Settings] Error loading targets:', err.message);
    res.status(500).json({ error: 'Failed to load target settings' });
  }
});

app.post('/api/settings/targets', async (req, res) => {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return res.status(503).json({ error: 'Redis not available' });
    }
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
    await redis.set('kpi-target-overrides', JSON.stringify(req.body));
    res.json({ success: true });
  } catch (err) {
    console.error('[Settings] Error saving targets:', err.message);
    res.status(500).json({ error: 'Failed to save target settings' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 2, timestamp: new Date().toISOString() });
});

// Cron: daily snapshot (triggered by Vercel cron)
app.get('/api/cron/snapshot', async (req, res) => {
  try {
    const { buildLeaderboard } = await import('./services/dataAggregator.js');
    const historyService = (await import('./services/historyService.js')).default;
    const ytdService = (await import('./services/ytdService.js')).default;
    const data = await buildLeaderboard();
    const snapshot = await historyService.takeSnapshot(data);
    await ytdService.updateCurrentMonth(data).catch(err => console.log('[Cron] YTD update error:', err.message));
    res.json({ success: !!snapshot, date: snapshot?.date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron: weekly Slack report (triggered by Vercel cron on Mondays)
app.get('/api/cron/weekly-report', async (req, res) => {
  try {
    const slackService = (await import('./services/slackService.js')).default;
    if (!slackService.isConfigured()) {
      return res.json({ skipped: true, reason: 'No SLACK_WEBHOOK_URL configured' });
    }
    const { buildLeaderboard } = await import('./services/dataAggregator.js');
    const data = await buildLeaderboard();
    await slackService.sendWeeklyReport(data.leaderboard, data.teamStats);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: show all fields for a Vincere user
app.get('/api/debug/user/:id', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });
    const user = await vincereService._apiGet(`/user/${req.params.id}`);
    res.json({ allKeys: Object.keys(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: check specific job placements
app.get('/api/debug/job/:id', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });
    const placements = await vincereService.getJobPlacements(req.params.id);
    res.json({ jobId: req.params.id, placements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: show placement fields from known jobs (lightweight, no full scan)
app.get('/api/debug/placements', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });

    const { teamMembers } = await import('./config/team.js');
    const emailToName = {};
    for (const m of teamMembers) {
      if (m.email) emailToName[m.email.toLowerCase()] = m.shortName;
    }

    // Check a small set of oldest jobs (most likely to have placements)
    const data = await vincereService._apiGet(
      '/job/search/fl=id;sort=created_date asc',
      { start: 0 }
    );
    const jobIds = (data?.result?.items || []).map(j => j.id);
    const placements = [];

    for (const jobId of jobIds) {
      try {
        const p = await vincereService.getJobPlacements(jobId);
        if (Array.isArray(p) && p.length > 0) {
          // Show ALL fields of each placement to discover renewal_number etc
          for (const pl of p) {
            placements.push({
              jobId,
              allFields: pl,
              allKeys: Object.keys(pl),
              matched: emailToName[(pl.placed_by || '').toLowerCase()] || 'UNMATCHED',
            });
          }
        }
      } catch {}
    }

    // Also show current scan state from KV
    let scanState = null;
    try {
      if (process.env.KV_REST_API_URL) {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
        const now2 = new Date();
        const monthKey = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
        const raw = await redis.get(`vincere-deals-scan-${monthKey}`);
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          scanState = {
            complete: parsed.complete,
            scannedJobs: parsed.scannedJobIds?.length,
            totalJobs: parsed.totalJobs,
            stats: parsed.stats,
            unmatchedEmails: parsed.unmatchedEmails,
            timestamp: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : null,
          };
        }
      }
    } catch {}

    res.json({ emailMapping: emailToName, placementSamples: placements, scanState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: test Vincere API endpoints
app.get('/api/debug/vincere', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });

    const results = {};

    // 1. Try Lucene queries with creator_id
    const queries = ['creator_id:28956', 'creator_id:28955', 'closed_job:true'];
    for (const q of queries) {
      try {
        const data = await vincereService._apiGet(
          '/job/search/fl=id,job_title,created_by;sort=created_date desc',
          { q, start: 0 }
        );
        results[`query_${q}`] = { total: data?.result?.total, first: data?.result?.items?.[0] };
      } catch (err) {
        results[`query_${q}`] = { error: err.message };
      }
    }

    // 2. Look for closed/placed jobs - check a range of older positions
    const closedJobs = [];
    try {
      // Get 50 older jobs and check their status
      const data = await vincereService._apiGet(
        '/job/search/fl=id,job_title,created_by;sort=created_date asc',
        { start: 0 }
      );
      const oldestJobs = data?.result?.items || [];
      // Check the first few old jobs for placements
      const checks = await Promise.allSettled(
        oldestJobs.slice(0, 10).map(async (j) => {
          const placements = await vincereService._apiGet(`/position/${j.id}/placements`);
          return { jobId: j.id, title: j.job_title, creator: j.created_by?.name, placementCount: Array.isArray(placements) ? placements.length : 0, placements };
        })
      );
      for (const c of checks) {
        if (c.status === 'fulfilled') closedJobs.push(c.value);
      }
    } catch (err) {
      results.oldJobCheck = { error: err.message };
    }
    results.oldestJobsPlacements = closedJobs;

    // 3. Check position details for a few jobs to see status_id and closed_job
    try {
      const pos = await vincereService._apiGet('/position/49837');
      results.posStatus = { id: pos.id, status_id: pos.status_id, closed_job: pos.closed_job, creator_id: pos.creator_id, deal_id: pos.deal_id };
    } catch (err) {
      results.posStatus = { error: err.message };
    }

    // 4. Also try /deal endpoint (positions have deal_id field)
    try {
      const data = await vincereService._apiGet('/deal/search/fl=id,title,status;sort=created_date desc', { start: 0 });
      results.dealSearch = { total: data?.result?.total, first2: data?.result?.items?.slice(0, 2) };
    } catch (err) {
      results.dealSearch = { error: err.message };
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: look up Vincere user emails to verify team config
app.get('/api/debug/users', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });

    const { teamMembers } = await import('./config/team.js');
    const results = [];

    for (const m of teamMembers) {
      try {
        const user = await vincereService._apiGet(`/user/${m.vincereId}`);
        results.push({
          name: m.name,
          vincereId: m.vincereId,
          configEmail: m.email,
          vincereEmail: user?.email || user?.primary_email || null,
          allEmailFields: {
            email: user?.email,
            primary_email: user?.primary_email,
            personal_email: user?.personal_email,
          },
          vincereName: user?.name || user?.first_name + ' ' + user?.last_name,
          match: (m.email || '').toLowerCase() === (user?.email || '').toLowerCase(),
        });
      } catch (err) {
        results.push({ name: m.name, vincereId: m.vincereId, error: err.message });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: discover Vincere activities API response format
app.get('/api/debug/activities/:userId', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });

    const userId = parseInt(req.params.userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Full ISO datetime format (the API rejected date-only strings)
    const startISO = startOfMonth.toISOString();
    const endISO = now.toISOString();

    const attempts = {};

    // Attempt 1: POST /activities with full ISO datetime
    try {
      const data = await vincereService._apiPost('/activities', {
        created_date_from: startISO,
        created_date_to: endISO,
      }, { index: 0 });
      const items = data?.result?.items || [];
      attempts.iso_datetime = {
        total: data?.result?.total ?? null,
        itemCount: items.length,
        topKeys: data ? Object.keys(data) : null,
        firstItemKeys: items[0] ? Object.keys(items[0]) : null,
        firstItem: items[0] ?? null,
        secondItem: items[1] ?? null,
      };
    } catch (err) {
      attempts.iso_datetime = { error: err.message };
    }

    // Attempt 2: POST /activities with epoch milliseconds
    try {
      const data = await vincereService._apiPost('/activities', {
        created_date_from: startOfMonth.getTime(),
        created_date_to: now.getTime(),
      }, { index: 0 });
      const items = data?.result?.items || [];
      attempts.epoch_ms = {
        total: data?.result?.total ?? null,
        itemCount: items.length,
        firstItemKeys: items[0] ? Object.keys(items[0]) : null,
        firstItem: items[0] ?? null,
      };
    } catch (err) {
      attempts.epoch_ms = { error: err.message };
    }

    // Attempt 3: POST /activities with "YYYY-MM-DDT00:00:00.000Z" format
    try {
      const startFmt = startOfMonth.toISOString().replace(/\.\d{3}Z$/, '.000Z');
      const endFmt = now.toISOString().replace(/\.\d{3}Z$/, '.000Z');
      const data = await vincereService._apiPost('/activities', {
        created_date_from: startFmt,
        created_date_to: endFmt,
      }, { index: 0 });
      const items = data?.result?.items || [];
      attempts.iso_explicit = {
        total: data?.result?.total ?? null,
        itemCount: items.length,
        firstItemKeys: items[0] ? Object.keys(items[0]) : null,
        firstItem: items[0] ?? null,
      };
    } catch (err) {
      attempts.iso_explicit = { error: err.message };
    }

    // Attempt 4: Try a broader date range (last 6 months) to find actual data
    try {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const data = await vincereService._apiPost('/activities', {
        created_date_from: sixMonthsAgo.toISOString(),
        created_date_to: now.toISOString(),
      }, { index: 0 });
      const items = data?.content || data?.result?.items || [];
      attempts.broader_range = {
        dateRange: `${sixMonthsAgo.toISOString()} to ${now.toISOString()}`,
        responseKeys: data ? Object.keys(data) : null,
        contentLength: items.length,
        sliceIndex: data?.slice_index,
        numElements: data?.num_of_elements,
        isLast: data?.last,
        firstItemKeys: items[0] ? Object.keys(items[0]) : null,
        firstItem: items[0] ?? null,
        secondItem: items[1] ?? null,
        thirdItem: items[2] ?? null,
      };
    } catch (err) {
      attempts.broader_range = { error: err.message };
    }

    // Attempt 5: Try ALL time (no date filter or very old start)
    try {
      const veryOld = new Date('2020-01-01T00:00:00.000Z');
      const data = await vincereService._apiPost('/activities', {
        created_date_from: veryOld.toISOString(),
        created_date_to: now.toISOString(),
      }, { index: 0 });
      const items = data?.content || [];
      attempts.all_time = {
        contentLength: items.length,
        numElements: data?.num_of_elements,
        isLast: data?.last,
        firstItemKeys: items[0] ? Object.keys(items[0]) : null,
        firstItem: items[0] ?? null,
      };
    } catch (err) {
      attempts.all_time = { error: err.message };
    }

    res.json({ userId, startISO, endISO, attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: test 8x8 auth and data fetch
app.get('/api/debug/8x8', async (req, res) => {
  const eightByEightService = (await import('./services/eightByEight.js')).default;
  const results = { env: {}, auth: {}, data: {} };

  const username = process.env.EIGHT_BY_EIGHT_USERNAME;
  const password = process.env.EIGHT_BY_EIGHT_PASSWORD;

  results.env = {
    hasApiKey: !!process.env.EIGHT_BY_EIGHT_API_KEY,
    apiKeyPrefix: process.env.EIGHT_BY_EIGHT_API_KEY?.substring(0, 6) + '...',
    hasSecret: !!process.env.EIGHT_BY_EIGHT_SECRET,
    hasPbxId: !!process.env.EIGHT_BY_EIGHT_PBX_ID,
    hasUsername: !!username,
    usernameValue: username ? username.substring(0, 3) + '***' : null,
    hasPassword: !!password,
    passwordLength: password?.length || 0,
    baseUrl: eightByEightService.baseUrl,
    isAuthenticated: eightByEightService.isAuthenticated(),
  };

  // Try authentication via the service
  if (!eightByEightService.isAuthenticated() && username && password) {
    try {
      await eightByEightService.authenticate(username, password);
      results.auth = { success: true, tokenExpiry: eightByEightService.tokenExpiry?.toISOString() };
    } catch (err) {
      results.auth = { success: false, error: err.message };
    }
  }

  // Try fetching data if authenticated
  if (eightByEightService.isAuthenticated()) {
    try {
      const data = await eightByEightService.getMonthStats();
      const parsed = eightByEightService.parseExtensionStats(data);
      results.data = { extensions: Object.keys(parsed).length, sample: Object.values(parsed)[0] || null };
    } catch (err) {
      results.data = { error: err.message };
    }
  }

  res.json(results);
});

// Debug: scan all Vincere activities and collect unique type combos
// ?pages=5 to control how many pages to scan (default 10, max 30)
app.get('/api/debug/activity-raw', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });

    const maxPages = Math.min(parseInt(req.query.pages) || 10, 30);
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const typeCombos = {};    // "category:entity_type" → count
    const nameCombos = {};    // activity_name → count
    const samples = {};       // "category:entity_type" → sample activity
    const uniqueCategories = new Set();
    const uniqueEntityTypes = new Set();
    const uniqueStatuses = new Set();
    let totalFetched = 0;
    let lastPage = -1;

    const startTime = Date.now();
    for (let page = 0; page < maxPages; page++) {
      if (Date.now() - startTime > 40000) break; // 40s safety
      try {
        const data = await vincereService._apiPost('/activities', {
          created_date_from: sixMonthsAgo.toISOString(),
          created_date_to: now.toISOString(),
        }, { index: page });

        const items = data?.content || [];
        if (items.length === 0) break;
        totalFetched += items.length;
        lastPage = page;

        for (const item of items) {
          const cat = item.category || 'NULL';
          const et = item.entity_type || 'NULL';
          const key = `${cat}:${et}`;

          typeCombos[key] = (typeCombos[key] || 0) + 1;
          if (item.activity_name) {
            nameCombos[item.activity_name] = (nameCombos[item.activity_name] || 0) + 1;
          }
          uniqueCategories.add(cat);
          uniqueEntityTypes.add(et);
          if (item.status) uniqueStatuses.add(item.status);

          if (!samples[key]) {
            samples[key] = {
              category: item.category,
              entity_type: item.entity_type,
              activity_name: item.activity_name,
              status: item.status,
              created_by_id: item.created_by_id,
              created_by_name: item.created_by_name,
              subject: item.subject?.substring(0, 80),
              summary: item.summary?.substring(0, 120),
            };
          }
        }

        if (data.last) break;
      } catch (err) {
        break;
      }
    }

    const sorted = Object.entries(typeCombos)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, count, sample: samples[key] }));

    const namesSorted = Object.entries(nameCombos)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    res.json({
      totalFetched,
      pagesScanned: lastPage + 1,
      uniqueCategories: [...uniqueCategories],
      uniqueEntityTypes: [...uniqueEntityTypes],
      uniqueStatuses: [...uniqueStatuses],
      typeCombinations: sorted,
      activityNames: namesSorted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: discover Vincere activity structure (lightweight — 3 calls max)
app.get('/api/debug/activity-types', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated' });

    const results = {};

    // 1. GET-based activity search (Solr index)
    try {
      const data = await vincereService._apiGet(
        '/activity/search/fl=id,category,entity_type,content,insert_timestamp;sort=insert_timestamp desc',
        { start: 0 }
      );
      const items = data?.result?.items || [];
      results.activity_search = {
        total: data?.result?.total,
        itemCount: items.length,
        responseKeys: data ? Object.keys(data) : null,
        firstItemKeys: items[0] ? Object.keys(items[0]) : null,
        items: items.slice(0, 10),
      };
    } catch (err) {
      results.activity_search = { error: err.message };
    }

    // 2. GET candidate activity comments
    try {
      const candidates = await vincereService._apiGet(
        '/candidate/search/fl=id;sort=created_date desc', { start: 0 }
      );
      const candId = candidates?.result?.items?.[0]?.id;
      if (candId) {
        const comments = await vincereService._apiGet(`/candidate/${candId}/activitycomments`);
        results.candidate_comments = {
          candidateId: candId,
          count: Array.isArray(comments) ? comments.length : 'not array',
          firstItemKeys: Array.isArray(comments) && comments[0] ? Object.keys(comments[0]) : null,
          items: Array.isArray(comments) ? comments.slice(0, 5) : comments,
        };
      }
    } catch (err) {
      results.candidate_comments = { error: err.message };
    }

    // 3. POST /activities — 1 page only, current month
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const data = await vincereService._apiPost('/activities', {
        created_date_from: start.toISOString(),
        created_date_to: now.toISOString(),
      }, { index: 0 });
      const items = data?.content || [];
      results.post_activities = {
        numElements: data?.num_of_elements,
        isLast: data?.last,
        sliceIndex: data?.slice_index,
        responseKeys: data ? Object.keys(data) : null,
        contentLength: items.length,
        firstItemKeys: items[0] ? Object.keys(items[0]) : null,
        items: items.slice(0, 5).map(item => {
          // Show ALL fields of each activity
          const cleaned = {};
          for (const [k, v] of Object.entries(item)) {
            if (typeof v === 'string' && v.length > 200) {
              cleaned[k] = v.substring(0, 200) + '...';
            } else {
              cleaned[k] = v;
            }
          }
          return cleaned;
        }),
      };
    } catch (err) {
      results.post_activities = { error: err.message };
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: comprehensive mapping verification — compare Vincere data vs dashboard mappings
app.get('/api/debug/verify-mappings', async (req, res) => {
  try {
    const isAuth = await vincereService.isAuthenticated();
    if (!isAuth) return res.json({ error: 'Not authenticated with Vincere' });

    const { teamMembers } = await import('./config/team.js');
    const activityService = (await import('./services/activityService.js')).default;
    const { KPI_DEFINITIONS } = await import('./config/kpiTargets.js');

    const results = {
      timestamp: new Date().toISOString(),
      teamMembers: teamMembers.map(m => ({
        name: m.shortName, vincereId: m.vincereId, email: m.email, targetProfile: m.targetProfile,
      })),
      activityNameCountsPerUser: {},
      dealComparison: {},
      kpiMappingVerification: {},
      dealSearchResults: null,
    };

    // 1. Fetch activities and show per-user activity_name distribution
    try {
      const actData = await activityService.getAllTeamActivities();
      for (const m of teamMembers) {
        const userAct = actData[m.vincereId];
        if (userAct) {
          results.activityNameCountsPerUser[m.shortName] = {
            totalActivities: userAct.totalActivities,
            activityPoints: userAct.activityPoints,
            byActivityName: userAct.byActivityName || {},
            byType: userAct.byType || {},
          };
        }
      }
    } catch (err) {
      results.activityError = err.message;
    }

    // 2. Deal comparison: placement scan vs activity count vs deal search
    try {
      const scanResult = await vincereService.getAllTeamDeals(teamMembers);
      const dealSearchResult = await vincereService.getDealStats(teamMembers);

      for (const m of teamMembers) {
        const scanStats = scanResult.stats?.[m.vincereId] || { deals: 0 };
        const dealSearch = dealSearchResult[m.vincereId] || { dealCount: 0, pipelineValue: 0 };
        const actNames = results.activityNameCountsPerUser[m.shortName]?.byActivityName || {};
        const activityDeals = (actNames.PLACEMENT_PERMANENT || 0) + (actNames.PLACEMENT_CONTRACT || 0);

        results.dealComparison[m.shortName] = {
          placementScan: scanStats.deals || 0,
          activityBased: activityDeals,
          dealSearch: dealSearch.dealCount,
          pipelineFromScan: scanStats.pipelineValue || 0,
          pipelineFromDealSearch: dealSearch.pipelineValue,
          dashboardWouldShow: Math.max(scanStats.deals || 0, activityDeals),
        };
      }
      results.scanComplete = scanResult.scanComplete;
    } catch (err) {
      results.dealError = err.message;
    }

    // 3. KPI mapping verification — show what each KPI tracks and current counts
    for (const [kpiKey, kpiDef] of Object.entries(KPI_DEFINITIONS)) {
      const perUser = {};
      for (const m of teamMembers) {
        const actNames = results.activityNameCountsPerUser[m.shortName]?.byActivityName || {};
        if (kpiDef.source === 'deals') {
          perUser[m.shortName] = results.dealComparison[m.shortName]?.dashboardWouldShow || 0;
        } else {
          let count = 0;
          for (const name of kpiDef.activityNames) {
            count += actNames[name] || 0;
          }
          perUser[m.shortName] = count;
        }
      }
      results.kpiMappingVerification[kpiKey] = {
        label: kpiDef.label,
        emoji: kpiDef.emoji,
        activityNames: kpiDef.activityNames,
        source: kpiDef.source || 'activity_name',
        countsPerUser: perUser,
      };
    }

    // 4. Try to fetch raw deal objects to show their fields
    try {
      const dealData = await vincereService._apiGet(
        '/deal/search/fl=id,title,status,created_by,owner,value,nfi,margin,fee,created_date,closed_date;sort=created_date desc',
        { start: 0 }
      );
      const items = dealData?.result?.items || [];
      results.dealSearchResults = {
        total: dealData?.result?.total || 0,
        sampleDeals: items.slice(0, 5).map(d => ({
          ...d,
          allKeys: Object.keys(d),
        })),
      };
    } catch (err) {
      results.dealSearchResults = { error: err.message };
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
