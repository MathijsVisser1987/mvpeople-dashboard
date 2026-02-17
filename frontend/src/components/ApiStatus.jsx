import { useState } from 'react';
import { Plug, ExternalLink, Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuthStatus } from '../hooks/useLeaderboard';

function StatusDot({ connected }) {
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-mvp-success' : 'bg-red-500'}`} />
  );
}

export default function ApiStatus({ usingMock }) {
  const { status, refresh } = useAuthStatus();
  const [expanded, setExpanded] = useState(false);
  const [eightByEightForm, setEightByEightForm] = useState({ username: '', password: '' });
  const [loading8x8, setLoading8x8] = useState(false);
  const [error8x8, setError8x8] = useState('');

  const handleVincereLogin = async () => {
    try {
      const res = await fetch('/api/auth/vincere/login');
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
      }
    } catch {
      // Backend not running
    }
  };

  const handle8x8Login = async (e) => {
    e.preventDefault();
    setLoading8x8(true);
    setError8x8('');
    try {
      const res = await fetch('/api/auth/8x8/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eightByEightForm),
      });
      const data = await res.json();
      if (res.ok) {
        setEightByEightForm({ username: '', password: '' });
        refresh();
      } else {
        setError8x8(data.message || 'Authentication failed');
      }
    } catch {
      setError8x8('Backend not running');
    }
    setLoading8x8(false);
  };

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Plug size={16} className="text-mvp-accent" />
          <span className="text-sm font-semibold font-display">API Connections</span>
          {usingMock && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-mvp-warning/20 text-mvp-warning border border-mvp-warning/30 font-display">
              Mock Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusDot connected={status.vincere?.authenticated} />
          <StatusDot connected={status.eightByEight?.authenticated} />
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Vincere */}
          <div className="bg-mvp-dark rounded-lg p-3 border border-mvp-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium font-display">Vincere CRM</span>
                {status.vincere?.authenticated ? (
                  <span className="flex items-center gap-1 text-xs text-mvp-success font-display">
                    <CheckCircle2 size={12} /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-display">
                    <XCircle size={12} /> Not connected
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-white/40 mb-2 font-body">Domain: {status.vincere?.domain || 'mvpeoplegroup.vincere.io'}</p>
            {!status.vincere?.authenticated && (
              <button
                onClick={handleVincereLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-mvp-accent/20 text-mvp-accent border border-mvp-accent/30 rounded-lg text-xs font-medium font-display hover:bg-mvp-accent/30 transition-colors"
              >
                <ExternalLink size={12} />
                Connect Vincere
              </button>
            )}
          </div>

          {/* 8x8 */}
          <div className="bg-mvp-dark rounded-lg p-3 border border-mvp-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium font-display">8x8 Work Analytics</span>
                {status.eightByEight?.authenticated ? (
                  <span className="flex items-center gap-1 text-xs text-mvp-success font-display">
                    <CheckCircle2 size={12} /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-display">
                    <XCircle size={12} /> Not connected
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-white/40 mb-2 font-body">PBX: {status.eightByEight?.pbxId || 'mvpeople'} (EU)</p>
            {!status.eightByEight?.authenticated && (
              <form onSubmit={handle8x8Login} className="space-y-2">
                <input
                  type="text"
                  placeholder="8x8 Username"
                  value={eightByEightForm.username}
                  onChange={e => setEightByEightForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-mvp-card border border-mvp-border rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-mvp-accent font-body"
                />
                <input
                  type="password"
                  placeholder="8x8 Password"
                  value={eightByEightForm.password}
                  onChange={e => setEightByEightForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-mvp-card border border-mvp-border rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-mvp-accent font-body"
                />
                {error8x8 && <p className="text-xs text-red-400 font-body">{error8x8}</p>}
                <button
                  type="submit"
                  disabled={loading8x8}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-mvp-accent/20 text-mvp-accent border border-mvp-accent/30 rounded-lg text-xs font-medium font-display hover:bg-mvp-accent/30 transition-colors disabled:opacity-50"
                >
                  {loading8x8 ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                  Connect 8x8
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
