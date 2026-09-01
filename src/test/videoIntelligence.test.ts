import { describe, it, expect, beforeEach } from 'vitest';
import {
  frameQualityAnalyzer,
  aspectRatioDetector,
  bestFrameSelector,
  videoAnalysisOrchestrator,
  ActiveImageBounds,
} from '../lib/cinemorph/videoIntelligence';

describe('L3 Video Intelligence & Frame Analysis Suite', () => {
  const width = 160;
  const height = 90;

  // Helper to create synthetic RGBA pixel buffer
  const createMockFrameData = (
    w: number,
    h: number,
    fillFn: (x: number, y: number) => [number, number, number, number]
  ): Uint8ClampedArray => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const [r, g, b, a] = fillFn(x, y);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }
    return data;
  };

  describe('1. FrameQualityAnalyzer (Sharpness & Exposure)', () => {
    it('accurately identifies high-sharpness high-contrast frames vs blurry frames', () => {
      // Checkerboard pattern (high edge frequency -> high Laplacian variance)
      const sharpFrame = createMockFrameData(width, height, (x, y) => {
        const isWhite = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
        return isWhite ? [240, 240, 240, 255] : [15, 15, 15, 255];
      });

      // Flat uniform gray (zero edges -> blur detected)
      const blurFrame = createMockFrameData(width, height, () => [128, 128, 128, 255]);

      const sharpResult = frameQualityAnalyzer.analyzeFrameData(sharpFrame, width, height);
      const blurResult = frameQualityAnalyzer.analyzeFrameData(blurFrame, width, height);

      expect(sharpResult.sharpnessScore).toBeGreaterThan(0.5);
      expect(sharpResult.blurDetected).toBe(false);

      expect(blurResult.sharpnessScore).toBeLessThan(0.1);
      expect(blurResult.blurDetected).toBe(true);
    });

    it('protects low-key cinematic scenes from being falsely discarded as underexposed', () => {
      // Low-key cinematic frame: dark background (average ~25) with bright high-contrast focal area
      const lowKeyFrame = createMockFrameData(width, height, (x, y) => {
        const inSpotlight = Math.hypot(x - width / 2, y - height / 2) < 20;
        return inSpotlight ? [220, 180, 100, 255] : [8, 8, 12, 255];
      });

      const result = frameQualityAnalyzer.analyzeFrameData(lowKeyFrame, width, height);

      expect(result.exposureStatus).toBe('low_key_cinematic');
      expect(result.contrastScore).toBeGreaterThan(0.4);
    });
  });

  describe('2. AspectRatioDetector (Active Image Bounds & Formats)', () => {
    it('detects 2.39:1 anamorphic letterbox black bars accurately', () => {
      // 2.39:1 letterboxed in 16:9 canvas (top and bottom ~12px black bars)
      const letterboxFrame = createMockFrameData(width, height, (x, y) => {
        if (y < 12 || y >= height - 12) {
          return [0, 0, 0, 255]; // Black bar
        }
        return [180, 160, 140, 255]; // Active content
      });

      const bounds = aspectRatioDetector.detectFrameBounds(letterboxFrame, width, height);

      expect(bounds.topBarHeight).toBeGreaterThanOrEqual(10);
      expect(bounds.bottomBarHeight).toBeGreaterThanOrEqual(10);
      expect(bounds.matchedStandard).toBe('2.39:1');
      expect(bounds.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('detects 1.43:1 IMAX GT pillarbox format accurately', () => {
      // 1.43:1 pillarboxed in 16:9 canvas (left and right ~16px black bars)
      const pillarboxFrame = createMockFrameData(width, height, (x, y) => {
        if (x < 16 || x >= width - 16) {
          return [0, 0, 0, 255]; // Pillarbox bar
        }
        return [200, 150, 120, 255]; // Active content
      });

      const bounds = aspectRatioDetector.detectFrameBounds(pillarboxFrame, width, height);

      expect(bounds.leftBarWidth).toBeGreaterThanOrEqual(14);
      expect(bounds.rightBarWidth).toBeGreaterThanOrEqual(14);
      expect(bounds.matchedStandard).toBe('1.43:1');
      expect(bounds.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('aggregates temporal samples and flags dynamic aspect ratio switches', () => {
      const sample1: ActiveImageBounds = {
        topBarHeight: 12,
        bottomBarHeight: 12,
        leftBarWidth: 0,
        rightBarWidth: 0,
        activeWidth: 160,
        activeHeight: 66,
        measuredAspectRatio: 2.39,
        matchedStandard: '2.39:1',
        confidence: 0.95,
      };

      const sample2: ActiveImageBounds = {
        topBarHeight: 0,
        bottomBarHeight: 0,
        leftBarWidth: 0,
        rightBarWidth: 0,
        activeWidth: 160,
        activeHeight: 90,
        measuredAspectRatio: 1.78,
        matchedStandard: '16:9',
        confidence: 0.96,
      };

      // 5 samples of 2.39:1 and 5 samples of 16:9 (Dynamic IMAX sequence)
      const consensus = aspectRatioDetector.aggregateTemporalDetections([
        sample1,
        sample1,
        sample1,
        sample1,
        sample1,
        sample2,
        sample2,
        sample2,
        sample2,
        sample2,
      ]);

      expect(consensus.isDynamic).toBe(true);
    });
  });

  describe('3. BestFrameSelector (Cascade Ranking & Weighting)', () => {
    it('ranks high-quality, centered frames higher than blurry or edge-heavy frames for ticket posters', () => {
      const goodFrame = {
        timestampSeconds: 15,
        frameIndex: 1,
        width,
        height,
        temporalDistanceFromCut: 4.0,
        rgbaData: createMockFrameData(width, height, (x, y) => {
          const isCenter = Math.hypot(x - width / 2, y - height / 2) < 25;
          return isCenter ? [255, 220, 150, 255] : [20, 20, 30, 255];
        }),
      };

      const blurryFrame = {
        timestampSeconds: 30,
        frameIndex: 2,
        width,
        height,
        temporalDistanceFromCut: 1.0,
        rgbaData: createMockFrameData(width, height, () => [128, 128, 128, 255]),
      };

      const { bestFrame, rankedCandidates } = bestFrameSelector.selectBestFrames(
        [blurryFrame, goodFrame],
        'ticket_thumbnail'
      );

      expect(bestFrame.timestampSeconds).toBe(15);
      expect(rankedCandidates[0].totalScore).toBeGreaterThan(rankedCandidates[1].totalScore);
      expect(bestFrame.selectionPurpose).toBe('ticket_thumbnail');
    });
  });

  describe('4. VideoAnalysisOrchestrator (Pipeline & Fallbacks)', () => {
    beforeEach(() => {
      videoAnalysisOrchestrator.clearCache();
    });

    it('generates a valid, confidence-aware deterministic fallback report when hardware canvas is unavailable', () => {
      const fallbackReport = videoAnalysisOrchestrator.createFallbackReport(120, 1.5);

      expect(fallbackReport.videoDuration).toBe(120);
      expect(fallbackReport.detectedFormat).toBe('1.90:1');
      expect(fallbackReport.formatConfidence).toBeGreaterThanOrEqual(0.8);
      expect(fallbackReport.bestFrames.ticketPoster.totalScore).toBeGreaterThan(0.7);
      expect(fallbackReport.analysisLatencyMs).toBe(1.5);
    });
  });
});
