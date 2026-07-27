import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { X, Maximize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function GlobalPlayer() {
  const { activeVideo, setActiveVideo, history, addToHistory } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const isWatchPage = location.pathname.startsWith('/watch/');
  const isMiniPlayer = !isWatchPage && activeVideo !== null;

  useEffect(() => {
    if (activeVideo && isWatchPage) {
      setPlaying(true);
    }
  }, [activeVideo, isWatchPage]);

  const handleProgress = (state: any) => {
    if (!activeVideo) return;
    const durationStr = activeVideo.duration || 'PT0S';
    const match = durationStr.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    let durSec = 0;
    if (match) {
      durSec = (parseInt(match[1]) || 0) * 3600 + (parseInt(match[2]) || 0) * 60 + (parseInt(match[3]) || 0);
    }
    
    addToHistory(
      activeVideo,
      Math.floor(state.playedSeconds),
      playerRef.current?.getDuration() || durSec
    );
  };

  const closePlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVideo(null);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(!playing);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(!muted);
  };

  const expandToFull = () => {
    if (activeVideo && isMiniPlayer) {
      navigate(`/watch/${activeVideo.id}`);
    }
  };

  if (!activeVideo) return null;

  // We will always render the player in fixed position, 
  // but if we are on the watch page, we'll let the Watch page handle it.
  // Wait, if Watch page handles it, it unmounts! 
  // We must render it here ALWAYS, and Watch page will just render a blank placeholder.

  const playbackSpeed = useAppStore(state => state.playbackSpeed);

  return (
    <div 
      className={cn(
        "z-50 bg-[#1C1B1F] shadow-2xl transition-all duration-300 overflow-hidden shrink-0",
        isMiniPlayer 
          ? "fixed bottom-20 right-4 md:bottom-8 md:right-8 w-[320px] aspect-video rounded-2xl cursor-pointer hover:ring-2 hover:ring-[#D0BCFF]"
          : "static w-full max-w-6xl mx-auto rounded-[32px] aspect-video border border-white/5"
      )}
      onClick={isMiniPlayer ? expandToFull : undefined}
    >
      <div className="relative w-full h-full aspect-video pointer-events-auto">
        <Player
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${activeVideo.id}`}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          volume={volume}
          playbackRate={playbackSpeed}
          onProgress={handleProgress}
          progressInterval={5000}
          controls={!isMiniPlayer} // Show native controls only when full screen
          config={{
            youtube: {
              playerVars: { 
                start: Math.floor(history[activeVideo.id]?.progress || 0),
                modestbranding: 1,
                rel: 0
              }
            } as any
          }}
          style={{ pointerEvents: isMiniPlayer ? 'none' : 'auto' }}
        />

        {/* Custom Mini Player Controls Overlay */}
        <AnimatePresence>
          {isMiniPlayer && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex flex-col justify-between p-3"
            >
              <div className="flex justify-between items-start">
                <div className="text-white text-xs font-medium line-clamp-2 pr-4 drop-shadow-md">
                  {activeVideo.title}
                </div>
                <button 
                  onClick={closePlayer}
                  className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"
                >
                  {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
