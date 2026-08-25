import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wifi,
  WifiOff,
  Film,
  Play,
  Database,
  Cpu,
  Layers,
  Volume2,
  Tv,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  ShieldCheck,
  Zap,
  Sliders,
  HardDrive,
  Ticket,
  Maximize2,
  Clock,
  Compass,
} from 'lucide-react';
import { ModeCard } from './ModeCard';
import { TicketDrawer } from './TicketDrawer';
import { useCineMorphStore } from '../../state/useCineMorphStore';
import { useUTubeStore } from '../../state/useUTubeStore';
import { useAppStore } from '../../store';

export const BentoGrid: React.FC = () => {
  const navigate = useNavigate();
  const { isOffline, setOfflineStatus } = useCineMorphStore();
  const { refreshFeedIfNeeded } = useUTubeStore();
  const { 
    rootLandingPreference, 
    setRootLandingPreference, 
    setVersionMode 
  } = useAppStore();

  const [onlineState, setOnlineState] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    // Initial feed refresh if 4h cache expired
    refreshFeedIfNeeded();

    const handleOnline = () => {
      setOnlineState(true);
      setOfflineStatus(false);
    };
    const handleOffline = () => {
      setOnlineState(false);
      setOfflineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshFeedIfNeeded, setOfflineStatus]);

  const effectiveOffline = !onlineState || isOffline;

  const handleLaunchV1 = () => {
    if (rememberChoice) {
      setRootLandingPreference('v1');
    }
    setVersionMode('v1');
    navigate('/home');
  };

  const handleLaunchV2 = () => {
    if (rememberChoice) {
      setRootLandingPreference('v2');
    }
    setVersionMode('v2');
    navigate('/cinemorph');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 p-4 sm:p-6 lg:p-10 space-y-8 select-none font-sans">
      {/* Offline Status Warning Banner */}
      {effectiveOffline && (
        <div className="max-w-7xl mx-auto flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Air-Gapped / Offline Playback Active</div>
              <p className="text-xs text-amber-700 font-mono">
                Operating in deterministic 4:3 cropped mode with full local media playback support.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOfflineStatus(false)}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer shadow-sm"
          >
            Force Online Sync
          </button>
        </div>
      )}

      {/* Top Header & Brand Bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 p-1 shadow-md group">
            <img
              src="/omn_logo.jpg"
              alt="OMS Core Logo"
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-sans">
                OMNISTREAM
              </h1>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 tracking-wider uppercase">
                Dual Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Personal Media Gateway • Lightweight U-Tube Discovery & Fixed-Aperture CineMorph Cinema
            </p>
          </div>
        </div>

        {/* Action Controls & Connectivity Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-mono border border-slate-200 shadow-sm">
            {effectiveOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-600 font-bold">Offline (4:3)</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-700 font-bold">Synced Live</span>
              </>
            )}
          </div>

          <button
            onClick={handleLaunchV1}
            className="flex items-center gap-2 rounded-xl bg-white hover:bg-red-50 px-4 py-2 text-xs font-bold text-slate-800 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all cursor-pointer shadow-sm group"
          >
            <Play className="h-3.5 w-3.5 fill-red-500 text-red-500 group-hover:scale-110 transition-transform" />
            <span>Launch U-Tube</span>
          </button>

          <button
            onClick={handleLaunchV2}
            className="flex items-center gap-2 rounded-xl bg-white hover:bg-amber-50 px-4 py-2 text-xs font-bold text-slate-800 hover:text-amber-700 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-sm group"
          >
            <Film className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>Enter CineMorph</span>
          </button>
        </div>
      </header>

      {/* Hero Presentation Showcase */}
      <section className="max-w-7xl mx-auto text-center space-y-3 pt-2 pb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Select Your Viewing Experience</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Two Distinct Engines. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-red-600 via-purple-600 to-amber-600 bg-clip-text text-transparent">
            One Unified Media Platform.
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Switch freely between distraction-free YouTube search discovery and an authentic fixed-aperture cinema experience tailored for local video files.
        </p>
      </section>

      {/* Primary Bento 12-Column Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Bento: U-TUBE (6 Columns) */}
        <ModeCard mode="utube" className="lg:col-span-6 min-h-[460px]" />

        {/* Right Bento: CineMorph (6 Columns) */}
        <ModeCard mode="cinemorph" className="lg:col-span-6 min-h-[460px]" />

        {/* Spanned Bento: Torn Admission Tickets Shelf (8 Columns) */}
        <div className="lg:col-span-8">
          <TicketDrawer />
        </div>

        {/* System Architecture & Privacy Highlights (4 Columns) */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Cpu className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  OMS Engine Architecture
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Client-Side
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Advanced Framing Geometry</div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    Real-time smart reframing (Rule of Thirds, Leading Lines, Frame in Frame).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Thermal Ticket Dispenser</div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    7-Stage progressive paper extrusion with Web Audio stepper motor sound.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Web Audio DSP Spatialization</div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    5-Band EQ presets, dialogue booster (+20dB), and spatial room dynamics.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Dual-Tier Persistence & Auto-Repair</div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    LocalStorage stubs with IndexedDB blob and corrupt JSON auto-recovery.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Zero Cloud Dependencies
            </span>
            <span className="text-emerald-700 font-bold">100% PRIVATE</span>
          </div>
        </div>
      </main>

      {/* Destination Preference Bar */}
      <section className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-3 pt-4">
        {rootLandingPreference !== 'ask' && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 shadow-sm">
            <span>Saved Default Gateway: <strong className="text-slate-900 uppercase font-bold">{rootLandingPreference === 'v1' ? 'U-Tube' : 'CineMorph'}</strong></span>
            <button 
              onClick={() => setRootLandingPreference('ask')}
              className="ml-2 font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
            >
              Reset to Bento
            </button>
          </div>
        )}

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 hover:text-slate-900 select-none bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm transition-all">
          <input 
            type="checkbox" 
            checked={rememberChoice} 
            onChange={(e) => setRememberChoice(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 bg-slate-50 text-slate-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Remember my engine choice (can be changed anytime in Settings)</span>
        </label>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Dual Media Architecture Engine v2.0.0</span>
          <span>•</span>
          <span>© Patnala Uday Kumar</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setVersionMode('v1'); navigate('/settings'); }}
            className="hover:text-slate-900 transition-colors cursor-pointer font-medium"
          >
            Settings
          </button>
          <span>•</span>
          <button 
            onClick={() => { setVersionMode('v1'); navigate('/home'); }}
            className="hover:text-red-600 transition-colors cursor-pointer font-medium"
          >
            U-Tube Feed
          </button>
          <span>•</span>
          <button 
            onClick={() => { setVersionMode('v2'); navigate('/cinemorph'); }}
            className="hover:text-amber-700 transition-colors cursor-pointer font-medium"
          >
            CineMorph Theater
          </button>
        </div>
      </footer>
    </div>
  );
};
