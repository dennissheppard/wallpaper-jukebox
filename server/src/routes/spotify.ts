import express from 'express';

const router = express.Router();

// Placeholder routes for future Spotify integration
router.get('/currently-playing', (req, res) => {
  // TODO: Implement Spotify currently playing endpoint
  res.json({ message: 'Spotify integration not yet implemented' });
});

router.get('/audio-analysis/:trackId', (req, res) => {
  // TODO: Implement Spotify audio analysis endpoint
  res.json({ message: 'Spotify integration not yet implemented' });
});

router.get('/audio-features/:trackId', (req, res) => {
  // TODO: Implement Spotify audio features endpoint
  res.json({ message: 'Spotify integration not yet implemented' });
});

export default router;
