import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Captions,
  Film,
  Sliders,
  Tv,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { Video } from '../../types';
import { useAppStore } from '../../store';
import { omsTransitionService } from '../../services/omsTransitionService';

export interface UTubePlayerProps {
  video: Video;
  onNext?: () => void;
  onPrev?: () => void;
  initialTime?: number;
  theaterMode?: boolean;
  onToggleTheaterMode?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number, isPlaying: boolean) => void;
  className?: string;
}

export const UTubePlayer: React.FC<UTubePlayerProps> = ({
  video,
  onNext,
  onPrev,
  initialTime = 0,
  theaterMode = false,
  onToggleTheaterMode,
  onTimeUpdate,
  className = '',
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  const { addToHistory, saveWatchPosition } = useAppStore();

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [bufferedFraction, setBufferedFraction] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [autoPlayOn, setAutoPlayOn] = useState(true);

  // UI state
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsSubmenu, setSettingsSubmenu] = useState<'main' | 'speed' | 'quality'>('main');
  const [selectedQuality, setSelectedQuality] = useState('Auto (1080p)');
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPositionX, setHoverPositionX] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show transient HUD Toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  }, []);

  // PostMessage helper for YouTube iframe API
  const sendIframeCommand = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }, []);

  // Auto-hide controls timer
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && !showSettingsMenu && !isScrubbing) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2400);
    }
  }, [isPlaying, showSettingsMenu, isScrubbing]);

  // Initial time seek
  useEffect(() => {
    if (initialTime > 0) {
      const timer = setTimeout(() => {
        sendIframeCommand('seekTo', [initialTime, true]);
        setCurrentTime(initialTime);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [initialTime, sendIframeCommand]);

  // Periodic polling for progress & state from iframe
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      if (isPlaying && !isScrubbing) {
        setCurrentTime((prev) => {
          const next = duration > 0 ? Math.min(duration, prev + 0.25) : prev + 0.25;
          onTimeUpdate?.(next, duration, isPlaying);
          return next;
        });
      }
    }, 250);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isPlaying, isScrubbing, duration, onTimeUpdate]);

  // Listen for iframe postMessages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number' && !isScrubbing) {
            setCurrentTime(data.info.currentTime);
            onTimeUpdate?.(data.info.currentTime, duration, isPlaying);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (typeof data.info.videoLoadedFraction === 'number') {
            setBufferedFraction(data.info.videoLoadedFraction);
          }
          if (typeof data.info.playerState === 'number') {
            if (data.info.playerState === 1) setIsPlaying(true);
            else if (data.info.playerState === 2) setIsPlaying(false);
            else if (data.info.playerState === 0) {
              setIsPlaying(false);
              onNext?.();
            }
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isScrubbing, duration, isPlaying, onNext, onTimeUpdate]);

  // Save history on initial playback
  useEffect(() => {
    if (video?.id) {
      addToHistory(video, currentTime, duration);
    }
  }, [video, addToHistory, currentTime, duration]);

  // Save watch position on unmount
  useEffect(() => {
    return () => {
      if (video?.id && currentTime > 0) {
        saveWatchPosition(video.id, currentTime, duration);
      }
    };
  }, [video?.id, currentTime, duration, saveWatchPosition]);

  // Play / Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      sendIframeCommand('pauseVideo');
      setIsPlaying(false);
      showToast('⏸ Paused');
    } else {
      sendIframeCommand('playVideo');
      setIsPlaying(true);
      showToast('▶ Playing');
    }
  }, [isPlaying, sendIframeCommand, showToast]);

  // Seek relative
  const seekRelative = useCallback(
    (offsetSecs: number) => {
      const target = Math.max(0, Math.min(duration || Infinity, currentTime + offsetSecs));
      setCurrentTime(target);
      sendIframeCommand('seekTo', [target, true]);
      showToast(offsetSecs > 0 ? `⏩ +${offsetSecs}s` : `⏪ ${offsetSecs}s`);
    },
    [currentTime, duration, sendIframeCommand, showToast]
  );

  // Volume
  const handleVolumeChange = useCallback(
    (newVol: number) => {
      setVolume(newVol);
      setIsMuted(newVol === 0);
      sendIframeCommand('setVolume', [Math.round(newVol * 100)]);
      if (newVol > 0) sendIframeCommand('unMute');
    },
    [sendIframeCommand]
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      sendIframeCommand('unMute');
      sendIframeCommand('setVolume', [Math.round((volume || 0.8) * 100)]);
      showToast('🔊 Unmuted');
    } else {
      setIsMuted(true);
      sendIframeCommand('mute');
      showToast('🔇 Muted');
    }
  }, [isMuted, volume, sendIframeCommand, showToast]);

  // Playback speed
  const handleSetSpeed = useCallback(
    (speed: number) => {
      setPlaybackSpeed(speed);
      sendIframeCommand('setPlaybackRate', [speed]);
      setShowSettingsMenu(false);
      showToast(`⚡ Speed: ${speed}x`);
    },
    [sendIframeCommand, showToast]
  );

  // Subtitles / CC Toggle
  const toggleSubtitles = useCallback(() => {
    const next = !subtitlesOn;
    setSubtitlesOn(next);
    sendIframeCommand(next ? 'loadModule' : 'unloadModule', ['captions']);
    showToast(next ? '💬 Subtitles / CC On' : '💬 Subtitles / CC Off');
  }, [subtitlesOn, sendIframeCommand, showToast]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'j':
        case 'arrowleft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'l':
        case 'arrowright':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.05));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.05));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'c':
          e.preventDefault();
          toggleSubtitles();
          break;
        case 't':
          e.preventDefault();
          onToggleTheaterMode?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seekRelative,
    handleVolumeChange,
    volume,
    toggleMute,
    toggleFullscreen,
    toggleSubtitles,
    onToggleTheaterMode,
  ]);

  // OMS Contextual Experience Handoff
  const handleOMSHandoff = () => {
    showToast('✨ Preserving context & opening OmniStream...');
    omsTransitionService.captureAndHandoffToGateway(
      {
        video,
        currentTime,
        duration,
        isPlaying,
      },
      navigate
    );
  };

  // Progress Bar Seek Calculation
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current || !duration) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;
    setCurrentTime(targetTime);
    sendIframeCommand('seekTo', [targetTime, true]);
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current || !duration) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverPositionX(e.clientX - rect.left);
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || secs < 0) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remSecs = Math.floor(secs % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(remSecs)}`;
    }
    return `${mins}:${pad(remSecs)}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = Math.min(100, bufferedFraction * 100);

  // ── Render: Theater A (U-Tube Blue Theater Environment) vs Standard Player ────
  return (
    <div
      className={
        theaterMode
          ? 'relative w-full min-h-[75vh] sm:min-h-[82vh] md:min-h-[86vh] flex flex-col justify-between p-2 sm:p-4 bg-gradient-to-b from-[#060a14] via-[#03060c] to-[#010204] rounded-3xl border border-sky-950/70 shadow-[0_25px_90px_rgba(2,132,199,0.18)] overflow-hidden transition-all duration-500 my-2'
          : 'relative w-full'
      }
    >
      {/* ── Theater A: Architectural Blue Side-Wall Strip Lights ── */}
      {theaterMode && (
        <>
          {/* Ambient Blue Radial Backlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[90%] bg-sky-600/12 rounded-full blur-[160px] pointer-events-none" />

          {/* Left Wall Strip Light */}
          <div className="absolute left-2 sm:left-4 top-10 bottom-16 w-1 sm:w-1.5 bg-gradient-to-b from-transparent via-sky-400 to-transparent rounded-full shadow-[0_0_15px_rgba(56,189,248,0.7)] opacity-70 pointer-events-none" />

          {/* Right Wall Strip Light */}
          <div className="absolute right-2 sm:right-4 top-10 bottom-16 w-1 sm:w-1.5 bg-gradient-to-b from-transparent via-sky-400 to-transparent rounded-full shadow-[0_0_15px_rgba(56,189,248,0.7)] opacity-70 pointer-events-none" />

          {/* Top Control Bar in U-Tube Theater */}
          <div className="relative z-30 w-full flex items-center justify-between px-2 sm:px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-sky-300 font-bold uppercase tracking-wider font-sans">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
              <span>U-Tube Modern Cinema</span>
              <span className="text-[10px] font-mono font-medium text-sky-400/60 lowercase hidden sm:inline">
                (immersive theater layout)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* OMS Contextual Experience Transition Button */}
              <button
                onClick={handleOMSHandoff}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Transition active viewing context to CineMorph Virtual Theater"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>OMS Immersion</span>
              </button>

              {/* Exit Theater Mode */}
              <button
                onClick={onToggleTheaterMode}
                className="p-1.5 rounded-full bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/40 text-sky-300 hover:text-white text-xs transition-colors cursor-pointer"
                title="Exit Theater Mode (t)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── True Full-Screen Immersive Video Viewport Container with Default Cinema Horizontal Curvature ── */}
      <div
        ref={containerRef}
        onMouseMove={resetControlsTimer}
        onMouseEnter={() => setControlsVisible(true)}
        onMouseLeave={() => isPlaying && setControlsVisible(false)}
        className={`relative w-full bg-black overflow-hidden select-none group font-sans transition-all duration-500 ${
          theaterMode
            ? 'flex-1 aspect-video w-full border border-sky-800/40 shadow-[0_25px_80px_rgba(0,0,0,0.98),-18px_0_36px_-8px_rgba(2,132,199,0.3),18px_0_36px_-8px_rgba(2,132,199,0.3)]'
            : `aspect-video rounded-2xl shadow-2xl ${className}`
        }`}
        style={
          theaterMode
            ? {
                perspective: '1200px',
                transform: 'perspective(1200px) rotateX(0.55deg)',
                borderRadius: '14px 14px 32px 32px / 8px 8px 18px 18px',
              }
            : undefined
        }
      >
        {/* Subtle Horizontal Curved Screen Side Depth Vignettes (U-Tube Theater Default) */}
        {theaterMode && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-14 pointer-events-none z-20 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-14 pointer-events-none z-20 bg-gradient-to-l from-black/55 via-black/15 to-transparent" />
          </>
        )}

        {/* ── Video Surface (YouTube Embed) ── */}
        <iframe
          ref={iframeRef}
          id="utube-video-iframe"
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
            typeof window !== 'undefined' ? window.location.origin : ''
          )}&rel=0&playsinline=1&controls=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 pointer-events-auto"
        />

        {/* ── HUD Toast Feedback ── */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── Master Interactive Controls Scrim ── */}
        <div
          className={`absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 transition-opacity duration-300 pointer-events-none ${
            controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Header Scrim */}
          <div className="w-full flex items-center justify-between gap-4 pointer-events-auto">
            <h2 className="text-white text-sm sm:text-base font-semibold drop-shadow-md truncate max-w-xl">
              {video.title}
            </h2>

            <div className="flex items-center gap-2">
              {/* OMS Contextual Handoff Trigger */}
              <button
                onClick={handleOMSHandoff}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-md"
                title="Preserve active viewing context and open OmniStream transition hub"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>OMS</span>
              </button>
            </div>
          </div>

          {/* Center Play/Pause Surface */}
          <div
            onClick={togglePlay}
            className="flex-1 w-full flex items-center justify-center cursor-pointer pointer-events-auto"
          >
            {!isPlaying && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
              </div>
            )}
          </div>

          {/* Bottom Controls Deck */}
          <div className="w-full space-y-2 pointer-events-auto bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 sm:p-3 rounded-2xl">
            {/* Progress Track */}
            <div
              ref={progressTrackRef}
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarMouseMove}
              onMouseLeave={() => setHoverTime(null)}
              className="relative w-full h-1.5 hover:h-2.5 bg-white/25 rounded-full cursor-pointer transition-all flex items-center group/track"
            >
              {/* Buffered Progress */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/40 rounded-full transition-all duration-200"
                style={{ width: `${bufferedPercent}%` }}
              />

              {/* Current Played Progress */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-red-600 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />

              {/* Scrubber Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-red-600 shadow-md group-hover/track:scale-125 transition-transform"
                style={{ left: `calc(${Math.min(100, Math.max(0, progressPercent))}% - 6px)` }}
              />

              {/* Hover Preview Tooltip */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-8 -translate-x-1/2 px-2 py-1 rounded bg-black/90 text-white text-[10px] font-mono font-bold shadow-md pointer-events-none"
                  style={{ left: `${hoverPositionX}px` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white text-xs pt-1">
              {/* Left: Playback & Volume */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause (k / space)' : 'Play (k / space)'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <button
                  onClick={() => seekRelative(-10)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Rewind 10 seconds (j)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => seekRelative(10)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Fast forward 10 seconds (l)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-14 sm:w-20 h-1 bg-white/30 accent-red-600 rounded-lg cursor-pointer transition-all"
                  />
                </div>

                {/* Timestamp */}
                <div className="text-[11px] text-gray-300 font-mono tracking-tight ml-1">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-gray-500 mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right: Settings, Theater Toggle, Fullscreen */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Subtitles */}
                <button
                  onClick={toggleSubtitles}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    subtitlesOn ? 'text-red-400 bg-white/10 font-bold' : 'text-gray-300 hover:text-white'
                  }`}
                  title="Subtitles / Closed Captions (c)"
                >
                  <Captions className="w-4 h-4" />
                </button>

                {/* Settings Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSettingsMenu((s) => !s);
                      setSettingsSubmenu('main');
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      showSettingsMenu ? 'text-red-400 bg-white/10' : 'text-gray-300 hover:text-white'
                    }`}
                    title="Playback Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {showSettingsMenu && (
                    <div
                      className="absolute right-0 bottom-8 w-56 bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl text-xs space-y-1 z-50 text-gray-200 animate-in fade-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {settingsSubmenu === 'main' ? (
                        <>
                          <button
                            onClick={() => setSettingsSubmenu('speed')}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 text-left transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Sliders className="w-3.5 h-3.5 text-gray-400" />
                              <span>Playback Speed</span>
                            </span>
                            <span className="text-gray-400 flex items-center gap-1 font-mono">
                              {playbackSpeed}x <ChevronRight className="w-3 h-3" />
                            </span>
                          </button>

                          <button
                            onClick={() => setSettingsSubmenu('quality')}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 text-left transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Tv className="w-3.5 h-3.5 text-gray-400" />
                              <span>Quality</span>
                            </span>
                            <span className="text-gray-400 flex items-center gap-1 font-mono">
                              {selectedQuality} <ChevronRight className="w-3 h-3" />
                            </span>
                          </button>
                        </>
                      ) : settingsSubmenu === 'speed' ? (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1 border-b border-white/10 flex items-center justify-between">
                            <span>Playback Speed</span>
                            <button
                              onClick={() => setSettingsSubmenu('main')}
                              className="text-red-400 hover:underline"
                            >
                              Back
                            </button>
                          </div>
                          {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSetSpeed(s)}
                              className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                playbackSpeed === s ? 'bg-red-600/20 text-red-400 font-bold' : 'hover:bg-white/10'
                              }`}
                            >
                              <span>{s === 1.0 ? 'Normal (1.0x)' : `${s}x`}</span>
                              {playbackSpeed === s && <Check className="w-3.5 h-3.5 text-red-400" />}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1 border-b border-white/10 flex items-center justify-between">
                            <span>Stream Quality</span>
                            <button
                              onClick={() => setSettingsSubmenu('main')}
                              className="text-red-400 hover:underline"
                            >
                              Back
                            </button>
                          </div>
                          {['Auto (1080p)', '1080p HD', '720p HD', '480p', '360p'].map((q) => (
                            <button
                              key={q}
                              onClick={() => {
                                setSelectedQuality(q);
                                setShowSettingsMenu(false);
                                showToast(`📺 Quality: ${q}`);
                              }}
                              className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                                selectedQuality === q ? 'bg-red-600/20 text-red-400 font-bold' : 'hover:bg-white/10'
                              }`}
                            >
                              <span>{q}</span>
                              {selectedQuality === q && <Check className="w-3.5 h-3.5 text-red-400" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Theater Mode Toggle */}
                {onToggleTheaterMode && (
                  <button
                    onClick={onToggleTheaterMode}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      theaterMode ? 'text-sky-400 bg-sky-500/20' : 'text-gray-300 hover:text-white'
                    }`}
                    title="U-Tube Theater layout mode (t)"
                  >
                    <Tv className="w-4 h-4" />
                  </button>
                )}

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Fullscreen (f)"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
