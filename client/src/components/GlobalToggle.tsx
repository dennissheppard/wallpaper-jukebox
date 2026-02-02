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
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Top 50% of screen AND Middle 33% of width
      const isTopHalf = e.clientY < height * 0.5;
      const isMiddleThird = e.clientX > width * 0.33 && e.clientX < width * 0.66;

      if (isTopHalf && isMiddleThird) {
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