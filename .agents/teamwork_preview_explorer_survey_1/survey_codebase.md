# OmniStream Codebase Survey & Technical Foundation Report

**Author**: Explorer 1 (Teamwork Preview Survey Phase)  
**Date**: 2026-08-23  
**Working Directory**: `d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\teamwork_preview_explorer_survey_1`  
**Workspace Root**: `d:\PROJECT\AROH Open Source\Products\OmniStream`  
**Authoritative Specification**: `d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

OmniStream is a dual-paradigm multimedia web application designed to merge:
1. **U-TUBE**: A clean, ad-free YouTube personal client.
2. **CineMorph**: An immersive 3D theatrical video experience player (desktop-focused) featuring dynamic client-side ML framing geometry for local media and YouTube streams.

### Current Build & Compile Status
- **TypeScript Typecheck (`tsc --noEmit`)**: Passes cleanly with 0 errors (Node v25.8.1, TypeScript ~5.8.2).
- **Production Build (`npm run build`)**: Passes cleanly (Vite 6.2.3 builds SPA bundle + esbuild compiles `server.ts` to `dist/server.cjs`).
- **Development Server**: Powered by Express + tsx + Vite middleware mode (`server.ts`).

### Core Findings & Major Gaps Against `ORIGINAL_REQUEST.md`
While the existing application has a rich set of services (Zustand state store, YouTube API client, oEmbed proxy, Web Audio DSP), several **fundamental requirements from the original project specification are missing or require significant re-alignment**:
1. **No Three.js 3D Environment**: `three` is not installed in `package.json`. The current CineMorph player uses 2D/2.5D CSS gradient approximations rather than a real Three.js WebGL canvas with 3D curved screens, 3D seats, and 3D velvet curtains.
2. **No TensorFlow.js / Real Framing ML**: `@tensorflow/tfjs` is not installed. Frame analysis currently relies on simple 2D canvas pixel luminance averaging in `localVideoAnalyzer.ts` without true subject detection or the four required framing geometry rules (*Rule of thirds*, *Leading lines*, *Frame-within-a-frame*, *Screen direction*). No visual diagnostic overlay exists.
3. **Theme & Styling Discrepancy**: The current UI uses a cyberpunk / dark neon aesthetic (`#030208`, cyan, indigo), whereas `ORIGINAL_REQUEST.md` specifically requires:
   - U-TUBE: **White and red theme** (classic YouTube clone layout).
   - CineMorph: **Vintage paper theme with bright colors and theater props (camera, reels, ticket printer)**.
4. **Search Results Count**: `Search.tsx` displays full paginated grids (12–50 items) instead of the strictly required **top 3 relevant results**.
5. **Home Feed & Recommendations**: Currently displays 10 generic recommendations; requires **5 recommendations based on keyword extraction from recent searches** and **latest videos from subscribed channels with a 4-hour refresh cycle**.
6. **UX & State Management Gaps**: Missing the **10-second ticket printing animation** (which acts as a pre-processing loading screen for client-side ML heads-up framing) and interactive **torn tickets** for local movie progress resumption.
7. **Testing Framework**: No test runner (`vitest`, `jest`, `@testing-library/react`) or test files exist in the repository.

---

## 2. Codebase Inventory & Project Structure

### Root Configuration & Entry Points
- `package.json`: Main project manifest. Contains dependencies for React 19, Vite 6, Tailwind CSS 4, Motion, Lucide, Express, tsx, Zustand.
- `tsconfig.json`: Target ES2022, bundler module resolution, `@/*` alias mapping to `./*`.
- `vite.config.ts`: Configured with `@vitejs/plugin-react`, `@tailwindcss/vite`, `@` alias, manual chunking for vendor libraries.
- `server.ts`: Express development and production server. Handles `/health`, `/api/suggest` (Google suggest proxy), `/api/oembed` (YouTube oEmbed metadata fetcher), and SPA static fallback.
- `index.html`: Main HTML entry with `<div id="root">` and script tag referencing `/src/main.tsx`.
- `v1/`: Legacy snapshot of earlier "utube" single-page iteration.

### Source File Breakdown (`src/`)

