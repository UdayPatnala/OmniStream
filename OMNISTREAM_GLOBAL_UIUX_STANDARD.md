# OmniStream Global UI/UX Reference & Engineering Standard

**Document ID:** `OMNISTREAM-STD-UIUX-001`  
**Status:** Canonical Reference Standard  
**Lead Architect:** Patnala Uday Kumar  
**Date:** 2026-08-25  

---

## 1. Global Visual & Theme Hierarchy

OmniStream adopts an explicit **Light-First Architecture** across all non-theater surfaces:

```
                            OMNISTREAM MASTER VISUAL SYSTEM
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
┌────────▼────────┐               ┌────────▼────────┐               ┌────────▼────────┐
│  ROOT LANDING   │               │     U-TUBE      │               │ CINEMORPH ENTRY │
│   Light Bento   │               │ Clean White/Red │               │  Vintage Ivory  │
│    (#F8F9FA)    │               │  (#FFFFFF/#EF)  │               │    (#FDFBF7)    │
└─────────────────┘               └─────────────────┘               └────────┬────────┘
                                                                             │
                                                                    ┌────────▼────────┐
                                                                    │ CINEMORPH HALL  │
                                                                    │ Dark Auditorium │
                                                                    │    (#050508)    │
                                                                    └─────────────────┘
```

| Application Domain | Target Surface | Theme / Palette | Primary Typography & Visual Mood |
|---|---|---|---|
| **Root Gateway** | `/` (Landing Bento) | **Light Canvas (`#F8F9FA`)** | Editorial Minimalist, Ivory Cards, Slate Typography |
| **U-Tube Discovery** | `/home`, `/search`, `/watch` | **Light Platform (`#FFFFFF`)** | Crisp White Background, High-Contrast Red `#E50914` Accents |
| **CineMorph Pre-Show** | `/cinemorph`, `/ticket` | **Warm Vintage Paper (`#FDFBF7`)** | Diegetic Thermal Ticket Printer, Amber `#D97706` Accents |
| **CineMorph Auditorium** | `/theater/*` | **Dark Cinema (`#030308`)** | IMAX Cyan Pinlights, Scalloped Halogens, Fixed Aperture |

---

## 2. Technical Reference & Knowledge Base

OmniStream draws architectural and motion patterns from open-source web standards without copying proprietary trademarks or styling:

### A. Web Animation & Motion Physics
- **Primary Engine:** [Motion](https://motion.dev/) (MIT Licensed, hardware-accelerated CSS GPU transforms).
- **Core Principles:** Spring physics ($k=120, \zeta=0.85$), staggered entrance cascades ($40\text{ms}$ step), zero layout thrashing (`translate3d` and `scale` only).

### B. Fixed-Aperture & Spatial Framing
- **Concept:** *Screen-Behind-the-Hole* architecture.
- **Implementation:** The visible aperture geometry is statically locked to the target presentation ratio ($1.43:1$, $1.90:1$, $21:9$, or Curved Original). The underlying video film-plane executes smooth sub-pixel panning via `transform: translate3d(x, y, 0) scale(s)`.

### C. Cinematographic Composition & Saliency
- **Rule of Thirds Alignment:** Soft-scoring evaluation prioritizing subject placement at $\pm 33.3\%$ lateral grid intervals.
- **Headroom Protection:** Subject apex maintained strictly within the $15\%\text{–}35\%$ upper vertical quadrant.
- **Lead-Room Lookahead:** Forward pan offsets proportional to the temporal optical motion vector $(\vec{v} = (v_x, v_y))$.
- **Source Composition Protection Gate:** When the directorial composition is already balanced, or when score delta $\Delta < 0.15$, framing is preserved with zero cropping.

### D. Audio Spatialization & Processing
- **Engine:** Web Audio API 5-Band Biquad Filter Parametric Equalizer.
- **Profiles:** Dialogue Clarity Booster ($+20\text{dB}$ mid-peak bandpass), Cinema Sub-Bass ($80\text{Hz}$ low-shelf boost), Night Dynamic Range Compressor.

---

## 3. Technology Preference Hierarchy

When designing and implementing features in OmniStream, solutions are selected according to the following strict order of preference:

$$\text{Native CSS/HTML5} \;\succ\; \text{Small Local Engine} \;\succ\; \text{Lightweight OSS Library} \;\succ\; \text{Web Audio/WebGL} \;\succ\; \text{Local Worker ML}$$

1. **Zero Cloud Dependency for Core Features**: Playback, smart-framing, audio EQ, ticket issuance, and search persistence must function $100\%$ offline and client-side.
2. **Zero Paid APIs**: No user is ever required to provide a credit card or paid API key.
3. **Fail-Safe Playback**: An AI failure, WebGL context loss, or network drop must immediately and silently fall back to uncropped original playback without crashing the user session.
