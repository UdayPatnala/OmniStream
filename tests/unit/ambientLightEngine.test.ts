import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AmbientLightEngine, ambientLightEngine } from '../../src/products/cinemorph/media/ambientLightEngine';
import { formatRgbString, rgbToLuma, clampRgb } from '@omnistream/shared';

describe('AmbientLightEngine (CineMorph Ambient Mode Phase V1)', () => {
  let engine: AmbientLightEngine;

  beforeEach(() => {
    engine = new AmbientLightEngine();
    engine.reset();
  });

  describe('Initialization & State', () => {
    it('initializes with default photic-safe neutral ambient colors', () => {
      const analysis = engine.analyzeVideoFrame(null);
      expect(analysis.dominant).toBeDefined();
      expect(analysis.top).toBeDefined();
      expect(analysis.bottom).toBeDefined();
      expect(analysis.left).toBeDefined();
      expect(analysis.right).toBeDefined();
      expect(Number.isFinite(analysis.dominant.r)).toBe(true);
      expect(Number.isFinite(analysis.dominant.g)).toBe(true);
      expect(Number.isFinite(analysis.dominant.b)).toBe(true);
      expect(analysis.luma).toBeGreaterThanOrEqual(0);
      expect(analysis.luma).toBeLessThanOrEqual(1);
    });

    it('gracefully handles unready or invalid video elements without throwing', () => {
      const invalidVideo = {
        readyState: 1, // HAVE_METADATA only (< 2)
        videoWidth: 1920,
        videoHeight: 1080,
      } as unknown as HTMLVideoElement;

      const analysis = engine.analyzeVideoFrame(invalidVideo);
      expect(analysis.isCut).toBe(false);
      expect(analysis.dominant.r).toBeGreaterThanOrEqual(0);
    });
  });

  describe('4-Quadrant Edge Sampling & Chromaticity Extraction', () => {
    it('accurately samples and distinguishes distinct edge colors from canvas data', () => {
      // Mock video element ready for playback
      const mockVideo = {
        readyState: 4, // HAVE_ENOUGH_DATA
        videoWidth: 1920,
        videoHeight: 1080,
      } as unknown as HTMLVideoElement;

      // Mock canvas context drawing specific edge colors
      // Grid is 16 wide x 9 high = 144 pixels = 576 bytes
      const width = 16;
      const height = 9;
      const data = new Uint8ClampedArray(width * height * 4);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (y === 0) {
            // Top: Pure Red
            data[idx] = 255;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
          } else if (y === height - 1) {
            // Bottom: Pure Green
            data[idx] = 0;
            data[idx + 1] = 255;
            data[idx + 2] = 0;
          } else if (x === 0) {
            // Left: Pure Blue
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 255;
          } else if (x === width - 1) {
            // Right: Pure Yellow
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 0;
          } else {
            // Center: Dark Slate
            data[idx] = 20;
            data[idx + 1] = 20;
            data[idx + 2] = 20;
          }
          data[idx + 3] = 255;
        }
      }

      // Inject mock context into engine
      const mockCtx = {
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({ data }),
      } as unknown as CanvasRenderingContext2D;

      (engine as any).ctx = mockCtx;
      (engine as any).canvas = { width, height };

      // Sample frame multiple times to allow EMA filter to converge
      let analysis = engine.analyzeVideoFrame(mockVideo, 0.9);
      for (let i = 0; i < 5; i++) {
        analysis = engine.analyzeVideoFrame(mockVideo, 0.9);
      }

      // Verify top edge has highest red
      expect(analysis.top.r).toBeGreaterThan(analysis.top.g);
      expect(analysis.top.r).toBeGreaterThan(analysis.top.b);

      // Verify bottom edge has highest green
      expect(analysis.bottom.g).toBeGreaterThan(analysis.bottom.r);
      expect(analysis.bottom.g).toBeGreaterThan(analysis.bottom.b);

      // Verify left edge has highest blue
      expect(analysis.left.b).toBeGreaterThan(analysis.left.r);

      // Verify right edge has high red & green (yellow)
      expect(analysis.right.r).toBeGreaterThan(100);
      expect(analysis.right.g).toBeGreaterThan(100);
    });
  });

  describe('Photic Safety & EMA Low-Pass Damping', () => {
    it('smooths continuous color shifts to prevent strobe/seizure effects', () => {
      const mockVideo = {
        readyState: 4,
        videoWidth: 1920,
        videoHeight: 1080,
      } as unknown as HTMLVideoElement;

      const width = 16;
      const height = 9;
      // Baseline frame (60, 60, 60)
      const baseData = new Uint8ClampedArray(width * height * 4).fill(60);
      // Continuous shift frame (90, 90, 90) -> delta = 30 per channel = 90 total < 160 threshold
      const shiftData = new Uint8ClampedArray(width * height * 4).fill(90);

      let currentData = baseData;
      const mockCtx = {
        drawImage: vi.fn(),
        getImageData: vi.fn().mockImplementation(() => ({ data: currentData })),
      } as unknown as CanvasRenderingContext2D;

      (engine as any).ctx = mockCtx;
      (engine as any).canvas = { width, height };

      // Settle on base frame
      for (let i = 0; i < 5; i++) {
        engine.analyzeVideoFrame(mockVideo, 0.5);
      }

      // Step to shiftData with low alpha (0.15)
      currentData = shiftData;
      const step = engine.analyzeVideoFrame(mockVideo, 0.15);

      // Must not be flagged as cut, and must interpolate smoothly from ~60 toward 90:
      // ~60 + 0.15 * (90 - 60) = ~64.5
      expect(step.isCut).toBe(false);
      expect(step.dominant.r).toBeLessThan(75);
      expect(step.dominant.r).toBeGreaterThan(60);
    });

    it('detects scene cuts on large deltas and increases responsiveness', () => {
      const mockVideo = {
        readyState: 4,
        videoWidth: 1920,
        videoHeight: 1080,
      } as unknown as HTMLVideoElement;

      const width = 16;
      const height = 9;

      // Frame 1: Pitch Black
      const blackData = new Uint8ClampedArray(width * height * 4).fill(0);
      // Frame 2: Blinding White
      const whiteData = new Uint8ClampedArray(width * height * 4).fill(255);

      let currentData = blackData;
      const mockCtx = {
        drawImage: vi.fn(),
        getImageData: vi.fn().mockImplementation(() => ({ data: currentData })),
      } as unknown as CanvasRenderingContext2D;

      (engine as any).ctx = mockCtx;
      (engine as any).canvas = { width, height };

      // Settle on black
      for (let i = 0; i < 5; i++) {
        engine.analyzeVideoFrame(mockVideo);
      }

      // Cut to white
      currentData = whiteData;
      const cutAnalysis = engine.analyzeVideoFrame(mockVideo);

      expect(cutAnalysis.isCut).toBe(true);
      // Because it detected a cut, alpha increases to 0.85, so value responds quickly
      expect(cutAnalysis.dominant.r).toBeGreaterThan(180);
    });
  });

  describe('Render Isolation & DOM CSS Variable Application', () => {
    it('directly writes CSS variables to the DOM without React state', () => {
      const element = document.createElement('div');

      const analysis = {
        top: { r: 200, g: 50, b: 20 },
        bottom: { r: 10, g: 80, b: 150 },
        left: { r: 30, g: 40, b: 180 },
        right: { r: 220, g: 180, b: 30 },
        dominant: { r: 100, g: 90, b: 110 },
        luma: 0.38,
        isCut: false,
        timestamp: Date.now(),
      };

      engine.applyToElement(element, analysis, 'cinema');

      expect(element.style.getPropertyValue('--ambient-top')).toBe('rgb(200, 50, 20)');
      expect(element.style.getPropertyValue('--ambient-bottom')).toBe('rgb(10, 80, 150)');
      expect(element.style.getPropertyValue('--ambient-left')).toBe('rgb(30, 40, 180)');
      expect(element.style.getPropertyValue('--ambient-right')).toBe('rgb(220, 180, 30)');
      expect(element.style.getPropertyValue('--ambient-dominant')).toBe('rgb(100, 90, 110)');
      expect(element.style.getPropertyValue('--ambient-luma')).toBe('0.380');
      expect(element.style.getPropertyValue('--ambient-opacity')).toBe('0.65');
    });

    it('sets opacity to 0 when ambient mode is turned off', () => {
      const element = document.createElement('div');
      const analysis = engine.analyzeVideoFrame(null);

      engine.applyToElement(element, analysis, 'off');
      expect(element.style.getPropertyValue('--ambient-opacity')).toBe('0');
    });

    it('handles vivid and subtle dimmer intensity levels', () => {
      const element = document.createElement('div');
      const analysis = engine.analyzeVideoFrame(null);

      engine.applyToElement(element, analysis, 'vivid');
      expect(element.style.getPropertyValue('--ambient-opacity')).toBe('0.90');

      engine.applyToElement(element, analysis, 'subtle');
      expect(element.style.getPropertyValue('--ambient-opacity')).toBe('0.35');
    });

    it('handles analyzeAndApply single-call workflow', () => {
      const element = document.createElement('div');
      const analysis = engine.analyzeAndApply(null, element, 'cinema');

      expect(analysis).toBeDefined();
      expect(element.style.getPropertyValue('--ambient-top')).toBeTruthy();
      expect(element.style.getPropertyValue('--ambient-opacity')).toBe('0.65');
    });
  });

  describe('Shared Utility Helpers', () => {
    it('correctly clamps RGB values and formats strings', () => {
      expect(clampRgb({ r: -50, g: 300, b: 128 })).toEqual({ r: 0, g: 255, b: 128 });
      expect(clampRgb({ r: NaN, g: Infinity, b: 42 })).toEqual({ r: 0, g: 0, b: 42 });
      expect(formatRgbString({ r: 255, g: 128, b: 0 })).toBe('rgb(255, 128, 0)');
    });

    it('computes accurate ITU-R BT.601 perceptual luminance', () => {
      const pureWhite = rgbToLuma({ r: 255, g: 255, b: 255 });
      const pureBlack = rgbToLuma({ r: 0, g: 0, b: 0 });
      const pureGreen = rgbToLuma({ r: 0, g: 255, b: 0 });

      expect(pureWhite).toBeCloseTo(1.0, 2);
      expect(pureBlack).toBe(0);
      expect(pureGreen).toBeCloseTo(0.587, 2);
    });
  });
});
