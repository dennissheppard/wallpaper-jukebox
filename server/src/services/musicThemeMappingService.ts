import { MusicMetadata } from './musicRecognitionService';

export type MappingMode = 'literal' | 'mood' | 'genre' | 'jukebox';

// Genre to visual theme mappings
export const GENRE_THEMES: Record<string, string> = {
  rock: 'electric energy concert lights dramatic',
  alternative: 'grunge urban raw edgy',
  'jam band': 'psychedelic festival colorful abstract',
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
  romantic: ['love', 'heart', 'kiss', 'romance', 'forever', 'together'],
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

// Common/stop words to skip when extracting title words
export const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'it', 'my', 'your', 'our', 'this', 'that', 'i', 'you', 'we', 'me', 'us',
  'am', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
  'just', 'only', 'even', 'also', 'very', 'too', 'so', 'no', 'not', 'yes',
  'feat', 'ft', 'featuring', 'remix', 'remaster', 'remastered', 'version', 'edit', 'mix',
  'from', 'live', 'acoustic', 'demo', 'original', 'extended', 'radio',
  'label', 'record', 'records', 'released', 'album', 'copyright', 'produced', 'mixed', 'mastered',
  'them', 'about', 'what', 'here', 'there', 'when', 'like', 'they', 'don', 'ain', 'man', 'woman',
  'hit', 'sold', 'bought', 'hard', 'pack', 'lately', 'feel', 'mine', 'held', 'arms', 'one',
  'time', 'lost', 'same', 'straight', 'late', 'found', 'face', 'down', 'ditch', 'booze', 'hair',
  'blood', 'lips', 'picture', 'holding', 'pocket', 'still', 'know', 'means', 'long', 'since',
  'seen', 'felt', 'part', 'human', 'race', 'living', 'out', 'way', 'needs', 'something', 'hold',
  'onto', 'either', 'things', 'all', 'said', 'last', 'now', 'more', 'think', 'wish', 'once',
  'look', 'see', 'come', 'talk', 'tell', 'show', 'try', 'tried', 'let', 'get', 'got',
]);

// Words that are visually interesting for wallpaper searches
const VISUAL_WORDS = new Set([
// ... (keep VISUAL_WORDS set as is, no changes needed in the set itself for this instruction) ...
  // Emotional States
  'melancholy',
  'euphoria',
  'lonely', 'loneliness',
  'desire',
  'longing',
  'fear',
  'hope',
  'regret',
  'ecstasy',
  'reverie',
]);

/**
 * Extract visually interesting words from a song title
 */
function extractVisualWords(title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !COMMON_WORDS.has(word));

  // Prioritize known visual words, then include others
  const visual = words.filter(w => VISUAL_WORDS.has(w));
  const other = words.filter(w => !VISUAL_WORDS.has(w));

  return [...visual, ...other];
}

/**
 * Get all candidate phrases from lyrics
 */
