import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // CORS middleware allowing cross-origin requests (e.g. from Vercel frontend)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Service Healthcheck endpoint for Render / monitoring
  app.get(['/health', '/api/health'], (req, res) => {
    res.json({
      status: 'healthy',
      service: 'CineMorph AI / U-Tube Backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/api/suggest', async (req, res) => {
    const query = (req.query.q as string) || '';
    if (!query) return res.json([]);
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return res.json(data[1].slice(0, 8));
        }
      }
      return res.json([]);
    } catch (err) {
      return res.json([]);
    }
  });

  app.get('/api/oembed', async (req, res) => {
    const id = (req.query.id as string) || '';
    if (!id) return res.status(400).json({ error: 'Missing video id' });
    try {
      const targetUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`;
      const response = await fetch(targetUrl);
      if (response.ok) {
        const data = await response.json();
        return res.json({
          id,
          title: data.title || 'YouTube Video',
          description: `Official video produced by ${data.author_name || 'YouTube Creator'}. Streaming live in CineMorph AI.`,
          channelId: data.author_url ? data.author_url.split('/').pop() : 'UC_creator',
          channelTitle: data.author_name || 'YouTube Creator',
          publishedAt: new Date().toISOString(),
          thumbnails: {
            medium: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            high: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          },
          duration: 'PT5M00S',
          viewCount: '1240500',
        });
      }
    } catch (err) {}

    return res.status(404).json({ error: 'Video oEmbed not found' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      return res.json({
        service: 'OmniStream / CineMorph AI Backend API',
        status: 'online',
        endpoints: ['/api/suggest?q=...', '/api/oembed?id=...', '/health'],
        frontend: 'https://0mn1stream.vercel.app',
      });
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
