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
import { useTicketStore } from '../state/useTicketStore';
import { AspectRatioMode } from '../state/useCineMorphStore';
import { getVideosByIds, getRelatedVideos } from '../lib/youtube';
import { Video, AudioPreset, FrameAspectRatio, CineMorphTheme, GlowIntensity, LocalMediaItem } from '../types';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Film, Monitor, ArrowLeft, RotateCcw, ChevronRight,
  Sparkles, HelpCircle, X, Keyboard, Sliders, Maximize2,
  Sun, FileText, Check, HardDrive, Armchair,
  Eye, RefreshCw, Layers, Zap, Captions, Gauge, Languages
} from 'lucide-react';
import { 
  audioEngine, 
  THEME_CONFIGS, 
  calculateFrameStyle, 
  generateAISummary, 
  extractVideoScript, 
  localVideoAnalyzer,
  hybridMediaRouter,
  adaptiveCinemaEngine
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
  const [showTracksDrawer, setShowTracksDrawer] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [selectedAudioTrack, setSelectedAudioTrack] = useState('original');
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState('off');
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [speedRate, setSpeedRate] = useState(1);
  const [audioTrackIndex, setAudioTrackIndex] = useState(0);
  const [hudToast, setHudToast] = useState<string | null>(null);
  const [dynamicBloomColor, setDynamicBloomColor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [nextUpCountdown, setNextUpCountdown] = useState<number | null>(null);

  // Fetch recommendations & reset player state on video ID change
  useEffect(() => {
    if (!id) return;
    setPlayed(0);
    setTheaterState('playing');
    setPlaying(true);
    setNextUpCountdown(null);
    getRelatedVideos(id, video?.title || '').then(vids => {
      setRecommendations(vids.slice(0, 4));
    }).catch(() => {});
  }, [id]);

  // Back Button Trap for Drawers & Modals (YouTube Mobile Web Spec Technique 7.1)
  useEffect(() => {
    const handlePopState = () => {
      if (showTracksDrawer) {
        setShowTracksDrawer(false);
      } else if (showStudioDrawer) {
        setShowStudioDrawer(false);
      } else if (showShortcuts) {
        setShowShortcuts(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showTracksDrawer, showStudioDrawer, showShortcuts]);

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
    const ratios: FrameAspectRatio[] = ['1.90:1', '1.43:1', '21:9', '16:9', 'original'];
    const currentIdx = ratios.indexOf(frameAspectRatio);
    const nextRatio = currentIdx === -1 ? '1.90:1' : ratios[(currentIdx + 1) % ratios.length];
    setFrameAspectRatio(nextRatio);
    const label = nextRatio === 'original' 
      ? 'Original (Native Source)' 
      : nextRatio === '1.43:1' 
      ? 'Large Format 1.43 (Vertical Aperture)' 
      : nextRatio === '1.90:1' 
      ? 'Large Format 1.90 (Wide Aperture)' 
      : nextRatio === '21:9' 
      ? '21:9 UltraWide Cinema' 
      : nextRatio === '16:9'
      ? '16:9 Standard'
      : nextRatio;
    showToast(`🎬 Viewport Reframe: ${label}`);
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
    const safeAspect: AspectRatioMode = 
      frameAspectRatio === '1.43:1' ? '1.43:1' :
      frameAspectRatio === '1.90:1' ? '1.90:1' : 'original';

    if (activeVideo) {
      useTicketStore.getState().saveTicketProgress({
        movieTitle: activeVideo.title,
        sourceUrl: activeVideo.id,
        isLocal: false,
        durationSeconds: duration,
        timestampSeconds: played * duration,
        aspectRatio: safeAspect,
        framingRule: 'auto',
      });
    } else if (localItem) {
      useTicketStore.getState().saveTicketProgress({
        movieTitle: localItem.name,
        sourceUrl: localItem.id,
        isLocal: true,
        durationSeconds: duration,
        timestampSeconds: played * duration,
        aspectRatio: safeAspect,
        framingRule: 'auto',
      });
    }
    navigate('/cinemorph');
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentThemeConfig = THEME_CONFIGS[cinemorphTheme] || THEME_CONFIGS['cinematic-dark'];
  const frameStyle = calculateFrameStyle(frameAspectRatio, reframeMode);

  const safeDevicePerformance = (devicePerformanceProfile === 'ultra-low' ? 'low' : devicePerformanceProfile) as 'low' | 'balanced' | 'high';

  const adaptiveDecision = adaptiveCinemaEngine.process({
    currentTime: played * duration,
    duration,
    aspectRatio: frameAspectRatio,
    reframeMode,
    subtitlesActive: subtitlesOn || selectedSubtitleTrack !== 'off',
    audioPreset: audioEQ.preset,
    devicePerformance: safeDevicePerformance,
    isLocalMedia,
  });

  // Intelligence metadata
  const aiSummary = video ? generateAISummary(video) : null;
  const scriptChunks = video ? extractVideoScript(video) : [];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 select-none font-sans bg-[#070503] text-amber-50"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* ── Dynamic Reactive Ambilight Bloom (Auditorium Ambient Glow) ── */}
      {presentationMode === 'cinema' && glowIntensity !== 'off' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700 z-0"
          style={{
            background: `radial-gradient(ellipse at center, ${
              dynamicBloomColor || adaptiveDecision.ambientLight.lowpassColor || 'rgba(217, 119, 6, 0.35)'
            } 0%, rgba(7, 5, 3, 0.95) 75%)`,
            filter: 'blur(80px)',
            opacity: theaterState === 'playing' ? (glowIntensity === 'ultra' ? 0.9 : 0.6) : 0.3,
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      )}

      {/* ── Top-Right Fullscreen Header Badge ── */}
      <div className={`absolute top-4 right-6 z-30 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 hover:bg-amber-200 border border-amber-900/20 text-xs font-bold text-amber-900 shadow-xl shadow-amber-900/10 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          title="Toggle Fullscreen Cinema Hall (Hotkey: F)"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-amber-700" /> : <Maximize className="w-3.5 h-3.5 text-amber-700" />}
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
            <div className="w-8 sm:w-10 h-14 rounded-md bg-[#0d0d16] border border-amber-900/10 shadow-lg p-1 flex flex-col items-center justify-around">
              <div className="w-4 h-4 rounded-full bg-[#1c1c28] border border-amber-900/20" />
              <div className="w-6 h-6 rounded-full bg-[#161622] border border-amber-900/20" />
            </div>

            {/* Glowing IMAX Cyan Neon Emblem & Vertical Strip */}
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-32 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.95)]" />
              <div className="text-[10px] sm:text-xs font-black tracking-widest text-amber-700 font-mono rotate-90 origin-left drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
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
            <div className="w-8 sm:w-10 h-14 rounded-md bg-[#0d0d16] border border-amber-900/10 shadow-lg p-1 flex flex-col items-center justify-around">
              <div className="w-4 h-4 rounded-full bg-[#1c1c28] border border-amber-900/20" />
              <div className="w-6 h-6 rounded-full bg-[#161622] border border-amber-900/20" />
            </div>

            {/* Glowing IMAX Cyan Neon Emblem & Vertical Strip */}
            <div className="flex items-center gap-3">
              <div className="text-[10px] sm:text-xs font-black tracking-widest text-amber-700 font-mono -rotate-90 origin-right drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
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
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-white/90 border border-amber-900/20 text-amber-800 text-xs font-bold tracking-wide shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {hudToast}
        </div>
      )}

      {/* ── The Cinema Screen Container ── */}
      <div
        className="relative transition-all duration-700 w-full flex items-center justify-center z-10 overflow-hidden shadow-2xl border border-amber-900/10 bg-black"
        style={{
          aspectRatio: frameStyle.aspectRatioStyle,
          width: '100%',
          maxWidth: isFullscreen
            ? `min(98vw, calc(92vh * (${frameStyle.aspectRatioStyle})))`
            : frameAspectRatio === '4.3:1'
            ? `min(98vw, calc(84vh * (${frameStyle.aspectRatioStyle})))`
            : `min(92vw, calc(78vh * (${frameStyle.aspectRatioStyle})))`,
          maxHeight: isFullscreen ? '92vh' : frameAspectRatio === '4.3:1' ? '84vh' : '78vh',
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
          className="w-full h-full transition-transform duration-500 relative overflow-hidden"
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
                className="absolute bottom-6 right-6 z-20 px-4 py-2 rounded-full bg-white/90 hover:bg-black border border-amber-900/20 text-amber-800 text-xs font-bold tracking-wide shadow-2xl backdrop-blur-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Skip Cinema Intro</span>
                <ChevronRight className="w-4 h-4 text-amber-700" />
              </button>
            </div>
          ) : isLocalMedia && localItem?.url ? (
            <video
              ref={localVideoRef}
              src={localItem.url}
              autoPlay
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
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
              className="absolute inset-0 w-full h-full border-0"
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
                <div className="flex items-center justify-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Cinema Session Completed</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#3d332a] tracking-tight">
                  What would you like to watch next?
                </h3>
                {nextUpCountdown !== null && (
                  <p className="text-xs text-amber-800 font-mono">
                    Auto-playing next recommended stream in <span className="font-bold text-amber-800 text-sm">{nextUpCountdown}s</span>
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
                    className="group relative bg-white rounded-xl border border-amber-900/10 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all hover:scale-105 shadow-lg"
                  >
                    <div className="aspect-video w-full relative overflow-hidden bg-amber-900/5">
                      <img
                        src={rec.thumbnails.medium || rec.thumbnails.high}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="w-6 h-6 text-[#3d332a] drop-shadow-lg group-hover:scale-125 transition-transform" />
                      </div>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <h4 className="text-xs font-bold text-[#3d332a] line-clamp-1 group-hover:text-amber-800 transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-[10px] text-amber-900/60 line-clamp-1">{rec.channelTitle}</p>
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
                    if (id) {
                      useAppStore.getState().saveWatchPosition(id, 0, duration);
                    }
                    if (video) {
                      useAppStore.getState().addToHistory(video, 0, duration);
                    }
                    if (isLocalMedia && localItem) {
                      useAppStore.getState().addLocalMediaToHistory({
                        ...localItem,
                        progress: 0,
                        lastWatchedAt: Date.now(),
                      });
                    }
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-700 hover:bg-amber-600 text-[#3d332a] font-bold text-xs shadow-lg shadow-amber-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay Movie</span>
                </button>

                {/* Select Local Video File */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-800 hover:bg-purple-500 text-[#3d332a] font-bold text-xs shadow-lg shadow-amber-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Play Local Video File</span>
                </button>

                {/* Pause Auto-Play Countdown */}
                {nextUpCountdown !== null && (
                  <button
                    onClick={() => setNextUpCountdown(null)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-900/10 hover:bg-amber-900/20 text-amber-900/80 hover:text-[#3d332a] font-semibold text-xs transition-all cursor-pointer"
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

      {/* ── 2.5D Clean Theater Seating (No Screen Overlap Shadows) ── */}
      {theaterSeatingEnabled && (
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-24 pointer-events-none z-15 flex items-end justify-center px-4 overflow-hidden opacity-90">
          {/* Single Clean Auditorium Row with Center Aisle */}
          <div className="w-full max-w-6xl flex justify-between items-end gap-3 sm:gap-6">
            {/* Left Bank of Seats */}
            <div className="flex-1 flex gap-1.5 sm:gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={`fl-${s}`}
                  className="flex-1 h-12 sm:h-16 rounded-t-2xl bg-gradient-to-b from-[#2d0f15] via-[#16070a] to-[#080204] border-t border-rose-500/20 relative flex flex-col items-center justify-start pt-1"
                >
                  <div className="w-[85%] h-4 sm:h-6 rounded-t-xl bg-gradient-to-b from-[#3d141d] to-[#1c080d] border-t border-rose-400/20" />
                  <div className="absolute -right-1 bottom-0 w-1.5 h-6 bg-[#120406] rounded-t-sm border-t border-amber-900/10" />
                </div>
              ))}
            </div>

            {/* Center Aisle with Soft Low Floor Step Light */}
            <div className="w-8 sm:w-16 h-6 flex items-end justify-center pb-1">
              <div className="w-3 h-1 rounded-full bg-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>

            {/* Right Bank of Seats */}
            <div className="flex-1 flex gap-1.5 sm:gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={`fr-${s}`}
                  className="flex-1 h-12 sm:h-16 rounded-t-2xl bg-gradient-to-b from-[#2d0f15] via-[#16070a] to-[#080204] border-t border-rose-500/20 relative flex flex-col items-center justify-start pt-1"
                >
                  <div className="w-[85%] h-4 sm:h-6 rounded-t-xl bg-gradient-to-b from-[#3d141d] to-[#1c080d] border-t border-rose-400/20" />
                  <div className="absolute -left-1 bottom-0 w-1.5 h-6 bg-[#120406] rounded-t-sm border-t border-amber-900/10" />
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
        <div className="bg-[#120e0b]/90 backdrop-blur-2xl border border-amber-500/20 text-amber-100 rounded-2xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-3">
          {/* Interactive Seekbar with Hover Tooltip */}
          <div 
            className="relative group cursor-pointer"
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={handleScrubberMouseLeave}
          >
            {hoverPosPercent !== null && hoverTime !== null && (
              <div 
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-amber-500/30 text-[10px] font-mono text-amber-300 pointer-events-none shadow-lg"
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
                background: `linear-gradient(to right, rgba(245,158,11,0.95) 0%, rgba(245,158,11,0.95) ${played * 100}%, rgba(255,255,255,0.15) ${played * 100}%, rgba(255,255,255,0.15) 100%)`,
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
                className="p-1.5 text-amber-300/70 hover:text-amber-100 transition-colors rounded-lg hover:bg-amber-500/10"
                aria-label="Leave cinema"
                title="Exit Cinema"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-all shadow-md active:scale-95"
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
                className="p-1.5 text-amber-300/70 hover:text-amber-100 transition-colors"
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
                className="w-16 sm:w-20 h-1 appearance-none bg-amber-900/40 rounded-full cursor-pointer hidden sm:block"
                aria-label="Volume"
              />

              <span className="text-[11px] text-amber-200/60 tabular-nums font-mono">
                {formatTime(played * duration)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Tools & Clean Cyclers (Minimal & Simple) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Aspect Ratio Cycler */}
              <button
                onClick={cycleAspectRatio}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Cycle Aspect Ratio (1.90, 1.43, 21:9, 16:9, Original)"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase">{frameAspectRatio}</span>
              </button>

              {/* Audio EQ Preset Cycle */}
              <button
                onClick={cycleAudioPreset}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300 transition-all cursor-pointer active:scale-95"
                title="Cycle Audio Preset"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span className="capitalize">{audioEQ.preset.replace('-', ' ')}</span>
              </button>

              {/* CC Subtitles Toggle */}
              <button
                onClick={() => {
                  const nextCc = !subtitlesOn;
                  setSubtitlesOn(nextCc);
                  sendIframeCommand(nextCc ? 'loadModule' : 'unloadModule', ['captions']);
                  if (isLocalMedia && localVideoRef.current) {
                    const tracks = localVideoRef.current.textTracks;
                    for (let i = 0; i < tracks.length; i++) {
                      tracks[i].mode = nextCc ? 'showing' : 'disabled';
                    }
                  }
                  showToast(nextCc ? '💬 Subtitles / CC Enabled' : '💬 Subtitles / CC Disabled');
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  subtitlesOn ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40' : 'text-amber-300/70 hover:text-amber-100 hover:bg-amber-500/10'
                }`}
                title="Toggle Subtitles / CC"
              >
                <Captions className="w-4 h-4" />
              </button>

              {/* Studio & Cinema Settings Drawer Toggle */}
              <button
                onClick={() => setShowStudioDrawer(s => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showStudioDrawer ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-amber-500/10 text-amber-200 border border-amber-500/20 hover:bg-amber-500/20'
                }`}
                title="Open Studio Settings & Cinema Controls"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-amber-300/70 hover:text-amber-100 hover:bg-amber-500/10 transition-colors cursor-pointer"
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
        <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#0c0907]/98 backdrop-blur-2xl border-l border-amber-900/40 p-6 z-40 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 text-amber-100 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-amber-900/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-100 tracking-wide">Studio & Cinema Controls</span>
            </div>
            <button 
              onClick={() => setShowStudioDrawer(false)}
              className="p-1 text-amber-400 hover:text-amber-200 rounded-lg hover:bg-amber-900/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Cinema Settings & Environment */}
          <div className="space-y-3 pb-4 border-b border-amber-900/30">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Environment & Playback Tools
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Seating Toggle */}
              <button
                onClick={() => {
                  const next = !theaterSeatingEnabled;
                  setTheaterSeatingEnabled(next);
                  showToast(next ? '💺 Cinema Seating: Visible' : '💺 Cinema Seating: Hidden');
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  theaterSeatingEnabled ? 'bg-amber-500/20 text-amber-200 border-amber-500/40' : 'bg-amber-950/20 text-amber-300/60 border-amber-900/20 hover:bg-amber-900/30'
                }`}
              >
                <Armchair className="w-4 h-4" />
                <span>{theaterSeatingEnabled ? 'Seating On' : 'Seating Off'}</span>
              </button>

              {/* Speed Rate */}
              <button
                onClick={() => {
                  const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
                  const nextIdx = (speeds.indexOf(speedRate) + 1) % speeds.length;
                  const nextSpeed = speeds[nextIdx];
                  setSpeedRate(nextSpeed);
                  if (isLocalMedia && localVideoRef.current) localVideoRef.current.playbackRate = nextSpeed;
                  else sendIframeCommand('setPlaybackRate', [nextSpeed]);
                  showToast(`⚡ Speed: ${nextSpeed}x`);
                }}
                className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/20 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-900/30 flex items-center gap-2 cursor-pointer"
              >
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Speed: {speedRate}x</span>
              </button>

              {/* Eco Mode */}
              <button
                onClick={() => {
                  const next = !ecoMode;
                  setEcoMode(next);
                  showToast(next ? '🌱 Eco Mode: Enabled' : '⚡ 60FPS Mode: Active');
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  ecoMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/20 text-amber-300/60 border-amber-900/20 hover:bg-amber-900/30'
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>{ecoMode ? 'Eco Mode' : '60FPS Mode'}</span>
              </button>

              {/* Dimmer */}
              <button
                onClick={cycleDimmer}
                className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/20 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-900/30 flex items-center gap-2 cursor-pointer"
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Glow: {glowIntensity.toUpperCase()}</span>
              </button>
            </div>

            <button
              onClick={() => { setShowStudioDrawer(false); setShowShortcuts(true); }}
              className="w-full py-2 px-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-900/30 text-xs font-bold text-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>View Keyboard Shortcuts</span>
            </button>
          </div>

          {/* AI Summary Breakdown */}
          {aiSummary && (
            <div className="space-y-2 pt-2 border-t border-amber-900/30">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Executive Breakdown
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed bg-amber-950/20 p-3 rounded-xl border border-amber-900/20">
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
            className="w-full max-w-md bg-[#0e0c14] border border-amber-900/40 rounded-2xl p-6 shadow-2xl relative text-amber-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-900/30">
              <div className="flex items-center gap-2.5 text-amber-200 font-semibold">
                <Keyboard className="w-5 h-5 text-amber-400" />
                <span>Cinema Theater Shortcuts</span>
              </div>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="p-1 text-amber-400 hover:text-amber-200 rounded-lg hover:bg-amber-900/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-amber-200/80">
              <div className="flex items-center justify-between py-1">
                <span>Play / Pause</span>
                <kbd className="px-2 py-1 bg-amber-950/50 rounded font-mono text-amber-300 border border-amber-500/20">Space</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Seek Forward / Backward 10s</span>
                <kbd className="px-2 py-1 bg-amber-950/50 rounded font-mono text-amber-300 border border-amber-500/20">➔ / ⬅</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Volume Up / Down</span>
                <kbd className="px-2 py-1 bg-amber-950/50 rounded font-mono text-amber-300 border border-amber-500/20">⬆ / ⬇</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Mute / Unmute</span>
                <kbd className="px-2 py-1 bg-amber-950/50 rounded font-mono text-amber-300 border border-amber-500/20">M</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Toggle Fullscreen</span>
                <kbd className="px-2 py-1 bg-amber-950/50 rounded font-mono text-amber-300 border border-amber-500/20">F</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Toggle Presentation Mode</span>
                <kbd className="px-2 py-1 bg-amber-950/50 rounded font-mono text-amber-300 border border-amber-500/20">C</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Exit Theater / Close Overlays</span>
                <kbd className="px-2 py-1 bg-amber-900/10 rounded font-mono text-amber-800 border border-amber-900/10">Esc</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Toggle Shortcuts Help</span>
                <kbd className="px-2 py-1 bg-amber-900/10 rounded font-mono text-amber-800 border border-amber-900/10">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
