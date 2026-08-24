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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-semibold transition-colors",
            isActive 
              ? "text-red-600" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          {({ isActive }) => (
            <>
              <div className={cn("p-1 rounded-full", isActive ? "bg-red-50" : "")}>
                 <item.icon className="w-5 h-5" />
              </div>
              <span className="truncate">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
