/**
 * CineMorph Media Track Architecture — Canonical Track Model
 * ============================================================
 * Formal domain representation of Video, Audio, and Text tracks,
 * runtime selection state, and player load lifecycle states.
 * 
 * Invariants:
 * - Distinguishes language, label, role, codec, and technical properties.
 * - Separates available tracks (MediaTrackSet) from current selection (MediaSelectionState).
 * - Distinguishes container from codec from track.
 */

import { MediaContainerAnalysis, MediaAudioTrack, MediaVideoStream, MediaSubtitleTrack } from '../types';

export interface VideoTrack {
  id: string;
  streamIndex: number;
  label: string;
  language: string;
  codec: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate?: number;
  role: 'primary' | 'alternate' | 'thumbnail';
  default: boolean;
  enabled: boolean;
  isPlayable: boolean;
  unsupportedReason?: string;
}

export interface AudioTrack {
  id: string;
  streamIndex: number;
  label: string;
  language: string;
  languageCode: string;
  codec: string;
  channelCount: number;
  channelLayout: string;
  sampleRate?: number;
  bitrate?: number;
  role: 'main' | 'commentary' | 'dub' | 'description';
  default: boolean;
  enabled: boolean;
  isPlayable: boolean;
  unsupportedReason?: string;
}

export interface TextTrack {
  id: string;
  streamIndex: number;
  label: string;
  language: string;
  languageCode: string;
  kind: 'subtitles' | 'captions' | 'descriptions';
  format: string; // 'vtt' | 'srt' | 'ass' | 'text'
  default: boolean;
  forced: boolean;
  enabled: boolean;
  cues?: Array<{ id?: string; startTime: number; endTime: number; text: string }>;
}

export interface MediaTrackSet {
  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];
  textTracks: TextTrack[];
}

export interface MediaSelectionState {
  selectedVideoTrackId: string | null;
  selectedAudioTrackId: string | null;
  selectedTextTrackId: string; // 'off' or track id
}

export type MediaLoadState =
  | 'no_media'
  | 'loading'
  | 'metadata_loaded'
  | 'tracks_discovered'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'seeking'
  | 'track_switching'
  | 'error'
  | 'unsupported';

export type MediaPlaybackErrorCode =
  | 'UNSUPPORTED_CONTAINER'
  | 'UNSUPPORTED_CODEC'
  | 'TRACK_DISCOVERY_UNAVAILABLE'
  | 'TRACK_SWITCH_FAILED'
  | 'CORRUPTED_STREAM'
  | 'DECODE_ERROR'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN';

export interface MediaPlaybackError {
  code: MediaPlaybackErrorCode;
  message: string;
  technicalDetails?: string;
}

/**
 * Transforms low-level container analysis streams into the canonical MediaTrackSet
 */
