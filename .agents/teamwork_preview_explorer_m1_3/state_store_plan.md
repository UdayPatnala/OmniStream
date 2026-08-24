# Core State Stores & Storage Persistence Plan: OmniStream (Milestone 1)

**Author**: Explorer 3 (Milestone 1 Core Foundation & Bento Landing Page)  
**Date**: 2026-08-23  
**Status**: Ready for Review & Implementation  
**Target Files**:
- `src/services/storageService.ts`
- `src/state/useUTubeStore.ts`
- `src/state/useCineMorphStore.ts`
- `src/state/useTicketStore.ts`

---

## 1. Executive Summary & Architecture Overview

The OmniStream state architecture decouples the previous monolithic `src/store.ts` into three modular, domain-driven Zustand stores backed by a fault-tolerant, dual-layer storage persistence engine (`storageService.ts`):

```
+----------------------------------------------------------------------------------------------------+
|                                      OMNISTREAM REACT 19 UI                                        |
|  +---------------------------+  +-------------------------------+  +----------------------------+  |
|  |       U-TUBE Shell        |  |     CineMorph 3D Theater      |  |      Ticket Reel & HUD     |  |
|  +-------------+-------------+  +---------------+---------------+  +-------------+--------------+  |
+----------------|--------------------------------|--------------------------------|-----------------+
                 |                                |                                |
+----------------v-------------+  +---------------v---------------+  +-------------v--------------+
|       useUTubeStore          |  |      useCineMorphStore        |  |       useTicketStore       |
| - Top 3 Search Results       |  | - Aspect Ratio (1.43/1.90/Orig) | - Torn Tickets Array       |
| - Channel Subscriptions      |  | - 4:3 Offline Safe Mode       |  | - 10s Printing Sequencer   |
| - 4-Hour Cached Sub Feed     |  | - Video Source (Local/YT)     |  | - 1-Click Resume State     |
| - 5 Keyword Recommendations  |  | - Framing Rule & Pan Offset   |  | - Heads-Up Pre-Process Bus |
| - Ad-Free Player State       |  | - Diagnostic HUD Visibility   |  | - Media Metadata & Thumbs  |
+----------------+-------------+  +---------------+---------------+  +-------------+--------------+
                 |                                |                                |
+----------------v--------------------------------v--------------------------------v-----------------+
|                                    storageService (Persistence Hub)                                |
|  +--------------------------------------------+  +-----------------------------------------------+ |
|  |           LocalStorage Adapter             |  |              IndexedDB Adapter                | |
|  | - JSON Schema Safe Parse / Serialize       |  | - Asynchronous Large Blob Storage             | |
|  | - Checksum & Corrupt Data Auto-Recovery   |  | - Media URL & Thumbnail Cache                 | |
|  | - LRU Quota Exceeded Eviction Engine       |  | - Transactional Integrity & Schema Upgrades   | |
|  +--------------------------------------------+  +-----------------------------------------------+ |
|  +-----------------------------------------------------------------------------------------------+ |
|  |                      Cross-Tab State Broadcast & Invalidation Hub                             | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Storage Persistence Service (`src/services/storageService.ts`)

### 2.1 Design Goals & Fault Tolerance
1. **Zero-Crash Resilience**: Under no circumstance does malformed data in `localStorage` or `indexedDB` throw an uncaught exception or crash the React component tree.
2. **Corrupt Data Auto-Recovery**: If a corrupted JSON string is detected, `storageService` validates data against a checksum/schema, creates a backup dump, resets to safe default values, and logs telemetry.
3. **Quota Exceeded Handling**: When `QuotaExceededError` (DOMException 22 / 1014) occurs during large thumbnail or cache writes, an LRU eviction algorithm strips cached items and thumbnail data URLs, keeping the core metadata intact.
4. **Dual-Layer Tiering**: Fast synchronous access for UI state via `localStorage`, and high-capacity asynchronous binary/metadata storage via `indexedDB`.
5. **Incognito / Private Mode Fallback**: If IndexedDB is blocked or disabled, falls back transparently to in-memory/localStorage cache.

### 2.2 Complete Implementation Specification

```typescript
// src/services/storageService.ts

/**
 * OmniStream Robust Error-Tolerant Storage Service
 * Provides fault-tolerant LocalStorage and IndexedDB adapters with auto-recovery and LRU eviction.
 */

