import { useAppStore } from '../store';
import { Info, ShieldCheck, Heart } from 'lucide-react';

export function SettingsPage() {
  const { 
    theme, setTheme, 
    clearHistory, clearSearchHistory,
    autoplay, setAutoplay,
    playbackSpeed, setPlaybackSpeed
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

      {/* Data & History Controls */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99] border-b border-white/5 pb-4">Data & Local Storage</h2>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            <span className="font-semibold text-[#E6E1E5]">U Tube</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-white/5">
            <span className="text-[#938F99]">Version</span>
            <span className="font-mono text-xs text-[#D0BCFF]">v1.0.0</span>
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


