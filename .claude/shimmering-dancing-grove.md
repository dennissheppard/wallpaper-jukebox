# Shazam Music Recognition Integration - Implementation Guide

## Overview

This guide provides a complete implementation plan for integrating Shazam music recognition API into the Wallpaper Jukebox web application. When complete, users will be able to recognize currently playing music through their browser's microphone, and the app will automatically change wallpapers to match the song's mood, genre, or title.

## Architecture Summary

**Flow**: Browser Microphone → Audio Capture (5s) → Base64 Encode → Backend API → Shazam RapidAPI → Music Metadata → Theme Mapping → Wallpaper Search Query → Image Provider → Wallpaper Change

**Pattern**: Follows existing codebase patterns:
- Backend: Route + Service separation (like weather/images)
- Frontend: Custom hook + localStorage persistence (like useWeather + useSettings)
- UI: Accordion section with pill toggles (like weather settings)

**Key Decision**: User-controlled recognition (manual button + optional auto-mode) to optimize API usage (250 free requests/month on RapidAPI, scales to 50k for $10/month)

## Prerequisites

1. **RapidAPI Account Setup**
   - Sign up at https://rapidapi.com
   - Subscribe to "Shazam API" by shazam-api25 (free tier: 250 requests/month, $10 for 50k/month)
   - Get API key from dashboard

2. **Environment Variable**
   - Add to `.env`: `RAPIDAPI_KEY=your_shazam_api_key_here`
   - The host is hardcoded: `shazam-api25.p.rapidapi.com`

3. **Browser Requirements**
   - Requires HTTPS or localhost (for microphone access)
   - MediaRecorder API support (Chrome 47+, Firefox 25+, Safari 14.1+)

## Implementation Steps

### Phase 1: Backend Foundation

#### Step 1.1: Create Music Recognition Service

**File**: `server/src/services/musicRecognitionService.ts`

```typescript
import FormData from 'form-data';

// Response structure from shazam-api25
interface ShazamTrack {
  title: string;
  subtitle: string; // artist
  genres?: { primary: string };
  images?: {
    coverart?: string;
  };
}

interface ShazamAPIResponse {
  track?: ShazamTrack;
}

export interface MusicMetadata {
  title: string;
  artist: string;
  genre: string;
  albumArt?: string;
}

/**
 * Recognize music from an audio buffer using Shazam API (shazam-api25)
 * @param audioBuffer - Raw audio buffer from the uploaded file
 * @param filename - Original filename (for MIME type detection)
 */
export async function recognizeMusic(audioBuffer: Buffer, filename: string = 'audio.webm'): Promise<MusicMetadata | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = 'shazam-api25.p.rapidapi.com';

  if (!apiKey) {
    console.error('RAPIDAPI_KEY not configured');
    throw new Error('API key not configured');
  }

  try {
    // Create FormData with the audio file
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename,
      contentType: getContentType(filename),
    });

    const response = await fetch(`https://${apiHost}/tracks/recognize`, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (response.status === 401) {
      throw new Error('Invalid API key');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(`Shazam API error: ${response.status}`);
    }

    const data: ShazamAPIResponse = await response.json();

    // No track detected
    if (!data.track) {
      return null;
    }

    return {
      title: data.track.title,
      artist: data.track.subtitle,
      genre: data.track.genres?.primary || 'unknown',
      albumArt: data.track.images?.coverart,
    };
  } catch (error) {
    console.error('Music recognition error:', error);
    throw error;
  }
}

