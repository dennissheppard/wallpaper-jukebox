import { useState } from 'react';
import styles from './LyricsBadge.module.css';

interface Props {
  phrase: string;
  artist?: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

function LyricsBadge({ phrase, artist, isMinimized, onToggleMinimize }: Props) {
  // If no phrase, don't render anything
  if (!phrase) return null;

  if (isMinimized) {
    return (
      <div 
        className={styles.minimized} 
        onClick={onToggleMinimize}
        title={`"${phrase}" - ${artist || 'Unknown'}`}
      >
        🎤
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.minimizeBtn} onClick={onToggleMinimize}>
          _
        </button>
      </div>
      <div className={styles.phrase}>"{phrase}"</div>
      {artist && <div className={styles.artist}>- {artist}</div>}
    </div>
  );
}

export default LyricsBadge;
