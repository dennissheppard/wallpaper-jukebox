import { useState, useEffect } from 'react';
import styles from './Clock.module.css';

interface Props {
  showSeconds?: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

function Clock({ showSeconds = false, isMinimized, onToggleMinimize }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update immediately
    setTime(new Date());
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      second: showSeconds ? '2-digit' : undefined 
    });
  };
  
  const formatDate = (date: Date) => {
      return date.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
      });
  };

  const getClockIcon = (date: Date) => {
    let hours = date.getHours() % 12;
    if (hours === 0) hours = 12;
    // 1:00 is 0x1F550
    const base = 0x1F550;
    const offset = hours - 1; 
    return String.fromCodePoint(base + offset);
  };

  if (isMinimized) {
    return (
      <div 
        className={styles.minimized} 
        onClick={onToggleMinimize}
        title="Show Clock"
      >
        {getClockIcon(time)}
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
      <div className={styles.time}>{formatTime(time)}</div>
      <div className={styles.date}>{formatDate(time)}</div>
    </div>
  );
}

export default Clock;