/**
 * Get MIME content type from filename
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'webm': 'audio/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'mp4': 'audio/mp4',
  };
  return mimeTypes[ext || ''] || 'audio/webm';
}
```

**Key Points**:
- Uses FormData file upload (not base64 encoding)
- Sends audio buffer directly to shazam-api25.p.rapidapi.com
- Returns `null` if no music detected (not an error)
- Throws errors for API issues (401, 429, 500)
- Follows same pattern as `weatherService.ts`

#### Step 1.2: Create Music-to-Theme Mapping Service

**File**: `server/src/services/musicThemeMappingService.ts`

```typescript
import { MusicMetadata } from './musicRecognitionService';

export type MappingMode = 'literal' | 'mood' | 'genre';

// Genre to visual theme mappings
const GENRE_THEMES: Record<string, string> = {
  rock: 'electric energy concert lights dramatic',
  alternative: 'grunge urban raw edgy',
  metal: 'dark stormy dramatic power industrial',
  'heavy metal': 'fire lightning dark intense',

  pop: 'colorful bright vibrant cheerful',
  'k-pop': 'neon lights vibrant energetic colorful',
  'dance pop': 'party lights colorful energetic',

  electronic: 'neon lights cyberpunk futuristic abstract',
  edm: 'festival lights colorful energy',
  techno: 'minimal geometric neon dark',
  'drum and bass': 'urban neon fast energy',
  dubstep: 'dark bass heavy intense',

  'hip-hop': 'urban street graffiti city',
  rap: 'urban concrete city night',
  trap: 'dark urban moody atmospheric',

  jazz: 'smoky club vintage noir elegant',
  blues: 'moody atmospheric vintage soulful',
  soul: 'warm vintage golden emotional',
  funk: 'groovy colorful retro vibrant',

  classical: 'orchestra elegant timeless sophisticated',
  piano: 'minimal elegant peaceful refined',
  instrumental: 'atmospheric cinematic elegant',

  folk: 'forest acoustic nature organic earthy',
  country: 'rural sunset countryside natural',
  'indie folk': 'vintage nature atmospheric forest',

  indie: 'vintage film grain atmospheric moody',
  'indie rock': 'raw urban atmospheric vintage',

  reggae: 'tropical beach sunshine relaxed',
  ska: 'vibrant energetic colorful fun',

  ambient: 'minimal calm serene ethereal peaceful',
  chillout: 'calm sunset peaceful relaxing',
  lounge: 'sophisticated calm elegant modern',

  punk: 'raw urban gritty rebellious',
  emo: 'moody dark emotional atmospheric',

  rnb: 'smooth urban night moody',
  'r&b': 'smooth urban night sophisticated',

  latin: 'colorful vibrant festive energetic',
  salsa: 'vibrant colorful dance energy',

  unknown: 'abstract colorful atmospheric',
};

// Mood keywords for title/artist analysis
const MOOD_KEYWORDS = {
  calm: ['calm', 'peace', 'quiet', 'soft', 'gentle', 'lullaby', 'sleep', 'rest'],
  energetic: ['energy', 'power', 'fast', 'run', 'dance', 'party', 'wild', 'crazy'],
  dark: ['dark', 'black', 'night', 'shadow', 'devil', 'hell', 'death', 'pain'],
  bright: ['bright', 'light', 'sun', 'shine', 'day', 'gold', 'yellow', 'white'],
  sad: ['sad', 'cry', 'tear', 'hurt', 'pain', 'lost', 'alone', 'empty'],
  happy: ['happy', 'joy', 'smile', 'laugh', 'fun', 'celebrate', 'love', 'good'],
  nature: ['forest', 'tree', 'mountain', 'river', 'ocean', 'sea', 'sky', 'earth'],
  urban: ['city', 'street', 'urban', 'downtown', 'concrete', 'building', 'lights'],
  romantic: ['love', 'heart', 'kiss', 'romance', 'forever', 'together', 'you'],
};

function detectMoodFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedMoods: string[] = [];

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedMoods.push(mood);
    }
  }

  return detectedMoods;
}

function getMoodTheme(moods: string[]): string {
  const moodThemes: Record<string, string> = {
    calm: 'peaceful serene calm nature soft light',
    energetic: 'dynamic colorful vibrant energy powerful',
    dark: 'dark moody dramatic stormy night',
    bright: 'bright sunny golden light cheerful',
    sad: 'moody atmospheric gray rain melancholic',
    happy: 'colorful bright vibrant cheerful sunny',
    nature: 'forest mountains natural landscape organic',
    urban: 'city urban lights architecture modern',
    romantic: 'warm soft romantic sunset dreamy',
  };

  // Return first detected mood theme, or generic
  return moods.length > 0 ? moodThemes[moods[0]] : '';
}

export function generateWallpaperQuery(music: MusicMetadata, mode: MappingMode = 'mood'): string {
  const genre = music.genre.toLowerCase();

  switch (mode) {
    case 'literal':
      // Use song title + artist as search
      // Extract meaningful words (skip common words)
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const titleWords = music.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word));

      return titleWords.slice(0, 4).join(' ') || GENRE_THEMES[genre] || 'abstract colorful';

    case 'mood':
      // Detect mood from title and artist
      const textToAnalyze = `${music.title} ${music.artist}`;
      const moods = detectMoodFromText(textToAnalyze);
      const moodTheme = getMoodTheme(moods);

      if (moodTheme) {
        return moodTheme;
      }

      // Fallback to genre if no mood detected
      return GENRE_THEMES[genre] || 'abstract atmospheric colorful';

    case 'genre':
    default:
      // Direct genre mapping
      return GENRE_THEMES[genre] || 'abstract colorful atmospheric';
  }
}
```

**Key Points**:
- Three mapping modes: literal (song title), mood (emotional analysis), genre (direct mapping)
- Extensive genre → visual theme mappings (30+ genres)
- Mood detection from title/artist keywords
- Fallback to genre if mood detection fails

#### Step 1.3: Create Music Routes

**File**: `server/src/routes/music.ts`

```typescript
import express from 'express';
import multer from 'multer';
import { recognizeMusic } from '../services/musicRecognitionService';
import { generateWallpaperQuery, MappingMode } from '../services/musicThemeMappingService';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedTypes = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

router.post('/recognize', upload.single('audio'), async (req, res) => {
  try {
    const mappingMode = (req.body.mappingMode as MappingMode) || 'mood';

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Recognize music using the uploaded file buffer
    const music = await recognizeMusic(req.file.buffer, req.file.originalname);

    if (!music) {
      return res.json({ detected: false });
    }

    // Generate wallpaper query
    const wallpaperQuery = generateWallpaperQuery(music, mappingMode);

    res.json({
      detected: true,
      track: music,
      wallpaperQuery,
    });

  } catch (error: any) {
    console.error('Music recognition error:', error);

    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: 'API rate limit exceeded. Try again later.' });
    }

    if (error.message.includes('Invalid API key')) {
      return res.status(500).json({ error: 'API configuration error' });
    }

    res.status(500).json({ error: 'Failed to recognize music' });
  }
});

export default router;
```

**Key Points**:
- POST `/api/music/recognize` endpoint with file upload
- Uses multer middleware for multipart/form-data handling
- Accepts audio file in 'audio' field
- Optional 'mappingMode' field in form data
- Returns `{ detected: false }` if no music found
- Proper HTTP status codes (400, 429, 500)

**Required npm package**:
```bash
npm install multer
npm install -D @types/multer  # TypeScript types
```

#### Step 1.4: Register Routes in Main Server

**File**: `server/src/index.ts`

**Modify**: Add music routes import and mounting

```typescript
// Add import at top
import musicRoutes from './routes/music';

// Add route mounting (after other routes)
app.use('/api/music', musicRoutes);
```

**Location**: After line with `app.use('/api/weather', weatherRoutes);`

### Phase 2: Frontend Audio Capture

#### Step 2.1: Create Audio Capture Utility

**File**: `client/src/utils/audioCapture.ts`

```typescript
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately (we just wanted permission)
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Capture audio from microphone and return as Blob
 * @param durationMs - Recording duration in milliseconds (default 5 seconds)
 * @returns Audio Blob or null if capture failed
 */
