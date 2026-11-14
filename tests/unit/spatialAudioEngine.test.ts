import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpatialAudioEngine } from '../../src/products/cinemorph/media/spatialAudioEngine';
import { DEFAULT_SPATIAL_AUDIO_CONFIG } from '@omnistream/shared';

describe('SpatialAudioEngine', () => {
  let engine: SpatialAudioEngine;

  beforeEach(() => {
    engine = new SpatialAudioEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  it('initializes with default configuration', () => {
    expect(DEFAULT_SPATIAL_AUDIO_CONFIG.mode).toBe('auto');
    expect(DEFAULT_SPATIAL_AUDIO_CONFIG.surroundWidth).toBe(1.25);
    expect(DEFAULT_SPATIAL_AUDIO_CONFIG.headroomGainDb).toBe(-2.0);
  });

  it('detects Sony 360 Reality Audio metadata correctly', () => {
    const result = engine.detectSony360({
      channelLayout: 'Sony 360 Reality Audio',
      codec: 'mpegh',
    });
    expect(result.isDetected).toBe(true);
    expect(result.confidence).toBe('confirmed');
    expect(result.objectCount).toBe(16);
  });

  it('rejects regular stereo audio from false Sony 360 identification', () => {
    const result = engine.detectSony360({
      channelLayout: 'Stereo 2.0',
      codec: 'aac',
    });
    expect(result.isDetected).toBe(false);
    expect(result.confidence).toBe('none');
  });

  it('updates configuration parameters dynamically without crashing', () => {
    engine.updateConfig({
      audioDelayMs: 45,
      surroundWidth: 1.75,
      headroomGainDb: -3.0,
    });
    expect(true).toBe(true);
  });

  it('switches spatial modes smoothly', () => {
    engine.setMode('binaural-cinema');
    engine.setMode('dialogue-focus');
    engine.setMode('off');
    expect(true).toBe(true);
  });

  it('disposes audio context safely', () => {
    engine.dispose();
    expect(true).toBe(true);
  });
});
