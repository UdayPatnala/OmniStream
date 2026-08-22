import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, Film, Clock, Volume2, Maximize2, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { playbackService } from '../lib/services/playbackService';

const CURATED_SHOWCASE = [
  { id: 'dQw4w9WgXcQ', title: 'Cinematic 4K Showcase', tag: 'IMAX 4K HDR', query: 'cinematic 4k hdr landscape movie demo' },
  { id: 'jfKfPfyJRdk', title: 'Lo-Fi Chill Cinema', tag: 'Spatial Audio', query: 'lofi hip hop radio beats to relax study' },
  { id: '5qap5aO4i9A', title: 'Cyberpunk Neon City', tag: '21:9 UltraWide', query: 'cyberpunk 2077 night city 4k 60fps showcase' },
  { id: 'LXb3EKWsInQ', title: 'Nature in 8K Ultra HDR', tag: 'Ambilight Glow', query: 'costa rica 8k 60fps hdr ultra hd' },
];

export function CineMorphLanding() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { history, setVersionMode } = useAppStore();

  const handleEnterCinema = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const query = (directInput || inputUrl).trim();
    if (!query) return;

    setLoading(true);
    try {
      await playbackService.executePipeline(query, (path) => {
        navigate(path);
      });
    } catch (e) {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  };

  const recentHistory = Object.values(history)
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .slice(0, 4);

  return (
    <div className="min-h-screen w-full bg-[#030206] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden select-none font-sans">
      {/* Dynamic Ambient Cinema Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-900/25 via-indigo-900/35 to-purple-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
          <span className="text-xs font-bold tracking-widest uppercase text-gray-300">CineMorph AI <span className="text-cyan-400">Theater v2</span></span>
        </div>

        <button
          onClick={() => setVersionMode('v1')}
          className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm"
        >
          ← Exit to OmniStream Workspace
        </button>
      </div>

      {/* Main Center Stage */}
      <div className="w-full max-w-3xl text-center space-y-8 z-10 my-auto py-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-widest uppercase shadow-lg shadow-cyan-950/40">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Virtual Movie Theater Experience
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white bg-gradient-to-b from-white via-[#f1f5f9] to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
            CineMorph<span className="text-cyan-400">AI</span>
          </h1>

          <p className="text-sm md:text-base text-gray-400 font-medium tracking-wide max-w-lg mx-auto">
            Transform any YouTube stream into an ultra-immersive private cinema with adaptive ambient lighting and Web Audio DSP.
          </p>

          {/* Feature Highlight Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <Volume2 className="w-3 h-3 text-cyan-400" /> Web Audio DSP
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <Maximize2 className="w-3 h-3 text-purple-400" /> 21:9 Cinemascope
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <Zap className="w-3 h-3 text-amber-400" /> Ambilight Room Glow
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
              <Film className="w-3 h-3 text-emerald-400" /> Zero Distractions
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleEnterCinema} className="relative w-full max-w-xl mx-auto">
          <div className="relative flex items-center bg-[#0a0812]/90 border border-cyan-500/35 rounded-2xl p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl focus-within:border-cyan-400 focus-within:shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all">
            <input
              type="text"
              placeholder="Search topic or paste YouTube link..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputUrl.trim() || loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <Sparkles className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Enter Cinema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Curated 1-Click Showcase */}
        <div className="space-y-3 pt-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
            <Film className="w-3 h-3 text-cyan-400" />
            Quick Experience Showcase
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
            {CURATED_SHOWCASE.map((item) => (
              <button
                key={item.title}
                onClick={() => handleEnterCinema(undefined, item.query)}
                className="p-3 bg-[#0d0a17]/80 hover:bg-[#161226] border border-white/5 hover:border-cyan-500/40 rounded-2xl text-left transition-all group flex flex-col justify-between"
              >
                <div className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 truncate">
                  {item.title}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-semibold text-cyan-400/90 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/20">
                    {item.tag}
                  </span>
                  <Play className="w-3.5 h-3.5 text-gray-500 group-hover:text-white group-hover:scale-110 transition-all fill-current" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Cinema History */}
        {recentHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-500" />
              Resume Presentation
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
              {recentHistory.map((item) => (
                <button
                  key={item.video.id}
                  onClick={() => handleEnterCinema(undefined, item.video.id)}
                  className="p-2 bg-[#0c0a14] hover:bg-[#151224] border border-white/5 hover:border-cyan-500/40 rounded-xl text-left transition-all group overflow-hidden"
                >
                  <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative mb-1.5 border border-white/5">
                    <img src={item.video.thumbnails.medium} alt={item.video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-gray-300 truncate group-hover:text-cyan-300">
                    {item.video.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-[11px] text-gray-500 font-medium z-10 py-2">
        CineMorph AI Virtual Movie Theater Engine • © Patnala Uday Kumar
      </div>
    </div>
  );
}
