import styles from './LyricsBadge.module.css';

interface Props {
  phrase: string;
  artist?: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onRefresh?: () => void;
}

function LyricsBadge({ phrase, artist, isMinimized, onToggleMinimize, onRefresh }: Props) {
  // If no phrase, don't render anything
  if (!phrase) return null;

  return (
    <div className={`${styles.wrapper} ${isMinimized ? styles.minimizedState : ''}`}>
      <div className={styles.expandedContent}>
        <div className={styles.header}>
          {onRefresh && (
            <button
              className={styles.refreshBtn}
              onClick={onRefresh}
              title="Try a different lyric"
            >
              ↻
            </button>
          )}
          <button className={styles.minimizeBtn} onClick={onToggleMinimize}>
            _
          </button>
        </div>
        <div className={styles.phrase}>"{phrase}"</div>
        {artist && <div className={styles.artist}>- {artist}</div>}
      </div>

      <div
        className={styles.minimizedIcon}
        onClick={onToggleMinimize}
        title={`"${phrase}" - ${artist || 'Unknown'}`}
      >
        🎤
      </div>
    </div>
  );
}

export default LyricsBadge;