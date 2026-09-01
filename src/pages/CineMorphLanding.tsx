import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, RefreshCw, X, 
  Disc, Clapperboard, Layers
} from 'lucide-react';
import { useAppStore } from '../store';
import { LocalMediaItem } from '../types';
import { useTicketStore } from '../state/useTicketStore';
import { posterService } from '../lib/cinemorph/posterService';

export function CineMorphLanding() {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localFileError, setLocalFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { 
    localMediaHistory, 
    addLocalMediaToHistory, 
    setActiveLocalMedia 
  } = useAppStore();

  const handleLocalFileSelect = async (file: File) => {
    setLocalFileError(null);
    if (!file) return;

    const validExtensions = [
      'mp4', 'webm', 'mkv', 'mov', 'm4v', 'avi', 'flv', 'wmv', '3gp', 'ts', 'ogv', 'm3u8', 'mpd',
      'mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'opus', 'wma'
    ];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isMediaMime = file.type.startsWith('video/') || file.type.startsWith('audio/');

    if (!isMediaMime && !validExtensions.includes(ext)) {
      setLocalFileError(`Unsupported format (.${ext}). Please select a valid video or audio file.`);
      return;
    }

    try {
      setLoading(true);
      const blobUrl = URL.createObjectURL(file);
      const fileId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const title = file.name.replace(/\.[^/.]+$/, '');

      // Resolve and preload dynamic movie poster from the local video before printer starts
      const posterRes = await posterService.resolvePoster({
        id: fileId,
        sourceUrl: blobUrl,
        isLocal: true,
        file: file,
        title: title,
      });

      const mediaItem: LocalMediaItem = {
        id: fileId,
        name: title,
        size: file.size,
        type: file.type || `video/${ext}`,
        url: blobUrl,
        duration: 0,
        progress: 0,
        lastWatchedAt: Date.now(),
        thumbnail: posterRes.url,
      };

      addLocalMediaToHistory(mediaItem);
      setActiveLocalMedia(mediaItem);

      await useTicketStore.getState().trigger10sPrintAnimation({
        title: title,
        source: blobUrl,
        isLocal: true,
        file: file,
        posterUrl: posterRes.url,
        thumbnailUrl: posterRes.url,
      });

      navigate(`/theater/${fileId}`);
    } catch (err) {
      setLocalFileError('Failed to read local file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLocalFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cinemorph-bg text-cinemorph-text flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden select-none font-cinematic">
      {/* Top Bar: Ecosystem Escape */}
      <div className="w-full max-w-5xl flex items-center justify-between z-20">
        <Link
          to="/"
          title="Return to OmniStream Gateway"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-cinemorph-card/60 hover:bg-cinemorph-surface border border-cinemorph-border text-xs font-semibold text-cinemorph-text-secondary hover:text-cinemorph-text transition-all backdrop-blur-md"
        >
          <Layers className="w-4 h-4 text-cinemorph-primary" />
          <span>OmniStream Gateway</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-cinemorph-text-muted uppercase">
            IMMERSION ENGINE • V2.1
          </span>
        </div>
      </div>

      {/* Dynamic Ambient Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cinemorph-primary/10 via-cinemorph-secondary/5 to-cinemorph-primary/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cinemorph-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[300px] bg-cinemorph-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Cinematic Atmosphere Props */}
      <div className="absolute top-36 right-8 sm:right-24 pointer-events-none z-0 opacity-40">
        <div className="flex items-center gap-2 bg-cinemorph-surface border border-cinemorph-border px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Disc className="w-6 h-6 text-cinemorph-primary animate-[spin_12s_linear_infinite]" />
          <span className="text-[10px] font-bold text-cinemorph-text-secondary tracking-widest uppercase">35mm Film Reel</span>
        </div>
      </div>

      <div className="absolute bottom-28 right-16 pointer-events-none z-0 opacity-50 hidden md:block">
        <div className="flex items-center gap-2 bg-cinemorph-surface border border-cinemorph-border px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Clapperboard className="w-5 h-5 text-cinemorph-primary" />
          <span className="text-[10px] font-bold text-cinemorph-text-secondary tracking-widest uppercase font-mono">SCENE #01</span>
        </div>
      </div>

      {/* Main Ingestion & Admission Gateway Panel */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-2xl my-8">
        
        {/* Subtle Mode Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cinemorph-primary/15 text-cinemorph-primary text-[10px] font-bold tracking-[0.2em] uppercase border border-cinemorph-primary/30 shadow-sm mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Virtual Theater Ingestion Hall</span>
        </div>

        {/* ── The CineMorph Artwork Portal (Interactive Image Button) ── */}
        <div className="w-full flex flex-col items-center text-center">
          <button
            type="button"
            disabled={loading}
            aria-label="Import local video or audio file into CineMorph theater"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`group relative w-full max-w-[360px] sm:max-w-[440px] p-2 sm:p-4 rounded-3xl transition-all duration-500 cursor-pointer flex flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-cinemorph-primary focus-visible:ring-offset-4 focus-visible:ring-offset-cinemorph-bg ${
              dragOver
                ? 'scale-105 shadow-[0_0_60px_rgba(82,108,158,0.45)]'
                : 'hover:scale-[1.03] active:scale-[0.98]'
            }`}
          >
            {/* Real Accessible File Input (Visually Hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              tabIndex={-1}
              className="sr-only"
              aria-hidden="true"
              accept="video/*,audio/*,.mkv,.ts,.m3u8,.avi,.mp4,.mov,.webm,.flv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleLocalFileSelect(e.target.files[0]);
                }
              }}
            />

            {/* Ambient Volumetric Backlight Behind Artwork */}
            <div 
              className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
                dragOver
                  ? 'bg-cinemorph-primary/35 scale-110'
                  : 'bg-cinemorph-primary/15 group-hover:bg-cinemorph-primary/25 group-hover:scale-105'
              }`}
            />

            {/* The CineMorph Artwork Itself (The Interactive Object) */}
            <div className="relative z-10 w-full aspect-square flex items-center justify-center">
              <img
                src="/cinemorph_artwork.png"
                alt="CineMorph AI — Every Frame. Intelligently Reimagined."
                draggable={false}
                className={`w-full h-full object-contain filter transition-all duration-500 drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)] ${
                  dragOver
                    ? 'brightness-110 drop-shadow-[0_0_45px_rgba(82,108,158,0.65)]'
                    : 'group-hover:brightness-105 group-hover:drop-shadow-[0_0_35px_rgba(82,108,158,0.35)]'
                }`}
              />

              {/* Ingestion Loading / Processing Overlay */}
              {loading && (
                <div className="absolute inset-0 rounded-3xl bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  <span className="text-xs font-mono font-bold tracking-widest text-white uppercase bg-black/60 px-4 py-1.5 rounded-full border border-white/20">
                    Preparing Admission...
                  </span>
                </div>
              )}
            </div>

            {/* Minimal Secondary Supporting Cue */}
            <div className="relative z-10 mt-1 flex items-center gap-2 text-cinemorph-text-muted group-hover:text-cinemorph-primary transition-colors font-mono text-[11px] uppercase tracking-[0.25em] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cinemorph-primary group-hover:rotate-12 transition-transform duration-300" />
              <span>{dragOver ? 'Drop Media to Enter' : 'Click or Drop Media to Enter'}</span>
            </div>
          </button>

          {/* Graceful Error Feedback */}
          {localFileError && (
            <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <X className="w-4 h-4 shrink-0" />
              <span>{localFileError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="font-mono text-[10px] text-cinemorph-text-muted tracking-[0.3em] uppercase flex items-center gap-3 font-bold z-10">
        <span>OmniStream V2.1</span>
        <span className="w-1 h-1 rounded-full bg-cinemorph-text-muted" />
        <span>Intelligence Architecture</span>
      </div>
    </div>
  );
}
