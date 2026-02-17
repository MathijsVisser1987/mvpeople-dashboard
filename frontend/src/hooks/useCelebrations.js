import { useState, useEffect, useCallback } from 'react';

export function useCelebrations() {
  const [celebrations, setCelebrations] = useState([]);
  const [unseen, setUnseen] = useState([]);

  const fetchCelebrations = useCallback(async () => {
    try {
      const res = await fetch('/api/celebrations?limit=10');
      if (res.ok) setCelebrations(await res.json());
    } catch {}
  }, []);

  const fetchUnseen = useCallback(async () => {
    try {
      const res = await fetch('/api/celebrations/unseen');
      if (res.ok) setUnseen(await res.json());
    } catch {}
  }, []);

  const markSeen = useCallback(async (ids) => {
    try {
      await fetch('/api/celebrations/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setUnseen(prev => prev.filter(c => !ids.includes(c.id)));
    } catch {}
  }, []);

  useEffect(() => {
    fetchCelebrations();
    fetchUnseen();
    const celebInterval = setInterval(fetchCelebrations, 30000);
    const unseenInterval = setInterval(fetchUnseen, 15000);
    return () => {
      clearInterval(celebInterval);
      clearInterval(unseenInterval);
    };
  }, [fetchCelebrations, fetchUnseen]);

  return { celebrations, unseen, markSeen, refresh: fetchCelebrations };
}
