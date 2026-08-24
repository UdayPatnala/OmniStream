# OmniStream Baseline Execution Report

**Date/Time**: 2026-08-24T21:15:30+05:30  
**Agent**: `worker_baseline_2`  
**Working Directory**: `d:\PROJECT\AROH Open Source\Products\OmniStream`  
**Execution Environment**: Windows (PowerShell), Node.js v22.x, Vitest v4.1.11, Vite v6.2.3/v6.4.3, TypeScript 5.8.2  

---

## Executive Summary

| Verification Step | Command | Exit Code | Status | Key Metric / Result Summary |
| :--- | :--- | :--- | :--- | :--- |
| **1. TypeScript Compilation** | `npx tsc --noEmit` | `1` | **FAIL** | 5 compilation errors across 2 files (`Sidebar.tsx`, `CineMorphLanding.tsx`) |
| **2. Test Suite Execution** | `npx vitest run` | `1` | **FAIL** | 44 test files (39 passed, 5 failed); 198 tests (192 passed, 6 failed) |
| **3. Client Production Build** | `npx vite build` | `0` | **PASS** | 2577 modules transformed in 11.12s; HTML, CSS, JS chunks generated |
| **3b. Server Production Build** | `npx esbuild server.ts ...` | `0` | **PASS** | `dist/server.cjs` (5.5 kB) built in 7ms |
| **4. Backend Routing & APIs** | Node Express Route Check | `0` | **PASS** | `/health` (200), `/api/suggest` (200), `/api/oembed` (200/400), CORS (200) |

---

## 1. TypeScript Compilation Check (`npx tsc --noEmit`)

### Execution Details
- **Command**: `npx tsc --noEmit`
- **Exit Code**: `1`
- **Total Errors**: 5

### Verbatim Compiler Output
```
src/components/Sidebar.tsx(78,55): error TS2304: Cannot find name 'isActive'.
src/components/Sidebar.tsx(102,55): error TS2304: Cannot find name 'isActive'.
src/components/Sidebar.tsx(153,55): error TS2304: Cannot find name 'isActive'.
src/components/Sidebar.tsx(169,52): error TS2304: Cannot find name 'isActive'.
src/pages/CineMorphLanding.tsx(289,32): error TS2769: No overload matches this call.
  Overload 1 of 2, '(to: To, options?: NavigateOptions): void | Promise<void>', gave the following error.
    Argument of type 'RegExp' is not assignable to parameter of type 'To'.
  Overload 2 of 2, '(delta: number): void | Promise<void>', gave the following error.
    Argument of type 'RegExp' is not assignable to parameter of type 'number'.
```

### Root Cause Analysis
1. **`src/components/Sidebar.tsx` (Lines 78, 102, 153, 169)**:
   - Inside `<NavLink to={item.to} className={({ isActive }) => ...}>`, child JSX elements (e.g. `<item.icon className={... ${isActive ? 'text-red-600' : ''}} />`) attempt to reference `isActive`, but `children` is passed as direct JSX nodes rather than a function `({ isActive }) => (...)`.
2. **`src/pages/CineMorphLanding.tsx` (Line 289)**:
   - Code executes `navigate(ticket.isLocal ? /theater/ : /theater/);` passing RegExp literal `/theater/` instead of string `'/theater'`.

---

## 2. Test Suite Execution (`npx vitest run`)

### Execution Summary
- **Command**: `npx vitest run`
- **Exit Code**: `1`
- **Duration**: `172.75s` (transform: 225.08s, setup: 1635.06s, tests: 6.39s)
- **Total Test Files**: 44
  - **Passed**: 39
  - **Failed**: 5
- **Total Tests**: 198
  - **Passed**: 192 (96.97% pass rate)
  - **Failed**: 6 (3.03% fail rate)

### Detailed Failure Analysis & Stack Traces

