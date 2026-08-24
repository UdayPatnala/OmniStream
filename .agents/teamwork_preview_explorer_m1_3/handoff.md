# Handoff Report: Core State Stores & Storage Persistence Design (Milestone 1)

**Agent**: Explorer 3 (Milestone 1 Core Foundation & Bento Landing Page)  
**Date**: 2026-08-23  
**Working Directory**: `d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\teamwork_preview_explorer_m1_3`  
**Handoff Type**: Hard Handoff (Investigation & Architecture Design Complete)

---

## 1. Observation

1. **Authoritative Requirements in `ORIGINAL_REQUEST.md`**:
   - **R1 (U-TUBE)**: Search returns top 3 results; channel subscriptions persist across reloads; home page displays subscribed feed (refreshing every 4 hours); 5 video recommendations based on keyword extraction from recent searches; ad-free player state; local storage with no backend.
   - **R2 (CineMorph)**: 1.43:1 (IMAX GT), 1.90:1 (IMAX), original aspect ratio; 4:3 cropped offline fallback without live ML; local MP4 and YouTube support.
   - **R3 (Advanced Framing Geometry)**: Panning video behind fixed aperture; dynamic X/Y offsets; framing rules (Rule of thirds, leading lines, frame-within-a-frame, screen direction).
   - **R4 (UX and State)**: 10-second ticket printing animation (heads-up pre-processing); save movie progress as torn tickets; 1-click torn ticket resume at exact timestamp.

2. **Interface Contracts in `PROJECT.md`**:
   - `useUTubeStore`: `searchResults` (top 3), `subscriptions`, `recentSearches`, `recommendedVideos` (5 items), `subscribedFeed`, `lastFeedRefresh` (4h threshold ms), `currentVideo`, `search()`, `subscribe()`, `unsubscribe()`, `extractRecommendations()`, `refreshFeedIfNeeded()`, `playVideo()`.
   - `useCineMorphStore`: `aspectRatio` ('1.43:1' | '1.90:1' | 'original' | '4:3'), `isOffline`, `videoSource` (`{ type: 'local' | 'youtube'; url: string; file?: File; name: string } | null`), `framingRule`, `diagnosticOverlayVisible`, `panOffset` (`{ x: number; y: number }`), `playbackTimestamp`.
   - `useTicketStore`: `tickets` (`MovieTicket[]`), `isPrintingAnimationActive`, `activeTicket`, `saveTicketProgress()`, `resumeFromTicket()`, `removeTicket()`, `trigger10sPrintAnimation()`.

3. **Current Codebase State**:
   - Monolithic Zustand store exists at `src/store.ts` combining legacy U-Tube and CineMorph fields with a single `cinemorph-utube-storage` key.
   - Existing services include `src/lib/services/cacheService.ts`, `src/lib/services/errorRecoveryManager.ts`, and `src/lib/youtube.ts`.
   - `package.json` contains `"zustand": "^5.0.14"`, `"react": "^19.0.1"`, `"react-dom": "^19.0.1"`.

---

## 2. Logic Chain

1. **Observation 1 & 2 $\rightarrow$ Architectural Domain Separation**:
   - The three core domains (U-TUBE, CineMorph 3D player, and Ticket Reel / Pre-processing State Machine) have distinct lifecycles and performance characteristics.
   - Coupling them into a single store causes unnecessary React re-renders across views (e.g., 60fps ML pan offset changes triggering re-renders in YouTube search components).
   - *Inference*: Splitting into `src/state/useUTubeStore.ts`, `src/state/useCineMorphStore.ts`, and `src/state/useTicketStore.ts` provides strict boundary isolation, improved testability, and zero cross-domain re-render overhead.

2. **Observation 1 & 3 $\rightarrow$ Resilient Persistence Layer (`storageService.ts`)**:
   - LocalStorage is prone to `JSON.parse` syntax errors from corruption and `QuotaExceededError` (5MB limit) when saving large ticket thumbnails or query caches.
   - IndexedDB provides asynchronous, high-capacity storage for media metadata and blob URLs but may fail in private/incognito browsing.
   - *Inference*: Implementing `storageService.ts` with auto-recovery from corrupted JSON, LRU cache eviction, dual-layer LocalStorage + IndexedDB tiering, and an in-memory fallback guarantees 100% crash immunity.

3. **Observation 1 $\rightarrow$ Deterministic R1 Business Logic**:
   - `useUTubeStore.search()` is designed to enforce `Array.slice(0, 3)` to guarantee exactly 3 results.
   - `useUTubeStore.extractRecommendations()` implements keyword frequency weighting over recent searches with stop-word filtering and popular video backfill to guarantee exactly 5 videos.
   - `useUTubeStore.refreshFeedIfNeeded()` calculates `Date.now() - lastFeedRefresh >= 4 * 3600 * 1000` (4 hours) to avoid redundant network calls.

4. **Observation 1 & 2 $\rightarrow$ CineMorph & Ticket Coordination**:
   - `useCineMorphStore.setOfflineStatus(true)` automatically switches `aspectRatio` to `4:3`, deactivates ML, and centers `panOffset`.
   - `useTicketStore.trigger10sPrintAnimation()` runs a 10-second countdown while dispatching background pre-processing events, and on completion persists the torn ticket stub and transitions smoothly into theater playback.
   - `resumeFromTicket(ticketId)` seamlessly populates `useCineMorphStore` with saved timestamp, ratio, and source.

---

## 3. Caveats

1. **IndexedDB Browser Restrictions**: In certain sandboxed environments or strict private browsing modes, `window.indexedDB` may reject permissions. The design includes an in-memory `Map` fallback to preserve functionality.
2. **Video File Object Persistence**: Native browser security prevents storing raw `File` objects across page reloads in `localStorage`. For local files, tickets persist filename and metadata, prompting file re-selection if the blob URL is revoked.
3. **Legacy Migration**: A facade in `src/store.ts` will be maintained during Milestone 1 and 2 to allow incremental refactoring without breaking legacy components before they are migrated.

---

## 4. Conclusion

The state management and storage persistence architecture has been fully designed and documented in `d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\teamwork_preview_explorer_m1_3\state_store_plan.md`.
The implementation is ready for Milestone 1 developers:
- `src/services/storageService.ts`: Robust LocalStorage/IndexedDB adapter with corruption recovery and LRU eviction.
- `src/state/useUTubeStore.ts`: Strict 3-result search, subscriptions, 4-hour cached feed, 5 keyword recommendations, ad-free player.
- `src/state/useCineMorphStore.ts`: 1.43:1 / 1.90:1 / Original / 4:3 offline fallback, normalized pan offset `[-1, 1]`, diagnostic HUD toggling.
- `src/state/useTicketStore.ts`: Torn ticket state, 10s printing sequencer, 1-click resume, heads-up pre-processing coordination.

---

## 5. Verification Method

1. **File Inspection**:
   - Review `d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\teamwork_preview_explorer_m1_3\state_store_plan.md` for complete type interfaces and action implementations.
2. **Interface Contract Invalidation Check**:
   - Verify all field names match `PROJECT.md` contracts (`searchResults`, `subscriptions`, `recentSearches`, `recommendedVideos`, `subscribedFeed`, `lastFeedRefresh`, `aspectRatio`, `isOffline`, `panOffset`, `diagnosticOverlayVisible`, `tickets`, `isPrintingAnimationActive`, `saveTicketProgress`, `resumeFromTicket`).
3. **Unit Test Verification (upon implementation)**:
   - Run `npm test` or `npx vitest run` targeting state store unit tests in `tests/unit/state/`.
