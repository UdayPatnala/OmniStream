# OmniStream: Comprehensive System & Feature Specification

## 1. Executive Summary & System Overview

OmniStream is an integrated, client-side multimedia web platform engineered around two core experiences:
1. **U-TUBE**: A focused, distraction-free, ad-free YouTube alternative featuring a minimalist white/red theme, high-precision 3-result search curation, automated 4-hour subscription feed aggregation, keyword-based recommendation engine (5 items), and 100% local persistence.
2. **CineMorph**: A desktop-only theatrical video player rendering an authentic 3D cinema hall in Three.js (curved screen, tiered seating rows, proscenium velvet curtains, vintage paper theme, diegetic theater props). It features a client-side real-time Machine Learning framing engine that dynamically pans video behind a fixed aperture adhering to classical cinematography rules (Rule of Thirds, Leading Lines, Frame-within-a-Frame, Screen Direction), a 10-second ticket printing heads-up pre-processing animation, torn ticket progress resumption, and resilient 4:3 offline fallback.

---

## 2. Architecture & Tech Stack Specifications

```
+---------------------------------------------------------------------------------------+
|                                    OmniStream SPA                                     |
+---------------------------------------------------------------------------------------+
|  Bento-Style Minimalist Landing Page (Route Router / Gateway / Preference Switcher)   |
+-------------------------------------------+-------------------------------------------+
|                  U-TUBE                   |                 CineMorph                 |
|   (White/Red Clean UI, YouTube Clone)     |   (Vintage Paper Theme, 3D WebGL Cinema)  |
+-------------------------------------------+-------------------------------------------+
| - Top 3 Search Result Filter              | - Three.js 3D Virtual Cinema Hall         |
| - Direct YouTube Link Resolver            | - Curved Screen (1.43:1, 1.90:1, Original)|
| - Local Subscriptions & 4-Hr Refresh Feed | - 10s Ticket Printing / ML Warmup UX      |
| - 5-Item Keyword Extraction Recommender   | - Torn Ticket Progress Save & Resume      |
| - Ad-Free Clean Playback Engine           | - Offline 4:3 Cropped Resilient Fallback  |
+-------------------------------------------+-------------------------------------------+
|                                Core ML & Framing Engine                               |
| - Client-Side Video Frame Analyzer (TensorFlow.js / Canvas Saliency / Saccade Engine) |
| - Dynamic Panning Calculator: Rule of Thirds, Leading Lines, Frame-in-Frame, Direction|
| - Diagnostic HUD Overlay & Performance Telemetry (FPS, Offset X/Y, Rule Scores)       |
+---------------------------------------------------------------------------------------+
|                              Local Persistence Layer                                  |
| - LocalStorage / IndexedDB (Zero Backend Server, Privacy-First Architecture)          |
+---------------------------------------------------------------------------------------+
```

### Core Technology Stack
- **Framework**: React 19 + TypeScript 5.8 + Vite 6
- **3D Graphics**: Three.js (WebGL Canvas, Perspective Camera, VideoTexture, MeshStandardMaterial, Directional & Ambient Lighting)
- **Machine Learning**: Client-side TensorFlow.js / Canvas Saliency Computer / Luminance & Edge Tensor Processors
- **Styling**: Tailwind CSS 4, Custom Vintage Paper & Material Palettes, Framer Motion
- **State & Storage**: Zustand with LocalStorage/IndexedDB synchronization

---

## 3. Module Specifications

### Module 0: Bento-Style Landing Page & Navigation
- **Spec Source**: R4 ("Include a main minimalist bento-style landing page to navigate between U-TUBE and CineMorph.")
- **Layout & Design**:
  - Minimalist modular Bento grid composed of asymmetric geometric cards.
  - Card 1: **U-TUBE** showcase card (White surface, YouTube red accent, direct search prompt, subscription snapshot).
  - Card 2: **CineMorph** showcase card (Warm vintage paper parchment texture, 3D projector icon, active torn ticket stubs, IMAX ratio badge).
  - Card 3: **Quick Resume / Ticket Stub Drawer** (displays recently torn tickets for instant 1-click continuation).
  - Card 4: **System & Offline Status** (network monitor, WebGL capability indicator).
- **Navigation Behavior**:
  - Seamless client-side routing between `/`, `/home` (U-TUBE), `/cinemorph` (CineMorph Landing), `/theater/:id` (CineMorph Theater).
  - Configurable root preference: Remember last visited mode or always show the Bento Gateway.

---

### Module 1: U-TUBE (Ad-Free YouTube Experience)
- **Spec Source**: R1
- **Visual Design System**:
  - Crisp white background (`#FFFFFF` / `#F9F9F9`), high-contrast dark text (`#0F0F0F`), iconic YouTube-red accents (`#FF0000` / `#CC0000`).
  - Distraction-free, clean layout devoid of ads, banners, intrusive popups, and clickbait clutter.
- **Features & Logic**:
  1. **Precision 3-Result Search**:
     - Queries executed against YouTube search API/resolvers.
     - Search results list is strictly capped to the **Top 3 most relevant results** to prevent decision fatigue and information overload.
     - Search queries recorded to local search history.
  2. **Direct Link Resolver**:
     - Dedicated URL input field accepting standard YouTube URLs (`youtube.com/watch?v=...`, `youtu.be/...`, shorts, embeds).
     - Auto-parses video ID, validates integrity, and immediately initiates playback.
  3. **Channel Subscriptions**:
     - One-click subscribe/unsubscribe toggle on channel pages and watch headers.
     - Stores channel metadata (`channelId`, `title`, `avatarUrl`, `subscribedAt`) in local storage.
  4. **4-Hour Subscription Refresh Engine**:
     - Home feed aggregates latest uploads from all subscribed channels.
     - Implements a cache timestamp check: uploads are cached with a **4-hour Time-To-Live (TTL)**.
     - On page load or feed mount: if `Date.now() - lastFetchedTimestamp >= 4 * 60 * 60 * 1000` (14,400,000 ms), fetch new uploads; otherwise, serve from local cache.
  5. **Keyword Extraction & 5-Video Recommendation Engine**:
     - NLP Keyword Extractor tokenizes recent search history queries and watched video titles.
     - Filters stop words (`the`, `a`, `how`, `to`, `in`, `video`, etc.) and calculates term frequencies.
     - Queries recommendations and returns **exactly 5 curated video recommendations**.
  6. **Ad-Free Playback Architecture**:
     - Video player stripped of promotional overlay scripts, mid-roll ad injections, and third-party tracking beacons.
  7. **Zero-Backend Local Persistence**:
     - Subscriptions, watch history, search queries, and collections stored exclusively in browser storage (`LocalStorage` / `IndexedDB`).

