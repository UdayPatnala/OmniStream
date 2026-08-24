# OmniStream Test Infrastructure Architecture (`TEST_INFRA.md`)

## 1. Overview & Test Architecture

OmniStream features a requirement-driven, opaque-box E2E and integration test framework designed to validate all core subsystems across four rigorous test tiers:
- **Tier 1**: Core Feature Coverage (>= 5 tests per feature across 11 features, 65 test cases total)
- **Tier 2**: Boundary, Stress, & Negative Conditions (>= 4 tests per area across 6 areas, 29 test cases total)
- **Tier 3**: Cross-Feature Integration Pipelines (5 multi-subsystem pipelines, 5 test cases total)
- **Tier 4**: Real-World User Journeys (4 end-to-end scenarios, 4 test cases total)

**Total Test Suite**: 26 test files, 103 automated test cases, 100% passing.

---

## 2. Test Runner & Environment Setup

- **Test Runner**: [Vitest](https://vitest.dev/) (v4.1.11) configured with `@vitejs/plugin-react` in ES module mode.
- **DOM Environment**: `jsdom` with customized polyfills for Web Audio API (`AudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`, `StereoPannerNode`, `AnalyserNode`), HTML5 Canvas (`getContext('2d')`, `drawImage`, `getImageData`), HTML5 Media (`play`, `pause`, `load`), `ResizeObserver`, `IntersectionObserver`, and in-memory isolated `localStorage` / `sessionStorage`.
- **Assertion Framework**: Vitest `expect` + `@testing-library/jest-dom` matchers.
- **Path Resolution**: Direct alias resolution `@/` mapped to `<root>/src/` for clean imports.

### Configuration (`vitest.config.ts`)
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: ['src/tests/**/*.test.{ts,tsx}'],
  },
});
```

---

## 3. Test Directory Layout

```
src/tests/
├── setup.ts                                        # Global polyfills (AudioContext, Canvas, LocalStorage, MatchMedia)
├── helpers/
│   ├── fixtures.ts                                 # Shared mock data (videos, channels, local media)
│   └── contracts.ts                                # Opaque interface contract stores & MockFramingEngine
├── tier1-features/                                 # Tier 1: Feature Coverage (11 files, 65 tests)
│   ├── utube-search-top3.test.ts                   # F05: Search top 3 ranking
│   ├── direct-url-playback.test.ts                 # F06, F10: Direct URL playback & ID extraction
│   ├── subscriptions-persistence.test.ts           # F07, F11: Subscriptions repository & persistence
│   ├── cache-4hour-refresh.test.ts                 # F08: 4-hour cached feed refresh
│   ├── keyword-recommendations.test.ts             # F09: 5 keyword recommendation engine
│   ├── local-storage-persistence.test.ts           # F11: LocalStorage schema persistence
│   ├── three-theater-scaling.test.ts               # F12-F15, F20: 3D theater geometry & themes
│   ├── aspect-ratios-framing.test.ts               # F16-F19: 1.43:1, 1.90:1, original, 4:3 ratios
│   ├── ml-framing-geometry.test.ts                 # F23-F30: ML framing rules & telemetry HUD
│   ├── ticket-animation-heads-up.test.ts           # F31-F33: 10s ticket printer warmup & animation
│   └── ticket-save-resume.test.ts                  # F34-F35: Torn ticket save & 1-click resume
├── tier2-boundaries/                               # Tier 2: Boundary & Corner Cases (6 files, 29 tests)
│   ├── empty-malformed-search.test.ts              # Empty/whitespace/unicode/emoji searches
│   ├── corrupt-storage-payloads.test.ts            # Schema recovery & non-JSON payloads
│   ├── offline-network-cut.test.ts                 # Network disconnection & 4:3 aspect lock
│   ├── invalid-youtube-urls.test.ts                # Invalid URLs & player error code switching
│   ├── rapid-aspect-ratio-switches.test.ts         # Fast aspect switching & seek deadzones
│   └── missing-local-video-metadata.test.ts        # Zero-duration, canvas faults & route fallbacks
├── tier3-combinations/                             # Tier 3: Cross-Feature Integration (5 files, 5 tests)
│   ├── search-subscribe-recommendations-ticket.test.ts # Search -> Sub -> Recs -> Ticket -> Resume
│   ├── offline-cut-during-ticket-animation.test.ts     # Offline cut during 10s animation -> 4:3 lock
│   ├── local-file-ml-aspect-ratio-ticket.test.ts       # Local file -> ML framing -> 1.90:1 -> Ticket
│   ├── youtube-url-channel-theater-theme.test.ts       # URL -> Sub matching -> Theater theme
│   └── search-history-recommendations-collections-queue.test.ts # History -> Recs -> Collection -> Queue
└── tier4-journeys/                                 # Tier 4: Real-World User Journeys (4 files, 4 tests)
    ├── journey1-discovery-onboarding.test.ts       # J1: First-Time User Onboarding & Discovery
    ├── journey2-cinemorph-movie-night.test.ts      # J2: Immersive CineMorph Movie Night
    ├── journey3-airgapped-offline-playback.test.ts # J3: Airgapped & Offline Resilient Playback
    └── journey4-creator-framing-audit.test.ts      # J4: Power Creator Framing & Telemetry Audit
