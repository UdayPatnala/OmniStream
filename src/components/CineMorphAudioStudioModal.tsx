import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { audioEngine } from '../lib/cinemorph';
import { Volume2, X, Sliders, Sparkles, RotateCcw, Zap, Disc } from 'lucide-react';
import { AudioPreset } from '../types';

export const CineMorphAudioStudioModal: React.FC = () => {
  const { audioStudioOpen, setAudioStudioOpen, audioEQ, setAudioEQ, resetAudioEQ } = useAppStore();
  const [spectrum, setSpectrum] = useState<number[]>(new Array(16).fill(120));

  useEffect(() => {
    if (!audioStudioOpen) return;
    audioEngine.applyConfig(audioEQ);

    const interval = setInterval(() => {
      const data = audioEngine.getSpectrumData();
      const samples: number[] = [];
      const step = Math.floor(data.length / 16) || 1;
      for (let i = 0; i < 16; i++) {
        samples.push(data[i * step] || Math.floor(Math.random() * 80 + 100));
      }
      setSpectrum(samples);
    }, 100);

    return () => clearInterval(interval);
  }, [audioStudioOpen, audioEQ]);

  if (!audioStudioOpen) return null;

  const presets: { id: AudioPreset; label: string; desc: string }[] = [
    { id: 'original', label: 'Original', desc: 'Flat unchanged audio stream' },
    { id: 'dialogue-boost', label: 'Dialogue Boost', desc: 'Crisp vocal focus & noise filter' },
    { id: 'bass-heavy', label: 'Deep Bass', desc: 'Sub-bass warmth & explosive low ends' },
    { id: 'spatial-3d', label: '3D Spatial Surround', desc: 'Virtual wide soundstage immersion' },
    { id: 'night-compression', label: 'Night Mode', desc: 'Normalized dynamic range for quiet listening' },
  ];

  const handleSelectPreset = (preset: AudioPreset) => {
    const config = audioEngine.getPresetConfig(preset);
    setAudioEQ(config);
    audioEngine.applyConfig(config);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#14121F] border border-indigo-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Neural Audio Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Web Audio DSP
                </span>
              </h3>
              <p className="text-xs text-gray-400">Multi-band EQ, Vocal Enhancer & 3D Spatial Engine</p>
            </div>
          </div>
          <button
            onClick={() => setAudioStudioOpen(false)}
            className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Realtime Spectrum Visualizer */}
          <div className="bg-[#0A0912] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-end justify-center gap-1.5 h-16 w-full">
              {spectrum.map((val, idx) => (
                <div
                  key={idx}
                  className="w-3 rounded-t-sm transition-all duration-100 bg-gradient-to-t from-indigo-600 via-purple-500 to-cyan-400"
                  style={{ height: `${Math.min(100, Math.max(15, (val / 255) * 100))}%` }}
                />
              ))}
            </div>
            <div className="mt-2 text-[10px] text-gray-500 tracking-widest uppercase flex items-center gap-2">
              <Disc className="w-3 h-3 text-indigo-400 animate-spin" />
              Real-time Audio Spectrum Analyser (64-Bin FFT)
            </div>
          </div>

          {/* Equalizer Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                DSP Bands & Dynamic Enhancers
              </span>
              <button
                onClick={resetAudioEQ}
                className="text-gray-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" /> Reset EQ
              </button>
            </div>

            {/* Bass Boost Slider */}
            <div className="bg-[#1C1A2B] p-3 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Sub-Bass Boost</span>
                <span className="text-purple-400 font-bold">+{audioEQ.bassBoost} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={audioEQ.bassBoost}
                onChange={(e) => setAudioEQ({ bassBoost: Number(e.target.value), preset: 'original' })}
                className="w-full accent-purple-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Dialogue Clarity Slider */}
            <div className="bg-[#1C1A2B] p-3 rounded-xl border border-white/5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Dialogue & Vocal Clarity</span>
                <span className="text-indigo-400 font-bold">+{audioEQ.dialogueClarity} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={audioEQ.dialogueClarity}
                onChange={(e) => setAudioEQ({ dialogueClarity: Number(e.target.value), preset: 'original' })}
                className="w-full accent-indigo-500 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Treble Shine Slider */}
            <div className="bg-[#1C1A2B] p-3 rounded-xl border border-white/5 space-y-1.5">
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
                className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 ${
                  audioEQ.surround3D
                    ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/50 text-indigo-200'
                    : 'bg-[#1C1A2B] border-white/5 text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className={`w-2 h-2 rounded-full ${audioEQ.surround3D ? 'bg-indigo-400' : 'bg-gray-600'}`} />
                </div>
                <div>
                  <div className="font-semibold text-white">3D Surround</div>
                  <div className="text-[10px] opacity-80">Virtual soundstage expansion</div>
                </div>
              </button>

              <button
                onClick={() => setAudioEQ({ drcLoudness: !audioEQ.drcLoudness })}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 ${
                  audioEQ.drcLoudness
                    ? 'bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border-cyan-500/50 text-cyan-200'
                    : 'bg-[#1C1A2B] border-white/5 text-gray-400 hover:bg-white/5'
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
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    audioEQ.preset === p.id
                      ? 'bg-indigo-600/30 border-indigo-500/60 text-white font-medium shadow-md shadow-indigo-950/50'
                      : 'bg-[#181624] border-white/5 text-gray-300 hover:bg-white/5'
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
