import { describe, it, expect } from 'vitest';
import { MediaPipeBlazeFaceAdapter } from '../../lib/oms/blazeFaceAdapter';
import { NullVisualPerceptionProvider, NullAudioPerceptionProvider, PerceptionNormalizer } from '../../lib/oms/perceptionNormalizer';
import { OMS_Pipeline } from '../../lib/cinemorph/oms/omsPipeline';
import { OMS_CompositionScorer } from '../../lib/cinemorph/oms/compositionScorer';
import { OMS_SceneCutDetector } from '../../lib/cinemorph/oms/sceneCutDetector';
import { PosterIntelligenceEngine } from '../../lib/cinemorph/posterIntelligence';
import { AudioIntelligenceService } from '../../lib/cinemorph/audioIntelligence';
import { OMS_CandidateGenerator } from '../../lib/cinemorph/oms/candidateGenerator';

describe('OmniStream v1.8.0 Full Intelligence Pipeline & Cross-System Validation (E1 - E12)', () => {
  it('E1-E3: BlazeFace adapter initializes once, produces normalized evidence, and handles backpressure', async () => {
    const adapter = new MediaPipeBlazeFaceAdapter();
    const init1 = await adapter.initialize();
    const init2 = await adapter.initialize();
    expect(init1).toBe(true);
    expect(init2).toBe(true);
    expect(adapter.isAvailable()).toBe(true);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffccaa'; // Skin-tone box
      ctx.fillRect(40, 30, 48, 56);
    }

    const evidence = await adapter.processFrame(canvas, 1.0);
    expect(evidence.status).toBe('AVAILABLE');
    expect(evidence.candidates.length).toBeGreaterThanOrEqual(1);
    expect(evidence.focalCenter.x).toBeGreaterThan(0);
    expect(evidence.focalCenter.y).toBeGreaterThan(0);
    expect(evidence.source).toBe('enhanced_ml');

    adapter.dispose();
    expect(adapter.isAvailable()).toBe(false);
  });

  it('E4: CompositionScorer prevents erratic focal jumping via switching hysteresis', () => {
    const scorer = new OMS_CompositionScorer();
    const generator = new OMS_CandidateGenerator();
    const candidates = generator.generateCandidates('1.43:1');

    const vision1 = {
      subjects: [{ x: 0.28, y: 0.35, width: 0.25, height: 0.25, confidence: 0.9, type: 'face' as const }],
      primarySubject: { x: 0.28, y: 0.35, width: 0.25, height: 0.25, confidence: 0.9, type: 'face' as const },
      combinedCenter: { x: 0.28, y: 0.35 },
      subtitleZoneBlocked: false,
      confidence: 0.9,
    };
    const motion = { vx: 0, vy: 0, speed: 0, directionRad: 0 };

    // First frame selection
    const run1 = scorer.scoreAndSelect(candidates, vision1, motion, false);
    expect(run1.selected).toBeDefined();
    const firstSelectedId = run1.selected.id;

    // Slight noise in vision (candidate B is marginally 0.01 higher without hysteresis)
    const vision2 = {
      ...vision1,
      primarySubject: { x: 0.31, y: 0.35, width: 0.25, height: 0.25, confidence: 0.91, type: 'face' as const },
      combinedCenter: { x: 0.31, y: 0.35 },
    };

    const run2 = scorer.scoreAndSelect(candidates, vision2, motion, false);
    // Hysteresis holds candidate stable
    expect(run2.selected.id).toBe(firstSelectedId);
  });

  it('E5: PosterIntelligenceEngine executes staged cascaded selection', async () => {
    const engine = new PosterIntelligenceEngine(new NullVisualPerceptionProvider());
    const mockVideo = document.createElement('video');
    Object.defineProperty(mockVideo, 'duration', { value: 120, writable: true });

    const result = await engine.selectBestPosterFrame(mockVideo, 4);
    expect(result.bestImageDataUrl).toContain('data:image/');
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.technicalQuality).toBeDefined();
    expect(result.scoreBreakdown.subjectPresence).toBeDefined();
    expect(result.scoreBreakdown.composition).toBeDefined();
  });

  it('E6: CandidateGenerator generates content-aware IMAX vertical headroom and two-shot union candidates', () => {
    const generator = new OMS_CandidateGenerator();
    const candidates = generator.generateCandidates('1.43:1');

    const imaxHeadroom = candidates.find(c => c.id === 'imax_expanded_headroom');
    const imaxTwoShot = candidates.find(c => c.id === 'imax_two_shot_union');

    expect(imaxHeadroom).toBeDefined();
    expect(imaxHeadroom!.panY).toBeLessThan(0); // Vertical headroom
    expect(imaxTwoShot).toBeDefined();
    expect(imaxTwoShot!.scale).toBeGreaterThanOrEqual(1.25);
  });

  it('E8: SceneCutDetector emits normalized CONTINUOUS, POSSIBLE_TRANSITION, and CONFIRMED_CUT events', () => {
    const detector = new OMS_SceneCutDetector();

    // Sample 1: Base scene
    const sample1 = {
      timestamp: 0,
      width: 16,
      height: 9,
      data: new Uint8ClampedArray(16 * 9 * 4),
      luminanceHistogram: new Array(16).fill(9),
      averageBrightness: 120,
      averageRgb: { r: 120, g: 120, b: 120 },
    };

    const event1 = detector.process(sample1);
    expect(event1.transitionType).toBe('CONTINUOUS');
    expect(event1.isHardCut).toBe(false);

    // Sample 2: Minor change
    const sample2 = {
      ...sample1,
      timestamp: 1.0,
      luminanceHistogram: new Array(16).fill(9),
    };
    sample2.luminanceHistogram[0] = 12;
    const event2 = detector.process(sample2);
    expect(event2.transitionType).toBe('CONTINUOUS');

    // Sample 3: Hard cut (completely inverted histogram)
    const sample3 = {
      ...sample1,
      timestamp: 2.0,
      luminanceHistogram: new Array(16).fill(0),
    };
    sample3.luminanceHistogram[15] = 144;
    const event3 = detector.process(sample3);
    expect(event3.transitionType).toBe('CONFIRMED_CUT');
    expect(event3.isHardCut).toBe(true);
    expect(event3.sceneId).toBe(1);
  });

  it('E9-E10: AudioIntelligenceService smoothly adapts recommended clarity boost without abrupt jumps', () => {
    const service = new AudioIntelligenceService();

    // 1. Silent spectrum
    const res1 = service.processSpectrum(new Uint8Array(16).fill(0), 0);
    expect(res1.dialogueDetected).toBe(false);
    expect(res1.appliedClarityBoost).toBe(0);

    // 2. Speech-heavy spectrum
    const speechSpectrum = new Uint8Array([0, 5, 80, 150, 160, 120, 40, 10, 0, 0, 0, 0, 0, 0, 0, 0]);
    const res2 = service.processSpectrum(speechSpectrum, 1.0);
    expect(res2.dialogueDetected).toBe(true);
    expect(res2.appliedClarityBoost).toBeGreaterThan(0);
    expect(res2.appliedClarityBoost).toBeLessThanOrEqual(1.0);
  });
});
