import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { audioEngine } from '../../lib/cinemorph/audioEngine';
import { AudioPreset, AudioEQConfig } from '../../types';

describe('Tier 5 Adversarial: Web Audio DSP Context Failures & Silent Fallbacks', () => {
  let originalAudioContext: any;
  let originalWebkitAudioContext: any;

  beforeEach(() => {
    originalAudioContext = (window as any).AudioContext;
    originalWebkitAudioContext = (window as any).webkitAudioContext;
    audioEngine.reset();
  });

  afterEach(() => {
    (window as any).AudioContext = originalAudioContext;
    (window as any).webkitAudioContext = originalWebkitAudioContext;
    audioEngine.reset();
    vi.restoreAllMocks();
  });

  it('T5-AUD-01: Complete absence of AudioContext and webkitAudioContext falls back immediately without exception', () => {
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;

    const initialized = audioEngine.init();
    expect(initialized).toBe(false);

    // Verify applyConfig and getSpectrumData do not throw
    expect(() => {
      audioEngine.applyConfig(audioEngine.getPresetConfig('dialogue-boost'));
    }).not.toThrow();

    const spectrum = audioEngine.getSpectrumData();
    expect(spectrum).toBeInstanceOf(Uint8Array);
    expect(spectrum.length).toBeGreaterThanOrEqual(16);
    expect(spectrum[0]).toBe(128); // Safe neutral midpoint fallback
  });

  it('T5-AUD-02: AudioContext constructor throwing NotAllowedError or QuotaExceededError is caught cleanly', () => {
    (window as any).AudioContext = class FailingAudioContext {
      constructor() {
        throw new DOMException('The AudioContext was not allowed to start.', 'NotAllowedError');
      }
    };

    const initialized = audioEngine.init();
    expect(initialized).toBe(false);

    // Pipeline should remain safe
    const spectrum = audioEngine.getSpectrumData();
    expect(spectrum[0]).toBe(128);
  });

  it('T5-AUD-03: applyConfig safely handles invalid, undefined, null, or extreme EQ parameters without throwing', () => {
    const maliciousConfigs: any[] = [
      undefined,
      null,
      {},
      { preset: 'non_existent_preset' },
      { preset: 'bass-heavy', bassBoost: NaN, dialogueClarity: Infinity, trebleShine: -Infinity },
      { preset: 'spatial-3d', bassBoost: 999999, dialogueClarity: -999999, surround3D: 'malicious' },
    ];

    maliciousConfigs.forEach((cfg) => {
      expect(() => {
        audioEngine.applyConfig(cfg);
      }).not.toThrow();
    });
  });

  it('T5-AUD-04: getPresetConfig returns well-formed AudioEQConfig for all valid and invalid preset strings', () => {
    const presets: any[] = [
      'original',
      'dialogue-boost',
      'bass-heavy',
      'spatial-3d',
      'night-compression',
      'invalid-preset',
      '',
      null,
      undefined,
    ];

    presets.forEach((preset) => {
      const config = audioEngine.getPresetConfig(preset as AudioPreset);
      expect(config).toBeDefined();
      expect(Number.isFinite(config.bassBoost)).toBe(true);
      expect(Number.isFinite(config.dialogueClarity)).toBe(true);
      expect(Number.isFinite(config.trebleShine)).toBe(true);
      expect(typeof config.surround3D).toBe('boolean');
      expect(typeof config.drcLoudness).toBe('boolean');
    });
  });

  it('T5-AUD-05: MediaElementSource creation failure (CORS / already attached node) falls back without error', () => {
    const mockMediaEl = document.createElement('video');

    // Mock AudioContext where createMediaElementSource throws InvalidStateError
    class MockFailingAudioContext {
      state = 'running';
      createBiquadFilter() { return { type: 'lowshelf', frequency: { value: 150 }, gain: { value: 0 }, Q: { value: 1 } }; }
      createDynamicsCompressor() { return { threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 1 }, attack: { value: 0 }, release: { value: 0 } }; }
      createStereoPanner() { return { pan: { value: 0 } }; }
      createAnalyser() { return { fftSize: 64, frequencyBinCount: 32, getByteFrequencyData: vi.fn() }; }
      createMediaElementSource() {
        throw new DOMException('HTMLMediaElement already connected to another AudioNode', 'InvalidStateError');
      }
      close() { return Promise.resolve(); }
    }

    (window as any).AudioContext = MockFailingAudioContext;

    expect(() => {
      const initialized = audioEngine.init(mockMediaEl);
      expect(initialized).toBe(false);
    }).not.toThrow();
  });

  it('T5-AUD-06: 1,000 rapid preset switches execute smoothly across all presets', () => {
    const validPresets: AudioPreset[] = ['original', 'dialogue-boost', 'bass-heavy', 'spatial-3d', 'night-compression'];

    for (let i = 0; i < 1000; i++) {
      const preset = validPresets[i % validPresets.length];
      const cfg = audioEngine.getPresetConfig(preset);
      audioEngine.applyConfig(cfg);
    }

    expect(true).toBe(true);
  });

  it('T5-AUD-07: AudioEngine reset and teardown cleans up internal audio node references', () => {
    audioEngine.init();
    audioEngine.reset();

    expect((audioEngine as any).isInitialized).toBe(false);
    expect((audioEngine as any).audioCtx).toBeNull();
    expect((audioEngine as any).bassFilter).toBeNull();
  });
});
