import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, ImageResult } from '../types';
import { WeatherData } from '../types/weather';
import { getImageProvider } from '../providers';
import { getWeatherBasedTheme } from '../services/weatherService';

export function useWallpaperRotation(settings: Settings, weather: WeatherData | null) {
  const [currentImage, setCurrentImage] = useState<ImageResult | null>(null);
  const [nextImage, setNextImage] = useState<ImageResult | null>(null);
  const [imageQueue, setImageQueue] = useState<ImageResult[]>([]);
  const rotationTimerRef = useRef<number>();

  const provider = getImageProvider(settings.source);

  // Fetch new images
  const fetchImages = useCallback(async () => {
    try {
      let searchTheme = settings.theme;

      // Priority 1: Custom search query
      if (settings.theme === 'custom' && settings.customQuery.trim()) {
        searchTheme = settings.customQuery.trim() as any;
      }
      // Priority 2: Weather-based theme
      else if (settings.weather.enabled && settings.weather.mode !== 'off' && weather) {
        const weatherQuery = await getWeatherBasedTheme(
          weather.condition,
          settings.weather.mode,
          weather.temperature,
          weather.temperatureUnit
        );
        if (weatherQuery) {
          searchTheme = weatherQuery as any; // Use custom weather-based query
        }
      }

      const images = await provider.search(searchTheme);
      setImageQueue(prev => [...prev, ...images].slice(0, 10)); // Keep max 10 in queue
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  }, [provider, settings.theme, settings.customQuery, settings.weather, weather]);

  // Preload next image
  useEffect(() => {
    if (imageQueue.length > 0 && !nextImage) {
      const next = imageQueue[0];
      setNextImage(next);

      // Preload the image
      const img = new Image();
      img.src = next.url;

      // If no current image, immediately show the first one
      if (!currentImage) {
        img.onload = () => {
          setCurrentImage(next);
          setImageQueue(prev => prev.slice(1));
          setNextImage(null);
        };
      }
    }
  }, [imageQueue, nextImage, currentImage]);

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

  // Clear queue and fetch new images when theme, source, custom query, or weather mode changes
  useEffect(() => {
    setImageQueue([]);
    setNextImage(null);
    setCurrentImage(null); // Force new image on settings change
    fetchImages();
  }, [settings.theme, settings.customQuery, settings.source, settings.weather.mode, fetchImages]);

  // Fetch images when queue is low
  useEffect(() => {
    if (imageQueue.length < 3) {
      fetchImages();
    }
  }, [imageQueue.length, fetchImages]);

  const likeImage = useCallback(() => {
    if (currentImage) {
      const liked = JSON.parse(localStorage.getItem('liked-images') || '[]');
      liked.push(currentImage.id);
      localStorage.setItem('liked-images', JSON.stringify(liked));
    }
  }, [currentImage]);

  return {
    currentImage,
    nextImage,
    rotateNow,
    likeImage,
  };
}
