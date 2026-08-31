import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  Film,
  Play,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Search,
  Ticket,
  Maximize2,
  HardDrive,
  Tv,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ModeCard } from './ModeCard';
import { GlobalSettingsDrawer } from '../settings/GlobalSettingsDrawer';
import { OMSLogo } from '../common/OMSLogo';
import { useCineMorphStore } from '../../state/useCineMorphStore';
import { useUTubeStore } from '../../state/useUTubeStore';
import { useAppStore } from '../../store';
import { useTicketStore } from '../../state/useTicketStore';

export const BentoGrid: React.FC = () => {
  const navigate = useNavigate();
  const { isOffline, setOfflineStatus } = useCineMorphStore();
  const { refreshFeedIfNeeded } = useUTubeStore();
  const { tickets } = useTicketStore();
  const { 
    theme, 
    setTheme, 
    rootLandingPreference, 
    setRootLandingPreference, 
    setVersionMode 
  } = useAppStore();

  const [onlineState, setOnlineState] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    // Refresh feed if 4h cache expired
    refreshFeedIfNeeded();

    const handleOnline = () => {
      setOnlineState(true);
      setOfflineStatus(false);
    };
    const handleOffline = () => {
      setOnlineState(false);
      setOfflineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshFeedIfNeeded, setOfflineStatus]);

  const effectiveOffline = !onlineState || isOffline;

  const handleLaunchV1 = () => {
    if (rememberChoice) {
      setRootLandingPreference('v1');
    }
    setVersionMode('v1');
    navigate('/home');
  };

  const handleLaunchV2 = () => {
    if (rememberChoice) {
      setRootLandingPreference('v2');
    }
    setVersionMode('v2');
    navigate('/cinemorph');
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className="min-h-screen bg-utube-bg text-utube-text select-none antialiased relative overflow-x-hidden flex flex-col justify-between">
      {/* ── Background Subtle Ambient Grid ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* ── Top Workstation Navigation Header ── */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-3xl bg-utube-card/90 backdrop-blur-xl border border-utube-border shadow-sm">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3.5">
            <OMSLogo variant={theme === 'dark' ? 'dark' : 'light'} size="md" animated={true} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-utube-text font-cinematic-title uppercase">
                  OMNISTREAM
                </h1>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-utube-surface text-utube-text-secondary border border-utube-border tracking-widest uppercase">
                  GATEWAY
                </span>
              </div>
              <p className="text-[11px] text-utube-text-muted font-medium">
                Dual-Engine Media Workstation
              </p>
            </div>
          </div>

          {/* Quick Controls: Connectivity, Theme, and Discreet Settings Icon */}
          <div className="flex items-center gap-2">
            {/* Connectivity Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-2xl bg-utube-surface px-3 py-1.5 text-[11px] font-mono border border-utube-border text-utube-text-secondary">
              {effectiveOffline ? (
                <>
                  <WifiOff className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-600 font-bold">Local (Airgapped)</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 font-bold">Ready</span>
                </>
              )}
            </div>

            {/* Instant Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              className="p-2.5 rounded-2xl bg-utube-surface hover:bg-utube-border/60 text-utube-text-secondary hover:text-utube-text border border-utube-border transition-colors cursor-pointer shadow-sm"
              title={`Active Theme: ${theme.toUpperCase()} (Click to toggle)`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Laptop className="w-4 h-4 text-purple-400" />}
            </button>

            {/* Discreet Settings Symbol Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-2xl bg-utube-surface hover:bg-utube-border/60 text-utube-text-secondary hover:text-utube-text border border-utube-border transition-colors cursor-pointer shadow-sm group"
              title="Global Workstation Settings (⚙)"
              aria-label="Open Settings"
            >
              <Sliders className="w-4 h-4 text-utube-primary group-hover:rotate-45 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dual-Portal Experience ── */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 flex-1">
        {/* Dual Mode Portals (U-Tube & CineMorph) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <ModeCard mode="utube" className="lg:col-span-6 min-h-[440px]" />
          <ModeCard mode="cinemorph" className="lg:col-span-6 min-h-[440px]" />
        </div>

        {/* Remember Choice Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-utube-card/60 border border-utube-border text-xs text-utube-text-secondary">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={rememberChoice} 
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-utube-border bg-utube-surface text-utube-primary focus:ring-0 cursor-pointer"
            />
            <span>Remember selected engine as default launch target</span>
          </label>

          {rootLandingPreference !== 'ask' && (
            <div className="flex items-center gap-2">
              <span>Saved Default: <strong className="text-utube-text uppercase font-bold">{rootLandingPreference === 'v1' ? 'U-Tube' : 'CineMorph'}</strong></span>
              <button 
                onClick={() => setRootLandingPreference('ask')}
                className="font-bold text-utube-primary hover:underline cursor-pointer ml-1"
              >
                Reset to Dual Portal
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-utube-border bg-utube-card/50 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-utube-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-utube-text font-cinematic">OmniStream Workstation</span>
            <span>•</span>
            <span className="font-mono">v2.0.0 Release</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <button 
              onClick={() => setSettingsOpen(true)}
              className="hover:text-utube-text transition-colors cursor-pointer"
            >
              Preferences
            </button>
            <span>•</span>
            <button 
              onClick={() => { setVersionMode('v1'); navigate('/home'); }}
              className="hover:text-utube-primary transition-colors cursor-pointer"
            >
              U-Tube Feed
            </button>
            <span>•</span>
            <button 
              onClick={() => { setVersionMode('v2'); navigate('/cinemorph'); }}
              className="hover:text-cinemorph-primary transition-colors cursor-pointer font-cinematic"
            >
              CineMorph Theater
            </button>
          </div>
        </div>
      </footer>

      {/* ── Integrated Global Settings Drawer ── */}
      <GlobalSettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