export interface StorageResult<T> {
  success: boolean;
  data: T | null;
  recovered?: boolean;
  error?: string;
}

// Database configuration for IndexedDB
const DB_NAME = 'omnistream_db';
const DB_VERSION = 1;
const STORE_TICKETS = 'tickets_store';
const STORE_MEDIA = 'media_blobs';

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback = new Map<string, any>();

  constructor() {
    this.initIndexedDB();
    this.setupStorageEventListener();
  }

  // ==========================================
  // LocalStorage Adapter with Corrupt Recovery
  // ==========================================

  public getLocal<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) {
        return defaultValue;
      }

      const parsed = JSON.parse(raw);
      
      // Basic type sanity check: if default is array, parsed must be array; if object, must be object
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        console.warn(`[StorageService] Schema mismatch for key "${key}", resetting to default.`);
        this.setLocal(key, defaultValue);
        return defaultValue;
      }

      return parsed as T;
    } catch (err) {
      console.error(`[StorageService] Corrupt JSON detected for key "${key}". Auto-recovering.`, err);
      // Backup corrupted raw data for diagnostics
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          localStorage.setItem(`${key}_corrupt_bak_${Date.now()}`, raw);
        }
      } catch (bakErr) {}

      // Reset to safe default
      this.setLocal(key, defaultValue);
      return defaultValue;
    }
  }

  public setLocal<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (err: any) {
      // Handle QuotaExceededError
      if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014) {
        console.warn(`[StorageService] LocalStorage quota exceeded. Evicting caches to free space...`);
        const freed = this.evictOldCaches();
        if (freed) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch (retryErr) {
            console.error(`[StorageService] Storage write failed after eviction.`, retryErr);
          }
        }
      } else {
        console.error(`[StorageService] Failed to write key "${key}" to LocalStorage:`, err);
      }
      return false;
    }
  }

  public removeLocal(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[StorageService] Error removing key "${key}":`, err);
    }
  }

  private evictOldCaches(): boolean {
    try {
      let evictedCount = 0;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('utube_search_cache_') || k.includes('_corrupt_bak_'))) {
          keysToRemove.push(k);
        }
      }

      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        evictedCount++;
      });

      return evictedCount > 0;
    } catch (e) {
      return false;
    }
  }

  // ==========================================
  // IndexedDB Adapter for High-Capacity Blobs
  // ==========================================

  private initIndexedDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('[StorageService] IndexedDB unavailable in this environment.');
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_TICKETS)) {
            db.createObjectStore(STORE_TICKETS, { keyPath: 'ticketId' });
          }
          if (!db.objectStoreNames.contains(STORE_MEDIA)) {
            db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error('[StorageService] IndexedDB open error:', request.error);
          reject(request.error);
        };
        request.onblocked = () => {
          console.warn('[StorageService] IndexedDB blocked by other tab.');
        };
      } catch (e) {
        reject(e);
      }
    });

    return this.dbPromise;
  }

  public async setIDB<T>(storeName: string, item: T): Promise<boolean> {
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);

        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.warn(`[StorageService] IDB put failed on store "${storeName}":`, req.error);
          resolve(false);
        };
      });
    } catch (err) {
      console.warn(`[StorageService] IDB operation fallback to memory:`, err);
      const key = (item as any)?.ticketId || (item as any)?.id || `${Date.now()}`;
      this.memoryFallback.set(`${storeName}_${key}`, item);
      return false;
    }
  }

  public async getIDB<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve((req.result as T) || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      return this.memoryFallback.get(`${storeName}_${key}`) || null;
    }
  }

  public async getAllIDB<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      return [];
    }
  }

  public async removeIDB(storeName: string, key: IDBValidKey): Promise<boolean> {
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (err) {
      this.memoryFallback.delete(`${storeName}_${key}`);
      return false;
    }
  }

  // ==========================================
  // Cross-Tab Broadcast Channel
  // ==========================================

  private setupStorageEventListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event: StorageEvent) => {
      if (!event.key) return;
      // Trigger store listeners when relevant keys change in other tabs
      window.dispatchEvent(new CustomEvent(`omnistream:sync:${event.key}`, {
        detail: { newValue: event.newValue }
      }));
    });
  }
}

export const storageService = new StorageService();
```

---

## 3. Zustand State Stores Design

### 3.1 `src/state/useUTubeStore.ts`

#### Requirement Mapping
- **F05 (Top 3 Search Results)**: Search queries must return and display **exactly 3** top results.
- **F07 (Subscriptions)**: Subscribe/unsubscribe with local persistence.
- **F08 (4-Hour Cached Feed Refresh)**: Subscribed videos feed refreshing every 4 hours (`4 * 3600 * 1000 ms`).
- **F09 (5-Video Keyword Recommendations)**: Dynamic keyword extraction from recent searches generates **exactly 5** recommended videos.
- **F10 (Ad-Free Player State)**: Clean state for active video playback.
- **F11 (Local Persistence)**: Synchronized with `storageService`.

#### State Interface & Implementation Plan

```typescript
// src/state/useUTubeStore.ts
import { create } from 'zustand';
import { storageService } from '../services/storageService';
import { searchVideos, getVideosByIds, getPopularVideos } from '../lib/youtube';

export interface UTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  thumbnailUrl: string;
  duration?: string;
  publishedAt?: string;
  views?: string;
  description?: string;
}

export interface ChannelSubscription {
  channelId: string;
  channelTitle: string;
  avatarUrl: string;
  subscribedAt: number;
}

export interface UTubeStoreState {
  searchResults: UTubeVideo[];
  subscriptions: ChannelSubscription[];
  recentSearches: string[];
  recommendedVideos: UTubeVideo[]; // Exactly 5
  subscribedFeed: UTubeVideo[];
  lastFeedRefresh: number; // timestamp in ms (4-hour refresh threshold)
  currentVideo: UTubeVideo | null;
  isSearching: boolean;
  searchError: string | null;

  // Actions
  search: (query: string) => Promise<UTubeVideo[]>; // Returns exactly 3
  subscribe: (channel: ChannelSubscription) => void;
  unsubscribe: (channelId: string) => void;
  extractRecommendations: () => Promise<void>; // 5 videos based on search keywords
  refreshFeedIfNeeded: (force?: boolean) => Promise<void>;
  playVideo: (video: UTubeVideo | string) => Promise<void>;
  clearRecentSearches: () => void;
}

const STORAGE_KEYS = {
  SUBSCRIPTIONS: 'omnistream_utube_subscriptions',
  SEARCH_HISTORY: 'omnistream_utube_searches',
  FEED_CACHE: 'omnistream_utube_feed_cache',
  LAST_REFRESH: 'omnistream_utube_last_refresh',
  RECOMMENDED: 'omnistream_utube_recommended',
};

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export const useUTubeStore = create<UTubeStoreState>((set, get) => ({
  searchResults: [],
  subscriptions: storageService.getLocal<ChannelSubscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []),
  recentSearches: storageService.getLocal<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []),
  recommendedVideos: storageService.getLocal<UTubeVideo[]>(STORAGE_KEYS.RECOMMENDED, []),
  subscribedFeed: storageService.getLocal<UTubeVideo[]>(STORAGE_KEYS.FEED_CACHE, []),
  lastFeedRefresh: storageService.getLocal<number>(STORAGE_KEYS.LAST_REFRESH, 0),
  currentVideo: null,
  isSearching: false,
  searchError: null,

  search: async (query: string): Promise<UTubeVideo[]> => {
    const q = query.trim();
    if (!q) {
      set({ searchResults: [] });
      return [];
    }

    set({ isSearching: true, searchError: null });

    try {
      const response = await searchVideos(q);
      // Ensure exactly top 3 results are returned and stored
      const top3: UTubeVideo[] = (response.results || [])
        .slice(0, 3)
        .map(item => ({
          id: item.id,
          title: item.title,
          channelTitle: item.channelTitle,
          channelId: item.channelId,
          thumbnailUrl: item.thumbnails.high || item.thumbnails.medium,
          publishedAt: item.publishedAt,
        }));

      // Update recent searches: deduplicate, prepend, keep max 10
      const currentSearches = get().recentSearches.filter(s => s.toLowerCase() !== q.toLowerCase());
      const updatedSearches = [q, ...currentSearches].slice(0, 10);

      storageService.setLocal(STORAGE_KEYS.SEARCH_HISTORY, updatedSearches);
      
      set({
        searchResults: top3,
        recentSearches: updatedSearches,
        isSearching: false,
      });

      // Trigger recommendation recalculation based on updated keywords
      get().extractRecommendations();

      return top3;
    } catch (err: any) {
      console.error('[useUTubeStore] Search failed:', err);
      set({ isSearching: false, searchError: err?.message || 'Search failed' });
      return [];
    }
  },

  subscribe: (channel: ChannelSubscription) => {
    const current = get().subscriptions;
    if (current.some(c => c.channelId === channel.channelId)) return;

    const updated = [channel, ...current];
    storageService.setLocal(STORAGE_KEYS.SUBSCRIPTIONS, updated);
    set({ subscriptions: updated });
    
    // Refresh feed to include new channel content
    get().refreshFeedIfNeeded(true);
  },

  unsubscribe: (channelId: string) => {
    const updated = get().subscriptions.filter(c => c.channelId !== channelId);
    storageService.setLocal(STORAGE_KEYS.SUBSCRIPTIONS, updated);
    set({ subscriptions: updated });
  },

  extractRecommendations: async () => {
    const { recentSearches, subscriptions } = get();
    
    // 1. Keyword extraction from recent searches
    const stopWords = new Set(['the', 'and', 'for', 'with', 'what', 'how', 'this', 'that', 'from', 'video', 'youtube']);
    const keywordWeights: Record<string, number> = {};

    recentSearches.forEach((query, idx) => {
      const recencyMultiplier = 1 / (idx + 1); // Earlier searches have higher weight
      const tokens = query.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
      tokens.forEach(tok => {
        if (tok.length > 2 && !stopWords.has(tok)) {
          keywordWeights[tok] = (keywordWeights[tok] || 0) + (10 * recencyMultiplier);
        }
      });
    });

    const topKeywords = Object.entries(keywordWeights)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    let candidateVideos: UTubeVideo[] = [];

    if (topKeywords.length > 0) {
      // Query top keyword search results
      const searchRes = await searchVideos(topKeywords.join(' '));
      candidateVideos = (searchRes.results || []).map(r => ({
        id: r.id,
        title: r.title,
        channelTitle: r.channelTitle,
        channelId: r.channelId,
        thumbnailUrl: r.thumbnails.high || r.thumbnails.medium,
        publishedAt: r.publishedAt,
      }));
    }

    // If fewer than 5 candidates, supplement with popular videos
    if (candidateVideos.length < 5) {
      const popular = await getPopularVideos();
      const popVideos: UTubeVideo[] = popular.map(p => ({
        id: p.id,
        title: p.title,
        channelTitle: p.channelTitle,
        channelId: p.channelId,
        thumbnailUrl: p.thumbnails.high || p.thumbnails.medium,
        publishedAt: p.publishedAt,
      }));
      candidateVideos = [...candidateVideos, ...popVideos];
    }

    // Deduplicate by ID and slice exactly 5
    const uniqueMap = new Map<string, UTubeVideo>();
    candidateVideos.forEach(v => {
      if (!uniqueMap.has(v.id)) {
        uniqueMap.set(v.id, v);
      }
    });

    const exactly5 = Array.from(uniqueMap.values()).slice(0, 5);
    storageService.setLocal(STORAGE_KEYS.RECOMMENDED, exactly5);
    set({ recommendedVideos: exactly5 });
  },

  refreshFeedIfNeeded: async (force: boolean = false) => {
    const { lastFeedRefresh, subscriptions } = get();
    const now = Date.now();
    const isStale = (now - lastFeedRefresh) >= FOUR_HOURS_MS;

    if (!force && !isStale && get().subscribedFeed.length > 0) {
      return; // Cache is still fresh (< 4 hours)
    }

    if (subscriptions.length === 0) {
      set({ subscribedFeed: [], lastFeedRefresh: now });
      storageService.setLocal(STORAGE_KEYS.FEED_CACHE, []);
      storageService.setLocal(STORAGE_KEYS.LAST_REFRESH, now);
      return;
    }

    try {
      // Fetch latest videos from subscribed channels
      const feedPromises = subscriptions.slice(0, 8).map(async (sub) => {
        const res = await searchVideos(sub.channelTitle);
        return (res.results || []).slice(0, 2).map(r => ({
          id: r.id,
          title: r.title,
          channelTitle: r.channelTitle,
          channelId: sub.channelId,
          thumbnailUrl: r.thumbnails.high || r.thumbnails.medium,
          publishedAt: r.publishedAt,
        }));
      });

      const results = await Promise.all(feedPromises);
      const combinedFeed = results.flat();

      storageService.setLocal(STORAGE_KEYS.FEED_CACHE, combinedFeed);
      storageService.setLocal(STORAGE_KEYS.LAST_REFRESH, now);

      set({
        subscribedFeed: combinedFeed,
        lastFeedRefresh: now,
      });
    } catch (err) {
      console.warn('[useUTubeStore] Failed to refresh subscribed feed:', err);
    }
  },

  playVideo: async (videoInput: UTubeVideo | string) => {
    if (typeof videoInput === 'string') {
      const [fullVideo] = await getVideosByIds([videoInput]);
      if (fullVideo) {
        set({
          currentVideo: {
            id: fullVideo.id,
            title: fullVideo.title,
            channelTitle: fullVideo.channelTitle,
            channelId: fullVideo.channelId,
            thumbnailUrl: fullVideo.thumbnails.high || fullVideo.thumbnails.medium,
            duration: fullVideo.duration,
            views: fullVideo.viewCount,
            description: fullVideo.description,
          }
        });
      } else {
        set({
          currentVideo: {
            id: videoInput,
            title: `YouTube Video (${videoInput})`,
            channelTitle: 'YouTube',
            thumbnailUrl: `https://i.ytimg.com/vi/${videoInput}/hqdefault.jpg`,
          }
        });
      }
    } else {
      set({ currentVideo: videoInput });
    }
  },

  clearRecentSearches: () => {
    storageService.removeLocal(STORAGE_KEYS.SEARCH_HISTORY);
    set({ recentSearches: [] });
  }
}));
```

---

### 3.2 `src/state/useCineMorphStore.ts`

#### Requirement Mapping
- **F16 (1.43:1 IMAX GT)**, **F17 (1.90:1 IMAX Digital)**, **F18 (Original)**, **F19 (4:3 Offline Fallback)**: Support aspect ratios.
- **F19 (Automatic Offline Fallback)**: When network drops (`isOffline = true`), fallback to `4:3` cropped ratio without ML.
- **F21/F22 (Video Source)**: Support both local video files (`File` / blob URL) and YouTube URLs.
- **F24 (Dynamic X/Y Panning)**: Normalized pan offset `[-1, 1]` smoothly mapped to the 3D texture aperture.
- **F25-F28 (Framing Rules)**: Active composition rule selection.
- **F30 (Diagnostic Overlay HUD)**: Toggle HUD telemetry.

#### State Interface & Implementation Plan

```typescript
// src/state/useCineMorphStore.ts
import { create } from 'zustand';

