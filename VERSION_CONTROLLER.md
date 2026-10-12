# VERSION CONTROLLER & CHANGE GOVERNANCE MASTER

> **Document Classification**: Authoritative Universal Version Control & Governance Master File  
> **Repository**: `https://github.com/UdayPatnala/OmniStream.git`  
> **Workspace**: `UdayPatnala/OmniStream`  
> **Author & Architect**: Patnala Uday Kumar (UdayPatnala)  
> **Authoritative Current Version**: `1.09.13.1` (Format: `A.BC.DE.F`)  
> **Current Status**: `VERIFIED` (84 test suites, 526/526 tests passing, 0 TypeScript errors, clean production bundle)  
> **Operating Directive**: This document is the single authoritative source of truth for **what changed, when it changed, and how OmniStream is governed over time**. It records all releases, milestones, bug fixes, test benchmarks, and the A.BC.DE.F governance standard.

## Current Version

`1.09.13.1`

## Current Status

VERIFIED

---


## 1. Authoritative Version Format & Governance Invariant

OmniStream strictly enforces the **Universal Version Controller + Change Governance System**:

### 1.1 The `A.BC.DE.F` Standard
Version numbers follow the strict 4-part hierarchical schema:

$$\text{Version} = A . BC . DE . F$$

- **`A` = Major Version ($0 - \infty$)**: Fundamental architectural overhaul, whole-system rewrite, or epochal paradigm shift.
- **`BC` = Sub-Version / Release Line ($01 - 99$, $00$ reserved for major reset)**: Stable architectural milestone, major capability addition, or cross-cutting subsystem launch.
- **`DE` = Functional Change ($01 - 99$, $00$ reserved for reset)**: Feature addition, component implementation, subsystem enhancement, or new workflow.
- **`F` = Minor Fix / Bug / Patch ($0 - 9$)**: Local bug fix, visual refinement, edge-case patch, or maintenance cleanup.

### 1.2 Progression, Overflow & Reset Rules
Higher-level advancements unconditionally reset all lower-level counters:
- **Major Advance ($A+1$)**: `A+1.00.00.0` (all sub-versions, functional changes, and patches reset). **Mandatory Rule**: Major version advances (`A`) require **explicit user consent** and can NEVER be created autonomously.
- **Sub-Version Advance ($BC+1$)**: `A.BC+1.00.0` (functional changes and patches reset). **Authority**: Partial authority (recommend/align before executing).
- **Functional Advance ($DE+1$)**: `A.BC.DE+1.0` (patch counter resets to 0). **Authority**: Full autonomous authority.
- **Patch Advance ($F+1$)**: `A.BC.DE.F+1`. When $F$ reaches 9, overflow increments functional version: $DE+1.0$. **Authority**: Full autonomous authority.

### 1.3 Synchronization Invariant
The version string must be synchronized across four authoritative touchpoints simultaneously:
1. `VERSION_CONTROLLER.md` (Current Version header)
2. `package.json` (`"version": "1.09.13.1"`)
3. `src/core/config/version.ts` (`export const APP_VERSION = '1.09.13.1'`)
4. Automated test `tests/unit/version.test.ts` validates this consistency on every test run.

---

## 2. Current Version & Release Status

### Current Version
`1.09.13.1`

### Current Status
`VERIFIED`

### Verification Summary
- **Unit & Integration Tests**: 84 test suites, 526 tests passing (100% pass rate in Vitest).
- **TypeScript Static Analysis**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Production Build**: `npm run build` (Vite 6.4.3 + esbuild server bundle) passes cleanly.
- **Architecture Boundaries**: OPCA boundary tests pass with 0 cross-capsule import violations.
- **Spatial Benchmark**: GeometrySolver mean `2.1 µs`, Full Pipeline mean `6.5 µs` (0.039% of 16.67ms 60fps budget), 0 invariant violations across 10,000 iterations.


---

## 3. Master Chronological Version History Table

