# OmniStream Architecture Documentation (OPCA v1.0)

Welcome to the architectural specifications for **OmniStream**, a dual-engine personal media experience platform.

---

## The Two Product Capsules
1. **U-Tube**: Lightweight, clean, ad-free YouTube discovery and playback engine.
2. **CineMorph**: Cinematic, fixed-aperture theater experience for local media with client-side ML framing.

---

## Directory & Document Index

| Document | Purpose |
| :--- | :--- |
| [SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md) | High-level system topology, layers, and directory structure. |
| [PRODUCT-BOUNDARIES.md](./PRODUCT-BOUNDARIES.md) | Strict ownership definitions for U-Tube, CineMorph, Core, and Shared. |
| [DEPENDENCY-RULES.md](./DEPENDENCY-RULES.md) | Permitted and forbidden import relationships matrix. |
| [ASSET-OWNERSHIP.md](./ASSET-OWNERSHIP.md) | Canonical asset locations and ownership rules. |
| [STATE-OWNERSHIP.md](./STATE-OWNERSHIP.md) | State management domains, Zustand stores, and persistence isolation. |
| [ROUTING-OWNERSHIP.md](./ROUTING-OWNERSHIP.md) | URL routing boundaries and viewport management. |
| [ADR-001-product-capsule-architecture.md](./ADR-001-product-capsule-architecture.md) | Architectural Decision Record explaining why OPCA was chosen over microfrontends. |
| [FORENSIC-AUDIT.md](./FORENSIC-AUDIT.md) | Initial codebase audit and identified violations. |
| [ARCHITECTURE-MIGRATION.md](./ARCHITECTURE-MIGRATION.md) | Migration process, steps, and verification checkpoints. |
| [ARCHITECTURE-FINAL-REPORT.md](./ARCHITECTURE-FINAL-REPORT.md) | Comprehensive final audit report and verification results. |

---

## Developer Quick Reference: "Where Does My Code Go?"

- **Adding a U-Tube feature?**
  👉 `src/products/u-tube/` (pages, components, state, services)
- **Adding a CineMorph feature?**
  👉 `src/products/cinemorph/` (theater, media, ticketing, perception)
- **Adding a cross-product OMS model adapter?**
  👉 `src/core/oms/`
- **Adding a reusable UI component with zero product semantics?**
  👉 `src/shared/ui/`
- **Adding a global shell navigation element?**
  👉 `src/shell/`

---

## Golden Architectural Invariants

1. **Product Isolation**:
   ```
   U-Tube ──X──> CineMorph
   CineMorph ──X──> U-Tube
   ```
   Neither product may ever import internal files from the other product.

2. **Core Independence**:
   ```
   Core ──X──> U-Tube
   Core ──X──> CineMorph
   ```
   Core infrastructure must never have compile-time dependencies on product code.

3. **Shell Orchestration**:
   ```
   Shell ────> U-Tube (Public API)
   Shell ────> CineMorph (Public API)
   Shell ────> Core
   ```
   Only the application shell is authorized to mount and orchestrate both product capsules.
