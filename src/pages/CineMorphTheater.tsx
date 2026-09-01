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
import { omsTransitionService } from '../services/omsTransitionService';
import { getVideosByIds } from '../lib/youtube';
import { Video, AudioPreset, FrameAspectRatio, CineMorphTheme, GlowIntensity, LocalMediaItem } from '../types';
import { OMSLogo } from '../components/common/OMSLogo';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Film, Monitor, ArrowLeft, RotateCcw, ChevronRight,
  Sparkles, HelpCircle, X, Keyboard, Sliders, Maximize2,
  Sun, FileText, Check, HardDrive, Armchair,
  Eye, RefreshCw, Layers, Zap, Captions, Gauge, Languages, Tv
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
  
  const bloomRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio/Video track selections
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string>('audio-main');
  const [selectedVideoTrackId, setSelectedVideoTrackId] = useState<string>('vid-auto');

  // Curved screen activation for original mode
  const [curvedScreenActive, setCurvedScreenActive] = useState(false);

  // Scrubber Hover Tooltip state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosPercent, setHoverPosPercent] = useState<number | null>(null);

  // Real detected audio and video tracks (No fake tracks)
  const audioTrackOptions = React.useMemo(() => {
    if (isLocalMedia && localVideoRef.current && (localVideoRef.current as any).audioTracks?.length > 1) {
      const trks = (localVideoRef.current as any).audioTracks;
      return Array.from(trks).map((t: any, i: number) => ({
        id: `audio-${i}`,
        label: t.label || `Audio Track ${i + 1}`,
        language: t.language || 'Native',
        channels: 'Multi-Channel'
      }));
    }
    return [
      { id: 'audio-main', label: 'Native Source Audio', language: 'Default / Original', channels: 'Standard' }
    ];
  }, [isLocalMedia]);

  const videoTrackOptions = React.useMemo(() => {
    if (isLocalMedia && localVideoRef.current && (localVideoRef.current as any).videoTracks?.length > 1) {
      const trks = (localVideoRef.current as any).videoTracks;
      return Array.from(trks).map((t: any, i: number) => ({
        id: `vid-${i}`,
        label: t.label || `Video Stream ${i + 1}`,
        resolution: 'Native',
        fps: '',
        bitrate: 'Lossless'
      }));
    }
    return [
      { id: 'vid-auto', label: 'Native Video Stream', resolution: 'Original Source', fps: '', bitrate: 'Default' }
    ];
  }, [isLocalMedia]);

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

  // Reset player state on video ID change
  useEffect(() => {
    if (!id) return;
    setPlayed(0);
    setTheaterState('playing');
    setPlaying(true);
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
      if (cached && bloomRef.current) {
        bloomRef.current.style.background = `radial-gradient(ellipse at center, ${cached.dominantColor} 0%, rgba(7, 5, 3, 0.95) 75%)`;
      }
    }

    frameAnalysisTimerRef.current = setInterval(() => {
      const activeVideoEl = showIntroBumper ? introVideoRef.current : (isLocalMedia ? localVideoRef.current : null);
      if (activeVideoEl && !activeVideoEl.paused) {
        // Non-blocking async sampling via requestIdleCallback / microtask
        const runSampling = () => {
          if (activeVideoEl) {
            const analysis = localVideoAnalyzer.analyzeVideoFrame(activeVideoEl, showIntroBumper ? 'cinema-intro' : localItem?.id);
            if (analysis && bloomRef.current) {
              bloomRef.current.style.background = `radial-gradient(ellipse at center, ${analysis.dominantColor} 0%, rgba(7, 5, 3, 0.95) 75%)`;
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
      controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 1800);
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
      const target = e.target as HTMLElement | null;
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const targetTag = (target?.tagName || '').toLowerCase();
      if (
        activeTag === 'input' || 
        activeTag === 'textarea' || 
        activeTag === 'select' ||
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        targetTag === 'select' ||
        (document.activeElement as HTMLElement)?.isContentEditable ||
        target?.isContentEditable
      ) return;
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

  // ── Auto-fullscreen on theater entry ────────────────────────────────────────
  useEffect(() => {
    // Small delay to let the DOM mount + ticket animation settle
    const t = setTimeout(() => {
      if (!document.fullscreenElement && containerRef.current) {
        containerRef.current.requestFullscreen().catch(() => {
          // Autoplay policy may block — user can still click the fullscreen button
        });
      }
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Curved screen entrance animation for original mode
  useEffect(() => {
    const isOriginal = frameAspectRatio === 'original' || presentationMode === 'original';
    if (isOriginal) {
      const prefersReducedMotion = typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setCurvedScreenActive(true);
      } else {
        setCurvedScreenActive(false);
        const timer = setTimeout(() => setCurvedScreenActive(true), 60);
        return () => clearTimeout(timer);
      }
    } else {
      setCurvedScreenActive(false);
    }
  }, [frameAspectRatio, presentationMode]);

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
    const ratios: FrameAspectRatio[] = ['original', '1.90:1', '1.43:1'];
    const currentIdx = ratios.indexOf(frameAspectRatio);
    const nextRatio = currentIdx === -1 ? 'original' : ratios[(currentIdx + 1) % ratios.length];
    setFrameAspectRatio(nextRatio);
    const label = nextRatio === 'original' 
      ? 'Original (Native Source - 100% Uncropped)' 
      : nextRatio === '1.43:1' 
      ? 'True IMAX (1.43:1)' 
      : 'IMAX (1.90:1)';
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

  const handoffToUTube = () => {
    if (activeVideo) {
      showToast('📺 Switching to U-Tube Standard Player...');
      omsTransitionService.executeCineMorphToUTubeHandoff(
        {
          videoId: activeVideo.id,
          title: activeVideo.title,
          currentTime: played * duration,
          duration: duration,
          isPlaying: theaterState === 'playing',
        },
        navigate
      );
    }
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

  // Screen click handler: hide controls/drawers if open; enter fullscreen if closed
  const handleScreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (controlsVisible || showStudioDrawer || showShortcuts) {
      setControlsVisible(false);
      setShowStudioDrawer(false);
      setShowShortcuts(false);
      return;
    }
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    }
  };

  // Derived mode flags (computed from state, not hooks)
  const isOriginalMode = frameAspectRatio === 'original' || presentationMode === 'original';
  const isIMAXMode = (frameAspectRatio === '1.90:1' || frameAspectRatio === '1.43:1') && presentationMode !== 'original';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 select-none font-sans bg-[#070503] text-amber-50"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* ── Dynamic Reactive Ambilight Bloom (Auditorium Ambient Glow) ── */}
      {glowIntensity !== 'off' && (
        <div
          ref={bloomRef}
          className="absolute inset-0 pointer-events-none transition-all duration-700 z-0"
          style={{
            background: `radial-gradient(ellipse at center, ${
              adaptiveDecision.ambientLight.lowpassColor || 'rgba(217, 119, 6, 0.35)'
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

      {/* ── Natural Cinema Auditorium Architectural Atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none z-1">
        {/* Soft Acoustic Side Wall Shadows */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-black via-black/50 to-transparent" />
        {/* Subtle Floor Ambient Incline */}
        <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* ── HUD Toast Banner Alert ── */}
      {hudToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-white/90 border border-amber-900/20 text-amber-800 text-xs font-bold tracking-wide shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {hudToast}
        </div>
      )}

      {/* ── The Cinema Screen Container ── */}
      <div
        onClick={handleScreenClick}
        className={`relative transition-all duration-500 ease-out flex items-center justify-center z-10 overflow-hidden border border-white/10 bg-black cursor-pointer mb-6 sm:mb-8 ${
          isOriginalMode
            ? 'shadow-[0_15px_40px_rgba(0,0,0,0.6)]'
            : frameAspectRatio === '1.43:1'
            ? 'shadow-[0_0_110px_rgba(0,0,0,0.98),-18px_0_36px_-10px_rgba(0,0,0,0.85),18px_0_36px_-10px_rgba(0,0,0,0.85)]'
            : 'shadow-[0_0_90px_rgba(0,0,0,0.95),-14px_0_30px_-8px_rgba(0,0,0,0.8),14px_0_30px_-8px_rgba(0,0,0,0.8)]'
        }`}
        style={{
          aspectRatio: frameStyle.aspectRatioStyle,
          width: '100%',
          maxWidth: isFullscreen
            ? `min(98vw, calc(94vh * (${frameStyle.aspectRatioStyle})))`
            : frameAspectRatio === '1.43:1'
            ? `min(92vw, calc(72vh * (${frameStyle.aspectRatioStyle})))`
            : `min(92vw, calc(70vh * (${frameStyle.aspectRatioStyle})))`,
          maxHeight: isFullscreen 
            ? '95vh' 
            : frameAspectRatio === '1.43:1' 
            ? '72vh' 
            : '70vh',
          filter: 'none',
          borderRadius: isOriginalMode
            ? '8px'
            : frameAspectRatio === '1.43:1'
            ? '14px 14px 34px 34px / 8px 8px 18px 18px'
            : frameAspectRatio === '1.90:1'
            ? '12px 12px 28px 28px / 6px 6px 14px 14px'
            : '10px',
          transform: isOriginalMode
            ? 'none'
            : presentationMode === 'cinema' 
            ? frameAspectRatio === '1.43:1'
              ? 'perspective(1400px) rotateX(0.35deg)'
              : frameAspectRatio === '1.90:1'
              ? 'perspective(1600px) rotateX(0.45deg)'
              : 'none'
            : 'none',
        }}
      >
        {/* Subtle Horizontal Curved Screen Side Depth Vignettes (IMAX & True IMAX Only) */}
        {isIMAXMode && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 pointer-events-none z-20 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 pointer-events-none z-20 bg-gradient-to-l from-black/50 via-black/15 to-transparent" />
          </>
        )}

        {/* Subtitles / CC Visual Text Overlay */}
        {subtitlesOn && !showIntroBumper && theaterState !== 'ended' && (
          <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center pointer-events-none px-6 animate-in fade-in duration-200">
            <div className="bg-black/90 text-white text-sm sm:text-base md:text-lg font-bold px-5 py-2 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md tracking-wide text-center max-w-2xl font-sans drop-shadow-md">
              {video?.title ? `[CC] Playing: ${video.title}` : `[Closed Captions Enabled]` }
            </div>
          </div>
        )}

        <div
          className="w-full h-full transition-transform duration-500 relative overflow-hidden"
          style={{
            transform: isOriginalMode ? 'none' : presentationMode === 'cinema' ? frameStyle.videoScaleTransform : 'none',
          }}
        >
          {/* Theatrical Velvet Curtain Panels */}
          {curtainAnimationEnabled && (
            <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden flex">
              <div
                className={`w-1/2 h-full bg-gradient-to-r from-[#1a0508] via-[#2e0910] to-[#140306] border-r border-rose-950/40 shadow-2xl transition-transform duration-1000 ease-out ${
                  curtainsOpen ? '-translate-x-full' : 'translate-x-0'
                }`}
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(0,0,0,0.3) 18px, rgba(0,0,0,0.3) 36px)',
                }}
              />
              <div
                className={`w-1/2 h-full bg-gradient-to-l from-[#1a0508] via-[#2e0910] to-[#140306] border-l border-rose-950/40 shadow-2xl transition-transform duration-1000 ease-out ${
                  curtainsOpen ? 'translate-x-full' : 'translate-x-0'
                }`}
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(0,0,0,0.3) 18px, rgba(0,0,0,0.3) 36px)',
                }}
              />
            </div>
          )}

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

              {/* End Screen Theatrical Curtain Call */}
              <div className="text-center space-y-3 mt-4 max-w-lg">
                <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-[0.2em]">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Feature Presentation Complete</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight line-clamp-2">
                  {video?.title || localItem?.name || 'Feature Presentation'}
                </h3>
                <div className="flex items-center justify-center gap-3 text-xs text-white/50 font-mono">
                  <span>Aperture: {frameAspectRatio}</span>
                  <span>•</span>
                  <span>Audio: {audioEQ.preset.toUpperCase()}</span>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 my-8">
                {/* Replay Movie */}
                <button
                  onClick={() => {
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
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xl shadow-amber-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay Feature</span>
                </button>

                {/* Return to U-Tube Standard Player (Contextual OMS Return) */}
                {video && !isLocalMedia && (
                  <button
                    onClick={handoffToUTube}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Return to standard U-Tube player at current timestamp"
                  >
                    <Tv className="w-4 h-4 text-utube-primary" />
                    <span>Watch in Standard Player</span>
                  </button>
                )}

                {/* Return to CineMorph Hall */}
                <button
                  onClick={exitTheater}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-xs border border-white/10 transition-all cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>CineMorph Ingest Hall</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Natural Cinema Auditorium Seating (Rendered in all modes: Original, IMAX, and True IMAX) ── */}
      {theaterSeatingEnabled && (
        <div 
          className={`absolute bottom-0 inset-x-0 pointer-events-none z-10 flex flex-col justify-end items-center px-4 sm:px-12 select-none transition-all duration-500 ${
            frameAspectRatio === '1.43:1' ? 'h-4 sm:h-5' : 'h-6 sm:h-7'
          }`}
        >
          {/* Natural Auditorium VIP Recliner Row with Proportionate Profile for Clear Sightlines */}
          <div 
            className={`w-full max-w-4xl flex justify-between items-end gap-3 sm:gap-6 transition-opacity duration-500 ${
              frameAspectRatio === '1.43:1' ? 'opacity-35' : 'opacity-45'
            }`}
          >
            {/* Left Seat Bank */}
            <div className="flex-1 flex gap-1 sm:gap-2 justify-end">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={`seat-l-${s}`}
                  className={`flex-1 max-w-[44px] rounded-t-lg bg-gradient-to-b from-[#24060c] via-[#120205] to-[#040001] border-t border-rose-950/30 relative flex flex-col items-center justify-start pt-0.5 shadow-2xl transition-all duration-500 ${
                    frameAspectRatio === '1.43:1' ? 'h-3.5 sm:h-4.5' : 'h-5 sm:h-6'
                  }`}
                >
                  {/* Subtle Plush Headrest */}
                  <div 
                    className={`w-[75%] rounded-t bg-gradient-to-b from-[#330911] to-[#180407] border-t border-rose-900/20 shadow-inner ${
                      frameAspectRatio === '1.43:1' ? 'h-1 sm:h-1.5' : 'h-1.5 sm:h-2'
                    }`} 
                  />
                  {/* Armrests */}
                  <div 
                    className={`absolute -left-0.5 bottom-0 w-1 bg-[#0a0102] rounded-t-sm border-t border-white/5 ${
                      frameAspectRatio === '1.43:1' ? 'h-2 sm:h-2.5' : 'h-2.5 sm:h-3.5'
                    }`} 
                  />
                  <div 
                    className={`absolute -right-0.5 bottom-0 w-1 bg-[#0a0102] rounded-t-sm border-t border-white/5 ${
                      frameAspectRatio === '1.43:1' ? 'h-2 sm:h-2.5' : 'h-2.5 sm:h-3.5'
                    }`} 
                  />
                </div>
              ))}
            </div>

            {/* Natural Dark Center Aisle Gap */}
            <div className={`w-6 sm:w-12 ${frameAspectRatio === '1.43:1' ? 'h-1' : 'h-1.5'}`} />

            {/* Right Seat Bank */}
            <div className="flex-1 flex gap-1 sm:gap-2 justify-start">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={`seat-r-${s}`}
                  className={`flex-1 max-w-[44px] rounded-t-lg bg-gradient-to-b from-[#24060c] via-[#120205] to-[#040001] border-t border-rose-950/30 relative flex flex-col items-center justify-start pt-0.5 shadow-2xl transition-all duration-500 ${
                    frameAspectRatio === '1.43:1' ? 'h-3.5 sm:h-4.5' : 'h-5 sm:h-6'
                  }`}
                >
                  {/* Subtle Plush Headrest */}
                  <div 
                    className={`w-[75%] rounded-t bg-gradient-to-b from-[#330911] to-[#180407] border-t border-rose-900/20 shadow-inner ${
                      frameAspectRatio === '1.43:1' ? 'h-1 sm:h-1.5' : 'h-1.5 sm:h-2'
                    }`} 
                  />
                  {/* Armrests */}
                  <div 
                    className={`absolute -left-0.5 bottom-0 w-1 bg-[#0a0102] rounded-t-sm border-t border-white/5 ${
                      frameAspectRatio === '1.43:1' ? 'h-2 sm:h-2.5' : 'h-2.5 sm:h-3.5'
                    }`} 
                  />
                  <div 
                    className={`absolute -right-0.5 bottom-0 w-1 bg-[#0a0102] rounded-t-sm border-t border-white/5 ${
                      frameAspectRatio === '1.43:1' ? 'h-2 sm:h-2.5' : 'h-2.5 sm:h-3.5'
                    }`} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Controls Deck (Sleek Vanishing Cinematic Interface) ── */}
      <div
        className={`absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-3xl transition-all duration-500 ${
          controlsVisible || theaterState !== 'playing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        aria-hidden={!controlsVisible && theaterState === 'playing'}
      >
        <div className="bg-[#120e0b]/92 backdrop-blur-2xl border border-amber-500/25 text-amber-100 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-[0_15px_40px_rgba(0,0,0,0.9)] space-y-1.5">
          {/* Interactive Seekbar with Hover Tooltip */}
          <div 
            className="relative group cursor-pointer py-0.5"
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={handleScrubberMouseLeave}
          >
            {hoverPosPercent !== null && hoverTime !== null && (
              <div 
                className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/95 border border-amber-500/30 text-[9px] font-mono text-amber-300 pointer-events-none shadow-lg"
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
              className="w-full h-1 group-hover:h-1.5 transition-all appearance-none bg-white/15 rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(245,158,11,0.95) 0%, rgba(245,158,11,0.95) ${played * 100}%, rgba(255,255,255,0.15) ${played * 100}%, rgba(255,255,255,0.15) 100%)`,
              }}
              aria-label="Seek"
            />
          </div>

          {/* Controls Bar Row */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            {/* Left Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={exitTheater}
                className="p-1 text-amber-300/70 hover:text-amber-100 transition-colors rounded-lg hover:bg-amber-500/10"
                aria-label="Leave cinema"
                title="Exit Cinema"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              {activeVideo && !isLocalMedia && (
                <button
                  onClick={handoffToUTube}
                  className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[10px] font-bold transition-all cursor-pointer"
                  title="Switch to U-Tube Standard Web Player"
                >
                  <Tv className="w-3 h-3" />
                  <span>U-Tube</span>
                </button>
              )}

              <button
                onClick={togglePlay}
                className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-all shadow-md active:scale-95 cursor-pointer"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                onClick={() => {
                  const nm = !muted;
                  setMuted(nm);
                  if (isLocalMedia && localVideoRef.current) localVideoRef.current.muted = nm;
                  else sendIframeCommand(nm ? 'mute' : 'unMute');
                }}
                className="p-1 text-amber-300/70 hover:text-amber-100 transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
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
                className="w-14 sm:w-16 h-1 appearance-none bg-amber-900/40 rounded-full cursor-pointer hidden sm:block"
                aria-label="Volume"
              />

              <span className="text-[10px] text-amber-200/60 tabular-nums font-mono">
                {formatTime(played * duration)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Tools: Aspect Ratios, Audio Modes, Studio Drawer, Fullscreen */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Aspect Ratio Selector Pills (True IMAX, IMAX, Original) */}
              <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-lg border border-amber-500/20">
                <button
                  onClick={() => { 
                    setFrameAspectRatio('1.43:1'); 
                    showToast('🎬 Aspect Ratio: True IMAX (1.43:1)'); 
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    frameAspectRatio === '1.43:1' 
                      ? 'bg-amber-500 text-black shadow-sm' 
                      : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
                  }`}
                  title="True IMAX Large Format (1.43:1)"
                >
                  True IMAX
                </button>
                <button
                  onClick={() => { 
                    setFrameAspectRatio('1.90:1'); 
                    showToast('🎬 Aspect Ratio: IMAX (1.90:1)'); 
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    frameAspectRatio === '1.90:1' 
                      ? 'bg-amber-500 text-black shadow-sm' 
                      : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
                  }`}
                  title="IMAX Digital Widescreen (1.90:1)"
                >
                  IMAX
                </button>
                <button
                  onClick={() => { 
                    setFrameAspectRatio('original'); 
                    showToast('🎬 Aspect Ratio: Original Native Source'); 
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    frameAspectRatio === 'original' 
                      ? 'bg-amber-500 text-black shadow-sm' 
                      : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
                  }`}
                  title="Original Unmodified Aspect Ratio"
                >
                  Original
                </button>
              </div>

              {/* Audio Mode Preset Selector (3D Spatial, Dialogue Boost, Bass, etc.) */}
              <button
                onClick={cycleAudioPreset}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[10px] font-semibold text-purple-200 transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Cycle Audio Mode Preset (3D Spatial, Dialogue Boost, Cinema Bass, Night Mode, Original)"
              >
                <Sliders className="w-3 h-3 text-purple-400" />
                <span className="capitalize hidden sm:inline">
                  {audioEQ.preset === 'spatial-3d' 
                    ? '3D Spatial' 
                    : audioEQ.preset === 'dialogue-boost' 
                    ? 'Dialogue Boost' 
                    : audioEQ.preset === 'bass-heavy' 
                    ? 'Cinema Bass' 
                    : audioEQ.preset === 'night-compression' 
                    ? 'Night Mode' 
                    : 'Original Audio'}
                </span>
                <span className="sm:hidden text-[10px]">Audio</span>
              </button>

              {/* OMS Studio Controls Drawer Toggle Button */}
              <button
                onClick={() => setShowStudioDrawer(s => !s)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  showStudioDrawer 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-md shadow-cyan-500/30' 
                    : 'bg-black/40 text-amber-200 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title="Open OMS Studio (Audio Tracks, Video Tracks, Subtitles, Speed, Seating)"
              >
                <OMSLogo variant="dark" size="xs" animated={true} />
                <span className="hidden sm:inline font-cinematic text-[11px] tracking-wider text-cyan-300 font-bold">OMS</span>
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

      {/* ── Studio Drawer Overlay (Audio Tracks, Video Tracks & Cinema Tools) ── */}
      {showStudioDrawer && (
        <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#0c0907]/98 backdrop-blur-2xl border-l border-amber-900/40 p-6 z-40 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 text-amber-100 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-amber-900/30">
            <div className="flex items-center gap-2">
              <OMSLogo variant="dark" size="sm" showLabel={true} animated={true} />
            </div>
            <button 
              onClick={() => setShowStudioDrawer(false)}
              className="p-1 text-amber-400 hover:text-amber-200 rounded-lg hover:bg-amber-900/30 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Audio Tracks (Language / Stream Selection) ── */}
          <div className="space-y-2.5 pb-4 border-b border-amber-900/30">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Audio Tracks (Multi-Language)
              </span>
              <span className="text-[9px] font-mono text-amber-500/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/30">
                {audioTrackOptions.length} Tracks
              </span>
            </div>
            <div className="space-y-1.5">
              {audioTrackOptions.map((trk) => {
                const isSelected = selectedAudioTrackId === trk.id;
                return (
                  <button
                    key={trk.id}
                    onClick={() => {
                      setSelectedAudioTrackId(trk.id);
                      showToast(`🔊 Audio Track: ${trk.label} (${trk.language})`);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/20 text-amber-100 border-amber-500/50 shadow-sm' 
                        : 'bg-amber-950/20 text-amber-300/70 border-amber-900/20 hover:bg-amber-900/30'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-100 flex items-center gap-2">
                        <span>{trk.label}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <div className="text-[10px] text-amber-300/60 font-mono mt-0.5">
                        {trk.language} • {trk.channels}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Video Tracks (Quality & Stream Selection) ── */}
          <div className="space-y-2.5 pb-4 border-b border-amber-900/30">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                Video Tracks & Quality Streams
              </span>
              <span className="text-[9px] font-mono text-amber-500/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/30">
                {videoTrackOptions.length} Streams
              </span>
            </div>
            <div className="space-y-1.5">
              {videoTrackOptions.map((vtrk) => {
                const isSelected = selectedVideoTrackId === vtrk.id;
                return (
                  <button
                    key={vtrk.id}
                    onClick={() => {
                      setSelectedVideoTrackId(vtrk.id);
                      showToast(`🎥 Video Stream: ${vtrk.label} (${vtrk.resolution})`);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/20 text-amber-100 border-amber-500/50 shadow-sm' 
                        : 'bg-amber-950/20 text-amber-300/70 border-amber-900/20 hover:bg-amber-900/30'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-100 flex items-center gap-2">
                        <span>{vtrk.label}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <div className="text-[10px] text-amber-300/60 font-mono mt-0.5">
                        {vtrk.resolution} • {vtrk.fps} • {vtrk.bitrate}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Subtitles & Closed Captions ── */}
          <div className="space-y-2.5 pb-4 border-b border-amber-900/30">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Captions className="w-3.5 h-3.5 text-amber-400" />
              Subtitles & Closed Captions
            </div>
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
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                subtitlesOn ? 'bg-amber-500/20 text-amber-100 border-amber-500/40' : 'bg-amber-950/20 text-amber-300/70 border-amber-900/20 hover:bg-amber-900/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <Captions className="w-4 h-4 text-amber-400" />
                <span>Closed Captions & Subtitles</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/40 border border-amber-500/20">
                {subtitlesOn ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* ── Environment & Playback Tools ── */}
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

            {activeVideo && !isLocalMedia && (
              <button
                onClick={() => { setShowStudioDrawer(false); handoffToUTube(); }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs font-bold text-red-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Tv className="w-4 h-4 text-red-400" />
                <span>Switch to U-Tube Player (Preserve Time)</span>
              </button>
            )}

            <button
              onClick={() => { setShowStudioDrawer(false); setShowShortcuts(true); }}
              className="w-full py-2 px-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-900/30 text-xs font-bold text-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>View Keyboard Shortcuts</span>
            </button>
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