| Version | Previous | Level | Commit | Summary & Impact | Status |
|---|---|---|---|---|:---:|
| **1.09.13.1** | 1.09.13.0 | PATCH | `PENDING` | Fullscreen Seat Clearance, Flush Proscenium Border Polygon & Deep MP4/MKV Track Sanitization: added fullscreen bottom clearance (`mb-6 sm:mb-8`) and compacted auditorium seat strip (`<26px`) so seats never overlap the screen in fullscreen or windowed modes; replaced top/bottom border-clipping polygon offsets and trapezoidal `rotateX` tilt with flush full-bounds polygon (`0%..100%`) so screen borders remain intact on all 4 sides; passed `cleanMediaName` into `parseMoovBox`/`parseTrakBox`/`parseMatroskaTrackEntry`, filtered muxer handler boilerplate, fixed UTF-8 separator encoding, and reactive-bound `loadedVideoDims` on `<video>` metadata load. | `VERIFIED` |
| **1.09.13.0** | 1.09.12.0 | FUNCTIONAL | `02628bd` | CineMorph Proscenium Subtle Curve, Sightline Clearance Guarantee (Zero Seat Overlap), Real Media Track Extraction & Universal Audio/Video Ingest: softened screen proscenium corner rounding to subtle 2px (`rounded-sm`), refined aperture edge curve (<0.15%), guaranteed sightline buffer ($y_{\text{screen\_bottom}} \le y_{\text{seat\_top}} - \text{buffer}$), maximized screen viewport to 98vh/99vw when seating is toggled off, derived real media titles from filenames and codecs (eliminating fake demo stream strings), expanded media ingestion to accept all high-fidelity audio formats (FLAC, MP3, WAV, AAC, M4A, OGG, OPUS, ALAC, AIFF) and video containers, executed OMS-SBH empirical benchmark (10,000 iterations, 0 violations, 2.1 µs solver), 84 test suites (526 tests) passing cleanly. | `VERIFIED` |
| **1.09.12.0** | 1.09.11.0 | FUNCTIONAL | `PENDING` | CineMorph Ambient Mode Phase V1 (CSS Variable Edge Glow & 16-point Canvas Downsampler): standalone `AmbientLightEngine` with 4-quadrant edge downsampling (top, bottom, left, right, dominant), photic safety EMA low-pass filtering, scene cut detection, direct DOM CSS variable injection (`--ambient-top`, `--ambient-bottom`, `--ambient-left`, `--ambient-right`, `--ambient-dominant`, `--ambient-luma`, `--ambient-opacity`), zero React re-renders, 84 test suites (526 tests) passing, clean production bundle, zero client video uploads. | `VERIFIED` |
| **1.09.11.0** | 1.09.10.0 | FUNCTIONAL | `PENDING` | CineMorph Subtitle & Caption System (Track Discovery -> Multi-Format Parsing -> Binary Search Lookup -> Screen Geometry Anchoring -> Accessible Presentation): native WebVTT/SRT/ASS parsers, sub-microsecond O(log n) binary search cue lookup, SDH sound effect preservation, RTL auto-direction, external subtitle file upload, font size scaling, 83 test suites (515 tests) passing, clean production bundle, zero client video uploads. | `VERIFIED` |
| **1.09.10.0** | 1.09.09.0 | FUNCTIONAL | `PENDING` | CineMorph Media-Track Architecture, Audio/Video Selection, Player Controls, and Future Ambient Mode Roadmap: formal decoupled media playback pipeline (`MediaCapabilityDetector`, Canonical `TrackModel`, Deterministic `TrackSelector`), ARIA-accessible `TrackSelectionMenu` popover, `CineMorphPlayerControls` bottom transport bar, 80 test suites (482 tests) passing, clean production bundle, zero client video uploads. | `VERIFIED` |
| **1.09.09.0** | 1.09.08.1 | FUNCTIONAL | `PENDING` | CineMorph Viewport Scene State Machine formalization: codified authoritative 6-space state machine (`arrival_lobby` -> `booking_office` -> `media_ingest` -> `ticket_printing` -> `admission_decision` -> `personal_screening_room` -> `theater_entry`) in `src/products/cinemorph/spatial/scenes/`, dynamic Morning Alabaster (`#E8E2D7`) vs Night Obsidian (`#070809`) spatial camera parameters, reactive `useCineMorphScene` hook, wired `CineMorphLanding.tsx` and `CineMorphNav.tsx`, canonicalized `tests/tier1-features/oms-sbh-geometry.test.ts` to `@omnistream/cinemorph/spatial`, and created dedicated 18-test unit suite (`tests/unit/cinemorphSceneStateMachine.test.ts`). | `VERIFIED` |
| **1.09.08.1** | 1.09.08.0 | PATCH | `PENDING` | CineMorph Spatial Model integration & test suite: wired `CineMorphTheater.tsx` directly to canonical `cineMorphSpatialEngine.computeSpatialState`, canonicalized spatial benchmark imports, established dedicated 7-test unit suite (`tests/unit/cinemorphSpatialEngine.test.ts`) validating coordinates, sightline clearance, proscenium containment, spring dynamics, recovery, and DOM rendering. Spatial benchmark: `2.1 µs` solver, `7.9 µs` full pipeline (0.060% of 16.67ms frame budget). | `VERIFIED` |
| **1.09.08.0** | 1.09.07.0 | FUNCTIONAL | `PENDING` | Complete OPCA migration & legacy ghost directory purge: eliminated `src/components/` (22 files), `src/pages/` (11 files), `src/lib/` (~60 files), `src/services/` (3 files), `src/state/` (3 files), `src/config/` (2 files). Promoted `errorRecoveryManager` to `@omnistream/core/oms`. Decoupled shell and store imports directly to product capsules. Clean `src/` layout (5 canonical directories: app, core, products, shared, shell). | `VERIFIED` |
| **1.09.07.0** | 1.09.06.1 | FUNCTIONAL | `PENDING` | CineMorph Spatial Model formalization (`spatial/` submodules as domain-driven re-export + alias layer over SBH), test suite consolidation to root `tests/`, modular `App.tsx` root with lazy routes, store singleton unification, core OMS transition service unification. Spatial benchmark: `2.1 µs` solver, `6.9 µs` full pipeline (0.048% of 16.67ms frame budget). | `VERIFIED` |

---

## 4. Detailed Release History & Milestone Logs

### Release v1.09.13.1 (Current)
- **Date**: 2026-10-12
- **Type**: `PATCH` (Fullscreen Seat Clearance, Flush Proscenium Border Polygon & Deep MP4/MKV Track Sanitization)
- **Summary**:
  - **Fullscreen & Windowed Seat Clearance**: Added `mb-6 sm:mb-8` bottom screen clearance when `isFullscreen && theaterSeatingEnabled` and reduced `CineMorphAuditoriumSeats` vertical footprint to `<26px` (`h-3 sm:h-3.5 md:h-4`), eliminating the remaining fullscreen `justify-center` overlap where `absolute bottom-0` seats touched the bottom of the screen.
  - **Flush Proscenium Border Polygon & Zero Trapezoid Tilt**: Updated `apertureClipCurve` in `geometrySolver.ts` to a full-bounds `0%..100%` polygon and set `perspectiveTransform = 'none'` in `domRendererAdapter.ts`, preventing top/bottom 1px CSS borders from being clipped off while preserving crisp `rounded-sm` (2px) edges.
  - **Deep MP4/MKV Demuxer Track Naming & Live `<video>` Metadata Sync**: Passed `cleanMediaName` into `parseMoovBox`, `parseTrakBox`, and `parseMatroskaTrackEntry`, filtered muxer handler boilerplate (`SoundHandler`, `VideoHandler`, `GPAC`, `ISO Media`), fixed UTF-8 bullet encoding, and bound `loadedVideoDims` on `onLoadedMetadata` so real video dimensions and authentic track titles always populate the studio track drawer.

