# OmniStream — Routing Ownership Standard

## Top-Level Routing Hierarchy
The application shell owns top-level URL space, mounting products as modular destinations without leaking internal product implementation details into the router.

```
/                   → Shell: Gateway / Root Landing / Bento Grid / Cosmic Portal
/settings           → Shell: Global Application Settings

/u-tube             → U-Tube: Home Feed
/watch/:id          → U-Tube: Active Video Watch Page
/search             → U-Tube: Search Results
/subscriptions      → U-Tube: Subscriptions Manager
/collections        → U-Tube: User Collections
/history            → U-Tube: Watch History
/channel/:id        → U-Tube: Creator Channel Page

/cinemorph          → CineMorph: Architectural Lobby & Cinema Lounge
/theater            → CineMorph: Fixed-Aperture Cinematic Theater (Active Session)
/theater/:id        → CineMorph: Direct Theater Admission
```

---

## Routing Principles

1. **Zero Route Leaks**:
   - The router configuration (`src/app/App.tsx`) loads product pages as lazy-loaded capsules.
   - CineMorph does not declare or interfere with U-Tube routes.
   - U-Tube does not declare or interfere with CineMorph routes.

2. **Full-Viewport Protection**:
   - The shell layout (`src/shell/Layout/Layout.tsx`) inspects route prefixes to provide full-viewport immersive canvas (`100dvh`, zero chrome) for `/cinemorph` and `/theater/*`.
   - Standard navigation headers and sidebars are suppressed inside the cinematic theater.

3. **Contextual Navigation Handoff**:
   - When jumping from a casual watch experience (`/watch/:id`) into deep immersion (`/theater`), the navigation is triggered with state or via `omsTransitionService`.
