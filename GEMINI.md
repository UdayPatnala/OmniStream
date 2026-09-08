# OmniStream Core Constitution

You are working on OmniStream, a personal media experience platform.
OmniStream combines two distinct viewing engines:
1. **U-TUBE**: A lightweight, clean, ad-free YouTube-oriented discovery and watch engine.
2. **CineMorph**: A cinematic, fixed-aperture theater experience for local media using client-side ML framing.

**CRITICAL RULE**: Before making any design, architecture, or implementation decisions, you MUST read and comprehend the full product constitution.
The complete product constitution (P1 through P5 master specs) is located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\docs\specs\OMNISTREAM_MASTER_SPECS.md`

The final 100-point build manifesto is located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\docs\specs\OMNISTREAM_FINAL_BUILD_AGENT.md`

The Intelligence Architecture constraints are located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\docs\specs\OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md`

The final Requirement Clarifications and Assumption Controls are located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\docs\specs\OMNISTREAM_FINAL_REQUIREMENT_CLARIFICATION_AND_ASSUMPTION_CONTROL.md`

The OmniStream Intelligence System (OMS) Identity Standard is located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\docs\specs\OMNISTREAM_OMS_IDENTITY_STANDARD.md`

The Master Guardian Principles are located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\docs\specs\OMNISTREAM_MASTER_GUARDIAN.md`

You MUST use the `view_file` tool to read these files if you do not already have them in your context. Do NOT guess the architecture. The user has explicitly stated: "make layers, models, llms anything needed to achieve the goal."

## OmniStream Architecture & Lightweight Invariants
- **No Heavy 3D/Tensor Bundles**: Prefer CSS3D transforms, SVG aperture overlays, and 16x9 canvas sampling over Three.js and TensorFlow.js.
- **OMS Render Isolation**: Real-time ambient analysis must update DOM element refs or CSS variables directly; never set high-frequency React states on root theater components.
- **Color System V2**: Editorial light-first foundation (`#F7F5F0`), muted Vermilion (`#C7494F`) for U-Tube accents, muted Slate Blue (`#526C9E`) for CineMorph accents, Graphite (`#5E6166`) for OMS.
- **Persistence Integrity**: Tickets are only saved on confirmed theater entry ("Take Ticket & Enter Theater"). Do not store temporary tickets if user navigates back.

## SYS-SYS Master Execution Protocol & Architectural Invariants (L1 Foundation)

### 1. Absolute Rule — Recall Before Action
Before starting ANY major task, feature, redesign, bug fix, refactor, or architectural change:
1. Reconstruct project vision, motive, AROH philosophy, accumulated decisions, boundaries, existing implementations, and known bugs.
2. Determine: *"What are we trying to achieve, why does this exist, and how does it affect the entire OmniStream ecosystem?"*
3. Operate strictly in this permanent execution hierarchy:
   $$\text{Vision} \to \text{Architecture} \to \text{Ownership} \to \text{User Flow} \to \text{Interaction} \to \text{Visual} \to \text{Implementation} \to \text{Testing} \to \text{Review}$$
4. Never reverse this hierarchy or begin with a component/animation and invent a purpose afterward.

### 2. Strict Product Ownership & Domain Boundaries
- **OmniStream Core**: Gateway (`/`), cross-engine identity, global theme/preferences, routing. Connective layer, not a dumping ground.
- **U-Tube**: Discovery, search, watch feed, library (History, Subscriptions, Collections), preferences, U-Tube Player, and **Theater A (U-Tube Theater)**.
- **CineMorph**: Cinematic destination, private local file ingest, 1.43:1 / 1.90:1 / Original apertures, physical ticket ritual, 5-band audio DSP, and **Theater B (CineMorph Theater)**. CineMorph must not contain duplicate URL pasting or web search.
- **OMS Layer**: Contextual experience handoff from active U-Tube player carrying `{ contentId, sourceUrl, title, thumbnailUrl, duration, currentTimestampSeconds, playbackState }` without re-searching.

