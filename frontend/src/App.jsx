import { Routes, Route } from 'react-router-dom';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useWidgetConfig } from './hooks/useWidgetConfig';
import Header from './components/Header';
import TeamStats from './components/TeamStats';
import Leaderboard from './components/Leaderboard';
import Challenge from './components/Challenge';
import BadgeShowcase from './components/BadgeShowcase';
import ActivityFeed from './components/ActivityFeed';
import PointsBreakdown from './components/PointsBreakdown';
import ApiStatus from './components/ApiStatus';
import RecentWins from './components/RecentWins';
import LeaguesWidget from './components/LeaguesWidget';
import MissionsWidget from './components/MissionsWidget';
import TrendChartsWidget from './components/TrendChartsWidget';
import ActivityBreakdown from './components/ActivityBreakdown';
import KPITargets from './components/KPITargets';
import MVPOfYear from './components/MVPOfYear';
import SettingsPanel from './components/SettingsPanel';
import TVSlideshow from './pages/TVSlideshow';
import Reports from './pages/Reports';
import { useYTD } from './hooks/useYTD';

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
            {isVisible('leagues') && <LeaguesWidget />}
            {isVisible('activityBreakdown') && <ActivityBreakdown members={leaderboard} />}
            {isVisible('trendCharts') && <TrendChartsWidget />}
            {isVisible('badges') && <BadgeShowcase members={leaderboard} />}
          </div>

          {/* Right column - 1/3 */}
          <div className="space-y-6">
            {isVisible('mvpOfYear') && <MVPOfYear standings={ytdStandings} />}
            {isVisible('missions') && <MissionsWidget />}
            {isVisible('challenge') && <Challenge members={leaderboard} />}
            {isVisible('recentWins') && <RecentWins celebrations={celebrations} />}
            {isVisible('pointsBreakdown') && <PointsBreakdown />}
            {isVisible('activityFeed') && <ActivityFeed members={leaderboard} />}
            {isVisible('apiStatus') && <ApiStatus usingMock={usingMock} />}
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
      <Route path="/reports" element={<Reports />} />
      <Route path="/tv" element={<TVSlideshow />} />
    </Routes>
  );
}