---

### Module 2: CineMorph (Desktop Theatrical Experience)
- **Spec Source**: R2
- **Target Platform**: Desktop-only (enforces minimum viewport dimensions, optimized for wide screens and mouse/keyboard navigation).
- **Three.js 3D Theater Environment**:
  - **Screen Geometry**: Curved cylindrical screen mesh (`CylinderGeometry` / curved plane) mapped with a live dynamic `VideoTexture`.
  - **Auditorium Seating**: Multi-tiered 3D seat rows constructed from low-poly textured seat meshes positioned in front of the screen.
  - **Curtains & Proscenium**: 3D velvet side curtains framing the screen.
  - **Lighting & Ambilight**: Dynamic ambient light syncing with the average screen edge color (real-time light emission onto theater seats and ceiling).
  - **Window Resize Handling**: Three.js perspective camera FOV and renderer dimensions update dynamically on browser window resize events.
- **Aspect Ratio Switching**:
  1. **1.43:1 (IMAX GT)**: Full-aperture 70mm tall format (`aspectRatio = 1.43`).
  2. **1.90:1 (Digital IMAX)**: Digital cinema IMAX format (`aspectRatio = 1.90`).
  3. **Original**: Native aspect ratio of the loaded source media (e.g. 16:9 / 2.39:1).
  4. **4:3 Offline Fallback**: Fixed 4:3 cropped container activated when offline.
- **Vintage Paper Theme & Diegetic Props**:
  - Skeuomorphic aesthetic: Parchment textures, yellowed ticket paper, stamp ink, brass rivets, bright retro color accents (crimson, amber, deep cinema teal).
  - Visual props integrated into UI: Vintage movie projector with spinning reels, retro camera icon, mechanical ticket dispenser machine.
- **Dual Media Source Input**:
  - **Local Video Files (Primary Focus)**: Supports drag-and-drop or file picker for local MP4, WebM, MKV, MOV files using `URL.createObjectURL(file)`.
  - **YouTube Streams**: Direct YouTube stream streaming into the 3D texture projection.
- **Offline Fallback Resilience**:
  - Active network monitoring via `navigator.onLine` and `window.addEventListener('offline')`.
  - Upon network loss, gracefully transitions playback mode to a **4:3 cropped ratio** with live ML calculations halted to guarantee flawless offline frame rates and zero CPU stutter.

---

### Module 3: Advanced Framing Geometry (Client-Side ML Engine)
- **Spec Source**: R3
- **Architectural Principle**:
  - The cinema screen acts as a fixed framing aperture ("hole").
  - The video source is scaled to fill the bounding box and panned dynamically along the X/Y axes based on real-time computer vision and machine learning analysis of video frames.
  - 100% client-side: Zero cloud API latency, zero video upload, total privacy.
- **Compositional Framing Rules**:
  1. **Rule of Thirds**:
     - Analyzes frame saliency / face detection coordinates $(x, y)$.
     - Dynamically computes the nearest 1/3 or 2/3 horizontal ($y = 0.33, 0.66$) and vertical ($x = 0.33, 0.66$) grid intersection lines.
     - Applies soft panning offset to position the primary focal subject at the optimal power point.
  2. **Leading Lines**:
     - Computes edge gradients and Hough transform / line vectors to identify strong converging perspective lines (e.g. roads, architectural corridors).
     - Adjusts horizontal pan to balance the vanishing point within the center or golden ratio zones.
  3. **Frame-within-a-Frame**:
     - Detects internal framing elements (windows, doorways, arches, high-contrast silhouettes).
     - Aligns and centers the detected internal boundary with the viewport's crop frame.
  4. **Screen Direction & Lead Room**:
     - Computes optical flow / velocity vectors and facial gaze orientation.
     - When subject is moving or looking right, offsets framing to provide "lead room" / "nose room" on the right (and vice versa for left).
- **Motion Smoothing & Shot Transition Resilience**:
  - **Interpolation**: Linear interpolation (`lerp`) with exponential decay smoothing filter:
    $$P_{t} = P_{t-1} + (P_{target} - P_{t-1}) \cdot \alpha$$
    where $\alpha \approx 0.05 - 0.12$ to prevent jerky camera motion.
  - **Cut Detection**: Histogram luminance delta check ($>40\%$ delta between consecutive frames triggers an instant cut reset instead of panning across cuts).
- **Diagnostic HUD & Telemetry Overlay**:
  - Interactive toggleable HUD displaying:
    - Live video frame canvas stream.
    - Saliency heatmaps and subject bounding boxes.
    - Rule-of-Thirds overlay grid (3x3).
    - Detected leading line vectors and vanishing point crosshairs.
    - Real-time panning offset values $(X_{offset}, Y_{offset})$ in pixels/percentages.
    - ML inference latency (ms) and render FPS.

---