### Release v1.09.13.0
- **Date**: 2026-10-10
- **Type**: `FUNCTIONAL` (CineMorph Proscenium Subtle Curve, Sightline Clearance Guarantee, Real Track Extraction & Universal Audio/Video Ingest)
- **Summary**:
  - **Screen Proscenium Subtle Edge Curve**: Softened the proscenium screen corner radius from aggressive `rounded-2xl` (16px) to subtle, clean `rounded-sm` (2px). Softened aperture clip curve from deep >1% polygon to minimal $<0.15\%$ organic edge curve, preserving 100% of the active video canvas while eliminating harsh pixel aliasing.
  - **Sightline Clearance Guarantee & Maximum Viewport**: Resolved seat occlusion bug. When cinema seating is visible, constrained `maxHeight` dynamically and adjusted seat height classes (`h-4 sm:h-5 md:h-6`), mathematically ensuring the bottom of the screen remains strictly above the auditorium headrests ($y_{\text{screen\_bottom}} \le y_{\text{seat\_top}} - \text{buffer}$). When seating is disabled, reclaimed full viewport real estate ($98\text{vh}$ / $99\text{vw}$) without distortion.
  - **Original Media Track Metadata Extraction**: Eliminated fake demo placeholder strings (`"Audio Stream #1 (Direct Source)"`, `"Video Stream #1 (Direct Source)"`). Derived genuine track labels from media filenames, language tags, channel layouts (`5.1 Surround`, `Stereo 2.0`), and detected codecs.
  - **Universal Audio & Video Ingest**: Upgraded `mediaValidator.ts` and `CineMorphLanding.tsx` to support all major high-fidelity audio formats (`FLAC`, `MP3`, `WAV`, `AAC`, `M4A`, `OGG`, `OPUS`, `ALAC`, `AIFF`) alongside video containers, enabling CineMorph to serve as an ultra-high-fidelity mastering and theater audio session suite.
  - **OMS-SBH Model Benchmark Execution**: Ran empirical benchmark suite (`scripts/benchmark_oms_sbh.ts`) over 10,000 iterations: Mean solver latency `2.1 µs`, validator `0.19 µs`, full pipeline `6.5 µs` (<1.5% of 60fps frame budget), with 0 invariant violations across all 10,000 runs.
  - **Verification**: All 84 test suites (526 tests) passing cleanly, 0 TypeScript errors, clean production bundle.

### Release v1.09.12.0
- **Date**: 2026-10-10
- **Type**: `FUNCTIONAL` (CineMorph Ambient Mode Phase V1: CSS Variable Edge Glow & 16-point Canvas Downsampler)
- **Summary**:
  - Implemented standalone `AmbientLightEngine` (`src/products/cinemorph/media/ambientLightEngine.ts`) with 4-quadrant edge downsampling from a 16x9 canvas grid (144 pixels per frame).
  - Isolated top row, bottom row, left column, right column, and center dominant chromaticity with ITU-R BT.601 perceptual luminance weighting.
  - Built photic safety low-pass filter using critically damped Exponential Moving Average (EMA) smoothing ($\alpha = 0.15$) to prevent strobe or seizure triggers.
  - Implemented adaptive scene cut detection on large RGB shifts ($|\Delta| > 160$), temporarily boosting $\alpha = 0.85$ for instant 1-frame adaptation without perceptual lag.
  - Strict Render Isolation: directly injects CSS variables (`--ambient-top`, `--ambient-bottom`, `--ambient-left`, `--ambient-right`, `--ambient-dominant`, `--ambient-luma`, `--ambient-opacity`) into target DOM element, resulting in zero React re-renders during active video playback.
  - Upgraded proscenium ambient bloom element in `CineMorphTheater.tsx` to composite multi-directional edge gradients with smooth opacity dimmer transitions.
  - Created shared contracts in `src/shared/contracts/ambientContracts.ts` upholding OPCA Rule 4.
  - Established dedicated unit test suite `tests/unit/ambientLightEngine.test.ts` (11/11 tests passing); total test matrix expanded to 84 test suites, 526 tests (100% passing).

