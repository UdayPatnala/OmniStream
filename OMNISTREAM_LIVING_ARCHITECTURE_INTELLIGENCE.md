# OmniStream: Living Architecture Documentation & Project Intelligence

> **Source of Truth**: This document represents the living architectural memory and capability intelligence of the OmniStream platform. It is continuously maintained and synchronized with the codebase.

---

## 1. Project North Star

### 1.1 Fundamental Purpose
OmniStream is a personal media experience platform designed to solve three fundamental problems in digital media consumption:
1. **Ad-Bloat & Surveillance in Web Streaming**: Web video platforms are saturated with invasive tracking, algorithmic feed friction, and commercial interruptions.
2. **Display-Aperture Mismatch & Dire Letterboxing**: Standard screens and modern ultra-tall/widescreen displays letterbox or pillarbox cinematic media, failing to reproduce the towering immersion of formats like **1.43:1 (IMAX GT)** and **1.90:1 (Digital IMAX)**.
3. **Cloud AI Lock-In & Bloated Dependencies**: Most modern media applications depend on paid cloud APIs and heavy multi-megabyte ML runtime bundles that break offline and compromise user privacy.

### 1.2 The OmniStream Solution
OmniStream unifies two dedicated viewing engines orchestrated by **OMS (OmniStream Intelligence System)**:
- **U-TUBE**: A lightweight, clean, ad-free YouTube discovery, subscription, and watch engine with client-side keyword extraction.
- **CineMorph**: A cinematic, fixed-aperture theater experience for local and streaming media using client-side smart framing and real-time Web Audio DSP.
- **OMS**: A 100% free, local-first intelligence runtime executing on browser-native APIs (Canvas CV, Web Audio Biquad DSP, Web Workers, WASM).

### 1.3 Core Engineering Principles
1. **Meaningful Modularity**: Modules exist to isolate independent change, risk, or dependencies—never for folder decoration.
2. **Progressive Enhancement & Baseline Guarantee**: Every enhanced capability must degrade to an independent, reliable baseline with zero external dependencies.
3. **Structured Fallback over Nested Try/Catch**: Use pre-flight availability and compatibility checks with classified failure types (`UNAVAILABLE`, `INCOMPATIBLE`, `EXECUTION_TIMEOUT`, `RUNTIME_ERROR`, `CRITICAL_SYSTEM_ERROR`).
4. **Render Isolation**: Real-time ambient light and viewport transforms directly mutate DOM element refs or CSS variables (`--pan-x`, `--pan-y`, `--zoom`), generating **0 root React re-renders** during active playback.
5. **Persistence Integrity**: Movie tickets and progress timestamps are committed only upon confirmed theater entry (*"Take Ticket & Enter Theater"*). Temporary tickets are purged upon back-navigation.
6. **Evidence Over Theory**: Every architectural choice is verified against opaque-box unit, integration, journey, and adversarial test suites.

---

## 2. Master Implemented Architecture Map

```
                                      OMNISTREAM PLATFORM
                                               │
            ┌──────────────────────────────────┼──────────────────────────────────┐
            │                                  │                                  │
            ▼                                  ▼                                  ▼
   [SHARED CORE / HUB]                [CINEMORPH DOMAIN]                 [U-TUBE DOMAIN]
   ├── Storage Engine                 ├── Theater Atmosphere             ├── Dynamic Search
   │   ├── LocalStorage               │   ├── CSS3D Perspective          │   ├── Debounced Queries
   │   ├── IndexedDB Store            │   ├── Velvet Curtains            │   ├── Pagination & Token
   │   └── JSON Auto-Repair           │   └── Screen Edge Ambilight      │   └── Deduplication
   ├── Device Profiler                ├── Aperture Pan Engine            ├── Subscription Feed
   │   ├── WASM / SIMD Prober         │   ├── 1.43:1 IMAX GT             │   ├── 4-Hour Background Cache
   │   ├── WebGPU / Worker Check      │   ├── 1.90:1 Digital IMAX        │   └── Offline Persistence
   │   └── Concurrency / Memory       │   ├── 4:3 Fallback               ├── Keyword Recommender
   ├── Security & Sanitizer           │   └── Directorial Original       │   └── Client-side TF-IDF
   │   ├── XSS DOMPurify              ├── Local Media Ingest             ├── Ad-Free Player Shell
   │   └── YouTube ID Validator       │   ├── Streaming ObjectURL        │   ├── Custom Seek & Volume
   └── Telemetry Ring-Buffer          │   └── Non-RAM Buffering          │   └── Mini-Player Mode
       ├── FPS & Latency Log          ├── Ticket UX Lifecycle            └── Playlists & Collections
       └── HUD Diagnostic Canvas      │   ├── 10s Mechanical Ritual          ├── Watch Later
                                      │   ├── Progress Persistence           └── Favorites
                                      │   └── 1-Click Timestamp Resume
                                      └── Parametric Audio Studio
                                          ├── 5-Band Biquad Filters
                                          ├── Speech Clarity Boost
                                          └── Dynamic Range Compressor
            │                                  │                                  │
            └──────────────────────────────────┼──────────────────────────────────┘
                                               │
                                               ▼
                               [OMS INTELLIGENCE RUNTIME]
                               ├── Capability Resolver (Pre-flight availability & compatibility)
                               ├── Model Registry & Lifecycle (Health status, budgets, adapters)
                               ├── 13-Stage Smart Framing Pipeline (Vision, motion, candidates, scorer)
                               ├── Temporal Controller (Kalman filter & spring-damper smoothing)
                               └── Multi-Tier Fallback Engine (Tier 3 → Tier 2 → Tier 1 → Original)
```

