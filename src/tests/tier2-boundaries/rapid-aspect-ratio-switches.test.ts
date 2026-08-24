import { describe, it, expect } from 'vitest';
import { adaptiveCinemaEngine } from '../../lib/cinemorph/adaptiveCinemaEngine';
import { FrameAspectRatio } from '../../types';

describe('Tier 2: Rapid Aspect Ratio Switching & Deadzone Hysteresis (Boundary)', () => {
  it('T2-RAPD-01: rapid switching between 1.43:1, 1.90:1, original, 4:3, 21:9 produces stable numeric transforms', () => {
    adaptiveCinemaEngine.resetState();
    const ratios: FrameAspectRatio[] = ['1.43:1', '1.90:1', 'original', '4:3', '21:9', '1.43:1'];

    for (let i = 0; i < 30; i++) {
      const ratio = ratios[i % ratios.length];
      const output = adaptiveCinemaEngine.process({
        currentTime: i * 0.1,
        duration: 300,
        aspectRatio: ratio,
        reframeMode: 'face-priority',
        audioPreset: 'original',
      });

      expect(output.screenTransform.scale).toBeGreaterThan(0);
      expect(Number.isNaN(output.screenTransform.scale)).toBe(false);
      expect(Number.isNaN(output.screenTransform.translateY)).toBe(false);
    }
  });

  it('T2-RAPD-02: hard seek jumps (>1.5s) immediately reset smoothing filters to avoid drift', () => {
    adaptiveCinemaEngine.resetState();
    
    // Step 1: Play at 5.0s
    adaptiveCinemaEngine.process({
      currentTime: 5.0,
      duration: 300,
      aspectRatio: '1.43:1',
      reframeMode: 'face-priority',
      audioPreset: 'original',
    });

    // Step 2: Seek jump to 120.0s (>1.5s delta)
    const seekOutput = adaptiveCinemaEngine.process({
      currentTime: 120.0,
      duration: 300,
      aspectRatio: '1.43:1',
      reframeMode: 'face-priority',
      audioPreset: 'original',
    });

    expect(seekOutput.analysisPriority).toBe('high');
  });

  it('T2-RAPD-03: subtitleSafeMode instantly bypasses smart crop to scale 1.0', () => {
    const output = adaptiveCinemaEngine.process({
      currentTime: 10,
      duration: 300,
      aspectRatio: '1.43:1',
      reframeMode: 'face-priority',
      subtitlesActive: true,
      audioPreset: 'original',
    });

    expect(output.subtitleSafeMode).toBe(true);
    expect(output.screenTransform.scale).toBe(1.0);
    expect(output.screenTransform.translateY).toBe(0);
    expect(output.explainabilityLabel).toContain('Subtitle Safe Mode');
  });

  it('T2-RAPD-04: low raw confidence (<0.60) defaults safely to original directorial composition', () => {
    const output = adaptiveCinemaEngine.process({
      currentTime: 15,
      duration: 300,
      aspectRatio: '1.43:1',
      reframeMode: 'face-priority',
      rawConfidence: 0.45,
      audioPreset: 'original',
    });

    expect(output.explainabilityLabel).toContain('Confidence Fallback');
  });
});
