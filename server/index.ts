import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { APP_VERSION } from "../src/core/config/version";

dotenv.config();

export async function startServer() {
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
      service: 'OmniStream Backend API',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/api/suggest', async (req, res) => {
    const rawQuery = (req.query.q as string) || '';
    const query = rawQuery.trim().slice(0, 100);
    if (!query) return res.json([]);
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return res.json(data[1].slice(0, 8));
        }
      }
      return res.json([]);
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Upstream timeout',
          code: 'UPSTREAM_TIMEOUT',
          message: 'Google suggestion service timed out',
          timestamp: new Date().toISOString(),
        });
      }
      return res.json([]);
    }
  });

  // YouTube Real Search Proxy Endpoint
  app.get('/api/search', async (req, res) => {
    const rawQuery = (req.query.q as string) || '';
    const query = rawQuery.trim().slice(0, 100);
    const filterType = (req.query.type as string) || 'all';
    if (!query) return res.json({ results: [] });

    try {
      const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const response = await fetch(targetUrl, {
        signal: AbortSignal.timeout(6000),
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
                  results.push({
                    type: 'video',
                    id: videoId,
                    title: vr.title?.runs?.[0]?.text || '',
                    description: vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') || '',
                    channelTitle: vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || '',
                    channelId: vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || vr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
                    channelAvatar: channelAvatar || '',
                    thumbnails: {
                      default: vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/default.jpg`,
                      medium: vr.thumbnail?.thumbnails?.[1]?.url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                      high: vr.thumbnail?.thumbnails?.[2]?.url || vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    },
                    duration: vr.lengthText?.simpleText || '',
                    viewCount: vr.viewCountText?.simpleText || '',
                    publishedAt: vr.publishedTimeText?.simpleText || '',
                  });
                }
              } else if (item.channelRenderer && (filterType === 'all' || filterType === 'channel')) {
                const cr = item.channelRenderer;
                const channelId = cr.channelId;
                if (channelId && !seenIds.has(channelId)) {
                  seenIds.add(channelId);
                  results.push({
                    type: 'channel',
                    id: channelId,
                    title: cr.title?.simpleText || '',
                    description: cr.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '',
                    channelTitle: cr.title?.simpleText || '',
                    channelId,
                    channelAvatar: cr.thumbnail?.thumbnails?.[0]?.url || '',
                    thumbnails: {
                      default: cr.thumbnail?.thumbnails?.[0]?.url || '',
                      medium: cr.thumbnail?.thumbnails?.[0]?.url || '',
                      high: cr.thumbnail?.thumbnails?.[0]?.url || '',
                    },
                    subscriberCount: cr.subscriberCountText?.simpleText || cr.videoCountText?.simpleText || '',
                  });
                }
              }
            }
          }

          if (results.length > 0) {
            return res.json({ results });
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Upstream timeout',
          code: 'UPSTREAM_TIMEOUT',
          message: 'YouTube search upstream request timed out',
          timestamp: new Date().toISOString(),
        });
      }
      console.warn("YouTube search scraping failed, falling back to mock results:", err);
    }

    return res.json({ results: [] });
  });

  // Channel Profile & Videos Proxy Endpoint
  app.get('/api/channel', async (req, res) => {
    const channelId = (req.query.id as string) || '';
    if (!channelId) return res.status(400).json({ error: 'Missing channel id' });

    try {
      const isHandle = channelId.startsWith('@');
      const targetUrl = isHandle 
        ? `https://www.youtube.com/${encodeURIComponent(channelId)}`
        : `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`;

      const response = await fetch(targetUrl, {
        signal: AbortSignal.timeout(6000),
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
          const header = data.header?.c4TabbedHeaderRenderer || data.header?.pageHeaderRenderer;
          const metadata = data.metadata?.channelMetadataRenderer;

          const title = header?.title || metadata?.title || channelId;
          const description = metadata?.description || '';
          const avatar = metadata?.avatar?.thumbnails?.[0]?.url || header?.avatar?.thumbnails?.[0]?.url || '';
          const banner = header?.banner?.thumbnails?.[header?.banner?.thumbnails?.length - 1]?.url || '';
          const subscriberCount = header?.subscriberCountText?.simpleText || '';

          return res.json({
            id: channelId,
            title,
            description,
            customUrl: metadata?.vanityChannelUrl || '',
            avatar,
            banner,
            subscriberCount,
            videoCount: header?.videosCountText?.runs?.[0]?.text || '',
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Upstream timeout',
          code: 'UPSTREAM_TIMEOUT',
          message: 'Channel profile request timed out',
          timestamp: new Date().toISOString(),
        });
      }
      console.warn("Channel scrape failed:", err);
    }

    return res.status(404).json({ error: 'Channel not found' });
  });

  // Channel Videos Endpoint
  app.get('/api/channel/videos', async (req, res) => {
    const channelId = (req.query.id as string) || '';
    if (!channelId) return res.status(400).json({ error: 'Missing channel id' });

    try {
      const isHandle = channelId.startsWith('@');
      const targetUrl = isHandle 
        ? `https://www.youtube.com/${encodeURIComponent(channelId)}/videos`
        : `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`;

      const response = await fetch(targetUrl, {
        signal: AbortSignal.timeout(6000),
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
          const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
          const videoTab = tabs.find((t: any) => t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected);
          const gridItems = videoTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

          const videos: any[] = [];
          for (const item of gridItems) {
            const vr = item.richItemRenderer?.content?.videoRenderer;
            if (vr && vr.videoId) {
              videos.push({
                id: vr.videoId,
                title: vr.title?.runs?.[0]?.text || '',
                description: vr.descriptionSnippet?.runs?.[0]?.text || '',
                channelTitle: vr.ownerText?.runs?.[0]?.text || '',
                channelId,
                thumbnails: {
                  default: vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/default.jpg`,
                  medium: vr.thumbnail?.thumbnails?.[1]?.url || `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`,
                  high: vr.thumbnail?.thumbnails?.[2]?.url || vr.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
                },
                duration: vr.lengthText?.simpleText || '',
                viewCount: vr.viewCountText?.simpleText || '',
                publishedAt: vr.publishedTimeText?.simpleText || '',
              });
            }
          }

          if (videos.length > 0) {
            return res.json({ videos });
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Upstream timeout',
          code: 'UPSTREAM_TIMEOUT',
          message: 'Channel videos request timed out',
          timestamp: new Date().toISOString(),
        });
      }
      console.warn("Channel videos scrape failed:", err);
    }

    return res.json({ videos: [] });
  });

  app.get('/api/oembed', async (req, res) => {
    const rawId = (req.query.id as string) || '';
    const id = rawId.trim();
    if (!id) return res.status(400).json({ error: 'Missing video id' });
    
    // Strict SSRF guard: YouTube IDs are strictly 11 alphanumeric characters, dashes, or underscores
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid video id format',
        code: 'INVALID_ID',
        message: 'Video ID must be exactly 11 base64url characters',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const targetUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`;
      const response = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
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
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Upstream timeout',
          code: 'UPSTREAM_TIMEOUT',
          message: 'oEmbed upstream request timed out',
          timestamp: new Date().toISOString(),
        });
      }
    }

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

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] Closed remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
