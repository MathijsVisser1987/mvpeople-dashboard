import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useYTD() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard/ytd`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setStandings(json.standings || []);
    } catch (err) {
      console.warn('[YTD] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  return { standings, loading };
}
