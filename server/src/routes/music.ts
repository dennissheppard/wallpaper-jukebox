import express from 'express';
import multer from 'multer';
import { recognizeMusic, MusicMetadata } from '../services/musicRecognitionService';
import { generateWallpaperQuery, MappingMode, GENRE_THEMES, COMMON_WORDS, extractLyricalPhrase, getLyricalCandidates } from '../services/musicThemeMappingService';
import { getTrackTags, getArtistTags, tagsToWallpaperQuery, filterVisualTags } from '../services/lastfmService';
import { musicRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Helper to generate word cloud for debugging/analysis
function logWordCloud(music: MusicMetadata, tags: string[]) {
  const allText = [
    music.title,
    music.artist,
    ...(music.lyrics || []),
    ...(music.metadata || []),
    ...tags
  ].join(' ');

  const words = allText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !COMMON_WORDS.has(w))
    .filter(w => !GENRE_THEMES[w]); // Filter out known genres

  const uniqueWords = [...new Set(words)];
  console.log('[Word Cloud] All Extracted Words:', uniqueWords);

  // Extract and log lyrical phrases
  if (music.lyrics && music.lyrics.length > 0) {
    const candidates = getLyricalCandidates(music.lyrics);
    if (candidates.length > 0) {
        console.log('[Word Cloud] 📜 Candidate Phrases:', candidates);
    } else {
      console.log('[Word Cloud] No visual phrases found in lyrics.');
    }
  }
}

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

router.post('/recognize', musicRateLimiter, upload.single('audio'), async (req, res) => {
  try {
    const mappingMode = (req.body.mappingMode as MappingMode) || 'mood';

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('[Music Route] Received audio file:');
    console.log('[Music Route]   - Original name:', req.file.originalname);
    console.log('[Music Route]   - MIME type:', req.file.mimetype);
    console.log('[Music Route]   - Size:', req.file.buffer.length, 'bytes');
    console.log('[Music Route]   - Mapping mode:', mappingMode);

    // Recognize music using the uploaded file buffer
    const music = await recognizeMusic(req.file.buffer, req.file.originalname);

    if (!music) {
      return res.json({ detected: false });
    }

    // Try to get Last.fm tags for richer metadata
    let wallpaperQuery: string;
    let lyric: string | null = null;
    let lastfmTags: string[] = [];
    let visualTags: any[] = [];

    const trackTags = await getTrackTags(music.title, music.artist);

    // 1. Gather Tags (Last.fm)
    if (trackTags && trackTags.tags.length > 0) {
      // We have track tags
      lastfmTags = trackTags.tags.slice(0, 10).map(t => t.name);
      visualTags = filterVisualTags(trackTags.tags, music.artist);
      console.log('[Music Route] Visual tags after filtering:', visualTags.map(t => t.name));
    } else {
      // Fall back to artist tags (for display ONLY, not for query)
      const artistTags = await getArtistTags(music.artist);
      if (artistTags && artistTags.length > 0) {
        lastfmTags = artistTags.slice(0, 10).map(t => t.name);
        console.log('[Music Route] Found artist tags for display:', lastfmTags.slice(0, 3));
      }
    }

    // 2. Log Word Cloud (Analysis)
    logWordCloud(music, lastfmTags);

    // 3. Determine Wallpaper Query (PRIORITY: Lyrics > Last.fm > Fallback)
    
    // Check for a strong lyrical phrase first
    const lyricCandidate = music.lyrics && music.lyrics.length > 0 ? extractLyricalPhrase(music.lyrics) : null;

    if (lyricCandidate) {
      // PRIORITY 1: Lyrical Phrase
      wallpaperQuery = lyricCandidate;
      lyric = lyricCandidate;
      console.log('[Music Route] 🎵 Using lyrical phrase for query:', wallpaperQuery);
    } 
    else if (trackTags && trackTags.tags.length > 0) {
      // PRIORITY 2: Last.fm Tags
      if (visualTags.length > 0) {
        wallpaperQuery = tagsToWallpaperQuery(trackTags.tags, music.artist);
        console.log('[Music Route] Using Last.fm tags for query:', wallpaperQuery);
      } else {
        // No visual tags, but we have tags - combine with genre
        const topTags = trackTags.tags.slice(0, 2).map(t => t.name.toLowerCase()).join(' ');
        wallpaperQuery = `${topTags} ${generateWallpaperQuery(music, mappingMode)}`;
        console.log('[Music Route] Combining tags with genre:', wallpaperQuery);
      }
    } 
    else {
      // PRIORITY 3: Fallback (Jukebox/Mood/Genre)
      // Use smart fallback (mood -> title -> full title)
      // Note: generateWallpaperQuery also checks lyrics, but we already checked above.
      // However, it handles title/mood logic too, so we still call it.
      wallpaperQuery = generateWallpaperQuery(music, 'jukebox');
      console.log('[Music Route] Using jukebox fallback mapping:', wallpaperQuery);
    }

    // Get all lyric candidates for client-side refresh
    const lyricCandidates = music.lyrics && music.lyrics.length > 0
      ? getLyricalCandidates(music.lyrics).map(l => l.replace(/[^\w\s']/g, '').toLowerCase())
      : [];

    res.json({
      detected: true,
      track: {
        ...music,
        tags: lastfmTags, // Include tags in response for UI display
      },
      wallpaperQuery,
      lyric, // Explicitly return the lyric used (if any)
      lyricCandidates, // All candidates for client-side refresh
    });

  } catch (error: any) {
    console.error('[Music Route] Recognition error:', error.message);
    console.error('[Music Route] Full error:', error);

    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: 'API rate limit exceeded. Try again later.' });
    }

    if (error.message.includes('Invalid API key')) {
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Include actual error message for debugging
    res.status(500).json({ error: `Failed to recognize music: ${error.message}` });
  }
});

export default router;
