import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Activity, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useHistory } from '../hooks/useHistory';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useActivities } from '../hooks/useActivities';
import { formatNumber, formatTalkTime } from '../utils/formatters';
import Avatar from '../components/Avatar';

const COLORS = ['#59D6D6', '#00e676', '#ff6b35', '#6c5ce7', '#ff4444', '#ffab00', '#ff5ecc'];

const CATEGORY_META = {
  SALES_CONTACT: { emoji: '\uD83D\uDE80', label: 'Sales / Contact', color: '#00e676' },
  RECRUITMENT_CANDIDATE: { emoji: '\uD83D\uDC8E', label: 'Recruitment / Candidate', color: '#59D6D6' },
  PIPELINE_JOBS: { emoji: '\uD83D\uDCBC', label: 'Pipeline / Jobs', color: '#ffd700' },
  DEALS_REVENUE: { emoji: '\uD83D\uDCB6', label: 'Deals & Revenue', color: '#ff6b35' },
};

const ACTIVITY_TYPE_NAMES = {
  'COMMENT:CANDIDATE': 'Candidate Note',
  'COMMENT:CONTACT': 'Contact Note',
  'COMMENT:COMPANY': 'Company Note',
  'COMMENT:POSITION': 'Job Note',
  'COMMENT:APPLICATION': 'Application Note',
  'COMMENT:PLACEMENT': 'Placement Note',
  'EMAIL_SENT:CANDIDATE': 'Email to Candidate',
  'EMAIL_SENT:CONTACT': 'Email to Contact',
  'EMAIL_SENT:APPLICATION': 'Email (Application)',
  'EMAIL_RECEIVED:CANDIDATE': 'Email from Candidate',
  'EMAIL_RECEIVED:CONTACT': 'Email from Contact',
  'EMAIL_RECEIVED:APPLICATION': 'Email (Application)',
  'MEETING:CANDIDATE': 'Candidate Meeting',
  'MEETING:CONTACT': 'Client Meeting',
  'MEETING:COMPANY': 'Company Meeting',
  'MEETING:APPLICATION': 'Interview',
  'MEETING:PLACEMENT': 'Placement Meeting',
  'TASK:CANDIDATE': 'Candidate Task',
  'TASK:CONTACT': 'Contact Task',
  'TASK:COMPANY': 'Company Task',
  'TASK:POSITION': 'Job Task',
  'TASK:APPLICATION': 'Application Task',
  'TASK:PLACEMENT': 'Placement Task',
  'PHONE_CALL:CANDIDATE': 'Candidate Call',
  'PHONE_CALL:CONTACT': 'Client Call',
  'PHONE_CALL:COMPANY': 'Company Call',
};

// Map activity type keys to their category
const TYPE_TO_CATEGORY = {
  'COMMENT:CONTACT': 'SALES_CONTACT', 'COMMENT:COMPANY': 'SALES_CONTACT',
  'MEETING:CONTACT': 'SALES_CONTACT', 'MEETING:COMPANY': 'SALES_CONTACT',
  'TASK:CONTACT': 'SALES_CONTACT', 'TASK:COMPANY': 'SALES_CONTACT',
  'EMAIL_SENT:CONTACT': 'SALES_CONTACT', 'EMAIL_RECEIVED:CONTACT': 'SALES_CONTACT',
  'PHONE_CALL:CONTACT': 'SALES_CONTACT', 'PHONE_CALL:COMPANY': 'SALES_CONTACT',
  'COMMENT:CANDIDATE': 'RECRUITMENT_CANDIDATE', 'MEETING:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'TASK:CANDIDATE': 'RECRUITMENT_CANDIDATE', 'EMAIL_SENT:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_RECEIVED:CANDIDATE': 'RECRUITMENT_CANDIDATE', 'PHONE_CALL:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'COMMENT:POSITION': 'PIPELINE_JOBS', 'COMMENT:APPLICATION': 'PIPELINE_JOBS',
  'MEETING:APPLICATION': 'PIPELINE_JOBS', 'TASK:POSITION': 'PIPELINE_JOBS',
  'TASK:APPLICATION': 'PIPELINE_JOBS', 'EMAIL_SENT:APPLICATION': 'PIPELINE_JOBS',
  'EMAIL_RECEIVED:APPLICATION': 'PIPELINE_JOBS',
  'COMMENT:PLACEMENT': 'DEALS_REVENUE', 'TASK:PLACEMENT': 'DEALS_REVENUE',
  'MEETING:PLACEMENT': 'DEALS_REVENUE',
};

