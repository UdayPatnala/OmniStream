import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../store';
import { BottomNav } from './BottomNav';
import { GlobalPlayer } from './GlobalPlayer';

export function Layout({ children }: { children: ReactNode }) {
  const theme = useAppStore(state => state.theme);
  
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex h-screen bg-[#0F0D13] text-[#E6E1E5] font-sans overflow-hidden transition-colors duration-300 select-none relative">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 md:p-8 gap-4 overflow-hidden relative">
        <Header />
        <GlobalPlayer />
        <div className="flex-1 overflow-y-auto scroll-smooth pb-20 md:pb-8" id="scroll-container">
          {children}
        </div>
        <BottomNav />
      </main>
    </div>
  );
}
