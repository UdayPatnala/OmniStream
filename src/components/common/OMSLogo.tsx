import React from 'react';

export interface OMSLogoProps {
  variant?: 'light' | 'dark' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export const OMSLogo: React.FC<OMSLogoProps> = ({
  variant = 'auto',
  size = 'md',
  showLabel = false,
  animated = true,
  className = '',
}) => {
  // Size dimensions
  const sizeMap = {
    xs: { dim: 'w-6 h-6', imgDim: 'w-4 h-4', ring: 'p-0.5', text: 'text-[10px]' },
    sm: { dim: 'w-8 h-8', imgDim: 'w-6 h-6', ring: 'p-0.5', text: 'text-xs' },
    md: { dim: 'w-10 h-10', imgDim: 'w-8 h-8', ring: 'p-1', text: 'text-sm' },
    lg: { dim: 'w-14 h-14', imgDim: 'w-11 h-11', ring: 'p-1.5', text: 'text-base' },
    xl: { dim: 'w-20 h-20', imgDim: 'w-16 h-16', ring: 'p-2', text: 'text-xl' },
  };

  const { dim, imgDim, ring, text } = sizeMap[size] || sizeMap.md;

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* ── Outer Living Ring & Core Aperture ── */}
      <div className={`relative ${dim} flex items-center justify-center`}>
        {/* Animated Orbital Energy Shimmer */}
        {animated && (
          <div
            className={`absolute inset-0 rounded-full ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-500/40 via-purple-500/30 to-amber-500/40 blur-[4px] animate-oms-spin-slow'
                : 'bg-gradient-to-tr from-amber-500/30 via-red-500/25 to-amber-600/30 blur-[3px] animate-oms-spin-slow'
            }`}
          />
        )}

        {/* Outer Ring Chassis */}
        <div
          className={`relative ${dim} rounded-full ${ring} flex items-center justify-center transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-b from-[#1c1822] via-[#0f0c14] to-[#08060a] border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : 'bg-gradient-to-b from-white via-[#fcfbf9] to-[#f4eee4] border border-amber-300/80 shadow-[0_2px_12px_rgba(217,119,6,0.2)]'
          } ${animated ? (isDark ? 'animate-oms-core-dark' : 'animate-oms-core-light') : ''}`}
        >
          {/* Inner Logo Image Core */}
          <div className={`relative ${imgDim} rounded-full overflow-hidden flex items-center justify-center`}>
            <img
              src="/omn_logo.jpg"
              alt="OMS Intelligence Core"
              className="w-full h-full object-cover rounded-full"
            />
            {/* Glass Refractive Sheen Overlay */}
            <div
              className={`absolute inset-0 rounded-full pointer-events-none ${
                isDark
                  ? 'bg-gradient-to-tr from-cyan-400/10 via-transparent to-purple-400/20'
                  : 'bg-gradient-to-tr from-white/40 via-transparent to-amber-400/20'
              }`}
            />
          </div>

          {/* Living Micro-Beacon Pulse Dot */}
          <div
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-black/30 shadow-sm ${
              isDark
                ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse'
                : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse'
            }`}
          />
        </div>
      </div>

      {/* Optional Label */}
      {showLabel && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-wider uppercase font-cinematic-title ${text} ${
              isDark ? 'text-cyan-300' : 'text-slate-900'
            }`}
          >
            OMS
          </span>
          <span
            className={`text-[8px] font-mono tracking-widest uppercase -mt-0.5 ${
              isDark ? 'text-amber-300/60' : 'text-slate-500'
            }`}
          >
            Core Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
