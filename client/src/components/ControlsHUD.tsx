import { useState } from 'react';
import { Settings, ImageResult } from '../types';
import styles from './ControlsHUD.module.css';

interface Props {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onRotateNow: () => void;
  onLike: () => void;
  onSkip: () => void;
  currentImage: ImageResult | null;
}

function ControlsHUD({ settings, onSettingsChange, onRotateNow, onLike, onSkip }: Props) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className={styles.minimized} onClick={() => setIsMinimized(false)}>
        ⚙️
      </div>
    );
  }

  return (
    <div className={styles.hud}>
      <div className={styles.header}>
        <h3 className={styles.title}>Wallpaper Jukebox</h3>
        <button className={styles.minimizeBtn} onClick={() => setIsMinimized(true)}>
          _
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.control}>
          <label>Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => onSettingsChange({ theme: e.target.value as any })}
          >
            <option value="nature">Nature</option>
            <option value="space">Space</option>
            <option value="cities">Cities</option>
            <option value="abstract">Abstract</option>
            <option value="random">Surprise Me</option>
          </select>
        </div>

        <div className={styles.control}>
          <label>Interval</label>
          <select
            value={settings.rotationInterval}
            onChange={(e) => onSettingsChange({ rotationInterval: Number(e.target.value) as any })}
          >
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
            <option value={900}>15 minutes</option>
            <option value={0}>Manual only</option>
          </select>
        </div>

        <div className={styles.control}>
          <label>Source</label>
          <select
            value={settings.source}
            onChange={(e) => onSettingsChange({ source: e.target.value as any })}
          >
            <option value="pexels">Pexels</option>
            <option value="unsplash">Unsplash</option>
            <option value="pixabay">Pixabay</option>
            <option value="nasa">NASA</option>
          </select>
        </div>

        <div className={styles.control}>
          <label>
            <input
              type="checkbox"
              checked={settings.showClock}
              onChange={(e) => onSettingsChange({ showClock: e.target.checked })}
            />
            Show Clock
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={onLike} title="Like">
          ❤️
        </button>
        <button className={styles.actionBtn} onClick={onRotateNow} title="Next">
          ⏭️
        </button>
        <button className={styles.actionBtn} onClick={onSkip} title="Skip">
          ⏩
        </button>
      </div>

      <div className={styles.hint}>
        Press Ctrl+H to toggle controls
      </div>
    </div>
  );
}

export default ControlsHUD;
