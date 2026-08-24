# Spec Miner 2 - Handoff Report: OmniStream Feature Specification

## 1. Observation

### Authoritative Specification Sources
- **Requirements Document**: `d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\ORIGINAL_REQUEST.md`
- **Core Requirements Observed**:
  1. **R1. U-TUBE (Ad-Free YouTube Experience)**:
     - Quote: *"Build a React-based YouTube clone layout (white and red theme). It must allow users to search (displaying top 3 results), paste direct YouTube links, and subscribe to channels. The home page must display the latest videos from subscribed channels (refreshing every 4 hours) and recommend 5 videos based on keyword extraction from recent searches. All video playback must be ad-free. User data (subscriptions, history) must be stored locally (LocalStorage/IndexedDB) with no backend."*
  2. **R2. CineMorph (Desktop Theatrical Experience)**:
     - Quote: *"Build a desktop-only immersive video player using Three.js for 3D environment rendering (seats, curtains, curved screens). It must support 1.43:1 (IMAX GT), 1.90:1 (IMAX), and original aspect ratios. The UI should have a vintage paper theme with bright colors and theater props (camera, reels, ticket printer). It must support playing YouTube links or local video files (with a focus on local files). If internet connectivity drops, playback should fallback to a 4:3 cropped ratio without live ML calculations."*
  3. **R3. Advanced Framing Geometry (Client-Side ML)**:
     - Quote: *"Implement a client-side real-time ML model (e.g., using TensorFlow.js) for local video files. The model must analyze frames and dynamically pan the video behind the fixed hole (screen area) to optimize framing based on Advanced Framing Geometry rules (e.g., Frame-within-a-frame, Leading lines, Rule of thirds, Screen direction). Processing must happen locally."*
  4. **R4. UX and State Management**:
     - Quote: *"Implement a 10-second ticket printing animation when a user starts a movie in CineMorph. This acts as a loading screen to allow the client-side ML model to pre-process the initial video frames (heads up processing). The system must save movie progress (tickets) locally so users can click a torn ticket to resume exactly where they left off. Include a main minimalist bento-style landing page to navigate between U-TUBE and CineMorph."*
  5. **Acceptance Criteria (AC1 - AC7)**:
     - U-TUBE: Search returns exactly 3 results; Subscribed channels and search history persist across reloads.
     - CineMorph 3D: Three.js renders theater (screen, seats) scaling with window; loads local MP4 and plays on 3D screen.
     - Advanced Framing Geometry: Programmatic test / diagnostic overlay confirms ML runs on frames and outputs dynamic X/Y panning.
     - UX & State: 10-second ticket printer animation triggers before playback; clicking a saved ticket resumes at the correct timestamp.

---

## 2. Logic Chain

1. **Deconstruction of Core Pillars**:
   - The user request requires two distinct yet interconnected product experiences: U-TUBE (clean, distraction-free YouTube alternative) and CineMorph (immersive Three.js 3D cinema with client-side ML dynamic framing), unified via a minimalist Bento-style landing page.
2. **Mathematical & Architectural Precision**:
   - **Search & Curation**: Fixed to exactly 3 top results per query to eliminate decision fatigue.
   - **Recommendation Engine**: Requires NLP keyword extraction on search & watch history, outputting exactly 5 recommendations.
   - **4-Hour TTL**: Subscriptions feed caching requires an explicit $14,400,000\text{ ms}$ timestamp comparison logic.
   - **Framing Geometry**: The screen is a fixed aperture with aspect ratios 1.43:1 (IMAX GT), 1.90:1 (Digital IMAX), Original, and 4:3 (offline fallback). The ML engine must compute dynamic $(X, Y)$ offset panning coordinates by evaluating Rule of Thirds ($1/3, 2/3$ grid power points), Leading Lines (vanishing point balance), Frame-within-a-frame (boundary contour alignment), and Screen Direction (lead room allocation), with lerp smoothing and $>40\%$ histogram delta cut reset.
   - **UX Timing & Pre-Processing**: The 10.0-second ticket printing animation serves as a diegetic loading mask while background workers decode and analyze initial keyframes $(0s - 30s)$ for smooth zero-stutter playback.
   - **State Persistence**: 100% zero-backend client-side storage utilizing `LocalStorage` and `IndexedDB` with torn ticket progress serialization.
3. **Synthesis into Specification**:
   - Generated 35 discrete functional features (`F01` through `F35`), 22 edge cases with mitigation strategies (`E01` through `E22`), 6 structured TypeScript interfaces, 6 LocalStorage schema definitions, and 17 pass/fail acceptance test specifications.

---

## 3. Caveats

1. **Browser Video Codec Constraints**: Ingesting non-standard local video containers (e.g. MKV with proprietary audio codecs) relies on the underlying Chromium/browser media decoders; standard MP4/WebM files provide guaranteed native compatibility.
2. **GPU & WebGL Capabilities**: The Three.js 3D cinema hall and client-side ML tensor computations assume standard hardware acceleration; a 2D vintage canvas fallback was specified for low-end GPUs or lost WebGL contexts.
3. **No External Backend Assumption**: As mandated by R1/R4, zero server-side databases or user accounts are used; all ticket stubs and subscriptions are device-local.

---

## 4. Conclusion

A complete, exhaustive, and unambiguous specification has been established and recorded in `feature_spec.md`. The feature set is categorized across 5 clear modules with zero omitted requirements. Every requirement is mapped to inputs, outputs, error behaviors, edge cases, data schemas, and verifiable acceptance criteria.

---

## 5. Verification Method

To verify the specification and artifacts:
1. **Inspect Feature Specification**:
   - File: `d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\teamwork_preview_spec_miner_survey_2\feature_spec.md`
   - Verify presence of: Executive Summary, Architecture Diagram, 5 Module Deep Dives, 35-item Feature Inventory Table, 22-item Edge Cases Matrix, TypeScript Schemas, LocalStorage Key Tables, and 17 Acceptance Criteria.
2. **Verify Requirement Coverage**:
   - Cross-check `ORIGINAL_REQUEST.md` against `feature_spec.md` Section 4 and Section 7.
