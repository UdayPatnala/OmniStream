# OmniStream Master Specification Inventory

**Document Version**: 1.0.0  
**Generated Date**: 2026-08-24  
**Author**: Specification Miner Subagent (`spec_miner_1`)  
**Scope**: OmniStream Platform (Shared Core, U-TUBE Engine, CineMorph Engine, OMS Intelligence Architecture, Security, UI/UX, Performance, Free-First Policies)

---

## 1. Executive Summary & Core Constitution

OmniStream is a personal media experience platform combining two distinct viewing engines sharing a common media foundation, state system, and platform shell:
1. **U-TUBE**: A lightweight, clean, YouTube-oriented discovery and watch engine designed for low-friction, ad-free personal consumption using permitted embedded mechanisms.
2. **CineMorph**: A cinematic, fixed-aperture theater experience for local media and supported online video using client-side machine learning framing, physical theater presentation, and audio enhancement.

### Fundamental Truths & Core Motives
- **Zero Mock / Zero Fake Data**: Production application must contain zero fabricated videos, channels, thumbnails, views, AI confidence scores, recommendations, statistics, or demo modes.
- **Playback-First AI**: Video playback stability, frame rate, and A/V synchronization strictly take priority over all optional AI models, ambient effects, and animations. AI failure must never block or crash media playback.
- **Free-First & Local-First**: No feature may require a mandatory paid cloud service, API key, or remote inference. Local media remains strictly on-device with zero automatic uploads.
- **Non-Destructive Framing**: CineMorph intelligent framing is strictly a presentation-layer spatial transform (Translate X, Translate Y, Scale) behind a fixed aperture. Source video files are never permanently altered, cropped, or re-encoded.
- **Truth Contract**: The product must never make deceptive claims regarding official IMAX certification, Dolby licensing, artificial 4K/HDR upscaling, or unverified ad-blocking.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Architecture | Modular Monolith Layering | Layered architecture (L0 Presentation, L1 Application, L2 Domain, L3 Media/Discovery Adapters, L4 Intelligence/OMS, L5 Persistence, L6 Optional Network, L7 Security/Observability). | User actions, platform events | Rendered UI, coordinated domain workflows | Errors trapped at layer boundaries; diagnostics recorded | P2 §2, P4 §64, P5 §6 |
| 2 | Architecture | Shared Media Foundation | Provider-neutral `MediaItem` core entity representing both local and online media with unified session and playback state. | File descriptor or Online URL | Unified `MediaItem` domain entity | Invalid media handled by capability layer; fallback to error state | P2 §47, P3 §196, P5 §8 |
| 3 | Architecture | Provider Abstraction Layer | `DiscoveryProvider`, `PlaybackProvider`, and `MetadataProvider` abstractions isolating third-party APIs (e.g. YouTube) from UI and domain code. | Query, video ID, channel ID | Normalized metadata, playable stream reference | Provider errors classified into standard error taxonomy | P2 §3, P5 §10 |
| 4 | Architecture | Cross-Engine Seamless Transfer | Ability to transition active playback between U-Tube and CineMorph preserving timestamp, session, and media identity. | Active playback state, target mode | Re-initialized renderer in new engine with restored timestamp | If seamless transfer blocked by embed, closest position restored | P2 §44-46, P3 §125-126, P4 §61 |
| 5 | U-TUBE | Direct Link-First Resolver | Immediate extraction and validation of YouTube video IDs from standard, short, embed, or shorts URLs, bypassing remote search. | YouTube URL string | Validated Video ID, cached/resolved metadata | Rejects invalid strings, data/javascript URLs with clear feedback | P2 §5, Build §07, Clarif §51 |
| 6 | U-TUBE | Multi-Signal Search Pipeline | Search engine with query sanitization, normalization, language/intent detection, deduplication, and multi-signal ranking. | Search query string | Ranked list of validated `MediaItem` records | Empty query returns zero results; network errors show cached/honest state | P2 §6-10, Clarif §01 |
| 7 | U-TUBE | Query Intelligence & Normalization | Multilingual query normalization (supporting English, Telugu, Hindi, Tamil) without aggressive semantic rewriting. | Raw user query string | Normalized query tokens & detected language | Retains original query if language/intent classification is low-confidence | P2 §7, P2 §32 |
| 8 | U-TUBE | Subscriptions & 4-Hour Refresh | Local subscription storage with background, rate-limited refresh queue (approx. 4hr interval) and priority home feed indexing. | Channel URL or ID | Subscribed channel record & cached video feed | Stale subscriptions retain last known valid feed on refresh failure | P2 §11-12, Clarif §02-03 |
| 9 | U-TUBE | Home Feed Multi-Tier Ranker | Deterministic feed ranker: 1. Subscribed, 2. New/Unwatched, 3. Half-Watched (Continue), 4. Discovery, 5. Fully-Watched (deprioritized). | Cached subscription feeds, user history, intent | Section-organized Home Feed | Shows empty state if no subscriptions or history exist | P2 §13, Clarif §04-06 |
| 10 | U-TUBE | Lightweight Recommendation Engine | Privacy-preserving local recommendation using keyword/entity extraction from recent searches and watch history with temporal decay. | Recent search queries, watch completion metrics | Ranked candidate list of related content | Bounded batch discovery; decays old interests to avoid bubble | P2 §14-16, Clarif §08-09 |
| 11 | U-TUBE | Watch History & Periodic Checkpointing | Local history tracking video ID, progress, duration, timestamp, completion state, saved via periodic checkpoints (not per-frame). | Playback timeupdate events, pause/seek/unload | Persisted watch history records | Recovers cleanly from browser crash without state corruption | P2 §18, P2 §79, Build §12 |
| 12 | U-TUBE | Smart Resume Playback | Intelligent resume prompt or automatic position restoration if progress is past threshold and before end threshold. | Video open event, stored position | Player seek to stored timestamp (or prompt) | Explicit replay resets stored watch position to zero | P2 §19, Clarif §07 |
| 13 | U-TUBE | Persistent Mini-Player | Global player continuity maintaining active playback in a floating bottom-right container during route navigation. | Route change event while playing | Persistent mini-player with play/pause/seek/expand/close | Audio/video continues without reload or duplicate iframes | P2 §22, Build §11, P4 §17 |
| 14 | U-TUBE | L1/L2/L3 Layered Caching | In-memory (L1), persistent local (L2), and provider (L3) caching with TTLs, LRU eviction, and single-flight deduplication. | Metadata / search requests | Cached or fresh normalized responses | Invalidates on TTL expiry or explicit user refresh | P2 §25-27, P5 §13 |
| 15 | U-TUBE | Single-Flight Request Deduplication | Concurrent identical request consolidation ensuring only one outbound network request runs for multiple listeners. | Concurrent request keys | Shared Promise resolving to response | Handles rejection cleanly across all subscribing callers | P2 §26, P5 §17 |
| 16 | U-TUBE | Local Collections & Favorites | User-defined local playlists (Watch Later, Favorites, custom) storing media ID references without metadata duplication. | Media items, collection commands | Local collection entities | Prevents duplicate items; graceful handling if media unavailable | P2 §51-52, Build §07 |
| 17 | CineMorph | Fixed Screen Aperture Engine | Theatrical presentation model where the screen aperture is a fixed geometric window and the video plane moves behind it. | Video frame dimensions, target aspect ratio | Computed CSS/Canvas transform (translate X, Y, scale) | Clean boundary enforcement: zero image leakage, gaps, or distortion | P1 §13, P3 §13, P3 §49 |
| 18 | CineMorph | Three Primary Presentation Modes | User-facing modes: 1. Large Format 1.90:1 (default), 2. True Large Format 1.43:1 (fullscreen request), 3. Original (Native / 4:3). | Mode selection command | Aperture aspect ratio change & transform recalibration | Smooth live mode transition without reloading media or audio reset | P1 §10, P3 §10, Clarif §13-18 |
| 19 | CineMorph | Local Media Capability Detection | Inspection of local video container, video/audio codecs, resolution, framerate, HDR, tracks, and browser playback support. | File handle / Blob / MediaSource | Media capability status (Supported, Remux, Unsupported) | Clear, honest error message on unsupported codec; zero crash | P3 §6-7, Build §32-33 |
| 20 | CineMorph | Bounded Windowed Media Streaming | Native browser decoding & chunked processing for large files (3hr+ movies) avoiding full RAM preloading. | Local media file (any size) | Streaming playback buffer & windowed analysis buffer | Memory bounded; discards stale analysis windows | P3 §8-9, Clarif §41, P5 §26 |
| 21 | CineMorph | Ticket Generation & Printing Sequence | Theatrical entry sequence printing a session ticket with movie title, runtime, format, seat number, screen, and date. | Media metadata, session ID | Rendered ticket animation & atmosphere | Skip/reduced-motion options; failure bypasses directly to movie | P1 §17, P3 §66-72, Build §34 |
| 22 | CineMorph | Ticket-Based Resume ("My Tickets") | Cinema equivalent of history where saved tickets act as resume objects restoring position, aspect ratio, audio, and subtitles. | Ticket selection | Restored playback session & file verification | If local file missing, prompts user to reselect without deleting ticket | P1 §18, P3 §69-71, P4 §58-59 |
| 23 | CineMorph | Bounded Theatrical Intro & Curtain Reveal | Theatrical sequence with closed velvet curtains, cinema bumper within the selected aperture (~10s max), and curtain opening. | Playback start trigger | Animated curtain & screen reveal within aperture | Background analysis runs concurrently; starts immediately if ready | P1 §17, P3 §64-65, Clarif §20-23 |
| 24 | CineMorph | Asynchronous Analysis Worker Pipeline | Off-main-thread Web Worker / OffscreenCanvas pipeline sampling frames, detecting shots, running vision models, and scoring framing. | Video frame samples, playback timestamps | Candidate framing transforms with confidence scores | Drops analysis frequency if latency exceeds budget; zero UI stutter | P3 §17-20, OMS §14, Build §52 |
| 25 | CineMorph | Adaptive Frame Sampling | Dynamic sampling frequency based on scene dynamics: low for static scenes, moderate for dialogue, higher for action/cuts. | Video playback rate, scene motion metrics | Frame sample stream for analysis | Backs off automatically under thermal, battery, or CPU/GPU pressure | P3 §18, P3 §79, Build §24 |
| 26 | CineMorph | Shot Boundary & Hard Scene Cut Reset | Real-time scene cut detector that resets framing context and acquires safe composition immediately upon cut. | Consecutive frame difference metrics | Hard cut trigger event | Prevents slow, unnatural interpolation across unrelated shots | P3 §36, Clarif §27 |
| 27 | CineMorph | Candidate Frame Generation & Scoring | Generates candidate apertures (center, rule of thirds, leadroom, group) and scores via cinematography heuristics. | Detected bounding boxes, saliency, lines, motion | Ranked candidate transform list | Hard constraints reject invalid candidates (face/subtitle clipping) | P3 §39-41, P3 §155 |
| 28 | CineMorph | Hard Constraint Safety Filters | Non-negotiable filter: rejects any candidate that crops important faces, clips subtitles, cuts vital text, or exceeds zoom bounds. | Candidate bounding box, protected regions | Pass/Fail validation flag | If all candidates fail, falls back to safe centered framing | P1 §11, P3 §40, Clarif §31 |
| 29 | CineMorph | Keep-Current-Frame & Hysteresis | Dead-zone stability controller that maintains current framing unless a new candidate exceeds improvement threshold. | Current score vs best candidate score | Decision: `KEEP_CURRENT_FRAME` or `TRANSITION` | Prevents hunting, micro-oscillations, and robotic camera jitter | P1 §12, P3 §43-44, Build §22 |
| 30 | CineMorph | Temporal Smoothing & Velocity Bounding | Smooth interpolation (easing + maximum velocity clamp) for framing adjustments to feel like deliberate camera moves. | Target transform, current transform, delta time | Smoothed render transform per animation frame | Emergency adjustments bounded; never teleports unless hard cut | P3 §45-47, OMS §30 |
| 31 | CineMorph | Subtitle & On-Screen Text Protection | Automatic bounding box detection and safe-zone reservation for subtitles, titles, and credits. | Subtitle state, text bounding boxes | Protected bottom/center region mask | Decreases crop aggression; prioritizes subtitle legibility | P3 §54-56, Clarif §31-32 |
| 32 | CineMorph | Audio DSP Engine & Profiles | Multi-profile audio processing (Original, Cinema, Dialogue clarity, Night mode compression) with zero A/V desync. | Audio stream / Web Audio Context | Processed audio node graph | Original audio bypass always available; auto-bypasses if DSP adds lag | P3 §85-86, Clarif §39 |
| 33 | CineMorph | Multi-Audio & Subtitle Track Switching | Detection and live switching of embedded and external audio streams and subtitle tracks with position preservation. | Media track list, user track selection | Switched active audio/text track | Seamless track switch; preserves timestamp and session state | P3 §87-89, Clarif §37-38 |
| 34 | CineMorph | Framing Lab & Developer Diagnostics | Dedicated diagnostic environment exposing source frame, aperture, face boxes, candidate scores, latency, and FPS. | Live/paused video, debug toggles | Visual diagnostic overlays & metric graphs | Disabled in production consumer UI; accessible via developer mode | P3 §104-105, Build §82 |
| 35 | OMS | OMS Model Router & Registry | Central registry (`OMS_ROUTER`) managing models (Core, Vision, Detect, Track, Scene, Compose, Motion, Audio, Search, Recommend). | Task type, hardware capabilities, FPS | Selected model instance & execution backend (WebGPU/WASM/CPU) | Dynamically degrades level (L4 -> L3 -> L2 -> L1 -> L0) if budget exceeded | OMS §1-45, IA §29-45 |
| 36 | OMS | Model Ownership & Provenance Rule | Strict architectural rule: OMS is the orchestration layer; underlying open-source/third-party models retain true names and licenses. | Model metadata | Attribution & license compliance records | Never renames third-party models as proprietary OMS tech | OMS §47-55 |
| 37 | OMS | AI Health Diagnostics & Monitoring | Continuous health monitoring tracking model status (`AVAILABLE`, `LOADING`, `READY`, `DEGRADED`, `FAILED`). | Health probes, inference latency, error counts | System health status & telemetry events | Automatically triggers fallback chain when degraded or failed | IA §105-111, OMS §44 |
| 38 | OMS | Stale Result Rejection | Mandatory output metadata (`timestamp`, `confidence`, `modelVersion`, `mediaSessionId`) attached to all worker outputs. | Worker inference output | Validated or discarded output payload | Results from outdated timestamps or previous seek positions rejected | IA §65-72, Build §53 |
| 39 | Security | Strict Input Sanitization & CSP | Comprehensive validation and escaping of URLs, IDs, metadata, titles, descriptions, and subtitle VTT/SRT text. | Untrusted external / user input | Sanitized safe DOM nodes / strings | Rejects malformed or dangerous scripts, javascript: URLs, XSS payloads | P2 §55, P4 §89-90, Build §45 |
| 40 | Security | Iframe Sandbox & Origin Whitelisting | Embedded iframe restriction permitting only validated provider origins (e.g. `https://www.youtube-nocookie.com`). | Validated provider video ID | Sandboxed iframe with strict permissions policy | Arbitrary user iframe URLs strictly forbidden | P2 §56, P4 §90, Build §46 |
| 41 | UI/UX | Bento Grid Global Landing Gateway | Minimalist, modern entry landing page presenting distinct cards for U-Tube ("Watch") and CineMorph ("Enter Cinema"). | Route load `/` | Rendered Bento gateway | Adapts layout fluidly across desktop and laptop displays | P1 §19, P4 §3-4 |
| 42 | UI/UX | Isolated Design Systems & Tokens | Strict visual token separation (`--utube-*` white/red vs `--cinema-*` vintage paper/gold/curtain) preventing theme contamination. | Active route / engine context | Scoped CSS variable stylesheet | Zero visual leakage between engines | P4 §6, P4 §32, P4 §63 |
| 43 | UI/UX | Contextual Auto-Hiding Theater Controls | Minimalist overlay controls in CineMorph that auto-hide during playback and reappear on mouse move or keypress. | User pointer/keyboard activity, playback state | Visible/hidden controls with smooth opacity | Keeps movie as 100% unobstructed primary focal point | P3 §103, P4 §46 |
| 44 | UI/UX | Full Accessibility & Reduced Motion | Full WCAG compliance with keyboard navigation, visible focus rings, ARIA labels, and `prefers-reduced-motion` overrides. | System accessibility settings, keyboard events | Accessible DOM tree, simplified animations | Disables curtain/ticket motion when reduced motion is preferred | P2 §73, P3 §120, P4 §78-82 |
| 45 | Quality | Strict No-Dead-UI & Truth Gate | Architectural invariant: every visible button, toggle, and metric connects to real working functionality. | UI interaction | Executed domain command | Unimplemented/fake features prohibited from production bundles | P1 §14, Build §40, Clarif §10 |

