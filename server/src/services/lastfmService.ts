import { GENRE_THEMES } from './musicThemeMappingService';

/**
 * Last.fm API integration for fetching track tags/metadata
 * API Docs: https://www.last.fm/api/show/track.getTopTags
 */

export interface LastFmTag {
  name: string;
  count: number; // 0-100, how often this tag is applied
  url: string;
}

export interface LastFmTrackTags {
  tags: LastFmTag[];
  trackName: string;
  artistName: string;
}

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Clean track name for better Last.fm matching
 * Strips parenthetical content like "(Remastered)", "(Live)", etc.
 */
function cleanTrackName(trackName: string): string {
  return trackName
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove (anything in parens)
    .replace(/\s*\[[^\]]*\]\s*/g, '') // Remove [anything in brackets]
    .replace(/\s*-\s*(Remaster|Remix|Live|Demo|Edit|Version|Mix).*$/i, '') // Remove suffix markers
    .trim();
}

/**
 * Fetch top tags for a track from Last.fm
 * Tags are crowd-sourced descriptors like "melancholic", "indie", "summer", etc.
 */
export async function getTrackTags(
  trackName: string,
  artistName: string
): Promise<LastFmTrackTags | null> {
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    console.log('[Last.fm] LASTFM_API_KEY not configured, skipping tag lookup');
    return null;
  }

  // Clean the track name for better matching
  const cleanedTrack = cleanTrackName(trackName);
  const useCleanedName = cleanedTrack !== trackName;

  try {
    const params = new URLSearchParams({
      method: 'track.getTopTags',
      artist: artistName,
      track: cleanedTrack,
      api_key: apiKey,
      format: 'json',
    });

    console.log('[Last.fm] Fetching tags for:', cleanedTrack, 'by', artistName);
    if (useCleanedName) {
      console.log('[Last.fm] (Original name was:', trackName + ')');
    }

    const url = `${LASTFM_API_BASE}?${params}`;
    console.log('[Last.fm] Request URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('[Last.fm] API error:', response.status);
      return null;
    }

    const data = await response.json();
    // console.log('[Last.fm] Raw response:', JSON.stringify(data, null, 2).substring(0, 1000));

    // Check for API error response
    if (data.error) {
      console.log('[Last.fm] Track not found or error:', data.message);
      return null;
    }

    // Extract tags - handle both array and single object cases
    let rawTags = data.toptags?.tag || [];
    // Last.fm returns single tag as object, not array
    if (rawTags && !Array.isArray(rawTags)) {
      rawTags = [rawTags];
    }

    const tags: LastFmTag[] = rawTags.map((t: any) => ({
      name: t.name,
      count: parseInt(t.count, 10) || 0,
      url: t.url,
    }));

    console.log('[Last.fm] Found', tags.length, 'tags');
    if (tags.length > 0) {
      console.log('[Last.fm] Top tags:', tags.slice(0, 10).map(t => t.name).join(', '));
    }

    return {
      tags,
      trackName,
      artistName,
    };
  } catch (error) {
    console.error('[Last.fm] Error fetching tags:', error);
    return null;
  }
}

/**
 * Get artist top tags (fallback if track tags aren't found)
 */
