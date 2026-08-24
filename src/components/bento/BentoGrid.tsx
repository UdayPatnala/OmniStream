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
} from 'lucide-react';
import { ModeCard } from './ModeCard';
import { TicketDrawer } from './TicketDrawer';
import { useCineMorphStore } from '../../state/useCineMorphStore';
import { useUTubeStore } from '../../state/useUTubeStore';

export const BentoGrid: React.FC = () => {
  const navigate = useNavigate();
  const { isOffline, setOfflineStatus } = useCineMorphStore();
  const { refreshFeedIfNeeded } = useUTubeStore();
  const [onlineState, setOnlineState] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Offline Status Warning Banner */}
      {effectiveOffline && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Offline Fallback Mode Active</div>
              <p className="text-xs text-amber-600 font-mono">
                Playback locked to 4:3 cropped aspect ratio. Client-side ML framing suspended.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOfflineStatus(false)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 cursor-pointer"
          >
            Force Reconnect
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-200 p-1 shadow-md">
              <img
                src="/omn_logo.jpg"
                alt="OMS Intelligence System"
                className="w-full h-full object-cover rounded-xl animate-oms-core"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
                OMNISTREAM
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200 tracking-wider">
                  OMS CORE
                </span>
              </h1>
              <p className="text-xs text-gray-500 font-mono">
                The Dual-Mode Multimedia Gateway • Ad-Free YouTube & 3D Theatrical Cinema
              </p>
            </div>
          </div>
        </div>

        {/* Engine Status Indicators */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-mono border border-gray-200 shadow-sm">
            {effectiveOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-600">Offline (4:3 Fallback)</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600">Online Synced</span>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 transition-all cursor-pointer shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-red-500" />
            <span>U-TUBE Feed</span>
          </button>

          <button
            onClick={() => navigate('/cinemorph')}
            className="flex items-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200 transition-all cursor-pointer shadow-sm"
          >
            <Film className="h-3.5 w-3.5" />
            <span>CineMorph 3D</span>
          </button>
        </div>
      </div>

      {/* Primary Bento 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Bento: U-TUBE (6 Columns) */}
        <ModeCard mode="utube" className="lg:col-span-6 min-h-[440px]" />

        {/* Right Bento: CineMorph (6 Columns) */}
        <ModeCard mode="cinemorph" className="lg:col-span-6 min-h-[440px]" />

        {/* Full-Width / Spanned Bento: Torn Admission Tickets Shelf (8 Columns) */}
        <div className="lg:col-span-8">
          <TicketDrawer />
        </div>

        {/* System Architecture & Feature Matrix Card (4 Columns) */}
        <div className="lg:col-span-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-cyan-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Engine Architecture
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 pt-3">
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-700">Advanced Framing Geometry</div>
                  <div className="text-[11px] text-gray-400">
                    Client-side ML framing rules (Rule of Thirds, Leading Lines, Frame in Frame).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-700">Three.js 3D Curvature Screen</div>
                  <div className="text-[11px] text-gray-400">
                    Real-time WebGL theater rendering with velvet curtains & seats.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-700">Dual-Tier Persistence</div>
                  <div className="text-[11px] text-gray-400">
                    LocalStorage stubs with IndexedDB blob and corrupt JSON auto-repair.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-700">10s Ticket Printing Ritual</div>
                  <div className="text-[11px] text-gray-400">
                    Web Audio mechanical SFX & heads-up frame pre-processing.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>CLIENT PERSISTENCE</span>
            <span className="text-emerald-500 font-bold">100% LOCAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
