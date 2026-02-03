import { useState, useEffect } from 'react';
import styles from './ImageNav.module.css';

interface Props {
  onNext: () => void;
}

function ImageNav({ onNext }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const width = window.innerWidth;
      
      // Show if mouse is in the right 25% of the screen
      const isRightZone = e.clientX > width * 0.75;

      if (isRightZone) {
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
        className={styles.navButton}
        onClick={onNext}
        title="Next Image"
      >
        <span className={styles.arrow}>&rarr;</span>
      </button>
    </div>
  );
}

export default ImageNav;