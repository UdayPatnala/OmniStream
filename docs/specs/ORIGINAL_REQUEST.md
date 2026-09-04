# Original User Request

## 2026-08-23T15:04:27Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt ? get user approval ? delegate to teamwork_preview
> Requested team: Full team

Omnistream is a web-based multimedia platform combining an ad-free YouTube alternative ( U-TUBE) and a local/YouTube theatrical experience player (CineMorph). It features high-quality UX and dynamic client-side ML IMAX-style real-time framing for local files. 

Working directory: d:\PROJECT\AROH Open Source\Products\OmniStream
Integrity mode: development

## Requirements

### R1. U-TUBE (Ad-Free YouTube Experience)
Build a React-based YouTube clone layout (white and red theme). It must allow users to search (displaying top 3 results), paste direct YouTube links, and subscribe to channels. The home page must display the latest videos from subscribed channels (refreshing every 4 hours) and recommend 5 videos based on keyword extraction from recent searches. All video playback must be ad-free. User data (subscriptions, history) must be stored locally (LocalStorage/IndexedDB) with no backend.

### R2. CineMorph (Desktop Theatrical Experience)
Build a desktop-only immersive video player using Three.js for 3D environment rendering (seats, curtains, curved screens). It must support 1.43:1 (IMAX GT), 1.90:1 (IMAX), and original aspect ratios. The UI should have a vintage paper theme with bright colors and theater props (camera, reels, ticket printer). It must support playing YouTube links or local video files (with a focus on local files). If internet connectivity drops, playback should fallback to a 4:3 cropped ratio without live ML calculations.

### R3. Advanced Framing Geometry (Client-Side ML)
Implement a client-side real-time ML model (e.g., using TensorFlow.js) for local video files. The model must analyze frames and dynamically pan the video behind the fixed hole (screen area) to optimize framing based on Advanced Framing Geometry rules (e.g., Frame-within-a-frame, Leading lines, Rule of thirds, Screen direction). Processing must happen locally. 

### R4. UX and State Management
Implement a 10-second ticket printing animation when a user starts a movie in CineMorph. This acts as a loading screen to allow the client-side ML model to pre-process the initial video frames (heads up processing). The system must save movie progress (tickets) locally so users can click a torn ticket to resume exactly where they left off. Include a main minimalist bento-style landing page to navigate between U-TUBE and CineMorph.

## Acceptance Criteria

### U-TUBE Functionality
- [ ] Searching a query fetches and displays exactly 3 relevant YouTube results.
- [ ] Subscribed channel data and search history persist in LocalStorage across browser reloads.

### CineMorph 3D Environment & Video
- [ ] Three.js renders a recognizable theater environment with screen and seats that scale with the browser window.
- [ ] The app successfully loads a local MP4 file and plays it within the 3D screen.

### Advanced Framing Geometry
- [ ] A programmatic test or diagnostic overlay confirms the client-side ML model runs on video frames, identifies subjects/features, and outputs dynamic X/Y panning coordinates.

### UX & State
- [ ] Playing a CineMorph video triggers the 10-second ticket printer animation before playback begins.
- [ ] Refreshing the page and clicking a saved ticket resumes the local video at the correct timestamp.

## Follow-up — 2026-08-23T15:16:28Z

The user has requested that you check and verify all work against the [OMNISTREAM_MASTER_GUARDIAN].pdf file located in the workspace root at all times. This document contains 5 guardian documents detailing product constitution, vision, technical constraints, UI/UX philosophy, and QA/testing rules for OmniStream. Please ensure the implementation adheres strictly to the principles in this PDF.

## Follow-up — 2026-08-23T15:20:04Z

The user has added a new directive: make layers,models,llms anything needed to achive the goal. Please incorporate this into the execution plan, while ensuring that any architectural choices (like introducing LLMs or layers) still strictly comply with the constraints outlined in the [OMNISTREAM_MASTER_GUARDIAN].pdf (e.g., Guardian rules regarding LLM limits, performance budgets, and client-side processing).

## Follow-up — 2026-08-24T03:56:35Z

