# Changelog

All notable changes to the **OmniStream** personal media platform will be documented in this file.

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (`MAJOR.MINOR.PATCH`):
- **MAJOR (`Y.0.0`)**: Substantial architectural evolutions, next-generation platform overhauls, or breaking interface changes.
- **MINOR (`x.Y.0`)**: Meaningful new product features, theater capabilities, analysis pipelines, or non-breaking functional upgrades.
- **PATCH (`x.x.Y`)**: Bug fixes, performance optimizations, minor UI refinements, and internal refactors.

---

## [1.5.1] - 2026-09-01

### Fixed & Calibrated
- **CineMorph Seating Integrity**: Restored auditorium VIP recliner seating across all modes (Original Flat, IMAX 1.90:1, and True IMAX 1.43:1). Calibrated True IMAX mode to render seats with a proportionally lower/shorter profile (`h-4 sm:h-5`, seat height `h-3.5 sm:h-4.5`, opacity `0.35`) to ensure the massive vertical screen remains dominant without any obstruction.
- **CineMorph Screen Curvature Strictness**: Enforced strict flat presentation for Directorial Original Mode (`transform: none`, 0 curve), subtle horizontal curve for IMAX 1.90:1 (`perspective(1600px)`), and calibrated large-format curve for True IMAX 1.43:1 (`perspective(1400px)`).
- **U-Tube Theater Curvature & Seating**: Calibrated U-Tube Theater mode to feature a noticeably stronger default cinema curve (`perspective(1000px) rotateX(0.70deg)`) while preserving 100% video clarity, and integrated the distinct U-Tube Modern Digital Cinema Blue Seating row at the bottom foreground.
- **Video Fidelity Guarantee**: Verified that all curved screen transforms apply strictly at the outer proscenium frame level, keeping the inner `<iframe>` and `<video>` streams 100% native 2D, sharp, unwarped, and uncompressed.

---

## [1.5.0] - 2026-09-01

### Status: Stable Baseline Checkpoint

OmniStream v1.5.0 represents the unified, verified baseline uniting **U-Tube** (casual, ad-free web video discovery) and **CineMorph** (local private media cinematic fixed-aperture theater) under the **OmniStream Master Gateway**.

---

### Completed Product Experiences & Capabilities

#### 1. OmniStream Gateway & Domain Architecture
- **Master Entry Gateway (`/`)**: Dynamic portal switching between U-Tube and CineMorph with centralized global settings drawer.
- **Strict Domain Separation**: Clean boundaries between U-Tube discovery feeds and CineMorph private local media processing.
- **OMS Contextual Handoff**: Seamless state transition carrying media identifier, source URL, title, thumbnail, duration, and timestamp without re-searching.

#### 2. U-Tube (Discovery & Watch Engine)
- **Zero-Ad Feed & Discovery**: Bento-grid video feeds, dynamic keyword suggestions, and multi-category browsing.
- **Dynamic Search & Local Intent Interpreter**: Instant query suggestions and deterministic natural language routing for in-progress and subscription queries.
- **U-Tube Player & Theater A**: Modern digital cinema watch experience with default horizontal curved screen geometry (`perspective(1200px)`), responsive controls, and full-screen theater immersion.
- **Library Persistence**: LocalStorage-backed watch history with exact resume timecodes, custom collections, and channel subscriptions.

#### 3. CineMorph (Cinematic Theater Experience)
- **Aperture-Fixed Cinema Engine**: Multi-aperture presentation including Directorial Original (Flat), IMAX Widescreen (1.90:1 subtle curve), and True IMAX Large Format (1.43:1 monumental presence).
- **Physical Ticket Ritual**: 10-second mechanical ticket printing ritual with custom video frame poster preview, barcode, micro brand marks (`CineMorph`, `OMS`, `AROH`), and torn admission stub persistence.
- **Audio DSP Engine**: 5-stage Web Audio API parametric equalizer with real-time spectrum analysis, Dialogue Clarity (2.8kHz peaking), Cinema Sub-Bass (150Hz lowshelf), 3D Spatial soundstage, and Night Compression DRC.
- **Low-Profile Auditorium Seating**: Non-obstructive foreground VIP recliner seating row maintaining natural theater perspective and clear sightlines.
- **Slim Floating Controls Deck**: Minimalist, translucent control strip with vanishing auto-hide behavior and accessible touch targets.

#### 4. Deterministic Video & Image Intelligence
- **Fast Frame Quality Analyzer**: Discrete 2D Laplacian edge variance for sharpness and blur detection, contrast entropy, and low-key cinema exposure protection.
- **Scanline Active Area Detector**: Real-time matte boundary detection identifying letterboxing and pillarboxing without false positives.
- **Dynamic Poster Service**: Multi-tier thumbnail and canvas frame extraction seeking past black intro frames with golden-ratio 35% focal cropping.
- **Adaptive Cinema Engine**: Temporal low-pass exponential smoothing with deadband hysteresis ($|\Delta| > 3.5\%$) and subtitle-safe caption protection.

---

### Currently Implemented vs. Planned for Future

| Capability | Version 1.5.0 (Current Baseline) | Version 2.0.0 (Next Generation Planned) |
|---|---|---|
| **Viewport Saliency** | Fast 16x9 Canvas Luminance Centroid | BlazeFace WASM Facial Landmark Tracking |
| **Poster Ranking** | Laplacian Variance & Contrast Cascade | MobileNet-V3 Aesthetic Quality Reranker |
| **Intent Parsing** | Deterministic Regex & Keyword Classifier | MiniLM ONNX Semantic Vector Embeddings |
| **Video Summary** | Structured Template Synthesizer | On-Device Transcript Distillation (SmolLM2 WebGPU) |
| **Audio Enhancement** | Web Audio API 5-Band Biquad Graph | Web Audio API 5-Band Biquad Graph (Preserved) |
| **Execution Tier** | 100% Client-Side Local & Offline | Hybrid Multi-Tier Decoupled Architecture |

---

### Known Limitations & Architectural Notes
- **Local Media Formats**: Ingest format compatibility depends on browser-native `<video>` codec support (H.264, VP9, AV1, MP4, WebM).
- **YouTube Embedding Constraints**: YouTube playback adheres to standard `iframe_api` protocol; background audio DSP requires local media files or proxy stream nodes.
- **Render Isolation**: Real-time ambilight and pan transforms mutate DOM elements directly via references to maintain 0 root React state re-renders during active playback.

---

## Release Roadmap & Version Progression

```
v1.5.0 (Current Stable Baseline)
   ↓
v1.6.0 (WASM Computer Vision & Facial Landmark Adapter Integration)
   ↓
v1.7.0 (Semantic Vector Search & Local Transcript Embeddings)
   ↓
v1.8.0 (Major Pre-v2 Milestone: Full Multi-Tier Model Laboratory)
   ↓
v1.8.x (Stabilization, Regression Hardening & Performance Optimizations)
   ↓
v2.0.0 (OmniStream Generation 2: Next-Gen Autonomous Media Intelligence)
```
