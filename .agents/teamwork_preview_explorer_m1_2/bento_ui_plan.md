# OmniStream Bento Landing Page & Navigation Routing Specification

**Milestone**: M1 (Core Foundation & Bento Landing Page)  
**Author**: Explorer 2 (UI/UX Architect & Routing Specialist)  
**Target Delivery Path**: `.agents/teamwork_preview_explorer_m1_2/bento_ui_plan.md`  
**Dependencies**: React 19, Tailwind CSS v4, Lucide React, Motion, Zustand

---

## 1. Executive Summary & Aesthetic Direction

OmniStream requires a **Minimalist Bento-Style Landing Page** (`F01`) and a **Routing & Shell Navigation Engine** (`F02`) that serves as the command center for the dual-engine multimedia platform:
1. **U-TUBE**: The high-efficiency, ad-free YouTube discovery client featuring 3-result search, 4-hour cached subscriptions, and 5-keyword recommendations.
2. **CineMorph**: The immersive 3D Three.js IMAX theater with curved screens, vintage paper styling, mechanical ticket printer, and dynamic client-side ML framing for local files.

### Visual Identity: "Neo-Cinema Vintage Fusion"
- **Primary Canvas**: Obsidian Noir (`#06040A` to `#0B0813`) with deep space radial gradients.
- **Glassmorphic Bento Cards**: High-translucency frosted glass (`rgba(18, 14, 28, 0.70)`) with `backdrop-blur-2xl`, subtle specular highlights (`border border-white/10`), and interactive ambient back-glows.
- **Vintage Paper & Diegetic Cinema Accents**: Warm amber gold (`#F59E0B`), parchment textures (`#FAF3E0` micro-accents), dashed perforated tear-lines for tickets, monospace telemetry fonts (`ui-monospace, monospace`), and ticket stamp badges.
- **Bright Cinematic Accents**:
  - **U-TUBE Accent**: Radiant YouTube Crimson (`#FF0000` / `#EF4444`) with vibrant red light spills.
  - **CineMorph Accent**: Electric Cyan Projection Laser (`#06B6D4` / `#00E5FF`) and Warm Golden Projector Lens (`#F59E0B`).
  - **System Live Accent**: Emerald Pulse (`#10B981`) for zero-trust private offline/online telemetry.

---

## 2. Bento Grid Responsive Layout Architecture

The Bento Landing Page is structured as an **Asymmetric 12-Column Grid** on desktop, collapsing smoothly to 2 columns on tablet, and 1 column on mobile.

