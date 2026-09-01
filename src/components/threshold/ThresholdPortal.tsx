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
import { GlobalSettingsDrawer } from '../settings/GlobalSettingsDrawer';
import { useAppStore } from '../../store';
import { useCineMorphStore } from '../../state/useCineMorphStore';
import { omsTransitionService, OMSTransitionContext } from '../../services/omsTransitionService';

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
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col justify-between"
      style={{
        background: isDark
          ? cmActive
            ? 'radial-gradient(ellipse at 70% 40%, #040914 0%, #020408 60%, #010204 100%)'
            : uActive
            ? 'radial-gradient(ellipse at 30% 40%, #120305 0%, #070102 60%, #010204 100%)'
            : 'radial-gradient(ellipse at 50% 30%, #070a14 0%, #03050a 50%, #010204 100%)'
          : cmActive
          ? 'radial-gradient(ellipse at 70% 40%, #EDF4FA 0%, #F5F8FC 60%, #FFFFFF 100%)'
          : uActive
          ? 'radial-gradient(ellipse at 30% 40%, #FAEEEE 0%, #FCF6F6 60%, #FFFFFF 100%)'
          : 'radial-gradient(ellipse at 50% 30%, #FFFFFF 0%, #F5F7FA 50%, #ECEFF4 100%)',
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
            <stop offset="0%" stopColor="#FF334B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF334B" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="cyanFlowDark" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00A8FF" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="cyanFlowLight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00A8FF" stopOpacity="0.0" />
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
            ? 'radial-gradient(ellipse 900px 700px at 28% 50%, rgba(229,9,20,0.16) 0%, transparent 70%)'
            : cmActive
            ? 'radial-gradient(ellipse 900px 700px at 72% 50%, rgba(0,168,255,0.18) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 700px 500px at 25% 50%, rgba(229,9,20,0.09) 0%, transparent 65%), radial-gradient(ellipse 700px 500px at 75% 50%, rgba(0,168,255,0.09) 0%, transparent 65%)',
        }}
      />

      {/* ── Micro Particle Dust Overlay ── */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-50">
        <div className="absolute top-[22%] left-[18%] w-1.5 h-1.5 bg-red-500 rounded-full blur-[0.5px] animate-pulse" />
        <div className="absolute top-[38%] left-[10%] w-1 h-1 bg-rose-400 rounded-full" />
        <div className="absolute top-[68%] left-[24%] w-1.5 h-1.5 bg-red-400 rounded-full blur-[0.5px]" />
        <div className="absolute top-[20%] right-[19%] w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[0.5px] animate-pulse" />
        <div className="absolute top-[42%] right-[12%] w-1 h-1 bg-blue-400 rounded-full" />
        <div className="absolute top-[72%] right-[22%] w-1.5 h-1.5 bg-sky-400 rounded-full blur-[0.5px]" />
      </div>

      {/* ── Top Header Controls (Settings, Theme, Offline) ── */}
      <header className="relative z-30 w-full px-6 sm:px-12 py-5 flex items-center justify-between pointer-events-auto">
        {/* Left Status Mark */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              uActive
                ? 'bg-[#E50914] shadow-[0_0_12px_#E50914]'
                : cmActive
                ? 'bg-[#00A8FF] shadow-[0_0_12px_#00A8FF]'
                : isDark
                ? 'bg-neutral-500'
                : 'bg-neutral-400'
            }`}
          />
          <span
            className="text-[10px] font-mono uppercase tracking-[0.3em] font-semibold transition-colors duration-500"
            style={{
              color: isDark ? 'rgba(236,238,242,0.5)' : 'rgba(26,26,24,0.5)',
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
              color: isDark ? 'rgba(236,238,242,0.65)' : 'rgba(26,26,24,0.65)',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
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
              color: isDark ? 'rgba(236,238,242,0.65)' : 'rgba(26,26,24,0.65)',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Sliders className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
          </button>
        </div>
      </header>

      {/* ── Main Spatial Arena: OmniStream Core + Two Portals ── */}
      <main className="relative z-20 w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-8 max-w-7xl mx-auto my-auto">
        
        {/* ── 1. OmniStream Upper Cosmic Identity ── */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-10 pointer-events-none">
          
          {/* Concentric Cosmic Ring Symbol */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-3"
          >
            {/* Outer Radiant Glow */}
            <div
              className="absolute inset-0 rounded-full blur-md opacity-80"
              style={{
                background: 'radial-gradient(circle, rgba(0,168,255,0.8) 0%, rgba(229,9,20,0.6) 50%, transparent 80%)',
              }}
            />
            {/* Rotating Celestial Dashed Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-1 rounded-full border border-cyan-400/50 border-dashed"
            />
            {/* Gradient Cosmic Ring */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-[2px] shadow-[0_0_25px_rgba(0,168,255,0.6)]"
              style={{
                background: 'linear-gradient(135deg, #00A8FF 0%, #FF334B 50%, #00A8FF 100%)',
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: isDark ? '#05060A' : '#FFFFFF',
                }}
              />
            </div>
          </motion.div>

          {/* OMNISTREAM Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <h1
              className="font-cinematic-title font-black uppercase text-center tracking-[0.55em] sm:tracking-[0.7em] text-xl sm:text-3xl md:text-4xl"
              style={{
                color: isDark ? '#EDEFF5' : '#0B1B3D',
                textShadow: isDark
                  ? '0 0 35px rgba(255,255,255,0.25)'
                  : '0 2px 12px rgba(11,27,61,0.08)',
              }}
            >
              OMNISTREAM
            </h1>

            {/* Horizontal Refraction Laser Line */}
            <div
              className="mt-3 w-64 sm:w-96 h-[1px] mx-auto opacity-70"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(229,9,20,0.6) 30%, rgba(0,168,255,0.8) 70%, transparent 100%)',
              }}
            />
          </motion.div>
        </div>

        {/* ── 2. The Two Dimensional Experience Portals ── */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 sm:gap-14 md:gap-20 max-w-5xl">
          
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
              className={`relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full transition-all duration-700 cursor-pointer flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-red-500/50 ${
                uActive
                  ? 'scale-105 shadow-[0_0_80px_rgba(229,9,20,0.55)]'
                  : 'hover:scale-[1.03] active:scale-[0.98]'
              }`}
            >
              {/* Outer Radiant Crimson Ring */}
              <div
                className={`absolute inset-0 rounded-full p-[2.5px] transition-all duration-500 ${
                  uActive
                    ? 'shadow-[0_0_40px_rgba(229,9,20,0.85)]'
                    : 'opacity-85 group-hover:opacity-100'
                }`}
                style={{
                  background:
                    'conic-gradient(from 180deg at 50% 50%, #E50914 0deg, rgba(229,9,20,0.3) 120deg, #FF334B 240deg, #E50914 360deg)',
                }}
              >
                {/* Inner Portal Spherical Body */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500"
                  style={{
                    background: isDark
                      ? 'radial-gradient(circle at 50% 40%, #1c0607 0%, #0c0203 70%, #000000 100%)'
                      : 'radial-gradient(circle at 50% 35%, #ffffff 0%, #fcf3f3 60%, #fae8e8 100%)',
                    boxShadow: isDark
                      ? 'inset 0 0 40px rgba(229,9,20,0.4), inset 0 0 15px rgba(0,0,0,0.8)'
                      : 'inset 0 0 35px rgba(229,9,20,0.18), 0 10px 30px rgba(229,9,20,0.08)',
                  }}
                >
                  {/* Concentric Glass Ring Overlay */}
                  <div className="absolute inset-3 rounded-full border border-red-500/25 pointer-events-none" />

                  {/* The Custom U-Tube Artwork Image */}
                  <img
                    src="/utube_artwork.png"
                    alt="U-TUBE"
                    draggable={false}
                    className={`w-4/5 h-4/5 object-contain filter transition-all duration-500 drop-shadow-[0_10px_25px_rgba(229,9,20,0.35)] ${
                      uActive
                        ? 'scale-110 drop-shadow-[0_0_35px_rgba(229,9,20,0.8)]'
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
                  className="absolute -inset-2 rounded-full border border-red-500/25 border-dashed pointer-events-none"
                />
              )}
            </button>

            {/* Label & Indicator */}
            <div className="mt-4 flex flex-col items-center gap-1">
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.3em] font-bold transition-colors duration-500 ${
                  uActive ? 'text-[#E50914]' : 'text-neutral-400'
                }`}
              >
                DISCOVERY FLOW
              </span>

              <h2
                className="font-cinematic-title font-black uppercase text-xl tracking-wider transition-colors duration-500"
                style={{
                  color: uActive
                    ? '#E50914'
                    : isDark
                    ? '#EDEFF5'
                    : '#0B1B3D',
                }}
              >
                U-TUBE
              </h2>

              {/* Floating Circular Down-Chevron Beacon */}
              <div
                className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  uActive
                    ? 'bg-[#E50914] text-white shadow-[0_0_15px_#E50914] scale-110'
                    : isDark
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-red-50 text-red-500 border border-red-200 shadow-sm'
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* ── Center Divider Beam (Desktop) ── */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <div
              className="w-[1px] h-48 transition-all duration-700"
              style={{
                background: uActive
                  ? 'linear-gradient(to bottom, transparent, #E50914, transparent)'
                  : cmActive
                  ? 'linear-gradient(to bottom, transparent, #00A8FF, transparent)'
                  : isDark
                  ? 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)'
                  : 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.15), transparent)',
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
              className={`relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full transition-all duration-700 cursor-pointer flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 ${
                cmActive
                  ? 'scale-105 shadow-[0_0_80px_rgba(0,168,255,0.55)]'
                  : 'hover:scale-[1.03] active:scale-[0.98]'
              }`}
            >
              {/* Outer Radiant Electric-Blue Ring */}
              <div
                className={`absolute inset-0 rounded-full p-[2.5px] transition-all duration-500 ${
                  cmActive
                    ? 'shadow-[0_0_40px_rgba(0,168,255,0.85)]'
                    : 'opacity-85 group-hover:opacity-100'
                }`}
                style={{
                  background:
                    'conic-gradient(from 0deg at 50% 50%, #00A8FF 0deg, rgba(0,168,255,0.3) 120deg, #5CE1E6 240deg, #00A8FF 360deg)',
                }}
              >
                {/* Inner Portal Spherical Body */}
                <div
                  className="w-full h-full rounded-full flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500"
                  style={{
                    background: isDark
                      ? 'radial-gradient(circle at 50% 40%, #051424 0%, #020912 70%, #000000 100%)'
                      : 'radial-gradient(circle at 50% 35%, #ffffff 0%, #f0f7fc 60%, #e2f0fa 100%)',
                    boxShadow: isDark
                      ? 'inset 0 0 40px rgba(0,168,255,0.4), inset 0 0 15px rgba(0,0,0,0.8)'
                      : 'inset 0 0 35px rgba(0,168,255,0.18), 0 10px 30px rgba(0,168,255,0.08)',
                  }}
                >
                  {/* Concentric Glass Ring Overlay */}
                  <div className="absolute inset-3 rounded-full border border-cyan-400/25 pointer-events-none" />

                  {/* The Custom CineMorph Artwork Image */}
                  <img
                    src="/cinemorph_artwork.png"
                    alt="CINEMORPH"
                    draggable={false}
                    className={`w-4/5 h-4/5 object-contain filter transition-all duration-500 drop-shadow-[0_10px_25px_rgba(0,168,255,0.35)] ${
                      cmActive
                        ? 'scale-110 drop-shadow-[0_0_35px_rgba(0,168,255,0.8)]'
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
                  className="absolute -inset-2 rounded-full border border-cyan-400/25 border-dashed pointer-events-none"
                />
              )}
            </button>

            {/* Label & Indicator */}
            <div className="mt-4 flex flex-col items-center gap-1">
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.3em] font-bold transition-colors duration-500 ${
                  cmActive ? 'text-[#00A8FF]' : 'text-neutral-400'
                }`}
              >
                THEATER APERTURE
              </span>

              <h2
                className="font-cinematic-title font-black uppercase text-xl tracking-wider transition-colors duration-500"
                style={{
                  color: cmActive
                    ? '#00A8FF'
                    : isDark
                    ? '#EDEFF5'
                    : '#0B1B3D',
                }}
              >
                CINEMORPH
              </h2>

              {/* Floating Circular Down-Chevron Beacon */}
              <div
                className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  cmActive
                    ? 'bg-[#00A8FF] text-white shadow-[0_0_15px_#00A8FF] scale-110'
                    : isDark
                    ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                    : 'bg-cyan-50 text-cyan-500 border border-cyan-200 shadow-sm'
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Choice Indicator & Reflective Floor (Lower Area) ── */}
        <div className="mt-8 sm:mt-12 flex flex-col items-center text-center pointer-events-none">
          <span
            className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.45em] font-bold transition-colors duration-500"
            style={{
              color: isDark ? 'rgba(236,238,242,0.45)' : 'rgba(11,27,61,0.5)',
            }}
          >
            CHOOSE YOUR STREAM
          </span>
          <div
            className="mt-2 w-8 h-[1px] mx-auto opacity-50"
            style={{
              background: isDark ? '#FFFFFF' : '#0B1B3D',
            }}
          />
        </div>
      </main>

      {/* ── Footer System Bar ── */}
      <footer className="relative z-30 w-full px-6 sm:px-12 py-5 flex items-center justify-between pointer-events-auto">
        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
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
            className="w-6 h-6 rounded-full object-cover opacity-40 hover:opacity-90 transition-opacity duration-300"
          />
        </div>

        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 hidden sm:block">
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
            style={{ background: isDark ? '#0A0304' : '#FAF6F4' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-[#E50914] font-bold">
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
            style={{ background: isDark ? '#020912' : '#F0F7FC' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-[#00A8FF] font-bold">
                Opening Aperture
              </span>
              <div className="font-cinematic-title font-black uppercase text-5xl sm:text-7xl text-[#0B1B3D] dark:text-[#F0EEE8]">
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
