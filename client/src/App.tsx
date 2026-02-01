import { useState, useEffect } from 'react';
import WallpaperDisplay from './components/WallpaperDisplay';
import WeatherDisplay from './components/WeatherDisplay';
import ControlsHUD from './components/ControlsHUD';
import { useWallpaperRotation } from './hooks/useWallpaperRotation';
import { useSettings } from './hooks/useSettings';
import { useWeather } from './hooks/useWeather';

function App() {
  const { settings, updateSettings } = useSettings();
  const { weather, loading: weatherLoading, requestPreciseLocation } = useWeather(
    settings.weather.enabled,
    settings.weather.usePreciseLocation,
    settings.weather.temperatureUnit
  );
  const { currentImage, nextImage, rotateNow, likeImage } = useWallpaperRotation(settings, weather);
  const [showControls, setShowControls] = useState(true);

  // Check for kiosk mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('hideControls') === '1') {
      setShowControls(false);
    }
  }, []);

  // Toggle controls with keyboard shortcut (Ctrl+H or Cmd+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowControls(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <WallpaperDisplay currentImage={currentImage} nextImage={nextImage} />

      {settings.weather.enabled && (
        <WeatherDisplay
          weather={weather}
          loading={weatherLoading}
          onRequestPreciseLocation={requestPreciseLocation}
        />
      )}

      {showControls && (
        <ControlsHUD
          settings={settings}
          onSettingsChange={updateSettings}
          onRotateNow={rotateNow}
          onLike={likeImage}
          currentImage={currentImage}
        />
      )}
    </div>
  );
}

export default App;