### Release v1.09.11.0
- **Date**: 2026-10-04
- **Type**: `FUNCTIONAL` (CineMorph Subtitle & Caption System Architecture, Multi-Format Parsers, Sub-Microsecond Binary Lookup, Accessible Screen Geometry Anchoring)
- **Summary**:
  - Implemented decoupled, first-class subtitle subsystem: Subtitle Source -> Track Discovery -> Canonical Track Model -> Multi-Format Parsing -> Canonical Cue Model -> $O(\log n)$ Binary Search Lookup -> Media Clock Sync -> Screen Geometry Anchoring -> Accessible Presentation.
  - Multi-format parser engine (`src/products/cinemorph/media/subtitleParser.ts`) supporting WebVTT (`.vtt`), SubRip (`.srt`), and Advanced SubStation Alpha (`.ass` / `.ssa`) with automatic format sniffing and fault-tolerant cue recovery.
  - Canonical cue model (`src/products/cinemorph/media/subtitleCueModel.ts`) with high-performance binary search (`findActiveCues(cues, currentTime)`) executing in $< 2\,\mu\text{s}$, supporting concurrent and overlapping cues.
  - Speaker identification and SDH sound effect extraction (`[music playing]`, `(thunder rumbling)`) rendered in accessible theatrical italic typography.
  - Bidirectional text handling with automatic RTL script detection (Arabic, Hebrew, Persian, Urdu) using Unicode codepoints (`dir="rtl"`).
  - Runtime typography and font scaling model (`src/products/cinemorph/media/subtitleStyleModel.ts` and `src/shared/contracts/subtitleContracts.ts`) with user-customizable text sizing (`small`, `medium`, `large`).
  - Seamless external subtitle file ingestion (`.srt`, `.vtt`, `.ass`) directly from local device with immediate media clock binding and 100% client-side privacy.
  - ARIA-accessible proscenium subtitle overlay (`src/shared/ui/CaptionOverlay.tsx`) anchored strictly within the cinema proscenium aperture container, respecting aspect ratio letterboxing and fullscreen transitions.
  - Added 3 new comprehensive test suites (`tests/unit/subtitleParser.test.ts`, `tests/unit/subtitleCueLookup.test.ts`, `tests/unit/subtitleIntegration.test.ts`) covering 33 new unit and integration tests; total test matrix expanded to 83 test suites, 515 tests (100% passing).

### Release v1.09.10.0
- **Date**: 2026-10-04
- **Type**: `FUNCTIONAL` (CineMorph Media-Track Architecture, Audio/Video Selection, Player Controls, Future Ambient Mode Specification)
- **Summary**:
  - Implemented decoupled client-side `MediaCapabilityDetector` distinguishing containers (`.mp4`, `.webm`, `.mkv`, `.mov`, `.avi`, `.flv`) from codecs (H.264, HEVC, VP9, AV1, AAC, Opus, Vorbis, FLAC, AC-3, PCM) with browser probing and safe JSDOM fallback.
  - Codified canonical `TrackModel` (`VideoTrack`, `AudioTrack`, `TextTrack`, `MediaTrackSet`, `MediaSelectionState`, `MediaLoadState`, `MediaPlaybackError`).
  - Built deterministic `TrackSelector` preserving playback timecodes, play/pause state, and fullscreen across track switches while cleanly synchronizing with `audioEngine` and `CineMorphCaptionController`.
  - Created keyboard and screen-reader accessible `TrackSelectionMenu` (ARIA radiogroups for Audio, Subtitles, and Video) and integrated it into `CineMorphPlayerControls` and `CineMorphTheater.tsx`.
  - Preserved 100% local-first privacy: local media files are never uploaded to remote servers.
  - Codified the Future Ambient Mode Architectural Roadmap across four distinct phases (V1 CSS edge sampling to V4 hardware lighting bridges).
  - Created 2 new test suites (`tests/unit/mediaCapabilityDetector.test.ts` and `tests/unit/trackModelAndSelector.test.ts`) bringing total coverage to 80 suites, 482 tests (100% passing).

### Release v1.09.09.0
- **Date**: 2026-10-04
- **Type**: `FUNCTIONAL` (CineMorph Viewport Scene State Machine, Dual Day/Night Camera Environment)
- **Summary**:
  - Codified authoritative 6-space CineMorph state machine (`arrival_lobby` -> `booking_office` -> `media_ingest` -> `ticket_printing` -> `admission_decision` -> `personal_screening_room` -> `theater_entry`).
  - Integrated dynamic camera matrices, zoom scale, proscenium depth, and lighting for Morning Alabaster (`#E8E2D7`) vs Night Obsidian (`#070809`).
  - Created `useCineMorphScene` reactive hook and validated via 18 unit tests in `tests/unit/cinemorphSceneStateMachine.test.ts`.

### Release v1.09.08.1
- **Date**: 2026-09-30
- **Type**: `PATCH` (CineMorph Spatial Model Integration, Dedicated Test Suite, Benchmark Canonicalization)
- **Summary**:
  - Wired `src/products/cinemorph/pages/CineMorphTheater.tsx` directly to the canonical CineMorph Spatial Model via `import { cineMorphSpatialEngine } from '../spatial'`, retiring the last direct internal `../sbh` import in product runtime code.
  - Updated memoized theater layout computation to invoke `cineMorphSpatialEngine.computeSpatialState()`.
  - Created a dedicated unit test suite: `tests/unit/cinemorphSpatialEngine.test.ts` (7 tests) validating coordinate bounds across all 3 apertures, sightline non-overlap, proscenium containment, spring motion dynamics, 5-tier escalation recovery, and DOM CSS adapter output.
  - Canonicalized spatial microsecond benchmark (`tests/benchmarks/oms_sbh_benchmark.ts`) to consume all engine submodules from `@omnistream/cinemorph/spatial`.
  - Updated spatialEngine alias so `omsSBHHarmonizer` correctly references `cineMorphSpatialEngine`.
  - Spatial benchmark results: GeometrySolver median $2.1\,\mu\text{s}$, Full Pipeline median $7.9\,\mu\text{s}$ (consuming only $0.060\%$ of the $16.67\text{ ms}$ 60fps frame budget).
  - Verified: 77 test suites, 448/448 tests passing (100% pass rate), 0 TypeScript errors, clean production bundle.

