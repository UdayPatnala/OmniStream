# OmniStream M1: Package Dependencies & Test Runner Architecture Plan

**Author**: Explorer 1 (Milestone 1)  
**Target Milestone**: Milestone 1 (Core Foundation & Bento Landing Page) & Project-wide Test Infrastructure  
**Date**: 2026-08-23  

---

## 1. Executive Summary

OmniStream requires a resilient, modern test runner and runtime foundation supporting:
1. **React 19 + TypeScript + Tailwind CSS v4** front-end shell.
2. **Three.js** 3D WebGL theater rendering (CineMorph).
3. **TensorFlow.js** client-side real-time ML frame analysis & Advanced Framing Geometry.
4. **Vitest + JSDOM + Testing Library** opaque-box automated test harness verifying all functional tiers without requiring real browser or display server dependencies.

This plan details the exact package matrix, exact file diffs and full replacement code for `package.json`, `vite.config.ts`, `tsconfig.json`, `src/test/setup.ts`, and initial foundation test suites.

---

## 2. Package Dependency Matrix

### 2.1 Runtime Dependencies (`dependencies`)

| Package | Recommended Version | Purpose / Rationale |
|---|---|---|
| `three` | `^0.174.0` | Powers CineMorph 3D Theater: WebGL renderer, curved screen mesh, instanced theater seating, dynamic velvet curtains, and ambilight lighting. |
| `@tensorflow/tfjs` | `^4.22.0` | Powers Advanced Framing Geometry: real-time client-side frame detection, face/saliency analysis, and rule-based panning telemetry. |
| `react` | `^19.0.1` | *(Existing)* Core UI rendering engine. |
| `react-dom` | `^19.0.1` | *(Existing)* React DOM binding. |
| `react-router-dom` | `^7.18.1` | *(Existing)* Multi-view routing (`/`, `/cinemorph`, `/watch/:id`, `/theater/:id`, `/search`). |
| `zustand` | `^5.0.14` | *(Existing)* Centralized reactive state stores (`useAppStore`, `useUTubeStore`, `useCineMorphStore`, `useTicketStore`). |
| `lucide-react` | `^0.546.0` | *(Existing)* High-contrast iconography for Bento cards, video controls, HUD, and theater props. |
| `motion` | `^12.23.24` | *(Existing)* Fluid physics-based animations (Bento hover, ticket printing, drawer transitions). |
| `clsx` | `^2.1.1` | *(Existing)* Conditional CSS class composition. |
| `tailwind-merge` | `^3.6.0` | *(Existing)* Conflict-free Tailwind class resolution. |
| `tailwindcss` | `^4.1.14` | *(Existing)* Utility CSS engine. |
| `@tailwindcss/vite` | `^4.1.14` | *(Existing)* Vite integration for Tailwind v4. |
| `date-fns` | `^4.4.0` | *(Existing)* Timestamp formatting for ticket printing and video publish times. |
| `react-player` | `^3.4.0` | *(Existing)* Video playback controller for YouTube streams. |
| `express` | `^4.21.2` | *(Existing)* SSR / Static server host. |
| `dotenv` | `^17.2.3` | *(Existing)* Environment variable loader. |

### 2.2 Developer & Test Dependencies (`devDependencies`)

| Package | Recommended Version | Purpose / Rationale |
|---|---|---|
| `vitest` | `^3.0.7` | Blazing-fast Vite-native test runner with built-in ESM, TypeScript, and watch support. |
| `jsdom` | `^26.0.0` | Headless DOM implementation simulating browser window, document, and events in Node.js. |
| `@testing-library/react` | `^16.2.0` | User-centric React component testing utilities (React 19 compatible). |
| `@testing-library/jest-dom` | `^6.6.3` | Custom DOM element matchers (`toBeInTheDocument`, `toHaveClass`, `toBeVisible`). |
| `@testing-library/user-event` | `^14.6.1` | Realistic browser event dispatcher (clicks, typing, keyboard navigation). |
| `@types/three` | `^0.174.0` | Full TypeScript definitions for Three.js geometry, materials, scene graph, and math. |
| `@types/node` | `^22.14.0` | *(Existing)* Node.js environment typings. |
| `@types/express` | `^4.17.21` | *(Existing)* Express server typings. |
| `tsx` | `^4.21.0` | *(Existing)* TypeScript execute runner for local server. |
| `typescript` | `~5.8.2` | *(Existing)* TypeScript compiler. |
| `vite` | `^6.2.3` | *(Existing)* Next-gen frontend tooling. |
| `esbuild` | `^0.25.0` | *(Existing)* Bundler for server runtime. |
| `autoprefixer` | `^10.4.21` | *(Existing)* CSS prefixer. |

