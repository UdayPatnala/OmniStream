import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Video, Channel, HistoryItem, Collection, QueueItem, SearchHistoryMetaData, BehaviorEvent, CineMorphTheme, VideoClip, RankingProfile } from './types';

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

  frameAspectRatio: '16:9' | '21:9' | '4:3' | '1:1';
  setFrameAspectRatio: (ratio: '16:9' | '21:9' | '4:3' | '1:1') => void;

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

  audioStudioOpen: boolean;
  setAudioStudioOpen: (open: boolean) => void;

  telemetryOpen: boolean;
  setTelemetryOpen: (open: boolean) => void;

  ambientGlow: boolean;
  toggleAmbientGlow: () => void;

  cinemaMode: boolean;
  setCinemaMode: (val: boolean) => void;

  instantAutoPlay: boolean;
  setInstantAutoPlay: (enabled: boolean) => void;

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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
        return { subscriptions: [...state.subscriptions, channel] };
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
              openCount: prevOpens + 1,
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

      glowIntensity: 'ultra',
      setGlowIntensity: (glowIntensity) => set({ glowIntensity }),

      frameAspectRatio: '16:9',
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

      audioStudioOpen: false,
      setAudioStudioOpen: (audioStudioOpen) => set({ audioStudioOpen }),

      telemetryOpen: false,
      setTelemetryOpen: (telemetryOpen) => set({ telemetryOpen }),

      ambientGlow: true,
      toggleAmbientGlow: () => set((state) => ({ ambientGlow: !state.ambientGlow })),

      cinemaMode: false,
      setCinemaMode: (cinemaMode) => set({ cinemaMode }),

      instantAutoPlay: true,
      setInstantAutoPlay: (instantAutoPlay) => set({ instantAutoPlay }),

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
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        glowIntensity: persistedState?.glowIntensity || 'ultra',
        frameAspectRatio: persistedState?.frameAspectRatio || '16:9',
        reframeMode: persistedState?.reframeMode || 'center',
        cinemorphTheme: persistedState?.cinemorphTheme || 'cinematic-dark',
        versionMode: persistedState?.versionMode || 'v2',
        instantAutoPlay: persistedState?.instantAutoPlay ?? true,
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



