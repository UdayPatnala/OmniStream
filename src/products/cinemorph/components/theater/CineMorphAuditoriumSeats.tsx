import React, { useMemo } from 'react';
import { FrameAspectRatio, CineMorphTheme } from '../../types';

export interface CineMorphAuditoriumSeatsProps {
  visible: boolean;
  frameAspectRatio: FrameAspectRatio;
  isFullscreen?: boolean;
  theme?: CineMorphTheme;
  className?: string;
}

interface SeatModel {
  id: string;
  bank: 'left' | 'right';
  index: number;
  rotationDeg: number;
  elevationPx: number;
  hasAisleLight?: boolean;
}

export const CineMorphAuditoriumSeats: React.FC<CineMorphAuditoriumSeatsProps> = ({
  visible,
  frameAspectRatio,
  isFullscreen = false,
  theme = 'cinematic-dark',
  className = '',
}) => {
  // Theme color nuances for authentic acoustic velvet
  const velvetColors = useMemo(() => {
    switch (theme) {
      case 'golden-hour':
        return {
          primary: 'from-[#3a1a0c] via-[#200d05] to-[#0a0402]',
          headrest: 'from-[#542812] to-[#2a1207]',
          border: 'border-amber-700/50',
          headrestBorder: 'border-amber-600/40',
          ambientCatch: 'rgba(245, 158, 11, 0.12)',
        };
      case 'imax-ultra':
      case 'cyberpunk-oled':
        return {
          primary: 'from-[#101b2b] via-[#09101a] to-[#03060a]',
          headrest: 'from-[#1c2e47] to-[#0c1826]',
          border: 'border-sky-800/50',
          headrestBorder: 'border-sky-600/40',
          ambientCatch: 'rgba(56, 189, 248, 0.12)',
        };
      case 'cinematic-dark':
      default:
        return {
          primary: 'from-[#330710] via-[#1c0307] to-[#060002]',
          headrest: 'from-[#4a0b18] to-[#25040b]',
          border: 'border-rose-900/60',
          headrestBorder: 'border-rose-700/40',
          ambientCatch: 'rgba(225, 29, 72, 0.12)',
        };
    }
  }, [theme]);

  // Systematically generate Left and Right bank seats with radial fan perspective
  const { leftBank, rightBank } = useMemo(() => {
    const seatCount = 7;
    const left: SeatModel[] = [];
    const right: SeatModel[] = [];

    for (let i = 0; i < seatCount; i++) {
      // Outer seats angle gently toward center screen (+/- 3.2 deg to 0 deg)
      const factor = (seatCount - 1 - i) / (seatCount - 1);
      left.push({
        id: `seat-l-${i}`,
        bank: 'left',
        index: i,
        rotationDeg: Number((factor * 3.2).toFixed(2)),
        elevationPx: Number((factor * 1.5).toFixed(2)),
        hasAisleLight: i === seatCount - 1,
      });

      const rightFactor = i / (seatCount - 1);
      right.push({
        id: `seat-r-${i}`,
        bank: 'right',
        index: i,
        rotationDeg: Number((-rightFactor * 3.2).toFixed(2)),
        elevationPx: Number((rightFactor * 1.5).toFixed(2)),
        hasAisleLight: i === 0,
      });
    }

    return { leftBank: left, rightBank: right };
  }, []);

  // Proportional sizing guarantees seats stay strictly within protected foreground
  const isIMAX = frameAspectRatio === '1.43:1';
  const seatHeightClass = isIMAX
    ? 'h-4 sm:h-5 md:h-6'
    : 'h-5 sm:h-6 md:h-7';
  const headrestHeightClass = isIMAX
    ? 'h-1 sm:h-1.5 md:h-2'
    : 'h-1.5 sm:h-2 md:h-2.5';
  const armrestHeightClass = isIMAX
    ? 'h-2.5 sm:h-3.5 md:h-4'
    : 'h-3 sm:h-4 md:h-5';

  return (
    <div
      className={`absolute bottom-0 inset-x-0 pointer-events-none z-20 flex flex-col justify-end items-center px-3 sm:px-8 md:px-12 select-none pb-1 sm:pb-2 transition-all duration-600 cubic-bezier(0.16, 1, 0.3, 1) ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-[120%] opacity-0'
      } ${className}`}
      aria-hidden={!visible}
    >
      {/* ── Floor Carpet Center Runway & Stepped Aisle Guide Lights ── */}
      <div className="w-full max-w-5xl flex items-center justify-center relative mb-1 pointer-events-none">
        <div className="w-12 sm:w-28 h-1 bg-gradient-to-r from-transparent via-amber-500/25 to-transparent rounded-full blur-[0.5px]" />
      </div>

      {/* ── Auditorium Seating Proscenium Row ── */}
      <div className="w-full max-w-6xl flex justify-between items-end gap-2 sm:gap-4 md:gap-6">
        {/* Left Bank of Premium Recliners */}
        <div className="flex-1 flex gap-1.5 sm:gap-2.5 md:gap-3 justify-end items-end">
          {leftBank.map((seat) => (
            <div
              key={seat.id}
              className={`flex-1 max-w-[62px] min-w-[28px] rounded-t-lg bg-gradient-to-b ${velvetColors.primary} ${velvetColors.border} border-t border-x relative flex flex-col items-center justify-start pt-0.5 shadow-[0_12px_24px_rgba(0,0,0,0.95)] transition-all duration-500 ${seatHeightClass}`}
              style={{
                transform: `perspective(600px) rotateY(${seat.rotationDeg}deg) translateY(${seat.elevationPx}px)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Backrest Cushion with Vertical Channel Tufting */}
              <div
                className={`w-[82%] rounded-t bg-gradient-to-b ${velvetColors.headrest} ${velvetColors.headrestBorder} border-t shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] relative overflow-hidden ${headrestHeightClass}`}
              >
                {/* Subtle Ergonomic Lumbar Channel Line */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-black/40" />
              </div>

              {/* Plush Folded Cushion Base Lip */}
              <div className="w-full h-1 bg-black/60 rounded-t-xs mt-auto border-t border-white/5" />

              {/* Left Sculpted Armrest with Integrated Cup Holder */}
              <div
                className={`absolute -left-1 bottom-0 w-1.5 sm:w-2 bg-[#0a0204] rounded-t-sm border-t border-r border-white/10 shadow-md ${armrestHeightClass}`}
              >
                <div className="w-1 h-1 rounded-full bg-black/80 mx-auto mt-0.5" />
              </div>

              {/* Right Sculpted Armrest */}
              <div
                className={`absolute -right-1 bottom-0 w-1.5 sm:w-2 bg-[#0a0204] rounded-t-sm border-t border-l border-white/10 shadow-md ${armrestHeightClass}`}
              >
                <div className="w-1 h-1 rounded-full bg-black/80 mx-auto mt-0.5" />
              </div>

              {/* Floor Mounting Pedestal Stanchion */}
              <div className="absolute -bottom-1 w-2.5 h-1 bg-black/90 rounded-b-xs" />
            </div>
          ))}
        </div>

        {/* Center Aisle Runway with Directional Floor Light Indicator */}
        <div
          className={`w-6 sm:w-12 md:w-16 relative flex flex-col items-center justify-center shrink-0 ${
            isIMAX ? 'h-4 sm:h-6' : 'h-6 sm:h-8'
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <div className="w-4 sm:w-6 h-[1px] bg-amber-500/20 mt-1" />
        </div>

        {/* Right Bank of Premium Recliners */}
        <div className="flex-1 flex gap-1.5 sm:gap-2.5 md:gap-3 justify-start items-end">
          {rightBank.map((seat) => (
            <div
              key={seat.id}
              className={`flex-1 max-w-[62px] min-w-[28px] rounded-t-lg bg-gradient-to-b ${velvetColors.primary} ${velvetColors.border} border-t border-x relative flex flex-col items-center justify-start pt-0.5 shadow-[0_12px_24px_rgba(0,0,0,0.95)] transition-all duration-500 ${seatHeightClass}`}
              style={{
                transform: `perspective(600px) rotateY(${seat.rotationDeg}deg) translateY(${seat.elevationPx}px)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Backrest Cushion with Vertical Channel Tufting */}
              <div
                className={`w-[82%] rounded-t bg-gradient-to-b ${velvetColors.headrest} ${velvetColors.headrestBorder} border-t shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] relative overflow-hidden ${headrestHeightClass}`}
              >
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-black/40" />
              </div>

              {/* Plush Folded Cushion Base Lip */}
              <div className="w-full h-1 bg-black/60 rounded-t-xs mt-auto border-t border-white/5" />

              {/* Left Sculpted Armrest */}
              <div
                className={`absolute -left-1 bottom-0 w-1.5 sm:w-2 bg-[#0a0204] rounded-t-sm border-t border-r border-white/10 shadow-md ${armrestHeightClass}`}
              >
                <div className="w-1 h-1 rounded-full bg-black/80 mx-auto mt-0.5" />
              </div>

              {/* Right Sculpted Armrest with Integrated Cup Holder */}
              <div
                className={`absolute -right-1 bottom-0 w-1.5 sm:w-2 bg-[#0a0204] rounded-t-sm border-t border-l border-white/10 shadow-md ${armrestHeightClass}`}
              >
                <div className="w-1 h-1 rounded-full bg-black/80 mx-auto mt-0.5" />
              </div>

              {/* Floor Mounting Pedestal Stanchion */}
              <div className="absolute -bottom-1 w-2.5 h-1 bg-black/90 rounded-b-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
