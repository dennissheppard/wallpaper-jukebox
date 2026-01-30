import { useState, useEffect } from 'react';
import { ImageResult } from '../types';
import styles from './WallpaperDisplay.module.css';

interface Props {
  currentImage: ImageResult | null;
  nextImage: ImageResult | null;
}

function WallpaperDisplay({ currentImage, nextImage }: Props) {
  const [displayImage, setDisplayImage] = useState<ImageResult | null>(null);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (currentImage && currentImage !== displayImage) {
      // Start fade out
      setFadingOut(true);

      // After fade out completes, swap image and fade in
      const timeout = setTimeout(() => {
        setDisplayImage(currentImage);
        setFadingOut(false);
      }, 1500); // Match crossfade duration

      return () => clearTimeout(timeout);
    }
  }, [currentImage, displayImage]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.background} ${fadingOut ? styles.fadeOut : styles.fadeIn}`}
        style={{
          backgroundImage: displayImage ? `url(${displayImage.url})` : 'none',
        }}
      />

      {displayImage && (
        <div className={styles.attribution}>
          Photo by{' '}
          <a href={displayImage.photographerUrl} target="_blank" rel="noopener noreferrer">
            {displayImage.photographerName}
          </a>
          {' '}on{' '}
          <a href={displayImage.sourceUrl} target="_blank" rel="noopener noreferrer">
            {displayImage.sourceName}
          </a>
        </div>
      )}
    </div>
  );
}

export default WallpaperDisplay;
