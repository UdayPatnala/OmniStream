import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Play, Film, Volume2, 
  Maximize2, HardDrive, UploadCloud, RefreshCw, X, Ticket, Disc, Clapperboard
} from 'lucide-react';
import { useAppStore } from '../store';
import { playbackService } from '../lib/services/playbackService';
import { LocalMediaItem } from '../types';
import { extractYouTubeId } from '../lib/utils';
import { useTicketStore } from '../state/useTicketStore';
import { OMSLogo } from '../components/common/OMSLogo';

export function CineMorphLanding() {
  const [activeSourceTab, setActiveSourceTab] = useState<'youtube' | 'local'>('youtube');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localFileError, setLocalFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const tickets = useTicketStore(state => state.tickets);
  const { 
    localMediaHistory, 
    addLocalMediaToHistory, 
    setActiveLocalMedia 
  } = useAppStore();

  const handleEnterCinema = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const query = (directInput || inputUrl).trim();
    if (!query) return;

    setLoading(true);
    try {
      const directId = extractYouTubeId(query);
      if (directId) {
        await useTicketStore.getState().trigger10sPrintAnimation({
          title: 'YouTube Stream',
          source: query,
          isLocal: false
        });
        navigate(`/theater/${directId}`);
        return;
      }

      await playbackService.executePipeline(query, async (path) => {
        navigate(path);
      });
    } catch (e) {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  };

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
        file: file
      });

      navigate(`/theater/${fileId}`);
    } catch (err) {
      setLocalFileError('Failed to read local file. Please try again.');
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
      {/* Dynamic Ambient Spotlights using Brand colors */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cinemorph-primary/10 via-cinemorph-secondary/5 to-cinemorph-primary/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cinemorph-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[300px] bg-cinemorph-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Cinematic Props */}
      <div className="absolute top-36 right-8 sm:right-24 pointer-events-none z-0 opacity-40">
        <div className="flex items-center gap-2 bg-cinemorph-surface border border-cinemorph-border px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Disc className="w-6 h-6 text-cinemorph-primary animate-[spin_12s_linear_infinite]" />
          <span className="text-[10px] font-bold text-cinemorph-text-secondary tracking-widest uppercase">35mm Film Reel</span>
        </div>
      </div>

      <div className="absolute bottom-20 left-12 pointer-events-none z-0 opacity-40 hidden md:block">
        <div className="flex items-center gap-2 bg-cinemorph-surface border border-cinemorph-border px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Ticket className="w-5 h-5 text-cinemorph-primary" />
          <span className="text-[10px] font-bold text-cinemorph-text-secondary tracking-widest uppercase">Theater Ticket</span>
        </div>
      </div>

      <div className="absolute bottom-28 right-16 pointer-events-none z-0 opacity-50">
        <div className="flex items-center gap-2 bg-cinemorph-surface border border-cinemorph-border px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Clapperboard className="w-5 h-5 text-cinemorph-primary" />
          <span className="text-[10px] font-bold text-cinemorph-text-secondary tracking-widest uppercase font-mono">SCENE #01</span>
        </div>
      </div>

      {/* Main Gateway Panel */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-4xl mt-12 mb-16">
        <div className="mb-6">
          <OMSLogo variant="light" size="xl" animated={true} />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cinemorph-primary text-white text-[10px] font-bold tracking-[0.2em] uppercase border border-cinemorph-primary shadow-sm mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cinemorph-secondary" />
          <span>Cinematic Immersion Engine</span>
          <Film className="w-3.5 h-3.5 text-cinemorph-secondary" />
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-widest text-cinemorph-text text-center mb-6 drop-shadow-sm font-cinematic-title uppercase">
          Cine<span className="text-cinemorph-secondary">Morph</span>
        </h1>
        
        <p className="text-center text-cinemorph-text-secondary max-w-xl text-base sm:text-lg mb-12 font-medium tracking-wide leading-relaxed">
          Step into a grand theatrical environment with opening curtains, vintage acoustics, and dynamic spatial framing.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cinemorph-card border border-cinemorph-border shadow-sm">
            <Maximize2 className="w-4 h-4 text-cinemorph-primary" />
            <span className="text-xs font-bold text-cinemorph-text tracking-wider">Screen Behind Hole</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cinemorph-card border border-cinemorph-border shadow-sm">
            <Volume2 className="w-4 h-4 text-cinemorph-primary" />
            <span className="text-xs font-bold text-cinemorph-text tracking-wider">Spatial Acoustics</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cinemorph-card border border-cinemorph-border shadow-sm">
            <Film className="w-4 h-4 text-cinemorph-primary" />
            <span className="text-xs font-bold text-cinemorph-text tracking-wider">100% Private Local Media</span>
          </div>
        </div>

        {/* Action Form */}
        <div className="w-full max-w-2xl bg-cinemorph-card border border-cinemorph-border rounded-[2rem] p-3 shadow-2xl shadow-cinemorph-primary/5 flex flex-col md:flex-row gap-3">
          
          <div className="flex bg-cinemorph-surface p-1 rounded-full border border-cinemorph-border shadow-inner shrink-0">
            <button
              onClick={() => setActiveSourceTab('youtube')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeSourceTab === 'youtube'
                  ? 'bg-cinemorph-primary text-white shadow-md'
                  : 'text-cinemorph-text-secondary hover:text-cinemorph-text hover:bg-cinemorph-surface'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Web Stream</span>
            </button>
            <button
              onClick={() => setActiveSourceTab('local')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeSourceTab === 'local'
                  ? 'bg-cinemorph-primary text-white shadow-md'
                  : 'text-cinemorph-text-secondary hover:text-cinemorph-text hover:bg-cinemorph-surface'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Local File</span>
            </button>
          </div>

          <div className="flex-1 relative min-h-[48px]">
            {activeSourceTab === 'youtube' ? (
              <form onSubmit={handleEnterCinema} className="h-full relative flex items-center w-full bg-cinemorph-surface rounded-full border border-cinemorph-border focus-within:border-cinemorph-primary focus-within:ring-2 focus-within:ring-cinemorph-secondary/20 transition-all shadow-inner">
                <input
                  type="text"
                  placeholder="Paste YouTube Link or Search..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-transparent text-cinemorph-text placeholder-cinemorph-text-muted py-3 pl-6 pr-32 text-sm focus:outline-none font-sans font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputUrl.trim() || loading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-cinemorph-primary hover:bg-cinemorph-primary/95 disabled:opacity-50 text-white px-5 rounded-full text-[11px] font-black tracking-widest uppercase flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Enter'}
                  {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </form>
            ) : (
              <div 
                className={`h-full relative flex items-center justify-center w-full rounded-full border-2 border-dashed transition-all cursor-pointer ${
                  dragOver ? 'border-cinemorph-primary bg-cinemorph-surface' : 'border-cinemorph-border bg-cinemorph-card hover:border-cinemorph-primary hover:bg-cinemorph-surface/50'
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
                <div className="flex items-center gap-3 text-cinemorph-text-secondary">
                  <UploadCloud className={`w-5 h-5 ${dragOver ? 'text-cinemorph-primary animate-bounce' : ''}`} />
                  <span className="text-sm font-bold tracking-wide font-sans">
                    {dragOver ? 'Drop file to play' : 'Click or drop media file here'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {localFileError && (
          <div className="mt-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg flex items-center gap-2">
            <X className="w-4 h-4" />
            {localFileError}
          </div>
        )}

      </div>

      <div className="absolute bottom-6 font-mono text-[10px] text-cinemorph-text-muted tracking-[0.3em] uppercase flex items-center gap-3 font-bold">
        <span>OmniStream V2.0</span>
        <span className="w-1 h-1 rounded-full bg-cinemorph-text-muted" />
        <span>Intelligence Architecture</span>
      </div>
    </div>
  );
}
