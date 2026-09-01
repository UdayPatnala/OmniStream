import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Video, Channel, HistoryItem, Collection, QueueItem, SearchHistoryMetaData, BehaviorEvent, CineMorphTheme, VideoClip, RankingProfile, LocalMediaItem, FrameAspectRatio, DevicePerformanceProfile } from './types';

// Re-export modular Milestone 1 state stores
export { useUTubeStore, type UTubeVideo, type ChannelSubscription, type UTubeStoreState } from './state/useUTubeStore';
export { useCineMorphStore, type AspectRatioMode, type FramingRuleMode, type CineMorphStoreState, type CineMorphVideoSource } from './state/useCineMorphStore';
export { useTicketStore, type MovieTicket, type TicketStoreState } from './state/useTicketStore';

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

  localMediaHistory: Record<string, LocalMediaItem>;
  activeLocalMedia: LocalMediaItem | null;
  addLocalMediaToHistory: (item: LocalMediaItem) => void;
  removeLocalMediaFromHistory: (id: string) => void;
  setActiveLocalMedia: (item: LocalMediaItem | null) => void;

  theaterSeatingEnabled: boolean;
  setTheaterSeatingEnabled: (enabled: boolean) => void;

  curtainAnimationEnabled: boolean;
  setCurtainAnimationEnabled: (enabled: boolean) => void;

  rootLandingPreference: 'ask' | 'v1' | 'v2';
  setRootLandingPreference: (pref: 'ask' | 'v1' | 'v2') => void;

  searchHistory: string[];
  searchMetadata: Record<string, SearchHistoryMetaData>;
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  removeSearchHistory: (query: string) => void;

  collections: Collection[];
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  addVideoToCollection: (collectionId: string, video: Video) => void;
  removeVideoFromCollection: (collectionId: string, videoId: string) => void;

  queue: QueueItem[];
  addToQueue: (video: Video) => void;
  removeFromQueue: (videoId: string) => void;
  clearQueue: () => void;
  nextInQueue: () => Video | null;

  behaviorEvents: BehaviorEvent[];
  logBehaviorEvent: (event: Omit<BehaviorEvent, 'id' | 'timestamp'>) => void;

  activeVideo: Video | null;
  setActiveVideo: (video: Video | null) => void;
  miniPlayerMode: boolean;
  setMiniPlayerMode: (mode: boolean) => void;

  versionMode: 'v2' | 'v1';
  setVersionMode: (mode: 'v2' | 'v1') => void;

  cinemorphTheme: CineMorphTheme;
  setCinemorphTheme: (theme: CineMorphTheme) => void;

  glowIntensity: 'off' | 'low' | 'medium' | 'ultra';
  setGlowIntensity: (intensity: 'off' | 'low' | 'medium' | 'ultra') => void;

  frameAspectRatio: FrameAspectRatio;
  setFrameAspectRatio: (ratio: FrameAspectRatio) => void;

  reframeMode: 'center' | 'face-priority' | 'smart-pan-zoom';
  setReframeMode: (mode: 'center' | 'face-priority' | 'smart-pan-zoom') => void;

  audioEQ: {
    preset: 'original' | 'dialogue-boost' | 'bass-heavy' | 'spatial-3d' | 'night-compression';
    bassBoost: number;
    dialogueClarity: number;
    trebleShine: number;
    surround3D: boolean;
    drcLoudness: boolean;
  };
  setAudioEQ: (config: Partial<AppState['audioEQ']>) => void;
  resetAudioEQ: () => void;

  telemetryOpen: boolean;
  setTelemetryOpen: (open: boolean) => void;

  ambientGlow: boolean;
  toggleAmbientGlow: () => void;

  cinemaMode: boolean;
  setCinemaMode: (val: boolean) => void;

  pipelineCandidates: Video[];
  currentCandidateIndex: number;
  setPipelineCandidates: (candidates: Video[], index?: number) => void;
  switchToNextCandidate: () => Video | null;

  recoveryMessage: string | null;
  setRecoveryMessage: (msg: string | null) => void;

  rankingProfile: RankingProfile;
  setRankingProfile: (profile: RankingProfile) => void;

  savedClips: VideoClip[];
  saveClip: (clip: VideoClip) => void;
  removeClip: (id: string) => void;

  devicePerformanceProfile: DevicePerformanceProfile;
  setDevicePerformanceProfile: (profile: DevicePerformanceProfile) => void;

  watchLater: Video[];
  addToWatchLater: (video: Video) => void;
  removeFromWatchLater: (videoId: string) => void;
  isInWatchLater: (videoId: string) => boolean;

  likedVideos: Video[];
  toggleLikeVideo: (video: Video) => void;
  isLikedVideo: (videoId: string) => boolean;

  notInterestedIds: string[];
  markNotInterested: (videoId: string) => void;

  ignoredChannelIds: string[];
  markChannelIgnored: (channelId: string) => void;

  watchPositions: Record<string, { videoId: string; timestamp: number; duration: number; updatedAt: number }>;
  saveWatchPosition: (videoId: string, timestamp: number, duration: number) => void;
  getWatchPosition: (videoId: string) => { videoId: string; timestamp: number; duration: number; updatedAt: number } | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchLater: [],
      addToWatchLater: (video) => set((state) => ({
        watchLater: state.watchLater.some(v => v.id === video.id) ? state.watchLater : [video, ...state.watchLater]
      })),
      removeFromWatchLater: (videoId) => set((state) => ({
        watchLater: state.watchLater.filter(v => v.id !== videoId)
      })),
      isInWatchLater: (videoId) => get().watchLater.some(v => v.id === videoId),

      likedVideos: [],
      toggleLikeVideo: (video) => set((state) => {
        const exists = state.likedVideos.some(v => v.id === video.id);
        return {
          likedVideos: exists 
            ? state.likedVideos.filter(v => v.id !== video.id) 
            : [video, ...state.likedVideos]
        };
      }),
      isLikedVideo: (videoId) => get().likedVideos.some(v => v.id === videoId),

      notInterestedIds: [],
      markNotInterested: (videoId) => set((state) => ({
        notInterestedIds: state.notInterestedIds.includes(videoId) ? state.notInterestedIds : [...state.notInterestedIds, videoId]
      })),

      ignoredChannelIds: [],
      markChannelIgnored: (channelId) => set((state) => ({
        ignoredChannelIds: state.ignoredChannelIds.includes(channelId) ? state.ignoredChannelIds : [...state.ignoredChannelIds, channelId]
      })),

      watchPositions: {},
      saveWatchPosition: (videoId, timestamp, duration) => set((state) => ({
        watchPositions: {
          ...state.watchPositions,
          [videoId]: { videoId, timestamp, duration, updatedAt: Date.now() }
        }
      })),
      getWatchPosition: (videoId) => get().watchPositions[videoId] || null,

      localMediaHistory: {},
      activeLocalMedia: null,
      addLocalMediaToHistory: (item) => set((state) => ({
        localMediaHistory: {
          ...state.localMediaHistory,
          [item.id]: {
            ...item,
            lastWatchedAt: Date.now(),
          }
        }
      })),
      removeLocalMediaFromHistory: (id) => set((state) => {
        const copy = { ...state.localMediaHistory };
        delete copy[id];
        return { localMediaHistory: copy };
      }),
      setActiveLocalMedia: (item) => set({ activeLocalMedia: item }),

      theaterSeatingEnabled: true,
      setTheaterSeatingEnabled: (theaterSeatingEnabled) => set({ theaterSeatingEnabled }),

      curtainAnimationEnabled: true,
      setCurtainAnimationEnabled: (curtainAnimationEnabled) => set({ curtainAnimationEnabled }),

      rootLandingPreference: 'ask',
      setRootLandingPreference: (rootLandingPreference) => set({ rootLandingPreference }),

      devicePerformanceProfile: 'balanced',
      setDevicePerformanceProfile: (devicePerformanceProfile) => set({ devicePerformanceProfile }),



      rankingProfile: 'balanced',
      setRankingProfile: (rankingProfile) => set({ rankingProfile }),

      theme: 'system',
      setTheme: (theme) => set({ theme }),

      autoplay: true,
      setAutoplay: (autoplay) => set({ autoplay }),

      playbackSpeed: 1,
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

      subscriptions: [],
      subscribe: (channel) => set((state) => {
        if (state.subscriptions.find(c => c.id === channel.id)) return state;
        const minimalChannel: Channel = {
          id: channel.id,
          title: channel.title,
          description: '',
          thumbnails: {
            default: '',
            medium: '',
            high: ''
          }
        };
        return { subscriptions: [...state.subscriptions, minimalChannel] };
      }),
      unsubscribe: (channelId) => set((state) => ({
        subscriptions: state.subscriptions.filter(c => c.id !== channelId)
      })),

      history: {},
      addToHistory: (video, progress, duration) => set((state) => {
        const prev = state.history[video.id];
        const prevOpens = prev?.openCount || 0;
        const prevCompleted = prev?.completedCount || 0;
        const ratio = duration > 0 ? progress / duration : 0;
        const isNowCompleted = ratio >= 0.95;

        return {
          history: {
            ...state.history,
            [video.id]: {
              video,
              watchedAt: Date.now(),
              progress,
              duration,
              openCount: prevOpens > 0 ? prevOpens : 1,
              completedCount: isNowCompleted ? prevCompleted + 1 : prevCompleted,
              completionRatio: ratio,
              lastSpeed: state.playbackSpeed,
            }
          }
        };
      }),
      clearHistory: () => set({ history: {} }),
      removeFromHistory: (videoId) => set((state) => {
        const newHistory = { ...state.history };
        delete newHistory[videoId];
        return { history: newHistory };
      }),

      searchHistory: [],
      searchMetadata: {},
      addSearchHistory: (query) => set((state) => {
        const q = query.trim();
        if (!q) return state;
        const lowerQ = q.toLowerCase();
        const filtered = state.searchHistory.filter(item => item.toLowerCase() !== lowerQ);
        
        const prevMeta = state.searchMetadata[lowerQ] || {
          query: q,
          frequency: 0,
          firstUsed: Date.now(),
          lastUsed: Date.now(),
          searchScore: 0,
        };

        const newMeta: SearchHistoryMetaData = {
          ...prevMeta,
          query: q,
          frequency: prevMeta.frequency + 1,
          lastUsed: Date.now(),
          searchScore: prevMeta.searchScore + 10,
        };

        return { 
          searchHistory: [q, ...filtered].slice(0, 30),
          searchMetadata: {
            ...state.searchMetadata,
            [lowerQ]: newMeta,
          }
        };
      }),
      clearSearchHistory: () => set({ searchHistory: [], searchMetadata: {} }),
      removeSearchHistory: (query) => set((state) => {
        const lowerQ = query.toLowerCase();
        const newMeta = { ...state.searchMetadata };
        delete newMeta[lowerQ];
        return {
          searchHistory: state.searchHistory.filter(q => q !== query),
          searchMetadata: newMeta,
        };
      }),

      collections: [
        { id: 'watch-later', name: 'Watch Later', videos: [] },
        { id: 'favorites', name: 'Favorites', videos: [] }
      ],
      createCollection: (name) => set((state) => ({
        collections: [...state.collections, { id: Date.now().toString(), name, videos: [], updatedAt: Date.now() }]
      })),
      deleteCollection: (id) => set((state) => ({
        collections: state.collections.filter(c => c.id !== id)
      })),
      addVideoToCollection: (collectionId, video) => set((state) => ({
        collections: state.collections.map(c => 
          c.id === collectionId 
            ? { ...c, videos: c.videos.find(v => v.id === video.id) ? c.videos : [...c.videos, video], updatedAt: Date.now() } 
            : c
        )
      })),
      removeVideoFromCollection: (collectionId, videoId) => set((state) => ({
        collections: state.collections.map(c =>
          c.id === collectionId
            ? { ...c, videos: c.videos.filter(v => v.id !== videoId), updatedAt: Date.now() }
            : c
        )
      })),

      queue: [],
      addToQueue: (video) => set((state) => {
        if (state.queue.find(q => q.video.id === video.id)) return state;
        return { queue: [...state.queue, { video, addedAt: Date.now() }] };
      }),
      removeFromQueue: (videoId) => set((state) => ({
        queue: state.queue.filter(q => q.video.id !== videoId)
      })),
      clearQueue: () => set({ queue: [] }),
      nextInQueue: () => {
        const { queue, setActiveVideo } = get();
        if (queue.length === 0) return null;
        const [nextItem, ...remaining] = queue;
        set({ queue: remaining, activeVideo: nextItem.video });
        return nextItem.video;
      },

      behaviorEvents: [],
      logBehaviorEvent: (event) => set((state) => ({
        behaviorEvents: [
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: Date.now(),
            ...event,
          },
          ...state.behaviorEvents,
        ].slice(0, 100) // retain last 100 behavior logs
      })),

      activeVideo: null,
      setActiveVideo: (video) => set({ activeVideo: video }),
      miniPlayerMode: false,
      setMiniPlayerMode: (mode) => set({ miniPlayerMode: mode }),

      // CineMorphAI Engine State
      versionMode: 'v2',
      setVersionMode: (mode) => set({ versionMode: mode }),

      cinemorphTheme: 'cinematic-dark',
      setCinemorphTheme: (cinemorphTheme) => set({ cinemorphTheme }),

      glowIntensity: 'off',
      setGlowIntensity: (glowIntensity) => set({ glowIntensity }),

      frameAspectRatio: 'original',
      setFrameAspectRatio: (frameAspectRatio) => set({ frameAspectRatio }),

      reframeMode: 'center',
      setReframeMode: (reframeMode) => set({ reframeMode }),

      audioEQ: {
        preset: 'dialogue-boost',
        bassBoost: 4,
        dialogueClarity: 8,
        trebleShine: 3,
        surround3D: true,
        drcLoudness: true,
      },
      setAudioEQ: (config) => set((state) => ({ audioEQ: { ...state.audioEQ, ...config } })),
      resetAudioEQ: () => set({
        audioEQ: {
          preset: 'original',
          bassBoost: 0,
          dialogueClarity: 0,
          trebleShine: 0,
          surround3D: false,
          drcLoudness: false,
        }
      }),

      telemetryOpen: false,
      setTelemetryOpen: (telemetryOpen) => set({ telemetryOpen }),

      ambientGlow: true,
      toggleAmbientGlow: () => set((state) => ({ ambientGlow: !state.ambientGlow })),

      cinemaMode: true,
      setCinemaMode: (cinemaMode) => set({ cinemaMode }),

      pipelineCandidates: [],
      currentCandidateIndex: 0,
      setPipelineCandidates: (candidates, index = 0) => set({
        pipelineCandidates: candidates,
        currentCandidateIndex: index,
        activeVideo: candidates[index] || null,
      }),
      switchToNextCandidate: () => {
        const { pipelineCandidates, currentCandidateIndex, setActiveVideo } = get();
        const nextIndex = currentCandidateIndex + 1;
        if (nextIndex < pipelineCandidates.length) {
          const nextVideo = pipelineCandidates[nextIndex];
          set({
            currentCandidateIndex: nextIndex,
            activeVideo: nextVideo,
            recoveryMessage: `Auto-switched to candidate #${nextIndex + 1}: ${nextVideo.title.slice(0, 45)}...`
          });
          return nextVideo;
        }
        return null;
      },

      recoveryMessage: null,
      setRecoveryMessage: (recoveryMessage) => set({ recoveryMessage }),

      savedClips: [],
      saveClip: (clip) => set((state) => ({
        savedClips: [clip, ...state.savedClips.filter(c => c.id !== clip.id)]
      })),
      removeClip: (id) => set((state) => ({
        savedClips: state.savedClips.filter(c => c.id !== id)
      })),
    }),
    {
      name: 'cinemorph-utube-storage',
      version: 2,
      storage: {
        getItem: (name) => {
          try {
            const ls = typeof window !== 'undefined' && window.localStorage ? window.localStorage : (globalThis as any).localStorage;
            const raw = ls ? ls.getItem(name) : null;
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const ls = typeof window !== 'undefined' && window.localStorage ? window.localStorage : (globalThis as any).localStorage;
            if (ls) ls.setItem(name, JSON.stringify(value));
          } catch {}
        },
        removeItem: (name) => {
          try {
            const ls = typeof window !== 'undefined' && window.localStorage ? window.localStorage : (globalThis as any).localStorage;
            if (ls) ls.removeItem(name);
          } catch {}
        },
      },
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        glowIntensity: persistedState?.glowIntensity || 'off',
        frameAspectRatio: persistedState?.frameAspectRatio || 'original',
        reframeMode: persistedState?.reframeMode || 'center',
        cinemorphTheme: persistedState?.cinemorphTheme || 'cinematic-dark',
        versionMode: persistedState?.versionMode || 'v2',
        audioEQ: {
          preset: 'dialogue-boost',
          bassBoost: 4,
          dialogueClarity: 8,
          trebleShine: 3,
          surround3D: true,
          drcLoudness: true,
          ...(persistedState?.audioEQ || {}),
        },
      }),
    }
  )
);



