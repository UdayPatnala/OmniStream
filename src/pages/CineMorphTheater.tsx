/**
 * CineMorphTheater.tsx
 * V2 — Virtual Movie Theater Experience
 *
 * P1 Vision: The application becomes the walls, lights, screen, and atmosphere.
 * The video is the movie. The AI is the invisible cinematographer.
 *
 * Rules:
 * - NO sidebar, NO feed, NO top navigation during playback
 * - Theater lighting responds to actual player state (PLAYING → dark room, PAUSED → soft ambient)
 * - Controls auto-hide, remain keyboard-accessible
 * - No fake AI claims, no fake processing
 * - Fallback is always honest Original Mode
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { useAppStore } from '../store';
import { getVideosByIds } from '../lib/youtube';
import { Video, AudioPreset, FrameAspectRatio, CineMorphTheme, GlowIntensity } from '../types';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Film, Monitor, ArrowLeft, RotateCcw, ChevronRight,
  Sparkles, HelpCircle, X, Keyboard, Sliders, Maximize2,
  Sun, FileText, Check, ListFilter
} from 'lucide-react';
import { 
  audioEngine, 
  THEME_CONFIGS, 
  calculateFrameStyle, 
  generateAISummary, 
  extractVideoScript, 
  generateSceneHighlights 
} from '../lib/cinemorph';

// Playback state that drives lighting
type TheaterState = 'pre-show' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export function CineMorphTheater() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    activeVideo, setActiveVideo, versionMode, history, cinemaMode, setCinemaMode,
    audioEQ, setAudioEQ,
    frameAspectRatio, setFrameAspectRatio,
    reframeMode,
    cinemorphTheme, setCinemorphTheme,
    glowIntensity, setGlowIntensity
  } = useAppStore();

  // ── Player ref & state ──────────────────────────────────────────────────────
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [video, setVideo] = useState<Video | null>(
    activeVideo?.id === id ? activeVideo : null
  );
  const [theaterState, setTheaterState] = useState<TheaterState>('pre-show');
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);         // 0–1 fraction
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [presentationMode, setPresentationMode] = useState<'cinema' | 'original'>(
    cinemaMode ? 'cinema' : 'original'
  );
  const [entryComplete, setEntryComplete] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showStudioDrawer, setShowStudioDrawer] = useState(false);
  const [hudToast, setHudToast] = useState<string | null>(null);

  // Scrubber Hover Tooltip state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosPercent, setHoverPosPercent] = useState<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setHudToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setHudToast(null), 2500);
  }, []);

  // ── Load video metadata ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const historyEntry = history[id];
    const startPos = historyEntry?.progress && historyEntry.progress > 10 ? historyEntry.progress : 0;

    const fallback: Video = {
      id,
      title: activeVideo?.id === id ? activeVideo.title : 'Loading…',
      description: '',
      channelId: activeVideo?.channelId || '',
      channelTitle: activeVideo?.channelTitle || '',
      publishedAt: activeVideo?.publishedAt || new Date().toISOString(),
      thumbnails: {
        medium: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        high:   `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      },
    };

    setVideo(fallback);
    if (!activeVideo || activeVideo.id !== id) setActiveVideo(fallback);
    setTheaterState('loading');

    const entryTimer = setTimeout(() => setEntryComplete(true), 500);

    getVideosByIds([id]).then((vids) => {
      if (vids.length > 0) {
        setVideo(vids[0]);
        setActiveVideo(vids[0]);
      }
    }).catch(() => {});

    if (startPos > 0) {
      const seekTimer = setTimeout(() => {
        playerRef.current?.seekTo(startPos, 'seconds');
      }, 1800);
      return () => { clearTimeout(entryTimer); clearTimeout(seekTimer); };
    }

    return () => clearTimeout(entryTimer);
  }, [id]);

  // ── Auto-hide controls ──────────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (theaterState === 'playing' && !showShortcuts && !showStudioDrawer) {
      controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
    }
  }, [theaterState, showShortcuts, showStudioDrawer]);

  useEffect(() => {
    if (theaterState !== 'playing' || showShortcuts || showStudioDrawer) {
      setControlsVisible(true);
    } else {
      resetControlsTimer();
    }
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [theaterState, showShortcuts, showStudioDrawer, resetControlsTimer]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      resetControlsTimer();
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setPlaying(p => !p);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playerRef.current?.seekTo(Math.max(0, (playerRef.current.getCurrentTime() || 0) - 10), 'seconds');
          break;
        case 'ArrowRight':
          e.preventDefault();
          playerRef.current?.seekTo((playerRef.current.getCurrentTime() || 0) + 10, 'seconds');
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'KeyM':
          setMuted(m => !m);
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'KeyC':
          togglePresentationMode();
          break;
        case 'KeyH':
        case 'Slash':
          if (e.shiftKey || e.code === 'KeyH') {
            setShowShortcuts(s => !s);
          }
          break;
        case 'Escape':
          if (showShortcuts) setShowShortcuts(false);
          else if (showStudioDrawer) setShowStudioDrawer(false);
          else if (!isFullscreen) exitTheater();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, showShortcuts, showStudioDrawer, resetControlsTimer]);

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ── Player callbacks ────────────────────────────────────────────────────────
  const handleReady = () => {
    setTheaterState('paused');
    setPlaying(true);
    try {
      audioEngine.init();
      audioEngine.applyConfig(audioEQ);
    } catch (e) {}
  };

  const handlePlay = () => {
    setTheaterState('playing');
    setPlaying(true);
  };

  const handlePause = () => {
    setTheaterState('paused');
    setPlaying(false);
  };

  const handleEnded = () => {
    setTheaterState('ended');
    setPlaying(false);
  };

  const handleError = () => {
    setTheaterState('error');
    setPlaying(false);
  };

  const handleProgress = ({ played: p, playedSeconds }: { played: number; playedSeconds: number }) => {
    if (!seeking) setPlayed(p);
    if (video && duration > 0 && Math.round(playedSeconds) % 10 === 0) {
      useAppStore.getState().addToHistory(video, Math.floor(playedSeconds), duration);
    }
  };

  const handleDuration = (d: number) => setDuration(d);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeeking(true);
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosPercent(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleScrubberMouseLeave = () => {
    setHoverPosPercent(null);
    setHoverTime(null);
  };

  // ── Quick Action Cyclers ──────────────────────────────────────────────────
  const cycleAudioPreset = () => {
    const presets: AudioPreset[] = ['dialogue-boost', 'spatial-3d', 'bass-heavy', 'night-compression', 'original'];
    const currentIdx = presets.indexOf(audioEQ.preset as AudioPreset);
    const nextPreset = presets[(currentIdx + 1) % presets.length];
    const newConfig = audioEngine.getPresetConfig(nextPreset);
    setAudioEQ(newConfig);
    audioEngine.applyConfig(newConfig);
    showToast(`🎧 Audio Studio: ${nextPreset.toUpperCase().replace('-', ' ')}`);
  };

  const cycleAspectRatio = () => {
    const ratios: FrameAspectRatio[] = ['16:9', '21:9', '4:3', '1:1'];
    const currentIdx = ratios.indexOf(frameAspectRatio);
    const nextRatio = ratios[(currentIdx + 1) % ratios.length];
    setFrameAspectRatio(nextRatio);
    showToast(`🎬 Viewport Reframe: ${nextRatio === '21:9' ? '21:9 UltraWide Cinema' : nextRatio}`);
  };

  const cycleTheme = () => {
    const themes: CineMorphTheme[] = ['imax-ultra', 'cyberpunk-oled', 'cinematic-dark', 'golden-hour', 'glassmorphic-neon'];
    const currentIdx = themes.indexOf(cinemorphTheme);
    const nextTheme = themes[(currentIdx + 1) % themes.length];
    setCinemorphTheme(nextTheme);
    showToast(`🌌 Ambient Theme: ${nextTheme.toUpperCase().replace('-', ' ')}`);
  };

  const cycleDimmer = () => {
    const levels: GlowIntensity[] = ['ultra', 'medium', 'low', 'off'];
    const currentIdx = levels.indexOf(glowIntensity);
    const nextLevel = levels[(currentIdx + 1) % levels.length];
    setGlowIntensity(nextLevel);
    showToast(`💡 Ambient Dimmer: ${nextLevel.toUpperCase()}`);
  };

  // ── Presentation Mode ───────────────────────────────────────────────────────
  const togglePresentationMode = () => {
    const next = presentationMode === 'cinema' ? 'original' : 'cinema';
    setPresentationMode(next);
    setCinemaMode(next === 'cinema');
    showToast(next === 'cinema' ? '🎬 Cinema Presentation Activated' : '📺 Standard Mode Activated');
  };

  // ── Exit theater ────────────────────────────────────────────────────────────
  const exitTheater = () => {
    if (versionMode === 'v2') navigate('/');
    else navigate(-1);
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentThemeConfig = THEME_CONFIGS[cinemorphTheme] || THEME_CONFIGS['cinematic-dark'];
  const frameStyle = calculateFrameStyle(frameAspectRatio, reframeMode);

  // Intelligence metadata
  const aiSummary = video ? generateAISummary(video) : null;
  const scriptChunks = video ? extractVideoScript(video) : [];
  const highlights = video ? generateSceneHighlights(video) : [];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 select-none font-sans"
      style={{
        backgroundColor: theaterState === 'playing' ? '#030206' : currentThemeConfig.background,
      }}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* ── Dynamic Ambient Bloom (Ambilight) ── */}
      {presentationMode === 'cinema' && glowIntensity !== 'off' && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000 z-0"
          style={{
            background: currentThemeConfig.glowGradient,
            filter: currentThemeConfig.glowBlur,
            opacity: theaterState === 'playing' ? (glowIntensity === 'ultra' ? 0.9 : 0.6) : 0.35,
            transform: 'translate3d(0, 0, 0)',
            willChange: 'opacity, filter',
          }}
        />
      )}

      {/* ── Subtle Theater Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 65%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* ── Cinema Entry Fade ── */}
      <div
        className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-700 z-30 ${entryComplete ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* ── HUD Toast Banner Alert ── */}
      {hudToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-black/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wide shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {hudToast}
        </div>
      )}

      {/* ── Pre-show / Loading state ── */}
      {theaterState === 'pre-show' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-4">
          <div className="flex items-center gap-3 text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400">Now Entering Cinema</span>
          </div>
          <div className="text-white text-xl font-semibold opacity-60">{video?.title || '…'}</div>
        </div>
      )}

      {/* ── The Cinema Screen Container ── */}
      <div
        className={`relative w-full transition-all duration-700 ${
          isFullscreen
            ? 'h-full w-full'
            : `max-w-[94vw] max-h-[82vh] ${frameStyle.containerAspectClass}`
        } flex items-center justify-center z-10 overflow-hidden rounded-md shadow-2xl`}
        style={{
          filter: presentationMode === 'cinema' ? 'brightness(1.03) contrast(1.02)' : 'none',
        }}
      >
        <div
          className="w-full h-full transition-transform duration-500"
          style={{
            transform: presentationMode === 'cinema' ? frameStyle.videoScaleTransform : 'none',
          }}
        >
          <Player
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${id}`}
            width="100%"
            height="100%"
            playing={playing}
            volume={volume}
            muted={muted}
            onReady={handleReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            onProgress={handleProgress}
            onDuration={handleDuration}
            config={{
              playerVars: {
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                fs: 0,
                playsinline: 1,
              },
            }}
          />
        </div>
      </div>

      {/* ── Floating Controls Deck (Vanishing Interface) ── */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-4xl transition-all duration-500 ${
          controlsVisible || theaterState !== 'playing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        aria-hidden={!controlsVisible && theaterState === 'playing'}
      >
        <div className="bg-[#090712]/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-3">
          {/* Interactive Seekbar with Hover Tooltip */}
          <div 
            className="relative group cursor-pointer"
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={handleScrubberMouseLeave}
          >
            {hoverPosPercent !== null && hoverTime !== null && (
              <div 
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 pointer-events-none shadow-lg"
                style={{ left: `${hoverPosPercent}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}

            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={played}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="w-full h-1.5 group-hover:h-2 transition-all appearance-none bg-white/15 rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(34,211,238,0.9) 0%, rgba(34,211,238,0.9) ${played * 100}%, rgba(255,255,255,0.15) ${played * 100}%, rgba(255,255,255,0.15) 100%)`,
              }}
              aria-label="Seek"
            />
          </div>

          {/* Controls Bar Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={exitTheater}
                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                aria-label="Leave cinema"
                title="Exit Cinema"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPlaying(p => !p)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-md"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => setMuted(m => !m)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="w-16 sm:w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer hidden sm:block"
                aria-label="Volume"
              />

              <span className="text-[11px] text-gray-400 tabular-nums font-mono">
                {formatTime(played * duration)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Tools & Quick Cyclers */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Audio EQ Preset Cycle */}
              <button
                onClick={cycleAudioPreset}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-gray-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
                title="Cycle Audio Preset"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline text-[11px] capitalize">{audioEQ.preset.replace('-', ' ')}</span>
              </button>

              {/* Aspect Ratio Cycle */}
              <button
                onClick={cycleAspectRatio}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-gray-300 hover:text-purple-300 transition-all flex items-center gap-1.5"
                title="Cycle Viewport Ratio"
              >
                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline text-[11px]">{frameAspectRatio}</span>
              </button>

              {/* Ambient Glow Dimmer Cycle */}
              <button
                onClick={cycleDimmer}
                className="p-1.5 text-gray-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-white/10"
                title={`Ambient Dimmer (${glowIntensity})`}
              >
                <Sun className="w-4 h-4" />
              </button>

              {/* Cinema Studio Drawer Button */}
              <button
                onClick={() => setShowStudioDrawer(s => !s)}
                className={`p-1.5 rounded-lg transition-colors ${showStudioDrawer ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Scene Highlights & Cinema Intelligence"
              >
                <FileText className="w-4 h-4" />
              </button>

              {/* Shortcuts HUD Button */}
              <button
                onClick={() => setShowShortcuts(s => !s)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cinema Intelligence Slide-Over Drawer ── */}
      {showStudioDrawer && (
        <div 
          className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#0a0814]/95 border-l border-cyan-500/30 p-5 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Cinema Intelligence Studio</span>
              </div>
              <button 
                onClick={() => setShowStudioDrawer(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scene Highlights */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
                Synchronized Scene Highlights
              </div>
              <div className="space-y-1.5">
                {highlights.map(h => (
                  <button
                    key={h.id}
                    onClick={() => {
                      playerRef.current?.seekTo(h.timestamp, 'seconds');
                      showToast(`⏱️ Jumped to: ${h.title}`);
                    }}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="text-xs font-semibold text-gray-300 group-hover:text-white truncate max-w-[200px]">
                      {h.title}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {formatTime(h.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Summary Breakdown */}
            {aiSummary && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Executive Breakdown
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {aiSummary.executiveSummary}
                </p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-500 text-center pt-4 border-t border-white/5">
            CineMorph Neural Media Studio
          </div>
        </div>
      )}

      {/* ── Keyboard Shortcuts HUD Overlay ── */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0e0c14] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-white font-semibold">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                <span>Cinema Theater Shortcuts</span>
              </div>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300">
              <div className="flex items-center justify-between py-1">
                <span>Play / Pause</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">Space</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Seek Forward / Backward 10s</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">➔ / ⬅</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Volume Up / Down</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">⬆ / ⬇</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Mute / Unmute</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">M</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Toggle Fullscreen</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">F</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Toggle Presentation Mode</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">C</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Exit Theater / Close Overlays</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">Esc</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Toggle Shortcuts Help</span>
                <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-cyan-300 border border-white/10">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