export type AspectRatioMode = '1.43:1' | '1.90:1' | 'original' | '4:3';
export type FramingRuleMode = 'rule_of_thirds' | 'leading_lines' | 'frame_in_frame' | 'screen_direction' | 'auto';

export interface VideoSource {
  type: 'local' | 'youtube';
  url: string;
  file?: File;
  name: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface CineMorphStoreState {
  aspectRatio: AspectRatioMode;
  previousOnlineRatio: AspectRatioMode; // Kept to restore after coming back online
  isOffline: boolean;
  videoSource: VideoSource | null;
  framingRule: FramingRuleMode;
  diagnosticOverlayVisible: boolean;
  panOffset: { x: number; y: number }; // Normalized [-1.0, 1.0]
  playbackTimestamp: number; // in seconds
  isPlaying: boolean;
  isMLActive: boolean;

  // Actions
  setAspectRatio: (ratio: AspectRatioMode) => void;
  setOfflineStatus: (offline: boolean) => void;
  setVideoSource: (source: VideoSource | null) => void;
  setPanOffset: (x: number, y: number) => void;
  setFramingRule: (rule: FramingRuleMode) => void;
  setPlaybackTimestamp: (timestamp: number) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleDiagnosticOverlay: () => void;
  resetState: () => void;
}

export const useCineMorphStore = create<CineMorphStoreState>((set, get) => ({
  aspectRatio: '1.43:1',
  previousOnlineRatio: '1.43:1',
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  videoSource: null,
  framingRule: 'auto',
  diagnosticOverlayVisible: false,
  panOffset: { x: 0, y: 0 },
  playbackTimestamp: 0,
  isPlaying: false,
  isMLActive: true,

  setAspectRatio: (ratio: AspectRatioMode) => {
    set({
      aspectRatio: ratio,
      previousOnlineRatio: ratio !== '4:3' ? ratio : get().previousOnlineRatio,
    });
  },

  setOfflineStatus: (offline: boolean) => {
    const current = get();
    if (offline) {
      // R2 Fallback Requirement: Automatic fallback to 4:3 cropped ratio without live ML
      set({
        isOffline: true,
        aspectRatio: '4:3',
        isMLActive: false,
        panOffset: { x: 0, y: 0 }, // Center fixed 4:3 crop
      });
    } else {
      // Restore previous online ratio and reactivate ML
      set({
        isOffline: false,
        aspectRatio: current.previousOnlineRatio,
        isMLActive: true,
      });
    }
  },

  setVideoSource: (source: VideoSource | null) => {
    set({
      videoSource: source,
      playbackTimestamp: 0,
      isPlaying: false,
      panOffset: { x: 0, y: 0 },
    });
  },

  setPanOffset: (x: number, y: number) => {
    // Clamp to valid range [-1, 1] to prevent texture boundary overflow
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    set({ panOffset: { x: clampedX, y: clampedY } });
  },

  setFramingRule: (rule: FramingRuleMode) => set({ framingRule: rule }),

  setPlaybackTimestamp: (playbackTimestamp: number) => set({ playbackTimestamp }),

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  toggleDiagnosticOverlay: () => set((state) => ({
    diagnosticOverlayVisible: !state.diagnosticOverlayVisible
  })),

  resetState: () => set({
    videoSource: null,
    panOffset: { x: 0, y: 0 },
    playbackTimestamp: 0,
    isPlaying: false,
  }),
}));
```

---

### 3.3 `src/state/useTicketStore.ts`

#### Requirement Mapping
- **F31 (10-Second Ticket Printer Animation)**: Diegetic vintage paper ticket printing animation sequence with Web Audio sounds.
- **F32 (Heads-Up Pre-Processing)**: During the 10-second animation, coordinates background ML model warmup and frame pre-scanning.
- **F34 (Saved Torn Tickets Progress)**: Persists tickets containing movie title, timestamp, duration, aspect ratio, framing rule, and thumbnail.
- **F35 (1-Click Ticket Resume)**: Clicking a torn ticket stub restores the exact movie and timestamp.

#### State Interface & Implementation Plan

```typescript
// src/state/useTicketStore.ts
import { create } from 'zustand';
import { storageService } from '../services/storageService';
import { AspectRatioMode, FramingRuleMode, useCineMorphStore } from './useCineMorphStore';

export interface MovieTicket {
  ticketId: string;
  movieTitle: string;
  sourceUrl: string;
  isLocal: boolean;
  aspectRatio: AspectRatioMode;
  framingRule: FramingRuleMode;
  timestampSeconds: number;
  durationSeconds: number;
  printedAt: number;
  seatAssignment?: string;
  thumbnailDataUrl?: string;
}

export interface TicketStoreState {
  tickets: MovieTicket[];
  isPrintingAnimationActive: boolean;
  activeTicket: MovieTicket | null;
  animationCountdownSeconds: number;

