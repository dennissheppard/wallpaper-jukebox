import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'node:dns';
import path from 'node:path';
import authRoutes from './routes/auth';
import imagesRoutes from './routes/images';
import spotifyRoutes from './routes/spotify';
import weatherRoutes from './routes/weather';
import musicRoutes from './routes/music';

// Fix for Node 17+ IPv6 issues with some APIs (like Lyrics.ovh)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging for API routes
app.use((req, res, next) => {
  // Only log API and auth routes (skip static files)
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/health') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/music', musicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client');
  app.use(express.static(clientDistPath));

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