export async function getArtistTags(artistName: string): Promise<LastFmTag[] | null> {
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      method: 'artist.getTopTags',
      artist: artistName,
      api_key: apiKey,
      format: 'json',
    });

    console.log('[Last.fm] Fetching artist tags for:', artistName);

    const response = await fetch(`${LASTFM_API_BASE}?${params}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.error) {
      return null;
    }

    const tags: LastFmTag[] = (data.toptags?.tag || []).map((t: any) => ({
      name: t.name,
      count: parseInt(t.count, 10) || 0,
      url: t.url,
    }));

    console.log('[Last.fm] Found', tags.length, 'artist tags');

    return tags;
  } catch (error) {
    console.error('[Last.fm] Error fetching artist tags:', error);
    return null;
  }
}

// Tags to EXCLUDE (junk tags that aren't useful for wallpaper themes)
const EXCLUDED_TAG_PATTERNS = [
  // Radio stations and specific locations
  /\d+\.?\d*\s*fm/i,           // "91.7 FM", "WSUM 91.7 FM Madison"
  /\b(radio|station)\b/i,

  // Years and decades (too generic)
  /^(19|20)\d{2}$/,            // "2002", "1995"
  /^\d{2}s$/,                  // "00s", "90s", "80s"

  // Generic/useless
  /^(seen live|favorite|love|awesome|best)s?$/i,
  /my\s+(favorite|playlist)/i,
  /^all$/i,
  
  // Generic descriptor tags
  /^(male|female)?\s*(vocalists?|singers?|songwriters?)$/i,
  /^singer[- ]?songwriter$/i,
  /^(american|canadian|british|australian|irish|english)$/i,
];

// Tags that are GOOD for visual/wallpaper themes
const GOOD_TAG_PATTERNS = [
  // Genres (keep these!)
  /^(rap|hip-hop|hip hop|rock|pop|indie|alternative|electronic|jazz|blues|soul|r&b|rnb|country|folk|metal|punk|reggae|latin|classical|ambient|techno|house|edm|dubstep|trap|lo-fi|lofi)$/i,

  // Sub-genres
  /rock|pop|wave|core|step|house|beat/i,

  // Moods
  /melanchol|sad|happy|uplift|dark|dream|romantic|angry|peace|calm|energetic|chill|mellow|epic|atmospher|ethereal|haunt|hopeful|nostalg|passion|sensual|aggress|intense|relax|somber|lonely|joy|bliss|gloomy|moody|serene|tender|fierce|wild|gentle|soft|loud|quiet/i,

  // Scenes/Nature
  /summer|winter|autumn|fall|spring|night|rain|sunny|sunset|sunrise|beach|ocean|sea|forest|mountain|desert|urban|city|rural|space|tropical|coastal/i,

  // Vibes/Activities
  /road\s*trip|driv|party|dance|workout|study|sleep|morning|late\s*night|coffee|lounge|club/i,

  // Aesthetics
  /psychedelic|retro|vintage|futurist|neon|minimal|cinematic|noir|gothic|groov|funky|smooth|raw|gritty|lush|warm|cold|cool|hot/i,
];

/**
 * Check if a tag is useful for visual theming
 */
function isUsefulTag(tagName: string, artistName?: string): boolean {
  const lowerTag = tagName.toLowerCase().trim();

  // Exclude artist name as a tag (not useful)
  if (artistName && lowerTag === artistName.toLowerCase()) {
    return false;
  }

  // Exclude based on patterns
  for (const pattern of EXCLUDED_TAG_PATTERNS) {
    if (pattern.test(tagName)) {
      return false;
    }
  }

  // Include if it matches good patterns
  for (const pattern of GOOD_TAG_PATTERNS) {
    if (pattern.test(lowerTag)) {
      return true;
    }
  }

  // For tags that don't match any pattern, include if they're short-ish
  // (long tags are often junk like "songs I like" or radio stations)
  if (lowerTag.length <= 15 && !lowerTag.includes(' fm') && !/\d{4}/.test(lowerTag)) {
    return true;
  }

  return false;
}

/**
 * Filter tags to only those useful for visual theming
 */
export function filterVisualTags(tags: LastFmTag[], artistName?: string): LastFmTag[] {
  return tags.filter(tag => isUsefulTag(tag.name, artistName));
}

/**
 * Convert Last.fm tags to a wallpaper search query
 */
export function tagsToWallpaperQuery(tags: LastFmTag[], artistName?: string, maxTags: number = 4): string {
  // Filter to useful visual tags and sort by count (popularity)
  const usefulTags = filterVisualTags(tags, artistName)
    .sort((a, b) => b.count - a.count);

  console.log('[Last.fm] Useful tags:', usefulTags.map(t => `${t.name}(${t.count})`).join(', '));

  if (usefulTags.length === 0) {
    // Fallback: use top 2 tags regardless
    const fallback = tags
      .slice(0, 2)
      .map(t => t.name.toLowerCase())
      .join(' ');
    console.log('[Last.fm] No visual tags, using fallback:', fallback);
    return fallback;
  }

  const queryParts = new Set<string>();
  const visualTags: string[] = [];
  const genreTags: string[] = [];

  // Classify tags into Visual/Mood vs Genre
  for (const tag of usefulTags) {
    const lowerTag = tag.name.toLowerCase();
    
    // Check if it matches a genre in GENRE_THEMES (exact or partial)
    let isGenre = false;
    
    // Direct match
    if (GENRE_THEMES[lowerTag]) {
      isGenre = true;
    } else {
      // Partial match (e.g. "alt rock" contains "rock")
      const words = lowerTag.split(/[\s-]+/);
      for (const word of words) {
        if (GENRE_THEMES[word]) {
          isGenre = true;
          break;
        }
      }
    }

    if (isGenre) {
      genreTags.push(lowerTag);
    } else {
      visualTags.push(lowerTag);
    }
  }

  // 1. Prioritize Visual/Mood Tags (add them directly)
  // Limit to 3 visual tags to keep query focused
  visualTags.slice(0, 3).forEach(tag => queryParts.add(tag));

  // 2. Add Genre Theme (mapped) IF we don't have enough words
  // Only use the top genre tag, and limit the mapped words
  if (queryParts.size < 3 && genreTags.length > 0) {
    const topGenre = genreTags[0];
    
    // Map it to visual theme
    if (GENRE_THEMES[topGenre]) {
      GENRE_THEMES[topGenre].split(' ').slice(0, 2).forEach(w => queryParts.add(w));
    } else {
      // Partial match mapping
      const words = topGenre.split(/[\s-]+/);
      for (const word of words) {
        if (GENRE_THEMES[word]) {
          GENRE_THEMES[word].split(' ').slice(0, 2).forEach(w => queryParts.add(w));
          break; // Just use the first matching genre word
        }
      }
    }
  }

  const query = Array.from(queryParts).slice(0, 6).join(' ');

  console.log('[Last.fm] Final query:', query);
  return query;
}

