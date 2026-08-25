import { describe, it, expect, beforeEach } from 'vitest';
import { omsPipeline } from '../../lib/cinemorph/oms/omsPipeline';
import { OMS_SceneCutDetector } from '../../lib/cinemorph/oms/sceneCutDetector';
import { OMS_VisionAnalyzer } from '../../lib/cinemorph/oms/visionAnalyzer';
import { OMS_MotionAnalyzer } from '../../lib/cinemorph/oms/motionAnalyzer';
import { OMS_CandidateGenerator } from '../../lib/cinemorph/oms/candidateGenerator';
import { OMS_CompositionScorer } from '../../lib/cinemorph/oms/compositionScorer';
import { OMS_TemporalController } from '../../lib/cinemorph/oms/temporalController';
import { OMS_FrameSample } from '../../lib/cinemorph/oms/types';

describe('OMS Modular 13-Stage Smart-Framing Pipeline Forensic Suite', () => {
  beforeEach(() => {
    omsPipeline.reset();
  });

  it('OMS-01: Original Mode completely bypasses crop, pan, and AI overhead with 1.0x scale', () => {
    const out = omsPipeline.processFrame(null, 'original', false);
    expect(out.scale).toBe(1.0);
    expect(out.panX).toBe(0);
    expect(out.panY).toBe(0);
    expect(out.isSourceProtected).toBe(true);
    expect(out.activeRule).toContain('Original');
  });

  it('OMS-02: Scene Cut Detector accurately identifies hard cuts from histogram deltas', () => {
    const detector = new OMS_SceneCutDetector();
    const frameA: OMS_FrameSample = {
      timestamp: 0,
      data: new Uint8ClampedArray(16 * 9 * 4),
      width: 16,
      height: 9,
      luminanceHistogram: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      averageBrightness: 10,
      averageRgb: { r: 10, g: 10, b: 10 },
    };
    const frameB: OMS_FrameSample = {
      timestamp: 1.0,
      data: new Uint8ClampedArray(16 * 9 * 4),
      width: 16,
      height: 9,
      luminanceHistogram: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100],
      averageBrightness: 240,
      averageRgb: { r: 240, g: 240, b: 240 },
    };

    const cutA = detector.process(frameA);
    expect(cutA.isHardCut).toBe(false);

    const cutB = detector.process(frameB);
    expect(cutB.isHardCut).toBe(true);
    expect(cutB.sceneId).toBe(1);
  });

  it('OMS-03: Vision Analyzer detects focal center of mass and subtitle occlusion', () => {
    const analyzer = new OMS_VisionAnalyzer();
    const data = new Uint8ClampedArray(16 * 9 * 4);
    // Fill bottom row with bright white pixels (simulated subtitles)
    for (let x = 0; x < 16; x++) {
      const idx = (8 * 16 + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }

    const sample: OMS_FrameSample = {
      timestamp: 2.0,
      data,
      width: 16,
      height: 9,
      luminanceHistogram: new Array(16).fill(5),
      averageBrightness: 120,
      averageRgb: { r: 120, g: 120, b: 120 },
    };

    const res = analyzer.analyze(sample);
    expect(res.subjects.length).toBeGreaterThan(0);
    expect(res.subtitleZoneBlocked).toBe(true);
  });

  it('OMS-04: Motion Analyzer computes velocity vector and direction angle', () => {
    const motion = new OMS_MotionAnalyzer();
    const visionA = {
      subjects: [],
      primarySubject: null,
      combinedCenter: { x: 0.2, y: 0.5 },
      subtitleZoneBlocked: false,
      confidence: 0.9,
    };
    const visionB = {
      subjects: [],
      primarySubject: null,
      combinedCenter: { x: 0.6, y: 0.5 },
      subtitleZoneBlocked: false,
      confidence: 0.9,
    };

    motion.process(visionA, 1.0);
    const vec = motion.process(visionB, 2.0);

    expect(vec.vx).toBeGreaterThan(0);
    expect(vec.speed).toBeGreaterThan(0);
  });

  it('OMS-05: Composition Scorer strictly protects source composition when improvement < 0.15', () => {
    const scorer = new OMS_CompositionScorer();
    const candidates = new OMS_CandidateGenerator().generateCandidates('1.90:1');
    const vision = {
      subjects: [],
      primarySubject: null,
      combinedCenter: { x: 0.5, y: 0.5 },
      subtitleZoneBlocked: false,
      confidence: 0.85,
    };
    const motion = { vx: 0, vy: 0, speed: 0, directionRad: 0 };

    const { selected, isSourceProtected } = scorer.scoreAndSelect(candidates, vision, motion, false);
    expect(isSourceProtected).toBe(true);
    expect(selected.id).toBe('source_original');
  });

  it('OMS-06: Temporal Controller applies low-pass smoothing and respects velocity clamps', () => {
    const controller = new OMS_TemporalController();
    const target = {
      id: 'test',
      name: 'Test Candidate',
      panX: 0.5,
      panY: 0.2,
      scale: 1.2,
      aspectRatio: '1.43:1',
      subjectScore: 0.8,
      ruleScore: 0.8,
      motionScore: 0.5,
      subtitlePenalty: 0,
      zoomPenalty: 0,
      totalScore: 0.85,
      reason: 'Rule Test',
    };

    // First frame initializes
    const f1 = controller.smooth(target, 1.0, false);
    expect(f1.panX).toBe(0.5);

    // Sudden jump to new pan target
    const targetJump = { ...target, panX: -0.5 };
    const f2 = controller.smooth(targetJump, 1.05, false);

    // Low-pass smooth prevents instant snap to -0.5
    expect(f2.panX).toBeLessThan(0.5);
    expect(f2.panX).toBeGreaterThan(-0.5);
  });
});
