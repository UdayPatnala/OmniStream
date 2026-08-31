import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Film,
  Maximize2,
  ArrowRight,
  ShieldCheck,
  Zap,
  History,
  Search,
  Ticket,
  HardDrive,
  Tv,
  Sparkles
} from 'lucide-react';
import { useCineMorphStore } from '../../state/useCineMorphStore';
import { useAppStore } from '../../store';
import { useTicketStore } from '../../state/useTicketStore';

interface ModeCardProps {
  mode: 'utube' | 'cinemorph';
  className?: string;
}

export const ModeCard: React.FC<ModeCardProps> = ({ mode, className = '' }) => {
  const navigate = useNavigate();
  const { aspectRatio, setAspectRatio } = useCineMorphStore();
  const { history, subscriptions, setVersionMode, setFrameAspectRatio } = useAppStore();
  const { tickets } = useTicketStore();
  const [quickQuery, setQuickQuery] = useState('');

  const historyCount = Object.keys(history).length;
  const subsCount = subscriptions.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    setVersionMode('v1');
    navigate(`/search?q=${encodeURIComponent(quickQuery.trim())}`);
  };

  // ── U-TUBE Discovery Workstation Portal ──
  if (mode === 'utube') {
    return (
      <div 
        className={`relative overflow-hidden rounded-3xl border border-utube-border bg-utube-card p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-utube-primary/50 hover:shadow-lg flex flex-col justify-between group ${className}`}
      >
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-utube-surface text-utube-primary border border-utube-border shadow-sm group-hover:scale-105 transition-transform">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-utube-text group-hover:text-utube-primary transition-colors font-cinematic-title">
                  U-TUBE
                </h2>
                <p className="text-xs text-utube-text-muted font-medium">Ad-Free Stream Discovery & Watchlist</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-utube-surface text-utube-primary text-[10px] font-mono font-bold uppercase border border-utube-border">
              Stream Engine
            </span>
          </div>

          {/* Direct Live Search Bar Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-utube-text-muted" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Search ad-free streams or jump to topic..."
              className="w-full h-11 pl-10 pr-24 rounded-2xl border border-utube-border bg-utube-surface text-xs text-utube-text placeholder-utube-text-muted focus:outline-none focus:border-utube-primary transition-all shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-utube-primary hover:opacity-90 text-white text-[11px] font-bold transition-all cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick Telemetry & Status Badges */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-2xl bg-utube-surface border border-utube-border text-center">
              <div className="text-sm font-black text-utube-text">{historyCount}</div>
              <div className="text-[10px] font-medium text-utube-text-muted">History Videos</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-utube-surface border border-utube-border text-center">
              <div className="text-sm font-black text-utube-text">{subsCount}</div>
              <div className="text-[10px] font-medium text-utube-text-muted">Subscriptions</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-utube-surface border border-utube-border text-center">
              <div className="text-sm font-black text-emerald-600">Zero</div>
              <div className="text-[10px] font-medium text-utube-text-muted">Ads & Trackers</div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="relative z-10 pt-6 mt-6 border-t border-utube-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-utube-text-muted font-mono">
            <span className="w-2 h-2 rounded-full bg-utube-primary" />
            <span>Fast Cache Feed</span>
          </div>

          <button
            onClick={() => {
              setVersionMode('v1');
              navigate('/home');
            }}
            className="flex items-center gap-2 rounded-2xl bg-utube-primary hover:opacity-95 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Launch U-Tube</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── CINEMORPH Fixed-Aperture Theater Portal ──
  return (
    <div 
      className={`relative overflow-hidden rounded-3xl border border-cinemorph-border bg-cinemorph-card p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-cinemorph-primary/50 hover:shadow-lg flex flex-col justify-between group ${className}`}
    >
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cinemorph-surface text-cinemorph-primary border border-cinemorph-border shadow-sm group-hover:scale-105 transition-transform">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-cinemorph-text group-hover:text-cinemorph-primary transition-colors font-cinematic-title">
                CINEMORPH
              </h2>
              <p className="text-xs text-cinemorph-text-muted font-medium font-cinematic">
                Fixed-Aperture Virtual Theater Experience
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cinemorph-surface text-cinemorph-primary text-[10px] font-mono font-bold uppercase border border-cinemorph-border">
            IMAX Engine
          </span>
        </div>

        {/* Viewport Aspect Ratio Selector */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-cinemorph-text-muted uppercase tracking-wider">
            Select Aperture Format
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1.43:1', label: 'True IMAX (1.43:1)' },
              { id: '1.90:1', label: 'IMAX (1.90:1)' },
              { id: 'original', label: 'Directorial Original' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => {
                  setAspectRatio(r.id as any);
                  setFrameAspectRatio(r.id as any);
                }}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                  aspectRatio === r.id
                    ? 'bg-cinemorph-surface border-cinemorph-primary text-cinemorph-primary shadow-sm ring-1 ring-cinemorph-primary'
                    : 'bg-cinemorph-surface/40 border-cinemorph-border text-cinemorph-text-secondary hover:bg-cinemorph-surface'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Telemetry & Status Badges */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-2xl bg-cinemorph-surface border border-cinemorph-border text-center">
            <div className="text-sm font-black text-cinemorph-text">{tickets.length}</div>
            <div className="text-[10px] font-medium text-cinemorph-text-muted">Saved Tickets</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-cinemorph-surface border border-cinemorph-border text-center">
            <div className="text-sm font-black text-cinemorph-primary">13-Stage</div>
            <div className="text-[10px] font-medium text-cinemorph-text-muted">Smart Reframe</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-cinemorph-surface border border-cinemorph-border text-center">
            <div className="text-sm font-black text-emerald-600">Spatial</div>
            <div className="text-[10px] font-medium text-cinemorph-text-muted">Parametric Audio</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-6 mt-6 border-t border-cinemorph-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-cinemorph-text-muted font-mono">
          <span className="w-2 h-2 rounded-full bg-cinemorph-primary" />
          <span>Auditorium Ready</span>
        </div>

        <button
          onClick={() => {
            setVersionMode('v2');
            navigate('/cinemorph');
          }}
          className="flex items-center gap-2 rounded-2xl bg-cinemorph-primary hover:opacity-95 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer font-cinematic"
        >
          <span>Enter CineMorph</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
