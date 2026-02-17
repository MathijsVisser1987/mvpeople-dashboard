import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useMissions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/missions`);
      if (res.ok) {
        const json = await res.json();
        setMissions(json.missions || []);
      }
    } catch {
      // Missions not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
    const interval = setInterval(fetchMissions, 60000);
    return () => clearInterval(interval);
  }, [fetchMissions]);

  return { missions, loading, refresh: fetchMissions };
}