---

## 3. Edge Cases & Observed Behaviors

| # | Feature | Input / Condition | Observed & Specified Behavior |
|---|---------|-------------------|-------------------------------|
| 1 | U-Tube Search | Multilingual non-English query (e.g. Telugu "అరే ఓ సాంబ") | Query is preserved semantically without forced English transliteration; matches regional metadata correctly. |
| 2 | U-Tube Search | Rapid consecutive searches ("python" -> "java" within 100ms) | Previous pending request for "python" is cancelled via `AbortController`; only "java" results update the UI. |
| 3 | U-Tube Watch | User replays video from beginning after finishing | Stored watch position is explicitly reset to 0; does not resume at ending timestamp. |
| 4 | U-Tube Feed | Subscribed channel refresh fails due to offline/network error | Cached subscription feed is preserved; UI shows subtle offline status; does NOT wipe existing feed. |
| 5 | U-Tube Mini-Player | User navigates from `/watch/:id` to `/subscriptions` during playback | Player smoothly docks to bottom-right mini-player without iframe reload, audio glitch, or timestamp loss. |
| 6 | Direct Link Input | User pastes malicious URL (e.g. `javascript:alert(1)`) | Input validator rejects URL immediately; displays invalid link warning; never creates iframe. |
| 7 | CineMorph Source | User drops 4K HDR MKV (unsupported browser codec) | Media capability detector identifies unsupported codec; shows clear error explanation and safe remux/fallback path; never crashes. |
| 8 | CineMorph Storage | 3-hour 20GB local movie opened | Movie begins playing immediately via browser streaming chunks; RAM usage remains bounded (<200MB); zero full-file buffering. |
| 9 | CineMorph Framing | Hard scene cut occurs between two different camera angles | Analysis context resets immediately; new safe composition chosen instantly without slow, unnatural camera panning across cut. |
| 10 | CineMorph Framing | Dialogue scene with two actors talking back and forth | Joint framing candidate chosen; avoids rapid camera bouncing between actor faces every second. |
| 11 | CineMorph Framing | Wide landscape / establishing shot with zero faces | System recognizes landscape scene; uses balanced wide composition; avoids aggressive zooming into empty center. |
| 12 | CineMorph Framing | Subtitles appear in lower third during intelligent reframing | Hard constraint filter protects lower third; reframing adjusts or scales back crop to ensure subtitles remain 100% visible. |
| 13 | CineMorph Framing | Fast action scene with rapid subject movement | Sampler increases analysis frequency; uses motion tracking with leadroom; clamps velocity to prevent disorienting jitter. |
| 14 | CineMorph Framing | AI model inference exceeds latency budget (>30ms) | Model Router drops sampling frequency or falls back to Level 1 rules / Level 0 static aperture; video playback never stutters. |
| 15 | CineMorph Mode Switch | User switches live from 1.90:1 to 1.43:1 during active playback | Aperture transitions smoothly to 1.43:1 geometry; browser fullscreen requested; playback position, audio track, and subtitle track remain 100% intact without restarting video. |
| 16 | CineMorph Mode Switch | User selects "Original" mode | Decorative theater elements and smart reframing are disabled; renders clean source video player preserving original directorial framing. |
| 17 | CineMorph Tickets | User attempts to resume ticket for a moved/deleted local file | Ticket displays "Source Unavailable"; offers "Reselect File" button; preserves watch progress history without deleting record. |
| 18 | CineMorph Audio | Web Audio DSP introduces processing latency/drift | System detects A/V desync; automatically bypasses DSP back to original audio output; synchronization takes strict priority. |
| 19 | Accessibility | User has `prefers-reduced-motion: reduce` enabled | Ticket printing animation, curtain opening, and ambient camera transitions are replaced with instant/faded transitions. |
| 20 | Offline Mode | Internet disconnects while watching local media in CineMorph | Playback, framing, local model inference, tickets, and audio enhancement continue completely uninterrupted. |