function getDatePresets() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { label: 'This Month', start: new Date(y, m, 1), end: now },
    { label: 'Last Month', start: new Date(y, m - 1, 1), end: new Date(y, m, 0) },
    { label: 'This Quarter', start: new Date(y, Math.floor(m / 3) * 3, 1), end: now },
    { label: 'Last 30 Days', start: new Date(now.getTime() - 30 * 86400000), end: now },
  ];
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

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
    date: h.date?.substring(5),
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
              <th className="text-right py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Activities</th>
              <th className="text-right py-3 px-2 font-display text-white/40 uppercase text-xs tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
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
                <td className="text-right py-3 px-2 font-display font-bold text-purple-400">{m.totalActivities || 0}</td>
                <td className="text-right py-3 px-2 font-display font-bold gradient-gold">{formatNumber(m.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityCategorySummary({ activityData, members }) {
  if (!activityData?.data) return null;

  // Aggregate across all team members
  const categoryTotals = {};
  const typeTotals = {};

  for (const [vincereId, memberData] of Object.entries(activityData.data)) {
    for (const [catKey, cat] of Object.entries(memberData.byCategory || {})) {
      if (!categoryTotals[catKey]) {
        categoryTotals[catKey] = { count: 0, points: 0 };
      }
      categoryTotals[catKey].count += cat.count;
      categoryTotals[catKey].points += cat.points;

      for (const [typeKey, count] of Object.entries(cat.types || {})) {
        typeTotals[typeKey] = (typeTotals[typeKey] || 0) + count;
      }
    }
  }

  // Build per-member bar chart data
  const chartData = (members || []).map(m => {
    const mData = activityData.data[m.vincereId] || {};
    const entry = { name: m.name };
    for (const catKey of Object.keys(CATEGORY_META)) {
      entry[CATEGORY_META[catKey].label] = mData.byCategory?.[catKey]?.count || 0;
    }
    return entry;
  });

  return (
    <div className="space-y-6">
      {/* Category summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
          const totals = categoryTotals[catKey] || { count: 0, points: 0 };
          return (
            <div key={catKey} className="bg-mvp-card rounded-xl border border-mvp-border p-5 text-center">
              <div className="text-2xl mb-1">{meta.emoji}</div>
              <div className="text-3xl font-bold font-display" style={{ color: meta.color }}>
                {totals.count}
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider font-display mt-1">{meta.label}</div>
              <div className="text-xs text-mvp-gold font-display mt-0.5">{formatNumber(totals.points)} pts</div>
            </div>
          );
        })}
      </div>

      {/* Activities by category per member */}
      <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
        <h3 className="text-lg font-bold font-display mb-4">Activities by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#163478" />
            <XAxis dataKey="name" tick={{ fill: '#ffffff50', fontSize: 12 }} />
            <YAxis tick={{ fill: '#ffffff50', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {Object.entries(CATEGORY_META).map(([, meta]) => (
              <Bar key={meta.label} dataKey={meta.label} fill={meta.color} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Goal breakdown table */}
      <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
        <h3 className="text-lg font-bold font-display mb-4">Activity Types</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mvp-border">
                <th className="text-left py-2 px-2 font-display text-white/40 uppercase text-xs">Category</th>
                <th className="text-left py-2 px-2 font-display text-white/40 uppercase text-xs">Activity</th>
                <th className="text-right py-2 px-2 font-display text-white/40 uppercase text-xs">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(typeTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([typeKey, count]) => {
                  const catKey = TYPE_TO_CATEGORY[typeKey];
                  const catEmoji = catKey ? CATEGORY_META[catKey]?.emoji || '' : '';
                  return (
                    <tr key={typeKey} className="border-b border-mvp-border/30 hover:bg-mvp-dark/50">
                      <td className="py-2 px-2 text-lg">{catEmoji}</td>
                      <td className="py-2 px-2 font-body text-white/70">{ACTIVITY_TYPE_NAMES[typeKey] || typeKey}</td>
                      <td className="text-right py-2 px-2 font-display font-bold">{count}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-member activity breakdown */}
      <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
        <h3 className="text-lg font-bold font-display mb-4">Per Member Breakdown</h3>
        <div className="space-y-3">
          {(members || []).map(m => {
            const mData = activityData.data[m.vincereId] || {};
            const total = mData.totalActivities || 0;
            if (total === 0) return null;
            return (
              <div key={m.vincereId} className="bg-mvp-dark/50 rounded-lg border border-mvp-border p-3">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar member={m} size="w-8 h-8" textSize="text-xs" />
                  <span className="font-display font-semibold">{m.name}</span>
                  <span className="text-xs text-white/30">{total} activities</span>
                  <span className="ml-auto text-sm font-bold text-mvp-gold font-display">
                    {formatNumber(mData.activityPoints || 0)} pts
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(mData.byCategory || {}).map(([catKey, cat]) => {
                    if (cat.count === 0) return null;
                    const meta = CATEGORY_META[catKey];
                    return (
                      <span key={catKey} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-mvp-dark border border-mvp-border">
                        <span>{meta?.emoji}</span>
                        <span className="font-display font-semibold">{cat.count}</span>
                        <span className="text-white/30">{meta?.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { history, loading: historyLoading } = useHistory(30);
  const { data, loading: dataLoading } = useLeaderboard();
  const { data: activityData, loading: activityLoading, fetchActivities } = useActivities();
  const [tab, setTab] = useState('overview');

  // Date range state
  const presets = getDatePresets();
  const [startDate, setStartDate] = useState(toDateStr(presets[0].start));
  const [endDate, setEndDate] = useState(toDateStr(presets[0].end));

  // Fetch activities when date range changes or activities tab is selected
  useEffect(() => {
    if (tab === 'activities') {
      fetchActivities(startDate, endDate);
    }
  }, [tab, startDate, endDate, fetchActivities]);

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
              { id: 'activities', label: 'Activities', icon: Activity },
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
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Date range picker (shown on activities tab) */}
        {tab === 'activities' && (
          <div className="bg-mvp-card rounded-xl border border-mvp-border p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Calendar size={16} className="text-white/40" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-mvp-dark border border-mvp-border rounded-lg px-3 py-1.5 text-sm text-white font-display focus:border-mvp-accent focus:outline-none"
                />
                <span className="text-white/30 text-sm">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-mvp-dark border border-mvp-border rounded-lg px-3 py-1.5 text-sm text-white font-display focus:border-mvp-accent focus:outline-none"
                />
              </div>
              <div className="flex gap-1">
                {presets.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setStartDate(toDateStr(p.start)); setEndDate(toDateStr(p.end)); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-display transition-colors ${
                      startDate === toDateStr(p.start) && endDate === toDateStr(p.end)
                        ? 'bg-mvp-accent/20 text-mvp-accent border border-mvp-accent/30'
                        : 'text-white/40 hover:text-white/60 border border-mvp-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && tab !== 'activities' ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-mvp-accent" />
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Deals', value: data?.teamStats?.totalDeals || 0, color: 'text-mvp-success' },
                    { label: 'Total Calls', value: formatNumber(data?.teamStats?.totalCalls || 0), color: 'text-mvp-accent' },
                    { label: 'Talk Time', value: formatTalkTime(data?.teamStats?.totalTalkTime || 0), color: 'text-mvp-fire' },
                    { label: 'Activities', value: data?.teamStats?.totalActivities || 0, color: 'text-purple-400' },
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
                <MemberComparisonChart history={history} metric="deals" title="Deals by Team Member" members={members} />
                <MemberComparisonChart history={history} metric="calls" title="Calls by Team Member" members={members} />
              </div>
            )}

            {tab === 'activities' && (
              activityLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-mvp-accent" />
                </div>
              ) : (
                <ActivityCategorySummary activityData={activityData} members={members} />
              )
            )}

            {tab === 'individual' && (
              <div className="space-y-6">
                <IndividualStats members={members} />
                {members.map((member) => {
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
