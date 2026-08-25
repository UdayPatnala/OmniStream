import { useState } from 'react';
import { useAppStore } from '../store';
import { useTicketStore } from '../state/useTicketStore';
import { Info, ShieldCheck, Heart, Sparkles, Sliders } from 'lucide-react';
import { RankingProfile } from '../types';

export function SettingsPage() {
  const { 
    theme, setTheme, 
    clearHistory, clearSearchHistory,
    autoplay, setAutoplay,
    playbackSpeed, setPlaybackSpeed,
    rankingProfile, setRankingProfile,
    cinemorphTheme, setCinemorphTheme,
    glowIntensity, setGlowIntensity,
    frameAspectRatio, setFrameAspectRatio,
    reframeMode, setReframeMode,
    rootLandingPreference, setRootLandingPreference,
    theaterSeatingEnabled, setTheaterSeatingEnabled,
    curtainAnimationEnabled, setCurtainAnimationEnabled,
    devicePerformanceProfile, setDevicePerformanceProfile,
    ecoMode, setEcoMode
  } = useAppStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const metrics = typeof window !== 'undefined' ? {
    cores: navigator.hardwareConcurrency || 4,
    memory: (navigator as any).deviceMemory || 4,
  } : { cores: 4, memory: 4 };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 pb-12 relative">
      {/* Dynamic In-App Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-amber-500/30 text-amber-200 text-xs font-bold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold mb-2 text-[#E6E1E5]">Settings</h1>
        <p className="text-[#938F99]">Manage your U Tube preferences and personal application configuration.</p>
      </div>

      {/* Playback & Appearance Preferences */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99] border-b border-white/5 pb-4">Playback & Appearance</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#E6E1E5]">Theme</label>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'dark'|'light'|'system')}
              className="w-full h-12 px-4 rounded-xl border border-white/5 bg-[#2B2930] focus:outline-none focus:border-[#D0BCFF] text-[#E6E1E5]"
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#E6E1E5]">Default Playback Speed</label>
            <select 
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-full h-12 px-4 rounded-xl border border-white/5 bg-[#2B2930] focus:outline-none focus:border-[#D0BCFF] text-[#E6E1E5]"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x (Normal)</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="font-medium text-[#E6E1E5]">Autoplay</h3>
            <p className="text-xs text-[#938F99]">Automatically play active videos when selected.</p>
          </div>
          <button
            onClick={() => setAutoplay(!autoplay)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${autoplay ? 'bg-[#D0BCFF]' : 'bg-[#2B2930]'}`}
            aria-label="Toggle Autoplay"
          >
            <div className={`w-4 h-4 rounded-full transition-transform ${autoplay ? 'translate-x-6 bg-[#381E72]' : 'translate-x-0 bg-[#938F99]'}`} />
          </button>
        </div>
      </div>

      {/* Discovery & Ranking Intelligence */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Sliders className="w-4 h-4 text-[#D0BCFF]" />
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Autonomous Discovery & Ranking</h2>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-[#E6E1E5]">Candidate Ranking Profile</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'balanced', title: 'Balanced (Standard)', desc: 'Optimal blend of relevance, title match, channel size & recency.' },
              { id: 'recency', title: 'Fresh & Recent', desc: 'Prioritizes newly published videos and current year releases.' },
              { id: 'tutorials', title: 'Deep Tutorials', desc: 'Favors comprehensive in-depth videos in the 15m–45m range.' },
              { id: 'authority', title: 'Top Authority', desc: 'Prioritizes established creators and high view count channels.' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setRankingProfile(p.id as RankingProfile)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  rankingProfile === p.id 
                    ? 'bg-[#381E72]/40 border-[#D0BCFF] text-white shadow-lg' 
                    : 'bg-[#2B2930]/40 border-white/5 text-[#CAC4D0] hover:bg-[#2B2930]'
                }`}
              >
                <div className="font-semibold text-sm text-[#E6E1E5] flex items-center justify-between">
                  {p.title}
                  {rankingProfile === p.id && <span className="text-xs text-[#D0BCFF]">● Selected</span>}
                </div>
                <div className="text-xs text-[#938F99] mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CineMorph AI Engine (v2) Configuration */}
      <div className="bg-gradient-to-br from-[#1A162B] to-[#141221] p-6 rounded-[32px] border border-purple-500/20 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-purple-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            CineMorph AI Engine (v2) Configuration
          </h2>
          <span className="px-3 py-1 rounded-full bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-mono font-bold">
            v2 ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Default Cinema Theme</label>
            <select
              value={cinemorphTheme}
              onChange={(e) => setCinemorphTheme(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-purple-500/30 bg-[#0F0D17] text-white focus:outline-none focus:border-purple-400"
            >
              <option value="cinematic-dark">Cinematic Dark</option>
              <option value="cyberpunk-oled">Cyberpunk OLED</option>
              <option value="glassmorphic-neon">Glassmorphic Neon</option>
              <option value="ambient-minimal">Ambient Minimalist</option>
              <option value="imax-ultra">IMAX Ultra</option>
              <option value="golden-hour">Golden Hour</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Ambient Glow Intensity</label>
            <select
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-purple-500/30 bg-[#0F0D17] text-white focus:outline-none focus:border-purple-400"
            >
              <option value="off">Off (Disabled)</option>
              <option value="low">Low (35%)</option>
              <option value="medium">Medium (65%)</option>
              <option value="ultra">Ultra Glow (100%)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Default Viewport Aspect</label>
            <select
              value={frameAspectRatio}
              onChange={(e) => setFrameAspectRatio(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-purple-500/30 bg-[#0F0D17] text-white focus:outline-none focus:border-purple-400"
            >
              <option value="16:9">16:9 Standard Widescreen</option>
              <option value="21:9">21:9 UltraWide Cinema</option>
              <option value="4:3">4:3 Classic IMAX</option>
              <option value="1:1">1:1 Square</option>
              <option value="4.3:1">4.3:1 IMAX Aspect Ratio</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Smart Reframe Focus Mode</label>
            <select
              value={reframeMode}
              onChange={(e) => setReframeMode(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-purple-500/30 bg-[#0F0D17] text-white focus:outline-none focus:border-purple-400"
            >
              <option value="center">Center Lock</option>
              <option value="face-priority">Face Priority Tracking</option>
              <option value="smart-pan-zoom">Smart Pan & Zoom</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Root Gateway Start Preference</label>
            <select
              value={rootLandingPreference}
              onChange={(e) => setRootLandingPreference(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-purple-500/30 bg-[#0F0D17] text-white focus:outline-none focus:border-purple-400"
            >
              <option value="ask">Always Ask (Experience Selector)</option>
              <option value="v1">Default to U-Tube V1</option>
              <option value="v2">Default to CineMorph V2</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">2.5D Virtual Theater Seating</label>
            <select
              value={theaterSeatingEnabled ? 'true' : 'false'}
              onChange={(e) => setTheaterSeatingEnabled(e.target.value === 'true')}
              className="w-full h-12 px-4 rounded-xl border border-purple-500/30 bg-[#0F0D17] text-white focus:outline-none focus:border-purple-400"
            >
              <option value="true">Enabled (Center Cinema View)</option>
              <option value="false">Disabled (Screen Only)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Velvet Curtain Animation Sequence</label>
            <select
              value={curtainAnimationEnabled ? 'true' : 'false'}
              onChange={(e) => setCurtainAnimationEnabled(e.target.value === 'true')}
              className="w-full h-12 px-4 rounded-xl border border-purple-500/30 bg-[#0F0D17] text-white focus:outline-none focus:border-purple-400"
            >
              <option value="true">Full Velvet Curtain Sequence</option>
              <option value="false">Quick Start (Curtains Always Open)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Adaptive Performance & Hybrid Media Routing */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">Adaptive Media Engine & Hybrid Routing</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/20">
            {metrics.cores} Cores • {metrics.memory}GB RAM
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Device Performance Profile</label>
            <select
              value={devicePerformanceProfile}
              onChange={(e) => setDevicePerformanceProfile(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-white/10 bg-[#0F0D17] text-white focus:outline-none focus:border-cyan-400 text-sm"
            >
              <option value="high">High Performance (800ms 60FPS Sampling • High LOD)</option>
              <option value="balanced">Balanced (1500ms Sampling • Medium LOD)</option>
              <option value="low">Low Power (3000ms Sampling • Minimal LOD)</option>
              <option value="ultra-low">Ultra Low (Zero Canvas Sampling • Native Only)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-[#E6E1E5]">Eco Mode (Battery & CPU Saver)</label>
            <select
              value={ecoMode ? 'true' : 'false'}
              onChange={(e) => setEcoMode(e.target.value === 'true')}
              className="w-full h-12 px-4 rounded-xl border border-white/10 bg-[#0F0D17] text-white focus:outline-none focus:border-cyan-400 text-sm"
            >
              <option value="false">Standard / Auto Adaptive</option>
              <option value="true">🌱 Enabled (Throttled Background Processing)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data & History Controls with Backup Export/Import */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99] border-b border-white/5 pb-4">Data & Local Storage</h2>
        
        {/* Storage Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#2B2930]/40 rounded-xl border border-white/5 text-center">
            <div className="text-lg font-bold text-[#D0BCFF]">{Object.keys(useAppStore.getState().history).length}</div>
            <div className="text-[11px] text-[#938F99]">History Videos</div>
          </div>
          <div className="p-3 bg-[#2B2930]/40 rounded-xl border border-white/5 text-center">
            <div className="text-lg font-bold text-[#D0BCFF]">{useAppStore.getState().subscriptions.length}</div>
            <div className="text-[11px] text-[#938F99]">Subscriptions</div>
          </div>
          <div className="p-3 bg-[#2B2930]/40 rounded-xl border border-white/5 text-center">
            <div className="text-lg font-bold text-[#D0BCFF]">{useAppStore.getState().collections.length}</div>
            <div className="text-[11px] text-[#938F99]">Collections</div>
          </div>
          <div className="p-3 bg-[#2B2930]/40 rounded-xl border border-white/5 text-center">
            <div className="text-lg font-bold text-[#D0BCFF]">{useAppStore.getState().searchHistory.length}</div>
            <div className="text-[11px] text-[#938F99]">Search Tags</div>
          </div>
        </div>

        {/* Export & Import Backup */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-white/5">
          <div>
            <h3 className="font-medium text-[#E6E1E5]">Personal Data Backup</h3>
            <p className="text-xs text-[#938F99]">Export your history, subscriptions, and collections to JSON or restore from file.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const data = {
                  version: 2,
                  exportedAt: new Date().toISOString(),
                  history: useAppStore.getState().history,
                  subscriptions: useAppStore.getState().subscriptions,
                  collections: useAppStore.getState().collections,
                  rankingProfile: useAppStore.getState().rankingProfile,
                  cinemorphTheme: useAppStore.getState().cinemorphTheme,
                  tickets: useTicketStore.getState().tickets,
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `omnistream-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              Export Backup
            </button>
            <label className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer">
              Restore JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const imported = JSON.parse(event.target?.result as string);
                      if (imported.history && imported.subscriptions) {
                        useAppStore.setState({
                          history: imported.history || {},
                          subscriptions: imported.subscriptions || [],
                          collections: imported.collections || [],
                        });
                        if (imported.tickets && Array.isArray(imported.tickets)) {
                          useTicketStore.setState({ tickets: imported.tickets });
                        }
                        showToast('✅ Data restored successfully from backup!');
                      } else {
                        showToast('⚠️ Invalid backup file format.');
                      }
                    } catch (err) {
                      showToast('❌ Failed to parse JSON backup file.');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Clear Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-white/5">
          <div>
            <h3 className="font-medium text-[#E6E1E5]">Clear Search History</h3>
            <p className="text-xs text-[#938F99]">Remove all saved search suggestions & query tags.</p>
          </div>
          <button 
            onClick={() => {
              clearSearchHistory();
              showToast('🧹 Search history cleared');
            }}
            className="px-6 py-2.5 bg-white/5 text-[#E6E1E5] hover:bg-white/10 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Clear Search History
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-white/5">
          <div>
            <h3 className="font-medium text-[#E6E1E5]">Clear Watch History</h3>
            <p className="text-xs text-[#938F99]">Remove all watched video history and playback timestamps.</p>
          </div>
          <button 
            onClick={() => {
              clearHistory();
              showToast('🧹 Watch history cleared');
            }}
            className="px-6 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Clear Watch History
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-white/5">
          <div>
            <h3 className="font-medium text-[#E6E1E5]">Clear Collections & Playlists</h3>
            <p className="text-xs text-[#938F99]">Remove all saved user playlists, favorites, and queues.</p>
          </div>
          <button 
            onClick={() => {
              useAppStore.setState({ collections: [] });
              showToast('🧹 Collections and playlists cleared');
            }}
            className="px-6 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Clear Collections
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-white/5">
          <div>
            <h3 className="font-medium text-red-400">Clear All Local Data</h3>
            <p className="text-xs text-[#938F99]">Wipe local storage cache, tickets, subscriptions, and reset to defaults.</p>
          </div>
          <button 
            onClick={() => {
              showToast('⚠️ Resetting local workspace & storage...');
              setTimeout(() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }, 1200);
            }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
          >
            Clear All Local Data
          </button>
        </div>
      </div>

      {/* About Application */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-white/5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Info className="w-4 h-4 text-[#D0BCFF]" />
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">About Application</h2>
        </div>

        <div className="space-y-3 text-sm text-[#CAC4D0]">
          <div className="flex justify-between items-center py-1">
            <span className="text-[#938F99]">Application Name</span>
            <span className="font-semibold text-[#E6E1E5]">OmniStream (CineMorph AI v2)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-white/5">
            <span className="text-[#938F99]">Version</span>
            <span className="font-mono text-xs text-[#D0BCFF]">v2.0.0</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-white/5">
            <span className="text-[#938F99]">Developer & Author</span>
            <span className="font-semibold text-[#E6E1E5]">Patnala Uday Kumar</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-white/5">
            <span className="text-[#938F99]">Copyright</span>
            <span className="text-xs">© Patnala Uday Kumar</span>
          </div>
          <div className="pt-2 border-t border-white/5 text-xs text-[#938F99] flex items-center justify-between">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Internal Developer Configuration</span>
            <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-400" /> Personal Use</span>
          </div>
        </div>
      </div>
    </div>
  );
}
