import { useState, useCallback } from 'react';

const STORAGE_KEY = 'mvp-widget-config';

const DEFAULT_CONFIG = {
  widgets: {
    teamStats: { visible: true, order: 0 },
    leaderboard: { visible: true, order: 1 },
    leagues: { visible: true, order: 2 },
    missions: { visible: true, order: 3 },
    challenge: { visible: true, order: 4 },
    recentWins: { visible: true, order: 5 },
    trendCharts: { visible: true, order: 6 },
    badges: { visible: true, order: 7 },
    pointsBreakdown: { visible: false, order: 8 },
    activityFeed: { visible: false, order: 9 },
    apiStatus: { visible: false, order: 10 },
  },
  targets: {
    deals: 30,
    calls: 3000,
    talkTime: 5000,
    pipeline: 500000,
  },
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge with defaults to pick up new widgets
      return {
        widgets: { ...DEFAULT_CONFIG.widgets, ...saved.widgets },
        targets: { ...DEFAULT_CONFIG.targets, ...saved.targets },
      };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function useWidgetConfig() {
  const [config, setConfig] = useState(loadConfig);

  const updateConfig = useCallback((updater) => {
    setConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveConfig(next);
      return next;
    });
  }, []);

  const toggleWidget = useCallback((id) => {
    updateConfig(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [id]: { ...prev.widgets[id], visible: !prev.widgets[id]?.visible },
      },
    }));
  }, [updateConfig]);

  const setTargets = useCallback((targets) => {
    updateConfig(prev => ({
      ...prev,
      targets: { ...prev.targets, ...targets },
    }));
  }, [updateConfig]);

  const isVisible = useCallback((id) => {
    return config.widgets[id]?.visible !== false;
  }, [config]);

  return { config, toggleWidget, setTargets, isVisible, updateConfig };
}