### Release v1.09.08.0
- **Date**: 2026-09-30
- **Type**: `FUNCTIONAL` (Legacy Ghost Directory Elimination, Full OPCA Migration, Core Error Recovery Promotion)
- **Summary**:
  - Eliminated all six legacy ghost directories from `src/`: `src/components/` (22 files), `src/pages/` (11 files), `src/lib/` (~60 files), `src/services/` (3 files), `src/state/` (3 files), `src/config/` (2 files).
  - Reduced `src/` topology to five clean, human-engineered directories: `src/app/`, `src/core/`, `src/products/`, `src/shared/`, `src/shell/`.
  - Promoted `errorRecoveryManager` to `@omnistream/core/oms/errorRecoveryManager` as a unified singleton across both viewing engines (Theater A and Theater B), eliminating cross-capsule import coupling.
  - Decoupled `src/store.ts` and `src/shell/` components (`ModeCard`, `TicketDrawer`, `GlobalSettingsDrawer`, `Layout`, `Sidebar`) to consume directly from product capsule barrels (`@omnistream/cinemorph`, `@omnistream/utube`) and core config (`@omnistream/core/config/version`).
  - Updated `tests/tier2-boundaries/theater-orientation-advisory.test.ts` to assert orientation advisory accessibility on the canonical `src/products/cinemorph/pages/CineMorphTheater.tsx`.
  - Verified: 76 test suites, 441/441 tests passing (100% pass rate), 0 TypeScript errors, clean production bundle.

### Release v1.09.07.0
- **Date**: 2026-09-27
- **Type**: `FUNCTIONAL` (CineMorph Spatial Model Formalization, Test Suite Consolidation, App Root Modularization, Store Unification)
- **Summary**:
  - Formalized the **CineMorph Spatial Model** via the `src/products/cinemorph/spatial/` submodule layer — a domain-driven, re-export and alias architecture sitting cleanly over the verified SBH internals (`geometrySolver`, `geometryValidator`, `temporalSmoother`, `transitionEngine`, `domRendererAdapter`, `failureRules`, `generationContract`). New exports: `CineMorphSpatialEngine`, `cineMorphSpatialEngine`, `CineMorphSpringMotion`, `CineMorphTransitionEngine`, `CineMorphDOMRenderer`, `cineMorphRecoveryManager`, `cineMorphGenerationManager`, `solveCineMorphGeometry`, `validateCineMorphGeometry`, plus backward-compat alias `omsSBHHarmonizer`.
  - `CineMorphSpatialEngine` extends `OMSSBHHarmonizer` and adds `computeSpatialState()` — a forward-compatible entry point for future native spatial intelligence without breaking existing `harmonize()` call sites.
  - Consolidated all test files into canonical root `tests/` directory (was split across `src/test/` and `src/tests/`). Updated 69 test import paths to canonical `@omnistream/*` aliases. Deleted legacy `src/test/` and `src/tests/` directories.
  - Rebuilt modular application root: `src/app/App.tsx` replaces legacy `src/App.tsx`. All routes are lazy-loaded. `RootRouter`, `TicketPrinterAnimation`, `RouteFallback`, and background feed refresh on mount are defined at the app root level.
  - Unified Zustand store singletons: `src/state/useTicketStore.ts`, `src/state/useCineMorphStore.ts`, `src/state/useUTubeStore.ts` all now re-export from their canonical product capsule stores, eliminating duplicate store instantiation risk.
  - Unified OMS Transition Service: `src/core/oms/omsTransitionService.ts` merged with `src/services/omsTransitionService.ts` into a single authoritative service. Import boundaries respect OPCA Rule 3 (core must not import from product capsules — uses relative `../../store` and `../../types`).
  - Updated `vitest.config.ts`, `vite.config.ts`, `tsconfig.json` to recognize canonical `tests/` root and `@tests/*` alias.
  - Spatial benchmark (re-verified): GeometrySolver median $2.1\,\mu\text{s}$, Full Pipeline median $6.9\,\mu\text{s}$ (consuming only $0.048\%$ of the $16.67\text{ ms}$ 60fps frame budget).
  - Verified: 76 test suites, 441/441 tests passing, 0 TypeScript errors, clean production bundle.

### Release v1.09.06.1
- **Date**: 2026-09-26
- **Type**: `PATCH` (Two-File Documentation Consolidation Policy, Screen Shade Removal, Safe Legacy Pruning, Backend Hardening)
- **Summary**:
  - Implemented the mandatory Two-File Documentation Policy consolidating all documentation into `OMNISTREAM.md` and `VERSION_CONTROLLER.md`.
  - Promoted genuine OMS-SBH spatial behavior model implementations into `src/products/cinemorph/sbh/` (`geometrySolver.ts`, `geometryValidator.ts`, `sbhHarmonizer.ts`, `temporalSmoother.ts`, `transitionEngine.ts`, `domRendererAdapter.ts`, `failureRules.ts`, `generationContract.ts`).
  - Executed 10,000-iteration microsecond benchmark suite (`tests/benchmarks/oms_sbh_benchmark.ts`): Solver $3.8\,\mu\text{s}$, Validator $0.2\,\mu\text{s}$, Smoother $0.6\,\mu\text{s}$, Transition $2.4\,\mu\text{s}$, DOM Adapter $0.1\,\mu\text{s}$, Full Pipeline $5.9\,\mu\text{s}$ (consuming only $0.041\%$ of the $16.67\text{ ms}$ 60fps frame budget; over 2,400× faster than a single frame).
  - Built interactive Generative UI spatial behavior model visualizer and inspector (`oms_sbh_model_visualizer.html`) with real-time aperture switching, seat recession animation, and live invariant telemetry (I1–I12).
  - Removed 40px inner shadow cavity overlay (`shadow-[inset_0_0_40px_rgba(0,0,0,0.88),inset_0_4px_14px_rgba(0,0,0,0.95)]`) from the cinema proscenium, delivering a crystal-clear screen projection.
  - Safely pruned redundant legacy files (`.agents/`, `v1/`, `records.txt`, `docs/archive/`, `VERSION-CONTROL.md`, `src/app/`) after confirming zero active dependencies.
  - Hardened backend service (`server.ts`): SSRF protection on `/api/oembed`, query length clamping on search/suggest, bounded timeouts with `AbortSignal.timeout()`, structured error codes, and graceful shutdown.
  - Formulated runtime-independent shared contracts in `src/shared/contracts/` (`geometryContracts.ts`, `apiContracts.ts`).
  - Verified 100% test pass rate across all 76 test suites (441 tests), 0 TypeScript compiler errors (`tsc --noEmit`), and clean production bundle.