```
src/
├── App.tsx                               # Master router with code-split lazy routes
├── main.tsx                              # React 19 root mount with StrictMode & ErrorBoundary
├── index.css                             # Tailwind CSS 4 setup and global utility classes
├── store.ts                              # Master Zustand store with localStorage persistence
├── types.ts                              # Core domain types (Video, Channel, HistoryItem, etc.)
├── components/
│   ├── BottomNav.tsx                     # Mobile navigation bar
│   ├── CineMorphAIStudio.tsx             # AI Copilot, summary, script, and prompt panel
│   ├── CineMorphAudioStudioModal.tsx     # Web Audio 5-band EQ & DSP modal
│   ├── CineMorphTopBar.tsx               # CineMorph viewport & mode controls
│   ├── ErrorBoundary.tsx                 # React class component error boundary
│   ├── GlobalPlayer.tsx                  # Mini-player & persistent video frame
│   ├── Header.tsx                        # Top navigation header with search & suggestions
│   ├── Layout.tsx                        # Adaptive app shell & route layout container
│   ├── Sidebar.tsx                       # Desktop sidebar navigation
│   ├── Skeleton.tsx                      # Video card loading skeleton
│   └── VideoCard.tsx                     # Standard YouTube-style video card
├── pages/
│   ├── Channel.tsx                       # Creator channel overview and uploads
│   ├── CineMorphLanding.tsx              # CineMorph entry, showcase & local file loader
│   ├── CineMorphTheater.tsx              # 65KB monolithic 2.5D virtual theater page
│   ├── Collections.tsx                   # User-created custom playlists/collections
│   ├── History.tsx                       # Watch history & viewing statistics
│   ├── Home.tsx                          # Main YouTube feed (trending, categories)
│   ├── RootLanding.tsx                   # Gateway landing page (U-Tube vs CineMorph)
│   ├── Search.tsx                        # Search results page
│   ├── Settings.tsx                      # User preferences & hardware profile toggles
│   ├── Subscriptions.tsx                 # Feed of subscribed channels
│   └── Watch.tsx                         # Standard 2D video watch page
└── lib/
    ├── cinemorph.ts                      # Re-exports cinemorph sub-modules + AI prompt mocks
    ├── recommendations.ts                # Keyword extraction & recommendation scoring
    ├── utils.ts                          # Formatters (views, relative time, YouTube URL extractor)
    ├── youtube.ts                        # YouTube Data API client & fallback datasets
    ├── ai/
    │   ├── hybridPipeline.ts             # Saliency grid weighted average & temporal smoothing
    │   └── modelRegistry.ts              # Local metadata registry of active AI pipelines
    ├── cinemorph/
    │   ├── adaptiveCinemaEngine.ts       # Temporal smoothing, deadband hysteresis & crop calculations
    │   ├── audioEngine.ts                # Web Audio API 5-band BiquadFilter equalizer
    │   ├── frameEngine.ts                # CSS transform & aspect ratio matrix calculations
    │   ├── hybridRouter.ts               # Hardware capability classifier & LOD selector
    │   ├── index.ts                      # Barrel re-export
    │   ├── localVideoAnalyzer.ts         # HTML5 Canvas 2D frame luminance/contrast extractor
    │   ├── telemetryEngine.ts            # Playback FPS & latency monitor
    │   └── visualEngine.ts               # Ambient glow & color extraction helpers
    ├── domain/
    │   └── chapters.ts                   # Description chapter timestamp regex parser
    ├── repositories/
    │   ├── collectionRepository.ts       # LocalStorage CRUD for collections
    │   ├── historyRepository.ts          # LocalStorage CRUD for watch history
    │   └── subscriptionRepository.ts     # LocalStorage CRUD for subscriptions
    ├── security/
    │   └── zeroTrustGateway.ts           # URL validation & local sanitization
    └── services/
        ├── cacheManager.ts               # In-memory and localStorage cache with TTL
        ├── cacheService.ts               # Generic key-value cache
        ├── errorRecoveryManager.ts       # Graceful playback error recovery
        ├── intentRouter.ts               # Query intent classifier (e.g. search vs command)
        ├── learningEngine.ts             # Adaptive playback preference tracking
        ├── observabilityService.ts       # Event logger & metric reporter
        ├── playbackService.ts            # Autonomous YouTube search & playback pipeline
        ├── playbackStateMachine.ts       # State machine (IDLE, SEARCHING, READY, PLAYING, ERROR)
        ├── playerAdapter.ts              # ReactPlayer / HTMLVideoElement abstraction
        ├── queryIntelligence.ts          # Search query keyword expansion
        ├── rankingEngine.ts              # Video candidate scoring & ranking
        ├── searchService.ts              # Search orchestration service
        └── videoResolver.ts              # Embeddability & playback resolution checker
```

