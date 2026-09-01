/**
 * posterService.ts — OmniStream Dynamic Video Poster & Preview Extraction Engine
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Implements the official Dynamic Video Preview -> Movie Poster -> CineMorph Ticket pipeline.
 *
 * Strategy & Priority:
 * 1. High-Quality Dedicated Poster / Video Thumbnail (maxresdefault / hqdefault)
 * 2. Intelligent Client-Side Canvas Frame Extraction from Local Media (bypassing black opening frame 0)
 * 3. Graceful Official CineMorph Brand Artwork Fallback (/cinemorph_artwork.png)
 *
 * Features:
 * - Golden-ratio portrait/square focal cropping (35% top offset to preserve faces/subjects)
 * - Luminance check to avoid dark opening frames
 * - Session memory caching (zero duplicate renders)
 * - Full image preloading guarantee before ticket emerges
 */

export interface MediaPosterRequest {
  id?: string;
  sourceUrl: string;
  isLocal: boolean;
  file?: File;
  title?: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  duration?: number;
}

export interface ResolvedPoster {
  url: string;
  width: number;
  height: number;
  sourceType: 'remote_high' | 'remote_fallback' | 'local_extracted' | 'brand_fallback';
}

class PosterService {
  private posterCache = new Map<string, ResolvedPoster>();

  /**
   * Preload an image URL to guarantee instantaneous rendering without pop-in
   */
  public preloadImage(url: string, timeoutMs = 3000): Promise<{ width: number; height: number; success: boolean }> {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return Promise.resolve({ width: 480, height: 480, success: true });
    }

    if (url.startsWith('data:')) {
      return Promise.resolve({ width: 480, height: 480, success: true });
    }