```
+-----------------------------------------------------------------------------------------------+
|                                    OMNISTREAM BRAND HEADER                                    |
| [Logo: OmniStream] [Mode Switcher: Gateway | U-TUBE | CineMorph] [Zero-Trust / Offline Pill] |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  +--------------------------------------------+  +-----------------------------------------+  |
|  |  CARD 1: U-TUBE HERO (col-span-7)          |  |  CARD 2: CINEMORPH HERO (col-span-5)    |  |
|  |  * Ad-Free YouTube Experience              |  |  * 3D IMAX Theatrical Experience        |  |
|  |  * Direct Search Input (Top 3 Results)     |  |  * 1.43:1 / 1.90:1 / 4:3 Fallback       |  |
|  |  * Direct YouTube URL Paste Bar            |  |  * Local MP4 Drag-and-Drop Zone         |  |
|  |  * Subscriptions (4h Cache Active)         |  |  * 10s Ticket Printer Preview           |  |
|  |  * Crimson Ambient Corner Glow             |  |  * Amber & Cyan Projection Laser Glow   |  |
|  +--------------------------------------------+  +-----------------------------------------+  |
|                                                                                               |
|  +-------------------------------------+  +--------------------+  +------------------------+  |
|  |  CARD 3: TICKET SHELF (col-span-6)  |  | CARD 4: TELEMETRY  |  | CARD 5: QUICK SETTINGS |  |
|  |  * Diegetic Torn Perforated Tickets |  | (col-span-3)       |  | (col-span-3)           |  |
|  |  * Saved Movie Progress & Timecode  |  | * Network Status   |  | * Default Aspect Ratio |  |
|  |  * 1-Click Instant Resume Launch    |  | * TF.js ML Ready   |  | * Web Audio DSP Boost  |  |
|  |  * Aspect Ratio & Poster Thumbnail  |  | * 4h Feed Cache    |  | * Startup Preference   |  |
|  +-------------------------------------+  +--------------------+  +------------------------+  |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
|                                    MINIMALIST FOOTER                                          |
+-----------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Card Specifications

### 3.1 Card 1: U-TUBE Gateway (`col-span-12 lg:col-span-7`)
- **Purpose**: Primary entrance for ad-free YouTube streaming and fast video discovery.
- **Key Features**:
  - **Live Search & URL Input Bar**: Integrated directly into the card. Users can type a search query (instantly triggers top 3 filtered results) or paste a YouTube URL to jump immediately into playback.
  - **Feature Pills**: "100% Ad-Free Playback", "Top 3 High-Relevance Results", "4-Hour Feed Cache", "Keyword Recommendations".
  - **Visual Elements**: YouTube red corner bloom, subtle playback playhead animation, channel badge counters.
  - **Action CTA**: "Launch U-TUBE Streamer" (`/home`).

### 3.2 Card 2: CineMorph 3D IMAX Theater (`col-span-12 lg:col-span-5`)
- **Purpose**: Entrance to the desktop-only 3D theatrical experience with client-side ML framing.
- **Key Features**:
  - **Interactive Local File Dropzone**: Drag-and-drop local MP4 / MKV / WebM files directly onto the card. Automatically stages the media, activates the 10-second ticket printer animation, and routes to `/theater/:id` or `/watch/:id`.
  - **Aspect Ratio Badges**: Highlights `1.43:1 (IMAX GT)`, `1.90:1 (IMAX Digital)`, and `4:3 (Offline Fallback)`.
  - **Visual Elements**: Golden projector rays, 3D curved screen mesh preview glyph, retro camera and reel iconography.
  - **Action CTA**: "Enter CineMorph Cinema" (`/cinemorph`).

### 3.3 Card 3: Quick Resume Torn Ticket Shelf (`col-span-12 lg:col-span-6`)
- **Purpose**: Diegetic, tactile ticket shelf displaying recent watch sessions with 1-click resume.
- **Design Structure**:
  - **Ticket Anatomy**:
    - **Header**: Diegetic stamp "OMNISTREAM ADMIT ONE — VIP SCREENING", ticket serial code `#OMNI-8842`.
    - **Perforation**: Visual dashed tear-line with top & bottom semi-circle notch cutouts.
    - **Body**: Media Title (truncated cleanly), Video Source badge (Local MP4 vs YouTube), Saved Timecode vs Total Duration (e.g. `01:24:10 / 02:30:00`), Progress Bar.
    - **Actions**: "1-Click Resume" play button (resumes exact timestamp in CineMorph or U-TUBE) and "Tear/Dismiss" button.
  - **Empty State**: Elegant vintage ticket dispenser with the message: *"Box Office Empty — Load a movie or local video to print your first admission ticket."*

### 3.4 Card 4: System Telemetry & Offline Status (`col-span-12 sm:col-span-6 lg:col-span-3`)
- **Purpose**: Real-time transparency of client-side operations, network connectivity, and ML engine readiness.
- **Metrics Displayed**:
  - **Connectivity Status**: `ONLINE` (Full YouTube search & streaming) or `OFFLINE` (Auto fallback to 4:3 cropped playback without live ML calls).
  - **ML Framing Engine**: `WebGL / WebGPU Accelerated` (TensorFlow.js ready).
  - **Feed Freshness**: `Cached 42m ago` (Next refresh in 3h 18m).
  - **Storage**: `IndexedDB Ready (100% Client-Side Private)`.

### 3.5 Card 5: Quick Settings & Experience Customizer (`col-span-12 sm:col-span-6 lg:col-span-3`)
- **Purpose**: Quick toggles before entering a media session.
- **Controls**:
  - **Default Aspect Ratio**: Toggle between `1.43:1` | `1.90:1` | `Original`.
  - **Audio DSP Preset**: Quick select `Standard` | `Dialogue Boost (+6dB)` | `IMAX Loudness (+18dB)`.
  - **Startup Gateway Preference**: Toggle `Ask Every Time` | `Always U-TUBE` | `Always CineMorph`.

---

## 4. Navigation & Routing Architecture

