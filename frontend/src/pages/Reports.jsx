import { useState } from 'react';
import { BarChart3, TrendingUp, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useHistory } from '../hooks/useHistory';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { formatNumber, formatTalkTime } from '../utils/formatters';
import Avatar from '../components/Avatar';

const COLORS = ['#59D6D6', '#00e676', '#ff6b35', '#6c5ce7', '#ff4444', '#ffab00', '#ff5ecc'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-mvp-card border border-mvp-border rounded-lg p-3 shadow-lg">
      <p className="text-sm text-white/60 font-display mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-display" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function TrendChart({ history, metric, title, color }) {
  const data = [...history].reverse().map(h => ({
    date: h.date?.substring(5), // MM-DD
    value: h.teamStats?.[metric] || 0,
  }));

  if (data.length === 0) return null;

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <h3 className="text-lg font-bold font-display mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#163478" />
          <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 12 }} />
          <YAxis tick={{ fill: '#ffffff50', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} name={title} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MemberComparisonChart({ history, metric, title, members }) {
  const data = [...history].reverse().map(h => {
    const entry = { date: h.date?.substring(5) };
    for (const m of (h.members || [])) {
      entry[m.name] = m[metric] || 0;
    }
    return entry;
  });

  if (data.length === 0) return null;

  const memberNames = members?.map(m => m.name) || [];

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <h3 className="text-lg font-bold font-display mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#163478" />
          <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 12 }} />
          <YAxis tick={{ fill: '#ffffff50', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {memberNames.map((name, i) => (
            <Bar key={name} dataKey={name} fill={COLORS[i % COLORS.length]} stackId="a" />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IndividualStats({ members }) {
  if (!members || members.length === 0) return null;

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <h3 className="text-lg font-bold font-display mb-4">Individual Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mvp-border">
              <th className="text-left py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Name</th>
              <th className="text-right py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Deals</th>
              <th className="text-right py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Calls</th>
              <th className="text-right py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Talk Time</th>
              <th className="text-right py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Points</th>
              <th className="text-right py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Streak</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.name} className="border-b border-mvp-border/50 hover:bg-mvp-dark/50">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <Avatar member={m} size="w-8 h-8" textSize="text-xs" />
                    <span className="font-display font-semibold">{m.name}</span>
                  </div>
                </td>
                <td className="text-right py-3 px-2 font-display font-bold text-mvp-success">{m.deals}</td>
                <td className="text-right py-3 px-2 font-display font-bold text-mvp-accent">{formatNumber(m.calls)}</td>
                <td className="text-right py-3 px-2 font-display font-bold text-mvp-fire">{formatTalkTime(m.talkTimeMinutes)}</td>
                <td className="text-right py-3 px-2 font-display font-bold gradient-gold">{formatNumber(m.points)}</td>
                <td className="text-right py-3 px-2 font-display font-bold text-white/60">{m.streak}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  const { history, loading: historyLoading } = useHistory(30);
  const { data, loading: dataLoading } = useLeaderboard();
  const [tab, setTab] = useState('overview');

  const members = data?.leaderboard || [];
  const loading = historyLoading || dataLoading;

  return (
    <div className="min-h-screen bg-mvp-dark">
      {/* Header */}
      <header className="border-b border-mvp-border bg-mvp-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <img src="/mvpeople-logo.png" alt="MVPeople" className="h-8" />
          <h1 className="text-xl font-bold font-display">Performance Reports</h1>

          {/* Tabs */}
          <div className="flex gap-1 ml-auto bg-mvp-dark rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'individual', label: 'Individual', icon: Users },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-display transition-colors ${
                  tab === t.id
                    ? 'bg-mvp-accent/20 text-mvp-accent'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-mvp-accent" />
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Deals', value: data?.teamStats?.totalDeals || 0, color: 'text-mvp-success' },
                    { label: 'Total Calls', value: formatNumber(data?.teamStats?.totalCalls || 0), color: 'text-mvp-accent' },
                    { label: 'Talk Time', value: formatTalkTime(data?.teamStats?.totalTalkTime || 0), color: 'text-mvp-fire' },
                    { label: 'History Days', value: history.length, color: 'text-mvp-gold' },
                  ].map(s => (
                    <div key={s.label} className="bg-mvp-card rounded-xl border border-mvp-border p-5 text-center">
                      <div className={`text-3xl font-bold font-display ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-white/40 uppercase tracking-wider font-display mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrendChart history={history} metric="totalDeals" title="Deals Over Time" color="#00e676" />
                  <TrendChart history={history} metric="totalCalls" title="Calls Over Time" color="#59D6D6" />
                </div>

                <IndividualStats members={members} />
              </div>
            )}

            {tab === 'trends' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrendChart history={history} metric="totalDeals" title="Team Deals Trend" color="#00e676" />
                  <TrendChart history={history} metric="totalCalls" title="Team Calls Trend" color="#59D6D6" />
                  <TrendChart history={history} metric="totalTalkTime" title="Team Talk Time Trend" color="#ff6b35" />
                  <TrendChart history={history} metric="totalPipeline" title="Pipeline Value Trend" color="#ffd700" />
                </div>

                <MemberComparisonChart
                  history={history}
                  metric="deals"
                  title="Deals by Team Member"
                  members={members}
                />
                <MemberComparisonChart
                  history={history}
                  metric="calls"
                  title="Calls by Team Member"
                  members={members}
                />
              </div>
            )}

            {tab === 'individual' && (
              <div className="space-y-6">
                <IndividualStats members={members} />

                {history.length === 0 && (
                  <div className="bg-mvp-card rounded-xl border border-mvp-border p-8 text-center">
                    <p className="text-white/40 font-body">No historical data yet. Snapshots are taken daily at 22:00 UTC.</p>
                    <p className="text-white/20 font-body text-sm mt-2">Check back tomorrow for trend data.</p>
                  </div>
                )}

                {/* Per-member trend cards */}
                {members.map((member, idx) => {
                  const memberHistory = [...history].reverse().map(h => {
                    const hm = (h.members || []).find(m => m.name === member.name);
                    return {
                      date: h.date?.substring(5),
                      points: hm?.points || 0,
                      calls: hm?.calls || 0,
                      deals: hm?.deals || 0,
                    };
                  });

                  if (memberHistory.length === 0) return null;

                  return (
                    <div key={member.name} className="bg-mvp-card rounded-xl border border-mvp-border p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar member={member} size="w-10 h-10" textSize="text-sm" />
                        <h3 className="text-lg font-bold font-display">{member.name}</h3>
                        <span className="text-sm text-white/30 font-body">{member.role}</span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={memberHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#163478" />
                          <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#ffffff50', fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="points" stroke="#ffd700" strokeWidth={2} name="Points" dot={false} />
                          <Line type="monotone" dataKey="calls" stroke="#59D6D6" strokeWidth={2} name="Calls" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
