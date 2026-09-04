import { describe, it, expect } from 'vitest';
import {
  PerceptionNormalizer,
  NullVisualPerceptionProvider,
  NullAudioPerceptionProvider,
} from '../../lib/oms/perceptionNormalizer';

describe('Tier 1: E1 Perception Contracts, Geometry Normalization & Fallbacks', () => {
  it('E1-VIS-01: NullVisualPerceptionProvider produces clean safe fallback without throwing', async () => {
    const provider = new NullVisualPerceptionProvider();
    expect(provider.isAvailable()).toBe(true);

    const initResult = await provider.initialize();
    expect(initResult).toBe(true);

    const mockCanvas = document.createElement('canvas');
    const evidence = await provider.processFrame(mockCanvas, 10.5);

    expect(evidence.status).toBe('NO_SUBJECTS');
    expect(evidence.candidates.length).toBe(0);
    expect(evidence.primarySubject).toBeNull();
    expect(evidence.focalCenter).toEqual({ x: 0.5, y: 0.5 });
    expect(evidence.source).toBe('safe_fallback');
  });

  it('E1-VIS-02: PerceptionNormalizer rejects NaN, Infinity, negative sizes and clamps bounding boxes', () => {
    const rawCorrupt = [
      { id: 'bad1', box: { x: NaN, y: 0.2, width: 0.3, height: 0.3 }, confidence: 0.9 },
      { id: 'bad2', box: { x: 0.2, y: Infinity, width: 0.3, height: 0.3 }, confidence: 0.9 },
      { id: 'bad3', box: { x: 0.2, y: 0.2, width: -0.5, height: 0.3 }, confidence: 0.9 },
      { id: 'bad4', box: { x: 0.2, y: 0.2, width: 0.3, height: 0 }, confidence: 0.9 },
      {
        id: 'valid1',
        box: { x: -0.1, y: 1.2, width: 0.8, height: 0.5 },
        confidence: 1.5,
        type: 'face' as const,
      },
    ];

    const result = PerceptionNormalizer.normalizeVisual(rawCorrupt, 1.0, 3.5, 'enhanced_ml');
    expect(result.status).toBe('AVAILABLE');
    expect(result.candidates.length).toBe(1);

    const primary = result.primarySubject!;
    expect(primary.id).toBe('valid1');
    expect(primary.box.x).toBe(0); // Clamped from -0.1
    expect(primary.box.y).toBe(1); // Clamped from 1.2
    expect(primary.box.width).toBeLessThanOrEqual(1.0);
    expect(primary.confidence).toBe(1.0); // Clamped from 1.5
    expect(result.focalCenter.x).toBeGreaterThanOrEqual(0);
    expect(result.focalCenter.x).toBeLessThanOrEqual(1);
  });

  it('E1-AUD-01: NullAudioPerceptionProvider produces bounded acoustic evidence on spectrum input', async () => {
    const provider = new NullAudioPerceptionProvider();
    expect(provider.isAvailable()).toBe(true);

    const spectrum = new Uint8Array([0, 10, 80, 120, 140, 130, 90, 40, 10, 5, 0, 0, 0, 0, 0, 0]);
    const evidence = provider.analyze(spectrum, 5.0);

    expect(evidence.status).toBe('AVAILABLE');
    expect(evidence.dialogue.speechLikelihood).toBeGreaterThan(0);
    expect(evidence.dialogue.speechLikelihood).toBeLessThanOrEqual(1);
    expect(evidence.recommendedClarityBoost).toBeGreaterThanOrEqual(0);
    expect(evidence.recommendedClarityBoost).toBeLessThanOrEqual(1);
    expect(evidence.source).toBe('safe_fallback');
  });

  it('E1-AUD-02: PerceptionNormalizer handles empty or zero audio spectrum cleanly as NO_SIGNAL', () => {
    const emptySpectrum = new Uint8Array(0);
    const result = PerceptionNormalizer.normalizeAudio(emptySpectrum, 0);

    expect(result.status).toBe('NO_SIGNAL');
    expect(result.dialogue.speechLikelihood).toBe(0);
    expect(result.dialogue.energyDb).toBe(-100);
    expect(result.acousticEnvironment).toBe('silent');
    expect(result.recommendedClarityBoost).toBe(0);
  });
});
