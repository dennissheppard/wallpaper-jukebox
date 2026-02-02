import { useState } from 'react';
import { MusicMetadata } from '../types/music';
import styles from './NowPlaying.module.css';

interface Props {
  track: MusicMetadata | null;
  isRecording: boolean;
  isRecognizing: boolean;
  onRefresh: () => void;
  isPaused: boolean;
  pauseReason?: string;
  error?: string | null;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

function NowPlaying({ track, isRecording, isRecognizing, onRefresh, isPaused, pauseReason, error, isMinimized, onToggleMinimize }: Props) {
  if (!track && !isRecording && !isRecognizing) {
    if (error) {
      return (
        <div className={`${styles.wrapper} ${isMinimized ? styles.minimizedState : ''}`}>
          <div className={styles.expandedContent}>
             {/* Not implemented expanded error state yet, assume minimized */}
             <div className={styles.retryBadge}>↻</div>
             {error}
          </div>
          
          <div 
            className={styles.minimizedIcon} 
            onClick={onToggleMinimize}
            title={`Retrying... Error: ${error}`}
          >
            🎵
            <div className={styles.retryBadge}>↻</div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`${styles.wrapper} ${isMinimized ? styles.minimizedState : ''}`}>
      <div className={styles.expandedContent}>
        {(isRecording || isRecognizing) ? (
          <div className={styles.listening}>
            <span className={styles.pulsingDot} />
            <span>{isRecording ? 'Listening...' : 'Recognizing...'}</span>
            <button className={styles.minimizeBtn} onClick={onToggleMinimize}>
              _
            </button>
          </div>
        ) : track ? (
          <div className={styles.trackInfo}>
            <div className={styles.header}>
              <div className={styles.nowPlayingLabel}>
                Now Playing
                {isPaused && (
                  <span className={styles.pausedIndicator} title={pauseReason || 'Auto-recognition paused'}>
                    ⏸
                  </span>
                )}
              </div>
              <button className={styles.minimizeBtn} onClick={onToggleMinimize}>
                _
              </button>
            </div>
            <div className={styles.trackTitle}>{track.title}</div>
            <div className={styles.trackArtist}>{track.artist}</div>
            {track.tags && track.tags.length > 0 && (
              <div className={styles.tags}>
                {track.tags.slice(0, 4).map((tag, i) => (
                  <span key={i} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
            <button className={styles.refreshBtn} onClick={onRefresh} title="Update now playing">
              ↻ Update
            </button>
          </div>
        ) : null}
      </div>

      <div 
        className={styles.minimizedIcon} 
        onClick={onToggleMinimize}
        title="Show Now Playing"
      >
        🎵
      </div>
    </div>
  );
}

export default NowPlaying;