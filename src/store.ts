import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Video, Channel, HistoryItem, Collection } from './types';

interface AppState {
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  autoplay: boolean;
  setAutoplay: (autoplay: boolean) => void;

  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;

  subscriptions: Channel[];
  subscribe: (channel: Channel) => void;
  unsubscribe: (channelId: string) => void;

  history: Record<string, HistoryItem>;
  addToHistory: (video: Video, progress: number, duration: number) => void;
  clearHistory: () => void;
  removeFromHistory: (videoId: string) => void;

  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  removeSearchHistory: (query: string) => void;

  collections: Collection[];
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  addVideoToCollection: (collectionId: string, video: Video) => void;
  removeVideoFromCollection: (collectionId: string, videoId: string) => void;

  activeVideo: Video | null;
  setActiveVideo: (video: Video | null) => void;
  miniPlayerMode: boolean;
  setMiniPlayerMode: (mode: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      autoplay: true,
      setAutoplay: (autoplay) => set({ autoplay }),

      playbackSpeed: 1,
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

      subscriptions: [],
      subscribe: (channel) => set((state) => {
        if (state.subscriptions.find(c => c.id === channel.id)) return state;
        return { subscriptions: [...state.subscriptions, channel] };
      }),
      unsubscribe: (channelId) => set((state) => ({
        subscriptions: state.subscriptions.filter(c => c.id !== channelId)
      })),

      history: {},
      addToHistory: (video, progress, duration) => set((state) => ({
        history: {
          ...state.history,
          [video.id]: {
            video,
            watchedAt: Date.now(),
            progress,
            duration
          }
        }
      })),
      clearHistory: () => set({ history: {} }),
      removeFromHistory: (videoId) => set((state) => {
        const newHistory = { ...state.history };
        delete newHistory[videoId];
        return { history: newHistory };
      }),

      searchHistory: [],
      addSearchHistory: (query) => set((state) => {
        const q = query.trim();
        if (!q) return state;
        const filtered = state.searchHistory.filter(item => item.toLowerCase() !== q.toLowerCase());
        return { searchHistory: [q, ...filtered].slice(0, 20) };
      }),
      clearSearchHistory: () => set({ searchHistory: [] }),
      removeSearchHistory: (query) => set((state) => ({
        searchHistory: state.searchHistory.filter(q => q !== query)
      })),

      collections: [
        { id: 'watch-later', name: 'Watch Later', videos: [] },
        { id: 'favorites', name: 'Favorites', videos: [] }
      ],
      createCollection: (name) => set((state) => ({
        collections: [...state.collections, { id: Date.now().toString(), name, videos: [] }]
      })),
      deleteCollection: (id) => set((state) => ({
        collections: state.collections.filter(c => c.id !== id)
      })),
      addVideoToCollection: (collectionId, video) => set((state) => ({
        collections: state.collections.map(c => 
          c.id === collectionId 
            ? { ...c, videos: c.videos.find(v => v.id === video.id) ? c.videos : [...c.videos, video] } 
            : c
        )
      })),
      removeVideoFromCollection: (collectionId, videoId) => set((state) => ({
        collections: state.collections.map(c =>
          c.id === collectionId
            ? { ...c, videos: c.videos.filter(v => v.id !== videoId) }
            : c
        )
      })),

      activeVideo: null,
      setActiveVideo: (video) => set({ activeVideo: video }),
      miniPlayerMode: false,
      setMiniPlayerMode: (mode) => set({ miniPlayerMode: mode }),
    }),
    {
      name: 'utube-storage',
    }
  )
);

