import { describe, it, expect } from 'vitest';
import {
  MediaCapabilityDetector,
  mediaCapabilityDetector,
} from '@omnistream/cinemorph';
import { MediaContainerAnalysis } from '@/src/types';

describe('MediaCapabilityDetector — Container & Codec Capability Probing', () => {
  const detector = new MediaCapabilityDetector();

  describe('1. Container Recognition vs Native Playability', () => {
    it('recognizes standard HTML5 video containers as natively playable', () => {
      const mp4 = detector.probeContainer('.mp4');
      expect(mp4.isRecognized).toBe(true);
      expect(mp4.mimeType).toBe('video/mp4');

      const webm = detector.probeContainer('webm');
      expect(webm.isRecognized).toBe(true);
      expect(webm.mimeType).toBe('video/webm');

      const mov = detector.probeContainer('.mov');
      expect(mov.isRecognized).toBe(true);
      expect(mov.mimeType).toBe('video/quicktime');
    });

    it('recognizes Matroska (.mkv) container format for local-first playback', () => {
      const mkv = detector.probeContainer('mkv');
      expect(mkv.isRecognized).toBe(true);
      expect(mkv.containerFormat).toBe('Matroska');
    });

    it('distinguishes legacy non-browser containers (AVI, FLV, MPEG-TS)', () => {
      const avi = detector.probeContainer('.avi');
      expect(avi.isRecognized).toBe(true);
      expect(avi.containerFormat).toBe('AVI');

      const flv = detector.probeContainer('flv');
      expect(flv.isRecognized).toBe(true);
      expect(flv.containerFormat).toBe('Flash Video');

      const unknown = detector.probeContainer('.xyz');
      expect(unknown.isRecognized).toBe(false);
      expect(unknown.isNativelyPlayable).toBe(false);
    });
  });

  describe('2. Audio Codec Probing', () => {
    it('probes ubiquitous audio codecs as supported (AAC, Opus, Vorbis, FLAC, PCM)', () => {
      const aac = detector.probeAudioCodec('AAC');
      expect(aac.isSupported).toBe(true);

      const opus = detector.probeAudioCodec('Opus');
      expect(opus.isSupported).toBe(true);

      const flac = detector.probeAudioCodec('FLAC');
      expect(flac.isSupported).toBe(true);

      const pcm = detector.probeAudioCodec('PCM Linear 2.0');
      expect(pcm.isSupported).toBe(true);
    });

    it('flags proprietary audio codecs (AC-3, DTS) with clear user-facing explanation', () => {
      const ac3 = detector.probeAudioCodec('AC-3 Dolby Digital', 6);
      expect(ac3.isSupported).toBe(false);
      expect(ac3.reason).toBeDefined();

      const dts = detector.probeAudioCodec('DTS-HD Master Audio', 8);
      expect(dts.isSupported).toBe(false);
      expect(dts.reason).toContain('DTS');
    });
  });

  describe('3. Video Codec Probing', () => {
    it('probes H.264 (AVC) and VP9 as supported', async () => {
      const h264 = await detector.probeVideoCodec('H.264', 1920, 1080, 24);
      expect(h264.isSupported).toBe(true);

      const vp9 = await detector.probeVideoCodec('VP9', 3840, 2160, 60);
      expect(vp9.isSupported).toBe(true);
    });
  });

  describe('4. Full Container Analysis Annotation', () => {
    it('annotates playable and unplayable streams in container analysis object', async () => {
      const mockAnalysis: MediaContainerAnalysis = {
        containerFormat: 'MKV',
        mimeType: 'video/webm',
        durationSeconds: 7200,
        fileSizeBytes: 4000000000,
        audioTracks: [
          {
            id: 'audio-0',
            streamIndex: 0,
            label: 'Surround 5.1 (AC-3)',
            language: 'English',
            languageCode: 'eng',
            codec: 'AC-3',
            channels: 6,
            channelLayout: '5.1 Surround',
            isDefault: true,
            isPlayable: true,
          },
          {
            id: 'audio-1',
            streamIndex: 1,
            label: 'Stereo 2.0 (AAC)',
            language: 'English',
            languageCode: 'eng',
            codec: 'AAC',
            channels: 2,
            channelLayout: 'Stereo 2.0',
            isDefault: false,
            isPlayable: true,
          },
        ],
        videoStreams: [
          {
            id: 'video-0',
            streamIndex: 0,
            label: 'Main 4K Feature',
            codec: 'H.264',
            width: 3840,
            height: 2160,
            resolution: '4K',
            aspectRatio: '16:9',
            isDefault: true,
            isPlayable: true,
          },
        ],
        subtitleTracks: [],
        defaultAudioTrackId: 'audio-0',
        defaultVideoStreamId: 'video-0',
        isContainerSupported: true,
        isPlaybackSupported: true,
        compatibilitySummary: 'Direct Container Source',
      };

      const validated = await detector.validateContainerAnalysis(mockAnalysis);
      // AC-3 should be detected as unplayable
      expect(validated.audioTracks[0].isPlayable).toBe(false);
      expect(validated.audioTracks[0].unsupportedReason).toBeDefined();

      // Secondary AAC should be playable
      expect(validated.audioTracks[1].isPlayable).toBe(true);

      // Video should be playable
      expect(validated.videoStreams[0].isPlayable).toBe(true);
      expect(validated.isPlaybackSupported).toBe(true);
    });
  });
});
