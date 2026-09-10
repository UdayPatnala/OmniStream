# OmniStream — Asset Ownership

## Rule
No asset should exist in two product directories simultaneously.
Use one canonical source. Update all references to point to it.

## Current State (Phase 1 — Documentation Only)

All assets currently live in `public/` for Vite static serving.
Ownership is documented here; physical migration is a separate task (Phase 2).

## Asset Registry

| File | Product Owner | Current Location | Canonical Home |
|------|--------------|-----------------|----------------|
| `utube_artwork.png` | U-Tube | `public/` | `src/products/u-tube/assets/utube_artwork.png` |
| `cinemorph.png` | CineMorph | `public/` | `src/products/cinemorph/assets/cinemorph.png` |
| `cinemorph_artwork.png` | CineMorph | `public/` | `src/products/cinemorph/assets/cinemorph_artwork.png` |
| `cinemorph_lounge_plate.jpg` | CineMorph | `public/` | `src/products/cinemorph/assets/cinemorph_lounge_plate.jpg` |
| `Create_a_professional_cinemati.mp4` | CineMorph | `public/` | `src/products/cinemorph/assets/` |
| `omn_logo.jpg` | OmniStream Core | `public/` | `public/omn_logo.jpg` (stays — global brand) |
| `aroh_seal.jpg` | AROH brand placement | `public/` | `public/aroh_seal.jpg` (stays — brand) |

## Rules for New Assets

1. U-Tube assets go in `src/products/u-tube/assets/`
2. CineMorph assets go in `src/products/cinemorph/assets/`
3. OmniStream-wide brand assets go in `public/`
4. Never commit the same asset file to two directories
5. Update all `<img src="...">`, CSS `url()`, and dynamic import references before removing old copy