#### Failure 1: `src/test/bento.test.tsx`
- **Test**: `allows changing aspect ratio in CineMorph ModeCard`
- **Error**: `TestingLibraryElementError: Unable to find an element with the text: 1.43 IMAX`
- **Stack Trace**:
```
 ❯ src/test/bento.test.tsx:90:28
     88|     );
     89|
     90|     const imaxBtn = screen.getByText('1.43 IMAX');
       |                            ^
     91|     fireEvent.click(imaxBtn);
     92|     expect(useCineMorphStore.getState().aspectRatio).toBe('1.43:1');
```
- **Cause**: `ModeCard.tsx` renders preview feature pill labels (`IMAX Ratios`, `ML Framing`, `3D Curvature`) without interactive aspect ratio selector buttons labeled `'1.43 IMAX'`.

#### Failure 2: `src/test/useUTubeStore.test.ts`
- **Test**: `search returns real candidate results without hardcoded 3-limit, and supports loadMore pagination`
- **Error**: `AssertionError: expected 0 to be greater than 0`
- **Stack Trace**:
```
 ❯ src/test/useUTubeStore.test.ts:20:28
     18|   it('search returns real candidate results without hardcoded 3-limit, and supports loadMore pagination', async () => {
     19|     const results = await useUTubeStore.getState().search('cinematic 4k');
     20|     expect(results.length).toBeGreaterThan(0);
       |                            ^
     21|     expect(useUTubeStore.getState().searchResults.length).toBeGreaterThan(0);
     22|     expect(useUTubeStore.getState().recentSearches).toContain('cinematic 4k');
```
- **Cause**: `searchVideos` in `src/lib/youtube.ts` has `FALLBACK_VIDEOS = []`. In test environments where `VITE_YOUTUBE_API_KEY` is not provided and network calls fail or are mocked with empty returns, `useUTubeStore.search()` falls back to an empty array.

#### Failure 3: `src/test/useUTubeStore.test.ts`
- **Test**: `extractRecommendations returns exactly 5 recommended videos based on keyword extraction`
- **Error**: `AssertionError: expected [] to have a length of 5 but got +0`
- **Stack Trace**:
```
 ❯ src/test/useUTubeStore.test.ts:67:18
     65|     useUTubeStore.getState().extractRecommendations();
     66|     const recs = useUTubeStore.getState().recommendedVideos;
     67|     expect(recs).toHaveLength(5);
       |                  ^
```
- **Cause**: Recommendations depend on search results and fallback dataset. With 0 items populated, recommendation extraction produces an empty list.

#### Failure 4: `src/tests/tier1-features/utube-search-top3.test.ts`
- **Test**: `T1-SRCH-01: search returns real fast initial candidate results and supports dynamic pagination`
- **Error**: `AssertionError: expected 0 to be greater than 0`
- **Stack Trace**:
```
 ❯ src/tests/tier1-features/utube-search-top3.test.ts:18:28
     16|     expect(results).toBeDefined();
     17|     expect(Array.isArray(results)).toBe(true);
     18|     expect(results.length).toBeGreaterThan(0);
       |                            ^
```
- **Cause**: Search returns 0 candidates when `FALLBACK_VIDEOS` is empty array in offline/test environment.

#### Failure 5: `src/tests/tier4-journeys/journey1-discovery-onboarding.test.ts`
- **Test**: `T4-JRN-01: new user performs search, watches top result ad-free, subscribes, and discovers recommended content`
- **Error**: `AssertionError: expected 0 to be greater than 0`
- **Stack Trace**:
```
 ❯ src/tests/tier4-journeys/journey1-discovery-onboarding.test.ts:15:28
     13|     const results = await store.getState().search('cinematic nature');
     14|     expect(results.length).toBeLessThanOrEqual(3);
     15|     expect(results.length).toBeGreaterThan(0);
       |                            ^
```
- **Cause**: Step 1 search yields 0 results due to empty fallback video catalogue.

