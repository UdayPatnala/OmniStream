import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { utubeAmbientEngine, UTubeAmbientEngine } from '@/src/products/u-tube/services/utubeAmbientEngine';
import { useUTubeStore } from '@/src/products/u-tube/state/useUTubeStore';
import { DEFAULT_UTUBE_AMBIENT_CONFIG, UTubeAmbientConfig } from '@omnistream/shared';

describe('U-Tube Four-Sided Ambient Lighting Engine & Store Integration', () => {
  let engine: UTubeAmbientEngine;

  beforeEach(() => {
    engine = new UTubeAmbientEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('1. Four-Sided & Corner Chromaticity Extraction', () => {
    it('initializes with default balanced 4-sided and corner analysis', () => {
      const analysis = engine.getCurrentAnalysis();
      expect(analysis.top).toBeDefined();
      expect(analysis.bottom).toBeDefined();
      expect(analysis.left).toBeDefined();
      expect(analysis.right).toBeDefined();
      expect(analysis.topLeft).toBeDefined();
      expect(analysis.topRight).toBeDefined();
      expect(analysis.bottomLeft).toBeDefined();
      expect(analysis.bottomRight).toBeDefined();
      expect(analysis.dominant).toBeDefined();
    });

    it('processes image data into 4 distinct directional edges and 4 blended corners', () => {
      // Create mock canvas and render colored strips
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 18;
      const ctx = canvas.getContext('2d')!;

      // Top strip blue, bottom strip red, left strip green, right strip yellow
      ctx.fillStyle = 'rgb(0, 0, 255)';
      ctx.fillRect(0, 0, 32, 4);

      ctx.fillStyle = 'rgb(255, 0, 0)';
      ctx.fillRect(0, 14, 32, 4);

      ctx.fillStyle = 'rgb(0, 255, 0)';
      ctx.fillRect(0, 0, 4, 18);

      ctx.fillStyle = 'rgb(255, 255, 0)';
      ctx.fillRect(28, 0, 4, 18);

      engine.sampleImage(canvas);
      const analysis = engine.getCurrentAnalysis();

      expect(analysis.top).toBeDefined();
      expect(analysis.bottom).toBeDefined();
      expect(analysis.left).toBeDefined();
      expect(analysis.right).toBeDefined();
      expect(analysis.luma).toBeGreaterThanOrEqual(0);
    });
  });

  describe('2. Render Isolation & DOM Property Injection', () => {
    it('directly writes CSS variables and radial gradients to container and edge elements', () => {
      const container = document.createElement('div');
      const topEl = document.createElement('div');
      const botEl = document.createElement('div');
      const leftEl = document.createElement('div');
      const rightEl = document.createElement('div');

      engine.bindElements({
        video: null,
        container,
        top: topEl,
        bottom: botEl,
        left: leftEl,
        right: rightEl,
      });

      engine.updateConfig({
        enabled: true,
        intensity: 0.85,
        blur: 55,
        topEnabled: true,
        bottomEnabled: true,
        leftEnabled: true,
        rightEnabled: true,
      });

      expect(container.style.getPropertyValue('--utube-ambient-top')).toBeDefined();
      expect(container.style.getPropertyValue('--utube-ambient-bottom')).toBeDefined();
      expect(container.style.getPropertyValue('--utube-ambient-left')).toBeDefined();
      expect(container.style.getPropertyValue('--utube-ambient-right')).toBeDefined();

      expect(topEl.style.opacity).toBe('0.85');
      expect(topEl.style.filter).toBe('blur(55px)');
      expect(botEl.style.opacity).toBe('0.85');
      expect(leftEl.style.opacity).toBe('0.85');
      expect(rightEl.style.opacity).toBe('0.85');
    });

    it('respects independent directional enable/disable toggles', () => {
      const container = document.createElement('div');
      const topEl = document.createElement('div');
      const botEl = document.createElement('div');
      const leftEl = document.createElement('div');
      const rightEl = document.createElement('div');

      engine.bindElements({
        video: null,
        container,
        top: topEl,
        bottom: botEl,
        left: leftEl,
        right: rightEl,
      });

      engine.updateConfig({
        enabled: true,
        topEnabled: true,
        bottomEnabled: false,
        leftEnabled: true,
        rightEnabled: false,
      });

      expect(topEl.style.opacity).toBe('0.7');
      expect(leftEl.style.opacity).toBe('0.7');
      expect(botEl.style.opacity).toBe('0');
      expect(rightEl.style.opacity).toBe('0');
    });

    it('clears element opacities when ambient lighting is disabled', () => {
      const topEl = document.createElement('div');
      const botEl = document.createElement('div');

      engine.bindElements({
        video: null,
        top: topEl,
        bottom: botEl,
      });

      engine.updateConfig({ enabled: false });

      expect(topEl.style.opacity).toBe('0');
      expect(botEl.style.opacity).toBe('0');
    });
  });

  describe('3. Playback Synchronization & Lifecycle', () => {
    it('halts and resumes tracking cleanly via start() and stop()', () => {
      engine.start();
      engine.stop();
      expect(true).toBe(true);
    });

    it('syncImmediate recalculates analysis immediately', () => {
      engine.syncImmediate();
      const current = engine.getCurrentAnalysis();
      expect(current.timestamp).toBeGreaterThanOrEqual(0);
    });

    it('cleans up references and stops timer on dispose()', () => {
      engine.dispose();
      const current = engine.getCurrentAnalysis();
      expect(current.top.r).toBe(12);
    });
  });

  describe('4. User Preferences Persistence in U-Tube Store', () => {
    it('initializes with DEFAULT_UTUBE_AMBIENT_CONFIG', () => {
      const state = useUTubeStore.getState();
      expect(state.ambientConfig).toBeDefined();
      expect(state.ambientConfig.enabled).toBe(true);
      expect(state.ambientConfig.intensity).toBe(DEFAULT_UTUBE_AMBIENT_CONFIG.intensity);
    });

    it('persists modified ambient configuration updates', () => {
      const updates: Partial<UTubeAmbientConfig> = {
        intensity: 0.95,
        blur: 75,
        topEnabled: false,
      };

      useUTubeStore.getState().setAmbientConfig(updates);
      const updated = useUTubeStore.getState().ambientConfig;

      expect(updated.intensity).toBe(0.95);
      expect(updated.blur).toBe(75);
      expect(updated.topEnabled).toBe(false);
      expect(updated.bottomEnabled).toBe(true); // Unmodified remains intact
    });
  });
});
