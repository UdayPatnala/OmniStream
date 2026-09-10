/**
 * OMS Media Resolver (Core Infrastructure)
 * Copyright (c) Patnala Uday Kumar. All rights reserved.
 *
 * Provides product-neutral metadata resolution for external media streams
 * using open unauthenticated oEmbed protocols without importing U-Tube or CineMorph internals.
 */

export interface ExternalMediaMeta {
  id: string;
  title: string;
  authorName?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

export async function resolveExternalMediaMeta(videoId: string): Promise<ExternalMediaMeta | null> {
  if (!videoId || typeof videoId !== 'string') return null;

  const cleanId = videoId.trim();

  try {
    const targetUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(cleanId)}&format=json`;
    const res = await fetch(targetUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        id: cleanId,
        title: data.title || `Media Presentation: ${cleanId}`,
        authorName: data.author_name || 'Media Author',
        thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
      };
    }
  } catch {
    // Network or offline fallback
  }

  return {
    id: cleanId,
    title: `Feature: ${cleanId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
  };
}