#### Failure 6: `src/tests/tier3-combinations/search-subscribe-recommendations-ticket.test.ts`
- **Test**: `T3-FLOW-01: executes full chain from search to ticket progress resume`
- **Error**: `AssertionError: expected 0 to be greater than 0`
- **Stack Trace**:
```
 ❯ src/tests/tier3-combinations/search-subscribe-recommendations-ticket.test.ts:16:28
     14|     // 1. User searches for 4K nature documentary
     15|     const results = await utubeStore.getState().search('nature documentary');
     16|     expect(results.length).toBeGreaterThan(0);
       |                            ^
```
- **Cause**: Chain begins with `search('nature documentary')` which returns 0 results due to empty fallback catalogue.

### Passing Test Suites (39 Suites Passed)
1. `src/test/smoke.test.ts` (3 tests)
2. `src/test/storageService.test.ts` (6 tests)
3. `src/test/useCineMorphStore.test.ts` (5 tests)
4. `src/test/useTicketStore.test.ts` (7 tests)
5. `src/tests/tier1-features/aperture-matched-ticket-intro.test.ts` (5 tests)
6. `src/tests/tier1-features/app-open-feed-refresh.test.ts` (4 tests)
7. `src/tests/tier1-features/aspect-ratios-framing.test.ts` (5 tests)
8. `src/tests/tier1-features/cache-4hour-refresh.test.ts` (4 tests)
9. `src/tests/tier1-features/direct-url-playback.test.ts` (5 tests)
10. `src/tests/tier1-features/keyword-recommendations.test.ts` (4 tests)
11. `src/tests/tier1-features/local-storage-persistence.test.ts` (5 tests)
12. `src/tests/tier1-features/ml-framing-geometry.test.ts` (6 tests)
13. `src/tests/tier1-features/oms-intelligence-standard.test.ts` (6 tests)
14. `src/tests/tier1-features/subscriptions-persistence.test.ts` (4 tests)
15. `src/tests/tier1-features/three-theater-scaling.test.ts` (5 tests)
16. `src/tests/tier1-features/ticket-animation-heads-up.test.ts` (4 tests)
17. `src/tests/tier1-features/ticket-save-resume.test.ts` (5 tests)
18. `src/tests/tier2-boundaries/corrupt-storage-payloads.test.ts` (4 tests)
19. `src/tests/tier2-boundaries/empty-malformed-search.test.ts` (4 tests)
20. `src/tests/tier2-boundaries/invalid-youtube-urls.test.ts` (5 tests)
21. `src/tests/tier2-boundaries/missing-local-video-metadata.test.ts` (4 tests)
22. `src/tests/tier2-boundaries/offline-network-cut.test.ts` (4 tests)
23. `src/tests/tier2-boundaries/rapid-aspect-ratio-switches.test.ts` (4 tests)
24. `src/tests/tier3-combinations/local-file-ml-aspect-ratio-ticket.test.ts` (4 tests)
25. `src/tests/tier3-combinations/offline-cut-during-ticket-animation.test.ts` (3 tests)
26. `src/tests/tier3-combinations/search-history-recommendations-collections-queue.test.ts` (4 tests)
27. `src/tests/tier3-combinations/youtube-url-channel-theater-theme.test.ts` (3 tests)
28. `src/tests/tier4-journeys/journey2-cinemorph-movie-night.test.ts` (4 tests)
29. `src/tests/tier4-journeys/journey3-airgapped-offline-playback.test.ts` (4 tests)
30. `src/tests/tier4-journeys/journey4-creator-framing-audit.test.ts` (4 tests)
31. `src/tests/tier5_adversarial/aspect-ratio-stress.test.ts` (4 tests)
32. `src/tests/tier5_adversarial/ml-framing-stress.test.ts` (7 tests)
33. `src/tests/tier5_adversarial/offline-online-transitions.test.ts` (5 tests)
34. `src/tests/tier5_adversarial/storage-adversarial-recovery.test.ts` (5 tests)
35. `src/tests/tier5_adversarial/three-webgl-context-lifecycle-adversarial.test.ts` (4 tests)
36. `src/tests/tier5_adversarial/ticket-animation-interruption-adversarial.test.ts` (4 tests)
37. `src/tests/tier5_adversarial/torn-ticket-corrupt-timecodes-adversarial.test.ts` (4 tests)
38. `src/tests/tier5_adversarial/utube-recommendations-cache-adversarial.test.ts` (4 tests)
39. `src/tests/tier5_adversarial/webaudio-dsp-fallback.test.ts` (4 tests)