---

## 3. Requirement-by-Requirement Detailed Audit

### R1. U-TUBE (Ad-Free YouTube Experience)

| Requirement Spec | Current Implementation Status | Gap / Concrete Action Needed |
| :--- | :--- | :--- |
| **Theme & Layout**: React-based YouTube clone layout with **white and red theme**. | Current default is dark `#0f0f0f` with purple/indigo accents. | Implement primary classic YouTube white (`#FFFFFF`) and red (`#FF0000`) theme as the core U-TUBE aesthetic. |
| **Search**: Allow searching, displaying **exactly top 3 results**. | `Search.tsx` displays full grid of 12-50 items. | Filter/slice search results to display exactly the top 3 relevant YouTube results with high-fidelity cards. |
| **Direct Links**: Paste direct YouTube links. | Supported in `Header.tsx` and `CineMorphLanding.tsx` via `extractYouTubeId()`. | Working. Ensure direct URL pasting in U-TUBE search directly resolves and opens the video. |
| **Channel Subscriptions**: Subscribe to channels, stored locally. | Implemented in `src/store.ts` (`subscriptions: Channel[]`) with localStorage. | Working. Channel subscription UI in `Channel.tsx` and `Watch.tsx` functions properly. |
| **Home Subscribed Feed**: Latest videos from subscribed channels, **refreshing every 4 hours**. | Home page currently has Continue Watching, Recommended, Most Rewatched, Trending. No 4h timer. | Add dedicated "Subscriptions Feed" section to `Home.tsx` with a 4-hour cache TTL / timestamp check. |
| **Home Recommendations**: Recommend **5 videos based on keyword extraction from recent searches**. | `recommendations.ts` extracts keywords from history & searches, but returns 10 items in `Home.tsx`. | Restrict recommended videos to exactly 5 high-relevance items prioritized by recent search keywords. |
| **Ad-Free & Local Storage**: All playback ad-free, data in LocalStorage/IndexedDB with no backend. | Standard ReactPlayer / clean iframe, zero backend DB. | Working. Fully client-side persisted. |

### R2. CineMorph (Desktop Theatrical Experience)

| Requirement Spec | Current Implementation Status | Gap / Concrete Action Needed |
| :--- | :--- | :--- |
| **3D Environment Rendering**: Desktop-only immersive player using **Three.js** for 3D environment rendering (seats, curtains, curved screens). | Currently implemented with 2D/2.5D CSS divs and gradients in `CineMorphTheater.tsx`. `three` is **not installed**. | Install `three` + `@types/three`. Build a true WebGL 3D Theater scene with a curved cylindrical screen geometry, plush 3D theater seats, and draped 3D velvet curtains. |
| **Aspect Ratio Support**: 1.43:1 (IMAX GT), 1.90:1 (IMAX), and original aspect ratios. | `types.ts` defines ratios; CSS scale is used. | Map video textures to the 3D curved screen mesh with precise UV mapping for 1.43:1, 1.90:1, and original ratios. |
| **Vintage Paper Theme & Props**: UI with **vintage paper theme, bright colors, and theater props (camera, reels, ticket printer)**. | Current theme is high-tech cyberpunk dark (`#030208`, cyan, purple). | Redesign CineMorph UI with textured parchment/paper backgrounds (`#F4ECD8`, `#EED9B3`), bright retro cinema colors (crimson, gold, brass), and SVG/3D theater props (film camera, spinning film reels, ticket printer). |
| **Media Source Support**: Support YouTube links and local video files (focus on local files). | Local file blob URL loading is partially implemented in `CineMorphLanding.tsx`. | Bind local MP4/WebM video element to `THREE.VideoTexture` to render directly onto the 3D screen mesh. |
| **Offline Fallback**: Fallback to 4:3 cropped ratio without live ML calculations when offline. | `hybridRouter.ts` flags offline state, but doesn't force 4:3 crop in player. | Connect `navigator.onLine` / offline event to automatically switch theater screen to 4:3 crop mode and bypass ML calculations. |

