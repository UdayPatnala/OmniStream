import { useState } from 'react';
import { useAppStore } from '../store';
import { validateApiKey } from '../lib/youtube';
import { Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function SettingsPage() {
  const { 
    apiKey, setApiKey, 
    theme, setTheme, 
    clearHistory, clearSearchHistory,
    autoplay, setAutoplay,
    playbackSpeed, setPlaybackSpeed
  } = useAppStore();

  const [tempKey, setTempKey] = useState(apiKey);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(apiKey ? true : null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const trimmed = tempKey.trim();
    if (!trimmed) {
      setApiKey('');
      setIsValid(null);
      return;
    }
    setValidating(true);
    const valid = await validateApiKey(trimmed);
    setValidating(false);
    setIsValid(valid);
    setApiKey(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 pb-12">
      <div>
        <h1 className="text-2xl font-semibold mb-2 text-[#E6E1E5]">Settings</h1>
        <p className="text-[#938F99]">Manage your U Tube preferences and configuration.</p>
      </div>

      {/* API Configuration */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-[#938F99]">API Configuration</h2>
          {isValid !== null && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {isValid ? 'API Key Connected' : 'Invalid API Key'}
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#E6E1E5]">YouTube Data API v3 Key</label>
          <p className="text-xs text-[#938F99]">
            Stored locally in your browser and used exclusively to communicate with official YouTube APIs.
          </p>
          <div className="flex gap-3">
            <input 
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl border border-white/5 bg-[#2B2930] focus:outline-none focus:border-[#D0BCFF] text-[#E6E1E5]"
              placeholder="AIzaSy..."
            />
            <button 
              onClick={handleSave}
              disabled={validating}
              className="h-12 px-6 bg-[#D0BCFF] text-[#381E72] rounded-xl font-semibold hover:bg-[#EADDFF] transition-colors flex items-center gap-2 shrink-0"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {validating ? 'Verifying...' : 'Save'}
            </button>
          </div>
          {saved && (
            <p className={`text-sm ${isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isValid ? 'Key verified & saved successfully!' : 'Key saved but validation failed. Please check key permissions.'}
            </p>
          )}
        </div>
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
          >
            <div className={`w-4 h-4 rounded-full transition-transform ${autoplay ? 'translate-x-6 bg-[#381E72]' : 'translate-x-0 bg-[#938F99]'}`} />
          </button>
        </div>
      </div>

      {/* Danger Zone / Data Wipe */}
      <div className="bg-[#1C1B1F] p-6 rounded-[32px] border border-red-500/20 space-y-6 shadow-xl">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-red-400 border-b border-red-500/20 pb-4">Data & History</h2>
        
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
    </div>
  );
}