export function createTrackSetFromAnalysis(analysis?: MediaContainerAnalysis | null): MediaTrackSet {
  if (!analysis) {
    return {
      videoTracks: [],
      audioTracks: [],
      textTracks: [],
    };
  }

  // 1. Transform Video Streams
  const videoTracks: VideoTrack[] = (analysis.videoStreams || []).map((v, i) => {
    return {
      id: v.id || `video-${i}`,
      streamIndex: v.streamIndex ?? i,
      label: v.label || (v.resolution ? `${v.resolution} (${v.aspectRatio || '16:9'})` : `Video Track ${i + 1}`),
      language: 'und',
      codec: v.codec || 'H.264',
      width: v.width || 1920,
      height: v.height || 1080,
      frameRate: v.frameRate || 24,
      role: i === 0 ? 'primary' : 'alternate',
      default: v.isDefault ?? i === 0,
      enabled: v.isDefault ?? i === 0,
      isPlayable: v.isPlayable !== false,
      unsupportedReason: v.unsupportedReason,
    };
  });

  // 2. Transform Audio Streams
  const audioTracks: AudioTrack[] = (analysis.audioTracks || []).map((a, i) => {
    const isCommentary = a.label?.toLowerCase().includes('commentary') || false;
    return {
      id: a.id || `audio-${i}`,
      streamIndex: a.streamIndex ?? i,
      label: a.label || `Audio Track ${i + 1}`,
      language: a.language || 'Undetermined',
      languageCode: a.languageCode || 'und',
      codec: a.codec || 'AAC',
      channelCount: a.channels || 2,
      channelLayout: a.channelLayout || (a.channels === 6 ? '5.1 Surround' : a.channels === 1 ? 'Mono 1.0' : 'Stereo 2.0'),
      sampleRate: a.sampleRate,
      bitrate: a.bitrate,
      role: isCommentary ? 'commentary' : 'main',
      default: a.isDefault ?? i === 0,
      enabled: a.isDefault ?? i === 0,
      isPlayable: a.isPlayable !== false,
      unsupportedReason: a.unsupportedReason,
    };
  });

  // 3. Transform Text / Subtitle Streams
  const textTracks: TextTrack[] = (analysis.subtitleTracks || []).map((s, i) => {
    return {
      id: s.id || `sub-${i}`,
      streamIndex: s.streamIndex ?? i,
      label: s.label || `Subtitle ${i + 1}`,
      language: s.language || 'Undetermined',
      languageCode: s.languageCode || 'und',
      kind: 'subtitles',
      format: s.format || 'vtt',
      default: s.isDefault ?? false,
      forced: s.isForced ?? false,
      enabled: s.isDefault ?? false,
      cues: s.cues,
    };
  });

  return {
    videoTracks,
    audioTracks,
    textTracks,
  };
}

/**
 * Resolves initial deterministic track selection based on defaults and user preferences
 */
export function resolveInitialSelection(
  trackSet: MediaTrackSet,
  preferences?: {
    preferredAudioLanguage?: string;
    preferredTextLanguage?: string;
    enableSubtitlesByDefault?: boolean;
  }
): MediaSelectionState {
  // Resolve Video Track
  let selectedVideoId = trackSet.videoTracks.find((v) => v.default && v.isPlayable)?.id || null;
  if (!selectedVideoId && trackSet.videoTracks.length > 0) {
    selectedVideoId = trackSet.videoTracks.find((v) => v.isPlayable)?.id || trackSet.videoTracks[0].id;
  }

  // Resolve Audio Track
  let selectedAudioId: string | null = null;
  if (preferences?.preferredAudioLanguage) {
    const prefCode = preferences.preferredAudioLanguage.toLowerCase();
    const matched = trackSet.audioTracks.find(
      (a) => a.isPlayable && (a.language.toLowerCase().includes(prefCode) || a.languageCode.toLowerCase() === prefCode)
    );
    if (matched) selectedAudioId = matched.id;
  }

  if (!selectedAudioId) {
    selectedAudioId = trackSet.audioTracks.find((a) => a.default && a.isPlayable)?.id || null;
  }
  if (!selectedAudioId && trackSet.audioTracks.length > 0) {
    selectedAudioId = trackSet.audioTracks.find((a) => a.isPlayable)?.id || trackSet.audioTracks[0].id;
  }

  // Resolve Subtitle Track
  let selectedTextId = 'off';
  if (preferences?.enableSubtitlesByDefault || preferences?.preferredTextLanguage) {
    if (preferences.preferredTextLanguage) {
      const prefText = preferences.preferredTextLanguage.toLowerCase();
      const matchedText = trackSet.textTracks.find(
        (t) => t.language.toLowerCase().includes(prefText) || t.languageCode.toLowerCase() === prefText
      );
      if (matchedText) selectedTextId = matchedText.id;
    }
  }

  if (selectedTextId === 'off') {
    const forced = trackSet.textTracks.find((t) => t.forced);
    if (forced) {
      selectedTextId = forced.id;
    } else {
      const defText = trackSet.textTracks.find((t) => t.default);
      if (defText && preferences?.enableSubtitlesByDefault) {
        selectedTextId = defText.id;
      }
    }
  }

  return {
    selectedVideoTrackId: selectedVideoId,
    selectedAudioTrackId: selectedAudioId,
    selectedTextTrackId: selectedTextId,
  };
}
