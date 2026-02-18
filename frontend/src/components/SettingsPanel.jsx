import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Eye, EyeOff, Save, Loader2, ChevronDown } from 'lucide-react';
import { useTargetSettings } from '../hooks/useTargetSettings';

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

// KPI definitions matching the backend
const KPI_LABELS = {
  candidateCalls: 'Candidate Calls',
  headhuntCallMeeting: 'Headhunt Call / Meeting',
  callBackPlanned: 'Call - Back Planned',
  headhuntCompleted: 'Headhunt Completed',
  linkedInMessage: 'LinkedIn Message / InMail',
  jobLead: 'Job Lead',
  newCandidate: 'New Candidate Added',
  salesCalls: 'Sales Calls',
  cvSentJob: 'CV Sent - JOB',
  firstInterview: '1st Interview',
  clientMeeting: 'Client Meeting',
  deals: 'Deals',
};

function TeamTargetsTab({ members, targetProfiles }) {
  const { targets: savedTargets, loading, saving, saveTargets } = useTargetSettings();
  const [localTargets, setLocalTargets] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize local state from saved targets
  useEffect(() => {
    if (!loading) {
      setLocalTargets(savedTargets || {});
    }
  }, [loading, savedTargets]);

  const profiles = targetProfiles || {
    starter: { id: 'starter', label: 'Starter', targets: {} },
    recruiter360: { id: 'recruiter360', label: '360 Recruiter', targets: {} },
  };

  const profileOptions = Object.values(profiles);

  const getMemberProfile = (member) => {
    const vincereId = String(member.vincereId);
    return localTargets[vincereId]?.profile || member.targetProfile || 'starter';
  };

  const getMemberOverrides = (member) => {
    const vincereId = String(member.vincereId);
    return localTargets[vincereId]?.overrides || {};
  };

  const setMemberProfile = (member, profileId) => {
    const vincereId = String(member.vincereId);
    setLocalTargets(prev => ({
      ...prev,
      [vincereId]: {
        ...prev[vincereId],
        profile: profileId,
        overrides: prev[vincereId]?.overrides || {},
      },
    }));
  };

  const setMemberOverride = (member, kpiKey, value) => {
    const vincereId = String(member.vincereId);
    setLocalTargets(prev => {
      const existing = prev[vincereId] || {};
      const overrides = { ...existing.overrides };
      if (value === '' || value === null) {
        delete overrides[kpiKey];
      } else {
        overrides[kpiKey] = parseInt(value) || 0;
      }
      return {
        ...prev,
        [vincereId]: {
          ...existing,
          profile: existing.profile || member.targetProfile || 'starter',
          overrides,
        },
      };
    });
  };

  const handleSave = async () => {
    const success = await saveTargets(localTargets);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Loader2 size={24} color="#59D6D6" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14, marginTop: 0 }}>
        Set individual KPI target profiles and override targets per team member.
      </p>

      {(members || []).map((member) => {
        const profileId = getMemberProfile(member);
        const profile = profiles[profileId];
        const profileTargets = profile?.targets || {};
        const overrides = getMemberOverrides(member);

        return (
          <div key={member.vincereId} style={{
            marginBottom: 16,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.15)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}>
            {/* Member header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: member.color || '#59D6D6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                }}>
                  {member.avatar || member.name?.[0]}
                </div>
              )}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>
                {member.name || member.fullName}
              </span>
            </div>

            {/* Profile selector */}
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600 }}>
                Profile
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={profileId}
                  onChange={(e) => setMemberProfile(member, e.target.value)}
                  style={{
                    width: '100%', padding: '7px 30px 7px 10px', borderRadius: 6,
                    fontSize: 13, color: '#fff',
                    backgroundColor: '#0B245C', border: '1px solid rgba(255,255,255,0.25)',
                    outline: 'none', fontFamily: 'Montserrat, sans-serif',
                    appearance: 'none', cursor: 'pointer',
                  }}
                >
                  {profileOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="rgba(255,255,255,0.5)" style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }} />
              </div>
            </div>

            {/* KPI target overrides */}
            <div style={{ padding: '4px 12px 10px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600 }}>
                Monthly Targets
              </div>
              {Object.entries(profileTargets).map(([kpiKey, defaultTarget]) => {
                const hasOverride = overrides[kpiKey] !== undefined;
                return (
                  <div key={kpiKey} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 4,
                  }}>
                    <span style={{
                      flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'Montserrat, sans-serif',
                    }}>
                      {KPI_LABELS[kpiKey] || kpiKey}
                    </span>
                    <input
                      type="number"
                      placeholder={String(defaultTarget)}
                      value={hasOverride ? overrides[kpiKey] : ''}
                      onChange={(e) => setMemberOverride(member, kpiKey, e.target.value)}
                      style={{
                        width: 70, borderRadius: 5, padding: '4px 8px',
                        fontSize: 12, color: hasOverride ? '#59D6D6' : 'rgba(255,255,255,0.4)',
                        backgroundColor: '#0B245C',
                        border: hasOverride ? '1px solid rgba(89,214,214,0.5)' : '1px solid rgba(255,255,255,0.2)',
                        outline: 'none', fontFamily: 'Montserrat, sans-serif',
                        textAlign: 'right',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', marginTop: 8, padding: '10px 0',
          borderRadius: 8, border: 'none', cursor: saving ? 'default' : 'pointer',
          backgroundColor: saveSuccess ? '#00c853' : '#59D6D6',
          color: '#0B245C',
          fontSize: 14, fontWeight: 700,
          fontFamily: 'Montserrat, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: saving ? 0.7 : 1,
          transition: 'background-color 0.3s',
        }}
      >
        {saving ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Saving...
          </>
        ) : saveSuccess ? (
          'Saved!'
        ) : (
          <>
            <Save size={16} />
            Save Targets
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

function PanelOverlay({ config, toggleWidget, setTargets, onClose, members, targetProfiles }) {
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

  const tabs = [
    { id: 'widgets', label: 'Widgets' },
    { id: 'targets', label: 'Team KPIs' },
    { id: 'teamTargets', label: 'Team Targets' },
  ];

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
          width: 340, height: '100%',
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
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '12px 0', fontSize: 12, fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                background: 'none', border: 'none',
                borderBottom: tab === t.id ? '2px solid #59D6D6' : '2px solid transparent',
                color: tab === t.id ? '#59D6D6' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 16, flex: 1 }}>
          {tab === 'widgets' && (
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
          )}

          {tab === 'targets' && (
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

          {tab === 'teamTargets' && (
            <TeamTargetsTab members={members} targetProfiles={targetProfiles} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPanel({ config, toggleWidget, setTargets, members, targetProfiles }) {
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
          members={members}
          targetProfiles={targetProfiles}
        />,
        document.body
      )}
    </>
  );
}
