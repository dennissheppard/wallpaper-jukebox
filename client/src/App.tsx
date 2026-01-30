import { useState, useEffect } from 'react';
import WallpaperDisplay from './components/WallpaperDisplay';
import ControlsHUD from './components/ControlsHUD';
import { useWallpaperRotation } from './hooks/useWallpaperRotation';
import { useSettings } from './hooks/useSettings';

function App() {
  const { settings, updateSettings } = useSettings();
  const { currentImage, nextImage, rotateNow, likeImage, skipImage } = useWallpaperRotation(settings);
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

      {showControls && (
        <ControlsHUD
          settings={settings}
          onSettingsChange={updateSettings}
          onRotateNow={rotateNow}
          onLike={likeImage}
          onSkip={skipImage}
          currentImage={currentImage}
        />
      )}
    </div>
  );
}

export default App;
