import { useState } from 'react';
import { Settings, X, Eye, EyeOff, Target } from 'lucide-react';

const WIDGET_LABELS = {
  teamStats: { name: 'Team KPIs', icon: '📊' },
  leaderboard: { name: 'Leaderboard', icon: '🏆' },
  leagues: { name: 'Leagues', icon: '🏅' },
  missions: { name: 'Missions', icon: '🎯' },
  challenge: { name: 'Challenge', icon: '⚡' },
  recentWins: { name: 'Recent Wins', icon: '🎉' },
  trendCharts: { name: 'Trend Charts', icon: '📈' },
  badges: { name: 'Badges', icon: '🏷️' },
  pointsBreakdown: { name: 'Points Breakdown', icon: '🔢' },
  activityFeed: { name: 'Activity Feed', icon: '📋' },
  apiStatus: { name: 'API Status', icon: '🔌' },
};

export default function SettingsPanel({ config, toggleWidget, setTargets }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('widgets');
  const [localTargets, setLocalTargets] = useState(config.targets);

  const handleSaveTargets = () => {
    setTargets(localTargets);
    setTab('widgets');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg bg-mvp-dark border border-mvp-border hover:border-mvp-accent/50 transition-colors"
        title="Dashboard settings"
      >
        <Settings size={14} className="text-white/50" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-mvp-card border-l border-mvp-border z-50 overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-mvp-card border-b border-mvp-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold font-display">Settings</h2>
          <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-mvp-border">
          {[
            { id: 'widgets', label: 'Widgets' },
            { id: 'targets', label: 'KPI Targets' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-display font-semibold transition-colors ${
                tab === t.id
                  ? 'text-mvp-accent border-b-2 border-mvp-accent'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'widgets' && (
            <div className="space-y-2">
              <p className="text-xs text-white/30 font-body mb-3">
                Toggle widgets on and off to customize your dashboard.
              </p>
              {Object.entries(WIDGET_LABELS).map(([id, label]) => {
                const visible = config.widgets[id]?.visible !== false;
                return (
                  <button
                    key={id}
                    onClick={() => toggleWidget(id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      visible
                        ? 'border-mvp-accent/30 bg-mvp-accent/5'
                        : 'border-mvp-border bg-mvp-dark/30'
                    }`}
                  >
                    <span className="text-lg">{label.icon}</span>
                    <span className="flex-1 text-left text-sm font-display font-semibold">{label.name}</span>
                    {visible ? (
                      <Eye size={16} className="text-mvp-accent" />
                    ) : (
                      <EyeOff size={16} className="text-white/20" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'targets' && (
            <div className="space-y-4">
              <p className="text-xs text-white/30 font-body mb-3">
                Set monthly team KPI targets. These are used for progress bars and team target calculations.
              </p>

              {[
                { key: 'deals', label: 'Monthly Deal Target', icon: '🎯', suffix: 'deals' },
                { key: 'calls', label: 'Monthly Call Target', icon: '📞', suffix: 'calls' },
                { key: 'talkTime', label: 'Monthly Talk Time Target', icon: '🎙️', suffix: 'minutes' },
                { key: 'pipeline', label: 'Monthly Pipeline Target', icon: '💰', suffix: 'EUR' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm font-display font-semibold text-white/60 flex items-center gap-2 mb-1.5">
                    <span>{field.icon}</span>
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localTargets[field.key]}
                      onChange={(e) => setLocalTargets(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))}
                      className="flex-1 bg-mvp-dark border border-mvp-border rounded-lg px-3 py-2 text-white font-display text-sm focus:border-mvp-accent focus:outline-none"
                    />
                    <span className="text-xs text-white/30 font-body w-14">{field.suffix}</span>
                  </div>
                </div>
              ))}

              <button
                onClick={handleSaveTargets}
                className="w-full mt-4 bg-mvp-accent/20 border border-mvp-accent/40 text-mvp-accent font-display font-semibold py-2.5 rounded-lg hover:bg-mvp-accent/30 transition-colors"
              >
                Save Targets
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
