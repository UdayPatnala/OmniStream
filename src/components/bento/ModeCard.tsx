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
  History
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
        className={`relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md flex flex-col justify-between cursor-pointer group ${className}`}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm border border-red-100">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 group-hover:text-red-600 transition-colors">U-TUBE</h2>
                <p className="text-xs text-gray-500 font-medium">Ad-Free Video Discovery & Playback</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 pt-2 pb-4">
            A clean, familiar, modern video platform experience. Discover recommended content, search videos instantly, and watch without interruptions.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700 border border-gray-200">
              <Zap className="h-3.5 w-3.5 text-red-500" />
              <span>Zero Ads</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700 border border-gray-200">
              <History className="h-3.5 w-3.5 text-red-500" />
              <span>Local History</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700 border border-gray-200">
              <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
              <span>Private Subs</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] font-mono text-gray-500">DISCOVER & WATCH</span>
          <div className="flex items-center gap-1 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white group-hover:bg-red-700 transition-colors shadow-sm">
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
      className={`relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-7 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-md flex flex-col justify-between cursor-pointer group ${className}`}
    >
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-amber-100 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-sm">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-gray-900 group-hover:text-amber-600 transition-colors">CineMorph</h2>
              </div>
              <p className="text-xs text-gray-500 font-medium">Immersive 3D Theatrical Environment</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 pt-2 pb-4 leading-relaxed">
          Project your local files or online links into a stunning 3D WebGL theater. Featuring real-time ML-driven dynamic framing and vintage cinematic acoustics.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              useCineMorphStore.getState().setAspectRatio('1.43:1');
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[11px] text-gray-700 border border-amber-200 transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5 text-amber-500" />
            <span>1.43 IMAX</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              useCineMorphStore.getState().setAspectRatio('1.90:1');
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[11px] text-gray-700 border border-amber-200 transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5 text-amber-500" />
            <span>1.90 IMAX</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              useCineMorphStore.getState().setAspectRatio('original');
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[11px] text-gray-700 border border-amber-200 transition-colors cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-amber-500" />
            <span>Original</span>
          </button>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] text-gray-700 border border-amber-100">
            <Cpu className="h-3.5 w-3.5 text-amber-500" />
            <span>ML Framing</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-mono text-gray-500">LOCAL & ONLINE MEDIA</span>
        <div className="flex items-center gap-1 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white group-hover:bg-amber-600 transition-colors shadow-sm">
          <span>Enter CineMorph</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
