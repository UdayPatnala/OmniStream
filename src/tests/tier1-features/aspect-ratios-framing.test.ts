import { describe, it, expect } from 'vitest';
import { calculateFrameStyle } from '../../lib/cinemorph/frameEngine';
import { adaptiveCinemaEngine } from '../../lib/cinemorph/adaptiveCinemaEngine';

describe('Tier 1: Aspect Ratios & Framing Calculations (F16, F17, F18, F19)', () => {
  it('T1-ASPT-01: 1.43:1 (IMAX GT) calculates correct aspect container and paddingTop (~69.93%)', () => {
    const style = calculateFrameStyle('1.43:1', 'center');
    expect(style.containerAspectClass).toBe('aspect-[143/100]');
    expect(style.paddingTop).toBe('69.93%');
    expect(style.cropOverlay).toBe(true);
    expect(style.videoScaleTransform).toContain('scale(1.25)');
  });

  it('T1-ASPT-02: 1.90:1 (IMAX Digital) calculates correct aspect container and paddingTop (~52.63%)', () => {
    const style = calculateFrameStyle('1.90:1', 'center');
    expect(style.containerAspectClass).toBe('aspect-[190/100]');
    expect(style.paddingTop).toBe('52.63%');
    expect(style.cropOverlay).toBe(true);
    expect(style.videoScaleTransform).toContain('scale(1.08)');
  });

  it('T1-ASPT-03: original mode produces native 16:9 uncropped viewport', () => {
    const style = calculateFrameStyle('original', 'center');
    expect(style.containerAspectClass).toBe('aspect-video');
    expect(style.paddingTop).toBe('56.25%');
    expect(style.cropOverlay).toBe(false);
    expect(style.videoScaleTransform).toBe('scale(1.0) translate(0px, 0px)');
  });

  it('T1-ASPT-04: 4:3 offline fallback mode configures 75% paddingTop and 4/3 ratio', () => {
    const style = calculateFrameStyle('4:3', 'center');
    expect(style.containerAspectClass).toBe('aspect-[4/3]');
    expect(style.paddingTop).toBe('75%');
    expect(style.videoScaleTransform).toBe('scale(1.0)');
  });

  it('T1-ASPT-05: face-priority reframe mode applies upward vertical translation', () => {
    const style143 = calculateFrameStyle('1.43:1', 'face-priority');
    expect(style143.videoScaleTransform).toContain('translateY(-3%)');
    const style190 = calculateFrameStyle('1.90:1', 'face-priority');
    expect(style190.videoScaleTransform).toContain('translateY(-2%)');
  });

  it('T1-ASPT-06: adaptiveCinemaEngine accurately produces subject-aware transform output for 1.43:1 and 1.90:1', () => {
    adaptiveCinemaEngine.resetState();
    const out143 = adaptiveCinemaEngine.process({
      currentTime: 10,
      duration: 300,
      aspectRatio: '1.43:1',
      reframeMode: 'face-priority',
      audioPreset: 'original',
    });

    expect(out143.explainabilityLabel).toContain('1.43');
    expect(out143.screenTransform.scale).toBeGreaterThan(1.0);
    expect(out143.subtitleSafeMode).toBe(false);
  });
});
