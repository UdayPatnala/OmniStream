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

  // YouTube Real Search Proxy Endpoint
  app.get('/api/search', async (req, res) => {
    const query = (req.query.q as string) || '';
    const filterType = (req.query.type as string) || 'all';
    if (!query) return res.json({ results: [] });

    try {
      const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (response.ok) {
        const html = await response.text();
        const match = html.match(/var ytInitialData = ({.*?});<\/script>/) || html.match(/window\["ytInitialData"\] = ({.*?});<\/script>/);
        if (match) {
          const data = JSON.parse(match[1]);
          const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
          const results: any[] = [];
          const seenIds = new Set<string>();

          for (const s of sections) {
            const items = s.itemSectionRenderer?.contents || [];
            for (const item of items) {
              if (item.videoRenderer && (filterType === 'all' || filterType === 'video')) {
                const vr = item.videoRenderer;
                const videoId = vr.videoId;
                if (videoId && !seenIds.has(videoId)) {
                  seenIds.add(videoId);
                  const channelAvatar = vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url;
                  const channelName = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || 'Creator';
                  results.push({
                    id: videoId,
                    type: 'video',
                    title: vr.title?.runs?.[0]?.text || vr.title?.accessibility?.accessibilityData?.label || 'YouTube Video',
                    channelTitle: channelName,
                    channelId: vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || vr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || 'UC_creator',
                    channelLogo: channelAvatar,
                    publishedAt: vr.publishedTimeText?.simpleText || 'Recently',
                    thumbnails: {
                      medium: vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                      high: vr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    },
                    duration: vr.lengthText?.simpleText ? `PT${vr.lengthText.simpleText.replace(':', 'M')}S` : 'PT10M00S',
                    viewCount: vr.viewCountText?.simpleText || '1.2M views',
                  });
                }
              } else if (item.channelRenderer && (filterType === 'all' || filterType === 'channel')) {
                const cr = item.channelRenderer;
                const channelId = cr.channelId;
                if (channelId && !seenIds.has(channelId)) {
                  seenIds.add(channelId);
                  const channelAvatar = cr.thumbnail?.thumbnails?.slice(-1)[0]?.url || cr.thumbnail?.thumbnails?.[0]?.url || '';
                  const subText = cr.subscriberCountText?.simpleText || cr.videoCountText?.simpleText || '';
                  results.push({
                    id: channelId,
                    type: 'channel',
                    title: cr.title?.simpleText || 'YouTube Creator',
                    channelTitle: cr.title?.simpleText || 'YouTube Creator',
                    channelId: channelId,
                    channelLogo: channelAvatar,
                    subscriberCount: subText,
                    publishedAt: 'Active',
                    thumbnails: {
                      medium: channelAvatar,
                      high: channelAvatar,
                    },
                    viewCount: subText || 'Subscribers',
                  });
                }
              }
            }
          }

          if (results.length > 0) {
            return res.json({ results: results.slice(0, 30) });
          }
        }
      }
    } catch (err) {}

    return res.json({ results: [] });
  });

  // YouTube Popular / Discovery Feed Proxy
  app.get('/api/popular', async (req, res) => {
    try {
      const targetUrl = `https://www.youtube.com/results?search_query=cinematic+4k+documentary+trailers`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (response.ok) {
        const html = await response.text();
        const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
        if (match) {
          const data = JSON.parse(match[1]);
          const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
          const results: any[] = [];
          for (const s of sections) {
            const items = s.itemSectionRenderer?.contents || [];
            for (const item of items) {
              if (item.videoRenderer) {
                const vr = item.videoRenderer;
                const channelName = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || 'Creator';
                const channelAvatar = vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url;
                results.push({
                  id: vr.videoId,
                  title: vr.title?.runs?.[0]?.text || 'YouTube Video',
                  description: vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.[0]?.text || 'Official YouTube streaming video.',
                  channelId: vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || vr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || 'UC_creator',
                  channelTitle: channelName,
                  channelLogo: channelAvatar,
                  publishedAt: vr.publishedTimeText?.simpleText || 'Recently',
                  thumbnails: {
                    medium: vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`,
                    high: vr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
                  },
                  duration: vr.lengthText?.simpleText ? `PT${vr.lengthText.simpleText.replace(':', 'M')}S` : 'PT10M00S',
                  viewCount: vr.viewCountText?.simpleText || '2.5M views',
                });
              }
            }
          }
          if (results.length > 0) {
            return res.json({ videos: results.slice(0, 24) });
          }
        }
      }
    } catch (err) {}

    return res.json({ videos: [] });
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

  // Explicit Root API Status / Frontend Handler
  app.get('/', (req, res) => {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.json({
      service: 'OmniStream / CineMorph AI Backend API',
      status: 'online',
      endpoints: ['/api/suggest?q=...', '/api/oembed?id=...', '/health'],
      frontend: 'https://0mn1stream.vercel.app',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && process.env.VITE_DEV === "true") {
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
        timestamp: new Date().toISOString(),
      });
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
