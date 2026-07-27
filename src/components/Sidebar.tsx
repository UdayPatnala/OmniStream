import { NavLink } from 'react-router-dom';
import { Home, Search, Tv, FolderHeart, History, Settings, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/subscriptions', icon: Tv, label: 'Subscriptions' },
  { to: '/collections', icon: FolderHeart, label: 'Collections' },
  { to: '/history', icon: History, label: 'History' },
];

export function Sidebar() {
  const subscriptions = useAppStore(state => state.subscriptions);

  return (
    <aside className="w-72 h-full bg-[#1C1B1F] border-r border-white/5 hidden md:flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-[#D0BCFF] to-[#4F378B] rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-[#381E72] font-black text-xl italic tracking-tighter pr-0.5">U</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-[#E6E1E5]">U Tube</span>
          <span className="text-[10px] text-[#938F99] leading-none tracking-widest uppercase">Personal Video Client</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-4 p-4 rounded-2xl transition-colors",
              isActive 
                ? "bg-[#4F378B] text-[#EADDFF] font-medium" 
                : "text-[#CAC4D0] hover:bg-white/5"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {subscriptions.length > 0 && (
          <div className="mt-8">
            <h4 className="px-4 text-xs font-semibold text-[#938F99] uppercase tracking-wider mb-2">
              Subscriptions
            </h4>
            <div className="space-y-1">
              {subscriptions.map(sub => (
                <NavLink
                  key={sub.id}
                  to={`/channel/${sub.id}`}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 p-4 rounded-2xl text-sm transition-colors",
                    isActive 
                      ? "bg-[#4F378B] text-[#EADDFF] font-medium" 
                      : "text-[#CAC4D0] hover:bg-white/5"
                  )}
                >
                  <img src={sub.thumbnails.default} alt={sub.title} className="w-8 h-8 rounded-full" />
                  <span className="truncate">{sub.title}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 p-4 rounded-2xl bg-white/5 transition-colors",
            isActive 
              ? "bg-[#4F378B] text-[#EADDFF] font-medium" 
              : "text-[#CAC4D0] hover:bg-white/10"
          )}
        >
          <Settings className="w-6 h-6" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Settings</span>
            <span className="text-[10px] text-[#938F99]">Preferences</span>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
