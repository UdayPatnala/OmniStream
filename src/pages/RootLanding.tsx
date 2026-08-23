import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Sparkles, Play, Film, Search, Compass, FolderHeart, 
  Volume2, ShieldCheck, ArrowRight, Tv, HardDrive, 
  Sliders, Layers, Zap, CheckCircle2, ChevronRight, Activity, Radio, Cpu
} from 'lucide-react';

export function RootLanding() {
  const navigate = useNavigate();
  const { 
    setVersionMode, 
    rootLandingPreference, 
    setRootLandingPreference 
  } = useAppStore();

  const [rememberChoice, setRememberChoice] = useState(false);

  const handleEnterV1 = () => {
    if (rememberChoice) {
      setRootLandingPreference('v1');
    }
    setVersionMode('v1');
    navigate('/home');
  };

  const handleEnterV2 = () => {
    if (rememberChoice) {
      setRootLandingPreference('v2');
    }
    setVersionMode('v2');
    navigate('/cinemorph');
  };

  return (
    <div className="min-h-screen w-full bg-[#030206] text-white flex flex-col p-4 sm:p-8 md:p-12 relative overflow-y-auto overflow-x-hidden hide-scrollbar font-sans">
      {/* ── Dynamic Ambient Space Glow Orbs ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-900/25 via-purple-900/15 to-transparent rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-cyan-900/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[600px] bg-pink-900/15 rounded-full blur-[180px] pointer-events-none" />

      {/* ── Top Brand Bar ── */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 py-3 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-2.5 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20 border border-white/20">
            <img src="/favicon.svg" alt="OmniStream Logo" className="w-6 h-6 drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white font-sans bg-gradient-to-r from-white via-cyan-100 to-purple-300 bg-clip-text text-transparent">
              Omni<span className="text-cyan-400">Stream</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400/90 font-mono">
              Dual Media Architecture v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 shadow-lg shadow-emerald-950/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Zero-Trust Private Client</span>
          </div>
        </div>
      </header>

      {/* ── Main Dual-Experience Showcase Portal ── */}
      <main className="w-full max-w-7xl mx-auto z-10 my-auto py-10 space-y-12">
        {/* Hero Tagline */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-widest uppercase shadow-2xl backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Select Your Media Experience</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08]">
            Two Worlds of <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-200 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
              Next-Gen Cinema & Streaming
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Experience ultra-fast YouTube stream discovery or step inside a 2.5D IMAX virtual theater hall with live audio DSP and spatial lighting.
          </p>
        </div>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* ── CARD 1: U-TUBE V1 (PRIMARY DISCOVERY PLATFORM) ── */}
          <div 
            onClick={handleEnterV1}
            className="group relative bg-gradient-to-b from-[#0e0915] via-[#090610] to-[#040308] border border-white/10 hover:border-red-500/60 rounded-3xl p-6 sm:p-9 flex flex-col justify-between transition-all duration-500 shadow-2xl hover:shadow-[0_25px_60px_rgba(239,68,68,0.22)] cursor-pointer overflow-hidden transform hover:-translate-y-1"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/15 rounded-full blur-3xl group-hover:bg-red-600/25 transition-all pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Title */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Core Discovery Platform</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white group-hover:text-red-400 transition-colors">
                    U-Tube <span className="text-gray-400 text-2xl font-semibold">V1</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Lightning-fast feed discovery, live search results grid, subscriptions, collections, history, and single-click stream routing.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600/30 to-rose-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform shadow-xl shadow-red-600/20">
                  <Play className="w-8 h-8 fill-current" />
                </div>
              </div>

              {/* Visual Card Preview Bar */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 relative overflow-hidden group-hover:border-red-500/30 transition-colors">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-red-400" />
                    YouTube Search & Feed Hub
                  </span>
                  <span className="text-[10px] text-red-400 uppercase tracking-widest font-mono">Live Search Results</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-red-600 to-rose-400 rounded-full" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>Exact Match Verification</span>
                  <span>Click Card ➔ Direct Watch</span>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-red-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Search className="w-3.5 h-3.5 text-red-400" />
                    <span>YouTube Search Grid</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Search results page with click-to-play cards.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-red-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <FolderHeart className="w-3.5 h-3.5 text-red-400" />
                    <span>Custom Collections</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Offline-first local playlist manager.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-red-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Tv className="w-3.5 h-3.5 text-red-400" />
                    <span>Channel Subscriptions</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Channel videos, metadata & sub hubs.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-red-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Zap className="w-3.5 h-3.5 text-red-400" />
                    <span>0ms Search Cache</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Single-flight deduplicated query engine.</p>
                </div>
              </div>
            </div>

            {/* Bottom Action CTA */}
            <div className="pt-8 relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEnterV1(); }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 group-hover:scale-[1.02] transition-all cursor-pointer"
              >
                <span>Enter U-Tube Workspace</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* ── CARD 2: CINEMORPH V2 (PREMIUM CINEMATIC THEATER) ── */}
          <div 
            onClick={handleEnterV2}
            className="group relative bg-gradient-to-b from-[#060c18] via-[#040812] to-[#020308] border border-white/10 hover:border-cyan-500/60 rounded-3xl p-6 sm:p-9 flex flex-col justify-between transition-all duration-500 shadow-2xl hover:shadow-[0_25px_60px_rgba(6,182,212,0.22)] cursor-pointer overflow-hidden transform hover:-translate-y-1"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl group-hover:bg-cyan-500/25 transition-all pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Title */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2.5D Virtual Theater</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white group-hover:text-cyan-300 transition-colors">
                    CineMorph <span className="text-cyan-400 text-2xl font-bold">AI V2</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Step inside a 2.5D IMAX virtual cinema hall with adaptive Ambilight bloom, Web Audio DSP (+20dB EQ), 4.3:1 ratio, and local media playback.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 group-hover:scale-110 transition-transform shadow-xl shadow-cyan-500/20">
                  <Film className="w-8 h-8" />
                </div>
              </div>

              {/* Visual Card Preview Bar */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 relative overflow-hidden group-hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    IMAX 4.3:1 Cinema Hall
                  </span>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">+18dB Audio DSP</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-cyan-500 via-indigo-400 to-purple-500 rounded-full animate-pulse" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>Full Screen Hall</span>
                  <span>YouTube & Local Files</span>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-cyan-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>IMAX 4.3:1 Cinema Screen</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Wall-to-wall curved screen & low lighting.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-cyan-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Universal Local Media</span>
                  </div>
                  <p className="text-[11px] text-gray-400">MP4, MKV, MOV, TS, MP3, WAV & all formats.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-cyan-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Web Audio Equalizer</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Dialogue boost, 3D surround & DRC loudness.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 group-hover:border-cyan-500/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tracks Selector Drawer</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Video 1080p, Audio dubs & Subtitles CC.</p>
                </div>
              </div>
            </div>

            {/* Bottom Action CTA */}
            <div className="pt-8 relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEnterV2(); }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 group-hover:scale-[1.02] transition-all cursor-pointer"
              >
                <span>Enter CineMorph AI Cinema</span>
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Preference Selector Checkbox & Reset Button */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          {rootLandingPreference !== 'ask' && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300">
              <span>Saved Root Preference: <strong className="text-white uppercase">{rootLandingPreference === 'v1' ? 'U-Tube V1' : 'CineMorph V2'}</strong></span>
              <button 
                onClick={() => setRootLandingPreference('ask')}
                className="ml-2 underline font-bold text-red-400 hover:text-red-300 cursor-pointer"
              >
                Reset Default
              </button>
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-400 hover:text-gray-200 select-none bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <input 
              type="checkbox" 
              checked={rememberChoice} 
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-black/50 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Remember destination preference (switch anytime in top navigation bar)</span>
          </label>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 z-10 pt-6 border-t border-white/5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-400">OmniStream Media Engine v2.0.0</span>
          <span>•</span>
          <span>© Patnala Uday Kumar</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setVersionMode('v1'); navigate('/settings'); }}
            className="hover:text-cyan-400 transition-colors"
          >
            Settings
          </button>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All Media Systems Live
          </span>
        </div>
      </footer>
    </div>
  );
}
