/**
 * ThresholdPortal.tsx — OmniStream Entrance, an AROH Product Artifact
 *
 * Design Philosophy:
 *   Not a homepage. Not a marketing page. Not a dashboard.
 *   A single-viewport spatial threshold between two distinct media environments.
 *
 * Architecture:
 *   - Zero marketing copy. Zero feature grids. Zero CTAs.
 *   - Two gravitational zones: U-TUBE (discovery velocity) / CINEMORPH (theater depth).
 *   - All motion respects prefers-reduced-motion. All transitions serve orientation.
 *   - AROH identity expressed through restraint, coherence, and spatial refinement.
 *
 * AROH Color System V2 (per OMNISTREAM_MASTER_SPECS.md):
 *   Light: Editorial off-white #F7F5F0
 *   U-Tube accent: Muted Vermilion #C7494F
 *   CineMorph accent: Muted Slate Blue #526C9E
 *   OMS: Graphite #5E6166
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sliders, Sun, Moon, Laptop, WifiOff } from 'lucide-react';
import { OMSLogo } from '../common/OMSLogo';
import { GlobalSettingsDrawer } from '../settings/GlobalSettingsDrawer';
import { useAppStore } from '../../store';
import { useCineMorphStore } from '../../state/useCineMorphStore';

// ── Constants ──────────────────────────────────────────────────────────────────
const ENTER_DELAY_MS = 480;
const INTRO_SETTLE_MS = 1200;
const SESSION_KEY = 'omnistream_threshold_seen';

// ── Types ──────────────────────────────────────────────────────────────────────
type Zone = 'utube' | 'cinemorph';
type FocusedZone = Zone | null;

// ── ThresholdPortal ─────────────────────────────────────────────────────────
export const ThresholdPortal: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const { theme, setTheme, setVersionMode } = useAppStore();
  const { isOffline } = useCineMorphStore();

  const [focused, setFocused] = useState<FocusedZone>(null);
  const [entering, setEntering] = useState<Zone | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [introComplete, setIntroComplete] = useState<boolean>(() =>
    typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  // Normalized cursor position [0, 1] × [0, 1] for parallax / light field
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lightFieldRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // ── Intro Settle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (introComplete) return;
    const t = setTimeout(() => {
      setIntroComplete(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }, INTRO_SETTLE_MS);
    return () => clearTimeout(t);
  }, [introComplete]);

  // ── Light Field Cursor Tracking (RAF — no React state on root) ──────────────
  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      cursorRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      };
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const lf = lightFieldRef.current;
        if (!lf) return;
        const { x, y } = cursorRef.current;
        lf.style.setProperty('--cursor-x', `${(x * 100).toFixed(1)}%`);
        lf.style.setProperty('--cursor-y', `${(y * 100).toFixed(1)}%`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  // ── Navigation Handlers ──────────────────────────────────────────────────────
  const enterZone = useCallback((zone: Zone) => {
    if (entering) return;
    setEntering(zone);
    setVersionMode(zone === 'utube' ? 'v1' : 'v2');
    const dest = zone === 'utube' ? '/home' : '/cinemorph';
    setTimeout(() => navigate(dest), ENTER_DELAY_MS);
  }, [entering, navigate, setVersionMode]);

  const handleEnterUTube = useCallback(() => enterZone('utube'), [enterZone]);
  const handleEnterCineMorph = useCallback(() => enterZone('cinemorph'), [enterZone]);

  // ── Keyboard Controls ────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (settingsOpen || entering) return;
      const map: Record<string, () => void> = {
        ArrowLeft: () => setFocused('utube'),
        ArrowRight: () => setFocused('cinemorph'),
        u: () => setFocused('utube'),
        U: () => setFocused('utube'),
        c: () => setFocused('cinemorph'),
        C: () => setFocused('cinemorph'),
        Escape: () => setFocused(null),
        s: () => setSettingsOpen(p => !p),
        S: () => setSettingsOpen(p => !p),
      };
      if (e.key === 'Enter') {
        if (focused === 'utube') handleEnterUTube();
        else if (focused === 'cinemorph') handleEnterCineMorph();
        return;
      }
      map[e.key]?.();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [focused, settingsOpen, entering, handleEnterUTube, handleEnterCineMorph]);

  // ── Theme Cycle ──────────────────────────────────────────────────────────────
  const cycleTheme = useCallback(() => {
    const next: Record<string, 'light' | 'dark' | 'system'> = {
      light: 'dark', dark: 'system', system: 'light',
    };
    setTheme(next[theme] ?? 'light');
  }, [theme, setTheme]);

  // ── Computed Motion States ────────────────────────────────────────────────────
  const uFlex = focused === 'utube' ? 1.22 : focused === 'cinemorph' ? 0.78 : 1;
  const cFlex = focused === 'cinemorph' ? 1.22 : focused === 'utube' ? 0.78 : 1;

  const introVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.9, delay, ease: [0.16, 1, 0.3, 1] as any },
    }),
  };

  // ── Light-field dynamic style (CSS vars updated via RAF, not React state) ────
  const lightFieldVars: React.CSSProperties = {
    ['--cursor-x' as any]: '50%',
    ['--cursor-y' as any]: '50%',
  };

  return (
    <div
      ref={containerRef}
      role="main"
      aria-label="OmniStream Entrance — Choose your media environment"
      className={`relative w-screen h-screen overflow-hidden select-none antialiased font-sans transition-colors duration-700 ${
        isDark ? 'bg-[#090A0D] text-[#ECEEF2]' : 'bg-[#F7F5F0] text-[#1A1A18]'
      }`}
    >
      {/* ── AROH Precision Dot Grid: Sculptural architectural field ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)'} 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Dynamic Light Field: Cursor-driven spatial lighting (no React state) ── */}
      <div
        ref={lightFieldRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          ...lightFieldVars,
          background: isDark
            ? focused === 'utube'
              ? 'radial-gradient(ellipse 900px 680px at var(--cursor-x) var(--cursor-y), rgba(199,73,79,0.13) 0%, transparent 72%)'
              : focused === 'cinemorph'
              ? 'radial-gradient(ellipse 900px 680px at var(--cursor-x) var(--cursor-y), rgba(82,108,158,0.14) 0%, transparent 72%)'
              : 'radial-gradient(ellipse 700px 500px at var(--cursor-x) var(--cursor-y), rgba(255,255,255,0.02) 0%, transparent 70%)'
            : focused === 'utube'
            ? 'radial-gradient(ellipse 850px 640px at var(--cursor-x) var(--cursor-y), rgba(199,73,79,0.10) 0%, transparent 70%), linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(240,237,230,0.3) 100%)'
            : focused === 'cinemorph'
            ? 'radial-gradient(ellipse 850px 640px at var(--cursor-x) var(--cursor-y), rgba(82,108,158,0.12) 0%, transparent 70%), linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(235,238,246,0.3) 100%)'
            : 'radial-gradient(ellipse 700px 520px at 50% 48%, rgba(255,255,255,0.75) 0%, transparent 70%)',
        }}
      />

      {/* ── Atmospheric Horizon Header ───────────────────────────────────────── */}
      <header
        className="absolute top-0 inset-x-0 z-30 flex items-center justify-between pointer-events-auto"
        style={{ padding: 'clamp(20px, 3vw, 36px) clamp(24px, 5vw, 60px) 0' }}
      >
        {/* Left: OMS Living Intelligence Mark */}
        <motion.div
          className="flex items-center gap-2.5"
          initial={introComplete ? 'visible' : 'hidden'}
          animate="visible"
          variants={introVariants}
          custom={0}
        >
          <OMSLogo
            variant={isDark ? 'dark' : 'light'}
            size="sm"
            animated={!prefersReducedMotion}
          />
          <div className="flex flex-col leading-none">
            <span
              className="text-[9px] font-mono font-bold tracking-[0.28em] uppercase"
              style={{ opacity: 0.42, color: isDark ? '#ECEEF2' : '#1A1A18' }}
            >
              OMS
            </span>
            <span
              className="text-[8px] font-mono tracking-[0.2em] uppercase"
              style={{ opacity: 0.25, color: isDark ? '#ECEEF2' : '#1A1A18' }}
            >
              CORE
            </span>
          </div>
        </motion.div>

        {/* Center: Offline Indicator (only appears when actually offline) */}
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-medium tracking-wider border backdrop-blur-sm"
            style={{
              background: 'rgba(180, 122, 44, 0.08)',
              color: isDark ? '#D4963E' : '#97621A',
              borderColor: isDark ? 'rgba(180,122,44,0.25)' : 'rgba(180,122,44,0.2)',
            }}
          >
            <WifiOff className="w-3 h-3" aria-hidden="true" />
            <span>Airgapped Local</span>
          </motion.div>
        )}

        {/* Right: Environmental Controls */}
        <motion.div
          className="flex items-center gap-2"
          initial={introComplete ? 'visible' : 'hidden'}
          animate="visible"
          variants={introVariants}
          custom={0.1}
        >
          {/* Theme Cycle */}
          <button
            onClick={cycleTheme}
            aria-label={`Active theme: ${theme}. Click to cycle.`}
            title={`Theme: ${theme.toUpperCase()} (click to cycle)`}
            className="p-2 rounded-full transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: isDark ? 'rgba(236,238,242,0.5)' : 'rgba(26,26,24,0.45)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '')}
          >
            {theme === 'light'
              ? <Sun className="w-[15px] h-[15px]" />
              : theme === 'dark'
              ? <Moon className="w-[15px] h-[15px]" />
              : <Laptop className="w-[15px] h-[15px]" />
            }
          </button>

          {/* Settings (Discoverable, never intrusive) */}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open workstation preferences"
            title="Preferences (S)"
            className="p-2 rounded-full transition-all duration-200 cursor-pointer group focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: isDark ? 'rgba(236,238,242,0.4)' : 'rgba(26,26,24,0.35)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '')}
          >
            <Sliders
              className="w-[15px] h-[15px] transition-transform duration-500 group-hover:rotate-90"
              aria-hidden="true"
            />
          </button>
        </motion.div>
      </header>

      {/* ── Center OmniStream Wordmark: Assembled, not declared ─────────────── */}
      <div
        aria-label="OMNISTREAM"
        className="absolute inset-x-0 z-20 pointer-events-none flex flex-col items-center"
        style={{ top: 'clamp(56px, 8vw, 84px)' }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={introComplete ? 'visible' : 'hidden'}
          animate="visible"
          variants={introVariants}
          custom={0.05}
        >
          <h1
            className="font-cinematic-title font-black uppercase tracking-[0.5em] text-center"
            style={{
              fontSize: 'clamp(10px, 1.1vw, 14px)',
              opacity: 0.88,
              letterSpacing: '0.52em',
            }}
          >
            OMNISTREAM
          </h1>

          {/* Precision Optical Rule: letterforms → horizon */}
          <motion.div
            aria-hidden="true"
            className="rounded-full"
            initial={introComplete ? { width: 36, opacity: 0.2 } : { width: 0, opacity: 0 }}
            animate={{ width: 36, opacity: 0.2 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: '0.5px',
              background: isDark ? '#ECEEF2' : '#1A1A18',
            }}
          />
        </motion.div>
      </div>

      {/* ── Dual Environmental Stage ─────────────────────────────────────────── */}
      <main className="relative w-full h-full flex flex-col md:flex-row items-stretch z-10">

        {/* ══ ZONE 1 — U-TUBE: Discovery, Velocity, Kinetic Flow ═══════════════ */}
        <motion.section
          aria-label="Enter U-TUBE Discovery Engine"
          role="button"
          tabIndex={0}
          onMouseEnter={() => setFocused('utube')}
          onMouseLeave={() => setFocused(null)}
          onClick={handleEnterUTube}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleEnterUTube()}
          className="relative flex-1 flex flex-col items-center justify-center cursor-pointer overflow-hidden group outline-none"
          animate={{
            flexGrow: uFlex,
            opacity: focused === 'cinemorph' ? 0.32 : 1,
            filter: focused === 'cinemorph' ? 'blur(0.8px)' : 'blur(0px)',
            scale: entering === 'utube' ? 1.05 : 1,
          }}
          transition={{
            flexGrow: { duration: prefersReducedMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: prefersReducedMotion ? 0 : 0.5 },
            filter: { duration: prefersReducedMotion ? 0 : 0.45 },
            scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          }}
        >
          {/* U-Tube ambient ambient — kinetic linework, drifting geometry */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {/* Drifting angled card band */}
            <motion.div
              className="absolute flex gap-5 pointer-events-none"
              style={{ width: '140%', height: '9rem', rotate: -6 }}
              animate={prefersReducedMotion ? {} : {
                x: focused === 'utube' ? [0, 28, 0] : [0, 10, 0],
                opacity: focused === 'utube' ? (isDark ? 0.14 : 0.07) : (isDark ? 0.045 : 0.025),
              }}
              transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
            >
              {[0,1,2,3,4,5].map(i => (
                <div
                  key={i}
                  className="flex-1 rounded-2xl border"
                  style={{
                    borderColor: isDark ? 'rgba(199,73,79,0.5)' : 'rgba(199,73,79,0.35)',
                    background: isDark ? 'rgba(199,73,79,0.08)' : 'rgba(199,73,79,0.04)',
                  }}
                />
              ))}
            </motion.div>

            {/* Vermilion horizon wire — expands on hover */}
            <motion.div
              animate={prefersReducedMotion ? {} : {
                width: focused === 'utube' ? 260 : 56,
                opacity: focused === 'utube' ? 0.55 : 0.12,
              }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="absolute rounded-full"
              style={{ height: '0.5px', background: '#C7494F' }}
            />

            {/* Subtle velocity aura */}
            <motion.div
              animate={prefersReducedMotion ? {} : {
                scale: focused === 'utube' ? [1, 1.15, 1] : [0.9, 1, 0.9],
                opacity: focused === 'utube' ? (isDark ? 0.18 : 0.09) : 0,
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none"
              style={{ background: '#C7494F' }}
            />
          </div>

          {/* U-Tube Identity Content */}
          <motion.div
            className="relative z-20 flex flex-col items-center text-center"
            style={{ gap: 'clamp(8px, 1.2vh, 18px)' }}
            initial={introComplete ? 'visible' : 'hidden'}
            animate="visible"
            variants={introVariants}
            custom={0.2}
          >
            <span
              className="font-mono font-bold uppercase tracking-[0.38em] transition-all duration-500"
              style={{
                fontSize: 'clamp(8px, 0.7vw, 10px)',
                opacity: focused === 'utube' ? 0.78 : 0.32,
                color: focused === 'utube' ? '#C7494F' : 'inherit',
              }}
            >
              DISCOVERY FLOW
            </span>

            <h2
              className="font-cinematic-title font-black uppercase transition-all duration-500 leading-none"
              style={{
                fontSize: 'clamp(42px, 8vw, 112px)',
                letterSpacing: focused === 'utube' ? '0.06em' : '0.02em',
                color: focused === 'utube' ? '#C7494F' : isDark ? '#ECEEF2' : '#1A1A18',
                opacity: focused === null ? 0.82 : focused === 'utube' ? 1 : 0.32,
              }}
            >
              U-TUBE
            </h2>

            {/* Contextual affordance — only visible on focus */}
            <motion.span
              className="font-mono tracking-widest uppercase"
              animate={{
                opacity: focused === 'utube' ? 0.72 : 0,
                y: focused === 'utube' ? 0 : 4,
              }}
              transition={{ duration: 0.35 }}
              aria-hidden={focused !== 'utube'}
              style={{
                fontSize: 'clamp(8px, 0.65vw, 10px)',
                color: '#C7494F',
              }}
            >
              Enter Discovery Layer →
            </motion.span>
          </motion.div>
        </motion.section>

        {/* ══ ARCHITECTURAL TENSION AXIS ══════════════════════════════════════ */}
        <div
          aria-hidden="true"
          className="relative flex items-center justify-center pointer-events-none"
          style={{ minWidth: 1, minHeight: 1 }}
        >
          <motion.div
            animate={{
              opacity: focused ? 0.3 : 0.08,
              x: focused === 'utube' ? 14 : focused === 'cinemorph' ? -14 : 0,
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="md:w-px md:h-[52%] w-[52%] h-px rounded-full"
            style={{ background: isDark ? '#ECEEF2' : '#1A1A18' }}
          />
        </div>

        {/* ══ ZONE 2 — CINEMORPH: Depth, Aperture, Theater Silence ═══════════ */}
        <motion.section
          aria-label="Enter CineMorph Theater Engine"
          role="button"
          tabIndex={0}
          onMouseEnter={() => setFocused('cinemorph')}
          onMouseLeave={() => setFocused(null)}
          onClick={handleEnterCineMorph}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleEnterCineMorph()}
          className="relative flex-1 flex flex-col items-center justify-center cursor-pointer overflow-hidden group outline-none"
          animate={{
            flexGrow: cFlex,
            opacity: focused === 'utube' ? 0.32 : 1,
            filter: focused === 'utube' ? 'blur(0.8px)' : 'blur(0px)',
            scale: entering === 'cinemorph' ? 1.05 : 1,
          }}
          transition={{
            flexGrow: { duration: prefersReducedMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: prefersReducedMotion ? 0 : 0.5 },
            filter: { duration: prefersReducedMotion ? 0 : 0.45 },
            scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          }}
        >
          {/* CineMorph ambient — breathing optical aperture, projection cone */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {/* Breathing concentric aperture ring (outer) */}
            <motion.div
              animate={prefersReducedMotion ? {} : {
                scale: focused === 'cinemorph' ? [1, 1.1, 1] : [0.94, 1.04, 0.94],
                opacity: focused === 'cinemorph' ? (isDark ? 0.22 : 0.11) : (isDark ? 0.06 : 0.03),
                rotate: [0, 360],
              }}
              transition={{
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.6 },
                rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
              }}
              className="absolute rounded-full border border-dashed"
              style={{
                width: 'clamp(260px, 40vw, 460px)',
                height: 'clamp(260px, 40vw, 460px)',
                borderColor: isDark ? 'rgba(82,108,158,0.7)' : 'rgba(82,108,158,0.4)',
              }}
            />

            {/* Inner precision aperture ring */}
            <motion.div
              animate={prefersReducedMotion ? {} : {
                scale: focused === 'cinemorph' ? [1, 1.05, 1] : [0.97, 1.02, 0.97],
                opacity: focused === 'cinemorph' ? (isDark ? 0.35 : 0.16) : (isDark ? 0.1 : 0.05),
                rotate: [0, -360],
              }}
              transition={{
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                opacity: { duration: 0.6 },
                rotate: { duration: 18, repeat: Infinity, ease: 'linear' },
              }}
              className="absolute rounded-full border"
              style={{
                width: 'clamp(140px, 22vw, 240px)',
                height: 'clamp(140px, 22vw, 240px)',
                borderColor: isDark ? 'rgba(82,108,158,0.6)' : 'rgba(82,108,158,0.35)',
              }}
            />

            {/* Volumetric projection bloom */}
            <motion.div
              animate={prefersReducedMotion ? {} : {
                scale: focused === 'cinemorph' ? [1, 1.2, 1] : [0.8, 0.95, 0.8],
                opacity: focused === 'cinemorph' ? (isDark ? 0.2 : 0.08) : 0,
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute rounded-full blur-3xl"
              style={{
                width: 'clamp(200px, 28vw, 380px)',
                height: 'clamp(200px, 28vw, 380px)',
                background: isDark ? '#526C9E' : '#526C9E',
              }}
            />
          </div>

          {/* CineMorph Identity Content */}
          <motion.div
            className="relative z-20 flex flex-col items-center text-center"
            style={{ gap: 'clamp(8px, 1.2vh, 18px)' }}
            initial={introComplete ? 'visible' : 'hidden'}
            animate="visible"
            variants={introVariants}
            custom={0.32}
          >
            <span
              className="font-mono font-bold uppercase tracking-[0.38em] transition-all duration-500"
              style={{
                fontSize: 'clamp(8px, 0.7vw, 10px)',
                opacity: focused === 'cinemorph' ? 0.78 : 0.32,
                color: focused === 'cinemorph' ? (isDark ? '#7E9ECC' : '#526C9E') : 'inherit',
              }}
            >
              THEATER APERTURE
            </span>

            <h2
              className="font-cinematic-title font-black uppercase transition-all duration-500 leading-none"
              style={{
                fontSize: 'clamp(32px, 6.5vw, 88px)',
                letterSpacing: focused === 'cinemorph' ? '0.06em' : '0.02em',
                color: focused === 'cinemorph'
                  ? isDark ? '#7E9ECC' : '#526C9E'
                  : isDark ? '#ECEEF2' : '#1A1A18',
                opacity: focused === null ? 0.82 : focused === 'cinemorph' ? 1 : 0.32,
              }}
            >
              CINEMORPH
            </h2>

            {/* Contextual affordance */}
            <motion.span
              className="font-mono tracking-widest uppercase"
              animate={{
                opacity: focused === 'cinemorph' ? 0.72 : 0,
                y: focused === 'cinemorph' ? 0 : 4,
              }}
              transition={{ duration: 0.35 }}
              aria-hidden={focused !== 'cinemorph'}
              style={{
                fontSize: 'clamp(8px, 0.65vw, 10px)',
                color: isDark ? '#7E9ECC' : '#526C9E',
              }}
            >
              Enter Theater Layer →
            </motion.span>
          </motion.div>
        </motion.section>
      </main>

      {/* ── Bottom AROH Product Heritage Signature ───────────────────────────── */}
      <footer
        aria-label="Product signature"
        className="absolute bottom-0 inset-x-0 z-20 flex items-end justify-between pointer-events-none"
        style={{ padding: '0 clamp(24px, 5vw, 60px) clamp(18px, 2.8vw, 32px)' }}
      >
        <motion.span
          className="font-mono uppercase tracking-[0.28em]"
          style={{ fontSize: 9, opacity: 0.28 }}
          initial={introComplete ? 'visible' : 'hidden'}
          animate="visible"
          variants={introVariants}
          custom={0.5}
        >
          DUAL-ENGINE PLATFORM
        </motion.span>

        {/* AROH Product Seal — a quiet mark of origin */}
        <motion.div
          className="flex flex-col items-center gap-1"
          title="An AROH Product"
          initial={introComplete ? 'visible' : 'hidden'}
          animate="visible"
          variants={introVariants}
          custom={0.55}
        >
          <img
            src="/aroh_seal.jpg"
            alt="AROH"
            draggable={false}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              objectFit: 'cover',
              opacity: isDark ? 0.28 : 0.22,
              filter: isDark ? 'grayscale(0.2) brightness(1.1)' : 'grayscale(0.1) brightness(0.95)',
              display: 'block',
            }}
          />
        </motion.div>

        <motion.span
          className="font-mono uppercase tracking-[0.28em]"
          style={{ fontSize: 9, opacity: 0.28 }}
          initial={introComplete ? 'visible' : 'hidden'}
          animate="visible"
          variants={introVariants}
          custom={0.5}
        >
          V2.0 · 2026
        </motion.span>
      </footer>

      {/* ── Enter Transition Overlay (environment-specific, immersive) ───────── */}
      <AnimatePresence>
        {entering && (
          <motion.div
            key={`enter-${entering}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center"
            style={{
              background: entering === 'utube'
                ? isDark ? '#090A0D' : '#F7F5F0'
                : '#050403',
            }}
            aria-live="polite"
            aria-label={`Entering ${entering === 'utube' ? 'U-TUBE' : 'CINEMORPH'}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <span
                className="font-mono uppercase tracking-widest"
                style={{
                  fontSize: 10,
                  opacity: 0.7,
                  color: entering === 'utube' ? '#C7494F' : '#7E9ECC',
                }}
              >
                {entering === 'utube' ? 'Entering Discovery' : 'Opening Fixed Aperture'}
              </span>
              <div
                className="font-cinematic-title font-black uppercase leading-none"
                style={{
                  fontSize: 'clamp(40px, 7vw, 88px)',
                  color: entering === 'utube'
                    ? isDark ? '#ECEEF2' : '#1A1A18'
                    : '#F4EEE8',
                  letterSpacing: '0.05em',
                }}
              >
                {entering === 'utube' ? 'U-TUBE' : 'CINEMORPH'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global Preferences Drawer ─────────────────────────────────────────── */}
      <GlobalSettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