### 3. Two-Theater Rule (Absolute Product Separation)
- **Theater A (U-Tube Theater)**: Casual, modern digital cinema. Blue seating rows, blue architectural side-wall strip lighting, subtle curved viewport, instantaneous entry, zero tickets.
- **Theater B (CineMorph Theater)**: Deep cinematic immersion. Volumetric amber/velvet ambiance, 10s progressive ticket printing ritual with square poster preview and micro brand marks, 3-tier aspect ratios, 5-band parametric DSP.
- **Zero Identity Contamination**: Never place CineMorph ticket rituals or IMAX branding into U-Tube theater; never place blue seats or casual styling into CineMorph.

### 4. CineMorph Ticket Physical Artifact Standards
- Progressive physical emergence (staged revealing/masking, not simple downward translation).
- Cropped near-square poster/thumbnail preview on upper ticket.
- Bottom-right subtle micro brand marks: `CineMorph`, `OMS`, `AROH`.
- Pre-cached artwork to prevent layout shifts; full reduced-motion support.

### 5. AROH Quality & Silence Principle
- OmniStream is an AROH product. Communicate quality through interaction, architecture, restraint, performance, and motion.
- Zero self-congratulatory marketing copy, AI buzzwords, or promotional CTAs.

## Autonomous Engineering Judgment & Decision Authority Protocol

### 1. Core Operating Principle
You are an intelligent engineering collaborator, not a blind code executor.
- Understand the underlying goal rather than merely following literal wording.
- Inspect reality, reason about consequences, choose appropriate solutions, implement safely, and validate results.
- Balance between two failure modes: avoid being **too passive** (blind compliance, ignoring obvious problems) and **too autonomous** (uncontrolled refactors, changing product vision, adding unnecessary dependencies).

### 2. Decision Authority Levels
- **LEVEL 1 — Act Directly**: Fix obvious local bugs, remove confirmed debugging artifacts, add missing validation, improve error handling, make small internal refactors that preserve existing behavior.
- **LEVEL 2 — Act and Report**: Make reasonable routine implementation choices with limited blast radius. Report decision, reason, and impact after completion.
- **LEVEL 3 — Recommend Before Acting**: Propose and discuss before significant architectural changes, new dependencies, new AI models, major UI/UX changes, or removing fallback behavior. Present problem, options, recommendation, and trade-offs.
- **LEVEL 4 — Explicit Approval Required**: Never proceed without explicit confirmation for product direction changes, removing core functionality, irreversible migrations, licensing changes, or major architectural rewrites.

### 3. Engineering Invariants & Fallback Discipline
- **Proportional Thinking**: Scale reasoning to Risk + Blast Radius + Reversibility + Complexity.
- **Structured Resolution over Nested Try/Catch**: Use declarative availability/compatibility pre-flight checks and classified failure types (`UNAVAILABLE`, `INCOMPATIBLE`, `EXECUTION_TIMEOUT`, `RUNTIME_ERROR`, `CRITICAL_SYSTEM_ERROR`).
- **Evidence over Theory**: Prefer measured behavior and regression test results over assumptions.
- **Baseline Guarantee**: Baseline implementations must produce valid minimum output with zero external AI/cloud dependencies.
- **Honest Status Reporting**: Use accurate states (`IMPLEMENTED + VERIFIED`, `IMPLEMENTED + PARTIALLY VERIFIED`, `EXPERIMENTAL`, `BLOCKED`). Never declare complete without verification.

## Future Feature Integration & Change Protocol

### 1. The Golden Rule
Before implementing anything, determine:
> "Does this change belong in OmniStream, and if so, where and how should it integrate?"

### 2. Impact Assessment & Architectural Home
Classify every proposed change before coding:
- **Type A (Small isolated fix)**: Direct controlled change.
- **Type B (Feature enhancement)**: Enhance within existing domain boundary.
- **Type C (New meaningful capability)**: Define contract, implement baseline + fallback.
- **Type D (Cross-domain feature)**: Place shared primitives in Shared Core; keep domain logic isolated.
- **Type E (Experimental / AI)**: Place behind `IModelRuntimeAdapter` on `experiment/*` branch; benchmark before promotion.
- **Type F (Architectural change)**: Present ADR, obtain approval, execute incrementally.