export async function captureAudio(durationMs: number = 5000): Promise<Blob | null> {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // Mono
        sampleRate: 44100,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });

    const audioChunks: Blob[] = [];

    return new Promise<Blob | null>((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        try {
          // Create blob from chunks and return directly (no base64 encoding needed)
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        } catch (error) {
          console.error('Audio processing error:', error);
          resolve(null);
        }
      };

      mediaRecorder.onerror = (error) => {
        stream.getTracks().forEach(track => track.stop());
        console.error('MediaRecorder error:', error);
        reject(error);
      };

      // Start recording
      mediaRecorder.start();

      // Stop after duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationMs);
    });
  } catch (error) {
    console.error('Microphone access error:', error);
    return null;
  }
}
```

**Key Points**:
- Requests mono audio with noise suppression
- Records for specified duration (default 5 seconds)
- Returns Blob directly (no base64 encoding needed - we send as file upload)
- Properly stops media tracks to release microphone

### Phase 3: Frontend Service Layer

#### Step 3.1: Create TypeScript Types

**File**: `client/src/types/music.ts`

```typescript
export interface MusicMetadata {
  title: string;
  artist: string;
  genre: string;
  albumArt?: string;
}

export type MusicMappingMode = 'literal' | 'mood' | 'genre';

export interface MusicSettings {
  enabled: boolean;
  autoRecognize: boolean;
  autoInterval: number; // seconds, 0 = manual only
  mappingMode: MusicMappingMode;
  overrideTheme: boolean;
}