---

## 4. Architecture & Module Boundaries

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OMNISTREAM PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────┤
│  L0: PRESENTATION & ENTRY GATEWAY                                       │
│  ├── Main Landing (Bento Grid)                                          │
│  ├── U-Tube Shell (Clean, Red/White, Video-First)                       │
│  └── CineMorph Shell (Immersive Theater, Paper/Gold, Fixed Aperture)   │
├─────────────────────────────────────────────────────────────────────────┤
│  L1: APPLICATION & ORCHESTRATION                                        │
│  ├── SearchController       ├── PlaybackController                      │
│  ├── SubscriptionController ├── CinemaController                        │
│  └── HistoryController      └── TicketController                        │
├─────────────────────────────────────────────────────────────────────────┤
│  L2: DOMAIN SERVICES & STATE                                            │
│  ├── DiscoveryService       ├── FramingEngine                           │
│  ├── RankingEngine          ├── CandidateScorer                         │
│  ├── RecommendationService  ├── AudioEngine                             │
│  └── SessionManager         └── TrackManager                            │
├─────────────────────────────────────────────────────────────────────────┤
│  L3: ADAPTERS & BRIDGES                                                 │
│  ├── YouTubeDiscoveryAdapter├── LocalMediaAdapter                       │
│  ├── YouTubePlaybackAdapter └── BrowserMediaAdapter                     │
├─────────────────────────────────────────────────────────────────────────┤
│  L4: OMS (OMNISTREAM INTELLIGENCE SYSTEM)                               │
│  ├── OMS_ROUTER (Model selection, resolution, backend)                 │
│  ├── OMS_VISION (Face, Person, Object, Saliency, Scene, Motion)         │
│  ├── OMS_FRAME & OMS_COMPOSE (Candidates, scoring, heuristics)          │
│  ├── OMS_MOTION (Hysteresis, temporal smoothing, velocity clamping)     │
│  ├── OMS_AUDIO (Local DSP, dialogue clarity, EQ, compression)          │
│  ├── OMS_SEARCH & OMS_RECOMMEND (Query normalization, intent decay)     │
│  └── OMS_GUARD & OMS_CACHE (Health, fallback chain, stale rejection)   │
├─────────────────────────────────────────────────────────────────────────┤
│  L5: PERSISTENCE & LOCAL STORAGE                                        │
│  ├── UserPreferences (localStorage)                                     │
│  ├── WatchHistory & Positions (Versioned Zustand / IndexedDB)           │
│  ├── Subscriptions & Collections (IndexedDB)                            │
│  ├── TicketLibrary & Fingerprints (IndexedDB)                           │
│  └── Model & Media Analysis Cache (CacheStorage / IndexedDB)            │
├─────────────────────────────────────────────────────────────────────────┤
│  L6: OBSERVABILITY, DIAGNOSTICS & SECURITY                              │
│  ├── SecurityUtils (Sanitization, CSP, Iframe sandboxing)               │
│  ├── FramingLab & Diagnostics (Developer telemetry, FPS, Latency)       │
│  └── LifecycleManager (Object URL revocation, Worker teardown)          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Non-Functional Specifications & Performance Budgets

