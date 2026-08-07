import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { X, Play, Pause } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function GlobalPlayer() {
  const { activeVideo, setActiveVideo, history, addToHistory, playbackSpeed } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  
  const [playing, setPlaying] = useState(true);
  const [muted] = useState(false);
  const [volume] = useState(1);

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

  const expandToFull = () => {
    if (activeVideo && isMiniPlayer) {
      navigate(`/watch/${activeVideo.id}`);
    }
  };

  if (!activeVideo) return null;

  return (
    <div 
      className={cn(
        "z-50 shadow-2xl transition-all duration-300 overflow-hidden shrink-0 bg-black",
        isMiniPlayer 
          ? "fixed bottom-16 right-4 md:bottom-6 md:right-6 w-[320px] aspect-video rounded-xl cursor-pointer hover:ring-2 hover:ring-white border border-[#383838]"
          : isWatchPage 
            ? "w-full aspect-video rounded-2xl mb-4 border border-[#272727]" 
            : "hidden"
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
          controls={!isMiniPlayer}
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
              className="absolute inset-0 bg-black/50 flex flex-col justify-between p-2.5"
            >
              <div className="flex justify-between items-start">
                <div className="text-white text-xs font-semibold line-clamp-2 pr-3 drop-shadow">
                  {activeVideo.title}
                </div>
                <button 
                  onClick={closePlayer}
                  className="p-1 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors shrink-0"
                  aria-label="Close Mini Player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center items-center gap-3">
                <button 
                  onClick={togglePlay}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                  aria-label="Play/Pause"
                >
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
