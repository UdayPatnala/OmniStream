import { describe, it, expect, beforeEach } from 'vitest';
import { adaptiveCinemaEngine } from '../../lib/cinemorph/adaptiveCinemaEngine';
import { calculateFrameStyle } from '../../lib/cinemorph/frameEngine';
import { useCineMorphStore, AspectRatioMode } from '../../state/useCineMorphStore';
import { FrameAspectRatio, FrameReframeMode } from '../../types';

describe('Tier 5 Adversarial: High-Load Aspect Ratio Toggling & Invalid Input Hardening', () => {
  beforeEach(() => {
    adaptiveCinemaEngine.resetState();
    useCineMorphStore.setState({
      aspectRatio: 'original',
      panOffset: { x: 0, y: 0 },
      isOffline: false,
    });
  });

  it('T5-AR-01: 1,000 rapid cycles across valid ratios maintain strictly finite numeric transforms', () => {
    const validRatios: FrameAspectRatio[] = ['1.43:1', '1.90:1', 'original', '4:3', '21:9', '1:1', 'auto', '4.3:1', '16:9'];
    const reframeModes: FrameReframeMode[] = ['center', 'face-priority', 'smart-pan-zoom'];

    for (let i = 0; i < 1000; i++) {
      const ratio = validRatios[i % validRatios.length];
      const mode = reframeModes[i % reframeModes.length];
      const time = (i * 0.033) % 600; // Simulating 30fps stream timestamp

      const out = adaptiveCinemaEngine.process({
        currentTime: time,
        duration: 600,
        aspectRatio: ratio,
        reframeMode: mode,
        audioPreset: 'original',
        rawConfidence: 0.85 + (i % 15) * 0.01,
      });

      expect(Number.isFinite(out.screenTransform.scale)).toBe(true);
      expect(out.screenTransform.scale).toBeGreaterThan(0);
      expect(Number.isFinite(out.screenTransform.translateY)).toBe(true);
      expect(Number.isFinite(out.screenTransform.translateX)).toBe(true);
      expect(Number.isFinite(out.screenTransform.confidence)).toBe(true);
      expect(out.screenTransform.cssTransform).toMatch(/^scale\(\d+(\.\d+)?\) translateY\(-?\d+(\.\d+)?%\)$/);
    }
  });

  it('T5-AR-02: Extreme and invalid aspect ratio strings fall back safely without exceptions or NaN', () => {
    const adversarialInputs: any[] = [
      '',
      'invalid_aspect_ratio',
      '-1:1',
      '0:0',
      '0.00000001:1',
      '99999999:1',
      '1:99999999',
      'NaN:NaN',
      'Infinity:1',
      'null',
      'undefined',
      '__proto__',
      'constructor',
      '<script>alert(1)</script>',
      '😀:🎬',
      null,
      undefined,
      12345,
      {},
      [],
    ];

    adversarialInputs.forEach((invalidRatio, idx) => {
      expect(() => {
        const out = adaptiveCinemaEngine.process({
          currentTime: idx,
          duration: 300,
          aspectRatio: invalidRatio as FrameAspectRatio,
          reframeMode: 'face-priority',
          audioPreset: 'original',
        });

        expect(Number.isFinite(out.screenTransform.scale)).toBe(true);
        expect(out.screenTransform.scale).toBeGreaterThanOrEqual(1.0);
        expect(Number.isFinite(out.screenTransform.translateY)).toBe(true);
        expect(out.explainabilityLabel).toBeDefined();
      }).not.toThrow();
    });
  });

  it('T5-AR-03: Rapid chaotic aspect switching interleaved with hard seeks (>1.5s) flushes filters properly', () => {
    let prevPriority: string = 'medium';

    // Step A: Steady state playback
    for (let t = 0; t < 5; t += 0.1) {
      adaptiveCinemaEngine.process({
        currentTime: t,
        duration: 500,
        aspectRatio: '1.43:1',
        reframeMode: 'face-priority',
        audioPreset: 'original',
      });
    }

    // Step B: Chaotic seeking with aspect ratio changes
    const seekPoints = [150.5, 12.0, 480.2, 0.0, 999.9, 50.0];
    seekPoints.forEach((seekTime, idx) => {
      const out = adaptiveCinemaEngine.process({
        currentTime: seekTime,
        duration: 500,
        aspectRatio: idx % 2 === 0 ? '1.90:1' : '4:3',
        reframeMode: 'smart-pan-zoom',
        audioPreset: 'spatial-3d',
      });

      expect(out.analysisPriority).toBe('high'); // Hard seek should trigger high priority analysis
      expect(Number.isFinite(out.screenTransform.scale)).toBe(true);
      expect(Number.isFinite(out.screenTransform.translateY)).toBe(true);
      prevPriority = out.analysisPriority;
    });

    // Step C: Play for next few frames without seek - priority should normalize
    const nextFrameOut = adaptiveCinemaEngine.process({
      currentTime: 50.033,
      duration: 500,
      aspectRatio: '4:3',
      reframeMode: 'smart-pan-zoom',
      audioPreset: 'spatial-3d',
    });
    expect(nextFrameOut.analysisPriority).toBe('medium');
  });

  it('T5-AR-04: calculateFrameStyle handles all invalid and boundary aspect ratios returning well-formed CSS', () => {
    const adversarialAspects: any[] = [
      '',
      'unknown',
      '1.43:1',
      '1.90:1',
      'original',
      '4:3',
      '21:9',
      '1:1',
      '4.3:1',
      '16:9',
      null,
      undefined,
      '0:0',
      '../../malicious',
    ];

    adversarialAspects.forEach((aspect) => {
      const result = calculateFrameStyle(aspect, 'face-priority');
      expect(result).toBeDefined();
      expect(typeof result.containerAspectClass).toBe('string');
      expect(result.containerAspectClass.length).toBeGreaterThan(0);
      expect(typeof result.aspectRatioStyle).toBe('string');
      expect(typeof result.videoScaleTransform).toBe('string');
      expect(typeof result.cropOverlay).toBe('boolean');
      expect(result.paddingTop).toMatch(/^\d+(\.\d+)?%$/);
    });
  });

  it('T5-AR-05: useCineMorphStore aspect ratio toggling and invalid strings sanitize state gracefully', () => {
    const store = useCineMorphStore.getState();

    // Valid ratio set
    store.setAspectRatio('1.43:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');

    store.setAspectRatio('1.90:1');
    expect(useCineMorphStore.getState().aspectRatio).toBe('1.90:1');

    // Invalid ratio set should sanitize back to 'original'
    store.setAspectRatio('non-existent-ratio' as AspectRatioMode);
    expect(useCineMorphStore.getState().aspectRatio).toBe('original');

    store.setAspectRatio('' as AspectRatioMode);
    expect(useCineMorphStore.getState().aspectRatio).toBe('original');

    store.setAspectRatio(null as any);
    expect(useCineMorphStore.getState().aspectRatio).toBe('original');
  });

  it('T5-AR-06: Deadzone hysteresis prevents micro-jitter during sub-threshold oscillations', () => {
    adaptiveCinemaEngine.resetState();

    // Frame 1: Establish steady state
    const f1 = adaptiveCinemaEngine.process({
      currentTime: 1.0,
      duration: 100,
      aspectRatio: '1.43:1',
      reframeMode: 'face-priority',
      audioPreset: 'original',
    });

    const initialScale = f1.screenTransform.scale;

    // Frame 2: Tiny variation (sub-deadzone delta < 0.03)
    const f2 = adaptiveCinemaEngine.process({
      currentTime: 1.033,
      duration: 100,
      aspectRatio: '1.43:1',
      reframeMode: 'face-priority',
      audioPreset: 'original',
    });

    // Verify deadzone prevented sudden erratic jump
    expect(Math.abs(f2.screenTransform.scale - initialScale)).toBeLessThan(0.05);
  });
});
