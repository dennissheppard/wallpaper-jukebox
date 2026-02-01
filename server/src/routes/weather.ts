import express from 'express';
import { getWeatherData, getLocationFromIP } from '../services/weatherService';

const router = express.Router();

// Get weather by coordinates
router.get('/current', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const unit = (req.query.unit as 'C' | 'F') || 'F';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const weather = await getWeatherData(lat, lon, unit);
    res.json(weather);
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get location from IP
router.get('/location', async (req, res) => {
  try {
    const location = await getLocationFromIP();
    res.json(location);
  } catch (error) {
    console.error('Location fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Get weather using IP-based location
router.get('/auto', async (req, res) => {
  try {
    const unit = (req.query.unit as 'C' | 'F') || 'F';
    const location = await getLocationFromIP();
    const weather = await getWeatherData(location.lat, location.lon, unit);

    res.json({
      weather,
      location: {
        ...location,
        isApproximate: true,
      },
    });
  } catch (error) {
    console.error('Auto weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