---

## 3. Production Build Execution (`npx vite build` & `esbuild`)

### Client Build (`npx vite build`)
- **Exit Code**: `0`
- **Build Timing**: `11.12s`
- **Transformed Modules**: 2577 modules
- **Output Artifacts Table**:

| Asset File | Size | Gzip Size | Chunk Role |
| :--- | :--- | :--- | :--- |
| `dist/index.html` | 0.94 kB | 0.44 kB | Root HTML entry |
| `dist/assets/index-xJJA3Iph.css` | 146.30 kB | 18.46 kB | Main CSS stylesheet |
| `dist/assets/dash.all.min-CQqD9ito.js` | 857.04 kB | 257.34 kB | DASH streaming bundle |
| `dist/assets/index-B9QIyoxA.js` | 538.20 kB | 140.04 kB | Main core bundle |
| `dist/assets/hls-MmTFPL5i.js` | 524.02 kB | 162.09 kB | HLS streaming bundle |
| `dist/assets/index-C20xR7HF.js` | 332.10 kB | 102.72 kB | Core application components |
| `dist/assets/vendor-motion-BTm8TqKA.js` | 96.71 kB | 31.97 kB | Motion / animations |
| `dist/assets/react-SEJLjJqy.js` | 52.45 kB | 16.46 kB | React runtime chunks |
| `dist/assets/vendor-react-BZqAAzMq.js` | 49.83 kB | 17.66 kB | React core vendor chunk |
| `dist/assets/CineMorphTheater-oQ4hxi8_.js` | 38.44 kB | 10.70 kB | 3D Theater component |
| `dist/assets/Watch-BflVhwrZ.js` | 37.53 kB | 9.36 kB | U-Tube Watch Page |
| `dist/assets/vendor-icons-CgJVefqB.js` | 33.45 kB | 7.27 kB | Lucide React Icons |
| `dist/assets/vendor-state-xjkVU5cx.js` | 28.17 kB | 9.03 kB | Zustand / State utils |
| `dist/assets/mixin-DIQKSja0.js` | 18.96 kB | 5.05 kB | Shared mixins |
| `dist/assets/Settings-SPtGeWKs.js` | 17.96 kB | 4.10 kB | Settings View |
| `dist/assets/RootLanding-BT2U6URY.js` | 15.57 kB | 3.54 kB | Dual Engine Bento Landing |
| `dist/assets/react-BNB48xUx.js` | 13.30 kB | 5.04 kB | React helper |
| `dist/assets/react-BD_fGhSG.js` | 11.44 kB | 4.46 kB | React helper |
| `dist/assets/CineMorphLanding-C_jMFIdN.js`| 10.92 kB | 3.44 kB | CineMorph Landing |
| `dist/assets/react-BuOF04wH.js` | 10.23 kB | 4.07 kB | React helper |
| `dist/assets/react-if4R8MwG.js` | 8.95 kB | 3.59 kB | React helper |
| `dist/assets/react-iKdpx7D9.js` | 8.57 kB | 3.63 kB | React helper |
| `dist/assets/react-ms67MAVv.js` | 7.75 kB | 3.29 kB | React helper |
| `dist/assets/playbackService-DWQ0D_HB.js` | 6.80 kB | 2.78 kB | Playback service |
| `dist/assets/react-NC9nu1Gx.js` | 6.54 kB | 3.14 kB | React helper |
| `dist/assets/History-y7lYObge.js` | 5.44 kB | 1.60 kB | History View |
| `dist/assets/Search-CI0jmH9c.js` | 5.38 kB | 1.97 kB | Search Results View |
| `dist/assets/cinemorph-Dgy2PM96.js` | 5.03 kB | 2.29 kB | CineMorph core lib |
| `dist/assets/VideoCard-s_d9mOHz.js` | 4.64 kB | 1.64 kB | VideoCard component |
| `dist/assets/Collections-v6h87n4l.js` | 4.24 kB | 1.64 kB | Collections View |
| `dist/assets/Home-DK10GVp3.js` | 4.05 kB | 1.43 kB | U-Tube Home Feed |
| `dist/assets/Channel-BpH8QdBZ.js` | 3.64 kB | 1.51 kB | Channel View |
| `dist/assets/Subscriptions-CnISCLfv.js` | 2.78 kB | 1.27 kB | Subscriptions View |
| `dist/assets/index-B6_3PTYU.js` | 2.34 kB | 0.80 kB | Index chunk |
| `dist/assets/Preview-CL8CPb5U.js` | 1.53 kB | 0.84 kB | Preview helper |
| `dist/assets/Skeleton-DQ1LtnSG.js` | 0.63 kB | 0.31 kB | UI Skeleton loader |
| `dist/assets/observabilityService-CPfJzugm.js` | 0.49 kB | 0.29 kB | Observability service |
| `dist/assets/vendor-three-l0sNRNKZ.js` | 0.00 kB | 0.02 kB | Three vendor placeholder |

