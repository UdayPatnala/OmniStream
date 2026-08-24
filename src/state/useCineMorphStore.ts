import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storageService } from '../services/storageService';

export type AspectRatioMode = '1.43:1' | '1.90:1' | 'original' | '4:3';
export type FramingRuleMode = 'rule_of_thirds' | 'leading_lines' | 'frame_in_frame' | 'screen_direction' | 'auto';

export interface CineMorphVideoSource {
  type: 'local' | 'youtube';
  url: string;
  file?: File;
  name: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface CineMorphStoreState {
  aspectRatio: AspectRatioMode;
  isOffline: boolean;
  videoSource: CineMorphVideoSource | null;
  framingRule: FramingRuleMode;
  diagnosticOverlayVisible: boolean;
  panOffset: { x: number; y: number }; // Normalized offset [-1, 1]
  playbackTimestamp: number;
  isPlaying: boolean;

  setAspectRatio: (ratio: AspectRatioMode) => void;
  setOfflineStatus: (offline: boolean) => void;
  setVideoSource: (source: CineMorphVideoSource | null) => void;
  setFramingRule: (rule: FramingRuleMode) => void;
  setPanOffset: (x: number, y: number) => void;
  setPlaybackTimestamp: (timestamp: number) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleDiagnosticOverlay: () => void;
}

const STORAGE_KEY_CINEMORPH = 'omnistream-cinemorph-store';

export const useCineMorphStore = create<CineMorphStoreState>()(
  persist(
    (set) => ({
      aspectRatio: '1.90:1',
      isOffline: false,
      videoSource: null,
      framingRule: 'auto',
      diagnosticOverlayVisible: false,
      panOffset: { x: 0, y: 0 },
      playbackTimestamp: 0,
      isPlaying: false,

      setAspectRatio: (ratio: AspectRatioMode) => {
        const validRatios: AspectRatioMode[] = ['1.43:1', '1.90:1', 'original', '4:3'];
        set({ aspectRatio: validRatios.includes(ratio) ? ratio : 'original' });
      },

      setOfflineStatus: (offline: boolean) =>
        set((state) => ({
          isOffline: !!offline,
          // Automatic 4:3 crop fallback when offline
          aspectRatio: offline ? '4:3' : state.aspectRatio,
        })),

      setVideoSource: (source: CineMorphVideoSource | null) => set({ videoSource: source }),

      setFramingRule: (rule: FramingRuleMode) => {
        const validRules: FramingRuleMode[] = ['rule_of_thirds', 'leading_lines', 'frame_in_frame', 'screen_direction', 'auto'];
        set({ framingRule: validRules.includes(rule) ? rule : 'auto' });
      },

      setPanOffset: (x: number, y: number) => {
        const safeX = typeof x === 'number' && Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
        const safeY = typeof y === 'number' && Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;
        set({
          panOffset: {
            x: safeX,
            y: safeY,
          },
        });
      },

      setPlaybackTimestamp: (timestamp: number) => {
        const safeTs = typeof timestamp === 'number' && Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
        set({ playbackTimestamp: safeTs });
      },

      setIsPlaying: (playing: boolean) => set({ isPlaying: !!playing }),

      toggleDiagnosticOverlay: () =>
        set((state) => ({
          diagnosticOverlayVisible: !state.diagnosticOverlayVisible,
        })),
    }),
    {
      name: STORAGE_KEY_CINEMORPH,
      storage: {
        getItem: (name) => {
          const val = storageService.getLocal<any>(name, null);
          return val ? { state: val } : null;
        },
        setItem: (name, value) => {
          // Do not serialize raw File object to localStorage
          const stateToSave = { ...value.state };
          if (stateToSave.videoSource?.file) {
            stateToSave.videoSource = {
              ...stateToSave.videoSource,
              file: undefined,
            };
          }
          storageService.setLocal(name, stateToSave);
        },
        removeItem: (name) => {
          storageService.removeLocal(name);
        },
      },
    }
  )
);
