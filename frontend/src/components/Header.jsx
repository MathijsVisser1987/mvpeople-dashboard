import { RefreshCw, Zap, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header({ usingMock, apiStatus, lastUpdated, onRefresh, settingsPanel }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const bothConnected = apiStatus?.vincere && apiStatus?.eightByEight;
  const anyConnected = apiStatus?.vincere || apiStatus?.eightByEight;

  return (
    <header className="border-b border-mvp-border bg-mvp-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/mvpeople-logo.png"
              alt="MVPeople"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight font-display">
                <span className="gradient-text">MVPeople</span>
                <span className="text-white/60 font-medium ml-2">Performance Dashboard</span>
              </h1>
              <p className="text-sm text-white/40 font-body">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TV mode link */}
            <Link
              to="/tv"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display text-white/40 hover:text-white hover:bg-mvp-dark transition-colors border border-transparent hover:border-mvp-border"
            >
              <Tv size={13} />
              TV Mode
            </Link>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-mvp-dark border border-mvp-border hover:border-mvp-accent/50 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={14} className="text-white/50" />
            </button>

            {/* Settings panel */}
            {settingsPanel}

            {/* Connection status */}
            <div className="flex items-center gap-2 bg-mvp-dark px-3 py-1.5 rounded-lg border border-mvp-border">
              {bothConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-mvp-success animate-pulse" />
                  <span className="text-xs text-mvp-success font-display font-semibold">Live</span>
                </>
              ) : anyConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-mvp-warning animate-pulse" />
                  <span className="text-xs text-mvp-warning font-display font-semibold">Partial</span>
                </>
              ) : usingMock ? (
                <>
                  <Zap size={12} className="text-mvp-warning" />
                  <span className="text-xs text-white/50 font-display">Mock Data</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-mvp-success animate-pulse" />
                  <span className="text-xs text-white/60 font-display">Live</span>
                </>
              )}
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <span className="hidden sm:block text-[10px] text-white/25 font-body">
                Updated {new Date(lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
