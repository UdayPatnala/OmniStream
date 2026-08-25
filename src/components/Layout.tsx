import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../store';
import { BottomNav } from './BottomNav';

export function Layout({ children }: { children: ReactNode }) {
  const { theme, rootLandingPreference } = useAppStore();
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

  // POV Landing: root path when not explicitly set to v1 or v2
  const isPOVLanding =
    location.pathname === '/' &&
    rootLandingPreference !== 'v1' &&
    rootLandingPreference !== 'v2';

  // Full-viewport passthroughs (no Header / Sidebar)
  const isFullViewport =
    isPOVLanding ||
    location.pathname === '/landing' ||
    location.pathname === '/gateway' ||
    location.pathname === '/cinemorph' ||
    location.pathname.startsWith('/theater/') ||
    (location.pathname === '/' && rootLandingPreference === 'ask');

  if (isFullViewport) {
    // Light bg for POV Landing, dark for CineMorph / theater
    const bg = isPOVLanding ? 'bg-[#F5F2EE]' : 'bg-[#030208]';
    return (
      <div className={`w-full max-w-full ${bg}`} id="pov-scroll-root" style={{ overflowY: 'auto', overflowX: 'hidden', height: '100vh' }}>
        {children}
      </div>
    );
  }


  // Standard U-Tube Media Workspace
  return (
    <div className="flex flex-col h-screen w-full max-w-full bg-utube-bg text-utube-text font-sans overflow-hidden select-none relative">
      <Header toggleSidebar={() => setCollapsed(!collapsed)} />
      
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar collapsed={collapsed} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto scroll-smooth pb-20 md:pb-8 px-4 md:px-8 py-4 bg-utube-bg" id="scroll-container">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}


