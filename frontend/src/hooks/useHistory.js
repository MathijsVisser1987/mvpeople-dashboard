import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useHistory(days = 30) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/history?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setHistory(json.history || []);
      }
    } catch {
      // History not available
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, refresh: fetchHistory };
}
