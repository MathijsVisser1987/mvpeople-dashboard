import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeagues = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/leagues`);
      if (res.ok) {
        const json = await res.json();
        setLeagues(json.leagues || []);
      }
    } catch {
      // Leagues not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeagues();
    const interval = setInterval(fetchLeagues, 60000);
    return () => clearInterval(interval);
  }, [fetchLeagues]);

  return { leagues, loading, refresh: fetchLeagues };
}
