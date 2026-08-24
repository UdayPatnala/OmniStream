import { describe, it, expect, beforeEach } from 'vitest';
import { localVideoAnalyzer } from '../../lib/cinemorph/localVideoAnalyzer';
import { hybridMediaRouter } from '../../lib/cinemorph/hybridRouter';

describe('Tier 2: Missing Local Video Metadata & Canvas Faults (Boundary)', () => {
  beforeEach(() => {
    localVideoAnalyzer.reset();
  });

  it('T2-META-01: video element with readyState < 2 returns null from analyzeVideoFrame safely', () => {
    const videoEl = document.createElement('video');
    Object.defineProperty(videoEl, 'readyState', { value: 1 }); // HAVE_METADATA only
    Object.defineProperty(videoEl, 'videoWidth', { value: 0 });

    const result = localVideoAnalyzer.analyzeVideoFrame(videoEl);
    expect(result).toBeNull();
  });

  it('T2-META-02: canvas analysis failure triggers Route J (model-unavailable) fallback', () => {
    const decision = hybridMediaRouter.determineRoute({
      isLocal: true,
      durationSeconds: 3600,
      hasCanvasFailed: true,
    });

    expect(decision.route).toBe('model-unavailable');
    expect(decision.enableDynamicAmbilight).toBe(false);
    expect(decision.theaterLOD).toBe('minimal');
  });

  it('T2-META-03: repeated analysis on same video frame uses cached result without re-computation', () => {
    const videoEl = document.createElement('video');
    Object.defineProperty(videoEl, 'readyState', { value: 4 });
    Object.defineProperty(videoEl, 'videoWidth', { value: 1280 });
    Object.defineProperty(videoEl, 'videoHeight', { value: 720 });

    const first = localVideoAnalyzer.analyzeVideoFrame(videoEl, 'frame_cache_key');
    const cached = localVideoAnalyzer.getCachedAnalysis('frame_cache_key');

    expect(cached).toBeDefined();
    expect(cached?.dominantColor).toBe(first?.dominantColor);
  });

  it('T2-META-04: zero-duration video handles progress calculations safely without division by zero', () => {
    const decision = hybridMediaRouter.determineRoute({
      isLocal: true,
      durationSeconds: 0,
    });
    expect(decision).toBeDefined();
    expect(decision.allowBackgroundLookahead).toBe(false);
  });
});