### Route Map (`src/app/routes.tsx` / `src/App.tsx`)
```typescript
/              -> RootRouter (evaluates rootLandingPreference: 'ask' -> BentoGrid, 'v1' -> Home, 'v2' -> CineMorphLanding)
/landing       -> BentoGrid (Always shows Bento Gateway)
/gateway       -> BentoGrid (Alias)
/home          -> U-TUBE Home Feed (Subscriptions & Recommendations)
/feed          -> Alias to /home
/search        -> U-TUBE Search Page (Top 3 Results)
/watch/:id     -> Smart Watch Router (V1 Ad-Free Player or V2 3D Theater depending on versionMode)
/cinemorph     -> CineMorph Landing / File Launcher
/theater/:id   -> CineMorph 3D Theater Environment (Three.js WebGL canvas)
/subscriptions -> Subscribed Channels Manager
/collections   -> User Collections / Playlists
/history       -> Watch History & Saved Tickets
/settings      -> Global OmniStream Configuration
/channel/:id   -> Channel Detail Page
```

---

## 5. Exact Component Code Specifications

### 5.1 `src/components/bento/BentoGrid.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Tv, Film, Ticket, Wifi, WifiOff, Cpu, 
  Settings2, ArrowRight, Search, Play, UploadCloud, 
  Sliders, ShieldCheck, CheckCircle2, ChevronRight, Layers, Volume2
} from 'lucide-react';
import { useAppStore } from '../../store';
import { ModeCard } from './ModeCard';
import { TicketDrawer } from './TicketDrawer';
import { extractYouTubeId } from '../../lib/utils';
import { LocalMediaItem } from '../../types';