export interface RecognitionResult {
  detected: boolean;
  track?: MusicMetadata;
  wallpaperQuery?: string;
}
```

#### Step 3.2: Extend Settings Type

**File**: `client/src/types/index.ts`

**Modify**: Add music property to Settings interface

```typescript
export interface Settings {
  theme: Theme;
  customQuery: string;
  rotationInterval: RotationInterval;
  source: ImageSource;
  showClock: boolean;
  enableSpotify: boolean;
  crossfadeDuration: number;
  weather: {
    enabled: boolean;
    mode: WeatherMode;
    usePreciseLocation: boolean;
    temperatureUnit: 'C' | 'F';
  };
  // ADD THIS:
  music: {
    enabled: boolean;
    autoRecognize: boolean;
    autoInterval: number;
    mappingMode: 'literal' | 'mood' | 'genre';
    overrideTheme: boolean;
  };
}
```

#### Step 3.3: Update Default Settings

**File**: `client/src/hooks/useSettings.ts`

**Modify**: Add music defaults to DEFAULT_SETTINGS

```typescript
const DEFAULT_SETTINGS: Settings = {
  theme: 'nature',
  customQuery: '',
  rotationInterval: 60,
  source: 'pexels',
  showClock: true,
  enableSpotify: false,
  crossfadeDuration: 1500,
  weather: {
    enabled: false,
    mode: 'off',
    usePreciseLocation: false,
    temperatureUnit: 'F',
  },
  // ADD THIS:
  music: {
    enabled: false,
    autoRecognize: false,
    autoInterval: 0,
    mappingMode: 'mood',
    overrideTheme: true,
  },
};
```

**Also modify** the loadSettings function to handle deep merge for music (similar to weather):

```typescript
const loadSettings = (): Settings => {
  try {
    const stored = localStorage.getItem('wallpaper-jukebox-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        weather: { ...DEFAULT_SETTINGS.weather, ...parsed.weather },
        music: { ...DEFAULT_SETTINGS.music, ...parsed.music }, // ADD THIS LINE
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
};
```

#### Step 3.4: Create Music Service

**File**: `client/src/services/musicService.ts`

```typescript
import { RecognitionResult, MusicMappingMode } from '../types/music';

const STORAGE_KEY = 'music-api-usage';
const USAGE_LIMIT = 250; // Free tier: 250/month, $10 for 50k/month

interface UsageData {
  count: number;
  month: string; // Format: 'YYYY-MM'
}

/**
 * Send audio blob to backend for music recognition
 * @param audioBlob - Audio blob from microphone capture
 * @param mappingMode - How to map music to wallpaper query
 */
export async function recognizeMusic(
  audioBlob: Blob,
  mappingMode: MusicMappingMode
): Promise<RecognitionResult> {
  // Create FormData with the audio file
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('mappingMode', mappingMode);

  const response = await fetch('/api/music/recognize', {
    method: 'POST',
    body: formData, // No Content-Type header - browser sets it with boundary
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('API rate limit exceeded');
    }
    throw new Error('Failed to recognize music');
  }

  return response.json();
}

export function getApiUsageCount(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return 0;

  try {
    const data: UsageData = JSON.parse(stored);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Reset if new month
    if (data.month !== currentMonth) {
      resetApiUsageCount();
      return 0;
    }

    return data.count;
  } catch {
    return 0;
  }
}

export function incrementApiUsage(): void {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const count = getApiUsageCount() + 1;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count, month: currentMonth })
  );
}

