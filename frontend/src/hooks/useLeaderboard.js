import { useState, useEffect, useCallback, useRef } from 'react';
import { leaderboardData as mockLeaderboard, teamStats as mockTeamStats } from '../data/mockData';

const API_BASE = '/api';
const CACHE_KEY = 'mvp-leaderboard-cache';

// Load cached data from localStorage for instant initial render
function loadCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      // Use cache if less than 30 minutes old
      if (cached.timestamp && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        return cached.data;
      }
    }
  } catch {}
  return null;
}

function saveCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

export function useLeaderboard() {
  const cached = useRef(loadCachedData());
  const [data, setData] = useState(cached.current);
  const [loading, setLoading] = useState(!cached.current);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const retryCount = useRef(0);
  const lastSuccessfulFetch = useRef(null);

  const fetchData = useCallback(async (isRetry = false) => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();

      // Always use real API data when API responds successfully
      // The API itself handles authentication state — trust the data it returns
      const hasRealData = json.leaderboard?.some(m =>
        m.hasCallData || m.hasDealData || m.totalActivities > 0
      );

      if (hasRealData) {
        setData(json);
        setUsingMock(false);
        saveCachedData(json);
      } else {
        // API connected but no data sources authenticated yet — use mock
        setData({
          leaderboard: mockLeaderboard,
          teamStats: mockTeamStats,
          apiStatus: json.apiStatus,
          lastUpdated: json.lastUpdated,
        });
        setUsingMock(true);
      }
      setError(null);
      retryCount.current = 0;
      lastSuccessfulFetch.current = Date.now();
    } catch (err) {
      console.warn('API fetch failed:', err.message);

      // If we have previous real data, keep showing it (don't fall back to mock)
      if (data && !usingMock) {
        setError(`Update failed: ${err.message}`);
        // Retry up to 3 times with backoff
        if (retryCount.current < 3) {
          retryCount.current++;
          const delay = Math.pow(2, retryCount.current) * 1000; // 2s, 4s, 8s
          setTimeout(() => fetchData(true), delay);
        }
        return;
      }

      // No previous data — fall back to mock as initial state
      setData({
        leaderboard: mockLeaderboard,
        teamStats: mockTeamStats,
        apiStatus: { vincere: false, eightByEight: false },
        lastUpdated: new Date().toISOString(),
      });
      setUsingMock(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [data, usingMock]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaderboard/refresh`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setUsingMock(false);
        setError(null);
        saveCachedData(json);
        lastSuccessfulFetch.current = Date.now();
      } else {
        setError(`Refresh failed: ${res.status}`);
      }
    } catch (err) {
      setError(`Refresh failed: ${err.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => fetchData(), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when page becomes visible again (user returns to tab / TV wakes up)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Only re-fetch if last successful fetch was more than 30 seconds ago
        const timeSinceLastFetch = Date.now() - (lastSuccessfulFetch.current || 0);
        if (timeSinceLastFetch > 30000) {
          fetchData();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when network reconnects
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network reconnected, refreshing data...');
      fetchData();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, usingMock, refresh };
}

export function useAuthStatus() {
  const [status, setStatus] = useState({ vincere: { authenticated: false }, eightByEight: { authenticated: false } });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/status`);
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
      // Backend not running
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, refresh: fetchStatus };
}
