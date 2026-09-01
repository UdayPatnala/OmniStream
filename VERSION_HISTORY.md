# OmniStream Version History

This document serves as the authoritative, permanent version timeline and Git recovery index for **OmniStream**.

---

## Quick Navigation Index

| Version | Date | Type | Quick Summary | Git Tag | Commit |
|---|---|:---:|---|:---:|:---:|
| **v1.5.2** | 2026-09-01 | `MINOR` | Lightweight client-side media demuxing engine for MP4/MKV/WebM/MOV/Audio with multi-track audio detection, original Unicode title preservation, live hardware/WebAudio stream switching, and codec playability verification. | `v1.5.2` | [`3467c79`](https://github.com/UdayPatnala/OmniStream/commit/3467c79) |
| **v1.5.1** | 2026-09-01 | `PATCH` | Calibrated exact concave cinema screen curvature hierarchy (Original: 0%, CineMorph IMAX: 0.65%, True IMAX: 0.95%, U-Tube: 1.25%) with 3-tier proportional auditorium seating and zero video distortion. | `v1.5.1` | [`8a42eaa`](https://github.com/UdayPatnala/OmniStream/commit/8a42eaa) |
| **v1.5.0** | 2026-09-01 | `MINOR` | Stable baseline checkpoint uniting U-Tube and CineMorph under central gateway. | `v1.5.0` | [`1431a08`](https://github.com/UdayPatnala/OmniStream/commit/1431a08) |
| **v1.0.0** | 2026-08-30 | `MAJOR` | Initial OmniStream unified dual-engine architecture release. | `v1.0.0` | [`initial`](https://github.com/UdayPatnala/OmniStream/commit/initial) |

---

## Version Entries

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