### 3. Model Decision Gate & Baseline Guarantee
- **AI Decision Gate**: Define problem → Check if Canvas/WebAudio solves it → Benchmark candidates → Review license/size/latency → Approve → Sandbox behind adapter.
- **Never Break Baseline for an Upgrade**: Stable baselines must remain functional as fallbacks.
- **Pre-Coding Checklist**: Verify problem, existing solutions, correct home, dependencies, blast radius, failure handling, output validation, and rollback path before writing code.

## AI Model Research, Experimentation & Integration Laboratory Protocol

### 1. The Model Progression Rule
Follow this mandatory progression for every AI/ML/CV candidate:
> Problem Definition → Non-AI Baseline → Model Discovery → License Verification → Sandbox Experiment → Benchmark vs Baseline → Decision Matrix → Isolated Adapter Integration → Fallback Validation → Promotion/Rejection.

### 2. Candidate Decision Matrix
Classify all evaluated models into one of 5 distinct states:
- **PROMOTE**: Clear demonstrated value over baseline; production-ready; license verified; isolated behind adapter.
- **IMPROVE**: Promising but integration, quantization, or latency incomplete.
- **KEEP EXPERIMENTAL**: Active research; lives strictly on `experiment/*` branch.
- **POSTPONE**: Hardware or browser ecosystem not yet mature.
- **REJECT**: Insufficient product value or excessive resource/maintenance cost.

### 3. Model Adapter & Lifecycle Invariants
- **Strict Isolation**: Features depend on capability contracts, never directly on model internals. All models must implement `IModelRuntimeAdapter`.
- **Pre-Flight Availability Probing**: Check WASM, GPU, memory, and weights availability before initiating inference.
- **Lazy Loading**: Models load on demand, never at application startup.
- **Output Integrity Guard**: Validate output bounds and numeric sanity (reject NaN/Infinity) before declaring inference success.
- **Model Replacement Test**: Replacing or removing a model must touch only its adapter, configuration, and registry entry.

### 4. CineMorph Hybrid Video Intelligence Invariants
- **Multi-Tier Decoupling**: Fast-path CV runs continuously at 150-400ms throttled intervals; deep neural vision (YOLO/BlazeFace) runs strictly on shot boundaries or saliency delta triggers.
- **Source Composition Protection**: Always evaluate candidate framing against the source directorial baseline. If improvement is below $\Delta < 0.15$, preserve original framing.
- **Spring-Damper Temporal Stabilization**: Never apply raw frame-to-frame bounding box coordinates directly to viewport transforms. All pan/zoom operations must pass through critically damped spring filters ($\zeta = 1.0$) with deadband hysteresis ($|\Delta| > 0.025$).
- **Zero React State on Playback**: Viewport pan/zoom updates must mutate DOM element styles or CSS variables (`--pan-x`, `--pan-y`, `--zoom`) directly.

## Project Recovery, Continuity & Knowledge Preservation Protocol

### 1. Self-Explaining Architecture & START_HERE Entry Point
- **Zero Chat Dependency**: The codebase and project documentation must carry their own essential intelligence.
- **Entry Point**: `START_HERE.md` serves as the primary 3-minute onboarding document for all future developers and agents.

### 2. Context Reconstruction Ladder (When Context is Lost)
When resuming work or joining after context loss, follow the 6-step ladder:
> 1. START_HERE.md → 2. Current Project Status → 3. Recent Git History → 4. Architecture Specs → 5. Capability Registries → 6. Codebase Inspection.

### 3. Session Handoff & Checkpoint Integrity
- **Honest Verification**: Never declare a capability verified unless validated by automated tests.
- **Safe Recovery Checkpoints**: Before high-risk refactors or model upgrades, record last known good state and verify that baseline fallbacks remain fully functional.
- **Distillation over Accumulation**: Preserve decisions, architectures, and failure results; do not hoard temporary debugging noise.

## Performance, Scalability & Optimization Discipline Protocol

### 1. Measure-First Sequence
Never optimize blindly. Always follow:
> Observe → Measure Baseline → Identify Bottleneck → Form Hypothesis → Change One Thing → Measure Again → Keep or Revert.

