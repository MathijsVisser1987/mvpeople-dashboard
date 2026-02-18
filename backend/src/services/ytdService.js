// YTD (Year-To-Date) MVP tracking service
// Stores monthly point snapshots in Redis to track cumulative performance across the year

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
  } catch {}
  return null;
}

function getKey(year) {
  return `ytd:${year}`;
}

// Update the current month's points from live leaderboard data
async function updateCurrentMonth(leaderboardData) {
  const store = await getRedis();
  if (!store || !leaderboardData?.leaderboard) return;

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const key = getKey(year);

  try {
    // Load existing YTD data
    const raw = await store.get(key);
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};

    // Update each member's current month
    for (const member of leaderboardData.leaderboard) {
      const id = String(member.vincereId);
      if (!data[id]) {
        data[id] = {
          name: member.name,
          color: member.color,
          photo: member.photo || null,
          months: {},
          totalPoints: 0,
        };
      }

      // Update metadata in case it changed
      data[id].name = member.name;
      data[id].color = member.color;
      data[id].photo = member.photo || null;

      // Set current month's points
      data[id].months[month] = member.points || 0;

      // Recalculate total
      data[id].totalPoints = Object.values(data[id].months).reduce((sum, pts) => sum + pts, 0);
    }

    await store.set(key, JSON.stringify(data));
    console.log(`[YTD] Updated month ${month} for ${leaderboardData.leaderboard.length} members`);
  } catch (err) {
    console.error('[YTD] Update error:', err.message);
  }
}

// Get YTD standings sorted by total points
async function getStandings(year) {
  const store = await getRedis();
  if (!store) return [];

  const resolvedYear = year || new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })).getFullYear();
  const key = getKey(resolvedYear);

  try {
    const raw = await store.get(key);
    if (!raw) return [];

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // Current month key
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    // Convert to sorted array
    const standings = Object.entries(data)
      .map(([vincereId, entry]) => ({
        vincereId: parseInt(vincereId),
        name: entry.name,
        color: entry.color,
        photo: entry.photo,
        months: entry.months,
        totalPoints: entry.totalPoints || 0,
        currentMonthPoints: entry.months[currentMonth] || 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Add rank and points gap
    return standings.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      pointsGap: index === 0 ? 0 : standings[index - 1].totalPoints - entry.totalPoints,
    }));
  } catch (err) {
    console.error('[YTD] Standings error:', err.message);
    return [];
  }
}

export default { updateCurrentMonth, getStandings };