export function resetApiUsageCount(): void {
  const currentMonth = new Date().toISOString().slice(0, 7);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count: 0, month: currentMonth })
  );
}

export function isNearUsageLimit(): boolean {
  return getApiUsageCount() >= USAGE_LIMIT * 0.9; // 90% threshold
}

export function hasExceededUsageLimit(): boolean {
  return getApiUsageCount() >= USAGE_LIMIT;
}
```

### Phase 4: Frontend State Management

#### Step 4.1: Create Music Recognition Hook

**File**: `client/src/hooks/useMusicRecognition.ts`

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import { MusicMetadata, MusicSettings } from '../types/music';
import { captureAudio, requestMicrophonePermission } from '../utils/audioCapture';
import {
  recognizeMusic,
  getApiUsageCount,
  incrementApiUsage,
  hasExceededUsageLimit,
} from '../services/musicService';

export function useMusicRecognition(settings: MusicSettings) {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastTrack, setLastTrack] = useState<MusicMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [apiUsage, setApiUsage] = useState(getApiUsageCount());

  const lastRecognitionTime = useRef<number>(0);

  // Check microphone permission on mount
  useEffect(() => {
    if (settings.enabled) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          setPermissionGranted(result.state === 'granted');
        })
        .catch(() => {
          // Permissions API not supported, assume unknown
          setPermissionGranted(null);
        });
    }
  }, [settings.enabled]);

  const requestPermission = useCallback(async () => {
    const granted = await requestMicrophonePermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  const recognizeNow = useCallback(async (): Promise<string | null> => {
    // Check if disabled
    if (!settings.enabled) {
      return null;
    }

    // Check rate limiting (prevent rapid-fire calls)
    const now = Date.now();
    if (now - lastRecognitionTime.current < 30000) {
      setError('Please wait 30 seconds between recognitions');
      return null;
    }

    // Check API usage limit
    if (hasExceededUsageLimit()) {
      setError('Monthly API limit reached (250/250). Resets next month.');
      return null;
    }

    setIsRecording(true);
    setError(null);
    lastRecognitionTime.current = now;

    try {
      // Capture audio (returns Blob)
      const audioBlob = await captureAudio(5000);

      if (!audioBlob) {
        setError('Failed to capture audio. Check microphone permissions.');
        setIsRecording(false);
        return null;
      }

      setIsRecording(false);
      setIsRecognizing(true);

      // Recognize music (send Blob via FormData)
      const result = await recognizeMusic(audioBlob, settings.mappingMode);

      if (!result.detected) {
        setError('No music detected. Try increasing volume or moving closer.');
        setIsRecognizing(false);
        return null;
      }

      // Success
      incrementApiUsage();
      setApiUsage(getApiUsageCount());
      setLastTrack(result.track!);
      setError(null);
      setIsRecognizing(false);

      return result.wallpaperQuery || null;
    } catch (err: any) {
      console.error('Recognition error:', err);
      setError(err.message || 'Failed to recognize music');
      setIsRecording(false);
      setIsRecognizing(false);
      return null;
    }
  }, [settings.enabled, settings.mappingMode]);

  // Auto-recognize on interval (if enabled)
  useEffect(() => {
    if (!settings.enabled || !settings.autoRecognize || settings.autoInterval === 0) {
      return;
    }

    const interval = setInterval(() => {
      recognizeNow();
    }, settings.autoInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.enabled, settings.autoRecognize, settings.autoInterval, recognizeNow]);

  return {
    isRecording,
    isRecognizing,
    lastTrack,
    error,
    permissionGranted,
    apiUsage,
    requestPermission,
    recognizeNow,
  };
}
```

**Key Points**:
- Manages all music recognition state
- Handles recording, API calls, errors
- Auto-recognition with interval support
- Rate limiting (30s between calls)
- API usage tracking

### Phase 5: UI Integration

#### Step 5.1: Integrate Hook in App Component

**File**: `client/src/App.tsx`

**Modify**: Add music recognition hook and handlers