### R3. Advanced Framing Geometry (Client-Side ML)

| Requirement Spec | Current Implementation Status | Gap / Concrete Action Needed |
| :--- | :--- | :--- |
| **Client-Side Real-Time ML**: Run client-side ML model (e.g. TensorFlow.js) on local video frames. | `@tensorflow/tfjs` is **not installed**. Current analysis uses simple pixel brightness averaging in `localVideoAnalyzer.ts`. | Install `@tensorflow/tfjs` (or lightweight WebGL ML pipeline). Process video frames in real-time on a hidden canvas. |
| **Advanced Framing Geometry Rules**: Dynamic pan behind fixed hole based on: 1. Frame-within-a-frame, 2. Leading lines, 3. Rule of thirds, 4. Screen direction. | `adaptiveCinemaEngine.ts` only applies fixed static offsets based on aspect ratio enum. | Implement algorithmic framing engine that evaluates: <br>1. *Rule of Thirds* (align dominant subject to grid intersections)<br>2. *Leading Lines* (detect perspective angle & edge lines)<br>3. *Frame-within-a-frame* (detect interior framing portals)<br>4. *Screen Direction* (track horizontal subject motion velocity and add lead room). |
| **Diagnostic Overlay / Test**: Visual overlay or programmatic test confirming ML runs on video frames, identifies subjects, and outputs dynamic X/Y panning coordinates. | No diagnostic overlay exists. | Implement an interactive Heads-Up Diagnostic Overlay on the theater screen rendering detected bounding boxes, saliency centroid, rule vectors, and real-time X/Y panning coordinates. |

### R4. UX and State Management

| Requirement Spec | Current Implementation Status | Gap / Concrete Action Needed |
| :--- | :--- | :--- |
| **10-Second Ticket Printing Animation**: 10-second ticket printer animation acting as loading screen for ML pre-processing. | Intro bumper exists in `CineMorphTheater.tsx` but is an instant 1s transition without ticket printer or pre-processing. | Implement an animated mechanical ticket printer component with a 10-second countdown, animated paper dispensing, ticket tearing sound/visuals, while ML model pre-processes initial video frames. |
| **Torn Ticket Resume Mechanism**: Save movie progress locally as tickets; click torn ticket to resume at exact timestamp. | History saves timestamp in Zustand store, but UI is a generic table. | Implement visual "Torn Ticket" cards in the UI displaying movie title, timestamp, perforation edge, and click-to-resume handler. |
| **Bento-Style Landing Page**: Main minimalist bento-style landing page to navigate between U-TUBE and CineMorph. | `RootLanding.tsx` has a 2-card layout. | Refine `RootLanding.tsx` into a true minimalist Bento Grid featuring modular tiles: U-TUBE Portal, CineMorph Theater, Saved Torn Tickets, Quick Drop Media, and System Stats. |

---

## 4. Dependencies & Runtime Environment Assessment

### System Environment
- **Node.js**: `v25.8.1`
- **npm**: `11.11.0`
- **OS**: Windows (PowerShell)

### Existing Dependencies (`package.json`)
```json
{
  "dependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.4",
    "autoprefixer": "^10.4.21",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "dotenv": "^17.2.3",
    "esbuild": "^0.25.0",
    "express": "^4.21.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-player": "^3.4.0",
    "react-router-dom": "^7.18.1",
    "tailwind-merge": "^3.6.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3",
    "zustand": "^5.0.14"
  }
}
```

### Required Additional Packages
1. **3D Graphics**:
   - `three`: `^0.170.0`
   - `@types/three`: `^0.170.0`
2. **Machine Learning / Computer Vision**:
   - `@tensorflow/tfjs`: `^4.22.0` (or `@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`, `@tensorflow-models/coco-ssd` / `@tensorflow-models/pose-detection`)
