import React, { useEffect, useState, useRef } from 'react';
import { Ticket, Sparkles, Film, Volume2, ShieldCheck, Play, ChevronRight, X } from 'lucide-react';
import { useTicketStore } from '../../state/useTicketStore';
import { useCineMorphStore, AspectRatioMode } from '../../state/useCineMorphStore';

interface TicketPrinterAnimationProps {
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const TicketPrinterAnimation: React.FC<TicketPrinterAnimationProps> = ({
  onComplete,
  onSkip,
  className = '',
}) => {
  const {
    isPrintingAnimationActive,
    animationCountdownSeconds,
    activeTicket,
    cancelPrintAnimation,
  } = useTicketStore();

  const { aspectRatio, framingRule, isOffline } = useCineMorphStore();

  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const [pipelineStatus, setPipelineStatus] = useState<string>('Initializing Model Runtime...');

  // Map aspect ratio mode to CSS style aspect-ratio and geometry classes
  const getApertureDimensions = (ratio: AspectRatioMode) => {
    switch (ratio) {
      case '1.43:1':
        return {
          aspectRatio: '1.43 / 1',
          containerClass: 'max-w-[70vw] max-h-[88vh]',
          label: 'TRUE IMAX 1.43:1 (GT Laser Large Format)',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        };
      case '1.90:1':
        return {
          aspectRatio: '1.90 / 1',
          containerClass: 'max-w-[88vw] max-h-[76vh]',
          label: 'IMAX DIGITAL 1.90:1 (Wide Format Aperture)',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
      case '4:3':
        return {
          aspectRatio: '4 / 3',
          containerClass: 'max-w-[65vw] max-h-[85vh]',
          label: 'OFFLINE 4:3 (Deterministic Fallback Aperture)',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'original':
      default:
        return {
          aspectRatio: '16 / 9',
          containerClass: 'max-w-[85vw] max-h-[75vh]',
          label: 'SOURCE ORIGINAL (Faithful Aspect Ratio)',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
    }
  };

  const apertureInfo = getApertureDimensions(aspectRatio);

  // Advance pipeline telemetry synchronously with countdown
  useEffect(() => {
    if (!isPrintingAnimationActive) return;

    const remaining = animationCountdownSeconds;
    if (remaining >= 9) {
      setPipelineStep(1);
      setPipelineStatus('1/5 Media Metadata & Stream Pipeline Resolved');
    } else if (remaining >= 7) {
      setPipelineStep(2);
      setPipelineStatus('2/5 Model Capability Check & WebGPU Hardware Sync');
    } else if (remaining >= 5) {
      setPipelineStep(3);
      setPipelineStatus('3/5 Initial Frame Sampling & Saliency Analysis');
    } else if (remaining >= 3) {
      setPipelineStep(4);
      setPipelineStatus('4/5 Web Audio DSP Spatialization & Room Acoustic Warmup');
    } else {
      setPipelineStep(5);
      setPipelineStatus('5/5 Admission Ticket Issued • Opening Velvet Curtains');
    }
  }, [isPrintingAnimationActive, animationCountdownSeconds]);

  if (!isPrintingAnimationActive) return null;

  const handleSkip = () => {
    cancelPrintAnimation();
    onSkip?.();
    onComplete?.();
  };

  return (
    <div
      data-testid="ticket-intro-overlay"
      data-aperture={aspectRatio}
      className={`fixed inset-0 z-50 bg-[#020204]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 select-none ${className}`}
    >
      {/* Dynamic Ambient Auditorium Glow */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-purple-900/15 to-transparent blur-3xl pointer-events-none" />

      {/* Top Banner with Aperture Indicator */}
      <div className="absolute top-6 inset-x-0 flex items-center justify-between px-8 z-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
            CineMorph AI Pre-Show Ritual
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${apertureInfo.badgeColor}`}>
            {apertureInfo.label}
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-gray-200 hover:text-white transition-all shadow-lg cursor-pointer"
        >
          <span>Skip Intro</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Aperture-Matched Viewport Frame ── */}
      <div
        data-testid="aperture-viewport"
        className={`relative w-full ${apertureInfo.containerClass} rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-[#15100a] via-[#0d0905] to-[#050402] shadow-[0_0_80px_rgba(245,158,11,0.25)] flex flex-col items-center justify-between p-6 sm:p-8 overflow-hidden transition-all duration-500`}
        style={{ aspectRatio: apertureInfo.aspectRatio }}
      >
        {/* Diegetic Aperture Corner Guides */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400/80" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400/80" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400/80" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400/80" />

        {/* Center: Diegetic Torn Ticket Animation Stub */}
        <div className="my-auto flex flex-col items-center text-center space-y-4 max-w-md">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-500/20 animate-bounce">
              <Ticket className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black font-mono font-bold text-xs flex items-center justify-center shadow-lg">
              {animationCountdownSeconds}s
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold text-amber-400 tracking-widest uppercase">
              Printing Admission Ticket
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-1">
              {activeTicket?.movieTitle || 'Grand Cinema Presentation'}
            </h2>
            <p className="text-xs font-mono text-gray-400">
              {activeTicket?.seatAssignment || 'ORCHESTRA ROW A • SEAT 01'} • {aspectRatio.toUpperCase()}
            </p>
          </div>

          {/* Telemetry Progress Indicator */}
          <div className="w-full space-y-2 pt-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span className="text-amber-300 font-semibold">{pipelineStatus}</span>
              <span>{Math.round(((10 - animationCountdownSeconds) / 10) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(10, ((10 - animationCountdownSeconds) / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges matching aperture geometry */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-amber-900/30 text-[10px] font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Framing: {framingRule.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spatial DSP Active</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Client-Side</span>
          </div>
        </div>
      </div>
    </div>
  );
};
