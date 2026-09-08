# OmniStream Version History

This document serves as the authoritative, permanent version timeline and Git recovery index for **OmniStream**.

---

## Quick Navigation Index

| Version | Date | Type | Quick Summary | Git Tag | Commit |
|---|---|:---:|---|:---:|:---:|
| **v1.8.3** | 2026-09-08 | `PATCH` | CineMorph Cinema-Lounge Stabilization: Forensic bug & flow audit, transparent screen hotspot, standby prompt placement, Blob URL persistence protection, dead-code eviction, and 100% test-suite alignment. | `v1.8.3` | `HEAD` |
| **v1.8.2** | 2026-09-05 | `PATCH` | CineMorph Saved Ticket Resumption, Pre-Flight Bumper Protection & In-Theater Media Continuity: Architectural persistence fix with IndexedDB media blob lifecycle, pre-flight playability validation before intro, proscenium reconnection affordance, throttled progress saving, and subtle lobby ticket stubs tray. | `v1.8.2` | `internal` |
| **v1.8.1** | 2026-09-05 | `PATCH` | CineMorph True Physical Theater Projection Correction & 2.39:1 Aspect Ratio Eradication: Upgraded second environment to authentic cinema projection with proscenium recess, motorized velvet aperture masking, dynamic room light spill, and complete eradication of 2.39:1. | `v1.8.1` | `internal` |
| **v1.8.0** | 2026-09-02 | `MINOR` | Universal Perception & Intelligent Smart Framing: MediaPipe BlazeFace WASM SIMD perception, normalized evidence schema, multi-subject composition, switching hysteresis, cascaded poster intelligence, 3-state scene transition engine, and Web Audio dynamic speech clarity adaptation. | `v1.8.0` | `internal` |
| **v1.5.5** | 2026-09-02 | `PATCH` | Safe Pre-v1.8.0 Baseline Checkpoint: Decoupled Perception-Decision-Stabilization contracts, zero runtime neural dependencies in core, and strict baseline test verification. | `v1.5.5` | `internal` |
| **v1.5.2** | 2026-09-01 | `MINOR` | Lightweight client-side media demuxing engine for MP4/MKV/WebM/MOV/Audio with multi-track audio detection, original Unicode title preservation, live hardware/WebAudio stream switching, and codec playability verification. | `v1.5.2` | [`3467c79`](https://github.com/UdayPatnala/OmniStream/commit/3467c79) |
| **v1.5.1** | 2026-09-01 | `PATCH` | Calibrated exact concave cinema screen curvature hierarchy (Original: 0%, CineMorph IMAX: 0.65%, True IMAX: 0.95%, U-Tube: 1.25%) with 3-tier proportional auditorium seating and zero video distortion. | `v1.5.1` | [`8a42eaa`](https://github.com/UdayPatnala/OmniStream/commit/8a42eaa) |
| **v1.5.0** | 2026-09-01 | `MINOR` | Stable baseline checkpoint uniting U-Tube and CineMorph under central gateway. | `v1.5.0` | [`1431a08`](https://github.com/UdayPatnala/OmniStream/commit/1431a08) |
| **v1.0.0** | 2026-08-30 | `MAJOR` | Initial OmniStream unified dual-engine architecture release. | `v1.0.0` | [`initial`](https://github.com/UdayPatnala/OmniStream/commit/initial) |

---

## Version Entries

### v1.8.3

- **Date**: 2026-09-08
- **Type**: `PATCH` (CineMorph Cinema-Lounge Stabilization, Forensic Audit & Release Closure)
- **Previous Version**: `v1.8.2`

#### Quick
Forensic runtime and UX-flow audit resolving confirmed CineMorph bugs, dead-code eviction, performance hardening, and full test-suite re-alignment to reflect intentional security behavior.

- **BUG-P1-01 Fixed (store.ts)**: `localMediaHistory` and `activeLocalMedia` explicitly excluded from Zustand `partialize` to prevent dead session-scoped Blob URLs from persisting across browser restarts. In-memory store retains them; durable blobs live in IndexedDB (established in v1.8.2).
- **BUG-P1-02/03 Fixed (CineMorphLanding.tsx)**: Added `isIngesting` session-lock and `activeSessionIdRef` to prevent race conditions on rapid file-picker clicks. Added unmount cleanup that revokes all generated Blob URLs held in `activeBlobUrlsRef`. Reset `fileInputRef.current.value` after each selection so re-selecting the same file triggers the change event.
- **Cinema Screen Hotspot (CinemaLounge.tsx)**: Transparent, invisible clickable button proportionally aligned to the exact inner bounds of the physical cinema screen (`left: 45.2%`, `top: 21%`, `width: 30.6%`, `height: 30.2%`) using responsive CSS percentages. No hover effects, no borders, no instructional copy visible on the screen surface.
- **Standby Prompt (CinemaLounge.tsx)**: `CLICK SCREEN TO CONTINUE` rendered as a single clean line in `font-cinematic-mono` with zero pill, border, glow, or animation. Positioned strictly below the CineMorph AI logo text at the bottom of the screen surface (`flex-col justify-end items-center pb-2 sm:pb-3`).
- **Dead Assets Evicted**: Deleted `public/cinemorph_lobby.jpg` (335 KB), `public/cinemorph_lobby_day.jpg` (51 KB), `public/cinemorph_ui_props.jpg` (299 KB). Retained `public/cinemorph_artwork.png` (referenced by ThresholdPortal, posterService, and test suites).
- **Dead Components Evicted**: Deleted unreferenced landing components: `CineMorphArrivalLobby.tsx`, `CineMorphLobbySpace.tsx`, `CineMorphTheaterThreshold.tsx`, `PersonalScreeningRoom.tsx`, `CineMorphBookingOffice.tsx`. Deleted obsolete test: `screeningCustomization.test.tsx`.
- **Test Suite Re-Alignment (T1-STOR-04)**: Updated `local-storage-persistence.test.ts` T1-STOR-04 to assert that `localMediaHistory` is intentionally absent from localStorage — documenting the BUG-P1-01 fix as authoritative product behavior rather than a defect.
- **Lint Fix (CineMorphLanding.tsx)**: Added missing `useEffect` to React import to resolve TS2304 compile error introduced by the cleanup pass.

#### Module Version Hierarchy
- **OmniStream Core (`OS`)**: `v1.8.3`
- **CineMorph Product (`CM`)**: `v1.8.3`
  - *Cinema-Lounge Interaction (`CM-LOUNGE`)*: `v1.8.3`
  - *Theater & Projection Architecture (`CM-TH`)*: `v1.8.2`
  - *Ticket & Resumption Engine (`CM-TICKET`)*: `v1.8.2`
  - *Spatial Screening Room (`CM-ROOM`)*: `v1.8.1`
  - *Universal Visual & Audio Perception System (`CM-PERCEPT`)*: `v1.8.0`
- **U-Tube Product (`UT`)**: `v1.8.0` (Frozen & untouched)

---

### v1.8.2


- **Date**: 2026-09-05
- **Type**: `PATCH` (CineMorph Saved Ticket Resumption, Pre-Flight Bumper Protection & In-Theater Media Continuity)
- **Previous Version**: `v1.8.1`

#### Quick
Comprehensive architectural resolution for saved CineMorph tickets and media resumption across browser reloads, eradicating the black/unresponsive screen failure state.
- **Pre-Flight Playability Validation**: Implemented asynchronous pre-flight probing in `CineMorphTheater.tsx` ensuring the Theater intro bumper is never initiated if the media source is unplayable or detached.
- **IndexedDB Media Blob Lifecycle**: Integrated automatic async persistence of local media Blobs into `IDB_STORES.MEDIA_BLOBS` upon selection and confirmed theater entry. Reconstructs fresh live `URL.createObjectURL(blob)` on demand upon reload or when resuming from saved tickets.
- **Proscenium Reconnection Affordance**: Built an authentic, in-world theatrical reconnection stage into the cinema proscenium. If local media storage has expired or was cleared, the user is presented with an ambient affordance preserving their exact movie title, reserved seat, aspect ratio, and saved timecode, enabling 1-click re-attachment of the source reel with zero data loss.
- **Continuous Playback Persistence & Accurate Seek**: Wired 5-second throttled progress persistence during active playback, with immediate state synchronization on `pause`, `visibilitychange`, `beforeunload`, and unmount. Restores exact timecode upon `onLoadedMetadata` seek.
- **Subtle Lobby Saved Tickets Tray**: Embedded a compact, physical-feeling ticket stubs collection in the Left Wing of the CineMorph Lobby Space, displaying thumbnail artwork, seat assignment, and timestamp with 1-click restoration.
- **Verified Resilience**: Full automated test coverage in `src/test/savedTicketResumption.test.ts` verifying blob URL restoration from IndexedDB, missing blob handling, ticket relinking, and YouTube ticket resumption.

#### Module Version Hierarchy
- **OmniStream Core (`OS`)**: `v1.8.2`
- **CineMorph Product (`CM`)**: `v1.8.2`
  - *Theater & Projection Architecture (`CM-TH`)*: `v1.8.2`
  - *Ticket & Resumption Engine (`CM-TICKET`)*: `v1.8.2`
  - *Spatial Screening Room (`CM-ROOM`)*: `v1.8.1`
  - *Universal Visual & Audio Perception System (`CM-PERCEPT`)*: `v1.8.0`
- **U-Tube Product (`UT`)**: `v1.8.0` (Frozen & untouched)

---

### v1.8.1

- **Date**: 2026-09-05
- **Type**: `PATCH` (CineMorph True Physical Theater Projection Correction & 2.39:1 Aspect Ratio Eradication)
- **Previous Version**: `v1.8.0`

#### Quick
Comprehensive correction of the second CineMorph environment (**Personal Screening Room / Room Calibration**) to transform the media presentation from an embedded web player / card into a genuine physical theater projection permanently integrated into the cinema proscenium architecture, accompanied by complete eradication of the `2.39:1` aspect ratio across all CineMorph components.
- **Physical Proscenium Screen Architecture**: Anchored an authentic matte white 1.1-gain projection fabric surface directly into the proscenium wall recess with deep 3D shadow depth, beveled proscenium frame, and dark black velvet light-absorption masking borders.
- **True Projection Optics**: Replaced sharp flat CSS video borders with natural optical characteristics: soft lens edge falloff (`radial-gradient(ellipse)` vignetting), overhead volumetric projector beam cone, diffuse screen fabric reflection, and zero fake film grain or noise.
- **Dynamic Environmental Light Spill**: Integrated real-time 16x9 canvas sampling of playing video/artwork to cast subtle ambient illumination onto the auditorium proscenium arch, ceiling cove downlights, and stage apron.
- **Motorized Velvet Aperture Masking**: Aspect ratio switches now actuate physical velvet masking shutters inside the fixed architectural screen rather than resizing a web component.
- **2.39:1 Aspect Ratio Eradication**: Cleanly removed `2.39:1` from `PersonalScreeningRoom.tsx`, `CineMorphLanding.tsx`, `CineMorphHero.tsx`, `CineMorphExperience.tsx`, and `InsideTheater.tsx`, formally consolidating the canonical 3-tier CineMorph aperture standard (`1.43:1 True IMAX`, `1.90:1 IMAX Widescreen`, `Original Directorial Native`).
- **Physical Room Controls**: Aligned aspect ratio controls with the illuminated stage apron format monitors from `cinemorph_auditorium.jpg`, and acoustic modes with the flanking wall speaker arrays.

#### Module Version Hierarchy
- **OmniStream Core (`OS`)**: `v1.8.1`
- **CineMorph Product (`CM`)**: `v1.8.1`
  - *Spatial Screening Room (`CM-ROOM`)*: `v1.8.1`
  - *Adaptive Smart Framing Engine (`CM-SF`)*: `v1.8.0`
  - *Universal Visual & Audio Perception System (`CM-PERCEPT`)*: `v1.8.0`
- **U-Tube Product (`UT`)**: `v1.8.0` (Frozen & untouched)

---

### v1.8.0

- **Date**: 2026-09-02
- **Type**: `MINOR` (Universal Perception & Intelligent Smart Framing)
- **Previous Version**: `v1.5.5`

#### Quick
Completed full implementation of OmniStream v1.8.0 Execution Phases (E1 through E12), Scope Restoration & UI Freeze, CineMorph Theater Fixed Formats & Aspect Ratio Recovery, CineMorph Real-Time Timed Captions synchronization (I3), U-Tube Functional Architecture Recovery (I1 & I2), and CineMorph Media Compatibility & Audio Track Discovery (I4).
- **Scope Restoration & UI Freeze**: Surgical rollback of unintended lobby redesign experiments; master Cosmic Threshold Portal restored on `/`; CineMorph Virtual Theater Ingestion Hall restored on `/cinemorph` with landing UI strictly frozen.
- **Architectural & Terminology Alignment**: Confirmed AROH as branding presence only (zero artificial module overhead), and confirmed Studio as the CineMorph Theater player/controller environment.
- **CineMorph Theater Aspect Ratio & Mode Recovery**: Fixed derived mode flags in `CineMorphTheater.tsx` ensuring `1.43:1 True IMAX`, `1.90:1 IMAX`, and `Original` engage their distinct concave curvatures, smart framing scale transforms, and proportional seating layouts.
- **Issue Fix I4 (CineMorph Media Compatibility & Audio Discovery)**: Multi-track audio discovery enhanced with MP4 tail-moov scanning, Matroska BCP47/Name extraction, strict priority for genuine track titles, browser `AudioTracks` API probing, and honest feedback on unsupported audio codecs (DTS / TrueHD / non-passthrough AC3).
- **Issue Fix I3 (Caption System Repair & Visual Unification)**: Real-time WebVTT/SRT parser with active cue synchronization (`cuechange`), zero static placeholders, and unified `CaptionOverlay` standardizing transparent background, white text, subtle multi-layer drop shadow, responsive font sizing (`clamp(14px, 2vw, 20px)`), and control-safe positioning across both theater experiences.
- **U-Tube Issue I1 (Discovery, Search, Subscriptions)**: Genuine search proxy, topic-aware recommendations with diversity constraints, single source of truth subscriptions, and decoupled channel navigation.
- **U-Tube Issue I2 (Player Timeline & Scrubbing)**: State-machine separated seeker (`SYNCING`, `SCRUBBING`, `SEEKING`), pointer capture (`setPointerCapture`) with `touch-action: none`, seek-aware synchronization preventing race conditions, and keyboard accessibility.

#### Module Version Hierarchy
- **OmniStream Core (`OS`)**: `v1.8.0`
  - *Cosmic Dual-Portal Threshold Gateway (`OS-THRESHOLD`)*: `v1.8.0`
  - *Unified Caption & Accessibility Overlay (`OS-CAPTION`)*: `v1.8.0`
- **CineMorph Product (`CM`)**: `v1.8.0`
  - *Adaptive Smart Framing Engine (`CM-SF`)*: `v1.8.0`
  - *Universal Visual & Audio Perception System (`CM-PERCEPT`)*: `v1.8.0`
  - *Video & Frame Quality Intelligence (`CM-VQ`)*: `v1.8.0`
  - *5-Band Parametric Audio DSP & Dynamic Clarity (`CM-DSP`)*: `v1.8.0`
  - *Lightweight Stream Demuxer (`CM-DEMUX`)*: `v1.0.0`
  - *Active Audio Routing Engine (`CM-AUD`)*: `v1.0.1`
- **U-Tube Product (`UT`)**: `v1.8.0`
  - *U-Tube Core Discovery & Watch Engine (`UT-CORE`)*: `v1.8.0`
  - *U-Tube Timeline & Seeker Engine (`UT-SEEK`)*: `v1.8.0`

---

### v1.5.5

- **Date**: 2026-09-02
- **Type**: `PATCH` (Safe Pre-v1.8.0 Baseline Checkpoint)
- **Previous Version**: `v1.5.2`

#### Quick
Verified clean architectural baseline and zero-neural-dependency fallback guarantees prior to E1-E12 perception integration.

---

### v1.5.2

- **Date**: 2026-09-01
- **Type**: `MINOR` (Media Compatibility, Multi-Stream Demuxing & Track Switching Engine)
- **Previous Version**: `v1.5.1`

#### Quick
Implemented a high-performance, lightweight ($< 2 \text{ MB}$ header slice) client-side binary demuxer for personal local media files (MP4, MKV, WebM, MOV, direct audio). Fully restores multi-track audio stream discovery, preserves original embedded Unicode track titles, maps ISO-639 languages, enables real audible track switching in CineMorph Theater, and probes audio/video codec compatibility with graceful failure guidance.

#### Detailed
1. **Lightweight Client-Side Binary Demuxer (`mediaParser.ts`)**: Slices only the initial header metadata in $< 15 \text{ ms}$ on multi-gigabyte personal video files without loading entire files into memory. Implements recursive ISOBMFF box scanning (`moov`/`trak`/`mdia`/`stsd`/`udta`) and EBML Matroska/WebM stream scanning (`0x1654AE6B` Tracks, `0xAE` TrackEntry, `0x536E` Name, `0x22B59C` Language, `0x86` CodecID).
2. **Authentic Metadata & Unicode Preservation**: Decodes embedded track names (e.g. `"Original Japanese Mix"`, `"Director Commentary"`, `"English 5.1"`, `"日本語"`, `"हिन्दी"`, `"తెలుగు"`) without generic placeholders or mojibake. Automatically maps ISO-639-1 / ISO-639-2 / BCP-47 language codes to clear natural language names and formats channel layouts (Mono, Stereo, 5.1 Surround, 7.1 Surround).
3. **Real Playback Track Switching (`audioEngine.ts`)**: Provides active hardware audio track selection and Web Audio DSP resynchronization, ensuring that selecting an audio track in the CineMorph Studio drawer switches the real audible playback while locking timeline synchronization (`video.currentTime`).
4. **Pre-Flight Codec Playability Probing**: Probes native browser decode capabilities for common audio codecs (AAC, MP3, Opus, Vorbis, FLAC, ALAC, PCM, AC-3, E-AC-3) and video codecs (H.264, VP9, AV1, HEVC). Accurately flags unsupported proprietary codecs (such as DTS/DTS-HD requiring hardware pass-through) with clear, friendly user feedback rather than silent playback failure.
5. **Zero Feature Creep**: Maintained strict discipline against generic gimmicks, artificial spatializers, or unneeded DSP presets, focusing 100% on genuine playback compatibility, metadata fidelity, and stream control.

#### Module Version Hierarchy
- **OmniStream Core (`OS`)**: `v1.5.2`
- **CineMorph Product (`CM`)**: `v1.5.2`
  - *Lightweight Stream Demuxer (`CM-DEMUX`)*: `v1.0.0`
  - *Active Audio Routing Engine (`CM-AUD`)*: `v1.0.1`
  - *Smart Framing Engine (`CM-SF`)*: `v1.0.1`
  - *Video Quality Intelligence (`CM-VQ`)*: `v1.0.0`
  - *Parametric Audio DSP (`CM-DSP`)*: `v1.0.0`
- **U-Tube Product (`UT`)**: `v1.5.2`

#### Affected Systems
- CineMorph Landing Ingest Pipeline (`CineMorphLanding.tsx`)
- CineMorph Theater Studio Drawer & Audio Controls (`CineMorphTheater.tsx`)
- Client-Side Media Demuxer (`mediaParser.ts`)
- Active Audio Engine (`audioEngine.ts`)
- Core Media Stream Types (`types.ts`)

#### Git Metadata
- **Commit Hash**: `3467c79`
- **Commit Message**: `feat(media): implement client-side MP4/MKV demuxing, multi-track audio detection, and authentic track switching`
- **Git Release Tag**: `v1.5.2`
- **Recovery Command**: `git checkout v1.5.2`

---

### v1.5.1

- **Date**: 2026-09-01
- **Type**: `PATCH` (Theater Geometry & Seating Calibration)
- **Previous Version**: `v1.5.0`

#### Quick
Restored exact theater screen curvature hierarchy (Original flat, IMAX/True IMAX curved, U-Tube noticeably curved) and retained proportional seating in all modes.

#### Detailed
Enforced strict mode boundaries for cinema screen curvature: CineMorph Original Mode preserves an undistorted flat cinema screen (`transform: none`, 0 curvature), while IMAX 1.90:1 and True IMAX 1.43:1 apply calibrated large-format horizontal concave curvature. Ensured VIP auditorium recliner seating remains visibly present across all modes (Original, IMAX, and True IMAX), with True IMAX seating scaled to a proportionally lower/shorter profile (`h-4 sm:h-5`, opacity 35%) so the massive vertical screen remains dominant without any obstruction. Calibrated U-Tube Theater mode to feature a noticeably stronger default horizontal curve (`perspective(1000px) rotateX(0.70deg)`) and integrated its distinct Modern Digital Cinema Blue Seating row at the bottom foreground.

#### Module Version Hierarchy
- **OmniStream Core (`OS`)**: `v1.5.1`
- **CineMorph Product (`CM`)**: `v1.5.1`
  - *Smart Framing Engine (`CM-SF`)*: `v1.0.1`
  - *Video Quality Intelligence (`CM-VQ`)*: `v1.0.0`
  - *Parametric Audio DSP (`CM-DSP`)*: `v1.0.0`
- **U-Tube Product (`UT`)**: `v1.5.1`

#### Affected Systems
- CineMorph Theater B (`/theater/:id`)
- U-Tube Theater A (`/watch/:id`)
- Screen Proscenium Geometry & Horizon Calibration
- Auditorium Seating Visual Hierarchy & Depth Layer

#### Git Metadata
- **Commit Hash**: `dba34a5`
- **Commit Message**: `fix(theater): eliminate all screen black vignettes, calibrate proscenium curves, and implement 2-tier seating across CineMorph and U-Tube theaters`
- **Git Release Tag**: `v1.5.1`
- **Recovery Command**: `git checkout v1.5.1`

---

### v1.5.0

- **Date**: 2026-09-01
- **Type**: `MINOR` (Stable Baseline Milestone)
- **Previous Version**: `v1.0.0`

#### Quick
Stable baseline checkpoint uniting U-Tube discovery and CineMorph fixed-aperture cinema under the OmniStream Gateway.

#### Detailed
Established the consolidated, production-verified foundation for OmniStream 1.x. Refined theater screen geometries (directorial flat mode for Original, calibrated horizontal curvature for IMAX 1.90:1 and True IMAX 1.43:1, and default curved geometry for U-Tube Theater). Lowered auditorium seating profiles for 100% unobstructed sightlines, slimmed CineMorph floating controls deck, removed legacy Instant Play from U-Tube, centralized all global settings exclusively on the OmniStream Master Home Gateway, and hardened all 51 automated test suites.

#### Module Version Hierarchy
- **OmniStream Core (`OS`)**: `v1.5.0`
- **CineMorph Product (`CM`)**: `v1.5.0`
  - *Smart Framing Engine (`CM-SF`)*: `v1.0.0`
  - *Video Quality Intelligence (`CM-VQ`)*: `v1.0.0`
  - *Parametric Audio DSP (`CM-DSP`)*: `v1.0.0`
- **U-Tube Product (`UT`)**: `v1.5.0`

#### Affected Systems
- OmniStream Master Gateway (`/`)
- U-Tube Feed, Player, and Theater A (`/home`, `/watch/:id`)
- CineMorph Ingest Hall and Theater B (`/cinemorph`, `/theater/:id`)
- Web Audio 5-Band Equalizer DSP
- Multi-tier Ticket Poster Resolution Service

#### Git Metadata
- **Commit Hash**: `1431a08`
- **Commit Message**: `docs(release): OmniStream v1.5.0 stable baseline checkpoint`
- **Git Release Tag**: `v1.5.0`
- **Recovery Command**: `git checkout v1.5.0`

---

## Major Milestone Checkpoint: v1.5.0 Foundation

### Core Product Capabilities
1. **OmniStream Master Gateway**: Central router with visual switcher and global application preferences drawer.
2. **U-Tube Discovery Engine**: Zero-ad bento grid feed, category filtering, instant query suggestions, and standard watch player.
3. **U-Tube Theater A**: Modern digital casual cinema with default horizontal curved geometry (`perspective(1200px)`).
4. **CineMorph Theater B**: Multi-aperture cinematic presentation (1.43:1 True IMAX, 1.90:1 IMAX Widescreen, Directorial Original Flat).
5. **Physical Ticket Ritual**: 10-second mechanical printer animation embedding representative video frame posters and barcode stubs.
6. **Web Audio 5-Band DSP**: Real-time Biquad audio engine offering Dialogue Boost (2.8kHz peaking), Cinema Bass (150Hz lowshelf), 3D Spatial soundstage, and Night Mode DRC.
7. **Client-Side Deterministic CV**: 2D Laplacian edge variance for sharpness, 16-bin luminance histogram scene cut detection, and scanline letterbox matte boundary detection.

### Architectural Invariants
- **Render Isolation**: Real-time ambient light extraction and camera pan/scale transforms mutate DOM element references directly to prevent React playback re-renders.
- **Strict Domain Boundaries**: U-Tube manages web video discovery; CineMorph manages local private media cinema.
- **Two-Theater Separation**: U-Tube Theater A uses modern digital styling; CineMorph Theater B uses velvet/amber physical immersion with zero aesthetic bleed.
