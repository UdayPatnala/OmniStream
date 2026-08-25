import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Film,
  Maximize2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Zap,
  History,
  Search,
  Ticket,
  Volume2
} from 'lucide-react';
import { useCineMorphStore } from '../../state/useCineMorphStore';

interface ModeCardProps {
  mode: 'utube' | 'cinemorph';
  className?: string;
}

export const ModeCard: React.FC<ModeCardProps> = ({ mode, className = '' }) => {
  const navigate = useNavigate();

  // U-TUBE Card
  if (mode === 'utube') {
    return (
      <div 
        onClick={() => navigate('/home')}
        className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-xl flex flex-col justify-between cursor-pointer group ${className}`}
      >
        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm border border-red-100 group-hover:scale-105 transition-transform">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">U-TUBE</h2>
                <p className="text-xs text-slate-500 font-medium">Ad-Free Video Discovery & Clean Playback</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-mono font-bold uppercase border border-red-200">
              Web Stream
            </span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            A fast, familiar, and distraction-free YouTube experience. Discover recommended content, search videos instantly, and watch with zero ads or tracking interruptions.
          </p>

          {/* Interactive Mini UI Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-red-500" />
                Live Feed & Top-3 Search Engine
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                4h Auto-Cache
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-video rounded-lg bg-slate-200 overflow-hidden relative border border-slate-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                  <span className="text-[8px] font-mono font-bold text-white">4K Stream</span>
                </div>
              </div>
              <div className="aspect-video rounded-lg bg-slate-200 overflow-hidden relative border border-slate-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                  <span className="text-[8px] font-mono font-bold text-white">Subscribed</span>
                </div>
              </div>
              <div className="aspect-video rounded-lg bg-slate-200 overflow-hidden relative border border-slate-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                  <span className="text-[8px] font-mono font-bold text-white">Keyword</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 border border-slate-200">
              <Zap className="h-3.5 w-3.5 text-red-500" />
              <span>Zero Ads</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 border border-slate-200">
              <History className="h-3.5 w-3.5 text-red-500" />
              <span>Local History</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
              <span>Private Subs</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">DISCOVER & WATCH</span>
          <div className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white group-hover:bg-red-700 transition-colors shadow-sm">
            <span>Enter U-TUBE</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    );
  }

  // CineMorph Card
  return (
    <div
      onClick={() => navigate('/cinemorph')}
      className={`relative overflow-hidden rounded-3xl border border-amber-200 bg-[#FDFBF7] p-7 sm:p-8 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-xl flex flex-col justify-between cursor-pointer group ${className}`}
    >
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shadow-sm group-hover:scale-105 transition-transform">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors">CineMorph</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">Immersive 3D Theatrical Environment</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase border border-amber-300">
            Local & Web
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Project your local files or online links into a fixed-aperture cinema. Featuring real-time ML-driven dynamic framing, thermal ticket printing, and vintage spatial acoustics.
        </p>

        {/* Interactive Aspect Ratio Controls */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-amber-700" />
              Fixed Aperture Geometry
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Auto-Frame
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useCineMorphStore.getState().setAspectRatio('1.43:1');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-900 border border-amber-300 transition-colors cursor-pointer shadow-sm"
            >
              <Maximize2 className="h-3.5 w-3.5 text-amber-700" />
              <span>1.43 IMAX</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useCineMorphStore.getState().setAspectRatio('1.90:1');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-900 border border-amber-300 transition-colors cursor-pointer shadow-sm"
            >
              <Maximize2 className="h-3.5 w-3.5 text-amber-700" />
              <span>1.90 IMAX</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useCineMorphStore.getState().setAspectRatio('original');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-900 border border-amber-300 transition-colors cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-amber-700" />
              <span>Original</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-100/60 px-2.5 py-1 text-[11px] text-amber-900 border border-amber-200">
            <Cpu className="h-3.5 w-3.5 text-amber-700" />
            <span>ML Smart Framing</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-100/60 px-2.5 py-1 text-[11px] text-amber-900 border border-amber-200">
            <Ticket className="h-3.5 w-3.5 text-amber-700" />
            <span>Thermal Tickets</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-100/60 px-2.5 py-1 text-[11px] text-amber-900 border border-amber-200">
            <Volume2 className="h-3.5 w-3.5 text-amber-700" />
            <span>Web Audio DSP</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 mt-6 border-t border-amber-200/60 flex items-center justify-between">
        <span className="text-[11px] font-mono text-amber-800">LOCAL & ONLINE MEDIA</span>
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-bold text-white group-hover:bg-amber-800 transition-colors shadow-sm">
          <span>Enter CineMorph</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
