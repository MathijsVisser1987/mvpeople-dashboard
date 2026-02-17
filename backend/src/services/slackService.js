// Slack notification service
// Sends messages to a configured Slack webhook

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  isConfigured() {
    return !!this.webhookUrl;
  }

  async send(message) {
    if (!this.webhookUrl) return false;

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      return res.ok;
    } catch (err) {
      console.log('[Slack] Send error:', err.message);
      return false;
    }
  }

  async sendText(text) {
    return this.send({ text });
  }

  // Rich notification for new deals
  async notifyDeal(recruiterName, dealCount, color) {
    return this.send({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🎉 New Deal Closed!' },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${recruiterName}* just closed their *deal #${dealCount}* this month!`,
          },
        },
      ],
    });
  }

  // Weekly summary report
  async sendWeeklyReport(leaderboard, teamStats) {
    const top3 = (leaderboard || []).slice(0, 3);
    const ranking = top3.map((m, i) => {
      const medal = ['🥇', '🥈', '🥉'][i];
      return `${medal} *${m.name}* — ${m.points} pts (${m.deals} deals, ${m.calls} calls)`;
    }).join('\n');

    return this.send({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📊 Weekly Performance Report' },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Team Totals*\n• Deals: ${teamStats?.totalDeals || 0}\n• Calls: ${teamStats?.totalCalls || 0}\n• Talk Time: ${Math.round((teamStats?.totalTalkTime || 0) / 60)}h`,
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Performers*\n${ranking || 'No data yet'}`,
          },
        },
      ],
    });
  }
}

const slackService = new SlackService();
export default slackService;
