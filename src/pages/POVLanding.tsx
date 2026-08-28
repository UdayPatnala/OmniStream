import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { OMSLogo } from '../components/common/OMSLogo';
import { 
  Search, 
  Play, 
  Heart, 
  Monitor, 
  Film, 
  Armchair, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Cpu
} from 'lucide-react';

// ─── Ticket Printer ───────────────────────────────────────────────────────────
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
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPrintLine(l => l + 1), 160);
    return () => clearTimeout(t);
  }, [printLine, onDone]);

  return (
    <div className="flex flex-col items-center">
      {/* Printer body */}
      <div className="relative w-56 h-20 bg-gradient-to-b from-stone-100 to-stone-200 rounded-t-2xl border border-stone-300 shadow-2xl">
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-[0.4em] text-stone-500 uppercase">CINEPORT</div>
        <div className={`absolute top-4 right-5 w-2 h-2 rounded-full transition-all ${!done ? 'bg-[#087F7B] shadow-[0_0_8px_rgba(8,127,123,0.9)] animate-pulse' : 'bg-stone-400'}`} />
        <div className="absolute top-4 left-5 w-2 h-2 rounded-full bg-red-600/80" />
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

// ─── Lights-off Overlay ───────────────────────────────────────────────────────
function LightsOff({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div
      className="fixed inset-0 z-[200] bg-black pointer-events-none"
      style={{ opacity }}
    />
  );
}

// ─── Main POV Landing Component ───────────────────────────────────────────────
export const POVLanding: React.FC = () => {
  const navigate = useNavigate();
  const { setVersionMode } = useAppStore();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTicket, setShowTicket] = useState(false);
  const [lightsOpacity, setLightsOpacity] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [activeHover, setActiveHover] = useState<'utube' | 'cinemorph' | null>(null);
  const animRef = useRef<number | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // ─── Scroll listener for Layout container #pov-scroll-root ───────────────
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('pov-scroll-root');
      if (el) {
        const max = el.scrollHeight - el.clientHeight;
        setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      }
    };

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
  const showFork = p > 0.82;
  const forkReveal = Math.min(1, (p - 0.82) / 0.18);

  // ─── Keyboard interactions ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (transitioning) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); doUTube(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); doCineMorph(); }
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        const el = document.getElementById('pov-scroll-root');
        if (el) el.scrollBy({ top: 300, behavior: 'smooth' });
        else window.scrollBy({ top: 300, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transitioning]);

  // ─── Lights-off transition helper ──────────────────────────────────────────
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

  // ─── Path selections ──────────────────────────────────────────────────────
  const doUTube = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    animateLights(0, 0.85, 600, () => {
      setVersionMode('v1');
      navigate('/home');
    });
  }, [transitioning, animateLights, setVersionMode, navigate]);

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

  // ─── Mathematical 3D Transform Properties ──────────────────────────────────
  // L = total length of the 3D corridor in pixels
  const L = 3200;
  // cameraZ moves from Z=0 to Z=2600 based on scroll progress
  const cameraZ = prefersReducedMotion ? 2500 : (p * 2600);

  return (
    <>
      <LightsOff opacity={lightsOpacity} />

      {/* Ticket printer overlay */}
      {showTicket && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-400">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <p className="text-cinemorph-secondary text-xs font-mono font-black tracking-[0.4em] uppercase">Printing Your Ticket</p>
              <p className="text-stone-500 text-[10px] font-mono tracking-widest">CineMorph · Theater A</p>
            </div>
            <TicketPrinter onDone={onTicketDone} />
          </div>
        </div>
      )}

      {/* 700vh scroll spacer */}
      <div style={{ height: '700vh' }} className="pointer-events-none" aria-hidden />

      {/* Fixed Viewport Container */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none pointer-events-none z-10">

        {/* ─── CSS 3D PERSPECTIVE ENVIRONMENT ─── */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            perspective: '1000px',
            perspectiveOrigin: '50% 45%',
          }}
        >
          {/* Corridor Container */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `translateZ(${cameraZ}px)`,
              transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            
            {/* === FLOOR PLAN === */}
            <div 
              className="absolute top-1/2 left-1/2 origin-center"
              style={{
                width: '1200px',
                height: `${L}px`,
                marginLeft: '-600px',
                transform: `translateY(360px) rotateX(90deg) translateZ(${-L/2}px)`,
                background: 'linear-gradient(0deg, #D4CDC0 0%, #E8E2D6 50%, #FAF8F5 100%)',
                boxShadow: 'inset 0 0 100px rgba(184, 170, 150, 0.25)',
              }}
            >
              {/* Floor Perspective Guides */}
              <svg className="w-full h-full opacity-60" preserveAspectRatio="none">
                {/* Horizontal lines */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <line 
                    key={`fh-${i}`} 
                    x1="0" y1={`${(i/15) * L}`} 
                    x2="100%" y2={`${(i/15) * L}`} 
                    stroke="#B8AA96" strokeWidth={1} 
                  />
                ))}
                {/* Vertical perspective lines */}
                <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#B8AA96" strokeWidth={1} />
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#B8AA96" strokeWidth={1} />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#B8AA96" strokeWidth={1} />
                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#B8AA96" strokeWidth={1} />
                <line x1="90%" y1="0" x2="90%" y2="100%" stroke="#B8AA96" strokeWidth={1} />
              </svg>
            </div>

            {/* === CEILING PLAN === */}
            <div 
              className="absolute top-1/2 left-1/2 origin-center"
              style={{
                width: '1200px',
                height: `${L}px`,
                marginLeft: '-600px',
                transform: `translateY(-440px) rotateX(-90deg) translateZ(${-L/2}px)`,
                background: 'linear-gradient(180deg, #FAFAF8 0%, #EDE7DD 100%)',
              }}
            >
              {/* Ceiling longitudinal light tracks */}
              <div className="absolute inset-y-0 left-1/4 w-1 bg-stone-300/40" />
              <div className="absolute inset-y-0 right-1/4 w-1 bg-stone-300/40" />
            </div>

            {/* === LEFT WALL (U-Tube/Garnet Side) === */}
            <div 
              className="absolute top-1/2 left-1/2 origin-center"
              style={{
                width: `${L}px`,
                height: '800px',
                marginTop: '-400px',
                marginLeft: `-${L/2}px`,
                transform: `translateX(-600px) rotateY(90deg) translateZ(${-L/2}px)`,
                background: 'linear-gradient(90deg, #EAE5DB 0%, #FAF8F5 100%)',
                boxShadow: 'inset -80px 0 100px rgba(0,0,0,0.03)',
              }}
            >
              {/* Architectural baseboard */}
              <div className="absolute bottom-0 inset-x-0 h-4 bg-stone-300/40" />
              {/* Accent top stripe (Garnet) */}
              <div className="absolute top-12 inset-x-0 h-[3px] bg-[#C7494F]/20" />

              {/* WALL MESSAGES: DISCOVER, WATCH, YOURS */}
              <div className="absolute inset-0 flex items-center justify-around px-24 select-none">
                
                {/* 1. DISCOVER */}
                <div className="flex items-center gap-6 transform rotate-0" style={{ width: '380px' }}>
                  <div className="w-14 h-14 rounded-full border-2 border-[#C7494F]/20 bg-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                    <Search className="w-6 h-6 text-[#C7494F]" />
                  </div>
                  <div className="space-y-1 text-left font-cinematic">
                    <h3 className="text-base font-black text-[#C7494F] uppercase tracking-widest leading-none">DISCOVER</h3>
                    <p className="text-[11px] text-stone-600 font-bold tracking-wide uppercase leading-normal">Find anything.<br />From anywhere.</p>
                  </div>
                </div>

                {/* 2. WATCH */}
                <div className="flex items-center gap-6" style={{ width: '380px' }}>
                  <div className="w-14 h-14 rounded-full border-2 border-[#C7494F]/20 bg-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                    <Play className="w-6 h-6 text-[#C7494F]" />
                  </div>
                  <div className="space-y-1 text-left font-cinematic">
                    <h3 className="text-base font-black text-[#C7494F] uppercase tracking-widest leading-none">WATCH</h3>
                    <p className="text-[11px] text-stone-600 font-bold tracking-wide uppercase leading-normal">Smooth. Simple.<br />Ad-free.</p>
                  </div>
                </div>

                {/* 3. YOURS */}
                <div className="flex items-center gap-6" style={{ width: '380px' }}>
                  <div className="w-14 h-14 rounded-full border-2 border-[#C7494F]/20 bg-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                    <Heart className="w-6 h-6 text-[#C7494F]" />
                  </div>
                  <div className="space-y-1 text-left font-cinematic">
                    <h3 className="text-base font-black text-[#C7494F] uppercase tracking-widest leading-none">YOURS</h3>
                    <p className="text-[11px] text-stone-600 font-bold tracking-wide uppercase leading-normal">Your history.<br />Your space.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* === RIGHT WALL (CineMorph/Teal Side) === */}
            <div 
              className="absolute top-1/2 left-1/2 origin-center"
              style={{
                width: `${L}px`,
                height: '800px',
                marginTop: '-400px',
                marginLeft: `-${L/2}px`,
                transform: `translateX(600px) rotateY(-90deg) translateZ(${-L/2}px)`,
                background: 'linear-gradient(-90deg, #EAE5DB 0%, #FAF8F5 100%)',
                boxShadow: 'inset 80px 0 100px rgba(0,0,0,0.03)',
              }}
            >
              <div className="absolute bottom-0 inset-x-0 h-4 bg-stone-300/40" />
              <div className="absolute top-12 inset-x-0 h-[3px] bg-[#526C9E]/20" />

              {/* WALL MESSAGES: IMMENSE, CINEMA, IMMERSIVE */}
              <div className="absolute inset-0 flex items-center justify-around px-24 select-none">
                
                {/* 1. IMMENSE */}
                <div className="flex items-center gap-6" style={{ width: '380px' }}>
                  <div className="w-14 h-14 rounded-full border-2 border-[#526C9E]/20 bg-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                    <Monitor className="w-6 h-6 text-[#526C9E]" />
                  </div>
                  <div className="space-y-1 text-left font-cinematic">
                    <h3 className="text-base font-black text-[#526C9E] uppercase tracking-widest leading-none">IMMENSE</h3>
                    <p className="text-[11px] text-stone-600 font-bold tracking-wide uppercase leading-normal">Step beyond<br />the ordinary.</p>
                  </div>
                </div>

                {/* 2. CINEMA */}
                <div className="flex items-center gap-6" style={{ width: '380px' }}>
                  <div className="w-14 h-14 rounded-full border-2 border-[#526C9E]/20 bg-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                    <Film className="w-6 h-6 text-[#526C9E]" />
                  </div>
                  <div className="space-y-1 text-left font-cinematic">
                    <h3 className="text-base font-black text-[#526C9E] uppercase tracking-widest leading-none">CINEMA</h3>
                    <p className="text-[11px] text-stone-600 font-bold tracking-wide uppercase leading-normal">Big screen feeling.<br />At home.</p>
                  </div>
                </div>

                {/* 3. IMMERSIVE */}
                <div className="flex items-center gap-6" style={{ width: '380px' }}>
                  <div className="w-14 h-14 rounded-full border-2 border-[#087F7B]/20 bg-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                    <Armchair className="w-6 h-6 text-[#087F7B]" />
                  </div>
                  <div className="space-y-1 text-left font-cinematic">
                    <h3 className="text-base font-black text-[#087F7B] uppercase tracking-widest leading-none">IMMERSIVE</h3>
                    <p className="text-[11px] text-stone-600 font-bold tracking-wide uppercase leading-normal">Lose yourself in<br />the experience.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* === BACK WALL (Vanishing Point Portal) === */}
            <div 
              className="absolute top-1/2 left-1/2 origin-center flex flex-col items-center justify-center"
              style={{
                width: '1200px',
                height: '800px',
                marginTop: '-400px',
                marginLeft: '-600px',
                transform: `translateZ(${-L}px)`,
                background: '#FAF8F5',
              }}
            >
              {/* Back Wall Gateway Door / Lights */}
              <div 
                className="w-[180px] h-[340px] bg-white border border-stone-200/80 shadow-[0_0_80px_rgba(255,248,228,0.85)] flex items-center justify-center rounded-t-full relative"
                style={{
                  boxShadow: '0 0 100px rgba(255,248,228,0.7), inset 0 0 40px rgba(238,230,210,0.3)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
              </div>
            </div>

          </div>
        </div>

        {/* ─── HUD BRAND / TITLE HEADER (Sticky, top center) ─── */}
        <div 
          className="absolute top-12 inset-x-0 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{
            opacity: Math.max(0, 1 - p * 3.5),
            transform: `translateY(${p * -18}px)`,
          }}
        >
          <div className="mb-2">
            <OMSLogo variant="light" size="md" animated={true} />
          </div>
          <p className="font-cinematic-title font-black text-2xl tracking-[0.45em] text-[#34363A] uppercase leading-none">
            OMNISTREAM
          </p>
          <p className="text-[#8B9095] text-[10px] tracking-[0.3em] uppercase mt-2 font-bold font-sans">
            YOUR MEDIA. YOUR WAY.
          </p>

          <div className="mt-8 flex items-center gap-1.5 text-stone-400/80 text-[10px] font-mono tracking-widest animate-bounce">
            <span>SCROLL TO CHOOSE</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ─── Y-FORK ENVIRONMENTAL PATHWAYS (Revealed near end) ─── */}
        {showFork && (
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{ opacity: prefersReducedMotion ? 1 : forkReveal }}
          >
            {/* Center dividing axis line */}
            <div 
              className="absolute left-1/2 top-[45%] bottom-0 w-px bg-gradient-to-b from-transparent via-[#8B9095]/40 to-[#8B9095]"
              style={{ transform: 'translateX(-50%)' }}
            />

            {/* Left pathway glow (U-Tube/Garnet) */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-[45%]"
              style={{ background: 'linear-gradient(90deg, rgba(184,58,75,0.06) 0%, transparent 80%)' }}
            />

            {/* Right pathway glow (CineMorph/Teal) */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-[45%]"
              style={{ background: 'linear-gradient(-90deg, rgba(8,127,123,0.06) 0%, transparent 80%)' }}
            />
          </div>
        )}

      </div>

      {/* ─── INTERACTIVE CHOICE DECK (Sticky bottom, pointer-events-auto) ─── */}
      {showFork && (
        <div 
          className="fixed bottom-0 inset-x-0 z-50 pointer-events-auto transition-all duration-500"
          style={{
            opacity: prefersReducedMotion ? 1 : forkReveal,
            transform: prefersReducedMotion ? 'none' : `translateY(${(1 - forkReveal) * 80}px)`,
          }}
        >
          <div className="max-w-4xl mx-auto px-4 pb-8 pt-4">
            
            {/* Floor Directional Arrows */}
            <div className="flex justify-between items-center px-12 mb-4 pointer-events-none select-none">
              {/* U-Tube Left Arrow Indicator */}
              <div 
                className={`flex items-center gap-2 text-xs font-mono font-black tracking-widest transition-all duration-300 ${
                  activeHover === 'utube' ? 'text-[#C7494F] translate-x-[-4px]' : 'text-stone-400'
                }`}
              >
                <span>← U-TUBE</span>
              </div>
              
              {/* CineMorph Right Arrow Indicator */}
              <div 
                className={`flex items-center gap-2 text-xs font-mono font-black tracking-widest transition-all duration-300 ${
                  activeHover === 'cinemorph' ? 'text-[#526C9E] translate-x-[4px]' : 'text-stone-400'
                }`}
              >
                <span>CINEMORPH →</span>
              </div>
            </div>

            {/* The Main Blueprint Glass Choice Card */}
            <div className="relative bg-white/70 backdrop-blur-2xl border border-stone-200/90 rounded-[2rem] shadow-2xl shadow-stone-900/6 overflow-hidden">
              
              {/* Vertical architectural layout line */}
              <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-stone-200/20 via-stone-300/80 to-stone-200/20" />

              <div className="grid grid-cols-2">
                
                {/* ── LEFT PATHWAY: U-TUBE CARD ── */}
                <button
                  onClick={doUTube}
                  onMouseEnter={() => setActiveHover('utube')}
                  onMouseLeave={() => setActiveHover(null)}
                  disabled={transitioning}
                  className="group p-8 sm:p-10 text-left hover:bg-[#FAF8F5]/80 rounded-l-[2rem] transition-colors duration-350 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7494F] cursor-pointer"
                  aria-label="Enter U-Tube Platform"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full border border-red-200 bg-red-50/50 flex items-center justify-center group-hover:bg-[#C7494F] group-hover:border-[#C7494F] transition-all shadow-sm">
                      <ArrowLeft className="w-4 h-4 text-[#C7494F] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-stone-400 uppercase">
                      Select Left Path
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <span className="font-black text-[#34363A] leading-none tracking-tight group-hover:text-[#C7494F] transition-colors font-cinematic-title" style={{ fontSize: 'clamp(22px, 2.8vw, 36px)' }}>
                        U-TUBE
                      </span>
                      <div className="flex-1 mb-1.5 h-px bg-stone-300/60 group-hover:bg-[#C7494F]/40 transition-colors" />
                    </div>
                    <p className="text-stone-500 text-xs sm:text-sm font-medium leading-relaxed max-w-[240px]">
                      Discover and watch. Ad-free. Clean. Yours.
                    </p>
                  </div>
                </button>

                {/* ── RIGHT PATHWAY: CINEMORPH CARD ── */}
                <button
                  onClick={doCineMorph}
                  onMouseEnter={() => setActiveHover('cinemorph')}
                  onMouseLeave={() => setActiveHover(null)}
                  disabled={transitioning}
                  className="group p-8 sm:p-10 text-right hover:bg-[#F8F3EA]/80 rounded-r-[2rem] transition-colors duration-350 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#526C9E] cursor-pointer"
                  aria-label="Enter CineMorph Virtual Theater"
                >
                  <div className="flex items-center justify-end gap-3 mb-5">
                    <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-stone-400 uppercase">
                      Select Right Path
                    </span>
                    <div className="w-8 h-8 rounded-full border border-indigo-200 bg-indigo-50/50 flex items-center justify-center group-hover:bg-[#526C9E] group-hover:border-[#526C9E] transition-all shadow-sm">
                      <ArrowRight className="w-4 h-4 text-[#526C9E] group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end gap-2 justify-end">
                      <div className="flex-1 mb-1.5 h-px bg-stone-300/60 group-hover:bg-[#526C9E]/40 transition-colors" />
                      <span className="font-black text-[#34363A] leading-none tracking-tight group-hover:text-[#526C9E] transition-colors font-cinematic-title" style={{ fontSize: 'clamp(22px, 2.8vw, 36px)' }}>
                        CINEMORPH
                      </span>
                    </div>
                    <p className="text-stone-500 text-xs sm:text-sm font-medium leading-relaxed max-w-[240px] ml-auto">
                      A cinematic theater experience. Immersive. Personal.
                    </p>
                  </div>
                </button>

              </div>

              {/* ── CENTRAL ZONE: OMS INTELLIGENCE INDICATOR (Neutral Graphite) ── */}
              <div className="border-t border-stone-200/80 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 text-[#34363A]" />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-[10px] font-black tracking-widest text-[#34363A] uppercase">OMS INTELLIGENCE</p>
                    <p className="text-[9px] text-[#8B9095] font-semibold mt-0.5 uppercase tracking-wide">Powered by OMS for a smarter media experience</p>
                  </div>
                </div>

                {/* Keyboard Helper Instructions Label */}
                <div className="text-[9px] font-mono text-[#8B9095] tracking-widest uppercase flex items-center gap-1.5 font-bold">
                  <span>Use</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-[#34363A]">←</kbd>
                  <span>or</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-[#34363A]">➔</kbd>
                  <span>arrow keys to choose path</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
  </>
);
};
