import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ChevronRight, Film, Sparkles, Check, Clapperboard } from 'lucide-react';
import { useTicketStore } from '../../state/useTicketStore';
import { useCineMorphStore, AspectRatioMode } from '../../state/useCineMorphStore';

interface TicketPrinterAnimationProps {
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

type PrintStage = 
  | 'idle'           // Stage 1: Printer idle, slot closed, light dim
  | 'starting'       // Stage 2: LED activates, stepper calibration, paper feeding starts
  | 'header_ink'     // Stage 3: Top header & perforation notch emerge
  | 'poster_reveal'  // Stage 4: Square cinematic poster & feature title emerge
  | 'seat_stamp'     // Stage 5: Seat assignment & aperture details stamped
  | 'micro_marks'    // Stage 6: Studio micro-marks & thermal barcode complete
  | 'bounce_settle'  // Stage 7: Physical overshoot bounce & blade cut
  | 'ready';         // Stage 8: Ready to take ticket and enter theater

export const TicketPrinterAnimation: React.FC<TicketPrinterAnimationProps> = ({
  onComplete,
  onSkip,
  className = '',
}) => {
  const {
    isPrintingAnimationActive,
    activeTicket,
    cancelPrintAnimation,
  } = useTicketStore();

  const { aspectRatio } = useCineMorphStore();

  // Animation Stage State
  const [stage, setStage] = useState<PrintStage>('idle');
  const [printProgress, setPrintProgress] = useState<number>(0); // 0% to 100%
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Generate randomized seat assignment beforehand so it stays consistent
  const randomSeat = useMemo(() => {
    if (activeTicket?.seatAssignment && !activeTicket.seatAssignment.includes('ROW')) {
      return activeTicket.seatAssignment;
    }
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const row = rows[Math.floor(Math.random() * rows.length)];
    const seatNum = Math.floor(Math.random() * 30) + 1;
    const seatFormatted = seatNum < 10 ? `0${seatNum}` : `${seatNum}`;
    return `${row}${seatFormatted}`;
  }, [activeTicket?.ticketId]);

  // Randomized Ticket Barcode ID
  const ticketIdFormatted = useMemo(() => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `TKT${randomNum}`;
  }, [activeTicket?.ticketId]);

