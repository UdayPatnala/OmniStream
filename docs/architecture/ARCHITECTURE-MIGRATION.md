# OmniStream — Architecture Migration Guide (OPCA v1.0)

## Objectives & Non-Negotiables
1. **Preserve v1.8.5 Frozen Baselines**:
   - Zero regression in CineMorph Theater fixed apertures (`original`, `1.90:1`, `1.43:1`).
   - Zero regression in asynchronous demuxing, ticket printing ritual, and memory-safe media parsing.
   - Zero regression in U-Tube discovery, search, and playback.
2. **Maintain Execution Invariants**:
   - Monorepo bounded capsule structure.
   - Strict product isolation: U-Tube ↮ CineMorph.
   - Verified automated test pass at every step.

---

## Migration Steps Executed

### Step 1: Forensic Audit & Domain Classification
- Audited all files in `src/` to uncover implicit dependencies.
- Discovered that `lib/cinemorph.ts` and `lib/youtube.ts` were already clean from each other.
- Identified cross-product calls in `useTicketStore.ts` and `CineMorphTheater.tsx` importing YouTube functions.
- Identified ~60% CineMorph-specific styles in global `src/index.css`.

### Step 2: Path Aliases & TypeScript Configuration
- Added `@omnistream/core`, `@omnistream/shell`, `@omnistream/utube`, `@omnistream/cinemorph`, `@omnistream/shared` to `vite.config.ts`.
- Mirrored path mappings in `tsconfig.json`.

### Step 3: Skeleton Directory Setup
- Established clean modular product capsules in `src/products/u-tube` and `src/products/cinemorph`.
- Established `src/app/`, `src/shell/`, `src/core/`, and `src/shared/`.

### Step 4: Product Code Migration
- **U-Tube**: Pages, components (`VideoCard`, `UTubePlayer`), state (`useUTubeStore`), services, repositories, types, and barrel index.
- **CineMorph**: Pages (`CineMorphLanding`, `CineMorphTheater`), components, state (`useCineMorphStore`), ticketing (`useTicketStore`, `TicketPrinterAnimation`), media engine, theater LOD, perception pipeline, types, and barrel index.
- **Core**: Cross-product OMS infrastructure, storage service, zero trust security, configuration registry.
- **Shared**: ErrorBoundary, Skeleton, CaptionOverlay, OMSLogo, formatting utilities.

### Step 5: Style Isolation
- CineMorph atmosphere tokens, spatial roots, and ticket animations isolated to `src/products/cinemorph/styles/cinemorph.css`.

### Step 6: Boundary Enforcement & Testing
- Automated vitest suite validating architecture dependency rules.
