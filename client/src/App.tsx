import { useState, useEffect, useCallback } from 'react';
import WallpaperDisplay from './components/WallpaperDisplay';
import WeatherDisplay from './components/WeatherDisplay';
import ControlsHUD from './components/ControlsHUD';
import NowPlaying from './components/NowPlaying';
import Clock from './components/Clock';
import LyricsBadge from './components/LyricsBadge';
import GlobalToggle from './components/GlobalToggle';
import IdleOverlay from './components/IdleOverlay';
import { useWallpaperRotation } from './hooks/useWallpaperRotation';
import { useSettings } from './hooks/useSettings';
import { useWeather } from './hooks/useWeather';
import { useMusicRecognition } from './hooks/useMusicRecognition';
import { useIdle } from './hooks/useIdle';

function App() {
  const { settings, updateSettings } = useSettings();
  const { weather, loading: weatherLoading, requestPreciseLocation } = useWeather(
    settings.weather.enabled,
    settings.weather.usePreciseLocation,
    settings.weather.temperatureUnit
  );
  const { currentImage, nextImage, rotateNow, likeImage } = useWallpaperRotation(settings, weather);
  const { isIdle, resetIdle } = useIdle();
  
  // State for component minimization (lifted from components)
  const [minimizedStates, setMinimizedStates] = useState({
    hud: true, // Settings starts minimized
    weather: false,
    clock: false,
    music: false,
    lyrics: false
  });
  
  const [currentLyric, setCurrentLyric] = useState<string | null>(null);

  const toggleMinimize = (key: keyof typeof minimizedStates) => {
    setMinimizedStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const areAllMinimized = Object.values(minimizedStates).every(v => v);

  const handleGlobalToggle = (shouldShow: boolean) => {
    // If shouldShow is true, we want to expand all (minimize = false)
    // If shouldShow is false, we want to minimize all (minimize = true)
    const newMinimizedState = !shouldShow;
    setMinimizedStates({
      hud: newMinimizedState,
      weather: newMinimizedState,
      clock: newMinimizedState,
      music: newMinimizedState,
      lyrics: newMinimizedState
    });
  };

  // Handle wallpaper query from music recognition (used by both manual and auto)
  const handleMusicWallpaperQuery = useCallback((query: string, lyric: string | null) => {
    if (settings.music.overrideTheme) {
      console.log('[App] Updating wallpaper with music query:', query, 'Lyric:', lyric);
      updateSettings({ customQuery: query, theme: 'custom' });
      setCurrentLyric(lyric);
    }
  }, [updateSettings, settings.music.overrideTheme]);

  // Music recognition
  const {
    isRecording,
    isRecognizing,
    lastTrack,
    error: musicError,
    permissionGranted,
    apiUsage,
    isAutoPaused,
    pauseReason,
    requestPermission,
    recognizeNow,
  } = useMusicRecognition({
    settings: settings.music,
    onWallpaperQueryReady: handleMusicWallpaperQuery,
    isIdle,
  });

  // Handle manual music recognition button click
  const handleRecognizeMusic = useCallback(async () => {
    await recognizeNow();
    // Wallpaper update is handled by onWallpaperQueryReady callback
  }, [recognizeNow]);

  // Check for kiosk mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('hideControls') === '1') {
      setMinimizedStates(prev => ({ ...prev, hud: true }));
    }
  }, []);

  // Toggle controls with keyboard shortcut (Ctrl+H or Cmd+H) -> Maps to Global Toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        handleGlobalToggle(areAllMinimized); // Toggle state
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [areAllMinimized]);

  return (
    <div className="app">
      {isIdle && <IdleOverlay onContinue={resetIdle} />}
      
      <WallpaperDisplay currentImage={currentImage} nextImage={nextImage} />

      <GlobalToggle 
        showControls={!areAllMinimized} 
        onToggle={handleGlobalToggle} 
      />

      {settings.weather.enabled && (
        <WeatherDisplay
          weather={weather}
          loading={weatherLoading}
          onRequestPreciseLocation={requestPreciseLocation}
          isMinimized={minimizedStates.weather}
          onToggleMinimize={() => toggleMinimize('weather')}
        />
      )}

      {settings.showClock && (
        <Clock 
          isMinimized={minimizedStates.clock}
          onToggleMinimize={() => toggleMinimize('clock')}
        />
      )}

      {settings.music.enabled && currentLyric && (
        <LyricsBadge 
          phrase={currentLyric} 
          artist={lastTrack?.artist} 
          isMinimized={minimizedStates.lyrics}
          onToggleMinimize={() => toggleMinimize('lyrics')}
        />
      )}

      {settings.music.enabled && (
        <NowPlaying
          track={lastTrack}
          isRecording={isRecording}
          isRecognizing={isRecognizing}
          onRefresh={() => recognizeNow(true)}
          isPaused={isAutoPaused}
          pauseReason={pauseReason || undefined}
          error={musicError}
          isMinimized={minimizedStates.music}
          onToggleMinimize={() => toggleMinimize('music')}
        />
      )}

      <ControlsHUD
        settings={settings}
        onSettingsChange={updateSettings}
        onRotateNow={rotateNow}
        onLike={likeImage}
        currentImage={currentImage}
        musicState={{
          isRecording,
          isRecognizing,
          lastTrack,
          error: musicError,
          permissionGranted,
          apiUsage,
          isAutoPaused,
          pauseReason,
        }}
        onRecognizeMusic={handleRecognizeMusic}
        onRequestMicPermission={requestPermission}
        isMinimized={minimizedStates.hud}
        onToggleMinimize={() => toggleMinimize('hud')}
      />
    </div>
  );
}

export default App;
