# OmniStream — CineMorph Dynamic Viewport & Responsive Composition Rule

**Rule ID:** CINEMORPH-VIEWPORT-V1  
**Status:** IMPLEMENTED & VERIFIED  
**Scope:** CineMorph only (U-Tube is a conventional information-dense interface and has separate rules)  
**Author:** Architecture session, enforced by GEMINI.md

---

## 1. Core Invariant — CineMorph is a Spatial Experience, Not a Website

CineMorph must dynamically fit and adapt to the available screen on any device and viewport size.

This does **NOT** mean applying standard responsive breakpoints and stacking everything vertically.

CineMorph is a **spatial experience**. The composition must intelligently adapt while preserving the intended cinematic scene.

**Wrong pattern:**  
> Break layout into stacked mobile columns, show a scrollable page of sections.

**Correct pattern:**  
> Preserve the spatial composition. Reduce decorative complexity on small screens. Keep the primary affordance (booking counter, projection screen, theater canvas) dominant and accessible without scroll.

---

## 2. Viewport-First Design — Use Dynamic Viewport Units

All CineMorph root containers must use **dynamic viewport height** (`dvh`) — never static `vh` or `h-screen`.

### Why `dvh` instead of `vh`?
- On mobile browsers (Safari iOS, Chrome Android), the URL bar appears/hides dynamically.
- `100vh` is computed from the **full screen height** including the URL bar — this causes layout overflow when the URL bar is visible.
- `100dvh` is the **dynamic viewport height** — it recomputes as the URL bar appears/hides. CineMorph spatial scenes must never show scroll bars or overflow because a URL bar appeared.

### Implementation

| Component | Class Used | Prior (Wrong) |
|-----------|------------|---------------|
| `CineMorphLanding.tsx` root | `h-dvh` | `h-screen` |
| `CineMorphTheater.tsx` root | `h-dvh` | `h-screen` |
| `CineMorphLobbySpace.tsx` root | `max-h-dvh` | `max-h-screen` |
| `PersonalScreeningRoom.tsx` root | `max-h-dvh` | `max-h-screen` |
| `CineMorphHero.tsx` section | `min-h-dvh`, `min-h-[92dvh]` | `min-h-screen`, `min-h-[92vh]` |
| `ThresholdPortal.tsx` root | `h-dvh` | `h-screen` |

---

## 3. Overflow Discipline — No Unintended Scroll on Spatial Scenes

CineMorph spatial scenes (Lobby, Screening Room, Theater) must **never produce unintended vertical scroll**.

**Rules:**
- Root containers: `overflow-hidden` — absolute invariant
- Scrollable areas (only where intentional, e.g. audio track list, media history): scoped `overflow-y-auto` on a specific child element, never on root
- No `overflow-y: scroll` on `<html>` or `<body>` for CineMorph routes

**CSS class available:** `.cinemorph-spatial-root` — sets `height: 100dvh; max-height: 100dvh; overflow: hidden; overscroll-behavior: none;`

---

## 4. Safe Area Insets — Notched & Island Devices

CineMorph spatial scenes must respect hardware safe areas:
- **iPhone Dynamic Island** — top safe area
- **Home indicator bar (swipe-to-home)** — bottom safe area
- **Landscape notch** — left/right safe area on older iPhones

**CSS utilities (defined in `index.css`):**
- `.safe-top` — `padding-top: env(safe-area-inset-top)`
- `.safe-bottom` — `padding-bottom: env(safe-area-inset-bottom)`
- `.safe-left`, `.safe-right`, `.safe-x` — horizontal safe areas

**Where to apply:**
- Navigation bars (`CineMorphNav`) — safe-top
- Bottom CTA strips (Enter Theater button areas) — safe-bottom
- Do NOT apply to full-bleed ambient/background layers — they should extend into safe areas

---

## 5. Orientation Awareness

CineMorph does not stack to a mobile-portrait website. The spatial composition adapts:

| Orientation | Adaptation Rule |
|-------------|-----------------|
| **Landscape (wide)** | Full 3-column lobby grid. Side architectural columns visible (lg:). Booking center dominates. |
| **Portrait (narrow, < md)** | Side decorative columns hidden. Single-column booking counter is primary affordance. Ticket printer remains fully visible. |
| **Landscape mobile (short viewport)** | Reduce padding. Scale down text. Maintain center booking column. Use `clamp()` for typography sizing. |

**Breakpoint guidance (Tailwind):**
- `< md (< 768px)`: Mobile portrait — single column, minimal chrome
- `md – lg (768px – 1024px)`: Tablet — 2-column, simplified side panels
- `>= lg (>= 1024px)`: Desktop — full 3-column spatial composition