```typescript
// Add import
import { useMusicRecognition } from './hooks/useMusicRecognition';

// Inside App component, after existing hooks:
const {
  isRecording,
  isRecognizing,
  lastTrack,
  error: musicError,
  permissionGranted,
  apiUsage,
  requestPermission,
  recognizeNow,
} = useMusicRecognition(settings.music);

// Add handler for music recognition
const handleRecognizeMusic = useCallback(async () => {
  const query = await recognizeNow();
  if (query) {
    // Update wallpaper with music-based query
    updateSettings({ customQuery: query, theme: 'custom' });
  }
}, [recognizeNow, updateSettings]);

// Pass to ControlsHUD (add to existing props):
<ControlsHUD
  settings={settings}
  onSettingsChange={updateSettings}
  onNext={rotateNow}
  onLike={likeImage}
  controlsVisible={controlsVisible}
  onRequestWeatherLocation={requestPreciseLocation}
  // ADD THESE:
  musicState={{
    isRecording,
    isRecognizing,
    lastTrack,
    error: musicError,
    permissionGranted,
    apiUsage,
  }}
  onRecognizeMusic={handleRecognizeMusic}
  onRequestMicPermission={requestPermission}
/>
```

#### Step 5.2: Update ControlsHUD Component

**File**: `client/src/components/ControlsHUD.tsx`

**Step 5.2a**: Update Props Interface

```typescript
// Add to imports
import { MusicMetadata } from '../types/music';

// Update Props interface
interface Props {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onNext: () => void;
  onLike: () => void;
  controlsVisible: boolean;
  onRequestWeatherLocation: () => void;
  // ADD THESE:
  musicState: {
    isRecording: boolean;
    isRecognizing: boolean;
    lastTrack: MusicMetadata | null;
    error: string | null;
    permissionGranted: boolean | null;
    apiUsage: number;
  };
  onRecognizeMusic: () => void;
  onRequestMicPermission: () => void;
}
```

**Step 5.2b**: Replace Music Settings Section

Find the "Music Settings" section (around line 239-245) and replace with:

