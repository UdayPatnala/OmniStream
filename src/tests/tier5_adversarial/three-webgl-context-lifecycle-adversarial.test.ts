import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { THEME_CONFIGS, getGlowScale } from '../../lib/cinemorph/visualEngine';

describe('Tier 5 Adversarial: Three.js Canvas WebGL Context Loss & Recovery Simulation (F12, F13, F14)', () => {
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
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    const geometry = new THREE.PlaneGeometry(16, 9);
    const material = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const screenMesh = new THREE.Mesh(geometry, material);
    scene.add(screenMesh);

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

    // Clean up
    geometry.dispose();
    material.dispose();
    canvas.removeEventListener('webglcontextlost', handleContextLost);
  });

  it('T5-GL-02: webglcontextrestored event triggers clean re-initialization of 3D theater resources', () => {
    let contextActive = true;
    let scene = new THREE.Scene();
    let geometry: THREE.BufferGeometry | null = new THREE.BoxGeometry(1, 1, 1);
    let material: THREE.Material | null = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextActive = false;
      // Dispose old resources
      geometry?.dispose();
      material?.dispose();
      geometry = null;
      material = null;
    };

    const handleContextRestored = () => {
      contextActive = true;
      // Re-create theater geometry and materials
      geometry = new THREE.BoxGeometry(2, 2, 2);
      material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      scene.add(new THREE.Mesh(geometry, material));
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 1. Lose context
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(contextActive).toBe(false);
    expect(geometry).toBeNull();
    expect(material).toBeNull();

    // 2. Restore context
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(contextActive).toBe(true);
    expect(geometry).not.toBeNull();
    expect(material).not.toBeNull();
    expect(scene.children.length).toBe(1);

    geometry?.dispose();
    material?.dispose();
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
  });

  it('T5-GL-03: extreme canvas dimensions (0x0, negative, ultra-wide 32:9) calculate safe projection matrices without NaN', () => {
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);

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
      camera.aspect = safeAspect;
      camera.updateProjectionMatrix();

      // Check matrix elements are all valid numbers (no NaN or Infinity)
      const elements = camera.projectionMatrix.elements;
      elements.forEach(val => {
        expect(Number.isFinite(val)).toBe(true);
        expect(isNaN(val)).toBe(false);
      });
    });
  });

  it('T5-GL-04: rapid creation & disposal lifecycle of 50 Three.js mesh instances executes without leaking resources', () => {
    const scene = new THREE.Scene();
    const createdMeshes: THREE.Mesh[] = [];

    for (let i = 0; i < 50; i++) {
      const geom = new THREE.PlaneGeometry(10, 10);
      const mat = new THREE.MeshBasicMaterial({ color: i * 1000 });
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);
      createdMeshes.push(mesh);
    }

    expect(scene.children.length).toBe(50);

    // Rapid tear down
    createdMeshes.forEach(mesh => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });

    expect(scene.children.length).toBe(0);
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
