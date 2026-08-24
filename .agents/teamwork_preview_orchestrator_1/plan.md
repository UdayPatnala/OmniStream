# Project Orchestration Plan: OmniStream

## Objective
Build and deliver OmniStream: an ad-free YouTube alternative (U-TUBE) and desktop theatrical experience player (CineMorph) with Three.js 3D environment, client-side ML IMAX-style framing, vintage paper UI, ticket printing animation, and local persistence.

## Orchestration Strategy: Dual Track Project Pattern

### Track 1: E2E Testing Track (Requirement-Driven, Opaque-Box)
- Comprehensive test suite covering Tiers 1-4:
  - Tier 1: Feature Coverage (>=5 per feature)
  - Tier 2: Boundary & Corner Cases (>=5 per feature)
  - Tier 3: Cross-Feature Interactions (pairwise)
  - Tier 4: Real-World Application Scenarios
- Publish `TEST_INFRA.md` and `TEST_READY.md`.

### Track 2: Implementation Track
- Milestone 1: Core Foundation & Bento Landing Page (Routing, layout shell, state management)
- Milestone 2: U-TUBE (Search top 3, direct links, subscriptions, keyword recommendations, local persistence, ad-free player)
- Milestone 3: CineMorph 3D Theater Environment (Three.js seats, curtains, curved screen, aspect ratios 1.43:1, 1.90:1, offline fallback 4:3)
- Milestone 4: Advanced Framing Geometry (Client-side ML, real-time framing rules, panning behind screen)
- Milestone 5: Vintage UX, Ticket Printer Animation & State Recovery (10s animation, pre-processing, saved torn tickets)
- Milestone 6 (Final): 100% E2E Test Suite pass (Tiers 1-4) & Adversarial Coverage Hardening (Tier 5)

## Execution Stages
1. **Stage 0: Survey & Investigation (Current)**
   - Dispatch 3 Explorers / Spec Miners to survey existing workspace, dependencies, packages, and map out exact feature inventory and architecture.
2. **Stage 1: Architecture & Global Scope Definition**
   - Synthesize survey findings into `PROJECT.md` at root with full feature inventory, milestone plan, and interface contracts.
3. **Stage 2: Dual Track Dispatch**
   - Dispatch E2E Testing Orchestrator / Test Writers for opaque-box test suite.
   - Dispatch Sub-Orchestrators for implementation milestones.
4. **Stage 3: Integration & Final Gate**
   - Execute Final Milestone (100% E2E pass + Tier 5 Adversarial Hardening).
   - Forensic Auditor verification.
5. **Stage 4: Completion & Handoff**
   - Final handoff report to Sentinel.