### Module 4: UX & State Management
- **Spec Source**: R4
- **10-Second Ticket Printing Animation (Heads-Up Processing)**:
  - Triggered upon initiating playback for any video in CineMorph.
  - **Diegetic UI Sequence (10.0s)**:
    - 0.0s - 2.0s: Mechanical ticket dispenser rumble, gears turning sound/visual, blank parchment enters print head.
    - 2.0s - 7.0s: Thermal print head renders movie title, timestamp, seat allocation, barcode, and custom vintage stamps.
    - 7.0s - 9.5s: Ticket paper feeds forward, perforation line snaps, ticket tears off with a crisp paper tear effect.
    - 9.5s - 10.0s: Ticket stows into drawer, cinema hall lights dim, curtains part, movie starts.
  - **Heads-Up Background Pre-Processing (Concurrent Execution)**:
    - Initializes TensorFlow.js / canvas ML worker.
    - Decodes initial video keyframes $(0s - 30s)$.
    - Pre-calculates saliency vectors and framing coordinate trajectory.
    - Pre-buffers audio DSP filters and compiles Three.js shaders.
- **Torn Ticket Progress Save & Resume**:
  - Video progress is automatically synchronized to local storage under a "Torn Ticket" record.
  - Ticket stub contains: `ticketId`, `mediaId`, `title`, `sourceType` (`local` | `youtube`), `filePathOrBlobKey`, `timestamp` (seconds), `duration`, `aspectRatio`, `thumbnailDataUrl`, `lastWatchedAt`.
  - **Resumption Flow**:
    - Users see their saved torn ticket stubs on the Bento landing page or CineMorph ticket counter.
    - Clicking a torn ticket immediately opens CineMorph, seeks to the exact saved timestamp, and resumes playback without losing state.
- **Persistence Storage Schema (LocalStorage & IndexedDB)**:
  - `omnistream_tickets`: Map of media progress tickets.
  - `omnistream_subscriptions`: List of subscribed channels.
  - `omnistream_sub_feed_cache`: `{ lastFetched: number, videos: Video[] }` (4h TTL).
  - `omnistream_search_history`: `{ queries: { query: string, timestamp: number }[], extractedKeywords: string[] }`.
  - `omnistream_user_prefs`: `{ theme: string, rootLandingPreference: 'ask' | 'v1' | 'v2', framingMode: string }`.

---

## 4. Comprehensive Feature Inventory Table

