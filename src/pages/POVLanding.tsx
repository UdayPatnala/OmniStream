/**
 * POVLanding — OmniStream First-Person Journey Landing Page
 *
 * The user walks through a media space as if from the OMS POV.
 * OMS logo floats in the center of the corridor as a guiding entity.
 * At the Y-fork, the user chooses: U-TUBE (left) or CINEMORPH (right).
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { OMSLogo } from '../components/common/OMSLogo';

// ─── Wall messages ────────────────────────────────────────────────────────────
const WALL_MESSAGES: {
  side: 'left' | 'right';
  text: string;
  triggerAt: number;
  passAt: number;
}[] = [
  { side: 'left',  text: 'MEDIA.',                        triggerAt: 0.04, passAt: 0.14 },
  { side: 'right', text: 'DISCOVERY.',                    triggerAt: 0.11, passAt: 0.21 },
  { side: 'left',  text: 'WATCH WITHOUT FRICTION.',       triggerAt: 0.19, passAt: 0.31 },
  { side: 'right', text: 'YOUR MEDIA.\nYOUR WAY.',        triggerAt: 0.27, passAt: 0.39 },
  { side: 'left',  text: 'FROM A LINK\nTO A SCREEN.',     triggerAt: 0.37, passAt: 0.50 },
  { side: 'right', text: 'FROM A VIDEO\nTO A CINEMA.',    triggerAt: 0.46, passAt: 0.59 },
  { side: 'left',  text: 'LESS FRICTION.\nMORE EXPERIENCE.', triggerAt: 0.54, passAt: 0.67 },
  { side: 'right', text: 'MEDIA SHOULD\nFEEL PERSONAL.',  triggerAt: 0.62, passAt: 0.75 },
  { side: 'left',  text: 'DISCOVER.',                     triggerAt: 0.70, passAt: 0.83 },
  { side: 'right', text: 'EXPERIENCE.',                   triggerAt: 0.76, passAt: 0.88 },
];

// ─── Ticket Printer ───────────────────────────────────────────────────────────
function TicketPrinter({ onDone }: { onDone: () => void }) {
  const [printLine, setPrintLine] = useState(0);
  const [phase, setPhase] = useState<'printing' | 'done'>('printing');

  const lines = [
    '══════════════════════',
    '    OMNISTREAM        ',
    '    CineMorph         ',
    '──────────────────────',
    '  ADMIT ONE           ',
    '  THEATER A — SCREEN 1',
    '  IMAX PRESENTATION   ',
    '──────────────────────',
    '  YOUR FEATURE        ',
    '  BEGINS NOW          ',
    '══════════════════════',
  ];

  useEffect(() => {
    if (printLine >= lines.length) {
      setPhase('done');
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPrintLine(l => l + 1), 170);
    return () => clearTimeout(t);
  }, [printLine]);

  return (
    <div className="flex flex-col items-center">
      {/* Printer Body */}
      <div className="relative w-56 h-20 bg-gradient-to-b from-stone-100 to-stone-200 rounded-t-2xl border border-stone-300 shadow-2xl flex items-end justify-center pb-1.5">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-[0.4em] text-stone-500 uppercase">CINEPORT</div>
        <div className={`absolute top-3.5 right-4 w-2 h-2 rounded-full transition-all duration-300 ${phase === 'printing' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-stone-400'}`} />
        <div className="absolute top-3.5 left-4 w-2 h-2 rounded-full bg-red-600/80" />
        {/* Paper slot */}
        <div className="w-40 h-2.5 bg-stone-400/40 rounded-sm" />
      </div>

      {/* Emerging ticket */}
      <div
        className="w-48 bg-[#FDFAF3] border-x border-stone-200 overflow-hidden transition-all duration-200"
        style={{ height: `${printLine * 13 + 6}px` }}
      >
        <div className="pt-2 px-3 font-mono text-[9px] text-stone-600 leading-[1.5]">
          {lines.slice(0, printLine).map((l, i) => (
            <div key={i} className={i === printLine - 1 ? 'animate-in fade-in duration-100' : ''}>{l}</div>
          ))}
        </div>
      </div>

      {/* Perforation */}
      {phase === 'done' && (
        <div className="w-48 py-1 flex items-center gap-0.5">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="flex-1 h-[2px] bg-amber-200" />
          ))}
        </div>
      )}

      {/* Stub */}
      {phase === 'done' && (
        <div className="w-48 bg-[#FDFAF3] border-x border-b border-stone-200 rounded-b-xl px-3 py-2 font-mono text-[8px] text-stone-400 text-center animate-in fade-in duration-300">
          ✂ TEAR HERE · KEEP THIS PORTION
        </div>
      )}
    </div>
  );
}