    return new Promise((resolve) => {
      const img = new Image();
      let hasResolved = false;

      const finish = (width: number, height: number, success: boolean) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        resolve({ width, height, success });
      };

      const timer = setTimeout(() => {
        finish(480, 480, false);
      }, timeoutMs);

      img.onload = () => {
        // YouTube returns a 120x90 dummy image for unavailable maxresdefault
        if (img.naturalWidth <= 120 && url.includes('maxresdefault')) {
          finish(img.naturalWidth, img.naturalHeight, false);
        } else {
          finish(img.naturalWidth || 480, img.naturalHeight || 480, true);
        }
      };

      img.onerror = () => {
        finish(480, 480, false);
      };

      img.src = url;
    });
  }

  /**
   * Resolve and preload the best representative poster image for any selected media
   */
  public async resolvePoster(req: MediaPosterRequest): Promise<ResolvedPoster> {
    const cacheKey = req.id || req.sourceUrl || req.title || 'default';
    if (this.posterCache.has(cacheKey)) {
      return this.posterCache.get(cacheKey)!;
    }

    // ── PRIORITY 1: Explicit high-quality poster / thumbnail passed in ──
    if (req.posterUrl) {
      const preload = await this.preloadImage(req.posterUrl);
      if (preload.success) {
        const res: ResolvedPoster = {
          url: req.posterUrl,
          width: preload.width,
          height: preload.height,
          sourceType: 'remote_high',
        };
        this.posterCache.set(cacheKey, res);
        return res;
      }
    }

    if (req.thumbnailUrl) {
      const preload = await this.preloadImage(req.thumbnailUrl);
      if (preload.success) {
        const res: ResolvedPoster = {
          url: req.thumbnailUrl,
          width: preload.width,
          height: preload.height,
          sourceType: 'remote_high',
        };
        this.posterCache.set(cacheKey, res);
        return res;
      }
    }

    // ── PRIORITY 2: Remote YouTube Video ID ──
    if (!req.isLocal && req.sourceUrl) {
      const ytIdMatch = req.sourceUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const ytId = ytIdMatch ? ytIdMatch[1] : (req.sourceUrl.length === 11 ? req.sourceUrl : null);

      if (ytId) {
        // Try maxresdefault first
        const maxResUrl = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;
        const maxResPreload = await this.preloadImage(maxResUrl, 2000);
        if (maxResPreload.success) {
          const res: ResolvedPoster = {
            url: maxResUrl,
            width: maxResPreload.width,
            height: maxResPreload.height,
            sourceType: 'remote_high',
          };
          this.posterCache.set(cacheKey, res);
          return res;
        }

        // Fallback to high quality
        const hqUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
        const hqPreload = await this.preloadImage(hqUrl, 2000);
        const res: ResolvedPoster = {
          url: hqUrl,
          width: hqPreload.width,
          height: hqPreload.height,
          sourceType: 'remote_fallback',
        };
        this.posterCache.set(cacheKey, res);
        return res;
      }
    }

    // ── PRIORITY 3: Client-Side Local Video Intelligent Frame Capture ──
    if (req.isLocal && (req.file || req.sourceUrl)) {
      const extracted = await this.extractLocalVideoFrame(req.file, req.sourceUrl, req.duration);
      if (extracted) {
        const res: ResolvedPoster = {
          url: extracted,
          width: 480,
          height: 480,
          sourceType: 'local_extracted',
        };
        this.posterCache.set(cacheKey, res);
        return res;
      }
    }

    // ── PRIORITY 4: Graceful CineMorph Official Fallback Artwork ──
    const fallbackUrl = '/cinemorph_artwork.png';
    const fallbackPreload = await this.preloadImage(fallbackUrl, 1500);
    const res: ResolvedPoster = {
      url: fallbackUrl,
      width: fallbackPreload.width,
      height: fallbackPreload.height,
      sourceType: 'brand_fallback',
    };
    this.posterCache.set(cacheKey, res);
    return res;
  }

  /**
   * Intelligently extract a representative non-black cinematic frame from local video
   */
  private async extractLocalVideoFrame(file?: File, sourceUrl?: string, hintDuration?: number): Promise<string | null> {
    if (typeof document === 'undefined') return null;

    return new Promise((resolve) => {
      let isBlobOwner = false;
      let mediaUrl = sourceUrl || '';
      if (file && (!mediaUrl || !mediaUrl.startsWith('blob:'))) {
        try {
          mediaUrl = URL.createObjectURL(file);
          isBlobOwner = true;
        } catch (_) {
          return resolve(null);
        }
      }

      if (!mediaUrl) return resolve(null);

      const videoEl = document.createElement('video');
      videoEl.preload = 'auto';
      videoEl.muted = true;
      videoEl.playsInline = true;

      let hasResolved = false;
      const cleanup = () => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        videoEl.removeAttribute('src');
        videoEl.load();
        if (isBlobOwner) {
          try { URL.revokeObjectURL(mediaUrl); } catch (_) {}
        }
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 3000);

      const captureCanvas = (attemptSecondTimestamp = false) => {
        try {
          const vw = videoEl.videoWidth || 640;
          const vh = videoEl.videoHeight || 360;

          if (vw <= 0 || vh <= 0) {
            cleanup();
            return resolve(null);
          }

          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 480; // Crisp near-square movie poster
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            cleanup();
            return resolve(null);
          }

          // Intelligent Golden-Ratio Framing Crop:
          // Slightly offset upward (35% from top instead of 50%) to naturally preserve character faces & heads
          const minDim = Math.min(vw, vh);
          const sx = (vw - minDim) / 2;
          const sy = Math.max(0, (vh - minDim) * 0.35);

          ctx.drawImage(videoEl, sx, sy, minDim, minDim, 0, 0, 480, 480);

          // Fast luminance check to verify frame is not pure black opening screen
          const imgData = ctx.getImageData(0, 0, 32, 32);
          const data = imgData.data;
          let totalLuma = 0;
          for (let i = 0; i < data.length; i += 4) {
            totalLuma += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          }
          const avgLuma = totalLuma / (data.length / 4);

          // If frame is pitch black (<15/255) and we haven't tried alternate seek, try seeking further in
          if (avgLuma < 15 && !attemptSecondTimestamp && videoEl.duration > 8) {
            const alternateSeek = Math.min(30, videoEl.duration * 0.25);
            videoEl.currentTime = alternateSeek;
            videoEl.onseeked = () => captureCanvas(true);
            return;
          }

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          cleanup();
          resolve(dataUrl);
        } catch (_) {
          cleanup();
          resolve(null);
        }
      };

      videoEl.onloadedmetadata = () => {
        const dur = videoEl.duration || hintDuration || 0;
        // Skip opening black frames / logos: sample at 12% or at least 2.5s in
        const seekTarget = dur > 15 ? Math.min(15, Math.max(2.5, dur * 0.12)) : 0.8;
        try {
          videoEl.currentTime = seekTarget;
        } catch (_) {
          captureCanvas();
        }
      };

      videoEl.onseeked = () => {
        captureCanvas();
      };

      videoEl.onerror = () => {
        cleanup();
        resolve(null);
      };

      videoEl.src = mediaUrl;
    });
  }

  /**
   * Clear memory cache for garbage collection
   */
  public clearCache(): void {
    this.posterCache.clear();
  }
}

export const posterService = new PosterService();
