import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Sparkles, Sun, Crop, Volume2, Tv, Activity } from 'lucide-react';
import { GlowIntensity, FrameAspectRatio, FrameReframeMode } from '../types';

interface CineMorphTopBarProps {
  onToggleTelemetry?: () => void;
}

export const CineMorphTopBar: React.FC<CineMorphTopBarProps> = () => {
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
    <div className="w-full bg-[#12131a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Engine Status & Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-950/60 to-slate-900/60 px-3 py-1.5 rounded-xl border border-amber-500/30">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </div>
          <span className="font-bold tracking-wider text-amber-200 uppercase text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            CineMorph Engine v2
          </span>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center bg-[#090a0f] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setVersionMode('v2')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              versionMode === 'v2'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            v2 Cinema
          </button>
          <button
            onClick={() => setVersionMode('v1')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              versionMode === 'v1'
                ? 'bg-slate-700 text-white shadow-md'
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
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-[#181924] border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Ambient Screen Glow Controls"
          >
            <Sun className={`w-3.5 h-3.5 ${ambientGlow ? 'text-amber-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline font-medium">Glow: {(glowIntensity || 'ultra').toUpperCase()}</span>
          </button>

          {showGlowMenu && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-[#181924] border border-amber-500/30 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
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
                      ? 'bg-amber-600 text-white font-semibold'
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
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-[#181924] border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Viewport Aspect & Smart Reframe"
          >
            <Crop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">{frameAspectRatio}</span>
          </button>

          {showFrameMenu && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-[#181924] border border-amber-500/30 rounded-xl shadow-2xl p-2.5 z-50 flex flex-col gap-2 text-xs">
              <div>
                <div className="px-2 py-1 font-semibold text-amber-400 text-[10px] uppercase">Aspect Ratio</div>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {(['original', '1.90:1', '1.43:1'] as FrameAspectRatio[]).map((aspect) => (
                    <button
                      key={aspect}
                      onClick={() => {
                        setFrameAspectRatio(aspect);
                        setShowFrameMenu(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${
                        frameAspectRatio === aspect
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-[#090a0f] text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {aspect === 'original' ? 'Original' : aspect}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-2">
                <div className="px-2 py-1 font-semibold text-amber-400 text-[10px] uppercase">Smart Reframe</div>
                {(['center', 'face-priority', 'smart-pan-zoom'] as FrameReframeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setReframeMode(mode);
                      setShowFrameMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all capitalize mt-1 ${
                      reframeMode === mode
                        ? 'bg-amber-900/60 text-amber-200 border border-amber-500/40 font-medium'
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
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
              : 'bg-[#181924] border-white/10 text-gray-300 hover:text-white'
          }`}
          title="Audio Studio Equalizer & DSP"
        >
          <Volume2 className={`w-3.5 h-3.5 ${audioEQ.preset !== 'original' ? 'text-amber-400 animate-pulse' : ''}`} />
          <span className="hidden md:inline font-medium">Audio Studio</span>
          {audioEQ.preset !== 'original' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          )}
        </button>

        {/* Cinema Mode Toggle */}
        <button
          onClick={() => setCinemaMode(!cinemaMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            cinemaMode
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
              : 'bg-[#181924] border-white/10 text-gray-300 hover:text-white'
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
              : 'bg-[#181924] border-white/10 text-gray-400 hover:text-white'
          }`}
          title="Performance Telemetry HUD"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
