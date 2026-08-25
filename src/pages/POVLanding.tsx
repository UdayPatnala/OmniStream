/**
 * POVLanding — OmniStream First-Person Corridor Journey
 *
 * Scroll-driven POV: the user "walks" through a warm architectural media
 * corridor. OMS logo floats in the center as the guiding entity.
 * At the Y-fork the user picks: U-TUBE (left) or CINEMORPH (right).
 *
 * Scroll is handled by the Layout's #pov-scroll-root container.
 * All visuals are fixed to the viewport; the 700vh spacer drives progress.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { OMSLogo } from '../components/common/OMSLogo';

// ─── Wall message data ────────────────────────────────────────────────────────
const WALL_MESSAGES: {
  side: 'left' | 'right';
  text: string;
  in: number;   // scroll progress when it appears
  out: number;  // scroll progress when it fades
}[] = [
  { side: 'left',  text: 'MEDIA.',                          in: 0.04, out: 0.16 },
  { side: 'right', text: 'DISCOVERY.',                      in: 0.11, out: 0.23 },
  { side: 'left',  text: 'WATCH WITHOUT\nFRICTION.',        in: 0.19, out: 0.33 },
  { side: 'right', text: 'YOUR MEDIA.\nYOUR WAY.',          in: 0.27, out: 0.41 },
  { side: 'left',  text: 'FROM A LINK\nTO A SCREEN.',       in: 0.37, out: 0.51 },
  { side: 'right', text: 'FROM A VIDEO\nTO A CINEMA.',      in: 0.46, out: 0.60 },
  { side: 'left',  text: 'LESS FRICTION.\nMORE EXPERIENCE.',in: 0.54, out: 0.68 },
  { side: 'right', text: 'MEDIA SHOULD\nFEEL PERSONAL.',    in: 0.62, out: 0.76 },
  { side: 'left',  text: 'DISCOVER.',                       in: 0.70, out: 0.84 },
  { side: 'right', text: 'EXPERIENCE.',                     in: 0.76, out: 0.89 },
];

// ─── Ticket printer ───────────────────────────────────────────────────────────
function TicketPrinter({ onDone }: { onDone: () => void }) {
  const [printLine, setPrintLine] = useState(0);
  const [done, setDone] = useState(false);

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
      setDone(true);
      const t = setTimeout(onDone, 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPrintLine(l => l + 1), 160);
    return () => clearTimeout(t);
  }, [printLine]);

  return (
    <div className="flex flex-col items-center">
      {/* Printer body */}
      <div className="relative w-56 h-20 bg-gradient-to-b from-stone-100 to-stone-200 rounded-t-2xl border border-stone-300 shadow-2xl">
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-[0.4em] text-stone-500 uppercase">CINEPORT</div>
        <div className={`absolute top-4 right-5 w-2 h-2 rounded-full transition-all ${!done ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-stone-400'}`} />
        <div className="absolute top-4 left-5 w-2 h-2 rounded-full bg-red-600/80" />
        {/* Paper slot */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-40 h-2.5 bg-stone-400/40 rounded-sm" />
      </div>
      {/* Emerging paper */}
      <div className="w-48 bg-[#FDFAF3] border-x border-stone-200 overflow-hidden transition-all duration-150"
        style={{ height: `${printLine * 13 + 6}px` }}>
        <div className="pt-2 px-3 font-mono text-[9px] text-stone-600 leading-[1.5]">
          {lines.slice(0, printLine).map((l, i) => (
            <div key={i} className={i === printLine - 1 ? 'animate-in fade-in duration-75' : ''}>{l}</div>
          ))}
        </div>
      </div>
      {done && (
        <>
          <div className="w-48 flex items-center gap-0.5 py-0.5">
            {Array.from({ length: 32 }).map((_, i) => <div key={i} className="flex-1 h-[2px] bg-amber-200" />)}
          </div>
          <div className="w-48 bg-[#FDFAF3] border-x border-b border-stone-200 rounded-b-xl px-3 py-2 font-mono text-[8px] text-stone-400 text-center animate-in fade-in duration-300">
            ✂ TEAR HERE · KEEP THIS PORTION
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const POVLanding: React.FC = () => {
  const navigate = useNavigate();
  const { setVersionMode } = useAppStore();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTicket, setShowTicket] = useState(false);
  const [lightsOpacity, setLightsOpacity] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const animRef = useRef<number | null>(null);

  const rm = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // ─── Scroll tracking: read from Layout's #pov-scroll-root ─────────────────
  useEffect(() => {
    // The Layout wrapper is scrollable; we track its scrollTop
    const getScrollEl = () =>
      (document.getElementById('pov-scroll-root') as HTMLElement | null) ?? window;

    const onScroll = () => {
      const el = document.getElementById('pov-scroll-root');
      if (el) {
        const max = el.scrollHeight - el.clientHeight;
        setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
      } else {
        // Fallback: window scroll
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      }
    };

    // Attach to layout root if available, else window
    const el = document.getElementById('pov-scroll-root');
    if (el) {
      el.addEventListener('scroll', onScroll, { passive: true });
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      const el2 = document.getElementById('pov-scroll-root');
      if (el2) el2.removeEventListener('scroll', onScroll);
      else window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const p = scrollProgress;
  const showFork = p > 0.80;
  const forkReveal = Math.min(1, (p - 0.80) / 0.20);

  // ─── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (transitioning) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); doUTube(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); doCineMorph(); }
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        const el = document.getElementById('pov-scroll-root');
        if (el) el.scrollBy({ top: 280, behavior: 'smooth' });
        else window.scrollBy({ top: 280, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transitioning]);

  // ─── Lights animation helper ───────────────────────────────────────────────
  const animateLights = useCallback((from: number, to: number, ms: number, cb?: () => void) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / ms);
      setLightsOpacity(from + (to - from) * t);
      if (t < 1) animRef.current = requestAnimationFrame(step);
      else cb?.();
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ─── U-Tube path ──────────────────────────────────────────────────────────
  const doUTube = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    animateLights(0, 0.7, 500, () => {
      setVersionMode('v1');
      navigate('/home');
    });
  }, [transitioning, animateLights, setVersionMode, navigate]);

  // ─── CineMorph path ───────────────────────────────────────────────────────
  const doCineMorph = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    setShowTicket(true);
  }, [transitioning]);

  const onTicketDone = useCallback(() => {
    animateLights(0, 1, 2200, () => {
      setTimeout(() => {
        setVersionMode('v2');
        navigate('/cinemorph');
      }, 400);
    });
  }, [animateLights, setVersionMode, navigate]);

  // ─── Camera perspective values ─────────────────────────────────────────────
  const ceilH  = rm ? 38 : (38 - p * 7);    // ceiling bottom % of viewport
  const floorT = rm ? 58 : (58 + p * 7);    // floor top % of viewport
  const wallW  = rm ? 22 : (22 + p * 8);    // wall width %

  // OMS logo parallax: appears distant, grows as user approaches, fades past
  const omsPhase = p < 0.45 ? p / 0.45 : 1 - (p - 0.45) / 0.55;
  const omsScale   = 0.4 + omsPhase * 0.85;
  const omsOpacity = Math.min(1, omsPhase * 3) * (p < 0.78 ? 1 : Math.max(0, 1 - (p - 0.78) / 0.05));
  const omsTop     = rm ? 48 : (28 + omsPhase * 22);
  const omsVisible = p > 0.02 && p < 0.84;

  return (
    <>
      {/* ── Dark overlay (lights-off) ── */}
      {lightsOpacity > 0 && (
        <div className="fixed inset-0 z-[200] bg-black pointer-events-none" style={{ opacity: lightsOpacity }} />
      )}

      {/* ── Ticket printer modal ── */}
      {showTicket && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-400">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <p className="text-amber-300 text-xs font-mono font-black tracking-[0.4em] uppercase">Printing Your Ticket</p>
              <p className="text-amber-500/50 text-[10px] font-mono tracking-widest">CineMorph · Theater A</p>
            </div>
            <TicketPrinter onDone={onTicketDone} />
          </div>
        </div>
      )}

      {/* ── 700vh spacer drives scrolling ── */}
      <div style={{ height: '700vh' }} aria-hidden />

      {/* ── Fixed visual layer (viewport-pinned) ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>

        {/* CEILING */}
        <div className="absolute inset-x-0 top-0"
          style={{
            height: `${ceilH}%`,
            background: `linear-gradient(180deg, #FAFAF7 0%, #F4EFE6 45%, #EDE5D8 ${70 + p * 15}%, #E4DAC8 100%)`,
          }}
        >
          {/* Track lights */}
          <div className="absolute bottom-0 inset-x-0 flex justify-center items-end gap-20 pb-0">
            {[0,1,2,3,4].map(i => {
              const depth = 1 - Math.abs(i - 2) * 0.18;
              const off = (i - 2) * (18 + p * 35);
              return (
                <div key={i} className="flex flex-col items-center"
                  style={{ transform: `scaleY(${depth}) translateX(${off}px)`, opacity: 0.6 * depth }}>
                  <div className="w-7 h-1.5 bg-stone-300/80 rounded-sm" />
                  <div style={{
                    width: `${72 + i * 6}px`,
                    height: `${44 + p * 18}px`,
                    background: 'radial-gradient(ellipse at center top, rgba(255,245,215,0.45) 0%, transparent 80%)',
                    clipPath: 'polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)',
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* FLOOR */}
        <div className="absolute inset-x-0 bottom-0"
          style={{
            height: `${100 - floorT}%`,
            background: `linear-gradient(0deg, #CEC7B8 0%, #D8D0C2 ${25 - p * 5}%, #E6E0D4 60%, transparent 100%)`,
          }}
        >
          {/* Perspective grid */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {[...Array(9)].map((_, i) => {
              const t = (i + 1) / 10;
              const y = t * 100;
              const hw = 100 - t * 50;
              const vx = 50 + p * 3;
              return <line key={`h-${i}`} x1={`${vx - hw}%`} y1={`${y}%`} x2={`${vx + hw}%`} y2={`${y}%`} stroke="#B8B0A0" strokeWidth={0.6} opacity={t * 0.45} />;
            })}
            {[...Array(11)].map((_, i) => {
              const vx = 50 + p * 3;
              const sx = (i - 5) * 11;
              return <line key={`v-${i}`} x1={`${vx}%`} y1="-15%" x2={`${vx + sx}%`} y2="100%" stroke="#B8B0A0" strokeWidth={0.5} opacity={0.35} />;
            })}
          </svg>
        </div>

        {/* LEFT WALL */}
        <div className="absolute top-0 bottom-0 left-0"
          style={{
            width: `${wallW}%`,
            background: `linear-gradient(90deg, #E6E0D5 0%, #EDE7DC ${35 - p * 8}%, transparent 100%)`,
          }}>
          <div className="absolute inset-y-0 right-0 w-px bg-stone-300/40" />
          <div className="absolute bottom-0 inset-x-0 h-4 bg-stone-300/40" />
        </div>

        {/* RIGHT WALL */}
        <div className="absolute top-0 bottom-0 right-0"
          style={{
            width: `${wallW}%`,
            background: `linear-gradient(-90deg, #E6E0D5 0%, #EDE7DC ${35 - p * 8}%, transparent 100%)`,
          }}>
          <div className="absolute inset-y-0 left-0 w-px bg-stone-300/40" />
          <div className="absolute bottom-0 inset-x-0 h-4 bg-stone-300/40" />
        </div>

        {/* VANISHING POINT GLOW */}
        <div className="absolute pointer-events-none"
          style={{
            left: `${50 + p * 3}%`, top: `${ceilH}%`,
            transform: 'translate(-50%, -30%)',
            width: '340px', height: '340px',
            background: `radial-gradient(ellipse at center, rgba(255,248,228,${0.22 + p * 0.14}) 0%, rgba(240,232,210,0.05) 55%, transparent 75%)`,
          }}
        />

        {/* OMS LOGO — floating guiding presence in the corridor center */}
        {omsVisible && (
          <div className="absolute pointer-events-none"
            style={{
              left: `${50 + p * 3}%`,
              top: `${omsTop}%`,
              transform: `translate(-50%, -50%) scale(${rm ? 1 : omsScale})`,
              opacity: rm ? 1 : omsOpacity,
            }}
          >
            {/* Halo */}
            <div className="absolute rounded-full blur-2xl"
              style={{
                width: '100px', height: '100px',
                left: '50%', top: '50%',
                transform: 'translate(-50%,-50%)',
                background: 'radial-gradient(ellipse, rgba(217,119,6,0.16) 0%, transparent 80%)',
              }}
            />
            <OMSLogo variant="light" size="xl" animated showLabel={false} />
            {/* Tagline — appears when "close" */}
            {omsPhase > 0.55 && !rm && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap text-center"
                style={{ opacity: Math.min(1, (omsPhase - 0.55) * 5) }}>
                <p className="text-[10px] font-black tracking-[0.4em] text-stone-500 uppercase">OMS Intelligence</p>
              </div>
            )}
          </div>
        )}

        {/* WALL MESSAGES */}
        {WALL_MESSAGES.map((msg, idx) => {
          const visible = p >= msg.in && p < msg.out + 0.05;
          const rel = p < msg.in ? 0
            : p >= msg.out ? Math.max(0, 1 - (p - msg.out) / 0.05)
            : Math.min(1, (p - msg.in) / 0.05);

          if (!visible && !rm) return null;

          const isLeft = msg.side === 'left';
          return (
            <div key={idx} className="absolute pointer-events-none"
              style={{
                [isLeft ? 'left' : 'right']: `${1.5 + p * 2}%`,
                top: '36%',
                opacity: rm ? (visible ? 1 : 0) : rel,
                transform: rm ? 'none' : `translateY(${(1 - rel) * 16}px) ${isLeft ? `translateX(${(1 - rel) * -10}px)` : `translateX(${(1 - rel) * 10}px)`}`,
                maxWidth: '15%',
              }}
            >
              <p className="font-black uppercase tracking-[0.12em] text-stone-400/75 leading-[1.3]"
                style={{ fontSize: 'clamp(9px, 1.1vw, 14px)', whiteSpace: 'pre-line' }}>
                {msg.text}
              </p>
            </div>
          );
        })}

        {/* OMNISTREAM ENTRANCE TITLE — fades as user scrolls */}
        <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
          style={{
            top: `${ceilH + 5}%`,
            opacity: Math.max(0, 1 - p * 4.5),
            transform: `translateY(${p * -22}px)`,
          }}
        >
          <p className="font-black tracking-[0.55em] text-stone-700 uppercase"
            style={{ fontSize: 'clamp(16px, 3vw, 40px)' }}>OMNISTREAM</p>
          <p className="text-stone-400 text-xs tracking-[0.3em] uppercase mt-2 font-semibold">Your Media Space</p>
          <div className="mt-5 flex items-center gap-2 text-stone-400/70 text-[11px] font-mono animate-bounce">
            <span>scroll to walk forward</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Y-FORK ENVIRONMENT */}
        {showFork && (
          <div className="absolute inset-0" style={{ opacity: rm ? 1 : forkReveal }}>
            {/* Center divider */}
            <div className="absolute"
              style={{
                left: `${50 + p * 3}%`, top: `${ceilH}%`,
                height: `${100 - ceilH}%`, width: '1px',
                background: 'linear-gradient(180deg, transparent 0%, rgba(150,140,125,0.3) 30%, rgba(150,140,125,0.65) 100%)',
                transform: 'translateX(-50%)',
              }}
            />
            {/* Left path — U-Tube warm */}
            <div className="absolute left-0 top-0 bottom-0" style={{ width: '49%', background: 'linear-gradient(90deg, rgba(254,242,242,0.32) 0%, transparent 100%)' }} />
            {/* Right path — CineMorph amber */}
            <div className="absolute right-0 top-0 bottom-0" style={{ width: '49%', background: 'linear-gradient(-90deg, rgba(255,251,235,0.32) 0%, transparent 100%)' }} />
            {/* Left wall text */}
            <div className="absolute left-[1.5%] top-[40%] space-y-1">
              <div className="text-[10px] font-black tracking-[0.25em] text-red-500/70 uppercase">DISCOVER</div>
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">BROWSE</div>
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">WATCH</div>
            </div>
            {/* Right wall text */}
            <div className="absolute right-[1.5%] top-[40%] text-right space-y-1">
              <div className="text-[10px] font-black tracking-[0.25em] text-amber-600/70 uppercase">IMMERSE</div>
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">CINEMA</div>
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-400/70 uppercase">THEATER</div>
            </div>
          </div>
        )}
      </div>

      {/* ── CHOICE PANEL — fixed bottom, pointer-events-auto ── */}
      {showFork && (
        <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-auto"
          style={{
            opacity: rm ? 1 : forkReveal,
            transform: rm ? 'none' : `translateY(${(1 - forkReveal) * 88}px)`,
          }}
        >
          <div className="max-w-3xl mx-auto px-4 pb-7 pt-4">
            <div className="relative bg-white/75 backdrop-blur-2xl border border-stone-200/80 rounded-2xl shadow-2xl shadow-stone-900/8 overflow-hidden">
              {/* Center line */}
              <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-stone-300/80 to-transparent" />

              <div className="grid grid-cols-2">
                {/* ── LEFT: U-TUBE ── */}
                <button
                  onClick={doUTube}
                  disabled={transitioning}
                  className="group p-6 sm:p-8 text-left hover:bg-red-50/70 rounded-l-2xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer disabled:opacity-50"
                  aria-label="Enter U-Tube"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-full border border-red-200 bg-red-50 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 transition-all">
                      <svg className="w-3.5 h-3.5 text-red-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-mono font-bold tracking-[0.28em] text-stone-400 uppercase">← Arrow</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-end gap-2">
                      <span className="font-black text-stone-900 leading-none tracking-tight" style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}>U-TUBE</span>
                      <div className="flex-1 mb-1 h-px bg-red-300/60 group-hover:bg-red-500/80 transition-colors" />
                    </div>
                    <p className="text-stone-500 text-xs leading-relaxed max-w-[200px] font-medium">Discover. Watch. Ad-free. Clean.</p>
                  </div>
                  <div className="mt-5 flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-400/50 group-hover:bg-red-500 transition-colors" style={{ transitionDelay: `${i * 50}ms` }} />)}
                  </div>
                </button>

                {/* ── RIGHT: CINEMORPH ── */}
                <button
                  onClick={doCineMorph}
                  disabled={transitioning}
                  className="group p-6 sm:p-8 text-right hover:bg-amber-50/70 rounded-r-2xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer disabled:opacity-50"
                  aria-label="Enter CineMorph"
                >
                  <div className="flex items-center justify-end gap-2.5 mb-4">
                    <span className="text-[9px] font-mono font-bold tracking-[0.28em] text-stone-400 uppercase">Arrow →</span>
                    <div className="w-7 h-7 rounded-full border border-amber-200 bg-amber-50 flex items-center justify-center group-hover:bg-amber-600 group-hover:border-amber-600 transition-all">
                      <svg className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-end gap-2 justify-end">
                      <div className="flex-1 mb-1 h-px bg-amber-300/60 group-hover:bg-amber-500/80 transition-colors" />
                      <span className="font-black text-stone-900 leading-none tracking-tight" style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}>CINEMORPH</span>
                    </div>
                    <p className="text-stone-500 text-xs leading-relaxed max-w-[200px] ml-auto font-medium">Cinematic experience. Immersive.</p>
                  </div>
                  <div className="mt-5 flex items-center justify-end gap-1">
                    {[2,1,0].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/50 group-hover:bg-amber-500 transition-colors" style={{ transitionDelay: `${i * 50}ms` }} />)}
                  </div>
                </button>
              </div>

              {/* Bottom attribution */}
              <div className="absolute bottom-2.5 inset-x-0 text-center pointer-events-none">
                <span className="text-[8px] font-mono tracking-[0.35em] text-stone-400/50 uppercase">OMNISTREAM · OMS Intelligence Platform</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
