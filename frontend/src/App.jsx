import { useLeaderboard } from './hooks/useLeaderboard';
import Header from './components/Header';
import TeamStats from './components/TeamStats';
import Leaderboard from './components/Leaderboard';
import Challenge from './components/Challenge';
import BadgeShowcase from './components/BadgeShowcase';
import ActivityFeed from './components/ActivityFeed';
import PointsBreakdown from './components/PointsBreakdown';
import ApiStatus from './components/ApiStatus';

export default function App() {
  const { data, loading, usingMock, refresh } = useLeaderboard();

  const leaderboard = data?.leaderboard || [];
  const teamStats = data?.teamStats || {};
  const apiStatus = data?.apiStatus || {};
  const lastUpdated = data?.lastUpdated;

  return (
    <div className="min-h-screen bg-mvp-dark">
      <Header usingMock={usingMock} apiStatus={apiStatus} lastUpdated={lastUpdated} onRefresh={refresh} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Team Overview Stats */}
        <TeamStats stats={teamStats} loading={loading} />

        {/* Main Grid: Leaderboard + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <Leaderboard members={leaderboard} loading={loading} />
            <BadgeShowcase members={leaderboard} />
          </div>

          {/* Sidebar - 1 col */}
          <div className="space-y-6">
            <ApiStatus usingMock={usingMock} />
            <Challenge members={leaderboard} />
            <PointsBreakdown />
            <ActivityFeed members={leaderboard} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-mvp-border py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-white/20">
          MVPeople Performance Dashboard &middot; Built with purpose
        </div>
      </footer>
    </div>
  );
}
