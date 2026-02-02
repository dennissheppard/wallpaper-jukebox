import { useState, useEffect } from 'react';
import styles from './GlobalToggle.module.css';

interface Props {
  showControls: boolean;
  onToggle: (show: boolean) => void;
}

export default function GlobalToggle({ showControls, onToggle }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show if mouse is in top 30% of screen
      if (e.clientY < window.innerHeight * 0.3) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
      <button 
        className={styles.toggleBtn}
        onClick={() => onToggle(!showControls)}
      >
        {showControls ? 'Minimize All Components' : 'Expand All Components'}
      </button>
    </div>
  );
}