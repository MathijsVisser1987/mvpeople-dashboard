import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Eye, EyeOff } from 'lucide-react';

const WIDGET_LABELS = {
  teamStats: { name: 'Team KPIs', icon: '📊' },
  leaderboard: { name: 'Leaderboard', icon: '🏆' },
  kpiTargets: { name: 'KPI Targets', icon: '🎯' },
  leagues: { name: 'Leagues', icon: '🏅' },
  missions: { name: 'Missions', icon: '🎯' },
  challenge: { name: 'Challenge', icon: '⚡' },
  recentWins: { name: 'Recent Wins', icon: '🎉' },
  trendCharts: { name: 'Trend Charts', icon: '📈' },
  badges: { name: 'Badges', icon: '🏷️' },
  activityBreakdown: { name: 'Activity Breakdown', icon: '🚀' },
  pointsBreakdown: { name: 'Points Breakdown', icon: '🔢' },
  activityFeed: { name: 'Activity Feed', icon: '📋' },
  apiStatus: { name: 'API Status', icon: '🔌' },
};

function PanelOverlay({ config, toggleWidget, setTargets, onClose }) {
  const [tab, setTab] = useState('widgets');
  const [localTargets, setLocalTargets] = useState(() => ({
    deals: 30,
    calls: 3000,
    talkTime: 5000,
    pipeline: 500000,
    ...(config?.targets || {}),
  }));

  const handleSaveTargets = () => {
    if (setTargets) setTargets(localTargets);
    setTab('widgets');
  };

  const widgets = config?.widgets || {};

  return (
    <div id="settings-root" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'absolute',
          right: 0, top: 0,
          width: 320, height: '100%',
          backgroundColor: '#0E2D6B',
          overflowY: 'auto',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          backgroundColor: '#0B245C',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', fontFamily: 'Montserrat, sans-serif' }}>
            Settings
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
            <X size={18} color="#ffffff" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
          <button
            onClick={() => setTab('widgets')}
            style={{
              flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600,
              fontFamily: 'Montserrat, sans-serif',
              background: 'none', border: 'none',
              borderBottom: tab === 'widgets' ? '2px solid #59D6D6' : '2px solid transparent',
              color: tab === 'widgets' ? '#59D6D6' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
            }}
          >
            Widgets
          </button>
          <button
            onClick={() => setTab('targets')}
            style={{
              flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600,
              fontFamily: 'Montserrat, sans-serif',
              background: 'none', border: 'none',
              borderBottom: tab === 'targets' ? '2px solid #59D6D6' : '2px solid transparent',
              color: tab === 'targets' ? '#59D6D6' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
            }}
          >
            KPI Targets
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, flex: 1 }}>
          {tab === 'widgets' ? (
            <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14, marginTop: 0 }}>
                Toggle widgets on and off to customize your dashboard.
              </p>
              {Object.entries(WIDGET_LABELS).map(([id, label]) => {
                const visible = widgets[id]?.visible !== false;
                return (
                  <div
                    key={id}
                    onClick={() => toggleWidget && toggleWidget(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', marginBottom: 6, borderRadius: 8,
                      border: visible ? '1px solid rgba(89,214,214,0.5)' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: visible ? 'rgba(89,214,214,0.12)' : 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{label.icon}</span>
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 600,
                      color: visible ? '#ffffff' : 'rgba(255,255,255,0.5)',
                      fontFamily: 'Montserrat, sans-serif',
                    }}>
                      {label.name}
                    </span>
                    {visible
                      ? <Eye size={16} color="#59D6D6" />
                      : <EyeOff size={16} color="rgba(255,255,255,0.3)" />
                    }
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14, marginTop: 0 }}>
                Set monthly team KPI targets.
              </p>
              {[
                { key: 'deals', label: 'Deal Target', icon: '🎯', suffix: 'deals' },
                { key: 'calls', label: 'Call Target', icon: '📞', suffix: 'calls' },
                { key: 'talkTime', label: 'Talk Time Target', icon: '🎙️', suffix: 'min' },
                { key: 'pipeline', label: 'Pipeline Target', icon: '💰', suffix: 'EUR' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>
                    {field.icon} {field.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      value={localTargets[field.key] ?? ''}
                      onChange={(e) => setLocalTargets(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))}
                      style={{
                        flex: 1, borderRadius: 8, padding: '8px 12px',
                        fontSize: 14, color: '#ffffff',
                        backgroundColor: '#0B245C',
                        border: '1px solid rgba(255,255,255,0.3)',
                        outline: 'none', fontFamily: 'Montserrat, sans-serif',
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', width: 40 }}>
                      {field.suffix}
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={handleSaveTargets}
                style={{
                  width: '100%', marginTop: 8, padding: '10px 0',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  backgroundColor: '#59D6D6', color: '#0B245C',
                  fontSize: 14, fontWeight: 700,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                Save Targets
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPanel({ config, toggleWidget, setTargets }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: 8, borderRadius: 8, cursor: 'pointer',
          backgroundColor: '#0B245C', border: '1px solid #163478',
          display: 'flex', alignItems: 'center', lineHeight: 0,
        }}
        title="Dashboard settings"
      >
        <Settings size={14} color="rgba(255,255,255,0.5)" />
      </button>

      {open && createPortal(
        <PanelOverlay
          config={config}
          toggleWidget={toggleWidget}
          setTargets={setTargets}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </>
  );
}
