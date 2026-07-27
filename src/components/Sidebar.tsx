import { NavLink } from 'react-router-dom';
import { Home, Flame, Tv, FolderHeart, History, Settings, Compass, Music, Gamepad2, Film } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

const mainNavItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search?q=trending', icon: Flame, label: 'Trending' },
  { to: '/subscriptions', icon: Tv, label: 'Subscriptions' },
];

const libraryNavItems = [
  { to: '/history', icon: History, label: 'History' },
  { to: '/collections', icon: FolderHeart, label: 'Playlists' },
];

const exploreItems = [
  { to: '/search?q=music', icon: Music, label: 'Music' },
  { to: '/search?q=gaming', icon: Gamepad2, label: 'Gaming' },
  { to: '/search?q=movies', icon: Film, label: 'Movies' },
  { to: '/search?q=tech', icon: Compass, label: 'Tech' },
];

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const subscriptions = useAppStore(state => state.subscriptions);

  if (collapsed) {
    return (
      <aside className="w-18 h-full bg-[#0f0f0f] hidden md:flex flex-col items-center py-3 gap-6 border-r border-[#272727]/30 select-none">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] w-16 transition-colors",
              isActive 
                ? "bg-[#272727] text-white font-medium" 
                : "text-[#aaaaaa] hover:bg-[#272727]/60 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full">{item.label}</span>
          </NavLink>
        ))}
        {libraryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] w-16 transition-colors",
              isActive 
                ? "bg-[#272727] text-white font-medium" 
                : "text-[#aaaaaa] hover:bg-[#272727]/60 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full">{item.label}</span>
          </NavLink>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-60 h-full bg-[#0f0f0f] border-r border-[#272727]/40 hidden md:flex flex-col p-3 overflow-y-auto select-none">
      {/* Main Section */}
      <div className="space-y-1">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition-colors",
              isActive 
                ? "bg-[#272727] text-white font-semibold" 
                : "text-[#f1f1f1] hover:bg-[#272727]"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="my-3 border-t border-[#272727]" />

      {/* You / Library */}
      <div className="space-y-1">
        <h4 className="px-3 text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1">
          You
        </h4>
        {libraryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition-colors",
              isActive 
                ? "bg-[#272727] text-white font-semibold" 
                : "text-[#f1f1f1] hover:bg-[#272727]"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <>
          <div className="my-3 border-t border-[#272727]" />
          <div className="space-y-1">
            <h4 className="px-3 text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1">
              Subscriptions
            </h4>
            {subscriptions.map(sub => (
              <NavLink
                key={sub.id}
                to={`/channel/${sub.id}`}
                className={({ isActive }) => cn(
                  "flex items-center gap-4 px-3 py-2 rounded-xl text-sm transition-colors",
                  isActive 
                    ? "bg-[#272727] text-white font-semibold" 
                    : "text-[#f1f1f1] hover:bg-[#272727]"
                )}
              >
                <img src={sub.thumbnails.default} alt={sub.title} className="w-6 h-6 rounded-full object-cover shrink-0" />
                <span className="truncate text-xs">{sub.title}</span>
              </NavLink>
            ))}
          </div>
        </>
      )}

      <div className="my-3 border-t border-[#272727]" />

      {/* Explore */}
      <div className="space-y-1">
        <h4 className="px-3 text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1">
          Explore
        </h4>
        {exploreItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-5 px-3 py-2 rounded-xl text-sm transition-colors",
              isActive 
                ? "bg-[#272727] text-white font-semibold" 
                : "text-[#f1f1f1] hover:bg-[#272727]"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="truncate text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-[#272727]">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition-colors",
            isActive 
              ? "bg-[#272727] text-white font-semibold" 
              : "text-[#f1f1f1] hover:bg-[#272727]"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="truncate">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}

