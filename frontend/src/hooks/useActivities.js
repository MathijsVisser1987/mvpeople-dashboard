import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useActivities() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/leaderboard/activities?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Activity fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchActivities };
}
