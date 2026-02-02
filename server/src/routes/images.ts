import express from 'express';
import { fetchPexelsImages, fetchUnsplashImages, fetchPixabayImages } from '../services/imageService';

const router = express.Router();

router.get('/pexels', async (req, res) => {
  try {
    const query = req.query.query as string;
    const perPage = parseInt(req.query.per_page as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    const images = await fetchPexelsImages(query, perPage, page);
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
    const page = parseInt(req.query.page as string) || 1;

    const images = await fetchUnsplashImages(query, perPage, page);
    res.json({ images });
  } catch (error) {
    console.error('Unsplash API error:', error);
    res.status(500).json({ error: 'Failed to fetch images from Unsplash' });
  }
});

router.get('/pixabay', async (req, res) => {
  try {
    const query = req.query.query as string;
    const perPage = parseInt(req.query.per_page as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    const images = await fetchPixabayImages(query, perPage, page);
    res.json({ images });
  } catch (error) {
    console.error('Pixabay API error:', error);
    res.status(500).json({ error: 'Failed to fetch images from Pixabay' });
  }
});

export default router;
