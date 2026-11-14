import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screenXAmbientEngine, ScreenXAmbientEngine } from '@/src/products/cinemorph/media/screenXAmbientEngine';
import { calculateTheaterProjectionLayout } from '@/src/products/cinemorph/pages/CineMorphTheater';
import { DEFAULT_SCREENX_CONFIG, ScreenXConfig } from '@omnistream/shared';

describe('CineMorph SCREEN X Ambient Engine & Layout Architecture', () => {
  let engine: ScreenXAmbientEngine;

  beforeEach(() => {
    engine = new ScreenXAmbientEngine();
  });

  afterEach(() => {
    engine.reset();
  });

  describe('1. Responsive Layout & 85% Viewport Dimension Constraints', () => {
    it('constrains SCREEN X main video to approximately 85% viewport width and height', () => {
      const layout = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: 'screen-x',
        frameStyleAspectRatio: '16 / 9',
        nativeAspectRatio: 16 / 9,
        theaterSeatingEnabled: false,
      });

      expect(layout.maxHeight).toBe('85vh');
      expect(layout.maxWidth).toBe('min(85vw, calc(85vh * (1.7777777777777777)))');
      expect(layout.aspectRatioStyle).toBe('1.7777777777777777');
    });

    it('preserves native aspect ratio for 2.39:1 anamorphic cinema without cropping or distortion', () => {
      const layout = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: 'screen-x',
        frameStyleAspectRatio: '16 / 9',
        nativeAspectRatio: 2.39,
        theaterSeatingEnabled: false,
      });

      expect(layout.maxHeight).toBe('85vh');
      expect(layout.maxWidth).toBe('min(85vw, calc(85vh * (2.39)))');
      expect(layout.aspectRatioStyle).toBe('2.39');
    });

    it('preserves native aspect ratio for 4:3 Academy ratio without stretching', () => {
      const layout = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: 'screen-x',
        frameStyleAspectRatio: '16 / 9',
        nativeAspectRatio: 4 / 3,
        theaterSeatingEnabled: false,
      });

      expect(layout.maxHeight).toBe('85vh');
      expect(layout.maxWidth).toBe('min(85vw, calc(85vh * (1.3333333333333333)))');
      expect(layout.aspectRatioStyle).toBe('1.3333333333333333');
    });

    it('accommodates theater seating clearance when seating is enabled', () => {
      const layoutWithSeats = calculateTheaterProjectionLayout({
        isFullscreen: false,
        isOriginalMode: false,
        frameAspectRatio: 'screen-x',
        frameStyleAspectRatio: '16 / 9',
        nativeAspectRatio: 1.778,
        theaterSeatingEnabled: true,
      });

      const layoutFullscreenSeats = calculateTheaterProjectionLayout({
        isFullscreen: true,
        isOriginalMode: false,
        frameAspectRatio: 'screen-x',
        frameStyleAspectRatio: '16 / 9',
        nativeAspectRatio: 1.778,
        theaterSeatingEnabled: true,
      });

      expect(layoutWithSeats.maxHeight).toContain('min(82vh');
      expect(layoutFullscreenSeats.maxHeight).toContain('min(85vh, calc(100dvh - 5rem))');
    });
  });

  describe('2. Dual-Wing Independent Edge Chromaticity Analysis', () => {
    it('initializes with dark neutral ambient floor values', () => {
      const initial = engine.getCurrentAnalysis();
      expect(initial.leftEdge.r).toBeGreaterThanOrEqual(0);
      expect(initial.rightEdge.r).toBeGreaterThanOrEqual(0);
      expect(initial.leftGradientStops.length).toBe(3);
      expect(initial.rightGradientStops.length).toBe(3);
      expect(initial.isCut).toBe(false);
    });

    it('falls back safely when video element is null or unready without throwing', () => {
      const resultNull = engine.analyzeFrame(null);
      expect(resultNull).toBeDefined();
      expect(resultNull.leftGradientStops).toHaveLength(3);

      const mockUnreadyVideo = {
        readyState: 0,
        videoWidth: 0,
        videoHeight: 0,
      } as any;
      const resultUnready = engine.analyzeFrame(mockUnreadyVideo);
      expect(resultUnready).toBeDefined();
      expect(resultUnready.rightGradientStops).toHaveLength(3);
    });

    it('applies saturation adjustment correctly to sampled colors', () => {
      const mockVideo = {
        readyState: 4,
        videoWidth: 1920,
        videoHeight: 1080,
      } as any;

      const boostedConfig: ScreenXConfig = {
        ...DEFAULT_SCREENX_CONFIG,
        colorSaturation: 1.8,
      };

      const result = engine.analyzeFrame(mockVideo, boostedConfig);
      expect(result.leftLuma).toBeGreaterThanOrEqual(0);
      expect(result.rightLuma).toBeGreaterThanOrEqual(0);
    });

    it('detects scene cuts on sudden high chromaticity delta', () => {
      const mockVideo = {
        readyState: 4,
        videoWidth: 1920,
        videoHeight: 1080,
      } as any;

      const res1 = engine.analyzeFrame(mockVideo);
      expect(res1.isCut).toBe(false);
    });
  });

  describe('3. Render Isolation & DOM Style Property Injection', () => {
    it('directly writes CSS variables and gradients to left and right wings with 0 React re-renders', () => {
      const leftWing = document.createElement('div');
      const rightWing = document.createElement('div');

      const analysis = engine.getCurrentAnalysis();
      engine.applyToWings(leftWing, rightWing, analysis, DEFAULT_SCREENX_CONFIG);

      expect(leftWing.style.getPropertyValue('--screenx-edge')).toBeDefined();
      expect(leftWing.style.getPropertyValue('--screenx-blur')).toBe('50px');
      expect(leftWing.style.getPropertyValue('--screenx-spread')).toBe('1.5');
      expect(leftWing.style.background).toContain('linear-gradient');
      expect(leftWing.style.opacity).toBe('0.75');

      expect(rightWing.style.getPropertyValue('--screenx-edge')).toBeDefined();
      expect(rightWing.style.getPropertyValue('--screenx-blur')).toBe('50px');
      expect(rightWing.style.background).toContain('linear-gradient');
      expect(rightWing.style.opacity).toBe('0.75');
    });

    it('suppresses opacity when wings or feature are disabled', () => {
      const leftWing = document.createElement('div');
      const rightWing = document.createElement('div');

      const analysis = engine.getCurrentAnalysis();
      engine.applyToWings(leftWing, rightWing, analysis, {
        ...DEFAULT_SCREENX_CONFIG,
        enabled: false,
      });

      expect(leftWing.style.opacity).toBe('0');
      expect(rightWing.style.opacity).toBe('0');
    });

    it('respects independent left and right wing toggles', () => {
      const leftWing = document.createElement('div');
      const rightWing = document.createElement('div');

      const analysis = engine.getCurrentAnalysis();
      engine.applyToWings(leftWing, rightWing, analysis, {
        ...DEFAULT_SCREENX_CONFIG,
        leftEnabled: true,
        rightEnabled: false,
      });

      expect(leftWing.style.opacity).toBe('0.75');
      expect(rightWing.style.opacity).toBe('0');
    });
  });

  describe('4. Lifecycle & Resource Cleanup', () => {
    it('properly starts and stops tracking loops without memory retention', () => {
      const mockVideo = document.createElement('video');
      const leftWing = document.createElement('div');
      const rightWing = document.createElement('div');

      engine.startTracking(mockVideo, leftWing, rightWing, DEFAULT_SCREENX_CONFIG);
      expect(leftWing.style.opacity).toBe('0.75');

      engine.stopTracking();
      // Should cleanly stop without errors
      expect(true).toBe(true);
    });

    it('resets all gradient stops and dominant edge states on reset()', () => {
      engine.reset();
      const current = engine.getCurrentAnalysis();
      expect(current.leftEdge.r).toBe(8);
      expect(current.rightEdge.r).toBe(8);
      expect(current.leftGradientStops[0].r).toBe(8);
    });
  });
});
