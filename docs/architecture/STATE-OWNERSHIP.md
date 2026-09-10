# OmniStream — State Ownership Standard

## Overview
State within OmniStream is partitioned strictly by product and architectural domain. Cross-store mutations and monolithic "god stores" are prohibited.

---

## State Matrix

| State Store | Location | Scope & Purpose | Allowed Consumers |
| :--- | :--- | :--- | :--- |
| `useAppStore` | `src/store.ts` (Shell) | Global application theme (`editorial-light`, `cinematic-dark`), landing preference, user global settings. *(Legacy subscriptions/history temporarily retained per Q1-A)* | Shell, Root pages |
| `useUTubeStore` | `src/products/u-tube/state/` | U-Tube feed items, active search queries, player queue, channel subscriptions, channel cache. | U-Tube components & pages, Shell header |
| `useCineMorphStore`| `src/products/cinemorph/state/` | Active screening session, aspect ratio (`original`, `1.90:1`, `1.43:1`), framing rules, local media history, audio EQ, theater LOD. | CineMorph components, theater, lounge |
| `useTicketStore` | `src/products/cinemorph/ticketing/`| Physical admission ticket lifecycle, 10s printing ritual, ticket persistence, screening resumption. | CineMorph theater & ticket components |

---

## State Invariants

1. **Screening Session Isolation**:
   - CineMorph screening sessions (`CineMorphScreeningSession`) and local media items (`LocalMediaItem`) exist solely within CineMorph's state boundary.
   - U-Tube must NEVER read or write to `useCineMorphStore` or `useTicketStore`.

2. **Feed & Subscription Isolation**:
   - YouTube channels, subscription lists, and watch history belong exclusively to U-Tube.
   - CineMorph must NEVER read or write to `useUTubeStore`.

3. **Handoff via Context, Not Store Coupling**:
   - Experiential handoff between U-Tube and CineMorph (e.g. playing a YouTube stream in CineMorph Theater) is mediated via `omsTransitionService` using the immutable `OMSTransitionContext` contract.
   - One product store never directly mutates or subscribes to another product store.

4. **Persistence Keys**:
   - Products must use distinct persistence storage keys:
     - U-Tube: `omnistream-utube-state`
     - CineMorph: `cinemorph-screening-session`, `cinemorph-tickets`
     - Shell: `omnistream-app-state`