```tsx
<AccordionSection
  title="Music Settings"
  isOpen={openSection === 'music'}
  onToggle={() => setOpenSection(openSection === 'music' ? '' : 'music')}
>
  <PillToggle
    checked={settings.music.enabled}
    onChange={(checked) =>
      onSettingsChange({
        music: { ...settings.music, enabled: checked },
      })
    }
    label="Enable Music Recognition"
  />

  {settings.music.enabled && (
    <>
      {/* Permission Warning */}
      {musicState.permissionGranted === false && (
        <div className={styles.warning}>
          <span>⚠️ Microphone permission required</span>
          <button
            className={styles.permissionBtn}
            onClick={onRequestMicPermission}
          >
            Grant Permission
          </button>
        </div>
      )}

      {/* Manual Recognition Button */}
      <div className={styles.control}>
        <button
          className={`${styles.recognizeBtn} ${
            (musicState.isRecording || musicState.isRecognizing) ? styles.recognizeBtnActive : ''
          }`}
          onClick={onRecognizeMusic}
          disabled={
            musicState.isRecording ||
            musicState.isRecognizing ||
            musicState.permissionGranted === false ||
            musicState.apiUsage >= 250
          }
        >
          {musicState.isRecording && '🎤 Listening...'}
          {musicState.isRecognizing && '🔍 Recognizing...'}
          {!musicState.isRecording && !musicState.isRecognizing && '🎵 Recognize Music Now'}
        </button>
      </div>

      {/* Error Message */}
      {musicState.error && (
        <div className={styles.errorMessage}>
          {musicState.error}
        </div>
      )}

      {/* Last Recognized Track */}
      {musicState.lastTrack && (
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>{musicState.lastTrack.title}</div>
          <div className={styles.trackArtist}>{musicState.lastTrack.artist}</div>
          <div className={styles.trackGenre}>{musicState.lastTrack.genre}</div>
        </div>
      )}

      {/* Auto-Recognition Toggle */}
      <PillToggle
        checked={settings.music.autoRecognize}
        onChange={(checked) =>
          onSettingsChange({
            music: { ...settings.music, autoRecognize: checked },
          })
        }
        label="Auto-Recognize"
      />

      {settings.music.autoRecognize && (
        <div className={styles.control}>
          <label>Auto Interval</label>
          <CustomSelect
            value={settings.music.autoInterval}
            onChange={(value) =>
              onSettingsChange({
                music: { ...settings.music, autoInterval: Number(value) },
              })
            }
            options={[
              { value: 60, label: '1 minute' },
              { value: 180, label: '3 minutes' },
              { value: 300, label: '5 minutes' },
              { value: 600, label: '10 minutes' },
              { value: 0, label: 'Manual only' },
            ]}
          />
          <div className={styles.note}>
            ⚠️ Auto-recognize uses API calls
          </div>
        </div>
      )}

      {/* Mapping Mode */}
      <div className={styles.control}>
        <label>Mapping Mode</label>
        <CustomSelect
          value={settings.music.mappingMode}
          onChange={(value) =>
            onSettingsChange({
              music: { ...settings.music, mappingMode: value as any },
            })
          }
          options={[
            { value: 'mood', label: 'Mood-Based' },
            { value: 'genre', label: 'Genre-Based' },
            { value: 'literal', label: 'Literal (Song Title)' },
          ]}
        />
        <div className={styles.note}>
          How music influences wallpaper selection
        </div>
      </div>

      {/* Theme Override Toggle */}
      <PillToggle
        checked={settings.music.overrideTheme}
        onChange={(checked) =>
          onSettingsChange({
            music: { ...settings.music, overrideTheme: checked },
          })
        }
        label="Override Other Themes"
      />
      {settings.music.overrideTheme && (
        <div className={styles.note}>
          Music will override weather and manual themes
        </div>
      )}

      {/* API Usage Display */}
      {musicState.apiUsage >= 225 && (
        <div className={styles.warning}>
          ⚠️ API limit warning: {musicState.apiUsage}/250 used this month
        </div>
      )}
      {musicState.apiUsage < 225 && (
        <div className={styles.note}>
          API usage: {musicState.apiUsage}/250 this month
        </div>
      )}
    </>
  )}
</AccordionSection>
```

#### Step 5.3: Add CSS Styles

**File**: `client/src/components/ControlsHUD.module.css`

Add these styles at the end of the file:

```css
/* Music Recognition Styles */
.recognizeBtn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.recognizeBtn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.recognizeBtn:active:not(:disabled) {
  transform: translateY(0);
}

.recognizeBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recognizeBtnActive {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.trackInfo {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.trackTitle {
  font-size: 15px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.trackArtist {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.trackGenre {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: capitalize;
}

.warning {
  background: rgba(255, 165, 0, 0.15);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
  color: #ffb84d;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.permissionBtn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.permissionBtn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.errorMessage {
  background: rgba(255, 99, 71, 0.15);
  border: 1px solid rgba(255, 99, 71, 0.3);
  border-radius: 8px;
  padding: 10px;
  color: #ff6347;
  font-size: 13px;
  margin-top: 8px;
}
```

### Phase 6: Testing

#### Manual Testing Checklist

1. **Microphone Permission Flow**
   - [ ] Deny permission → warning shows
   - [ ] Grant permission button works
   - [ ] Grant permission → warning disappears

2. **Music Recognition**
   - [ ] Play upbeat pop song → click "Recognize Music Now" → wallpaper changes to bright/colorful
   - [ ] Play calm/ambient music → wallpaper changes to peaceful/serene
   - [ ] Silent room → "No music detected" error shows
   - [ ] Background noise only → appropriate error message

3. **Mapping Modes**
   - [ ] Mood mode: "Sad" song → gray/moody wallpapers
   - [ ] Genre mode: Electronic music → neon/cyberpunk wallpapers
   - [ ] Literal mode: Song with "ocean" in title → ocean wallpapers

4. **Auto-Recognition**
   - [ ] Enable auto-recognize with 1 minute interval
   - [ ] Music changes → wallpaper updates automatically
   - [ ] Disable → stops auto-recognizing

5. **API Usage Tracking**
   - [ ] Usage counter increments with each recognition
   - [ ] Warning appears at 225+ uses (90% of 250 limit)
   - [ ] Recognition disabled at 250 uses

