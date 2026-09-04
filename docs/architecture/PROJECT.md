# Project: OmniStream

## Architecture
OmniStream is a modular React + TypeScript web application combining:
1. **Core / Shell**: Bento-style landing page, layout switcher, client-side routing, shared state (Zustand + LocalStorage/IndexedDB).
2. **U-TUBE Module**: Ad-free YouTube clone with white/red theme, dynamic YouTube search with pagination & load-more, direct video URL playback, subscriptions with 4-hour cached refresh, 5-video keyword recommendations, and persistent local history.
3. **CineMorph 3D Theater Engine**: Three.js WebGL theater environment (parametric curved screen, 3D seats instanced mesh, dynamic curtains, ambilight bloom), supporting 1.43:1 (IMAX GT), 1.90:1 (IMAX Digital), Original ratio, and 4:3 offline fallback. Vintage paper styling with theater props (camera, reels, ticket printer).
4. **Advanced Framing Geometry ML Pipeline**: 100% client-side ML engine (TensorFlow.js / lightweight face & saliency detection) computing real-time X/Y pan offsets behind a fixed screen aperture across 4 framing rules (Rule of Thirds, Leading Lines, Frame-in-Frame, Screen Direction), smoothed by spring-damper filter, with a diagnostic HUD overlay, structured under modular `OMS_` adapters.
5. **Vintage UX & State Management**: 10-second ticket printing animation dynamically matching selected screen aperture with Web Audio effects & heads-up pre-processing, torn ticket progress saving and 1-click resumption.
6. **E2E & Adversarial Testing Suite**: Vitest + Testing Library test harness with 44 suites and 198/198 tests passing across Tiers 1–5.

```
OmniStream Architecture
┌─────────────────────────────────────────────────────────────────┐
│                      Bento Landing Shell                        │
│          (Quick Navigator, Torn Tickets Drawer, Settings)       │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
                 ▼                               ▼
┌─────────────────────────────────┐ ┌─────────────────────────────┐
│             U-TUBE              │ │          CineMorph          │
│ - White & Red Theme             │ │ - Vintage Paper & Props     │
│ - Dynamic Search & Pagination   │ │ - Three.js 3D Theater       │
│ - Subscriptions (4h Cache)      │ │   (Curved Screen, Seats,    │
│ - 5 Keyword Recommendations     │ │    Curtains, Ambilight)     │
│ - Ad-Free YouTube Player        │ │ - 1.43:1, 1.90:1, Orig, 4:3 │
│ - Local Storage Persistence     │ │ - Local & Online Playback   │
└─────────────────────────────────┘ └──────────────┬──────────────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    ▼                             ▼
                    ┌───────────────────────────┐ ┌───────────────┴───────────────┐
                    │ Advanced Framing Geometry │ │ 10s Ticket Printer Animation  │
                    │ - Client-Side TF.js ML    │ │ - Aperture-Matched Viewport   │
                    │ - 4 Framing Rules         │ │ - Heads-up Frame Pre-process  │
                    │ - Damped Pan behind Screen│ │ - Web Audio Mechanical FX     │
                    │ - Diagnostic HUD Overlay  │ │ - Torn Ticket Progress Save   │
                    │ - Modular OMS_ Adapters   │ │ - 1-Click Timestamp Resume    │
                    └───────────────────────────┘ └───────────────────────────────┘
```

---

