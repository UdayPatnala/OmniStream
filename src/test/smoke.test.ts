import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

describe('OmniStream Environment & Core Module Smoke Test', () => {
  it('executes in JSDOM environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(document.createElement).toBeDefined();
  });

  it('instantiates Three.js 3D primitives cleanly', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    expect(scene.children.length).toBe(1);
    expect(cube.position.x).toBe(0);
    expect(camera.fov).toBe(75);
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
