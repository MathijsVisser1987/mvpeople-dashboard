import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useTargetSettings() {
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/targets`);
      if (res.ok) {
        const data = await res.json();
        setTargets(data);
      }
    } catch (err) {
      console.warn('Failed to load target settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const saveTargets = useCallback(async (data) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setTargets(data);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Failed to save target settings:', err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { targets, loading, saving, saveTargets, refetch: fetchTargets };
}
