import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  audioFormatDetector,
  AudioFormatDetector,
  sony360Detector,
  Sony360Detector,
  spatialAudioEngine,
  SpatialAudioEngine,
} from '../../src/core/audio';
import { audioEngine } from '../../src/products/cinemorph/media/audioEngine';

describe('OmniStream Advanced Audio System & Automatic Spatial Audio', () => {
  beforeEach(() => {
    spatialAudioEngine.dispose();
    audioEngine.reset();
  });

  afterEach(() => {
    spatialAudioEngine.dispose();
    audioEngine.reset();
  });

  describe('AudioFormatDetector — Complete Format & Codec Matrix', () => {
    it('accurately identifies MP3 (MPEG-1 Audio Layer III)', () => {
      const res = audioFormatDetector.detectFormat('sample_audio.mp3');
      expect(res.container).toContain('MPEG');
      expect(res.codec).toContain('MP3');
      expect(res.supportLevel).toBe('native');
      expect(res.isNativelySupported).toBe(true);
    });

    it('accurately identifies WAV (Linear PCM)', () => {
      const res = audioFormatDetector.detectFormat('soundtrack.wav');
      expect(res.container).toContain('WAV');
      expect(res.codec).toContain('Linear PCM');
      expect(res.supportLevel).toBe('native');
    });

    it('accurately identifies FLAC (Free Lossless Audio Codec)', () => {
      const res = audioFormatDetector.detectFormat('orchestral_master.flac');
      expect(res.container).toContain('FLAC');
      expect(res.codec).toContain('FLAC Lossless');
      expect(res.isNativelySupported).toBe(true);
    });

    it('accurately identifies AAC in MP4 / ADTS containers', () => {
      const res = audioFormatDetector.detectFormat('stream.aac');
      expect(res.container).toContain('ADTS');
      expect(res.codec).toContain('AAC');
      expect(res.supportLevel).toBe('native');
    });

    it('accurately identifies Opus in WebM container', () => {
      const res = audioFormatDetector.detectFormat({
        name: 'video.webm',
        codec: 'opus',
        channels: 2,
      });
      expect(res.container).toContain('WebM');
      expect(res.codec).toBe('Opus');
      expect(res.supportLevel).toBe('native');
    });

    it('accurately identifies Ogg Vorbis', () => {
      const res = audioFormatDetector.detectFormat('track.ogg');
      expect(res.container).toContain('Ogg');
      expect(res.codec).toContain('Vorbis');
      expect(res.supportLevel).toBe('native');
    });

    it('accurately identifies AIFF audio files', () => {
      const res = audioFormatDetector.detectFormat('recording.aiff');
      expect(res.container).toContain('AIFF');
      expect(res.codec).toContain('PCM');
    });

    it('accurately identifies unsupported legacy WMA (Windows Media Audio)', () => {
      const res = audioFormatDetector.detectFormat('legacy.wma');
      expect(res.supportLevel).toBe('unsupported');
      expect(res.isNativelySupported).toBe(false);
      expect(res.unsupportedReason).toContain('WMA');
    });

    it('accurately detects proprietary DTS / DTS-HD streams and explains silence reason', () => {
      const res = audioFormatDetector.detectFormat({
        name: 'feature_film.mkv',
        codec: 'DTS-HD MA 7.1',
        channels: 8,
      });
      expect(res.container).toContain('Matroska');
      expect(res.codec).toContain('DTS-HD');
      expect(res.supportLevel).toBe('unsupported');
      expect(res.isNativelySupported).toBe(false);
      expect(res.unsupportedReason).toContain('DTS');
      expect(res.channels).toBe(8);
      expect(res.channelLayout).toBe('7.1 Surround');
    });

    it('accurately detects Dolby Digital (AC3 / EAC3)', () => {
      const res = audioFormatDetector.detectFormat({
        name: 'movie.mp4',
        codec: 'ac-3',
        channels: 6,
      });
      expect(res.codec).toContain('AC-3');
      expect(res.channels).toBe(6);
      expect(res.channelLayout).toBe('5.1 Surround');
      expect(res.isImmersiveEligible).toBe(true);
    });

    it('accurately detects ALAC (Apple Lossless Audio Codec)', () => {
      const res = audioFormatDetector.detectFormat({
        name: 'lossless.m4a',
        codec: 'alac',
        channels: 2,
      });
      expect(res.codec).toContain('Apple Lossless');
      expect(res.container).toContain('MPEG-4');
    });

    it('derives correct channel layouts (Mono 1.0, Stereo 2.0, 5.1, 7.1)', () => {
      expect(audioFormatDetector.getChannelLayoutLabel(1)).toBe('Mono 1.0');
      expect(audioFormatDetector.getChannelLayoutLabel(2)).toBe('Stereo 2.0');
      expect(audioFormatDetector.getChannelLayoutLabel(6)).toBe('5.1 Surround');
      expect(audioFormatDetector.getChannelLayoutLabel(8)).toBe('7.1 Surround');
      expect(audioFormatDetector.getChannelLayoutLabel(13)).toBe('Sony 360 Reality Audio');
    });
  });

  describe('Sony360Detector — Object Streams & MPEG-H Inspection', () => {
    it('detects confirmed Sony 360 Reality Audio via profile markers', () => {
      const res = sony360Detector.probe({
        name: 'immersive_concert_360RA.mp4',
        codec: 'mha1',
        channels: 16,
      });
      expect(res.isDetected).toBe(true);
      expect(res.confidence).toBe('confirmed');
      expect(res.formatProfile).toContain('Sony 360RA');
      expect(res.objectCount).toBe(16);
    });

    it('detects probable spatial streams when channel count is 13 or higher', () => {
      const res = sony360Detector.probe({
        name: 'cinema_spatial.mp4',
        codec: 'pcm',
        channels: 13,
      });
      expect(res.isDetected).toBe(true);
      expect(res.confidence).toBe('probable');
    });

    it('honestly returns none for standard stereo media', () => {
      const res = sony360Detector.probe('standard_podcast.mp3');
      expect(res.isDetected).toBe(false);
      expect(res.confidence).toBe('none');
    });
  });

  describe('SpatialAudioEngine — Web Audio DSP & Delay Compensation', () => {
    it('initializes cleanly without errors', () => {
      const success = spatialAudioEngine.init();
      expect(success).toBe(true);
    });

    it('resumes AudioContext properly', async () => {
      spatialAudioEngine.init();
      await expect(spatialAudioEngine.resume()).resolves.toBeUndefined();
    });

    it('applies and bounds audio delay compensation (-500ms to +500ms)', () => {
      spatialAudioEngine.init();

      spatialAudioEngine.setAudioDelay(150);
      expect(spatialAudioEngine.getAudioDelay()).toBe(150);

      spatialAudioEngine.setAudioDelay(-250);
      expect(spatialAudioEngine.getAudioDelay()).toBe(-250);

      // Clamping limits
      spatialAudioEngine.setAudioDelay(800);
      expect(spatialAudioEngine.getAudioDelay()).toBe(500);

      spatialAudioEngine.setAudioDelay(-900);
      expect(spatialAudioEngine.getAudioDelay()).toBe(-500);
    });

    it('automatically activates spatial audio on 5.1 / 7.1 multichannel media in auto mode', () => {
      spatialAudioEngine.init();
      spatialAudioEngine.applyConfig({ mode: 'auto', autoActivation: true });

      const evalResult = spatialAudioEngine.evaluateMedia({
        name: 'blockbuster_movie.mkv',
        codec: 'aac',
        channels: 6,
      });

      expect(evalResult.format.isImmersiveEligible).toBe(true);
      expect(evalResult.autoActivated).toBe(true);
      expect(spatialAudioEngine.getActiveMode()).toBe('binaural-cinema');
      expect(spatialAudioEngine.isAutoEngaged()).toBe(true);
    });

    it('automatically activates sony-360 mode when Sony 360RA metadata is detected', () => {
      spatialAudioEngine.init();
      spatialAudioEngine.applyConfig({ mode: 'auto', autoActivation: true });

      const evalResult = spatialAudioEngine.evaluateMedia({
        name: 'orchestra_live_360ra.mp4',
        codec: 'mha1',
        channels: 16,
      });

      expect(evalResult.sony360.isDetected).toBe(true);
      expect(evalResult.autoActivated).toBe(true);
      expect(spatialAudioEngine.getActiveMode()).toBe('sony-360');
    });

    it('remains in off bypass mode for stereo media when autoActivation is active', () => {
      spatialAudioEngine.init();
      spatialAudioEngine.applyConfig({ mode: 'auto', autoActivation: true });

      const evalResult = spatialAudioEngine.evaluateMedia({
        name: 'acoustic_duo.mp3',
        channels: 2,
      });

      expect(evalResult.format.isImmersiveEligible).toBe(false);
      expect(evalResult.autoActivated).toBe(false);
      expect(spatialAudioEngine.getActiveMode()).toBe('off');
    });

    it('allows explicit mode override to spatial-3d or binaural-cinema', () => {
      spatialAudioEngine.init();
      spatialAudioEngine.setMode('spatial-3d');
      expect(spatialAudioEngine.getActiveMode()).toBe('spatial-3d');

      spatialAudioEngine.setMode('off');
      expect(spatialAudioEngine.getActiveMode()).toBe('off');
    });

    it('updates room acoustics simulation (intimate, auditorium, cathedral)', () => {
      spatialAudioEngine.init();
      expect(() => {
        spatialAudioEngine.applyConfig({ virtualRoomSize: 'cathedral' });
        spatialAudioEngine.applyConfig({ virtualRoomSize: 'intimate' });
        spatialAudioEngine.applyConfig({ virtualRoomSize: 'auditorium' });
      }).not.toThrow();
    });

    it('attaches to HTMLMediaElement safely without duplicate source errors', () => {
      const mockVideo = document.createElement('video');
      const attached1 = spatialAudioEngine.attachMediaElement(mockVideo);
      expect(attached1).toBe(true);

      const attached2 = spatialAudioEngine.attachMediaElement(mockVideo);
      expect(attached2).toBe(true);
    });

    it('cleans up and disposes all Web Audio resources cleanly', () => {
      spatialAudioEngine.init();
      spatialAudioEngine.dispose();
      expect(spatialAudioEngine.getCurrentFormat()).toBeNull();
      expect(spatialAudioEngine.getCurrentSony360()).toBeNull();
    });
  });

  describe('CineMorph Audio Engine Compatibility', () => {
    it('preserves existing CineMorph 5-band EQ presets and spectrum extraction', () => {
      const initialized = audioEngine.init();
      expect(initialized).toBe(true);

      const dialoguePreset = audioEngine.getPresetConfig('dialogue-boost');
      expect(dialoguePreset.dialogueClarity).toBe(5.0);
      expect(() => audioEngine.applyConfig(dialoguePreset)).not.toThrow();

      const spectrum = audioEngine.getSpectrumData();
      expect(spectrum.length).toBeGreaterThan(0);
    });

    it('honestly reports playability of DTS and AC3 audio streams', () => {
      const dtsProbe = audioEngine.probeStreamPlayability('DTS-HD Master Audio');
      expect(dtsProbe.isPlayable).toBe(false);
      expect(dtsProbe.reason).toContain('DTS');

      const aacProbe = audioEngine.probeStreamPlayability('AAC');
      expect(aacProbe.isPlayable).toBe(true);
    });
  });
});
