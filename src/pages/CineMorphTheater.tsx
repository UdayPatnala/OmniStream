/**
 * CineMorphTheater.tsx
 * V2 — Virtual Movie Theater Experience
 *
 * P1 Vision: The application becomes the walls, lights, screen, and atmosphere.
 * The video is the movie. The AI is the invisible cinematographer.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { getVideosByIds, getRelatedVideos } from '../lib/youtube';
import { Video, AudioPreset, FrameAspectRatio, CineMorphTheme, GlowIntensity, LocalMediaItem } from '../types';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Film, Monitor, ArrowLeft, RotateCcw, ChevronRight,
  Sparkles, HelpCircle, X, Keyboard, Sliders, Maximize2,
  Sun, FileText, Check, ListFilter, HardDrive, Armchair,
  Eye, RefreshCw, Layers, Zap
} from 'lucide-react';
import { 
  audioEngine, 
  THEME_CONFIGS, 
  calculateFrameStyle, 
  generateAISummary, 
  extractVideoScript, 
  generateSceneHighlights,
  localVideoAnalyzer,
  hybridMediaRouter
} from '../lib/cinemorph';

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
    glowIntensity, setGlowIntensity,
    activeLocalMedia, localMediaHistory, addLocalMediaToHistory,
    theaterSeatingEnabled, setTheaterSeatingEnabled,
    curtainAnimationEnabled, setCurtainAnimationEnabled,
    ecoMode, setEcoMode, devicePerformanceProfile
  } = useAppStore();

  const isLocalMedia = id?.startsWith('local-') || !!activeLocalMedia;
  const localItem: LocalMediaItem | undefined = isLocalMedia
    ? (activeLocalMedia?.id === id ? activeLocalMedia : localMediaHistory[id || ''])
    : undefined;

  // ── Refs ────────────────────────────────────────────────────────────────────
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameAnalysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── States ──────────────────────────────────────────────────────────────────
  const [video, setVideo] = useState<Video | null>(
    activeVideo?.id === id ? activeVideo : null
  );
  const [theaterState, setTheaterState] = useState<TheaterState>('playing');
  const [playing, setPlaying] = useState(true);
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
  const [curtainsOpen, setCurtainsOpen] = useState(!curtainAnimationEnabled);
  const [showIntroBumper, setShowIntroBumper] = useState(curtainAnimationEnabled);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showStudioDrawer, setShowStudioDrawer] = useState(false);
  const [hudToast, setHudToast] = useState<string | null>(null);
  const [dynamicBloomColor, setDynamicBloomColor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [nextUpCountdown, setNextUpCountdown] = useState<number | null>(null);

  // Fetch recommendations for end-screen spotlight
  useEffect(() => {
    if (!id) return;
    getRelatedVideos(id).then(vids => {
      setRecommendations(vids.slice(0, 4));
    }).catch(() => {});
  }, [id]);

  // End-Screen Auto-Play countdown timer
  useEffect(() => {
    if (theaterState !== 'ended') {
      setNextUpCountdown(null);
      return;
    }

    setNextUpCountdown(10);
    const interval = setInterval(() => {
      setNextUpCountdown((count) => {
        if (count === null) return null;
        if (count <= 1) {
          clearInterval(interval);
          if (recommendations.length > 0) {
            const nextVid = recommendations[0];
            setActiveVideo(nextVid);
            setShowIntroBumper(false);
            setTheaterState('playing');
            setPlaying(true);
            navigate(`/theater/${nextVid.id}`);
          }
          return null;
        }
        return count - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [theaterState, recommendations, navigate, setActiveVideo]);

  const handleDirectLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localId = `local-${Date.now()}`;
    const fileUrl = URL.createObjectURL(file);
    const newItem: LocalMediaItem = {
      id: localId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: fileUrl,
      duration: 0,
      progress: 0,
      lastWatchedAt: Date.now(),
    };
    useAppStore.getState().setActiveLocalMedia(newItem);
    useAppStore.getState().addLocalMediaToHistory(newItem);
    setShowIntroBumper(false);
    setTheaterState('playing');
    setPlaying(true);
    navigate(`/theater/${localId}`);
  };

  // Scrubber Hover Tooltip state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosPercent, setHoverPosPercent] = useState<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setHudToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setHudToast(null), 2500);
  }, []);

  // Send postMessage commands to YouTube IFrame
  const sendIframeCommand = useCallback((func: string, args: any[] = []) => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch (e) {}
  }, []);

  // ── Curtain Sequence ────────────────────────────────────────────────────────
  useEffect(() => {
    if (curtainAnimationEnabled) {
      const timer = setTimeout(() => {
        setCurtainsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setCurtainsOpen(true);
    }
  }, [curtainAnimationEnabled]);

  // ── Load Video / Media Metadata ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    if (isLocalMedia && localItem) {
      const localVideoObj: Video = {
        id: localItem.id,
        title: localItem.name,
        description: `Local file playback (${(localItem.size / (1024 * 1024)).toFixed(1)} MB). 100% private in browser memory.`,
        channelId: 'local_storage',
        channelTitle: 'Personal Media Library',
        publishedAt: new Date(localItem.lastWatchedAt).toISOString(),
        thumbnails: {
          medium: localItem.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
          high: localItem.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
        }
      };
      setVideo(localVideoObj);
      setActiveVideo(localVideoObj);
      setTheaterState('playing');
      setPlaying(true);
      setEntryComplete(true);
      return;
    }

    const historyEntry = history[id];
    const startPos = historyEntry?.progress && historyEntry.progress > 10 ? historyEntry.progress : 0;

    const fallback: Video = {
      id,
      title: activeVideo?.id === id ? activeVideo.title : 'Loading stream…',
      description: '',
      channelId: activeVideo?.channelId || '',
      channelTitle: activeVideo?.channelTitle || '',
      publishedAt: activeVideo?.publishedAt || new Date().toISOString(),
      thumbnails: {
        medium: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        high: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      },
    };

    setVideo(fallback);
    setActiveVideo(fallback);
    setTheaterState('playing');
    setPlaying(true);

    const entryTimer = setTimeout(() => setEntryComplete(true), 500);

    getVideosByIds([id]).then((vids) => {
      if (vids.length > 0) {
        setVideo(vids[0]);
        setActiveVideo(vids[0]);
      }
    }).catch(() => {});

    if (startPos > 0) {
      const seekTimer = setTimeout(() => {
        sendIframeCommand('seekTo', [startPos, true]);
      }, 1500);
      return () => { clearTimeout(entryTimer); clearTimeout(seekTimer); };
    }

    return () => clearTimeout(entryTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLocalMedia, localItem?.id]);

  // ── YouTube Message Listener ────────────────────────────────────────────────
  useEffect(() => {
    if (isLocalMedia) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (data && data.event === 'onStateChange') {
          if (data.info === 1) { // PLAYING
            setTheaterState('playing');
            setPlaying(true);
          } else if (data.info === 2) { // PAUSED
            setTheaterState('paused');
            setPlaying(false);
          } else if (data.info === 0) { // ENDED
            setTheaterState('ended');
            setPlaying(false);
            if (curtainAnimationEnabled) setCurtainsOpen(false);
          }
        }
        if (data && data.info) {
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (typeof data.info.currentTime === 'number' && !seeking) {
            const curTime = data.info.currentTime;
            if (duration > 0) {
              setPlayed(curTime / duration);
            }
            if (video && duration > 0 && Math.round(curTime) % 10 === 0) {
              useAppStore.getState().addToHistory(video, Math.floor(curTime), duration);
            }
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [curtainAnimationEnabled, duration, isLocalMedia, seeking, video]);

  const hybridDecision = hybridMediaRouter.determineRoute({
    isLocal: isLocalMedia,
    durationSeconds: duration,
    userEcoMode: ecoMode,
  });

  // ── Master Hybrid Routing & Adaptive Performance Sampling ────────
  useEffect(() => {
    if (!hybridDecision.enableDynamicAmbilight || hybridDecision.sampleIntervalMs <= 0) return;

    // Instant zero-wait cache lookup for immediate room glow
    if (localItem?.id && !showIntroBumper) {
      const cached = localVideoAnalyzer.getCachedAnalysis(localItem.id);
      if (cached) {
        setDynamicBloomColor(cached.dominantColor);
      }
    }

    frameAnalysisTimerRef.current = setInterval(() => {
      const activeVideoEl = showIntroBumper ? introVideoRef.current : (isLocalMedia ? localVideoRef.current : null);
      if (activeVideoEl && !activeVideoEl.paused) {
        // Non-blocking async sampling via requestIdleCallback / microtask
        const runSampling = () => {
          if (activeVideoEl) {
            const analysis = localVideoAnalyzer.analyzeVideoFrame(activeVideoEl, showIntroBumper ? 'cinema-intro' : localItem?.id);
            if (analysis) {
              setDynamicBloomColor(analysis.dominantColor);
            }
          }
        };

        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(runSampling, { timeout: 400 });
        } else {
          setTimeout(runSampling, 0);
        }
      }
    }, hybridDecision.sampleIntervalMs);

    return () => {
      if (frameAnalysisTimerRef.current) clearInterval(frameAnalysisTimerRef.current);
    };
  }, [isLocalMedia, localItem?.id, showIntroBumper, hybridDecision.enableDynamicAmbilight, hybridDecision.sampleIntervalMs]);

  // ── Auto-hide Controls ──────────────────────────────────────────────────────
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

  // ── Controls Handlers ───────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (isLocalMedia && localVideoRef.current) {
      if (localVideoRef.current.paused) {
        localVideoRef.current.play();
        setPlaying(true);
        setTheaterState('playing');
      } else {
        localVideoRef.current.pause();
        setPlaying(false);
        setTheaterState('paused');
      }
      return;
    }

    if (playing) {
      sendIframeCommand('pauseVideo');
      setPlaying(false);
      setTheaterState('paused');
    } else {
      sendIframeCommand('playVideo');
      setPlaying(true);
      setTheaterState('playing');
    }
  }, [isLocalMedia, playing, sendIframeCommand]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      resetControlsTimer();
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (duration > 0) {
            const target = Math.max(0, (played * duration) - 10);
            setPlayed(target / duration);
            if (isLocalMedia && localVideoRef.current) {
              localVideoRef.current.currentTime = target;
            } else {
              sendIframeCommand('seekTo', [target, true]);
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (duration > 0) {
            const target = Math.min(duration, (played * duration) + 10);
            setPlayed(target / duration);
            if (isLocalMedia && localVideoRef.current) {
              localVideoRef.current.currentTime = target;
            } else {
              sendIframeCommand('seekTo', [target, true]);
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => {
            const nv = Math.min(1, v + 0.1);
            if (isLocalMedia && localVideoRef.current) localVideoRef.current.volume = nv;
            else sendIframeCommand('setVolume', [Math.round(nv * 100)]);
            return nv;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => {
            const nv = Math.max(0, v - 0.1);
            if (isLocalMedia && localVideoRef.current) localVideoRef.current.volume = nv;
            else sendIframeCommand('setVolume', [Math.round(nv * 100)]);
            return nv;
          });
          break;
        case 'KeyM':
          setMuted(m => {
            const nm = !m;
            if (isLocalMedia && localVideoRef.current) localVideoRef.current.muted = nm;
            else sendIframeCommand(nm ? 'mute' : 'unMute');
            return nm;
          });
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
  }, [duration, isFullscreen, isLocalMedia, played, resetControlsTimer, sendIframeCommand, showShortcuts, showStudioDrawer, togglePlay]);

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

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeeking(true);
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    const fraction = parseFloat((e.target as HTMLInputElement).value);
    if (duration > 0) {
      const targetSecs = fraction * duration;
      if (isLocalMedia && localVideoRef.current) {
        localVideoRef.current.currentTime = targetSecs;
      } else {
        sendIframeCommand('seekTo', [targetSecs, true]);
      }
    }
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

  // ── Quick Cyclers ───────────────────────────────────────────────────────────
  const cycleAudioPreset = () => {
    const presets: AudioPreset[] = ['dialogue-boost', 'spatial-3d', 'bass-heavy', 'night-compression', 'original'];
    const currentIdx = presets.indexOf(audioEQ.preset as AudioPreset);
    const nextPreset = presets[(currentIdx + 1) % presets.length];
    const newConfig = audioEngine.getPresetConfig(nextPreset);
    setAudioEQ(newConfig);
    if (isLocalMedia && localVideoRef.current) {
      audioEngine.init(localVideoRef.current);
    }
    audioEngine.applyConfig(newConfig);
    const detail = newConfig.bassBoost > 0 
      ? `+${newConfig.bassBoost}dB Bass Boost` 
      : newConfig.dialogueClarity > 0 
      ? `+${newConfig.dialogueClarity}dB Vocal Boost` 
      : 'Original Curve';
    showToast(`🎧 Audio Studio: ${nextPreset.toUpperCase().replace('-', ' ')} (${detail})`);
  };

  const cycleAspectRatio = () => {
    const ratios: FrameAspectRatio[] = ['16:9', '21:9', '4:3', '1:1', '4.3:1'];
    const currentIdx = ratios.indexOf(frameAspectRatio);
    const nextRatio = ratios[(currentIdx + 1) % ratios.length];
    setFrameAspectRatio(nextRatio);
    showToast(`🎬 Viewport Reframe: ${nextRatio === '21:9' ? '21:9 UltraWide Cinema' : nextRatio === '4.3:1' ? '4.3:1 IMAX Aspect Ratio' : nextRatio}`);
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

  const togglePresentationMode = () => {
    const next = presentationMode === 'cinema' ? 'original' : 'cinema';
    setPresentationMode(next);
    setCinemaMode(next === 'cinema');
    showToast(next === 'cinema' ? '🎬 Cinema Presentation Activated' : '📺 Standard Mode Activated');
  };

  const exitTheater = () => {
    if (isLocalMedia) {
      navigate('/cinemorph');
    } else if (versionMode === 'v2') {
      navigate('/cinemorph');
    } else {
      navigate(-1);
    }
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
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 select-none font-sans bg-[#020205]"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* ── Dynamic Ambient Bloom (Ambilight) ── */}
      {presentationMode === 'cinema' && glowIntensity !== 'off' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000 z-0"
          style={{
            background: dynamicBloomColor 
              ? `radial-gradient(ellipse at center, ${dynamicBloomColor} 0%, rgba(3,2,6,0.85) 75%)`
              : currentThemeConfig.glowGradient,
            filter: currentThemeConfig.glowBlur,
            opacity: theaterState === 'playing' ? (glowIntensity === 'ultra' ? 0.9 : 0.6) : 0.35,
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      )}

      {/* ── Top-Right Fullscreen Header Badge ── */}
      <div className={`absolute top-4 right-6 z-30 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-xs font-bold text-indigo-300 shadow-xl shadow-indigo-950/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          title="Toggle Fullscreen Cinema Hall (Hotkey: F)"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Cinema'}</span>
        </button>
      </div>

      {/* ── Grand IMAX Laser Cinema Auditorium Architectural Layers ── */}
      {presentationMode === 'cinema' && (
        <>
          {/* Ceiling Arch Starfield & Scalloped Halogen Spotlights (matching IMAX reference) */}
          <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-1 flex flex-col justify-start items-center pt-1 overflow-hidden opacity-95">
            {/* Top Starfield Pinlights */}
            <div className="w-full max-w-6xl flex justify-between px-16 pt-1 opacity-70">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                <div key={`star-${p}`} className="w-1 h-1 rounded-full bg-cyan-200/60 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              ))}
            </div>

            {/* Scalloped Halogen Cones */}
            <div className="w-full max-w-5xl flex justify-between px-8 pt-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-2.5 h-1.5 rounded-full bg-amber-100 shadow-[0_0_15px_rgba(254,243,199,0.9)]" />
                  <div 
                    className="w-16 h-28 opacity-40 blur-sm pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center top, rgba(254, 243, 199, 0.6) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 80%)',
                      clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Left IMAX Laser Wall Column with Neon Blue Strip & Speaker Array */}
          <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-[#030308] via-[#080812] to-transparent pointer-events-none z-1 flex flex-col justify-between py-12 pl-3 sm:pl-6 border-r border-cyan-500/20 shadow-2xl opacity-95">
            {/* Upper Surround Speaker */}
            <div className="w-8 sm:w-10 h-14 rounded-md bg-[#0d0d16] border border-white/10 shadow-lg p-1 flex flex-col items-center justify-around">
              <div className="w-4 h-4 rounded-full bg-[#1c1c28] border border-cyan-500/30" />
              <div className="w-6 h-6 rounded-full bg-[#161622] border border-cyan-500/30" />
            </div>

            {/* Glowing IMAX Cyan Neon Emblem & Vertical Strip */}
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-32 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.95)]" />
              <div className="text-[10px] sm:text-xs font-black tracking-widest text-cyan-400 font-mono rotate-90 origin-left drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                IMAX
              </div>
            </div>

            {/* Low Green Emergency Exit Glow */}
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[8px] font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                EXIT
              </div>
            </div>
          </div>

          {/* Right IMAX Laser Wall Column with Neon Blue Strip & Speaker Array */}
          <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-[#030308] via-[#080812] to-transparent pointer-events-none z-1 flex flex-col justify-between py-12 pr-3 sm:pr-6 items-end border-l border-cyan-500/20 shadow-2xl opacity-95">
            {/* Upper Surround Speaker */}
            <div className="w-8 sm:w-10 h-14 rounded-md bg-[#0d0d16] border border-white/10 shadow-lg p-1 flex flex-col items-center justify-around">
              <div className="w-4 h-4 rounded-full bg-[#1c1c28] border border-cyan-500/30" />
              <div className="w-6 h-6 rounded-full bg-[#161622] border border-cyan-500/30" />
            </div>

            {/* Glowing IMAX Cyan Neon Emblem & Vertical Strip */}
            <div className="flex items-center gap-3">
              <div className="text-[10px] sm:text-xs font-black tracking-widest text-cyan-400 font-mono -rotate-90 origin-right drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                IMAX
              </div>
              <div className="w-1.5 h-32 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.95)]" />
            </div>

            {/* Low Green Emergency Exit Glow */}
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[8px] font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                EXIT
              </div>
            </div>
          </div>

          {/* Floor Carpet Reflection Aisle with IMAX Curved Boundary */}
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#020205] via-[#080710]/95 to-transparent pointer-events-none z-1 opacity-90" />
        </>
      )}

      {/* ── HUD Toast Banner Alert ── */}
      {hudToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-black/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wide shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {hudToast}
        </div>
      )}

      {/* ── The Cinema Screen Container ── */}
      <div
        className={`relative transition-all duration-700 ${
          isFullscreen
            ? 'max-h-[90vh] max-w-[98vw]'
            : frameAspectRatio === '4.3:1'
            ? 'w-full max-w-[98vw] max-h-[84vh]'
            : 'w-full max-w-[94vw] max-h-[78vh]'
        } flex items-center justify-center z-10 overflow-hidden shadow-2xl border border-white/10 bg-black`}
        style={{
          aspectRatio: frameStyle.aspectRatioStyle,
          filter: presentationMode === 'cinema' ? 'brightness(1.03) contrast(1.02)' : 'none',
          borderRadius: presentationMode === 'cinema' ? '6px 6px 36px 36px / 6px 6px 12px 12px' : '8px',
          transform: presentationMode === 'cinema' 
            ? (frameAspectRatio === '4.3:1' ? 'perspective(1200px) rotateX(1deg) scale(1.12)' : 'perspective(1200px) rotateX(1deg)') 
            : 'none',
          boxShadow: presentationMode === 'cinema' 
            ? '0 0 100px rgba(0,0,0,0.95), inset 0 0 50px rgba(0,0,0,0.9)' 
            : '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}
      >
        <div
          className="w-full h-full transition-transform duration-500 relative"
          style={{
            transform: presentationMode === 'cinema' ? frameStyle.videoScaleTransform : 'none',
          }}
        >
          {/* Dual Source Playback Element */}
          {showIntroBumper ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={introVideoRef}
                src="/Create_a_professional_cinemati.mp4"
                autoPlay
                playsInline
                muted
                preload="auto"
                className="w-full h-full object-contain"
                onCanPlay={() => {
                  if (introVideoRef.current && introVideoRef.current.paused) {
                    introVideoRef.current.play().catch(() => {});
                  }
                }}
                onEnded={() => {
                  setShowIntroBumper(false);
                  setPlaying(true);
                  if (isLocalMedia && localVideoRef.current) {
                    localVideoRef.current.play().catch(() => {});
                  } else {
                    sendIframeCommand('playVideo');
                  }
                }}
                onError={() => {
                  setShowIntroBumper(false);
                  setPlaying(true);
                }}
              />
              {/* Skip Cinema Intro Overlay */}
              <button
                onClick={() => {
                  setShowIntroBumper(false);
                  setPlaying(true);
                  if (isLocalMedia && localVideoRef.current) {
                    localVideoRef.current.play().catch(() => {});
                  } else {
                    sendIframeCommand('playVideo');
                  }
                }}
                className="absolute bottom-6 right-6 z-20 px-4 py-2 rounded-full bg-black/80 hover:bg-black border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wide shadow-2xl backdrop-blur-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Skip Cinema Intro</span>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          ) : isLocalMedia && localItem?.url ? (
            <video
              ref={localVideoRef}
              src={localItem.url}
              autoPlay
              playsInline
              preload="auto"
              className="w-full h-full object-contain"
              onTimeUpdate={() => {
                if (localVideoRef.current && !seeking) {
                  const cur = localVideoRef.current.currentTime;
                  const dur = localVideoRef.current.duration || 0;
                  setPlayed(dur > 0 ? cur / dur : 0);
                  setDuration(dur);
                  if (localItem && dur > 0 && Math.round(cur) % 10 === 0) {
                    addLocalMediaToHistory({
                      ...localItem,
                      progress: Math.floor(cur),
                      duration: Math.floor(dur),
                      lastWatchedAt: Date.now(),
                    });
                  }
                }
              }}
              onLoadedMetadata={() => {
                if (localVideoRef.current) {
                  setDuration(localVideoRef.current.duration || 0);
                  setTheaterState('playing');
                  setPlaying(true);
                  try {
                    audioEngine.init(localVideoRef.current);
                    audioEngine.applyConfig(audioEQ);
                  } catch (e) {}
                }
              }}
              onEnded={() => {
                setTheaterState('ended');
                setPlaying(false);
                if (curtainAnimationEnabled) setCurtainsOpen(false);
              }}
            />
          ) : (
            <iframe
              ref={iframeRef}
              id="cinemorph-theater-iframe"
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&rel=0&playsinline=1`}
              title={video?.title || 'OmniStream CineMorph Cinema'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
              onLoad={() => {
                setTheaterState('playing');
                setPlaying(true);
                try {
                  audioEngine.init();
                  audioEngine.applyConfig(audioEQ);
                } catch (e) {}
              }}
            />
          )}

          {/* ── Cinema End-Screen Spotlight & Next-Up Reel ── */}
          {theaterState === 'ended' && !showIntroBumper && (
            <div className="absolute inset-0 z-30 bg-[#07060f]/95 backdrop-blur-2xl p-6 flex flex-col justify-between items-center animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
              {/* Hidden Local File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleDirectLocalUpload}
                className="hidden"
              />

              {/* End Screen Header */}
              <div className="text-center space-y-1.5 mt-2">
                <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Cinema Session Completed</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  What would you like to watch next?
                </h3>
                {nextUpCountdown !== null && (
                  <p className="text-xs text-cyan-300 font-mono">
                    Auto-playing next recommended stream in <span className="font-bold text-amber-400 text-sm">{nextUpCountdown}s</span>
                  </p>
                )}
              </div>

              {/* Recommended Stream Cards */}
              <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                {recommendations.slice(0, 4).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setNextUpCountdown(null);
                      useAppStore.getState().setActiveVideo(rec);
                      setShowIntroBumper(false);
                      setTheaterState('playing');
                      setPlaying(true);
                      navigate(`/theater/${rec.id}`);
                    }}
                    className="group relative bg-[#13111f] rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all hover:scale-105 shadow-lg"
                  >
                    <div className="aspect-video w-full relative overflow-hidden bg-black/60">
                      <img
                        src={rec.thumbnails.medium || rec.thumbnails.high}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="w-6 h-6 text-white drop-shadow-lg group-hover:scale-125 transition-transform" />
                      </div>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{rec.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
                {/* Replay Movie */}
                <button
                  onClick={() => {
                    setNextUpCountdown(null);
                    setPlayed(0);
                    if (isLocalMedia && localVideoRef.current) {
                      localVideoRef.current.currentTime = 0;
                      localVideoRef.current.play().catch(() => {});
                    } else {
                      sendIframeCommand('seekTo', [0, true]);
                      sendIframeCommand('playVideo');
                    }
                    setTheaterState('playing');
                    setPlaying(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay Movie</span>
                </button>

                {/* Select Local Video File */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Play Local Video File</span>
                </button>

                {/* Pause Auto-Play Countdown */}
                {nextUpCountdown !== null && (
                  <button
                    onClick={() => setNextUpCountdown(null)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Auto-Play</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2.5D Tiered Theater Seating with Center Aisle (matching reference) ── */}
      {theaterSeatingEnabled && (
        <div className="absolute bottom-0 inset-x-0 h-24 sm:h-36 pointer-events-none z-15 flex flex-col justify-end items-center px-2 sm:px-6 overflow-hidden opacity-95">
          {/* Back Tier Row */}
          <div className="w-full max-w-5xl flex justify-between items-end gap-1 mb-1 opacity-50 scale-95">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
              <div 
                key={`b-${s}`}
                className="flex-1 h-8 sm:h-12 rounded-t-xl bg-gradient-to-b from-[#2a1318] via-[#150a0d] to-[#080305] border-t border-red-900/30"
              />
            ))}
          </div>

          {/* Front Tier Row with Center Aisle */}
          <div className="w-full max-w-6xl flex justify-between items-end gap-2 sm:gap-4">
            {/* Left Bank of Seats */}
            <div className="flex-1 flex gap-1 sm:gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={`fl-${s}`}
                  className="flex-1 h-14 sm:h-22 rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-b from-[#3b1219] via-[#1c080d] to-[#080204] border-t border-rose-500/20 shadow-[0_-8px_20px_rgba(0,0,0,0.9)] relative flex flex-col items-center justify-start pt-1.5"
                >
                  <div className="w-[80%] h-5 sm:h-8 rounded-t-xl bg-gradient-to-b from-[#4d1621] to-[#240a0f] border-t border-rose-400/20 shadow-inner" />
                  {/* Armrest / Cup Holder */}
                  <div className="absolute -right-1 bottom-0 w-2 h-8 bg-[#180609] rounded-t-sm border-t border-white/10" />
                </div>
              ))}
            </div>

            {/* Center Aisle with Soft Low Floor Step Light */}
            <div className="w-8 sm:w-16 h-10 flex flex-col items-center justify-end pb-2">
              <div className="w-2.5 h-1 rounded-full bg-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            </div>

            {/* Right Bank of Seats */}
            <div className="flex-1 flex gap-1 sm:gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={`fr-${s}`}
                  className="flex-1 h-14 sm:h-22 rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-b from-[#3b1219] via-[#1c080d] to-[#080204] border-t border-rose-500/20 shadow-[0_-8px_20px_rgba(0,0,0,0.9)] relative flex flex-col items-center justify-start pt-1.5"
                >
                  <div className="w-[80%] h-5 sm:h-8 rounded-t-xl bg-gradient-to-b from-[#4d1621] to-[#240a0f] border-t border-rose-400/20 shadow-inner" />
                  {/* Armrest / Cup Holder */}
                  <div className="absolute -left-1 bottom-0 w-2 h-8 bg-[#180609] rounded-t-sm border-t border-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Controls Deck (Vanishing Interface) ── */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-4xl transition-all duration-500 ${
          controlsVisible || theaterState !== 'playing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        aria-hidden={!controlsVisible && theaterState === 'playing'}
      >
        <div className="bg-[#090712]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-3">
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
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-md"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => {
                  const nm = !muted;
                  setMuted(nm);
                  if (isLocalMedia && localVideoRef.current) localVideoRef.current.muted = nm;
                  else sendIframeCommand(nm ? 'mute' : 'unMute');
                }}
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
                onChange={(e) => {
                  const nv = parseFloat(e.target.value);
                  setVolume(nv);
                  setMuted(false);
                  if (isLocalMedia && localVideoRef.current) {
                    localVideoRef.current.volume = nv;
                    localVideoRef.current.muted = false;
                  } else {
                    sendIframeCommand('unMute');
                    sendIframeCommand('setVolume', [Math.round(nv * 100)]);
                  }
                }}
                className="w-16 sm:w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer hidden sm:block"
                aria-label="Volume"
              />

              <span className="text-[11px] text-gray-400 tabular-nums font-mono">
                {formatTime(played * duration)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Tools & Quick Cyclers */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theater Seating Toggle */}
              <button
                onClick={() => {
                  const next = !theaterSeatingEnabled;
                  setTheaterSeatingEnabled(next);
                  showToast(next ? '💺 Cinema Seating: Visible' : '💺 Cinema Seating: Hidden');
                }}
                className={`p-2 rounded-xl transition-all ${
                  theaterSeatingEnabled 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Theater Seating"
              >
                <Armchair className="w-4 h-4" />
              </button>

              {/* Eco Mode / Adaptive Route Button */}
              <button
                onClick={() => {
                  const next = !ecoMode;
                  setEcoMode(next);
                  showToast(next ? '🌱 Eco Mode: Enabled (CPU Optimized)' : '⚡ Performance Mode: Active (Dynamic 60FPS)');
                }}
                className={`p-2 rounded-xl transition-all ${
                  ecoMode 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Performance Profile: ${hybridDecision.profile.toUpperCase()} • Route: ${hybridDecision.route}`}
              >
                <Zap className="w-4 h-4" />
              </button>

              {/* Audio EQ Preset Cycle */}
              <button
                onClick={cycleAudioPreset}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                title="Cycle Audio Preset"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="capitalize">{audioEQ.preset.replace('-', ' ')}</span>
              </button>

              {/* Aspect Ratio Cycler */}
              <button
                onClick={cycleAspectRatio}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1"
                title="Cycle Aspect Ratio"
              >
                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                <span>{frameAspectRatio}</span>
              </button>

              {/* Dimmer Cycler */}
              <button
                onClick={cycleDimmer}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Ambient Dimmer"
              >
                <Sun className="w-4 h-4 text-amber-400" />
              </button>

              {/* Studio Insights Drawer Toggle */}
              <button
                onClick={() => setShowStudioDrawer(s => !s)}
                className={`p-2 rounded-xl transition-all ${
                  showStudioDrawer ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="AI Cinema Studio & Highlights"
              >
                <FileText className="w-4 h-4" />
              </button>

              {/* Shortcuts HUD */}
              <button
                onClick={() => setShowShortcuts(s => !s)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Studio Drawer Overlay ── */}
      {showStudioDrawer && (
        <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#0c0a14]/95 backdrop-blur-2xl border-l border-white/10 p-6 z-40 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white tracking-wide">CineMorph AI Insights</span>
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
                    if (isLocalMedia && localVideoRef.current) {
                      localVideoRef.current.currentTime = h.timestamp;
                    } else {
                      sendIframeCommand('seekTo', [h.timestamp, true]);
                    }
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
