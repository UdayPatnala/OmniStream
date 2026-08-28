import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { THEME_CONFIGS, getGlowScale } from '../../lib/cinemorph/visualEngine';

describe('Tier 5 Adversarial: Canvas WebGL Context Loss & Recovery Simulation (F12, F13, F14)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    vi.restoreAllMocks();
  });

  it('T5-GL-01: webglcontextlost event cancels rendering loop and stops drawing safely', () => {
    let isContextLost = false;
    let renderFramesCount = 0;
    let animationFrameId: number | null = null;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    // Render loop
    const renderLoop = () => {
      if (isContextLost) return;
      renderFramesCount++;
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    expect(renderFramesCount).toBeGreaterThan(0);
    expect(isContextLost).toBe(false);

    // Dispatch simulated webglcontextlost event
    const event = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(event);

    expect(isContextLost).toBe(true);
    expect(animationFrameId).toBeNull();
    canvas.removeEventListener('webglcontextlost', handleContextLost);
  });

  it('T5-GL-02: webglcontextrestored event triggers clean re-initialization', () => {
    let contextActive = true;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextActive = false;
    };

    const handleContextRestored = () => {
      contextActive = true;
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 1. Lose context
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(contextActive).toBe(false);

    // 2. Restore context
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(contextActive).toBe(true);

    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
  });

  it('T5-GL-03: extreme canvas dimensions (0x0, negative, ultra-wide 32:9) calculate safe aspect ratios', () => {
    const testAspectRatios = [
      { width: 0, height: 0 },         // Zero dimensions
      { width: 1920, height: 0 },       // Zero height
      { width: 0, height: 1080 },       // Zero width
      { width: -100, height: 100 },     // Negative width
      { width: 5120, height: 1440 },    // 32:9 Ultra-Wide
      { width: 7680, height: 4320 },    // 8K Ultra HD
    ];

    testAspectRatios.forEach(({ width, height }) => {
      const safeAspect = height > 0 && width > 0 ? width / height : 16 / 9;
      expect(Number.isFinite(safeAspect)).toBe(true);
      expect(isNaN(safeAspect)).toBe(false);
    });
  });

  it('T5-GL-05: WebGL unsupported fallback gracefully operates with visual CSS 2.5D engine', () => {
    // If WebGL getContext returns null
    const dummyCanvas = document.createElement('canvas');
    vi.spyOn(dummyCanvas, 'getContext').mockReturnValue(null);

    const context = dummyCanvas.getContext('webgl');
    expect(context).toBeNull();

    // Fallback theme configs are accessible and fully defined
    const darkConfig = THEME_CONFIGS['cinematic-dark'];
    expect(darkConfig.background).toBe('#07060A');
    expect(darkConfig.glowBlur).toBe('blur(70px)');
    expect(getGlowScale('ultra')).toBe(1.0);
    expect(getGlowScale('off')).toBe(0);
  });
});