  // Current Date & Time
  const ticketDate = useMemo(() => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const ticketTime = useMemo(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesFormatted = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minutesFormatted} ${ampm}`;
  }, []);

  // Format runtime
  const movieRuntime = useMemo(() => {
    const duration = activeTicket?.durationSeconds || 0;
    if (duration > 0) {
      const h = Math.floor(duration / 3600);
      const m = Math.floor((duration % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return '2h 49m';
  }, [activeTicket?.durationSeconds]);

  // Thumbnail / Poster Preview Source (with local video frame fallback)
  const [localExtractedPoster, setLocalExtractedPoster] = useState<string | null>(null);

  const posterSource = useMemo(() => {
    if (activeTicket?.thumbnailDataUrl) return activeTicket.thumbnailDataUrl;
    if (localExtractedPoster) return localExtractedPoster;
    if (activeTicket?.sourceUrl && !activeTicket.isLocal) {
      return `https://i.ytimg.com/vi/${activeTicket.sourceUrl}/hqdefault.jpg`;
    }
    return null;
  }, [activeTicket?.thumbnailDataUrl, localExtractedPoster, activeTicket?.sourceUrl, activeTicket?.isLocal]);

  // Dynamic frame extractor fallback if activeTicket didn't have thumbnailDataUrl
  useEffect(() => {
    if (activeTicket?.isLocal && !activeTicket.thumbnailDataUrl && activeTicket.sourceUrl) {
      try {
        const videoEl = document.createElement('video');
        videoEl.preload = 'auto';
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.src = activeTicket.sourceUrl;

        videoEl.onloadedmetadata = () => {
          const seekTarget = videoEl.duration > 4 ? Math.min(5, Math.max(1, videoEl.duration * 0.1)) : 0.5;
          try {
            videoEl.currentTime = seekTarget;
          } catch (_) {}
        };

        videoEl.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 320;
            const ctx = canvas.getContext('2d');
            if (ctx && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
              const minDim = Math.min(videoEl.videoWidth, videoEl.videoHeight);
              const sx = (videoEl.videoWidth - minDim) / 2;
              const sy = (videoEl.videoHeight - minDim) / 2;
              ctx.drawImage(videoEl, sx, sy, minDim, minDim, 0, 0, 320, 320);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              setLocalExtractedPoster(dataUrl);
              setImageLoaded(true);
            }
          } catch (_) {}
        };
      } catch (_) {}
    }
  }, [activeTicket?.isLocal, activeTicket?.thumbnailDataUrl, activeTicket?.sourceUrl]);

  // Pre-load poster image to prevent pop-in during printing
  useEffect(() => {
    if (posterSource) {
      if (posterSource.startsWith('data:') || posterSource.startsWith('blob:')) {
        setImageLoaded(true);
      }
      const img = new Image();
      img.src = posterSource;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => {
        if (!posterSource.startsWith('data:')) {
          setImageLoaded(false);
        }
      };
    } else {
      setImageLoaded(false);
    }
  }, [posterSource]);

  // Aperture Label
  const getApertureLabel = (ratio: AspectRatioMode) => {
    switch (ratio) {
      case '1.43:1': return 'IMAX 1.43:1 (GT Laser)';
      case '1.90:1': return 'IMAX 1.90:1';
      case '4:3': return 'Classic 4:3';
      case 'original': default: return 'Original Format';
    }
  };

  // Sound Synthesizer for Stepper Motor & Paper Feeding
  const playPrinterClick = (pitch = 850) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch (e) {}
  };

  // Main Progressive Animation Sequence (~5.2s total physical ritual)
  useEffect(() => {
    if (!isPrintingAnimationActive) {
      setStage('idle');
      setPrintProgress(0);
      setIsVibrating(false);
      return;
    }

    let isCancelled = false;

    // Check for user reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setStage('ready');
      setPrintProgress(100);
      setIsVibrating(false);
      return;
    }

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runAnimationSequence = async () => {
      // Stage 1: Stepper Calibration & Heatup (600ms)
      setStage('starting');
      setPrintProgress(8);
      setIsVibrating(true);
      playPrinterClick(680);
      await wait(600);
      if (isCancelled) return;

      // Stage 2: Top Header & Movie Title Emergence (900ms)
      setStage('header_ink');
      setPrintProgress(22);
      playPrinterClick(780);
      await wait(450);
      if (isCancelled) return;
      playPrinterClick(820);
      setPrintProgress(38);
      await wait(450);
      if (isCancelled) return;

      // Stage 3: Square Cinematic Poster Artwork Reveal (1100ms)
      setStage('poster_reveal');
      playPrinterClick(860);
      setPrintProgress(55);
      await wait(550);
      if (isCancelled) return;
      playPrinterClick(900);
      setPrintProgress(72);
      await wait(550);
      if (isCancelled) return;

      // Stage 4: Seat Assignment & Screen Aperture Stamp (850ms)
      setStage('seat_stamp');
      setPrintProgress(85);
      playPrinterClick(950);
      await wait(450);
      if (isCancelled) return;
      playPrinterClick(1020);
      setPrintProgress(94);
      await wait(400);
      if (isCancelled) return;

      // Stage 5: Studio Micro-Marks & Barcode Inking (750ms)
      setStage('micro_marks');
      setPrintProgress(100);
      setIsVibrating(false);
      playPrinterClick(1150);
      await wait(750);
      if (isCancelled) return;

      // Stage 6: Physical Bounce Settle & Overshoot
      setStage('bounce_settle');
      await wait(400);
      if (isCancelled) return;
      setStage('ready');
    };

    runAnimationSequence();

    return () => {
      isCancelled = true;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close().catch(() => {}); } catch (e) {}
      }
    };
  }, [isPrintingAnimationActive, activeTicket?.ticketId]);

  const handleSkipOrTakeTicket = () => {
    cancelPrintAnimation();
    onSkip?.();
    onComplete?.();
  };

  // Keyboard Escape shortcut to skip intro instantly
  useEffect(() => {
    if (!isPrintingAnimationActive) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkipOrTakeTicket();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isPrintingAnimationActive, onSkip, onComplete, cancelPrintAnimation]);

  if (!isPrintingAnimationActive) return null;

  const paperTranslateY = `${-100 + printProgress}%`;

  return (
    <div
      data-testid="ticket-intro-overlay"
      data-aperture={aspectRatio}
      className={`fixed inset-0 z-50 bg-[#060403]/96 backdrop-blur-3xl flex flex-col items-center justify-between p-4 sm:p-8 select-none ${className}`}
    >
      {/* Dark Ambient Warm Cinema Glow */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-600/10 via-amber-950/20 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <div className="w-full flex items-center justify-between px-2 sm:px-8 z-20 max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
            CineMorph Ticket Dispenser
          </span>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 hidden sm:inline">
            {getApertureLabel(aspectRatio)}
          </span>
        </div>

        <button
          onClick={handleSkipOrTakeTicket}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-xs font-bold text-amber-200 hover:text-white transition-all shadow-lg cursor-pointer active:scale-95"
          title="Skip intro and start movie (Esc)"
        >
          <span>Skip to Cinema (Esc)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Main Physical Thermal Printer & Ticket Container ── */}
      <div className="relative flex flex-col items-center justify-center my-auto w-full max-w-sm sm:max-w-md">
        
        {/* ── 1. Compact Thermal Printer Chassis ── */}
        <div 
          className={`relative z-30 w-72 sm:w-80 bg-gradient-to-b from-[#2b2d35] via-[#1c1e24] to-[#121317] border border-white/15 rounded-2xl p-5 pb-4 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform duration-75 ${
            isVibrating ? 'translate-x-[0.5px] -translate-y-[0.5px]' : 'translate-x-0 translate-y-0'
          }`}
        >
          {/* Top Cover Bevel & Heat Dissipation Line */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-zinc-600 border border-zinc-500/40" />
              <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                OMNISTREAM THERMAL PRINTER
              </span>
            </div>

            {/* Indicator LED Light */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-zinc-500 uppercase">STATUS</span>
              <div 
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  stage === 'idle'
                    ? 'bg-zinc-700 border border-zinc-600'
                    : stage === 'ready'
                    ? 'bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-emerald-400 border border-emerald-200 shadow-[0_0_14px_rgba(52,211,153,1)] animate-pulse'
                }`}
              />
            </div>
          </div>

          {/* Paper Slot Mouth */}
          <div className="relative w-full h-3 bg-black rounded-md border-b border-white/10 shadow-[inset_0_3px_6px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-black/80" />
          </div>
        </div>

        {/* ── 2. Overflow Mask for Physical Paper Feed ── */}
        <div 
          className="relative z-20 w-64 sm:w-72 overflow-hidden -mt-1 flex flex-col items-center pointer-events-auto cursor-pointer"
          onClick={handleSkipOrTakeTicket}
          title="Click to take ticket and enter theater"
        >
          {/* ── 3. Physical Paper Ticket ── */}
          <div
            className={`w-full bg-[#fdfbf7] text-[#1a1510] rounded-b-xl border-x-2 border-b-2 border-[#e6decb] shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative font-mono transition-transform ease-out ${
              stage === 'bounce_settle' 
                ? 'animate-[ticketBounce_0.4s_cubic-bezier(0.34,1.56,0.64,1)]' 
                : 'duration-300'
            }`}
            style={{
              transform: `translateY(${paperTranslateY})`,
            }}
          >
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#f8f3e6] via-[#fdfbf7] to-[#f4ecd8] opacity-90 pointer-events-none rounded-b-xl" />
            
            {/* Classic Ticket Perforation Notches */}
            <div className="absolute top-[48%] -left-3.5 w-7 h-7 rounded-full bg-[#060403] border border-[#d8cfb9] z-20 shadow-inner" />
            <div className="absolute top-[48%] -right-3.5 w-7 h-7 rounded-full bg-[#060403] border border-[#d8cfb9] z-20 shadow-inner" />

            {/* Ticket Header */}
            <div className="relative z-10 pt-4 pb-2 px-4 text-center border-b border-dashed border-zinc-300">
              <div className="flex justify-center items-center gap-1.5 mb-0.5 text-zinc-800">
                <Clapperboard className="w-4 h-4 text-amber-800" />
              </div>
              <div className="text-[10px] font-black tracking-[0.25em] text-zinc-800 uppercase font-sans">
                ★ CINEMORPH ADMISSION PASS ★
              </div>
            </div>

            {/* Content Poster / Movie Artwork Section (Dedicated Cinema Poster Framing) */}
            <div className="relative z-10 pt-3 pb-1.5 px-4 flex flex-col items-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-stone-900 border-2 border-[#d8cdb4] overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center relative aspect-square group/poster">
                {posterSource ? (
                  <img
                    src={posterSource}
                    alt={activeTicket?.movieTitle || 'Movie poster'}
                    className={`w-full h-full object-cover object-[center_35%] contrast-[1.08] saturate-[1.05] transition-all duration-300 ${
                      imageLoaded ? 'opacity-95 scale-100' : 'opacity-85 scale-[1.02]'
                    }`}
                    loading="eager"
                    onLoad={() => setImageLoaded(true)}
                  />
                ) : (
                  <img
                    src="/cinemorph_artwork.png"
                    alt="CineMorph Cinema"
                    className="w-full h-full object-cover object-center contrast-105 opacity-90"
                    loading="eager"
                  />
                )}
                {/* Vintage Sepia Thermal Print & Film Tone Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-black/10 mix-blend-multiply pointer-events-none" />
                <div className="absolute inset-0 border border-black/10 rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Movie Title & Runtime Section */}
            <div className="relative z-10 py-2 px-4 text-center space-y-0.5">
              <h2 className="text-sm sm:text-base font-black text-black tracking-tight uppercase leading-tight line-clamp-2 font-sans">
                {activeTicket?.movieTitle || 'CINEMORPH FEATURE'}
              </h2>
              <div className="text-[10px] font-semibold text-zinc-600">
                Runtime: <span className="text-black font-bold">{movieRuntime}</span>
              </div>
            </div>

            {/* Seat Number Section */}
            <div className="relative z-10 py-2 px-3 my-0.5 mx-4 bg-[#f3ecda] rounded-lg border border-[#e2d7be] text-center">
              <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                Assigned Seat
              </div>
              <div className="text-xl sm:text-2xl font-black text-black tracking-wider my-0.5">
                {randomSeat}
              </div>
            </div>

            {/* Screen Aperture & Time Details */}
            <div className="relative z-10 pt-1 pb-2 px-4 text-[9px] text-zinc-600 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>Date: <strong className="text-black">{ticketDate}</strong></span>
                <span>Time: <strong className="text-black">{ticketTime}</strong></span>
              </div>
              <div className="text-center font-bold text-zinc-800 pt-0.5">
                Aperture: {getApertureLabel(aspectRatio)}
              </div>
            </div>

            {/* ── Micro Brand Signatures (Bottom-Right) & Barcode Footer ── */}
            <div className="relative z-10 pt-2 pb-3 px-4 bg-[#f5efe0] border-t border-dashed border-zinc-300 rounded-b-xl flex flex-col items-center">
              
              {/* Studio Micro-Marks Container */}
              <div className="w-full flex items-center justify-between text-[8px] font-mono text-zinc-500 pb-1.5 border-b border-zinc-200/80 mb-1.5 uppercase tracking-wider">
                <span className="font-bold text-zinc-600">ADMISSION TICKET</span>
                
                {/* Bottom-Right Micro Brand Marks: CineMorph • OMS • AROH */}
                <div className="flex items-center gap-1.5 text-zinc-700 font-bold tracking-tight text-[7.5px]">
                  <span>CINEMORPH</span>
                  <span className="text-zinc-400">•</span>
                  <span>OMS</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-amber-900 font-black">AROH</span>
                </div>
              </div>

              {/* Thermal Barcode */}
              <div className="flex items-end gap-[1.5px] h-5 mb-1 opacity-90">
                {[3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1].map((w, i) => (
                  <div 
                    key={i} 
                    className="bg-black" 
                    style={{ width: `${w}px`, height: '100%' }} 
                  />
                ))}
              </div>
              
              <div className="text-[8px] font-mono font-bold tracking-widest text-zinc-700">
                {ticketIdFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Action CTA beneath printer ── */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center z-20">
          {stage === 'ready' ? (
            <button
              onClick={handleSkipOrTakeTicket}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Take Ticket & Enter Theater</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300/80">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>
                  {stage === 'idle' && 'Initializing Thermal Printer...'}
                  {stage === 'starting' && 'Feeding Ticket Paper...'}
                  {stage === 'header_ink' && 'Inking Header & Perforation...'}
                  {stage === 'poster_reveal' && 'Printing Poster & Feature Title...'}
                  {stage === 'seat_stamp' && 'Stamping Seat Assignment & Aperture...'}
                  {stage === 'micro_marks' && 'Affixing Studio Signatures & Barcode...'}
                  {stage === 'bounce_settle' && 'Ticket Ready...'}
                </span>
              </div>
              <div className="w-56 h-1 rounded-full bg-white/10 overflow-hidden mx-auto">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                  style={{ width: `${printProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer System Label */}
      <div className="w-full flex justify-center z-20">
        <span className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase">
          CineMorph Physical Printing Engine • AROH Core
        </span>
      </div>
    </div>
  );
};
