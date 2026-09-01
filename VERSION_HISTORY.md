# OmniStream Version History

This document serves as the authoritative, permanent version timeline and Git recovery index for **OmniStream**.

---

## Quick Navigation Index

| Version | Date | Type | Quick Summary | Git Tag | Commit |
|---|---|:---:|---|:---:|:---:|
| **v1.5.0** | 2026-09-01 | `MINOR` | Stable baseline checkpoint uniting U-Tube and CineMorph under central gateway. | `v1.5.0` | [`1431a08`](https://github.com/UdayPatnala/OmniStream/commit/1431a08) |
| **v1.0.0** | 2026-08-30 | `MAJOR` | Initial OmniStream unified dual-engine architecture release. | `v1.0.0` | [`initial`](https://github.com/UdayPatnala/OmniStream/commit/initial) |

---

## Version Entries

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
