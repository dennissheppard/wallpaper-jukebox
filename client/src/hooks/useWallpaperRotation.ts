import { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Settings, ImageResult, ImageSource } from '../types';
import { WeatherData } from '../types/weather';
import { getImageProvider } from '../providers';
import { getWeatherBasedTheme } from '../services/weatherService';

const PROVIDERS: ImageSource[] = ['pexels', 'pixabay', 'unsplash'];

// Creative fallback queries - visually interesting terms that always produce good images
const CREATIVE_FALLBACKS = [
  'golden hour landscape',
  'aurora borealis night',
  'misty forest morning',
  'ocean waves sunset',
  'desert dunes shadow',
  'neon city rain',
  'mountain lake reflection',
  'starry night sky',
  'autumn leaves path',
  'tropical paradise beach',
  'northern lights snow',
  'cherry blossom spring',
  'thunderstorm clouds',
  'underwater coral reef',
  'lavender field sunset',
  'foggy mountain peak',
  'wild flower meadow',
  'glacier ice blue',
  'savanna golden grass',
  'waterfall rainforest',
];

// Mood enhancer words to append to queries
const MOOD_ENHANCERS = ['landscape', 'scenery', 'view', 'sky', 'light', 'nature', 'aesthetic'];

// Generate query variations
function generateQueryVariations(originalQuery: string): string[] {
  const variations: string[] = [];
  const words = originalQuery.toLowerCase().split(' ').filter(w => w.length > 2);

  // Word swap (if multi-word)
  if (words.length >= 2) {
    variations.push([...words].reverse().join(' '));
  }

  // Add mood enhancers
  for (const enhancer of MOOD_ENHANCERS.slice(0, 3)) {
    if (!words.includes(enhancer)) {
      variations.push(`${originalQuery} ${enhancer}`);
    }
  }

  // Take first word only (more generic)
  if (words.length > 1) {
    variations.push(words[0]);
  }

  return variations;
}