### Release v1.09.06.0
- **Date**: 2026-09-26
- **Type**: `FUNCTIONAL` (OMS-SBH Presentation Model & Pure Geometry Engine)
- **Summary**:
  - Built **OMS-SBH (OmniStream Spatial Behavior & Harmonization)** model.
  - Implemented pure deterministic $O(1)$ spatial solver (`solveOMSGeometry`) computing normalized $[0, 1] \times [0, 1]$ coordinates.
  - Enforced strict containment ($\text{VisibleProjection} \subseteq \text{Aperture} \subseteq \text{Screen} \subseteq \text{Theater}$) and absolute seat clearance ($\text{VisibleProjection} \cap \text{SeatRegion} = \emptyset$).
  - Built 5-tier escalation recovery hierarchy (`LEVEL_0` to `LEVEL_4`).
  - Established unified generation and freshness contract rejecting stale async inferences.
  - Added 23 unit tests in `src/tests/tier1-features/oms-sbh-geometry.test.ts`.

### Release v1.09.05.0
- **Date**: 2026-09-25
- **Type**: `FUNCTIONAL` (CineMorph Production Auditorium & Systematic Seating Rebuild)
- **Summary**:
  - Engineered `CineMorphAuditoriumSeats` with systematic VIP recliners, vertical channel stitching, radial fan perspective ($\pm 3.2^\circ$), and floor runway lights.
  - Built unified spatial transition engine: seats recede downward (`translateY(120%) opacity-0`) over 600ms while screen claims maximum safe viewport.
  - OMS-SBA proscenium aperture depth with specular rim and authentic curved perspective.

### Release v1.09.04.1
- **Date**: 2026-09-21
- **Type**: `PATCH` (CineMorph & U-Tube Stability)
- **Summary**:
  - Resolved out-of-order video category race conditions in U-Tube discovery.
  - Fixed media parser interval timer leak during cancellation.
  - Corrected YouTube iframe player state handling for error code pauses.

### Release v1.09.04.0
- **Date**: 2026-09-21
- **Type**: `FUNCTIONAL` (Sightline Clearance & Unified Subtitles)
- **Summary**:
  - Resolved OMS Original selection state tracking in CineMorph Theater.
  - Constrained theater screen height to `min(82vh-84vh, calc(100dvh - 5.5rem))` to guarantee sightline clearance.
  - Unified closed captioning engine across local and streaming sources.

### Release v1.09.03.0
- **Date**: 2026-09-20
- **Type**: `FUNCTIONAL` (Universal Modular Architecture Governance)
- **Summary**:
  - Codified OPCA v1.0 product capsule boundaries with automated test enforcement.
  - Established Change-Radius classification (`DIRECT`, `DEPENDENT`, `BOUNDARY`, `UNRELATED`) and Master 18-Step Execution Loop.

### Release v1.09.02.0
- **Date**: 2026-09-20
- **Type**: `FUNCTIONAL` (Centralized Keyboard Shortcut Customization)
- **Summary**:
  - Centralized keyboard shortcut management in `src/core/shortcuts/` with interactive drawer editor.

### Release v1.09.01.1
- **Date**: 2026-09-20
- **Type**: `PATCH` (CI Workflow & Orientation Advisory)
- **Summary**:
  - Added GitHub Actions CI workflow executing `npm run lint && npm test && npm run build`.
  - Added mobile landscape orientation advisory modal in CineMorph Theater.

### Release v1.09.00.0
- **Date**: 2026-09-11
- **Type**: `SUB-VERSION` (Fullscreen Initial Mount Fix & Strict Media Validation)
- **Summary**:
  - Resolved CineMorph fullscreen initial mount projection positioning defect.
  - Implemented `mediaValidator.ts` strict rejection of vertical (<1:1) and non-video files.
  - Formalized OPCA boundary isolation.

### Release v1.08.05.0
- **Date**: 2026-09-09
- **Type**: `PATCH` (Main-Thread Freeze Elimination & Screening Session Sync)
- **Summary**:
  - Eradicated P0 main-thread freeze on large file selection (<5ms handoff).
  - Replaced naive JS loops with native SIMD `Uint8Array.prototype.indexOf`.
  - Unified screening session state in `useCineMorphStore`.

### Release v1.08.00.0
- **Date**: 2026-09-02
- **Type**: `SUB-VERSION` (Universal Perception & Smart Framing)
- **Summary**:
  - Client-side MediaPipe BlazeFace WASM SIMD perception.
  - 5-band Web Audio parametric EQ dialogue clarity booster.
  - Decoupled PDS (Perception-Decision-Stabilization) architecture.