### Server Build (`esbuild server.ts`)
- **Command**: `npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
- **Exit Code**: `0`
- **Output Artifacts**:
  - `dist/server.cjs` (5.5 kB)
  - `dist/server.cjs.map` (7.5 kB)
- **Timing**: `7ms`

---

## 4. Backend Server Endpoints Verification (`server.ts`)

### Live Endpoint Route Testing Results

| Route / Method | Parameters / Input | HTTP Status | Response Data / Verification Evidence | Routing Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET /health` | None | `200 OK` | `{"status":"healthy","service":"CineMorph AI / U-Tube Backend","timestamp":"...","uptime":2.32}` | **PASS** |
| `GET /api/health` | None | `200 OK` | Alias route returns identical health payload | **PASS** |
| `GET /api/suggest` | `?q=nature` | `200 OK` | Returns 8 suggestions: `['nature song', 'nature', 'nature drawing', ...]` | **PASS** |
| `GET /api/suggest` | `?q=` (empty) | `200 OK` | Returns empty array `[]` as expected | **PASS** |
| `GET /api/oembed` | `?id=dQw4w9WgXcQ` | `200 OK` | Returns normalized object with title `"Rick Astley - Never ..."` and author `"Rick Astley"` | **PASS** |
| `GET /api/oembed` | None (missing `id`) | `400 Bad Request` | `{"error":"Missing video id"}` | **PASS** |
| `OPTIONS *` | CORS Preflight | `200 OK` | `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS` | **PASS** |
| `GET /` & `GET *` | Catch-all | `200 OK` | Serves `dist/index.html` when built; returns fallback JSON API summary when dist absent | **PASS** |

---

## Summary of Actionable Defect Discoveries

1. **TypeScript Fix Required**:
   - `src/components/Sidebar.tsx`: Fix `isActive` access in NavLink children.
   - `src/pages/CineMorphLanding.tsx`: Fix RegExp `/theater/` to string `'/theater'`.
2. **Fallback Dataset Required in `src/lib/youtube.ts`**:
   - Populate non-empty `FALLBACK_VIDEOS` so that offline search, recommendation extraction, and integration test suites pass consistently without depending on live network/API keys.
3. **Bento Unit Test Alignment in `src/test/bento.test.tsx` / `ModeCard.tsx`**:
   - Reconcile the aspect ratio selector expectation in `bento.test.tsx` with the `ModeCard.tsx` component implementation.