```

---

## 4. Feature Coverage Matrix

| Feature ID | Feature Name | Test File | Test Cases |
|---|---|---|---|
| **F05** | U-TUBE Search Top 3 | `tier1-features/utube-search-top3.test.ts` | 6 tests |
| **F06, F10** | Direct URL Playback | `tier1-features/direct-url-playback.test.ts` | 7 tests |
| **F07, F11** | Subscriptions & Persistence | `tier1-features/subscriptions-persistence.test.ts` | 6 tests |
| **F08** | 4-Hour Cached Feed Refresh | `tier1-features/cache-4hour-refresh.test.ts` | 6 tests |
| **F09** | 5 Keyword Recommendations | `tier1-features/keyword-recommendations.test.ts` | 6 tests |
| **F11** | LocalStorage Persistence | `tier1-features/local-storage-persistence.test.ts` | 6 tests |
| **F12-F15, F20** | 3D Theater Scaling & Themes | `tier1-features/three-theater-scaling.test.ts` | 6 tests |
| **F16-F19** | Aspect Ratios & Framing | `tier1-features/aspect-ratios-framing.test.ts` | 6 tests |
| **F23-F30** | ML Framing & Telemetry HUD | `tier1-features/ml-framing-geometry.test.ts` | 6 tests |
| **F31-F33** | 10s Ticket Animation & Warmup | `tier1-features/ticket-animation-heads-up.test.ts` | 5 tests |
| **F34-F35** | Torn Ticket Save & Resume | `tier1-features/ticket-save-resume.test.ts` | 5 tests |
| **Boundary 1** | Empty & Malformed Search | `tier2-boundaries/empty-malformed-search.test.ts` | 6 tests |
| **Boundary 2** | Corrupt Storage Payloads | `tier2-boundaries/corrupt-storage-payloads.test.ts` | 5 tests |
| **Boundary 3** | Offline Mode & Network Cut | `tier2-boundaries/offline-network-cut.test.ts` | 5 tests |
| **Boundary 4** | Invalid YouTube URLs | `tier2-boundaries/invalid-youtube-urls.test.ts` | 5 tests |
| **Boundary 5** | Rapid Aspect Switching | `tier2-boundaries/rapid-aspect-ratio-switches.test.ts` | 4 tests |
| **Boundary 6** | Missing Metadata & Faults | `tier2-boundaries/missing-local-video-metadata.test.ts` | 4 tests |
| **Pipeline 1** | Search -> Sub -> Recs -> Ticket | `tier3-combinations/search-subscribe-recommendations-ticket.test.ts` | 1 test |
| **Pipeline 2** | Animation Cut -> 4:3 Lock | `tier3-combinations/offline-cut-during-ticket-animation.test.ts` | 1 test |
| **Pipeline 3** | Local ML -> 1.90:1 -> Ticket | `tier3-combinations/local-file-ml-aspect-ratio-ticket.test.ts` | 1 test |
| **Pipeline 4** | YouTube Link -> Sub Match -> Theme | `tier3-combinations/youtube-url-channel-theater-theme.test.ts` | 1 test |
| **Pipeline 5** | Search History -> Playlist Queue | `tier3-combinations/search-history-recommendations-collections-queue.test.ts` | 1 test |
| **Journey 1** | First-Time User Onboarding | `tier4-journeys/journey1-discovery-onboarding.test.ts` | 1 test |
| **Journey 2** | CineMorph Movie Night | `tier4-journeys/journey2-cinemorph-movie-night.test.ts` | 1 test |
| **Journey 3** | Airgapped Resilient Playback | `tier4-journeys/journey3-airgapped-offline-playback.test.ts` | 1 test |
| **Journey 4** | Creator Framing & HUD Audit | `tier4-journeys/journey4-creator-framing-audit.test.ts` | 1 test |

---

## 5. Execution Commands

```bash
# Run all 26 test suites (Tiers 1-4)
npm test

# Run Vitest in watch mode
npm run test:watch

# Run a specific tier
npx vitest run src/tests/tier1-features/
npx vitest run src/tests/tier2-boundaries/
npx vitest run src/tests/tier3-combinations/
npx vitest run src/tests/tier4-journeys/

# Run a single test file
npx vitest run src/tests/tier1-features/utube-search-top3.test.ts
```
