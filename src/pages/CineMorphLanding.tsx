import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, HardDrive, UploadCloud, RefreshCw, X, Ticket, 
  Disc, Clapperboard, Layers, Play, Clock, ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { LocalMediaItem } from '../types';
import { useTicketStore } from '../state/useTicketStore';
import { OMSLogo } from '../components/common/OMSLogo';

export function CineMorphLanding() {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localFileError, setLocalFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const tickets = useTicketStore((state) => state.tickets);
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
      const mediaItem: LocalMediaItem = {
        id: fileId,
        name: title,
        size: file.size,
        type: file.type || `video/${ext}`,
        url: blobUrl,
        duration: 0,
        progress: 0,
        lastWatchedAt: Date.now(),
      };

      addLocalMediaToHistory(mediaItem);
      setActiveLocalMedia(mediaItem);

      await useTicketStore.getState().trigger10sPrintAnimation({
        title: title,
        source: blobUrl,
        isLocal: true,
        file: file,
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

  const recentLocalList = Object.values(localMediaHistory)
    .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
    .slice(0, 4);

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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-4xl my-8">
        <div className="mb-4">
          <OMSLogo variant="light" size="xl" animated={true} />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cinemorph-primary/15 text-cinemorph-primary text-[10px] font-bold tracking-[0.2em] uppercase border border-cinemorph-primary/30 shadow-sm mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Virtual Theater Ingestion Hall</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-widest text-cinemorph-text text-center mb-4 drop-shadow-sm font-cinematic-title uppercase">
          Cine<span className="text-cinemorph-primary">Morph</span>
        </h1>
        
        <p className="text-center text-cinemorph-text-secondary max-w-lg text-sm sm:text-base mb-8 font-medium tracking-wide leading-relaxed">
          Step into a grand theatrical auditorium with velvet curtains, fixed IMAX apertures, and client-side smart framing.
        </p>

        {/* Primary Media Ingest Card */}
        <div className="w-full max-w-xl bg-cinemorph-card border border-cinemorph-border rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cinemorph-primary/5 flex flex-col items-center text-center backdrop-blur-xl">
          
          <div 
            className={`w-full py-10 px-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              dragOver 
                ? 'border-cinemorph-primary bg-cinemorph-primary/10 scale-[1.02]' 
                : 'border-cinemorph-border bg-cinemorph-surface/50 hover:border-cinemorph-primary/60 hover:bg-cinemorph-surface'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="video/*,audio/*,.mkv,.ts,.m3u8,.avi,.mp4"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleLocalFileSelect(e.target.files[0]);
                }
              }}
            />
            
            <div className="w-16 h-16 rounded-full bg-cinemorph-primary/10 border border-cinemorph-primary/20 flex items-center justify-center shadow-inner">
              <UploadCloud className={`w-8 h-8 text-cinemorph-primary transition-transform ${dragOver ? 'scale-110 animate-bounce' : ''}`} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-cinemorph-text">
                {dragOver ? 'Drop file to enter theater' : 'Select or Drop Local Media'}
              </h3>
              <p className="text-xs text-cinemorph-text-secondary max-w-xs font-sans">
                Supports MP4, MKV, WebM, MOV, and high-bitrate audio. 100% private, client-side decoding.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              className="px-6 py-2 rounded-full bg-cinemorph-primary hover:bg-cinemorph-primary/90 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
              <span>{loading ? 'Processing Ticket...' : 'Browse Local Media'}</span>
            </button>
          </div>

          {localFileError && (
            <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{localFileError}</span>
            </div>
          )}

          {/* Admission Tickets Shelf for 1-click resumption */}
          {tickets.length > 0 && (
            <div className="w-full mt-6 pt-6 border-t border-cinemorph-border text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cinemorph-text-muted uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Ticket className="w-3.5 h-3.5 text-cinemorph-primary" />
                  <span>Saved Admission Passes</span>
                </span>
                <span className="text-[10px] font-mono text-cinemorph-text-muted">
                  {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tickets.slice(0, 3).map((t) => (
                  <div
                    key={t.ticketId}
                    onClick={() => {
                      useTicketStore.getState().resumeFromTicket(t.ticketId);
                      navigate(`/theater/${t.sourceUrl}`);
                    }}
                    className="p-3 rounded-2xl bg-cinemorph-surface hover:bg-cinemorph-surface/90 border border-cinemorph-border/70 hover:border-cinemorph-primary/50 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cinemorph-card border border-cinemorph-border flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 text-cinemorph-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-cinemorph-text truncate group-hover:text-cinemorph-primary transition-colors">
                          {t.movieTitle}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-cinemorph-text-muted font-mono">
                          <span>{t.aspectRatio}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {Math.floor(t.timestampSeconds / 60)}m saved
                          </span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-cinemorph-text-muted group-hover:text-cinemorph-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                ))}
              </div>
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
