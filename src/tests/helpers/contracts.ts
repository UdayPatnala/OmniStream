import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_VIDEOS } from './fixtures';
import { searchVideos } from '../../lib/youtube';
import { getRecommendedVideos } from '../../lib/recommendations';

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
  lastFeedRefresh: number;
  currentVideo: UTubeVideo | null;
  search: (query: string, pageToken?: string) => Promise<UTubeVideo[]>;
  loadMoreSearch: () => Promise<UTubeVideo[]>;
  subscribe: (channel: ChannelSubscription) => void;
  unsubscribe: (channelId: string) => void;
  extractRecommendations: () => void;
  refreshFeedIfNeeded: () => Promise<void>;
  playVideo: (video: UTubeVideo | string) => void;
}

export type AspectRatioMode = '1.43:1' | '1.90:1' | 'original' | '4:3';
export type FramingRuleMode = 'rule_of_thirds' | 'leading_lines' | 'frame_in_frame' | 'screen_direction' | 'auto';

export interface CineMorphStoreState {
  aspectRatio: AspectRatioMode;
  isOffline: boolean;
  videoSource: { type: 'local' | 'youtube'; url: string; file?: File; name: string } | null;
  framingRule: FramingRuleMode;
  diagnosticOverlayVisible: boolean;
  panOffset: { x: number; y: number };
  playbackTimestamp: number;
  setAspectRatio: (ratio: AspectRatioMode) => void;
  setOfflineStatus: (offline: boolean) => void;
  setVideoSource: (source: CineMorphStoreState['videoSource']) => void;
  setPanOffset: (x: number, y: number) => void;
  toggleDiagnosticOverlay: () => void;
}

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
  thumbnailDataUrl?: string;
}

export interface TicketStoreState {
  tickets: MovieTicket[];
  isPrintingAnimationActive: boolean;
  activeTicket: MovieTicket | null;
  saveTicketProgress: (ticket: Omit<MovieTicket, 'ticketId' | 'printedAt'>) => string;
  resumeFromTicket: (ticketId: string) => MovieTicket | null;
  removeTicket: (ticketId: string) => void;
  trigger10sPrintAnimation: (movie: { title: string; source: string; isLocal: boolean }) => Promise<void>;
}

export interface FramingTelemetry {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  activeRule: string;
  confidence: number;
  fps: number;
  facesDetected: number;
  leadingLines: { x1: number; y1: number; x2: number; y2: number }[];
  gazeVector?: { x: number; y: number; angle: number };
}

export interface FramingEngine {
  init: () => Promise<void>;
  processFrame: (videoElement?: HTMLVideoElement | HTMLCanvasElement) => FramingTelemetry;
  setRule: (rule: FramingRuleMode) => void;
  reset: () => void;
}

