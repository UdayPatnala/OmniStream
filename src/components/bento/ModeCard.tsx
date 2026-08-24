import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Search,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Film,
  Maximize2,
  Tv,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { useUTubeStore } from '../../state/useUTubeStore';
import { useCineMorphStore, AspectRatioMode } from '../../state/useCineMorphStore';
import { useTicketStore } from '../../state/useTicketStore';
import { extractYouTubeId } from '../../lib/youtube';

interface ModeCardProps {
  mode: 'utube' | 'cinemorph';
  className?: string;
}

export const ModeCard: React.FC<ModeCardProps> = ({ mode, className = '' }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // U-TUBE Store
  const { search, playVideo } = useUTubeStore();
  const [utubeQuery, setUtubeQuery] = useState('');
  const [utubeUrl, setUtubeUrl] = useState('');

  // CineMorph Store
  const { aspectRatio, setAspectRatio, setVideoSource } = useCineMorphStore();
  const { trigger10sPrintAnimation } = useTicketStore();
  const [cinemorphUrl, setCinemorphUrl] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // U-TUBE Handlers
  const handleUtubeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = utubeQuery.trim();
    if (!q) return;
    await search(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleUtubeDirectUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const url = utubeUrl.trim();
    if (!url) return;
    const videoId = extractYouTubeId(url) || url;
    playVideo(videoId);
    navigate(`/watch/${videoId}`);
  };

  // CineMorph Handlers
  const handleFileSelect = (file: File) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const movieData = {
      title: file.name.replace(/\.[^/.]+$/, ''),
      source: objectUrl,
      isLocal: true,
      file,
    };

    setVideoSource({
      type: 'local',
      url: objectUrl,
      file,
      name: movieData.title,
    });

    trigger10sPrintAnimation(movieData);
    navigate('/theater/local-playback');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCinemorphUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = cinemorphUrl.trim();
    if (!url) return;
    const videoId = extractYouTubeId(url) || url;
    const movieData = {
      title: `YouTube Stream (${videoId})`,
      source: url,
      isLocal: false,
    };

    setVideoSource({
      type: 'youtube',
      url,
      name: movieData.title,
    });

    trigger10sPrintAnimation(movieData);
    navigate(`/theater/${videoId}`);
  };

  if (mode === 'utube') {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-[#1c080a] via-[#120406] to-[#0a0203] p-7 shadow-2xl transition-all duration-300 hover:border-red-500/60 hover:shadow-red-950/50 flex flex-col justify-between ${className}`}
      >
        {/* Glow ambient accent */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 shadow-inner">
                <Play className="h-6 w-6 fill-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-white">U-TUBE</h2>
                  <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
                    Ad-Free
                  </span>
                </div>
                <p className="text-xs text-red-200/70 font-medium">Pure Streaming • Fast Discovery Search • Offline History</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="group flex items-center gap-1 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-red-600 hover:text-white transition-all cursor-pointer border border-white/10"
            >
              <span>Explore Feed</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1 text-[11px] text-red-300/90 border border-red-900/40">
              <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
              <span>Zero Ads / Zero Popups</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1 text-[11px] text-red-300/90 border border-red-900/40">
              <Sparkles className="h-3.5 w-3.5 text-red-400" />
              <span>Intelligent Recommendations</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1 text-[11px] text-red-300/90 border border-red-900/40">
              <Tv className="h-3.5 w-3.5 text-red-400" />
              <span>4-Hour Feed Sync</span>
            </div>
          </div>

          {/* Quick Search Launcher */}
          <form onSubmit={handleUtubeSearch} className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-red-400" />
              Search YouTube Videos
            </label>
            <div className="relative">
              <input
                type="text"
                value={utubeQuery}
                onChange={(e) => setUtubeQuery(e.target.value)}
                placeholder="Search documentaries, music, tech..."
                className="w-full rounded-xl bg-black/50 border border-red-500/20 py-2.5 pl-3.5 pr-24 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Direct URL Input */}
          <form onSubmit={handleUtubeDirectUrl} className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-red-400" />
              Paste YouTube URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={utubeUrl}
                onChange={(e) => setUtubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl bg-black/50 border border-red-500/20 py-2.5 pl-3.5 pr-20 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer border border-white/10"
              >
                Play
              </button>
            </div>
          </form>
        </div>

        {/* Footer Action */}
        <div className="relative z-10 pt-6 mt-4 border-t border-red-900/30 flex items-center justify-between">
          <span className="text-[11px] font-mono text-red-400/80">CHANNEL SUBSCRIPTIONS READY</span>
          <button
            onClick={() => navigate('/subscriptions')}
            className="text-xs font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
          >
            Manage Channels
          </button>
        </div>
      </div>
    );
  }

  // CineMorph Card
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1a1309] via-[#120d06] to-[#0a0703] p-7 shadow-2xl transition-all duration-300 hover:border-amber-500/60 hover:shadow-amber-950/50 flex flex-col justify-between ${className}`}
    >
      {/* Glow ambient accent */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/20 border border-amber-500/40 text-amber-400 shadow-inner">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white">CineMorph</h2>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                  3D Theatrical
                </span>
              </div>
              <p className="text-xs text-amber-200/70 font-medium">Three.js 3D Theater • TF.js ML Framing • 10s Ticket Ritual</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/cinemorph')}
            className="group flex items-center gap-1 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-amber-600 hover:text-white transition-all cursor-pointer border border-white/10"
          >
            <span>Lobby</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-300/90 border border-amber-900/40">
            <Cpu className="h-3.5 w-3.5 text-amber-400" />
            <span>Real-Time ML Framing</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-300/90 border border-amber-900/40">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>Curved Screen & Seats</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-300/90 border border-amber-900/40">
            <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
            <span>1.43:1 / 1.90:1 Ratios</span>
          </div>
        </div>

        {/* Aspect Ratio Selector Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Screen Aperture Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['1.43:1', '1.90:1', 'original', '4:3'] as AspectRatioMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAspectRatio(mode)}
                className={`rounded-xl py-1.5 px-2 text-xs font-bold transition-all cursor-pointer border ${
                  aspectRatio === mode
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-black/40 text-gray-300 border-white/10 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                {mode === '1.43:1' ? '1.43 IMAX' : mode === '1.90:1' ? '1.90 IMAX' : mode === 'original' ? 'Original' : '4:3 Crop'}
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Local Media Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 ${
            isDraggingFile
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-amber-500/30 bg-black/40 hover:border-amber-500/60 hover:bg-amber-950/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mkv,.avi,.mov,.m4v,.ts,.m2ts,.flv,.wmv,.3gp,.ogv,.divx,.vob,.rmvb,.asf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-white">
              Drop Any Video File or Click to Browse
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              MP4 · MKV · MOV · AVI · WebM · TS · WMV · 3GP · OGV & more
            </p>
          </div>
        </div>

        {/* YouTube in CineMorph URL Input */}
        <form onSubmit={handleCinemorphUrlSubmit} className="space-y-1.5">
          <div className="relative">
            <input
              type="text"
              value={cinemorphUrl}
              onChange={(e) => setCinemorphUrl(e.target.value)}
              placeholder="Or enter YouTube URL to project into 3D theater..."
              className="w-full rounded-xl bg-black/50 border border-amber-500/20 py-2.5 pl-3.5 pr-28 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1 text-xs font-bold text-black transition-colors cursor-pointer"
            >
              3D Stream
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-6 mt-4 border-t border-amber-900/30 flex items-center justify-between">
        <span className="text-[11px] font-mono text-amber-400/80">CLIENT-SIDE ML GEOMETRY ACTIVE</span>
        <button
          onClick={() => navigate('/theater/demo')}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
        >
          Launch Theater Direct
        </button>
      </div>
    </div>
  );
};
