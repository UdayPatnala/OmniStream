import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localVideoAnalyzer } from '../../lib/cinemorph/localVideoAnalyzer';
import { adaptiveCinemaEngine } from '../../lib/cinemorph/adaptiveCinemaEngine';
import { MockFramingEngine } from '../helpers/contracts';
import { useCineMorphStore } from '../../state/useCineMorphStore';

describe('Tier 5 Adversarial: ML Framing Engine Stress & Numeric Stability', () => {
  let framingEngine: MockFramingEngine;

  beforeEach(async () => {
    framingEngine = new MockFramingEngine();
    await framingEngine.init();
    localVideoAnalyzer.reset();
    adaptiveCinemaEngine.resetState();
    useCineMorphStore.setState({
      panOffset: { x: 0, y: 0 },
      playbackTimestamp: 0,
    });
  });

  it('T5-ML-01: Zero-dimension video stream (width=0, height=0) safely returns null without divide-by-zero', () => {
    const zeroVideoEl = document.createElement('video');
    Object.defineProperty(zeroVideoEl, 'readyState', { value: 4 });
    Object.defineProperty(zeroVideoEl, 'videoWidth', { value: 0 });
    Object.defineProperty(zeroVideoEl, 'videoHeight', { value: 0 });

    const result = localVideoAnalyzer.analyzeVideoFrame(zeroVideoEl, 'key_zero');
    expect(result).toBeNull();

    // Negative dimension edge case
    const negVideoEl = document.createElement('video');
    Object.defineProperty(negVideoEl, 'readyState', { value: 4 });
    Object.defineProperty(negVideoEl, 'videoWidth', { value: -1920 });
    Object.defineProperty(negVideoEl, 'videoHeight', { value: -1080 });

    const negResult = localVideoAnalyzer.analyzeVideoFrame(negVideoEl, 'key_neg');
    expect(negResult).toBeNull();
  });

  it('T5-ML-02: Corrupted readyState video element (readyState < 2 or uninitialized) returns null safely', () => {
    const unreadyVideoEl0 = document.createElement('video');
    Object.defineProperty(unreadyVideoEl0, 'readyState', { value: 0, configurable: true }); // HAVE_NOTHING
    Object.defineProperty(unreadyVideoEl0, 'videoWidth', { value: 1920, configurable: true });
    Object.defineProperty(unreadyVideoEl0, 'videoHeight', { value: 1080, configurable: true });

    expect(localVideoAnalyzer.analyzeVideoFrame(unreadyVideoEl0)).toBeNull();

    const unreadyVideoEl1 = document.createElement('video');
    Object.defineProperty(unreadyVideoEl1, 'readyState', { value: 1, configurable: true }); // HAVE_METADATA
    Object.defineProperty(unreadyVideoEl1, 'videoWidth', { value: 1920, configurable: true });
    Object.defineProperty(unreadyVideoEl1, 'videoHeight', { value: 1080, configurable: true });
    expect(localVideoAnalyzer.analyzeVideoFrame(unreadyVideoEl1)).toBeNull();

    expect(localVideoAnalyzer.analyzeVideoFrame(null as any)).toBeNull();
    expect(localVideoAnalyzer.analyzeVideoFrame(undefined as any)).toBeNull();
  });

  it('T5-ML-03: Corrupt and extreme pixel data buffers produce bounded saliency and contrast scores', () => {
    const testVideo = document.createElement('video');
    Object.defineProperty(testVideo, 'readyState', { value: 4, configurable: true });
    Object.defineProperty(testVideo, 'videoWidth', { value: 1920, configurable: true });
    Object.defineProperty(testVideo, 'videoHeight', { value: 1080, configurable: true });

    // Mock 2D context to return various extreme image data
    const canvas = (localVideoAnalyzer as any).canvas as HTMLCanvasElement;
    const ctx = (localVideoAnalyzer as any).ctx as CanvasRenderingContext2D;

    if (ctx && canvas) {
      // Scenario A: All black (zeros)
      const blackData = { data: new Uint8ClampedArray(16 * 9 * 4).fill(0), width: 16, height: 9 };
      vi.spyOn(ctx, 'getImageData').mockReturnValueOnce(blackData as any);

      const blackAnalysis = localVideoAnalyzer.analyzeVideoFrame(testVideo, 'black');
      expect(blackAnalysis).not.toBeNull();
      expect(blackAnalysis?.avgBrightness).toBe(0);
      expect(blackAnalysis?.dominantColor).toBe('rgb(0, 0, 0)');
      expect(blackAnalysis?.saliencyCenterX).toBeGreaterThanOrEqual(0.1);
      expect(blackAnalysis?.saliencyCenterX).toBeLessThanOrEqual(0.9);
      expect(blackAnalysis?.contrastScore).toBe(100);

      // Scenario B: All white (255s)
      const whiteData = { data: new Uint8ClampedArray(16 * 9 * 4).fill(255), width: 16, height: 9 };
      vi.spyOn(ctx, 'getImageData').mockReturnValueOnce(whiteData as any);

      const whiteAnalysis = localVideoAnalyzer.analyzeVideoFrame(testVideo, 'white');
      expect(whiteAnalysis).not.toBeNull();
      expect(whiteAnalysis?.avgBrightness).toBe(255);
      expect(whiteAnalysis?.dominantColor).toBe('rgb(255, 255, 255)');
      expect(whiteAnalysis?.contrastScore).toBe(99);

      // Scenario C: Pure gray 128 (Zero contrast weight)
      const grayData = new Uint8ClampedArray(16 * 9 * 4);
      for (let i = 0; i < grayData.length; i += 4) {
        grayData[i] = 128;
        grayData[i + 1] = 128;
        grayData[i + 2] = 128;
        grayData[i + 3] = 255;
      }
      vi.spyOn(ctx, 'getImageData').mockReturnValueOnce({ data: grayData, width: 16, height: 9 } as any);

      const grayAnalysis = localVideoAnalyzer.analyzeVideoFrame(testVideo, 'gray');
      expect(grayAnalysis).not.toBeNull();
      expect(grayAnalysis?.saliencyCenterX).toBe(0.5); // Defaults safely to center 0.5 when weight is 0
      expect(grayAnalysis?.contrastScore).toBe(0);
    }
  });

  it('T5-ML-04: Spring filter & temporal smoothing numeric stability against NaN / Infinity injection', () => {
    const maliciousNumericValues = [
      NaN,
      Infinity,
      -Infinity,
      -0,
      1e308,
      -1e308,
      Number.MIN_VALUE,
      Number.EPSILON,
      null as any,
      undefined as any,
    ];

    maliciousNumericValues.forEach((val) => {
      // 1. Process with malicious currentTime / duration
      const out = adaptiveCinemaEngine.process({
        currentTime: val,
        duration: val,
        aspectRatio: '1.43:1',
        reframeMode: 'face-priority',
        audioPreset: 'original',
        rawConfidence: val,
      });

      expect(Number.isFinite(out.screenTransform.scale)).toBe(true);
      expect(out.screenTransform.scale).toBeGreaterThan(0);
      expect(Number.isFinite(out.screenTransform.translateY)).toBe(true);
      expect(Number.isFinite(out.screenTransform.confidence)).toBe(true);
      expect(out.ambientLight.dominantColor).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\.85\)$/);

      // 2. Zustand pan offset & timestamp setters with malicious values
      useCineMorphStore.getState().setPanOffset(val, val);
      const pan = useCineMorphStore.getState().panOffset;
      expect(Number.isFinite(pan.x)).toBe(true);
      expect(Number.isFinite(pan.y)).toBe(true);
      expect(pan.x).toBeGreaterThanOrEqual(-1);
      expect(pan.x).toBeLessThanOrEqual(1);

      useCineMorphStore.getState().setPlaybackTimestamp(val);
      const ts = useCineMorphStore.getState().playbackTimestamp;
      expect(Number.isFinite(ts)).toBe(true);
      expect(ts).toBeGreaterThanOrEqual(0);
    });
  });

  it('T5-ML-05: Extreme timeline inputs (duration=0, duration < 0, huge seconds) maintain safe ambient RGB', () => {
    const extremeCases = [
      { current: 0, dur: 0 },
      { current: -50, dur: -100 },
      { current: 1e9, dur: 100 },
      { current: 50, dur: 1e12 },
    ];

    extremeCases.forEach(({ current, dur }) => {
      const out = adaptiveCinemaEngine.process({
        currentTime: current,
        duration: dur,
        aspectRatio: '1.90:1',
        reframeMode: 'face-priority',
        audioPreset: 'original',
      });

      expect(out.ambientLight.dominantColor).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\.85\)$/);
      expect(out.ambientLight.luminance).toBe(0.45);
    });
  });

  it('T5-ML-06: MockFramingEngine 1,000 rapid frame inferences with rule cycling maintains finite coordinates', () => {
    const rules = ['rule_of_thirds', 'leading_lines', 'frame_in_frame', 'screen_direction', 'auto'] as const;

    for (let i = 0; i < 1000; i++) {
      framingEngine.setRule(rules[i % rules.length]);
      const tel = framingEngine.processFrame();

      expect(Number.isFinite(tel.targetX)).toBe(true);
      expect(Number.isFinite(tel.targetY)).toBe(true);
      expect(Number.isFinite(tel.currentX)).toBe(true);
      expect(Number.isFinite(tel.currentY)).toBe(true);
      expect(Number.isFinite(tel.confidence)).toBe(true);
      expect(tel.confidence).toBeGreaterThan(0);
      expect(tel.fps).toBe(60);
    }
  });

  it('T5-ML-07: Canvas context drawing exceptions (e.g. tainted canvas or drawImage error) fail silently and return null', () => {
    const testVideo = document.createElement('video');
    Object.defineProperty(testVideo, 'readyState', { value: 4 });
    Object.defineProperty(testVideo, 'videoWidth', { value: 1920 });
    Object.defineProperty(testVideo, 'videoHeight', { value: 1080 });

    const ctx = (localVideoAnalyzer as any).ctx as CanvasRenderingContext2D;
    if (ctx) {
      vi.spyOn(ctx, 'drawImage').mockImplementationOnce(() => {
        throw new DOMException('The operation is insecure (tainted canvas)', 'SecurityError');
      });

      const result = localVideoAnalyzer.analyzeVideoFrame(testVideo);
      expect(result).toBeNull(); // Must return null without bubbling exception
    }
  });
});