Server restart occurred. Resume execution of OmniStream.
Absolute source of truth: OMNISTREAM_MASTER_SPECS.md alongside [OMNISTREAM_MASTER_GUARDIAN].pdf.
Explicit user instruction: make layers,models,llms anything needed to achive the goal.
Inspect repository for code completed for Milestone 1 and resume full orchestration across all milestones.

## Follow-up — 2026-08-24T04:04:06Z

Final master directive: [OMNISTREAM_FINAL_BUILD_AGENT] located at OMNISTREAM_FINAL_BUILD_AGENT.md in workspace root.
100-point manifest defining behavior, testing, priorities, and definition of done.
Mode: AUTONOMOUS_PRODUCT_ENGINEER+ARCHITECT+UIUX_ENGINEER+QA+SECURITY+PERFORMANCE_ENGINEER.
Absolute priority: FUNCTIONALITY > RELIABILITY > SECURITY > PERFORMANCE > UX > VISUAL_POLISH > EXPERIMENTAL_FEATURES.
Apply all 100 rules to adversarial reviews and final integrity verification gates.

## Follow-up — 2026-08-24T04:06:29Z

Intelligence Architecture specification: OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md in workspace root (and updated GEMINI.md).
Constraints: Model/AI implementation, non-blocking off-main-thread execution, Level 0-4 fallbacks, strict rules for specialist vision models vs LLMs.
Instruct reviewers and auditors to include OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md in final audit.

## Follow-up — 2026-08-24T04:19:42Z

URGENT OVERRIDE: [OMNISTREAM_FINAL_REQUIREMENT_CLARIFICATION_AND_ASSUMPTION_CONTROL] located at OMNISTREAM_FINAL_REQUIREMENT_CLARIFICATION_AND_ASSUMPTION_CONTROL.md in workspace root.
Overrides initial assumptions:
- U-TUBE search must NOT be restricted to exactly 3 results (use small fast initial set and allow 'load more').
- Exact behavior for app open refreshes, mode switching, 10-second ticket intro matching selected aperture, and fallback behaviors.
- No Demo Mode rules.
Halt final sign-off, distribute to all reviewers/challengers/auditors, re-audit, fix any violations with workers, and verify 100% satisfaction under /goal parameters before proceeding.

## Follow-up — 2026-08-24T04:21:18Z

OmniStream Intelligence System (OMS) Identity Standard: OMNISTREAM_OMS_IDENTITY_STANDARD.md in workspace root.
Rules: Rigid naming and modular architectural abstraction (OMS_VISION, OMS_DETECT, OMS_TRACK, OMS_SALIENCY, OMS_FALLBACK, etc.). Bans renaming third-party models as OMS; demands strong modularity, fallback, and resource-awareness.
Provide to remediation worker and reviewers; verify mapping to OMS abstraction layers.

## Follow-up — 2026-08-24T04:26:36Z

Brand assets & OMS Visual Identity integration:
- Connect existing project assets: public/Create_a_professional_cinemati...mp4, cinemorph ai.png, public/favicon.svg.
- Integrate public/omn_logo.jpg (OMN neon orb logo) into the UI where OMS is represented or on landing page.
- Apply living CSS animations (pulsing, slow rotation, waveform glow) to give it an animated Siri-like intelligence core appearance.

## Follow-up — 2026-08-24T04:27:35Z

Terminology & Branding clarification:
- 'Siri' was strictly a visual styling reference.
- Remove the word 'Siri' from all code, UI labels, strings, and comments.
- The system is solely and exclusively named **OMS** (OmniStream Intelligence System).

## Follow-up — 2026-08-24T14:23:10Z

Server restart & quota cleared. Revive Victory Auditor to complete final independent audit (
pm run build and 
px vitest run) and deliver binary verdict (VICTORY CONFIRMED / VICTORY REJECTED).
BentoGrid and ModeCard updated with universal video format support and light theme.

## Follow-up — 2026-08-24T14:27:57Z

Full Audit Matrix: OMNISTREAM_FINAL_AUDIT_MATRIX.md located at workspace root.
Covers every single feature, rule, state, and edge case from PRODUCT_IDENTITY to FINAL_AUDIT and NO_FAKE_PROCESSING.
Victory Auditor must map its final verdict directly against this exact matrix and verify 100% keyword implementation, testing, and validation before issuing VICTORY CONFIRMED.
