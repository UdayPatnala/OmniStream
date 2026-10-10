import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TrackSelector,
  createTrackSetFromAnalysis,
  resolveInitialSelection,
  MediaTrackSet,
} from '@omnistream/cinemorph';
import { MediaContainerAnalysis } from '@/src/types';

describe('CineMorph Track Model & TrackSelector (v1.09.10.0)', () => {
  let selector: TrackSelector;

  const mockAnalysis: MediaContainerAnalysis = {
    containerFormat: 'MKV',
    mimeType: 'video/webm',
    durationSeconds: 9600,
    fileSizeBytes: 8000000000,
    audioTracks: [
      {
        id: 'audio-0',
        streamIndex: 0,
        label: 'Telugu 5.1 Master',
        language: 'Telugu',
        languageCode: 'tel',
        codec: 'AAC',
        channels: 6,
        channelLayout: '5.1 Surround',
        isDefault: true,
        isPlayable: true,
      },
      {
        id: 'audio-1',
        streamIndex: 1,
        label: 'English 5.1 Dub',
        language: 'English',
        languageCode: 'eng',
        codec: 'AAC',
        channels: 6,
        channelLayout: '5.1 Surround',
        isDefault: false,
        isPlayable: true,
      },
      {
        id: 'audio-2',
        streamIndex: 2,
        label: "Director's Commentary",
        language: 'Telugu',
        languageCode: 'tel',
        codec: 'AAC',
        channels: 2,
        channelLayout: 'Stereo 2.0',
        isDefault: false,
        isPlayable: true,
      },
      {
        id: 'audio-3',
        streamIndex: 3,
        label: 'Dolby Atmos (TrueHD)',
        language: 'English',
        languageCode: 'eng',
        codec: 'TrueHD',
        channels: 8,
        channelLayout: '7.1 Surround',
        isDefault: false,
        isPlayable: false,
        unsupportedReason: 'Proprietary TrueHD codec unsupported',
      },
    ],
    videoStreams: [
      {
        id: 'video-0',
        streamIndex: 0,
        label: '4K IMAX (1.90:1)',
        codec: 'HEVC',
        width: 3840,
        height: 2020,
        resolution: '4K',
        aspectRatio: '1.90:1',
        isDefault: true,
        isPlayable: true,
      },
    ],
    subtitleTracks: [
      {
        id: 'sub-0',
        streamIndex: 0,
        label: 'English [SDH]',
        language: 'English',
        languageCode: 'eng',
        format: 'vtt',
        isDefault: false,
        isForced: false,
        cues: [
          { startTime: 10, endTime: 14, text: 'Welcome to the theater.' },
          { startTime: 15, endTime: 18, text: 'Enjoy the film.' },
        ],
      },
      {
        id: 'sub-1',
        streamIndex: 1,
        label: 'Telugu Full',
        language: 'Telugu',
        languageCode: 'tel',
        format: 'srt',
        isDefault: false,
        isForced: false,
      },
      {
        id: 'sub-2',
        streamIndex: 2,
        label: 'Telugu Forced',
        language: 'Telugu',
        languageCode: 'tel',
        format: 'srt',
        isDefault: false,
        isForced: true,
      },
    ],
    defaultAudioTrackId: 'audio-0',
    defaultVideoStreamId: 'video-0',
    isContainerSupported: true,
    isPlaybackSupported: true,
    compatibilitySummary: 'Supported',
  };

  beforeEach(() => {
    selector = new TrackSelector();
  });

  describe('1. createTrackSetFromAnalysis Transformation', () => {
    it('creates canonical MediaTrackSet separating language, role, and codec', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);

      expect(trackSet.videoTracks).toHaveLength(1);
      expect(trackSet.audioTracks).toHaveLength(4);
      expect(trackSet.textTracks).toHaveLength(3);

      // Verify commentary role detection
      const commentary = trackSet.audioTracks.find((a) => a.id === 'audio-2');
      expect(commentary?.role).toBe('commentary');

      // Verify unplayable track marking
      const truehd = trackSet.audioTracks.find((a) => a.id === 'audio-3');
      expect(truehd?.isPlayable).toBe(false);
      expect(truehd?.unsupportedReason).toBeDefined();
    });

    it('gracefully handles empty/null container analysis', () => {
      const empty = createTrackSetFromAnalysis(null);
      expect(empty.videoTracks).toEqual([]);
      expect(empty.audioTracks).toEqual([]);
      expect(empty.textTracks).toEqual([]);
    });
  });

  describe('2. Deterministic Initial Track Selection', () => {
    it('selects default playable tracks when no language preference is supplied', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);
      const selection = resolveInitialSelection(trackSet);

      expect(selection.selectedVideoTrackId).toBe('video-0');
      expect(selection.selectedAudioTrackId).toBe('audio-0'); // Telugu 5.1 (default)
      expect(selection.selectedTextTrackId).toBe('sub-2'); // Forced subtitle picked
    });

    it('respects user language preference over container default', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);
      const selection = resolveInitialSelection(trackSet, {
        preferredAudioLanguage: 'English',
        preferredTextLanguage: 'English',
      });

      expect(selection.selectedAudioTrackId).toBe('audio-1'); // English 5.1
      expect(selection.selectedTextTrackId).toBe('sub-0'); // English SDH
    });
  });

  describe('3. TrackSelector Runtime Coordination & Switching', () => {
    it('initializes track set and notifies subscribers', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);
      const listener = vi.fn();
      const unsubscribe = selector.subscribe(listener);

      selector.initializeTracks(trackSet);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(selector.getSelectedAudioTrack()?.language).toBe('Telugu');
      expect(selector.getLoadState()).toBe('tracks_discovered');

      unsubscribe();
    });

    it('switches audio track seamlessly while preserving timecode', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);
      selector.initializeTracks(trackSet);

      const mockVideo = {
        currentTime: 3600,
        paused: false,
        play: vi.fn().mockResolvedValue(undefined),
      } as unknown as HTMLVideoElement;

      const result = selector.selectAudioTrack('audio-1', mockVideo);
      expect(result.success).toBe(true);
      expect(result.track?.id).toBe('audio-1');
      expect(result.previousTime).toBe(3600);
      expect(selector.getSelectedAudioTrack()?.id).toBe('audio-1');
    });

    it('rejects unplayable audio tracks without disrupting active selection', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);
      selector.initializeTracks(trackSet);

      const initialAudio = selector.getSelectedAudioTrack();
      const result = selector.selectAudioTrack('audio-3'); // TrueHD (unplayable)

      expect(result.success).toBe(false);
      expect(selector.getSelectedAudioTrack()?.id).toBe(initialAudio?.id);
    });

    it('switches text/subtitle track and toggles off cleanly', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);
      selector.initializeTracks(trackSet);

      // Select Telugu Subtitle
      const res = selector.selectTextTrack('sub-1');
      expect(res.success).toBe(true);
      expect(selector.getSelectedTextTrack()?.id).toBe('sub-1');

      // Turn Off
      const offRes = selector.selectTextTrack('off');
      expect(offRes.success).toBe(true);
      expect(selector.getSelectedTextTrack()).toBeNull();
      expect(selector.getSelection().selectedTextTrackId).toBe('off');
    });

    it('resets cleanly to initial empty state', () => {
      const trackSet = createTrackSetFromAnalysis(mockAnalysis);
      selector.initializeTracks(trackSet);
      expect(selector.getTrackSet().audioTracks.length).toBeGreaterThan(0);

      selector.reset();
      expect(selector.getTrackSet().audioTracks).toEqual([]);
      expect(selector.getSelection().selectedAudioTrackId).toBeNull();
      expect(selector.getLoadState()).toBe('no_media');
    });
  });
});
