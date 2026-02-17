// League system: weekly and monthly competitions
// Leagues are computed from current leaderboard data + historical snapshots

const LEAGUE_DEFINITIONS = [
  {
    id: 'weekly-calls',
    name: 'Call Champion',
    description: 'Most outbound calls this week',
    icon: '📞',
    metric: 'calls',
    period: 'week',
    prize: 'Friday drinks on the house',
  },
  {
    id: 'weekly-deals',
    name: 'Deal Hunter',
    description: 'Most deals closed this week',
    icon: '🎯',
    metric: 'deals',
    period: 'week',
    prize: 'Lunch on the company',
  },
  {
    id: 'monthly-points',
    name: 'MVP of the Month',
    description: 'Highest total points this month',
    icon: '🏆',
    metric: 'points',
    period: 'month',
    prize: 'MVPeople Champion trophy',
  },
  {
    id: 'monthly-talktime',
    name: 'Talk Time Titan',
    description: 'Most minutes on the phone this month',
    icon: '🎙️',
    metric: 'talkTimeMinutes',
    period: 'month',
    prize: 'Premium headset upgrade',
  },
];

class LeagueService {
  getLeagues(leaderboard) {
    if (!leaderboard || leaderboard.length === 0) return [];

    return LEAGUE_DEFINITIONS.map(league => {
      const standings = [...leaderboard]
        .sort((a, b) => (b[league.metric] || 0) - (a[league.metric] || 0))
        .map((m, idx) => ({
          rank: idx + 1,
          name: m.name,
          fullName: m.fullName,
          color: m.color,
          photo: m.photo,
          avatar: m.avatar,
          value: m[league.metric] || 0,
        }));

      // Time remaining in period
      const now = new Date();
      let endDate;
      if (league.period === 'week') {
        // End of current week (Sunday 23:59:59)
        const dayOfWeek = now.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);
      } else {
        // End of current month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }

      return {
        ...league,
        standings,
        leader: standings[0] || null,
        endDate: endDate.toISOString(),
        timeRemainingMs: Math.max(0, endDate.getTime() - now.getTime()),
      };
    });
  }

  getDefinitions() {
    return LEAGUE_DEFINITIONS;
  }
}

const leagueService = new LeagueService();
export default leagueService;
