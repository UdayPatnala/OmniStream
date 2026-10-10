import React from 'react';
import {
  SubtitleCueContract as SubtitleCue,
  SubtitleStyleConfig,
  DEFAULT_SUBTITLE_STYLE_CONFIG as DEFAULT_SUBTITLE_STYLE,
  getSubtitleFontSizeClass,
  getSubtitleFontFamily,
} from '../contracts/subtitleContracts';

export interface CaptionOverlayProps {
  /** Active subtitle / caption cue text. If null/empty and cues is null/empty, nothing renders. */
  text?: string | null | undefined;
  /** Active SubtitleCue entities with speaker, SDH, and RTL metadata */
  cues?: SubtitleCue[] | null | undefined;
  /** Whether captions/subtitles are currently enabled. */
  visible?: boolean;
  /** Optional custom typography & styling configuration */
  styleConfig?: SubtitleStyleConfig;
  /** Positioning mode or custom class names */
  className?: string;
}

/**
 * CaptionOverlay — OmniStream Unified Real-Time Caption Presentation Component
 *
 * Implements the CineMorph visual caption standard:
 * - 100% transparent overall background (no heavy black box or bulky pill by default)
 * - Crisp white system font text with subtle, high-legibility soft drop shadow
 * - Restrained responsive sizing (small-to-medium relative to viewport)
 * - Centered layout with natural line wrapping and multi-line support
 * - RTL script auto-direction (Arabic, Hebrew)
 * - Speaker tagging and SDH sound effects preservation
 * - Stable lower safe area positioning preventing overlap with player controls
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  text,
  cues,
  visible = true,
  styleConfig = DEFAULT_SUBTITLE_STYLE,
  className = '',
}) => {
  if (!visible) {
    return null;
  }

  // Determine what to display: structured cues preferred over raw text string
  const hasCues = cues && cues.length > 0;
  const hasText = Boolean(text && text.trim());

  if (!hasCues && !hasText) {
    return null;
  }

  const fontSizeClass = getSubtitleFontSizeClass(styleConfig.fontSize);
  const fontFamilyCss = getSubtitleFontFamily(styleConfig.fontFamily);
  const bgOpacity = styleConfig.backgroundOpacity;
  const backgroundColor = bgOpacity > 0 ? `rgba(0, 0, 0, ${bgOpacity})` : 'transparent';

  // Check RTL for the first active cue or text
  const isRtl = hasCues ? cues![0].isRtl : false;

  return (
    <div
      role="region"
      aria-label="Subtitles"
      aria-live="polite"
      aria-atomic="true"
      className={`absolute bottom-12 sm:bottom-14 md:bottom-16 inset-x-0 z-30 flex justify-center pointer-events-none px-4 sm:px-6 transition-opacity duration-150 select-none ${className}`}
      style={{
        bottom: `${styleConfig.bottomOffsetRem}rem`,
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`${fontSizeClass} font-medium text-center max-w-2xl sm:max-w-3xl leading-relaxed tracking-normal whitespace-pre-line px-3 py-1 rounded transition-all`}
        style={{
          color: styleConfig.textColor,
          backgroundColor,
          fontFamily: fontFamilyCss,
          textShadow: styleConfig.textShadow,
        }}
      >
        {hasCues ? (
          cues!.map((cue, idx) => (
            <div key={cue.id || idx} className="my-0.5">
              {cue.speaker && (
                <span className="font-semibold text-amber-300 mr-1.5 opacity-90">
                  {cue.speaker}:
                </span>
              )}
              <span className={cue.isSdh ? 'italic text-stone-200' : ''}>
                {cue.text}
              </span>
            </div>
          ))
        ) : (
          <p>{text}</p>
        )}
      </div>
    </div>
  );
};