### Release v1.05.00.0
- **Date**: 2026-08-30
- **Type**: `SUB-VERSION` (Dual-Engine Baseline)
- **Summary**:
  - United U-Tube and CineMorph under central cosmic gateway portal (`/`).
  - Concave cinema screen curvature hierarchy.

### Release v1.00.00.0
- **Date**: 2026-08-30
- **Type**: `MAJOR` (Initial OmniStream Unified Release)
- **Summary**:
  - Initial public architecture unification combining U-Tube and CineMorph.

---

## 5. Master 15-Step Version Execution Loop

Every version change must follow this mandatory governance sequence:

1. **Read Version Controller**: Inspect `VERSION_CONTROLLER.md`.
2. **Find Historical Precedents**: Check previous solutions and constraints.
3. **Inspect Current Code**: Verify active implementation and dependencies.
4. **Understand Request**: Dissect motive, scope, and affected capsules.
5. **Classify Change Level**: Major ($A$), Sub-version ($BC$), Functional ($DE$), or Patch ($F$).
6. **Calculate Target Version**: Apply reset and overflow rules strictly.
7. **Perform Risk Check**: Assess blast radius and verify rollback path.
8. **Implement Changes**: Execute minimal surgical code modifications.
9. **Run Local Tests**: Execute unit tests for altered modules.
10. **Verify Integration**: Run full test suite (`npm test`) and typecheck (`npm run lint`).
11. **Update Version in Code**: Synchronize `package.json`, `src/config/version.ts`, `src/core/config/version.ts`, and `src/test/version.test.ts`.
12. **Update Version Controller**: Record change summary, commit status, and test counts in `VERSION_CONTROLLER.md`.
13. **Commit If Authorized**: Create git commit if explicitly authorized by user.
14. **Final Consistency Check**: Verify build (`npm run build`) and test suite.
15. **Report Final State**: Deliver clear report with previous version, new version, and test evidence.

---

## 6. Testing Tiers & Quality Assurance Gates

| Tier | Category | Suites | Coverage & Responsibility | Gate Rule |
|---|---|:---:|---|---|
| **Tier 1** | Features & Subsystems | 23 | OMS-SBH geometry, tickets, audio DSP, subscriptions, player seeking | 100% Pass |
| **Tier 2** | Boundaries & Input Validation | 12 | Corrupt storage recovery, invalid URLs, offline cuts, vertical video rejection | 100% Pass |
| **Tier 3** | Combinations & Cross-Feature | 5 | Multi-step workflows, queue persistence, theme transitions | 100% Pass |
| **Tier 4** | User Journeys | 4 | End-to-end user journeys (discovery to screening, airgapped playback) | 100% Pass |
| **Tier 5** | Adversarial & Chaos Recovery | 6 | Stress testing, memory leaks, rapid aspect switching, torn ticket payloads | 100% Pass |
| **Architecture** | OPCA Boundaries | 1 | Capsule isolation rules, zero cross-product imports, barrel export validation | 100% Pass |
| **Smoke/Legacy** | Core Smoke & Version | 19 | Version consistency, stores, basic render tests | 100% Pass |

---

## 7. Rollback & Recovery Procedures

If a regression or failure occurs during any execution step:
1. **Instant Reversion**: Revert files to the last verified commit or checkpoint.
2. **Quarantine Failing Modules**: Isolate experimental changes behind capability detection or disable flags.
3. **Verify Baseline**: Run `npm test` and `npm run lint` to prove the baseline is restored.
4. **Record Incident**: Document the failure reason, affected modules, and remediation in `VERSION_CONTROLLER.md`.

---

## 8. Future Feature Roadmap: CineMorph Ambient Mode Architecture

### 8.1 Architectural Definition & Purpose
Ambient Mode extends CineMorph's physical theater atmosphere by diffusing real-time, edge-synchronized peripheral illumination onto the architectural auditorium walls and proscenium surround. Rather than an arbitrary psychedelic visualizer, Ambient Mode functions as an authentic physical projection reflection, softening screen contrast and immersing the viewer in the director's color palette.

### 8.2 Non-Negotiable Invariants
1. **Render Isolation**: Real-time ambient analysis must directly update DOM CSS variables (`--ambient-top`, `--ambient-bottom`, `--ambient-left`, `--ambient-right`, `--ambient-luma`) or render to an overlay WebGL context. Never trigger React component re-renders during active playback.
2. **Audio/Video Decoupling**: Ambient color extraction must operate as an isolated peripheral pipeline, completely independent of Web Audio API parametric EQ and caption rendering.
3. **Downsampled Canvas Efficiency**: Ambient sampling must never analyze full-resolution 4K frames. Frames are sub-sampled at low resolution ($16\times 9$ down to 8 edge samples) at throttled $15 - 30\text{ Hz}$ intervals.
4. **Temporal Low-Pass Smoothing**: Color transitions must pass through critically damped exponential moving average (EMA) filters to prevent high-frequency flashing during strobe scenes or rapid cuts.
5. **Local-First Privacy**: 100% of color analysis occurs client-side in the browser. Zero frame data or metrics are ever sent to remote servers.

### 8.3 Multi-Phase Release Roadmap

```text
PHASE V1 (v1.09.12.0 - Completed) ──> CSS Variable Edge Glow & 16-point Canvas Downsampler
PHASE V2 (Target: v1.09.13.0)     ──> OffscreenCanvas Web Worker Pipeline for 4K / High Bitrate Media
PHASE V3 (Target: v1.10.00.0)     ──> Volumetric Auditorium Wall Reflection Shader (WebGL / CSS3D)
PHASE V4 (Target: v1.10.01.0)     ──> Optional Local Hardware Bridge (Local LAN Philips Hue / HomeKit API)
```