---

## 3. Concrete Installation Commands

Worker should execute the following installation commands from the workspace root:

```bash
# 1. Install Three.js and TensorFlow.js runtime dependencies
npm install three @tensorflow/tfjs

# 2. Install Vitest, Testing Library, JSDOM, and Three.js typings
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/three
```

---

## 4. Configuration Updates

### 4.1 `package.json` Updates

#### Scripts to add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

#### Full Proposed `package.json`:
```json
{
  "name": "omnistream",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "render-build": "npm install && npm run build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "start": "tsx server.ts",
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@tensorflow/tfjs": "^4.22.0",
    "autoprefixer": "^10.4.21",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-player": "^3.4.0",
    "react-router-dom": "^7.18.1",
    "tailwind-merge": "^3.6.0",
    "tailwindcss": "^4.1.14",
    "three": "^0.174.0",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@types/three": "^0.174.0",
    "@vitejs/plugin-react": "^5.0.4",
    "esbuild": "^0.25.0",
    "jsdom": "^26.0.0",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3",
    "vitest": "^3.0.7"
  }
}
```

---

### 4.2 `vite.config.ts` Updates

Add `/// <reference types="vitest" />` at top, configure `test` block with `globals: true`, `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, and configure Rollup chunking for `three` to keep bundle size optimized.

#### Full Proposed `vite.config.ts`:
```typescript
/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        reporter: ['text', 'json', 'html'],
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['motion'],
            'vendor-icons': ['lucide-react'],
            'vendor-state': ['zustand', 'clsx', 'tailwind-merge'],
            'vendor-three': ['three'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

---

### 4.3 `tsconfig.json` Updates

Add `"types": ["vitest/globals", "@testing-library/jest-dom"]` so all test files have full type-hinting and zero false-positive diagnostics without needing boilerplate imports.

#### Full Proposed `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": [
      "vitest/globals",
      "@testing-library/jest-dom"
    ]
  },
  "include": [
    "src",
    "tests",
    "vite.config.ts"
  ]
}
```

---

## 5. Test Harness Environment Setup

### 5.1 `src/test/setup.ts`

This file provides comprehensive browser API shims for JSDOM so tests involving HTML5 Video, HTML5 Canvas, WebGL, Web Audio API, `matchMedia`, `ResizeObserver`, and `IntersectionObserver` run seamlessly without native compilation requirements.

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup React tree after every test
afterEach(() => {
  cleanup();
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

// 3. Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;

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
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-stream-url');
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
  window.URL.revokeObjectURL = vi.fn();
}

// 6. Mock HTMLCanvasElement 2D & WebGL contexts for Three.js & TF.js
HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
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
    } as any;
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
class MockAudioContext {
  currentTime = 0;
  destination = {};
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
  close = vi.fn().mockResolvedValue(undefined);
}
window.AudioContext = MockAudioContext as any;
(window as any).webkitAudioContext = MockAudioContext as any;
```

---

## 6. Smoke & Verification Tests

### 6.1 `src/test/smoke.test.ts`
Verifies runtime environment, Vitest execution, and Three.js / TF.js import viability.

```typescript
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
```

---

## 7. Downstream Task Checklist for Worker

1. **Step 1**: Run `npm install three @tensorflow/tfjs`
2. **Step 2**: Run `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/three`
3. **Step 3**: Update `package.json` with scripts (`test`, `test:watch`, `test:coverage`).
4. **Step 4**: Update `vite.config.ts` with the Vitest block and Rollup manual chunks.
5. **Step 5**: Update `tsconfig.json` with `"types": ["vitest/globals", "@testing-library/jest-dom"]`.
6. **Step 6**: Create `src/test/setup.ts`.
7. **Step 7**: Create `src/test/smoke.test.ts`.
8. **Step 8**: Run `npm run test` and `npm run lint` to verify 100% green test execution.
