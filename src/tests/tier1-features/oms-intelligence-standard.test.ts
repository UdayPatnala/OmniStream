import { describe, it, expect } from 'vitest';
import {
  OMS_VISION,
  OMS_DETECT,
  OMS_TRACK,
  OMS_SCENE,
  OMS_COMPOSE,
  OMS_GUARD,
  OMS_CACHE,
} from '../../lib/services/omsStandard';

describe('Tier 1: OMS Intelligence Architecture Standard', () => {
  it('OMS_CACHE: stores and retrieves cached payloads with TTL', () => {
    OMS_CACHE.set('test_key', { test: true }, 5000);
    const retrieved = OMS_CACHE.get<{ test: boolean }>('test_key');
    expect(retrieved).toBeDefined();
    expect(retrieved?.test).toBe(true);

    // Missing key returns null
    expect(OMS_CACHE.get('non_existent')).toBeNull();
  });

  it('OMS_VISION: analyzeFrame extracts valid brightness and dominant color', () => {
    const analysis = OMS_VISION.analyzeFrame(null);
    expect(analysis).toBeDefined();
    expect(typeof analysis.brightness).toBe('number');
    expect(typeof analysis.dominantColor).toBe('string');
    expect(analysis.aspectRatio).toBeGreaterThan(0);
  });

  it('OMS_DETECT: detectSubjects returns structured candidate detection', () => {
    const detection = OMS_DETECT.detectSubjects(null);
    expect(detection).toBeDefined();
    expect(Array.isArray(detection.faces)).toBe(true);
    expect(Array.isArray(detection.objects)).toBe(true);
  });

  it('OMS_TRACK: temporal tracking smooths coordinates within bounds [-1, 1]', () => {
    const prevTrack = {
      trackedSubjectId: 'sub_1',
      targetOffset: { x: 0.2, y: -0.1 },
      velocity: { x: 0, y: 0 },
      lostFramesCount: 0,
      confidence: 0.9,
    };

    const newDetection = {
      faces: [],
      objects: [],
      primarySubject: { x: 0.8, y: 0.4, width: 0.2, height: 0.2, confidence: 0.9 },
      confidence: 0.9,
    };

    const nextTrack = OMS_TRACK.track(prevTrack, newDetection);
    expect(nextTrack.targetOffset.x).toBeGreaterThanOrEqual(-1);
    expect(nextTrack.targetOffset.x).toBeLessThanOrEqual(1);
    expect(nextTrack.targetOffset.y).toBeGreaterThanOrEqual(-1);
    expect(nextTrack.targetOffset.y).toBeLessThanOrEqual(1);
  });

  it('OMS_SCENE: detectCut correctly flags hard shot transitions on high delta', () => {
    const cut = OMS_SCENE.detectCut(0.1, 0.9);
    expect(cut.isHardCut).toBe(true);
    expect(cut.cutConfidence).toBeGreaterThanOrEqual(0.8);

    const smooth = OMS_SCENE.detectCut(0.4, 0.45);
    expect(smooth.isHardCut).toBe(false);
  });

  it('OMS_COMPOSE & OMS_GUARD: evaluateFraming respects subtitle boundary & safe fallback', () => {
    const track = {
      trackedSubjectId: 'sub_1',
      targetOffset: { x: 0.3, y: 0.6 },
      velocity: { x: 0, y: 0 },
      lostFramesCount: 0,
      confidence: 0.95,
    };

    // With subtitles active, targetPanY must be protected from bottom obstruction
    const framingWithSubs = OMS_COMPOSE.evaluateFraming(track, '1.90:1', true);
    expect(framingWithSubs.subtitleProtected).toBe(true);
    expect(framingWithSubs.targetPanY).toBeLessThanOrEqual(0);

    const fallback = OMS_GUARD.safeFallbackDecision();
    expect(fallback.appliedTier).toBe('original');
    expect(fallback.targetPanX).toBe(0);
    expect(fallback.targetPanY).toBe(0);
  });
});
