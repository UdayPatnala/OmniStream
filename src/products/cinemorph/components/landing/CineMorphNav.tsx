import React from 'react';
import { Link } from 'react-router-dom';
import { OMSLogo } from '@omnistream/shared/ui/OMSLogo';

interface CineMorphNavProps {
  environmentalTime?: 'morning' | 'night';
  onToggleTime?: () => void;
  activeSpace?: 'lobby' | 'screening_room' | 'booking';
  onSwitchSpace?: (space: 'lobby' | 'screening_room' | 'booking') => void;
  onEnterTheater?: () => void;
  hasTicketOrMedia?: boolean;
}

/**
 * CineMorphNav — Minimal Transparent Architectural Navigation
 * 
 * - Left: Minimal transparent CineMorph logo mark only (no text, no pill, no container).
 * - Right: Minimal transparent OMS logo only (no button container, pill, background, border, or label).
 * - Theme toggle completely removed.
 * - Both marks are subtle, elegant, and seamlessly integrated into the architectural environment.
 */
export const CineMorphNav: React.FC<CineMorphNavProps> = ({ environmentalTime = 'night' }) => {
  return (
    <header className="fixed top-5 inset-x-0 z-40 pointer-events-none flex justify-center px-6 sm:px-10">
      <div className="w-full max-w-7xl flex items-center justify-between">
        {/* Left: Minimal transparent CineMorph logo mark */}
        <Link
          to="/cinemorph"
          aria-label="CineMorph"
          className="pointer-events-auto opacity-80 hover:opacity-100 transition-opacity duration-300 outline-none flex items-center"
        >
          <img
            src="/cinemorph.png"
            alt="CineMorph"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          />
        </Link>

        {/* Right: Minimal transparent OMS logo only */}
        <Link
          to="/"
          aria-label="OmniStream Gateway"
          title="Return to OmniStream"
          className="pointer-events-auto opacity-80 hover:opacity-100 transition-opacity duration-300 outline-none flex items-center"
        >
          <OMSLogo
            size="sm"
            variant={environmentalTime === 'night' ? 'dark' : 'light'}
            animated={true}
          />
        </Link>
      </div>
    </header>
  );
};