| # | Category | Feature | Description | Requirements Source | Inputs | Outputs | Error Behavior | Edge Cases | Verification Method |
|---|----------|---------|-------------|---------------------|--------|---------|----------------|------------|---------------------|
| **F01** | Landing & Navigation | Bento-Style Gateway Layout | Modular bento grid landing page showcasing U-TUBE and CineMorph with dynamic tiles | `ORIGINAL_REQUEST.md` (R4) | User clicks / route access to `/` | Rendered Bento UI with interactive cards | Fallback to default U-TUBE if UI fails | Ultra-wide monitors, small desktop viewports (min 1024px) | Visual inspection of Bento layout; verify card aspect ratios & responsiveness |
| **F02** | Landing & Navigation | Gateway Preference Switcher | Allows user to persist choice (Always ask vs Direct to U-TUBE vs Direct to CineMorph) | `ORIGINAL_REQUEST.md` (R4) | Checkbox toggle / selection buttons | Stored preference in `LocalStorage` (`omnistream_user_prefs`) | Default to `'ask'` if corrupted | Cleared browser cache resets to Bento landing | Toggle preference, refresh browser, verify route redirection matches setting |
| **F03** | Landing & Navigation | Torn Ticket Quick Resume Drawer | Interactive dashboard widget displaying recently torn movie tickets for 1-click resume | `ORIGINAL_REQUEST.md` (R4) | Click on saved ticket stub | Navigation to CineMorph player at saved timestamp | Show empty state ("No tickets printed") if no history | Deleted local file triggers re-selection prompt | Save video at 02:45, open Bento landing, click ticket stub, verify player opens at 02:45 |
| **F04** | U-TUBE | White/Red YouTube Clone UI | Clean, high-contrast white and red aesthetic mirroring classic YouTube without ad clutter | `ORIGINAL_REQUEST.md` (R1) | Page route `/home`, `/feed`, `/watch/:id` | White background (`#FFFFFF`), red accents (`#FF0000`), dark text | CSS fallback variables | High-contrast OS mode | Inspect DOM colors; verify zero third-party ads or promotional popups |
| **F05** | U-TUBE | Precision 3-Result Search | Search query execution returning strictly the top 3 highest-relevance results | `ORIGINAL_REQUEST.md` (R1, AC1) | Search query text string (e.g. "React Three.js") | Exactly 3 video card results displayed | Display "No results found" message if 0 matches | Query with special characters, 1-character query, empty string | Execute search "quantum computing"; assert `results.length === 3` in UI and DOM |
| **F06** | U-TUBE | Direct YouTube Link Resolver | Input box that parses any pasted YouTube URL and plays the video immediately | `ORIGINAL_REQUEST.md` (R1) | Pasted URL (`youtube.com/watch?v=...`, `youtu.be/...`, shorts) | Extracted `videoId` and immediate playback launch | Display "Invalid YouTube URL" error toast | URL with tracking query params (`&t=10s`, `&list=...`, `&si=...`) | Paste `https://youtu.be/dQw4w9WgXcQ?si=test`; verify ID extraction `dQw4w9WgXcQ` and playback starts |
| **F07** | U-TUBE | Channel Subscriptions | Client-side channel subscribe/unsubscribe toggle persisted locally | `ORIGINAL_REQUEST.md` (R1, AC2) | Click "Subscribe" / "Subscribed" button on channel | Updated subscriptions list in `LocalStorage` | Graceful rollback if quota exceeded | Subscribe to channel with missing avatar/metadata | Click subscribe, verify state change to "Subscribed", reload page, confirm channel remains subscribed |
| **F08** | U-TUBE | 4-Hour Subscription Refresh Feed | Home feed aggregating latest videos from subscribed channels with 4-hour cache TTL | `ORIGINAL_REQUEST.md` (R1) | Application load / feed mount event | Video feed array; updated `lastRefreshedAt` timestamp | Display cached feed if offline or API unavailable | Subscribed channel with 0 uploads, deleted channel | Set mock cache timestamp to 3h ago (no fetch); set to 4h1m ago (triggers fetch); verify cache update |
| **F09** | U-TUBE | NLP Keyword Extraction | Extracts dominant topic keywords from search history and watched titles | `ORIGINAL_REQUEST.md` (R1) | Search history queries & watch history items | Ranked array of keyword strings (e.g. `["threejs", "cinema"]`) | Fallback to default topics ("cinematography", "space") if empty | Searches with stop words only ("the in on a") | Supply search history `["learn react", "react tutorials"]`; assert keyword `"react"` extracted with highest weight |
| **F10** | U-TUBE | 5-Video Recommendation Feed | Recommendation engine generating exactly 5 personalized video cards from keywords | `ORIGINAL_REQUEST.md` (R1) | Extracted keyword tokens | Array of exactly 5 recommended video objects | Fallback to trending fallback set if API yields <5 items | Insufficient keyword matches (<5 items) | Inspect home page recommendation section; verify exactly 5 video cards rendered |
| **F11** | U-TUBE | Ad-Free Playback Container | Player container completely isolated from ad networks, mid-rolls, and promotional scripts | `ORIGINAL_REQUEST.md` (R1) | Video ID or media stream | Clean continuous video playback | Standard HTML5 / embedded playback error handling | Video with embed restrictions (show fallback notice) | Play video; verify absence of pre-roll ads, banners, and third-party tracker requests in network tab |
| **F12** | U-TUBE | Zero-Backend Local Persistence | All user data (subscriptions, history, search, bookmarks) stored in LocalStorage/IndexedDB | `ORIGINAL_REQUEST.md` (R1, AC2) | State mutations (add sub, add history) | Serialized JSON stored in browser storage keys | Graceful error handling for `QuotaExceededError` | Private/Incognito browsing storage restrictions | Perform 5 actions, refresh browser, inspect `localStorage` keys; confirm full state hydration |
| **F13** | CineMorph | Three.js 3D Theater Environment | Full WebGL 3D cinema auditorium with curved screen, tiered seat rows, and proscenium | `ORIGINAL_REQUEST.md` (R2, AC3) | Route `/theater/:id` or local media launch | Three.js `WebGLRenderer` canvas with 3D meshes | WebGL unsupported fallback message | Low-end GPU / disabled hardware acceleration | Verify Three.js scene graph contains screen mesh, seat instances, and camera perspective |
| **F14** | CineMorph | Dynamic Curved Screen Geometry | Cylindrical/curved 3D plane mesh mapped with live `VideoTexture` | `ORIGINAL_REQUEST.md` (R2, AC3) | Active HTML5 `<video>` element | Textured 3D mesh rendering video frame at 60 FPS | Black texture fallback while loading | Video format without WebGL texture support | Play local video; verify video plays directly on the curved 3D screen surface |
| **F15** | CineMorph | Responsive Viewport & Camera Scaling | Dynamic camera FOV and Three.js viewport resizing on browser resize | `ORIGINAL_REQUEST.md` (R2, AC3) | Window `resize` events | Updated camera projection matrix & renderer size | Maintain minimum aspect ratio to prevent clipping | Window minimized or resized to extreme portrait aspect | Resize browser window from 1920x1080 to 1280x720; verify 3D cinema scales smoothly without distortion |
| **F16** | CineMorph | Aspect Ratio: 1.43:1 (IMAX GT) | Tall 70mm full-aperture cinema screen ratio (143:100) | `ORIGINAL_REQUEST.md` (R2) | User selects "1.43:1" aspect ratio button | Screen mesh and crop aperture adjusted to 1.43:1 | Revert to original if aspect calculation fails | Ultra-wide source video in 1.43:1 aperture | Select 1.43:1; verify screen aperture geometry updates to $1.43 \times H$ |
| **F17** | CineMorph | Aspect Ratio: 1.90:1 (Digital IMAX) | Standard Digital IMAX format screen ratio (190:100) | `ORIGINAL_REQUEST.md` (R2) | User selects "1.90:1" aspect ratio button | Screen mesh and crop aperture adjusted to 1.90:1 | Revert to original if aspect calculation fails | 4:3 source video in 1.90:1 aperture | Select 1.90:1; verify screen aperture geometry updates to $1.90 \times H$ |
| **F18** | CineMorph | Aspect Ratio: Original | Native aspect ratio of the active video stream | `ORIGINAL_REQUEST.md` (R2) | User selects "Original" aspect ratio button | Uncropped source video aspect ratio (e.g. 16:9, 2.39:1) | Default to 16:9 if metadata unavailable | Vertical video (9:16) or non-standard aspect | Select Original; verify screen matches native video aspect ratio |
| **F19** | CineMorph | Vintage Paper Aesthetic & Theme | Skeuomorphic vintage parchment UI theme with bright colors and theater styling | `ORIGINAL_REQUEST.md` (R2) | CineMorph view mount | Parchment textures, brass rivets, retro typography | Fallback to standard theme if assets fail | Dark mode OS override | Inspect CSS/styling for vintage paper palette (`#F4ECD8`, `#2C1810`, `#D9534F`) |
| **F20** | CineMorph | Diegetic Theater Props | Interactive vintage visual props: projector with spinning reels, retro camera, ticket machine | `ORIGINAL_REQUEST.md` (R2) | CineMorph UI render | Rendered SVG/3D retro props in UI | Fallback to minimalist icons | Low performance mode disables continuous animations | Verify presence of vintage camera, reels, and ticket dispenser elements in UI |
| **F21** | CineMorph | Local Media File Ingestion | Drag-and-drop or file picker for local video files (MP4, WebM, MKV, MOV) | `ORIGINAL_REQUEST.md` (R2, AC4) | Local file blob via `<input type="file">` / drop | Object URL created and routed to player | Display format error if unsupported codec | 4K / 8K high-bitrate video, corrupted file headers | Select local `.mp4` file; verify video loads into 3D theater and plays smoothly |
| **F22** | CineMorph | Offline Resilient 4:3 Fallback | Auto-detects network disconnection and switches to a 4:3 cropped ratio without live ML | `ORIGINAL_REQUEST.md` (R2) | Network `offline` event | Aspect ratio switches to 4:3; ML frame loop pauses | Return to previous ratio upon `online` event | Intermittent flaky connection fluttering | Trigger browser offline mode (`navigator.onLine = false`); verify aspect ratio switches to 4:3 and ML pauses |
| **F23** | Framing ML | Client-Side Frame Analyzer | Real-time frame capture and analysis running 100% locally via Canvas / TensorFlow.js | `ORIGINAL_REQUEST.md` (R3, AC5) | HTML5 `<video>` frame stream | Frame analysis tensor / saliency coordinate matrix | Fallback to center crop if inference fails | Video playing at 60 FPS, high CPU load | Inspect console/profiler; verify inference runs client-side with 0 external network requests |
| **F24** | Framing ML | Dynamic Panning Behind Fixed Aperture | Calculates X/Y pan offset coordinates to position video behind fixed screen aperture | `ORIGINAL_REQUEST.md` (R3, AC5) | Frame saliency center $(x, y)$, aperture dimensions | Computed transform matrix / texture UV offset $(u, v)$ | Clamp offsets to prevent black border over-pan | Extreme aspect ratios (e.g. 2.39:1 inside 1.43:1) | Verify video texture pans horizontally/vertically without revealing black borders |
| **F25** | Framing ML | Framing Rule: Rule of Thirds | Detects primary focal subjects/faces and aligns with 1/3 and 2/3 power point grid lines | `ORIGINAL_REQUEST.md` (R3) | Subject bounding box coordinates $(x, y, w, h)$ | Optimal target X/Y pan aligning subject to grid line | Fallback to center framing if no subject found | Multiple subjects on opposite sides of frame | Run test video with off-center subject; verify computed pan aligns subject near $x=0.33$ or $x=0.66$ |
| **F26** | Framing ML | Framing Rule: Leading Lines | Detects perspective line convergence / vanishing point and balances framing | `ORIGINAL_REQUEST.md` (R3) | Gradient edge vectors / line segment pairs | Vanishing point $(V_x, V_y)$ and framing offset | Default to Rule of Thirds if no lines detected | Chaotic textured scenes (foliage, noise) | Test with corridor/road scene; verify vanishing point is centered within viewport |
| **F27** | Framing ML | Framing Rule: Frame-within-a-Frame | Detects internal geometric borders/doorways and aligns internal frame to viewport | `ORIGINAL_REQUEST.md` (R3) | High-contrast contour rectangles | Bounding sub-frame $(x_1, y_1, x_2, y_2)$ alignment | Default to global saliency if no sub-frame | Partial/occluded doorway or window | Test with doorway framing shot; verify internal frame boundaries align with screen edges |
| **F28** | Framing ML | Framing Rule: Screen Direction | Analyzes subject motion vectors & gaze orientation to maintain look/lead room | `ORIGINAL_REQUEST.md` (R3) | Motion optical flow vectors / facial orientation | Look room offset $\Delta X$ in direction of motion | Neutral lead room if motion is static | Rapid direction oscillation (erratic movement) | Test subject running left-to-right; verify camera pans left to create lead room on the right |
| **F29** | Framing ML | Panning Motion Smoothing & Cut Reset | Smooths camera pan via lerp filter and resets instantly on scene cuts (>40% delta) | `ORIGINAL_REQUEST.md` (R3) | Raw target offsets, consecutive frame histogram delta | Smoothed interpolated pan coordinates $P_t$ | Instant reset to center on scene transition | Flash frames, strobing lights | Verify smooth continuous pan during movement; verify instant cut switch (no camera whip) on hard shot cuts |
| **F30** | Framing ML | Diagnostic HUD & Telemetry Overlay | Interactive debug overlay showing bounding boxes, 3x3 grid, vectors, X/Y pan & FPS | `ORIGINAL_REQUEST.md` (R3, AC5) | Toggle "Diagnostic HUD" button / keyboard shortcut | Rendered canvas HUD overlay with metrics | Hide gracefully when toggled off | HUD opened in full-screen mode | Toggle HUD on; verify visual bounding boxes, Rule of Thirds grid, and live $(X, Y)$ offset numbers are displayed |
| **F31** | UX & State | 10s Ticket Printing Animation | Diegetic 10-second ticket dispenser animation upon starting any CineMorph video | `ORIGINAL_REQUEST.md` (R4, AC6) | User clicks play on local or remote video | 10-second visual printing sequence; auto-starts video | Allow manual skip button if configured | User rapidly clicks play/pause during animation | Start movie; verify ticket printer animation runs for exactly 10.0s before playback begins |
| **F32** | UX & State | Heads-Up ML Pre-Processing | Pre-processes initial video frames and primes ML/WebGL buffers during the 10s animation | `ORIGINAL_REQUEST.md` (R4) | Video media stream during 10s loading window | Pre-calculated framing cache for initial 30s | Graceful fallback if video fails to decode | Very short video (<10s duration) | Profile CPU/worker during 10s printing; verify frame analysis occurs concurrently in the background |
| **F33** | UX & State | Torn Ticket Progress Serialization | Automatically creates and updates a "Torn Ticket" record in local storage during playback | `ORIGINAL_REQUEST.md` (R4, AC7) | Video timeupdate events (throttled 1s) | Updated ticket record in `omnistream_tickets` | Error log if storage quota exceeded | Playback at $t=0$ or within last 5s (near end) | Play local video to 01:15; verify `omnistream_tickets` contains entry with `timestamp: 75` and thumbnail |
| **F34** | UX & State | Torn Ticket Resume Mechanism | Clicking a saved torn ticket stub resumes playback at the exact saved timestamp | `ORIGINAL_REQUEST.md` (R4, AC7) | User clicks a saved ticket stub | CineMorph launches and seeks to saved `timestamp` | Prompt user to select local file if blob revoked | Ticket with missing video source | Refresh page, click torn ticket with saved timestamp 01:15; verify video resumes at exactly 01:15 |
| **F35** | UX & State | Storage Schema & Data Integrity | Robust JSON schema handling for tickets, subscriptions, history, and preferences | `ORIGINAL_REQUEST.md` (R1, R4) | Local storage read/write operations | Validated and hydrated application state | Auto-repair corrupted keys with default initial state | Corrupted JSON in `LocalStorage` | Inject malformed JSON into `omnistream_user_prefs`; verify app boots cleanly with default fallback state |

