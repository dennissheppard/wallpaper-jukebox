// Response structure from shazam-api25
interface ShazamTrack {
  title: string;
  subtitle: string; // artist
  genres?: { primary: string };
  images?: {
    coverart?: string;
  };
}

interface ShazamMatch {
  id: string;
  href?: string;
  offset?: number;
  frequencyskew?: number;
  timeskew?: number;
}

interface ShazamSongResource {
  id: string;
  type: string;
  attributes?: {
    title?: string;
    artist?: string;
    name?: string;
    primaryArtist?: string;
    genres?: { primary?: string };
    artwork?: { url?: string };
    images?: { coverart?: string };
  };
}

interface ShazamAPIResponse {
  // Old format
  track?: ShazamTrack;
  // New format from shazam-api25
  results?: {
    matches: ShazamMatch[];
    track?: ShazamTrack;
  };
  // Resources contains song data keyed by ID
  resources?: {
    'shazam-songs'?: Record<string, ShazamSongResource>;
    songs?: Record<string, ShazamSongResource>;
    [key: string]: any;
  };
  track_info?: ShazamTrack;
}

export interface MusicMetadata {
  title: string;
  artist: string;
  genre: string;
  albumArt?: string;
  lyrics?: string[];
  metadata?: string[]; // Any other useful text found
}

