# OmniStream — Dependency Rules & Architectural Matrix

## Core Invariant
OmniStream operates under the **Product Capsule Architecture (OPCA)** model:
**One ecosystem, independent product capsules, minimal shared foundation.**

```
┌─────────────────────────────────────────────────────────────┐
│                    OmniStream Application                   │
│               Shell (src/app/ + src/shell/)                 │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│       U-Tube Capsule         ││      CineMorph Capsule       │
│    (src/products/u-tube/)    ││   (src/products/cinemorph/)  │
└──────────────┬───────────────┘└──────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       OmniStream Core                       │
│                        (src/core/)                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      OmniStream Shared                      │
│                        (src/shared/)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Allowed & Prohibited Import Matrix

| Consumer \ Target | Shell (`src/shell`, `src/app`) | U-Tube (`src/products/u-tube`) | CineMorph (`src/products/cinemorph`) | Core (`src/core`) | Shared (`src/shared`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Shell** | ✅ YES | ✅ YES (public API) | ✅ YES (public API) | ✅ YES | ✅ YES |
| **U-Tube** | ❌ NO | ✅ YES (internal) | ❌ **FORBIDDEN** | ✅ YES | ✅ YES |
| **CineMorph**| ❌ NO | ❌ **FORBIDDEN** | ✅ YES (internal) | ✅ YES | ✅ YES |
| **Core** | ❌ NO | ❌ **FORBIDDEN** | ❌ **FORBIDDEN** | ✅ YES (internal) | ✅ YES |
| **Shared** | ❌ NO | ❌ **FORBIDDEN** | ❌ **FORBIDDEN** | ❌ NO | ✅ YES (internal) |

---

## Domain Rules

### 1. Product Isolation Rule
- **U-Tube must NEVER import from `src/products/cinemorph/**`.**
- **CineMorph must NEVER import from `src/products/u-tube/**`.**
- If a feature in U-Tube requires CineMorph logic or vice versa, the shared capability must be promoted to `src/core/` (if infrastructure) or mediated via the Shell / OMS handoff contract (`OMSTransitionContext`).

### 2. Core Independence Rule
- `src/core/**` must never import from `src/products/**` or `src/shell/**` or `src/app/**`.
- Core services must be completely product-agnostic. They receive plain data contracts, not product-specific instances.

### 3. Shared Purity Rule
- `src/shared/**` contains only reusable UI primitives, formatting utilities, design tokens, and accessibility helpers.
- Shared code must have ZERO knowledge of YouTube, CineMorph, screening sessions, tickets, or playback engines.

### 4. Shell Orchestration Exemption
- The Application Shell (`src/app/`, `src/shell/`) is the designated orchestration boundary.
- It is explicitly permitted to route between, mount, and coordinate both product capsules.
- External code should access products through their public API barrels (`src/products/u-tube/index.ts`, `src/products/cinemorph/index.ts`).

---

## Import Path Guidance
- **Cross-Domain Imports**: Use domain aliases:
  - `@omnistream/core/*`
  - `@omnistream/shell/*`
  - `@omnistream/utube/*`
  - `@omnistream/cinemorph/*`
  - `@omnistream/shared/*`
- **Internal Product Imports**: Relative imports (e.g. `../state/useCineMorphStore`, `./components/VideoCard`) are preferred within product capsules to preserve local refactoring agility.
