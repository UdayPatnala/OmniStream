import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Sun, Moon, Laptop, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { OMSLogo } from '../common/OMSLogo';
import { GlobalSettingsDrawer } from '../settings/GlobalSettingsDrawer';
import { useAppStore } from '../../store';
import { useCineMorphStore } from '../../state/useCineMorphStore';

export const ThresholdPortal: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, setVersionMode } = useAppStore();
  const { isOffline } = useCineMorphStore();

  const [hoveredZone, setHoveredZone] = useState<'utube' | 'cinemorph' | null>(null);
  const [isEntering, setIsEntering] = useState<'utube' | 'cinemorph' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [introFinished, setIntroFinished] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('omnistream_threshold_seen') === 'true';
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!introFinished) {
      const timer = setTimeout(() => {
        setIntroFinished(true);
        sessionStorage.setItem('omnistream_threshold_seen', 'true');
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [introFinished]);

  // Global cursor tracking for subtle spatial tension and lighting
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const handleEnterUTube = () => {
    if (isEntering) return;
    setIsEntering('utube');
    setVersionMode('v1');
    setTimeout(() => {
      navigate('/home');
    }, 500);
  };

  const handleEnterCineMorph = () => {
    if (isEntering) return;
    setIsEntering('cinemorph');
    setVersionMode('v2');
    setTimeout(() => {
      navigate('/cinemorph');
    }, 500);
  };

  // Keyboard navigation between worlds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (settingsOpen || isEntering) return;
      if (e.key === 'ArrowLeft' || e.key === 'u' || e.key === 'U') {
        setHoveredZone('utube');
      } else if (e.key === 'ArrowRight' || e.key === 'c' || e.key === 'C') {
        setHoveredZone('cinemorph');
      } else if (e.key === 'Enter') {
        if (hoveredZone === 'utube') handleEnterUTube();
        else if (hoveredZone === 'cinemorph') handleEnterCineMorph();
      } else if (e.key === 's' || e.key === 'S') {
        setSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hoveredZone, settingsOpen, isEntering]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const isLight = theme === 'light';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen overflow-hidden select-none font-sans antialiased transition-colors duration-1000 ${
        isLight ? 'bg-[#F7F5F0] text-[#1A1A1A]' : 'bg-[#090A0D] text-[#ECEEF2]'
      }`}
    >
      {/* ── AROH Sculptural Tactile Texture & Geometric Ambient Grid ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.032] transition-opacity duration-700"
        style={{
          backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, currentColor 1px, transparent 0)',
          backgroundSize: '36px 36px'
        }}
      />

      {/* ── Directional Architectural Light Source (AROH Light Field) ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-out"
        style={{
          background: isLight
            ? hoveredZone === 'utube'
              ? `radial-gradient(ellipse 900px 700px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(199, 73, 79, 0.09), transparent 70%), linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(240,237,230,0.4) 100%)`
              : hoveredZone === 'cinemorph'
              ? `radial-gradient(ellipse 900px 700px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(82, 108, 158, 0.12), transparent 70%), linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(235,238,245,0.4) 100%)`
              : `radial-gradient(ellipse 800px 600px at 50% 45%, rgba(255,255,255,0.8), transparent 70%)`
            : hoveredZone === 'utube'
            ? `radial-gradient(ellipse 950px 750px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(225, 29, 72, 0.12), transparent 75%)`
            : hoveredZone === 'cinemorph'
            ? `radial-gradient(ellipse 950px 750px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(56, 189, 248, 0.09), transparent 75%)`
            : `radial-gradient(ellipse 800px 600px at 50% 50%, rgba(255, 255, 255, 0.02), transparent 70%)`,
        }}
      />

      {/* ── Top Atmospheric Horizon ── */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 sm:px-12 pt-6 sm:pt-8 pointer-events-auto">
        {/* Left: OMS Identity & AROH Heritage */}
        <div className="flex items-center gap-3">
          <OMSLogo variant={theme === 'dark' ? 'dark' : 'light'} size="sm" animated={true} />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase opacity-50">
              OMS • CORE
            </span>
          </div>
        </div>

        {/* Center: Offline Airgap State */}
        {isOffline && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm">
            <WifiOff className="w-3 h-3" />
            <span>Airgapped Local Mode</span>
          </div>
        )}

        {/* Right: Environmental Controls (Theme Switcher & Minimal Settings) */}
        <div className="flex items-center gap-3">
          <button
            onClick={cycleTheme}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
              isLight 
                ? 'hover:bg-black/5 text-stone-600 hover:text-stone-900' 
                : 'hover:bg-white/10 text-stone-400 hover:text-stone-100'
            }`}
            title={`Active Theme: ${theme.toUpperCase()} (Click to toggle)`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-600" /> : theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Laptop className="w-4 h-4 text-purple-400" />}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer group ${
              isLight 
                ? 'hover:bg-black/5 text-stone-600 hover:text-stone-900' 
                : 'hover:bg-white/10 text-stone-400 hover:text-stone-100'
            }`}
            title="Workstation Preferences (S)"
            aria-label="Settings"
          >
            <Sliders className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90 text-current opacity-75 group-hover:opacity-100" />
          </button>
        </div>
      </header>

      {/* ── The Center OmniStream Wordmark — Assembling Optical Precision ── */}
      <div className="absolute top-16 sm:top-20 inset-x-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={introFinished ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-1.5"
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xs sm:text-sm font-black tracking-[0.45em] sm:tracking-[0.55em] uppercase font-cinematic-title opacity-90 transition-all duration-700">
              OMNISTREAM
            </h1>
          </div>
          <motion.div
            initial={introFinished ? { width: '40px', opacity: 0.25 } : { width: '0px', opacity: 0 }}
            animate={{ width: '40px', opacity: 0.25 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className={`h-px mx-auto ${isLight ? 'bg-black' : 'bg-white'}`}
          />
        </motion.div>
      </div>

      {/* ── Main Dual Environmental Threshold Stage ── */}
      <main className="relative w-full h-full flex flex-col md:flex-row items-stretch justify-center z-10">

        {/* ═════════ WORLD 1: U-TUBE (Discovery, Kinetic Flow, Velocity) ═════════ */}
        <section
          onMouseEnter={() => setHoveredZone('utube')}
          onMouseLeave={() => setHoveredZone(null)}
          onClick={handleEnterUTube}
          className={`relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 ease-out overflow-hidden group ${
            hoveredZone === 'utube' 
              ? 'md:flex-[1.2] opacity-100' 
              : hoveredZone === 'cinemorph' 
              ? 'md:flex-[0.8] opacity-35 filter blur-[0.6px]' 
              : 'opacity-85'
          }`}
          style={{
            transform: isEntering === 'utube' ? 'scale(1.06)' : 'scale(1.0)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
          }}
        >
          {/* U-Tube Architectural Linework & Fluid Kinetic Trails */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Drifting subtle geometric perspective frame */}
            <motion.div
              animate={{
                x: hoveredZone === 'utube' ? [0, 25, 0] : [0, 10, 0],
                opacity: hoveredZone === 'utube' ? (isLight ? 0.08 : 0.14) : (isLight ? 0.025 : 0.05),
              }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-[130%] h-36 flex gap-6 rotate-[-5deg]"
            >
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={`utube-geom-${i}`} 
                  className={`flex-1 rounded-2xl border transition-colors duration-500 ${
                    isLight ? 'border-[#C7494F]/40 bg-[#C7494F]/5' : 'border-rose-500/40 bg-rose-500/10'
                  }`}
                />
              ))}
            </motion.div>

            {/* Kinetic Horizon Wire */}
            <div 
              className={`absolute w-36 h-px transition-all duration-700 ease-out ${
                hoveredZone === 'utube' ? 'w-72 opacity-50' : 'w-20 opacity-15'
              } ${isLight ? 'bg-[#C7494F]' : 'bg-rose-500'}`}
            />
          </div>

          {/* Interactive World Name & Horizon Coordinates */}
          <div className="relative z-20 flex flex-col items-center text-center space-y-4 px-8">
            <motion.div
              initial={introFinished ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.2 }}
              className="space-y-2"
            >
              <span className="text-[10px] font-mono font-bold tracking-[0.35em] uppercase opacity-40 transition-opacity duration-300 group-hover:opacity-85">
                DISCOVERY FLOW
              </span>
              <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight font-cinematic-title uppercase transition-all duration-500 group-hover:tracking-wider group-hover:text-[#C7494F]">
                U-TUBE
              </h2>
            </motion.div>

            {/* Minimal Sub-Threshold Affordance */}
            <div className={`text-[11px] font-mono tracking-widest uppercase transition-all duration-500 ${
              hoveredZone === 'utube' ? 'opacity-70 translate-y-0 text-[#C7494F]' : 'opacity-0 translate-y-2'
            }`}>
              Enter Discovery Layer →
            </div>
          </div>
        </section>

        {/* ═════════ THE LIVING TENSION AXIS (Architectural Center Line) ═════════ */}
        <div className="relative flex items-center justify-center pointer-events-none md:w-px md:h-full w-full h-px">
          <div 
            className={`transition-all duration-700 ease-out ${
              hoveredZone ? 'opacity-35' : 'opacity-10'
            } ${isLight ? 'bg-black' : 'bg-white'}`}
            style={{
              height: '55%',
              width: '1px',
              transform: hoveredZone === 'utube' 
                ? 'translateX(16px)' 
                : hoveredZone === 'cinemorph' 
                ? 'translateX(-16px)' 
                : 'translateX(0)',
            }}
          />
        </div>

        {/* ═════════ WORLD 2: CINEMORPH (Depth, Aperture, Theater Silence) ═════════ */}
        <section
          onMouseEnter={() => setHoveredZone('cinemorph')}
          onMouseLeave={() => setHoveredZone(null)}
          onClick={handleEnterCineMorph}
          className={`relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 ease-out overflow-hidden group ${
            hoveredZone === 'cinemorph' 
              ? 'md:flex-[1.2] opacity-100' 
              : hoveredZone === 'utube' 
              ? 'md:flex-[0.8] opacity-35 filter blur-[0.6px]' 
              : 'opacity-85'
          }`}
          style={{
            transform: isEntering === 'cinemorph' ? 'scale(1.06)' : 'scale(1.0)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
          }}
        >
          {/* CineMorph Geometric Aperture & Volumetric Cone */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Breathing Concentric Aperture Geometry */}
            <motion.div
              animate={{
                scale: hoveredZone === 'cinemorph' ? [1, 1.12, 1] : [0.95, 1.05, 0.95],
                opacity: hoveredZone === 'cinemorph' ? (isLight ? 0.12 : 0.22) : (isLight ? 0.035 : 0.07),
                rotate: [0, 90, 180],
              }}
              transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
              className={`w-80 sm:w-[420px] h-80 sm:h-[420px] rounded-full border-2 border-dashed ${
                isLight ? 'border-slate-800' : 'border-cyan-400'
              }`}
            />

            {/* Deep Volumetric Projection Spotlight Glow */}
            <div 
              className={`absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-3xl transition-all duration-700 ease-out ${
                hoveredZone === 'cinemorph' ? 'scale-125 opacity-25' : 'scale-75 opacity-10'
              } ${isLight ? 'bg-slate-400' : 'bg-cyan-500'}`}
            />
          </div>

          {/* Interactive World Name & Horizon Coordinates */}
          <div className="relative z-20 flex flex-col items-center text-center space-y-4 px-8">
            <motion.div
              initial={introFinished ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.35 }}
              className="space-y-2"
            >
              <span className="text-[10px] font-mono font-bold tracking-[0.35em] uppercase opacity-40 transition-opacity duration-300 group-hover:opacity-85">
                THEATER APERTURE
              </span>
              <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight font-cinematic-title uppercase transition-all duration-500 group-hover:tracking-wider group-hover:text-[#526C9E] dark:group-hover:text-cyan-300">
                CINEMORPH
              </h2>
            </motion.div>

            {/* Minimal Sub-Threshold Affordance */}
            <div className={`text-[11px] font-mono tracking-widest uppercase transition-all duration-500 ${
              hoveredZone === 'cinemorph' ? 'opacity-70 translate-y-0 text-[#526C9E] dark:text-cyan-300' : 'opacity-0 translate-y-2'
            }`}>
              Enter Theater Layer →
            </div>
          </div>
        </section>
      </main>

      {/* ── Bottom Horizon Heritage Signature (AROH Product Mark) ── */}
      <footer className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-6 sm:px-12 pb-6 sm:pb-8 pointer-events-none">
        <div className="text-[10px] font-mono font-medium tracking-widest uppercase opacity-35">
          DUAL-ENGINE SYSTEM
        </div>

        {/* AROH Product Heritage Wordmark */}
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-[0.3em] uppercase opacity-45">
          <span>AN</span>
          <span className="text-current font-black tracking-[0.4em]">AROH</span>
          <span>PRODUCT</span>
        </div>

        <div className="text-[10px] font-mono font-medium tracking-widest uppercase opacity-35">
          V2.0 RELEASE
        </div>
      </footer>

      {/* ── Environmental Transition Curtains ── */}
      <AnimatePresence>
        {isEntering === 'utube' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center ${
              isLight ? 'bg-[#F7F5F0]' : 'bg-[#090A0D]'
            }`}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-2"
            >
              <div className="text-xs font-mono font-bold tracking-widest uppercase text-[#C7494F]">
                Transitioning to Discovery
              </div>
              <div className="text-5xl sm:text-7xl font-black font-cinematic-title uppercase tracking-tight">
                U-TUBE
              </div>
            </motion.div>
          </motion.div>
        )}

        {isEntering === 'cinemorph' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#050403]"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-2 text-amber-100"
            >
              <div className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400">
                Opening Fixed Aperture
              </div>
              <div className="text-5xl sm:text-7xl font-black font-cinematic-title uppercase tracking-tight">
                CINEMORPH
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Integrated Global Settings Drawer ── */}
      <GlobalSettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
