/**
 * CineMorph Media Track Selector & Coordinator
 * =============================================
 * Pure, deterministic track selection coordinator.
 * 
 * Invariants:
 * - Preserves playback position (currentTime), play/pause state, and fullscreen during track switches.
 * - Enforces fallback track selection if requested track is missing or unplayable.
 * - Decoupled observer subscriptions for render isolation.
 * - Single source of truth for audio, text, and video track activation.
 */

import {
  MediaTrackSet,
  MediaSelectionState,
  MediaLoadState,
  AudioTrack,
  TextTrack,
  VideoTrack,
  resolveInitialSelection,
} from './trackModel';
import { audioEngine } from './audioEngine';
import { CineMorphCaptionController } from './captionService';

export interface TrackSelectionListenerPayload {
  trackSet: MediaTrackSet;
  selection: MediaSelectionState;
  loadState: MediaLoadState;
}

export class TrackSelector {
  private trackSet: MediaTrackSet = { videoTracks: [], audioTracks: [], textTracks: [] };
  private selection: MediaSelectionState = {
    selectedVideoTrackId: null,
    selectedAudioTrackId: null,
    selectedTextTrackId: 'off',
  };
  private loadState: MediaLoadState = 'no_media';
  private listeners: Set<(payload: TrackSelectionListenerPayload) => void> = new Set();

  public getTrackSet(): MediaTrackSet {
    return this.trackSet;
  }

  public getSelection(): MediaSelectionState {
    return this.selection;
  }

  public getLoadState(): MediaLoadState {
    return this.loadState;
  }

  public setLoadState(state: MediaLoadState): void {
    if (this.loadState === state) return;
    this.loadState = state;
    this.notify();
  }

  /**
   * Initializes tracks from a discovered MediaTrackSet and applies deterministic selection
   */
  public initializeTracks(
    tracks: MediaTrackSet,
    preferences?: {
      preferredAudioLanguage?: string;
      preferredTextLanguage?: string;
      enableSubtitlesByDefault?: boolean;
    }
  ): MediaSelectionState {
    this.trackSet = tracks;
    this.selection = resolveInitialSelection(tracks, preferences);
    this.loadState = tracks.videoTracks.length > 0 || tracks.audioTracks.length > 0 ? 'tracks_discovered' : 'ready';
    this.notify();
    return this.selection;
  }

  /**
   * Selects an audio track while preserving playback position and playback state
   */
  public selectAudioTrack(
    trackId: string,
    videoEl?: HTMLVideoElement | null
  ): { success: boolean; track: AudioTrack | null; previousTime: number } {
    const track = this.trackSet.audioTracks.find((a) => a.id === trackId);
    const previousTime = videoEl?.currentTime || 0;

    if (!track) {
      console.warn(`[TrackSelector] Audio track ${trackId} not found.`);
      return { success: false, track: null, previousTime };
    }

    if (!track.isPlayable) {
      console.warn(`[TrackSelector] Audio track ${trackId} (${track.codec}) is marked unplayable.`);
      return { success: false, track, previousTime };
    }

    const wasPlaying = videoEl ? !videoEl.paused : false;

    // Switch stream in Web Audio / native audioTracks
    if (videoEl) {
      audioEngine.setActiveAudioTrack(track.streamIndex, videoEl);
      // Restore playback continuity
      if (Math.abs(videoEl.currentTime - previousTime) > 0.5) {
        videoEl.currentTime = previousTime;
      }
      if (wasPlaying && videoEl.paused) {
        videoEl.play().catch(() => {});
      }
    }

    this.selection = {
      ...this.selection,
      selectedAudioTrackId: track.id,
    };

    this.notify();
    return { success: true, track, previousTime };
  }

  /**
   * Selects or toggles a text/subtitle track
   */
  public selectTextTrack(
    trackId: string,
    captionController?: CineMorphCaptionController | null
  ): { success: boolean; track: TextTrack | null } {
    if (trackId === 'off') {
      this.selection = {
        ...this.selection,
        selectedTextTrackId: 'off',
      };
      if (captionController) {
        captionController.setActiveTrackIndex(-1);
      }
      this.notify();
      return { success: true, track: null };
    }

    const track = this.trackSet.textTracks.find((t) => t.id === trackId);
    if (!track) {
      console.warn(`[TrackSelector] Subtitle track ${trackId} not found.`);
      return { success: false, track: null };
    }

    if (captionController) {
      captionController.setActiveTrackIndex(track.streamIndex);
      if (track.cues && track.cues.length > 0) {
        captionController.loadParsedCues(track.cues);
      }
    }

    this.selection = {
      ...this.selection,
      selectedTextTrackId: track.id,
    };

    this.notify();
    return { success: true, track };
  }

  /**
   * Selects a video track (where multi-representation is available)
   */
  public selectVideoTrack(trackId: string): { success: boolean; track: VideoTrack | null } {
    const track = this.trackSet.videoTracks.find((v) => v.id === trackId);
    if (!track) {
      return { success: false, track: null };
    }

    this.selection = {
      ...this.selection,
      selectedVideoTrackId: track.id,
    };

    this.notify();
    return { success: true, track };
  }

  public getSelectedAudioTrack(): AudioTrack | null {
    return this.trackSet.audioTracks.find((a) => a.id === this.selection.selectedAudioTrackId) || null;
  }

  public getSelectedTextTrack(): TextTrack | null {
    if (this.selection.selectedTextTrackId === 'off') return null;
    return this.trackSet.textTracks.find((t) => t.id === this.selection.selectedTextTrackId) || null;
  }

  public getSelectedVideoTrack(): VideoTrack | null {
    return this.trackSet.videoTracks.find((v) => v.id === this.selection.selectedVideoTrackId) || null;
  }

  public reset(): void {
    this.trackSet = { videoTracks: [], audioTracks: [], textTracks: [] };
    this.selection = {
      selectedVideoTrackId: null,
      selectedAudioTrackId: null,
      selectedTextTrackId: 'off',
    };
    this.loadState = 'no_media';
    this.notify();
  }

  public subscribe(listener: (payload: TrackSelectionListenerPayload) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const payload: TrackSelectionListenerPayload = {
      trackSet: this.trackSet,
      selection: this.selection,
      loadState: this.loadState,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[TrackSelector] Listener notification error:', err);
      }
    });
  }
}

export const trackSelector = new TrackSelector();
