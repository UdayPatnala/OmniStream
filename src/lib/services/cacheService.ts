import { Video } from '../../types';

/**
 * Cache Service - Fast in-memory & localStorage caching for search queries and video candidate rankings.
 * Ensures repeated searches execute in <50ms without redundant API requests.
 */

interface CacheEntry {
  query: string;
  videos: Video[];
  timestamp: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly TTL = 1000 * 60 * 30; // 30 minutes TTL

  public get(query: string): Video[] | null {
    const key = query.trim().toLowerCase();
    const entry = this.memoryCache.get(key);

    if (entry && Date.now() - entry.timestamp < this.TTL) {
      return entry.videos;
    }

    try {
      const stored = localStorage.getItem(`utube_search_cache_${key}`);
      if (stored) {
        const parsed: CacheEntry = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < this.TTL) {
          this.memoryCache.set(key, parsed);
          return parsed.videos;
        }
      }
    } catch (e) {}

    return null;
  }

  public set(query: string, videos: Video[]): void {
    if (!query.trim() || videos.length === 0) return;
    const key = query.trim().toLowerCase();
    const entry: CacheEntry = { query: key, videos, timestamp: Date.now() };

    this.memoryCache.set(key, entry);

    try {
      localStorage.setItem(`utube_search_cache_${key}`, JSON.stringify(entry));
    } catch (e) {}
  }

  public has(query: string): boolean {
    return this.get(query) !== null;
  }

  public clear(): void {
    this.memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('utube_search_cache_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
}

export const cacheService = new CacheService();
