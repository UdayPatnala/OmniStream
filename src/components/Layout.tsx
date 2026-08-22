import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../store';
import { BottomNav } from './BottomNav';
import { GlobalPlayer } from './GlobalPlayer';
import { CineMorphLanding } from '../pages/CineMorphLanding';

export function Layout({ children }: { children: ReactNode }) {
  const { theme, versionMode, rootLandingPreference } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Root Landing, CineMorph Landing, and Theater full-viewport passthroughs
  const isFullViewport = 
    location.pathname === '/landing' ||
    location.pathname === '/gateway' ||
    location.pathname === '/cinemorph' ||
    location.pathname.startsWith('/theater/') ||
    (location.pathname === '/' && rootLandingPreference === 'ask') ||
    (versionMode === 'v2' && (location.pathname === '/' || location.pathname.startsWith('/watch/')));

  if (isFullViewport) {
    return (
      <div className="w-screen h-screen bg-[#030208] overflow-hidden">
        {children}
      </div>
    );
  }


  // V1 Standard U-Tube Media Workspace
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f0f0f] text-[#f1f1f1] font-sans overflow-hidden select-none relative">
      <Header toggleSidebar={() => setCollapsed(!collapsed)} />
      
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar collapsed={collapsed} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <GlobalPlayer />
          <main className="flex-1 overflow-y-auto scroll-smooth pb-20 md:pb-8 px-4 md:px-8 py-4" id="scroll-container">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}


