export interface ImageResult {
  url: string;
  photographerName: string;
  photographerUrl: string;
  sourceName: string;
  sourceUrl: string;
  attributionText: string;
  id: string;
}

export type Theme = 'nature' | 'space' | 'cities' | 'abstract' | 'random';
export type RotationInterval = 15 | 30 | 60 | 300 | 900 | 0; // seconds, 0 = manual only
export type ImageSource = 'pexels' | 'unsplash' | 'pixabay' | 'nasa';

export interface Settings {
  theme: Theme;
  rotationInterval: RotationInterval;
  source: ImageSource;
  showClock: boolean;
  enableSpotify: boolean;
  crossfadeDuration: number; // milliseconds
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

export interface SpotifyAudioAnalysis {
  tempo: number;
  timeSignature: number;
  key: number;
  mode: number;
  loudness: number;
  beats: Array<{ start: number; duration: number; confidence: number }>;
  bars: Array<{ start: number; duration: number; confidence: number }>;
  sections: Array<{
    start: number;
    duration: number;
    loudness: number;
    tempo: number;
    key: number;
    mode: number;
  }>;
}

export interface SpotifyAudioFeatures {
  energy: number; // 0-1
  valence: number; // 0-1 (happiness)
  danceability: number; // 0-1
  acousticness: number; // 0-1
  instrumentalness: number; // 0-1
}
