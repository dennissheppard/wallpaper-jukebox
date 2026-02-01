import { useState, useEffect, useRef } from 'react';
import { Settings, ImageResult } from '../types';
import CustomSelect from './CustomSelect';
import styles from './ControlsHUD.module.css';

interface Props {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onRotateNow: () => void;
  onLike: () => void;
  currentImage: ImageResult | null;
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
  title: string;
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

function ControlsHUD({ settings, onSettingsChange, onRotateNow, onLike }: Props) {
  const [isMinimized, setIsMinimized] = useState(false);
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
              disabled={settings.weather.enabled && settings.weather.mode !== 'off'}
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
              />
              <div className={styles.note}>Type keywords to search for images</div>
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

          <div className={styles.control}>
            <label>Source</label>
            <CustomSelect
              value={settings.source}
              onChange={(value) => onSettingsChange({ source: value as any })}
              options={[
                { value: 'pexels', label: 'Pexels' },
                { value: 'unsplash', label: 'Unsplash' },
                { value: 'pixabay', label: 'Pixabay' },
                { value: 'nasa', label: 'NASA' },
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
          title="Music Settings"
          isOpen={openSection === 'music'}
          onToggle={() => setOpenSection(openSection === 'music' ? '' : 'music')}
        >
          <div className={styles.comingSoon}>Coming soon...</div>
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
