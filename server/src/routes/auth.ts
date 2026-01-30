import express from 'express';

const router = express.Router();

// Placeholder for Spotify OAuth
router.get('/login', (req, res) => {
  // TODO: Implement Spotify OAuth login
  res.json({ message: 'Spotify OAuth not yet implemented' });
});

router.get('/callback', (req, res) => {
  // TODO: Implement Spotify OAuth callback
  res.json({ message: 'Spotify OAuth callback not yet implemented' });
});

router.get('/logout', (req, res) => {
  // TODO: Implement logout
  res.json({ message: 'Logout not yet implemented' });
});

export default router;
