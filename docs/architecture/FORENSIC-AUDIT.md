# OmniStream — Forensic Architecture Audit
## Audit Date: 2026-09-09  |  Baseline: v1.8.5

---

## 1. Current Source Structure (Pre-Migration)

```
src/
  App.tsx               ← Shell — imports both products (intentional)
  store.ts              ← Mixed: AppStore config + re-exports of product stores
  types.ts              ← Mixed: U-Tube types (lines 1-229) + CineMorph types (lines 231-379)
  index.css             ← Global CSS — mostly shared, some OmniStream-specific
  main.tsx              ← App entry point
  components/
    Header.tsx           ← Shell — imports lib/youtube.ts (U-Tube coupling; acceptable at shell)
    Layout.tsx           ← Shell generic
    Sidebar.tsx          ← Shell — contains U-Tube navigation items
    BottomNav.tsx        ← Shell generic
    ErrorBoundary.tsx    ← SHARED — generic
    Skeleton.tsx         ← SHARED — generic
    VideoCard.tsx        ← U-TUBE
    bento/               ← SHELL gateway — orchestrates both products
    cinemorph/landing/   ← CINEMORPH landing components
    common/              ← SHARED/OMS (CaptionOverlay, OMSLogo)
    player/UTubePlayer   ← U-TUBE
    settings/            ← SHELL (global settings)
    threshold/           ← SHELL gateway — cosmic dual-portal
    ux/Ticket*           ← CINEMORPH ticketing
  pages/
    Home, Search, Watch, Subscriptions, Collections, History, Channel  ← U-TUBE
    CineMorphLanding, CineMorphTheater                                  ← CINEMORPH
    Settings                                                            ← SHELL
    RootLanding                                                         ← SHELL
  state/
    useUTubeStore.ts     ← U-TUBE — Zustand store
    useCineMorphStore.ts ← CINEMORPH — Zustand store
    useTicketStore.ts    ← CINEMORPH — ticketing
  lib/
    youtube.ts           ← U-TUBE — YouTube Data API v3 client
    recommendations.ts   ← U-TUBE — recommendation engine
    utils.ts             ← SHARED — generic utilities
    cinemorph.ts         ← CINEMORPH — main entry
    cinemorph/           ← CINEMORPH — media engine (15 files)
      oms/               ← CINEMORPH perception pipeline (omsPipeline, visionAnalyzer...)
      videoIntelligence/ ← CINEMORPH CV/ML framing
    oms/                 ← CORE OMS infrastructure (capability resolver, model registry...)
    domain/chapters.ts   ← U-TUBE — chapter parsing
    repositories/        ← U-TUBE — history, subscriptions, collections
    security/            ← CORE — zero trust gateway
    services/            ← MIXED (11 U-Tube, 3 Core/OMS, 1 CineMorph)
  services/
    omsTransitionService ← CORE OMS — cross-product handoff
    storageService       ← CORE — generic storage
    youtubeService       ← U-TUBE — YouTube channel metadata
  config/
    versionRegistry.ts   ← CORE — version tracking
  test/ + tests/         ← MIXED — tests for both products
```

---

## 2. Detected Problems

### Boundary Violations
| Violation | Severity | Notes |
|-----------|----------|-------|
| `lib/oms/` in same flat lib as `lib/youtube.ts` | Medium | OMS infrastructure co-located with U-Tube |
| `lib/cinemorph/oms/` (perception pipeline) unnamed | Low | No clear "this is CineMorph perception" name |
| `lib/services/` mixed ownership (11 U-Tube + 3 OMS + 1 CineMorph) | High | No way to know what belongs to whom |
| `store.ts` re-exports product stores | Medium | Creates ambiguous import point |
| `types.ts` mixes U-Tube and CineMorph types | High | Impossible to tree-shake or own separately |
| No path aliases | Medium | Relative `../../` imports obscure domain boundaries |
| No boundary enforcement tooling | High | Nothing prevents future cross-product imports |

### Asset Problems
| Asset | Current Location | Actual Owner |
|-------|-----------------|--------------|
| `utube_artwork.png` | `public/` | U-Tube |
| `cinemorph.png` | `public/` | CineMorph |
| `cinemorph_artwork.png` | `public/` | CineMorph |
| `cinemorph_lounge_plate.jpg` | `public/` | CineMorph |
| `Create_a_professional_cinemati.mp4` | `public/` | CineMorph |
| `omn_logo.jpg` | `public/` | OmniStream Core |
| `aroh_seal.jpg` | `public/` | Brand/AROH placement |

### Acceptable Shell Couplings (NOT violations)
- `App.tsx` importing both `CineMorphLanding` and `Home` — intentional shell orchestration
- `Header.tsx` importing `lib/youtube.ts` search suggestions — shell-level feature
- `BentoGrid.tsx` importing both `useCineMorphStore` and `useUTubeStore` — shell gateway
- `ThresholdPortal.tsx` importing `useCineMorphStore` + OMS — shell gateway

---

## 3. Migration Risks

| Risk | Mitigation |
|------|-----------|
| Import path breakage | All files COPIED first; originals preserved until build verified |
| store.ts refactor | Q1-A: minimal refactor, data migration deferred |
| Public assets | Not physically moved; ownership documented only |
| CineMorph v1.8.5 regression | Full test suite run after each major phase |

---

## 4. Files Safe to Classify as Shared/Core
- `lib/utils.ts` — `extractYouTubeId`, generic formatters; no product-specific logic
- `services/storageService.ts` — localStorage abstraction, no product semantics
- `config/versionRegistry.ts` — version tracking, no product semantics
- `lib/security/zeroTrustGateway.ts` — URL validation, no product semantics
- `components/ErrorBoundary.tsx` — generic React error boundary
- `components/Skeleton.tsx` — loading placeholder
- `components/common/CaptionOverlay.tsx` — used by both UTubePlayer AND CineMorphTheater
- `components/common/OMSLogo.tsx` — OMS brand mark (cross-product)
