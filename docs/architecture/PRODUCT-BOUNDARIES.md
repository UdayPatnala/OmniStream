# OmniStream — Product Boundary Rules

## The Master Rule

> **If changing U-Tube requires opening a CineMorph file, the architecture has failed.**
> **If changing CineMorph requires opening a U-Tube file, the architecture has failed.**

---

## Allowed Dependency Graph

```
Shell (src/app/ + src/shell/)
  ↓ may import
  U-Tube Capsule (src/products/u-tube/)
  CineMorph Capsule (src/products/cinemorph/)
  Core (src/core/)
  Shared (src/shared/)

U-Tube Capsule
  ↓ may import
  Core (src/core/)
  Shared (src/shared/)

CineMorph Capsule
  ↓ may import
  Core (src/core/)
  Shared (src/shared/)

Core
  ↓ may import
  Shared (src/shared/)
  [NEVER products]

Shared
  ↓ may import
  [NOTHING from above layers]
```

## Forbidden Imports (Hard Rules)

| From | To | Why |
|------|----|-----|
| `products/u-tube/**` | `products/cinemorph/**` | Product isolation |
| `products/cinemorph/**` | `products/u-tube/**` | Product isolation |
| `core/**` | `products/u-tube/**` | Core must not depend on products |
| `core/**` | `products/cinemorph/**` | Core must not depend on products |
| `shared/**` | `products/**` | Shared must be product-neutral |
| `shared/**` | `core/**` | Shared must be pure primitives |

## The Shell Exception

The shell (`src/app/`, `src/shell/`) is deliberately allowed to import both products.
This is not a violation — the shell is the orchestration layer.

```tsx
// CORRECT — shell imports from product public APIs
import { CineMorphLanding } from '../products/cinemorph';
import { Home } from '../products/u-tube';
```

## How to Import Across Domains

Always import from a product's **public API barrel** (`index.ts`), never from internal paths:

```ts
// CORRECT
import { useUTubeStore } from '@omnistream/utube/state/useUTubeStore';
import { useCineMorphStore } from '@omnistream/cinemorph/state/useCineMorphStore';
import { storageService } from '@omnistream/core/storage/storageService';

// WRONG — crossing product boundary
import { useCineMorphStore } from '../u-tube/../../../cinemorph/state/useCineMorphStore';
```

Internal product code may use relative imports within its own capsule:
```ts
// CORRECT — within cinemorph, relative imports are fine
import { mediaParser } from '../media/mediaParser';
import { useCineMorphStore } from '../state/useCineMorphStore';
```

---

## U-Tube Owns

- Everything related to the YouTube discovery and watch experience
- `pages/`: Home, Search, Watch, Subscriptions, Collections, History, Channel
- `components/`: VideoCard, UTubePlayer
- `state/`: useUTubeStore
- `services/`: YouTube API client, search, ranking, cache, playback pipeline
- `repositories/`: history, subscriptions, collections
- `types/`: Video, Channel, Playlist, SearchResult, HistoryItem, Collection
- `assets/`: U-Tube artwork

**U-Tube must not know CineMorph exists.**

## CineMorph Owns

- Everything related to the cinematic local-media theater experience
- `pages/`: CineMorphLanding, CineMorphTheater
- `components/`: CineMorphNav, CinemaLounge, landing components
- `state/`: useCineMorphStore
- `ticketing/`: TicketPrinterAnimation, useTicketStore (ticket printing ritual)
- `media/`: mediaParser, audioEngine, captionService, hybridRouter, posterService
- `theater/`: adaptiveCinemaEngine (theater geometry and LOD)
- `perception/`: CineMorph-specific CV/ML pipeline (omsPipeline, visionAnalyzer, ...)
- `services/`: orientationService
- `types/`: LocalMediaItem, CineMorphScreeningSession, MediaContainerAnalysis, FrameAspectRatio
- `assets/`: CineMorph artwork, theater media, lounge imagery

**CineMorph must not know U-Tube exists.**

## OmniStream Core Owns

- OMS infrastructure (capability resolver, model registry, perception normalizer)
- OMS transition service (cross-product experiential handoff)
- Generic storage abstraction
- Version registry
- Security/URL validation gateway
- Platform/device detection

**Core must not know which product is currently active.**

## OmniStream Shared Owns

- Product-neutral UI primitives: ErrorBoundary, Skeleton, CaptionOverlay, OMSLogo
- Generic utilities: extractYouTubeId, formatDuration, formatFileSize
- Design tokens (future)
- Accessibility helpers (future)

**Shared must contain zero product-specific semantics.**

---

## Asset Ownership

| Asset | Owner | Location |
|-------|-------|----------|
| `utube_artwork.png` | U-Tube | `products/u-tube/assets/` |
| `cinemorph.png` | CineMorph | `products/cinemorph/assets/` |
| `cinemorph_artwork.png` | CineMorph | `products/cinemorph/assets/` |
| `cinemorph_lounge_plate.jpg` | CineMorph | `products/cinemorph/assets/` |
| `Create_a_professional_cinemati.mp4` | CineMorph | `products/cinemorph/assets/` |
| `omn_logo.jpg` | OmniStream Core | `public/` (brand asset) |
| `aroh_seal.jpg` | AROH brand placement | `public/` (brand asset) |

Note: Assets remain in `public/` during Phase 1 migration for Vite static serving.
Ownership is documented here and in `ASSET-OWNERSHIP.md`. Physical migration is a separate task.

---

## State Ownership

| Store | Owner | Scope |
|-------|-------|-------|
| `useAppStore` | OmniStream Shell | Theme, rootLandingPreference, global app config |
| `useUTubeStore` | U-Tube | Feed, channels, subscriptions, search state |
| `useCineMorphStore` | CineMorph | Active session, media source, aperture, OMS state |
| `useTicketStore` | CineMorph / Ticketing | Ticket printing, saved tickets, resumption |

**CineMorph screening sessions must never be read from U-Tube code.**
**U-Tube feed/channel data must never be read from CineMorph code.**
