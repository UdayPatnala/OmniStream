import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Sparkles, Sliders, Sun, Monitor, Maximize2, Gauge, Activity, Volume2, Crop, Tv } from 'lucide-react';
import { GlowIntensity, FrameAspectRatio, FrameReframeMode } from '../types';

interface CineMorphTopBarProps {
  onToggleTelemetry?: () => void;
}

export const CineMorphTopBar: React.FC<CineMorphTopBarProps> = ({ onToggleTelemetry }) => {
  const {
    versionMode,
    setVersionMode,
    cinemaMode,
    setCinemaMode,
    ambientGlow,
    toggleAmbientGlow,
    glowIntensity,
    setGlowIntensity,
    frameAspectRatio,
    setFrameAspectRatio,
    reframeMode,
    setReframeMode,
    audioEQ,
    audioStudioOpen,
    setAudioStudioOpen,
    telemetryOpen,
    setTelemetryOpen,
  } = useAppStore();

  const [showGlowMenu, setShowGlowMenu] = useState(false);
  const [showFrameMenu, setShowFrameMenu] = useState(false);

  return (
    <div className="w-full bg-[#16141D]/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-3 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Engine Status & Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 px-3 py-1.5 rounded-xl border border-purple-500/30">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </div>
          <span className="font-bold tracking-wider text-purple-200 uppercase text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            CineMorph AI v2
          </span>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center bg-[#0F0D15] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setVersionMode('v2')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              versionMode === 'v2'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            v2 Cinema
          </button>
          <button
            onClick={() => setVersionMode('v1')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              versionMode === 'v1'
                ? 'bg-gray-700 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            v1 Standard
          </button>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Ambient Glow Control */}
        <div className="relative">
          <button
            onClick={() => setShowGlowMenu(!showGlowMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              ambientGlow && glowIntensity !== 'off'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-[#1C1A26] border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Ambient Screen Glow Controls"
          >
            <Sun className={`w-3.5 h-3.5 ${ambientGlow ? 'text-amber-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline font-medium">Glow: {(glowIntensity || 'ultra').toUpperCase()}</span>
          </button>

          {showGlowMenu && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-[#1A1825] border border-purple-500/30 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
              <div className="px-2 py-1 font-semibold text-gray-400 text-[10px] uppercase">Glow Intensity</div>
              {(['off', 'low', 'medium', 'ultra'] as GlowIntensity[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setGlowIntensity(level);
                    if (level === 'off' && ambientGlow) toggleAmbientGlow();
                    if (level !== 'off' && !ambientGlow) toggleAmbientGlow();
                    setShowGlowMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all capitalize flex items-center justify-between ${
                    glowIntensity === level
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span>{level}</span>
                  {glowIntensity === level && <Sparkles className="w-3 h-3 text-amber-300" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Frame & Aspect Ratio Control */}
        <div className="relative">
          <button
            onClick={() => setShowFrameMenu(!showFrameMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              frameAspectRatio !== '16:9' || reframeMode !== 'center'
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-[#1C1A26] border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Viewport Aspect & Smart Reframe"
          >
            <Crop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">{frameAspectRatio}</span>
          </button>

          {showFrameMenu && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-[#1A1825] border border-cyan-500/30 rounded-xl shadow-2xl p-2.5 z-50 flex flex-col gap-2 text-xs">
              <div>
                <div className="px-2 py-1 font-semibold text-cyan-400 text-[10px] uppercase">Aspect Ratio</div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {(['16:9', '21:9', '4:3', '1:1'] as FrameAspectRatio[]).map((aspect) => (
                    <button
                      key={aspect}
                      onClick={() => setFrameAspectRatio(aspect)}
                      className={`px-2 py-1 rounded-lg text-center transition-all ${
                        frameAspectRatio === aspect
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-[#0F0D15] text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {aspect}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-2">
                <div className="px-2 py-1 font-semibold text-cyan-400 text-[10px] uppercase">Smart Reframe</div>
                {(['center', 'face-priority', 'smart-pan-zoom'] as FrameReframeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setReframeMode(mode);
                      setShowFrameMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all capitalize mt-1 ${
                      reframeMode === mode
                        ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-500/40 font-medium'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {mode.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Studio Trigger */}
        <button
          onClick={() => setAudioStudioOpen(!audioStudioOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            audioEQ.preset !== 'original'
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-semibold'
              : 'bg-[#1C1A26] border-white/10 text-gray-300 hover:text-white'
          }`}
          title="Neural Audio Studio Equalizer & DSP"
        >
          <Volume2 className={`w-3.5 h-3.5 ${audioEQ.preset !== 'original' ? 'text-indigo-400 animate-pulse' : ''}`} />
          <span className="hidden md:inline font-medium">Audio Studio</span>
          {audioEQ.preset !== 'original' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          )}
        </button>

        {/* Cinema Mode Toggle */}
        <button
          onClick={() => setCinemaMode(!cinemaMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            cinemaMode
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
              : 'bg-[#1C1A26] border-white/10 text-gray-300 hover:text-white'
          }`}
          title="Toggle Full Cinema Theater Mode"
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">{cinemaMode ? 'Exit Cinema' : 'Cinema Mode'}</span>
        </button>

        {/* Telemetry HUD Toggle */}
        <button
          onClick={() => setTelemetryOpen(!telemetryOpen)}
          className={`p-1.5 rounded-xl border transition-all ${
            telemetryOpen
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-[#1C1A26] border-white/10 text-gray-400 hover:text-white'
          }`}
          title="Performance Telemetry HUD"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
