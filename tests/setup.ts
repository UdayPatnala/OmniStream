import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';

const storageMap = new Map<string, string>();
const sessionStorageMap = new Map<string, string>();

export const mockLocalStorage = {
  getItem: vi.fn((key: string) => storageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { storageMap.set(key, String(value)); }),
  removeItem: vi.fn((key: string) => { storageMap.delete(key); }),
  clear: vi.fn(() => { storageMap.clear(); }),
  key: vi.fn((idx: number) => Array.from(storageMap.keys())[idx] ?? null),
  get length() { return storageMap.size; }
};

export const mockSessionStorage = {
  getItem: vi.fn((key: string) => sessionStorageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { sessionStorageMap.set(key, String(value)); }),
  removeItem: vi.fn((key: string) => { sessionStorageMap.delete(key); }),
  clear: vi.fn(() => { sessionStorageMap.clear(); }),
  key: vi.fn((idx: number) => Array.from(sessionStorageMap.keys())[idx] ?? null),
  get length() { return sessionStorageMap.size; }
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true });


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

class MockPannerNode extends MockAudioNode {
  panningModel = 'HRTF';
  distanceModel = 'inverse';
  positionX = { value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  positionY = { value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  positionZ = { value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  orientationX = { value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  orientationY = { value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  orientationZ = { value: -1, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
  refDistance = 1;
  maxDistance = 10000;
  rolloffFactor = 1;
  coneInnerAngle = 360;
  coneOuterAngle = 360;
  coneOuterGain = 0;
  setPosition(x: number, y: number, z: number) {
    this.positionX.value = x;
    this.positionY.value = y;
    this.positionZ.value = z;
  }
  setOrientation(x: number, y: number, z: number) {
    this.orientationX.value = x;
    this.orientationY.value = y;
    this.orientationZ.value = z;
  }
}

class MockDelayNode extends MockAudioNode {
  delayTime = { value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
}

class MockChannelSplitterNode extends MockAudioNode {
  numberOfOutputs = 6;
}

class MockChannelMergerNode extends MockAudioNode {
  numberOfInputs = 6;
}

class MockAnalyserNode extends MockAudioNode {
  fftSize = 64;
  frequencyBinCount = 32;
  getByteFrequencyData(array: Uint8Array) {
    array.fill(128);
  }
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = new MockAudioNode();
  listener = {
    positionX: { value: 0 },
    positionY: { value: 0 },
    positionZ: { value: 0 },
    forwardX: { value: 0 },
    forwardY: { value: 0 },
    forwardZ: { value: -1 },
    upX: { value: 0 },
    upY: { value: 1 },
    upZ: { value: 0 },
    setPosition: vi.fn(),
    setOrientation: vi.fn(),
  };
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createDynamicsCompressor() { return new MockDynamicsCompressorNode(); }
  createStereoPanner() { return new MockStereoPannerNode(); }
  createPanner() { return new MockPannerNode(); }
  createDelay() { return new MockDelayNode(); }
  createChannelSplitter(numberOfOutputs = 6) {
    const node = new MockChannelSplitterNode();
    node.numberOfOutputs = numberOfOutputs;
    return node;
  }
  createChannelMerger(numberOfInputs = 6) {
    const node = new MockChannelMergerNode();
    node.numberOfInputs = numberOfInputs;
    return node;
  }
  createAnalyser() { return new MockAnalyserNode(); }
  createMediaElementSource() { return new MockAudioNode(); }
  createOscillator() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: {
        value: 440,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      type: 'sine',
    };
  }
  createGain() { return new MockGainNode(); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}

(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;

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

(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

(globalThis as any).IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockCanvasContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(16 * 9 * 4).fill(120),
    width: 16,
    height: 9,
  })),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement, contextId: string) {
  if (contextId === '2d') {
    return mockCanvasContext as any;
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

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.load = vi.fn();

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:http://localhost/' + Math.random().toString(36).substring(2, 9));
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

import { useAppStore } from '@/src/store';

beforeEach(() => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  useAppStore.setState({
    subscriptions: [],
    history: {},
    localMediaHistory: {},
    activeLocalMedia: null,
    searchHistory: [],
    searchMetadata: {},
    collections: [],
    queue: [],
    behaviorEvents: [],
    activeVideo: null,
    miniPlayerMode: false,
    frameAspectRatio: '16:9',
    reframeMode: 'center',
    cinemorphTheme: 'cinematic-dark',
    glowIntensity: 'ultra',
    theaterSeatingEnabled: true,
    curtainAnimationEnabled: false,
    cinemaMode: false,
    ambientGlow: true,
    audioEQ: {
      preset: 'dialogue-boost',
      bassBoost: 4,
      dialogueClarity: 8,
      trebleShine: 3,
      surround3D: true,
      drcLoudness: true,
    },
    savedClips: [],
    recoveryMessage: null,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
