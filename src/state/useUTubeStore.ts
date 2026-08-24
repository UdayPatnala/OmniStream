import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { searchVideos, FALLBACK_VIDEOS } from '../lib/youtube';
import { getRecommendedVideos } from '../lib/recommendations';
import { storageService } from '../services/storageService';

export interface UTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  publishedAt?: string;
  views?: string;
}

export interface ChannelSubscription {
  channelId: string;
  channelTitle: string;
  avatarUrl: string;
  subscribedAt: number;
}

export interface UTubeStoreState {
  searchResults: UTubeVideo[];
  currentQuery: string;
  nextPageToken?: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  subscriptions: ChannelSubscription[];
  recentSearches: string[];
  recommendedVideos: UTubeVideo[];
  subscribedFeed: UTubeVideo[];
  lastFeedRefresh: number; // timestamp ms (4-hour refresh threshold)
  currentVideo: UTubeVideo | null;
  search: (query: string, pageToken?: string) => Promise<UTubeVideo[]>;
  loadMoreSearch: () => Promise<UTubeVideo[]>;
  subscribe: (channel: ChannelSubscription) => void;
  unsubscribe: (channelId: string) => void;
  extractRecommendations: () => void;
  refreshFeedIfNeeded: () => Promise<void>;
  playVideo: (video: UTubeVideo | string) => void;
}