| Metric | Target / Constraint | Enforcement Mechanism |
|--------|---------------------|-----------------------|
| Video Playback Framerate | 60 FPS (or source native 24/30 FPS) with 0 dropped frames | Playback-first scheduling; UI state updates throttled |
| Smart Framing Inference Latency | <= 16ms per sampled window on GPU; <= 35ms on CPU | Adaptive downscaling (normalized analysis resolution) |
| Initial Shell Startup / Paint | < 1.0s to First Contentful Paint | Route code-splitting; zero heavy model preload on gateway |
| Memory Usage (3hr+ Movie) | Bounded <= 250MB active heap | Chunked media streaming; rolling analysis buffer |
| Local History Write Frequency | Checkpointed (interval, pause, seek, unload) | Debounced persistence; zero per-frame storage writes |
| Cache Expiration (Search) | Short TTL (e.g. 30 minutes) | Versioned cache keys with automated stale pruning |
| Subscription Refresh Rate | Approx. 4 hours minimum background interval | Background priority queue scheduler with staleness check |
| Third-Party API Quota Cost | Exactly $0.00 (Zero paid service dependency) | Free-first open-source models, local execution, rate limits |
| Security Policy | Strict CSP, sandboxed iframes, sanitized inputs | Automated HTML/XSS filters; origin whitelisting |

---

## 6. Specification Traceability Matrix

- **OMNISTREAM_MASTER_SPECS.md (P1-P5)**: Complete capture of core motive, U-Tube specs (§1-116), CineMorph specs (§1-200), UI/UX and Security specs (§1-173), and Implementation/Operations specs (§1-170).
- **OMNISTREAM_FINAL_BUILD_AGENT.md**: Fully integrated all 100 manifesto points (Rules 00-100, autonomous decision protocol, 33-point release checklist).
- **OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md**: Fully mapped levels L0-L4, model abstraction, AI health diagnostics, and fallback chains.
- **OMNISTREAM_FINAL_REQUIREMENT_CLARIFICATION_AND_ASSUMPTION_CONTROL.md**: Fully incorporated all 53 mandatory clarifications (search expansion, app-open refresh, 4hr intervals, ranking priority, 3 cinema modes, subtitle protection, memory bounding).
- **OMNISTREAM_OMS_IDENTITY_STANDARD.md**: Formally codified OMS namespace (`OMS_CORE`, `OMS_ROUTER`, `OMS_VISION`, etc.), model provenance, and model-agnostic layer contracts.
- **GEMINI.md**: Adhered to Core Constitution invariants.
