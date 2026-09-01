/**
 * ThresholdPortal.tsx — OmniStream Monolithic Spatial Entrance (180° Overhaul)
 *
 * ARCHITECTURAL CONSTITUTION:
 *   - Clean, high-craft spatial threshold with dual architectural portals.
 *   - Zero fake marketing cards, zero generic thumbnail posters.
 *   - Pure, tactile, monolithic typography and atmospheric illumination.
 *   - Left: U-TUBE (Discovery Flow • Kinetic • Vermilion Accent #C7494F)
 *   - Right: CINEMORPH (Theater Aperture • Volumetric Velvet • Slate Accent #526C9E)
 *   - Center: OMNISTREAM equilibrium axis with RAF cursor-driven refraction.
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
  ArrowUpRight,
  Compass,
  Disc,
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

  // ─── Intro ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (introComplete) return;
    const t = setTimeout(() => {
      setIntroComplete(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }, 800);
    return () => clearTimeout(t);
  }, [introComplete]);

  // ─── Live light field via RAF (zero React state overhead) ─────────────────
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

  // ─── Navigation ────────────────────────────────────────────────────────────
  const enter = useCallback(
    (zone: Zone) => {
      if (entering) return;
      setEntering(zone);
      setVersionMode(zone === 'utube' ? 'v1' : 'v2');
      setTimeout(() => navigate(zone === 'utube' ? '/home' : '/cinemorph'), 450);
    },
    [entering, navigate, setVersionMode]
  );

  // ─── Keyboard Navigation ───────────────────────────────────────────────────
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
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [focus, settingsOpen, entering, enter]);

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
  const neutral = focus === null;

  return (
    <div
      ref={rootRef}
      role="main"
      aria-label="OmniStream entrance"
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col justify-between"
      style={{
        background: isDark
          ? cmActive
            ? '#050608'
            : uActive
            ? '#090809'
            : '#08090C'
          : uActive
          ? '#F6F3EE'
          : cmActive
          ? '#0D0E12'
          : '#F7F5F0',
        transition: 'background 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Architectural Ambient Glow Field (RAF-controlled) ── */}
      <div
        ref={lightRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? uActive
              ? 'radial-gradient(circle 800px at var(--cx, 25%) var(--cy, 50%), rgba(199,73,79,0.18) 0%, transparent 70%)'
              : cmActive
              ? 'radial-gradient(circle 800px at var(--cx, 75%) var(--cy, 50%), rgba(82,108,158,0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle 600px at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)'
            : uActive
            ? 'radial-gradient(circle 800px at var(--cx, 25%) var(--cy, 50%), rgba(199,73,79,0.12) 0%, transparent 70%)'
            : cmActive
            ? 'none'
            : 'radial-gradient(circle 700px at 50% 50%, rgba(255,255,255,0.85) 0%, transparent 70%)',
        }}
      />

      {/* ── Top Header Navigation Bar ── */}
      <header className="relative z-30 w-full px-6 sm:px-12 py-6 flex items-center justify-between pointer-events-auto">
        {/* Left Status Mark */}
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              uActive
                ? 'bg-[#C7494F] shadow-[0_0_10px_#C7494F]'
                : cmActive
                ? 'bg-[#526C9E] shadow-[0_0_10px_#526C9E]'
                : isDark
                ? 'bg-neutral-500'
                : 'bg-neutral-400'
            }`}
          />
          <span
            className="text-[10px] font-mono uppercase tracking-[0.28em] font-semibold transition-colors duration-500"
            style={{
              color: isDark
                ? cmActive
                  ? 'rgba(236,238,242,0.45)'
                  : 'rgba(236,238,242,0.6)'
                : cmActive
                ? 'rgba(240,238,232,0.5)'
                : 'rgba(26,26,24,0.6)',
            }}
          >
            Spatial Dual-Engine Gateway
          </span>
        </div>

        {/* Center OMNISTREAM Wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-cinematic-title font-black uppercase text-center tracking-[0.6em]"
            style={{
              fontSize: 'clamp(10px, 1.1vw, 15px)',
              letterSpacing: '0.6em',
              color: isDark
                ? cmActive
                  ? 'rgba(236,238,242,0.35)'
                  : 'rgba(236,238,242,0.85)'
                : uActive
                ? 'rgba(26,26,24,0.85)'
                : cmActive
                ? 'rgba(240,238,232,0.7)'
                : 'rgba(26,26,24,0.85)',
            }}
          >
            OMNISTREAM
          </motion.h1>
          <div
            className="mt-1 h-[0.5px] w-6 transition-all duration-500"
            style={{
              background: isDark
                ? cmActive
                  ? 'rgba(236,238,242,0.2)'
                  : 'rgba(236,238,242,0.4)'
                : cmActive
                ? 'rgba(240,238,232,0.3)'
                : 'rgba(26,26,24,0.4)',
            }}
          />
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {isOffline && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[9px] tracking-wider uppercase"
              style={{
                background: 'rgba(180,122,44,0.12)',
                border: '0.5px solid rgba(180,122,44,0.3)',
                color: isDark ? '#E5AD47' : '#8A5A14',
              }}
            >
              <WifiOff className="w-3 h-3" />
              <span>Offline Ready</span>
            </div>
          )}

          <button
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}`}
            title={`Current theme: ${theme} (click to switch)`}
            className="p-2 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              color: isDark
                ? cmActive
                  ? 'rgba(240,238,232,0.6)'
                  : 'rgba(236,238,242,0.6)'
                : cmActive
                ? 'rgba(240,238,232,0.6)'
                : 'rgba(26,26,24,0.6)',
              background: isDark
                ? 'rgba(255,255,255,0.06)'
                : cmActive
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.04)',
            }}
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4" />
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
              color: isDark
                ? cmActive
                  ? 'rgba(240,238,232,0.6)'
                  : 'rgba(236,238,242,0.6)'
                : cmActive
                ? 'rgba(240,238,232,0.6)'
                : 'rgba(26,26,24,0.6)',
              background: isDark
                ? 'rgba(255,255,255,0.06)'
                : cmActive
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.04)',
            }}
          >
            <Sliders className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
          </button>
        </div>
      </header>

      {/* ── Main Dual-Engine Monolithic Spatial Threshold ── */}
      <main className="relative z-20 w-full flex-1 flex flex-col md:flex-row items-stretch px-6 sm:px-12 py-4 max-w-7xl mx-auto">
        {/* ── Left World: U-TUBE Portal ── */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Enter U-TUBE discovery engine"
          onClick={() => enter('utube')}
          onMouseEnter={() => onEnterZone('utube')}
          onMouseLeave={onLeaveZone}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && enter('utube')}
          className={`relative flex-1 rounded-3xl p-8 sm:p-12 flex flex-col justify-between transition-all duration-700 cursor-pointer overflow-hidden group outline-none ${
            uActive
              ? isDark
                ? 'bg-[#151213]/90 shadow-[0_20px_80px_rgba(199,73,79,0.18)] scale-[1.01]'
                : 'bg-white/95 shadow-[0_20px_80px_rgba(199,73,79,0.14)] scale-[1.01]'
              : isDark
              ? 'bg-[#111215]/50 hover:bg-[#151213]/70'
              : cmActive
              ? 'bg-[#13141a]/40'
              : 'bg-white/40 hover:bg-white/70'
          }`}
          style={{
            border: uActive
              ? '1px solid rgba(199,73,79,0.45)'
              : isDark
              ? '1px solid rgba(255,255,255,0.06)'
              : cmActive
              ? '1px solid rgba(255,255,255,0.04)'
              : '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Top Label & Mode Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Compass
                className={`w-4 h-4 transition-colors duration-500 ${
                  uActive ? 'text-[#C7494F]' : 'text-neutral-400'
                }`}
              />
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.32em] font-bold transition-colors duration-500 ${
                  uActive ? 'text-[#C7494F]' : 'text-neutral-400'
                }`}
              >
                DISCOVERY FLOW
              </span>
            </div>

            <div
              className={`p-2 rounded-full transition-all duration-300 ${
                uActive
                  ? 'bg-[#C7494F] text-white rotate-45 scale-110 shadow-lg'
                  : 'bg-black/5 dark:bg-white/5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Center Monolith Title & Dynamic Energy Line */}
          <div className="my-auto py-8">
            <h2
              className="font-cinematic-title font-black uppercase leading-none tracking-tight transition-all duration-500"
              style={{
                fontSize: 'clamp(44px, 6.5vw, 92px)',
                color: uActive
                  ? '#C7494F'
                  : isDark
                  ? 'rgba(236,238,242,0.92)'
                  : cmActive
                  ? 'rgba(240,238,232,0.4)'
                  : 'rgba(26,26,24,0.92)',
              }}
            >
              U-TUBE
            </h2>

            {/* Kinetic Discovery Wave */}
            <div className="mt-6 flex items-center gap-2 overflow-hidden">
              {[40, 70, 25, 90, 50, 110, 35, 65, 80, 45].map((w, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: uActive ? [3, 14, 3] : [3, 6, 3],
                    opacity: uActive ? [0.6, 1, 0.6] : [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: w * 0.45,
                    borderRadius: 2,
                    backgroundColor: uActive ? '#C7494F' : isDark ? '#52545A' : '#A3A3A3',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Pillar Specs */}
          <div className="flex items-center justify-between text-xs pt-6 border-t border-black/5 dark:border-white/5">
            <span
              className={`font-mono text-[11px] transition-colors duration-500 ${
                uActive
                  ? 'text-[#C7494F] font-bold'
                  : isDark
                  ? 'text-neutral-400'
                  : cmActive
                  ? 'text-neutral-500'
                  : 'text-neutral-500'
              }`}
            >
              Lightweight Video Discovery & Watch
            </span>
            <span
              className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-lg"
              style={{
                background: uActive
                  ? 'rgba(199,73,79,0.12)'
                  : isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.04)',
                color: uActive ? '#C7494F' : 'inherit',
              }}
            >
              Press (U)
            </span>
          </div>
        </div>

        {/* ── Center Equilibrium Axis (Divider) ── */}
        <div className="hidden md:flex items-center justify-center px-4 relative z-10">
          <div
            className="w-[1px] h-36 transition-all duration-700"
            style={{
              background: uActive
                ? 'linear-gradient(to bottom, transparent, #C7494F, transparent)'
                : cmActive
                ? 'linear-gradient(to bottom, transparent, #526C9E, transparent)'
                : isDark
                ? 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)'
                : 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.15), transparent)',
            }}
          />
        </div>

        {/* ── Right World: CINEMORPH Portal ── */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Enter CineMorph theater engine"
          onClick={() => enter('cinemorph')}
          onMouseEnter={() => onEnterZone('cinemorph')}
          onMouseLeave={onLeaveZone}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && enter('cinemorph')}
          className={`relative flex-1 rounded-3xl p-8 sm:p-12 flex flex-col justify-between transition-all duration-700 cursor-pointer overflow-hidden group outline-none mt-4 md:mt-0 ${
            cmActive
              ? 'bg-[#10121a]/95 shadow-[0_20px_80px_rgba(82,108,158,0.25)] scale-[1.01]'
              : isDark
              ? 'bg-[#111215]/50 hover:bg-[#10121a]/70'
              : 'bg-[#111317]/90 hover:bg-[#10121a]/95 text-white'
          }`}
          style={{
            border: cmActive
              ? '1px solid rgba(82,108,158,0.55)'
              : isDark
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Top Label & Mode Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Disc
                className={`w-4 h-4 transition-colors duration-500 ${
                  cmActive ? 'text-[#7E9ECC]' : 'text-neutral-400'
                }`}
              />
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.32em] font-bold transition-colors duration-500 ${
                  cmActive ? 'text-[#7E9ECC]' : 'text-neutral-400'
                }`}
              >
                THEATER APERTURE
              </span>
            </div>

            <div
              className={`p-2 rounded-full transition-all duration-300 ${
                cmActive
                  ? 'bg-[#526C9E] text-white rotate-45 scale-110 shadow-lg'
                  : 'bg-white/10 text-neutral-300 group-hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Center Monolith Title & Concentric Optic Ring */}
          <div className="my-auto py-8 flex items-center justify-between gap-4">
            <div>
              <h2
                className="font-cinematic-title font-black uppercase leading-none tracking-tight transition-all duration-500"
                style={{
                  fontSize: 'clamp(36px, 5.5vw, 80px)',
                  color: cmActive ? '#8EAEDD' : '#F0EEE8',
                }}
              >
                CINEMORPH
              </h2>
              <p className="mt-2 text-xs font-mono text-neutral-400">
                1.43:1 • 1.90:1 • 70mm Virtual Auditorium
              </p>
            </div>

            {/* Concentric Aperture Device */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
              <motion.div
                animate={{ rotate: cmActive ? 360 : 0 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed"
                style={{
                  borderColor: cmActive ? 'rgba(126,158,204,0.5)' : 'rgba(255,255,255,0.15)',
                }}
              />
              <motion.div
                animate={{ scale: cmActive ? [1, 1.15, 1] : [0.95, 1.02, 0.95] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-full border flex items-center justify-center"
                style={{
                  borderColor: cmActive ? 'rgba(126,158,204,0.8)' : 'rgba(255,255,255,0.3)',
                  background: cmActive
                    ? 'radial-gradient(circle, rgba(82,108,158,0.4) 0%, transparent 80%)'
                    : 'transparent',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: cmActive ? '#8EAEDD' : 'rgba(255,255,255,0.6)',
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Bottom Pillar Specs */}
          <div className="flex items-center justify-between text-xs pt-6 border-t border-white/10">
            <span
              className={`font-mono text-[11px] transition-colors duration-500 ${
                cmActive ? 'text-[#8EAEDD] font-bold' : 'text-neutral-400'
              }`}
            >
              Fixed Aperture & 5-Band Acoustic DSP
            </span>
            <span
              className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/5 text-neutral-300"
              style={{
                color: cmActive ? '#8EAEDD' : 'inherit',
              }}
            >
              Press (C)
            </span>
          </div>
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
          Press (S) for Settings
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
            style={{ background: isDark ? '#0A080A' : '#F5F2EC' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-[#C7494F] font-bold">
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
            style={{ background: '#050407' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-[#7E9ECC] font-bold">
                Opening Aperture
              </span>
              <div className="font-cinematic-title font-black uppercase text-5xl sm:text-7xl text-[#F0EEE8]">
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
                  className="px-3.5 py-1.5 rounded-xl bg-[#C7494F] hover:opacity-90 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105"
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