const STORAGE_KEY_UTUBE = 'omnistream-utube-store';
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export const useUTubeStore = create<UTubeStoreState>()(
  persist(
    (set, get) => ({
      searchResults: [],
      currentQuery: '',
      nextPageToken: undefined,
      hasMore: false,
      isLoadingMore: false,
      subscriptions: [],
      recentSearches: [],
      recommendedVideos: [],
      subscribedFeed: [],
      lastFeedRefresh: 0,
      currentVideo: null,

      search: async (query: string, pageToken?: string): Promise<UTubeVideo[]> => {
        const trimmed = query.trim();
        if (!trimmed) {
          set({
            searchResults: [],
            currentQuery: '',
            nextPageToken: undefined,
            hasMore: false,
            isLoadingMore: false,
          });
          return [];
        }

        // Add to recent searches (deduplicated, max 10)
        const currentSearches = get().recentSearches;
        const updatedSearches = [
          trimmed,
          ...currentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, 10);

        try {
          const res = await searchVideos(trimmed, 'video', pageToken);
          const rawItems = res.results || [];
          
          const mapped: UTubeVideo[] = rawItems.map((r) => ({
            id: r.id,
            title: r.title,
            channelTitle: r.channelTitle,
            thumbnailUrl: r.thumbnails?.medium || r.thumbnails?.high || `https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`,
            duration: 'PT10M00S',
            publishedAt: r.publishedAt,
            views: '1000000',
          }));

          // Deduplicate mapped results against existing results when paginating
          let combinedResults: UTubeVideo[];
          if (pageToken) {
            const existing = get().searchResults;
            const seenIds = new Set(existing.map((v) => v.id));
            const newUnique = mapped.filter((v) => !seenIds.has(v.id));
            combinedResults = [...existing, ...newUnique];
          } else {
            combinedResults = mapped;
          }

          set({
            searchResults: combinedResults,
            currentQuery: trimmed,
            nextPageToken: res.nextPageToken,
            hasMore: !!res.nextPageToken,
            recentSearches: updatedSearches,
            isLoadingMore: false,
          });

          // Trigger recommendations update based on new search
          get().extractRecommendations();

          return combinedResults;
        } catch (err) {
          console.error('[useUTubeStore] Search error:', err);
          // Deterministic safe fallback candidate set
          const queryWords = trimmed.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
          const matched = FALLBACK_VIDEOS.filter((v) => {
            const text = `${v.title} ${v.channelTitle} ${v.description}`.toLowerCase();
            return queryWords.some((w) => text.includes(w)) || text.includes(trimmed.toLowerCase());
          });

          const candidates = matched.length > 0 ? matched : FALLBACK_VIDEOS;
          const fallbackMapped: UTubeVideo[] = candidates.map((f) => ({
            id: f.id,
            title: f.title,
            channelTitle: f.channelTitle,
            thumbnailUrl: f.thumbnails.medium,
            duration: f.duration,
            publishedAt: f.publishedAt,
            views: f.viewCount,
          }));

          set({
            searchResults: fallbackMapped,
            currentQuery: trimmed,
            nextPageToken: undefined,
            hasMore: false,
            recentSearches: updatedSearches,
            isLoadingMore: false,
          });

          return fallbackMapped;
        }
      },

      loadMoreSearch: async (): Promise<UTubeVideo[]> => {
        const { currentQuery, nextPageToken, isLoadingMore, hasMore } = get();
        if (!currentQuery || !nextPageToken || isLoadingMore || !hasMore) {
          return get().searchResults;
        }

        set({ isLoadingMore: true });
        return get().search(currentQuery, nextPageToken);
      },

      subscribe: (channel: ChannelSubscription) => {
        set((state) => {
          if (state.subscriptions.some((s) => s.channelId === channel.channelId)) {
            return state;
          }
          return {
            subscriptions: [...state.subscriptions, channel],
          };
        });
      },

      unsubscribe: (channelId: string) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.channelId !== channelId),
        }));
      },

      extractRecommendations: () => {
        const searches = get().recentSearches;
        const subs = get().subscriptions.map((s) => ({
          id: s.channelId,
          title: s.channelTitle,
          description: '',
          thumbnails: { default: s.avatarUrl, medium: s.avatarUrl, high: s.avatarUrl },
        }));

        const recs = getRecommendedVideos(FALLBACK_VIDEOS, {}, subs, [], searches);
        const top5: UTubeVideo[] = recs.slice(0, 5).map((v) => ({
          id: v.id,
          title: v.title,
          channelTitle: v.channelTitle,
          thumbnailUrl: v.thumbnails?.medium || v.thumbnails?.high || '',
          duration: v.duration,
          publishedAt: v.publishedAt,
          views: v.viewCount,
        }));

        // If fewer than 5 candidates returned, backfill from fallback pool up to 5
        while (top5.length < 5 && top5.length < FALLBACK_VIDEOS.length) {
          const nextFallback = FALLBACK_VIDEOS[top5.length];
          top5.push({
            id: nextFallback.id,
            title: nextFallback.title,
            channelTitle: nextFallback.channelTitle,
            thumbnailUrl: nextFallback.thumbnails.medium,
            duration: nextFallback.duration,
            publishedAt: nextFallback.publishedAt,
            views: nextFallback.viewCount,
          });
        }

        set({ recommendedVideos: top5 });
      },

      refreshFeedIfNeeded: async () => {
        const now = Date.now();
        const { lastFeedRefresh, subscriptions } = get();

        if (now - lastFeedRefresh >= FOUR_HOURS_MS || (get().subscribedFeed.length === 0 && subscriptions.length > 0)) {
          const feedVideos: UTubeVideo[] = [];
          for (const sub of subscriptions) {
            feedVideos.push({
              id: `feed_${sub.channelId}_${now}`,
              title: `Latest from ${sub.channelTitle}`,
              channelTitle: sub.channelTitle,
              thumbnailUrl: sub.avatarUrl,
              publishedAt: new Date(now).toISOString(),
              views: '50000',
            });
          }

          set({
            subscribedFeed: feedVideos,
            lastFeedRefresh: now,
          });
        }
      },

      playVideo: (video: UTubeVideo | string) => {
        if (typeof video === 'string') {
          const matched = FALLBACK_VIDEOS.find((v) => v.id === video);
          if (matched) {
            set({
              currentVideo: {
                id: matched.id,
                title: matched.title,
                channelTitle: matched.channelTitle,
                thumbnailUrl: matched.thumbnails?.medium || '',
                duration: matched.duration,
                publishedAt: matched.publishedAt,
                views: matched.viewCount,
              },
            });
          } else {
            set({
              currentVideo: {
                id: video,
                title: `Direct Playback (${video})`,
                channelTitle: 'YouTube Stream',
                thumbnailUrl: `https://i.ytimg.com/vi/${video}/mqdefault.jpg`,
              },
            });
          }
        } else {
          set({ currentVideo: video });
        }
      },
    }),
    {
      name: STORAGE_KEY_UTUBE,
      storage: {
        getItem: (name) => {
          const val = storageService.getLocal<any>(name, null);
          return val ? { state: val } : null;
        },
        setItem: (name, value) => {
          storageService.setLocal(name, value.state);
        },
        removeItem: (name) => {
          storageService.removeLocal(name);
        },
      },
    }
  )
);
