import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Play, Film, Clock, Volume2, 
  Maximize2, Zap, HardDrive, UploadCloud, Search, 
  Compass, ShieldCheck, FileVideo, RefreshCw, X, FolderHeart, ChevronRight,
  Clapperboard, Ticket, Disc
} from 'lucide-react';
import { useAppStore } from '../store';
import { playbackService } from '../lib/services/playbackService';
import { LocalMediaItem } from '../types';
import { extractYouTubeId } from '../lib/utils';
import { useTicketStore } from '../state/useTicketStore';

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
    <div className="min-h-screen w-full bg-[#f8f5f0] text-[#3d332a] flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden select-none font-serif">
      {/* Dynamic Ambient Vintage Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-amber-700/10 via-amber-600/5 to-amber-900/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-amber-800/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[300px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Vintage Cinema Props */}
      <div className="absolute top-36 right-8 sm:right-24 pointer-events-none z-0 opacity-40">
        <div className="flex items-center gap-2 bg-amber-100/50 border border-amber-900/10 px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Disc className="w-6 h-6 text-amber-800 animate-[spin_12s_linear_infinite]" />
          <span className="text-[10px] font-bold text-amber-900 tracking-widest uppercase">35mm Film Reel</span>
        </div>
      </div>

      <div className="absolute bottom-20 left-12 pointer-events-none z-0 opacity-40 hidden md:block">
        <div className="flex items-center gap-2 bg-amber-100/50 border border-amber-900/10 px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Ticket className="w-5 h-5 text-amber-800" />
          <span className="text-[10px] font-bold text-amber-900 tracking-widest uppercase">Theater Ticket</span>
        </div>
      </div>

      <div className="absolute bottom-28 right-16 pointer-events-none z-0 opacity-50">
        <div className="flex items-center gap-2 bg-amber-100/50 border border-amber-900/10 px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-sm">
          <Clapperboard className="w-5 h-5 text-amber-800" />
          <span className="text-[10px] font-bold text-amber-900 tracking-widest uppercase font-mono">SCENE #01</span>
        </div>
      </div>

      {/* Main Gateway Panel */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-4xl mt-12 mb-16">
        <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-600 via-amber-800 to-red-900 shadow-xl shadow-amber-900/20 mb-8 border border-amber-900/30">
          <img src="/omn_logo.jpg" alt="OMS Intelligence Core" className="w-full h-full object-cover rounded-full" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900 text-amber-50 text-[10px] font-bold tracking-[0.2em] uppercase border border-amber-800 shadow-sm mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Cinematic Immersion Engine</span>
          <Film className="w-3.5 h-3.5 text-amber-400" />
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-amber-950 text-center mb-6 drop-shadow-sm font-sans uppercase">
          Cine<span className="text-amber-700">Morph</span>
        </h1>
        
        <p className="text-center text-amber-900/70 max-w-xl text-base sm:text-lg mb-12 font-medium tracking-wide">
          Step into a grand theatrical environment with opening curtains, vintage acoustics, and dynamic spatial framing.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
            <Maximize2 className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold text-amber-900 tracking-wider">Screen Behind Hole</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold text-amber-900 tracking-wider">Spatial Acoustics</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
            <Film className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold text-amber-900 tracking-wider">100% Private Local Media</span>
          </div>
        </div>

        {/* Action Form */}
        <div className="w-full max-w-2xl bg-white border border-amber-200 rounded-[2rem] p-3 shadow-2xl shadow-amber-900/10 flex flex-col md:flex-row gap-3">
          
          <div className="flex bg-amber-50 p-1 rounded-full border border-amber-200 shadow-inner">
            <button
              onClick={() => setActiveSourceTab('youtube')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeSourceTab === 'youtube'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Web Stream</span>
            </button>
            <button
              onClick={() => setActiveSourceTab('local')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeSourceTab === 'local'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Local File</span>
            </button>
          </div>

          <div className="flex-1 relative">
            {activeSourceTab === 'youtube' ? (
              <form onSubmit={handleEnterCinema} className="h-full relative flex items-center w-full bg-amber-50 rounded-full border border-amber-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all shadow-inner">
                <input
                  type="text"
                  placeholder="Paste YouTube Link or Search..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-transparent text-amber-950 placeholder-amber-900/50 py-3 pl-6 pr-32 text-sm focus:outline-none font-sans font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputUrl.trim() || loading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white px-5 rounded-full text-[11px] font-black tracking-widest uppercase flex items-center gap-2 transition-colors shadow-sm"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Enter'}
                  {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </form>
            ) : (
              <div 
                className={`h-full relative flex items-center justify-center w-full rounded-full border-2 border-dashed transition-all cursor-pointer ${
                  dragOver ? 'border-amber-600 bg-amber-100' : 'border-amber-300 bg-amber-50 hover:border-amber-500 hover:bg-amber-100/50'
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
                <div className="flex items-center gap-3 text-amber-800">
                  <UploadCloud className={`w-5 h-5 ${dragOver ? 'animate-bounce text-amber-600' : ''}`} />
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

        {/* Torn Tickets / Continue Watching */}
        {tickets.length > 0 && (
          <div className="w-full max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Ticket className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-amber-900 tracking-[0.2em] uppercase">My Stubs</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tickets.slice(0, 4).map(ticket => (
                <div 
                  key={ticket.ticketId}
                  onClick={async () => {
                    const resumed = useTicketStore.getState().resumeFromTicket(ticket.ticketId);
                    if (resumed) {
                      await useTicketStore.getState().trigger10sPrintAnimation({
                        title: ticket.movieTitle,
                        source: ticket.sourceUrl,
                        isLocal: ticket.isLocal
                      });
                      navigate(ticket.isLocal ? `/theater/${ticket.ticketId}` : `/theater/${encodeURIComponent(ticket.sourceUrl)}`);
                    }
                  }}
                  className="group relative bg-white border border-amber-200 hover:border-amber-400 p-3 rounded-2xl flex items-center gap-4 cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                    {ticket.isLocal ? <HardDrive className="w-5 h-5 text-amber-700" /> : <Film className="w-5 h-5 text-amber-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-amber-950 truncate">{ticket.movieTitle}</h4>
                    <p className="text-[10px] font-mono text-amber-700 mt-1">{ticket.seatAssignment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="absolute bottom-6 font-mono text-[10px] text-amber-900/40 tracking-[0.3em] uppercase flex items-center gap-3 font-bold">
        <span>OmniStream V2.0</span>
        <span className="w-1 h-1 rounded-full bg-amber-900/40" />
        <span>Intelligence Architecture</span>
      </div>
    </div>
  );
}
