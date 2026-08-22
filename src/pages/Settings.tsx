import { useAppStore } from '../store';
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
    reframeMode, setReframeMode
  } = useAppStore();

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 pb-12">
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
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `utube-cinemorph-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
                        alert('Data restored successfully!');
                      } else {
                        alert('Invalid backup format.');
                      }
                    } catch (err) {
                      alert('Failed to parse JSON file.');
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
              if (confirm('Clear search query history?')) {
                clearSearchHistory();
              }
            }}
            className="px-6 py-2.5 bg-white/5 text-[#E6E1E5] hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
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
              if (confirm('Are you sure you want to clear your watch history?')) {
                clearHistory();
              }
            }}
            className="px-6 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-colors"
          >
            Clear Watch History
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
            <span className="font-semibold text-[#E6E1E5]">U Tube (CineMorph AI v2)</span>
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
