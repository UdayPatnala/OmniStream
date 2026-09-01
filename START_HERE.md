# OmniStream: Project Continuity Entry Point ("START HERE")

> **Welcome to OmniStream**: This single document provides everything you need to understand, inspect, and continue developing OmniStream safely within 3 minutes.

---

## 1. What OmniStream Is
OmniStream is a personal media experience platform unifying two distinct viewing engines:
1. **U-TUBE**: A lightweight, clean, ad-free YouTube discovery, subscription, and watch engine.
2. **CineMorph**: A cinematic, fixed-aperture theater experience for local and streaming media using client-side smart framing and real-time Web Audio parametric DSP.
3. **OMS (OmniStream Intelligence System)**: A 100% free, local-first intelligence runtime executing on browser-native APIs (Canvas CV, Web Audio Biquad DSP, Web Workers, WASM).

---

## 2. Current Project Status

| Subsystem | State | Verified Details |
|---|---|---|
| **Core & Storage** | `STABLE` | Dual-tier LocalStorage + IndexedDB with JSON auto-repair |
| **CineMorph Theater** | `STABLE` | 1.43:1, 1.90:1, 4:3, Curved Original CSS3D, 5-band DSP |
| **Smart Framing Pipeline**| `STABLE` | 13-stage Canvas CV Saliency + Kalman temporal smoothing |
| **Ticket UX Ritual** | `STABLE` | 10s mechanical printing intro, 1-click timestamp resume |
| **U-Tube Discovery** | `STABLE` | Dynamic search, 4-hour cached subscriptions, token decay |
| **Capability Resolver** | `STABLE` | Declarative pre-flight checks, failure classifier, watchdog |
| **WASM BlazeFace** | `CANDIDATE` | Sandboxed for 10s warmup pre-scan only |
| **Test Matrix** | `VERIFIED` | **47 test files, 219 tests passing (100% pass rate)** |

---

## 3. Architecture & Domain Map

```
OMNISTREAM PLATFORM
│
├── Shared Core (src/services/storageService.ts, src/lib/oms/capabilityDetector.ts)
│   └── Pure TypeScript utilities, dual-tier storage, hardware capability probing.
│
├── CineMorph Domain (src/lib/cinemorph/, src/state/useCineMorphStore.ts)
│   └── 3D theater views, fixed aperture geometry, 5-band Web Audio DSP studio.
│
├── U-Tube Domain (src/components/utube/, src/state/useUTubeStore.ts)
│   └── Ad-free discovery, search debouncing, 4-hour cached subscriptions.
│
└── OMS Intelligence (src/lib/oms/)
    └── Capability resolver, model registry, 13-stage smart framing pipeline.
```

---

## 4. Invariant Rules (What NEVER to Break)
1. **Zero Heavy 3D / TensorFlow Bundles**: Use CSS3D transforms, SVG aperture masks, and 16x9 Canvas sampling over Three.js / TF.js.
2. **Render Isolation**: Real-time ambient analysis and pan/scale transforms must mutate DOM element refs or CSS variables (`--pan-x`, `--pan-y`, `--zoom`) directly. Never trigger high-frequency React state updates in playback loops.
3. **Ticket Commit Integrity**: Movie tickets are persisted only when the user clicks *"Take Ticket & Enter Theater"*.
4. **Baseline Guarantee**: Every enhanced feature must degrade gracefully to a zero-dependency baseline (Center Crop / Native Audio) without stopping playback.
5. **No Cross-Domain Leakage**: CineMorph must not directly import U-Tube internals; Core must not import UI components.

---

## 5. Essential Commands

```bash
# Run full 5-tier test suite (47 suites, 219 tests)
npm test

# Run type checking
npx tsc --noEmit

# Start development server
npm run dev

# Production build
npm run build
```

---

## 6. Where to Look for Deep Documentation
- 📖 **Living Architecture & Feature Map**: [`OMNISTREAM_LIVING_ARCHITECTURE_INTELLIGENCE.md`](./OMNISTREAM_LIVING_ARCHITECTURE_INTELLIGENCE.md)
- 📖 **Release & Quality Gates**: [`OMNISTREAM_RELEASE_AND_QUALITY_GATES_PROTOCOL.md`](./OMNISTREAM_RELEASE_AND_QUALITY_GATES_PROTOCOL.md)
- 📖 **Master Release Record**: [`RELEASE_RECORD.md`](./RELEASE_RECORD.md)
- 📖 **Core Constitution**: [`GEMINI.md`](./GEMINI.md)
