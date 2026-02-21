import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useWidgetConfig } from './hooks/useWidgetConfig';
import Header from './components/Header';
import TeamStats from './components/TeamStats';
import Leaderboard from './components/Leaderboard';
import KPITargets from './components/KPITargets';
import SettingsPanel from './components/SettingsPanel';
import { useYTD } from './hooks/useYTD';

// Lazy-load heavy/below-fold components (only loaded when visible)
const Challenge = lazy(() => import('./components/Challenge'));
const BadgeShowcase = lazy(() => import('./components/BadgeShowcase'));
const ActivityFeed = lazy(() => import('./components/ActivityFeed'));
const PointsBreakdown = lazy(() => import('./components/PointsBreakdown'));
const ApiStatus = lazy(() => import('./components/ApiStatus'));
const RecentWins = lazy(() => import('./components/RecentWins'));
const LeaguesWidget = lazy(() => import('./components/LeaguesWidget'));
const MissionsWidget = lazy(() => import('./components/MissionsWidget'));
const TrendChartsWidget = lazy(() => import('./components/TrendChartsWidget'));
const ActivityBreakdown = lazy(() => import('./components/ActivityBreakdown'));
const MVPOfYear = lazy(() => import('./components/MVPOfYear'));

// Lazy-load route pages (never needed on initial dashboard load)
const TVSlideshow = lazy(() => import('./pages/TVSlideshow'));
const Reports = lazy(() => import('./pages/Reports'));

function LazyWrap({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function Dashboard() {
  const { data, loading, usingMock, refresh } = useLeaderboard();
  const { standings: ytdStandings } = useYTD();
  const { config, toggleWidget, setTargets, isVisible } = useWidgetConfig();

  const leaderboard = data?.leaderboard || [];
  const teamStats = data?.teamStats || {};
  const apiStatus = data?.apiStatus || {};
  const celebrations = data?.celebrations || [];
  const lastUpdated = data?.lastUpdated;

  return (
    <div className="min-h-screen bg-mvp-dark">
      <Header
        usingMock={usingMock}
        apiStatus={apiStatus}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        isSalesdag={data?.isSalesdag}
        settingsPanel={
          <SettingsPanel config={config} toggleWidget={toggleWidget} setTargets={setTargets} members={leaderboard} targetProfiles={data?.targetProfiles} />
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Team KPIs - full width */}
        {isVisible('teamStats') && (
          <TeamStats stats={teamStats} loading={loading} targets={config.targets} />
        )}

        {/* Main Grid: Left (2 cols) + Right sidebar (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {isVisible('leaderboard') && (
              <Leaderboard members={leaderboard} loading={loading} />
            )}
            {isVisible('kpiTargets') && (
              <KPITargets members={leaderboard} />
            )}
            {isVisible('leagues') && <LazyWrap><LeaguesWidget /></LazyWrap>}
            {isVisible('activityBreakdown') && <LazyWrap><ActivityBreakdown members={leaderboard} /></LazyWrap>}
            {isVisible('trendCharts') && <LazyWrap><TrendChartsWidget /></LazyWrap>}
            {isVisible('badges') && <LazyWrap><BadgeShowcase members={leaderboard} /></LazyWrap>}
          </div>

          {/* Right column - 1/3 */}
          <div className="space-y-6">
            {isVisible('mvpOfYear') && <LazyWrap><MVPOfYear standings={ytdStandings} /></LazyWrap>}
            {isVisible('missions') && <LazyWrap><MissionsWidget /></LazyWrap>}
            {isVisible('challenge') && <LazyWrap><Challenge members={leaderboard} /></LazyWrap>}
            {isVisible('recentWins') && <LazyWrap><RecentWins celebrations={celebrations} /></LazyWrap>}
            {isVisible('pointsBreakdown') && <LazyWrap><PointsBreakdown xpRules={data?.xpRules} isSalesdag={data?.isSalesdag} /></LazyWrap>}
            {isVisible('activityFeed') && <LazyWrap><ActivityFeed members={leaderboard} /></LazyWrap>}
            {isVisible('apiStatus') && <LazyWrap><ApiStatus usingMock={usingMock} /></LazyWrap>}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-mvp-border py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-white/20 font-body">
          MVPeople Performance Dashboard &middot; Built with purpose
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/reports" element={<Suspense fallback={<div className="min-h-screen bg-mvp-dark flex items-center justify-center text-white/50">Loading...</div>}><Reports /></Suspense>} />
      <Route path="/tv" element={<Suspense fallback={null}><TVSlideshow /></Suspense>} />
    </Routes>
  );
}
