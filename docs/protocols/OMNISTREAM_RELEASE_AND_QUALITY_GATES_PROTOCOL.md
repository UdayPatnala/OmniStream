# OmniStream: Release, Quality Gates & Production Readiness Protocol

> **Governing Standard**: This document establishes the mandatory quality gates, multi-level test matrix, release state lifecycle, rollback readiness, and production deployment criteria for OmniStream.

---

## 1. Release States & Maturity Lifecycle

Every capability, model, and subsystem progresses through explicit maturity states:

```
IDEA
  │
  ▼
RESEARCH (Problem definition, license audit, baseline feasibility)
  │
  ▼
EXPERIMENT (Sandboxed on experiment/* branch; reproducible setup)
  │
  ▼
DEVELOPMENT (Structured contracts, capability resolver integration)
  │
  ▼
VALIDATION (5-tier test matrix: unit, capability, integration, failure, regression)
  │
  ▼
RELEASE CANDIDATE (Stabilization freeze; bug/regression fixes only)
  │
  ▼
STABLE (Production-ready; 100% tests passing; recovery point tagged)
```

Alternative lifecycle branches:
- **`POSTPONED`**: Hardware or browser ecosystem not yet mature.
- **`REJECTED`**: Insufficient product value over non-AI baseline or excessive resource cost.
- **`DEPRECATED`**: Retained temporarily as fallback; scheduled for removal.

---

## 2. Definition of "Done" (Production Readiness Checklist)

A feature is never "done" merely because the code compiles or a single happy-path demo works. Before promotion to `STABLE`, verify:

### 1. Functional Integrity
- [ ] Primary user workflow executes end-to-end without unhandled rejections.
- [ ] Input data (video files, aspect ratios, search strings) is sanitized and validated.
- [ ] Output coordinates/transforms are validated for numeric stability (rejecting NaN / Infinity).
- [ ] Boundary conditions and empty states are handled gracefully.

### 2. Architectural Boundary Integrity
- [ ] Placed in the correct domain (`Shared Core`, `CineMorph`, `U-Tube`, or `OMS Intelligence`).
- [ ] Zero prohibited cross-domain couplings (e.g., CineMorph importing U-Tube internals).
- [ ] Models isolated behind [`IModelRuntimeAdapter`](./src/lib/oms/interfaces.ts) contracts.
- [ ] Existing working capabilities and stores remain completely unaffected.

### 3. Failure & Fallback Resilience
- [ ] Predictable failures handled via declarative pre-flight checks (`isAvailable`, `isCompatible`).
- [ ] Failures classified into standard categories (`UNAVAILABLE`, `INCOMPATIBLE`, `EXECUTION_TIMEOUT`, `RUNTIME_ERROR`).
- [ ] Progressive fallback to Tier 2 (Canvas CV), Tier 1 (Center Crop), or Safe Default (Original Ratio) verified.
- [ ] Playback and audio output continue un-interrupted during runtime degradation.

### 4. Code Quality & Maintainability
- [ ] No dead code, obsolete commented blocks, or temporary debugging logs.
- [ ] No high-frequency React state updates in 60 FPS animation/playback loops.
- [ ] Code is clear, modular, and understandable without esoteric abstractions.

### 5. Architectural Memory & Documentation
- [ ] Architectural Decision Records (ADRs) updated if boundaries or invariants changed.
- [ ] [`OMNISTREAM_LIVING_ARCHITECTURE_INTELLIGENCE.md`](./OMNISTREAM_LIVING_ARCHITECTURE_INTELLIGENCE.md) updated.
- [ ] Model registry updated with verified licenses, RAM budgets, and latency benchmarks.

---

## 3. Multi-Level Quality Gates

Every meaningful capability must pass proportionate quality gates across all 6 testing levels:

```
[Level A: Unit]         Isolated algorithmic correctness (Sobel filter, Tokenizer, Kalman smoothing)
      ↓
[Level B: Capability]   Complete subsystem workflow (13-Stage Framing, 5-Band Audio DSP, Ticket Printer)
      ↓
[Level C: Integration]  Cross-subsystem harmony (Local video ingest + smart framing + ticket persistence)
      ↓
[Level D: Failure]      Adversarial failure handling (Tainted canvas, audio context lock, corrupt storage)
      ↓
[Level E: Regression]   Full 47-suite test harness validation (218/218 passing tests)
      ↓
[Level F: User Journey] End-to-end user flows (Discovery onboarding, movie night, airgapped offline playback)
```

---

## 4. Progressive Capability Release Matrix (Tier Verification)

For any multi-tier progressive capability (such as Smart Framing):

