import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  Sparkles, Play, Film, Search, Compass, FolderHeart, 
  Volume2, ShieldCheck, ArrowRight, Tv, HardDrive, 
  Sliders, Layers, Zap, CheckCircle2, ChevronRight
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
    <div className="min-h-screen w-full bg-[#040308] text-white flex flex-col p-4 sm:p-8 relative overflow-y-auto overflow-x-hidden hide-scrollbar font-sans">
      {/* Dynamic Ambient Space Background */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-br from-indigo-900/20 via-purple-900/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[700px] h-[600px] bg-gradient-to-tl from-cyan-900/20 via-blue-900/15 to-transparent rounded-full blur-[160px] pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-2 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <img src="/favicon.svg" alt="OmniStream Logo" className="w-6 h-6 drop-shadow" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white font-sans bg-gradient-to-r from-white via-cyan-100 to-purple-300 bg-clip-text text-transparent">
              Omni<span className="text-cyan-400">Stream</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Dual Media Ecosystem</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Private Client Architecture</span>
          </div>
        </div>
      </header>

      {/* Main Dual-Experience Showcase Portal */}
      <main className="w-full max-w-7xl mx-auto z-10 my-auto py-8">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Your Destination Experience</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Two Connected Worlds of <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              High-Performance Media
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Choose how you wish to explore: standard fast YouTube discovery or the immersive CineMorph virtual movie theater.
          </p>
        </div>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* ── CARD 1: U-TUBE V1 (PRIMARY DISCOVERY PLATFORM) ── */}
          <div 
            onClick={handleEnterV1}
            className="group relative bg-[#090810]/90 hover:bg-[#0f0d1a] border border-white/10 hover:border-red-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl hover:shadow-[0_20px_50px_rgba(239,68,68,0.15)] cursor-pointer overflow-hidden"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Title */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                    <Compass className="w-3 h-3" />
                    <span>Default Core Platform</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-red-400 transition-colors">
                    U-Tube <span className="text-gray-400 text-xl font-medium">V1</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Fast, familiar, feed-driven stream discovery with live subscriptions, collections, history, and instant zero-latency query routing.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-current" />
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Search className="w-3.5 h-3.5 text-red-400" />
                    <span>Instant Search</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Deterministic query intelligence & suggestions.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <FolderHeart className="w-3.5 h-3.5 text-red-400" />
                    <span>Custom Collections</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Offline-first local collection playlists.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Tv className="w-3.5 h-3.5 text-red-400" />
                    <span>Channel Hubs</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Channel videos, metadata & subscriptions.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Zap className="w-3.5 h-3.5 text-red-400" />
                    <span>Instant Auto-Play</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Single-click top result playback engine.</p>
                </div>
              </div>
            </div>

            {/* Bottom Action CTA */}
            <div className="pt-8 relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEnterV1(); }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 group-hover:scale-[1.02] transition-all"
              >
                <span>Enter U-Tube Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── CARD 2: CINEMORPH V2 (PREMIUM CINEMATIC THEATER) ── */}
          <div 
            onClick={handleEnterV2}
            className="group relative bg-[#070914]/90 hover:bg-[#0c1024] border border-white/10 hover:border-cyan-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl hover:shadow-[0_20px_50px_rgba(6,182,212,0.18)] cursor-pointer overflow-hidden"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Title */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>Advanced Cinema Hall</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-cyan-300 transition-colors">
                    CineMorph <span className="text-cyan-400 text-xl font-bold">AI V2</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Step inside an immersive 2.5D cinema hall with opening curtains, adaptive lighting bloom, neural audio DSP, and support for YouTube and Local Media.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                  <Film className="w-7 h-7" />
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2.5D Theater Seating</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Curtain sequence & realistic cinema room.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Personal Local Media</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Zero-upload private local video theater.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Spatial Audio DSP</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Dialogue boost, 3D surround & DRC equalizer.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>21:9 UltraWide Cinema</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Smart saliency reframe & 6 visual themes.</p>
                </div>
              </div>
            </div>

            {/* Bottom Action CTA */}
            <div className="pt-8 relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEnterV2(); }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 group-hover:scale-[1.02] transition-all"
              >
                <span>Enter CineMorph AI Cinema</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Preference Selector */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-gray-200 select-none">
            <input 
              type="checkbox" 
              checked={rememberChoice} 
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-black/50 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Remember my destination preference (You can always switch anytime in the top bar)</span>
          </label>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 z-10 pt-4 border-t border-white/5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>OmniStream Media Engine v2.0.0</span>
          <span>•</span>
          <span>© Patnala Uday Kumar</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setVersionMode('v1'); navigate('/settings'); }}
            className="hover:text-gray-300 transition-colors"
          >
            Settings
          </button>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Online & Ready
          </span>
        </div>
      </footer>
    </div>
  );
}
