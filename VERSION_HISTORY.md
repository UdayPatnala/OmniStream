# OmniStream Version History

This document serves as the authoritative, permanent version timeline and Git recovery index for **OmniStream**.

---

## Quick Navigation Index

| Version | Date | Type | Quick Summary | Git Tag | Commit |
|---|---|:---:|---|:---:|:---:|
| **v1.5.1** | 2026-09-01 | `PATCH` | Restored exact theater screen curvature hierarchy and retained proportional seating across all modes. | `v1.5.1` | [`575d4b1`](https://github.com/UdayPatnala/OmniStream/commit/575d4b1) |
| **v1.5.0** | 2026-09-01 | `MINOR` | Stable baseline checkpoint uniting U-Tube and CineMorph under central gateway. | `v1.5.0` | [`1431a08`](https://github.com/UdayPatnala/OmniStream/commit/1431a08) |
| **v1.0.0** | 2026-08-30 | `MAJOR` | Initial OmniStream unified dual-engine architecture release. | `v1.0.0` | [`initial`](https://github.com/UdayPatnala/OmniStream/commit/initial) |

---

## Version Entries

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