- **Phase V1 (`v1.09.12.0` - Current)**: Standalone client-side edge sampler extracting 4-quadrant chromaticity (top, bottom, left, right, dominant) and binding to proscenium glow CSS custom properties with photic safety EMA filtering.
- **Phase V2 (`v1.09.13.0`)**: Background Web Worker processing with `OffscreenCanvas` transfer, ensuring zero main-thread contention even during high-bitrate HEVC/AV1 playback.
- **Phase V3 (`v1.10.00.0`)**: Architectural wall and seating material interaction: ambient light reflects realistically off fluted walnut wood paneling and velvet fabrics based on CineMorph Day/Night mode.
- **Phase V4 (`v1.10.01.0`)**: Extensible local-network hardware lighting bridge with zero cloud telemetry.

---

## 9. CineMorph Subtitle & Caption Subsystem Architecture & Future Subtitle Intelligence Roadmap

### 9.1 Architectural Principles & Decoupled Pipeline
Subtitles and captions in CineMorph are treated as a **first-class media subsystem**, not decorative text layered arbitrarily over video. The subsystem maintains strict separation between source discovery, format parsing, runtime cue indexing, temporal synchronization, screen geometry anchoring, and accessible presentation:

```text
SUBTITLE SOURCE (Embedded container track, local .srt/.vtt/.ass file, or manual upload)
      ↓
TRACK DISCOVERY & MODEL (TrackModel: id, label, language, kind, source, format, cues)
      ↓
MULTI-FORMAT PARSER (Deterministic parser: WebVTT, SRT, ASS/SSA with tag stripping & SDH detection)
      ↓
CANONICAL CUE MODEL (SubtitleCue: id, startTime, endTime, text, speaker, isSdh, isRtl)
      ↓
TEMPORAL SYNCHRONIZATION (findActiveCues: O(log n) binary search on HTMLVideoElement.currentTime)
      ↓
SCREEN GEOMETRY ANCHORING (Proscenium aperture boundary containment: 1.43:1, 1.90:1, Original)
      ↓
ACCESSIBLE PRESENTATION (CaptionOverlay: ARIA live regions, speaker badges, RTL direction, typography scaling)
```

### 9.2 Non-Negotiable Invariants
1. **Clock Synchronization**: Cue lookup is strictly driven by `HTMLVideoElement.currentTime` rather than independent interval timers. All active cues update with sub-frame accuracy on `timeupdate` and `seeked` events.
2. **Sub-Microsecond Binary Lookup**: Cue lookup executes in $O(\log n)$ via binary search (`findActiveCues`), handling 10,000+ cue files in $< 2\,\mu\text{s}$ and consuming $< 0.01\%$ of the 16.67ms frame budget.
3. **Proscenium Aperture Containment**: The subtitle overlay (`CaptionOverlay.tsx`) is rendered strictly inside the aperture projection container. Subtitles never drift into the letterboxed void, proscenium frame, or auditorium seating.
4. **Rich Metadata Preservation**: Speaker identification (`SPEAKER: text`) and SDH sound effects (`[door slams]`, `(wind howling)`) are parsed and rendered with distinctive, accessible typography.
5. **Bidirectional (RTL) Support**: Right-to-left scripts (Arabic, Hebrew, Persian, Urdu) are automatically detected via Unicode codepoints and assigned `dir="rtl"`.
6. **Local-First Privacy**: 100% of subtitle parsing and cue rendering occurs client-side in browser memory. Zero subtitle text or media file content is ever transmitted to remote servers.

### 9.3 Multi-Phase Subtitle Intelligence Roadmap

```text
PHASE V1 (v1.09.11.0 - Completed) ──> Canonical Multi-Format Parser (VTT/SRT/ASS), O(log n) Binary Lookup & Accessible Proscenium Overlay
PHASE V2 (Target: v1.09.12.0)     ──> Subtitle Timecode Drift Correction (±50ms to ±10s manual/auto slider offset)
PHASE V3 (Target: v1.09.13.0)     ──> In-Browser Local Whisper WASM Automatic Speech-to-Text Captioning (Offline)
PHASE V4 (Target: v1.10.00.0)     ──> Spatial Dialogue Anchoring: Canvas Face-Tracking Position Alignment
PHASE V5 (Target: v1.10.01.0)     ──> Multi-Speaker Diarization with Directional Web Audio Panning Cue Links
```

- **Phase V1 (`v1.09.11.0` - Current)**: Core foundation delivering native WebVTT, SRT, and ASS/SSA parsers, sub-microsecond binary search cue lookup, external file upload, speaker badges, SDH styling, RTL auto-direction, font scaling (`small`, `medium`, `large`), and proscenium containment.
- **Phase V2 (`v1.09.12.0`)**: Runtime synchronization calibration: interactive delay adjustment slider allowing viewers to offset subtitle timecodes against out-of-sync audio tracks without modifying the original file.
- **Phase V3 (`v1.09.13.0`)**: Local-first automated transcription: client-side Whisper.cpp / Transformers.js WASM integration to generate closed captions on-device for un-captioned media without cloud reliance.
- **Phase V4 (`v1.10.00.0`)**: Spatial dialogue anchoring: integration with CineMorph's face detection pipeline to place speech captions proximate to the active speaker on 1.43:1 and 1.90:1 canvases while avoiding face obscuration.
- **Phase V5 (`v1.10.01.0`)**: Acoustic diarization: coupling Web Audio 5-band DSP frequency analysis with subtitle cues to visually indicate speaker position (left/center/right) across the theater soundstage.


