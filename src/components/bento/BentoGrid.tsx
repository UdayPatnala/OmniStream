import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wifi,
  WifiOff,
  Film,
  Play,
  Cpu,
  Layers,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Ticket,
  Maximize2,
  Clock,
  Compass,
  Search,
  Radio,
  Tv,
  Disc,
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
  const [activeTabPreview, setActiveTabPreview] = useState<'all' | 'utube' | 'cinemorph'>('all');

  useEffect(() => {
    // Refresh feed if 4h cache expired
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
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 select-none antialiased relative overflow-hidden">
      {/* ── Background Editorial Ambient Grid & Radial Gradients ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-red-500/5 via-amber-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-amber-500/8 via-cyan-500/5 to-transparent rounded-full blur-[160px] pointer-events-none" />

      {/* ── Offline Banner Alert ── */}
      {effectiveOffline && (
        <div className="relative z-30 bg-amber-50 border-b border-amber-200 px-6 py-3 text-amber-900 shadow-sm flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <WifiOff className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold font-mono uppercase tracking-wider">Airgapped Mode: </span>
                <span className="text-xs font-medium text-amber-800">Deterministic 4:3 fixed crop fallback enabled for local playback.</span>
              </div>
            </div>
            <button
              onClick={() => setOfflineStatus(false)}
              className="px-3.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Force Sync
            </button>
          </div>
        </div>
      )}

      {/* ── Top Floating Glass Navigation Header ── */}
      <header className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 p-1 shadow-md group">
              <img
                src="/omn_logo.jpg"
                alt="OMS Intelligence Core"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" title="OMS Core Active" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-cinematic-title uppercase">
                  OMNISTREAM
                </h1>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 tracking-widest uppercase">
                  v2.0 MASTER
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium font-cinematic">
                Universal Dual-Engine Media Experience Platform
              </p>
            </div>
          </div>

          {/* Quick Engine Jump Badges & Connectivity Indicator */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-mono border border-slate-200 text-slate-600">
              {effectiveOffline ? (
                <>
                  <WifiOff className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-700 font-bold">Offline (4:3)</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-bold">Synced Live</span>
                </>
              )}
            </div>

            <button
              onClick={handleLaunchV1}
              className="flex items-center gap-2 rounded-full bg-white hover:bg-red-50 px-4 py-2 text-xs font-bold text-slate-800 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all cursor-pointer shadow-sm group"
            >
              <Play className="h-3.5 w-3.5 fill-red-500 text-red-500 group-hover:scale-110 transition-transform" />
              <span>Enter U-TUBE</span>
            </button>

            <button
              onClick={handleLaunchV2}
              className="flex items-center gap-2 rounded-full bg-white hover:bg-amber-50 px-4 py-2 text-xs font-bold text-slate-800 hover:text-amber-800 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-sm group"
            >
              <Film className="h-3.5 w-3.5 text-amber-700 group-hover:scale-110 transition-transform" />
              <span className="font-cinematic">Enter CineMorph</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Grand Monumental Hero Banner ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>The Dual Realm of Stream & Cinema</span>
        </div>

        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] font-cinematic-title uppercase">
          Two Distinct Engines. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-800 bg-clip-text text-transparent">
            One Master Experience.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-cinematic">
          Choose between lightweight, ad-free YouTube discovery and an immersive fixed-aperture theater with client-side ML framing and thermal tickets.
        </p>
      </section>

      {/* ── Main Dual-Portal 12-Column Bento Layout ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        {/* Dual Mode Cards (6 Columns U-Tube + 6 Columns CineMorph) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <ModeCard mode="utube" className="lg:col-span-6 min-h-[480px]" />
          <ModeCard mode="cinemorph" className="lg:col-span-6 min-h-[480px]" />
        </div>

        {/* Admission Shelf & State Recovery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <TicketDrawer />
          </div>

          {/* Living Architecture Matrix Highlight */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-cinematic-title">
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
                    <div className="text-xs font-bold text-slate-800">13-Stage Modular Smart Framing</div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Real-time scene cut detection, motion vectors, and Source Composition Protection (Δ ≥ 0.15).
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Thermal Ticket Dispenser</div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      7-Stage progressive paper extrusion acting as ML frame warmup with Web Audio acoustics.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Web Audio DSP Spatial Acoustics</div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      5-Band parametric EQ, +20dB dialogue booster, and spatial binaural room convolution.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Inward Concave Curved Cinema Screen</div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Shallow inward cylindrical projection screen in Original Mode with zero video distortion.
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
        </div>

        {/* Destination Engine Preference Switcher */}
        <section className="flex flex-col items-center justify-center gap-3 pt-2">
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
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/70 backdrop-blur-md py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 font-cinematic">Master Release v2.0.0</span>
            <span>•</span>
            <span className="font-cinematic">© Patnala Uday Kumar</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <button 
              onClick={() => { setVersionMode('v1'); navigate('/settings'); }}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Settings
            </button>
            <span>•</span>
            <button 
              onClick={() => { setVersionMode('v1'); navigate('/home'); }}
              className="hover:text-red-600 transition-colors cursor-pointer"
            >
              U-Tube Feed
            </button>
            <span>•</span>
            <button 
              onClick={() => { setVersionMode('v2'); navigate('/cinemorph'); }}
              className="hover:text-amber-800 transition-colors cursor-pointer font-cinematic"
            >
              CineMorph Theater
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
