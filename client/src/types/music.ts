export interface MusicMetadata {
  title: string;
  artist: string;
  genre: string;
  albumArt?: string;
  tags?: string[]; // Last.fm tags for richer metadata
}

export type MusicMappingMode = 'literal' | 'mood' | 'genre' | 'jukebox';

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
  lyric?: string | null;
}
