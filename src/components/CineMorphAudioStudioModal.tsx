import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { audioEngine } from '../lib/cinemorph/audioEngine';
import { AudioPreset } from '../types';
import { Volume2, X, Sliders, Sparkles, Disc, Zap, RotateCcw } from 'lucide-react';

export const CineMorphAudioStudioModal: React.FC = () => {
  const { audioStudioOpen, setAudioStudioOpen, audioEQ, setAudioEQ, resetAudioEQ } = useAppStore();
  const [spectrum, setSpectrum] = useState<number[]>(new Array(16).fill(0));

  useEffect(() => {
    if (!audioStudioOpen) return;

    let animId: number;
    const updateSpectrum = () => {
      const data = audioEngine.getSpectrumData();
      if (data && data.length > 0) {
        const sampled: number[] = [];
        const step = Math.floor(data.length / 16);
        for (let i = 0; i < 16; i++) {
          sampled.push(data[i * step] || 0);
        }
        setSpectrum(sampled);
      }
      animId = requestAnimationFrame(updateSpectrum);
    };

    animId = requestAnimationFrame(updateSpectrum);
    return () => cancelAnimationFrame(animId);
  }, [audioStudioOpen]);

  if (!audioStudioOpen) return null;

  const presets: { id: AudioPreset; label: string; desc: string }[] = [
    { id: 'original', label: 'Flat / Original', desc: 'Direct unmodified audio' },
    { id: 'bass-heavy', label: 'Cinema Sub-Bass', desc: 'Deep low-end rumble for blockbusters' },
    { id: 'dialogue-boost', label: 'Vocal Enhance', desc: 'Crisp speech clarity across noisy scenes' },
    { id: 'spatial-3d', label: 'Spatial 3D', desc: 'Immersive soundstage convolution' },
    { id: 'night-compression', label: 'Night Mode', desc: 'Normalized dynamic range for quiet listening' },
  ];

  const handleSelectPreset = (preset: AudioPreset) => {
    const config = audioEngine.getPresetConfig(preset);
    setAudioEQ(config);
    audioEngine.applyConfig(config);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#12131a] border border-amber-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/60 to-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/30 border border-amber-400/40 rounded-xl text-amber-300">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Audio DSP Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Web Audio DSP
                </span>
              </h3>
              <p className="text-xs text-gray-400">Multi-band EQ, Vocal Enhancer & 3D Spatial Engine</p>
            </div>
          </div>
          <button
            onClick={() => setAudioStudioOpen(false)}
            className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Realtime Spectrum Visualizer */}
          <div className="bg-[#090a0f] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-end justify-center gap-1.5 h-16 w-full">
              {spectrum.map((val, idx) => (
                <div
                  key={idx}
                  className="w-3 rounded-t-sm transition-all duration-100 bg-gradient-to-t from-amber-600 via-amber-400 to-cyan-400"
                  style={{ height: `${Math.min(100, Math.max(15, (val / 255) * 100))}%` }}
                />
              ))}
            </div>
            <div className="mt-2 text-[10px] text-gray-500 tracking-widest uppercase flex items-center gap-2">
              <Disc className="w-3 h-3 text-amber-400 animate-spin" />
              Real-time Audio Spectrum Analyser (64-Bin FFT)
            </div>
          </div>

          {/* Equalizer Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                DSP Bands & Dynamic Enhancers
              </span>
              <button
                onClick={resetAudioEQ}
                className="text-gray-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset EQ
              </button>
            </div>

            {/* Bass Boost Slider */}
            <div className="bg-[#181924] p-3 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Sub-Bass Boost</span>
                <span className="text-amber-400 font-bold">+{audioEQ.bassBoost} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={audioEQ.bassBoost}
                onChange={(e) => setAudioEQ({ bassBoost: Number(e.target.value), preset: 'original' })}
                className="w-full accent-amber-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Dialogue Clarity Slider */}
            <div className="bg-[#181924] p-3 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Dialogue & Vocal Clarity</span>
                <span className="text-amber-400 font-bold">+{audioEQ.dialogueClarity} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={audioEQ.dialogueClarity}
                onChange={(e) => setAudioEQ({ dialogueClarity: Number(e.target.value), preset: 'original' })}
                className="w-full accent-amber-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Treble Shine Slider */}
            <div className="bg-[#181924] p-3 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Treble Shine & Sparkle</span>
                <span className="text-cyan-400 font-bold">+{audioEQ.trebleShine} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={audioEQ.trebleShine}
                onChange={(e) => setAudioEQ({ trebleShine: Number(e.target.value), preset: 'original' })}
                className="w-full accent-cyan-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* DRC & 3D Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setAudioEQ({ surround3D: !audioEQ.surround3D })}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  audioEQ.surround3D
                    ? 'bg-gradient-to-br from-amber-950/50 to-slate-900/50 border-amber-500/50 text-amber-200'
                    : 'bg-[#181924] border-white/5 text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className={`w-2 h-2 rounded-full ${audioEQ.surround3D ? 'bg-amber-400' : 'bg-gray-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-white">3D Surround</div>
                  <div className="text-[10px] opacity-80">Virtual soundstage expansion</div>
                </div>
              </button>

              <button
                onClick={() => setAudioEQ({ drcLoudness: !audioEQ.drcLoudness })}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  audioEQ.drcLoudness
                    ? 'bg-gradient-to-br from-cyan-950/50 to-slate-900/50 border-cyan-500/50 text-cyan-200'
                    : 'bg-[#181924] border-white/5 text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className={`w-2 h-2 rounded-full ${audioEQ.drcLoudness ? 'bg-cyan-400' : 'bg-gray-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-white">Loudness DRC</div>
                  <div className="text-[10px] opacity-80">Dynamic Range Normalizer</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-300">Quick Audio Profiles</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    audioEQ.preset === p.id
                      ? 'bg-amber-600/30 border-amber-500/60 text-white font-medium shadow-md'
                      : 'bg-[#181924] border-white/5 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="text-xs font-semibold">{p.label}</div>
                  <div className="text-[10px] text-gray-400">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