// Helper to fetch lyrics from Lyrics.ovh (free API)
async function fetchLyricsFromOvh(artist: string, title: string): Promise<string[]> {
  try {
    // Clean names for better matching (remove "feat.", "(Remastered)", etc.)
    const cleanArtist = artist.split(/,| ft. | feat. /i)[0].trim();
    const cleanTitle = title.replace(/\s*\(.*?\)/g, '').trim();

    console.log(`[Lyrics.ovh] Fetching lyrics for "${cleanTitle}" by "${cleanArtist}"...`);
    
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    console.log(`[Lyrics.ovh] Request URL: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s timeout

    const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WallpaperJukebox/1.0',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`[Lyrics.ovh] Request failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (data.lyrics) {
      console.log('[Lyrics.ovh] Lyrics found!');
      // Split by newlines and filter empty lines
      return data.lyrics.split('\n').filter((line: string) => line.trim().length > 0);
    }
    
    return [];
  } catch (error) {
    if (error instanceof Error) {
        if (error.name === 'AbortError') {
            console.log('[Lyrics.ovh] Request timed out');
        } else {
            console.log('[Lyrics.ovh] Error fetching lyrics:', error.message);
        }
    }
    return [];
  }
}

// Helper to extract lyrics and metadata from song attributes
function extractMetadata(attributes: any): { lyrics: string[], metadata: string[] } {
  const lyrics: string[] = [];
  const metadata: string[] = [];

  if (attributes?.sections) {
    console.log('[Music Recognition] Available sections:', attributes.sections.map((s: any) => s.type));
    for (const section of attributes.sections) {
      if (section.type === 'LYRICS') {
        if (Array.isArray(section.text)) lyrics.push(...section.text);
        else if (typeof section.text === 'string') lyrics.push(section.text);
      } else if (section.type === 'TEXT' && section.text) {
        // e.g. "Label: ..."
        if (Array.isArray(section.text)) metadata.push(...section.text);
        else if (typeof section.text === 'string') metadata.push(section.text);
      }
    }
  }
  
  // Also check direct metadata fields
  // if (attributes?.label) metadata.push(`Label: ${attributes.label}`); // Removed per user request (junk data)
  if (attributes?.released) metadata.push(`Released: ${attributes.released}`);

  if (lyrics.length === 0) {
    console.log('[Music Recognition] No lyrics found. Attributes keys:', Object.keys(attributes || {}));
    if (attributes?.sections) {
       console.log('[Music Recognition] Sections found but no lyrics:', attributes.sections.map((s: any) => s.type));
    }
  }

  return { lyrics, metadata };
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
    console.log('[Music Recognition] Sending request to Shazam API...');
    console.log('[Music Recognition] Audio buffer size:', audioBuffer.length, 'bytes');
    console.log('[Music Recognition] Filename:', filename);

    const contentType = getContentType(filename);

    // Use Node's native FormData (Node 18+)
    const formData = new FormData();
    // Convert Buffer to ArrayBuffer for Blob compatibility
    const arrayBuffer = audioBuffer.buffer.slice(
      audioBuffer.byteOffset,
      audioBuffer.byteOffset + audioBuffer.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: contentType });
    formData.append('file', blob, filename);

    const response = await fetch(`https://${apiHost}/tracks/recognize`, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
      },
      body: formData,
    });

    console.log('[Music Recognition] Response status:', response.status);

    // Get raw response text first for debugging
    const responseText = await response.text();
    console.log('[Music Recognition] Response body:', responseText.substring(0, 500));

    if (response.status === 401) {
      throw new Error('Invalid API key');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(`Shazam API error: ${response.status} - ${responseText.substring(0, 200)}`);
    }

    const data: ShazamAPIResponse = JSON.parse(responseText);
    console.log('[Music Recognition] Parsed response keys:', Object.keys(data));

    // Log the full response for debugging (truncated)
    console.log('[Music Recognition] Full response:', JSON.stringify(data, null, 2).substring(0, 2000));

    // Try to find track in various response formats
    let track: ShazamTrack | undefined;
    let title: string | undefined;
    let artist: string | undefined;
    let genre: string | undefined;
    let albumArt: string | undefined;
    let lyrics: string[] = [];
    let metadata: string[] = [];

    // Format 1: Direct track property
    if (data.track) {
      track = data.track;
      console.log('[Music Recognition] Found track in data.track');
      const extracted = extractMetadata(track);
      lyrics = extracted.lyrics;
      metadata = extracted.metadata;
    }
    // Format 2: Track inside results
    else if (data.results?.track) {
      track = data.results.track;
      console.log('[Music Recognition] Found track in data.results.track');
      const extracted = extractMetadata(track);
      lyrics = extracted.lyrics;
      metadata = extracted.metadata;
    }
    // Format 3: track_info property
    else if (data.track_info) {
      track = data.track_info;
      console.log('[Music Recognition] Found track in data.track_info');
      const extracted = extractMetadata(track);
      lyrics = extracted.lyrics;
      metadata = extracted.metadata;
    }

    // Check if we have matches
    if (data.results?.matches && data.results.matches.length > 0) {
      console.log('[Music Recognition] Found', data.results.matches.length, 'matches');
      const matchId = data.results.matches[0].id;
      console.log('[Music Recognition] First match ID:', matchId);

      // Try to find song info in resources
      if (data.resources) {
        // Look for shazam-songs
        const shazamSongs = data.resources['shazam-songs'];
        if (shazamSongs && shazamSongs[matchId]) {
          const song = shazamSongs[matchId] as any;
          console.log('[Music Recognition] Found song in shazam-songs:', song);
          title = song.attributes?.title || song.attributes?.name;
          artist = song.attributes?.artist || song.attributes?.primaryArtist;
          genre = song.attributes?.genres?.primary;
          // Prefer coverArt/coverArtHq over artwork.url (which has template placeholders)
          albumArt = song.attributes?.images?.coverArtHq ||
                     song.attributes?.images?.coverArt ||
                     song.attributes?.artwork?.url?.replace('{w}x{h}', '400x400');
          
          const extracted = extractMetadata(song.attributes);
          if (extracted.lyrics.length > 0) lyrics = extracted.lyrics;
          if (extracted.metadata.length > 0) metadata = extracted.metadata;
        }

        // Look for songs
        const songs = data.resources['songs'];
        if (!title && songs && songs[matchId]) {
          const song = songs[matchId];
          console.log('[Music Recognition] Found song in songs:', song);
          title = song.attributes?.title || song.attributes?.name;
          artist = song.attributes?.artist || song.attributes?.primaryArtist;
          genre = song.attributes?.genres?.primary;
          albumArt = song.attributes?.artwork?.url || song.attributes?.images?.coverart;
        }

        // Try any resource that might have our match ID
        if (!title) {
          for (const [resourceType, resourceData] of Object.entries(data.resources)) {
            if (typeof resourceData === 'object' && resourceData !== null) {
              const songData = resourceData[matchId];
              if (songData?.attributes) {
                console.log('[Music Recognition] Found song in', resourceType, ':', songData);
                title = songData.attributes?.title || songData.attributes?.name;
                artist = songData.attributes?.artist || songData.attributes?.primaryArtist;
                genre = songData.attributes?.genres?.primary;
                albumArt = songData.attributes?.artwork?.url;
                if (title) break;
              }
            }
          }
        }
      }
    } else if (data.results?.matches) {
      console.log('[Music Recognition] No matches found in audio');
    }

    // Use track object if we found one
    if (track) {
      title = title || track.title;
      artist = artist || track.subtitle;
      genre = genre || track.genres?.primary;
      albumArt = albumArt || track.images?.coverart;
    }

    // No track detected
    if (!title) {
      console.log('[Music Recognition] No track information found');
      return null;
    }

    console.log('[Music Recognition] Extracted - Title:', title, 'Artist:', artist);
    
    // Fallback: Fetch lyrics from Lyrics.ovh if missing
    if (lyrics.length === 0 && title && artist) {
      console.log('[Music Recognition] No lyrics found from Shazam. Trying Lyrics.ovh...');
      const ovhLyrics = await fetchLyricsFromOvh(artist, title);
      if (ovhLyrics.length > 0) {
        lyrics = ovhLyrics;
        console.log('[Music Recognition] Fetched', lyrics.length, 'lines from Lyrics.ovh');
      }
    } else if (lyrics.length > 0) {
      console.log('[Music Recognition] Found lyrics lines from Shazam:', lyrics.length);
    } else {
        // Debug info if still no lyrics
        if (data.resources && data.results?.matches && data.results.matches.length > 0) {
             const matchId = data.results.matches[0].id;
             const shazamSong = data.resources['shazam-songs']?.[matchId];
             if (shazamSong?.attributes) {
                 console.log('[Music Recognition] Debug Attributes Keys:', Object.keys(shazamSong.attributes));
             }
        }
    }

    return {
      title: title || 'Unknown',
      artist: artist || 'Unknown',
      genre: genre || 'unknown',
      albumArt,
      lyrics,
      metadata,
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