export const createUTubeStore = () => create<UTubeStoreState>()(
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

      search: async (query: string, pageToken?: string) => {
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

        const updatedSearches = [trimmed, ...get().recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
        const res = await searchVideos(trimmed, 'video', pageToken);
        const rawResults = res.results || [];
        const mapped: UTubeVideo[] = rawResults.map(r => ({
          id: r.id,
          title: r.title,
          channelTitle: r.channelTitle,
          thumbnailUrl: r.thumbnails?.medium || '',
          duration: 'PT10M00S',
          publishedAt: r.publishedAt,
          views: '1000000',
        }));

        let combined: UTubeVideo[];
        if (pageToken) {
          const existing = get().searchResults;
          const seen = new Set(existing.map(v => v.id));
          combined = [...existing, ...mapped.filter(v => !seen.has(v.id))];
        } else {
          combined = mapped;
        }

        set({
          searchResults: combined,
          currentQuery: trimmed,
          nextPageToken: res.nextPageToken,
          hasMore: !!res.nextPageToken,
          recentSearches: updatedSearches,
          isLoadingMore: false,
        });

        get().extractRecommendations();
        return combined;
      },

      loadMoreSearch: async () => {
        const { currentQuery, nextPageToken, isLoadingMore, hasMore } = get();
        if (!currentQuery || !nextPageToken || isLoadingMore || !hasMore) {
          return get().searchResults;
        }
        set({ isLoadingMore: true });
        return get().search(currentQuery, nextPageToken);
      },

      subscribe: (channel: ChannelSubscription) => {
        set(state => {
          if (state.subscriptions.some(s => s.channelId === channel.channelId)) {
            return state;
          }
          return {
            subscriptions: [...state.subscriptions, channel]
          };
        });
      },

      unsubscribe: (channelId: string) => {
        set(state => ({
          subscriptions: state.subscriptions.filter(s => s.channelId !== channelId)
        }));
      },

      extractRecommendations: () => {
        const searches = get().recentSearches;
        const subs = get().subscriptions.map(s => ({
          id: s.channelId,
          title: s.channelTitle,
          description: '',
          thumbnails: { default: s.avatarUrl, medium: s.avatarUrl, high: s.avatarUrl }
        }));

        const recs = getRecommendedVideos(MOCK_VIDEOS, {}, subs, [], searches);
        const top5 = recs.slice(0, 5).map(v => ({
          id: v.id,
          title: v.title,
          channelTitle: v.channelTitle,
          thumbnailUrl: v.thumbnails?.medium || '',
          duration: v.duration,
          publishedAt: v.publishedAt,
          views: v.viewCount,
        }));

        set({ recommendedVideos: top5 });
      },

      refreshFeedIfNeeded: async () => {
        const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
        const now = Date.now();
        const { lastFeedRefresh, subscriptions } = get();

        if (now - lastFeedRefresh >= FOUR_HOURS_MS) {
          const feedVideos: UTubeVideo[] = [];
          for (const sub of subscriptions) {
            feedVideos.push({
              id: 'feed-' + sub.channelId + '-' + now,
              title: 'Latest from ' + sub.channelTitle,
              channelTitle: sub.channelTitle,
              thumbnailUrl: sub.avatarUrl,
              publishedAt: new Date(now).toISOString(),
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
          const matched = MOCK_VIDEOS.find(v => v.id === video) || {
            id: video,
            title: 'Direct Playback (' + video + ')',
            channelTitle: 'YouTube Stream',
            thumbnailUrl: '',
          };
          set({
            currentVideo: {
              id: matched.id,
              title: matched.title,
              channelTitle: matched.channelTitle,
              thumbnailUrl: (matched as any).thumbnails?.medium || '',
            }
          });
        } else {
          set({ currentVideo: video });
        }
      },
    }),
    {
      name: 'omnistream-utube-contract-store',
    }
  )
);

export const createCineMorphStore = () => create<CineMorphStoreState>((set) => ({
  aspectRatio: 'original',
  isOffline: false,
  videoSource: null,
  framingRule: 'auto',
  diagnosticOverlayVisible: false,
  panOffset: { x: 0, y: 0 },
  playbackTimestamp: 0,

  setAspectRatio: (ratio: AspectRatioMode) => set({ aspectRatio: ratio }),
  setOfflineStatus: (offline: boolean) => set(state => ({
    isOffline: offline,
    aspectRatio: offline ? '4:3' : state.aspectRatio,
  })),
  setVideoSource: (source) => set({ videoSource: source }),
  setPanOffset: (x: number, y: number) => set({
    panOffset: {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    }
  }),
  toggleDiagnosticOverlay: () => set(state => ({
    diagnosticOverlayVisible: !state.diagnosticOverlayVisible
  })),
}));

export const createTicketStore = () => create<TicketStoreState>()(
  persist(
    (set, get) => ({
      tickets: [],
      isPrintingAnimationActive: false,
      activeTicket: null,

      saveTicketProgress: (ticketData) => {
        const ticketId = 'ticket-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        const newTicket: MovieTicket = {
          ...ticketData,
          ticketId,
          printedAt: Date.now(),
        };

        set(state => ({
          tickets: [newTicket, ...state.tickets.filter(t => t.sourceUrl !== ticketData.sourceUrl)],
          activeTicket: newTicket,
        }));

        return ticketId;
      },

      resumeFromTicket: (ticketId: string) => {
        const found = get().tickets.find(t => t.ticketId === ticketId);
        if (found) {
          set({ activeTicket: found });
          return found;
        }
        return null;
      },

      removeTicket: (ticketId: string) => {
        set(state => ({
          tickets: state.tickets.filter(t => t.ticketId !== ticketId),
          activeTicket: state.activeTicket?.ticketId === ticketId ? null : state.activeTicket,
        }));
      },

      trigger10sPrintAnimation: async (movie) => {
        set({ isPrintingAnimationActive: true });
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            set({ isPrintingAnimationActive: false });
            resolve();
          }, 50);
        });
      },
    }),
    {
      name: 'omnistream-ticket-contract-store',
    }
  )
);

export class MockFramingEngine implements FramingEngine {
  private activeRule: FramingRuleMode = 'auto';
  private currentX = 0;
  private currentY = 0;
  private initialized = false;

  async init(): Promise<void> {
    this.initialized = true;
  }


  processFrame(videoElement?: HTMLVideoElement | HTMLCanvasElement): FramingTelemetry {
    let targetX = 0;
    let targetY = 0;
    let confidence = 0.95;
    let facesDetected = 1;
    let leadingLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    let gazeVector: { x: number; y: number; angle: number } | undefined = undefined;

    switch (this.activeRule) {
      case 'rule_of_thirds':
        targetX = 0.33;
        targetY = 0.33;
        confidence = 0.96;
        break;
      case 'leading_lines':
        targetX = 0.0;
        targetY = -0.15;
        leadingLines = [
          { x1: 0.1, y1: 0.9, x2: 0.5, y2: 0.4 },
          { x1: 0.9, y1: 0.9, x2: 0.5, y2: 0.4 }
        ];
        break;
      case 'frame_in_frame':
        targetX = 0.0;
        targetY = 0.0;
        confidence = 0.91;
        break;
      case 'screen_direction':
        targetX = 0.25;
        targetY = -0.05;
        gazeVector = { x: 0.5, y: 0.0, angle: 0 };
        break;
      case 'auto':
      default:
        targetX = 0.15;
        targetY = -0.05;
        break;
    }

    this.currentX += 0.15 * (targetX - this.currentX);
    this.currentY += 0.15 * (targetY - this.currentY);

    return {
      targetX: Number(targetX.toFixed(3)),
      targetY: Number(targetY.toFixed(3)),
      currentX: Number(this.currentX.toFixed(3)),
      currentY: Number(this.currentY.toFixed(3)),
      activeRule: this.activeRule,
      confidence,
      fps: 60,
      facesDetected,
      leadingLines,
      gazeVector,
    };
  }


  setRule(rule: FramingRuleMode): void {
    this.activeRule = rule;
  }


  reset(): void {
    this.currentX = 0;
    this.currentY = 0;
    this.activeRule = 'auto';
  }
}
