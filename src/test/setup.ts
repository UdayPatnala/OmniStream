import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// 0. Mock MemoryStorage for localStorage and sessionStorage
class MemoryStorage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string): string | null { return this.store[key] ?? null; }
  key(index: number): string | null { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string): void { delete this.store[key]; }
  setItem(key: string, value: string): void { this.store[key] = String(value); }
}

export const mockLocalStorage = new MemoryStorage();
export const mockSessionStorage = new MemoryStorage();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true });

// Cleanup React tree after every test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();
});

// 1. Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 2. Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = MockResizeObserver as any;
(globalThis as any).ResizeObserver = MockResizeObserver as any;

// 3. Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;
(globalThis as any).IntersectionObserver = MockIntersectionObserver as any;

// 4. Mock HTMLMediaElement (Video / Audio playback methods)
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockImplementation(() => Promise.resolve()),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: vi.fn(),
});

// 5. Mock URL.createObjectURL & URL.revokeObjectURL
if (typeof window.URL.createObjectURL === 'undefined' || !window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-stream-url-' + Math.random().toString(36).substring(2, 8));
}
if (typeof window.URL.revokeObjectURL === 'undefined' || !window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = vi.fn();
}

// 6. Mock HTMLCanvasElement 2D & WebGL contexts for Three.js & TF.js
const mockCanvas2dContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16 * 9 * 4).fill(120), width: 16, height: 9 })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
};

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return mockCanvas2dContext as any;
  }
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return {
      getExtension: vi.fn(),
      getParameter: vi.fn(() => 'Mock WebGL Vendor'),
      createTexture: vi.fn(),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(),
      viewport: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      createProgram: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      useProgram: vi.fn(),
    } as any;
  }
  return null;
}) as any;

// 7. Mock Web Audio API AudioContext for ticket printer sound effects
class MockAudioNode {
  connect() { return this; }
  disconnect() {}
}

class MockBiquadFilterNode extends MockAudioNode {
  type = 'lowshelf';
  frequency = { value: 150 };
  Q = { value: 1.0 };
  gain = { value: 0 };
}

class MockDynamicsCompressorNode extends MockAudioNode {
  threshold = { value: -24 };
  knee = { value: 30 };
  ratio = { value: 12 };
  attack = { value: 0.003 };
  release = { value: 0.25 };
}

class MockStereoPannerNode extends MockAudioNode {
  pan = { value: 0 };
}

class MockAnalyserNode extends MockAudioNode {
  fftSize = 64;
  frequencyBinCount = 32;
  getByteFrequencyData(array: Uint8Array) {
    array.fill(128);
  }
}

class MockAudioContext {
  currentTime = 0;
  state = 'running';
  destination = new MockAudioNode();
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    type: 'sine',
  }));
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  }));
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createDynamicsCompressor() { return new MockDynamicsCompressorNode(); }
  createStereoPanner() { return new MockStereoPannerNode(); }
  createAnalyser() { return new MockAnalyserNode(); }
  createMediaElementSource() { return new MockAudioNode(); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close = vi.fn().mockResolvedValue(undefined);
}

(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;
