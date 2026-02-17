import { useState, useEffect, useCallback } from 'react';
import { leaderboardData as mockLeaderboard, teamStats as mockTeamStats } from '../data/mockData';

const API_BASE = '/api';

export function useLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();

      // Check if we got real data
      const hasRealData = json.leaderboard?.some(m => m.hasCallData || m.hasDealData);
      if (hasRealData) {
        setData(json);
        setUsingMock(false);
      } else {
        // API connected but no real data yet, use mock
        setData({
          leaderboard: mockLeaderboard,
          teamStats: mockTeamStats,
          apiStatus: json.apiStatus,
          lastUpdated: json.lastUpdated,
        });
        setUsingMock(true);
      }
      setError(null);
    } catch (err) {
      console.warn('API not available, using mock data:', err.message);
      setData({
        leaderboard: mockLeaderboard,
        teamStats: mockTeamStats,
        apiStatus: { vincere: false, eightByEight: false },
        lastUpdated: new Date().toISOString(),
      });
      setUsingMock(true);
      setError(null); // Don't show error for mock fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaderboard/refresh`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setUsingMock(false);
      }
    } catch {
      // Ignore, keep current data
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