---

## 6. Typography Fluid Scaling

Never hard-code `px` sizes that cause text overflow or truncation on small screens.

Use `clamp()` for cinematic headings and display text:

```css
/* Example: CineMorph section heading */
font-size: clamp(1.25rem, 4vw, 2.5rem);
```

Tailwind equivalent: Use responsive size steps (`text-lg sm:text-xl lg:text-3xl`) rather than a single fixed size.

---

## 7. Composition Priority Under Space Constraints

When viewport is narrow or short, preserve elements in this priority order:

1. **Primary affordance** (file drop zone / booking counter / theater screen) — ALWAYS visible
2. **Active ticket / media state indicator** — ALWAYS visible when active
3. **CTA buttons** (Enter Theater, Shape Screening) — ALWAYS visible
4. **Seat/aperture selectors** — Visible on mobile, may compact
5. **Decorative side architectural elements** — Hide on < lg breakpoint
6. **Ambient background environment** — Full bleed always, but behind content

**Never:**
- Push the primary affordance below the fold
- Require scroll to reach Enter Theater or file selection
- Make the ticket printer partially off-screen

---

## 8. Overscroll Behavior

Prevent Safari/iOS rubber-band bounce effect on spatial scenes:

```css
overscroll-behavior: none;       /* on root containers */
overscroll-behavior: contain;    /* on intentionally scrollable child panels */
```

**CSS utility:** `.overscroll-contain-spatial` — applies `overscroll-behavior: contain` for intentionally scrollable sub-panels.

---

## 9. Performance — No Viewport-Change React Re-renders

Viewport size changes (resize events) must NOT trigger expensive React re-renders on root spatial components.

**Allowed:**
- CSS media queries in Tailwind classes — zero JS cost
- CSS custom properties updated by a ResizeObserver on a specific element
- `100dvh` native CSS — browser handles without JS

**Not allowed:**
- `useEffect + window.resize` listener that sets root component state
- Polling window dimensions and updating theater component state
- ResizeObserver that triggers `setState` on the root theater component

---

## 10. Touch Interaction

- All interactive CineMorph elements must have minimum touch target size: **44px × 44px**
- No hover-only affordances — all hover states must also have equivalent focus/active states
- `playsInline` attribute on all `<video>` elements (iOS Safari fullscreen prevention)

---

## 11. Reference Implementations

All viewport fixes implemented in the September 2026 architecture session:

| File | Change |
|------|--------|
| [`CineMorphLanding.tsx`](../../src/pages/CineMorphLanding.tsx) | `h-screen` → `h-dvh` |
| [`CineMorphTheater.tsx`](../../src/pages/CineMorphTheater.tsx) | `h-screen` → `h-dvh` |
| [`CineMorphLobbySpace.tsx`](../../src/components/cinemorph/landing/CineMorphLobbySpace.tsx) | `max-h-screen` → `max-h-dvh` |
| [`PersonalScreeningRoom.tsx`](../../src/components/cinemorph/landing/PersonalScreeningRoom.tsx) | `max-h-screen` → `max-h-dvh` |
| [`CineMorphHero.tsx`](../../src/components/cinemorph/landing/CineMorphHero.tsx) | `min-h-screen` → `min-h-dvh` |
| [`ThresholdPortal.tsx`](../../src/components/threshold/ThresholdPortal.tsx) | `h-screen` → `h-dvh` |
| [`index.css`](../../src/index.css) | Added `.safe-top`, `.safe-bottom`, `.safe-x`, `.overscroll-contain-spatial`, `.cinemorph-spatial-root` |

---

## 12. Logo Consistency (Brand Identity Invariant)

**Single canonical CineMorph logo asset:** `/public/cinemorph_artwork.png`

- Do not introduce new CineMorph logo files, alternate wordmarks, improvised Film icons, or generated substitutes.
- The `/public/cinemorph_ai.png` file is a duplicate and unused — do not reference it in code.
- All usages of the CineMorph brand image must reference `/cinemorph_artwork.png`.
- The logo has a white background — never render it on dark backgrounds without a `mix-blend-mode` or wrapper with matching background. Prefer using it inside themed containers (white-bg ticket stubs, light-themed panels) or apply `filter: drop-shadow()` to float the mark visually.

**Verified consistent as of September 2026:**
- `CineMorphHero.tsx` — uses `/cinemorph_artwork.png` ✓
- `CineMorphLobbySpace.tsx` — uses `/cinemorph_artwork.png` ✓
- `ThresholdPortal.tsx` — uses `/cinemorph_artwork.png` ✓
- `posterService.ts` — fallback is `/cinemorph_artwork.png` ✓
