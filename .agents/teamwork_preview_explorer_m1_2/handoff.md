# Handoff Report: Bento Landing Page & Navigation Architecture (Milestone 1)

**Agent**: Explorer 2 (`teamwork_preview_explorer_m1_2`)  
**Mission**: Investigate and design the Minimalist Bento Landing Page, UI layout shell, and navigation routing for OmniStream.  
**Target Milestone**: M1 (Core Foundation & Bento Landing Page)  
**Parent Task ID**: `de0f0b80-d13a-4bdc-ab3f-107784376abc`

---

## 1. Observation

1. **Requirements & Scope**:
   - `ORIGINAL_REQUEST.md` (R1, R2, R4):
     > "Omnistream is a web-based multimedia platform combining an ad-free YouTube alternative (U-TUBE) and a local/YouTube theatrical experience player (CineMorph)... Include a main minimalist bento-style landing page to navigate between U-TUBE and CineMorph."
     > "The system must save movie progress (tickets) locally so users can click a torn ticket to resume exactly where they left off."
     > "If internet connectivity drops, playback should fallback to a 4:3 cropped ratio without live ML calculations."
   - `PROJECT.md` (Features F01, F02, F03, Milestones Table):
     > "F01: Minimalist Bento Landing Page (Responsive bento grid to switch between U-TUBE & CineMorph)"
     > "F02: Routing & Shell Navigation (Seamless stateful switching between views)"

2. **Existing Project Codebase & Dependencies**:
   - `package.json`: Contains `@tailwindcss/vite` (v4.1.14), `lucide-react` (v0.546.0), `motion` (v12.23.24), `react` (v19.0.1), `react-router-dom` (v7.18.1), and `zustand` (v5.0.14).
   - `src/App.tsx`: Currently loads `RootRouter` and lazy routes (`/landing`, `/home`, `/cinemorph`, `/theater/:id`, `/watch/:id`, etc.).
   - `src/store.ts`: Implements Zustand store with `rootLandingPreference` (`'ask' | 'v1' | 'v2'`), `versionMode` (`'v1' | 'v2'`), `frameAspectRatio` (`'1.43:1' | '1.90:1' | 'original'`), `audioEQ`, and history state persistence.
   - `src/components/Layout.tsx`: Controls full-viewport passthroughs for landing views and standard top/sidebar shell for discovery pages.

---

## 2. Logic Chain

1. **From User Request to Grid Layout**:
   - OmniStream combines two fundamentally different viewing experiences: rapid ad-free streaming (U-TUBE) and high-immersion 3D theater playback (CineMorph). A standard tab bar does not give enough visual weight or affordance.
   - An asymmetric 12-column Bento Grid (`BentoGrid.tsx`) with two dominant hero cards (`ModeCard.tsx` for U-TUBE col-span-7 and CineMorph col-span-5) provides instant distinction while celebrating both engines.

2. **From R4 to Diegetic Ticket Drawer**:
   - R4 mandates saving watch progress as "tickets" where users can click a torn ticket to resume where they left off.
   - Creating `TicketDrawer.tsx` with vintage perforated ticket styling (dashed tear-lines, semi-circle notch geometry, timecode progress bar, and 1-click launch) provides the required physical theater metaphor.

3. **From R2 to System & Quick Settings Cards**:
   - R2 requires offline fallback to 4:3 cropped ratio without ML when network drops.
   - Placing live connectivity detection (`window.addEventListener('online'/'offline')`) on the Bento Landing alongside quick preset toggles (aspect ratio `1.43:1`, `1.90:1`, `original`, `4:3` and Web Audio DSP `+18dB`) guarantees transparency before launching a session.

4. **From F02 to Seamless Routing**:
   - `src/app/App.tsx` routes `/` or `/landing` directly to `BentoGrid`, preserving user startup preference (`ask`, `v1`, or `v2`), while retaining full accessibility across `/home`, `/cinemorph`, `/theater/:id`, and `/watch/:id`.

---

## 3. Caveats

- **No Caveats**. All component interfaces, responsive CSS layouts, icon sets, state interactions, and routing pathways are fully specified in `bento_ui_plan.md`.

---

## 4. Conclusion

The Bento Landing Page and UI Layout Shell design is complete, specified, and ready for Milestone 1 builder execution.

### Key Deliverables Specified:
- `src/components/bento/BentoGrid.tsx` — 12-column responsive bento container with dynamic obsidian & projection glows.
- `src/components/bento/ModeCard.tsx` — Reusable interactive mode card with custom slots for live search and local media dropzone.
- `src/components/bento/TicketDrawer.tsx` — Diegetic torn tickets shelf with 1-click resume and progress indicator.
- `src/app/App.tsx` — Unified React Router v7 shell with code splitting and seamless view switching.

---

## 5. Verification Method

To verify the implementation once executed by the builder:
1. **Component Compilation Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **Visual & Responsive Verification**:
   - Launch dev server: `npm run dev`
   - Visit `http://localhost:5173/` or `http://localhost:5173/landing`.
   - Verify 12-col layout on desktop (>1024px), 2-col on tablet (768px-1023px), and 1-col on mobile (<768px).
3. **Interactive Route Tests**:
   - Enter a query in the U-TUBE search input -> verifies transition to `/search?q=...`.
   - Drag & drop local MP4 onto CineMorph card -> verifies ticket creation and navigation to `/theater/:id`.
   - Click a torn ticket in TicketDrawer -> verifies resumption at saved timestamp.
   - Toggle network offline in devtools -> verifies status pill updates to "Offline (4:3 Fallback Active)".