export function getLyricalCandidates(lyrics: string[]): string[] {
  if (!lyrics || lyrics.length === 0) return [];

  return lyrics.filter(line => {
    // Clean line (preserve apostrophes to keep contractions like "I'll" intact)
    const cleanLine = line.toLowerCase().replace(/[^\w\s']/g, '').trim();
    if (!cleanLine) return false;

    const words = cleanLine.split(/\s+/).filter(w => w.length > 0);
    
    // Filter by length (short phrases are better for search)
    if (words.length < 3 || words.length > 8) return false;
    
    // Check if line contains at least one "interesting" word (not just common words)
    // We relax the "Visual Word" requirement to just "Not Common Word"
    const hasInteresting = words.some(w => !COMMON_WORDS.has(w) && w.length > 2);
    
    return hasInteresting;
  });
}

/**
 * Extract a meaningful phrase from lyrics that contains visual imagery
 */
export function extractLyricalPhrase(lyrics: string[]): string | null {
  console.log(`[Jukebox] Scanning ${lyrics?.length || 0} lines for visual phrases...`);
  
  const candidates = getLyricalCandidates(lyrics);
  console.log(`[Jukebox] Found ${candidates.length} candidate phrases.`);

  if (candidates.length > 0) {
    // Pick a random candidate to add variety
    const phrase = candidates[Math.floor(Math.random() * candidates.length)];
    // Clean punctuation for final query (preserve apostrophes for contractions)
    return phrase.replace(/[^\w\s']/g, '').toLowerCase();
  }
  
  return null;
}

/**
 * Generate a unified "jukebox" wallpaper query combining multiple sources
 * Priority: mood keywords > visual phrase from lyrics > title words > (fallback) title+artist
 * This is used as a FALLBACK when Last.fm tags aren't available
 */
export function generateJukeboxQuery(music: MusicMetadata): string {
  const parts: string[] = [];
  console.log('[Jukebox] Building query for:', music.title, 'by', music.artist);

  // 1. Check for mood keywords in title/artist
  const textToAnalyze = `${music.title} ${music.artist}`;
  const moods = detectMoodFromText(textToAnalyze);
  if (moods.length > 0) {
    const moodTheme = getMoodTheme(moods);
    if (moodTheme) {
      // Take just the first 2 mood words to leave room for lyrics
      const moodWords = moodTheme.split(' ').slice(0, 2);
      parts.push(...moodWords);
      console.log('[Jukebox] Added mood words:', moodWords);
    }
  }

  // 2. Scan lyrics for a whole visual phrase (Priority over Artist)
  let phraseFound = false;
  if (music.lyrics && music.lyrics.length > 0) {
    const phrase = extractLyricalPhrase(music.lyrics);
    if (phrase) {
      parts.push(phrase);
      phraseFound = true;
      console.log('[Jukebox] Added lyrical phrase:', phrase);
    }
  }

  // 3. Extract visual words from title
  // If we found a phrase, we skip the artist AND title to avoid pollution
  // The user prefers the pure phrase if one exists.
  if (!phraseFound) {
    const sourceText = `${music.title} ${music.artist}`;
    const titleWords = extractVisualWords(sourceText);
    
    // Filter out words we already have
    const newTitleWords = titleWords.filter(w => !parts.some(p => p.includes(w))).slice(0, 4);
    
    if (newTitleWords.length > 0) {
      parts.push(...newTitleWords);
      console.log('[Jukebox] Added title/artist words:', newTitleWords);
    }
  } else {
    console.log('[Jukebox] Skipping title/artist words because a lyrical phrase was found.');
  }

  // 4. Scan metadata/lyrics for individual visual words (as backup/supplement)
  // Only if we have space or didn't find a phrase
  if (!phraseFound && (music.lyrics || music.metadata)) {
    const extraText = [...(music.lyrics || []), ...(music.metadata || [])].join(' ');
    console.log('[Jukebox] Analyzing lyrics/metadata length:', extraText.length);
    
    const extraVisuals = extractVisualWords(extraText);
    const uniqueExtra = [...new Set(extraVisuals)]
      .filter(w => !parts.some(p => p.includes(w)))
      .slice(0, 3);

    if (uniqueExtra.length > 0) {
      parts.push(...uniqueExtra);
      console.log('[Jukebox] Added lyrics/metadata words:', uniqueExtra);
    }
  }

  // Fallback if still empty: use FULL TITLE + ARTIST
  if (parts.length === 0) {
    // Sanitize title/artist for search (preserve apostrophes)
    const cleanTitle = music.title.replace(/[^\w\s']/g, '');
    const cleanArtist = music.artist.replace(/[^\w\s']/g, '');
    const fallback = `${cleanTitle} ${cleanArtist}`;
    console.log('[Jukebox] No visual keywords found. Using full title fallback:', fallback);
    return fallback;
  }

  const query = parts.slice(0, 8).join(' ');
  console.log('[Jukebox] Final query:', query);
  return query;
}

export function generateWallpaperQuery(music: MusicMetadata, mode: MappingMode = 'jukebox'): string {
  const genre = music.genre.toLowerCase();
  console.log('[Theme Mapping] Input - Title:', music.title, 'Artist:', music.artist, 'Genre:', genre, 'Mode:', mode);

  switch (mode) {
    case 'jukebox':
      // Unified smart approach (used as fallback when no Last.fm tags)
      return generateJukeboxQuery(music);

    case 'literal':
      // Use song title + artist as search
      const titleWords = extractVisualWords(music.title);
      return titleWords.slice(0, 4).join(' ') || GENRE_THEMES[genre] || 'abstract colorful';

    case 'mood':
      // Detect mood from title and artist
      const textToAnalyze = `${music.title} ${music.artist}`;
      const moods = detectMoodFromText(textToAnalyze);
      console.log('[Theme Mapping] Detected moods:', moods);
      const moodTheme = getMoodTheme(moods);

      if (moodTheme) {
        console.log('[Theme Mapping] Using mood theme:', moodTheme);
        return moodTheme;
      }

      // Fallback to genre if no mood detected
      const genreTheme = GENRE_THEMES[genre] || 'abstract atmospheric colorful';
      console.log('[Theme Mapping] Fallback to genre theme:', genreTheme);
      return genreTheme;

    case 'genre':
    default:
      // Direct genre mapping
      return GENRE_THEMES[genre] || 'abstract colorful atmospheric';
  }
}
