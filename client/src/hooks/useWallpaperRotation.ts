import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, ImageResult, ImageSource } from '../types';
import { WeatherData } from '../types/weather';
import { getImageProvider } from '../providers';
import { getWeatherBasedTheme } from '../services/weatherService';

const PROVIDERS: ImageSource[] = ['pexels', 'pixabay', 'unsplash'];

export function useWallpaperRotation(settings: Settings, weather: WeatherData | null) {
  const [currentImage, setCurrentImage] = useState<ImageResult | null>(null);
  const [nextImage, setNextImage] = useState<ImageResult | null>(null);
  const [imageQueue, setImageQueue] = useState<ImageResult[]>([]);
  const rotationTimerRef = useRef<number>();
  
  // Track page per provider
  const providerPagesRef = useRef<Record<string, number>>({
    pexels: 1,
    pixabay: 1,
    unsplash: 1
  });
  const providerIndexRef = useRef(0);
  
  const seenIdsRef = useRef<Set<string>>(new Set());
  const activeQueryRef = useRef<string>('');

  // Fetch new images
  const fetchImages = useCallback(async (isNewSearch: boolean = false) => {
    try {
      // Determine the base theme/query from settings
      let baseTheme = settings.theme;

      // Priority 1: Custom search query
      if (settings.theme === 'custom' && settings.customQuery.trim()) {
        baseTheme = settings.customQuery.trim() as any;
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
          baseTheme = weatherQuery as any;
        }
      }

      // Initialize or reset on new search
      if (isNewSearch) {
        activeQueryRef.current = baseTheme;
        providerPagesRef.current = { pexels: 1, pixabay: 1, unsplash: 1 };
        providerIndexRef.current = 0;
        seenIdsRef.current.clear();
      }

      // Cycle through providers
      const currentSource = PROVIDERS[providerIndexRef.current % PROVIDERS.length];
      const provider = getImageProvider(currentSource);
      const currentPage = providerPagesRef.current[currentSource];
      
      // Prepare next index for next fetch
      providerIndexRef.current++;

      // Use the active query
      let currentQuery = activeQueryRef.current || baseTheme;

      // console.log(`[Wallpaper] Fetching from ${currentSource} (page ${currentPage}) for query: "${currentQuery}"`);

      let images = await provider.search(currentQuery, undefined, undefined, undefined, currentPage);
      
      // Filter out seen images
      let newImages = images.filter(img => !seenIdsRef.current.has(img.id));

      // Strategy: If current query exhausted (no new images), try varying the query
      if (newImages.length === 0) {
        const words = currentQuery.split(' ');
        
        // If we have multiple words, drop the first one to shift focus
        if (words.length > 1) {
          const newQuery = words.slice(1).join(' ');
          // console.log(`[Wallpaper] Query "${currentQuery}" exhausted on ${currentSource}. Switching to "${newQuery}".`);
          
          // Update state for this and future fetches
          activeQueryRef.current = newQuery;
          // Reset pages for ALL providers since query changed
          providerPagesRef.current = { pexels: 1, pixabay: 1, unsplash: 1 };
          
          // Retry immediately with new query using same provider (to keep rotation order or just consistency)
          images = await provider.search(newQuery, undefined, undefined, undefined, 1);
          newImages = images.filter(img => !seenIdsRef.current.has(img.id));
        }
      }

      // If STILL no images found and it's page 1 (absolute failure of query)
      if (newImages.length === 0 && currentPage === 1 && activeQueryRef.current.split(' ').length <= 1) {
        // console.warn(`[Wallpaper] No results for query "${currentQuery}". Falling back to "abstract".`);
        // Fallback to Pexels 'abstract' as a safe bet
        images = await getImageProvider('pexels').search('abstract', undefined, undefined, undefined, 1);
        newImages = images.filter(img => !seenIdsRef.current.has(img.id));
      }
      
      // Add to seen set
      newImages.forEach(img => seenIdsRef.current.add(img.id));

      if (newImages.length > 0) {
        // Log tags for debugging
        /*
        newImages.forEach(img => {
          if (img.tags && img.tags.length > 0) {
            console.log(`[Wallpaper] Image ${img.id} (${img.sourceName}) tags:`, img.tags.join(', '));
          }
        });
        */

        setImageQueue(prev => {
          const combined = [...prev, ...newImages];
          return combined.slice(0, 15);
        });
        
        // Increment page for the provider that succeeded
        providerPagesRef.current[currentSource]++;
      } else {
        // console.log(`No new images found from ${currentSource} for query:`, currentQuery);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  }, [settings.theme, settings.customQuery, settings.weather, weather]); // Removed provider/source dependency

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
      /*
      if (nextImage.tags && nextImage.tags.length > 0) {
        console.log(`[Wallpaper] Rotating to image with tags:`, nextImage.tags.join(', '));
      }
      */
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
    fetchImages(true); // Pass true for new search
  }, [settings.theme, settings.customQuery, settings.source, settings.weather.mode, fetchImages]);

  // Fetch images when queue is low
  useEffect(() => {
    if (imageQueue.length < 3) {
      fetchImages(false); // More images for current search
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
