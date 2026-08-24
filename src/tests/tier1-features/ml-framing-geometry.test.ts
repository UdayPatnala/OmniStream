import { describe, it, expect, beforeEach } from 'vitest';
import { MockFramingEngine } from '../helpers/contracts';
import { localVideoAnalyzer } from '../../lib/cinemorph/localVideoAnalyzer';
import { telemetryEngine } from '../../lib/cinemorph/telemetryEngine';

describe('Tier 1: Client-Side ML Framing Calculations (F23, F24, F25, F26, F27, F28, F30)', () => {
  let engine: MockFramingEngine;

  beforeEach(async () => {
    engine = new MockFramingEngine();
    await engine.init();
    localVideoAnalyzer.reset();
  });

  it('T1-ML-01: Rule of Thirds mode calculates target focal points aligned to 1/3 grid lines', () => {
    engine.setRule('rule_of_thirds');
    const telemetry = engine.processFrame();

    expect(telemetry.activeRule).toBe('rule_of_thirds');
    expect(telemetry.targetX).toBe(0.33);
    expect(telemetry.targetY).toBe(0.33);
    expect(telemetry.confidence).toBeGreaterThan(0.9);
  });

  it('T1-ML-02: Leading Lines mode detects converging vectors and aligns composition center', () => {
    engine.setRule('leading_lines');
    const telemetry = engine.processFrame();

    expect(telemetry.activeRule).toBe('leading_lines');
    expect(telemetry.leadingLines).toBeDefined();
    expect(telemetry.leadingLines.length).toBeGreaterThanOrEqual(2);
    expect(telemetry.leadingLines[0].x2).toBe(0.5);
  });

  it('T1-ML-03: Frame-in-Frame mode calculates nested sub-frame aperture centering', () => {
    engine.setRule('frame_in_frame');
    const telemetry = engine.processFrame();

    expect(telemetry.activeRule).toBe('frame_in_frame');
    expect(telemetry.targetX).toBe(0.0);
    expect(telemetry.targetY).toBe(0.0);
  });

  it('T1-ML-04: Screen Direction mode computes nose-room / gaze vector lead panning offset', () => {
    engine.setRule('screen_direction');
    const telemetry = engine.processFrame();

    expect(telemetry.activeRule).toBe('screen_direction');
    expect(telemetry.gazeVector).toBeDefined();
    expect(telemetry.targetX).toBeGreaterThan(0);
  });

  it('T1-ML-05: localVideoAnalyzer extracts dominant colors and saliency center X', () => {
    const mockVideoEl = document.createElement('video');
    Object.defineProperty(mockVideoEl, 'readyState', { value: 4 });
    Object.defineProperty(mockVideoEl, 'videoWidth', { value: 1920 });
    Object.defineProperty(mockVideoEl, 'videoHeight', { value: 1080 });

    const analysis = localVideoAnalyzer.analyzeVideoFrame(mockVideoEl, 'cache_key_1');
    expect(analysis).not.toBeNull();
    expect(analysis?.dominantColor).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
    expect(typeof analysis?.saliencyCenterX).toBe('number');
  });

  it('T1-ML-06: telemetryEngine outputs real-time performance HUD metrics', () => {
    const stats = telemetryEngine.getStats(true, true);
    expect(stats.fps).toBeGreaterThan(0);
    expect(stats.fps).toBeLessThanOrEqual(60);
    expect(stats.cpuLoadPercent).toBeGreaterThanOrEqual(0);
    expect(stats.memoryMb).toBeGreaterThan(0);
    expect(stats.webglActive).toBe(true);
    expect(stats.audioDspLatencyMs).toBe(2.4);
  });
});