---

## 5. Comprehensive Edge Cases & Resilience Matrix

| # | Feature / Area | Edge Case Scenario | Root Cause / Trigger | Expected System Behavior & Mitigation Strategy |
|---|----------------|-------------------|----------------------|-------------------------------------------------|
| **E01** | U-TUBE Search | Search query yields fewer than 3 results from YouTube API | Niche or highly obscure search term | Return all available results ($0, 1, \text{or } 2$) and display a subtle badge "Exact matches found"; do not pad with irrelevant garbage. |
| **E02** | U-TUBE Search | Empty search string or only whitespace submitted | User presses enter on empty input | Ignore empty submission or display recent search history dropdown without triggering network requests. |
| **E03** | U-TUBE Search | Query contains special characters / emojis (`#%&*?🔥`) | User inputs URI special characters | Sanitize and URI-encode query with `encodeURIComponent` before dispatching to API. |
| **E04** | U-TUBE Direct Link | Malformed or unrecognized YouTube URL pasted | Typo in URL or unsupported video domain | Validate URL regex; display an inline error message: "Please enter a valid YouTube URL (e.g. youtube.com/watch?v=... or youtu.be/...)". |
| **E05** | U-TUBE Direct Link | URL contains timestamp / playlist parameters (`?t=120&list=PL...`) | User copies URL from playlist or active watch point | Parser extracts clean `videoId` and initial seek time $t=120s$; starts playback directly at 2:00. |
| **E06** | U-TUBE Subscriptions | Subscribing to a channel already in subscriptions | User clicks subscribe button multiple times | Toggle behaves idempotently: second click triggers "Unsubscribe" action with immediate UI feedback. |
| **E07** | U-TUBE 4-Hr Refresh | System clock modified or invalid timestamp in storage | User changes system time or local storage corrupted | Sanitize timestamp; if `isNaN(lastFetched)` or `lastFetched > Date.now()`, reset timestamp and re-fetch feed safely. |
| **E08** | U-TUBE 4-Hr Refresh | User is offline when the 4-hour refresh timer expires | Network disconnected during feed refresh attempt | Gracefully catch network error, preserve existing cached videos in feed, and display an offline badge. |
| **E09** | U-TUBE Keyword Recs | New user with zero search or watch history | Fresh browser installation with empty LocalStorage | Populate recommendations with curated default high-definition cinematic / educational topics. |
| **E10** | U-TUBE Keyword Recs | User searches only for stop words ("the and of a") | User enters low-information search terms | NLP filter removes all stop words; if no content words remain, fall back to trending / general topics. |
| **E11** | CineMorph 3D | WebGL context lost or unsupported GPU | Hardware acceleration disabled or GPU crash | Display a retro-styled paper notice: "WebGL Theater Unavailable — Switching to 2D Vintage Cinema Player", falling back to CSS/Canvas player. |
| **E12** | CineMorph 3D | Extreme browser window aspect ratio (e.g. 32:9 or 9:16 portrait) | Window resizing to unusual dimensions | Three.js perspective camera recalculates aspect ratio and clamps FOV between $45^\circ$ and $85^\circ$ to prevent screen distortion. |
| **E13** | CineMorph 3D | Non-standard video resolution (e.g. 4:3 native video in 1.43:1 mode) | Video aspect differs from selected theater aperture | Video fills aperture height, ML pan centers horizontal focal point, and soft letterboxing/pillarboxing is applied only if unavoidable. |
| **E14** | CineMorph Media | Local file `blob:` URL invalidated after page refresh | Browser revokes object URLs on page unload | Stored ticket identifies missing blob; prompts user with a 1-click modal: "Select file `[filename]` to resume where you left off". |
| **E15** | CineMorph Media | High-bitrate 4K 60FPS local MKV file loaded | Codec or decoding bandwidth limitations | Utilize standard HTML5 `<video>` hardware acceleration; if MKV container is unsupported by browser, notify user to load MP4/WebM. |
| **E16** | CineMorph Offline | Network drops during YouTube playback in CineMorph | Internet connection lost mid-stream | Immediately trigger offline fallback: switch aspect ratio to 4:3, pause live ML calculation loop to preserve local CPU, and display offline alert. |
| **E17** | Framing ML | Video contains rapid strobe lighting / flash frames | High luminance fluctuation within single shot | Saliency engine incorporates temporal smoothing ($N=5$ frame moving average) to prevent erratic frame jitter. |
| **E18** | Framing ML | Multiple focal subjects on opposite sides of the frame | Two people talking at far left and far right | Saliency engine calculates weighted midpoint centroid and aligns primary speaker or centers the conversation plane. |
| **E19** | Framing ML | Pure black or featureless video frames (e.g. fade to black) | Scene transition or credit roll | Zero-gradient detector sets pan coordinates to neutral center $(0.5, 0.5)$ until next active scene. |
| **E20** | UX Ticket Printing | User presses Play/Pause repeatedly during the 10s animation | Rapid user interaction on loading screen | Debounce inputs; ticket animation sequence plays through smoothly with a "Skip Intro" option if enabled. |
| **E21** | UX State | Browser `LocalStorage` quota exceeded (`QuotaExceededError`) | Too many watch history items or high-resolution thumbnails | Evict oldest watch history and thumbnail records using Least Recently Used (LRU) policy; keep subscription and ticket data intact. |
| **E22** | UX State | Video played to within 5 seconds of the end | User watches video almost to the conclusion | Auto-mark ticket as "Completed"; reset resume point to $t=0$ on subsequent ticket clicks while preserving watch history record. |