export function BentoGrid() {
  const navigate = useNavigate();
  const { 
    setVersionMode, 
    rootLandingPreference, 
    setRootLandingPreference,
    frameAspectRatio,
    setFrameAspectRatio,
    audioEQ,
    setAudioEQ,
    addLocalMediaToHistory,
    setActiveLocalMedia
  } = useAppStore();

  const [utubeQuery, setUtubeQuery] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLaunchUTube = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = utubeQuery.trim();
    if (query) {
      const ytId = extractYouTubeId(query);
      if (ytId) {
        setVersionMode('v1');
        navigate(`/watch/${ytId}`);
        return;
      }
      setVersionMode('v1');
      navigate(`/search?q=${encodeURIComponent(query)}`);
      return;
    }
    setVersionMode('v1');
    navigate('/home');
  };

  const handleLaunchCineMorph = () => {
    setVersionMode('v2');
    navigate('/cinemorph');
  };

  const handleLocalFileDrop = (file: File) => {
    if (!file) return;
    try {
      const blobUrl = URL.createObjectURL(file);
      const fileId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const mediaItem: LocalMediaItem = {
        id: fileId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        size: file.size,
        type: file.type || 'video/mp4',
        url: blobUrl,
        duration: 0,
        progress: 0,
        lastWatchedAt: Date.now(),
      };
      addLocalMediaToHistory(mediaItem);
      setActiveLocalMedia(mediaItem);
      setVersionMode('v2');
      navigate(`/theater/${fileId}`);
    } catch (err) {
      console.error('Failed to load dropped local file', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#06040A] text-white flex flex-col p-4 sm:p-6 md:p-10 relative overflow-y-auto overflow-x-hidden hide-scrollbar font-sans selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/4 left-[-100px] w-[500px] h-[500px] bg-red-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-[-100px] w-[600px] h-[600px] bg-cyan-900/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 py-3 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-tr from-red-600 via-purple-600 to-cyan-500 p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/30 border border-white/20">
            <Layers className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white font-sans">
              Omni<span className="text-cyan-400">Stream</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 font-mono">
              Ad-Free Streaming & IMAX 3D Cinema
            </span>
          </div>
        </div>

        {/* Top Status Indicators */}
        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md ${
            isOnline 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live System Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline (4:3 Fallback Active)</span>
              </>
            )}
          </div>

          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Open Global Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Bento Grid Container */}
      <main className="w-full max-w-7xl mx-auto z-10 grid grid-cols-1 md:grid-cols-12 gap-5 mb-10">
        
        {/* CARD 1: U-TUBE Showcase Hero (col-span-12 lg:col-span-7) */}
        <div className="col-span-12 lg:col-span-7">
          <ModeCard
            mode="utube"
            badgeText="Ad-Free YouTube Engine"
            badgeIcon={<Tv className="w-3.5 h-3.5 text-red-400" />}
            title="U-TUBE"
            tagline="Distraction-free YouTube with 3-result search, 4-hour cached subscriptions, and smart keyword recommendations."
            onAction={handleLaunchUTube}
            actionText="Launch U-TUBE"
          >
            <form onSubmit={handleLaunchUTube} className="mt-4 relative">
              <div className="flex items-center gap-2 bg-black/60 border border-white/15 rounded-2xl p-1.5 focus-within:border-red-500/60 transition-all">
                <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={utubeQuery}
                  onChange={(e) => setUtubeQuery(e.target.value)}
                  placeholder="Search top 3 results or paste direct YouTube link..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none px-2"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-lg shadow-red-600/30"
                >
                  <span>Go</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Zero Ads Guaranteed</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Top 3 Fast Filter</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-300 flex items-center gap-2 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>4h Auto-Sync Feed</span>
              </div>
            </div>
          </ModeCard>
        </div>

        {/* CARD 2: CineMorph 3D Theater Hero (col-span-12 lg:col-span-5) */}
        <div className="col-span-12 lg:col-span-5">
          <ModeCard
            mode="cinemorph"
            badgeText="3D Virtual IMAX Hall"
            badgeIcon={<Film className="w-3.5 h-3.5 text-cyan-400" />}
            title="CineMorph"
            tagline="Step into an immersive 3D theater with 1.43:1 curved screen, 10s ticket printer, and client-side ML framing."
            onAction={handleLaunchCineMorph}
            actionText="Enter Theater"
          >
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleLocalFileDrop(e.dataTransfer.files[0]);
              }}
              className="mt-4 border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/*,audio/*';
                input.onchange = (e: any) => {
                  if (e.target?.files?.[0]) handleLocalFileDrop(e.target.files[0]);
                };
                input.click();
              }}
            >
              <UploadCloud className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-cyan-200">
                Drop Local MP4/MKV to Print Ticket
              </div>
              <span className="text-[10px] text-gray-400">1.43:1 GT, 1.90:1 & 4:3 Fallback Support</span>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300 font-bold">1.43:1 IMAX</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300 font-bold">1.90:1 Digital</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300 font-bold">TF.js ML Frame</span>
            </div>
          </ModeCard>
        </div>

        {/* CARD 3: Quick Resume Torn Ticket Shelf (col-span-12 lg:col-span-6) */}
        <div className="col-span-12 lg:col-span-6">
          <TicketDrawer />
        </div>

        {/* CARD 4: System Telemetry & Offline Status (col-span-12 sm:col-span-6 lg:col-span-3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-gradient-to-b from-[#110D1B] to-[#0A0712] border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>System Telemetry</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400">Network Mode</span>
                <span className={`font-semibold font-mono ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isOnline ? 'Online (Full)' : 'Offline (4:3 Crop)'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400">ML Accelerator</span>
                <span className="text-cyan-400 font-semibold font-mono">WebGL TF.js</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400">Feed Cache</span>
                <span className="text-purple-300 font-semibold font-mono">4h Auto-Sync</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400">Privacy</span>
                <span className="text-emerald-400 font-semibold font-mono">100% Local DB</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-between">
            <span>Zero-Trust Architecture</span>
            <span className="text-emerald-400">Verified</span>
          </div>
        </div>

        {/* CARD 5: Quick Settings & Experience Customizer (col-span-12 sm:col-span-6 lg:col-span-3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-gradient-to-b from-[#110D1B] to-[#0A0712] border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Cinema Quick Presets</span>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['1.43:1', '1.90:1', 'original'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setFrameAspectRatio(ratio as any)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      frameAspectRatio === ratio
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Web Audio DSP Toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Web Audio DSP</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setAudioEQ({ preset: 'original', surround3D: false, drcLoudness: false })}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    audioEQ.preset === 'original'
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setAudioEQ({ preset: 'spatial-3d', surround3D: true, drcLoudness: true })}
                  className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioEQ.preset === 'spatial-3d'
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>3D IMAX +18dB</span>
                </button>
              </div>
            </div>

            {/* Launch Preference Toggle */}
            <div className="pt-2 border-t border-white/5">
              <label className="text-[10px] text-gray-400 flex items-center justify-between">
                <span>Default Landing View</span>
                <button
                  onClick={() => {
                    const next = rootLandingPreference === 'ask' ? 'v1' : rootLandingPreference === 'v1' ? 'v2' : 'ask';
                    setRootLandingPreference(next);
                  }}
                  className="font-mono text-cyan-400 underline uppercase cursor-pointer"
                >
                  {rootLandingPreference === 'ask' ? 'Bento (Ask)' : rootLandingPreference === 'v1' ? 'U-TUBE' : 'CineMorph'}
                </button>
              </label>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 mt-2">
            Settings auto-saved to local client state.
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 z-10 pt-6 border-t border-white/5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-400">OmniStream Media Engine</span>
          <span>•</span>
          <span>Patnala Uday Kumar</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/settings')} className="hover:text-cyan-400 transition-colors cursor-pointer">
            Settings
          </button>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Client Storage Ready
          </span>
        </div>
      </footer>
    </div>
  );
}
```

### 5.2 `src/components/bento/ModeCard.tsx`
```tsx
import React, { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ModeCardProps {
  mode: 'utube' | 'cinemorph';
  badgeText: string;
  badgeIcon: ReactNode;
  title: string;
  tagline: string;
  actionText: string;
  onAction: () => void;
  children?: ReactNode;
}

export function ModeCard({
  mode,
  badgeText,
  badgeIcon,
  title,
  tagline,
  actionText,
  onAction,
  children
}: ModeCardProps) {
  const isUTube = mode === 'utube';

  return (
    <div
      onClick={onAction}
      className={`group relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden border ${
        isUTube
          ? 'bg-gradient-to-b from-[#14080B] via-[#0B0406] to-[#040203] border-white/10 hover:border-red-500/50 hover:shadow-[0_20px_50px_rgba(239,68,68,0.15)]'
          : 'bg-gradient-to-b from-[#08121A] via-[#040A10] to-[#020508] border-white/10 hover:border-cyan-500/50 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)]'
      } hover:-translate-y-1`}
    >
      {/* Corner Ambient Glow */}
      <div 
        className={`absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isUTube ? 'bg-red-600/15 group-hover:bg-red-600/25' : 'bg-cyan-500/15 group-hover:bg-cyan-500/25'
        }`}
      />

      <div className="space-y-4 relative z-10">
        {/* Top Badge & Header */}
        <div className="flex items-center justify-between gap-4">
          <div 
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              isUTube 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}
          >
            {badgeIcon}
            <span>{badgeText}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
              isUTube ? 'bg-red-600 text-white' : 'bg-cyan-500 text-black'
            }`}>
              {isUTube ? 'AD-FREE' : '3D IMAX'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
            {tagline}
          </p>
        </div>

        {/* Custom Card Slot */}
        <div onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-6 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className={`w-full py-3.5 px-5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            isUTube
              ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-red-600/30'
              : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-cyan-600/30'
          } group-hover:scale-[1.01]`}
        >
          <span>{actionText}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

---

### 5.3 `src/components/bento/TicketDrawer.tsx`
```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Play, Trash2, Clapperboard, Clock, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { formatTime } from '../../lib/utils';