| Scenario | Injected Condition | Expected Behavior | Release Status |
|---|---|---|---|
| **Optimal Path** | WASM & Canvas CV healthy | Executes Tier 3 / Tier 2 framing at 60 FPS | `VERIFIED` |
| **WASM Missing** | Device lacks SIMD / WASM | Skips Tier 3 pre-flight; runs Tier 2 Canvas CV | `VERIFIED` |
| **Canvas Tainted** | CORS / Canvas capture error | Skips Tier 2; engages Tier 1 Center Crop | `VERIFIED` |
| **NaN / Corrupt Output** | Model outputs corrupt values | Coordinate guard rejects; falls back to Tier 1 | `VERIFIED` |
| **Total Failure** | Complete pipeline crash | Defaults cleanly to Original Directorial Ratio | `VERIFIED` |

---

## 5. Performance Quality Gates

| Metric | Production Budget | Measured Performance | Gate Status |
|---|---|---|---|
| **App Startup Time** | < 800 ms | ~320 ms | **PASS** |
| **Framing Latency per Frame** | < 16.6 ms (60 FPS) | 1.20 ms (Canvas CV) | **PASS** |
| **Root React Re-renders** | 0 re-renders during playback | 0 (DOM Ref / CSS Var direct mutation) | **PASS** |
| **Audio DSP Latency** | < 5.0 ms | 0.10 ms (Web Audio Biquad) | **PASS** |
| **Ticket Countdown Warmup** | Exactly 10.0 s deterministic | 10.0 s (Web Audio synchronized chiptune) | **PASS** |
| **WASM / Asset Bundle Download** | 0 KB for base app | 0 KB external AI downloads required | **PASS** |

---

## 6. AI Model Release Gate

Before promoting an ML model to production:
1. **Source & License Verification**: Authentic repository source with verified commercial-friendly license (MIT, Apache-2.0, BSD-3, CC-BY-4.0).
2. **Reproducible Environment**: Dependencies, weights version, and compilation flags recorded in laboratory notes.
3. **Deterministic Baseline Benchmark**: Model must demonstrate measurable quality improvement over Canvas CV / Web Audio DSP.
4. **Adapter Sandboxing**: Implements [`IModelRuntimeAdapter`](./src/lib/oms/interfaces.ts) with explicit resource cleanup.
5. **Availability Probing**: Pre-flight checks verify hardware and memory before inference starts.

---

## 7. Security & Data Safety Check

1. **Zero Secret Leaks**: No API keys, credentials, or private tokens committed.
2. **XSS & DOM Sanitization**: Search queries and metadata sanitized via DOMPurify / native text nodes.
3. **Corrupt Payload Self-Healing**: LocalStorage and IndexedDB errors automatically back up corrupted JSON to `__corrupted_*` keys and reset state safely without user data destruction.
4. **Memory Resource Bounds**: Streaming ObjectURLs revoked upon video unmount; 0 in-RAM large video buffering.

---

## 8. Release Candidate Freeze & Decision Protocol

During Release Candidate (RC) stabilization:
- **ALLOWED**: Bug fixes, regression repairs, critical performance tuning, documentation synchronization.
- **PROHIBITED**: New features, UI redesigns, un-benchmarked model integrations, large structural refactors.

### Release Decision Classifications
- **`READY`**: All 6 test levels passed (47 suites, 218 tests), 0 TypeScript errors, performance budgets met.
- **`READY WITH KNOWN LIMITATIONS`**: Core product stable; minor non-blocking browser constraints documented.
- **`NEEDS MORE VALIDATION`**: Meaningful uncertainty remains; additional failure testing required.
- **`BLOCKED`**: Critical regression or unhandled failure exists; release halted.

---

## 9. Rollback Readiness & Versioning Strategy

### Versioning Scheme: `MAJOR.MINOR.PATCH`
- **MAJOR (`v2.x.x`)**: Significant architectural upgrades or domain boundary restructuring.
- **MINOR (`vx.2.x`)**: New capabilities, aspect ratios, or DSP filter modes maintaining full backward compatibility.
- **PATCH (`vx.x.1`)**: Bug fixes, performance optimizations, and documentation updates.

### Rollback Protocol
1. Every release tag (`v2.0.0-release`, etc.) represents a known, self-contained, validated Git commit.
2. If a production release encounters unforeseen platform failure:
   - Revert deployment to the previous stable release tag.
   - All client storage schemas maintain backward-compatible fallback parsing.
   - Runtime capabilities automatically degrade to deterministic Tier 1 / Native baselines.

---

## 10. Post-Release & Incident Learning Protocol

When a production defect or failure occurs:
1. **Root Cause Analysis**: Classify the failure (`Code Bug`, `Dependency Failure`, `Model Failure`, `Architecture Problem`, `Configuration Error`, `External Service Failure`).
2. **Failure Gap Discovery**: Determine why automated unit, integration, or failure matrix tests did not catch it.
3. **Layered Fix**: Implement the fix at the root layer, add a regression test to the appropriate tier (Tiers 1–5), and update the Living Architecture Documentation.