## Code Layout
```
src/
├── app/                          # App shell, routing, layout switcher
│   ├── App.tsx
│   └── routes.tsx
├── components/
│   ├── bento/                    # Bento landing page & navigation
│   │   ├── BentoGrid.tsx
│   │   ├── ModeCard.tsx
│   │   └── TicketDrawer.tsx
│   ├── utube/                    # U-TUBE components
│   │   ├── UTubeLayout.tsx
│   │   ├── SearchBar.tsx
│   │   ├── VideoCard.tsx
│   │   ├── SubscriptionList.tsx
│   │   ├── RecommendationSection.tsx
│   │   └── AdFreePlayer.tsx
│   ├── cinemorph/                # CineMorph 3D theater & UI
│   │   ├── CineMorphView.tsx
│   │   ├── TheaterCanvas.tsx
│   │   ├── SceneElements.ts      # Curved screen, seats, curtains, ambilight
│   │   ├── VintageThemeProps.tsx # Camera, reels, ticket printer UI
│   │   ├── AspectRatioSelector.tsx
│   │   └── MediaLoader.tsx       # Local MP4 & YouTube input
│   ├── ml/                       # Advanced Framing Geometry ML & OMS Adapters
│   │   ├── FramingEngine.ts      # ML model, rule evaluator, spring filter
│   │   ├── FramingRules.ts       # Rule of 3rds, leading lines, frame-in-frame, screen direction
│   │   ├── DiagnosticOverlay.tsx # Visualizer HUD
│   │   └── mlWorker.ts           # Web worker for off-thread frame inference
│   └── ux/                       # UX & animations
│       ├── TicketPrinterAnimation.tsx # Aperture-matched 10s animation & heads-up processor
│       ├── AudioEffects.ts       # Web Audio mechanical sounds
│       └── TornTicketCard.tsx    # Saved ticket progress component
├── state/                        # State stores
│   ├── useUTubeStore.ts
│   ├── useCineMorphStore.ts
│   └── useTicketStore.ts
├── services/                     # Utilities & APIs
│   ├── youtubeService.ts         # YouTube search & direct URL resolver
│   ├── recommendationEngine.ts   # Keyword extraction & recommendation
│   └── storageService.ts         # LocalStorage / IndexedDB wrapper
└── tests/                        # E2E & Unit Test Suites (Tiers 1-5, 198 tests)
    ├── setup.ts
    ├── tier1_features/
    ├── tier2_boundaries/
    ├── tier3_combinations/
    ├── tier4_scenarios/
    └── tier5_adversarial/
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Minimalist Bento Landing Page | Responsive bento grid to switch between U-TUBE & CineMorph | M1 | ORIGINAL_REQUEST §R4 |
| F02 | Routing & Shell Navigation | Seamless stateful switching between views | M1 | ORIGINAL_REQUEST §R4 |
| F03 | Test Infrastructure Setup | Vitest + Testing Library test runner harness | M1 | ORIGINAL_REQUEST §Acceptance |
| F04 | U-TUBE White & Red Theme | Distinctive YouTube-style UI layout | M2 | ORIGINAL_REQUEST §R1 |
| F05 | YouTube Search (Dynamic & Pagination) | Fast initial results with pagination and load-more | M2 | ORIGINAL_REQUEST §R1 |
| F06 | Direct YouTube Link Input | Instant playback from pasted URL | M2 | ORIGINAL_REQUEST §R1 |
| F07 | Channel Subscriptions | Subscribe/unsubscribe with local persistence | M2 | ORIGINAL_REQUEST §R1 |
| F08 | 4-Hour Cached Feed Refresh | Subscribed videos feed refreshing every 4h | M2 | ORIGINAL_REQUEST §R1 |
| F09 | 5-Video Keyword Recommendations | Natural keyword extraction from search history | M2 | ORIGINAL_REQUEST §R1 |
| F10 | Ad-Free Video Playback | Clean ad-free player wrapper | M2 | ORIGINAL_REQUEST §R1 |
| F11 | Local Persistence (U-TUBE) | LocalStorage/IndexedDB persistence of subs & history | M2 | ORIGINAL_REQUEST §R1 |
| F12 | Three.js 3D Theater Canvas | WebGL scene with responsive camera & scaling | M3 | ORIGINAL_REQUEST §R2 |
| F13 | Parametric Curved Screen | 3D screen mesh with adjustable radius & aspect ratio | M3 | ORIGINAL_REQUEST §R2 |
| F14 | 3D Seats & Velvet Curtains | Detailed theater geometry with instanced seating | M3 | ORIGINAL_REQUEST §R2 |
| F15 | Dynamic Ambilight Lighting | Screen edge luminescence reflection onto theater | M3 | ORIGINAL_REQUEST §R2 |
| F16 | 1.43:1 (IMAX GT) Ratio | Full height tall format clipping | M3 | ORIGINAL_REQUEST §R2 |
| F17 | 1.90:1 (IMAX Digital) Ratio | Standard IMAX format clipping | M3 | ORIGINAL_REQUEST §R2 |
| F18 | Original Aspect Ratio Mode | Unmodified native video aspect ratio | M3 | ORIGINAL_REQUEST §R2 |
| F19 | 4:3 Offline Fallback | Automatic fallback when offline without ML | M3 | ORIGINAL_REQUEST §R2 |
| F20 | Vintage Paper Theme & Props | Vintage paper styling with camera, reels, ticket printer | M3 | ORIGINAL_REQUEST §R2 |
| F21 | Local Video File Playback | Drag & drop or file picker MP4 playback in 3D screen | M3 | ORIGINAL_REQUEST §R2 |
| F22 | YouTube in CineMorph | Direct YouTube playback mapped onto 3D screen | M3 | ORIGINAL_REQUEST §R2 |
| F23 | Client-Side ML Frame Analysis | TensorFlow.js / lightweight real-time frame detection | M4 | ORIGINAL_REQUEST §R3 |
| F24 | Dynamic X/Y Panning Behind Aperture | Panning video texture behind fixed screen hole | M4 | ORIGINAL_REQUEST §R3 |
| F25 | Rule of Thirds Framing | Panning subject to 1/3 or 2/3 focal lines | M4 | ORIGINAL_REQUEST §R3 |
| F26 | Leading Lines Framing | Aligning converging lines to composition center | M4 | ORIGINAL_REQUEST §R3 |
| F27 | Frame-Within-a-Frame Rule | Nesting sub-frames for depth emphasis | M4 | ORIGINAL_REQUEST §R3 |
| F28 | Screen Direction Rule | Nose-room / gaze vector lead room panning | M4 | ORIGINAL_REQUEST §R3 |
| F29 | Smooth Motion Filter & Cut Reset | Damped spring-filter to eliminate jitter & instant scene cut | M4 | ORIGINAL_REQUEST §R3 |
| F30 | Real-Time Diagnostic HUD Overlay | Visualizer showing thirds grid, subjects, rays, telemetry | M4 | ORIGINAL_REQUEST §R3 |
| F31 | 10-Second Ticket Printer Animation | Diegetic printing animation before movie start | M5 | ORIGINAL_REQUEST §R4 |
| F32 | Heads-Up Pre-Processing | ML model warmup & initial 300 frames pre-scan during 10s | M5 | ORIGINAL_REQUEST §R4 |
| F33 | Web Audio Mechanical Sounds | Chiptune ticket printer audio effects | M5 | ORIGINAL_REQUEST §R4 |
| F34 | Saved Torn Tickets Progress | Progress save with timestamp, title, settings | M5 | ORIGINAL_REQUEST §R4 |
| F35 | 1-Click Ticket Resume | Clicking torn ticket resumes exact timestamp | M5 | ORIGINAL_REQUEST §R4 |
| F36 | Comprehensive E2E Verification (Tiers 1-4) | 100% pass on requirement-driven opaque-box test suite | M6 | ORIGINAL_REQUEST §Acceptance |
| F37 | Adversarial Hardening (Tier 5) | Edge cases, corruption recovery, stress testing | M6 | Project Pattern |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Foundation & Bento Landing Page | F01, F02, F03 (Deps, Vitest, Bento Grid, Navigation, Store Shell) | none | **DONE** |
| M2 | U-TUBE (Ad-Free Experience) | F04, F05, F06, F07, F08, F09, F10, F11 (Search, subs, 4h cache, 5 recs, ad-free player, persistence) | M1 | **DONE** |
| M3 | CineMorph 3D Theater Environment | F12, F13, F14, F15, F16, F17, F18, F19, F20, F21, F22 (Three.js 3D, curved screen, seats, curtains, ratios 1.43/1.90/Orig/4:3, vintage UI, local/YT media) | M1 | **DONE** |
| M4 | Advanced Framing Geometry ML | F23, F24, F25, F26, F27, F28, F29, F30 (TF.js ML, 4 framing rules, panning behind screen, spring filter, diagnostic HUD) | M3 | **DONE** |
| M5 | Vintage UX, Ticket Animation & State Recovery | F31, F32, F33, F34, F35 (Aperture-matched 10s animation, pre-processing, Web Audio, torn tickets, 1-click resume) | M3, M4 | **DONE** |
| M6 | Final Verification & Adversarial Hardening | F36, F37 (100% E2E test pass Tiers 1-4 + Tier 5 Adversarial Hardening + Forensic Audit) | M1, M2, M3, M4, M5 | **DONE** |
