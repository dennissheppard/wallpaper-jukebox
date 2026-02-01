import { useState, useEffect } from 'react';
import { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  theme: 'nature',
  customQuery: '',
  rotationInterval: 60,
  source: 'pexels',
  showClock: true,
  enableSpotify: false,
  crossfadeDuration: 1500,
  weather: {
    enabled: false,
    mode: 'off',
    usePreciseLocation: false,
    temperatureUnit: 'F',
  },
};

const STORAGE_KEY = 'wallpaper-jukebox-settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Deep merge to ensure nested weather object is properly merged
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          weather: {
            ...DEFAULT_SETTINGS.weather,
            ...(parsed.weather || {}),
          },
        };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      // Merge weather settings if provided
      if (partial.weather) {
        updated.weather = { ...prev.weather, ...partial.weather };
      }
      return updated;
    });
  };

  return { settings, updateSettings };
}
