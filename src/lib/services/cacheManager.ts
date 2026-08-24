import { Video } from '../../types';

/**
 * Two-Tier Cache System (Query Cache + Video Metadata Cache) with In-Flight Request Deduplication.
 */

interface CacheRecord<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

class CacheManager {
  private queryCache = new Map<string, CacheRecord<string[]>>();
  private metadataCache = new Map<string, CacheRecord<Video>>();
  private genericCache = new Map<string, CacheRecord<any>>();
  private inFlightRequests = new Map<string, Promise<any>>();
  private readonly QUERY_TTL = 1000 * 60 * 30; // 30 mins
  private readonly METADATA_TTL = 1000 * 60 * 60 * 2; // 2 hours

  // Generic Namespaced Cache Accessors
  public set(namespace: string, key: string, value: any, ttlMs?: number): void {
    const cacheKey = `${namespace}:${key}`;
    this.genericCache.set(cacheKey, { data: value, timestamp: Date.now(), ttl: ttlMs });
  }

  public get(namespace: string, key: string): any | null {
    const cacheKey = `${namespace}:${key}`;
    const entry = this.genericCache.get(cacheKey);
    if (!entry) return null;
    const ttl = entry.ttl ?? this.QUERY_TTL;
    if (Date.now() - entry.timestamp > ttl) {
      this.genericCache.delete(cacheKey);
      return null;
    }
    return entry.data;
  }

  public clear(namespace?: string): void {
    if (!namespace) {
      this.clearAll();
      return;
    }
    const prefix = `${namespace}:`;
    for (const k of Array.from(this.genericCache.keys())) {
      if (k.startsWith(prefix)) {
        this.genericCache.delete(k);
      }
    }
  }

  // Query Cache Accessors
  public getCachedQueryCandidates(query: string): string[] | null {
    const key = query.trim().toLowerCase();
    const entry = this.queryCache.get(key);
    if (entry && Date.now() - entry.timestamp < this.QUERY_TTL) {
      return entry.data;
    }
    return null;
  }

  public setCachedQueryCandidates(query: string, videoIds: string[]): void {
    const key = query.trim().toLowerCase();
    this.queryCache.set(key, { data: videoIds, timestamp: Date.now() });
  }

  // Video Metadata Cache Accessors
  public getCachedVideoMetadata(videoId: string): Video | null {
    const entry = this.metadataCache.get(videoId);
    if (entry && Date.now() - entry.timestamp < this.METADATA_TTL) {
      return entry.data;
    }
    return null;
  }

  public setCachedVideoMetadata(video: Video): void {
    this.metadataCache.set(video.id, { data: video, timestamp: Date.now() });
  }

  // In-Flight Request Deduplication
  public deduplicateRequest<T>(requestKey: string, fetchFn: () => Promise<T>): Promise<T> {
    const key = requestKey.trim().toLowerCase();
    
    if (this.inFlightRequests.has(key)) {
      console.log(`[CacheManager] In-flight deduplication hit for key: "${key}"`);
      return this.inFlightRequests.get(key)! as Promise<T>;
    }

    const promise = fetchFn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  // Background TTL Garbage Collector
  public pruneExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.queryCache.entries()) {
      if (now - record.timestamp >= this.QUERY_TTL) {
        this.queryCache.delete(key);
      }
    }
    for (const [key, record] of this.metadataCache.entries()) {
      if (now - record.timestamp >= this.METADATA_TTL) {
        this.metadataCache.delete(key);
      }
    }
  }

  public clearAll(): void {
    this.queryCache.clear();
    this.metadataCache.clear();
    this.inFlightRequests.clear();
  }
}

export const cacheManager = new CacheManager();

// Automatically schedule periodic background cache pruning
if (typeof window !== 'undefined') {
  setInterval(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => cacheManager.pruneExpired());
    } else {
      cacheManager.pruneExpired();
    }
  }, 1000 * 60 * 10); // Every 10 mins
}