---

## 3. Feature Map

### F-01: Fixed Aperture Smart Framing
- **Purpose**: Dynamically pans widescreen media behind fixed 1.43:1 (IMAX GT), 1.90:1 (Digital IMAX), or 4:3 viewports while keeping primary subjects centered.
- **Domain**: CineMorph
- **Status**: `STABLE` (Verified via T1-APERTURE, T1-ML, T5-STRESS)
- **Entry Point**: [`OMS_Pipeline.processFrame()`](file:///d:/PROJECT/AROH%20Open%20Source/Products/OmniStream/src/lib/cinemorph/oms/omsPipeline.ts)
- **Implementations**:
  - *Tier 3 (Advanced)*: Off-thread WASM Face/Saliency keyframe pre-scan.
  - *Tier 2 (Enhanced)*: 13-Stage Canvas 16x9 Sobel luminance center-of-mass + Rule-of-Thirds heuristics.
  - *Tier 1 (Baseline)*: Fixed Center-Aperture Crop.
  - *Safe Default*: Original Directorial Aspect Ratio (1.0x scale, no pan).
- **Fallback Order**: Tier 3 → Tier 2 → Tier 1 → Safe Default.
- **Failure Behavior**: Corrupt or NaN outputs are rejected by coordinate validators; engine falls back silently to Center Crop or Original ratio without disrupting playback.

### F-02: Parametric Web Audio DSP Studio
- **Purpose**: Solves muddy sound and drowned-out dialogue on laptop/desktop speakers via real-time equalizer filters.
- **Domain**: CineMorph
- **Status**: `STABLE` (Verified via T1-AUDIO, T5-AUD)
- **Entry Point**: [`CineMorphAudioEngine.init()`](file:///d:/PROJECT/AROH%20Open%20Source/Products/OmniStream/src/lib/cinemorph/audioEngine.ts)
- **Implementations**:
  - *Enhanced*: Web Audio API 5-Band Parametric Biquad DSP (1–3 kHz speech bell boost + 80 Hz high-pass + DRC loudness).
  - *Baseline*: Native HTML5 Audio Element output.
- **Fallback Order**: Enhanced DSP → Native Audio.
- **Failure Behavior**: Catches `NotAllowedError`, CORS audio node errors, or hardware context exhaustion silently; audio continues un-interrupted via native browser path.

### F-03: Mechanical Ticket Printer Intro & Resumption
- **Purpose**: Diegetic 10-second cinematic ticket printing ritual providing a warmup window for off-thread frame pre-scan and persistent progress resumption.
- **Domain**: CineMorph
- **Status**: `STABLE` (Verified via T1-TICKET, T5-ANIM)
- **Entry Point**: [`useTicketStore.trigger10sPrintAnimation()`](file:///d:/PROJECT/AROH%20Open%20Source/Products/OmniStream/src/state/useTicketStore.ts)
- **Implementations**: Single deterministic implementation with Web Audio mechanical chiptune sounds.
- **Fallback Behavior**: User can skip or cancel countdown; cancellation aborts immediately without unhandled promise rejections.

### F-04: Dynamic YouTube Search & 4-Hour Cached Subscriptions
- **Purpose**: Fast ad-free YouTube discovery, incremental pagination, and 4-hour background cache feed.
- **Domain**: U-Tube
- **Status**: `STABLE` (Verified via T1-SEARCH, T1-CACHE, T2-BOUNDARY)
- **Entry Point**: [`useUTubeStore.search()`](file:///d:/PROJECT/AROH%20Open%20Source/Products/OmniStream/src/state/useUTubeStore.ts)
- **Implementations**: Single stable service with client-side keyword recommendation scoring.
- **Fallback Behavior**: Empty/malformed queries return empty list; network cuts display cached subscribed feed.

---

## 4. Capability Registry

| Capability Name | Domain | Tier 3 (Advanced) | Tier 2 (Enhanced) | Tier 1 (Baseline) | Safe Default | Test Coverage |
|---|---|---|---|---|---|---|
| **Aperture Framing** | CineMorph | WASM Face Tracker | Canvas 16x9 Saliency | Center Aperture Crop | Directorial Original | 100% (28 tests) |
| **Audio Enhancement**| CineMorph | Spectral Worklet | 5-Band Biquad DSP | Native MediaElement | Native Browser Audio | 100% (14 tests) |
| **Search & Discovery**| U-Tube | Local Embeddings | TF-IDF Token Decay | Fuzzy Substring Match | Exact Query Match | 100% (22 tests) |
| **Persistence Gateway**| Core | IndexedDB Storage | LocalStorage Cache | In-Memory Ephemeral | Volatile Session | 100% (18 tests) |
| **Stream Resolution**| U-Tube | Embed Direct Stream| Next Candidate Switch| Manual URL Prompt | Error Toast + Diagnostic| 100% (12 tests) |

---

## 5. Model Registry

### Active Production Models & Engines
```
ENGINE: OMS Fast 16x9 Saliency & Gradient Tracker (oms-vision-saliency-v1)
├── Category: Vision / Saliency
├── Status: PRODUCTION / STABLE
├── Runtime: Canvas 2D CV (Sobel + Luminance COM)
├── Resource Budget: 0 KB download, 4.0 MB RAM, 1.2 ms latency (60 FPS)
├── License: MIT (AROH Open Source)
└── Fallback: Center Aperture Crop

ENGINE: OMS Web Audio 5-Band Parametric DSP (oms-audio-biquad-dsp-v2)
├── Category: Audio DSP
├── Status: PRODUCTION / STABLE
├── Runtime: Browser Native Web Audio API
├── Resource Budget: 0 KB download, 1.0 MB RAM, 0.1 ms latency
├── License: MIT (AROH Open Source)
└── Fallback: Native HTML5 Audio

ENGINE: OMS Deterministic Intent & Keyword Classifier (oms-intent-tokenizer-v1)
├── Category: NLP / Search
├── Status: PRODUCTION / STABLE
├── Runtime: Deterministic Regex Tokenizer + TF-IDF Decay
├── Resource Budget: 0 KB download, 0.5 MB RAM, 0.05 ms latency
├── License: MIT (AROH Open Source)
└── Fallback: Substring Match
```

### Evaluated Model Candidates (Pre-Scan Only)
```
MODEL: MediaPipe BlazeFace WASM (oms-face-blazeface-wasm)
├── Category: Vision (Face Landmarks)
├── Status: CANDIDATE / BENCHMARKED (Restricted to 10s Ticket Intro Pre-Scan)
├── Runtime: Browser WASM / Web Worker
├── Resource Budget: 2.1 MB download, 15.0 MB RAM, ~4.5 ms latency
├── License: Apache-2.0
├── Provenance: Google MediaPipe
└── Fallback: oms-vision-saliency-v1
```

---

## 6. Fallback & Failure Map

```
=============================================================================
CAPABILITY: SMART FRAMING & APERTURE MAPPING
=============================================================================
1. Attempt Tier 3: Off-Thread WASM Face/Saliency Pre-Scan
   ├── Success: Inject focal bounding points into temporal smoothing queue
   └── Failure Types:
       - UNAVAILABLE (WASM/GPU missing) → Skip pre-flight
       - INCOMPATIBLE (Original aspect ratio mode) → Bypass directly
       - EXECUTION_TIMEOUT (>16ms per frame) → Drop keyframe
       - RUNTIME_ERROR (Crash/NaN coords) → Output validator rejects

2. Attempt Tier 2: 13-Stage Canvas CV Saliency & Composition Scorer
   ├── Success: Render smoothed CSS3D transform
   └── Failure (Sample throttled / canvas tainted): Proceed to Tier 1

3. Attempt Tier 1: Fixed Center-Aperture Crop
   ├── Success: Render fixed scale crop (1.43 / 1.90 / 4:3)
   └── Failure (Layout error): Proceed to Safe Default

4. Safe Default: Original Directorial Aspect Ratio (1.0x uncropped)
```

---

## 7. Dependency Boundaries & Prohibited Couplings

```
┌────────────────────────────────────────────────────────────┐
│                        UI Shell Layer                      │
│                  (Pages, Modals, Bento Grid)               │
└──────────────────────────────┬─────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│       CineMorph Domain        │   │         U-Tube Domain         │
│   (Theater, Aperture, DSP)    │   │  (Search, Subs, Feed, Player) │
└───────────────┬───────────────┘   └───────────────┬───────────────┘
                │                                   │
                └─────────────────┬─────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────┐
│              OMS Intelligence System Layer                 │
│         (Capability Resolver, Model Registry, DSP)         │
└──────────────────────────────┬─────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────┐
│                     Shared Core Layer                      │
│       (Storage Gateway, Device Profiler, Security, HUD)    │
└────────────────────────────────────────────────────────────┘
```

### Prohibited Couplings (Enforced by Boundary Testing):
- `CineMorph → Direct YouTube API internal details` ❌ (Must go through Shared Core media source interface)
- `U-Tube → CineMorph 3D Theater Internal State` ❌ (Decoupled via separate Zustand stores)
- `Shared Core → UI Component Imports` ❌ (Shared Core must remain pure TypeScript)
- `Experimental Model Code → Stable Playback Pipeline` ❌ (Must go through `IModelRuntimeAdapter`)

---

## 8. Safe Change Guide

| Task | Files to Inspect | Safe Execution Checklist |
|---|---|---|
| **Add a new Aspect Ratio** | `src/lib/cinemorph/oms/candidateGenerator.ts`, `src/types.ts` | 1. Add ratio string to `AspectRatioMode`<br>2. Add candidate bounds generator<br>3. Verify in `aspect-ratios-framing.test.ts` |
| **Replace an ML Model** | `src/lib/oms/modelRegistry.ts`, `src/lib/oms/interfaces.ts` | 1. Implement `IModelRuntimeAdapter`<br>2. Register in `OMSModelRegistry`<br>3. Provide Tier 2 / Tier 1 fallback<br>4. Run `progressive-capability-failure.test.ts` |
| **Modify Audio DSP Filters**| `src/lib/cinemorph/audioEngine.ts` | 1. Modify BiquadFilterNode values<br>2. Ensure gain values clamp to non-clipping ranges<br>3. Verify in `webaudio-dsp-fallback.test.ts` |
| **Add a Shared Utility** | `src/lib/` or `src/services/` | 1. Verify utility is used by >1 domain<br>2. Verify zero UI dependencies<br>3. Add unit test suite |

---

## 9. Architectural Decision Records (ADRs)

### ADR-01: Rejection of Heavy 3D Bundles (Three.js WebGL)
- **Decision**: Replace Three.js WebGL instanced geometries with CSS3D perspective transforms, SVG aperture overlays, and 16x9 canvas sampling.
- **Reason**: Three.js added >600 KB to bundle size and suffered WebGL context loss crashes during background tab throttling. CSS3D provides equivalent visual depth with 0 KB extra bundle and 60 FPS hardware acceleration.

### ADR-02: Declarative Capability Resolver over Nested Try/Catch
- **Decision**: Build `OMSCapabilityResolver` with pre-flight availability and compatibility checks.
- **Reason**: Nested `try/catch` obscures why a model failed, hides timeouts, and creates unmaintainable callback pyramids. Declarative pre-flight checks classify failures (`UNAVAILABLE`, `INCOMPATIBLE`, `EXECUTION_TIMEOUT`, `RUNTIME_ERROR`) cleanly.

### ADR-03: Ticket Commit Integrity
- **Decision**: Persist movie tickets and resume timestamps to storage only when the user explicitly clicks *"Take Ticket & Enter Theater"*.
- **Reason**: Storing temporary tickets during preview or back-navigation caused storage pollution with unplayed movies.

### ADR-04: Deterministic Canvas CV as Primary Saliency Engine
- **Decision**: Use 16x9 Canvas Sobel Edge and luminance center-of-mass as the primary framing engine instead of a continuous TensorFlow.js model.
- **Reason**: 16x9 canvas sampling runs in **1.2ms at 60 FPS** with 0 KB download and 0 dependencies, whereas heavy models require >25MB RAM and drop frames on low-tier hardware.

---

## 10. Stability Levels

```
┌─────────────────────────────────────────────────────────────┐
│ STABLE (Production-Ready, 100% Test Pass)                   │
│ - Dual-Tier Storage Engine with JSON Auto-Repair            │
│ - 13-Stage Canvas CV Smart Framing Pipeline                 │
│ - Parametric 5-Band Web Audio DSP Studio                    │
│ - U-Tube Dynamic Search & 4-Hour Cached Subscriptions       │
│ - 10-Second Ticket Printer Intro & 1-Click Resume           │
│ - OMS Capability Resolver & Failure Classifier              │
├─────────────────────────────────────────────────────────────┤
│ DEVELOPING (Functional, Refining Feature Boundaries)        │
│ - Diagnostic HUD Telemetry Visualizer Canvas                │
│ - Device Performance Profile Adaptive Throttling           │
├─────────────────────────────────────────────────────────────┤
│ EXPERIMENTAL / CANDIDATE (In Sandbox / Benchmark Only)      │
│ - MediaPipe BlazeFace WASM (Warmup Pre-Scan only)           │
│ - AudioWorklet Spectral Voice Isolation                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Git Contribution & Branching Strategy

```
main (Production checkpoint — 100% tests passing, zero unhandled errors)
 │
 ├── domain/shared-core (Storage, device profiling, security, audio primitives)
 ├── domain/cinemorph   (Theater atmosphere, aperture geometry, local media)
 └── domain/utube       (Search discovery, subscriptions, player shell)
      │
      ├── feature/*     (Isolated feature development)
      └── experiment/*  (Risky algorithms, WASM models, research benchmarks)
```

- **Branch Rules**:
  - `main` is always buildable and verified with 47 test suites.
  - Runtime fallback logic lives strictly in application code (`OMSCapabilityResolver`), never in Git branch history.
  - Experiments in `experiment/*` require formal benchmark validation before merging.

---

## 12. Development Pre-Commit Checklist

```
[ ] 1. Understand current behavior and inspect relevant test suites.
[ ] 2. Identify capability boundary (Core, CineMorph, U-Tube, or OMS).
[ ] 3. Preserve baseline guarantee (feature must work without external AI).
[ ] 4. Enforce coordinate/data output validation (reject NaN / Infinity).
[ ] 5. Implement incrementally without breaking existing store contracts.
[ ] 6. Run full test suite: npm test (verify 47 test files, 218 tests pass).
[ ] 7. Update OMNISTREAM_LIVING_ARCHITECTURE_INTELLIGENCE.md if architecture changed.
```

---

## 13. Developer Onboarding Quick-Test (12-Point Checklist)

1. **What is OmniStream?** A personal media platform combining U-Tube (clean YouTube) and CineMorph (cinematic aperture theater) powered by OMS.
2. **What are its main domains?** `Shared Core`, `CineMorph`, `U-Tube`, and `OMS Intelligence`.
3. **Where does a new feature belong?** In `src/lib/cinemorph/` for theater features, `src/lib/` or `src/components/utube/` for YouTube, or `src/lib/oms/` for intelligence.
4. **Which features are stable?** Smart framing (1.43/1.90/4:3), 5-band audio DSP, ticket UX, search, subscriptions, dual-tier storage.
5. **Which features are experimental?** WASM BlazeFace pre-scan, AudioWorklet voice isolation.
6. **How does a capability execute?** Through `OMSCapabilityResolver` which runs pre-flight checks, executes with a watchdog budget, validates output, and handles fallbacks.
7. **What happens when an advanced implementation fails?** It drops cleanly to Tier 2 (Canvas CV), Tier 1 (Center Crop), or Safe Default (Original Ratio) without stopping playback.
8. **Which models are active?** Canvas Sobel Saliency (0 KB), Web Audio Biquad DSP (0 KB), Regex Intent Tokenizer (0 KB).
9. **How can a model be replaced?** Implement `IModelRuntimeAdapter`, register in `OMSModelRegistry`, and run `progressive-capability-failure.test.ts`.
10. **How can a feature be changed safely?** Follow the Safe Change Guide (Section 8) and preserve the baseline implementation.
11. **What dependencies should not be crossed?** CineMorph must not directly import U-Tube internals; Core must not import UI components.
12. **How should experimental work be developed?** On `experiment/*` branches with isolated adapter contracts.