### 2. Performance Priority Order
Prioritize optimization by user impact:
> 1. User-blocking failures → 2. Severe processing bottlenecks → 3. Resource exhaustion (RAM/VRAM) → 4. Startup delays → 5. Frequent workflows → 6. UI latency (Render Isolation) → 7. Micro-optimizations.

### 3. Media & Render Discipline
- **Render Isolation**: Real-time ambient analysis and pan/scale transforms must mutate DOM element refs or CSS variables directly (`--pan-x`, `--pan-y`, `--zoom`); 0 root React re-renders during active playback.
- **Memory & Resource Discipline**: Video ObjectURLs must be revoked upon unmount; no duplicate frame buffers or in-RAM video caching.
- **Adaptive Quality**: Hardware profile determines execution tier (Tier 3 WASM → Tier 2 Canvas CV → Tier 1 Baseline Crop) without surprising the user.
- **When NOT to Optimize**: Never optimize without measurable problems, on rarely used paths, or when complexity outweighs performance gain.

## OmniStream v1.8.0 Universal Perception & Intelligence Invariants

### 1. Git Policy & Version Tracking Invariant
- **Zero Git Writes During Automation**: Do not run `git commit`, `git push`, `git tag`, `git merge`, or `git branch` during execution phases unless explicitly directed by the user.
- **Independent Version Tracking**: Version progression is recorded in internal registries (`VERSION_REGISTRY`, `package.json`, `VERSION_HISTORY.md`) and verified by automated tests without requiring git tags.

### 2. PDS (Perception-Decision-Stabilization) Decoupled Flow
- **One-Directional Pipeline**:
  $$\text{Perception (Detects)} \longrightarrow \text{OmniStream (Decides)} \longrightarrow \text{Spring Physics (Stabilizes)} \longrightarrow \text{Rendering (Executes)}$$
- **Strict Evidence Boundaries**: Models emit canonical normalized evidence (`IVisualPerceptionEvidence`, `IAudioPerceptionEvidence`). No model directly mutates DOM styles, CSS transforms, or audio gains.
- **Switching Hysteresis**: Subject switching requires a persistence margin ($\Delta \ge 0.08$) to eliminate rapid focal jumping between competing subjects.

### 3. Audio Perception & Dynamic Clarity Invariants
- **Spectral Perception**: Audio understanding analyzes real-time Web Audio API FFT frequency bins ($300\text{ Hz} - 3.4\text{ kHz}$) to evaluate speech likelihood and clarity deficit.
- **DSP Adaptation**: Adapts 5-band parametric equalizer dialogue clarity smoothly ($\text{factor} = 0.12$) without abrupt gain jumping or artificial spatial distortion.

### 4. Backpressure & Stale Result Protection
- **Frame Skipping on Busy**: If inference is active, intermediate video frames are skipped; historical inference backlogs are never processed.
- **Freshness Validation**: Out-of-order inferences ($t < t_{\text{last}}$) are discarded to protect temporal continuity.

## Technology & Implementation Freedom — Right Tool for the Right Subsystem

### 1. No Artificial Stack Imprisonment
Do not artificially restrict OmniStream implementation to the existing TypeScript/React codebase. The current stack is not a technical prison.
For AI, ML, media intelligence, performance-critical processing, backend services, tooling, or specialized tasks, evaluate and use whichever technology is genuinely most appropriate:
- **TypeScript / JavaScript**: Browser UI, user interaction, client state.
- **WebAssembly / Rust / C++ / WebGPU**: High-throughput computer vision, low-latency audio DSP, in-browser fast-path neural models.
- **Python**: Model research, benchmarking, neural preprocessing, dataset validation, server-side inference.
- **ONNX Runtime / MediaPipe**: Standardized local and cross-platform neural inference runtimes.
- **Node.js / Express / Native Tooling**: Server/API orchestration, stream demuxing, media inspection.

### 2. Justification Gate & Anti-Accumulation Rule
Technology freedom does NOT mean technology accumulation. Never add tools, frameworks, or dependencies merely to appear advanced.
Evaluate every candidate against 10 strict criteria:
1. Exact problem solved.
2. Capability of current stack to solve it efficiently.
3. Material superiority of the alternative.
4. Measurable performance/latency gain.
5. Added architectural complexity.
6. Deployment and container footprint.
7. Maintenance burden and ecosystem stability.
8. Privacy and local-first compliance.
9. Clean boundary integration via adapters.
10. ROI of technological change.

