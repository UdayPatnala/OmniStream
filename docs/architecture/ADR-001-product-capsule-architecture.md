# ADR-001: OmniStream Product Capsule Architecture (OPCA)

**Status**: Accepted  
**Date**: 2026-09-09  
**Baseline**: OmniStream v1.8.5

---

## Context

OmniStream is a single application comprising two distinct product experiences:
- **U-Tube**: Lightweight, ad-free YouTube discovery and watch engine
- **CineMorph**: Cinematic, fixed-aperture theater experience for local media

These products share a runtime (single React application), a single deployment, and several infrastructure concerns (OMS, storage, auth).

The codebase started flat. As CineMorph matured from a simple theater page into a full media processing platform (media parser, EBML demuxer, audio DSP, optical flow perception, ticket ritual, screening sessions), and as U-Tube grew its own state management, service layer, and repositories, the two products accumulated implicit coupling through the shared `src/` namespace.

---

## Decision

Adopt **OmniStream Product Capsule Architecture (OPCA)**:

```
One OmniStream ecosystem.
Two independently-maintainable product capsules.
One thin shared Core.
One genuine shared primitives layer.
One shell orchestration layer.
```

Directory model:
```
src/
  app/            OmniStream application entry + routes
  shell/          Shared OmniStream experience shell
  products/
    u-tube/       U-Tube product capsule (self-contained)
    cinemorph/    CineMorph product capsule (self-contained)
  core/           Cross-product infrastructure (OMS, storage, security)
  shared/         Genuinely product-neutral UI + utilities
```

---

## Rejected Alternatives

### Option A: Complete Separation (Two Repositories / Microfrontends)
**Rejected because:**
- U-Tube and CineMorph share the OMS handoff layer (experiential continuity from U-Tube watching into CineMorph theater is a core product feature)
- Shared authentication, state coordination, and the Cosmic Threshold portal depend on both products being in one runtime
- Deployment, asset, and routing complexity grows significantly with no proportional benefit for a two-product system maintained by a small team
- TypeScript type-sharing across repos adds friction without adding value

### Option B: Keep the Flat Structure
**Rejected because:**
- No tooling can enforce "U-Tube should not import CineMorph" in a flat `src/`
- The forensic audit identified actual cross-product violations (`useTicketStore` importing `lib/youtube.ts`, `CineMorphTheater.tsx` importing YouTube functions directly)
- As each product grows, the absence of ownership boundaries guarantees more violations
- New developers cannot identify product ownership from directory structure alone

### Option C: Shared Utils God-Layer
**Rejected because:**
- Moves the problem from `src/` flatness to a bloated `shared/` directory
- Does not enforce the critical rule: products cannot import each other
- OMS infrastructure, CineMorph media engine, and U-Tube data services are fundamentally different abstraction levels; collapsing them into "shared" destroys clarity

---

## Consequences

### Positive
- Any developer can find U-Tube code in `src/products/u-tube/`
- Any developer can find CineMorph code in `src/products/cinemorph/`
- Changing U-Tube does not require opening CineMorph files
- Changing CineMorph does not require opening U-Tube files
- ESLint boundary rules enforce the dependency direction at CI time
- Architecture tests verify no forbidden cross-product imports exist
- Asset ownership is documented and enforceable
- Store ownership is explicit (no more `'cinemorph-utube-storage'` god key)

### Negative / Accepted Trade-offs
- Import paths become longer for shell code that orchestrates both products
- The shell is deliberately permitted to import both products (intended exception)
- Existing relative imports within each product need not be converted to aliases (product internals remain relative for locality)

---

## The Shell Exception

The shell layer (`src/app/`, `src/shell/`) is the **only** code permitted to import from both products simultaneously. This is not a violation — it is the definition of the orchestration layer:

```
ThresholdPortal → knows both U-Tube and CineMorph exist (correct — it renders both portals)
BentoGrid      → knows both exist (correct — it renders the gateway)
App.tsx        → knows both exist (correct — it routes to both)
```

Neither product may know the other exists in its implementation code.

---

## The OMS Distinction

The forensic audit confirmed a critical distinction that must be maintained:

| Layer | What it contains | Where it lives |
|-------|-----------------|----------------|
| OMS Infrastructure | Capability detection, model registry, perception normalizer, blaze-face adapter, OMS standard | `src/core/oms/` |
| CineMorph Perception | omsPipeline, visionAnalyzer, compositionScorer, frameSampler, candidateGenerator | `src/products/cinemorph/perception/` |

OMS infrastructure is cross-product (it could serve U-Tube perception in the future).  
CineMorph perception is the product-specific application of OMS infrastructure to cinematic framing.

---

## Migration Strategy

OPCA migration follows: **Copy → Verify → Remove → Enforce**

1. Copy files to new locations with correct ownership
2. Verify build passes with both old and new files present
3. Update imports to use new locations
4. Remove old files only after build and tests pass
5. Add boundary enforcement (ESLint + architecture tests)

The P1 regression fixes and existing v1.8.5 capabilities are never broken by this migration.
