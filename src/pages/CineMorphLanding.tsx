import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Play, Film, Clock, Volume2, 
  Maximize2, Zap, HardDrive, UploadCloud, Search, 
  Compass, ShieldCheck, FileVideo, RefreshCw, X, FolderHeart, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { playbackService } from '../lib/services/playbackService';
import { LocalMediaItem } from '../types';

const CURATED_SHOWCASE = [
  { id: 'dQw4w9WgXcQ', title: 'Cinematic 4K Showcase', tag: 'IMAX 4K HDR', query: 'cinematic 4k hdr landscape movie demo' },
  { id: 'jfKfPfyJRdk', title: 'Lo-Fi Chill Cinema', tag: 'Spatial Audio', query: 'lofi hip hop radio beats to relax study' },
  { id: '5qap5aO4i9A', title: 'Cyberpunk Neon City', tag: '21:9 UltraWide', query: 'cyberpunk 2077 night city 4k 60fps showcase' },
  { id: 'LXb3EKWsInQ', title: 'Nature in 8K Ultra HDR', tag: 'Ambilight Glow', query: 'costa rica 8k 60fps hdr ultra hd' },
];

export function CineMorphLanding() {
  const [activeSourceTab, setActiveSourceTab] = useState<'youtube' | 'local'>('youtube');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localFileError, setLocalFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { 
    history, 
    localMediaHistory, 
    addLocalMediaToHistory, 
    setActiveLocalMedia, 
    setVersionMode 
  } = useAppStore();

  const handleEnterCinema = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const query = (directInput || inputUrl).trim();
    if (!query) return;

    setLoading(true);
    try {
      await playbackService.executePipeline(query, (path) => {
        navigate(path);
      });
    } catch (e) {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  };

  const handleLocalFileSelect = (file: File) => {
    setLocalFileError(null);
    if (!file) return;

    // Validate video or audio mime or extension
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
      const mediaItem: LocalMediaItem = {
        id: fileId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        size: file.size,
        type: file.type || `video/${ext}`,
        url: blobUrl,
        duration: 0,
        progress: 0,
        lastWatchedAt: Date.now(),
      };

      addLocalMediaToHistory(mediaItem);
      setActiveLocalMedia(mediaItem);

      // Navigate to theater with local mode identifier
      navigate(`/watch/${fileId}`);
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
    <div className="min-h-screen w-full bg-[#030206] text-white flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden select-none font-sans">
      {/* Dynamic Ambient Cinema Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cyan-900/25 via-indigo-900/35 to-purple-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
          <span className="text-xs font-bold tracking-widest uppercase text-gray-300">
            CineMorph AI <span className="text-cyan-400">Theater V2</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-all shadow-sm"
          >
            ← Experience Selector
          </button>
          <button
            onClick={() => { setVersionMode('v1'); navigate('/home'); }}
            className="px-3.5 py-1.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300 hover:text-white transition-all shadow-sm"
          >
            Enter U-Tube V1
          </button>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="w-full max-w-3xl text-center space-y-6 z-10 my-auto py-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-widest uppercase shadow-lg shadow-cyan-950/40">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Neural Virtual Cinema Hall
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white bg-gradient-to-b from-white via-[#f1f5f9] to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
            CineMorph<span className="text-cyan-400">AI</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-400 font-medium tracking-wide max-w-lg mx-auto">
            Experience ultra-immersive cinematic playback with 2.5D visual theater room, opening curtains, adaptive Ambilight bloom, and spatial Web Audio DSP.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <Film className="w-3 h-3 text-cyan-400" /> 2.5D Theater Seating
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <Volume2 className="w-3 h-3 text-purple-400" /> Spatial Audio DSP
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <Zap className="w-3 h-3 text-amber-400" /> Dynamic Ambilight Bloom
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <HardDrive className="w-3 h-3 text-emerald-400" /> 100% Private Local Media
            </span>
          </div>
        </div>

        {/* Source Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/10 w-fit mx-auto shadow-xl">
          <button
            onClick={() => setActiveSourceTab('youtube')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSourceTab === 'youtube'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>YouTube Stream Cinema</span>
          </button>

          <button
            onClick={() => setActiveSourceTab('local')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSourceTab === 'local'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-cyan-300" />
            <span>Personal Local Media</span>
          </button>
        </div>

        {/* TAB 1: YOUTUBE CINEMA GATE */}
        {activeSourceTab === 'youtube' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleEnterCinema} className="relative w-full max-w-xl mx-auto">
              <div className="relative flex items-center bg-[#0a0812]/90 border border-cyan-500/35 rounded-2xl p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl focus-within:border-cyan-400 focus-within:shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste YouTube Link or Search (e.g. Interstellar 4K, Cyberpunk City)..."
                  className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !inputUrl.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Cinema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Featured Channel Selector Hub */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-bold uppercase tracking-wider">
                <span>Select Channel / Category First</span>
                <span className="text-[10px] text-cyan-400">Filter Videos by Channel</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { id: 'veritasium', name: 'Veritasium', icon: '🧪', query: 'Veritasium' },
                  { id: 'mkbhd', name: 'MKBHD', icon: '📱', query: 'Marques Brownlee' },
                  { id: 'lofigirl', name: 'Lofi Girl', icon: '🎧', query: 'Lofi Girl' },
                  { id: 'natgeo', name: 'Nat Geo', icon: '🌍', query: 'National Geographic' },
                  { id: 'ted', name: 'TED Talks', icon: '💡', query: 'TED Talks' },
                  { id: 'f1', name: 'Formula 1', icon: '🏎️', query: 'Formula 1' },
                  { id: 'traversy', name: 'Traversy Media', icon: '💻', query: 'Traversy Media' },
                  { id: 'bbcearth', name: 'BBC Earth', icon: '🦁', query: 'BBC Earth' },
                ].map((chan) => (
                  <button
                    key={chan.id}
                    onClick={() => handleEnterCinema(undefined, chan.query)}
                    className="px-3.5 py-1.5 rounded-full bg-[#12101f] hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span>{chan.icon}</span>
                    <span>{chan.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Curated Showcase Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-semibold uppercase tracking-wider">
                <span>Featured Cinematic Showcases</span>
                <span className="text-[10px] text-cyan-400">1-Click Instant Play</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CURATED_SHOWCASE.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleEnterCinema(undefined, item.id)}
                    className="p-3 rounded-2xl bg-[#0e0d16]/80 hover:bg-[#151322] border border-white/5 hover:border-cyan-500/40 text-left transition-all duration-200 group flex flex-col justify-between h-24 hover:scale-[1.02] shadow-md cursor-pointer"
                  >
                    <div className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20 w-fit">
                      {item.tag}
                    </div>
                    <div className="text-xs font-semibold text-gray-300 group-hover:text-white line-clamp-2 leading-tight">
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL MEDIA GATE */}
        {activeSourceTab === 'local' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-xl mx-auto p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 bg-[#0a0812]/90 backdrop-blur-2xl ${
                dragOver 
                  ? 'border-cyan-400 bg-cyan-950/20 scale-[1.02] shadow-[0_0_40px_rgba(34,211,238,0.25)]' 
                  : 'border-white/15 hover:border-cyan-500/40 hover:bg-[#0e0d18]'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*,audio/*,.mp4,.webm,.mkv,.mov,.m4v,.avi,.flv,.wmv,.3gp,.ts,.ogv,.m3u8,.mpd,.mp3,.wav,.aac,.flac,.m4a,.ogg"
                onChange={(e) => e.target.files?.[0] && handleLocalFileSelect(e.target.files[0])}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/15">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center">
                <div className="text-sm font-bold text-white">
                  Drop your local video or audio file here, or <span className="text-cyan-400 underline underline-offset-2">Browse</span>
                </div>
                <div className="text-xs text-gray-400">
                  Supports MP4, MKV, WebM, MOV, AVI, FLV, TS, MP3, WAV, AAC, FLAC & All Formats
                </div>
              </div>
            </div>

            {/* Error Message */}
            {localFileError && (
              <div className="max-w-xl mx-auto p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-between">
                <span>{localFileError}</span>
                <button onClick={() => setLocalFileError(null)}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Recent Local Media Sessions (Premium Cards Grid) */}
            {recentLocalList.length > 0 ? (
              <div className="space-y-4 pt-4 max-w-xl mx-auto text-left">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-bold uppercase tracking-widest">
                  <span>Recent Cinema Sessions</span>
                  <span className="text-[10px] text-cyan-400">Click to Resume Playback</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentLocalList.map((item) => {
                    const progressPercent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.url) {
                            setActiveLocalMedia(item);
                            navigate(`/watch/${item.id}`);
                          } else {
                            fileInputRef.current?.click();
                          }
                        }}
                        className="group relative rounded-2xl bg-[#0b0a12]/80 hover:bg-[#12101e] border border-white/5 hover:border-cyan-500/40 p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between h-32 hover:scale-[1.02] shadow-lg overflow-hidden"
                      >
                        {/* Ambient corner indicator */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-xl pointer-events-none" />

                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                            <FileVideo className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-gray-400 pt-0.5 font-semibold">
                              {(item.size / (1024 * 1024)).toFixed(1)} MB • {item.type.split('/')[1].toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {/* Progress bar */}
                          {item.duration > 0 && (
                            <div className="space-y-1">
                              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                                <span>{Math.round(progressPercent)}% watched</span>
                                <span>{Math.floor(item.duration / 60)} min</span>
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase flex items-center gap-1 group-hover:text-cyan-300">
                            <span>Resume theater</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto p-8 rounded-3xl bg-[#0a0812]/40 border border-white/5 text-center space-y-2">
                <FolderHeart className="w-8 h-8 text-gray-600 mx-auto" />
                <div className="text-xs font-semibold text-gray-400">No recent local media sessions found</div>
                <p className="text-[10px] text-gray-500">Drag or browse a video file to begin watching privately.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer System Diagnostics */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 z-10 pt-4 border-t border-white/5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>CineMorph Virtual Theater Architecture</span>
          <span>•</span>
          <span>Zero-Latency Media Pipeline</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Private Client-Side Execution</span>
        </div>
      </div>
    </div>
  );
}
