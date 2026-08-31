/**
 * ThresholdPortal.tsx — OmniStream Entrance
 *
 * DESIGN PHILOSOPHY:
 *   Not a dashboard. Not a homepage. Not a product showcase.
 *   A shared spatial environment containing two distinct destinations.
 *
 * COMPOSITION:
 *   - OMNISTREAM mark: centered, quiet, high above midline
 *   - U-TUBE: left-biased gravitational field — kinetic, fragmented, velocity
 *   - CINEMORPH: right-biased gravitational field — still, deep, aperture-pull
 *   - No cards. No borders. No buttons. No statistics. No features.
 *   - Only three text elements exist permanently: OMNISTREAM · U-TUBE · CINEMORPH
 *
 * MOTION LANGUAGE:
 *   U-Tube  → Flow / discovery / horizontal energy / content fragments
 *   CineMorph → Depth / silence / inward pull / aperture
 *   OmniStream → Balance / the space between
 *
 * TECHNICAL INVARIANTS:
 *   - Light field updated via RAF → CSS vars, never React state on root
 *   - All motion respects prefers-reduced-motion
 *   - Zero explanatory copy
 *   - AROH identity through restraint
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
import { Sliders, Sun, Moon, Laptop, WifiOff } from 'lucide-react';
import { GlobalSettingsDrawer } from '../settings/GlobalSettingsDrawer';
import { useAppStore } from '../../store';
import { useCineMorphStore } from '../../state/useCineMorphStore';

// ─── Session ──────────────────────────────────────────────────────────────────
const SESSION_KEY = 'oms_threshold_v3_seen';

// ─── Fragment configuration ───────────────────────────────────────────────────
const UTUBE_FRAGMENTS = [
  { w: 68, h: 40, x: 14, y: 38, delay: 0, dur: 18 },
  { w: 44, h: 28, x: 8,  y: 55, delay: 2, dur: 22 },
  { w: 92, h: 52, x: 22, y: 28, delay: 1, dur: 16 },
  { w: 36, h: 22, x: 5,  y: 70, delay: 3, dur: 25 },
  { w: 56, h: 32, x: 30, y: 62, delay: 0.5, dur: 20 },
  { w: 28, h: 16, x: 18, y: 80, delay: 4, dur: 28 },
  { w: 80, h: 46, x: 38, y: 20, delay: 1.5, dur: 14 },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type Zone = 'utube' | 'cinemorph';
type EnterState = Zone | null;

// ─── Component ───────────────────────────────────────────────────────────────
export const ThresholdPortal: React.FC = () => {
  const navigate       = useNavigate();
  const prefersReduced = useReducedMotion();

  const { theme, setTheme, setVersionMode } = useAppStore();
  const { isOffline }  = useCineMorphStore();

  const [focus,    setFocus]    = useState<Zone | null>(null);
  const [entering, setEntering] = useState<EnterState>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [introComplete, setIntroComplete] = useState<boolean>(() =>
    typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [, forceRender] = useReducer(x => x + 1, 0);

  const rootRef      = useRef<HTMLDivElement>(null);
  const lightRef     = useRef<HTMLDivElement>(null);
  const apertureRef  = useRef<HTMLDivElement>(null);
  const cursorRef    = useRef({ x: 0.5, y: 0.5 });
  const focusRef     = useRef<Zone | null>(null);
  const rafRef       = useRef<number>();

  const isDark = theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // ─── Intro ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (introComplete) return;
    const t = setTimeout(() => {
      setIntroComplete(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }, 1100);
    return () => clearTimeout(t);
  }, [introComplete]);

  // ─── Live light field via RAF (no React state on root component) ───────────
  useEffect(() => {
    if (prefersReduced) return;

    const move = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const r  = el.getBoundingClientRect();
      cursorRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      };

      cancelAnimationFrame(rafRef.current!);
      rafRef.current = requestAnimationFrame(() => {
        const { x, y } = cursorRef.current;
        const lf = lightRef.current;
        if (lf) {
          lf.style.setProperty('--cx', `${(x * 100).toFixed(1)}%`);
          lf.style.setProperty('--cy', `${(y * 100).toFixed(1)}%`);
        }
        // Aperture parallax on CineMorph side — subtle depth shift
        const ap = apertureRef.current;
        const f  = focusRef.current;
        if (ap && f === 'cinemorph') {
          const tx = ((x - 0.5) * -18).toFixed(1);
          const ty = ((y - 0.5) * -12).toFixed(1);
          ap.style.transform = `translate(${tx}px, ${ty}px)`;
        } else if (ap && f !== 'cinemorph') {
          ap.style.transform = 'translate(0px, 0px)';
        }
      });
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(rafRef.current!);
    };
  }, [prefersReduced]);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const enter = useCallback((zone: Zone) => {
    if (entering) return;
    setEntering(zone);
    setVersionMode(zone === 'utube' ? 'v1' : 'v2');
    setTimeout(() => navigate(zone === 'utube' ? '/home' : '/cinemorph'), 520);
  }, [entering, navigate, setVersionMode]);

  // ─── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (settingsOpen || entering) return;
      if (e.key === 'ArrowLeft'  || e.key === 'u' || e.key === 'U') { focusRef.current = 'utube';    setFocus('utube');    return; }
      if (e.key === 'ArrowRight' || e.key === 'c' || e.key === 'C') { focusRef.current = 'cinemorph'; setFocus('cinemorph'); return; }
      if (e.key === 'Escape')                                        { focusRef.current = null;        setFocus(null);       return; }
      if (e.key === 'Enter') {
        if      (focus === 'utube')    enter('utube');
        else if (focus === 'cinemorph') enter('cinemorph');
        return;
      }
      if (e.key === 's' || e.key === 'S') setSettingsOpen(p => !p);
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

  // ─── Derived States ────────────────────────────────────────────────────────
  const uActive   = focus === 'utube';
  const cmActive  = focus === 'cinemorph';
  const neutral   = focus === null;

  // Light-field CSS vars (initial; will be mutated by RAF)
  const lfStyle: React.CSSProperties = {
    ['--cx' as any]: '50%',
    ['--cy' as any]: '50%',
  };

  // ─── Reduced-motion static variant ────────────────────────────────────────
  // In reduced-motion mode, we rely purely on opacity and spatial color.
  const rm = prefersReduced;

  return (
    <div
      ref={rootRef}
      role="main"
      aria-label="OmniStream entrance"
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{
        background: isDark
          ? cmActive ? '#060608' : uActive ? '#0A080A' : '#08090C'
          : uActive  ? '#F5F2EC' : cmActive ? '#0D0C0F' : '#F7F5F0',
        transition: 'background 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >

      {/* ── Grain overlay: adds material texture to both light and dark ─────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
          opacity: isDark ? 0.038 : 0.025,
          mixBlendMode: 'multiply',
        }}
      />

      {/* ── Dynamic light field: cursor-reactive, mutated via RAF ─────────── */}
      <div
        ref={lightRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none z-1 transition-opacity duration-700"
        style={{
          ...lfStyle,
          opacity: rm ? 0 : 1,
          background: isDark
            ? uActive
              ? 'radial-gradient(ellipse 720px 560px at var(--cx) var(--cy), rgba(199,73,79,0.14) 0%, transparent 68%)'
              : cmActive
              ? 'radial-gradient(ellipse 720px 560px at var(--cx) var(--cy), rgba(82,108,158,0.16) 0%, transparent 65%)'
              : 'radial-gradient(ellipse 600px 420px at var(--cx) var(--cy), rgba(255,255,255,0.022) 0%, transparent 70%)'
            : uActive
            ? 'radial-gradient(ellipse 700px 520px at var(--cx) var(--cy), rgba(199,73,79,0.11) 0%, transparent 68%)'
            : cmActive
            ? 'none'  // Light→dark handled by bg transition, no double light
            : 'radial-gradient(ellipse 600px 440px at 50% 48%, rgba(255,255,255,0.9) 0%, transparent 65%)',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────────
          OMNISTREAM WORDMARK — Quiet, centered, above the gravitational field
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        aria-label="OMNISTREAM"
        className="absolute inset-x-0 z-20 flex flex-col items-center pointer-events-none"
        style={{ top: 'clamp(26px, 5vh, 52px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: rm ? 0 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: rm ? 0 : 1.1, delay: rm ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-1.5"
        >
          <h1
            className="font-cinematic-title font-black uppercase text-center tracking-[0.6em]"
            style={{
              fontSize: 'clamp(9px, 0.9vw, 13px)',
              color: isDark
                ? cmActive ? 'rgba(236,238,242,0.28)' : 'rgba(236,238,242,0.72)'
                : uActive  ? 'rgba(26,26,24,0.72)'    : cmActive ? 'rgba(240,238,232,0.6)' : 'rgba(26,26,24,0.72)',
              transition: 'color 0.7s ease, opacity 0.7s ease',
              letterSpacing: '0.58em',
            }}
          >
            OMNISTREAM
          </h1>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: neutral ? 0.2 : 0.12 }}
            transition={{ duration: rm ? 0 : 1.0, delay: rm ? 0 : 0.3 }}
            style={{
              height: '0.5px',
              width: 28,
              background: isDark ? '#ECEEF2' : '#1A1A18',
              transformOrigin: 'center',
            }}
          />
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          U-TUBE — Gravitational field: left-biased, kinetic, fragmentary
      ───────────────────────────────────────────────────────────────────────── */}
      <section
        aria-label="Enter U-TUBE discovery engine"
        role="button"
        tabIndex={0}
        className="absolute inset-0 z-10 outline-none cursor-pointer"
        style={{
          // Only the left ~48% is the U-TUBE click zone
          right: '52%',
        }}
        onMouseEnter={() => onEnterZone('utube')}
        onMouseLeave={onLeaveZone}
        onClick={() => enter('utube')}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && enter('utube')}
      />

      {/* U-TUBE Visual Environment — exists independently of click zone */}
      <div
        aria-hidden
        className="absolute z-5 pointer-events-none overflow-hidden"
        style={{
          left: 0,
          right: '40%',
          top: 0,
          bottom: 0,
        }}
      >
        {/* Drifting content fragments — horizontal velocity energy */}
        {!rm && UTUBE_FRAGMENTS.map((f, i) => (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{
              width: f.w,
              height: f.h,
              left: `${f.x}%`,
              top: `${f.y}%`,
              background: isDark
                ? `rgba(199,73,79,${uActive ? 0.13 : 0.05})`
                : `rgba(199,73,79,${uActive ? 0.1 : 0.04})`,
              border: `0.5px solid rgba(199,73,79,${uActive ? 0.3 : 0.1})`,
              borderRadius: 4,
            }}
            animate={uActive ? {
              x:       [0, f.w * 0.18, 0],
              opacity: [0.7, 1, 0.7],
            } : {
              x:       [0, f.w * 0.06, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: f.dur,
              delay: f.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Horizontal velocity line — contracts/expands on hover */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '8%',
            height: '0.5px',
            background: `linear-gradient(to right, transparent, rgba(199,73,79,${uActive ? 0.7 : 0.2}), transparent)`,
            transformOrigin: 'left center',
          }}
          animate={{ width: uActive ? '78%' : '35%', opacity: uActive ? 1 : 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Secondary fragment stream — lower, slower */}
        {!rm && (
          <motion.div
            className="absolute flex gap-3"
            style={{ bottom: '26%', left: '5%', opacity: uActive ? 0.28 : 0.08 }}
            animate={{ x: uActive ? [0, 24, 0] : [0, 8, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[60, 40, 80, 36, 52, 44].map((w, i) => (
              <div
                key={i}
                style={{
                  width: w,
                  height: 4,
                  borderRadius: 2,
                  background: isDark ? 'rgba(199,73,79,0.8)' : 'rgba(199,73,79,0.6)',
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* U-TUBE Typography — the name IS the interaction */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{
          // Asymmetric positioning: left-of-center, vertically center-biased
          left: 'clamp(28px, 10vw, 120px)',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: rm ? 0 : -20 }}
          animate={{
            opacity: entering === 'cinemorph' ? 0.1 : 1,
            x: entering === 'utube' ? -40 : 0,
            scale: uActive && !rm ? 1.04 : 1,
          }}
          transition={{ duration: rm ? 0 : 0.8, ease: [0.16, 1, 0.3, 1], delay: introComplete ? 0 : 0.45 }}
          className="flex flex-col"
          style={{ gap: 'clamp(4px, 0.8vh, 10px)' }}
        >
          <span
            className="font-mono font-bold uppercase tracking-[0.34em] transition-all duration-500"
            style={{
              fontSize: 'clamp(7px, 0.65vw, 9px)',
              opacity: uActive ? 0.7 : 0.22,
              color: uActive ? '#C7494F' : isDark ? '#ECEEF2' : '#1A1A18',
            }}
          >
            DISCOVERY FLOW
          </span>

          <h2
            className="font-cinematic-title font-black uppercase leading-none transition-all duration-500"
            style={{
              fontSize: 'clamp(52px, 9vw, 130px)',
              letterSpacing: uActive ? '0.04em' : '0.01em',
              color: uActive
                ? '#C7494F'
                : isDark ? 'rgba(236,238,242,0.88)' : 'rgba(26,26,24,0.88)',
              textShadow: uActive && isDark
                ? '0 0 80px rgba(199,73,79,0.35)'
                : 'none',
            }}
          >
            U-TUBE
          </h2>

          <motion.div
            animate={{ opacity: uActive ? 0.65 : 0, y: uActive ? 0 : 4 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: 9,
              fontFamily: 'monospace',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#C7494F',
            }}
          >
            Enter →
          </motion.div>
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          CINEMORPH — Gravitational field: right-biased, deep, aperture-pull
      ───────────────────────────────────────────────────────────────────────── */}
      <section
        aria-label="Enter CineMorph theater engine"
        role="button"
        tabIndex={0}
        className="absolute inset-0 z-10 outline-none cursor-pointer"
        style={{ left: '52%' }}
        onMouseEnter={() => onEnterZone('cinemorph')}
        onMouseLeave={onLeaveZone}
        onClick={() => enter('cinemorph')}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && enter('cinemorph')}
      />

      {/* CineMorph Visual Environment — aperture, depth, atmospheric silence */}
      <div
        aria-hidden
        className="absolute z-5 pointer-events-none overflow-hidden"
        style={{ left: '52%', right: 0, top: 0, bottom: 0 }}
      >
        {/* Background depth layer: darkens independently when focused */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: cmActive
              ? 'rgba(4,4,8,0.72)'
              : 'rgba(4,4,8,0)',
            transition: 'background 1.0s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* The Aperture — the soul of CineMorph */}
        <div
          ref={apertureRef}
          style={{
            position: 'absolute',
            right: 'clamp(40px, 12%, 140px)',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: rm ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outermost ring — slow rotation */}
          {!rm && (
            <motion.div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: `1px dashed rgba(82,108,158,${cmActive ? 0.45 : 0.12})`,
                width: 'clamp(200px, 26vw, 320px)',
                height: 'clamp(200px, 26vw, 320px)',
              }}
              animate={{
                rotate: [0, 360],
                scale: cmActive ? [1, 1.06, 1] : [0.94, 1.02, 0.94],
              }}
              transition={{
                rotate: { duration: 38, repeat: Infinity, ease: 'linear' },
                scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          )}

          {/* Middle ring — counter-rotation */}
          {!rm && (
            <motion.div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: `0.5px solid rgba(82,108,158,${cmActive ? 0.6 : 0.18})`,
                width: 'clamp(120px, 16vw, 200px)',
                height: 'clamp(120px, 16vw, 200px)',
              }}
              animate={{
                rotate: [0, -360],
                scale: cmActive ? [1, 1.1, 1] : [0.96, 1.04, 0.96],
              }}
              transition={{
                rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
              }}
            />
          )}

          {/* Inner aperture core — the screen behind the hole */}
          <motion.div
            style={{
              borderRadius: '50%',
              position: 'relative',
              zIndex: 2,
              overflow: 'hidden',
              background: isDark
                ? cmActive ? 'radial-gradient(circle, rgba(15,18,26,0.9) 30%, rgba(4,4,8,1) 100%)' : 'rgba(8,8,12,0.6)'
                : cmActive ? 'radial-gradient(circle, rgba(10,12,20,0.85) 30%, rgba(4,4,8,0.95) 100%)' : 'rgba(12,12,18,0.4)',
              border: `1px solid rgba(82,108,158,${cmActive ? 0.7 : 0.2})`,
              boxShadow: cmActive
                ? '0 0 60px rgba(82,108,158,0.22), inset 0 0 30px rgba(4,4,8,0.8)'
                : isDark ? '0 0 20px rgba(82,108,158,0.1)' : 'none',
            }}
            animate={{
              width: cmActive ? 'clamp(60px, 8vw, 96px)' : 'clamp(40px, 5.5vw, 68px)',
              height: cmActive ? 'clamp(60px, 8vw, 96px)' : 'clamp(40px, 5.5vw, 68px)',
            }}
            transition={{ duration: rm ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Distant screen shimmer inside the aperture */}
            {!rm && cmActive && (
              <motion.div
                style={{
                  position: 'absolute',
                  inset: '20%',
                  borderRadius: '50%',
                  background: 'rgba(82,108,158,0.15)',
                }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </motion.div>

          {/* Volumetric projection bloom behind the aperture */}
          {!rm && (
            <motion.div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                background: 'rgba(82,108,158,0.12)',
                filter: 'blur(40px)',
                zIndex: 0,
                width: 'clamp(160px, 22vw, 260px)',
                height: 'clamp(160px, 22vw, 260px)',
              }}
              animate={{
                opacity: cmActive ? [0.5, 0.9, 0.5] : [0.1, 0.2, 0.1],
                scale: cmActive ? [1, 1.18, 1] : [0.85, 1, 0.85],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </div>

      {/* CINEMORPH Typography */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{
          // Right side, vertically center but slightly lower than U-TUBE
          right: 'clamp(28px, 8vw, 90px)',
          top: '50%',
          transform: 'translateY(-44%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: rm ? 0 : 20 }}
          animate={{
            opacity: entering === 'utube' ? 0.1 : 1,
            x: entering === 'cinemorph' ? 40 : 0,
            scale: cmActive && !rm ? 1.04 : 1,
          }}
          transition={{ duration: rm ? 0 : 0.8, ease: [0.16, 1, 0.3, 1], delay: introComplete ? 0 : 0.6 }}
          className="flex flex-col items-end"
          style={{ gap: 'clamp(4px, 0.8vh, 10px)' }}
        >
          <span
            className="font-mono font-bold uppercase tracking-[0.32em] transition-all duration-500 text-right"
            style={{
              fontSize: 'clamp(7px, 0.65vw, 9px)',
              opacity: cmActive ? 0.7 : 0.22,
              color: cmActive ? (isDark ? '#7E9ECC' : '#526C9E') : isDark ? '#ECEEF2' : '#1A1A18',
            }}
          >
            THEATER APERTURE
          </span>

          <h2
            className="font-cinematic-title font-black uppercase leading-none transition-all duration-500 text-right"
            style={{
              fontSize: 'clamp(36px, 7vw, 100px)',
              letterSpacing: cmActive ? '0.05em' : '0.01em',
              color: cmActive
                ? isDark ? '#7E9ECC' : '#526C9E'
                : isDark ? 'rgba(236,238,242,0.88)' : 'rgba(26,26,24,0.88)',
              textShadow: cmActive && isDark
                ? '0 0 80px rgba(82,108,158,0.4)'
                : 'none',
            }}
          >
            CINEMORPH
          </h2>

          <motion.div
            animate={{ opacity: cmActive ? 0.65 : 0, y: cmActive ? 0 : 4 }}
            transition={{ duration: 0.4 }}
            className="text-right"
            style={{
              fontSize: 9,
              fontFamily: 'monospace',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: isDark ? '#7E9ECC' : '#526C9E',
            }}
          >
            ← Enter
          </motion.div>
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SPATIAL DIVIDER — The living tension axis between worlds
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 z-15 pointer-events-none flex items-center justify-center"
        style={{ left: '50%', width: 0 }}
      >
        <motion.div
          style={{
            width: '0.5px',
            background: isDark ? 'rgba(236,238,242,1)' : 'rgba(26,26,24,1)',
            transformOrigin: 'center',
          }}
          animate={{
            height: neutral ? '42%' : uActive ? '30%' : '55%',
            opacity: neutral ? 0.07 : uActive ? 0.04 : 0.12,
            x: uActive ? 10 : cmActive ? -10 : 0,
          }}
          transition={{ duration: rm ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          HEADER CONTROLS — Nearly invisible; discoverable
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        className="absolute z-30 flex items-center gap-2 pointer-events-auto"
        style={{
          top: 'clamp(18px, 3vw, 32px)',
          right: 'clamp(18px, 3vw, 36px)',
        }}
      >
        {isOffline && (
          <div
            className="flex items-center gap-1.5 rounded-full font-mono text-[9px] tracking-wider uppercase"
            style={{
              padding: '4px 10px',
              background: 'rgba(180,122,44,0.1)',
              border: '0.5px solid rgba(180,122,44,0.25)',
              color: isDark ? '#C49538' : '#8A5A14',
            }}
          >
            <WifiOff className="w-2.5 h-2.5" />
            <span>Local</span>
          </div>
        )}

        <button
          onClick={cycleTheme}
          aria-label={`Theme: ${theme}`}
          title={`Theme: ${theme} — click to cycle`}
          className="rounded-full transition-all duration-200 cursor-pointer"
          style={{
            padding: 7,
            color: isDark ? 'rgba(236,238,242,0.35)' : 'rgba(26,26,24,0.3)',
            background: 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = isDark ? 'rgba(236,238,242,0.7)' : 'rgba(26,26,24,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = isDark ? 'rgba(236,238,242,0.35)' : 'rgba(26,26,24,0.3)')}
        >
          {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Open preferences"
          title="Preferences (S)"
          className="rounded-full transition-all duration-200 cursor-pointer group"
          style={{
            padding: 7,
            color: isDark ? 'rgba(236,238,242,0.3)' : 'rgba(26,26,24,0.25)',
            background: 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = isDark ? 'rgba(236,238,242,0.65)' : 'rgba(26,26,24,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.color = isDark ? 'rgba(236,238,242,0.3)' : 'rgba(26,26,24,0.25)')}
        >
          <Sliders className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-90" />
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          AROH SEAL — Bottom center, a quiet mark of origin
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        aria-label="An AROH product"
        title="An AROH product"
        className="absolute z-20 pointer-events-none flex justify-center"
        style={{ bottom: 'clamp(16px, 2.5vw, 28px)', left: 0, right: 0 }}
      >
        <motion.img
          src="/aroh_seal.jpg"
          alt="AROH"
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDark ? 0.2 : 0.16 }}
          transition={{ duration: rm ? 0 : 1.2, delay: rm ? 0 : 0.6 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            objectFit: 'cover',
            filter: isDark ? 'grayscale(0.15) brightness(1.05)' : 'grayscale(0.1) brightness(0.9)',
            display: 'block',
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ENTRY TRANSITIONS — Environment-specific immersive sequences
      ───────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {entering === 'utube' && (
          <motion.div
            key="enter-utube"
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: rm ? 0.1 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: isDark ? '#0A080A' : '#F5F2EC' }}
          >
            {/* U-TUBE entry: accelerating fragments + forward perspective */}
            {!rm && (
              <div className="absolute inset-0 overflow-hidden">
                {UTUBE_FRAGMENTS.slice(0, 5).map((f, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-sm"
                    initial={{ x: `${f.x}%`, y: `${f.y}%`, opacity: 0.6 }}
                    animate={{ x: `${f.x + 40}%`, opacity: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.04, ease: 'easeIn' }}
                    style={{
                      width: f.w * 1.4,
                      height: f.h,
                      background: isDark ? 'rgba(199,73,79,0.18)' : 'rgba(199,73,79,0.12)',
                      border: '0.5px solid rgba(199,73,79,0.3)',
                    }}
                  />
                ))}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: rm ? 1 : 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: rm ? 0 : 0.35, delay: 0.05 }}
              className="text-center flex flex-col items-center gap-2.5"
            >
              <span
                style={{
                  fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.35em',
                  textTransform: 'uppercase', opacity: 0.6, color: '#C7494F',
                }}
              >
                Entering Discovery
              </span>
              <div
                className="font-cinematic-title font-black uppercase leading-none"
                style={{
                  fontSize: 'clamp(48px, 8vw, 96px)',
                  letterSpacing: '0.04em',
                  color: isDark ? 'rgba(236,238,242,0.9)' : 'rgba(26,26,24,0.9)',
                }}
              >
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
            transition={{ duration: rm ? 0.1 : 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: '#050407' }}
          >
            {/* CineMorph entry: aperture opening inward */}
            {!rm && (
              <>
                <motion.div
                  className="absolute rounded-full"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 12, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    width: 80, height: 80,
                    border: '1px solid rgba(82,108,158,0.5)',
                  }}
                />
                <motion.div
                  className="absolute rounded-full"
                  initial={{ scale: 0.5, opacity: 0.4 }}
                  animate={{ scale: 8, opacity: 0 }}
                  transition={{ duration: 0.48, ease: 'easeOut', delay: 0.04 }}
                  style={{
                    width: 60, height: 60,
                    border: '0.5px solid rgba(82,108,158,0.6)',
                  }}
                />
              </>
            )}

            <motion.div
              initial={{ opacity: 0, scale: rm ? 1 : 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: rm ? 0 : 0.4, delay: 0.06 }}
              className="text-center flex flex-col items-center gap-2.5"
            >
              <span
                style={{
                  fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.35em',
                  textTransform: 'uppercase', opacity: 0.55, color: '#7E9ECC',
                }}
              >
                Opening Aperture
              </span>
              <div
                className="font-cinematic-title font-black uppercase leading-none"
                style={{
                  fontSize: 'clamp(36px, 6.5vw, 84px)',
                  letterSpacing: '0.04em',
                  color: 'rgba(240,238,232,0.92)',
                }}
              >
                CINEMORPH
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Global Settings Drawer ─────────────────────────────────────────── */}
      <GlobalSettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