---

## 6. Data Schemas & Type Contracts

### 6.1. TypeScript Interface Definitions

```typescript
// ==========================================
// Core Media & Video Types
// ==========================================

export type MediaSourceType = 'youtube' | 'local';
export type AspectRatioMode = '1.43:1' | '1.90:1' | 'original' | '4:3';
export type FramingRule = 'rule_of_thirds' | 'leading_lines' | 'frame_within_frame' | 'screen_direction' | 'hybrid';

export interface VideoMetadata {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  publishedAt: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  sourceType: MediaSourceType;
  localFileName?: string;
  aspectRatio: number; // e.g. 1.777 (16:9)
}

// ==========================================
// UX & Ticket State Types
// ==========================================

export interface MovieTicket {
  ticketId: string;
  mediaId: string;
  title: string;
  sourceType: MediaSourceType;
  localFileName?: string;
  channelTitle?: string;
  timestamp: number; // Current playback progress in seconds
  duration: number; // Total duration in seconds
  aspectRatioMode: AspectRatioMode;
  thumbnailDataUrl: string; // Captured canvas frame snapshot
  isCompleted: boolean;
  seatNumber: string; // e.g. "Row C, Seat 14"
  ticketNumber: string; // e.g. "OMNI-849204"
  printedAt: number; // Epoch timestamp
  lastWatchedAt: number; // Epoch timestamp
}

// ==========================================
// Subscriptions & Refresh Engine Types
// ==========================================

export interface ChannelSubscription {
  channelId: string;
  title: string;
  avatarUrl: string;
  description?: string;
  subscriberCount?: string;
  subscribedAt: number;
}

export interface SubscriptionFeedCache {
  lastFetchedAt: number; // Epoch timestamp
  ttlMs: number; // Exactly 14,400,000 ms (4 hours)
  videos: VideoMetadata[];
}

// ==========================================
// Search & Keyword Recommendations
// ==========================================

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
}

export interface KeywordProfile {
  topKeywords: { keyword: string; weight: number }[];
  lastCalculatedAt: number;
}

export interface RecommendationFeed {
  recommendedVideos: VideoMetadata[]; // Exactly 5 videos
  extractedKeywordContext: string[];
  generatedAt: number;
}

// ==========================================
// Advanced Framing ML & Telemetry Types
// ==========================================

export interface FramingCoordinates {
  panX: number; // -1.0 (far left) to +1.0 (far right), 0.0 is center
  panY: number; // -1.0 (top) to +1.0 (bottom), 0.0 is center
  scale: number; // Scale multiplier (>= 1.0)
  activeRule: FramingRule;
}

export interface SubjectBoundingBox {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  width: number;
  height: number;
  confidence: number;
  type: 'face' | 'person' | 'salient_object';
}

export interface FramingDiagnosticTelemetry {
  fps: number;
  inferenceTimeMs: number;
  currentPan: { x: number; y: number };
  targetPan: { x: number; y: number };
  subjects: SubjectBoundingBox[];
  vanishingPoint: { x: number; y: number } | null;
  internalFrameRect: { x: number; y: number; width: number; height: number } | null;
  activeRule: FramingRule;
  ruleScores: {
    ruleOfThirds: number;
    leadingLines: number;
    frameWithinFrame: number;
    screenDirection: number;
  };
  isSceneCut: boolean;
  histogramDelta: number;
}

// ==========================================
// User Preferences
// ==========================================

export interface UserPreferences {
  rootLandingPreference: 'ask' | 'v1' | 'v2';
  theme: 'white_red' | 'vintage_paper' | 'dark';
  defaultAspectRatio: AspectRatioMode;
  framingSmoothingAlpha: number; // default 0.08
  showDiagnosticHUD: boolean;
  enableTicketAnimation: boolean;
  audioDSPEnabled: boolean;
}
```

