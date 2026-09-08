import React from 'react';

export interface CaptionOverlayProps {
  /** Active subtitle / caption cue text. If null/empty, nothing renders. */
  text: string | null | undefined;
  /** Whether captions/subtitles are currently enabled. */
  visible?: boolean;
  /** Positioning mode or custom class names */
  className?: string;
}

/**
 * CaptionOverlay — OmniStream Unified Real-Time Caption Presentation Component
 *
 * Implements the CineMorph visual caption standard:
 * - 100% transparent overall background (no heavy black box or bulky pill)
 * - Crisp white system font text with subtle, high-legibility soft drop shadow
 * - Restrained responsive sizing (small-to-medium relative to viewport)
 * - Centered layout with natural line wrapping and multi-line support
 * - Stable lower safe area positioning preventing overlap with player controls
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  text,
  visible = true,
  className = '',
}) => {
  if (!visible || !text || !text.trim()) {
    return null;
  }

  return (
    <div
      className={`absolute bottom-12 sm:bottom-14 md:bottom-16 inset-x-0 z-30 flex justify-center pointer-events-none px-4 sm:px-6 transition-opacity duration-150 select-none ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        className="text-white text-xs sm:text-sm md:text-base font-sans font-medium text-center max-w-2xl sm:max-w-3xl leading-relaxed tracking-normal whitespace-pre-line"
        style={{
          background: 'transparent',
          opacity: 0.8,
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.75)',
        }}
      >
        {text}
      </p>
    </div>
  );
};
