import express from 'express';
import { fetchPexelsImages, fetchUnsplashImages } from '../services/imageService';

const router = express.Router();

router.get('/pexels', async (req, res) => {
  try {
    const query = req.query.query as string;
    const perPage = parseInt(req.query.per_page as string) || 10;

    const images = await fetchPexelsImages(query, perPage);
    res.json({ images });
  } catch (error) {
    console.error('Pexels API error:', error);
    res.status(500).json({ error: 'Failed to fetch images from Pexels' });
  }
});

router.get('/unsplash', async (req, res) => {
  try {
    const query = req.query.query as string;
    const perPage = parseInt(req.query.per_page as string) || 10;

    const images = await fetchUnsplashImages(query, perPage);
    res.json({ images });
  } catch (error) {
    console.error('Unsplash API error:', error);
    res.status(500).json({ error: 'Failed to fetch images from Unsplash' });
  }
});

export default router;
