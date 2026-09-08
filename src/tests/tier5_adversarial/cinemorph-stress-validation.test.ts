import { describe, it, expect, beforeEach } from 'vitest';
import { mediaParser } from '../../lib/cinemorph/mediaParser';
import { posterService } from '../../lib/cinemorph/posterService';
import { audioEngine } from '../../lib/cinemorph/audioEngine';
import { parseSubtitleContent, sanitizeCueText, parseTimecode, CineMorphCaptionController } from '../../lib/cinemorph/captionService';
import { adaptiveCinemaEngine } from '../../lib/cinemorph/adaptiveCinemaEngine';
import { localVideoAnalyzer } from '../../lib/cinemorph/localVideoAnalyzer';
import { AudioPreset } from '../../types';

describe('Tier 5 Adversarial: CineMorph Final Capability Stress & Resilience Validation', () => {
  beforeEach(() => {
    posterService.clearCache();
    audioEngine.reset();
    adaptiveCinemaEngine.resetState();
    localVideoAnalyzer.reset();
  });

  // =========================================================================
  // PHASE 1 — MEDIA PARSER STRESS VALIDATION
  // =========================================================================
  describe('Phase 1: Media Parser Robustness & Fallback Discipline', () => {
    it('handles a completely empty 0-byte file without throwing and returns valid playback structure', async () => {
      const emptyBlob = new Blob([], { type: 'video/mp4' });
      const result = await mediaParser.parseMediaFile(emptyBlob, 'empty.mp4');

      expect(result).toBeDefined();
      expect(result.fileSizeBytes).toBe(0);
      expect(result.isPlaybackSupported).toBe(true);
      expect(result.audioTracks.length).toBeGreaterThanOrEqual(1);
      expect(result.videoStreams.length).toBeGreaterThanOrEqual(1);
      expect(result.defaultAudioTrackId).toBeTruthy();
      expect(result.defaultVideoStreamId).toBeTruthy();
    });

    it('handles truncated / corrupt ISOBMFF header without throwing', async () => {
      const corruptBytes = new Uint8Array([
        0x00, 0x00, 0x00, 0x20, // claims 32 bytes
        0x66, 0x74, 0x79, 0x70, // 'ftyp'
        0x69, 0x73, 0x6f, 0x6d, // 'isom'
      ]);
      const blob = new Blob([corruptBytes], { type: 'video/mp4' });
      const result = await mediaParser.parseMediaFile(blob, 'corrupt.mp4');

      expect(result).toBeDefined();
      expect(result.isPlaybackSupported).toBe(true);
      expect(result.audioTracks[0].isPlayable).toBe(true);
    });

    it('handles truncated / corrupt EBML / Matroska header without throwing', async () => {
      const corruptEbml = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0xff, 0xff]);
      const blob = new Blob([corruptEbml], { type: 'video/x-matroska' });
      const result = await mediaParser.parseMediaFile(blob, 'truncated.mkv');

      expect(result).toBeDefined();
      expect(result.isPlaybackSupported).toBe(true);
      expect(result.audioTracks.length).toBeGreaterThan(0);
      expect(result.videoStreams.length).toBeGreaterThan(0);
    });

    it('resiliently handles high-entropy random binary fuzzing (64KB)', async () => {
      const randomBytes = new Uint8Array(65536);
      for (let i = 0; i < randomBytes.length; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
      const blob = new Blob([randomBytes], { type: 'application/octet-stream' });
      const result = await mediaParser.parseMediaFile(blob, 'fuzz_sample.bin');

      expect(result).toBeDefined();
      expect(result.fileSizeBytes).toBe(65536);
      expect(result.isPlaybackSupported).toBe(true);
      expect(result.defaultAudioTrackId).toBe('audio-0');
    });

    it('parses direct standalone audio files (MP3, FLAC, WAV) with correct master track', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], { type: 'audio/flac' });
      const result = await mediaParser.parseMediaFile(audioBlob, 'soundtrack.flac');

      expect(result.containerFormat).toContain('FLAC');
      expect(result.audioTracks.length).toBe(1);
      expect(result.videoStreams.length).toBe(0);
      expect(result.audioTracks[0].codec).toBe('FLAC');
      expect(result.isPlaybackSupported).toBe(true);
    });
  });

  // =========================================================================
  // PHASE 2 — RAPID MEDIA REPLACEMENT & RACE CONDITIONS
  // =========================================================================
  describe('Phase 2: Rapid Media Replacement & Race Condition Immunity', () => {
    it('executes consecutive asynchronous media parses without memory corruption or race failures', async () => {
      const files = [
        new Blob([new Uint8Array(100)], { type: 'video/mp4' }),
        new Blob([new Uint8Array(200)], { type: 'video/x-matroska' }),
        new Blob([new Uint8Array(300)], { type: 'audio/wav' }),
        new Blob([new Uint8Array(50)], { type: 'video/webm' }),
      ];

      const promises = files.map((f, i) => mediaParser.parseMediaFile(f, `clip_${i}.mp4`));
      const results = await Promise.all(promises);

      expect(results.length).toBe(4);
      results.forEach((res, i) => {
        expect(res.isPlaybackSupported).toBe(true);
        expect(res.fileSizeBytes).toBe(files[i].size);
      });
    });
  });

  // =========================================================================
  // PHASE 3 — POSTER INTELLIGENCE EDGE CASES
  // =========================================================================
  describe('Phase 3: Poster Intelligence Fallback & Edge Cases', () => {
    it('falls back gracefully to brand fallback artwork for local files when canvas extraction is unavailable', async () => {
      const req = {
        sourceUrl: 'blob:http://localhost:3000/mock-blob-uuid',
        isLocal: true,
        title: 'Dark Scene Test',
      };

      const resolved = await posterService.resolvePoster(req);
      expect(resolved).toBeDefined();
      expect(resolved.url).toBeTruthy();
      expect(['brand_fallback', 'local_extracted', 'remote_high', 'remote_fallback']).toContain(resolved.sourceType);
    });

    it('caches resolved posters and allows clean cache clearance', async () => {
      const req = {
        id: 'test-cache-key-123',
        sourceUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        posterUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        isLocal: false,
      };

      const poster1 = await posterService.resolvePoster(req);
      const poster2 = await posterService.resolvePoster(req);
      expect(poster1).toBe(poster2);

      posterService.clearCache();
    });
  });

  // =========================================================================
  // PHASE 4 — LOCAL VIDEO ANALYZER RENDER ISOLATION & PROLONGED PLAYBACK
  // =========================================================================
  describe('Phase 4: Local Video Analyzer Render Isolation', () => {
    it('does not throw when passed null or unready video elements and returns null', () => {
      expect(() => {
        const res = localVideoAnalyzer.analyzeVideoFrame(null as any);
        expect(res).toBeNull();
      }).not.toThrow();

      expect(() => {
        localVideoAnalyzer.reset();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // PHASE 5 — AUDIO DSP SIGNAL-PATH & MODE SWITCHING STRESS
  // =========================================================================
  describe('Phase 5: Audio DSP Signal-Path & Mode Switching Stress', () => {
    it('switches through all DSP presets cleanly without NaN or infinite parameters', () => {
      const presets: AudioPreset[] = [
        'dialogue-boost',
        'bass-heavy',
        'spatial-3d',
        'night-compression',
        'original',
      ];

      presets.forEach((preset) => {
        const config = audioEngine.getPresetConfig(preset);
        expect(config).toBeDefined();
        expect(Number.isFinite(config.bassBoost)).toBe(true);
        expect(Number.isFinite(config.dialogueClarity)).toBe(true);
        expect(Number.isFinite(config.trebleShine)).toBe(true);
        expect(typeof config.surround3D).toBe('boolean');
        expect(typeof config.drcLoudness).toBe('boolean');

        expect(() => audioEngine.applyConfig(config)).not.toThrow();
      });
    });

    it('handles extreme and NaN values in applyConfig gracefully', () => {
      expect(() => {
        audioEngine.applyConfig({
          preset: 'original',
          bassBoost: NaN,
          dialogueClarity: Infinity,
          trebleShine: -Infinity,
          surround3D: false,
          drcLoudness: true,
        });
      }).not.toThrow();
    });

    it('probes unsupported multi-channel codecs with honest diagnostic reasons', () => {
      const dtsProbe = audioEngine.probeStreamPlayability('DTS-HD MA 7.1');
      expect(dtsProbe.isPlayable).toBe(false);
      expect(dtsProbe.reason).toContain('unsupported');

      const aacProbe = audioEngine.probeStreamPlayability('AAC');
      expect(aacProbe.isPlayable).toBe(true);
    });

    it('safely handles repeated reset calls without leak or error', () => {
      expect(() => {
        audioEngine.reset();
        audioEngine.reset();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // PHASE 6 — CAPTION PARSING & SUBTITLE EDGE CASES
  // =========================================================================
  describe('Phase 6: Caption Parsing & Subtitle Edge Cases', () => {
    it('sanitizes HTML tags, WebVTT voice tags, entities, and intra-cue timestamps', () => {
      const raw = '<v Speaker 1><b>Hello</b> &amp; welcome <00:01:23.456>to <i>CineMorph</i>!</v>';
      const cleaned = sanitizeCueText(raw);
      expect(cleaned).toBe('Hello & welcome to CineMorph!');
    });

    it('parses varied timecode formats correctly', () => {
      expect(parseTimecode('01:23:45.678')).toBe(1 * 3600 + 23 * 60 + 45.678);
      expect(parseTimecode('05:30.500')).toBe(5 * 60 + 30.5);
      expect(parseTimecode('01:15:30,250')).toBe(1 * 3600 + 15 * 60 + 30.25);
      expect(parseTimecode('invalid:time')).toBeNull();
      expect(parseTimecode('')).toBeNull();
    });

    it('ignores inverted timecodes where end time is before start time', () => {
      const srt = `1\n00:02:00,000 --> 00:01:00,000\nThis cue has inverted timestamps!`;
      const cues = parseSubtitleContent(srt);
      expect(cues.length).toBe(0);
    });

    it('handles empty, malformed, or binary string subtitles gracefully', () => {
      expect(parseSubtitleContent('')).toEqual([]);
      expect(parseSubtitleContent('NOT_SUBTITLES_AT_ALL')).toEqual([]);
      expect(parseSubtitleContent('\x00\x01\x02\x03')).toEqual([]);
    });

    it('CineMorphCaptionController syncs time and detaches cleanly', () => {
      const controller = new CineMorphCaptionController();
      controller.loadSubtitleFile(`1\n00:00:01,000 --> 00:00:05,000\nFirst line\n\n2\n00:00:06,000 --> 00:00:10,000\nSecond line`);
      expect(controller.getParsedCuesCount()).toBe(2);

      expect(controller.getActiveCueAtTime(3)).toBe('First line');
      expect(controller.getActiveCueAtTime(5.5)).toBeNull();
      expect(controller.getActiveCueAtTime(8)).toBe('Second line');

      controller.detachVideo();
      expect(controller.getActiveText()).toBeNull();
    });
  });

  // =========================================================================
  // PHASE 7 — ADAPTIVE CINEMA ENGINE
  // =========================================================================
  describe('Phase 7: Adaptive Cinema Engine Stability', () => {
    it('computes safe transform and ambient light across extreme input boundary values', () => {
      const output = adaptiveCinemaEngine.process({
        currentTime: -50,
        duration: -100,
        aspectRatio: '1.43:1',
        reframeMode: 'face-priority',
        subtitlesActive: false,
        audioPreset: 'dialogue-boost',
        rawConfidence: NaN,
      });

      expect(output).toBeDefined();
      expect(Number.isFinite(output.screenTransform.scale)).toBe(true);
      expect(output.screenTransform.scale).toBeGreaterThanOrEqual(1.0);
      expect(output.ambientLight.lowpassColor).toContain('rgba(');
    });

    it('activates Subtitle Safe Mode to prevent cropping when subtitles are active', () => {
      const output = adaptiveCinemaEngine.process({
        currentTime: 10,
        duration: 120,
        aspectRatio: '1.43:1',
        reframeMode: 'face-priority',
        subtitlesActive: true,
        audioPreset: 'original',
      });

      expect(output.subtitleSafeMode).toBe(true);
      expect(output.screenTransform.scale).toBe(1.0);
      expect(output.explainabilityLabel).toContain('Subtitle Safe Mode');
    });
  });

  // =========================================================================
  // PHASE 10 — SIMULTANEOUS FAILURE RESILIENCE (ALL 5 ENHANCEMENTS BROKEN)
  // =========================================================================
  describe('Phase 10: Critical Path Failure Resilience Test (All 5 Enhancements Broken)', () => {
    it('guarantees media playback path survives when parser, poster, audio, captions, and analyzer all fail', async () => {
      // 1. Media Parser Catastrophic Failure
      const brokenBlob = new Blob([new Uint8Array([0xde, 0xad, 0xbe, 0xef])]);
      const parseResult = await mediaParser.parseMediaFile(brokenBlob, 'broken_file.mkv');
      expect(parseResult).toBeDefined();
      expect(parseResult.isPlaybackSupported).toBe(true);
      expect(parseResult.defaultVideoStreamId).toBeTruthy();

      // 2. Poster Service Catastrophic Failure
      const brokenPosterReq = {
        sourceUrl: 'blob:invalid-corrupted-url',
        isLocal: true,
      };
      const posterResult = await posterService.resolvePoster(brokenPosterReq);
      expect(posterResult).toBeDefined();
      expect(posterResult.url).toBe('/cinemorph_artwork.png');

      // 3. Audio DSP Failure / Undefined Config
      expect(() => {
        audioEngine.applyConfig(undefined);
        audioEngine.probeStreamPlayability(undefined);
      }).not.toThrow();

      // 4. Caption Service Corrupt Subtitles
      const corruptCaptions = 'CORRUPTED_BINARY_\x00\xFF_NO_TIMECODES';
      const cues = parseSubtitleContent(corruptCaptions);
      expect(cues).toEqual([]);

      // 5. Video Analyzer Safe Handling of null element
      expect(() => {
        const res = localVideoAnalyzer.analyzeVideoFrame(null as any);
        expect(res).toBeNull();
      }).not.toThrow();
    });
  });
});