### 3. Decoupled Model Adapter Invariant
All specialized tools and ML runtimes must sit behind clean capability contracts:
$$\text{Model / Specialized Tech} \longrightarrow \text{Adapter Boundary} \longrightarrow \text{Normalized Evidence} \longrightarrow \text{OmniStream Logic} \longrightarrow \text{Rendering}$$
The rest of OmniStream must never become tightly coupled to a specific runtime, framework, or language.

## CineMorph Spatial Environmental Architecture & Interaction Invariants

### 1. The CineMorph Lobby & Spatial Identity
- The spatial lobby environment belongs specifically and exclusively to **CineMorph**. It is the atmospheric arrival hall into the CineMorph ecosystem, not an OmniStream gateway lobby.
- Avoid generic SaaS landing page patterns: no floating circles, spheres, cubes, gradient blobs, or repetitive Bento grids.
- Implement a **Hybrid Spatial Rendering Foundation**: High-quality coherent architectural environment renders (curved alabaster walls, vertical fluted walnut wood, recessed cove downlights, polished terrazzo reflections) combined with layered GPU spatial compositions and embedded interactive UI.

### 2. Interaction Philosophy — Never Explain With UI Instructions
- CineMorph must **not behave like a conventional application that constantly tells the user what to click or what each feature does**.
- Eliminate didactic UI copy: no "Click here to choose a file", "Click to enable seats", "Press button to...", or "Enable/Disable".
- **Design Interactions as Physical Affordances**: Make an element's purpose self-evident through spatial placement, visual hierarchy, atmospheric illumination, hover/focus elevation, and tactile state feedback.
- Prefer: $$\text{Experience} \longrightarrow \text{Discovery} \longrightarrow \text{Interaction} \longrightarrow \text{Feedback}$$
- CineMorph should feel **discovered, not explained**.

### 3. Studio Domain Integration
- Studio is the tactile in-theater mastering and engineering console of CineMorph. It represents live parametric EQ, multi-track stream discovery, and viewport aspect controls inside active playback. Never present Studio as an independent, unrelated product.

### 4. Continuous Spatial Narrative
- CineMorph experiences must feel like movement through connected architectural spaces rather than vertically stacked website sections:
  $$\text{Arrival} \longrightarrow \text{CineMorph Lobby} \longrightarrow \text{Exhibition Gallery} \longrightarrow \text{Auditorium} \longrightarrow \text{Studio Suite} \longrightarrow \text{Final Invitation}$$

### 5. CineMorph Architectural Space Blueprint & Dual Environment Invariant (v1.8.5)
- **Viewport Scene State Machine**: CineMorph (`/cinemorph`) operates within a single dynamic viewport (`100dvh`, zero document scroll) transitioning through a 6-space state machine:
  $$\text{Arrival Lobby} \to \text{Booking Office} \to \text{Media Ingest} \to \text{Ticket Printing} \to \text{Admission Decision} \to \text{Personal Screening Room} \to \text{Theater Entry}$$
- **One Building, Two Environmental States**:
  - **Morning / Day Mode**: Soft natural daylight, warm alabaster (`#E8E2D7`), light limestone (`#C9C1B4`), natural oak (`#9A7655`), brushed brass (`#B58A52`), subtle long shadows.
  - **Night Mode**: Deep architectural charcoal (`#101215`), ambient black (`#070809`), warm amber practical lighting (`#E8A353`), deep amber (`#9B6029`), sapphire accents (`#3B6E9A`).
  - **Environmental Time Transition**: Changes occur through a tactile celestial dial integrated near the CineMorph mark over 800ms–1600ms; never abruptly invert CSS background colors.
- **Physical Affordance Invariant**: Never use didactic text ("Click here", "Upload movie", "Select file", "Step 1", "Configure..."). Interactivity is conveyed through lighting pools, material contrast, hover lift, and mechanical emergence.
- **Authoritative Apertures**: Only `Original`, `1.90:1`, and `1.43:1`. Never offer or display `2.39:1`.



