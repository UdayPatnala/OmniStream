import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, X, Maximize2, RotateCcw, RotateCw } from 'lucide-react';
import { useAppStore } from '../../store';

export const UTubeMiniPlayer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeVideo, setActiveVideo } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(true);

  // Miniplayer should only show when there is an active video and we are NOT on the /watch/:id page or theater page
  const isWatchPage = location.pathname.startsWith('/watch/');
  const isTheaterPage = location.pathname.startsWith('/theater/');
  const shouldShow = Boolean(activeVideo) && !isWatchPage && !isTheaterPage;

  if (!shouldShow || !activeVideo) {
    return null;
  }

  const handleReturnToWatch = () => {
    navigate(`/watch/${activeVideo.id}`);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVideo(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 group select-none">
      {/* Video Surface Container */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
            typeof window !== 'undefined' ? window.location.origin : ''
          )}&rel=0&playsinline=1&controls=0`}
          title={activeVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          className="w-full h-full border-0 pointer-events-none"
        />

        {/* Floating Controls Scrim on Hover */}
        <div
          onClick={handleReturnToWatch}
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 cursor-pointer"
        >
          {/* Top Row: Expand & Close */}
          <div className="flex items-center justify-between text-white">
            <span className="text-[11px] font-bold tracking-wider uppercase text-red-400 font-mono">
              Mini Player
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReturnToWatch();
                }}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-white/20 text-white transition-colors"
                title="Expand to Full Video (i)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-red-600 text-white transition-colors"
                title="Close Mini Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Title */}
          <div className="text-center px-2">
            <h4 className="text-xs font-semibold text-white truncate drop-shadow-md">
              {activeVideo.title}
            </h4>
            <p className="text-[10px] text-gray-300 truncate mt-0.5">
              {activeVideo.channelTitle}
            </p>
          </div>

          {/* Bottom Click to Return */}
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded-md">
              Click to Expand
            </span>
          </div>
        </div>
      </div>

      {/* Mini Player Bottom Bar */}
      <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-slate-100">
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-bold text-slate-900 truncate">
            {activeVideo.title}
          </h5>
          <p className="text-[10px] text-slate-500 truncate font-medium">
            {activeVideo.channelTitle}
          </p>
        </div>

        <button
          onClick={handleReturnToWatch}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-md shadow-red-600/20 transition-all shrink-0 cursor-pointer"
        >
          Expand
        </button>
      </div>
    </div>
  );
};
