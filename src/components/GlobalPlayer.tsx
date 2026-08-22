import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { X, Play, Pause } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { THEME_CONFIGS, getGlowScale, calculateFrameStyle, audioEngine } from '../lib/cinemorph';
import { errorRecoveryManager } from '../lib/services/errorRecoveryManager';

export function GlobalPlayer() {
  const { 
    activeVideo, 
    setActiveVideo, 
    history, 
    addToHistory, 
    playbackSpeed, 
    ambientGlow, 
    cinemaMode,
    cinemorphTheme,
    glowIntensity,
    frameAspectRatio,
    reframeMode,
    audioEQ,
    recoveryMessage,
  } = useAppStore();
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

  // Connect Web Audio DSP when player element mounts
  useEffect(() => {
    if (isWatchPage && playerRef.current && typeof playerRef.current.getInternalPlayer === 'function') {
      try {
        const internalPlayer = playerRef.current.getInternalPlayer();
        if (internalPlayer && typeof internalPlayer.getIframe === 'function') {
          audioEngine.init();
          audioEngine.applyConfig(audioEQ);
        }
      } catch (e) {}
    }
  }, [isWatchPage, audioEQ]);

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

  const currentTheme = THEME_CONFIGS[cinemorphTheme] || THEME_CONFIGS['cinematic-dark'];
  const glowScale = getGlowScale(glowIntensity);
  const frameStyle = calculateFrameStyle(frameAspectRatio, reframeMode);

  return (
    <div className="relative w-full">
      {/* Cinema Mode Global Backdrop */}
      {isWatchPage && cinemaMode && (
        <div className="fixed inset-0 bg-black/95 z-40 backdrop-blur-xl pointer-events-none transition-opacity duration-500" />
      )}

      {/* Automated Error Recovery Notification Banner */}
      {recoveryMessage && isWatchPage && (
        <div className="bg-gradient-to-r from-amber-600/90 to-purple-600/90 text-white text-xs font-bold px-4 py-2 rounded-xl mb-3 border border-amber-400/40 shadow-xl animate-bounce flex items-center justify-between z-50">
          <span>{recoveryMessage}</span>
          <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Automated Recovery</span>
        </div>
      )}

      <div 
        className={cn(
          "z-50 transition-all duration-500 overflow-hidden shrink-0 bg-black relative rounded-2xl",
          isMiniPlayer 
            ? "fixed bottom-16 right-4 md:bottom-6 md:right-6 w-[320px] aspect-video rounded-xl cursor-pointer hover:ring-2 hover:ring-purple-400 border border-white/20 shadow-2xl"
            : isWatchPage 
              ? "w-full mb-4 border border-purple-500/20 shadow-2xl" 
              : "hidden"
        )}
        style={{
          aspectRatio: isWatchPage ? (frameAspectRatio === '21:9' ? '21/9' : frameAspectRatio === '4:3' ? '4/3' : frameAspectRatio === '1:1' ? '1/1' : '16/9') : '16/9'
        }}
        onClick={isMiniPlayer ? expandToFull : undefined}
      >
        {/* CineMorph Ambient Glow Multi-Layer Canvas */}
        {isWatchPage && ambientGlow && glowIntensity !== 'off' && (
          <>
            <div 
              className="absolute -inset-8 pointer-events-none transition-all duration-700 animate-pulse"
              style={{
                background: currentTheme.glowGradient,
                filter: currentTheme.glowBlur,
                opacity: currentTheme.glowOpacity * glowScale,
                animationDuration: '5s',
              }}
            />
            <div 
              className="absolute -inset-12 pointer-events-none transition-all duration-700"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${currentTheme.accentColor} 0%, transparent 70%)`,
                filter: 'blur(100px)',
                opacity: 0.4 * glowScale,
              }}
            />
          </>
        )}

        <div 
          className="relative w-full h-full pointer-events-auto z-10 overflow-hidden transition-transform duration-500"
          style={{
            transform: isWatchPage ? frameStyle.videoScaleTransform : 'scale(1.0)',
          }}
        >
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
            onError={(err: any) => errorRecoveryManager.handlePlayerError(err)}
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
                className="absolute inset-0 bg-black/60 flex flex-col justify-between p-2.5"
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
    </div>
  );
}

