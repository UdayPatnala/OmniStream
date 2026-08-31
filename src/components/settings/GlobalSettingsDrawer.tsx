import React, { useEffect, useState } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Laptop, 
  Sliders, 
  Film, 
  Tv, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  Sparkles 
} from 'lucide-react';
import { useAppStore } from '../../store';
import { useTicketStore } from '../../state/useTicketStore';

interface GlobalSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSettingsDrawer: React.FC<GlobalSettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    theme, 
    setTheme, 
    rootLandingPreference, 
    setRootLandingPreference, 
    frameAspectRatio, 
    setFrameAspectRatio, 
    devicePerformanceProfile, 
    setDevicePerformanceProfile, 
    ecoMode, 
    setEcoMode, 
    clearHistory, 
    clearSearchHistory 
  } = useAppStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <aside 
        className="absolute inset-y-0 right-0 max-w-full w-full sm:w-[420px] bg-utube-card border-l border-utube-border text-utube-text shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Global OmniStream Preferences"
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 p-2.5 rounded-xl bg-utube-text text-utube-card text-xs font-bold shadow-2xl text-center animate-in fade-in slide-in-from-top-1">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-utube-border flex items-center justify-between bg-utube-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-utube-surface border border-utube-border flex items-center justify-center text-utube-primary shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-utube-text font-cinematic-title">
                Global Preferences
              </h2>
              <p className="text-[11px] text-utube-text-muted">OmniStream Workstation Settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-utube-text-muted hover:text-utube-text hover:bg-utube-surface transition-colors cursor-pointer"
            aria-label="Close preferences"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Appearance & Theme */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-utube-text-muted uppercase tracking-wider">
              Interface Theme
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setTheme('light'); showToast('☀️ Switched to Light Editorial theme'); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-utube-surface border-utube-primary text-utube-primary shadow-sm ring-1 ring-utube-primary'
                    : 'bg-utube-surface/40 border-utube-border text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>

              <button
                onClick={() => { setTheme('dark'); showToast('🌙 Switched to Dark Cinema theme'); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-utube-surface border-utube-primary text-utube-primary shadow-sm ring-1 ring-utube-primary'
                    : 'bg-utube-surface/40 border-utube-border text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>

              <button
                onClick={() => { setTheme('system'); showToast('💻 Following System Default theme'); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-utube-surface border-utube-primary text-utube-primary shadow-sm ring-1 ring-utube-primary'
                    : 'bg-utube-surface/40 border-utube-border text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </section>

          {/* Default Gateway Start Preference */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-utube-text-muted uppercase tracking-wider">
              Launch Gateway Behavior
            </h3>
            <div className="space-y-2">
              {[
                { id: 'ask', label: 'Always Show Dual Portal', desc: 'Choose between U-Tube and CineMorph on start.' },
                { id: 'v1', label: 'Direct to U-Tube', desc: 'Open directly into ad-free stream discovery.' },
                { id: 'v2', label: 'Direct to CineMorph', desc: 'Open directly into fixed-aperture cinema hall.' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setRootLandingPreference(opt.id as any);
                    showToast(`✅ Default Gateway: ${opt.label}`);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    rootLandingPreference === opt.id
                      ? 'bg-utube-surface border-utube-primary text-utube-text shadow-sm ring-1 ring-utube-primary'
                      : 'bg-utube-surface/40 border-utube-border text-utube-text-secondary hover:bg-utube-surface'
                  }`}
                >
                  <div className="text-xs font-bold text-utube-text flex items-center justify-between">
                    <span>{opt.label}</span>
                    {rootLandingPreference === opt.id && <span className="text-[10px] text-utube-primary font-bold">● Active</span>}
                  </div>
                  <div className="text-[11px] text-utube-text-muted mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Default Cinema Aspect Ratio */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-utube-text-muted uppercase tracking-wider">
              CineMorph Viewport Format
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '1.43:1', label: 'True IMAX (1.43:1)' },
                { id: '1.90:1', label: 'IMAX (1.90:1)' },
                { id: '21:9', label: 'Cinema (21:9)' },
                { id: '16:9', label: 'Widescreen (16:9)' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setFrameAspectRatio(r.id as any);
                    showToast(`🎬 Viewport Aspect: ${r.label}`);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    frameAspectRatio === r.id
                      ? 'bg-utube-surface border-utube-primary text-utube-primary shadow-sm ring-1 ring-utube-primary'
                      : 'bg-utube-surface/40 border-utube-border text-utube-text-secondary hover:bg-utube-surface'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </section>

          {/* Performance & Eco Mode */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-utube-text-muted uppercase tracking-wider">
              Hardware Engine & Energy
            </h3>
            <div className="p-3 rounded-2xl bg-utube-surface/40 border border-utube-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-utube-text">Performance Profile</div>
                  <div className="text-[10px] text-utube-text-muted">Canvas Sampling Fidelity</div>
                </div>
                <select
                  value={devicePerformanceProfile}
                  onChange={(e) => setDevicePerformanceProfile(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-utube-surface border border-utube-border text-utube-text focus:outline-none focus:border-utube-primary cursor-pointer"
                >
                  <option value="high">High (60 FPS)</option>
                  <option value="balanced">Balanced</option>
                  <option value="low">Low Power</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-utube-border">
                <div>
                  <div className="text-xs font-bold text-utube-text">Battery Saver</div>
                  <div className="text-[10px] text-utube-text-muted">Throttle ambient analysis</div>
                </div>
                <button
                  onClick={() => {
                    const next = !ecoMode;
                    setEcoMode(next);
                    showToast(next ? '🌱 Battery Saver Active' : '⚡ Full Performance Active');
                  }}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    ecoMode ? 'bg-emerald-600' : 'bg-utube-border'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ecoMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Data & Privacy */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-utube-text-muted uppercase tracking-wider">
              Data & Storage
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const data = {
                    version: 2,
                    exportedAt: new Date().toISOString(),
                    history: useAppStore.getState().history,
                    subscriptions: useAppStore.getState().subscriptions,
                    collections: useAppStore.getState().collections,
                    tickets: useTicketStore.getState().tickets,
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `omnistream-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('💾 Personal data backup exported');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-utube-surface hover:bg-utube-border/60 border border-utube-border rounded-xl text-xs font-bold text-utube-text transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup</span>
              </button>

              <button
                onClick={() => {
                  clearHistory();
                  clearSearchHistory();
                  showToast('🧹 Watch and search history cleared');
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-utube-border bg-utube-surface/40 flex items-center justify-between text-[11px] text-utube-text-muted">
          <span className="flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Zero-Cloud Private Workstation
          </span>
          <span className="font-mono font-bold text-utube-text">v2.0.0</span>
        </div>
      </aside>
    </div>
  );
};
