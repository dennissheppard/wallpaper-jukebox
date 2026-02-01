import { useState, useEffect } from 'react';
import { ImageResult } from '../types';
import styles from './WallpaperDisplay.module.css';

interface Props {
  currentImage: ImageResult | null;
  nextImage: ImageResult | null;
}

function WallpaperDisplay({ currentImage, nextImage }: Props) {
  const [primaryImage, setPrimaryImage] = useState<ImageResult | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<ImageResult | null>(null);
  const [showPrimary, setShowPrimary] = useState(true);

  useEffect(() => {
    if (!currentImage) return;

    // First image - just set it
    if (!primaryImage && !secondaryImage) {
      setPrimaryImage(currentImage);
      setShowPrimary(true);
      return;
    }

    // Subsequent images - crossfade
    if (currentImage !== primaryImage && currentImage !== secondaryImage) {
      // Load new image into the inactive layer
      if (showPrimary) {
        setSecondaryImage(currentImage);
        // Wait a moment for image to load, then crossfade
        setTimeout(() => setShowPrimary(false), 100);
      } else {
        setPrimaryImage(currentImage);
        setTimeout(() => setShowPrimary(true), 100);
      }
    }
  }, [currentImage, primaryImage, secondaryImage, showPrimary]);

  return (
    <div className={styles.container}>
      {/* Primary layer */}
      <div
        className={`${styles.background} ${styles.primary} ${showPrimary ? styles.visible : styles.hidden}`}
        style={{
          backgroundImage: primaryImage ? `url(${primaryImage.url})` : 'none',
        }}
      />

      {/* Secondary layer */}
      <div
        className={`${styles.background} ${styles.secondary} ${!showPrimary ? styles.visible : styles.hidden}`}
        style={{
          backgroundImage: secondaryImage ? `url(${secondaryImage.url})` : 'none',
        }}
      />

      {/* Attribution for currently visible image */}
      {currentImage && (
        <div className={styles.attribution}>
          Photo by{' '}
          <a href={currentImage.photographerUrl} target="_blank" rel="noopener noreferrer">
            {currentImage.photographerName}
          </a>
          {' '}on{' '}
          <a href={currentImage.sourceUrl} target="_blank" rel="noopener noreferrer">
            {currentImage.sourceName}
          </a>
        </div>
      )}
    </div>
  );
}

export default WallpaperDisplay;
