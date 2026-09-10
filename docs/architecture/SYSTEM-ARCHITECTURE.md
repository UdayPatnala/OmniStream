# OmniStream — System Architecture (OPCA v1.0)
## OmniStream Product Capsule Architecture

---

## Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │     OmniStream Application   │
                    │           Shell              │
                    │  (src/app/ + src/shell/)     │
                    └──────────┬──────────┬────────┘
                               │          │
                    ┌──────────▼──┐  ┌────▼───────────┐
                    │   U-Tube    │  │   CineMorph     │
                    │   Capsule   │  │   Capsule       │
                    │ src/products│  │ src/products    │
                    │  /u-tube/   │  │  /cinemorph/    │
                    └──────────┬──┘  └────┬────────────┘
                               │          │
                    ┌──────────▼──────────▼────────────┐
                    │           OmniStream Core         │
                    │          (src/core/)              │
                    │  oms/ | config/ | storage/        │
                    │  security/ | platform/            │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │        OmniStream Shared          │
                    │         (src/shared/)             │
                    │  ui/ | utils/ | design/           │
                    └───────────────────────────────────┘
```

---

## Source Directory Map

```
src/
│
├── app/                         ← OmniStream application shell entry
│   ├── App.tsx                  ← Route gateway; mounts both product capsules
│   ├── routes/                  ← Route definitions (future)
│   └── entry/                   ← main.tsx, index.html mounting
│
├── shell/                       ← Shared OmniStream shell experience
│   ├── Header/                  ← Global header + search + OMS state display
│   ├── Layout/                  ← Root layout wrapper
│   ├── Sidebar/                 ← Navigation sidebar (U-Tube nav items)
│   ├── BottomNav/               ← Mobile bottom navigation
│   ├── ThresholdPortal/         ← Cosmic dual-portal gateway (orchestrates both products)
│   ├── Bento/                   ← BentoGrid gateway (product selector)
│   └── Settings/                ← Global settings drawer
│
├── products/
│   │
│   ├── u-tube/                  ← U-Tube Product Capsule
│   │   ├── index.ts             ← PUBLIC API BOUNDARY (import from here only)
│   │   ├── pages/               ← Home, Search, Watch, Subscriptions, Collections, History, Channel
│   │   ├── components/          ← VideoCard, UTubePlayer
│   │   ├── state/               ← useUTubeStore (Zustand)
│   │   ├── services/            ← youtube.ts, youtubeService, recommendations, search, playback,
│   │   │                           ranking, cache, resolver, intentRouter, learning, queryIntelligence
│   │   ├── repositories/        ← historyRepository, subscriptionRepository, collectionRepository
│   │   ├── hooks/               ← U-Tube custom hooks
│   │   ├── types/               ← Video, Channel, Playlist, SearchResult, HistoryItem, Collection...
│   │   ├── assets/              ← U-Tube artwork (utube_artwork.png)
│   │   └── tests/               ← U-Tube test files
│   │
│   └── cinemorph/               ← CineMorph Product Capsule
│       ├── index.ts             ← PUBLIC API BOUNDARY (import from here only)
│       ├── pages/               ← CineMorphLanding, CineMorphTheater
│       ├── components/          ← CineMorphNav, CinemaLounge, landing components
│       ├── state/               ← useCineMorphStore (Zustand)
│       ├── ticketing/           ← TicketPrinterAnimation, useTicketStore
│       ├── media/               ← mediaParser, audioEngine, captionService, frameEngine,
│       │                           visualEngine, hybridRouter, posterService, posterIntelligence,
│       │                           localVideoAnalyzer, audioIntelligence, telemetryEngine
│       ├── theater/             ← adaptiveCinemaEngine (theater LOD + routing)
│       ├── perception/          ← OMS perception pipeline (CineMorph-owned CV/ML):
│       │                           omsPipeline, visionAnalyzer, compositionScorer, frameSampler,
│       │                           candidateGenerator, bestFrameSelector, aspectRatioDetector,
│       │                           sceneCutDetector, temporalController, motionAnalyzer,
│       │                           qualityAnalyzer, cinematographyRules, analysisOrchestrator
│       ├── services/            ← orientationService (CineMorph-specific)
│       ├── hooks/               ← CineMorph custom hooks
│       ├── types/               ← LocalMediaItem, CineMorphScreeningSession, MediaContainerAnalysis,
│       │                           FrameAspectRatio, DevicePerformanceProfile, ...
│       ├── assets/              ← cinemorph.png, cinemorph_artwork.png, lounge plate, theater video
│       └── tests/               ← CineMorph test files
│
├── core/                        ← OmniStream Cross-Product Infrastructure
│   ├── index.ts                 ← Core public API
│   ├── oms/                     ← OMS infrastructure (used by both products):
│   │   │                           blazeFaceAdapter, capabilityDetector, capabilityResolver,
│   │   │                           fallbackRouter, interfaces, modelRegistry, perceptionNormalizer,
│   │   │                           omsStandard, intentRouter, observabilityService,
│   │   │                           omsTransitionService (cross-product handoff)
│   │   └── index.ts
│   ├── config/                  ← versionRegistry.ts
│   ├── storage/                 ← storageService.ts (generic localStorage abstraction)
│   ├── security/                ← zeroTrustGateway.ts
│   └── platform/                ← Device detection, environment (future)
│
└── shared/                      ← Genuinely product-neutral primitives
    ├── index.ts                 ← Shared public API
    ├── ui/                      ← ErrorBoundary, Skeleton, CaptionOverlay, OMSLogo
    ├── utils/                   ← Generic utilities (extractYouTubeId, formatDuration, ...)
    ├── design/                  ← Design tokens, color system, typography (future)
    └── accessibility/           ← ARIA helpers, focus management (future)
```

---

## The OmniStream Naming Model

| Layer | What it is | Import alias |
|-------|------------|--------------|
| `src/app/` | Route gateway + entry | `@omnistream/shell` |
| `src/shell/` | Shared experience components | `@omnistream/shell` |
| `src/products/u-tube/` | U-Tube product capsule | `@omnistream/utube` |
| `src/products/cinemorph/` | CineMorph product capsule | `@omnistream/cinemorph` |
| `src/core/` | Cross-product infrastructure | `@omnistream/core` |
| `src/shared/` | Generic UI + utilities | `@omnistream/shared` |
