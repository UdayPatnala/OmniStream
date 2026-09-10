import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { LocalMediaItem } from '../../types';

interface CinemaLoungeProps {
  environmentalTime: 'morning' | 'night';
  onTriggerFileInput: () => void;
  fileError?: string | null;
  activeMedia?: LocalMediaItem | null;
}

/**
 * CinemaLounge — Architectural Cinema Lounge & Responsive Hotspot System
 * 
 * - Single static architectural environment plate (16:9 aspect ratio).
 * - Proportional viewport cover with symmetric crop offsets: 100% filled viewport with zero empty margins.
 * - Interactive hotspot mapped to rendered image geometry at [45.2% left, 21% top, 30.6% width, 30.2% height].
 * - Invisible hotspot button strictly aligned with cinema screen bounds; screen appears completely empty and natural until media is selected.
 * - Zero visible UI text, tooltips, captions, hover glow, or conventional buttons.
 * - Authoritative accessibility contract: aria-label="Import local video or audio file into CineMorph theater"
 */
export const CinemaLounge: React.FC<CinemaLoungeProps> = ({
  environmentalTime,
  onTriggerFileInput,
  fileError,
  activeMedia,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageGeometry, setStageGeometry] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const isDay = environmentalTime === 'morning';

  // Compute exact proportional cover dimensions & symmetric crop offsets
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const computeGeometry = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (!cw || !ch) return;

      const imageAspect = 16 / 9;
      const containerAspect = cw / ch;

      let width: number;
      let height: number;
      let left: number;
      let top: number;

      if (containerAspect >= imageAspect) {
        // Container is wider than 16:9 -> fill width, crop height top/bottom
        width = cw;
        height = cw / imageAspect;
        left = 0;
        top = (ch - height) / 2;
      } else {
        // Container is taller than 16:9 -> fill height, crop width left/right
        height = ch;
        width = ch * imageAspect;
        top = 0;
        left = (cw - width) / 2;
      }

      setStageGeometry({ left, top, width, height });
    };

    computeGeometry();
    const resizeObserver = new ResizeObserver(computeGeometry);
    resizeObserver.observe(container);

    window.addEventListener('resize', computeGeometry);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', computeGeometry);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-stone-950 cinemorph-env-transition"
    >
      {/* ── RESPONSIVE COMPOSITING STAGE (Proportional Cover, Zero Margins) ────── */}
      <div
        className="absolute select-none pointer-events-none transition-transform duration-100"
        style={{
          left: stageGeometry ? `${stageGeometry.left}px` : 0,
          top: stageGeometry ? `${stageGeometry.top}px` : 0,
          width: stageGeometry ? `${stageGeometry.width}px` : '100%',
          height: stageGeometry ? `${stageGeometry.height}px` : '100%',
        }}
      >
        {/* ── 1. STATIC ARCHITECTURAL ENVIRONMENTAL BACKGROUND PLATE ────────────── */}
        <img
          src="/cinemorph_lounge_plate.jpg"
          alt="CineMorph Architectural Cinema Lounge"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
          draggable={false}
        />

        {/* Night-Mode Atmospheric Multiplier */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none z-[1] ${
            isDay ? 'opacity-0' : 'opacity-45'
          }`}
          style={{
            background: 'linear-gradient(180deg, rgba(5, 6, 8, 0.65) 0%, rgba(10, 14, 22, 0.4) 60%, rgba(5, 6, 8, 0.75) 100%)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* ── 2. COMPOSITED INTERACTIVE HOTSPOT LAYER (Tied to Image Coordinates) ─ */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-10">

          {/* ── MAIN CINEMA SCREEN INTERACTIVE BUTTON ─────────────────── */}
          {/* Exact inner boundary of physical screen on 1024x576 plate: left: 45.2%, top: 21%, width: 30.6%, height: 30.2% */}
          <button
            type="button"
            aria-label="Import local video or audio file into CineMorph theater"
            onClick={onTriggerFileInput}
            className="absolute group pointer-events-auto cursor-pointer outline-none overflow-hidden bg-transparent border-0 p-0 m-0 flex flex-col justify-end items-center pb-2 sm:pb-3"
            style={{
              left: '45.2%',
              top: '21%',
              width: '30.6%',
              height: '30.2%',
            }}
          >
            {activeMedia ? (
              activeMedia.thumbnail ? (
                <img
                  src={activeMedia.thumbnail}
                  alt={activeMedia.title || 'Screen preview'}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <video
                  src={activeMedia.url}
                  className="w-full h-full object-contain pointer-events-none"
                  preload="none"
                  muted
                  playsInline
                />
              )
            ) : (
              /* Simple clean line on the screen below the CineMorph AI logo — zero effects, zero pills */
              <span className="font-cinematic-mono text-[8px] sm:text-[9.5px] md:text-[11px] tracking-[0.24em] text-white/70 group-hover:text-white uppercase select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-colors duration-200">
                CLICK SCREEN TO CONTINUE
              </span>
            )}
          </button>

          {/* ── Discreet Error Notification Toast ────────────────────────────── */}
          {fileError && (
            <div
              role="alert"
              className="absolute bottom-[6%] left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="font-cinematic-mono tracking-wider">{fileError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