export function TicketDrawer() {
  const navigate = useNavigate();
  const { 
    history, 
    localMediaHistory, 
    removeFromHistory, 
    removeLocalMediaFromHistory,
    setVersionMode,
    setActiveLocalMedia 
  } = useAppStore();

  const recentSessions = [
    ...Object.values(localMediaHistory).map(item => ({
      id: item.id,
      title: item.name,
      progress: item.progress || 0,
      duration: item.duration || 0,
      isLocal: true,
      lastWatchedAt: item.lastWatchedAt || 0,
      itemRef: item,
      aspectRatio: '1.43:1'
    })),
    ...Object.values(history).map(item => ({
      id: item.video.id,
      title: item.video.title,
      progress: item.progress || 0,
      duration: item.duration || 0,
      isLocal: false,
      lastWatchedAt: item.watchedAt || 0,
      thumbnail: item.video.thumbnails?.medium,
      aspectRatio: '1.90:1'
    }))
  ]
    .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
    .slice(0, 3);

  const handleResumeTicket = (session: typeof recentSessions[0]) => {
    if (session.isLocal) {
      setActiveLocalMedia(session.itemRef as any);
      setVersionMode('v2');
      navigate(`/theater/${session.id}`);
    } else {
      setVersionMode('v1');
      navigate(`/watch/${session.id}`);
    }
  };

  const handleDismissTicket = (e: React.MouseEvent, session: typeof recentSessions[0]) => {
    e.stopPropagation();
    if (session.isLocal) {
      removeLocalMediaFromHistory(session.id);
    } else {
      removeFromHistory(session.id);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#15101F] via-[#0E0B16] to-[#08060D] border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Torn Ticket Shelf (Quick Resume)
              </h3>
              <p className="text-[11px] text-gray-400">
                Diegetic ticket stubs from your active screenings.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/history')}
            className="text-xs text-amber-400/80 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2.5 my-2">
            <Clapperboard className="w-8 h-8 text-amber-500/40" />
            <div className="text-xs font-semibold text-gray-300">Box Office Empty</div>
            <p className="text-[11px] text-gray-500 max-w-xs">
              Screen a movie in CineMorph or play a video in U-TUBE to print your first admission ticket.
            </p>
          </div>
        ) : (
          <div className="space-y-3 my-2">
            {recentSessions.map((ticket) => {
              const progressPercent = ticket.duration > 0 ? Math.min(100, Math.round((ticket.progress / ticket.duration) * 100)) : 0;

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleResumeTicket(ticket)}
                  className="group relative bg-[#1E192B] hover:bg-[#252035] border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Play className="w-4 h-4 fill-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[220px]">
                          {ticket.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/20 uppercase">
                          {ticket.aspectRatio}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span>{formatTime(ticket.progress)} / {ticket.duration > 0 ? formatTime(ticket.duration) : '--:--'}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{progressPercent}% saved</span>
                      </div>
                      <div className="w-full h-1 bg-black/40 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDismissTicket(e, ticket)}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                    title="Tear & Remove Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] text-amber-400/60 font-mono flex items-center justify-between pt-2">
        <span>VIP SEAT ADMISSION</span>
        <span>1-CLICK RESUME READY</span>
      </div>
    </div>
  );
}
```

---

### 5.4 `src/app/App.tsx` (Unified Application Routing Shell)
```tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppStore } from '../store';
import { BentoGrid } from '../components/bento/BentoGrid';

const Home = lazy(() => import('../pages/Home').then(m => ({ default: m.Home })));
const Search = lazy(() => import('../pages/Search').then(m => ({ default: m.Search })));
const Watch = lazy(() => import('../pages/Watch').then(m => ({ default: m.Watch })));
const CineMorphLanding = lazy(() => import('../pages/CineMorphLanding').then(m => ({ default: m.CineMorphLanding })));
const CineMorphTheater = lazy(() => import('../pages/CineMorphTheater').then(m => ({ default: m.CineMorphTheater })));
const Subscriptions = lazy(() => import('../pages/Subscriptions').then(m => ({ default: m.Subscriptions })));
const Collections = lazy(() => import('../pages/Collections').then(m => ({ default: m.Collections })));
const History = lazy(() => import('../pages/History').then(m => ({ default: m.History })));
const SettingsPage = lazy(() => import('../pages/Settings').then(m => ({ default: m.SettingsPage })));
const ChannelPage = lazy(() => import('../pages/Channel').then(m => ({ default: m.ChannelPage })));

function RouteFallback() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      <div className="text-xs text-gray-400 tracking-wider uppercase font-mono">Loading Experience...</div>
    </div>
  );
}

