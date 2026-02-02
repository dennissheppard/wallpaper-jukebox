import { useState, useEffect, useCallback } from 'react';
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
  music: {
    enabled: false,
    autoRecognize: false,
    autoInterval: 0,
    mappingMode: 'jukebox',
    overrideTheme: true,
  },
};

const STORAGE_KEY = 'wallpaper-jukebox-settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Deep merge to ensure nested objects are properly merged
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          weather: {
            ...DEFAULT_SETTINGS.weather,
            ...(parsed.weather || {}),
          },
          music: {
            ...DEFAULT_SETTINGS.music,
            ...(parsed.music || {}),
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

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      // Merge weather settings if provided
      if (partial.weather) {
        updated.weather = { ...prev.weather, ...partial.weather };
      }
      // Merge music settings if provided
      if (partial.music) {
        updated.music = { ...prev.music, ...partial.music };
      }
      return updated;
    });
  }, []);

  return { settings, updateSettings };
}