### 6.2. LocalStorage Key Names & Schemas

| Key Name | Storage Type | Schema Format | Description |
|----------|--------------|---------------|-------------|
| `omnistream_tickets` | `LocalStorage` | `Record<string, MovieTicket>` | Keyed by `mediaId` or `ticketId`. Stores torn ticket progress and thumbnail snapshots. |
| `omnistream_subscriptions` | `LocalStorage` | `ChannelSubscription[]` | List of user-subscribed channels. |
| `omnistream_sub_feed` | `LocalStorage` | `SubscriptionFeedCache` | Subscribed channel videos cache with 4-hour TTL check. |
| `omnistream_search_history`| `LocalStorage` | `SearchHistoryEntry[]` | Chronological list of user search queries. |
| `omnistream_recommendations`| `LocalStorage` | `RecommendationFeed` | Exactly 5 recommended videos generated from keyword analysis. |
| `omnistream_user_prefs` | `LocalStorage` | `UserPreferences` | Global UI and playback preferences. |

---

## 7. Acceptance Criteria & Test Verification Specifications

### 7.1. U-TUBE Acceptance Criteria

| Criteria ID | Acceptance Requirement | Test Procedure / Verification Mechanism | Pass / Fail Benchmark |
|-------------|------------------------|-----------------------------------------|------------------------|
| **AC-UT-1** | Searching a query fetches and displays exactly 3 relevant YouTube results | 1. Enter query "Computer Architecture" in search box.<br>2. Submit search.<br>3. Count rendered video result cards in UI and DOM. | DOM contains exactly 3 `.video-card` elements; all 3 match the search topic. |
| **AC-UT-2** | Subscribed channel data persists across browser reloads | 1. Navigate to a channel page.<br>2. Click "Subscribe".<br>3. Verify button changes to "Subscribed".<br>4. Hard reload browser (`Ctrl+F5`).<br>5. Inspect Subscriptions page. | Channel appears in Subscriptions page; LocalStorage key `omnistream_subscriptions` contains channel entry. |
| **AC-UT-3** | Search history persists across browser reloads | 1. Perform 3 distinct searches: "Three.js", "React 19", "IMAX 70mm".<br>2. Hard reload browser.<br>3. Click search input. | Dropdown displays all 3 previous search queries in reverse chronological order. |
| **AC-UT-4** | Subscriptions feed enforces 4-hour refresh cycle | 1. Trigger subscription feed fetch.<br>2. Verify `lastFetchedAt` timestamp stored.<br>3. Mock time advance by 3 hours: mount feed -> verify 0 network requests dispatched.<br>4. Mock time advance by 4 hours 1 min: mount feed -> verify new network fetch is executed. | Feed does not re-fetch before 4h TTL expiry; refreshes automatically after 4h. |
| **AC-UT-5** | Recommendation engine outputs exactly 5 keyword-based recommendations | 1. Populate search history with keywords.<br>2. Navigate to Home dashboard.<br>3. Count rendered recommendation cards. | Home page renders exactly 5 video cards under "Recommended For You" section. |
| **AC-UT-6** | All video playback is completely ad-free | 1. Start playback of 5 popular monetization-enabled YouTube videos.<br>2. Monitor network calls and player DOM. | Zero pre-roll or mid-roll video advertisements played; zero third-party ad iframe overlays. |