3. **Testing Suite**:
   - `vitest`: `^3.0.0`
   - `@testing-library/react`: `^16.0.0`
   - `@testing-library/jest-dom`: `^6.6.0`
   - `jsdom`: `^26.0.0`
   - `canvas`: (or canvas mock for headless test environments)

---

## 5. Build and Test Strategy

### Unit & Integration Test Targets
1. **U-TUBE Service Tests**:
   - Top 3 search result truncation and fallback handling.
   - 5-video search keyword recommendation algorithm.
   - 4-hour subscription refresh timestamp logic.
   - LocalStorage persistence and state rehydration.
2. **Advanced Framing Geometry ML Tests**:
   - Rule of Thirds calculation accuracy.
   - Leading Lines vector extraction.
   - Frame-within-a-frame boundary detection.
   - Screen direction motion vector velocity and lookahead panning.
   - Dynamic X/Y coordinate normalization.
3. **CineMorph 3D & UX Tests**:
   - 10-second ticket printing timer and state transition.
   - Torn ticket timestamp serialization and click-to-resume.
   - Offline 4:3 fallback trigger upon network disconnection.
   - Three.js scene creation and aspect ratio geometry calculation.

### E2E / Diagnostic Verification
- Diagnostic overlay test: Mounts local video, processes frames through ML pipeline, confirms output X/Y offsets update in real-time.
- Browser test run via Vitest / Playwright.

---

## 6. Technical Debt & Observations

1. **Legacy `v1/` Directory**: A duplicate older project snapshot resides in `v1/` taking up space and creating potential confusion. The root codebase is the active build target.
2. **Monolithic `CineMorphTheater.tsx` (65KB)**: The theater page currently contains thousands of lines mixing state, controls, UI drawers, mock AI chats, and DOM rendering. Breaking this down into modular components (`TheaterCanvas3D`, `TicketPrinterModal`, `DiagnosticOverlay`, `TornTicketDeck`, `TheaterControls`) will improve maintainability and testability.
3. **Mock AI Strings**: `askCineMorphAI` and `generateAISummary` use static string templates. These should be structured cleanly as deterministic offline heuristic engines.
4. **CSS-Only 2.5D Seats vs Three.js 3D**: Current seating is rendered as 10 SVG-style HTML divs at the bottom of the screen. Replacing this with a true Three.js WebGL canvas will satisfy the core acceptance criteria.

---

## 7. Recommendations for Next Phases

1. **Phase 1 (Architecture & Dependencies)**:
   - Install `three`, `@types/three`, `@tensorflow/tfjs`, `vitest`, `@testing-library/react`, `jsdom`.
   - Configure `vite.config.ts` and `tsconfig.json` for Vitest and WebGL/WASM assets.
2. **Phase 2 (U-TUBE Refactor)**:
   - Update theme to White and Red YouTube aesthetic.
   - Restrict search view to exactly top 3 results.
   - Update Home page with 4-hour subscription refresh feed and 5 keyword-based recommendations.
3. **Phase 3 (CineMorph Three.js 3D & Vintage Paper Theme)**:
   - Implement Three.js 3D virtual theater with curved screen, 3D seats, and 3D velvet curtains.
   - Support 1.43:1 (IMAX GT), 1.90:1 (IMAX), and original aspect ratios.
   - Apply Vintage Paper theme with brass/wood theater props (camera, reels, ticket printer).
   - Implement 4:3 offline fallback.
4. **Phase 4 (Advanced Framing Geometry & Diagnostic Overlay)**:
   - Implement TensorFlow.js ML frame processing on local files.
   - Implement the 4 framing rules with dynamic X/Y panning.
   - Build real-time diagnostic overlay showing bounding boxes, vectors, and coordinates.
5. **Phase 5 (UX, 10s Ticket Printer & Torn Tickets)**:
   - Build 10-second ticket printer animation with ML pre-processing heads-up loading.
   - Build torn tickets UI for local movie progress save/resume.
   - Refine Bento-style landing page.
6. **Phase 6 (Testing & Verification)**:
   - Write and execute complete Vitest test suite.
