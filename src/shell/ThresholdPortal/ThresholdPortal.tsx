/**
 * ThresholdPortal.tsx — OmniStream Cosmic Dual-Portal Gateway
 *
 * Implements the exact visual references for both:
 *   - Dark Theme (Deep Obsidian Cosmic Space)
 *   - Light Theme (Pearlescent Ethereal Alabaster)
 *
 * Featuring:
 *   - Upper Center: Concentric radiant cosmic ring + OMNISTREAM cinematic typography
 *   - Left Wing: Crimson silk energy streams + 3D U-Tube orb portal with custom artwork
 *   - Right Wing: Electric blue silk energy streams + 3D CineMorph orb portal with custom artwork
 *   - Reflective Ground Plane: Concentric floor ripple rings + "CHOOSE YOUR STREAM" indicator
 *   - Interactive: Cursor-reactive light field, particle dust, keyboard hotkeys, and seamless transitions
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useReducer,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Sliders,
  Sun,
  Moon,
  Laptop,
  WifiOff,
  Sparkles,
  X,
  Tv,
  Film,
  ChevronDown,
} from 'lucide-react';
import { GlobalSettingsDrawer } from '../Settings/GlobalSettingsDrawer';
import { useAppStore } from '@/src/store';
import { useCineMorphStore } from '@omnistream/cinemorph/state/useCineMorphStore';
import { omsTransitionService, OMSTransitionContext } from '@omnistream/core/oms/omsTransitionService';
import { OMSLogo } from '@omnistream/shared/ui/OMSLogo';
import { requestLandscapeOrientation } from '@omnistream/cinemorph/services/orientationService';

const SESSION_KEY = 'oms_threshold_v3_seen';

type Zone = 'utube' | 'cinemorph';
type EnterState = Zone | null;

export const ThresholdPortal: React.FC = () => {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const { theme, setTheme, setVersionMode } = useAppStore();
  const { isOffline } = useCineMorphStore();

  const [focus, setFocus] = useState<Zone | null>(null);
  const [entering, setEntering] = useState<EnterState>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [carriedContext, setCarriedContext] = useState<OMSTransitionContext | null>(() =>
    omsTransitionService.getActiveContext()
  );
  const [introComplete, setIntroComplete] = useState<boolean>(() =>
    typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [, forceRender] = useReducer((x) => x + 1, 0);

  const rootRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef({ x: 0.5, y: 0.5 });
  const focusRef = useRef<Zone | null>(null);
  const rafRef = useRef<number>();

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // ─── Intro Animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (introComplete) return;
    const t = setTimeout(() => {
      setIntroComplete(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }, 700);
    return () => clearTimeout(t);
  }, [introComplete]);

  // ─── Live Cursor Ambient Light Field (RAF — zero React state overhead) ────
  useEffect(() => {
    if (prefersReduced) return;

    const move = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      cursorRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { x, y } = cursorRef.current;
        const lf = lightRef.current;
        if (lf) {
          lf.style.setProperty('--cx', `${(x * 100).toFixed(1)}%`);
          lf.style.setProperty('--cy', `${(y * 100).toFixed(1)}%`);
        }
      });
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => {
      window.removeEventListener('mousemove', move);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReduced]);

  // ─── Navigation Execution ──────────────────────────────────────────────────
  const enter = useCallback(
    (zone: Zone) => {
      if (entering) return;
      setEntering(zone);
      setVersionMode(zone === 'utube' ? 'v1' : 'v2');
      if (zone === 'cinemorph') {
        requestLandscapeOrientation().catch(() => {});
      }
      setTimeout(() => navigate(zone === 'utube' ? '/home' : '/cinemorph'), 450);
    },
    [entering, navigate, setVersionMode]
  );

  // ─── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (settingsOpen || entering) return;
      if (e.key === 'ArrowLeft' || e.key === 'u' || e.key === 'U') {
        focusRef.current = 'utube';
        setFocus('utube');
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'c' || e.key === 'C') {
        focusRef.current = 'cinemorph';
        setFocus('cinemorph');
        return;
      }
      if (e.key === 'Escape') {
        focusRef.current = null;
        setFocus(null);
        return;
      }
      if (e.key === 'Enter') {
        if (focus === 'utube') enter('utube');
        else if (focus === 'cinemorph') enter('cinemorph');
        return;
      }
      if (e.key === 's' || e.key === 'S') setSettingsOpen((p) => !p);
      if (e.key === 't' || e.key === 'T') {
        const next = { light: 'dark', dark: 'system', system: 'light' } as const;
        setTheme(next[theme] ?? 'light');
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [focus, settingsOpen, entering, enter, theme, setTheme]);

  const cycleTheme = useCallback(() => {
    const next = { light: 'dark', dark: 'system', system: 'light' } as const;
    setTheme(next[theme] ?? 'light');
  }, [theme, setTheme]);

  const onEnterZone = (zone: Zone) => {
    focusRef.current = zone;
    setFocus(zone);
  };
  const onLeaveZone = () => {
    focusRef.current = null;
    setFocus(null);
  };

  const uActive = focus === 'utube';
  const cmActive = focus === 'cinemorph';

  return (
    <div
      ref={rootRef}
      role="main"
      aria-label="OmniStream entrance"
      className="relative w-full min-h-[100dvh] overflow-x-hidden overflow-y-auto select-none flex flex-col justify-between"
      style={{
        background: isDark
          ? cmActive
            ? 'radial-gradient(ellipse at 70% 40%, #040914 0%, #020408 60%, #010204 100%)'
            : uActive
            ? 'radial-gradient(ellipse at 30% 40%, #120305 0%, #070102 60%, #010204 100%)'
            : 'radial-gradient(ellipse at 50% 30%, #070a14 0%, #03050a 50%, #010204 100%)'
          : cmActive
          ? 'radial-gradient(ellipse at 70% 35%, #F4F7FA 0%, #EAF0F6 35%, #F3F6FA 70%, #EBE7DF 100%)'
          : uActive
          ? 'radial-gradient(ellipse at 30% 35%, #FAF4F2 0%, #F6ECEB 35%, #FAF2F0 70%, #EBE7DF 100%)'
          : 'radial-gradient(ellipse 120% 100% at 50% 20%, #FAF8F5 0%, #F5F1EA 40%, #ECE7DE 80%, #E3DCD0 100%)',
        transition: 'background 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Dynamic Silk Energy Tendrils SVG Overlay ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60 transition-opacity duration-700"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Left Crimson Silk Lines */}
        <path
          d="M-50 450 C 200 420, 300 580, 500 500 C 650 440, 700 480, 720 450"
          stroke={isDark ? 'url(#crimsonFlowDark)' : 'url(#crimsonFlowLight)'}
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="animate-pulse"
        />
        <path
          d="M-100 300 C 150 250, 250 450, 480 430 C 600 420, 680 440, 720 450"
          stroke={isDark ? 'url(#crimsonFlowDark)' : 'url(#crimsonFlowLight)'}
          strokeWidth="2"
          opacity="0.7"
        />
        <path
          d="M-80 600 C 120 620, 280 500, 450 540 C 600 580, 680 480, 720 450"
          stroke={isDark ? 'url(#crimsonFlowDark)' : 'url(#crimsonFlowLight)'}
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Right Cyan Silk Lines */}
        <path
          d="M1490 450 C 1240 420, 1140 580, 940 500 C 790 440, 740 480, 720 450"
          stroke={isDark ? 'url(#cyanFlowDark)' : 'url(#cyanFlowLight)'}
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="animate-pulse"
        />
        <path
          d="M1540 300 C 1290 250, 1190 450, 960 430 C 840 420, 760 440, 720 450"
          stroke={isDark ? 'url(#cyanFlowDark)' : 'url(#cyanFlowLight)'}
          strokeWidth="2"
          opacity="0.7"
        />
        <path
          d="M1520 600 C 1320 620, 1160 500, 990 540 C 840 580, 760 480, 720 450"
          stroke={isDark ? 'url(#cyanFlowDark)' : 'url(#cyanFlowLight)'}
          strokeWidth="1"
          opacity="0.5"
        />

        <defs>
          <linearGradient id="crimsonFlowDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E50914" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#E50914" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="crimsonFlowLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C7494F" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#C7494F" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="cyanFlowDark" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00A8FF" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="cyanFlowLight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A7C9F" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#4A7C9F" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Volumetric Nebula Particle & Glow Fields (RAF-Controlled) ── */}
      <div
        ref={lightRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? uActive
              ? 'radial-gradient(ellipse 900px 700px at 28% 50%, rgba(229,9,20,0.25) 0%, transparent 70%)'
              : cmActive
              ? 'radial-gradient(ellipse 900px 700px at 72% 50%, rgba(0,168,255,0.28) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 700px 500px at 25% 50%, rgba(229,9,20,0.14) 0%, transparent 65%), radial-gradient(ellipse 700px 500px at 75% 50%, rgba(0,168,255,0.16) 0%, transparent 65%)'
            : uActive
            ? 'radial-gradient(ellipse 800px 600px at 28% 50%, rgba(199,73,79,0.09) 0%, transparent 70%)'
            : cmActive
            ? 'radial-gradient(ellipse 800px 600px at 72% 50%, rgba(74,124,159,0.11) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 600px 450px at 25% 50%, rgba(199,73,79,0.05) 0%, transparent 65%), radial-gradient(ellipse 600px 450px at 75% 50%, rgba(74,124,159,0.06) 0%, transparent 65%)',
        }}
      />

      {/* ── Micro Particle Dust Overlay ── */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <div className="absolute top-[22%] left-[18%] w-1.5 h-1.5 bg-rose-400/80 rounded-full blur-[0.5px] animate-pulse" />
        <div className="absolute top-[38%] left-[10%] w-1 h-1 bg-amber-400/60 rounded-full" />
        <div className="absolute top-[68%] left-[24%] w-1.5 h-1.5 bg-rose-300/70 rounded-full blur-[0.5px]" />
        <div className="absolute top-[20%] right-[19%] w-1.5 h-1.5 bg-sky-400/80 rounded-full blur-[0.5px] animate-pulse" />
        <div className="absolute top-[42%] right-[12%] w-1 h-1 bg-indigo-300/60 rounded-full" />
        <div className="absolute top-[72%] right-[22%] w-1.5 h-1.5 bg-slate-400/70 rounded-full blur-[0.5px]" />
      </div>

      {/* ── Top Header Controls (Settings, Theme, Offline) ── */}
      <header className="relative z-30 w-full px-4 sm:px-8 md:px-12 py-3 sm:py-4 flex items-center justify-between pointer-events-auto shrink-0">
        {/* Left Status Mark */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              uActive
                ? 'bg-[#C7494F] shadow-[0_0_10px_rgba(199,73,79,0.6)]'
                : cmActive
                ? 'bg-[#4A7C9F] shadow-[0_0_10px_rgba(74,124,159,0.6)]'
                : isDark
                ? 'bg-neutral-500'
                : 'bg-[#8F96A3]'
            }`}
          />
          <span
            className="text-[10px] font-mono uppercase tracking-[0.3em] font-semibold transition-colors duration-500"
            style={{
              color: isDark ? 'rgba(236,238,242,0.5)' : 'rgba(20,32,56,0.6)',
            }}
          >
            Spatial Dual-Engine Gateway
          </span>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center gap-2">
          {isOffline && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[9px] tracking-wider uppercase"
              style={{
                background: 'rgba(180,122,44,0.15)',
                border: '0.5px solid rgba(180,122,44,0.35)',
                color: isDark ? '#E5AD47' : '#8A5A14',
              }}
            >
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}

          <button
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}`}
            title={`Current theme: ${theme} (press T to switch)`}
            className="p-2 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              color: isDark ? 'rgba(236,238,242,0.65)' : 'rgba(20,32,56,0.7)',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-600" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Laptop className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="System Preferences (S)"
            className="p-2 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 group"
            style={{
              color: isDark ? 'rgba(236,238,242,0.65)' : 'rgba(20,32,56,0.7)',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Sliders className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
          </button>
        </div>
      </header>

      {/* ── Main Spatial Arena: OmniStream Core + Two Portals ── */}
      <main className="relative z-20 w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 max-w-7xl mx-auto py-3 sm:py-5">
        
        {/* ── 1. OmniStream Upper Cosmic Identity ── */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6 md:mb-8 pointer-events-none">
          
          {/* Concentric Living OMS Cosmic Symbol */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center mb-2.5 sm:mb-3"
          >
            {/* Outer Radiant Volumetric Glow Halo */}
            <div
              className="absolute -inset-4 rounded-full blur-xl opacity-75 animate-pulse"
              style={{
                background: isDark
                  ? 'radial-gradient(circle, rgba(0,168,255,0.7) 0%, rgba(229,9,20,0.5) 60%, transparent 80%)'
                  : 'radial-gradient(circle, rgba(74,124,159,0.3) 0%, rgba(199,73,79,0.25) 60%, transparent 80%)',
              }}
            />
            {/* Rotating Celestial Orbital Dashed Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-3 rounded-full border border-cyan-500/40 border-dashed pointer-events-none"
            />
            {/* The Official OMS Logo with Living Effects */}
            <OMSLogo variant={isDark ? 'dark' : 'light'} size="lg" animated={true} />
          </motion.div>

          {/* OMNISTREAM Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <h1
              className="font-cinematic-title font-black uppercase text-center tracking-[0.35em] sm:tracking-[0.55em] md:tracking-[0.7em] text-lg sm:text-2xl md:text-3xl lg:text-4xl"
              style={{
                color: isDark ? '#EDEFF5' : '#0B1528',
                textShadow: isDark
                  ? '0 0 35px rgba(255,255,255,0.25)'
                  : '0 2px 20px rgba(11,21,40,0.06)',
              }}
            >
              OMNISTREAM
            </h1>

            {/* Horizontal Refraction Laser Line */}
            <div
              className="mt-2 sm:mt-3 w-48 sm:w-72 md:w-96 h-[1px] mx-auto opacity-70"
              style={{
                background: isDark
                  ? 'linear-gradient(90deg, transparent 0%, rgba(229,9,20,0.6) 30%, rgba(0,168,255,0.8) 70%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(199,73,79,0.45) 30%, rgba(74,124,159,0.5) 70%, transparent 100%)',
              }}
            />

            {/* Shared Subtle Tagline Uniting Both Engines */}
            <p
              className="mt-2 sm:mt-2.5 text-[10px] sm:text-xs font-sans tracking-[0.15em] sm:tracking-[0.25em] text-center font-normal transition-colors duration-500 select-none"
              style={{
                color: isDark ? 'rgba(237,239,245,0.55)' : 'rgba(15,28,54,0.62)',
              }}
            >
              Different ways to watch. One better viewing experience.
            </p>
          </motion.div>
        </div>

        {/* ── 2. The Two Dimensional Experience Portals ── */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10 md:gap-14 lg:gap-20 max-w-5xl my-2 sm:my-3">
          
          {/* ── LEFT PORTAL: U-TUBE ── */}
          <div className="flex flex-col items-center group">
            <button
              type="button"
              role="button"
              aria-label="Enter U-TUBE discovery engine"
              onClick={() => enter('utube')}
              onMouseEnter={() => onEnterZone('utube')}
              onMouseLeave={onLeaveZone}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && enter('utube')}
              className={`relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full transition-all duration-700 cursor-pointer flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-rose-400/50 ${
                uActive
                  ? isDark
                    ? 'scale-105 shadow-[0_0_80px_rgba(229,9,20,0.55)]'
                    : 'scale-105 shadow-[0_15px_50px_rgba(199,73,79,0.32),0_0_35px_rgba(199,73,79,0.2)]'
                  : 'hover:scale-[1.03] active:scale-[0.98]'
              }`}
            >
              {/* Outer Radiant Crimson Ring */}
              <div
                className={`absolute inset-0 rounded-full p-[2.5px] transition-all duration-500 ${
                  uActive
                    ? isDark ? 'shadow-[0_0_40px_rgba(229,9,20,0.85)]' : 'shadow-[0_0_35px_rgba(199,73,79,0.6)]'
                    : 'opacity-85 group-hover:opacity-100'
                }`}
                style={{
                  background: isDark
                    ? 'conic-gradient(from 180deg at 50% 50%, #E50914 0deg, rgba(229,9,20,0.3) 120deg, #FF334B 240deg, #E50914 360deg)'
                    : 'conic-gradient(from 180deg at 50% 50%, #C7494F 0deg, rgba(224,122,128,0.4) 120deg, #D45E65 240deg, #B53A41 360deg)',
                }}
              >
                {/* Inner Portal Spherical Body */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500"
                  style={{
                    background: isDark
                      ? 'radial-gradient(circle at 50% 40%, #1c0607 0%, #0c0203 70%, #000000 100%)'
                      : 'radial-gradient(circle at 50% 35%, #FFFFFF 0%, #FDF8F7 50%, #F8EEEE 80%, #EFE1DF 100%)',
                    boxShadow: isDark
                      ? 'inset 0 0 40px rgba(229,9,20,0.4), inset 0 0 15px rgba(0,0,0,0.8)'
                      : 'inset 0 0 35px rgba(199,73,79,0.14), 0 10px 30px rgba(199,73,79,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Concentric Glass Ring Overlay */}
                  <div className="absolute inset-3 rounded-full border border-rose-500/25 pointer-events-none" />

                  {/* The Custom U-Tube Artwork Image */}
                  <img
                    src="/utube_artwork.png"
                    alt="U-TUBE"
                    draggable={false}
                    className={`w-4/5 h-4/5 object-contain filter transition-all duration-500 drop-shadow-[0_10px_25px_rgba(199,73,79,0.25)] ${
                      uActive
                        ? isDark
                          ? 'scale-110 drop-shadow-[0_0_35px_rgba(229,9,20,0.8)]'
                          : 'scale-110 drop-shadow-[0_0_35px_rgba(199,73,79,0.5)]'
                        : 'group-hover:scale-105'
                    }`}
                  />
                </div>
              </div>

              {/* Rotating Kinetic Energy Particles */}
              {!prefersReduced && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-2 rounded-full border border-rose-400/30 border-dashed pointer-events-none"
                />
              )}
            </button>

            {/* Label & Indicator */}
            <div className="mt-3 sm:mt-4 flex flex-col items-center gap-0.5 sm:gap-1">
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.3em] font-bold transition-colors duration-500 ${
                  uActive
                    ? isDark ? 'text-[#E50914]' : 'text-[#C7494F]'
                    : isDark ? 'text-neutral-400' : 'text-slate-500'
                }`}
              >
                DISCOVERY FLOW
              </span>

              <h2
                className="font-cinematic-title font-black uppercase text-lg sm:text-xl tracking-wider transition-colors duration-500"
                style={{
                  color: uActive
                    ? isDark ? '#E50914' : '#C7494F'
                    : isDark ? '#EDEFF5' : '#0B1528',
                }}
              >
                U-TUBE
              </h2>

              {/* Floating Circular Down-Chevron Beacon */}
              <div
                className={`mt-1 sm:mt-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  uActive
                    ? isDark
                      ? 'bg-[#E50914] text-white shadow-[0_0_15px_#E50914] scale-110'
                      : 'bg-[#C7494F] text-white shadow-[0_0_16px_rgba(199,73,79,0.45)] scale-110'
                    : isDark
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-[#C7494F]/10 text-[#C7494F] border border-[#C7494F]/25 shadow-sm'
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* ── Center Divider Beam (Desktop) ── */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <div
              className="w-[1px] h-44 lg:h-48 transition-all duration-700"
              style={{
                background: uActive
                  ? isDark
                    ? 'linear-gradient(to bottom, transparent, #E50914, transparent)'
                    : 'linear-gradient(to bottom, transparent, #C7494F, transparent)'
                  : cmActive
                  ? isDark
                    ? 'linear-gradient(to bottom, transparent, #00A8FF, transparent)'
                    : 'linear-gradient(to bottom, transparent, #4A7C9F, transparent)'
                  : isDark
                  ? 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)'
                  : 'linear-gradient(to bottom, transparent, rgba(199,73,79,0.3) 30%, rgba(74,124,159,0.35) 70%, transparent)',
              }}
            />
          </div>

          {/* ── RIGHT PORTAL: CINEMORPH ── */}
          <div className="flex flex-col items-center group">
            <button
              type="button"
              role="button"
              aria-label="Enter CineMorph theater engine"
              onClick={() => enter('cinemorph')}
              onMouseEnter={() => onEnterZone('cinemorph')}
              onMouseLeave={onLeaveZone}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && enter('cinemorph')}
              className={`relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full transition-all duration-700 cursor-pointer flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 ${
                cmActive
                  ? isDark
                    ? 'scale-105 shadow-[0_0_80px_rgba(0,168,255,0.55)]'
                    : 'scale-105 shadow-[0_15px_50px_rgba(74,124,159,0.32),0_0_35px_rgba(74,124,159,0.2)]'
                  : 'hover:scale-[1.03] active:scale-[0.98]'
              }`}
            >
              {/* Outer Radiant Electric-Blue Ring */}
              <div
                className={`absolute inset-0 rounded-full p-[2.5px] transition-all duration-500 ${
                  cmActive
                    ? isDark ? 'shadow-[0_0_40px_rgba(0,168,255,0.85)]' : 'shadow-[0_0_35px_rgba(74,124,159,0.6)]'
                    : 'opacity-85 group-hover:opacity-100'
                }`}
                style={{
                  background: isDark
                    ? 'conic-gradient(from 0deg at 50% 50%, #00A8FF 0deg, rgba(0,168,255,0.3) 120deg, #5CE1E6 240deg, #00A8FF 360deg)'
                    : 'conic-gradient(from 0deg at 50% 50%, #466F95 0deg, rgba(107,149,188,0.4) 120deg, #5781A8 240deg, #375F84 360deg)',
                }}
              >
                {/* Inner Portal Spherical Body */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500"
                  style={{
                    background: isDark
                      ? 'radial-gradient(circle at 50% 40%, #051424 0%, #020912 70%, #000000 100%)'
                      : 'radial-gradient(circle at 50% 35%, #FFFFFF 0%, #F6F9FC 50%, #EAF1F7 80%, #DFE8F1 100%)',
                    boxShadow: isDark
                      ? 'inset 0 0 40px rgba(0,168,255,0.4), inset 0 0 15px rgba(0,0,0,0.8)'
                      : 'inset 0 0 35px rgba(70,111,149,0.14), 0 10px 30px rgba(70,111,149,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Concentric Glass Ring Overlay */}
                  <div className="absolute inset-3 rounded-full border border-cyan-500/25 pointer-events-none" />

                  {/* The Custom CineMorph Artwork Image */}
                  <img
                    src="/cinemorph_artwork.png"
                    alt="CINEMORPH"
                    draggable={false}
                    className={`w-4/5 h-4/5 object-contain filter transition-all duration-500 drop-shadow-[0_10px_25px_rgba(70,111,149,0.25)] ${
                      cmActive
                        ? isDark
                          ? 'scale-110 drop-shadow-[0_0_35px_rgba(0,168,255,0.8)]'
                          : 'scale-110 drop-shadow-[0_0_35px_rgba(74,124,159,0.5)]'
                        : 'group-hover:scale-105'
                    }`}
                  />
                </div>
              </div>

              {/* Rotating Kinetic Energy Aperture */}
              {!prefersReduced && (
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-2 rounded-full border border-cyan-400/30 border-dashed pointer-events-none"
                />
              )}
            </button>

            {/* Label & Indicator */}
            <div className="mt-3 sm:mt-4 flex flex-col items-center gap-0.5 sm:gap-1">
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.3em] font-bold transition-colors duration-500 ${
                  cmActive
                    ? isDark ? 'text-[#00A8FF]' : 'text-[#4A7C9F]'
                    : isDark ? 'text-neutral-400' : 'text-slate-500'
                }`}
              >
                THEATER APERTURE
              </span>

              <h2
                className="font-cinematic-title font-black uppercase text-lg sm:text-xl tracking-wider transition-colors duration-500"
                style={{
                  color: cmActive
                    ? isDark ? '#00A8FF' : '#4A7C9F'
                    : isDark ? '#EDEFF5' : '#0B1528',
                }}
              >
                CINEMORPH
              </h2>

              {/* Floating Circular Down-Chevron Beacon */}
              <div
                className={`mt-1 sm:mt-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  cmActive
                    ? isDark
                      ? 'bg-[#00A8FF] text-white shadow-[0_0_15px_#00A8FF] scale-110'
                      : 'bg-[#4A7C9F] text-white shadow-[0_0_16px_rgba(74,124,159,0.45)] scale-110'
                    : isDark
                    ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                    : 'bg-[#4A7C9F]/10 text-[#4A7C9F] border border-[#4A7C9F]/25 shadow-sm'
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Choice Indicator & Reflective Floor (Lower Area) ── */}
        <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col items-center text-center pointer-events-none">
          <span
            className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.45em] font-bold transition-colors duration-500"
            style={{
              color: isDark ? 'rgba(236,238,242,0.45)' : 'rgba(15,28,54,0.55)',
            }}
          >
            CHOOSE YOUR STREAM
          </span>
          <div
            className="mt-2 w-8 h-[1px] mx-auto opacity-50"
            style={{
              background: isDark ? '#FFFFFF' : '#0B1528',
            }}
          />
        </div>
      </main>

      {/* ── Footer System Bar ── */}
      <footer className="relative z-30 w-full px-4 sm:px-8 md:px-12 py-3 sm:py-4 flex items-center justify-between pointer-events-auto shrink-0">
        <div 
          className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest transition-colors duration-500"
          style={{
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,28,54,0.45)',
          }}
        >
          Architecture: AROH L3 Intelligence Standard
        </div>

        {/* AROH Seal of Quality */}
        <div
          aria-label="An AROH product"
          title="An AROH product"
          className="flex items-center gap-2"
        >
          <img
            src="/aroh_seal.jpg"
            alt="AROH"
            draggable={false}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover opacity-40 hover:opacity-90 transition-opacity duration-300"
          />
        </div>

        <div 
          className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest transition-colors duration-500 hidden sm:block"
          style={{
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,28,54,0.45)',
          }}
        >
          Press (U) / (C) to Choose • (S) for Settings
        </div>
      </footer>

      {/* ─── Entry Transitions ─── */}
      <AnimatePresence>
        {entering === 'utube' && (
          <motion.div
            key="enter-utube"
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: isDark ? '#0A0304' : '#FAF4F2' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center flex flex-col items-center gap-2"
            >
              <span className={`text-[10px] font-mono tracking-[0.35em] uppercase font-bold ${isDark ? 'text-[#E50914]' : 'text-[#C7494F]'}`}>
                Entering Discovery
              </span>
              <div className="font-cinematic-title font-black uppercase text-5xl sm:text-7xl text-neutral-900 dark:text-neutral-100">
                U-TUBE
              </div>
            </motion.div>
          </motion.div>
        )}

        {entering === 'cinemorph' && (
          <motion.div
            key="enter-cinemorph"
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: isDark ? '#020912' : '#F4F7FA' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center flex flex-col items-center gap-2"
            >
              <span className={`text-[10px] font-mono tracking-[0.35em] uppercase font-bold ${isDark ? 'text-[#00A8FF]' : 'text-[#4A7C9F]'}`}>
                Opening Aperture
              </span>
              <div className="font-cinematic-title font-black uppercase text-5xl sm:text-7xl text-[#0B1528] dark:text-[#F0EEE8]">
                CINEMORPH
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── OMS Carried Viewing Context Floating Ribbon ─── */}
      <AnimatePresence>
        {carriedContext && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 inset-x-0 mx-auto w-full max-w-xl px-4 z-40"
          >
            <div
              className={`p-3 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#12131a]/95 border-white/15 text-white shadow-black/80'
                  : 'bg-white/95 border-black/10 text-neutral-900 shadow-neutral-500/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-black/20 shrink-0 border border-white/10">
                  <img
                    src={carriedContext.thumbnailUrl}
                    alt={carriedContext.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-amber-500 font-mono">
                    <Sparkles className="w-3 h-3" />
                    <span>Carried Media Context</span>
                    {carriedContext.currentTimestampSeconds > 0 && (
                      <span className="text-neutral-400 font-mono text-[9px]">
                        • {Math.floor(carriedContext.currentTimestampSeconds / 60)}:{(carriedContext.currentTimestampSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold truncate max-w-[180px] sm:max-w-[260px]">
                    {carriedContext.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    omsTransitionService.executeCineMorphEntry(carriedContext, navigate);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer border border-slate-600/50 hover:scale-105"
                  title="Transform into CineMorph Virtual Theater"
                >
                  <Film className="w-3.5 h-3.5 text-slate-300" />
                  <span>CineMorph</span>
                </button>

                <button
                  onClick={() => {
                    omsTransitionService.executeUTubeResume(carriedContext, navigate);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#E50914] hover:opacity-90 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105"
                  title="Resume in U-Tube Standard Player"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>U-Tube</span>
                </button>

                <button
                  onClick={() => {
                    omsTransitionService.clearActiveContext();
                    setCarriedContext(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  title="Dismiss Context"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Global Settings Drawer ─── */}
      <GlobalSettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
