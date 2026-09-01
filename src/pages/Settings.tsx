import { useState } from 'react';
import { useAppStore } from '../store';
import { useTicketStore } from '../state/useTicketStore';
import { Info, ShieldCheck, Heart, Sparkles, Sliders, Film } from 'lucide-react';
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
        <h1 className="text-2xl font-black mb-1.5 text-utube-text font-cinematic-title uppercase tracking-wide">Settings</h1>
        <p className="text-sm text-utube-text-muted">Manage your engine preferences and personal workstation configuration.</p>
      </div>

      {/* Playback & Appearance Preferences */}
      <div className="bg-utube-card p-6 rounded-3xl border border-utube-border space-y-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-utube-text-muted border-b border-utube-border pb-4">Playback & Appearance</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-utube-text">Theme</label>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'dark'|'light'|'system')}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface focus:outline-none focus:border-utube-primary text-utube-text text-sm cursor-pointer shadow-sm"
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode (Editorial Foundation)</option>
              <option value="dark">Dark Mode (Cinema Focus)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-utube-text">Default Playback Speed</label>
            <select 
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface focus:outline-none focus:border-utube-primary text-utube-text text-sm cursor-pointer shadow-sm"
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

        <div className="flex items-center justify-between pt-2 border-t border-utube-border">
          <div>
            <h3 className="text-sm font-bold text-utube-text">Autoplay</h3>
            <p className="text-xs text-utube-text-secondary">Automatically play active videos when selected.</p>
          </div>
          <button
            onClick={() => setAutoplay(!autoplay)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${autoplay ? 'bg-utube-primary' : 'bg-utube-border'}`}
            aria-label="Toggle Autoplay"
          >
            <div className={`w-4 h-4 rounded-full transition-transform bg-white ${autoplay ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Discovery & Ranking Intelligence */}
      <div className="bg-utube-card p-6 rounded-3xl border border-utube-border space-y-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-utube-border pb-4">
          <Sliders className="w-4 h-4 text-utube-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-utube-text-muted">Autonomous Discovery & Ranking</h2>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-utube-text">Candidate Ranking Profile</label>
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  rankingProfile === p.id 
                    ? 'bg-utube-surface border-utube-primary text-utube-text shadow-sm ring-1 ring-utube-primary' 
                    : 'bg-utube-surface/50 border-utube-border text-utube-text-secondary hover:bg-utube-surface'
                }`}
              >
                <div className="font-bold text-sm text-utube-text flex items-center justify-between">
                  {p.title}
                  {rankingProfile === p.id && <span className="text-xs text-utube-primary font-bold">● Active</span>}
                </div>
                <div className="text-xs text-utube-text-muted mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CineMorph Theater Configuration */}
      <div className="bg-utube-card p-6 rounded-3xl border border-utube-border space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-utube-border pb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-utube-text-muted flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-600" />
            CineMorph Theater Configuration
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
            IMMERSION ENGINE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <label className="block font-bold text-utube-text">Auditorium Ambiance</label>
            <select
              value={cinemorphTheme}
              onChange={(e) => setCinemorphTheme(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer shadow-sm text-sm"
            >
              <option value="cinematic-dark">Cinematic Velvet & Amber</option>
              <option value="cyberpunk-oled">Deep OLED Black</option>
              <option value="ambient-minimal">Minimalist Slate</option>
              <option value="imax-ultra">IMAX Auditorium</option>
              <option value="golden-hour">Warm Tungsten</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-utube-text">Ambient Glow Intensity</label>
            <select
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer shadow-sm"
            >
              <option value="off">Off (Disabled)</option>
              <option value="low">Low (35%)</option>
              <option value="medium">Medium (65%)</option>
              <option value="ultra">Ultra Glow (100%)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-utube-text">Default Viewport Aspect</label>
            <select
              value={frameAspectRatio}
              onChange={(e) => setFrameAspectRatio(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer shadow-sm"
            >
              <option value="original">Directorial Original (Default - 100% Uncropped)</option>
              <option value="1.90:1">IMAX Digital (1.90:1)</option>
              <option value="1.43:1">True IMAX GT (1.43:1)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-utube-text">Smart Reframe Focus Mode</label>
            <select
              value={reframeMode}
              onChange={(e) => setReframeMode(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer shadow-sm"
            >
              <option value="center">Center Lock</option>
              <option value="face-priority">Face Priority Tracking</option>
              <option value="smart-pan-zoom">Smart Pan & Zoom</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-utube-text">Root Gateway Start Preference</label>
            <select
              value={rootLandingPreference}
              onChange={(e) => setRootLandingPreference(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer shadow-sm"
            >
              <option value="ask">Always Ask (Experience Selector)</option>
              <option value="v1">Default to U-Tube V1</option>
              <option value="v2">Default to CineMorph V2</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-utube-text">2.5D Virtual Theater Seating</label>
            <select
              value={theaterSeatingEnabled ? 'true' : 'false'}
              onChange={(e) => setTheaterSeatingEnabled(e.target.value === 'true')}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer shadow-sm"
            >
              <option value="true">Enabled (Center Cinema View)</option>
              <option value="false">Disabled (Screen Only)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-utube-text">Velvet Curtain Animation Sequence</label>
            <select
              value={curtainAnimationEnabled ? 'true' : 'false'}
              onChange={(e) => setCurtainAnimationEnabled(e.target.value === 'true')}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer shadow-sm"
            >
              <option value="true">Full Velvet Curtain Sequence</option>
              <option value="false">Quick Start (Curtains Always Open)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Adaptive Performance & Hybrid Media Routing */}
      <div className="bg-utube-card p-6 rounded-3xl border border-utube-border space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-utube-border pb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-utube-text-muted">Adaptive Media Engine & Hybrid Routing</h2>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-utube-surface text-utube-primary border border-utube-border">
            {metrics.cores} Cores • {metrics.memory}GB RAM
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-utube-text">Device Performance Profile</label>
            <select
              value={devicePerformanceProfile}
              onChange={(e) => setDevicePerformanceProfile(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary text-sm cursor-pointer shadow-sm"
            >
              <option value="high">High Performance (800ms 60FPS Sampling • High LOD)</option>
              <option value="balanced">Balanced (1500ms Sampling • Medium LOD)</option>
              <option value="low">Low Power (3000ms Sampling • Minimal LOD)</option>
              <option value="ultra-low">Ultra Low (Zero Canvas Sampling • Native Only)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-utube-text">Eco Mode (Battery & CPU Saver)</label>
            <select
              value={ecoMode ? 'true' : 'false'}
              onChange={(e) => setEcoMode(e.target.value === 'true')}
              className="w-full h-12 px-4 rounded-2xl border border-utube-border bg-utube-surface text-utube-text focus:outline-none focus:border-utube-primary text-sm cursor-pointer shadow-sm"
            >
              <option value="false">Standard / Auto Adaptive</option>
              <option value="true">🌱 Enabled (Throttled Background Processing)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data & History Controls with Backup Export/Import */}
      <div className="bg-utube-card p-6 rounded-3xl border border-utube-border space-y-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-utube-text-muted border-b border-utube-border pb-4">Data & Local Storage</h2>
        
        {/* Storage Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-utube-surface rounded-2xl border border-utube-border text-center shadow-sm">
            <div className="text-lg font-black text-utube-primary">{Object.keys(useAppStore.getState().history).length}</div>
            <div className="text-[11px] font-medium text-utube-text-muted">History Videos</div>
          </div>
          <div className="p-3 bg-utube-surface rounded-2xl border border-utube-border text-center shadow-sm">
            <div className="text-lg font-black text-utube-primary">{useAppStore.getState().subscriptions.length}</div>
            <div className="text-[11px] font-medium text-utube-text-muted">Subscriptions</div>
          </div>
          <div className="p-3 bg-utube-surface rounded-2xl border border-utube-border text-center shadow-sm">
            <div className="text-lg font-black text-utube-primary">{useAppStore.getState().collections.length}</div>
            <div className="text-[11px] font-medium text-utube-text-muted">Collections</div>
          </div>
          <div className="p-3 bg-utube-surface rounded-2xl border border-utube-border text-center shadow-sm">
            <div className="text-lg font-black text-utube-primary">{useAppStore.getState().searchHistory.length}</div>
            <div className="text-[11px] font-medium text-utube-text-muted">Search Tags</div>
          </div>
        </div>

        {/* Export & Import Backup */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-utube-border">
          <div>
            <h3 className="font-bold text-utube-text">Personal Data Backup</h3>
            <p className="text-xs text-utube-text-muted">Export your history, subscriptions, and collections to JSON or restore from file.</p>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-utube-border">
          <div>
            <h3 className="font-bold text-sm text-utube-text">Clear Search History</h3>
            <p className="text-xs text-utube-text-secondary">Remove all saved search suggestions & query tags.</p>
          </div>
          <button 
            onClick={() => {
              clearSearchHistory();
              showToast('🧹 Search history cleared');
            }}
            className="px-5 py-2.5 bg-utube-surface hover:bg-utube-border/60 text-utube-text border border-utube-border rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Clear Search History
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-utube-border">
          <div>
            <h3 className="font-bold text-sm text-utube-text">Clear Watch History</h3>
            <p className="text-xs text-utube-text-secondary">Remove all watched video history and playback timestamps.</p>
          </div>
          <button 
            onClick={() => {
              clearHistory();
              showToast('🧹 Watch history cleared');
            }}
            className="px-5 py-2.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Clear Watch History
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-utube-border">
          <div>
            <h3 className="font-bold text-sm text-utube-text">Clear Collections & Playlists</h3>
            <p className="text-xs text-utube-text-secondary">Remove all saved user playlists, favorites, and queues.</p>
          </div>
          <button 
            onClick={() => {
              useAppStore.setState({ collections: [] });
              showToast('🧹 Collections and playlists cleared');
            }}
            className="px-5 py-2.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Clear Collections
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-utube-border">
          <div>
            <h3 className="font-bold text-sm text-red-600">Clear All Local Data</h3>
            <p className="text-xs text-utube-text-secondary">Wipe local storage cache, tickets, subscriptions, and reset to defaults.</p>
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
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer"
          >
            Clear All Local Data
          </button>
        </div>
      </div>

      {/* About Application */}
      <div className="bg-utube-card p-6 rounded-3xl border border-utube-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-utube-border pb-4">
          <Info className="w-4 h-4 text-utube-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-utube-text-muted">About Application</h2>
        </div>

        <div className="space-y-3 text-sm text-utube-text-secondary">
          <div className="flex justify-between items-center py-1">
            <span className="text-utube-text-muted text-xs">Application Name</span>
            <span className="font-bold text-utube-text">OmniStream (CineMorph AI v2)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-utube-border">
            <span className="text-utube-text-muted text-xs">Version</span>
            <span className="font-mono text-xs text-utube-primary font-bold">v2.0.0</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-utube-border">
            <span className="text-utube-text-muted text-xs">Developer & Author</span>
            <span className="font-bold text-utube-text">Patnala Uday Kumar</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-utube-border">
            <span className="text-utube-text-muted text-xs">Copyright</span>
            <span className="text-xs font-medium">© Patnala Uday Kumar</span>
          </div>
          <div className="pt-2 border-t border-utube-border text-xs text-utube-text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Internal Developer Configuration</span>
            <span className="flex items-center gap-1.5 font-medium"><Heart className="w-3.5 h-3.5 text-red-500" /> Personal Use</span>
          </div>
        </div>
      </div>
    </div>
  );
}