function RootRouter() {
  const rootLandingPreference = useAppStore(s => s.rootLandingPreference);
  if (rootLandingPreference === 'v1') return <Home />;
  if (rootLandingPreference === 'v2') return <CineMorphLanding />;
  return <BentoGrid />;
}

function WatchRouter() {
  const versionMode = useAppStore(s => s.versionMode);
  return versionMode === 'v2' ? <CineMorphTheater /> : <Watch />;
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RootRouter />} />
          <Route path="/landing" element={<BentoGrid />} />
          <Route path="/gateway" element={<BentoGrid />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Home />} />
          <Route path="/cinemorph" element={<CineMorphLanding />} />
          <Route path="/theater/:id" element={<CineMorphTheater />} />
          <Route path="/search" element={<Search />} />
          <Route path="/shorts" element={<Home />} />
          <Route path="/watch/:id" element={<WatchRouter />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/channel/:id" element={<ChannelPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
```

---

## 6. Implementation Verification Matrix

| Verification Target | Expected Behavior | Verification Method |
|---------------------|-------------------|---------------------|
| **Bento Grid Layout** | 12-column grid collapses to 2-col on tablet and 1-col on mobile | Window resize in browser & Playwright viewport tests |
| **U-TUBE Launcher** | Typing a query navigates to `/search?q=...`; pasting URL navigates to `/watch/:id` | Automated unit tests & user interaction simulation |
| **CineMorph File Drop** | Dropping MP4 file adds item to history, sets active media, and navigates to `/theater/:id` | Drag-and-drop simulated event test |
| **Ticket Shelf Resumption** | Clicking torn ticket resumes exact video timestamp and switches appropriate player | LocalStorage inspection & timestamp verification |
| **Offline Telemetry** | Network toggle triggers `Offline (4:3 Crop Fallback)` banner and status indicator | `window.dispatchEvent(new Event('offline'))` |
| **Quick Presets** | Changing aspect ratio or audio DSP updates Zustand store state immediately | Store snapshot validation |