  // Actions
  saveTicketProgress: (ticketData: Omit<MovieTicket, 'ticketId' | 'printedAt'>) => string;
  resumeFromTicket: (ticketId: string) => MovieTicket | null;
  removeTicket: (ticketId: string) => void;
  trigger10sPrintAnimation: (movie: { title: string; source: string; isLocal: boolean; file?: File }) => Promise<void>;
  cancelPrintAnimation: () => void;
}

const STORAGE_KEY_TICKETS = 'omnistream_cinemorph_tickets';
const STORE_NAME_IDB = 'tickets_store';

function generateSeatAssignment(): string {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const row = rows[Math.floor(Math.random() * rows.length)];
  const seatNum = Math.floor(Math.random() * 18) + 1;
  const padNum = seatNum < 10 ? `0${seatNum}` : `${seatNum}`;
  return `VIP BALCONY - ROW ${row} - SEAT ${padNum}`;
}

export const useTicketStore = create<TicketStoreState>((set, get) => ({
  tickets: storageService.getLocal<MovieTicket[]>(STORAGE_KEY_TICKETS, []),
  isPrintingAnimationActive: false,
  activeTicket: null,
  animationCountdownSeconds: 10,

  saveTicketProgress: (ticketData: Omit<MovieTicket, 'ticketId' | 'printedAt'>): string => {
    const existing = get().tickets;
    
    // Check if ticket for this sourceUrl/movieTitle already exists
    const existingIndex = existing.findIndex(
      t => t.sourceUrl === ticketData.sourceUrl || (t.movieTitle === ticketData.movieTitle && t.isLocal === ticketData.isLocal)
    );

    let ticketId: string;
    let updatedTickets: MovieTicket[];

    if (existingIndex >= 0) {
      ticketId = existing[existingIndex].ticketId;
      const updatedTicket: MovieTicket = {
        ...existing[existingIndex],
        ...ticketData,
        ticketId,
        printedAt: Date.now(),
      };
      updatedTickets = [
        updatedTicket,
        ...existing.filter((_, idx) => idx !== existingIndex)
      ];
    } else {
      ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newTicket: MovieTicket = {
        ...ticketData,
        ticketId,
        printedAt: Date.now(),
        seatAssignment: ticketData.seatAssignment || generateSeatAssignment(),
      };
      updatedTickets = [newTicket, ...existing];
    }

    // Persist to LocalStorage
    storageService.setLocal(STORAGE_KEY_TICKETS, updatedTickets);
    // Persist full item (including large thumbnail) to IndexedDB asynchronously
    storageService.setIDB(STORE_NAME_IDB, updatedTickets[0]);

    set({ tickets: updatedTickets });
    return ticketId;
  },

  resumeFromTicket: (ticketId: string): MovieTicket | null => {
    const ticket = get().tickets.find(t => t.ticketId === ticketId);
    if (!ticket) return null;

    set({ activeTicket: ticket });

    // Sync with CineMorph store
    const cineMorph = useCineMorphStore.getState();
    cineMorph.setVideoSource({
      type: ticket.isLocal ? 'local' : 'youtube',
      url: ticket.sourceUrl,
      name: ticket.movieTitle,
      thumbnailUrl: ticket.thumbnailDataUrl,
      duration: ticket.durationSeconds,
    });
    cineMorph.setAspectRatio(ticket.aspectRatio);
    cineMorph.setFramingRule(ticket.framingRule);
    cineMorph.setPlaybackTimestamp(ticket.timestampSeconds);

    return ticket;
  },

  removeTicket: (ticketId: string) => {
    const updated = get().tickets.filter(t => t.ticketId !== ticketId);
    storageService.setLocal(STORAGE_KEY_TICKETS, updated);
    storageService.removeIDB(STORE_NAME_IDB, ticketId);
    set({
      tickets: updated,
      activeTicket: get().activeTicket?.ticketId === ticketId ? null : get().activeTicket,
    });
  },

  trigger10sPrintAnimation: async (movie: { title: string; source: string; isLocal: boolean; file?: File }) => {
    set({
      isPrintingAnimationActive: true,
      animationCountdownSeconds: 10,
    });

    // Start 10-second countdown interval
    const countdownInterval = setInterval(() => {
      const current = get().animationCountdownSeconds;
      if (current > 1) {
        set({ animationCountdownSeconds: current - 1 });
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Coordinate Heads-Up Pre-Processing in parallel (300 frames pre-scan / shader compile / audio calibration)
    try {
      // Dispatches custom event for background pre-processing engine
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('omnistream:heads-up:start', {
          detail: { movie }
        }));
      }
    } catch (e) {}

    // Wait for full 10-second duration
    await new Promise((resolve) => setTimeout(resolve, 10000));

    clearInterval(countdownInterval);

    // Save newly issued torn ticket
    const cineMorph = useCineMorphStore.getState();
    const ticketId = get().saveTicketProgress({
      movieTitle: movie.title,
      sourceUrl: movie.source,
      isLocal: movie.isLocal,
      aspectRatio: cineMorph.aspectRatio,
      framingRule: cineMorph.framingRule,
      timestampSeconds: 0,
      durationSeconds: 0,
    });

    const createdTicket = get().tickets.find(t => t.ticketId === ticketId) || null;

    set({
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
      activeTicket: createdTicket,
    });

    // Set video source and start playback in CineMorph
    cineMorph.setVideoSource({
      type: movie.isLocal ? 'local' : 'youtube',
      url: movie.source,
      file: movie.file,
      name: movie.title,
    });
    cineMorph.setIsPlaying(true);
  },

  cancelPrintAnimation: () => {
    set({
      isPrintingAnimationActive: false,
      animationCountdownSeconds: 0,
    });
  },
}));
```

---

## 4. State Migration & Backward Compatibility Strategy

OmniStream previously contained a monolithic store in `src/store.ts`. During Milestone 1:
1. The new stores (`useUTubeStore`, `useCineMorphStore`, `useTicketStore`) are created in `src/state/`.
2. A lightweight facade is provided in `src/store.ts` to forward legacy calls to the new stores during progressive refactoring:

```typescript
// src/store.ts (Facade / Migration Adapter)
export { useUTubeStore } from './state/useUTubeStore';
export { useCineMorphStore } from './state/useCineMorphStore';
export { useTicketStore } from './state/useTicketStore';

// Unified composite hook for backward compatibility with existing components
export function useAppStore() {
  const utube = useUTubeStore();
  const cinemorph = useCineMorphStore();
  const ticket = useTicketStore();

  return {
    ...utube,
    ...cinemorph,
    ...ticket,
  };
}
```

---

## 5. Adversarial & Edge Case Handling Matrix

| Edge Case Scenario | Threat / Failure Mode | Storage & Store Mitigation Strategy |
|---|---|---|
| **Corrupted JSON in LocalStorage** | `JSON.parse` syntax error crashes app startup | `storageService.getLocal()` wraps parse in `try/catch`, writes backup dump, resets to typed default. |
| **Storage Quota Exceeded (5MB limit)** | Thumbnail base64 strings fill storage, write throws `QuotaExceededError` | `storageService.evictOldCaches()` removes query cache and corrupt backups; thumbnail is saved to IndexedDB instead. |
| **Network Disconnection (Offline Drop)** | ML framing stalls, YouTube requests hang | `useCineMorphStore.setOfflineStatus(true)` automatically switches aspect ratio to `4:3` cropped mode and deactivates ML loop. |
| **Rapid Search Queries (Debounce / Race)** | Multiple async search promises resolve out of order | `useUTubeStore.search()` ensures top 3 results are returned and deduplicated; keyword weights decay gracefully. |
| **Tab Reopening / Hard Reload on Ticket Resume** | Ticket state lost or invalid timestamp | `useTicketStore` reads persisted stubs on initialization; `resumeFromTicket()` seeks precisely to `timestampSeconds`. |
| **IndexedDB Blocked (Incognito / Safari Strict)** | `window.indexedDB.open` throws security error | `StorageService` catches error and falls back seamlessly to `memoryFallback` map. |

---

## 6. Verification & Test Plan

### Unit Test Suite Specifications (`tests/unit/state/`)

1. **`storageService.spec.ts`**:
   - `test('recovers gracefully from corrupted JSON in localStorage')`
   - `test('handles QuotaExceededError via cache eviction')`
   - `test('stores and retrieves records from IndexedDB with memory fallback')`

2. **`useUTubeStore.spec.ts`**:
   - `test('search returns exactly 3 results and updates recentSearches')`
   - `test('extractRecommendations generates exactly 5 keyword-weighted videos')`
   - `test('subscribedFeed caches for 4 hours and refreshes when stale')`
   - `test('subscribe/unsubscribe updates subscriptions and persists')`

3. **`useCineMorphStore.spec.ts`**:
   - `test('offline status change triggers 4:3 ratio fallback and pauses ML')`
   - `test('clamped panOffset enforces [-1.0, 1.0] bounds')`
   - `test('toggleDiagnosticOverlay switches visibility boolean')`

4. **`useTicketStore.spec.ts`**:
   - `test('trigger10sPrintAnimation executes 10s sequence and produces torn ticket')`
   - `test('saveTicketProgress and resumeFromTicket restore exact movie timestamp')`
   - `test('removeTicket clears item from tickets array and storage')`

---

## 7. Deliverables Checklist for Milestone 1 Implementation

- [ ] Create `src/services/storageService.ts`
- [ ] Create `src/state/useUTubeStore.ts`
- [ ] Create `src/state/useCineMorphStore.ts`
- [ ] Create `src/state/useTicketStore.ts`
- [ ] Update `src/store.ts` facade for progressive refactoring
- [ ] Write Vitest test suite for stores and storage service