// ─── Lights-off overlay ───────────────────────────────────────────────────────
function LightsOff({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div
      className="fixed inset-0 z-[200] bg-black pointer-events-none"
      style={{ opacity }}
    />
  );
}

// ─── POV Landing Main ─────────────────────────────────────────────────────────
export const POVLanding: React.FC = () => {
  const navigate = useNavigate();
  const { setVersionMode } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [chosen, setChosen] = useState<'utube' | 'cinemorph' | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [lightsOpacity, setLightsOpacity] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const animRef = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // ─── Scroll tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const p = scrollProgress; // shorthand
  const showFork = p > 0.80;
  const forkReveal = Math.min(1, (p - 0.80) / 0.20);

  // ─── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (transitioning) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); handleUTube(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleCineMorph(); }
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        el?.scrollBy({ top: 280, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transitioning]);

  // ─── Animate lightsOpacity ────────────────────────────────────────────────
  const animateLights = useCallback((
    from: number, to: number, durationMs: number, onComplete?: () => void
  ) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      setLightsOpacity(from + (to - from) * t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        onComplete?.();
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ─── U-Tube entry ──────────────────────────────────────────────────────────
  const handleUTube = useCallback(() => {
    if (transitioning) return;
    setChosen('utube');
    setTransitioning(true);
    animateLights(0, 0.7, 500, () => {
      setVersionMode('v1');
      navigate('/home');
    });
  }, [transitioning, animateLights, setVersionMode, navigate]);

  // ─── CineMorph entry ───────────────────────────────────────────────────────
  const handleCineMorph = useCallback(() => {
    if (transitioning) return;
    setChosen('cinemorph');
    setTransitioning(true);
    setShowTicket(true);
  }, [transitioning]);

  const handleTicketDone = useCallback(() => {
    // Start gradual lights-off → full black → navigate
    animateLights(0, 1, 2400, () => {
      setTimeout(() => {
        setVersionMode('v2');
        navigate('/cinemorph');
      }, 400);
    });
  }, [animateLights, setVersionMode, navigate]);

  // ─── Scroll the user to fork on load hint ─────────────────────────────────
  const scrollHint = Math.max(0, 1 - p * 5);

  // ─── Camera perspective vars ──────────────────────────────────────────────
  // Progress drives: ceiling drop, wall narrowing, horizon shift
  const ceilPct  = prefersReducedMotion ? 38 : (38 - p * 7);  // ceiling bottom %
  const floorPct = prefersReducedMotion ? 52 : (52 + p * 7);  // floor top %
  const wallW    = prefersReducedMotion ? 22 : (22 + p * 8);  // wall width %

  // OMS logo in corridor: starts large & centered, shrinks as if walking toward it then past
  // At p=0 it appears at vanishing point (distant), at p=0.45 it's at eye-level (largest), then fades past
  const omsPhase = p < 0.45 ? p / 0.45 : 1 - (p - 0.45) / 0.55;
  const omsVisible = p > 0.02 && p < 0.85;
  const omsScale   = 0.4 + omsPhase * 0.8; // grows from 0.4 to 1.2 then shrinks
  const omsOpacity = Math.min(1, omsPhase * 3) * (p < 0.80 ? 1 : Math.max(0, 1 - (p - 0.80) / 0.05));
  // Vertical position: start high (near vanishing point), move to center as it gets closer
  const omsTop = prefersReducedMotion ? 50 : (30 + omsPhase * 20);

  return (
    <>
      <LightsOff opacity={lightsOpacity} />

      {/* Ticket printer overlay */}
      {showTicket && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-400">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <p className="text-amber-300 text-xs font-mono font-black tracking-[0.4em] uppercase">Printing Your Ticket</p>
              <p className="text-amber-500/50 text-[10px] font-mono tracking-widest">CineMorph · Theater A</p>
            </div>
            <TicketPrinter onDone={handleTicketDone} />
          </div>
        </div>
      )}

      {/* ─── Main scrollable journey ─── */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="fixed inset-0 overflow-y-scroll hide-scrollbar"
        style={{ background: '#F5F2EE' }}
        aria-label="OmniStream journey — scroll to walk forward"
        role="main"
      >
        {/* Scroll height creates the "walk" distance */}
        <div style={{ height: '700vh' }} aria-hidden />

        {/* ─── Fixed visual layer ─── */}
        <div className="fixed inset-0 overflow-hidden" aria-hidden>

          {/* === CEILING === */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: `${ceilPct}%`,
              background: `linear-gradient(180deg,
                #FAFAF7 0%,
                #F4EFE6 45%,
                #EDE5D8 ${70 + p * 15}%,
                #E4DAC8 100%
              )`,
              transition: prefersReducedMotion ? 'none' : 'height 0.05s linear',
            }}
          >
            {/* Ceiling track lights */}
            <div className="absolute bottom-0 inset-x-0 flex justify-center items-end gap-24 pb-0">
              {[0, 1, 2, 3, 4].map(i => {
                const depth = 1 - Math.abs(i - 2) * 0.2;
                const offset = (i - 2) * (20 + p * 40);
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center"
                    style={{
                      transform: `scaleY(${depth}) translateX(${offset}px)`,
                      opacity: 0.6 * depth,
                    }}
                  >
                    {/* Fixture */}
                    <div className="w-8 h-1.5 bg-stone-300/80 rounded-sm" />
                    {/* Light cone */}
                    <div
                      style={{
                        width: `${80 + i * 8}px`,
                        height: `${50 + p * 20}px`,
                        background: 'radial-gradient(ellipse at center top, rgba(255,245,215,0.5) 0%, rgba(255,235,190,0.1) 60%, transparent 85%)',
                        clipPath: 'polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* === FLOOR === */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: `${100 - floorPct}%`,
              background: `linear-gradient(0deg,
                #CEC7B8 0%,
                #D8D0C2 ${25 - p * 5}%,
                #E6E0D4 60%,
                transparent 100%
              )`,
              transition: prefersReducedMotion ? 'none' : 'height 0.05s linear',
            }}
          >
            {/* Floor perspective grid */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Horizontal depth lines */}
              {[...Array(9)].map((_, i) => {
                const t = (i + 1) / 10;
                const y = t * 100;
                const hw = 100 - t * 50;
                const vx = 50 + p * 3;
                return (
                  <line key={`h-${i}`}
                    x1={`${vx - hw}%`} y1={`${y}%`}
                    x2={`${vx + hw}%`} y2={`${y}%`}
                    stroke="#B8B0A0" strokeWidth={0.6} opacity={t * 0.45}
                  />
                );
              })}
              {/* Vanishing lines */}
              {[...Array(11)].map((_, i) => {
                const vx = 50 + p * 3;
                const vy = -15;
                const sx = (i - 5) * 11;
                return (
                  <line key={`v-${i}`}
                    x1={`${vx}%`} y1={`${vy}%`}
                    x2={`${vx + sx}%`} y2="100%"
                    stroke="#B8B0A0" strokeWidth={0.5} opacity={0.35}
                  />
                );
              })}
            </svg>
          </div>

          {/* === LEFT WALL === */}
          <div
            className="absolute top-0 bottom-0 left-0"
            style={{
              width: `${wallW}%`,
              background: `linear-gradient(90deg,
                #E6E0D5 0%,
                #EDE7DC ${35 - p * 8}%,
                transparent 100%
              )`,
              transition: prefersReducedMotion ? 'none' : 'width 0.05s linear',
            }}
          >
            <div className="absolute inset-y-0 right-0 w-px bg-stone-300/40" />
            <div className="absolute bottom-0 inset-x-0 h-4 bg-stone-300/40" />
          </div>

          {/* === RIGHT WALL === */}
          <div
            className="absolute top-0 bottom-0 right-0"
            style={{
              width: `${wallW}%`,
              background: `linear-gradient(-90deg,
                #E6E0D5 0%,
                #EDE7DC ${35 - p * 8}%,
                transparent 100%
              )`,
              transition: prefersReducedMotion ? 'none' : 'width 0.05s linear',
            }}
          >
            <div className="absolute inset-y-0 left-0 w-px bg-stone-300/40" />
            <div className="absolute bottom-0 inset-x-0 h-4 bg-stone-300/40" />
          </div>

          {/* === VANISHING POINT AMBIENT GLOW === */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${50 + p * 3}%`,
              top: `${ceilPct}%`,
              transform: 'translate(-50%, -30%)',
              width: '360px',
              height: '360px',
              background: `radial-gradient(ellipse at center, rgba(255,248,228,${0.25 + p * 0.15}) 0%, rgba(240,232,210,0.06) 55%, transparent 75%)`,
            }}
          />

          {/* === OMS LOGO — floating in corridor center as the guiding presence === */}
          {omsVisible && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${50 + p * 3}%`,
                top: `${omsTop}%`,
                transform: `translate(-50%, -50%) scale(${omsScale})`,
                opacity: prefersReducedMotion ? 1 : omsOpacity,
                transition: prefersReducedMotion ? 'opacity 0.4s' : 'none',
              }}
            >
              {/* Halo glow behind logo */}
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{
                  width: '120px',
                  height: '120px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  background: 'radial-gradient(ellipse, rgba(217,119,6,0.18) 0%, rgba(245,158,11,0.06) 60%, transparent 85%)',
                }}
              />
              <OMSLogo variant="light" size="xl" animated showLabel={false} />

              {/* OMS tagline below logo — only visible when close */}
              {omsPhase > 0.55 && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 text-center whitespace-nowrap"
                  style={{ opacity: Math.min(1, (omsPhase - 0.55) * 5) }}
                >
                  <p className="text-[10px] font-black tracking-[0.4em] text-stone-500 uppercase">OMS Intelligence</p>
                </div>
              )}
            </div>
          )}

          {/* === WALL MESSAGES === */}
          {WALL_MESSAGES.map((msg, idx) => {
            const vis = p >= msg.triggerAt && p < msg.passAt + 0.05;
            const rel = p < msg.triggerAt
              ? 0
              : p >= msg.passAt
              ? Math.max(0, 1 - (p - msg.passAt) / 0.05)
              : Math.min(1, (p - msg.triggerAt) / 0.05);

            if (!vis && !prefersReducedMotion) return null;

            const isLeft = msg.side === 'left';
            const wallEdge = `${1.5 + p * 2}%`;

            return (
              <div
                key={idx}
                className="absolute pointer-events-none"
                style={{
                  [isLeft ? 'left' : 'right']: wallEdge,
                  top: '38%',
                  opacity: prefersReducedMotion ? (vis ? 1 : 0) : rel,
                  transform: prefersReducedMotion ? 'none' : `
                    translateY(${(1 - rel) * 18}px)
                    ${isLeft ? `translateX(${(1 - rel) * -12}px)` : `translateX(${(1 - rel) * 12}px)`}
                  `,
                  maxWidth: '15%',
                }}
              >
                <p
                  className="font-black uppercase tracking-[0.12em] text-stone-400/75 leading-[1.3]"
                  style={{ fontSize: 'clamp(9px, 1.1vw, 14px)', whiteSpace: 'pre-line' }}
                >
                  {msg.text}
                </p>
              </div>
            );
          })}

          {/* === ENTRANCE TITLE — fades as user walks === */}
          <div
            className="absolute inset-x-0 pointer-events-none flex flex-col items-center"
            style={{
              top: `${ceilPct + 5}%`,
              opacity: Math.max(0, 1 - p * 4.5),
              transform: `translateY(${p * -25}px)`,
            }}
          >
            <p
              className="font-black tracking-[0.55em] text-stone-700 uppercase"
              style={{ fontSize: 'clamp(16px, 3vw, 40px)' }}
            >
              OMNISTREAM
            </p>
            <p className="text-stone-400 text-xs tracking-[0.3em] uppercase mt-2 font-semibold">
              Your Media Space
            </p>
            <div
              className="mt-5 flex items-center gap-2 text-stone-400/70 text-[11px] font-mono"
              style={{ animation: scrollHint > 0.5 ? 'bounce 2s infinite' : 'none' }}
            >
              <span>scroll to walk forward</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* === Y-FORK ENVIRONMENT === */}
          {showFork && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ opacity: prefersReducedMotion ? 1 : forkReveal }}
            >
              {/* Center fork divider */}
              <div
                className="absolute"
                style={{
                  left: `${50 + p * 3}%`,
                  top: `${ceilPct}%`,
                  height: `${100 - ceilPct}%`,
                  width: '1px',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(150,140,125,0.3) 30%, rgba(150,140,125,0.65) 100%)',
                  transform: 'translateX(-50%)',
                }}
              />

              {/* Left path tint — U-Tube clean */}
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: '49%',
                  background: 'linear-gradient(90deg, rgba(254,242,242,0.35) 0%, rgba(255,248,248,0.12) 70%, transparent 100%)',
                }}
              />

              {/* Right path tint — CineMorph warm */}
              <div
                className="absolute right-0 top-0 bottom-0"
                style={{
                  width: '49%',
                  background: 'linear-gradient(-90deg, rgba(255,251,235,0.35) 0%, rgba(255,248,235,0.12) 70%, transparent 100%)',
                }}
              />

              {/* Left fork wall text */}
              <div className="absolute left-[1.5%] top-[40%] space-y-1">
                <div className="text-[10px] font-black tracking-[0.25em] text-red-500/70 uppercase">DISCOVER</div>
                <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">BROWSE</div>
                <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">WATCH</div>
              </div>

              {/* Right fork wall text */}
              <div className="absolute right-[1.5%] top-[40%] text-right space-y-1">
                <div className="text-[10px] font-black tracking-[0.25em] text-amber-600/70 uppercase">IMMERSE</div>
                <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">CINEMA</div>
                <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">THEATER</div>
              </div>
            </div>
          )}
        </div>

        {/* ─── CHOICE PANEL — fixed bottom, slides in at fork ─── */}
        {showFork && (
          <div
            className="fixed bottom-0 inset-x-0 z-50 pointer-events-auto"
            style={{
              opacity: prefersReducedMotion ? 1 : forkReveal,
              transform: prefersReducedMotion ? 'none' : `translateY(${(1 - forkReveal) * 90}px)`,
            }}
          >
            <div className="max-w-3xl mx-auto px-4 pb-7 pt-4">
              <div className="relative bg-white/70 backdrop-blur-2xl border border-stone-200/80 rounded-2xl shadow-2xl shadow-stone-900/8 overflow-hidden">

                {/* Center divider line */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-stone-300/80 to-transparent" />

                <div className="grid grid-cols-2">

                  {/* ── LEFT: U-TUBE ── */}
                  <button
                    onClick={handleUTube}
                    disabled={transitioning}
                    className="group relative p-6 sm:p-8 text-left hover:bg-red-50/70 rounded-l-2xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                    aria-label="Enter U-Tube — video discovery and watching"
                  >
                    {/* Arrow */}
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-7 h-7 rounded-full border border-red-200 bg-red-50 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 transition-all">
                        <svg className="w-3.5 h-3.5 text-red-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-[0.28em] text-stone-400 uppercase">← Arrow</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-end gap-2">
                        <span
                          className="font-black text-stone-900 leading-none tracking-tight"
                          style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}
                        >
                          U-TUBE
                        </span>
                        <div className="flex-1 mb-1 h-px bg-red-300/60 group-hover:bg-red-500/80 transition-colors" />
                      </div>
                      <p className="text-stone-500 text-xs leading-relaxed max-w-[200px] font-medium">
                        Discover. Watch. Ad-free. Clean. Yours.
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-400/50 group-hover:bg-red-500 transition-colors" style={{ transitionDelay: `${i * 50}ms` }} />
                      ))}
                    </div>
                  </button>

                  {/* ── RIGHT: CINEMORPH ── */}
                  <button
                    onClick={handleCineMorph}
                    disabled={transitioning}
                    className="group relative p-6 sm:p-8 text-right hover:bg-amber-50/70 rounded-r-2xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
                    aria-label="Enter CineMorph — cinematic theater experience"
                  >
                    {/* Arrow */}
                    <div className="flex items-center justify-end gap-2.5 mb-4">
                      <span className="text-[9px] font-mono font-bold tracking-[0.28em] text-stone-400 uppercase">Arrow →</span>
                      <div className="w-7 h-7 rounded-full border border-amber-200 bg-amber-50 flex items-center justify-center group-hover:bg-amber-600 group-hover:border-amber-600 transition-all">
                        <svg className="w-3.5 h-3.5 text-amber-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-end gap-2 justify-end">
                        <div className="flex-1 mb-1 h-px bg-amber-300/60 group-hover:bg-amber-500/80 transition-colors" />
                        <span
                          className="font-black text-stone-900 leading-none tracking-tight"
                          style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}
                        >
                          CINEMORPH
                        </span>
                      </div>
                      <p className="text-stone-500 text-xs leading-relaxed max-w-[200px] ml-auto font-medium">
                        A cinematic experience. Immersive. Yours.
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-1">
                      {[2,1,0].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/50 group-hover:bg-amber-500 transition-colors" style={{ transitionDelay: `${i * 50}ms` }} />
                      ))}
                    </div>
                  </button>
                </div>

                {/* Bottom attribution */}
                <div className="absolute bottom-2.5 inset-x-0 text-center">
                  <span className="text-[8px] font-mono tracking-[0.35em] text-stone-400/50 uppercase">
                    OMNISTREAM · OMS Intelligence Platform
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