6. **Theme Override**
   - [ ] Enable weather + music with override ON → music wins
   - [ ] Override OFF → weather still affects wallpapers
   - [ ] Custom query + music → music query used

7. **Error Handling**
   - [ ] No internet → "Connection failed" error
   - [ ] Invalid API key → appropriate error
   - [ ] Rapid clicks → rate limit message (30s delay)

### Verification Steps

1. **Check Backend**
   ```bash
   # Test recognize endpoint
   curl -X POST http://localhost:3003/api/music/recognize \
     -H "Content-Type: application/json" \
     -d '{"audioBase64":"test","mappingMode":"mood"}'

   # Should return error (invalid audio) but confirms endpoint works
   ```

2. **Check Frontend Build**
   ```bash
   npm run build
   # Should compile without TypeScript errors
   ```

3. **Browser Console**
   - Open DevTools → Console
   - Should see no errors on page load
   - Click "Recognize Music" → check for permission prompt
   - After recognition → verify API call in Network tab

4. **localStorage Inspection**
   - DevTools → Application → Local Storage
   - Check `wallpaper-jukebox-settings` has music object
   - Check `music-api-usage` tracks count and month

## Architecture Decisions Summary

1. **User-Controlled Recognition**: Manual button + optional auto-mode prevents wasteful API usage
2. **5-Second Audio Capture**: Balance between accuracy and user wait time
3. **Three Mapping Modes**: Flexibility in how music influences wallpapers
4. **Client-Side Rate Limiting**: Prevents bill shock with usage tracking
5. **Deep Settings Merge**: Consistent with existing weather settings pattern
6. **Accordion UI Pattern**: Matches existing design language

## Key Files Modified/Created

**Created (8 files)**:
1. `server/src/services/musicRecognitionService.ts` - Shazam API integration
2. `server/src/services/musicThemeMappingService.ts` - Music → wallpaper mapping
3. `server/src/routes/music.ts` - HTTP endpoints
4. `client/src/utils/audioCapture.ts` - Browser audio recording
5. `client/src/services/musicService.ts` - API client
6. `client/src/hooks/useMusicRecognition.ts` - State management
7. `client/src/types/music.ts` - TypeScript interfaces

**Modified (5 files)**:
1. `server/src/index.ts` - Register music routes
2. `client/src/types/index.ts` - Add music to Settings
3. `client/src/hooks/useSettings.ts` - Add music defaults
4. `client/src/App.tsx` - Integrate music hook
5. `client/src/components/ControlsHUD.tsx` - Add music UI

**Configuration**:
1. `.env` - Add RAPIDAPI_KEY

## Cost Considerations

- **Free Tier**: 250 requests/month = ~8 recognitions/day (good for prototyping)
- **Paid Tier**: $10/month for 50,000 requests (very affordable for production)
- **Manual Mode**: User controls when to recognize (recommended default)
- **Auto Mode**: 1 recognition per interval (e.g., every 3 minutes = 480/day = exceeds free limit quickly)
- **Recommendation**: Start with manual mode for free tier, enable auto when on paid tier

## Future Enhancements (Not in Scope)

- Spotify API integration (when available) for direct "now playing" detection
- Song history with timestamps
- Custom genre → theme mappings (user-configurable)
- BPM-based rotation interval adjustment
- Lyrics-based wallpaper search
- Share feature (song + wallpaper combinations)

## Troubleshooting Guide

**"Microphone permission required"**
- Click "Grant Permission" button
- If blocked: Check browser address bar for microphone icon → allow

**"No music detected"**
- Increase music volume
- Move microphone closer to speakers
- Reduce background noise
- Try vocal music (instruments harder to detect)

**"API rate limit exceeded"**
- Wait 1 minute and retry (server rate limit)
- OR check monthly usage (client limit)

**"API configuration error"**
- Verify RAPIDAPI_KEY in `.env`
- Restart backend server
- Check RapidAPI subscription status

**Wallpaper doesn't change after recognition**
- Check browser console for errors
- Verify image provider has results for generated query
- Try different mapping mode

---

End of Implementation Guide
