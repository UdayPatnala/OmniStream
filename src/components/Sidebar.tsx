import { NavLink } from 'react-router-dom';
import {
  Home, Tv, FolderHeart, History,
  Music, Gamepad2, Film, Compass, Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

// ── Navigation taxonomy ────────────────────────────────────────────────────────
//
// CROSS-PRODUCT ESCAPE:
//   OmniStream → back to the main spatial threshold gateway (/)
//
// U-TUBE-ONLY (everything else):
//   Feed, Subscriptions, History, Collections, Explore categories, U-Tube preferences

// The single permitted cross-product escape from U-Tube
const gatewayEscape = { to: '/', icon: Layers, label: 'OmniStream', title: 'Return to OmniStream Gateway' };

// U-Tube primary navigation
const mainNavItems = [
  { to: '/home',          icon: Home, label: 'Home' },
  { to: '/subscriptions', icon: Tv,   label: 'Subscriptions' },
];

// U-Tube library — user's own content
const libraryNavItems = [
  { to: '/history',     icon: History,     label: 'History' },
  { to: '/collections', icon: FolderHeart, label: 'Playlists' },
];

// U-Tube explore — content shortcuts, purely U-Tube
const exploreItems = [
  { to: '/search?q=music',  icon: Music,    label: 'Music' },
  { to: '/search?q=gaming', icon: Gamepad2, label: 'Gaming' },
  { to: '/search?q=movies', icon: Film,     label: 'Movies' },
  { to: '/search?q=tech',   icon: Compass,  label: 'Tech' },
];

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const subscriptions = useAppStore(state => state.subscriptions);

  // ── Collapsed rail ────────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside className="w-18 h-full bg-utube-card hidden md:flex flex-col items-center py-3 gap-4 border-r border-utube-border select-none">
        {/* Cross-engine escape — OmniStream spatial gateway */}
        <NavLink
          to={gatewayEscape.to}
          end
          title={gatewayEscape.title}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] w-16 transition-colors",
            isActive
              ? "bg-utube-surface text-utube-primary font-bold"
              : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
          )}
        >
          <gatewayEscape.icon className="w-5 h-5" />
          <span className="truncate max-w-full font-medium">{gatewayEscape.label}</span>
        </NavLink>

        <div className="w-8 border-t border-utube-border my-1" />

        {/* U-Tube primary */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] w-16 transition-colors",
              isActive
                ? "bg-utube-surface text-utube-primary font-bold"
                : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* U-Tube library */}
        {libraryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] w-16 transition-colors",
              isActive
                ? "bg-utube-surface text-utube-primary font-bold"
                : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full font-medium">{item.label}</span>
          </NavLink>
        ))}
      </aside>
    );
  }

  // ── Full sidebar ──────────────────────────────────────────────────────────────
  return (
    <aside className="w-60 h-full bg-utube-card border-r border-utube-border hidden md:flex flex-col p-3 overflow-y-auto select-none">

      {/* ── Cross-engine gateway escape ── */}
      <div className="space-y-0.5 mb-1">
        <h4 className="px-3 text-[10px] font-bold text-utube-text-muted uppercase tracking-wider mb-1.5">
          Ecosystem
        </h4>
        <NavLink
          to={gatewayEscape.to}
          end
          title={gatewayEscape.title}
          className={({ isActive }) => cn(
            "flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition-colors",
            isActive
              ? "bg-utube-surface text-utube-primary font-bold"
              : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
          )}
        >
          {({ isActive }) => (
            <>
              <gatewayEscape.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? 'text-utube-primary' : 'text-utube-text-secondary')} />
              <span className="truncate">{gatewayEscape.label}</span>
            </>
          )}
        </NavLink>
      </div>

      <div className="my-3 border-t border-utube-border" />

      {/* ── U-Tube main navigation ── */}
      <div className="space-y-1">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition-colors",
              isActive
                ? "bg-utube-surface text-utube-primary font-bold"
                : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? 'text-utube-primary' : 'text-utube-text-secondary')} />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="my-3 border-t border-utube-border" />

      {/* ── You / Library (U-Tube specific) ── */}
      <div className="space-y-1">
        <h4 className="px-3 text-xs font-bold text-utube-text-muted uppercase tracking-wider mb-1">
          You
        </h4>
        {libraryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-5 px-3 py-2.5 rounded-xl text-sm transition-colors",
              isActive
                ? "bg-utube-surface text-utube-primary font-bold"
                : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? 'text-utube-primary' : 'text-utube-text-secondary')} />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Subscriptions (U-Tube specific) ── */}
      {subscriptions.length > 0 && (
        <>
          <div className="my-3 border-t border-utube-border" />
          <div className="space-y-1">
            <h4 className="px-3 text-xs font-bold text-utube-text-muted uppercase tracking-wider mb-1">
              Subscriptions
            </h4>
            {subscriptions.map(sub => {
              const initial = sub.title ? sub.title.charAt(0).toUpperCase() : 'C';
              return (
                <NavLink
                  key={sub.id}
                  to={`/channel/${sub.id}`}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-3 py-2 rounded-xl text-sm transition-colors",
                    isActive
                      ? "bg-utube-surface text-utube-primary font-bold"
                      : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-utube-surface text-utube-primary flex items-center justify-center text-[10px] font-bold shrink-0 border border-utube-border">
                    {initial}
                  </div>
                  <span className="truncate text-xs">{sub.title}</span>
                </NavLink>
              );
            })}
          </div>
        </>
      )}

      <div className="my-3 border-t border-utube-border" />

      {/* ── Explore (U-Tube content categories) ── */}
      <div className="space-y-1">
        <h4 className="px-3 text-xs font-bold text-utube-text-muted uppercase tracking-wider mb-1">
          Explore
        </h4>
        {exploreItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-5 px-3 py-2 rounded-xl text-sm transition-colors",
              isActive
                ? "bg-utube-surface text-utube-primary font-bold"
                : "text-utube-text-secondary hover:bg-utube-surface hover:text-utube-text"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? 'text-utube-primary' : 'text-utube-text-secondary')} />
                <span className="truncate text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