### 7.2. CineMorph 3D Acceptance Criteria

| Criteria ID | Acceptance Requirement | Test Procedure / Verification Mechanism | Pass / Fail Benchmark |
|-------------|------------------------|-----------------------------------------|------------------------|
| **AC-CM-1** | Three.js renders a recognizable theater environment with screen and seats that scale with window | 1. Navigate to CineMorph player.<br>2. Inspect WebGL scene.<br>3. Resize browser window from 1920x1080 to 1280x720 and 2560x1440. | WebGL canvas displays 3D curved screen and seating rows; camera matrix updates without aspect distortion. |
| **AC-CM-2** | App successfully loads a local MP4 file and plays it within the 3D screen | 1. Click "Open Local Movie".<br>2. Select a local `.mp4` file.<br>3. Observe 3D theater screen. | Local video plays cleanly on the curved 3D screen surface with synchronized audio. |
| **AC-CM-3** | Aspect ratio selector switches between 1.43:1, 1.90:1, and Original | 1. Toggle aspect ratio switch to 1.43:1.<br>2. Toggle to 1.90:1.<br>3. Toggle to Original. | 3D screen geometry and framing aperture transform accurately to the exact mathematical proportions. |
| **AC-CM-4** | UI displays vintage paper theme with diegetic props | 1. Inspect CineMorph dashboard and controls.<br>2. Verify visual styling elements. | Parchment paper textures, vintage projector reels, retro camera, and ticket printer are visually present. |
| **AC-CM-5** | Offline fallback switches to 4:3 cropped ratio without live ML | 1. While video is playing, disconnect network (`navigator.onLine = false`).<br>2. Observe player behavior. | Player immediately switches to 4:3 cropped mode; frame analysis interval is cleared/paused. |

### 7.3. Advanced Framing Geometry Acceptance Criteria

| Criteria ID | Acceptance Requirement | Test Procedure / Verification Mechanism | Pass / Fail Benchmark |
|-------------|------------------------|-----------------------------------------|------------------------|
| **AC-ML-1** | Diagnostic overlay confirms client-side ML runs on frames and outputs dynamic X/Y panning coordinates | 1. Start local video playback.<br>2. Toggle "Diagnostic HUD" switch.<br>3. Observe telemetry values while subject moves in frame. | HUD overlay displays live bounding boxes, 3x3 Rule-of-Thirds grid, and dynamic $(X, Y)$ offset coordinates updating in real time. |
| **AC-ML-2** | Framing engine applies Rule of Thirds power point alignment | 1. Feed a test video with a person standing on the right third.<br>2. Monitor calculated $(X, Y)$ coordinates. | Panning offset shifts the subject toward $x \approx 0.66$ (right vertical grid line). |
| **AC-ML-3** | Framing engine applies Leading Lines perspective centering | 1. Feed a corridor / road scene.<br>2. Inspect vanishing point calculations. | Framing adjusts horizontally to center the perspective vanishing line. |
| **AC-ML-4** | Camera pan motion is smoothed with instant cut reset | 1. Play video containing both continuous motion and hard shot cuts.<br>2. Observe pan trajectory. | Smooth panning during continuous movement (lerp filter); instant cut reset without camera whip when histogram delta exceeds 40%. |

### 7.4. UX & State Management Acceptance Criteria

| Criteria ID | Acceptance Requirement | Test Procedure / Verification Mechanism | Pass / Fail Benchmark |
|-------------|------------------------|-----------------------------------------|------------------------|
| **AC-UX-1** | Playing a CineMorph video triggers the 10-second ticket printer animation before playback begins | 1. Select a video to watch in CineMorph.<br>2. Time the duration of the ticket printer animation. | Animation sequence plays for exactly 10.0 seconds; video playback starts immediately upon completion. |
| **AC-UX-2** | Background heads-up ML processing executes during the 10s animation | 1. Monitor CPU/worker activity during the 10s animation window. | Initial video frames are decoded and analyzed before the 10s timer ends, ensuring 0 playback stutter at start. |
| **AC-UX-3** | Video progress is saved locally as a torn ticket | 1. Play a video to 03:45.<br>2. Pause or navigate away.<br>3. Inspect `omnistream_tickets` in LocalStorage. | Stored ticket record has `timestamp: 225` with valid title, duration, and thumbnail data URL. |
| **AC-UX-4** | Refreshing page and clicking a saved ticket resumes video at correct timestamp | 1. Hard refresh browser page.<br>2. Navigate to Bento landing or CineMorph ticket drawer.<br>3. Click the saved torn ticket stub. | CineMorph launches and video resumes playback at exactly 03:45. |
| **AC-UX-5** | Bento landing page provides seamless navigation between U-TUBE and CineMorph | 1. Open root path `/`.<br>2. Click U-TUBE card -> navigates to `/home`.<br>3. Return and click CineMorph card -> navigates to `/cinemorph`. | Both routes load instantaneously with full module styling and state preserved. |
