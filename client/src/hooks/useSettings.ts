import { useState, useEffect } from 'react';
import { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  theme: 'nature',
  rotationInterval: 60,
  source: 'pexels',
  showClock: true,
  enableSpotify: false,
  crossfadeDuration: 1500,
};

const STORAGE_KEY = 'wallpaper-jukebox-settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return { settings, updateSettings };
}
