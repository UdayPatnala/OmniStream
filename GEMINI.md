# OmniStream Core Constitution

You are working on OmniStream, a personal media experience platform.
OmniStream combines two distinct viewing engines:
1. **U-TUBE**: A lightweight, clean, ad-free YouTube-oriented discovery and watch engine.
2. **CineMorph**: A cinematic, fixed-aperture theater experience for local media using client-side ML framing.

**CRITICAL RULE**: Before making any design, architecture, or implementation decisions, you MUST read and comprehend the full product constitution.
The complete product constitution (P1 through P5 master specs) is located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\OMNISTREAM_MASTER_SPECS.md`

The final 100-point build manifesto is located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\OMNISTREAM_FINAL_BUILD_AGENT.md`

The Intelligence Architecture constraints are located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md`

The final Requirement Clarifications and Assumption Controls are located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\OMNISTREAM_FINAL_REQUIREMENT_CLARIFICATION_AND_ASSUMPTION_CONTROL.md`

The OmniStream Intelligence System (OMS) Identity Standard is located at:
`d:\PROJECT\AROH Open Source\Products\OmniStream\OMNISTREAM_OMS_IDENTITY_STANDARD.md`

You MUST use the `view_file` tool to read these files if you do not already have them in your context. Do NOT guess the architecture. The user has explicitly stated: "make layers, models, llms anything needed to achieve the goal."

## OmniStream Architecture & Lightweight Invariants
- **No Heavy 3D/Tensor Bundles**: Prefer CSS3D transforms, SVG aperture overlays, and 16x9 canvas sampling over Three.js and TensorFlow.js.
- **OMS Render Isolation**: Real-time ambient analysis must update DOM element refs or CSS variables directly; never set high-frequency React states on root theater components.
- **Color System V2**: Editorial light-first foundation (`#F7F5F0`), muted Vermilion (`#C7494F`) for U-Tube accents, muted Slate Blue (`#526C9E`) for CineMorph accents, Graphite (`#5E6166`) for OMS.
- **Persistence Integrity**: Tickets are only saved on confirmed theater entry ("Take Ticket & Enter Theater"). Do not store temporary tickets if user navigates back.
