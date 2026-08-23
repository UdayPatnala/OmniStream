import { NavLink } from 'react-router-dom';
import { Home, Flame, Search, Tv, FolderHeart, History } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/shorts', icon: Flame, label: 'Shorts' },
  { to: '/subscriptions', icon: Tv, label: 'Subs' },
  { to: '/collections', icon: FolderHeart, label: 'Library' },
  { to: '/history', icon: History, label: 'History' },
];

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#1C1B1F] border-t border-white/5 flex items-center justify-around px-2 z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full gap-1.5 text-[10px] font-medium transition-colors",
            isActive 
              ? "text-[#D0BCFF]" 
              : "text-[#938F99] hover:text-[#E6E1E5]"
          )}
        >
          {({ isActive }) => (
            <>
              <div className={cn("p-1.5 rounded-xl", isActive ? "bg-[#4F378B]/50" : "")}>
                 <item.icon className="w-6 h-6" />
              </div>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
