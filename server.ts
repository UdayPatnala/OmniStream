import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