// Get a random creative fallback, avoiding recently used ones
function getCreativeFallback(usedFallbacks: Set<string>): string {
  const available = CREATIVE_FALLBACKS.filter(q => !usedFallbacks.has(q));
  if (available.length === 0) {
    // All used, reset and pick random
    return CREATIVE_FALLBACKS[Math.floor(Math.random() * CREATIVE_FALLBACKS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

// Exclusion list configuration
const EXCLUSION_STORAGE_KEY = 'wallpaper-jukebox-excluded-images';
const EXCLUSION_EXPIRY_DAYS = 3;

interface ExcludedImage {
  id: string;
  timestamp: number;
}

// Load excluded images from localStorage, filtering out expired entries
function loadExcludedImages(): Set<string> {
  try {
    const stored = localStorage.getItem(EXCLUSION_STORAGE_KEY);
    if (!stored) return new Set();

    const entries: ExcludedImage[] = JSON.parse(stored);
    const now = Date.now();
    const expiryMs = EXCLUSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Filter out expired entries and save back
    const validEntries = entries.filter(entry => (now - entry.timestamp) < expiryMs);

    // If we filtered some out, save the cleaned list
    if (validEntries.length !== entries.length) {
      localStorage.setItem(EXCLUSION_STORAGE_KEY, JSON.stringify(validEntries));
      console.log(`[Wallpaper] Cleaned ${entries.length - validEntries.length} expired images from exclusion list`);
    }

    return new Set(validEntries.map(e => e.id));
  } catch (error) {
    console.error('[Wallpaper] Failed to load exclusion list:', error);
    return new Set();
  }
}

// Add images to the exclusion list in localStorage
function addToExclusionList(ids: string[]): void {
  try {
    const stored = localStorage.getItem(EXCLUSION_STORAGE_KEY);
    const entries: ExcludedImage[] = stored ? JSON.parse(stored) : [];
    const existingIds = new Set(entries.map(e => e.id));

    const now = Date.now();
    const newEntries = ids
      .filter(id => !existingIds.has(id))
      .map(id => ({ id, timestamp: now }));

    if (newEntries.length > 0) {
      const updated = [...entries, ...newEntries];
      localStorage.setItem(EXCLUSION_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('[Wallpaper] Failed to save to exclusion list:', error);
  }
}

interface WallpaperRotationOptions {
  onQueryChange?: (query: string) => void;
}

export function useWallpaperRotation(
  settings: Settings,
  weather: WeatherData | null,
  options?: WallpaperRotationOptions
) {
  const [currentImage, setCurrentImage] = useState<ImageResult | null>(null);
  const [nextImage, setNextImage] = useState<ImageResult | null>(null);
  const [imageQueue, setImageQueue] = useState<ImageResult[]>([]);
  const [exploringTheme, setExploringTheme] = useState<string | null>(null);
  const rotationTimerRef = useRef<number>();

  // Track page per provider
  const providerPagesRef = useRef<Record<string, number>>({
    pexels: 1,
    pixabay: 1,
    unsplash: 1
  });
  const providerIndexRef = useRef(0);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const excludedIdsRef = useRef<Set<string>>(loadExcludedImages());
  const activeQueryRef = useRef<string>('');
  const originalQueryRef = useRef<string>('');
  const triedVariationsRef = useRef<Set<string>>(new Set());
  const usedFallbacksRef = useRef<Set<string>>(new Set());
  const exhaustionAttemptsRef = useRef(0);
  const internalQueryUpdateRef = useRef<string | null>(null); // Track internal updates to avoid reset loops

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
        originalQueryRef.current = baseTheme;
        providerPagesRef.current = { pexels: 1, pixabay: 1, unsplash: 1 };
        providerIndexRef.current = 0;
        seenIdsRef.current.clear();
        triedVariationsRef.current.clear();
        usedFallbacksRef.current.clear();
        exhaustionAttemptsRef.current = 0;
        setExploringTheme(null);
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

      // Filter out seen images (session) and excluded images (persistent)
      let newImages = images.filter(img =>
        !seenIdsRef.current.has(img.id) && !excludedIdsRef.current.has(img.id)
      );

      // Strategy: If current query exhausted (no new images), try variations
      if (newImages.length === 0) {
        exhaustionAttemptsRef.current++;

        // Tier 1: Try query variations (word swap, mood enhancers)
        const variations = generateQueryVariations(originalQueryRef.current);
        const untriedVariation = variations.find(v => !triedVariationsRef.current.has(v));

        if (untriedVariation) {
          console.log(`[Wallpaper] Query exhausted. Trying variation: "${untriedVariation}"`);
          triedVariationsRef.current.add(untriedVariation);
          activeQueryRef.current = untriedVariation;
          providerPagesRef.current = { pexels: 1, pixabay: 1, unsplash: 1 };

          // Notify UI of query change (mark as internal to avoid reset)
          internalQueryUpdateRef.current = untriedVariation;
          options?.onQueryChange?.(untriedVariation);

          images = await provider.search(untriedVariation, undefined, undefined, undefined, 1);
          newImages = images.filter(img =>
            !seenIdsRef.current.has(img.id) && !excludedIdsRef.current.has(img.id)
          );
        }

        // Tier 2: If variations exhausted, use creative fallbacks
        if (newImages.length === 0) {
          const fallbackQuery = getCreativeFallback(usedFallbacksRef.current);
          usedFallbacksRef.current.add(fallbackQuery);

          console.log(`[Wallpaper] All variations exhausted. Exploring: "${fallbackQuery}"`);
          activeQueryRef.current = fallbackQuery;
          providerPagesRef.current = { pexels: 1, pixabay: 1, unsplash: 1 };

          // Notify UI of query change (mark as internal to avoid reset)
          internalQueryUpdateRef.current = fallbackQuery;
          options?.onQueryChange?.(fallbackQuery);

          // Show exploring notification
          setExploringTheme(fallbackQuery);

          images = await provider.search(fallbackQuery, undefined, undefined, undefined, 1);
          newImages = images.filter(img =>
            !seenIdsRef.current.has(img.id) && !excludedIdsRef.current.has(img.id)
          );

          // Clear exploring notification after a delay
          setTimeout(() => setExploringTheme(null), 5000);
        }
      }
      
      // Add to seen set (session) and exclusion list (persistent)
      const newIds = newImages.map(img => img.id);
      newIds.forEach(id => {
        seenIdsRef.current.add(id);
        excludedIdsRef.current.add(id);
      });
      addToExclusionList(newIds);

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
    // Skip reset if this was an internal query update (from variation/fallback)
    if (internalQueryUpdateRef.current === settings.customQuery) {
      internalQueryUpdateRef.current = null; // Clear the flag
      return;
    }

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

  const likeImage = useCallback(async () => {
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: window.devicePixelRatio || 1,
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wallpaper-jukebox-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }, []);

  return {
    currentImage,
    nextImage,
    rotateNow,
    likeImage,
    exploringTheme,
  };
}
