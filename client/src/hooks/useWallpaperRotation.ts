import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, ImageResult } from '../types';
import { getImageProvider } from '../providers';

export function useWallpaperRotation(settings: Settings) {
  const [currentImage, setCurrentImage] = useState<ImageResult | null>(null);
  const [nextImage, setNextImage] = useState<ImageResult | null>(null);
  const [imageQueue, setImageQueue] = useState<ImageResult[]>([]);
  const rotationTimerRef = useRef<number>();

  const provider = getImageProvider(settings.source);

  // Fetch new images
  const fetchImages = useCallback(async () => {
    try {
      const images = await provider.search(settings.theme);
      setImageQueue(prev => [...prev, ...images].slice(0, 10)); // Keep max 10 in queue
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  }, [provider, settings.theme]);

  // Preload next image
  useEffect(() => {
    if (imageQueue.length > 0 && !nextImage) {
      const next = imageQueue[0];
      setNextImage(next);

      // Preload the image
      const img = new Image();
      img.src = next.url;
    }
  }, [imageQueue, nextImage]);

  // Rotate to next image
  const rotateNow = useCallback(() => {
    if (nextImage) {
      setCurrentImage(nextImage);
      setImageQueue(prev => prev.slice(1));
      setNextImage(null);
    }
  }, [nextImage]);

  // Set up rotation timer
  useEffect(() => {
    if (settings.rotationInterval === 0) return; // Manual only

    const interval = settings.rotationInterval * 1000;
    rotationTimerRef.current = window.setInterval(rotateNow, interval);

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [settings.rotationInterval, rotateNow]);

  // Fetch images when queue is low
  useEffect(() => {
    if (imageQueue.length < 3) {
      fetchImages();
    }
  }, [imageQueue.length, fetchImages]);

  // Initialize with first image
  useEffect(() => {
    if (!currentImage && imageQueue.length === 0) {
      fetchImages();
    }
  }, [currentImage, imageQueue.length, fetchImages]);

  const likeImage = useCallback(() => {
    if (currentImage) {
      const liked = JSON.parse(localStorage.getItem('liked-images') || '[]');
      liked.push(currentImage.id);
      localStorage.setItem('liked-images', JSON.stringify(liked));
    }
  }, [currentImage]);

  const skipImage = useCallback(() => {
    rotateNow();
  }, [rotateNow]);

  return {
    currentImage,
    nextImage,
    rotateNow,
    likeImage,
    skipImage,
  };
}
