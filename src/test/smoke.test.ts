import { describe, it, expect } from 'vitest';

describe('OmniStream Environment & Core Module Smoke Test', () => {
  it('executes in JSDOM environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(document.createElement).toBeDefined();
  });

  it('instantiates Canvas and 2D context cleanly for lightweight sampling', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 9;
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeDefined();
    expect(canvas.width).toBe(16);
    expect(canvas.height).toBe(9);
  });

  it('supports Web Audio API and Canvas mocks', () => {
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    expect(osc.connect).toBeDefined();

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    expect(gl).toBeDefined();
  });
});
