import { useState, useEffect, useRef } from 'react';
import { Settings, ImageResult } from '../types';
import { MusicMetadata } from '../types/music';
import CustomSelect from './CustomSelect';
import styles from './ControlsHUD.module.css';

interface Props {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onRotateNow: () => void;
  onLike: () => void;
  currentImage: ImageResult | null;
  musicState: {
    isRecording: boolean;
    isRecognizing: boolean;
    lastTrack: MusicMetadata | null;
    error: string | null;
    permissionGranted: boolean | null;
    apiUsage: number;
    isAutoPaused: boolean;
    pauseReason: string | null;
  };
  onRecognizeMusic: () => void;
  onRequestMicPermission: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

function PillToggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className={styles.pillToggleContainer}>
      <span className={styles.pillToggleLabel}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${styles.pillToggle} ${checked ? styles.pillToggleOn : styles.pillToggleOff}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.pillToggleThumb} />
      </button>
    </label>
  );
}

interface AccordionSectionProps {
  title: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={onToggle}>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={`${styles.sectionToggle} ${isOpen ? styles.sectionToggleOpen : ''}`}>
          ▼
        </span>
      </button>
      <div className={`${styles.sectionContent} ${isOpen ? styles.sectionContentOpen : styles.sectionContentClosed}`}>
        <div className={styles.sectionContentInner}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ControlsHUD({ settings, onSettingsChange, onRotateNow, onLike, musicState, onRecognizeMusic, onRequestMicPermission, isMinimized, onToggleMinimize }: Props) {
  const [openSection, setOpenSection] = useState<string>('image');
  const [customQueryInput, setCustomQueryInput] = useState(settings.customQuery);
  const debounceTimerRef = useRef<number>();

  // Debounce custom query updates
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      if (customQueryInput !== settings.customQuery) {
        onSettingsChange({ customQuery: customQueryInput });
      }
    }, 800);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [customQueryInput]);

  // Update input when settings change externally
  useEffect(() => {
    setCustomQueryInput(settings.customQuery);
  }, [settings.customQuery]);

  if (isMinimized) {
    return (
      <div className={styles.minimized} onClick={onToggleMinimize}>
        ⚙️
      </div>
    );
  }

  return (
    <div className={styles.hud}>
      <div className={styles.header}>
        <h3 className={styles.title}>Wallpaper Jukebox</h3>
        <button className={styles.minimizeBtn} onClick={onToggleMinimize}>
          _
        </button>
      </div>

      <div className={styles.controls}>
        <AccordionSection
          title="Image Settings"
          isOpen={openSection === 'image'}
          onToggle={() => setOpenSection(openSection === 'image' ? '' : 'image')}
        >
          <div className={styles.control}>
            <label>Theme</label>
            <CustomSelect
              value={settings.theme}
              onChange={(value) => onSettingsChange({ theme: value as any })}
              disabled={(settings.weather.enabled && settings.weather.mode !== 'off') || settings.music.enabled}
              options={[
                { value: 'nature', label: 'Nature' },
                { value: 'space', label: 'Space' },
                { value: 'cities', label: 'Cities' },
                { value: 'abstract', label: 'Abstract' },
                { value: 'random', label: 'Surprise Me' },
                { value: 'custom', label: 'Custom Search' },
              ]}
            />
            {settings.weather.enabled && settings.weather.mode !== 'off' && (
              <div className={styles.note}>Controlled by weather</div>
            )}
            {settings.music.enabled && (
              <div className={styles.note}>Controlled by music</div>
            )}
          </div>

          {settings.theme === 'custom' && !(settings.weather.enabled && settings.weather.mode !== 'off') && (
            <div className={styles.control}>
              <label>Search Query</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g., morning fog mist atmospheric"
                value={customQueryInput}
                onChange={(e) => setCustomQueryInput(e.target.value)}
                disabled={settings.music.enabled}
              />
              <div className={styles.note}>
                {settings.music.enabled ? 'Controlled by music' : 'Type keywords to search for images'}
              </div>
            </div>
          )}

          <div className={styles.control}>
            <label>Interval</label>
            <CustomSelect
              value={settings.rotationInterval}
              onChange={(value) => onSettingsChange({ rotationInterval: Number(value) as any })}
              options={[
                { value: 15, label: '15 seconds' },
                { value: 30, label: '30 seconds' },
                { value: 60, label: '1 minute' },
                { value: 300, label: '5 minutes' },
                { value: 900, label: '15 minutes' },
                { value: 0, label: 'Manual only' },
              ]}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Weather Settings"
          isOpen={openSection === 'weather'}
          onToggle={() => setOpenSection(openSection === 'weather' ? '' : 'weather')}
        >
          <PillToggle
            checked={settings.weather.enabled}
            onChange={(checked) =>
              onSettingsChange({
                weather: { ...settings.weather, enabled: checked },
              })
            }
            label="Enable Weather"
          />

          {settings.weather.enabled && (
            <>
              <div className={styles.control}>
                <label>Mode</label>
                <CustomSelect
                  value={settings.weather.mode}
                  onChange={(value) =>
                    onSettingsChange({
                      weather: { ...settings.weather, mode: value as any },
                    })
                  }
                  options={[
                    { value: 'off', label: 'Display Only' },
                    { value: 'match', label: 'Match Weather' },
                    { value: 'escape', label: 'Escape Weather' },
                  ]}
                />
              </div>

              <div className={styles.control}>
                <label>Temperature</label>
                <CustomSelect
                  value={settings.weather.temperatureUnit}
                  onChange={(value) =>
                    onSettingsChange({
                      weather: { ...settings.weather, temperatureUnit: value as 'C' | 'F' },
                    })
                  }
                  options={[
                    { value: 'F', label: 'Fahrenheit (°F)' },
                    { value: 'C', label: 'Celsius (°C)' },
                  ]}
                />
              </div>
            </>
          )}
        </AccordionSection>

        <AccordionSection
          title="Clock Settings"
          isOpen={openSection === 'clock'}
          onToggle={() => setOpenSection(openSection === 'clock' ? '' : 'clock')}
        >
          <PillToggle
            checked={settings.showClock}
            onChange={(checked) => onSettingsChange({ showClock: checked })}
            label="Show Clock"
          />
        </AccordionSection>

        <AccordionSection
          title={
            <>
              Music Settings
              {musicState.isAutoPaused && (
                <span
                  className={styles.pausedBadge}
                  title={musicState.pauseReason || 'Auto-recognition paused'}
                >
                  ⏸
                </span>
              )}
            </>
          }
          isOpen={openSection === 'music'}
          onToggle={() => setOpenSection(openSection === 'music' ? '' : 'music')}
        >
          <PillToggle
            checked={settings.music.enabled}
            onChange={(checked) =>
              onSettingsChange({
                music: { ...settings.music, enabled: checked },
              })
            }
            label="Enable Music Recognition"
          />

          {settings.music.enabled && (
            <>
              {/* Permission Warning */}
              {musicState.permissionGranted === false && (
                <div className={styles.warning}>
                  <span>Microphone permission required</span>
                  <button
                    className={styles.permissionBtn}
                    onClick={onRequestMicPermission}
                  >
                    Grant Permission
                  </button>
                </div>
              )}

              {/* Manual Recognition Button */}
              <div className={styles.control}>
                <button
                  className={`${styles.recognizeBtn} ${
                    (musicState.isRecording || musicState.isRecognizing) ? styles.recognizeBtnActive : ''
                  }`}
                  onClick={onRecognizeMusic}
                  disabled={
                    musicState.isRecording ||
                    musicState.isRecognizing ||
                    musicState.permissionGranted === false ||
                    musicState.apiUsage >= 250
                  }
                >
                  {musicState.isRecording && 'Listening...'}
                  {musicState.isRecognizing && 'Recognizing...'}
                  {!musicState.isRecording && !musicState.isRecognizing && 'Recognize Music Now'}
                </button>
              </div>

              {/* Error Message */}
              {musicState.error && (
                <div className={styles.errorMessage}>
                  {musicState.error}
                </div>
              )}

              {/* Last Recognized Track */}
              {musicState.lastTrack && (
                <div className={styles.trackInfo}>
                  <div className={styles.trackTitle}>{musicState.lastTrack.title}</div>
                  <div className={styles.trackArtist}>{musicState.lastTrack.artist}</div>
                  <div className={styles.trackGenre}>{musicState.lastTrack.genre}</div>
                </div>
              )}

              {/* Auto-Recognition Toggle */}
              <PillToggle
                checked={settings.music.autoRecognize}
                onChange={(checked) =>
                  onSettingsChange({
                    music: { ...settings.music, autoRecognize: checked },
                  })
                }
                label="Auto-Recognize"
              />

              {settings.music.autoRecognize && (
                <div className={styles.control}>
                  <label>Auto Interval</label>
                  <CustomSelect
                    value={settings.music.autoInterval}
                    onChange={(value) =>
                      onSettingsChange({
                        music: { ...settings.music, autoInterval: Number(value) },
                      })
                    }
                    options={[
                      { value: 60, label: '1 minute' },
                      { value: 180, label: '3 minutes' },
                      { value: 300, label: '5 minutes' },
                      { value: 600, label: '10 minutes' },
                      { value: 0, label: 'Manual only' },
                    ]}
                  />
                  <div className={styles.note}>
                    Auto-recognize uses API calls
                  </div>
                </div>
              )}

              {/* Theme Override Toggle */}
              <PillToggle
                checked={settings.music.overrideTheme}
                onChange={(checked) =>
                  onSettingsChange({
                    music: { ...settings.music, overrideTheme: checked },
                  })
                }
                label="Override Other Themes"
              />
              {settings.music.overrideTheme && (
                <div className={styles.note}>
                  Music will override weather and manual themes
                </div>
              )}

              {/* API Usage Display */}
              {musicState.apiUsage >= 225 && (
                <div className={styles.warning}>
                  API limit warning: {musicState.apiUsage}/250 used this month
                </div>
              )}
              {musicState.apiUsage < 225 && (
                <div className={styles.note}>
                  API usage: {musicState.apiUsage}/250 this month
                </div>
              )}
            </>
          )}
        </AccordionSection>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={onLike} title="Like">
          ❤️
        </button>
        <button className={styles.actionBtn} onClick={onRotateNow} title="Next">
          ⏭️
        </button>
      </div>

      <div className={styles.hint}>
        Press Ctrl+H to toggle controls
      </div>
    </div>
  );
}

export default ControlsHUD;